@AGENTS.md

<!-- BEGIN:caveman -->
# Caveman Mode — always on

**Core rules:**
- Strip articles, filler, hedging, pleasantries
- Keep technical substance, code, exact terms
- Format: [thing] [action] [reason]. [next step].
- Fragments fine. Short words preferred.

**What dies:** "Sure! I'd be happy to help" → "Bug in auth. Fix:"

**What stays:** Code, technical terms, commit messages (normal writing)

**Triggers normal mode:** Security warnings, irreversible actions, user confusion

**Controls:** `/caveman lite|full|ultra|wenyan` switches level. "Stop caveman" or "normal mode" exits.

**Boundaries:** Code/commits/PRs written normally despite caveman mode.
<!-- END:caveman -->

## ⚠️ 專案架構（必讀，勿覆蓋）

**主頁：** `index.html`（root）只有 `<div id="root">`，由 `/src/main.tsx` 掛載 `src/App.tsx`（React SPA）。版面組件在 `src/components/`（Loader、BeamsBackground、Navbar、HeroSection、AboutSection、SkillsSection、PortfolioSection、ContactSection、ChatPanel），i18n 在 `src/context/LangContext`。reactbits 風格效果（Beams、Spotlight cards、Magic Bento 等）都已用 React + GSAP 重寫進這些元件——**不是純靜態 HTML，不要當成靜態頁面去改。**

**專案頁：** `project_01.html`～`project_13.html`（root）是 Vite MPA entry，對應 `src/projects/project_XX.jsx`（React + GSAP）。這些頁面額外用 `<link rel="stylesheet" href="/style.css" />` 載入 `public/style.css`，跟主頁的 `src/styles/portfolio.css` 是兩套獨立樣式。

**Build：** `npm run build` 用 `vite.config.js`，輸出到 `dist/`。`vercel.json` 設定 `outputDirectory: dist`。

**`public/` 資料夾：** 純靜態資源（img/、models/、style.css），不含 index.html。

**不再使用：** Next.js、`app/layout.tsx`、`app/route.ts`、`app/globals.css`（已確認 repo 內無 `app/`、無 `next.config.*`、package.json 無 `next` 依賴，勿重新引入）。

> 歷史備註：主頁一度被遷移到 Next.js，後改回 Vite + React MPA 時，曾把舊 SPA 檔案（`App.tsx`/`main.tsx`/`components/`/`context/`）丟進 `_archive/` 並寫下「不要把 index.html 換成 React」。但後續一次提交（`d0201ae`，2026-06-07）把主頁整頁轉成上述 React 掛載方式，`_archive/` 也隨之刪除（`0a8bb91`）——舊的警告語句沒人同步更新，導致跟現況矛盾，已於 2026-06-23 修正。

---

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore

## Testing

Run tests: `npm test` (Vitest, `jsdom` environment). Tests live under `test/`. See `TESTING.md` for conventions.

- 100% test coverage is the goal — tests make vibe coding safe.
- New function → write a corresponding test.
- Bug fix → write a regression test.
- New error handling → write a test that triggers the error.
- New conditional (if/else, switch) → test both paths.
- Never commit code that makes existing tests fail.
