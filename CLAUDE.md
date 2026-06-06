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

**主頁：** `index.html`（root）是靜態 HTML，內含 reactbits 風格效果（Beams、SplitText、Particles、Magic Bento、Spotlight cards）。**不要把它換成 React 版本。**

**專案頁：** `project_01.html`～`project_13.html`（root）是 Vite MPA entry，對應 `src/projects/project_XX.jsx`（React + GSAP）。

**Build：** `npm run build` 用 `vite.config.js`，輸出到 `dist/`。`vercel.json` 設定 `outputDirectory: dist`。

**`_archive/` 資料夾：** 舊版 Next.js React SPA 殘留（components/、App.tsx、main.tsx、context/），**不使用**，勿還原。

**`public/` 資料夾：** 純靜態資源（img/、models/、style.css），不含 index.html。

**不再使用：** Next.js、`app/layout.tsx`、`app/route.ts`、`app/globals.css`、`components/`。

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
