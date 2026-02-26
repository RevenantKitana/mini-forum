import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('Starting database cleanup...');

    // Delete in order to respect foreign key constraints
    console.log('Deleting votes...');
    await prisma.vote.deleteMany();

    console.log('Deleting bookmarks...');
    await prisma.bookmark.deleteMany();

    console.log('Deleting comments...');
    await prisma.comment.deleteMany();

    console.log('Deleting reports...');
    await prisma.report.deleteMany();

    console.log('Deleting notifications...');
    await prisma.notification.deleteMany();

    console.log('Deleting posts...');
    await prisma.post.deleteMany();

    console.log('Deleting audit logs...');
    await prisma.auditLog.deleteMany();

    console.log('Deleting categories...');
    await prisma.category.deleteMany();

    console.log('Deleting tags...');
    await prisma.tag.deleteMany();

    console.log('Database cleanup completed successfully!');
    console.log('All data except users has been deleted.');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();