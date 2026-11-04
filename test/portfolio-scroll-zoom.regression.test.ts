import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { zoomTrackRestTop } from '../src/utils/navHeader';
import { SHAPE_FROM, SHAPE_TO, ZOOM_EASE, cubicBezier, trackProgress, wallShapeProgress } from '../src/utils/portfolioZoom';
import { portfolioWallMaskPath, portfolioWallMorphPath, type WallMaskArgs } from '../src/utils/portfolioMask';

// Portfolio scroll zoom-in (Apple product page style): a .portfolio-scroll
// track holds #portfolio sticky under the navbar while its view-timeline
// pulls the whole section back from 1.5× to 1×. CSS only, plus nav landing.
const read = (p: string) => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8').replace(/\r\n/g, '\n');
const css = read('src/styles/portfolio.css');
const tsx = read('src/components/PortfolioSection.tsx');
const start = css.indexOf('/* Scroll zoom-in (Apple product page style, see PortfolioSection.tsx');
const block = css.slice(start, css.indexOf('@keyframes pf-ui-in', start) + 80);

describe('Portfolio scroll zoom-in', () => {
  it('wraps the section in a zoom track nav jumps know about', () => {
    expect(tsx).toMatch(/<div className="portfolio-scroll" data-zoom-track="">\s*(\{\/\*[\s\S]*?\*\/\}\s*)?<section id="portfolio"/);
  });

  it('only runs where scroll-driven animations exist, motion is allowed, and not on phones', () => {
    expect(block).toMatch(/@supports \(animation-timeline: view\(\)\) \{\s*@media \(prefers-reduced-motion: no-preference\) and \(min-width: 768px\) \{/);
  });

  // sticky is held inside the track's content box: the extra length has to
  // be content (::after), padding gives it no room to stick
  it('pins the section under the navbar inside a track lengthened by content', () => {
    // sides only: a top/bottom cut sliced the tilted wall with a straight
    // line on the way in; the tilted rows show instead
    expect(block).toMatch(/\.portfolio-scroll \{[^}]*overflow-x: clip;[^}]*overflow-y: visible;[^}]*view-timeline: --pf-zoom block;/);
    expect(block).not.toMatch(/mask-image/);
    expect(block).toMatch(/\.portfolio-scroll::after \{[^}]*content: '';[^}]*display: block;[^}]*height: calc\(150svh \/ var\(--z, 1\)\);/);
    expect(block).not.toMatch(/\.portfolio-scroll \{[^}]*padding-bottom/);
    // while sliding in, the cards' clip reaches the top of the screen but
    // the panel fill stops at the track's top
    expect(tsx).toMatch(/const secY = Math\.min\(Math\.max\(track\.top, stickyTop\(\)\), track\.bottom - section!\.offsetHeight\);/);
    expect(tsx).toMatch(/const fillD = t < 1 && track\.top > 0\s*\? portfolioWallMorphPath\(shape\.args, \{ \.\.\.from, y0: toWallY\(track\.top\) \}, t\)\s*: d;/);
    expect(block).toMatch(/\.portfolio-scroll > #portfolio \{[^}]*position: sticky;[^}]*top: var\(--nav-h, 72px\);/);
  });

  // the whole section scales, so the wall's notch keeps wrapping the text
  it('pulls the whole section back from 1.5x, done by 70% of the track', () => {
    expect(block).toMatch(/\.portfolio-scroll > #portfolio \{[^}]*animation: pf-zoom-in cubic-bezier\(\.3, 0, \.2, 1\) both;[^}]*animation-timeline: --pf-zoom;[^}]*animation-range: contain 0% contain 70%;/);
    // the shape forms on the same curve (portfolioZoom.ts)
    expect(ZOOM_EASE).toEqual([0.3, 0, 0.2, 1]);
    expect(block).toMatch(/@keyframes pf-zoom-in \{ from \{ scale: 1\.5; \} \}/);
  });

  // All at once over 0–70%: the zoom, the shape closing in from the window
  // (portfolioZoom.ts), the outline fading in early, and the headline and
  // button only as the frame and notches are about to land.
  it('forms the wall during the zoom, headline and button as it lands', () => {
    expect(block).toMatch(/\.portfolio-scroll > #portfolio \.portfolio-wall-outline \{[^}]*animation: pf-fade-in[^}]*animation-range: contain 0% contain 30%;/);
    expect(block).toMatch(/\.portfolio-scroll > #portfolio \.portfolio-header,\s*\.portfolio-scroll > #portfolio #toggle-portfolio-view \{[^}]*animation: pf-ui-in[^}]*animation-range: contain 58% contain 70%;/);
    // opacity/visibility only: the notch is cut from the headline's rects
    expect(block).toMatch(/@keyframes pf-ui-in \{ from \{ opacity: 0; visibility: hidden; \} \}/);
    expect(SHAPE_FROM).toBe(0);
    expect(SHAPE_TO).toBe(0.7);
  });

  // The light theme's drop-shadow filter only paints inside the frame's own
  // box, which cut the full-bleed wall off at the old rectangle.
  it('holds the frame\'s drop-shadow off until the shape has formed', () => {
    expect(block).toMatch(/\.portfolio-scroll > #portfolio \.portfolio-wall-frame \{[^}]*animation: pf-shadow-in[^}]*animation-range: contain 0% contain 70%;/);
    expect(block).toMatch(/@keyframes pf-shadow-in \{ 0%, 90% \{ filter: none; \} \}/);
  });

  // Regression: View All then Fold left the headline and button hidden.
  // Removing the view-timeline paused their animations at 0% and they
  // stayed paused when it came back; switched off with it, they restart.
  it('switches the scroll animations off with the timeline in the expanded view, so Fold restarts them', () => {
    expect(block).toMatch(/\.portfolio-scroll > #portfolio\.portfolio-expanded :is\(\.portfolio-header, #toggle-portfolio-view, \.portfolio-wall-outline, \.portfolio-wall-frame\) \{\s*animation: none;\s*\}/);
    // every element given a --pf-zoom animation is in that list
    const animated = Array.from(block.matchAll(/\n\s*\.portfolio-scroll > #portfolio ([^{,]+?)(?:,\s*\.portfolio-scroll > #portfolio ([^{]+?))? \{[^}]*animation-timeline: --pf-zoom/g))
      .flatMap(m => [m[1], m[2]].filter(Boolean).map(s => s.trim()));
    expect(animated.length).toBeGreaterThanOrEqual(4);
    for (const sel of animated) expect(['.portfolio-header', '#toggle-portfolio-view', '.portfolio-wall-outline', '.portfolio-wall-frame']).toContain(sel);
  });

  it('switches off in the expanded grid view', () => {
    expect(block).toMatch(/\.portfolio-scroll:has\(> #portfolio\.portfolio-expanded\) \{[^}]*view-timeline: none;/);
    expect(block).toMatch(/\.portfolio-scroll:has\(> #portfolio\.portfolio-expanded\)::after \{ display: none; \}/);
    expect(block).toMatch(/\.portfolio-scroll > #portfolio\.portfolio-expanded \{[^}]*position: relative;[^}]*animation: none;/);
  });

  // While folded the section's own rect moves with the scroll; expanding
  // measures from the track, where the section lands once it collapses.
  it('expands from the track\'s top, not the stuck section\'s rect', () => {
    expect(tsx).toMatch(/const anchor = portfolioSec\?\.closest<HTMLElement>\('\.portfolio-scroll'\) \?\? portfolioSec;/);
  });
});

describe('zoomTrackRestTop: nav jumps land past the zoom', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  const build = (sticky: boolean) => {
    document.body.innerHTML = `<div data-zoom-track><section id="portfolio"></section></div>`;
    const track = document.querySelector<HTMLElement>('[data-zoom-track]')!;
    const section = document.getElementById('portfolio')!;
    if (sticky) section.style.position = 'sticky';
    Object.defineProperty(track, 'offsetHeight', { value: 1980 });
    Object.defineProperty(section, 'offsetHeight', { value: 900 });
    track.getBoundingClientRect = () => ({ top: 500 } as DOMRect);
    return section;
  };

  it('lands where the section sits at the bottom of its track', () => {
    expect(zoomTrackRestTop(build(true))).toBe(500 + window.scrollY + 1980 - 900);
  });

  it('leaves a section that is not stuck (phones, expanded) to its own rect', () => {
    expect(zoomTrackRestTop(build(false))).toBeNull();
    document.body.innerHTML = `<section id="about" style="position: sticky"></section>`;
    expect(zoomTrackRestTop(document.getElementById('about')!)).toBeNull();
  });
});

describe('portfolioWallMorphPath: the wall forms in from the window', () => {
  const args: WallMaskArgs = [1344, 632, 560, 120, 300, 80, 76, 290, 40, 46, undefined, 40];
  const win = { x0: -48, y0: -170, x1: 1392, y1: 730 };
  // every corner a path visits (M/L points and Q end points)
  const points = (d: string) => Array.from(d.matchAll(/(?:[ML]|Q [-\d.]+ [-\d.]+) ([-\d.]+) ([-\d.]+)/g)).map(m => [Number(m[1]), Number(m[2])]);

  it('is exactly the wall\'s own shape once formed', () => {
    expect(portfolioWallMorphPath(args, win, 1)).toBe(portfolioWallMaskPath(...args));
  });

  it('starts as the window itself, square-cornered', () => {
    const d = portfolioWallMorphPath(args, win, 0);
    expect(d).not.toMatch(/Q/);
    const xs = new Set(points(d).map(p => p[0]));
    const ys = new Set(points(d).map(p => p[1]));
    expect([...xs].sort((a, b) => a - b)).toEqual([-48, 1392]);
    expect([...ys].sort((a, b) => a - b)).toEqual([-170, 730]);
  });

  it('closes in from the window part-way, never past it', () => {
    const pts = points(portfolioWallMorphPath(args, win, 0.5));
    for (const [x, y] of pts) {
      expect(x).toBeGreaterThanOrEqual(-48);
      expect(x).toBeLessThanOrEqual(1392);
      expect(y).toBeGreaterThanOrEqual(-170);
      expect(y).toBeLessThanOrEqual(730);
    }
    // the notch has started to open: some corner is inside on both axes
    expect(pts.some(([x, y]) => x > 0 && y > -170 && y < 0)).toBe(true);
  });

  // No notch the moment the frame starts closing in: it opens with the
  // frame, slower at first (t²), instead of showing up near full size.
  it('opens the notch gradually with the frame, not ahead of it', () => {
    // the headline notch's inner corner: furthest right of the top-left
    // corners still above the wall's own top half
    const notchWidth = (t: number) => {
      const pts = points(portfolioWallMorphPath(args, win, t));
      const leftEdge = Math.min(...pts.map(p => p[0]));
      const top = Math.min(...pts.map(p => p[1]));
      const onTop = pts.filter(p => Math.abs(p[1] - top) < 0.01).map(p => p[0]);
      return Math.min(...onTop) - leftEdge; // where the top edge starts, from the left edge
    };
    const full = notchWidth(1);
    expect(notchWidth(0.1) / full).toBeLessThan(0.05);
    expect(notchWidth(0.5) / full).toBeLessThan(0.35);
    expect(notchWidth(0.5)).toBeGreaterThan(notchWidth(0.25));
  });
});

describe('wallShapeProgress: how formed the wall is along the track', () => {
  afterEach(() => { document.body.innerHTML = ''; });
  const build = (top: number, sticky = true) => {
    document.body.innerHTML = `<div data-zoom-track><section id="portfolio"></section></div>`;
    const track = document.querySelector<HTMLElement>('[data-zoom-track]')!;
    const section = document.getElementById('portfolio')!;
    if (sticky) section.style.position = 'sticky';
    Object.defineProperty(track, 'offsetHeight', { value: window.innerHeight + 1000 });
    track.getBoundingClientRect = () => ({ top } as DOMRect);
    return { track, section };
  };

  it('reads the track\'s contain progress', () => {
    expect(trackProgress(build(0).track)).toBe(0);
    expect(trackProgress(build(-500).track)).toBe(0.5);
    expect(trackProgress(build(-2000).track)).toBe(1);
  });

  it('forms on the zoom\'s own curve across the band, 1 after', () => {
    const at = (p: number) => wallShapeProgress(build(-p * 1000).section);
    expect(at(0)).toBe(0);
    expect(at(SHAPE_TO / 2)).toBeCloseTo(cubicBezier(...ZOOM_EASE, 0.5));
    expect(at(SHAPE_TO / 4)).toBeLessThan(at(SHAPE_TO / 2));
    expect(at(SHAPE_TO)).toBe(1);
    expect(at(0.9)).toBe(1);
  });

  it('matches CSS cubic-bezier at its ends and on the linear curve', () => {
    expect(cubicBezier(...ZOOM_EASE, 0)).toBe(0);
    expect(cubicBezier(...ZOOM_EASE, 1)).toBe(1);
    expect(cubicBezier(0, 0, 1, 1, 0.37)).toBeCloseTo(0.37, 4);
    // ease-out heavy: well past halfway by the midpoint
    expect(cubicBezier(...ZOOM_EASE, 0.5)).toBeGreaterThan(0.7);
  });

  it('is always formed when the section isn\'t stuck in a track', () => {
    expect(wallShapeProgress(build(-100, false).section)).toBe(1);
    document.body.innerHTML = '<section id="x" style="position: sticky"></section>';
    expect(wallShapeProgress(document.getElementById('x')!)).toBe(1);
  });
});
