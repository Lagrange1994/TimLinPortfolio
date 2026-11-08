import { describe, it, expect, vi } from 'vitest';

// useRiseReveal (for its rise-start event) registers ScrollTrigger on
// import, which needs matchMedia.
vi.hoisted(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stairNotchPath } from '../src/utils/notchPath';
import { stageNotchSize, stageContentTops, navBaySize, NAV_BAY_END, STAGE_NOTCH_PAD } from '../src/utils/aiStageNotch';

// How I Use AI's stage card: My Portfolio's two-step top-left notch round
// the section's label/title/subtitle, as one outline path.
const pts = (d: string) => [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map(m => Number(m[0]));
const root = resolve(__dirname, '..');
const css = readFileSync(resolve(root, 'src/styles/portfolio.css'), 'utf8');
const tsx = readFileSync(resolve(root, 'src/components/SkillsSection.tsx'), 'utf8');

describe('stairNotchPath', () => {
  const o = { n1w: 600, n1h: 120, n2w: 400, n2h: 60, r: 48, ri: 24 };

  it('is one closed path with eight corners (two-step notch)', () => {
    const d = stairNotchPath(1200, 700, o);
    expect((d.match(/M /g) ?? []).length).toBe(1);
    expect(d.endsWith(' Z')).toBe(true);
    expect((d.match(/[ML] /g) ?? []).length).toBe(8 * 13);
  });

  it('runs the steps at the notch widths, and stays in the box', () => {
    const a = pts(stairNotchPath(1200, 700, o));
    const onX = (x: number, y0: number, y1: number) =>
      a.some((v, i) => i % 2 === 0 && Math.abs(v - x) < 0.01 && a[i + 1] > y0 && a[i + 1] < y1);
    expect(onX(600, 0, 120)).toBe(true);    // beside the title
    expect(onX(400, 120, 180)).toBe(true);  // beside the subtitle
    for (let i = 0; i < a.length; i += 2) {
      expect(a[i]).toBeGreaterThanOrEqual(0);
      expect(a[i]).toBeLessThanOrEqual(1200);
      expect(a[i + 1]).toBeGreaterThanOrEqual(0);
      expect(a[i + 1]).toBeLessThanOrEqual(700);
    }
  });

  it('folds into one notch when the subtitle is as wide as the title', () => {
    const d = stairNotchPath(1200, 700, { ...o, n2w: 650 });
    expect((d.match(/[ML] /g) ?? []).length).toBe(6 * 13);
  });
});

describe('nav bay', () => {
  it('cuts a bay into the left edge, inner corners concentric with the buttons', () => {
    const bay = navBaySize({ top: 300, bottom: 392, right: 36, radius: 18 }, 10);
    expect(bay).toEqual({ top: 290, bottom: 402, w: 46, ri: 28, ro: NAV_BAY_END });
    // the bay's top inner corner shares the top button's centre (18, 318)
    expect([bay.w - bay.ri, bay.top + bay.ri]).toEqual([18, 318]);
  });

  it('adds four corners to the outline, its depth on the left edge', () => {
    const o = { n1w: 600, n1h: 120, n2w: 400, n2h: 60, r: 48, ri: 24 };
    const d = stairNotchPath(1200, 700, { ...o, bay: { top: 290, bottom: 402, w: 46, ri: 28, ro: 18 } });
    expect((d.match(/[ML] /g) ?? []).length).toBe(12 * 13);
    const a = pts(d);
    expect(a.some((v, i) => i % 2 === 0 && Math.abs(v - 46) < 0.01 && a[i + 1] > 290 && a[i + 1] < 402)).toBe(true);
  });
});

describe('stageNotchSize', () => {
  it('pads round label + title, then the subtitle', () => {
    const n = stageNotchSize({ labelRight: 120, titleRight: 640, titleBottom: 90, subRight: 380, subBottom: 150 });
    expect(n).toEqual({
      n1w: 640 + STAGE_NOTCH_PAD,
      n1h: 90 + STAGE_NOTCH_PAD,
      n2w: 380 + STAGE_NOTCH_PAD,
      n2h: 150 - 90,
    });
  });
});

describe('stageContentTops', () => {
  const n = { n1w: 656, n1h: 106, n2w: 396, n2h: 60 };
  it('each column clears only the steps over its left edge', () => {
    // rail under both steps; the app window right of the subtitle, under the title only
    expect(stageContentTops(n, { rail: 40, stage: 560 }, 24)).toEqual({ rail: 166 + 24, stage: 106 + 24 });
    // narrow screens: the app window starts under the subtitle too
    expect(stageContentTops(n, { rail: 40, stage: 380 }, 24).stage).toBe(166 + 24);
    // right of the whole notch: still no higher than the title step
    expect(stageContentTops(n, { rail: 40, stage: 700 }, 24).stage).toBe(106 + 24);
  });

  it('the whole mockup centres on the progress rail beside it', () => {
    // rail from 190, its middle 300 down; the mockup's middle 200 down
    expect(stageContentTops(n, { rail: 40, stage: 560, centre: { railMid: 300, groupMid: 200 } }, 24).stage).toBe(190 + 100);
    // a mockup taller than the rail still clears the notch
    expect(stageContentTops(n, { rail: 40, stage: 560, centre: { railMid: 100, groupMid: 400 } }, 24).stage).toBe(106 + 24);
  });

  it('pieces reaching past the column clear the notch too', () => {
    // a panel 28px left of the window, under the subtitle step, 10px below the column top
    const t = stageContentTops(n, { rail: 40, stage: 560, pieces: [{ x: 380, top: 10 }] }, 24);
    expect(t.stage).toBe(166 + 24 - 10);
  });
});

describe('wiring', () => {
  it('the viewer is clipped and stroked along the notch on desktop', () => {
    expect(tsx).toContain('return attachStageNotch(v, l, t, s, svg, p);');

    expect(tsx).toContain('<div className="ai-viewer-shell">');
    // the clip sits on the untransformed skin (the rising viewer paints
    // unclipped mid-entrance), hidden until the notch is measured
    expect(tsx).toMatch(/<div className="ai-viewer-skin" aria-hidden="true">\s*<svg ref=\{aiOutlineRef\}/);
    expect(css).toMatch(/\[data-ai-notch\] \.ai-viewer-skin \{[^}]*clip-path: var\(--ai-notch-clip, inset\(0 0 100% 0\)\);[^}]*backdrop-filter: blur\(1rem\);/);
    expect(css).toMatch(/\[data-ai-notch\] \.ai-viewer \{[^}]*background: none;\s*backdrop-filter: none;\s*border-image: linear-gradient\(transparent, transparent\) 1;/);
    expect(css).not.toMatch(/\[data-ai-notch\] \.ai-viewer \{[^}]*clip-path/);
  });

  // About's grid-card border effect: the white hairline, the top sheen and
  // highlight line, and the pointer-following glow ring on hover
  it('the stage wears the About cards’ border effect', () => {
    expect(css).toContain('[data-ai-notch] .ai-viewer { border-color: rgba(255, 255, 255, 0.14); }');
    expect(css).toContain('[data-ai-notch] .ai-viewer-skin { box-shadow: var(--card-edge); }');
    expect(css).toMatch(/\[data-ai-notch\] \.ai-viewer-skin::after \{[^}]*left: calc\(var\(--ai-notch-x, 40%\) \+ var\(--seg\) \* \.12\);[^}]*linear-gradient\(90deg, transparent, rgba\(255, 255, 255, \.32\), transparent\)/);
    expect(css).toContain('[data-ai-notch] .ai-viewer:hover .notch-ring { opacity: 1; }');
    expect(tsx).toContain('<path className="notch-ring" fill="none" stroke="url(#ai-viewer-ring-glow)" />');
  });

  it('the glow ring follows the pointer, and stops once detached', async () => {
    const { attachStageNotch } = await import('../src/utils/aiStageNotch');
    document.body.innerHTML = `<section><div id="l"></div><div id="t"></div><div id="s"></div>
      <div class="ai-viewer"><svg><defs><radialGradient cx="-500" cy="-500"></radialGradient></defs>
      <path id="p"></path><path class="notch-ring"></path></svg></div></section>`;
    const q = <T extends Element>(s: string) => document.querySelector<T>(s)!;
    const viewer = q<HTMLElement>('.ai-viewer');
    const detach = attachStageNotch(viewer, q('#l'), q('#t'), q('#s'), q<SVGSVGElement>('svg'), q<SVGPathElement>('#p'));
    const glow = q('radialGradient');
    viewer.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 40 }));
    expect([glow.getAttribute('cx'), glow.getAttribute('cy')]).toEqual(['120', '40']);
    detach();
    viewer.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 90 }));
    expect(glow.getAttribute('cx')).toBe('120');
  });
});
