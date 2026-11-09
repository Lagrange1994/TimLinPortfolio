import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { render } from '@testing-library/react';
import { PrincipleArtContext, PrincipleArtRules, PrincipleArtSubtract, SCENE_W, fitScale } from '../src/components/PrincipleArt';
import { sceneContext, sceneRules, sceneSubtract } from '../src/components/principleScenes';

const css = readFileSync(resolve(__dirname, '../src/styles/principle-art.css'), 'utf8').replace(/\r\n/g, '\n');

// About's design-principle scenes, ported from the Claude Design canvas.
describe('design-principle scenes', () => {
  it('scale the fixed board to the stage width', () => {
    expect(SCENE_W).toBe(582);
    expect(fitScale(291)).toBe(0.5);
    expect(fitScale(582)).toBe(1);
    // not laid out yet (0 wide): full size, never 0 or NaN
    expect(fitScale(0)).toBe(1);
    expect(css).toMatch(/\.principle-stage\.pa-stage \{[^}]*aspect-ratio: 582 \/ 296;/);
    expect(css).toMatch(/\.pa-scene \{[^}]*width: 582px;[^}]*height: 296px;[^}]*transform: scale\(var\(--pa-s, 1\)\);/);
  });

  it('carry the translated situation words, and no hard-coded copy', () => {
    const env = sceneContext({ modes: ['M1', 'M2', 'M3'], reach: ['R1', 'R2', 'R3'] });
    for (const w of ['M1', 'M2', 'M3', 'R1', 'R2', 'R3']) expect(env).toContain(`>${w}<`);
    const rule = sceneRules({ states: ['S1', 'S2'], steps: ['P1', 'P2', 'P3'] });
    for (const w of ['S1', 'S2', 'P1', 'P2', 'P3']) expect(rule).toContain(w);
    for (const html of [env, sceneSubtract(), rule]) expect(html).not.toMatch(/[一-鿿]/);
  });

  it('prefix every class per scene, each animated by its own keyframes', () => {
    for (const [id, html] of [['env', sceneContext({ modes: ['', '', ''], reach: ['', '', ''] })], ['cut', sceneSubtract()], ['rule', sceneRules({ states: ['', ''], steps: ['', '', ''] })]] as const) {
      const classes = [...html.matchAll(/class="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/));
      expect(classes.length).toBeGreaterThan(0);
      for (const c of classes) expect(c.startsWith(`pa-${id}-`)).toBe(true);
      for (const [, k] of css.matchAll(/animation(?:-name)?:(pa-[a-z]+-[a-z0-9]+)/g)) expect(css).toContain(`@keyframes ${k}{`);
    }
    // 01's three settings: one 9s loop, setting 2 / 3 starting 6s / 3s in
    expect(css).toContain('.pa-env-env{animation:pa-env-env 9s ease-in-out infinite}');
    expect(css).toContain('.pa-env-e2{animation-delay:-6s}');
    expect(css).toContain('.pa-env-e3{animation-delay:-3s}');
  });

  it('stand still for reduced motion', () => {
    for (const id of ['env', 'cut', 'rule']) expect(css).toMatch(new RegExp(`@media \\(prefers-reduced-motion: reduce\\)\\{[^\\n]*\\.pa-${id}-[a-z]+[^\\n]*animation:none`));
    // the settings / the black box that would otherwise cover what comes next
    expect(css).toContain('.pa-env-e2,.pa-env-e3{opacity:0}');
    expect(css).toContain('.pa-rule-hidden{opacity:0}');
  });

  it('take the light theme through variables', () => {
    const html = sceneContext({ modes: ['', '', ''], reach: ['', '', ''] }) + sceneSubtract() + sceneRules({ states: ['', ''], steps: ['', '', ''] });
    for (const v of ['--pa-panel', '--pa-screen', '--pa-muted']) expect(html).toContain(`var(${v})`);
    const light = css.match(/:root\[data-theme="light"\] \.principle-stage\.pa-stage \{([^}]*)\}/)![1];
    for (const v of ['--pa-panel', '--pa-line', '--pa-muted', '--pa-chip', '--pa-text', '--pa-screen', '--pa-screen-edge']) expect(light).toContain(`${v}:`);
  });

  it('render a stage with its scene, scaled to the stage', () => {
    for (const el of [
      createElement(PrincipleArtContext, { modes: ['a', 'b', 'c'], reach: ['d', 'e', 'f'] }),
      createElement(PrincipleArtSubtract),
      createElement(PrincipleArtRules, { states: ['a', 'b'], steps: ['c', 'd', 'e'] }),
    ]) {
      const { container, unmount } = render(el);
      const stage = container.querySelector<HTMLElement>('.principle-stage.pa-stage')!;
      expect(stage.getAttribute('aria-hidden')).toBe('true');
      expect(stage.querySelector('.pa-scene')).not.toBeNull();
      // jsdom has no layout: 0 wide, so the board sits at full size
      expect(stage.style.getPropertyValue('--pa-s')).toBe('1');
      unmount();
    }
  });
});
