/**
 * Phase 2.5 migration script — backfill ImageKit avatar URLs
 *
 * For every user that has a legacy `avatar_url` but no `avatar_preview_url`
 * / `avatar_standard_url`, this script:
 *   1. Downloads the source image.
 *   2. Uploads it to ImageKit under the folder `avatars/`.
 *   3. Generates a preview (300×300 webp) and standard (1200w webp) URL.
 *   4. Writes the three new fields back to the database.
 *   5. Keeps `avatar_url` intact as a legacy fallback.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/migrateAvatarUrls.ts
 *   # Or with the dry-run flag to preview without writing:
 *   DRY_RUN=true npx ts-node -r tsconfig-paths/register scripts/migrateAvatarUrls.ts
 *
 * Safe to re-run — already-migrated users (avatar_preview_url IS NOT NULL) are skipped.
 */

import { PrismaClient } from '@prisma/client';
import https from 'https';
import http from 'http';
import { imagekitService } from '../src/services/imagekitService';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = 10;
const DELAY_MS = 300; // throttle between uploads to respect ImageKit rate-limits

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Download a remote URL and return its raw buffer.
 * Supports http and https, follows up to 5 redirects.
 */
function downloadUrl(url: string, maxRedirects = 5): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const get = url.startsWith('https') ? https.get : http.get;
    get(url, { timeout: 15_000 }, (res) => {
      // Follow redirects
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        if (maxRedirects <= 0) {
          return reject(new Error('Too many redirects'));
        }
        return resolve(downloadUrl(res.headers.location, maxRedirects - 1));
      }

      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} downloading ${url}`));
      }

      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function migrateAvatarUrls() {
  console.log(`[migrateAvatarUrls] Starting${DRY_RUN ? ' (DRY RUN)' : ''} …`);

  const users = await prisma.users.findMany({
    where: {
      avatar_url: { not: null },
      avatar_preview_url: null, // not yet migrated
    },
    select: {
      id: true,
      username: true,
      avatar_url: true,
    },
  });

  console.log(`[migrateAvatarUrls] Found ${users.length} user(s) to migrate.`);
  if (users.length === 0) {
    console.log('[migrateAvatarUrls] Nothing to do — all avatars are up to date.');
    return;
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    for (const user of batch) {
      const avatarUrl = user.avatar_url!;
      console.log(`  → user #${user.id} (${user.username}): ${avatarUrl}`);

      if (DRY_RUN) {
        success++;
        continue;
      }

      try {
        // 1. Download original image
        const buffer = await downloadUrl(avatarUrl);

        // 2. Upload to ImageKit
        const ext = avatarUrl.split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `avatar_${user.id}_${Date.now()}.${ext}`;
        const uploaded = await imagekitService.uploadImage(buffer, fileName, 'avatars');

        // 3. Generate CDN URLs with ImageKit transformations
        const previewUrl = imagekitService.getTransformedUrl(uploaded.filePath, 'preview');
        const standardUrl = imagekitService.getTransformedUrl(uploaded.filePath, 'standard');

        // 4. Write back to DB
        await prisma.users.update({
          where: { id: user.id },
          data: {
            avatar_imagekit_file_id: uploaded.fileId,
            avatar_preview_url: previewUrl,
            avatar_standard_url: standardUrl,
            // avatar_url is intentionally kept as legacy fallback
          },
        });

        console.log(`     ✓ migrated → preview: ${previewUrl}`);
        success++;
      } catch (err: any) {
        console.error(`     ✗ failed for user #${user.id}: ${err?.message}`);
        failed++;
      }

      await sleep(DELAY_MS);
    }

    console.log(
      `[migrateAvatarUrls] Batch ${Math.floor(i / BATCH_SIZE) + 1} done — ${success} ok / ${failed} failed so far`,
    );
  }

  console.log(`\n[migrateAvatarUrls] Finished — ${success} migrated, ${failed} failed.`);
}

migrateAvatarUrls()
  .catch((err) => {
    console.error('[migrateAvatarUrls] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
