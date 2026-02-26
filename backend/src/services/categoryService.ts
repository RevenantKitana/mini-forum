import prisma from '../config/database.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { CreateCategoryInput, UpdateCategoryInput } from '../validations/categoryValidation.js';
import { generateSlug } from '../utils/slug.js';

/**
 * Category select fields for responses
 */
const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  color: true,
  sort_order: true,
  post_count: true,
  is_active: true,
  view_permission: true,
  post_permission: true,
  comment_permission: true,
  created_at: true,
  updated_at: true,
};

/**
 * Get all categories with accurate post counts
 */
export async function getAllCategories(includeInactive = false) {
  const where = includeInactive ? {} : { is_active: true };
  
  const categories = await prisma.categories.findMany({
    where,
    select: {
      ...categorySelect,
      _count: {
        select: {
          posts: {
            where: { status: 'PUBLISHED' }
          }
        }
      }
    },
    orderBy: { sort_order: 'asc' },
  });

  // Return with accurate post_count from actual published posts
  return categories.map(category => ({
    ...category,
    post_count: category._count.posts,
    _count: undefined, // Remove internal _count
  }));
}

/**
 * Get all categories with popular tags for each category
 */
export async function getAllCategoriesWithTags(includeInactive = false, tagLimit = 5) {
  const where = includeInactive ? {} : { is_active: true };
  
  const categories = await prisma.categories.findMany({
    where,
    select: {
      ...categorySelect,
      _count: {
        select: {
          posts: {
            where: { status: 'PUBLISHED' }
          }
        }
      }
    },
    orderBy: { sort_order: 'asc' },
  });

  // Get popular tags for each category + aggregate stats
  const categoriesWithTags = await Promise.all(
    categories.map(async (category) => {
      // Find most used tags in posts of this category
      const popularTags = await prisma.post_tags.groupBy({
        by: ['tag_id'],
        where: {
          posts: {
            category_id: category.id,
            status: 'PUBLISHED'
          }
        },
        _count: {
          tag_id: true
        },
        orderBy: {
          _count: {
            tag_id: 'desc'
          }
        },
        take: tagLimit
      });

      // Get tag details
      const tag_ids = popularTags.map(pt => pt.tag_id);
      const tags = tag_ids.length > 0 ? await prisma.tags.findMany({
        where: { id: { in: tag_ids } },
        select: {
          id: true,
          name: true,
          slug: true,
          usage_count: true
        }
      }) : [];

      // Sort tags by the order of popularTags
      const sortedTags = tag_ids.map(id => tags.find(t => t.id === id)).filter(Boolean);

      // Get aggregate stats: total views and comments for this category
      const aggregateStats = await prisma.posts.aggregate({
        where: {
          category_id: category.id,
          status: 'PUBLISHED'
        },
        _sum: {
          view_count: true,
          comment_count: true
        }
      });

      return {
        ...category,
        post_count: category._count.posts,
        view_count: aggregateStats._sum.view_count || 0,
        comment_count: aggregateStats._sum.comment_count || 0,
        _count: undefined,
        popularTags: sortedTags
      };
    })
  );

  return categoriesWithTags;
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: number) {
  const category = await prisma.categories.findUnique({
    where: { id },
    select: categorySelect,
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  return category;
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string) {
  const category = await prisma.categories.findUnique({
    where: { slug },
    select: categorySelect,
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  return category;
}

/**
 * Create new category
 */
export async function createCategory(data: CreateCategoryInput) {
  // Generate slug if not provided
  const slug = data.slug || generateSlug(data.name);

  // Check if slug already exists
  const existingCategory = await prisma.categories.findUnique({
    where: { slug },
  });

  if (existingCategory) {
    throw new ConflictError('Category with this slug already exists');
  }

  return prisma.categories.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      color: data.color,
      sort_order: data.sort_order ?? 0,
    },
    select: categorySelect,
  });
}

/**
 * Update category
 */
export async function updateCategory(id: number, data: UpdateCategoryInput) {
  // Check if category exists
  const category = await prisma.categories.findUnique({
    where: { id },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  return prisma.categories.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.sort_order !== undefined && { sort_order: data.sort_order }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
      ...(data.view_permission !== undefined && { view_permission: data.view_permission }),
      ...(data.post_permission !== undefined && { post_permission: data.post_permission }),
      ...(data.comment_permission !== undefined && { comment_permission: data.comment_permission }),
    },
    select: categorySelect,
  });
}

/**
 * Delete category
 */
export async function deleteCategory(id: number) {
  // Check if category exists
  const category = await prisma.categories.findUnique({
    where: { id },
    include: { _count: { select: { posts: true } } },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Check if category has posts
  if (category._count.posts > 0) {
    throw new ConflictError('Cannot delete category with existing posts');
  }

  await prisma.categories.delete({
    where: { id },
  });
}

/**
 * Get category with post stats
 */
export async function getCategoryWithStats(slug: string) {
  const category = await prisma.categories.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  return {
    ...category,
    post_count: category._count.posts,
  };
}

/**
 * Get popular tags for a specific category
 */
export async function getPopularTagsForCategory(category_id: number, limit = 5) {
  // Check if category exists
  const category = await prisma.categories.findUnique({
    where: { id: category_id },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Find most used tags in posts of this category
  const popularTags = await prisma.post_tags.groupBy({
    by: ['tag_id'],
    where: {
      posts: {
        category_id: category_id,
        status: 'PUBLISHED'
      }
    },
    _count: {
      tag_id: true
    },
    orderBy: {
      _count: {
        tag_id: 'desc'
      }
    },
    take: limit
  });

  // Get tag details
  const tag_ids = popularTags.map(pt => pt.tag_id);
  if (tag_ids.length === 0) {
    return [];
  }

  const tags = await prisma.tags.findMany({
    where: { id: { in: tag_ids } },
    select: {
      id: true,
      name: true,
      slug: true,
      usage_count: true
    }
  });

  // Sort tags by the order of popularTags
  return tag_ids.map(id => tags.find(t => t.id === id)).filter(Boolean);
}








