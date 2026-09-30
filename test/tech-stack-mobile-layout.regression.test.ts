import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// Tech Stack cards stack name+description above the code simulator on
// desktop but go side-by-side on tablet/phone (see the @media (max-width:
// 1024px) block in portfolio.css) so a full-width single-column card reads
// left-to-right. The HTML and React cards mirror that row (code on the
// left) so the three cards don't all read identically; the JavaScript card
// (the middle one) keeps text-left/code-right.
describe('Tech Stack cards go side-by-side on tablet/phone, alternating which side the code sits on', () => {
  const jsx = fs.readFileSync(path.join(ROOT, 'src/components/SkillsSection.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/portfolio.css'), 'utf8');

  it('wraps each card\'s name+description in .tech-item-text, once per card', () => {
    const count = (jsx.match(/<div className="tech-item-text">/g) || []).length;
    expect(count).toBe(3);
  });

  it('lays the row out at <=1024px, text column first in DOM order (base = text-left/code-right)', () => {
    const block = css.match(/\.tech-item \{\s*flex-direction: row;[^}]*\}/)?.[0];
    expect(block).toBeTruthy();
    expect(block).toMatch(/align-items:\s*center;/);
  });

  it('reverses the row for the html and react cards only, not js', () => {
    const reverseBlock = css.match(/\.tech-item\.html-item,\s*\n\s*\.tech-item\.react-item\s*\{\s*flex-direction:\s*row-reverse;\s*\}/);
    expect(reverseBlock).toBeTruthy();
    expect(css).not.toMatch(/\.tech-item\.js-item\s*\{\s*flex-direction:\s*row-reverse;/);
  });

  it('splits the row 3/5 text : 2/5 code as the shared tablet+phone baseline', () => {
    const textBlock = css.match(/\.tech-item-text \{\s*display: flex;[^}]*\}/)?.[0];
    const codeBlock = css.match(/\.tech-code-preview \{\s*flex: 2;[^}]*\}/)?.[0];
    expect(textBlock).toMatch(/flex:\s*3;/);
    expect(codeBlock).toBeTruthy();
  });

  // Phones override the tablet flex row entirely — the title moves out of
  // whichever column it landed in to sit full-width above both columns,
  // left-aligned, then the code simulator and description sit side by side
  // underneath. Nested inside the shared <=1024px block (not the separate
  // <768px MOBILE section further up the file) specifically so it compiles
  // AFTER the flex-row rules above and wins the cascade at equal
  // specificity regardless of source position.
  it('switches to a 2-col grid on phones with the title spanning both columns above the row', () => {
    const baselineIdx = css.indexOf('flex: 3;\n        min-width: 0;\n      }\n      .tech-code-preview {\n        flex: 2;');
    expect(baselineIdx).toBeGreaterThan(-1);
    const after = css.slice(baselineIdx);
    const overrideIdx = after.indexOf('@media (max-width: 767px)');
    expect(overrideIdx).toBeGreaterThan(-1);
    const overrideBlock = after.slice(overrideIdx, overrideIdx + 900);
    expect(overrideBlock).toMatch(/\.tech-item \{\s*display:\s*grid;/);
    expect(overrideBlock).toMatch(/"header header"\s*\n\s*"code {3}desc"/);
    expect(overrideBlock).toMatch(/\.tech-item-text \{\s*display:\s*contents;\s*\}/);
    expect(overrideBlock).toMatch(/\.tech-item-header \{\s*grid-area:\s*header;/);
  });

  // The code column and the description text rarely end up the same
  // natural height — top-anchoring them left the shorter one looking
  // misaligned against the taller one. Centering both on the row's shared
  // vertical middle instead reads as intentional regardless of which side
  // ends up taller.
  it('centers the code/desc row instead of top-anchoring it', () => {
    const gridBlock = css.match(/\.tech-item \{\s*display:\s*grid;[^}]*\}/)?.[0];
    expect(gridBlock).toBeTruthy();
    expect(gridBlock).toMatch(/align-items:\s*center;/);
  });

  // Same left/right alternation the tablet row already used (html/react
  // mirror the base code-right/text-left order) — reapplied as a grid-area
  // swap instead of flex-direction: row-reverse, since the title row no
  // longer participates in that direction at all.
  it('keeps the html/react code-left mirroring as a grid-area swap on phones', () => {
    const phoneBlock = css.slice(
      css.indexOf('@media (max-width: 767px)', css.indexOf('.tech-item {\n        flex-direction: row;')),
    );
    const mirrorBlock = phoneBlock.match(/\.tech-item\.html-item,\s*\n\s*\.tech-item\.react-item \{[^}]*\}/)?.[0];
    expect(mirrorBlock).toBeTruthy();
    expect(mirrorBlock).toMatch(/"header header"\s*\n\s*"desc {3}code"/);
  });
});
