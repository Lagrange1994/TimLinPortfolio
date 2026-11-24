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

  // the same gaps round the tabs everywhere, and the tab block is centred on
  // the content beside it
  it('one alignment spec: text → tabs, tabs → line, tab block centred on the content', () => {
    expect(css).toContain('--tab-gap-above: 24px;');
    expect(css).toContain('--tab-gap-below: 24px;');
    // My Skills: title → sub (8px, like the other headings), then tabs → line
    // → tags between two flexible rows, beside the cards
    expect(rule('.skills-h2')).toMatch(/margin-bottom: 8px;/);
    expect(rule('.tech-sub.skills-head-sub')).toMatch(/margin-bottom: var\(--tab-gap-above\);/);
    expect(rule('.process-tabs.skills-tabs')).toMatch(/margin: 0 0 var\(--tab-gap-below\);/);
    expect(css).toMatch(/\.skills-intro \{\s*display: contents;/);
    // the cards' top level with the title's, the tabs block centred on them
    expect(css).toContain('grid-template-rows: auto auto auto 1fr;');
    expect(css).toMatch(/\.skills-intro > \.skills-chooser \{\s*grid-row: 2 \/ 5;\s*align-self: center;/);
    expect(css).toMatch(/\.skills-tools \{\s*grid-column: 2;\s*grid-row: 2 \/ 5;/);
    // Design Process: the gap sits above the column, the head centred on it
    expect(rule('.process-dual')).toMatch(/margin-top: var\(--tab-gap-above\);/);
    expect(rule('.process-tabs.process-mode-tabs')).toMatch(/margin: 0 0 var\(--tab-gap-below\);/);
    expect(css).toMatch(/\.process-column-head \{\s*align-self: center;[^}]*min-height: var\(--process-head-h\);[^}]*padding-top: 0;/);
    expect(css).not.toMatch(/padding-top: 108px;/);
    // Tech Stack: tabs + text in the middle rows, the card spans all four
    expect(css).toContain('grid-template-rows: auto auto auto 1fr auto;');
    expect(rule('.process-scroll-wrap--tech .process-tabs-block')).toMatch(/grid-area: 2 \/ 1 \/ 5 \/ 2;\s*align-self: center;/);
    expect(rule('.process-scroll-wrap--tech .process-tab-aside')).toMatch(/min-height: var\(--tab-aside-h\);\s*margin: var\(--tab-gap-below\) 16px 0 0;/);
    expect(rule('.process-scroll-wrap--tech .process-column-grid--inhouse')).toMatch(/grid-area: 2 \/ 2 \/ 5 \/ 3;[^}]*padding: 0 0 28px;/);
  });

  it('phones centre every tab row', () => {
    expect(css).toMatch(/@media \(max-width: 767px\) \{\s*\.process-tabs\.skills-tabs,\s*\.process-tabs\.process-mode-tabs \{ justify-content: center; \}/);
    // Tech Stack's: the base rule
    expect(rule('.process-tabs')).toMatch(/justify-content: center;/);
  });

  it('the lines under the tabs wrap at punctuation and spaces, not mid-word', () => {
    const group = css.match(/\.process-column-desc,\s*\.skills-sub-line,\s*\.process-tab-aside \.tech-desc,\s*\.bento-text \{[^}]*\}/)?.[0];
    expect(group).toMatch(/word-break: keep-all;/);
    expect(group).toMatch(/overflow-wrap: anywhere;/);
    expect(group).toMatch(/text-wrap: pretty;/);
  });

  it('the pill tabs hug their labels (In-house\'s side space) above phones, fill the row on phones', () => {
    expect(rule('.process-tabs.skills-tabs')).toMatch(/width: fit-content;/);
    expect(css).toContain('--pill-tab-pad: 46px;');
    expect(css).toMatch(/@media \(min-width: 768px\) \{\s*\.faq-tab\.skills-tab,\s*\.faq-tab\.process-mode-tab,\s*\.faq-tab\.about-tab \{\s*flex: 0 0 auto;\s*min-width: 0;\s*padding-inline: var\(--pill-tab-pad\);/);
    expect(css).toMatch(/@media \(max-width: 767px\) \{\s*\.process-tabs\.skills-tabs \{\s*justify-self: stretch;\s*width: auto;\s*\}\s*\.skills-tab \{\s*flex: 1 1 0;/);
  });

  it('FAQ tabs size to their label and never wrap', () => {
    const r = rule('.faq-tab');
    expect(r).toMatch(/flex: 1 1 auto;/);
    expect(r).toMatch(/white-space: nowrap;/);
  });
});
