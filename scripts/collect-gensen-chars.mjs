// Records which non-ASCII characters the homepage actually renders in each
// GenSen Rounded TW weight, into scripts/gensen-homepage-chars.json — the
// input of the per-weight "page" layer in scripts/subset-fonts.py.
//
// Which characters end up in which weight depends on the rendered CSS (font
// weights per element, both languages, both themes, mobile and desktop
// layouts), so it is collected from the running page rather than the source.
// A character it misses still renders correctly — that weight's full font
// file (no unicode-range) is the fallback — it just costs that file's
// download. Re-run after changing homepage copy or font weights, then
// re-run scripts/subset-fonts.py. With the dev server running:
//     npm i --no-save playwright-core
//     node scripts/collect-gensen-chars.mjs [http://localhost:5173/]
// Uses the installed Microsoft Edge (EDGE env var to override the path).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = process.argv[2] || 'http://localhost:5173/';
const browser = await chromium.launch({
  executablePath: process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});

const collect = page => page.evaluate(() => {
  const out = {};
  const add = (el, text) => {
    if (!text || !el) return;
    const st = getComputedStyle(el);
    if (!/GenSen/.test(st.fontFamily)) return;
    const set = (out[st.fontWeight] ||= new Set());
    for (const c of text) if (c.codePointAt(0) > 0x7e) set.add(c);
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) add(n.parentElement, n.nodeValue);
  for (const el of document.querySelectorAll('[placeholder]')) add(el, el.getAttribute('placeholder'));
  return Object.fromEntries(Object.entries(out).map(([w, s]) => [w, [...s].join('')]));
});

const chars = {};
const merge = r => { for (const [w, s] of Object.entries(r)) for (const c of s) (chars[w] ||= new Set()).add(c); };
for (const lang of ['zh', 'en']) for (const theme of ['dark', 'light']) for (const width of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
  await ctx.addInitScript(l => localStorage.setItem('lang', l), lang);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.classList.contains('hero-ready'), null, { timeout: 90000 });
  // Sections mount and unmount around the viewport (LazyUnit), so collect
  // at every step of the way down.
  for (let y = 0; y < 26000; y += 450) {
    merge(await collect(page));
    await page.mouse.wheel(0, 450);
    await page.waitForTimeout(250);
  }
  const more = await page.$('#toggle-portfolio-btn, #toggle-portfolio-icon');
  if (more) { await more.click().catch(() => {}); await page.waitForTimeout(800); merge(await collect(page)); }
  await ctx.close();
}
await browser.close();

const result = Object.fromEntries(Object.keys(chars).sort().map(w => [w, [...chars[w]].sort().join('')]));
fs.writeFileSync(path.join(ROOT, 'scripts', 'gensen-homepage-chars.json'), JSON.stringify(result, null, 2) + '\n');
console.log(Object.entries(result).map(([w, s]) => `${w}: ${[...s].length}`).join('  '));
