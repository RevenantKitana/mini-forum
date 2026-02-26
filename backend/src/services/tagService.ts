import prisma from '../config/database.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { CreateTagInput, UpdateTagInput } from '../validations/tagValidation.js';
import { generateSlug } from '../utils/slug.js';

/**
 * Tag select fields for responses
 */
const tagSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  usage_count: true,
  use_permission: true,
  is_active: true,
  created_at: true,
  updated_at: true,
};

/**
 * Get all tags (only active ones)
 */
export async function getAllTags(limit?: number) {
  return prisma.tags.findMany({
    where: { is_active: true },
    select: tagSelect,
    orderBy: { usage_count: 'desc' },
    ...(limit && { take: limit }),
  });
}

/**
 * Get popular tags (only active ones)
 */
export async function getPopularTags(limit = 10) {
  return prisma.tags.findMany({
    where: { is_active: true },
    select: tagSelect,
    orderBy: { usage_count: 'desc' },
    take: limit,
  });
}

/**
 * Get tag by ID
 */
export async function getTagById(id: number) {
  const tag = await prisma.tags.findUnique({
    where: { id },
    select: tagSelect,
  });

  if (!tag) {
    throw new NotFoundError('Tag not found');
  }

  return tag;
}

/**
 * Get tag by slug
 */
export async function getTagBySlug(slug: string) {
  const tag = await prisma.tags.findUnique({
    where: { slug },
    select: tagSelect,
  });

  if (!tag) {
    throw new NotFoundError('Tag not found');
  }

  return tag;
}

/**
 * Create new tag
 */
export async function createTag(data: CreateTagInput) {
  // Generate slug if not provided
  const slug = data.slug || generateSlug(data.name);

  // Check if slug already exists
  const existingTag = await prisma.tags.findUnique({
    where: { slug },
  });

  if (existingTag) {
    throw new ConflictError('Tag with this slug already exists');
  }

  return prisma.tags.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
    },
    select: tagSelect,
  });
}

/**
 * Update tag
 */
export async function updateTag(id: number, data: UpdateTagInput) {
  // Check if tag exists
  const tag = await prisma.tags.findUnique({
    where: { id },
  });

  if (!tag) {
    throw new NotFoundError('Tag not found');
  }

  return prisma.tags.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    },
    select: tagSelect,
  });
}

/**
 * Delete tag
 */
export async function deleteTag(id: number) {
  // Check if tag exists
  const tag = await prisma.tags.findUnique({
    where: { id },
    include: { _count: { select: { post_tags: true } } },
  });

  if (!tag) {
    throw new NotFoundError('Tag not found');
  }

  // Delete tag (will cascade delete PostTag relations)
  await prisma.tags.delete({
    where: { id },
  });
}

/**
 * Search tags by name
 */
export async function searchTags(query: string, limit = 10) {
  return prisma.tags.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: tagSelect,
    orderBy: { usage_count: 'desc' },
    take: limit,
  });
}

/**
 * Get or create tags by names
 */
export async function getOrCreateTags(names: string[]): Promise<{ id: number }[]> {
  const tags: { id: number }[] = [];

  for (const name of names) {
    const slug = generateSlug(name);
    
    // Try to find existing tag
    let tag = await prisma.tags.findUnique({
      where: { slug },
      select: { id: true },
    });

    // Create if not exists
    if (!tag) {
      tag = await prisma.tags.create({
        data: { name, slug },
        select: { id: true },
      });
    }

    tags.push(tag);
  }

  return tags;
}








