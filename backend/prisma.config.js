/**
 * Prisma 7.x Configuration File
 *
 * In Prisma 7, database connection URLs have moved from schema.prisma
 * to this configuration file. This allows for runtime configuration
 * and dynamic datasource URL selection without regenerating the Prisma client.
 *
 * Environment variables:
 * - DATABASE_URL: Connection string with pooling (for application queries)
 * - DIRECT_URL: Direct connection string without pooling (for migrations)
 *   If DIRECT_URL is not provided, DATABASE_URL is used for migrations.
 *
 * See: https://www.prisma.io/docs/orm/prisma-schema/overview/databases
 */

module.exports = {
  datasources: {
    db: {
      // Use DIRECT_URL for direct connections (migrations, admin operations)
      // Fallback to DATABASE_URL if DIRECT_URL is not set (for local development)
      url:
        process.env.DIRECT_URL ||
        process.env.DATABASE_URL ||
        'postgresql://user:password@localhost:5432/forum',
    },
  },
};
