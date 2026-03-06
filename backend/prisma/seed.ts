/**
 * ================================================================
 * COMPREHENSIVE SEED DATA — Mini Forum
 * ================================================================
 * Phủ toàn bộ các module cho manual testing:
 *   Users (12), Categories (7), Tags (15), Posts (20),
 *   Comments (35+), Votes (60+), Bookmarks (13),
 *   Notifications (20), Reports (10), Blocks (4), Audit Logs (18)
 * ================================================================
 * Run:  cd backend && npm run db:seed
 * ================================================================
 */

import {
  PrismaClient,
  Role,
  PostStatus,
  CommentStatus,
  VoteTarget,
  NotificationType,
  ReportTarget,
  ReportStatus,
  PinType,
  AuditAction,
  AuditTarget,
  PermissionLevel,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// ─── Time helpers ───────────────────────────────────────────────
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000);

// ================================================================
// MAIN
// ================================================================
async function main() {
  console.log('🌱 Starting comprehensive seed...\n');

  // ─────────────────────────────────────────────────────────────
  // CLEANUP  (respect FK order)
  // ─────────────────────────────────────────────────────────────
  console.log('🗑️  Cleaning existing data...');
  await prisma.audit_logs.deleteMany();
  await prisma.votes.deleteMany();
  await prisma.bookmarks.deleteMany();
  await prisma.notifications.deleteMany();
  await prisma.reports.deleteMany();
  await prisma.user_blocks.deleteMany();
  await prisma.comments.deleteMany();
  await prisma.post_tags.deleteMany();
  await prisma.posts.deleteMany();
  await prisma.tags.deleteMany();
  await prisma.categories.deleteMany();
  console.log('✅ Cleaned\n');

  // ─────────────────────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────────────────────
  console.log('👥 Creating users...');

  const [adminPwd, modPwd, memberPwd] = await Promise.all([
    bcrypt.hash('Admin@123', SALT_ROUNDS),
    bcrypt.hash('Moderator@123', SALT_ROUNDS),
    bcrypt.hash('Member@123', SALT_ROUNDS),
  ]);

  const admin = await prisma.users.upsert({
    where: { email: 'admin@forum.com' },
    update: {},
    create: {
      email: 'admin@forum.com',
      username: 'admin',
      password_hash: adminPwd,
      display_name: 'Administrator',
      role: Role.ADMIN,
      is_verified: true,
      is_active: true,
      reputation: 1000,
      bio: 'Quản trị viên diễn đàn — Managing the community since day one.',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      gender: 'male',
      created_at: daysAgo(180),
      last_active_at: hoursAgo(1),
    },
  });

  // NOTE: Per request, keep only the admin account. Skip all other seed data.
  console.log('✅ Admin account ensured. Skipping other seeds per request.');
  return;
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
