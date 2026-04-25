/**
 * Reset Avatar Media — Delete all ImageKit avatar files and reset user avatar fields
 *
 * This script:
 *   1. Fetches all users with ImageKit avatars (avatar_imagekit_file_id IS NOT NULL)
 *   2. Deletes each avatar file from ImageKit
 *   3. Sets avatar_preview_url, avatar_standard_url, avatar_imagekit_file_id to NULL
 *   4. Optionally keeps or removes legacy avatar_url (default: keep for fallback)
 *
 * Usage:
 *   npx ts-node scripts/resetAvatarMedia.ts
 *   DRY_RUN=true npx ts-node scripts/resetAvatarMedia.ts      # Preview only
 *   KEEP_LEGACY=false npx ts-node scripts/resetAvatarMedia.ts # Also clear legacy avatar_url
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

async function resetAvatarMedia() {
  console.log(`[resetAvatarMedia] Starting${DRY_RUN ? ' (DRY RUN)' : ''}...`);
  console.log(`[resetAvatarMedia] KEEP_LEGACY=${KEEP_LEGACY}`);

  // Find users with ImageKit avatars
  const usersWithAvatars = await prisma.users.findMany({
    where: {
      avatar_imagekit_file_id: { not: null },
    },
    select: {
      id: true,
      username: true,
      avatar_imagekit_file_id: true,
      avatar_preview_url: true,
      avatar_standard_url: true,
      avatar_url: true,
    },
  });

  console.log(`[resetAvatarMedia] Found ${usersWithAvatars.length} user(s) with ImageKit avatars.`);

  if (usersWithAvatars.length === 0) {
    console.log('[resetAvatarMedia] Nothing to reset.');
    return;
  }

  if (DRY_RUN) {
    console.log('[resetAvatarMedia] DRY RUN mode — showing what would be reset:\n');
    usersWithAvatars.slice(0, 10).forEach((u, i) => {
      console.log(
        `  ${i + 1}. @${u.username} (ID: ${u.id}), FileID: ${u.avatar_imagekit_file_id}`,
      );
    });
    if (usersWithAvatars.length > 10) {
      console.log(`  ... and ${usersWithAvatars.length - 10} more`);
    }
    console.log(
      `\nWould delete ${usersWithAvatars.length} avatars from ImageKit and reset their URLs.`,
    );
    console.log(`KEEP_LEGACY=${KEEP_LEGACY} → ${KEEP_LEGACY ? 'legacy avatar_url will be preserved' : 'legacy avatar_url will be cleared'}`);
    return;
  }

  let deletedFromImageKit = 0;
  let failedImageKit = 0;

  console.log(
    `[resetAvatarMedia] Deleting from ImageKit in batches of ${BATCH_SIZE}...`,
  );

  for (let i = 0; i < usersWithAvatars.length; i += BATCH_SIZE) {
    const batch = usersWithAvatars.slice(i, i + BATCH_SIZE);

    for (const user of batch) {
      try {
        await deleteImage(user.avatar_imagekit_file_id!);
        deletedFromImageKit++;
      } catch (err: any) {
        console.warn(
          `[resetAvatarMedia] Warning: failed to delete ImageKit file for @${user.username}: ${err.message}`,
        );
        failedImageKit++;
      }
      await sleep(DELAY_MS);
    }

    console.log(
      `[resetAvatarMedia] Progress: ${Math.min(i + BATCH_SIZE, usersWithAvatars.length)}/${usersWithAvatars.length}`,
    );
  }

  console.log(
    `[resetAvatarMedia] Deleted from ImageKit: ${deletedFromImageKit}, failed: ${failedImageKit}`,
  );

  // Update database
  console.log('[resetAvatarMedia] Resetting avatar fields in database...');

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

  const result = await prisma.users.updateMany({
    where: {
      avatar_imagekit_file_id: { not: null },
    },
    data: updateData,
  });

  console.log(`[resetAvatarMedia] Updated ${result.count} user(s).`);

  console.log('\n✅ Avatar media reset completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - ImageKit deletions: ${deletedFromImageKit}`);
  console.log(`   - ImageKit failures: ${failedImageKit}`);
  console.log(`   - Database users updated: ${result.count}`);
  console.log(`   - Legacy avatar_url: ${KEEP_LEGACY ? 'PRESERVED' : 'CLEARED'}`);
}

resetAvatarMedia()
  .catch((err) => {
    console.error('[resetAvatarMedia] Error:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
