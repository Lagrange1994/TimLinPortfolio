# Changelog

記錄重大 bug 修復與其根因，方便之後回頭查。日常小改動看 `git log` 即可，這裡只放值得留存脈絡的項目。

## 2026-06-20

### 修復：AI 聊天 widget（Ask Tim Anything）未跟隨語言切換

**問題：** 整站可切換 EN/繁中，但聊天 widget 的問候語、quick question、placeholder、錯誤訊息全部寫死繁體中文，跟其他元件用的 `useLang()` i18n 系統脫鉤。

**修復：** `src/i18n/translations.ts` 新增 `chat_*` 系列 zh/en key；`ChatPanel.tsx` 全部改用 `t.chat_*`，問候語改成 render 時動態取值（避免鎖死在掛載當下的語言）。

**Commits：** `edf0ca2`

---

### 修復：`test/chat-core.test.ts` 意外打到真實 Gemini API

**問題：** 本機 `.env.local` 有真實 API key，原本的測試沒有 mock `@google/genai`，導致每次跑測試都打真實網路請求——non-deterministic、CI 沒金鑰會直接失敗，其中一筆測資甚至沒對到 regex，只是矇對。

**修復：** Mock `@google/genai`，用 `beforeAll` 注入假的 `GEMINI_API_KEY`，換成真正會匹配 pattern 的測資。

**Commits：** `49b97b4`

---

### 修復：`project_13.html`（Super High Tech CNC 模擬器）整頁空白

**根因：** `<Features>`、`<DesignLanguage>` 元件呼叫 `gsap.registerPlugin(ScrollTrigger)`，但檔案從未 `import ScrollTrigger`，丟出 `ReferenceError`。沒有 Error Boundary 接住，整個 React 樹被卸載，`#root` 變成空字串。這是首頁 Portfolio 第一張卡片連到的頁面。

**修復：** 補上 import，移除元件內重複的 `registerPlugin` 呼叫。

**防再犯：** `src/projects/*.jsx`（13 個分頁）完全沒被 `tsconfig.json` 的型別檢查覆蓋，而 ESLint 的 `no-undef` 又被 `typescript-eslint` 預設關掉（假設 tsc 會做這件事）——這類「用了但沒 import」的 bug 原本完全沒有靜態檢查網。在 `eslint.config.mjs` 對 `**/*.jsx` 重新開啟 `no-undef`，驗證套用後對現有程式碼跑 lint 結果零新增噪音。

**Commits：** `a1620ec`（修復）、`6c9564e`（lint 防再犯）

---

### 修復：「Back to Portfolio」按鈕導向錯誤目的地

**根因：** 13 個分頁的返回按鈕都用 `history.length > 1 ? history.back() : location.href='/'`。`history.length` 是整個瀏覽器分頁的全域歷史堆疊長度，跟「在這網站內怎麼逛」無關——只要分頁歷史裡有任何記錄就會 `history.back()`，落地到瀏覽器歷史上的前一筆，不一定是首頁。

**修復：** 全部改成固定 `location.href = '/#portfolio'`。同時補上首頁對載入時 URL hash 的處理（`Navbar.tsx`）——首頁 Portfolio 區塊是 React 元件，瀏覽器原生的一次性 hash-scroll 在它掛載前就已失效，需要手動處理。

**追加修正（使用者回饋：要還原離開時的精確瀏覽狀態）：** 發現 `PortfolioSection.tsx` 早就內建完整的還原機制——點專案卡片時把瀏覽模式（輪播／展開 bento 格狀檢視）、篩選條件、精確捲動位置存進 `sessionStorage`，掛載時讀回還原。讓 `Navbar.tsx` 對 `#portfolio` 完全讓位給這套既有機制，避免兩邊互搶。

**追加修正（StrictMode race）：** 判斷「該不該讓位」原本用 `portfolioScrollY` 是否存在來判斷，但這個 key 會被 `PortfolioSection` 的還原邏輯一次性 `removeItem()`。React `StrictMode`（dev 模式）會把所有 effect 重複跑兩次，導致 `Navbar` 跑第二輪時看到 key 已被清空，誤判「沒有狀態可還原」，4 秒後 loader 真正消失時把已經還原好的位置/模式蓋掉。改用 `portfolioExpanded`（只讀不刪）當判斷依據，兩輪檢查結果一致。

**Commits：** `2e2d1f9`（修復）、`d898364`（regression test）、`9733e32`（精確捲動還原）、`bba1622`（StrictMode race 修正）

---

### 新增：測試框架 bootstrap

專案原本沒有任何測試。新增 Vitest + Testing Library + GitHub Actions CI，並為上述修復補了對應的 regression test。詳見 `TESTING.md`。

**Commits：** `6d590e1`
