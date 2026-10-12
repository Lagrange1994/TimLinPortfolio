import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Regression: in light mode the Team Collaboration / Development Policy
// popover titles were softened to --text-50 (light gray), so the heading looked
// washed out next to the body. The title must use the full dark --text ink.
describe('policy popover title ink (light mode)', () => {
  const css = readFileSync(resolve(__dirname, '..', 'src/styles/portfolio.css'), 'utf8');

  it('title uses the full dark --text', () => {
    expect(css).toMatch(
      /:root\[data-theme="light"\] \.policy-popover-title\s*\{\s*color:\s*var\(--text\);\s*\}/,
    );
  });

  it('body keeps the softer --text-50', () => {
    expect(css).toMatch(
      /:root\[data-theme="light"\] \.policy-popover-body\s*\{\s*color:\s*var\(--text-50\);\s*\}/,
    );
  });
});
