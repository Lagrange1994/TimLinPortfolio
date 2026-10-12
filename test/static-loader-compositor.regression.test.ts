import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { translations } from '../src/i18n/translations';

const read = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');
const html = read('index.html');

// Regression: the homepage loading ring stuttered on first load. Its keyframes
// animated `inset` (layout → main thread only), and the main thread is blocked
// for seconds at a time while the Spline scenes parse and compile. The loader
// is now static markup in index.html whose every moving part animates only
// transform/opacity, so the compositor keeps it running through those blocks.
describe('static homepage loader', () => {
  const style = html.slice(html.indexOf('/* ── LOADER ──'), html.indexOf('</style>', html.indexOf('/* ── LOADER ──')));
  const body = html.slice(html.indexOf('<body>'));

  it('is in the served HTML, outside #root, before the bundle', () => {
    const loaderAt = body.indexOf('id="page-loader"');
    const rootAt = body.indexOf('<div id="root">');
    const bundleAt = body.indexOf('src="/src/main.tsx"');
    expect(loaderAt).toBeGreaterThan(-1);
    expect(loaderAt).toBeLessThan(rootAt);
    expect(rootAt).toBeLessThan(bundleAt);
  });

  it('every loader keyframe animates only transform or opacity', () => {
    const blocks = [...style.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})+)\s*\}/g)];
    expect(blocks.map(b => b[1]).sort()).toEqual(
      ['loader-orbit', 'loader-step', 'ls-clip-a', 'ls-clip-b', 'ls-half-a', 'ls-half-b'].sort(),
    );
    for (const [, name, frames] of blocks) {
      const props = [...frames.matchAll(/([\w-]+)\s*:/g)].map(m => m[1]);
      expect(props.length, name).toBeGreaterThan(0);
      for (const prop of props) expect(['transform', 'opacity'], `${name} → ${prop}`).toContain(prop);
    }
  });

  it('no layout property is animated anywhere in the loader', () => {
    expect(style).not.toMatch(/@keyframes[^}]*\{[^}]*\b(inset|top|left|right|bottom|width|height)\s*:/);
  });

  it('the lap is one quarter (0.625s) turned in 4 steps over the original 2.5s', () => {
    expect(style).toMatch(/\.loader-orbit\s*\{[^}]*animation:\s*loader-orbit 2\.5s steps\(4\) infinite/);
    for (const part of ['ls-clip-a', 'ls-clip-b', 'ls-half-a', 'ls-half-b']) {
      expect(style).toMatch(new RegExp(`\\.${part}\\s*\\{[^}]*animation:\\s*${part} 0\\.625s infinite`));
    }
    expect(style).toMatch(/\.loader-snake-2\s*\{\s*transform:\s*rotate\(180deg\)/);
  });

  it('has two snakes of two clipped half-pills each', () => {
    expect(body.match(/class="loader-snake(?: loader-snake-2)?"/g)).toHaveLength(2);
    expect(body.match(/<div class="ls-clip ls-clip-a"><i class="ls-half ls-half-a"><\/i><\/div>/g)).toHaveLength(2);
    expect(body.match(/<div class="ls-clip ls-clip-b"><i class="ls-half ls-half-b"><\/i><\/div>/g)).toHaveLength(2);
  });

  // Regression: the pill's straight sides were separate 3px bars stretched
  // with scaleY while its round ends were bordered caps that only translated.
  // The GPU resamples a scaled layer and not a translated one, so the sides
  // came out a different thickness from the ends. Each half is now ONE border
  // (cap + its full 35px of side) and nothing in the loader scales.
  it('draws cap and side as one border, and never scales anything', () => {
    expect(style.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/scale/i);
    expect(style).toMatch(/\.ls-half\s*\{[^}]*width:\s*30px;\s*height:\s*50px;\s*border:\s*3px solid currentColor;/);
    expect(style).toMatch(/\.ls-half-a\s*\{[^}]*border-bottom:\s*0;\s*border-radius:\s*15px 15px 0 0;/);
    expect(style).toMatch(/\.ls-half-b\s*\{[^}]*border-top:\s*0;\s*border-radius:\s*0 0 15px 15px;/);
    expect(style).toMatch(/\.ls-clip\s*\{[^}]*overflow:\s*hidden;/);
    expect(style).not.toMatch(/ls-line|ls-cap/);
  });

  // Each window's travel plus its half's travel is the half's real position:
  // top cap 0 → 0 → 35px, bottom cap 0 → 35px → 35px (the original lap).
  it('window + half translations add up to the original cap motion', () => {
    const at = (name: string) => {
      const frames = style.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*?\\})\\s*\\}`))![1];
      const y: Record<string, number> = {};
      for (const [, stops, v] of frames.matchAll(/([\d%,\s]+)\{\s*transform:\s*translateY\((-?\d+)(?:px)?\);\s*\}/g)) {
        for (const stop of stops.split(',')) y[stop.trim()] = Number(v);
      }
      return [y['0%'], y['50%'], y['100%']];
    };
    const sum = (a: number[], b: number[]) => a.map((v, i) => v + b[i]);
    expect(sum(at('ls-clip-a'), at('ls-half-a'))).toEqual([0, 0, 35]);
    expect(sum(at('ls-clip-b'), at('ls-half-b'))).toEqual([0, 35, 35]);
  });

  it('pins both themes to the same flat colours the page starts on', () => {
    expect(style).toMatch(/\.loader\s*\{[^}]*background:\s*#0A0912;[^}]*color:\s*#fff;/);
    expect(style).toMatch(/html\[data-theme="light"\] \.loader\s*\{\s*background:\s*#F7FAFC;\s*color:\s*#3A3A42;/);
  });

  it('status copy matches translations.ts in both languages', () => {
    const zh = translations.zh as Record<string, string>;
    const en = translations.en as Record<string, string>;
    const keys = ['loader_step1', 'loader_step2', 'loader_step3', 'loader_step4'];
    const spans = [...body.matchAll(/<span class="loader-(?:step|done)"[^>]*>([^<]+)<\/span>/g)].map(m => m[1]);
    expect(spans).toEqual(keys.map(k => zh[k]));
    const enList = body.match(/var en = \[([^\]]+)\]/)?.[1] ?? '';
    const enStrings = [...enList.matchAll(/'([^']+)'/g)].map(m => m[1]);
    expect(enStrings).toEqual(keys.map(k => en[k]));
  });

  it('portfolio.css no longer defines the loader (single source: index.html)', () => {
    const css = read('src/styles/portfolio.css');
    expect(css).not.toMatch(/^\s*\.loader(?:-animation|-text)?[\s.:{,]/m);
    expect(css).not.toMatch(/@keyframes l4\b/);
  });

  // Regression: only the dark hero background was preloaded (scene on desktop,
  // webp on phones), so a light-theme visitor downloaded one they never show
  // and the loader then waited for their own to start late.
  it('preloads the hero background of the active theme only', () => {
    expect(html).not.toMatch(/<link rel="preload"[^>]*bg_scene(_w)?\.splinecode/);
    expect(html).not.toMatch(/<link rel="preload"[^>]*\/img\/bg(_w)?\.webp/);
    expect(html).toContain("link.href = light ? '/models/bg_scene_w.splinecode' : '/models/bg_scene.splinecode';");
    expect(html).toContain("link.href = light ? '/img/bg_w.webp' : '/img/bg.webp';");
    expect(html).toContain("window.matchMedia('(min-width: 768px)').matches");
  });

  it('Loader.tsx listens for load-complete, not a native load, on the viewers', () => {
    const src = read('src/components/Loader.tsx');
    expect(src).toMatch(/addEventListener\('load-complete', onViewerEvent, true\)/);
    expect(src).not.toMatch(/addEventListener\('load',/);
  });
});
