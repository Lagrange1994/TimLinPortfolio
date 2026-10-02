import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// Above 1920px html carries `zoom` (scaleLock.ts / --z), which scales viewport
// units up with it. .mcp-bleed's bare 100vw therefore overshot the visible
// width by the zoom factor on 2K/4K screens: the grid was shoved left and the
// Figma card cropped. Every vw it uses must be divided by --z.
describe('.mcp-bleed respects the 4K scale lock', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/portfolio.css'), 'utf8');
  const block = css.match(/\.mcp-bleed \{[\s\S]*?\n    \}/)?.[0] ?? '';

  it('divides its viewport-width box and negative margins by --z', () => {
    expect(block).toMatch(/width: calc\(100vw \/ var\(--z, 1\)\);/);
    expect(block).toMatch(/margin-left: calc\(50% - 50vw \/ var\(--z, 1\)\);/);
    expect(block).toMatch(/margin-right: calc\(50% - 50vw \/ var\(--z, 1\)\);/);
  });

  it('adds the gutter beyond .section max-width (1440px) so the grid is exactly as wide as the Tech Stack row', () => {
    expect(block).toMatch(/padding: 0 calc\(max\(0px, \(100vw \/ var\(--z, 1\) - 1440px\) \/ 2\) \+ 48px\);/);
    const section = css.match(/\n    \.section \{[\s\S]*?\n    \}/)?.[0] ?? '';
    expect(section).toMatch(/max-width: 1440px;/);
    expect(section).toMatch(/padding: 80px 48px;/);
  });

  it('has no bare 100vw / 50vw left', () => {
    const stripped = block.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(stripped).not.toMatch(/(?<![\w-])(100|50)vw(?! \/ var\(--z)/);
  });
});
