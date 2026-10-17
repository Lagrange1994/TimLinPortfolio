import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    // Agent worktrees under .claude/worktrees/ hold full repo copies; without
    // this, their test/ dirs get collected as duplicate suites.
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
});
