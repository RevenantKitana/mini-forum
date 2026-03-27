import { GenerationContext } from '../types/index.js';
import { ContextGathererService } from './ContextGathererService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class PromptBuilderService {
  private postTemplate: string;
  private contextGatherer: ContextGathererService;

  constructor(contextGatherer: ContextGathererService) {
    this.contextGatherer = contextGatherer;
    const templatePath = path.resolve(__dirname, '../../prompts/post.template.txt');
    this.postTemplate = fs.readFileSync(templatePath, 'utf-8');
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

    return prompt;
  }
}
