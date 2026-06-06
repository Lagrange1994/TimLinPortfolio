import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const projectEntries = {};
for (let i = 1; i <= 13; i++) {
  const num = String(i).padStart(2, '0');
  projectEntries[`project_${num}`] = path.resolve(__dirname, `project_${num}.html`);
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        ...projectEntries,
      },
    },
  },
});
