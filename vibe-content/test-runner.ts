#!/usr/bin/env node
import { glob } from 'glob';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTests() {
  try {
    // Expand glob patterns to get actual test files
    const testFiles = await glob('src/__tests__/**/*.test.ts', {
      cwd: __dirname,
      absolute: false,
    });

    // Always include the run-tests.ts file
    const allFiles = [...testFiles, 'src/tests/run-tests.ts'];

    if (testFiles.length === 0) {
      console.warn('⚠️  No test files found matching src/__tests__/**/*.test.ts');
    }

    // Run tsx test with expanded file list
    const args = ['--test', ...allFiles];
    
    const child = spawn('tsx', args, {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true,
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

runTests();
