import { GenerationContext, CommentContext, VoteContext, PersonalityInfo, PostReadContext } from '../types/index.js';
import { ContextGathererService } from './ContextGathererService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class PromptBuilderService {
  private postTemplate: string;
  private commentTemplate: string;
  private voteTemplate: string;
  private contextGatherer: ContextGathererService;

  constructor(contextGatherer: ContextGathererService) {
    this.contextGatherer = contextGatherer;
    const promptsDir = path.resolve(__dirname, '../../prompts');
    this.postTemplate = fs.readFileSync(path.join(promptsDir, 'post.template.txt'), 'utf-8');
    this.commentTemplate = fs.readFileSync(path.join(promptsDir, 'comment.template.txt'), 'utf-8');
    this.voteTemplate = fs.readFileSync(path.join(promptsDir, 'vote.template.txt'), 'utf-8');
  }

  /**
   * Build a consistency preamble from personality data.
   * Phase 3.2: Stronger consistency instructions when we have rich personality data.
   */
  private buildPostReadSection(ctx: PostReadContext | null): string {
    if (!ctx) return '';

    const lines: string[] = [];
    lines.push('--- NỘI DUNG BÀI VIẾT ---');
    lines.push(`Tiêu đề: "${ctx.title}"`);
    if (ctx.tags.length > 0) {
      lines.push(`Tags: ${ctx.tags.join(', ')}`);
    }
    if (ctx.body) {
      lines.push(`Nội dung (trích):\n${ctx.body}`);
    }
    if (ctx.recentComments.length > 0) {
      lines.push('\nCác bình luận gần đây:');
      ctx.recentComments.forEach((c, i) => {
        lines.push(`  ${i + 1}. [${c.authorName}]: ${c.content}`);
      });
    }
    lines.push('---');
    return lines.join('\n');
  }

  private buildConsistencyPreamble(personality: PersonalityInfo | null, recentSnippets?: string): string {
    if (!personality) return '';

    const parts: string[] = [];

    if (personality.writingStyle) {
      parts.push(`Phong cách viết đặc trưng: ${personality.writingStyle}`);
    }

    if (personality.votePatterns) {
      const vp = personality.votePatterns;
      if (vp.likeTopics?.length > 0) {
        parts.push(`Chủ đề hay upvote: ${vp.likeTopics.join(', ')}`);
      }
      if (vp.dislikeTopics?.length > 0) {
        parts.push(`Chủ đề hay downvote: ${vp.dislikeTopics.join(', ')}`);
      }
    }

    if (parts.length === 0) return '';

    return '\n🔑 NHẤT QUÁN TÍNH CÁCH:\n' + parts.join('\n') +
      '\nHãy viết sao cho nhất quán với tính cách, phong cách, và các bài trước của bạn.\n';
  }

  async buildPostPrompt(context: GenerationContext): Promise<string> {
    const { user, category, availableTags, recentPosts } = context;

    // Get personality from DB
    const personality = await this.contextGatherer.getPersonality(user.id);
    const traits = personality?.traits?.join(', ') || 'bình thường';
    const tone = personality?.tone || 'casual';
    const topics = personality?.topics?.join(', ') || '';
    const writingStyle = personality?.writingStyle || '';

    // Format recent posts
    const recentSnippets = recentPosts && recentPosts.length > 0
      ? recentPosts.map((p, i) => `${i + 1}. "${p.title}" — ${p.excerpt}`).join('\n')
      : 'Chưa có bài viết nào.';

    // Tag pool (random subset of 15 to keep prompt short)
    const shuffled = [...availableTags].sort(() => Math.random() - 0.5);
    const tagPool = shuffled.slice(0, 15).map((t) => t.name).join(', ');

    let prompt = this.postTemplate;
    prompt = prompt.replace(/{DISPLAY_NAME}/g, user.display_name);
    prompt = prompt.replace(/{BIO}/g, user.bio || '');
    prompt = prompt.replace(/{TRAITS}/g, traits);
    prompt = prompt.replace(/{TONE}/g, tone);
    prompt = prompt.replace(/{TOPICS}/g, topics);
    prompt = prompt.replace(/{WRITING_STYLE}/g, writingStyle);
    prompt = prompt.replace(/{CATEGORY_NAME}/g, category.name);
    prompt = prompt.replace(/{CATEGORY_DESCRIPTION}/g, category.description || '');
    prompt = prompt.replace(/{RECENT_POSTS_SNIPPETS}/g, recentSnippets);
    prompt = prompt.replace(/{TAG_POOL}/g, tagPool);

    // Phase 3.2: Inject consistency preamble
    const preamble = this.buildConsistencyPreamble(personality, recentSnippets);
    if (preamble) {
      prompt += '\n' + preamble;
    }

    return prompt;
  }

  private maxCommentLength(tone: string): number {
    const t = tone.toLowerCase();
    // Blunt/sarcastic/direct personalities write shorter, snappier comments
    if (/blunt|sarcastic|direct|cynical|brief/.test(t)) return 50;
    // Analytical/thoughtful personalities can write slightly more
    if (/analytical|thoughtful|curious|detailed/.test(t)) return 100;
    return 80; // default casual
  }

  async buildCommentPrompt(context: CommentContext): Promise<string> {
    const { user, targetPost, parentComment, postReadContext } = context;

    const personality = await this.contextGatherer.getPersonality(user.id);
    const traits = personality?.traits?.join(', ') || 'bình thường';
    const tone = personality?.tone || 'casual';
    const maxLen = this.maxCommentLength(tone);

    let parentSection = '';
    if (parentComment) {
      parentSection = `Bạn đang trả lời comment của ${parentComment.authorName}:\n"${parentComment.content}"`;
    }

    // Use postReadContext body if available, otherwise fall back to excerpt
    const postBody = postReadContext?.body || targetPost.excerpt || '(không có nội dung)';

    let prompt = this.commentTemplate;
    prompt = prompt.replace(/{DISPLAY_NAME}/g, user.display_name);
    prompt = prompt.replace(/{BIO}/g, user.bio || '');
    prompt = prompt.replace(/{TRAITS}/g, traits);
    prompt = prompt.replace(/{TONE}/g, tone);
    prompt = prompt.replace(/{POST_TITLE}/g, targetPost.title);
    prompt = prompt.replace(/{POST_EXCERPT}/g, postBody);
    prompt = prompt.replace(/{POST_AUTHOR}/g, targetPost.authorName);
    prompt = prompt.replace(/{PARENT_COMMENT_SECTION}/g, parentSection);
    prompt = prompt.replace(/{MAX_COMMENT_LENGTH}/g, String(maxLen));

    // Inject full post read section (body + thread context)
    const postReadSection = this.buildPostReadSection(postReadContext);
    if (postReadSection) {
      prompt = prompt.replace(/{POST_READ_SECTION}/g, postReadSection);
    } else {
      prompt = prompt.replace(/{POST_READ_SECTION}/g, '');
    }

    // Phase 3.2: Inject consistency preamble
    const preamble = this.buildConsistencyPreamble(personality);
    if (preamble) {
      prompt += '\n' + preamble;
    }

    return prompt;
  }

  buildVotePrompt(context: VoteContext): string {
    const { user, personality, targetType, targetTitle, targetContent, targetAuthor, targetCategory, postReadContext } = context;

    const traits = personality?.traits?.join(', ') || 'bình thường';
    const tone = personality?.tone || 'casual';
    const topics = personality?.topics?.join(', ') || '';

    let prompt = this.voteTemplate;
    prompt = prompt.replace(/{DISPLAY_NAME}/g, user.display_name);
    prompt = prompt.replace(/{BIO}/g, user.bio || '');
    prompt = prompt.replace(/{TRAITS}/g, traits);
    prompt = prompt.replace(/{TONE}/g, tone);
    prompt = prompt.replace(/{TOPICS}/g, topics);
    prompt = prompt.replace(/{TARGET_TYPE}/g, targetType === 'post' ? 'Bài viết' : 'Bình luận');
    prompt = prompt.replace(/{TARGET_TITLE}/g, targetTitle);
    prompt = prompt.replace(/{TARGET_CONTENT}/g, targetContent);
    prompt = prompt.replace(/{TARGET_AUTHOR}/g, targetAuthor);
    prompt = prompt.replace(/{TARGET_CATEGORY}/g, targetCategory);

    // Inject post read section for richer context
    const postReadSection = this.buildPostReadSection(postReadContext ?? null);
    if (postReadSection) {
      prompt = prompt.replace(/{POST_READ_SECTION}/g, postReadSection);
    } else {
      prompt = prompt.replace(/{POST_READ_SECTION}/g, '');
    }

    // Phase 3.2: Inject consistency preamble (vote patterns)
    const preamble = this.buildConsistencyPreamble(personality);
    if (preamble) {
      prompt += '\n' + preamble;
    }

    return prompt;
  }
}
