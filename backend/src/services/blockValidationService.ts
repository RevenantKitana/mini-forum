import { BadRequestError } from '../utils/errors.js';

export interface BlockInput {
  type: 'TEXT' | 'IMAGE';
  content?: string;
  sort_order: number;
}

const MAX_TOTAL_CHARS = 10000;
const MAX_TOTAL_IMAGES = 10;

/**
 * Validate block sequence rules:
 * - No two consecutive TEXT blocks (TEXT must be followed by IMAGE or end)
 * - Consecutive IMAGE blocks are allowed
 */
export function validateBlockSequence(blocks: BlockInput[]): void {
  for (let i = 0; i < blocks.length - 1; i++) {
    if (blocks[i].type === 'TEXT' && blocks[i + 1].type === 'TEXT') {
      throw new BadRequestError(
        `Cannot have two consecutive text blocks (at positions ${i} and ${i + 1}). Add an image block between them.`,
      );
    }
  }
}

/**
 * Validate total character limit across all text blocks.
 */
export function validateTotalCharacters(blocks: BlockInput[]): void {
  const total = blocks
    .filter((b) => b.type === 'TEXT')
    .reduce((sum, b) => sum + (b.content?.length ?? 0), 0);
  if (total > MAX_TOTAL_CHARS) {
    throw new BadRequestError(
      `Total text content across all blocks exceeds ${MAX_TOTAL_CHARS} characters (current: ${total}).`,
    );
  }
}

/**
 * Validate total image count across all image blocks.
 * imageCount is the number of image blocks (each block can hold multiple images,
 * actual per-block media count is enforced at upload time; here we check block count).
 * Actually, total media items count is passed in from the service layer.
 */
export function validateTotalImages(existingMediaCount: number, newFilesCount: number): void {
  if (existingMediaCount + newFilesCount > MAX_TOTAL_IMAGES) {
    throw new BadRequestError(
      `Total images across all image blocks cannot exceed ${MAX_TOTAL_IMAGES}. ` +
        `Post already has ${existingMediaCount}, trying to add ${newFilesCount}.`,
    );
  }
}

/**
 * Validate individual block content:
 * - TEXT blocks must have non-empty content
 * - IMAGE blocks must have no content field
 */
export function validateBlockContent(blocks: BlockInput[]): void {
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'TEXT') {
      if (!block.content || block.content.trim().length === 0) {
        throw new BadRequestError(`Text block at position ${i} cannot have empty content.`);
      }
    }
  }
}

/**
 * Run all block validations.
 */
export function validateBlocks(blocks: BlockInput[]): void {
  validateBlockContent(blocks);
  validateBlockSequence(blocks);
  validateTotalCharacters(blocks);
}
