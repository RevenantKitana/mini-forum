/**
 * Reset All Media — Delete all ImageKit media (avatars + post media) and reset database
 *
 * This script combines resetAvatarMedia + resetPostMedia:
 *   1. Delete all post media from ImageKit and database
 *   2. Delete all avatar media from ImageKit and reset user fields
 *   3. Optionally keep or clear legacy avatar_url
 *
 * Usage:
 *   npx ts-node scripts/resetAllMedia.ts
 *   DRY_RUN=true npx ts-node scripts/resetAllMedia.ts        # Preview only
 *   KEEP_LEGACY=false npx ts-node scripts/resetAllMedia.ts   # Also clear legacy avatar_url
 */

import { PrismaClient } from '@prisma/client';
import { deleteImage } from '../src/services/imagekitService.js';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === 'true';
const KEEP_LEGACY = process.env.KEEP_LEGACY !== 'false'; // default: true
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10);
const DELAY_MS = 100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resetAllMedia() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[resetAllMedia] Starting${DRY_RUN ? ' (DRY RUN)' : ''}...`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`Options: KEEP_LEGACY=${KEEP_LEGACY}, BATCH_SIZE=${BATCH_SIZE}`);

  // 1. Fetch all post media
  const allPostMedia = await prisma.post_media.findMany({
    select: {
      id: true,
      imagekit_file_id: true,
      post_id: true,
    },
  });

  console.log(`\n[1/2] Found ${allPostMedia.length} post media file(s).`);

  // 2. Fetch all users with avatars
  const usersWithAvatars = await prisma.users.findMany({
    where: {
      avatar_imagekit_file_id: { not: null },
    },
    select: {
      id: true,
      username: true,
      avatar_imagekit_file_id: true,
    },
  });

  console.log(`[2/2] Found ${usersWithAvatars.length} user(s) with ImageKit avatars.\n`);

  const totalMedia = allPostMedia.length + usersWithAvatars.length;

  if (totalMedia === 0) {
    console.log('[resetAllMedia] Nothing to reset.');
    return;
  }

  if (DRY_RUN) {
    console.log('[resetAllMedia] DRY RUN mode — preview:\n');

    if (allPostMedia.length > 0) {
      console.log('Post media to delete:');
      allPostMedia.slice(0, 5).forEach((m, i) => {
        console.log(`  ${i + 1}. Media ID: ${m.id}, FileID: ${m.imagekit_file_id}, Post: ${m.post_id}`);
      });
      if (allPostMedia.length > 5) {
        console.log(`  ... and ${allPostMedia.length - 5} more`);
      }
    }

    if (usersWithAvatars.length > 0) {
      console.log('\nAvatars to delete:');
      usersWithAvatars.slice(0, 5).forEach((u, i) => {
        console.log(`  ${i + 1}. @${u.username} (ID: ${u.id}), FileID: ${u.avatar_imagekit_file_id}`);
      });
      if (usersWithAvatars.length > 5) {
        console.log(`  ... and ${usersWithAvatars.length - 5} more`);
      }
    }

    console.log(`\nWould delete ${totalMedia} files from ImageKit and update database.`);
    console.log(`KEEP_LEGACY=${KEEP_LEGACY} → ${KEEP_LEGACY ? 'legacy avatar_url will be preserved' : 'legacy avatar_url will be cleared'}`);
    return;
  }

  let deletedFromImageKit = 0;
  let failedImageKit = 0;

  // Process post media
  console.log(`[resetAllMedia] Deleting post media from ImageKit...\n`);

  for (let i = 0; i < allPostMedia.length; i += BATCH_SIZE) {
    const batch = allPostMedia.slice(i, i + BATCH_SIZE);

    for (const media of batch) {
      try {
        await deleteImage(media.imagekit_file_id);
        deletedFromImageKit++;
      } catch (err: any) {
        console.warn(
          `[resetAllMedia] Warning: failed to delete post media ${media.imagekit_file_id}: ${err.message}`,
        );
        failedImageKit++;
      }
      await sleep(DELAY_MS);
    }

    console.log(
      `  Post media progress: ${Math.min(i + BATCH_SIZE, allPostMedia.length)}/${allPostMedia.length}`,
    );
  }

  // Process avatars
  console.log(`\n[resetAllMedia] Deleting avatars from ImageKit...\n`);

  for (let i = 0; i < usersWithAvatars.length; i += BATCH_SIZE) {
    const batch = usersWithAvatars.slice(i, i + BATCH_SIZE);

    for (const user of batch) {
      try {
        await deleteImage(user.avatar_imagekit_file_id!);
        deletedFromImageKit++;
      } catch (err: any) {
        console.warn(
          `[resetAllMedia] Warning: failed to delete avatar for @${user.username}: ${err.message}`,
        );
        failedImageKit++;
      }
      await sleep(DELAY_MS);
    }

    console.log(
      `  Avatar progress: ${Math.min(i + BATCH_SIZE, usersWithAvatars.length)}/${usersWithAvatars.length}`,
    );
  }

  console.log(`\n[resetAllMedia] ImageKit deletions: ${deletedFromImageKit}, failed: ${failedImageKit}`);

  // Delete post media from database
  console.log(`\n[resetAllMedia] Deleting post_media records from database...`);
  const postMediaResult = await prisma.post_media.deleteMany();
  console.log(`  Deleted ${postMediaResult.count} post_media records.`);

  // Reset avatar fields in database
  console.log(`[resetAllMedia] Resetting avatar fields in database...`);

  const updateData: {
    avatar_preview_url: null;
    avatar_standard_url: null;
    avatar_imagekit_file_id: null;
    avatar_url?: null;
  } = {
    avatar_preview_url: null,
    avatar_standard_url: null,
    avatar_imagekit_file_id: null,
  };

  if (!KEEP_LEGACY) {
    updateData.avatar_url = null;
  }

  const avatarResult = await prisma.users.updateMany({
    where: {
      avatar_imagekit_file_id: { not: null },
    },
    data: updateData,
  });

  console.log(`  Updated ${avatarResult.count} user(s).`);

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ All media reset completed successfully!');
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 Summary:`);
  console.log(`   - ImageKit total deletions: ${deletedFromImageKit}`);
  console.log(`   - ImageKit failures: ${failedImageKit}`);
  console.log(`   - Post media database records deleted: ${postMediaResult.count}`);
  console.log(`   - Users with avatars reset: ${avatarResult.count}`);
  console.log(`   - Legacy avatar_url: ${KEEP_LEGACY ? 'PRESERVED' : 'CLEARED'}`);
}

resetAllMedia()
  .catch((err) => {
    console.error('[resetAllMedia] Error:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
