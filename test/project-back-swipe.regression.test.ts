import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// Mobile only: a FORCEFUL swipe starting from the left screen edge (the
// native swipe-back convention) navigates back, same as BackButton's
// goBack()/Navbar's goHome(). "Forceful" means a velocity check (px/ms),
// not just distance, so a slow drag that merely starts near the edge
// (e.g. scrolling) doesn't accidentally trigger it.
describe.each([
  'project_01.jsx', 'project_02.jsx', 'project_03.jsx', 'project_04.jsx',
  'project_05.jsx', 'project_06.jsx', 'project_07.jsx', 'project_08.jsx',
  'project_09.jsx', 'project_10.jsx', 'project_11.jsx', 'project_12.jsx',
])('%s left-edge back-swipe (mobile)', (file) => {
  const jsx = fs.readFileSync(path.join(ROOT, 'src/projects', file), 'utf8');

  it('only arms when the touch starts within BACK_EDGE_ZONE of the left edge', () => {
    expect(jsx).toMatch(/const BACK_EDGE_ZONE = 24;/);
    expect(jsx).toMatch(/backSwipeRef\.current = t\.clientX <= BACK_EDGE_ZONE/);
  });

  it('requires a horizontal-dominant rightward drag past BACK_DISTANCE before checking force', () => {
    expect(jsx).toMatch(/const BACK_DISTANCE = 60;/);
    expect(jsx).toMatch(/if \(dx < BACK_DISTANCE \|\| Math\.abs\(dx\) < Math\.abs\(dy\) \|\| dt <= 0\) return;/);
  });

  it('only navigates back when the drag velocity clears BACK_VELOCITY (the "forceful" check)', () => {
    expect(jsx).toMatch(/const BACK_VELOCITY = 0\.5;/);
    expect(jsx).toMatch(/if \(dx \/ dt >= BACK_VELOCITY\) goBack\(\);/);
  });

  it('registers and cleans up the back-swipe touch listeners', () => {
    expect(jsx).toMatch(/window\.addEventListener\('touchstart', handleBackTouchStart, \{ passive: true \}\);/);
    expect(jsx).toMatch(/window\.addEventListener\('touchend', handleBackTouchEnd, \{ passive: true \}\);/);
    expect(jsx).toMatch(/window\.removeEventListener\('touchstart', handleBackTouchStart\);/);
    expect(jsx).toMatch(/window\.removeEventListener\('touchend', handleBackTouchEnd\);/);
  });
});

describe('project_13.jsx left-edge back-swipe (mobile)', () => {
  const jsx = fs.readFileSync(path.join(ROOT, 'src/projects/project_13.jsx'), 'utf8');

  it('uses its own standalone effect (no shared GSAP snap-section wheel/touch machinery to hook into)', () => {
    expect(jsx).toMatch(/const BACK_EDGE_ZONE = 24;/);
    expect(jsx).toMatch(/start = t\.clientX <= BACK_EDGE_ZONE/);
    expect(jsx).toMatch(/const BACK_DISTANCE = 60;/);
    expect(jsx).toMatch(/const BACK_VELOCITY = 0\.5;/);
    expect(jsx).toMatch(/if \(dx \/ dt < BACK_VELOCITY\) return;/);
  });

  it('falls back to the same sameOrigin history.back() / #portfolio logic as goHome()', () => {
    expect(jsx).toMatch(/if \(sameOrigin && window\.history\.length > 1\) history\.back\(\);\s*\n\s*else location\.href = '\/#portfolio';/);
  });

  it('registers and cleans up its own touch listeners', () => {
    expect(jsx).toMatch(/window\.addEventListener\('touchstart', onTouchStart, \{ passive: true \}\);/);
    expect(jsx).toMatch(/window\.addEventListener\('touchend', onTouchEnd, \{ passive: true \}\);/);
    expect(jsx).toMatch(/window\.removeEventListener\('touchstart', onTouchStart\);/);
    expect(jsx).toMatch(/window\.removeEventListener\('touchend', onTouchEnd\);/);
  });
});
