import { createRequire } from 'module';
import { PersonalityInfo } from '../types/index.js';
import { LLMProviderManager } from './llm/LLMProviderManager.js';
import logger, { logAction } from '../utils/logger.js';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERSONALITY_EXTRACT_PROMPT = `Phân tích các nội dung dưới đây của một người dùng trên forum tiếng Việt.
Dựa vào cách viết, lập luận, cảm xúc, và chủ đề, hãy tóm tắt tính cách của họ.

{USER_CONTENT}

Trả về JSON DUY NHẤT (không giải thích thêm):
{
  "traits": ["tính cách 1", "tính cách 2", "tính cách 3"],
  "tone": "casual|formal|emotional|humorous|philosophical",
  "topics": ["chủ đề quan tâm 1", "chủ đề 2", "chủ đề 3"],
  "writingStyle": "mô tả ngắn gọn phong cách viết"
}

Yêu cầu: traits 2-5 mục, topics 2-5 mục, tone 1 từ, writingStyle 1 câu ngắn.`;

export class PersonalityService {
  private llmManager: LLMProviderManager;
  private actionCounters = new Map<number, number>();

  constructor(llmManager: LLMProviderManager) {
    this.llmManager = llmManager;
  }

  /**
   * Track an action and update personality if threshold reached.
   * Called after each successful action by a bot user.
   */
  async trackAndUpdate(userId: number): Promise<void> {
    const count = (this.actionCounters.get(userId) || 0) + 1;
    this.actionCounters.set(userId, count);

    // Update personality every 5 actions
    if (count % 5 === 0) {
      try {
        await this.updatePersonalityVector(userId);
      } catch (err: any) {
        logAction({
          userId,
          stage: 'personality_update',
          status: 'failed',
          error: err.message,
        });
      }
    }
  }

  async updatePersonalityVector(userId: number): Promise<PersonalityInfo | null> {
    logAction({ userId, stage: 'personality_update', status: 'info', details: { event: 'starting' } });

    // 1. Gather recent posts and comments
    const recentPosts = await prisma.posts.findMany({
      where: { author_id: userId },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: { title: true, content: true, categories: { select: { name: true } } },
    });

    const recentComments = await prisma.comments.findMany({
      where: { author_id: userId },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: { content: true },
    });

    if (recentPosts.length === 0 && recentComments.length === 0) {
      logger.info(`[personality_update] No content for user #${userId}, skipping`);
      return null;
    }

    // 2. Build user content summary for LLM
    const postSnippets = recentPosts.map(
      (p: any, i: number) =>
        `Post ${i + 1} [${p.categories?.name || 'N/A'}]: "${p.title}"\n${(p.content || '').substring(0, 200)}`,
    ).join('\n\n');

    const commentSnippets = recentComments.map(
      (c: any, i: number) => `Comment ${i + 1}: "${(c.content || '').substring(0, 150)}"`,
    ).join('\n');

    const userContent = [
      postSnippets ? `=== BÀI VIẾT ===\n${postSnippets}` : '',
      commentSnippets ? `=== BÌNH LUẬN ===\n${commentSnippets}` : '',
    ].filter(Boolean).join('\n\n');

    // 3. Call LLM to extract personality
    const prompt = PERSONALITY_EXTRACT_PROMPT.replace('{USER_CONTENT}', userContent);

    try {
      const { output, provider } = await this.llmManager.generate(prompt);

      // Parse the personality from LLM output
      const personality = this.parsePersonality(output);
      if (!personality) {
        logAction({
          userId,
          stage: 'personality_update',
          status: 'failed',
          provider,
          error: 'Failed to parse personality from LLM output',
        });
        return null;
      }

      // 4. Merge with existing personality (keep vote patterns if they exist)
      const existing = await prisma.user_content_context.findUnique({
        where: { user_id: userId },
      });

      const existingPersonality = existing?.personality as PersonalityInfo | null;
      const merged: PersonalityInfo = {
        ...personality,
        votePatterns: existingPersonality?.votePatterns,
      };

      // 5. Upsert into DB
      await prisma.user_content_context.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          personality: merged,
          last_posts: recentPosts.map((p: any) => ({ title: p.title, excerpt: (p.content || '').substring(0, 100) })),
          last_comments: recentComments.map((c: any) => ({ content: (c.content || '').substring(0, 100) })),
          action_count: this.actionCounters.get(userId) || 0,
        },
        update: {
          personality: merged,
          last_posts: recentPosts.map((p: any) => ({ title: p.title, excerpt: (p.content || '').substring(0, 100) })),
          last_comments: recentComments.map((c: any) => ({ content: (c.content || '').substring(0, 100) })),
          action_count: this.actionCounters.get(userId) || 0,
        },
      });

      logAction({
        userId,
        stage: 'personality_update',
        status: 'success',
        provider,
        details: { traits: personality.traits, tone: personality.tone },
      });

      return personality;
    } catch (err: any) {
      logAction({
        userId,
        stage: 'personality_update',
        status: 'failed',
        error: err.message,
      });
      return null;
    }
  }

  private parsePersonality(output: any): PersonalityInfo | null {
    try {
      // LLM output may have the fields directly or in content
      const traits = output.traits;
      const tone = output.tone;
      const topics = output.topics;
      const writingStyle = output.writingStyle || output.writing_style || '';

      if (!Array.isArray(traits) || !tone || !Array.isArray(topics)) {
        // Try parsing from content string
        if (typeof output.content === 'string') {
          const cleaned = output.content
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed.traits) && parsed.tone && Array.isArray(parsed.topics)) {
            return {
              traits: parsed.traits.slice(0, 5),
              tone: parsed.tone,
              topics: parsed.topics.slice(0, 5),
              writingStyle: parsed.writingStyle || parsed.writing_style || '',
            };
          }
        }
        return null;
      }

      return {
        traits: traits.slice(0, 5),
        tone,
        topics: topics.slice(0, 5),
        writingStyle,
      };
    } catch {
      return null;
    }
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}
