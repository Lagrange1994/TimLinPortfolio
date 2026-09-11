# TODOS

Design and UX debt tracked here. Each item surfaced during a gstack review session.

---

## Design Debt

### TODO-1: BeamsBackground WebGL 優雅降級
**What:** 當 WebGL 不支援（隱私模式、舞者瀏覽器、嵌入式 browser），BeamsBackground 現在靜默失敗——背景漆黑、沒有任何備用。
**Why:** UX 設計師的作品集在各種測試工具和客戶電腦上被檢視，WebGL 不保證可用。
**Approach:** 加 try/catch 於 BeamsBackground 初始化；失敗時 canvas 隱藏，改用 CSS 深色背景 + 靜態 radial-gradient 光暈作為降級體驗。
**Files:** `src/components/BeamsBackground.tsx`
**Priority:** P2

---

### TODO-2: Live Site 視覺審查（/design-review）
**What:** 實作完成後，用 /design-review 對實際部署網站做視覺等級審查。
**Why:** /plan-design-review 審查程式碼層級意圖；/design-review 確認實際渲染結果——間距、顏色對比度、動效節奏、real device responsive。
**Approach:** `npm run dev` 本機跑起來後執行 `/design-review`。
**Depends on:** 色彩系統更新 + scroll indicator 實作完成後。
**Priority:** P2

---

### TODO-3: 13 個專案頁導入 Lenis 平滑滾動
**What:** `project_01.html`～`project_13.html` 每頁都是獨立 React root（`project_XX.jsx`），且全部 `body, html { overflow: hidden; }`——不是一般長頁面滾動，而是固定視窗的分栅 UI，內容靠各頁自己的 `.scrollable-area`/`#main-scroller` 內部滾動。首頁那套「Lenis default mode 直接套」的做法在這裡不成立，需要每頁把 Lenis 的 `wrapper`/`content` option 指向該頁的內部滾動容器，等於 13 次各自獨立的配置與驗證。
**Why:** 首頁導入 Lenis 平滑滾動後，若專案頁維持原生滾動，全站手感會不一致——使用者從首頁點進案例研究，滾動感受會突然變回生硬。
**Approach:** 逐頁盤點內部滾動容器（`.scrollable-area`、`#main-scroller` 等命名不統一，需先逐檔確認），比照首頁的 4 行 GSAP ScrollTrigger 整合，但 `wrapper`/`content` 改指向該容器而非 `window`。分栅 UI 本身的橫向 tab 滾動（`.horizontal-tabs`）大機率要排除在 Lenis 之外，只套垂直的 `.scrollable-area`。
**Files:** `project_01.html` ～ `project_13.html`, `src/projects/project_01.jsx` ～ `project_13.jsx`
**Depends on:** 首頁 Lenis 導入先上線、驗證過，此 TODO 才有比對基準。
**Priority:** P2
