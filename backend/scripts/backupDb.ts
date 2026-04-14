import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

function getDatabaseName(databaseUrl: string): string {
  try {
    const parsedUrl = new URL(databaseUrl);
    const dbName = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''));
    return dbName || 'database';
  } catch {
    return 'database';
  }
}

function createTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function backupDatabase() {
  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('Missing DIRECT_URL or DATABASE_URL in environment variables.');
    process.exit(1);
  }

  const backupDir = path.resolve(process.cwd(), 'backups');
  mkdirSync(backupDir, { recursive: true });

  const dbName = getDatabaseName(databaseUrl);
  const outputFile = path.join(backupDir, `${dbName}-${createTimestamp()}.dump`);

  console.log(`Starting backup to: ${outputFile}`);

  const result = spawnSync(
    'pg_dump',
    [
      '--format=custom',
      '--no-owner',
      '--no-privileges',
      `--file=${outputFile}`,
      `--dbname=${databaseUrl}`,
    ],
    { stdio: 'inherit' }
  );

  if (result.error) {
    console.error('Failed to run pg_dump. Make sure PostgreSQL client tools are installed and in PATH.');
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`Backup failed with exit code: ${result.status}`);
    process.exit(result.status ?? 1);
  }

  console.log('Database backup completed successfully.');
}

backupDatabase();
