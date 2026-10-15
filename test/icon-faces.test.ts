import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
// @ts-expect-error plain .mjs helper shared with scripts/subset-icons.mjs
import { usedIconClasses } from '../scripts/icon-usage.mjs';

// The homepage self-hosts Font Awesome + Phosphor cut down to the icons it
// uses (scripts/subset-icons.mjs) instead of ~670 KB of full CDN fonts. The
// catch: an icon added later has no glyph and no ::before rule until the
// script is re-run — it renders as nothing, with no build error. These tests
// make that fail loudly instead.
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'src/styles/icon-faces.css'), 'utf8');

describe('self-hosted homepage icon fonts', () => {
  it('has a glyph rule for every icon class the homepage uses (re-run node scripts/subset-icons.mjs)', () => {
    const { fa, ph } = usedIconClasses(root) as { fa: Set<string>; ph: Set<string> };
    expect(fa.size).toBeGreaterThan(10);
    expect(ph.size).toBeGreaterThan(10);
    const missing = [
      ...[...fa].filter(n => !new RegExp(`\\.${n}::?before\\b`).test(css)),
      ...[...ph].filter(n => !new RegExp(`\\.ph(?:-bold|-fill)?\\.${n}:before\\b`).test(css)),
    ];
    expect(missing).toEqual([]);
  });

  it('every @font-face points at a subset font that exists', () => {
    const urls = [...css.matchAll(/url\("(\/fonts\/icons\/[^"]+)"\)/g)].map(m => m[1]);
    expect(urls).toHaveLength(5);
    for (const u of urls) expect(fs.existsSync(path.join(root, 'public', u)), u).toBe(true);
  });

  it('index.html no longer loads the CDN icon stylesheets, and portfolio.css imports the local ones', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    expect(html).not.toMatch(/font-awesome|@phosphor-icons/);
    expect(fs.readFileSync(path.join(root, 'src/styles/portfolio.css'), 'utf8')).toMatch(/@import '\.\/icon-faces\.css';/);
  });

  // Noto Sans TC was loaded as the full family (~150 KB of Google slices)
  // only for the few characters GenSen lacks; it's now a text= subset of
  // exactly those (~2 KB).
  it('the homepage loads Noto Sans TC only as a text= subset', () => {
    const links = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/href="([^"]*Noto\+Sans\+TC[^"]*)"/g)].map(m => m[1]);
    expect(links).toHaveLength(1);
    const text = decodeURIComponent(new URL(links[0]).searchParams.get('text') ?? '');
    expect([...text].sort()).toEqual([...'徹·→↗・'].sort());
  });
});
