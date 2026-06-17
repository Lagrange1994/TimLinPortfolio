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
