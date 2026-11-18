import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Regression: a dead-CSS sweep dropped .bento-area-p1..p3 because no source
// file spells those names out — AboutSection builds them as
// `bento-area-p${n}`. Without their grid-area the three design-principle
// cards fell into the grid's implicit columns and squeezed into thin strips.
describe('About design-principle cards keep their grid areas', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '../src/styles/portfolio.css'), 'utf8');
  const about = fs.readFileSync(path.resolve(__dirname, '../src/components/AboutSection.tsx'), 'utf8');

  it('AboutSection still builds the class names from the card number', () => {
    expect(about).toContain('area={`bento-area-p${n}`}');
  });

  it('each card class maps to its named grid area', () => {
    for (const n of [1, 2, 3]) expect(css).toContain(`.bento-area-p${n} { grid-area: p${n}; }`);
  });
});
