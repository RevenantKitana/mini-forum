import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('Starting database cleanup...');

    // Delete in order to respect foreign key constraints
    console.log('Deleting votes...');
    await prisma.votes.deleteMany();

    console.log('Deleting bookmarks...');
    await prisma.bookmarks.deleteMany();

    console.log('Deleting comments...');
    await prisma.comments.deleteMany();

    console.log('Deleting reports...');
    await prisma.reports.deleteMany();

    console.log('Deleting notifications...');
    await prisma.notifications.deleteMany();

    console.log('Deleting posts...');
    await prisma.posts.deleteMany();

    console.log('Deleting audit logs...');
    await prisma.audit_logs.deleteMany();

    console.log('Deleting categories...');
    await prisma.categories.deleteMany();

    console.log('Deleting tags...');
    await prisma.tags.deleteMany();

    console.log("Delete user content context...")
    await prisma.user_content_context.deleteMany();

    console.log("Delete Others... ")
    await prisma.post_tags.deleteMany();
    await prisma.refresh_tokens.deleteMany();


    console.log('Database cleanup completed successfully!');
    console.log('All data except users has been deleted.');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();