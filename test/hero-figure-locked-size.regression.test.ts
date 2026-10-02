import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// Mobile hero figure: sized once at first load and then locked. Phones fire
// `resize` whenever the URL bar collapses/expands mid-scroll (height-only),
// and a re-measure that landed while #main-header was in its compact
// .scrolled state saw a shorter navbar, shrank navClearance and let the
// figure grow while scrolling.
describe('HeroSection mobile figure stays at its first-load size', () => {
  const tsx = fs.readFileSync(path.join(ROOT, 'src/components/HeroSection.tsx'), 'utf8');

  it('ignores height-only resize events — only a width change re-measures', () => {
    expect(tsx).toMatch(/const onResize = \(\) => \{ if \(window\.innerWidth !== measuredWidth\) measure\(\); \};/);
    expect(tsx).toMatch(/window\.addEventListener\('resize', onResize\);/);
    expect(tsx).toMatch(/window\.removeEventListener\('resize', onResize\);/);
    expect(tsx).not.toMatch(/window\.addEventListener\('resize', measure\);/);
    expect(tsx).toMatch(/measuredWidth = window\.innerWidth;/);
  });

  it('never reads the navbar height while it is in the compact .scrolled state (after the first measurement)', () => {
    expect(tsx).toMatch(/if \(!navClearance \|\| !nav!\.classList\.contains\('scrolled'\)\) \{\s*navClearance = nav!\.getBoundingClientRect\(\)\.height \+ GAP;\s*\}/);
  });

  it('keeps orientationchange as a real re-measure trigger', () => {
    expect(tsx).toMatch(/window\.addEventListener\('orientationchange', measure\);/);
  });
});
