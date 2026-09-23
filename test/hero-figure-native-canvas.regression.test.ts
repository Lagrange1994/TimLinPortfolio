import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

// The Spline runtime sizes its canvas off the host <spline-viewer> element's
// own LAYOUT size (clientWidth/clientHeight, unaffected by a CSS transform on
// that element) and its camera is pixel-based, so a host sized to the ~720px
// hero box (width/height: 100%) renders a smaller CROP of the scene instead of
// a shrunk whole scene (hips down + the side props cut off) — and scaling
// that 100%-sized host with a CSS transform doesn't help either, since the
// transform never changes clientWidth, so the runtime still renders the small
// crop, just shrunk further. Fixed by giving the host a fixed size equal to
// the scene's own authored resolution (measured 1080x1080, not the 1024
// guessed at first) so the runtime always renders the whole scene, then
// shrinking that fixed host into the box with a CSS transform + explicit
// position. This reliably fixes the crop (verified across viewport sizes).
describe('hero figure viewer is fixed at the scene\'s native 672x672 and scaled into the box', () => {
  const css = read('src/styles/portfolio.css');
  const tsx = read('src/components/HeroSection.tsx');

  it('fixes the host at 672x672 and positions it with --hero-fig-{x,y}', () => {
    const block = css.match(/\.hero-fig spline-viewer \{\s*position: absolute;[\s\S]*?\}/)?.[0];
    expect(block).toBeTruthy();
    expect(block).toMatch(/width: 672px;/);
    expect(block).toMatch(/height: 672px;/);
    expect(block).toMatch(/left: var\(--hero-fig-x, 0px\);/);
    expect(block).toMatch(/top: var\(--hero-fig-y, 0px\);/);
    // No `transform` here any more (was `scale(var(--hero-fig-scale, ...))`):
    // Entrance is a WAAPI `translate` animation and scale is inline `scale`
    // (see hero-figure-entrance-animation.regression.test.ts); a stylesheet
    // `transform` here would be redundant and confusing.
    expect(block).not.toMatch(/transform:/);
  });

  it('keeps --hero-fig-{scale,x,y} in sync with the box via HERO_SCENE_SIZE = 672 and a ResizeObserver', () => {
    expect(tsx).toMatch(/const HERO_SCENE_SIZE = 672/);
    expect(tsx).toMatch(/new ResizeObserver\(sync\)/);
    expect(tsx).toMatch(/ro\.disconnect\(\)/);
  });

  // .hero-fig isn't a square (50% width x 45rem height) — scaling by
  // Math.min(w, h) left a gap between the figure's head and the top of the
  // box whenever the box was wider than tall. Scaling by height alone makes
  // the scene always span the box's full height, bottom to top; width
  // overflow beyond the box is clipped by .hero-fig's own overflow: hidden.
  it('scales by height alone so the scene always spans the box bottom-to-top', () => {
    expect(tsx).toMatch(/const scale = h \/ HERO_SCENE_SIZE;/);
    expect(tsx).toMatch(/viewer\?\.style\.setProperty\('--hero-fig-y', '0px'\);/);
    expect(tsx).not.toMatch(/Math\.min\(w, h\) \/ HERO_SCENE_SIZE/);
  });

  // GSAP (not a --hero-fig-scale CSS var) owns the scale now — see
  // hero-figure-entrance-animation.regression.test.ts for why: it also
  // drives this same element's entrance `y` tween, and letting a stylesheet
  // rule set `transform` too would race GSAP's own inline write.
  it('sets scale via the inline `scale` property (not GSAP, not a --hero-fig-scale CSS var)', () => {
    expect(tsx).toMatch(/if \(viewer\) viewer\.style\.scale = String\(scale\);/);
    expect(tsx).not.toMatch(/gsap\.set\(viewer/);
    expect(tsx).not.toMatch(/setProperty\('--hero-fig-scale'/);
  });

  it('never touches the runtime\'s own canvas size (setSize/setZoom) — only CSS transforms the host', () => {
    // A poll + MutationObserver canvas-pinning hack and a setZoom() camera
    // hack were both tried and reverted: the former raced the runtime's load
    // sequence (could leave the scene never finishing load), the latter left
    // the canvas pinned at 1080x1080 regardless, so nothing changed. Scoped to
    // this effect (not the whole file — an unrelated idle-detection effect
    // elsewhere legitimately uses setInterval).
    const effect = tsx.match(/useEffect\(\(\) => \{\s*if \(window\.innerWidth < 768 \|\| typeof ResizeObserver[\s\S]*?\n  \}, \[\]\);/)?.[0];
    expect(effect).toBeTruthy();
    expect(effect).not.toMatch(/setSize/);
    expect(effect).not.toMatch(/setZoom/);
    expect(effect).not.toMatch(/MutationObserver/);
    expect(effect).not.toMatch(/setInterval/);
  });
});

// Root-caused by reading the bundled runtime's own source
// (unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js): its
// EventManager caches canvas.getBoundingClientRect() ONCE, in its
// constructor, as `eventContext.domRect`, and maps every pointer event
// through that same cached rect forever after — it only gets refreshed on a
// real `window` `resize` event (and even that listener is only attached if
// the scene has scroll-triggered objects, which this one doesn't) or on
// `scroll`. A pure CSS transform never fires either. So if `.hero-fig` is
// still mid-entrance-animation (or a webfont swap reflows it) after the
// scene's own construction, the cached rect goes stale forever and every
// hover on the scene's props lands off by exactly however much the box later
// moved — measured live: the cached rect drifted ~14px from the canvas's
// real one on a slow load. Fixed by re-pointing the cache at the live
// canvas rect (`eventManager.eventContext.domRect = canvas.
// getBoundingClientRect()`) on every resize, on the scene's own 'load'
// event, and once the entrance tween's onComplete fires — confirmed live to
// cut the drift from ~14px to ~3px; see the project memory on this feature
// for the full trail (a deadlock was hit and reverted along the way — don't
// gate the viewer's `url` attribute on anything that itself waits on
// 'hero-ready').
describe('hero figure re-points the Spline runtime\'s stale pointer-hit-test rect', () => {
  const tsx = read('src/components/HeroSection.tsx');
  const sizingEffect = tsx.match(/useEffect\(\(\) => \{\s*if \(window\.innerWidth < 768 \|\| typeof ResizeObserver[\s\S]*?\n  \}, \[\]\);/)?.[0];

  it('re-points eventManager.eventContext.domRect at the live canvas rect', () => {
    expect(sizingEffect).toBeTruthy();
    expect(sizingEffect).toMatch(/_spline\?\.eventManager\?\.eventContext/);
    expect(sizingEffect).toMatch(/ctx\.domRect = canvas\.getBoundingClientRect\(\)/);
  });

  it('re-syncs on resize, on the scene\'s own load event, and once the entrance tween settles', () => {
    expect(sizingEffect).toMatch(/viewer\?\.addEventListener\('load', sync\)/);
    expect(sizingEffect).toMatch(/window\.addEventListener\('hero-fig-settled', sync\)/);
    expect(sizingEffect).toMatch(/window\.setTimeout\(sync, 1500\)/);
  });

  it('cleans up all three listeners/timer on unmount', () => {
    expect(sizingEffect).toMatch(/window\.removeEventListener\('hero-fig-settled', sync\)/);
    expect(sizingEffect).toMatch(/viewer\?\.removeEventListener\('load', sync\)/);
    expect(sizingEffect).toMatch(/window\.clearTimeout\(settleTimer\)/);
  });

  it('dispatches hero-fig-settled from the entrance tween\'s onComplete, not a plain call', () => {
    const entranceEffect = tsx.match(/const heroFig = document\.querySelector[\s\S]*?\n  \}, \[\]\);/)?.[0];
    expect(entranceEffect).toBeTruthy();
    expect(entranceEffect).toMatch(/onComplete: \(\) => \{\s*window\.dispatchEvent\(new Event\('hero-fig-settled'\)\);/);
  });

  it('never gates the viewer\'s `url` attribute on \'hero-ready\' or \'hero-fig-settled\' (deadlock)', () => {
    // Loader.tsx's waitForAssets() waits for #hero-spline's own `load` event
    // before firing 'hero-ready' in the first place — deferring `url` to
    // anything gated on 'hero-ready' is a real, confirmed-live deadlock.
    const urlEffect = tsx.match(/useEffect\(\(\) => \{\s*if \(window\.innerWidth < 768\) return;\s*const heroSpline[\s\S]*?\n  \}, \[\]\);/)?.[0];
    expect(urlEffect).toBeTruthy();
    expect(urlEffect).toMatch(/heroSpline\.setAttribute\('url', '\.\/models\/hero_figure\.splinecode'\);/);
    expect(urlEffect).not.toMatch(/hero-ready/);
    expect(urlEffect).not.toMatch(/hero-fig-settled/);
  });
});

// 2026-09-23: entrance stutter root cause found by diffing against the
// reference build (timlin-design.vercel.app): its canvas backing store is
// 765x672, ours was 1620x1620 (fixed 1080 css px x devicePixelRatio 1.5) —
// ~5x the pixels, for a figure displayed at ~450px. Fixed by rendering at
// display resolution (pixel ratio = dpr * scale) via the runtime's own
// renderer.setDrawingBufferSize, keeping it through the runtime's internal
// resizes by overriding its _getPixelRatio.
describe('hero figure renders at display resolution, not native-size x dpr', () => {
  const tsx = read('src/components/HeroSection.tsx');

  it('sets the renderer drawing buffer to the scene size at dpr*scale', () => {
    expect(tsx).toMatch(/renderer\.setDrawingBufferSize\(HERO_SCENE_SIZE, HERO_SCENE_SIZE, ratio\)/);
    expect(tsx).toMatch(/sp\._getPixelRatio = \(\) => ratio;/);
    expect(tsx).toMatch(/syncSplinePixelRatio\(scale\);/);
  });

  it('polls for the runtime so the ratio lands even when load fires before _spline exists', () => {
    expect(tsx).toMatch(/if \(viewer\?\._spline\?\._renderer\) \{ sync\(\); return; \}/);
    expect(tsx).toMatch(/window\.clearTimeout\(runtimeTimer\)/);
  });
});
