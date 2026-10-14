import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// Regression: on a phone the open staggered menu cut off its bottom rows.
// The overlay was 100vh tall, and a phone's 100vh is the viewport with the
// browser's address bar / bottom toolbar hidden — so while they showed, the
// panel ran past the visible bottom edge and the Theme / Language rows
// (pushed to the bottom by .sm-theme's margin-top: auto) sat behind the
// toolbar. The content exactly filled that too-tall panel, so it couldn't be
// scrolled into view either.
const css = fs.readFileSync(path.join(ROOT, 'src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '');

// Every top-level-indented `selector { … }` block for an exact selector.
function blocks(selector: string): string[] {
  const src = stripComments(css);
  const out: string[] = [];
  const head = `\n    ${selector} {\n`;
  for (let at = src.indexOf(head); at >= 0; at = src.indexOf(head, at + 1)) {
    out.push(src.slice(at + head.length, src.indexOf('\n    }', at)));
  }
  return out;
}

describe('mobile menu overlay fits the visible viewport', () => {
  it('sizes .sm-wrapper with dvh, keeping vh only as an earlier fallback', () => {
    const wrapper = blocks('.sm-wrapper').find(b => /position: fixed;/.test(b));
    expect(wrapper).toBeTruthy();
    const heights = wrapper!.match(/^\s*height: .*;$/gm)!.map(s => s.trim());
    expect(heights).toEqual([
      'height: calc(100vh / var(--z, 1));',
      'height: calc(100dvh / var(--z, 1));',
    ]);
  });

  it('no other .sm-wrapper rule overrides that height', () => {
    const others = stripComments(css).match(/\.sm-wrapper[^{,]*\{[^}]*\}/g)!
      .filter(b => !/position: fixed;/.test(b));
    for (const b of others) expect(b).not.toMatch(/(^|[\s;{])height:/);
  });

  it('the panel fills the overlay and scrolls itself when it is still too short', () => {
    const panel = blocks('.sm-panel').find(b => /position: absolute;/.test(b))!;
    expect(panel).toMatch(/height: 100%;/);
    expect(panel).toMatch(/overflow-y: auto;/);
  });

  it('pads the panel bottom past the iPhone home indicator', () => {
    const panel = blocks('.sm-panel').find(b => /position: absolute;/.test(b))!;
    expect(panel).toMatch(/padding: 5\.5rem 2\.5rem calc\(2\.5rem \+ env\(safe-area-inset-bottom\)\);/);
    expect(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')).toMatch(/viewport-fit=cover/);
  });
});
