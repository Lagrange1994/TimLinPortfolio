import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// Mobile-only (<=1024px, same breakpoint that shows #sm-toggle-btn): swiping
// in from the right screen edge opens the staggered menu, same as tapping
// the toggle button — no need to wait for touchend, it opens the moment the
// drag passes the threshold so it feels like dragging the panel out.
describe('Navbar right-edge swipe opens the staggered menu (mobile)', () => {
  const tsx = fs.readFileSync(path.join(ROOT, 'src/components/Navbar.tsx'), 'utf8');

  it('only arms the gesture when the touch starts within EDGE_ZONE of the right edge, on mobile, while closed', () => {
    expect(tsx).toMatch(/const EDGE_ZONE = 24;/);
    expect(tsx).toMatch(/if \(window\.innerWidth > 1024\) \{ edgeSwipeActive = false; return; \}/);
    expect(tsx).toMatch(/closeSwipeActive = false;\s*edgeSwipeActive = t\.clientX >= window\.innerWidth - EDGE_ZONE;/);
    expect(tsx).toMatch(/edgeSwipeActive = t\.clientX >= window\.innerWidth - EDGE_ZONE;/);
  });

  it('opens once a horizontal-dominant leftward drag passes OPEN_THRESHOLD', () => {
    expect(tsx).toMatch(/const OPEN_THRESHOLD = 60;/);
    expect(tsx).toMatch(/if \(dx <= -OPEN_THRESHOLD && Math\.abs\(dx\) > Math\.abs\(dy\)\) \{\s*edgeSwipeActive = false;\s*openMenu\(\);\s*\}/);
  });

  it('triggers on touchmove, not touchend (feels immediate, not a release gesture)', () => {
    const move = tsx.match(/const onTouchMove = \(e: TouchEvent\) => \{[\s\S]*?\n    \};/)?.[0];
    expect(move).toBeTruthy();
    expect(move).toMatch(/openMenu\(\);/);
    const end = tsx.match(/const onTouchEnd = \(\) => \{[\s\S]*?\};/)?.[0];
    expect(end).not.toMatch(/openMenu/);
  });

  it('while open, a rightward drag starting at the menu\'s left edge (or left of it) closes it', () => {
    expect(tsx).toMatch(/closeSwipeActive = t\.clientX <= panel\.getBoundingClientRect\(\)\.left \+ EDGE_ZONE;/);
    expect(tsx).toMatch(/if \(dx >= OPEN_THRESHOLD && Math\.abs\(dx\) > Math\.abs\(dy\)\) \{\s*closeSwipeActive = false;\s*closeMenu\(\);\s*\}/);
    expect(tsx).toMatch(/const onTouchEnd = \(\) => \{ edgeSwipeActive = false; closeSwipeActive = false;/);
  });

  it('cancels horizontal edge drags (either edge) so the browser cannot history-navigate to visited project pages', () => {
    expect(tsx).toMatch(/if \(t\.clientX <= EDGE_ZONE \|\| t\.clientX >= window\.innerWidth - EDGE_ZONE\) \{/);
    expect(tsx).toMatch(/window\.addEventListener\('touchmove', blockHistorySwipe, \{ passive: false \}\);/);
    expect(tsx).toMatch(/if \(Math\.abs\(t\.clientX - blockStartX\) > Math\.abs\(t\.clientY - blockStartY\)\) e\.preventDefault\(\);/);
  });

  it('attaches the non-passive blocker only for the duration of one edge touch, never permanently', () => {
    expect(tsx).toMatch(/const stopBlockingHistorySwipe = \(\) => window\.removeEventListener\('touchmove', blockHistorySwipe\);/);
    expect(tsx).toMatch(/const onTouchEnd = \(\) => \{ edgeSwipeActive = false; closeSwipeActive = false; stopBlockingHistorySwipe\(\); \};/);
    expect(tsx).toMatch(/window\.addEventListener\('touchcancel', onTouchEnd, \{ passive: true \}\);/);
  });

  it('also sets overscroll-behavior-x: none on html/body (Chromium gesture navigation)', () => {
    const css = fs.readFileSync(path.join(ROOT, 'src/styles/portfolio.css'), 'utf8');
    expect(css).toMatch(/html,\s*body \{\s*width: 100%;\s*overflow-x: clip;[\s\S]*?overscroll-behavior-x: none;\s*\}/);
  });

  it('registers and cleans up all three touch listeners as passive', () => {
    expect(tsx).toMatch(/window\.addEventListener\('touchstart', onTouchStart, \{ passive: true \}\);/);
    expect(tsx).toMatch(/window\.addEventListener\('touchmove', onTouchMove, \{ passive: true \}\);/);
    expect(tsx).toMatch(/window\.addEventListener\('touchend', onTouchEnd, \{ passive: true \}\);/);
    expect(tsx).toMatch(/window\.removeEventListener\('touchstart', onTouchStart\);/);
    expect(tsx).toMatch(/window\.removeEventListener\('touchmove', onTouchMove\);/);
    expect(tsx).toMatch(/window\.removeEventListener\('touchend', onTouchEnd\);/);
  });
});
