import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Regression: the hero "Contact Me" CTA used native
// scrollIntoView({ behavior: 'smooth' }), which fixes its end point at click
// time and ignores the navbar. Lazily mounted sections and the Portfolio
// zoom track change the page height mid-flight, so it stopped short of
// #contact. Both hero CTAs must go through scrollToSectionAligned, which
// re-resolves the target every frame and subtracts --nav-h.
describe('hero CTAs scroll with scrollToSectionAligned', () => {
  const src = readFileSync(resolve(__dirname, '../src/components/HeroSection.tsx'), 'utf8');
  const btns = src.slice(src.indexOf('hero-btns hero-btns-seq'), src.indexOf('Contact Me') + 20);

  it('Contact Me uses scrollToSectionAligned', () => {
    expect(btns).toContain("scrollToSectionAligned('contact')");
  });

  it('no hero CTA uses native scrollIntoView', () => {
    expect(btns).not.toContain('scrollIntoView');
  });
});
