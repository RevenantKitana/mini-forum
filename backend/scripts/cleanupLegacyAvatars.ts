/**
 * Phase 8.3 — Cleanup Legacy avatar_url Data
 *
 * Sets avatar_url = null for users who have already been migrated to ImageKit
 * (i.e., have avatar_preview_url set). Users with no avatar at all are skipped.
 *
 * Usage:
 *   npx ts-node scripts/cleanupLegacyAvatars.ts
 *   DRY_RUN=true npx ts-node scripts/cleanupLegacyAvatars.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === 'true';

async function main() {
  console.log(`[cleanupLegacyAvatars] Starting... DRY_RUN=${DRY_RUN}`);

  // Users migrated to ImageKit but still have legacy avatar_url set
  const migratedWithLegacy = await prisma.users.findMany({
    where: {
      avatar_preview_url: { not: null },
      avatar_url: { not: null },
    },
    select: { id: true, username: true, avatar_url: true, avatar_preview_url: true },
  });

  // Users with only legacy avatar_url (not yet migrated)
  const legacyOnly = await prisma.users.findMany({
    where: {
      avatar_preview_url: null,
      avatar_url: { not: null },
    },
    select: { id: true, username: true, avatar_url: true },
  });

  console.log(`[cleanupLegacyAvatars] Users migrated (both fields set): ${migratedWithLegacy.length}`);
  console.log(`[cleanupLegacyAvatars] Users with legacy-only avatar (not yet migrated): ${legacyOnly.length}`);

  if (migratedWithLegacy.length === 0) {
    console.log('[cleanupLegacyAvatars] Nothing to clean up.');
    return;
  }

  if (DRY_RUN) {
    console.log('[cleanupLegacyAvatars] DRY RUN — no changes made.');
    console.log('Would null out avatar_url for:');
    migratedWithLegacy.forEach((u) =>
      console.log(`  id=${u.id} username=${u.username} avatar_url=${u.avatar_url}`),
    );
    return;
  }

  const result = await prisma.users.updateMany({
    where: {
      id: { in: migratedWithLegacy.map((u) => u.id) },
    },
    data: { avatar_url: null },
  });

  console.log(`[cleanupLegacyAvatars] Done. Cleared avatar_url for ${result.count} user(s).`);
}

main()
  .catch((err) => {
    console.error('[cleanupLegacyAvatars] Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
