import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const projectEntries = {};
for (let i = 1; i <= 13; i++) {
  const num = String(i).padStart(2, '0');
  projectEntries[`project_${num}`] = path.resolve(__dirname, `src/projects/project_${num}.jsx`);
}

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: projectEntries,
      formats: ['es'],
    },
    outDir: 'public/dist',
    rollupOptions: {
      output: {
        entryFileNames: '[name].bundle.js',
        dir: 'public/dist',
      },
    },
  },
});
