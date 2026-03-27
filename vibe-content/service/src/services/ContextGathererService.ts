import { createRequire } from 'module';
import config from '../config/index.js';
import { BotUser, Category, Tag, GenerationContext } from '../types/index.js';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

export class ContextGathererService {
  async getAllBotUsers(): Promise<BotUser[]> {
    const users = await prisma.users.findMany({
      where: { role: 'BOT', is_active: true },
      select: {
        id: true,
        username: true,
        email: true,
        display_name: true,
        bio: true,
        avatar_url: true,
      },
    });
    return users;
  }

  async getPersonality(userId: number): Promise<Record<string, any> | null> {
    const ctx = await prisma.user_content_context.findUnique({
      where: { user_id: userId },
      select: { personality: true },
    });
    return ctx?.personality ?? null;
  }

  async gatherPostContext(userId: number): Promise<GenerationContext> {
    // 1. Get user info
    const user = await prisma.users.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        display_name: true,
        bio: true,
        avatar_url: true,
      },
    });

    // 2. Pick a random category the user (BOT treated as MEMBER) can post in
    const categories = await prisma.categories.findMany({
      where: {
        is_active: true,
        post_permission: { in: ['ALL', 'MEMBER'] },
      },
      select: { id: true, name: true, slug: true, description: true },
    });

    if (categories.length === 0) {
      throw new Error('No available categories for posting');
    }

    const category: Category = categories[Math.floor(Math.random() * categories.length)];

    // 3. Get available tags
    const tags: Tag[] = await prisma.tags.findMany({
      where: { is_active: true },
      select: { id: true, name: true, slug: true },
    });

    // 4. Get recent posts by this user (to avoid repetition)
    const recentPosts = await prisma.posts.findMany({
      where: { author_id: userId },
      orderBy: { created_at: 'desc' },
      take: 3,
      select: { title: true, excerpt: true },
    });

    return {
      user: user as BotUser,
      category,
      availableTags: tags,
      recentPosts: recentPosts.map((p: any) => ({
        title: p.title,
        excerpt: p.excerpt || '',
      })),
    };
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}
