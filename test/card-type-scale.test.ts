import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, '../src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
const at = css.indexOf('/* ===== CARD TYPE SCALE =====');
const block = css.slice(at);
const rule = (first: string) => {
  const i = block.indexOf(`\n    ${first}`);
  expect(i).toBeGreaterThan(-1);
  return block.slice(i, block.indexOf('}', i));
};

// One title size and one body size for every homepage content card.
describe('card type scale', () => {
  it('sits last in the stylesheet, so it outranks the older per-card values', () => {
    expect(at).toBeGreaterThan(-1);
    expect(css.lastIndexOf('font-size')).toBeGreaterThan(at);
    expect(block.replace(/\/\*[\s\S]*?\*\//g, '').trim().endsWith('}')).toBe(true);
  });

  it('defines one title and one body size, the title a step smaller on phones', () => {
    expect(block).toContain('--card-title-size: 20px;');
    expect(block).toContain('--card-title-weight: 700;');
    expect(block).toContain('--card-title-lh: 1.2;');
    expect(block).toContain('--card-body-size: 14px;');
    expect(block).toContain('--card-body-lh: 1.6;');
    expect(block).toMatch(/@media \(max-width: 767px\) \{\n {6}:root \{ --card-title-size: 18px; \}/);
  });

  it("undoes the Overview wall's scale, so its cards read at the same size", () => {
    expect(block).toMatch(/@media \(min-width: 1025px\) \{\n {6}\.overview-grid \{\n {8}--card-title-size: calc\(20px \/ var\(--wall-scale, 1\)\);\n {8}--card-body-size: calc\(14px \/ var\(--wall-scale, 1\)\);/);
  });

  it('gives every card title the heading font at the shared size', () => {
    const titles = rule('.bento-card:not(.bento-stat-big) .bento-label,');
    for (const s of ['.about-status,', '.process-card--has-img .process-name,', '.skill-card-name,', '.line-title,', '.ai-pill-inner h3 {']) {
      expect(titles).toContain(s);
    }
    expect(titles).toContain('font-family: var(--font-heading);');
    expect(titles).toContain('font-size: var(--card-title-size);');
    expect(titles).toContain('font-weight: var(--card-title-weight);');
  });

  it('gives every card body the shared size, leaving its colour alone', () => {
    const bodies = rule('.bento-text,');
    for (const s of ['.process-card--has-img .process-desc,', '.tech-desc,', '.line-desc,', '.skill-card-desc,', '.ai-pill-inner p,']) {
      expect(bodies).toContain(s);
    }
    expect(bodies).toContain('font-size: var(--card-body-size);');
    expect(bodies).not.toContain('color');
  });

  it('leaves the big-number tiles out', () => {
    expect(block).not.toMatch(/\n {4}\.bento-label,|\n {4}\.bento-caption,/);
    expect(block).toContain('.bento-card:not(.bento-stat-big) .bento-caption,');
  });
});
