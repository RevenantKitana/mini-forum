/**
 * Cleanup ImageKit Orphaned Files — Remove files from ImageKit that are no longer referenced in database
 *
 * This script:
 *   1. Lists all files from ImageKit (avatars/ and posts/ folders)
 *   2. Checks if each file_id exists in post_media or users table
 *   3. Deletes orphaned files from ImageKit
 *   4. Reports on cleanup results
 *
 * Orphaned files can occur when:
 *   - A post/avatar is deleted but the ImageKit file wasn't cleaned up (race condition)
 *   - Manual intervention or bugs in image deletion logic
 *
 * Usage:
 *   npx ts-node scripts/cleanupImagekit.ts
 *   DRY_RUN=true npx ts-node scripts/cleanupImagekit.ts
 *   FOLDERS="avatars,posts" npx ts-node scripts/cleanupImagekit.ts  # Custom folders
 *
 * Note: Requires ImageKit SDK's listFiles API. Check if your @imagekit/nodejs version supports it.
 */

import { PrismaClient } from '@prisma/client';
import ImageKit from '@imagekit/nodejs';
import config from '../src/config/index.js';

const prisma = new PrismaClient();
const imagekit = new ImageKit({
  privateKey: config.imagekit.privateKey,
});

const DRY_RUN = process.env.DRY_RUN === 'true';
const FOLDERS = (process.env.FOLDERS || 'avatars,posts').split(',').map(f => f.trim());
const DELAY_MS = 100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch all files from a specific ImageKit folder (recursive).
 * Uses @imagekit/nodejs 7.x SDK method: assets.list
 */
async function listFilesFromFolder(folder: string): Promise<Array<{ fileId: string; filePath: string }>> {
  try {
    const response = await imagekit.assets.list({
      path: folder,
    } as any);

    // Response contains items array
    const files = (response as any).items || response || [];
    return files.map((f: any) => ({
      fileId: f.fileId,
      filePath: f.filePath,
    }));
  } catch (err: any) {
    console.warn(
      `[cleanupImagekit] Warning: assets.list failed for ${folder}: ${err.message}`,
    );
    console.warn(`[cleanupImagekit] Skipping folder: ${folder}`);
    return [];
  }
}

async function cleanupImagekit() {
  console.log(`[cleanupImagekit] Starting${DRY_RUN ? ' (DRY RUN)' : ''}...`);
  console.log(`[cleanupImagekit] Scanning folders: ${FOLDERS.join(', ')}\n`);

  const allFiles: Array<{ fileId: string; filePath: string; folder: string }> = [];

  // Fetch all files from specified folders
  for (const folder of FOLDERS) {
    console.log(`[cleanupImagekit] Fetching files from /${folder}...`);
    const files = await listFilesFromFolder(`/${folder}`);
    const withFolder = files.map(f => ({ ...f, folder }));
    allFiles.push(...withFolder);
    console.log(`  Found ${files.length} file(s)\n`);
  }

  console.log(`[cleanupImagekit] Total files in ImageKit: ${allFiles.length}\n`);

  if (allFiles.length === 0) {
    console.log('[cleanupImagekit] No files to check.');
    return;
  }

  // Build a set of valid file IDs from database
  const validPostMediaIds = new Set(
    (await prisma.post_media.findMany({
      select: { imagekit_file_id: true },
    })).map((m) => m.imagekit_file_id),
  );

  const validAvatarIds = new Set(
    (await prisma.users.findMany({
      where: { avatar_imagekit_file_id: { not: null } },
      select: { avatar_imagekit_file_id: true },
    })).map((u) => u.avatar_imagekit_file_id),
  );

  console.log(`[cleanupImagekit] Database references:`);
  console.log(`  - post_media: ${validPostMediaIds.size} file(s)`);
  console.log(`  - users (avatars): ${validAvatarIds.size} file(s)\n`);

  // Find orphaned files
  const orphaned: Array<{ fileId: string; filePath: string; folder: string }> = [];

  for (const file of allFiles) {
    const isValid = validPostMediaIds.has(file.fileId) || validAvatarIds.has(file.fileId);
    if (!isValid) {
      orphaned.push(file);
    }
  }

  console.log(`[cleanupImagekit] Orphaned files found: ${orphaned.length}\n`);

  if (orphaned.length === 0) {
    console.log('✅ No orphaned files detected. ImageKit is clean!');
    return;
  }

  if (DRY_RUN) {
    console.log('[cleanupImagekit] DRY RUN mode — orphaned files that would be deleted:\n');
    orphaned.slice(0, 10).forEach((f, i) => {
      console.log(`  ${i + 1}. [${f.folder}] ${f.filePath} (ID: ${f.fileId})`);
    });
    if (orphaned.length > 10) {
      console.log(`  ... and ${orphaned.length - 10} more`);
    }
    console.log(`\nWould delete ${orphaned.length} orphaned file(s) from ImageKit.`);
    return;
  }

  console.log('[cleanupImagekit] Deleting orphaned files from ImageKit...\n');

  let deleted = 0;
  let failed = 0;

  for (let i = 0; i < orphaned.length; i++) {
    const file = orphaned[i];
    try {
      await imagekit.files.delete(file.fileId);
      deleted++;
      console.log(`  ✓ Deleted: ${file.filePath}`);
    } catch (err: any) {
      console.warn(`  ✗ Failed to delete ${file.filePath}: ${err.message}`);
      failed++;
    }
    await sleep(DELAY_MS);
  }

  console.log(`\n✅ ImageKit cleanup completed!`);
  console.log(`📊 Summary:`);
  console.log(`   - Orphaned files deleted: ${deleted}`);
  console.log(`   - Deletion failures: ${failed}`);
}

cleanupImagekit()
  .catch((err) => {
    console.error('[cleanupImagekit] Error:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
