import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.hoisted(() => {
  window.matchMedia ??= ((q: string) => ({
    matches: false, media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

import { processNotchOpts, PROCESS_NOTCH_MQ } from '../src/components/SkillsSection';
import { NOTCH_GAP, NOTCH_TURN } from '../src/utils/notchTokens';

const read = (p: string) => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8').replace(/\r\n/g, '\n');

// Design Process on desktop: the carousel's ⏸ ‹ › row sits in a notch cut
// out of its container's bottom-right corner (a card's action always sits
// there), and notch actions site-wide are solid, high-contrast buttons.
describe('Design Process — ‹ › row in the container notch', () => {
  it('cuts the notch NOTCH_GAP round the row, its inner corner concentric with the round buttons', () => {
    expect(processNotchOpts({ width: 144, height: 40 }, 48)).toEqual({
      nw: 144 + NOTCH_GAP, nh: 40 + NOTCH_GAP, r: 48, nr: NOTCH_TURN, nf: 20 + NOTCH_GAP, side: 'right',
    });
  });

  it('only where the ‹ › row shows (desktop)', () => {
    expect(PROCESS_NOTCH_MQ).toBe('(min-width: 1025px)');
    const css = read('src/styles/portfolio.css');
    const block = css.slice(css.indexOf('.section-band:has(.process-scroll-wrap--process[data-notch])'));
    // the band moves from the section into the container
    expect(block).toMatch(/^\.section-band:has\(\.process-scroll-wrap--process\[data-notch\]\) \{ border-image: none; \}/);
    expect(block).toMatch(/\.process-scroll-wrap--process\[data-notch\]::before \{[\s\S]*?background: var\(--band\);\s*clip-path: var\(--pn-clip\);/);
    expect(block).toMatch(/\.process-scroll-wrap--process\[data-notch\] \.process-swipe-nav \{ right: 0; bottom: 0; \}/);
  });

  it('notched cards keep their glass fill and tone outline (opaque fill + no stroke tried, reverted)', () => {
    const css = read('src/styles/portfolio.css');
    expect(css).not.toMatch(/\.about-notch > \.has-notch \{\s*--notch-stroke: transparent;/);
    // NotchCard strokes the outline with --notch-stroke when it's set
    expect(read('src/components/NotchCard.tsx')).toContain("cs.getPropertyValue('--notch-stroke').trim() || cs.borderTopColor");
  });

  it('notch actions keep their own soft buttons in both themes (solid ones tried, reverted)', () => {
    const css = read('src/styles/portfolio.css');
    expect(css).not.toContain('background: #EEF0F7;');
    expect(css).not.toContain('background: #15131F;');
  });
});

// How I Use AI on desktop: the stage back as a solid card, its ⌃ ⌄ pair in a
// bay cut into its left edge, as the old notched stage had it (phones keep
// the bare layout).
describe("How I Use AI — ⌃ ⌄ in the solid stage's left-edge bay", () => {
  it('leftBayPath runs down the left edge, into the bay and back out', async () => {
    const { leftBayPath } = await import('../src/utils/notchPath');
    const d = leftBayPath(400, 300, { r: 0, shape: 'round', bay: { top: 100, bottom: 200, w: 60, ri: 0, ro: 0 } });
    const pts = d.replace(/[MLZ]/g, ' ').trim().split(/\s+/).map(Number);
    const xy = [] as [number, number][];
    for (let i = 0; i < pts.length; i += 2) xy.push([pts[i], pts[i + 1]]);
    expect(xy).toEqual([[0, 0], [400, 0], [400, 300], [0, 300], [0, 200], [60, 200], [60, 100], [0, 100]]);
  });

  it('desktop only; the column sits flush with the stage edge, in the bay', async () => {
    const { AI_STAGE_MQ } = await import('../src/components/SkillsSection');
    expect(AI_STAGE_MQ).toBe('(min-width: 961px)');
    expect(read('src/components/SkillsSection.tsx')).toContain('const d = leftBayPath(w, h, {');
    const css = read('src/styles/portfolio.css');
    expect(css).toMatch(/\.ai-viewer\.is-stage\[data-av-notch\]::before \{[\s\S]*?background: #1A1825;\s*clip-path: var\(--av-clip\);/);
    expect(css).toMatch(/\.ai-viewer\.is-stage\[data-av-notch\] \.ai-viewer-nav \{\s*margin-left: calc\(-1 \* clamp\(32px, 3\.4vw, 48px\)\);/);
  });
});

// Both notched containers carry the hero frame's 1px line along their outline.
describe('notched containers — the hero frame border', () => {
  it('strokes the same path the fill is clipped to', () => {
    const tsx = read('src/components/SkillsSection.tsx');
    expect(tsx).toContain("setOutline(w.querySelector<SVGSVGElement>(':scope > .pn-outline'), ww, wh, d);");
    expect(tsx).toContain("setOutline(v.querySelector<SVGSVGElement>(':scope > .av-outline'), w, h, d);");
    const css = read('src/styles/portfolio.css');
    // the hero's rgba(255,255,255,.4); 2px, the svg clipped to the path → 1px inside
    expect(css).toMatch(/\.stage-outline path \{ stroke: rgba\(255, 255, 255, 0\.4\); stroke-width: 2px; \}/);
    expect(css).toContain('> .pn-outline { display: block; clip-path: var(--pn-clip); }');
    expect(css).toContain('> .av-outline { display: block; clip-path: var(--av-clip); }');
  });
});

describe('Design Process — the notch buttons keep their shadows', () => {
  it('clips the sliding cards to the box but reaches 16px out round the notch', () => {
    const css = read('src/styles/portfolio.css');
    const rule = css.match(/\.process-scroll-wrap--process\[data-notch\] \{[\s\S]*?\n      \}/)![0];
    expect(rule).toContain('overflow: visible;');
    expect(rule).toMatch(/calc\(100% \+ 16px\) calc\(100% - var\(--pn-nh, 52px\)\)/);
    expect(read('src/components/SkillsSection.tsx')).toContain("w.style.setProperty('--pn-nw', `${opts.nw}px`);");
  });
});

describe('How I Use AI — phones get the solid stage too', () => {
  it('fills and borders the compact frame like the desktop stage', () => {
    const css = read('src/styles/portfolio.css');
    expect(css).toContain('.ai-viewer.is-bare.is-stage { padding: 16px; background: #1A1825; border: 1px solid rgba(255, 255, 255, 0.4); }');
  });
});

describe('Design Process — the cards’ rim matches the container border', () => {
  it('dark theme: a 1.5px .4 white border on the cards and badges', () => {
    const css = read('src/styles/portfolio.css');
    expect(css).toMatch(/\.process-scroll-wrap--process\[data-notch\] :is\(\.process-card, \.process-step-badge\) \{\s*border-width: var\(--rim, 1\.5px\) !important;\s*border-color: rgba\(255, 255, 255, 0\.4\) !important;/);
    // the hover cursor ring lies exactly on that rim
    expect(css).toMatch(/\.process-card > \.sc-ring \{\s*inset: calc\(-1 \* var\(--rim, 1\.5px\)\);\s*padding: var\(--rim, 1\.5px\);/);
    expect(read('src/components/SkillsSection.tsx')).toContain("w.style.setProperty('--rim', `${rimPx()}px`);");
  });

  it('the container stroke takes the same device pixels as that snapped border', async () => {
    const { rimPx } = await import('../src/components/SkillsSection');
    expect(rimPx(1)).toBe(1);           // 1.5px → 1 device px
    expect(rimPx(1.5)).toBeCloseTo(4 / 3); // 2.25 → 2 device px
    expect(rimPx(2)).toBe(1.5);         // 3 device px
    expect(read('src/components/SkillsSection.tsx')).toContain('path.style.strokeWidth = `${rimPx() * 2}px`;');
  });
});

describe('notched cards — the hover radar ring', () => {
  it('is drawn outside the clip, along the outline', () => {
    const tsx = read('src/components/NotchCard.tsx');
    expect(tsx).toContain('className="notch-radar"');
    expect(tsx).toContain("rd.querySelectorAll('path').forEach(p => p.setAttribute('d', d));");
    const css = read('src/styles/portfolio.css');
    // the same 8 → 17px spread as card-radar: a 1px line, 2×(offset+1) less 2×offset
    expect(css).toMatch(/@keyframes notch-radar-ring \{\s*from \{ stroke-width: 18px; stroke-opacity: var\(--radar-alpha\); \}\s*to\s+\{ stroke-width: 36px; stroke-opacity: 0; \}/);
    expect(css).toMatch(/@keyframes notch-radar-inner \{\s*from \{ stroke-width: 16px; \}\s*to\s+\{ stroke-width: 34px; \}/);
    expect(css).toContain('.about-notch:hover > .notch-radar .notch-radar-ring { animation: notch-radar-ring 3s ease-out infinite; }');
  });
});

describe('Design Process — glass rim at the snapped width', () => {
  it('paints a top-lit gradient into the transparent border box, the fill kept to the padding box', () => {
    const css = read('src/styles/portfolio.css');
    expect(css).toMatch(/\.process-scroll-wrap--process\[data-notch\] \.process-card \{\s*border-color: transparent !important;\s*background:\s*linear-gradient\(#0d0a1c, #0d0a1c\) padding-box,\s*linear-gradient\(165deg,\s*rgba\(255, 255, 255, 0\.55\) 0%,[\s\S]*?\) border-box !important;/);
    // the neighbours peeking at the container's edges: its even .4, so they join its line
    expect(css).toMatch(/\.process-swipe-slot\.is-out \.process-card \{\s*background:\s*linear-gradient\(#0d0a1c, #0d0a1c\) padding-box,\s*linear-gradient\(rgba\(255, 255, 255, 0\.4\), rgba\(255, 255, 255, 0\.4\)\) border-box !important;/);
    expect(read('src/components/SkillsSection.tsx')).toContain("className={`process-swipe-slot${slot < 0 || slot >= visible ? ' is-out' : ''}`}");
  });
});

describe('Design Process — everything on the top edge lies on the thicker rim', () => {
  it('moves the glass highlight onto the rim and re-centres the STEP badge on it', () => {
    const css = read('src/styles/portfolio.css');
    expect(css).toMatch(/\.process-card > \.card-glass-highlight \{\s*top: calc\(-1 \* var\(--rim, 1\.5px\)\);\s*height: var\(--rim, 1\.5px\);/);
    expect(css).toContain('.process-scroll-wrap--process[data-notch] .process-step-badge { top: -14px; }');
  });
});

describe('notched cards — the radar svg takes no room', () => {
  it('stays 0×0 (overflow visible), so it can never hold the card at a stale height', () => {
    const tsx = read('src/components/NotchCard.tsx');
    expect(tsx).toContain('className="notch-radar" width="0" height="0"');
    expect(tsx).not.toMatch(/rd\.setAttribute\('(width|height)'/);
  });
});

describe('About — the availability card spaces its rows like the intro cards', () => {
  it('has no row-gap / top-margin of its own', () => {
    expect(read('src/styles/portfolio.css')).not.toContain('.about-cta-card .about-cta-points { row-gap: 12px; margin-top: 16px; }');
  });
});

describe('tablet / phone fixes', () => {
  it('lets the two intro cards size to their own content', () => {
    expect(read('src/styles/portfolio.css')).toMatch(/@media \(max-width: 1024px\) \{\s*\.bento-area-intro1,\s*\.bento-area-intro2 \{ align-self: start; \}/);
  });
  it('keeps the How I Use AI front panel inside the solid stage', () => {
    const css = read('src/styles/portfolio.css');
    expect(css).toContain('.ai-viewer.is-bare.is-stage .ai-swipe { margin-inline: -16px; padding-inline: 16px; }');
    expect(css).toContain('.ai-viewer.is-bare.is-stage .aas-front { left: -8px; bottom: -8px; }');
  });
});
