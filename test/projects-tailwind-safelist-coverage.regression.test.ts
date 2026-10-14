import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Regression tripwire: src/styles/projects-tailwind.css's @source inline(...)
// safelist exists because Tailwind's scanner can't see `${prefix}`-style
// template-interpolated classes in src/projects/shared/*.jsx as literal
// strings. If a future edit to one of those components introduces a new
// {variant}{utility}-{role}{opacity} shape without adding a matching
// @source inline line, the class silently gets no CSS rule — no build
// error, just a missing color, the exact "顏色丟失" symptom the safelist
// was added to fix. This test re-derives every concrete class those
// components can produce and asserts each is covered.

const PROJECT_PREFIXES = ['app', 'epb', 'gh', 'hc', 'kh', 'lv', 'police', 'sm', 'tmu', 'tn', 'tym', 'zoo'];
const COLOR_VALUES = ['primary', 'secondary']; // only values ever passed as ToolPill's `color` prop

function expandBraces(pattern: string): string[] {
  const m = pattern.match(/\{([^{}]*)\}/);
  if (!m || m.index === undefined) return [pattern];
  const options = m[1].split(',');
  const results: string[] = [];
  for (const opt of options) {
    const replaced = pattern.slice(0, m.index) + opt + pattern.slice(m.index + m[0].length);
    results.push(...expandBraces(replaced));
  }
  return results;
}

// Matches the exact grammar these components use: optional hover:/
// group-hover: variant, bg|text|border utility, `${prefix}`, a role made of
// lowercase words joined by '-' (or `${color}`), optional /opacity. Anchored
// to the literal `${prefix}`/`${color}` substrings so it can't spuriously
// match unrelated classes, and stops cleanly at the next `${...}`
// interpolation even with no whitespace in between (e.g.
// `` `bg-${prefix}-primary${isLast ? ... }` `` in ProcessTimeline.jsx).
const SHAPE_RE = /(?:hover:|group-hover:)?(?:bg|text|border)-\$\{prefix\}-(?:\$\{color\}|[a-z]+(?:-[a-z]+)*)(?:\/\d+)?/g;

describe('projects-tailwind.css safelist covers every ${prefix}-class shared/ components can produce', () => {
  it('has an @source inline(...) match for every concrete class', () => {
    const cssPath = path.resolve(__dirname, '../src/styles/projects-tailwind.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    const safelisted = new Set<string>();
    for (const m of css.matchAll(/@source inline\("([^"]+)"\);/g)) {
      for (const concrete of expandBraces(m[1])) safelisted.add(concrete);
    }
    expect(safelisted.size).toBeGreaterThan(0);

    const sharedDir = path.resolve(__dirname, '../src/projects/shared');
    const files = fs.readdirSync(sharedDir).filter(f => f.endsWith('.jsx'));
    expect(files.length).toBeGreaterThan(0);

    const missing = new Set<string>();
    let shapesChecked = 0;

    for (const file of files) {
      const src = fs.readFileSync(path.join(sharedDir, file), 'utf8');
      for (const match of src.matchAll(SHAPE_RE)) {
        const shape = match[0];
        const colorVariants = shape.includes('${color}') ? COLOR_VALUES : [null];
        for (const color of colorVariants) {
          const withColor = color ? shape.replaceAll('${color}', color) : shape;
          for (const prefix of PROJECT_PREFIXES) {
            shapesChecked++;
            const concrete = withColor.replaceAll('${prefix}', prefix);
            if (!safelisted.has(concrete)) missing.add(`${file}: ${concrete}`);
          }
        }
      }
    }

    expect(shapesChecked).toBeGreaterThan(0);
    expect(Array.from(missing)).toEqual([]);
  });
});
