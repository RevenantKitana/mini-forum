import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

export interface ValidationResult {
  valid: boolean;
  data?: { title: string; content: string; tags: string[] };
  errors: string[];
}

export interface CommentValidationResult {
  valid: boolean;
  data?: { content: string };
  errors: string[];
}

export interface VoteValidationResult {
  valid: boolean;
  data?: { shouldVote: boolean; voteType: 'up' | 'down' | null; reason: string };
  errors: string[];
}

export class ValidationService {
  async validatePostOutput(raw: LLMPostOutput): Promise<ValidationResult> {
    const errors: string[] = [];

    // 1. Check required fields
    if (!raw.title || typeof raw.title !== 'string') {
      errors.push('Missing or invalid title');
    }
    if (!raw.content || typeof raw.content !== 'string') {
      errors.push('Missing or invalid content');
    }
    if (!Array.isArray(raw.tags)) {
      errors.push('Missing or invalid tags array');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // 2. Length checks
    const title = raw.title.trim();
    const content = raw.content.trim();
    const tags = raw.tags.map((t: string) => t.trim()).filter(Boolean);

    if (title.length < 10 || title.length > 200) {
      errors.push(`Title length ${title.length} not in range [10, 200]`);
    }

    if (content.length < 20 || content.length > 5000) {
      errors.push(`Content length ${content.length} not in range [20, 5000]`);
    }

    if (tags.length === 0 || tags.length > 10) {
      errors.push(`Tags count ${tags.length} not in range [1, 10]`);
    }

    // 3. Check for JSON artifacts in content
    const jsonArtifacts = ['```json', '```', '{"title"', '"content":', '\\n'];
    for (const artifact of jsonArtifacts) {
      if (content.includes(artifact)) {
        errors.push(`Content contains JSON artifact: ${artifact}`);
      }
    }

    // 4. Validate tags exist in DB
    if (tags.length > 0 && errors.length === 0) {
      const existingTags = await prisma.tags.findMany({
        where: { name: { in: tags } },
        select: { name: true },
      });
      const existingNames = new Set(existingTags.map((t: any) => t.name));
      const invalidTags = tags.filter((t: string) => !existingNames.has(t));
      if (invalidTags.length > 0) {
        // Filter out invalid tags instead of rejecting entirely
        const validTags = tags.filter((t: string) => existingNames.has(t));
        if (validTags.length === 0) {
          errors.push(`No valid tags found. Invalid: ${invalidTags.join(', ')}`);
        } else {
          return {
            valid: true,
            data: { title, content, tags: validTags },
            errors: [],
          };
        }
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      data: { title, content, tags },
      errors: [],
    };
  }

  validateCommentOutput(raw: LLMCommentOutput): CommentValidationResult {
    const errors: string[] = [];

    if (!raw.content || typeof raw.content !== 'string') {
      errors.push('Missing or invalid content');
      return { valid: false, errors };
    }

    const content = raw.content.trim();

    if (content.length < 5 || content.length > 5000) {
      errors.push(`Content length ${content.length} not in range [5, 5000]`);
    }

    // Check for JSON artifacts
    const jsonArtifacts = ['```json', '```', '{"content"', '"content":'];
    for (const artifact of jsonArtifacts) {
      if (content.includes(artifact)) {
        errors.push(`Content contains JSON artifact: ${artifact}`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: { content }, errors: [] };
  }

  validateVoteOutput(raw: LLMVoteOutput): VoteValidationResult {
    const errors: string[] = [];

    if (typeof raw.shouldVote !== 'boolean') {
      errors.push('shouldVote must be a boolean');
      return { valid: false, errors };
    }

    if (raw.shouldVote) {
      if (raw.voteType !== 'up' && raw.voteType !== 'down') {
        errors.push(`voteType must be "up" or "down", got "${raw.voteType}"`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      data: {
        shouldVote: raw.shouldVote,
        voteType: raw.shouldVote ? (raw.voteType as 'up' | 'down') : null,
        reason: raw.reason || '',
      },
      errors: [],
    };
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

interface LLMPostOutput {
  title: string;
  content: string;
  tags: string[];
  explain?: string;
}

interface LLMCommentOutput {
  content: string;
  explain?: string;
}

interface LLMVoteOutput {
  shouldVote: boolean;
  voteType?: string | null;
  reason?: string;
}
