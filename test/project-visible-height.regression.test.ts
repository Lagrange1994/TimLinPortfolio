import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');

// Regression (phones): on a phone 100vh is the viewport with the browser's
// address bar / bottom toolbar HIDDEN. The project pages never scroll the
// document, so those bars stay shown:
//  - #main-scroller / .snap-section were 100vh with overflow hidden, so the
//    bottom strip of every section sat behind the toolbar;
//  - the resizable stage's height was computed as a share of
//    window.innerHeight (the visible height) but applied in vh, so it came out
//    taller than 16:9 and the drag handle drifted away from the finger.
// Both now use dvh, the height actually visible.
describe('project pages size to the visible viewport', () => {
  const css = read('src/styles/projects-tailwind.css').replace(/\/\*[\s\S]*?\*\//g, '');

  it.each(['#main-scroller', '.snap-section'])('%s is 100dvh, with 100vh only as an earlier fallback', (selector) => {
    const block = css.match(new RegExp(`\\n${selector.replace('.', '\\.')} \\{([^}]*)\\}`))?.[1];
    expect(block).toBeTruthy();
    const heights = block!.match(/^\s*height: .*;$/gm)!.map(s => s.trim());
    expect(heights).toEqual([
      'height: calc(100vh / var(--z, 1)) !important;',
      'height: calc(100dvh / var(--z, 1)) !important;',
    ]);
  });

  it.each(['02', '04', '05', '06', '07', '08', '09', '10', '11'])(
    'project_%s applies its innerHeight-based stage height in dvh',
    (n) => {
      const jsx = read(`src/projects/project_${n}.jsx`);
      // the drag maths is a share of window.innerHeight…
      expect(jsx).toMatch(/\(clientY \/ (window\.innerHeight|windowHeight)\) \* 100/);
      if (!/\(clientY \/ window\.innerHeight\)/.test(jsx)) expect(jsx).toMatch(/const windowHeight = window\.innerHeight;/);
      // …so the unit it is applied in has to be the same height
      expect(jsx).toContain('`${mobileStageHeightVh(canResizeVisual, mobileVisualHeight)}dvh`');
      expect(jsx).not.toMatch(/mobileVisualHeight\)\}vh`/);
    },
  );
});
