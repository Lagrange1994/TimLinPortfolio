# Tim Lin Portfolio

UI/UX 設計師作品集網站。Vite + React，部署在 Vercel。

## 架構

- **主頁** (`index.html`) — React SPA。`<div id="root">` 由 `src/main.tsx` 掛載 `src/App.tsx`，元件在 `src/components/`，i18n 在 `src/context/LangContext`。
- **專案頁** (`project_01.html` ~ `project_13.html`) — 13 個獨立的 Vite MPA entry，各自對應 `src/projects/project_XX.jsx`（React + GSAP）。
- **AI 聊天 API** (`api/chat.ts`) — Vercel serverless function，邏輯共用在 `api/_chat-core.ts`；本機 `vite dev` 透過 `vite.config.js` 的 middleware 模擬同一套邏輯。

詳細規則見 `CLAUDE.md`（不要把主頁當靜態 HTML 改，也不要套用 Next.js 慣例——這兩者都已確認不適用於此專案）。

## Getting Started

```bash
npm install
npm run dev
```

開 [http://localhost:5173](http://localhost:5173)（被佔用時 Vite 會自動換下一個 port，終端機會顯示實際網址）。

## Scripts

```bash
npm run dev       # Vite dev server
npm run build     # 輸出到 dist/（vercel.json 的 outputDirectory）
npm run preview   # 本機預覽 production build
npm run lint       # ESLint
npm test          # Vitest（jsdom），見 TESTING.md
```

## Deploy

Push 到連接 Vercel 的分支即自動部署。`vercel.json` 設定 `outputDirectory: dist`。
