import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Every tab shares one label spec (--tab-font) and every line under the
// tabs one text spec (--tab-desc-size / --tab-desc-lh). Before, the
// underline tabs were 15px, Portfolio's filters 12px mono, FAQ 12.5px; the
// lines under them 13px, 15px and 15px at three line heights.
const css = fs.readFileSync(path.resolve(__dirname, '../src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
const rule = (sel: string) => css.match(new RegExp(`\\n\\s*${sel.replace(/[.]/g, '\\.')} \\{[^}]*\\}`))?.[0] ?? '';

describe('tab type spec', () => {
  it('defines the tokens once', () => {
    expect(css).toContain('--tab-font: 600 15px/1.2 var(--font);');
    expect(css).toContain('--tab-desc-size: 15px;');
    expect(css).toContain('--tab-desc-lh: 1.75;');
  });

  it('every tab label uses --tab-font', () => {
    for (const sel of ['.process-tab', '.portfolio-filter-tab', '.faq-tab']) {
      const r = rule(sel);
      expect(r, sel).toMatch(/font: var\(--tab-font\);/);
      expect(r, sel).not.toMatch(/font-(size|weight|family):/);
    }
  });

  it('every line under the tabs uses the desc tokens', () => {
    for (const sel of ['.process-column-desc', '.skills-sub-line', '.process-tab-aside .tech-desc']) {
      const r = rule(sel);
      expect(r, sel).toMatch(/font-size: var\(--tab-desc-size\);/);
      expect(r, sel).toMatch(/line-height: var\(--tab-desc-lh\);/);
    }
  });

  // the same gaps round the tabs everywhere, and the content beside them
  // starts level with the tabs' top
  it('one alignment spec: text → tabs, tabs → line, content level with the tabs', () => {
    expect(css).toContain('--tab-gap-above: 24px;');
    expect(css).toContain('--tab-gap-below: 24px;');
    // My Skills: title → tabs → line; the cards join rows 3+ (the tabs' row)
    expect(rule('.skills-h2')).toMatch(/margin-bottom: var\(--tab-gap-above\);/);
    expect(rule('.process-tabs.skills-tabs')).toMatch(/margin: 0 0 var\(--tab-gap-below\);/);
    expect(css).toMatch(/\.skills-intro \{\s*display: contents;/);
    expect(css).toMatch(/\.skills-tools \{\s*grid-column: 2;\s*grid-row: 3 \/ 7;/);
    // Design Process: the gap sits above the column, the tabs at its top
    expect(rule('.process-dual')).toMatch(/margin-top: var\(--tab-gap-above\);/);
    expect(rule('.process-tabs.process-mode-tabs')).toMatch(/margin: 0 0 var\(--tab-gap-below\);/);
    expect(css).toMatch(/\.process-column-head \{\s*padding-top: 0;/);
    expect(css).not.toMatch(/padding-top: 108px;/);
    // Tech Stack: tabs and the card's track share the top gap
    expect(rule('.process-scroll-wrap--tech .process-tabs')).toMatch(/margin: var\(--tab-gap-above\) 16px 0;/);
    expect(rule('.process-scroll-wrap--tech .process-tab-aside')).toMatch(/margin: var\(--tab-gap-below\) 32px 0 16px;/);
    expect(rule('.process-scroll-wrap--tech .process-column-grid--inhouse')).toMatch(/padding: var\(--tab-gap-above\) 16px 28px;/);
  });

  it('FAQ tabs size to their label and never wrap', () => {
    const r = rule('.faq-tab');
    expect(r).toMatch(/flex: 1 1 auto;/);
    expect(r).toMatch(/white-space: nowrap;/);
  });
});
