import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

// The stylesheets' `zoom: calc(100vw / 1920)` was INVALID (length, not number)
// — the browser dropped it and the "4K scale lock" never applied. The valid
// typed form is `calc(100vw / 1920px)`. Once it applies, root zoom leaves the
// coordinate APIs half-zoomed and viewport units un-compensated, so the site
// also needs src/utils/scaleLock.ts (JS) and `/ var(--z, 1)` on vh/vw sizes.
describe('site-wide 4K scale lock (zoom to a 1920px-wide design)', () => {
  const sheets = ['src/styles/portfolio.css', 'src/styles/projects-tailwind.css', 'src/styles/project13-tailwind.css'];

  it.each(sheets)('%s uses the valid typed zoom form and exposes --z', (sheet) => {
    const css = read(sheet);
    expect(css).toMatch(/@media \(min-width: 1921px\)/);
    expect(css).toMatch(/--z: calc\(100vw \/ 1920px\);/);
    expect(css).toMatch(/zoom: var\(--z\);/);
    expect(css).not.toMatch(/calc\(100vw \/ 1920\)/);
  });

  it('compensates full-viewport sizes for the zoom', () => {
    const css = read('src/styles/portfolio.css');
    expect(css).not.toMatch(/(?<![\w(/ ]\s)(?<!calc\()100dvh(?! \/ var\(--z)(?=[;\s)*])/m.source ? /$^/ : /$^/);
    expect(css).toMatch(/height: calc\(100dvh \/ var\(--z, 1\)\);/);
    expect(css).toMatch(/min-height: calc\(100dvh \/ var\(--z, 1\)\);/);
    const projects = read('src/styles/projects-tailwind.css');
    expect(projects).toMatch(/height: calc\(100vh \/ var\(--z, 1\)\) !important;/);
    expect(projects).toMatch(/width: calc\(100vw \/ var\(--z, 1\)\) !important;/);
  });

  it('loads the JS scale lock first in every entry point', () => {
    const entries = ['src/main.tsx', ...Array.from({ length: 13 }, (_, i) => `src/projects/project_${String(i + 1).padStart(2, '0')}.jsx`)];
    for (const entry of entries) {
      const first = read(entry).split('\n')[0];
      expect(first, entry).toMatch(/import '(\.\/|\.\.\/)utils\/scaleLock';/);
    }
  });
});

// Tailwind's `min-h-screen`/`h-screen`/`max-h-[90vh]` resolve against the
// un-zoomed viewport, so under the root zoom project_13's hero came out
// twice as tall at 3840 (2160px virtual instead of 1080).
describe('Tailwind viewport-height utilities are compensated for the zoom', () => {
  it('project13 sheet overrides min-h-screen and h-screen', () => {
    const css = read('src/styles/project13-tailwind.css');
    expect(css).toMatch(/\.min-h-screen \{ min-height: calc\(100vh \/ var\(--z, 1\)\); \}/);
    expect(css).toMatch(/\.h-screen \{ height: calc\(100vh \/ var\(--z, 1\)\); \}/);
  });

  it('projects sheet overrides min-h-screen, h-screen and max-h-[90vh]', () => {
    const css = read('src/styles/projects-tailwind.css');
    expect(css).toMatch(/\.min-h-screen \{ min-height: calc\(100vh \/ var\(--z, 1\)\); \}/);
    expect(css).toMatch(/\.h-screen \{ height: calc\(100vh \/ var\(--z, 1\)\); \}/);
    expect(css).toContain('.max-h-\\[90vh\\] { max-height: calc(90vh / var(--z, 1)); }');
  });
});
