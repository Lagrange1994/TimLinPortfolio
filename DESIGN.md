# Design System — Tim Lin Portfolio

Established: 2026-06-18 via /plan-design-review
Review this file before any UI change. Update it when design decisions change.

---

## Color System

### Primary Palette
```css
--primary: #6C63FF;          /* 紫 — primary accent, CTA, links */
--secondary: #FF6584;        /* 粉紅 — secondary accent, hover states */
--grad: linear-gradient(to right, #6C63FF, #FF6584);
--grad-logo: linear-gradient(45deg, #8A2BE2, #4A00E0, #00D4FF);
```

### Background
```css
--bg: #121212;               /* 深黑 — page background */
--bg-card: #1E1E1E;          /* 元件背景 */
--bg-hover: #2D2D2D;         /* 懸停背景 */
```

### Text
```css
--text: #ffffff;
--text-70: rgba(255, 255, 255, 0.7);
--text-50: rgba(255, 255, 255, 0.62);
--text-30: rgba(255, 255, 255, 0.45);
```

### Border
```css
--border: rgba(255, 255, 255, 0.1);
--border-hi: rgba(255, 255, 255, 0.25);
```

### Rationale
#6C63FF 紫 + #FF6584 粉紅為現有品牌色系。

---

## Typography

| 用途 | Font | Size | Weight |
|---|---|---|---|
| 主標題 h1 | Momo Trust Display | clamp(2rem, 8vw, 6rem) | 700 |
| 副標題 h2 | Momo Trust Display | clamp(1.2rem, 3vw, 2.25rem) | 500 |
| Section heading | Momo Trust Display | 2rem+ | 700 |
| Body text | Quicksand | **16px**（最小值，不低於此）| 400-500 |
| CJK fallback | Noto Sans TC | — | — |

**最低字級規則：** body text 最小 16px，顏色對比度不低於 4.5:1（WCAG AA）。

---

## Component Rules

### Buttons
- Primary CTA: `btn-glass btn-grad` — gradient bg + pill shape
- Secondary: `btn-glass` — glass effect + pill shape
- 觸控目標最小 44×44px
- 不使用 inline style；padding/radius 統一由 CSS class 控制

### Tag Capsule
- 懸停時加強顏色對比（opacity 1.0, border-color rgba(255,255,255,0.3)）
- 加 `transition: all 0.2s ease`
- 若日後改為可點擊，加 `role="button"` + `tabIndex={0}`

### Cards
- Glass card: `rgba(255,255,255,0.05)` bg + 1px border + backdrop-filter blur
- Border glow: COLORS 陣列使用 `['#6C63FF', '#f472b6', '#38bdf8']`

### BeamsBackground
- 光束主色：#4A00E0（配合 primary 紫色系）
- WebGL 失敗時靜默隱藏 canvas，不 crash

---

## Motion Principles
1. Hero entrance：GSAP split text + figure float-up（已有，保留）
2. Scroll-linked：section stagger reveal（已有，保留）
3. Hover/reveal：border glow、btn shimmer（已有，保留）
最多同時 3 個視覺動態焦點；避免所有元素同時動。

---

## Layout
- Max-width: 1440px
- Section padding: 80px 48px（desktop），40px 20px（mobile）
- Hero: 50% / 50% split（desktop），stack（mobile）
- Breakpoints: 1024px（tablet/mobile 分界），768px（mobile）

---

## Accessibility
- Body font 16px 最小
- 觸控目標 44px 最小
- 裝飾性動畫 canvas 加 `aria-hidden="true" role="presentation"`
- 捲動複製元素加 `aria-hidden="true"`
- AI Flow cards 有 `role="button"` `tabIndex={0}` `aria-expanded`

---

## Sections Reference

| Section | 視覺主角 | Section 的唯一工作 |
|---|---|---|
| Hero | Tim Lin figure + 名字 | 建立身份認同，驅動向下滾動 |
| Skills / Process | AI Flow bento + Process cards | 展示工作方法 |
| Portfolio | Bento grid 作品卡 | 展示作品 |
| About | 個人 widgets | 建立信任 |
| Contact | 聯繫表單 | 驅動詢問 |
