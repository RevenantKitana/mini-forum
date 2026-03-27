import { GenerationContext, CommentContext, VoteContext, PersonalityInfo } from '../types/index.js';
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

  async buildCommentPrompt(context: CommentContext): Promise<string> {
    const { user, targetPost, parentComment } = context;

    const personality = await this.contextGatherer.getPersonality(user.id);
    const traits = personality?.traits?.join(', ') || 'bình thường';
    const tone = personality?.tone || 'casual';

    let parentSection = '';
    if (parentComment) {
      parentSection = `Bạn đang trả lời comment của ${parentComment.authorName}:\n"${parentComment.content}"`;
    }

    let prompt = this.commentTemplate;
    prompt = prompt.replace(/{DISPLAY_NAME}/g, user.display_name);
    prompt = prompt.replace(/{BIO}/g, user.bio || '');
    prompt = prompt.replace(/{TRAITS}/g, traits);
    prompt = prompt.replace(/{TONE}/g, tone);
    prompt = prompt.replace(/{POST_TITLE}/g, targetPost.title);
    prompt = prompt.replace(/{POST_EXCERPT}/g, targetPost.excerpt || '(không có excerpt)');
    prompt = prompt.replace(/{POST_AUTHOR}/g, targetPost.authorName);
    prompt = prompt.replace(/{PARENT_COMMENT_SECTION}/g, parentSection);

    // Phase 3.2: Inject consistency preamble
    const preamble = this.buildConsistencyPreamble(personality);
    if (preamble) {
      prompt += '\n' + preamble;
    }

    return prompt;
  }

  buildVotePrompt(context: VoteContext): string {
    const { user, personality, targetType, targetTitle, targetContent, targetAuthor, targetCategory } = context;

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

    // Phase 3.2: Inject consistency preamble (vote patterns)
    const preamble = this.buildConsistencyPreamble(personality);
    if (preamble) {
      prompt += '\n' + preamble;
    }

    return prompt;
  }
}
