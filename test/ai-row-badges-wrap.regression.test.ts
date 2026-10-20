import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// Regression: on phones the AI demo's half-width "任務類型 / 優先級" cards
// couldn't fit their two badges on one line, and the non-wrapping flex row
// pushed the second badge out past the card's edge.
describe('AI demo badge rows wrap inside their half-width cards', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');

  it('the badge row wraps', () => {
    expect(css).toMatch(/\.ai-block \.vv\{[^}]*flex-wrap:wrap;/);
  });

  it('the two columns can shrink below their content width', () => {
    expect(css).toMatch(/\.ai-row\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\);/);
  });
});
