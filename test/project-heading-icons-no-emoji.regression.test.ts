import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Regression: project_05's "手機 APP" summary heading used a ⚡ emoji (and the
// web one a ♜ glyph) as its icon. The emoji renders from the OS colour-emoji
// font, so it looked nothing like the line-stroke SVG icons around it. Section
// headings must use SVG/icon-font icons, never emoji or text symbols.
const dir = resolve(__dirname, '..', 'src/projects');
const files = readdirSync(dir).filter(f => /^project_\d+\.jsx$/.test(f));
const read = (f: string) => readFileSync(resolve(dir, f), 'utf8');

describe('project headings use line icons, not emoji', () => {
  it.each(files)('%s has no emoji or symbol glyph in an <h4>', f => {
    const headings = read(f).match(/<h4\b[\s\S]*?<\/h4>/g) ?? [];
    for (const h of headings) {
      expect(h).not.toMatch(/[☀-➿⬀-⯿]|\p{Extended_Pictographic}/u);
    }
  });
});
