# Changelog

記錄重大 bug 修復與其根因，方便之後回頭查。日常小改動看 `git log` 即可，這裡只放值得留存脈絡的項目。

## 2026-09-11

### 修復：`.portfolio-wall-frame` 滾動進場淡入在快速滾動／CTA 跳轉時瞬間出現

**根因：** 一路試了四種機制才定位到真正原因。CSS transition 從頭到尾沒動過（連手動切 class 都沒用）；改用固定時長 GSAP tween 後，靠 markers/onUpdate 證實動畫本身跑得完全正確，但因為觸發點（`top 85%`）太早，正常滾動速度會在動畫播完前就把面板滑過去，播完時人已經看不到了；換成 `scrub`（進度綁滾動位置而非時間）修好了慢速手動滾，但在真實瀏覽器裡用「點擊 CTA + 取樣 opacity/scrollY」直接量出：快速滾動或 CTA 跳轉時，未加 lag 的原始滾動進度會在畫面真正停下來「之前」就已經飽和到 1——不管 `scrub` 的 lag 數值調多大都沒用，因為 `scrollToSectionAligned` 的最終停靠位置，天生就跟這個元素的觸發終點幾乎重合。兩次調整 one-shot 觸發點的百分比（`55%`、`19%`）也從另一個方向撞上同一道牆：沒有任何百分比能可靠分辨「已觸發」跟「畫面還剩幾 px 減速中」。

**修復：** 徹底放棄用滾動位置當觸發依據，改成對 `scroll` 事件做 200ms 防抖動（debounce）——不管使用者用什麼方式、什麼速度到達這個區塊，動畫只在畫面真正靜止之後才播放。額外確認：12 張作品輪播圖片的 decode 也會搶動畫幀，因此 `Loader.tsx` 現在一掛載就預先對全部圖片 `new Image()` + `.decode()`，不受 `loading="lazy"` 限制。

**Commits：** `435ab9d`

---

### 新增：13 個專案頁的 Loading 畫面淺色版

**問題：** `project_01.html`～`project_12.html` 的 loading 遮罩（`.loader`/`.loader-text`/`.loader-animation`）從沒做過 `[data-theme="light"]` 覆寫——訪客若之前在首頁切成淺色模式（透過共用的 `theme` localStorage key），進到任何一個案例研究頁面時，會先看到一個純黑背景、白字白圈疊在上面幾乎看不見的 loading 畫面。

**修復：** 每頁各自補上淺色覆寫，背景用該頁自己的 `--color-{prefix}-dark`（跟頁面其他淺色面板同一套 token），文字/圈圈用共用的 `--color-text`。`project_13.html` 架構獨立（自己的 `project13-tailwind.css`），完全沒有 `data-theme` 切換機制，不在範圍內、未變動。

**Commits：** `22846dd`

---

## 2026-09-03

### 修復：主標 `.hero-h1` gradient-clip 文字偶發疊字殘影

**根因：** `background-clip:text` 漸層文字的祖先元素，只要子節點（split word spans）曾經被獨立 GPU 合成過（進場動畫用 `will-change:transform,opacity`），之後任何一次該漸層的重繪——包含跟動畫完全無關的淺色/深色主題切換——都可能讓字形遮罩失效，畫出重疊殘影。單純清掉 `will-change` 或強制 reflow 只能修好下一次繪製，換主題又會重現。

**修復：** 進場動畫 `onComplete` 時把 `.hero-h1` 的 split-word span 結構整個拆掉，還原成最初的純文字 markup（`unsplitH1()`，見 `HeroSection.tsx`）——沒有曾被合成過的子節點留在 DOM 裡，之後不管重繪幾次都沒有東西可以錯繪。

**Commits：** `cd61956`

---

### 修復：Loading 畫面顯示前，淺色模式先閃一下背景圖

**根因：** `portfolio.css` 要等 `main.tsx` 的 module graph 載完、React 掛載才生效，這段空窗期間 `html` 沒有任何背景色。若使用者上次選的是淺色模式，`data-theme="light"` 在 CSS 載入前就已經被 `index.html` 內的腳本設好，而淺色模式的 `--bg` 是整張 `w_bg.svg` 背景圖——CSS 一到位，圖片先閃入，蓋過它的 Loader 元件卻還沒掛載。

**修復：** `index.html` 加一段 critical inline `<style>`，直接把 `html` 背景釘死成 Loader 本身會用的那個純色（深色 `#0A0912`／淺色 `#EBEFF1`），不管 JS 圖載多久都沒有東西可以閃。

**Commits：** `cd61956`

---

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
