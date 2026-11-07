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
import { stageNotchSize, stageContentTops, STAGE_NOTCH_PAD } from '../src/utils/aiStageNotch';

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
    // right of the whole notch: straight to the top
    expect(stageContentTops(n, { rail: 40, stage: 700 }, 24).stage).toBe(24);
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
    expect(tsx).toContain('<svg ref={aiOutlineRef} className="notch-outline ai-viewer-outline" aria-hidden="true">');
    expect(tsx).toContain('<div className="ai-viewer-shell">');
    // never a plain rectangle first: hidden until the notch is measured
    expect(css).toContain('.ai-viewer { clip-path: var(--ai-notch-clip, inset(0 0 100% 0)); }');
    expect(css).toMatch(/\[data-ai-notch\] \.ai-viewer \{[^}]*[^}]*clip-path: var\(--ai-notch-clip, inset\(0 0 100% 0\)\);[^}]*border-image: linear-gradient\(transparent, transparent\) 1;/);
  });
});
