import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config();

function runStep(command: string, args: string[], label: string) {
  console.log(`\n[db:wipe] ${label}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    console.error(`[db:wipe] Failed to run: ${command} ${args.join(' ')}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[db:wipe] Step failed with exit code: ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

function main() {
  console.log('[db:wipe] Wiping all database data and recreating schema...');

  runStep(
    'npx',
    ['prisma', 'db', 'push', '--force-reset', '--accept-data-loss'],
    'Reset schema from prisma/schema.prisma'
  );

  runStep('npx', ['prisma', 'db', 'seed'], 'Run seed');

  console.log('\n[db:wipe] Done. Database has been wiped and recreated.');
}

main();
