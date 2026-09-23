import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

// The figure sits inside `.hero-fig` again (see
// hero-figure-layer-order.regression.test.ts), so `.hero-fig`'s own GSAP
// tween carries it along — no separate tween on #hero-spline (a separate
// WAAPI / GSAP tween there was only needed while it was portaled out).
describe('hero figure entrance rides .hero-fig\'s single tween', () => {
  const tsx = read('src/components/HeroSection.tsx');
  const entranceEffect = tsx.match(/const heroFig = document\.querySelector[\s\S]*?\n {2}\}, \[\]\);/)?.[0];

  it('tweens only .hero-fig, never #hero-spline itself', () => {
    expect(entranceEffect).toBeTruthy();
    expect(entranceEffect).toMatch(/gsap\.set\(heroFig, \{ opacity: 0, y: 70 \}\);/);
    expect(entranceEffect).toMatch(/gsap\.to\(heroFig, \{ opacity: 1, y: 0, duration: 1\.1, ease: 'power3\.out'/);
    expect(entranceEffect).not.toMatch(/gsap\.(set|to)\(heroSplineViewer/);
    expect(entranceEffect).not.toMatch(/heroSplineViewer\.animate\(/);
  });

  it('dispatches hero-fig-settled once, from the tween\'s onComplete', () => {
    expect(entranceEffect).toMatch(/onComplete: \(\) => \{\s*window\.dispatchEvent\(new Event\('hero-fig-settled'\)\);/);
    const dispatches = entranceEffect?.match(/window\.dispatchEvent\(new Event\('hero-fig-settled'\)\)/g) ?? [];
    expect(dispatches).toHaveLength(1);
  });

  it('disables pointer-events on the figure for the entrance, restoring it when the tween completes', () => {
    expect(entranceEffect).toMatch(/heroSplineViewer\.style\.pointerEvents = 'none';/);
    expect(entranceEffect).toMatch(/heroSplineViewer\.style\.pointerEvents = 'auto';/);
  });
});
