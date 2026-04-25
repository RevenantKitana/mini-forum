import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts'],
  },
  resolve: {
    // Allow importing .js extensions that resolve to .ts in ESM TypeScript
    extensions: ['.ts', '.js'],
  },
});
