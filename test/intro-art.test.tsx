import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { IntroArtSystems, IntroArtVisuals } from '../src/components/IntroArt';
import { INTRO_H, INTRO_W, sceneSystems, sceneVisuals } from '../src/components/introScenes';
import { fitScale } from '../src/components/PrincipleArt';
import { translations } from '../src/i18n/translations';

const css = readFileSync(resolve(__dirname, '../src/styles/intro-art.css'), 'utf8').replace(/\r\n/g, '\n');
const about = readFileSync(resolve(__dirname, '../src/components/AboutSection.tsx'), 'utf8');
const chars = readFileSync(resolve(__dirname, '../scripts/gensen-homepage-chars.json'), 'utf8');
const NINE = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'];

// About's "What I Do" scenes, ported from the Claude Design canvas.
describe('What I Do scenes', () => {
  it('fit their 320 x 232 board inside the stage both ways, centred', () => {
    expect([INTRO_W, INTRO_H]).toEqual([320, 232]);
    // a stage taller than the board: the width decides
    expect(fitScale(160, INTRO_W, 400, INTRO_H)).toBe(0.5);
    // a stage wider than the board: the height decides
    expect(fitScale(640, INTRO_W, 232, INTRO_H)).toBe(1);
    // no height known: the width alone, as for the principle boards
    expect(fitScale(160, INTRO_W)).toBe(0.5);
    expect(fitScale(0, INTRO_W, 232, INTRO_H)).toBe(1);
    expect(css).toMatch(/\.pa-scene\.pa-scene--intro \{\n {2}left: calc\(\(100% - 320px \* var\(--pa-s, 1\)\) \/ 2\);\n {2}top: calc\(\(100% - 232px \* var\(--pa-s, 1\)\) \/ 2\);/);
  });

  it("run the card's full height, down past the notch's band", () => {
    const stage = css.match(/\.principle-stage\.pa-stage\.pa-stage--intro \{([^}]*)\}/)![1];
    expect(stage).toContain('align-self: stretch;');
    expect(stage).toContain('min-height: calc(var(--iw) * 232 / 320);');
    expect(stage).toContain('aspect-ratio: auto;');
    expect(css).toMatch(/\.about-intro-body \{[^}]*margin-bottom: calc\(-1 \* var\(--th, 0px\)\);/);
    // the copy stays centred above the notch, the title clear of its rows
    expect(css).toMatch(/\.about-intro-copy \{[^}]*align-self: center;[^}]*padding-bottom: var\(--th, 0px\);/);
    expect(css).toContain('.about-intro-copy > .bento-label { margin-bottom: 14px; }');
  });

  it('carry the nine translated layer names, and no hard-coded copy', () => {
    for (const html of [sceneSystems(NINE), sceneVisuals(NINE)]) {
      for (const w of NINE) expect(html).toContain(`>${w}</span>`);
      expect(html).not.toMatch(/[一-鿿]/);
    }
    for (const lang of ['zh', 'en'] as const) {
      for (const k of ['about_intro1_layers', 'about_intro2_layers'] as const) {
        expect(translations[lang][k].split('|')).toHaveLength(9);
      }
    }
  });

  it('use only characters the homepage font subset carries', () => {
    const zh = translations.zh.about_intro1_layers + translations.zh.about_intro2_layers;
    for (const c of zh.replace(/[A-Za-z0-9 /|]/g, '')) expect(chars).toContain(c);
  });

  it('prefix every class, each animated by keyframes of its own', () => {
    for (const [id, html] of [['sys', sceneSystems(NINE)], ['vis', sceneVisuals(NINE)]] as const) {
      const classes = [...html.matchAll(/class="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/));
      expect(classes.length).toBeGreaterThan(0);
      for (const c of classes) expect(c.startsWith('pa-wd-') || c.startsWith(`pa-${id}-`)).toBe(true);
      for (const c of new Set(classes)) expect(css).toContain(`.${c}{`);
    }
    for (const [, k] of css.matchAll(/animation(?:-name)?: ?(pa-[a-z]+-[a-z0-9]+)/g)) expect(css).toContain(`@keyframes ${k}{`);
    // three scenes on one 12s clock, the cursor on it too
    expect(css).toContain('.pa-wd-a{animation-duration:12s;');
    expect(css).toContain('.pa-wd-cur{animation:pa-wd-cur 12s ');
  });

  it("light the card's line on the scene's clock", () => {
    for (const n of [1, 2, 3]) {
      expect(css).toContain(`.about-intro-copy .bento-point:nth-child(${n}) > .bento-point-label::before { animation-name: pa-wd-p${n}; }`);
    }
    expect(css).toMatch(/\.about-intro-copy \.bento-point-label::before \{[^}]*animation: 12s ease-in-out infinite both;/);
  });

  it('stand still on the first scene for reduced motion', () => {
    const rm = css.match(/@media \(prefers-reduced-motion: reduce\)\{(.*)\}\n?$/m)![1];
    expect(rm).toContain('.pa-wd-a,');
    expect(rm).toContain('animation:none');
    expect(rm).toContain('.pa-wd-p2,.pa-wd-p3,');
    expect(rm).toContain('.about-intro-copy .bento-point:nth-child(1) > .bento-point-label::before{opacity:1}');
  });

  it('take the light theme through the stage variables', () => {
    for (const html of [sceneSystems(NINE), sceneVisuals(NINE)]) {
      for (const v of ['--pa-panel', '--pa-line', '--pa-screen-edge', '--pa-comp']) expect(html).toContain(`var(${v})`);
    }
    expect(css).toMatch(/:root\[data-theme="light"\] \.principle-stage\.pa-stage\.pa-stage--intro \{ --pa-comp: #[0-9a-f]{6}; \}/);
  });

  it('stack the scene over the copy in a narrow card', () => {
    expect(css).toMatch(/\.about-intro-body \{\n {2}container-type: inline-size;/);
    expect(css).toMatch(/@container \(max-width: 560px\) \{\n {2}\.about-intro-body > \.about-intro-row \{\n {4}flex-direction: column;/);
  });

  it('render a stage, marked as the intro variant, scaled to the stage', () => {
    for (const el of [<IntroArtSystems key="sys" layers={NINE} />, <IntroArtVisuals key="vis" layers={NINE} />]) {
      const { container, unmount } = render(el);
      const stage = container.querySelector<HTMLElement>('.principle-stage.pa-stage.pa-stage--intro')!;
      expect(stage.getAttribute('aria-hidden')).toBe('true');
      expect(stage.querySelector('.pa-scene.pa-scene--intro')).not.toBeNull();
      expect(stage.style.getPropertyValue('--pa-s')).toBe('1');
      unmount();
    }
  });

  it('sit on the left of both intro cards', () => {
    expect(about).toMatch(/<IntroArtSystems layers=\{t\.about_intro1_layers\.split\('\|'\)\} \/>\s*<div className="about-intro-copy">/);
    expect(about).toMatch(/<IntroArtVisuals layers=\{t\.about_intro2_layers\.split\('\|'\)\} \/>\s*<div className="about-intro-copy">/);
  });
});
