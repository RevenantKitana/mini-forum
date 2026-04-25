/**
 * Reset Post Media — Delete all post_media records and remove corresponding files from ImageKit
 *
 * This script:
 *   1. Fetches all post_media records
 *   2. Deletes each file from ImageKit (by fileId)
 *   3. Deletes all post_media records from database
 *   4. Resets post.comment_count to 0 (optional, only if needed)
 *
 * Usage:
 *   npx ts-node scripts/resetPostMedia.ts
 *   DRY_RUN=true npx ts-node scripts/resetPostMedia.ts    # Preview only
 *   BATCH_SIZE=20 npx ts-node scripts/resetPostMedia.ts   # Custom batch size
 */

import { PrismaClient } from '@prisma/client';
import { deleteImage } from '../src/services/imagekitService.js';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10);
const DELAY_MS = 100; // throttle between ImageKit deletes

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resetPostMedia() {
  console.log(`[resetPostMedia] Starting${DRY_RUN ? ' (DRY RUN)' : ''}...`);

  const allMedia = await prisma.post_media.findMany({
    select: {
      id: true,
      imagekit_file_id: true,
      standard_url: true,
      post_id: true,
    },
  });

  console.log(`[resetPostMedia] Found ${allMedia.length} media file(s) in database.`);

  if (allMedia.length === 0) {
    console.log('[resetPostMedia] Nothing to reset.');
    return;
  }

  if (DRY_RUN) {
    console.log('[resetPostMedia] DRY RUN mode — showing what would be deleted:\n');
    allMedia.slice(0, 10).forEach((m, i) => {
      console.log(`  ${i + 1}. ID: ${m.id}, FileID: ${m.imagekit_file_id}, Post: ${m.post_id}`);
    });
    if (allMedia.length > 10) {
      console.log(`  ... and ${allMedia.length - 10} more`);
    }
    console.log(`\nWould delete ${allMedia.length} records from post_media and ImageKit.`);
    return;
  }

  let deletedFromImageKit = 0;
  let failedImageKit = 0;

  console.log(`[resetPostMedia] Deleting from ImageKit in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < allMedia.length; i += BATCH_SIZE) {
    const batch = allMedia.slice(i, i + BATCH_SIZE);

    for (const media of batch) {
      try {
        await deleteImage(media.imagekit_file_id);
        deletedFromImageKit++;
      } catch (err: any) {
        console.warn(
          `[resetPostMedia] Warning: failed to delete ImageKit file ${media.imagekit_file_id}: ${err.message}`,
        );
        failedImageKit++;
      }
      await sleep(DELAY_MS);
    }

    console.log(`[resetPostMedia] Progress: ${Math.min(i + BATCH_SIZE, allMedia.length)}/${allMedia.length}`);
  }

  console.log(`[resetPostMedia] Deleted from ImageKit: ${deletedFromImageKit}, failed: ${failedImageKit}`);

  console.log('[resetPostMedia] Deleting post_media records from database...');
  const result = await prisma.post_media.deleteMany();
  console.log(`[resetPostMedia] Deleted ${result.count} post_media records.`);

  // Optionally reset post.comment_count — but this is post's own metric, not media-related
  // Keeping this as a comment for future use:
  // console.log('[resetPostMedia] Resetting post comment_count to 0...');
  // await prisma.posts.updateMany({ data: { comment_count: 0 } });

  console.log('\n✅ Post media reset completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - ImageKit deletions: ${deletedFromImageKit}`);
  console.log(`   - ImageKit failures: ${failedImageKit}`);
  console.log(`   - Database records deleted: ${result.count}`);
}

resetPostMedia()
  .catch((err) => {
    console.error('[resetPostMedia] Error:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
