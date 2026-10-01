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
    expect(tsx).toMatch(/if \(window\.innerWidth > 1024 \|\| isOpenRef\.current\) \{ edgeSwipeActive = false; return; \}/);
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

  it('registers and cleans up all three touch listeners as passive', () => {
    expect(tsx).toMatch(/window\.addEventListener\('touchstart', onTouchStart, \{ passive: true \}\);/);
    expect(tsx).toMatch(/window\.addEventListener\('touchmove', onTouchMove, \{ passive: true \}\);/);
    expect(tsx).toMatch(/window\.addEventListener\('touchend', onTouchEnd, \{ passive: true \}\);/);
    expect(tsx).toMatch(/window\.removeEventListener\('touchstart', onTouchStart\);/);
    expect(tsx).toMatch(/window\.removeEventListener\('touchmove', onTouchMove\);/);
    expect(tsx).toMatch(/window\.removeEventListener\('touchend', onTouchEnd\);/);
  });
});
