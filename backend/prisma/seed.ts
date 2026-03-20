/**
 * ================================================================
 * Run:  cd backend && npm run db:seed
 * ================================================================
 */

import {
  PrismaClient,
  Role,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

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
  console.log('👥 Creating user account...');

  const userPwd = await bcrypt.hash('Admin@123', SALT_ROUNDS);

  await prisma.users.upsert({
    where: { email: 'hainamh961@gmail.com' },
    update: {},
    create: {
      email: 'hainamh961@gmail.com',
      username: 'hainamh961',
      password_hash: userPwd,
      display_name: 'Quốc Khánh',
      role: Role.ADMIN,
      is_verified: true,
      is_active: true,
      reputation: 0,
      bio: 'Admin of Mini Forum',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=khanh',
      gender: 'male',
      created_at: new Date(),
      last_active_at: new Date(),
    },
  });

  console.log('✅ User account created successfully.');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
