# TODOS

- **P2 BeamsBackground WebGL 降級**：WebGL 不可用時背景全黑。`src/components/BeamsBackground.tsx` 初始化加 try/catch，失敗改 CSS 深色背景 + 靜態 radial-gradient 光暈。
- **P2 Live site 視覺審查**：對部署網站跑 `/design-review`（間距、對比、動效節奏、實機 responsive）。
- **P2 專案頁 Lenis 平滑滾動**（首頁尚未導入 Lenis，先做首頁）：專案頁 `overflow: hidden`，內容在 `.scrollable-area`／`#main-scroller` 內滾，需逐頁把 Lenis `wrapper`/`content` 指向該容器，排除 `.horizontal-tabs`。
