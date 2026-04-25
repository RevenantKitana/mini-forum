/**
 * Phase B migration script — convert ALL non-block posts to block-based layout
 *
 * For every post with use_block_layout=false, this script:
 *   1. Creates a TEXT PostBlock from the post's `content` field (if no TEXT block exists).
 *   2. Creates an IMAGE PostBlock (sort_order=2) and re-associates any orphaned
 *      post_media records (block_id=null) with that block.
 *   3. Sets use_block_layout=true on the post.
 *
 * After this migration, ALL posts are block-based and non-block rendering
 * can be safely removed from the frontend.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/migratePostsToBlocks.ts
 *   # Dry-run (no DB writes):
 *   DRY_RUN=true npx ts-node -r tsconfig-paths/register scripts/migratePostsToBlocks.ts
 *
 * Safe to re-run — posts already having use_block_layout=true are skipped.
 *
 * Rollback (revert use_block_layout; blocks/media links remain):
 *   UPDATE posts SET use_block_layout = false WHERE use_block_layout = true;
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 50;
const DELAY_MS = Number(process.env.DELAY_MS) || 100;

const MAX_TEXT_BLOCK_CHARS = 10000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function migratePostsToBlocks() {
  console.log(`[migratePostsToBlocks] Starting${DRY_RUN ? ' (DRY RUN)' : ''} …`);

  // Find all non-block posts (regardless of whether they already have some blocks)
  const posts = await prisma.posts.findMany({
    where: { use_block_layout: false },
    select: {
      id: true,
      title: true,
      content: true,
      post_blocks: {
        select: { id: true, type: true },
        orderBy: { sort_order: 'asc' },
      },
      post_media: {
        where: { block_id: null },
        select: { id: true, sort_order: true },
        orderBy: { sort_order: 'asc' },
      },
    },
    orderBy: { id: 'asc' },
  });

  console.log(`[migratePostsToBlocks] Found ${posts.length} non-block post(s) to migrate.`);

  if (posts.length === 0) {
    console.log('[migratePostsToBlocks] Nothing to do — all posts are already block-based.');
    await prisma.$disconnect();
    return;
  }

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);

    for (const post of batch) {
      console.log(`  → post #${post.id}: "${post.title.substring(0, 60)}"`);

      const hasTextBlock = post.post_blocks.some((b) => b.type === 'TEXT');
      const hasImageBlock = post.post_blocks.some((b) => b.type === 'IMAGE');
      const orphanedMedia = post.post_media; // block_id=null

      if (DRY_RUN) {
        if (!hasTextBlock && post.content && post.content.trim()) {
          console.log(`     ✓ [dry-run] would create TEXT block (${Math.min(post.content.length, MAX_TEXT_BLOCK_CHARS)} chars)`);
        }
        if (!hasImageBlock && orphanedMedia.length > 0) {
          console.log(`     ✓ [dry-run] would create IMAGE block + link ${orphanedMedia.length} media item(s)`);
        } else if (!hasImageBlock) {
          console.log(`     ✓ [dry-run] would create empty IMAGE block (no orphaned media)`);
        }
        console.log(`     ✓ [dry-run] would set use_block_layout=true`);
        success++;
        continue;
      }

      try {
        await prisma.$transaction(async (tx) => {
          // 1. Create TEXT block if needed
          if (!hasTextBlock) {
            const content =
              post.content && post.content.length > MAX_TEXT_BLOCK_CHARS
                ? post.content.substring(0, MAX_TEXT_BLOCK_CHARS)
                : (post.content || '');

            await tx.post_blocks.create({
              data: {
                post_id: post.id,
                type: 'TEXT',
                content: content || null,
                sort_order: 1,
              },
            });
            console.log(`     ✓ created TEXT block (${content.length} chars)`);
          } else {
            console.log(`     - TEXT block already exists, skipping`);
          }

          // 2. Create IMAGE block and re-associate orphaned media
          if (!hasImageBlock) {
            const imageBlock = await tx.post_blocks.create({
              data: {
                post_id: post.id,
                type: 'IMAGE',
                content: null,
                sort_order: 2,
              },
            });

            if (orphanedMedia.length > 0) {
              await tx.post_media.updateMany({
                where: {
                  id: { in: orphanedMedia.map((m) => m.id) },
                },
                data: { block_id: imageBlock.id },
              });
              console.log(`     ✓ created IMAGE block + linked ${orphanedMedia.length} media item(s)`);
            } else {
              console.log(`     ✓ created empty IMAGE block`);
            }
          } else {
            console.log(`     - IMAGE block already exists, skipping`);
          }

          // 3. Set use_block_layout=true
          await tx.posts.update({
            where: { id: post.id },
            data: { use_block_layout: true },
          });
        });

        console.log(`     ✓ use_block_layout set to true`);
        success++;
      } catch (err: any) {
        console.error(`     ✗ failed for post #${post.id}: ${err?.message}`);
        failed++;
      }

      if (DELAY_MS > 0) await sleep(DELAY_MS);
    }

    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(posts.length / BATCH_SIZE);
    console.log(
      `[migratePostsToBlocks] Batch ${batchNum}/${totalBatches} — ` +
        `${success} ok / ${skipped} skipped / ${failed} failed so far`,
    );
  }

  console.log(
    `\n[migratePostsToBlocks] Finished — ${success} migrated, ${skipped} skipped, ${failed} failed.`,
  );

  await prisma.$disconnect();
}

migratePostsToBlocks().catch(async (err) => {
  console.error('[migratePostsToBlocks] Fatal error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
