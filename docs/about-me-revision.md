# About Me 修改紀錄與後續建議

> 給新對話用的交接文件。開新對話時貼上：「先讀 `docs/about-me-revision.md`，再繼續 About Me 的修改。」
> 最後更新：2026-11-06。對應 commit：`6281e16` → `74d9f9d`（截至這天都還沒 push 到 origin/main）。

---

## 1. 現在的 About Me 長什麼樣

主頁 `#about` 區塊（`src/components/AboutSection.tsx`）。內容：一個 headline、一行 lead，下面是一組 bento 卡片。

### 卡片與內容

| 卡片 | 內容 | 翻譯 key（`src/i18n/translations.ts`，zh / en 各一份） |
|---|---|---|
| Headline | 「讓複雜系統變得可被掌控的產品設計師，兼具 3D 互動開發與 AI 工作流整合能力」 | `about_headline` |
| Lead | 我替警政、醫療與公部門設計每天要用的系統：先到現場看人怎麼用，再把龐雜流程刪減、整理成一眼看懂的介面，一路做到開發交付。 | `about_lead` |
| 照片卡 | ProfileCard（3D tilt） | — |
| **Systems Design** | 4 行分類：研究 / 減法 / 規則 / 工具（每個小標是帶 icon 的膠囊） | `about_intro1_label`、`about_intro1_short` |
| ↳ 作品標籤 | 新竹警政 App（project_02）、高雄報修系統（project_03）、北醫學習護照（project_11） | `about_tags_systems` + `SYSTEMS_LINKS` |
| **Context-Driven Visuals** | 3 行分類：原則 / 3D / 平面 | `about_intro2_label`、`about_intro2_short` |
| ↳ 作品標籤 | CNC 3D 模擬器（project_13）、存保理財遊戲（project_12） | `about_tags_visuals` + `VISUAL_LINKS` |
| Years In Practice | 5+ | `data-value="5"` |
| Projects Delivered | 13+（= `PROJECTS.length`） | `data-value="13"` |
| Service Domains | 6；公部門・醫療・交通 / 金融・娛樂・製造；CardSwap 6 張封面，每張左上有產業標籤 | `about_domains_summary`、`about_domain_labels`、`DOMAIN_COVERS` |
| AI-Powered Workflow | 客戶從 LINE 或表單送出需求，Make 交給 Claude 摘要分類、寫入 Google Sheets，再分流回覆；第一次通話前，我已掌握預算與時程。+ 流程圖 + 「看完整流程 →」膠囊按鈕（捲到 `#my-skills`） | `about_ai_short`、`about_ai_more` |

**兩張技能卡的分類內容（中文）**

- Systems Design
  - 🔍 研究｜到現場場勘，訪談第一線使用者
  - ⛶ 減法｜拿掉非核心功能，把大螢幕後台收進手機
  - ↗ 規則｜變成看得見的狀態：報修五節點、自評與師評雷達圖
  - ◆ 工具｜**Figma**、**Adobe XD** 設計；讀寫 **HTML / CSS**、**React / Vue**，和工程師對規格
- Context-Driven Visuals
  - 🎨 原則｜視覺跟著環境走：工廠沿用機台燈號，理財遊戲用莫蘭迪色減壓
  - ⬡ 3D｜**Blender**、**Spline**、**Dora**，**React + WebGL** 上線
  - 🎞 平面｜**Photoshop**、**Illustrator**、**Lightroom**

圖示（Phosphor bold，已在 icon subset 裡）：研究 `magnifying-glass`、減法 `frame-corners`、規則 `flow-arrow`、工具 `sketch-logo`、原則 `palette`、3D `cube`、平面 `film-strip`。英文標籤：Research / Subtract / Rules / Tools、Principle / 3D / Graphics。

**Service Domains 的分類依據**

| 類別 | 作品 |
|---|---|
| 公部門 | 警政 4 案（01–04）、新竹縣環保局（09）、石門水庫（07）、恆春航空站（10）、新竹市動物園（05） |
| 醫療 | 北醫學習護照（11） |
| 交通 | 桃園捷運 App（06） |
| 金融 | 中央存保理財遊戲（12） |
| 娛樂 | Love Two 直播 App（08） |
| 製造 | CNC 3D 模擬器（13） |

### 版面（grid）

- **桌機（≥1025px）：** `.about-grid` 有 5 欄。
  - 欄寬是 `2fr 1.7fr 1.7fr 1.3fr 1.3fr`。
  - 區域是 `"headline…" "photo intro intro stats stats" "photo workflow workflow workflow workflow"`。
  - 中間是兩個獨立欄位，彼此的列高不必對齊：
    - `.about-col--intro`：Systems Design 和 Visuals 上下平分（`1fr 1fr`）。
    - `.about-col--stats`：Years 和 Projects 一列，Domains 一列，也是 `1fr 1fr` 平分，所以三張數字卡一樣高（1440 寬時都是 258px）。
- **平板（768–1024px）：** 24 欄的 grid，`.about-col` 設成 `display: contents`，數據兩列也平分（`auto auto auto 1fr 1fr`）。
- **手機（≤767px）：** 2 欄的 grid，`.about-col` 設成 `display: contents`，數據兩列平分（`auto auto auto auto 1fr 1fr auto`）。
- **數字大小：** 三個數字都用同一組 clamp 大小（`.stat-num-wrap` / `.digit-col-inner span`）。**Service Domains 的數字不能用 cqh 依卡片高度縮放**，原因見第 5 節。

---

## 2. 作品分析的結論（敘事的來源）

這些結論來自 13 個作品頁的文案和章節結構（`src/projects/project_XX.jsx` 的 TRANSLATIONS），是改寫 About 敘事的依據。之後改 About 的內容應該沿用這套說法。

**擅長的事**

1. **環境決定視覺**（最獨特）
   - 指揮中心用深色、高對比（01）。
   - 夜間巡邏用高對比、單手操作（04）。
   - 工廠用 g100 暗色主題，顏色對應機台燈號（13）。
   - 理財遊戲用莫蘭迪色降低焦慮（12）。
   - 直播用青綠色，跟競品的紅粉做出區隔（08）。
   - 航空站用漸層藍，傳達度假感（10）。
2. **先刪減再設計**
   - 把大螢幕後台精簡成 App（02）。
   - 拿掉淹水監測，專注在設備妥善率（03）。
   - 醫院電腦舊，放棄動畫、改用輕量圖表（11）。
3. **把規則變成看得見的狀態**
   - 報修流程的 5 個節點（03）。
   - 申請動線：須知 → 資格 → 日期 → 表單（07）。
   - 自評與師評疊在一起的雷達圖（11）。
   - 權限分級（09）、GPS 防代簽（04）。
4. **從需求做到交付**
   - 場勘與訪談（01、04、09）。
   - GIS 和車牌辨識的資料流（01）。
   - 定 Mapbox / WebSocket 規格（01）。
   - 自己寫前端（11）。
5. **會考慮商業目標**
   - 原生商城、活動閉環（06）。
   - 遊戲化任務提高留存，運用 Zeigarnik 效應（08）。

**作品頁的資訊安排**
- 固定結構：背景 → 3 個痛點 → 4 步流程 → 3 個亮點 → 介面展示。
- 首屏是產品在真實場景裡的情境照，配一句比喻當標語。
- 每個案子有自己的主色，常用 Before / After 對照。

---

## 3. 已完成的修改（依 commit）

| Commit | 內容 |
|---|---|
| `6281e16` | 卡片改用短文案（`about_*_short`）；加作品標籤（膠囊連結）；AI 卡加「看完整流程 →」，放在流程圖下方；Projects 改成 13；bento 文字 15px |
| `1727e85` | 拿掉 Industry Focus 卡，產業名稱改成 Service Domains 封面上的標籤；中間改成兩個獨立欄；Domains 數字改回共用大小 |
| `b907a43` | 技能卡寫進軟體名稱；彩色文字改成粗體；拿掉「直播 App」標籤 |
| `73f87b0` | 依作品分析重寫敘事：lead、Systems Design、Visuals 改名為 Context-Driven Visuals、標籤改成文案裡提到的例子、AI 卡加上成果 |
| `522cf62` | 兩張技能卡改成分類分行，小標是帶 icon 的膠囊；Service Domains 精簡成 6 類（公部門合併）；三張數字卡等高 |
| `74d9f9d` | 修缺字：用原始 OTF 重新產生 GenSen 字型檔（1,232 → 1,360 字），首頁小字型檔跟著更新，並加測試 |

---

## 4. 使用者的偏好與已否決的方向（不要再提）

- **Zoom 動畫：** About 的 zoom 階段改成「詳細圖文再逐張縮回 bento」→ 使用者覺得效果太差，已經全部還原。不要再做。
- **連結樣式：** MacBook 官網那種藍色文字連結或膠囊 → 改回上一版。
- **「看完整流程」按鈕：** 不要玻璃按鈕，要跟作品標籤一樣的膠囊（`about-proof-tag about-more`），位置在流程圖下方。
- **文字強調：** 不要彩色（`text-primary` / `text-secondary` / `text-purple`），專有名詞和軟體用 `<strong>` 粗體。
- **Service Domains 的數字：** 要跟 Years、Projects 一樣大，不能被壓矮。
- **網格：** 左邊兩張技能卡和右邊三張數字卡的列高可以錯開；需要的話可以重改 grid 的包覆方式。
- **Service Domains 的分類：** 要精簡，公部門合成一類。
- **回覆和文件：** 一律用繁體中文（專有名詞除外）；只貼修改到的程式片段；commit 和 push 都要等使用者說了才做。

---

## 5. 技術地雷

- **聊天機器人的資料來源：** `about_p1`–`about_p3` 不能刪。卡片已經不顯示這三段，但 `api/_chat-core.ts` 拿它們當聊天機器人的背景資料。卡片用的是 `about_*_short`。
- **CRLF 檔案：** `portfolio.css`、`AboutSection.tsx`、`translations.ts` 都是 CRLF。用 Edit 或 node 腳本修改，**不要用 sed**，它會把換行改成 LF。
- **CSS 解析錯誤：** 只要有一個 PostCSS 解析錯誤，Vite 就會回 500，整頁空白。`test/css-parses.regression.test.ts` 會擋這種錯誤。
- **數字滾輪：** 滾輪開始時只量一次格子高度（`col.offsetHeight`）。如果數字大小跟著卡片高度變（cqh），之後尺寸一變就會停在錯的數字。所有數字都要用固定的 clamp 大小。
- **截圖時機：** 截圖時數字常常還在滾，或卡片還在進場動畫。確認數值要用 `dataset.value` 加上實際顯示的那一格，不要只看截圖。
- **區塊會卸載：** LazyUnit 會卸載離畫面超過一個區塊的 section。測試時要先 `scrollIntoView('#about')`，等一下再操作。
- **技能卡的換行：** `≥768px` 時用 `word-break: keep-all`，中文只在標點換行，不會出現「莫｜蘭迪」。手機不用，因為欄太窄，每個逗號都會斷行。平板以上文字欄寬是 84%（膠囊會佔掉一些寬度），也不會蓋到右側的 icon 裝飾。
- **字型（缺字）：** `public/fonts/gensen-rounded-tw/` 裡的「full」檔本身也是子集，文案新增的字可能不在裡面。改完文案、而且 dev server 開著時，依序執行：
  ```bash
  node scripts/collect-gensen-chars.mjs
  ```
  ```bash
  PYTHONIOENCODING=utf-8 uvx --from "fonttools[woff]" python scripts/subset-fonts.py --full
  ```
  - 原始 OTF 放在 `fonts-source/otf/TW`（gitignored）。
  - `test/gensen-faces.test.ts` 會在文案出現字型檔沒有的中文字時失敗。
  - **不要同時跑兩個收字或重建工作**，電腦太忙會讓 lazy-section 和 AI viewer 的測試超時。
- **新 icon：** 用到 subset 裡沒有的 icon class 時，要重跑 `node scripts/subset-icons.mjs`（會從 CDN 下載）。`test/icon-faces.test.ts` 會擋。
- **相關測試：** `test/about-content.test.ts` 鎖住以下這些：
  - 文案短於完整段落。
  - 軟體名稱和粗體。
  - 分類行數、膠囊和 icon。
  - 作品標籤的連結真的存在。
  - 6 個產業。
  - 兩欄結構和等高的數據列。
  - Projects 的數字等於作品數量。

  改內容時要一起更新這些測試。

---

## 6. 還沒做的建議（依優先順序）

1. **Push。** 6 個 commit 還在本機。線上站每次都會多下載 R、M、B 三個完整字型檔（約 900 KB），push 之後才會解決。
2. **照片下方的空白（桌機）。** 照片卡用 `align-self: start`，下面、AI 卡左邊留了一塊空白。可以：
   - 讓照片撐滿整欄；或
   - 在照片下方加一張「接案中 + 聯絡我」卡，這是之前計畫裡的決定 4。
3. **照片卡的接案狀態和聯絡 CTA。** 在照片卡加「接案中」狀態和聯絡按鈕，連到 `#contact`。
4. **聊天機器人的段落跟新敘事不一致。** `about_p1`–`about_p3` 還是舊說法：只提警政、環保、醫院，還用彩色 span。建議依第 2 節的結論改寫，讓聊天機器人的回答跟 About 一致。
5. **Service Domains 數字的位置。** 數字比 Years、Projects 高約 17px（手機差更多），因為那兩張的標題折成兩行。要完全對齊，可以把數字固定在同樣的高度。
6. **手機和平板的細節（原 Phase 3）。**
   - 手機版三個數字是否並排成一列。
   - 手機是否隱藏 CardSwap。
   - 整體間距調整。
7. **原則卡（備選）。** 作品分析的三條原則（環境決定視覺、先刪減再設計、讓規則看得見）目前分散寫在兩張技能卡裡。也可以獨立成一張「Design Principles」卡，放在照片下方的空白，順便解決第 2 點。

---

## 7. 怎麼驗證

- **測試：**
  ```bash
  npm test
  ```
  - 目前 1071 個全部通過。
  - 跑之前確認背景沒有其他重的工作。
- **Lint：**
  ```bash
  npm run lint
  ```
  0 errors，18 個 warnings 是原本就有的。
- **瀏覽器：**
  - 用 gstack browse：`$HOME/.claude/skills/gstack/browse/dist/browse`，搭配 `viewport` / `goto` / `js` / `screenshot --viewport` 等指令。
  - dev server 是 `http://localhost:5173/`（launch.json 裡的「Vite Dev」）。
  - 常用寬度：1920、1440、1280、1024、820、390。深淺主題都要看。
  - 要檢查：
    - 沒有水平捲動。
    - 三張數字卡一樣高、數字一樣大。
    - 兩張技能卡一樣高。
    - 數字最後顯示 5、13、6。
- **字型：** 在首頁從頂部捲到 Contact，`performance.getEntriesByType('resource')` 裡不應該出現 `GenSenRounded2TW-[A-Z]+.woff2`（完整檔）。
