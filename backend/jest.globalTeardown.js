/**
 * Jest Global Teardown
 * Runs once after all test suites complete (in its own process context).
 * Creates a fresh Prisma client solely to close the connection pool cleanly.
 */
export default async function globalTeardown() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.$disconnect();
}
