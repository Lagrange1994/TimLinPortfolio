# Changelog

重大 bug 的根因與修法。日常改動看 `git log`。

## 2026-09-11

- **Portfolio wall 進場在快速滾動／CTA 跳轉時瞬間出現**：任何以滾動位置為觸發（固定 tween、`scrub`、調百分比）都分不出「已到位」與「還在減速」，因 `scrollToSectionAligned` 停點與觸發終點重合。改為 `scroll` 200ms debounce，畫面靜止才播；`Loader.tsx` 預先 decode 12 張輪播圖避免搶幀。`435ab9d`
- **專案頁 loader 淺色版**：project_01～12 loader 缺 `[data-theme="light"]` 覆寫，淺色訪客看到黑底。各頁補覆寫（`--color-{prefix}-dark` + `--color-text`）；project_13 無主題切換，未動。`22846dd`

## 2026-09-03

- **`.hero-h1` 漸層字疊字殘影**：split-word span 曾被 GPU 合成過，之後任何重繪（含切主題）都可能錯繪 `background-clip:text`。進場 `onComplete` 時 `unsplitH1()` 還原純文字。`cd61956`
- **Loader 前淺色背景圖閃現**：`portfolio.css` 載入前 `html` 無背景、淺色 `--bg` 是 `w_bg.svg`。`index.html` critical inline style 釘死 loader 色（`#0A0912`／`#EBEFF1`）。`cd61956`

## 2026-06-20

- **聊天 widget 不跟語言切換**：文案寫死中文。新增 `chat_*` i18n key，問候語 render 時取值。`edf0ca2`
- **`chat-core.test.ts` 打真實 Gemini API**：mock `@google/genai`、注入假 key、改用真正匹配的測資。`49b97b4`
- **project_13 整頁空白**：`registerPlugin(ScrollTrigger)` 未 import → ReferenceError 卸載整棵樹。補 import；`eslint.config.mjs` 對 `**/*.jsx` 重開 `no-undef`。`a1620ec` `6c9564e`
- **Back to Portfolio 導錯頁**：`history.length` 是整個分頁的歷史。改固定 `/#portfolio`；`Navbar.tsx` 對 `#portfolio` 讓位給 `PortfolioSection` 的 sessionStorage 還原，判斷改用只讀的 `portfolioExpanded`（避開 StrictMode 雙跑時 key 已被清）。`2e2d1f9` `d898364` `9733e32` `bba1622`
- **測試框架**：Vitest + Testing Library + GitHub Actions CI，見 `TESTING.md`。`6d590e1`
