import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';

// Regression: a dropped semicolon in portfolio.css (a grid-template-areas
// edit) made Vite's PostCSS fail with a 500, so the whole homepage rendered
// nothing — while every regex-based CSS test still passed. Parse the real
// stylesheets the way Vite does.
describe('stylesheets parse', () => {
  for (const file of ['src/styles/portfolio.css']) {
    it(`${file} is valid CSS for PostCSS`, () => {
      const css = readFileSync(resolve(__dirname, '..', file), 'utf8');
      expect(() => postcss.parse(css, { from: file })).not.toThrow();
    });
  }

  it('catches a missed semicolon', () => {
    expect(() => postcss.parse('a { grid-template-areas: "x"\n gap: 1px; }')).toThrow(/Missed semicolon/);
  });
});
