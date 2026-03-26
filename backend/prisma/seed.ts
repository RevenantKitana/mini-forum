import { PrismaClient, Role, PermissionLevel } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  try {
    // Seed Admin User FIRST (required for audit logs)
    console.log('👤 Seeding admin user...');
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const adminUser = await prisma.users.upsert({
      where: { email: 'sfw.forum@atomicmail.io' },
      update: {
        username: 'admin',
        password_hash: hashedPassword,
        role: Role.ADMIN,
        display_name: 'Admin',
        is_verified: true,
        is_active: true,
      },
      create: {
        email: 'sfw.forum@atomicmail.io',
        username: 'admin',
        password_hash: hashedPassword,
        role: Role.ADMIN,
        display_name: 'Admin',
        is_verified: true,
        is_active: true,
        reputation: 0,
      },
    });
    console.log('✅ Admin user seeded successfully');

    // Seed Categories
    const categories = [
      {
        name: 'Nội Quy - Thông báo',
        slug: 'noi-quy-thong-bao',
        description: 'Các quy định, thông báo chung của diễn đàn',
        color: '#FF6B6B',
        sort_order: 1,
        view_permission: PermissionLevel.ALL,
        post_permission: PermissionLevel.ADMIN,
        comment_permission: PermissionLevel.ADMIN,
      },
      {
        name: 'Ý kiến - Phản Hồi',
        slug: 'y-kien-phan-hoi',
        description: 'Chia sẻ ý kiến, phản hồi về diễn đàn',
        color: '#4ECDC4',
        sort_order: 2,
        view_permission: PermissionLevel.ALL,
        post_permission: PermissionLevel.MEMBER,
        comment_permission: PermissionLevel.MEMBER,
      },
      {
        name: 'Chia sẻ & Kinh nghiệm',
        slug: 'chia-se-kinh-nghiem',
        description: 'Chia sẻ kinh nghiệm, học hỏi lẫn nhau',
        color: '#45B7D1',
        sort_order: 3,
        view_permission: PermissionLevel.ALL,
        post_permission: PermissionLevel.MEMBER,
        comment_permission: PermissionLevel.MEMBER,
      },
      {
        name: 'Kể chuyện',
        slug: 'ke-chuyen',
        description: 'Kể những câu chuyện, trải nghiệm của bạn',
        color: '#FFA07A',
        sort_order: 4,
        view_permission: PermissionLevel.ALL,
        post_permission: PermissionLevel.MEMBER,
        comment_permission: PermissionLevel.MEMBER,
      },
      {
        name: 'Bàn luận & Góc nhìn',
        slug: 'ban-luan-goc-nhin',
        description: 'Bàn luận về các chủ đề, chia sẻ góc nhìn riêng',
        color: '#9B59B6',
        sort_order: 5,
        view_permission: PermissionLevel.ALL,
        post_permission: PermissionLevel.MEMBER,
        comment_permission: PermissionLevel.MEMBER,
      },
      {
        name: 'Hỏi đáp',
        slug: 'hoi-dap',
        description: 'Hỏi đáp câu hỏi, giải đáp thắc mắc',
        color: '#3498DB',
        sort_order: 6,
        view_permission: PermissionLevel.ALL,
        post_permission: PermissionLevel.MEMBER,
        comment_permission: PermissionLevel.MEMBER,
      },
      {
        name: 'Off-topic',
        slug: 'off-topic',
        description: 'Thảo luận về các chủ đề ngoài lề',
        color: '#95A5A6',
        sort_order: 7,
        view_permission: PermissionLevel.ALL,
        post_permission: PermissionLevel.MEMBER,
        comment_permission: PermissionLevel.MEMBER,
      },
    ];

    console.log('📝 Seeding categories...');
    for (const category of categories) {
      await prisma.categories.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
      });
    }
    console.log('✅ Categories seeded successfully');

    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
