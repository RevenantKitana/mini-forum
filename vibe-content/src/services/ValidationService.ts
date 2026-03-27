import { createRequire } from 'module';
import { QualityScore } from '../types/index.js';
import logger from '../utils/logger.js';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

export interface ValidationResult {
  valid: boolean;
  data?: { title: string; content: string; tags: string[] };
  errors: string[];
  quality?: QualityScore;
}

export interface CommentValidationResult {
  valid: boolean;
  data?: { content: string };
  errors: string[];
  quality?: QualityScore;
}

export interface VoteValidationResult {
  valid: boolean;
  data?: { shouldVote: boolean; voteType: 'up' | 'down' | null; reason: string };
  errors: string[];
}

// Vietnamese detection: check for Vietnamese-specific diacritical marks
const VIETNAMESE_PATTERN = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

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

  /**
   * Phase 3.3: Quality scoring for post content
   * Checks language, duplicates, artifacts, and overall quality.
   */
  async scorePostQuality(
    title: string,
    content: string,
    tags: string[],
    userId: number,
  ): Promise<QualityScore> {
    const details: string[] = [];

    // 1. Length check
    const lengthOk = title.length >= 10 && title.length <= 200 && content.length >= 20 && content.length <= 5000;
    if (!lengthOk) details.push(`Length issue: title=${title.length}, content=${content.length}`);

    // 2. Vietnamese language check
    const languageOk = VIETNAMESE_PATTERN.test(content);
    if (!languageOk) details.push('Content may not be in Vietnamese');

    // 3. Tags validity
    let tagsValid = true;
    if (tags.length > 0) {
      const existing = await prisma.tags.findMany({
        where: { name: { in: tags } },
        select: { name: true },
      });
      tagsValid = existing.length === tags.length;
      if (!tagsValid) details.push(`Invalid tags detected: expected ${tags.length}, found ${existing.length}`);
    }

    // 4. JSON artifacts check
    const artifacts = ['```json', '```', '{"title"', '"content":', '\\n', '{"', '"}'];
    const noJsonArtifacts = !artifacts.some((a) => content.includes(a));
    if (!noJsonArtifacts) details.push('Content contains JSON/code artifacts');

    // 5. Duplicate check (similar title in last 20 posts by this user)
    let notDuplicate = true;
    try {
      const recentPosts = await prisma.posts.findMany({
        where: { author_id: userId },
        orderBy: { created_at: 'desc' },
        take: 20,
        select: { title: true, content: true },
      });

      for (const post of recentPosts) {
        const titleSimilarity = this.stringSimilarity(title.toLowerCase(), post.title.toLowerCase());
        if (titleSimilarity > 0.7) {
          notDuplicate = false;
          details.push(`Similar title found: "${post.title}" (similarity: ${Math.round(titleSimilarity * 100)}%)`);
          break;
        }
        const contentSimilarity = this.stringSimilarity(
          content.substring(0, 200).toLowerCase(),
          (post.content || '').substring(0, 200).toLowerCase(),
        );
        if (contentSimilarity > 0.6) {
          notDuplicate = false;
          details.push(`Similar content found (similarity: ${Math.round(contentSimilarity * 100)}%)`);
          break;
        }
      }
    } catch {
      // If DB fails, assume not duplicate
    }

    const overallPass = lengthOk && languageOk && tagsValid && noJsonArtifacts && notDuplicate;

    const score: QualityScore = { lengthOk, languageOk, tagsValid, noJsonArtifacts, notDuplicate, overallPass, details };

    if (!overallPass) {
      logger.warn('[quality_scorer] Post failed quality check', { userId, details });
    }

    return score;
  }

  /**
   * Phase 3.3: Quality scoring for comment content
   */
  scoreCommentQuality(content: string): QualityScore {
    const details: string[] = [];

    const lengthOk = content.length >= 5 && content.length <= 5000;
    if (!lengthOk) details.push(`Length issue: content=${content.length}`);

    const languageOk = VIETNAMESE_PATTERN.test(content);
    if (!languageOk) details.push('Content may not be in Vietnamese');

    const artifacts = ['```json', '```', '{"content"', '"content":'];
    const noJsonArtifacts = !artifacts.some((a) => content.includes(a));
    if (!noJsonArtifacts) details.push('Content contains JSON/code artifacts');

    const overallPass = lengthOk && languageOk && noJsonArtifacts;

    return { lengthOk, languageOk, tagsValid: true, noJsonArtifacts, notDuplicate: true, overallPass, details };
  }

  /**
   * Simple Jaccard-based string similarity (word-level) 
   */
  private stringSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/).filter(Boolean));
    const wordsB = new Set(b.split(/\s+/).filter(Boolean));
    if (wordsA.size === 0 && wordsB.size === 0) return 1;
    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let intersection = 0;
    for (const w of wordsA) {
      if (wordsB.has(w)) intersection++;
    }
    return intersection / (wordsA.size + wordsB.size - intersection);
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
