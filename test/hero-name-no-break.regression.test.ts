import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Regression: on a narrow screen the hero heading wrapped between "Tim" and
// "Lin", leaving "Tim" stranded on the first line. The name span must be
// unbreakable so it wraps to the next line as one unit.
describe('hero name wraps as one unit', () => {
  const css = readFileSync(resolve(__dirname, '..', 'src/styles/portfolio.css'), 'utf8');

  it('.hero-h1 span is white-space: nowrap', () => {
    expect(css).toMatch(/\.hero-h1 span\s*\{\s*white-space:\s*nowrap;\s*\}/);
  });

  it('the heading still wraps the name in a span (plain and unsplit markup)', () => {
    const src = readFileSync(resolve(__dirname, '..', 'src/components/HeroSection.tsx'), 'utf8');
    expect(src).toMatch(/<h1 className="hero-h1 stagger-item">Hi, I&apos;m <span>Tim Lin<\/span><\/h1>/);
    expect(src).toMatch(/el\.innerHTML = 'Hi, I\\'m <span>Tim Lin<\/span>'/);
  });
});
