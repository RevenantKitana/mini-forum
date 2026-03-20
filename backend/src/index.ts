import app from './app.js';
import config from './config/index.js';
import prisma from './config/database.js';
import { verifyEmailConnection } from './config/email.js';

const PORT = config.port;

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Verify email/SMTP configuration
    await verifyEmailConnection();

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📚 API Health: http://localhost:${PORT}/api/v1/health`);
      console.log(`🔧 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
process.on('unhandledRejection', (reason: unknown) => {
  console.error('\u274C Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('\u274C Uncaught Exception:', error);
  process.exit(1);
});
main();






