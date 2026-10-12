import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');

// Regression: on phones the hero (and the gap between its CTA buttons and the
// bottom-anchored tag capsules) changed as the address bar collapsed while
// scrolling. The section height must be frozen in px at first load.
describe('mobile hero height is frozen at first load', () => {
  const css = read('src/styles/portfolio.css');
  const tsx = read('src/components/HeroSection.tsx');

  it('the mobile #home sizes from --hero-h with 100svh only as the first-paint fallback', () => {
    expect(css).toMatch(/height:\s*var\(--hero-h,\s*100svh\);\s*min-height:\s*var\(--hero-h,\s*100svh\);/);
  });

  it('HeroSection measures 100svh once and writes it to --hero-h', () => {
    expect(tsx).toMatch(/height:100svh;/);
    expect(tsx).toMatch(/setProperty\('--hero-h',/);
  });

  it('only re-locks when the width changes, and clears the lock on desktop widths', () => {
    expect(tsx).toMatch(/if \(window\.innerWidth === heightLockedAtWidth\) return;/);
    expect(tsx).toMatch(/removeProperty\('--hero-h'\)/);
  });

  it('measure() locks the height before anything else', () => {
    expect(tsx).toMatch(/function measure\(\) \{\s*lockHeight\(\);/);
  });
});
