import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { isChromeOnlyResize, installIgnoreChromeResize } from '../src/utils/ignoreChromeResize';

const ROOT = path.resolve(__dirname, '..');

// Mobile URL-bar slide fires height-only `resize` events mid-scroll; every
// component that re-lays-out on window resize then nudged the layout. The
// capture-phase filter swallows only those; real resizes pass through.
describe('isChromeOnlyResize', () => {
  const base = { w: 375, h: 700 };
  it('swallows a small height-only change on a phone width', () => {
    expect(isChromeOnlyResize(base, { w: 375, h: 640 })).toBe(true);
    expect(isChromeOnlyResize(base, { w: 375, h: 700 + 140 })).toBe(true);
  });
  it('lets a width change through (rotation, split screen)', () => {
    expect(isChromeOnlyResize(base, { w: 700, h: 375 })).toBe(false);
  });
  it('lets a large height change through (on-screen keyboard)', () => {
    expect(isChromeOnlyResize(base, { w: 375, h: 380 })).toBe(false);
  });
  it('never filters desktop-width windows', () => {
    expect(isChromeOnlyResize({ w: 1440, h: 900 }, { w: 1440, h: 860 })).toBe(false);
  });
});

describe('installIgnoreChromeResize', () => {
  let cleanup: () => void;
  afterEach(() => cleanup?.());

  const resizeTo = (w: number, h: number) => {
    Object.defineProperty(window, 'innerWidth', { value: w, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: h, configurable: true });
    window.dispatchEvent(new Event('resize'));
  };

  it('blocks later listeners for chrome-only resizes, passes real ones, and re-baselines on a pass', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 700, configurable: true });
    cleanup = installIgnoreChromeResize();
    const later = vi.fn();
    window.addEventListener('resize', later);

    resizeTo(375, 650);
    expect(later).not.toHaveBeenCalled();

    resizeTo(700, 375);
    expect(later).toHaveBeenCalledTimes(1);

    resizeTo(700, 340);
    expect(later).toHaveBeenCalledTimes(1);

    window.removeEventListener('resize', later);
    cleanup();
    const afterCleanup = vi.fn();
    window.addEventListener('resize', afterCleanup);
    resizeTo(700, 330);
    expect(afterCleanup).toHaveBeenCalledTimes(1);
    window.removeEventListener('resize', afterCleanup);
  });
});

describe('wiring and mobile svh overrides', () => {
  it('registers the filter in main.tsx right after scaleLock (which must stay first) and before App', () => {
    const main = fs.readFileSync(path.join(ROOT, 'src/main.tsx'), 'utf8');
    expect(main.indexOf("import './utils/ignoreChromeResizeInit';")).toBeGreaterThanOrEqual(0);
    expect(main.indexOf("import './utils/ignoreChromeResizeInit';")).toBeGreaterThan(main.indexOf("import './utils/scaleLock';"));
    expect(main.indexOf("import './utils/ignoreChromeResizeInit';")).toBeLessThan(main.indexOf("import App from './App';"));
  });

  it('uses svh (not dvh) for the portfolio wall position and bg layer inside the phone media query', () => {
    const css = fs.readFileSync(path.join(ROOT, 'src/styles/portfolio.css'), 'utf8');
    const block = css.slice(css.indexOf('--wall-h: 85svh;') - 3000);
    expect(block).toContain('top: calc((calc(100svh / var(--z, 1)) - var(--wall-h)) / 2 - var(--nav-h, 0px));');
    expect(block).toMatch(/\.view-all-row \{\s*top: calc\(\(calc\(100svh/);
    expect(block).toMatch(/#portfolio:not\(\.portfolio-expanded\) \{\s*min-height: calc\(100svh \/ var\(--z, 1\)\);/);
    expect(block).toMatch(/\.spline-bg-layer \{\s*height: calc\(100svh \/ var\(--z, 1\)\);/);
  });
});
