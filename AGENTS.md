<!-- BEGIN:nextjs-agent-rules -->
# Not Next.js — Vite + React

This project does NOT use Next.js. Confirmed: no `app/` dir, no `next.config.*`, no `next` in `package.json`/`node_modules`. It was migrated to Next.js once, then migrated back to Vite + React (see `CLAUDE.md` history note). Do not apply Next.js conventions (app router, `app/layout.tsx`, server components, etc.) — they don't exist here.

Both the homepage (`index.html` → `src/main.tsx` → `src/App.tsx`) and the 13 project pages (`project_XX.html` → `src/projects/project_XX.jsx`) are React, built by Vite as a multi-page app. See `CLAUDE.md` for the full architecture breakdown before editing.
<!-- END:nextjs-agent-rules -->
