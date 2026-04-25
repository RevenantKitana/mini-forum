import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('Starting database cleanup...');
    console.log('Deleting in order to respect foreign key constraints...\n');

    // Delete tables with no dependents (level 1)
    console.log('[1/12] Deleting votes...');
    const votesDeleted = await prisma.votes.deleteMany();
    console.log(`  ✓ Deleted ${votesDeleted.count} votes\n`);

    console.log('[2/12] Deleting bookmarks...');
    const bookmarksDeleted = await prisma.bookmarks.deleteMany();
    console.log(`  ✓ Deleted ${bookmarksDeleted.count} bookmarks\n`);

    console.log('[3/12] Deleting refresh tokens...');
    const refreshTokensDeleted = await prisma.refresh_tokens.deleteMany();
    console.log(`  ✓ Deleted ${refreshTokensDeleted.count} refresh tokens\n`);

    console.log('[4/12] Deleting user blocks...');
    const userBlocksDeleted = await prisma.user_blocks.deleteMany();
    console.log(`  ✓ Deleted ${userBlocksDeleted.count} user blocks\n`);

    // Delete comments (has self-relations but cascades)
    console.log('[5/12] Deleting comments...');
    const commentsDeleted = await prisma.comments.deleteMany();
    console.log(`  ✓ Deleted ${commentsDeleted.count} comments\n`);

    // Delete reports
    console.log('[6/12] Deleting reports...');
    const reportsDeleted = await prisma.reports.deleteMany();
    console.log(`  ✓ Deleted ${reportsDeleted.count} reports\n`);

    // Delete notifications
    console.log('[7/12] Deleting notifications...');
    const notificationsDeleted = await prisma.notifications.deleteMany();
    console.log(`  ✓ Deleted ${notificationsDeleted.count} notifications\n`);

    // Delete audit logs
    console.log('[8/12] Deleting audit logs...');
    const auditLogsDeleted = await prisma.audit_logs.deleteMany();
    console.log(`  ✓ Deleted ${auditLogsDeleted.count} audit logs\n`);

    // Delete post-related tables (post_media and post_blocks depend on posts)
    console.log('[9/12] Deleting post media...');
    const postMediaDeleted = await prisma.post_media.deleteMany();
    console.log(`  ✓ Deleted ${postMediaDeleted.count} post media\n`);

    console.log('[10/12] Deleting post blocks...');
    const postBlocksDeleted = await prisma.post_blocks.deleteMany();
    console.log(`  ✓ Deleted ${postBlocksDeleted.count} post blocks\n`);

    console.log('[11/12] Deleting posts...');
    const postsDeleted = await prisma.posts.deleteMany();
    console.log(`  ✓ Deleted ${postsDeleted.count} posts\n`);

    // Delete post_tags (should be empty after posts deletion, but explicit for clarity)
    console.log('[11b/12] Deleting post tags...');
    const postTagsDeleted = await prisma.post_tags.deleteMany();
    console.log(`  ✓ Deleted ${postTagsDeleted.count} post tags\n`);

    // Delete categories and tags
    console.log('[11c/12] Deleting categories...');
    const categoriesDeleted = await prisma.categories.deleteMany();
    console.log(`  ✓ Deleted ${categoriesDeleted.count} categories\n`);

    console.log('[11d/12] Deleting tags...');
    const tagsDeleted = await prisma.tags.deleteMany();
    console.log(`  ✓ Deleted ${tagsDeleted.count} tags\n`);

    // Delete user content context
    console.log('[11e/12] Deleting user content context...');
    const userContextDeleted = await prisma.user_content_context.deleteMany();
    console.log(`  ✓ Deleted ${userContextDeleted.count} user content contexts\n`);

    // Finally delete users
    console.log('[12/12] Deleting users...');
    const usersDeleted = await prisma.users.deleteMany();
    console.log(`  ✓ Deleted ${usersDeleted.count} users\n`);

    console.log('✅ Database cleanup completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Votes: ${votesDeleted.count}`);
    console.log(`   - Bookmarks: ${bookmarksDeleted.count}`);
    console.log(`   - Refresh Tokens: ${refreshTokensDeleted.count}`);
    console.log(`   - User Blocks: ${userBlocksDeleted.count}`);
    console.log(`   - Comments: ${commentsDeleted.count}`);
    console.log(`   - Reports: ${reportsDeleted.count}`);
    console.log(`   - Notifications: ${notificationsDeleted.count}`);
    console.log(`   - Audit Logs: ${auditLogsDeleted.count}`);
    console.log(`   - Post Media: ${postMediaDeleted.count}`);
    console.log(`   - Post Blocks: ${postBlocksDeleted.count}`);
    console.log(`   - Posts: ${postsDeleted.count}`);
    console.log(`   - Post Tags: ${postTagsDeleted.count}`);
    console.log(`   - Categories: ${categoriesDeleted.count}`);
    console.log(`   - Tags: ${tagsDeleted.count}`);
    console.log(`   - User Content Context: ${userContextDeleted.count}`);
    console.log(`   - Users: ${usersDeleted.count}`);
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();