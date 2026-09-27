import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const read = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');
const css = read('src/styles/portfolio.css');

// Regression: the homepage kept ~146 backdrop-filter surfaces and ~151
// will-change layers alive on desktop, most of them invisible work.
describe('homepage GPU layer trims', () => {
  it('photo tiles opt back out of the universal glass blur', () => {
    expect(css).toMatch(/\.project-card,\s*\.grid-card\s*\{[^}]*backdrop-filter:\s*none;/);
  });

  it('marquee pills and pills nested in blurred cards drop their blur', () => {
    const block = css.match(/\.scroller-inner \.skill-pill,[^{]*\{[^}]*\}/);
    expect(block).not.toBeNull();
    for (const sel of [
      '.scroller-inner .tag-capsule', '.process-step-badge', '.ai-step-badge',
      '.ai-card-toggle', '.about-orbit-node', '.about-float-box', '.contact-card .slink',
    ]) expect(block![0]).toContain(sel);
    expect(block![0]).toMatch(/backdrop-filter:\s*none !important;/);
  });

  it('hover-shadow layers carry no permanent will-change', () => {
    const block = css.match(/\.bento-shadow,\s*\.card-hover-shadow,[^{]*\{[^}]*\}/);
    expect(block).not.toBeNull();
    expect(block![0]).not.toMatch(/^\s*will-change\s*:/m);
  });

  it('rise reveal drops will-change once an element has settled', () => {
    expect(read('src/utils/useRiseReveal.ts')).toMatch(
      /gsap\.set\(el, \{ willChange: 'auto' \}\);\s*el\.dispatchEvent\(new CustomEvent\('rise-settled'/,
    );
  });
});
