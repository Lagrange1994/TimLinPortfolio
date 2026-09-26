# Design System — Tim Lin Portfolio（主頁）

Established: 2026-06-18 via /plan-design-review
Last audit: 2026-09-27 — 從 `src/styles/portfolio.css` 實際程式碼盤點重寫
Review this file before any UI change. Update it when design decisions change.

**範圍：** 只涵蓋主頁（`index.html` → `src/App.tsx`，樣式 `src/styles/portfolio.css`）。
專案頁（`projects-tailwind.css`、`project13-tailwind.css`）是獨立樣式系統，不在此文件。

**Token 來源：** `portfolio.css` 內三個區塊
- `:root`（L122）— 核心 token（dark 預設）
- `:root[data-theme="light"]`（L376）— 只覆寫會變的 token
- 第二個 `:root`（L1459）— glass / noise token（dark 值；light 值在 L463）

> ⚠️ 本檔的 `L` 行號是 2026-09-27 快照，檔案變動後會漂移，以選擇器搜尋為準。

---

## 1. Color

### 1.1 Brand

| Token | Dark | Light | 用途 |
|---|---|---|---|
| `--primary` | `#6C63FF` | `#5B4FE0` | 主強調、CTA、連結 |
| `--secondary` | `#FF6584` | `#E8496B` | 次強調、hover |
| `--grad` | `#6C63FF → #FF6584` | `#5B4FE0 → #E8496B` | `.btn-grad` 等 |
| `--grad-logo` | `45deg, #8A2BE2, #4A00E0, #00D4FF` | 同 dark | 名字、role line（`--grad-role` = 此值） |
| `--grad-logo-mid` | `#4A00E0` | 同 dark | `.hero-h1` 漸層淡入前的實色 |
| `--line` / `-dim` / `-bdr` | `#06C755` | `#059C48` | LINE 品牌綠 |

**Hero frame glow**（`BeamsBackground.tsx` 的 SVG 漸層四段）

| Token | Dark | Light |
|---|---|---|
| `--frame-glow-base` | `#1C1C1C` | `#F8FBFD` |
| `--frame-glow-2` | `#4A00E0` | `#BA99FF` |
| `--frame-glow-3` | `#8A2BE2` | `#D5ACFB` |
| `--frame-glow-4` | `#E620EC` | `#FECEFF` |

### 1.2 Surface

| Token | Dark | Light | 用途 |
|---|---|---|---|
| `--bg` | `#0A0912` | `url(/img/w_bg.svg) center/cover` | 頁面背景（light 是完整 shorthand，需用 `background:` 不能用 `background-color:`） |
| `--bg-safe` | `#0A0912` | `#F7FAFC` | `--bg` 的純色替身，`body.hero-ready` 前用，避免提早抓圖 |
| `--bg-card` | `#1E1E1E` | `#F7FAFC` | 實心元件底 |
| `--bg-hover` | `#2D2D2D` | `#EFEDF7` | 實心元件 hover |
| `--glass-bg` | `rgba(30,30,30,.5)` | `rgba(247,250,252,.72)` | 一般玻璃卡 |
| `--glass-bg-hov` | `rgba(42,42,42,.65)` | `rgba(247,250,252,.92)` | 玻璃卡 hover |
| `--glass-bg-premium` | `rgba(20,18,28,.72)` | `rgba(247,250,252,.82)` | 重點卡（bento、ai-card） |
| `--glass-blur` | `blur(16px)` | 同 dark | |
| `--noise-grain` | `url(/img/noise-grain.png)` | 同 | 全站單一顆粒貼圖，`background-size: 180px` |

### 1.3 Text

| Token | Dark | Light | Light 對比度（vs `#F7FAFC`） |
|---|---|---|---|
| `--text` | `#FFFFFF` | `#3A3A42` | — |
| `--text-70` | `rgba(255,255,255,.70)` | `rgba(58,58,66,.72)` | ≈ 4.85:1 ✅ AA |
| `--text-50` | `rgba(255,255,255,.62)` | `rgba(58,58,66,.52)` | ≈ 2.84:1 ❌ 刻意取捨的「淡色層」 |
| `--text-30` | `rgba(255,255,255,.45)` | `rgba(58,58,66,.35)` | ≈ 1.94:1 🚫 僅裝飾（icon、分隔、disabled） |

**規則：**
- 使用者必須讀的文字 → `--text` 或 `--text-70`。
- `--text-50` 是設計決策（2026-09 audit 把六處誤用 `--text-30` 的真文字改到這層），要過 AA 就改用 `--text-70`。
- `--text-30` 永遠不放可讀文字。
- 同名 token 在 dark/light 對比度不同，換主題重用前要重新量。

### 1.4 Border

| Token | Dark | Light |
|---|---|---|
| `--border` | `rgba(255,255,255,.10)` | `rgba(23,15,45,.10)` |
| `--border-hi` | `rgba(255,255,255,.25)` | `rgba(23,15,45,.20)` |
| `--glass-border` | `rgba(255,255,255,.10)` | `rgba(23,15,45,.10)` |
| `--glass-border-hov` | `rgba(255,255,255,.22)` | `rgba(23,15,45,.22)` |

### 1.5 Semantic / category（只有 light 定義）

`--badge-purple #7C3AED` · `--badge-cyan #0E7490` · `--badge-amber #B45309` · `--badge-red #DC2626` · `--badge-green #059669` · `--badge-blue #2563EB` · `--badge-primary #4F46E5`

Dark mode 的 badge 用 Tailwind utility（violet/cyan/amber/red/emerald/blue/indigo-300/400），見 `SkillsSection.tsx` `BADGE_COLORS`。`--badge-primary` ≠ `--primary`（前者是通用 indigo 類別）。

### 1.6 卡片色系（color variants）

Bento（About Me）與 AI card（How I Use AI）共用同一條「premium glass」背景規則；變體只設：
- `--card-tint`：頂部光暈色（預設 `rgba(108,99,255,.14)`）
- `--card-tint-shape`：光暈尺寸／位置（預設 `380px 220px at 50% 0%`）
- `border-color`，以及同名變體共用的 `--spotlight-color`（`.bento-cyan` 與 `.ai-cyan` 同一條規則）

`.ai-human` 多一層底部光暈，保留完整 `background-image` 覆寫。

| 變體 | Spotlight 色（bento + ai） | AI glyph（light） |

| 變體 | Spotlight 色（bento） | AI glyph（light） |
|---|---|---|
| default / `ai-focal` | `rgba(108,99,255,.36)` | `#9F7AEA` |
| `cyan` | `rgba(0,212,255,.4)` | `#38BDF8` |
| `purple` | `rgba(19,159,248,.4)` | `#3B82F6` |
| `violet` | `rgba(37,102,240,.4)` | `#6366F1` |
| `human` | `rgba(123,227,181,.4)` | `#10B981` |
| `spectrum` | `rgba(74,0,224,.4)` | `#A855F7` |

AI 詳細面板內另有區域色盤 `.ai-card-detail { --a1 #B58BFF; --a2 #FF7BC8; --a3 #7DB8FF; --a4 #7BE3B5; --a5 #FFC97B }`，分隔線用 `--rule` / `--rule-strong`（dark `rgba(255,255,255,.07/.14)`、light `rgba(23,15,45,.12/.22)`）。`--line` 保留給 LINE 品牌綠，不要拿來當分隔線。
Tech stack spotlight：HTML `rgba(96,165,250,.22)`、JS `rgba(251,146,60,.22)`、React `rgba(108,99,255,.22)`。

### 1.7 Theme 切換規則

- Light 是「Variant A — 紫調延伸」，只覆寫會變的 token；`--grad-logo`、shadow 系統共用。
- **不跟主題的表面：** 桌面 hero panel（Spline + frame glow，但 `--frame-glow-*` 例外有主題化）、navbar pill、staggered menu chrome——視為獨立的深色展示框。
- 切換時 `html.theme-transitioning` 期間做 color crossfade，選擇器清單**按節點數量預算**（不要改回 `*`，手機會凍結）。細節見 `portfolio.css` L265 註解與 `useTheme.ts`。

---

## 2. Typography

### 2.1 Font stacks

| Token | Stack | 載入方式 |
|---|---|---|
| `--font` | `'Quicksand', 'GenSen Rounded TW', 'Noto Sans TC', sans-serif` | Quicksand: Google Fonts 300–700；GenSen: `gensen-faces.css` 自架 + 首屏 preload |
| `--font-heading` | `'Momo Trust Display', 'GenSen Rounded TW', 'Noto Sans TC', sans-serif` | Google Fonts wght 100/400 |
| `--mono` | `'Quicksand', sans-serif` | ⚠️ 名為 mono 但不是等寬字 |
| `--font-code` | `'Geist Mono', ui-monospace, monospace` | Google Fonts wght 400–700；AI Flow 表格、stepper 標籤、word cloud 等程式碼 / 資料 UI |

### 2.2 Type scale（實際使用）

Heading（流體）：

| 用途 | Size |
|---|---|
| Hero h1 | `clamp(2rem, 8vw, 6rem)` |
| Section headline | `clamp(2.5rem, 5.6vw, 4.25rem)` |
| Sub headline | `clamp(1.75rem, 2.8vw, 2.25rem)` |
| Mobile headline | `clamp(1.5rem, 6.5vw, 2rem)` |

Body / UI（固定 px，依使用次數）：

`13px ×27` · `11px ×27` · `12px ×21` · `10px ×21` · `14px ×16` · `15px ×10` · `16px ×7` · `12.5px ×6` · `13.5px ×6` · `10.5px ×6` · `17px ×5` · `9px / 9.5px ×4` · `20px ×4` · 其他 30+ 種零星值

**Weight：** 600（31）· 700（22）· 500（19）· 400/300/100 零星
**Letter-spacing：** 大寫標籤 `.12–.14em`；小字 `.04–.06em`；標題 `-.01 / -.02em`

**規則（沿用）：** body 內文 16px 起跳（`body { font-size: 16px }`）；10–13px 限用於 badge、chip、meta、code 等 UI 標籤。

---

## 3. Shape

### 3.1 Radius

| 層級 | 值 | 用在 |
|---|---|---|
| Pill | `9999px`（另有 `999px ×4`、`99px ×1` 同義寫法） | 按鈕、`.pill`、`.tag-capsule` |
| Circle | `50%` | 頭像、dot、icon 按鈕 |
| Card XL | `48px` + `corner-shape: squircle` | ≥768px 所有非 Portfolio 卡片：`.bento-card`、`.process-card`（基準）、`.tech-item`、`.mcp-card`、`.ai-card`（`--ai-card-r`）、profile card（`--card-radius`）、`.contact-card`/`.faq-card`、`.cta-strip`、`.line-banner`。同寬度一律同值，細條卡也不例外 |
| Card mobile | `20px` + `corner-shape: round` | ≤767px 同一批卡片，hover 陰影層（`.bento-shadow`、`*-wrap::after`、`.card-hover-shadow`）也要一起改 |
| M | `16px` | 中型面板 |
| S | `8px` / `10px` / `12px` | 小元件 |
| XS | `4px` / `2px` | code、bar |
| Chat bubble | `7px 7px 7px 2px` | |

**Squircle 規則：** 用原生 CSS `corner-shape: squircle`，不用 JS clip-path（clip-path 只切 fill，不切 border/bg）。手機卡片 clip-path 與 `corner-shape: superellipse` 都試過並因實機回歸放棄，改回純 radius。

### 3.2 Elevation

**Dark — 雙層陰影系統**（光源左上，陰影往右下；色為 bg+primary 混出的暗紫灰，不用純黑）

| Token | 用途 |
|---|---|
| `--shadow-near: 20,16,30` / `--shadow-far: 10,9,16` | RGB 通道，搭配 `rgba(var(--shadow-near), a)` |
| `--card-shadow-sm` | 小元件（pill） |
| `--card-shadow-md` | 卡片靜止 |
| `--card-shadow-hover` | ⚠️ 已定義未使用 |
| `--card-shadow-selected` | ⚠️ 已定義未使用（含 1px brand ring） |
| `--card-shadow-ai-hover` | 卡片 hover（大 blur + 紫光暈） |
| `--card-shadow-ai-hover-tight` | 在 `overflow:hidden` 軌道內的卡片 hover |
| `--card-edge` | `inset 0 1px 0 rgba(255,255,255,.08)` 頂部高光，疊在所有卡片陰影上 |

**Light — Neumorphism**（neumorphism.io 以 `#F7FAFC` 產出）

| Token | Reach | 用途 |
|---|---|---|
| `--neu-raised` / `-hover` | 26 / 35px | bento、ai、line-banner |
| `--neu-raised-sm` / `-hover` | 14 / 20px | tech-item、tag-capsule、slink |
| `--neu-raised-tight` / `-hover` | 11 / 14px | `.process-card`（在 12px padding 的 overflow 軌道內） |

**規則：** 卡片在 `overflow:hidden` 容器內 → 用 `-tight` 變體，否則 blur 被切成方框。

### 3.3 Blur

`--glass-blur: 16px`（token）· 實際另有 `6px ×9`、`10px ×6`、`8px ×3`、`1rem ×2`（bento/ai-card）、`40–50px`（光暈）。

---

## 4. Motion

### 4.1 Easing tokens

| Token | 值 | 用途 |
|---|---|---|
| `--switch-ease` | `cubic-bezier(0.32, 0.72, 0, 1)` @ 0.38s | 所有 switch、主題 crossfade（取代 Motion spring） |
| `--theme-breathe-ease` | `cubic-bezier(0.37, 0, 0.63, 1)` @ `--theme-breathe-dur: 0.68s` | 只給手機選單的主題呼吸淡變；`useTheme.ts` timeout 依此推算 |

**未 token 化但常用：**
- `cubic-bezier(0.16, 1, 0.3, 1)`（expo-out）×14
- `cubic-bezier(.2, .7, .2, 1)` ×4 — ai-card transform
- `cubic-bezier(.22, .61, .36, 1)` / `(.22, 1, .36, 1)` 零星
- `cubic-bezier(0.4, 0, 0.2, 1)` — `.btn-glass`
- 關鍵字 `ease` ×117、`linear` ×112（多為無限迴圈動畫）

### 4.2 Duration

- Micro（hover、色彩）：`0.15s` · `0.2s` · `0.25–0.3s` · `0.38s`
- Reveal：`0.5s` · `0.6s` · `1s`
- Ambient loop：`2s` · `3s` · `4–6s` · `18s` · `25s` · `35s`（marquee）

### 4.3 Principles（沿用）

1. Hero entrance：GSAP split text + figure float-up
2. Scroll-linked：section stagger reveal
3. Hover/reveal：border glow、btn shimmer、spotlight
- 最多同時 3 個視覺動態焦點。
- GSAP 效果一律包 `gsap.context` + `ctx.revert()`（StrictMode 開啟中）。
- 每個動畫都要有 `prefers-reduced-motion: reduce` 分支（目前 21 處）。

---

## 5. Layout

- Content max-width：`1440px`
- Section padding：`80px 48px`（desktop）→ `60px 32px` → `36px 16px`
- Nav 高度：`--nav-h`（預設 72px，`Navbar.tsx` 即時同步）
- **4K scale lock：** `>1920px` 螢幕鎖成 1920 設計尺寸（`html { zoom }` + `scaleLock.ts`），用 `--z: calc(100vw / 1920px)` 補償 vh/vw 單位。新寫 `vh/vw/svh` 時要乘 `--z`。

### Breakpoints（實際使用）

| 主要 | 次要（零星） |
|---|---|
| `767 / 768px` — mobile ↔ tablet | `480px` |
| `1024 / 1025px` — tablet ↔ desktop | `640 / 641px`、`720px`、`960px` |
| `1921px` — 4K scale lock | `max-aspect-ratio: 16/9` |

輸入能力：`(any-hover: none)`；**不要用 `pointer: coarse`**（Windows 觸控+滑鼠混合機誤判），觸控行為改在 JS 以 touchstart 判斷。

### Z-index（實際使用，無 token）

`-1…-4` 裝飾層 · `0–5` 卡片內部堆疊 · `10–30` 浮層 · `100–500` nav/menu · `9000–10001` loader / overlay

---

## 6. Components

### Buttons
- `.btn-glass` — 玻璃底 `rgba(255,255,255,.05)` + `blur(10px)` + 1px 白邊 + 掃光 `::before`；`min-height: 44px`；14px / 500；hover `translateY(-2px) scale(1.02)`
- `.btn-glass.btn-grad` — Primary CTA，底為 `--grad` + 粉紅光暈
- Light mode 有獨立覆寫（`.btn-glass:not(.btn-grad)`）
- 不用 inline style；padding/radius 由 class 控制

### Cards

| Class | 底 | 邊框 | 圓角 | 陰影（dark / light） |
|---|---|---|---|---|
| `.bento-card` | `--glass-bg-premium` + grain + 光暈 | `rgba(255,255,255,.14)` | 48 squircle | md / `--neu-raised` |
| `.ai-card` | 同上 | 同上 | `--ai-card-r` 48 | md+edge → ai-hover / `--neu-raised` |
| `.process-card` | `--glass-bg` | `--glass-border` | 48 squircle | 自訂 contact / `--neu-raised-tight` |
| `.tech-item` | `--glass-bg` | — | 48 squircle | md+edge / `--neu-raised-sm` |
| `.border-glow-card` | `BorderGlow.jsx` 外殼（process card 用）：`--card-bg` 實色 + 內部 `.bg-spotlight` | `rgb(255 255 255/14%)` | 同 `.process-card` | 自訂 contact |
| `.grid-card.mb-glow` | Magic Bento 光暈（`--glow-x/y/intensity/radius`） | | | |

**共用滑鼠互動（About Me 規格，How I Use AI / My Design Process 沿用）**
- 邊框高光環：`.sc-card::after` 或實體 `.sc-ring`（1px、280px 白色 radial，隨 `--sc-x/y`，hover 淡入 .35s）
- 背景白光：`.sc-overlay`（600px、8% 白，隨 `--sc-x/y`）
- 背景色光：`.card-spotlight::before` 或實體 `.spotlight-layer`（`--spotlight-color`，隨 `--mouse-x/y`，hover 60%）
- 卡片本身有 `overflow:hidden` 以外需求（外側陰影、radar 環）時用實體元素版本
- hover 大陰影：共用「HOVER SHADOW LAYER」規則（`.bento-shadow`、`.card-hover-shadow`、各 wrapper `::after`），只淡入 opacity
- light mode 全部關閉

### Chips / Pills
- `.pill` — `--glass-bg` + `--glass-border`，`5px 14px`，9999px
- `.tag-capsule` — `7px 14px`，9999px，hover 提高對比
- Badge — 見 §1.5

### BeamsBackground / Hero
- 光束主色 `#4A00E0`；WebGL 失敗靜默隱藏 canvas
- Spline figure：1080 原生 canvas + CSS transform 縮放

---

## 7. Accessibility

- Body font 16px 最小
- 觸控目標 44×44px 最小
- 文字對比度依 §1.3 tier 規則
- 裝飾性 canvas `aria-hidden="true" role="presentation"`
- 捲動複製元素 `aria-hidden="true"`
- AI Flow cards：`role="button"` `tabIndex={0}` `aria-expanded`
- 所有動畫提供 `prefers-reduced-motion` 分支

---

## 8. Sections Reference

| Section | 視覺主角 | Section 的唯一工作 |
|---|---|---|
| Hero | Tim Lin figure（Spline）+ 名字 | 建立身份認同，驅動向下滾動 |
| Skills / Process | AI Flow bento + Process cards | 展示工作方法 |
| Portfolio | Bento grid 作品卡 / wall marquee | 展示作品 |
| About | Profile card + orbit + widgets | 建立信任 |
| Contact | 聯繫表單 + LINE banner | 驅動詢問 |

---

## 9. Known Debt（2026-09-27 盤點）

不影響畫面，但會讓系統越來越難維護。依建議處理順序：

| # | 問題 | 影響 | 建議 |
|---|---|---|---|
| ~~1~~ | ✅ 2026-09-27 已修：`.ai-card-detail` 分隔線改名 `--rule` / `--rule-strong`，`--line` 只剩 LINE 品牌綠 | | |
| ~~2~~ | ✅ 2026-09-27 已修：Geist Mono 加入 Google Fonts 載入，24 處硬編碼改用 `--font-code` | | |
| 3 | `--mono` 其實是 Quicksand | 名稱誤導 | 改名或改成真等寬字 |
| 4 | 硬編碼品牌色：`#6C63FF` ×29、`rgba(108,99,255,…)` ×41、`#B58BFF`/`rgba(181,139,255,…)` ×21 | light mode 下 `--primary` 已變 `#5B4FE0`，硬編碼處不會跟著變 | 改 `color-mix(in oklab, var(--primary) X%, transparent)` |
| 5 | 117 種不重複 hex、40+ 種 font-size、25+ 種 radius | 無刻度可循 | 收斂成 type scale / radius scale token |
| 6 | ◐ 2026-09-27 部分已修：bento / ai 變體改用 `--card-tint`（§1.6）。仍待處理：tech-item 三色、glyph 色、spotlight 色沒有共用色相 token | 同一色系各處各寫 | 定義 `--hue-cyan/purple/violet/human/spectrum` |
| 7 | 未使用 token：`--card-shadow-hover`、`--card-shadow-selected`、`--glass-shadow(-hov)`、`--line-dim`、`--line-bdr` | 雜訊 | 刪除或啟用 |
| 8 | ◐ 2026-09-27 卡片部分已刪（`.glass-card`、`.philosophy-card`、`.ai-usage-*`、`.level-badge`、`.ai-bullets`、`.sidebar-block` 等）。仍待處理：`.sheet` / `.sheet-tabs` / `.sheet th/td`、`.rrow`、`.phase .ps` | 雜訊 | 刪除 |
| 9 | 頂層選擇器重複定義。2026-09-27 已移除最大的一段（HOW I USE AI / TECH STACK 整段舊版複本，約 260 行），其餘未盤點 | 後段 block 靜默覆蓋前段，改前段會無效 | 逐一合併（改前先搜全檔同選擇器） |
| 13 | **效能修正沒生效**：`.project-card` 註解說刻意不加 `backdrop-filter`（手機上 30+ 張 marquee 卡會耗盡 GPU 記憶體），但 UNIVERSAL GLASS CARD group 又把它加回去 | 手機 Portfolio 區可能仍有記憶體壓力 | 把 `.project-card` 移出 group 的 `backdrop-filter`（會是實際行為變更，需實機驗證） |
| 10 | Breakpoint 混用 `767/768`、`1024/1025`、`640/641` 各自成對，另有 480/720/960 | 邊界 1px 行為不一致風險 | 定出 3 個標準斷點 |
| 11 | Easing 除兩個 token 外全硬編碼 | 同一種「expo-out」出現 3 種寫法 | 補 `--ease-out-expo` 等 token |
| 12 | Badge 色只有 light token，dark 走 Tailwind utility | 兩套來源 | 補 dark 值進 `:root` |

**JS 注入的 CSS 變數**（CSS 內看不到定義，屬正常）：`--chip-glow`、`--word-rotate`（`SkillsSection.tsx`）、`--unload-h`（`useUnloadOffscreen.ts`）、`--sc-x/--sc-y`、`--mouse-x/--mouse-y`（各 section 的滑鼠追蹤）。
