import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const projectEntries = {};
for (let i = 1; i <= 13; i++) {
  const num = String(i).padStart(2, '0');
  projectEntries[`project_${num}`] = path.resolve(__dirname, `project_${num}.html`);
}

// Serve the /api/chat serverless handler during `vite dev`. In production the
// same logic runs as a Vercel function (api/chat.ts); locally Vite has no
// backend, so we mount the shared core (api/_chat-core.ts) as middleware.
function devChatApi() {
  return {
    name: 'dev-chat-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        if (url !== '/api/chat') return next();
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
        let raw = '';
        req.on('data', (c) => { raw += c; });
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { generateReply } = await server.ssrLoadModule('/api/_chat-core.ts');
            let question = '';
            try { question = JSON.parse(raw || '{}').question; } catch { /* ignore */ }
            const result = await generateReply(question);
            res.statusCode = result.status;
            res.end(JSON.stringify(result.body));
          } catch (e) {
            server.config.logger.error('[dev-chat-api] ' + (e && e.stack ? e.stack : e));
            res.statusCode = 500;
            res.end(JSON.stringify({ error: '服務暫時無法使用，請直接透過聯絡表單聯繫 Tim。' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devChatApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        ...projectEntries,
      },
    },
  },
});
