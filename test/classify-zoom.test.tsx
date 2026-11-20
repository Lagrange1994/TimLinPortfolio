import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { relayFrame, miniBox, arcPoint, dropCtrl, outCtrl, TEXT_AT, RELAY_START, REWIND_START, RELAY_DURATION, MINI_ASPECT, MINI_GAP } from '../src/utils/useClassifyZoom';
import ClassifyMini, { PROBLEM_PILLS, SOLUTION_CHIPS, AI_X } from '../src/components/ClassifyMini';
import GoogleGeminiEffect, { GEMINI_BEAM_STOPS } from '../src/components/GoogleGeminiEffect';

const root = resolve(__dirname, '..');
describe('classify chart: icon → chart, as a relay', () => {
  const first = (xs: number[]) => xs.findIndex(v => v > 0);
  const startOf = (pick: (f: ReturnType<typeof relayFrame>) => number) => {
    for (let p = 0; p <= 1.0001; p += 0.005) if (pick(relayFrame(p)) > 0) return p;
    return 2;
  };
  const doneBy = (pick: (f: ReturnType<typeof relayFrame>) => number) => {
    for (let p = 0; p <= 1.0001; p += 0.005) if (pick(relayFrame(p)) >= 1) return p;
    return 2;
  };

  it('starts as the icon alone: card and chips on, nothing of the chart', () => {
    const f = relayFrame(0);
    expect(f.frame).toBe(1);
    expect(f.ghost).toBe(1);
    expect(first(f.words)).toBe(-1);
    expect(f.core).toBe(0);
    expect(first(f.beams)).toBe(-1);
    expect(f.chips.every(c => c.raw === 0 && c.pop === 0)).toBe(true);
    expect(f.text).toBe(0);
  });

  it('ends as the chart alone, every piece in place, with its words', () => {
    const f = relayFrame(1);
    expect(f.frame + 0).toBe(0);
    expect(f.ghost + 0).toBe(0);
    expect(f.words.every(v => v === 1)).toBe(true);
    expect(f.core).toBe(1);
    expect(f.processing + 0).toBe(0);
    expect(f.beams.every(v => v === 1)).toBe(true);
    expect(f.chips.every(c => c.raw === 1 && c.pop === 1)).toBe(true);
    expect(f.text).toBe(1);
  });

  it('problems >> AI >> solution: each starts after the one before', () => {
    const words = startOf(f => f.words[0]);
    const core = startOf(f => f.core);
    const beams = startOf(f => f.beams[0]);
    const chips = startOf(f => f.chips[0].raw);
    expect(startOf(f => 1 - f.frame)).toBeLessThan(words + 0.001);
    expect(words).toBeLessThan(core);
    expect(core).toBeLessThan(beams);
    expect(beams).toBeLessThan(chips);
    // the AI is in the middle before the beams draw through it
    expect(doneBy(f => f.core)).toBeLessThan(doneBy(f => f.beams[0]));
    // words only once everything is there
    const settled = Math.max(doneBy(f => Math.min(...f.words)), doneBy(f => Math.min(...f.beams)), doneBy(f => Math.min(...f.chips.map(c => c.raw))));
    const textAt = TEXT_AT;
    expect(settled).toBeLessThan(textAt);
    expect(relayFrame(textAt - 0.01).text).toBe(0);
    expect(relayFrame(textAt + 1e-9).text).toBe(1);
  });

  it('one at a time: words, beams and chips each staggered top down', () => {
    for (const pick of [(f: ReturnType<typeof relayFrame>, i: number) => f.words[i], (f: ReturnType<typeof relayFrame>, i: number) => f.beams[i], (f: ReturnType<typeof relayFrame>, i: number) => f.chips[i].raw]) {
      expect(startOf(f => pick(f, 0))).toBeLessThan(startOf(f => pick(f, 1)));
      expect(startOf(f => pick(f, 1))).toBeLessThan(startOf(f => pick(f, 3)));
    }
  });

  it('the chips pop: past their place, then back', () => {
    let over = 0;
    for (let p = 0; p <= 1.0001; p += 0.005) over = Math.max(over, relayFrame(p).chips[0].pop);
    // a soft pop: past its place a little, not a bounce
    expect(over).toBeGreaterThan(1.02);
    expect(over).toBeLessThan(1.08);
  });

  it('the AI works hardest while the beams draw, then calms down', () => {
    const at = (q: number) => relayFrame(q);
    expect(at(0.2).processing).toBe(0);
    expect(at(0.6).processing).toBeGreaterThan(0.9);
    expect(at(0.95).processing + 0).toBe(0);
  });

  it('progress is clamped; counts follow the chart', () => {
    expect(relayFrame(-1)).toEqual(relayFrame(0));
    expect(relayFrame(2)).toEqual(relayFrame(1));
    const f = relayFrame(0.5, 7, 3, 4);
    expect([f.words.length, f.chips.length, f.beams.length]).toEqual([7, 3, 4]);
  });

  it('CSS: no frame on the chart; the icon card dissolves; the AI core at the beams', () => {
    const css = readFileSync(resolve(root, 'src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
    expect(css).not.toContain('.ai-classify-stage::before');
    expect(css).not.toContain('--classify-frame');
    expect(css).not.toMatch(/\.ai-classify-stage \{[^}]*(border:|background-color:|padding:|transform)/);
    expect(css).toMatch(/\.ai-classify-mini::before \{[^}]*opacity: var\(--mini-frame, 1\);/);
    expect(css).toMatch(/\.ai-classify-mini \.mini-sol \{\s*opacity: var\(--mini-ghost, 1\);/);
    expect(css).toMatch(/\.ai-classify-core \{[^}]*left: 51\.1%;[^}]*top: 50\.8%;/);
    // the core breathes and ripples like the Figma MCP hub; processing brightens the ripple
    expect(css).toMatch(/\.ai-classify-core::after \{[^}]*border-radius: 50%;[^}]*animation: classify-core-ripple 2\.4s/);
    expect(css).toMatch(/\.ai-classify-core::after \{\s*animation-delay: 1\.2s;/);
    expect(css).toMatch(/@keyframes classify-core-ripple \{[^}]*\}[^}]*opacity: calc\(\.6 \+ \.3 \* var\(--core-processing\)\); scale: 1\.04;[^}]*\}[^}]*opacity: 0; scale: 1\.6;/);
    expect(css).toMatch(/\.ai-classify-core-dot \{[^}]*animation: classify-core-breathe 2\.4s/);
    // same mark as the Scenario card's AI node: flat #6c63ff disc, Phosphor sparkle
    expect(css).toMatch(/\.ai-classify-core-dot \{[^}]*background: #6c63ff;/);
    expect(css).not.toMatch(/\.ai-classify-core::before \{[^}]*dashed/);
    // the cloud only unclips while pieces fly in
    expect(css).toMatch(/\.ai-classify-stage\.is-relaying \.ai-word-cloud \{\s*overflow: visible;/);
    expect(css).not.toMatch(/\.ai-classify-stage \.ai-word-cloud \{/);
  });

  it('the hook moves pieces with translate/scale/rotate, never their own transform', () => {
    const hook = readFileSync(resolve(root, 'src/utils/useClassifyZoom.ts'), 'utf8');
    expect(hook).toContain('el.style.translate =');
    expect(hook).not.toMatch(/\.style\.transform =/);
    expect(hook).toContain("'.ai-classify-core'");
    expect(hook).toContain('strokeDashoffset');
  });

  it('the finished chart is the chart as it was: at the end every inline style comes off', () => {
    const hook = readFileSync(resolve(root, 'src/utils/useClassifyZoom.ts'), 'utf8').replace(/\r\n/g, '\n');
    expect(hook).toMatch(/if \(p >= 1\) \{[^}]*settle\(\);/);
    const settle = hook.slice(hook.indexOf('const settle = () => {'), hook.indexOf('let miniShown'));
    for (const s of ['removeProperty(prop)', "removeProperty('stroke-dashoffset')", "classList.remove('is-relaying')", 'wordOpacity[i]']) expect(settle).toContain(s);
  });

  it('fired at a threshold, then plays at its own pace: not scrubbed by the scroll', () => {
    const hook = readFileSync(resolve(root, 'src/utils/useClassifyZoom.ts'), 'utf8').replace(/\r\n/g, '\n');
    const st = hook.slice(hook.indexOf('ScrollTrigger.create({'), hook.indexOf('});', hook.indexOf('ScrollTrigger.create({')));
    expect(st).toContain('start: RELAY_START,');
    expect(st).not.toContain('once:');
    expect(st).toContain('onEnter: fire,');
    // scrolling back above the threshold rewinds it, also at its own pace
    expect(st).toContain('onLeaveBack: rewind,');
    expect(st).not.toMatch(/scrub|onUpdate|end:/);
    // one paused timed tween drives it, linear (relayFrame eases each piece)
    expect(hook).toContain("gsap.to(clock, { p: 1, duration: RELAY_DURATION, ease: 'none', paused: true, onUpdate: () => apply(clock.p) })");
    expect(hook).toContain('const fire = () => { play.play(); };');
    expect(hook).toContain('const rewind = () => { play.reverse(); };');
    expect(hook).toContain('play.kill();');
    // fires with the icon well up the screen; takes its time
    expect(RELAY_START).toBe('top 92%');
    // scrolling back up, it rewinds once the heading drops past 60% of the screen
    expect(REWIND_START).toBe('top 60%');
    const rw = hook.slice(hook.lastIndexOf('ScrollTrigger.create({'));
    expect(rw).toMatch(/start: REWIND_START,\s*onLeaveBack: rewind,\s*\}\);/);
    expect(RELAY_DURATION).toBeGreaterThanOrEqual(3);
  });

  it('slow and soft: long per-piece moves, curved paths', () => {
    // each word takes over a third of the relay
    const t0 = (pick: (p: number) => number) => { for (let p = 0; p <= 1; p += 0.002) if (pick(p) > 0) return p; return 1; };
    const t1 = (pick: (p: number) => number) => { for (let p = 0; p <= 1; p += 0.002) if (pick(p) >= 1) return p; return 1; };
    expect(t1(p => relayFrame(p).words[0]) - t0(p => relayFrame(p).words[0])).toBeGreaterThan(0.33);
  });

  it('moves fast in, slow out: most of the way early, a long glide at the end', () => {
    // word 0 runs 0.04 → 0.40,
    // the AI 0.20 → 0.50, beam 0 0.42 → 0.68
    const relayFrameAt = (q: number) => relayFrame(q);
    const mid = (a: number, b: number) => (a + b) / 2;
    expect(relayFrameAt(mid(0.04, 0.4)).words[0]).toBeGreaterThan(0.8);
    expect(relayFrameAt(mid(0.2, 0.5)).core).toBeGreaterThan(0.8);
    expect(relayFrameAt(mid(0.42, 0.68)).beams[0]).toBeGreaterThan(0.8);
    // fast in: the first tenth already covers a quarter of the way
    expect(relayFrameAt(0.04 + 0.036).words[0]).toBeGreaterThan(0.25);
    // slow out: the last tenth covers under 1%
    expect(1 - relayFrameAt(0.4 - 0.036).words[0]).toBeLessThan(0.01);
  });

  it('arcPoint: ends on its ends, bends towards its control point', () => {
    const from = { x: 0, y: 0 }, to = { x: 100, y: 100 };
    expect(arcPoint(from, { x: 0, y: 100 }, to, 0)).toEqual(from);
    expect(arcPoint(from, { x: 0, y: 100 }, to, 1)).toEqual(to);
    // a straight line would pass (50, 50); the curve sags towards (0, 100)
    expect(arcPoint(from, { x: 0, y: 100 }, to, 0.5)).toEqual({ x: 25, y: 75 });
    // falling: mostly down first; sent out: along its starting row first
    const drop = dropCtrl({ x: 800, y: 0 }, { x: 0, y: 400 });
    expect(drop.y).toBeGreaterThan(300);
    expect(drop.x).toBeGreaterThan(500);
    expect(outCtrl({ x: 0, y: 50 }, { x: 100, y: 300 })).toEqual({ x: 60, y: 50 });
  });

  it('the icon: problems (tilted pills, a tangle) >> solution (sorted chips with checks), no text', () => {
    const { container } = render(<ClassifyMini />);
    const pills = [...container.querySelectorAll('.mini-pill')];
    expect(pills).toHaveLength(PROBLEM_PILLS.length);
    for (const p of pills) expect(p.getAttribute('transform')).toMatch(/^rotate\(-?\d+ /);
    expect(container.querySelectorAll('.mini-tangle')).toHaveLength(1);
    // the AI mark at work between them: flow in, spinning ring, spark, flow out
    expect(container.querySelectorAll('.mini-flow')).toHaveLength(2);
    for (const c of ['.mini-ai-ring', '.mini-ai-core', '.mini-ai-spark']) expect(container.querySelector(`.mini-ai ${c}`), c).not.toBeNull();
    // problems left of it, solution right of it
    expect(Math.max(...PROBLEM_PILLS.map(([x, , w]) => x + w))).toBeLessThan(AI_X - 17);
    const css = readFileSync(resolve(root, 'src/styles/portfolio.css'), 'utf8');
    expect(css).toMatch(/\.mini-ai-ring \{[^}]*animation: mini-spin/);
    expect(css).toMatch(/\.mini-flow \{[^}]*animation: mini-flow/);
    expect(container.querySelectorAll('.mini-chip')).toHaveLength(4);
    // the sorted side fades as one (--mini-ghost)
    expect(container.querySelectorAll('g.mini-sol')).toHaveLength(4);
    expect([...container.querySelectorAll('g:not(.mini-ai) > circle')].map(c => c.getAttribute('fill'))).toEqual(GEMINI_BEAM_STOPS.slice(0, 4).map(s => s.color));
    expect(SOLUTION_CHIPS).toHaveLength(4);
    expect(container.querySelector('text')).toBeNull();
    expect(container.textContent).toBe('');
  });

  it('the icon sits right of the Scenario card: same height and bottom', () => {
    const card = { left: 100, top: 500, right: 396, bottom: 618 };
    const wrap = { left: 50, top: 700, right: 1400, bottom: 1400 };
    expect(miniBox(card, wrap)).toEqual({ left: 346 + MINI_GAP, top: -200, width: 118 * MINI_ASPECT, height: 118 });
    // on a zoomed page the on-screen px turn back into layout px
    expect(miniBox(card, wrap, 2)).toEqual({ left: 692 + MINI_GAP, top: -400, width: 236 * MINI_ASPECT, height: 236 });
  });

  it('wiring: icon first in the wrapper after the viewer, the chart framed after the heading, words wrapped to fade', () => {
    const src = readFileSync(resolve(root, 'src/components/SkillsSection.tsx'), 'utf8');
    const wrapAt = src.indexOf('<div className="ai-classify">');
    expect(src.indexOf('{aiViewer}')).toBeLessThan(wrapAt);
    expect(wrapAt).toBeLessThan(src.indexOf('<ClassifyMini />'));
    expect(src.indexOf('<ClassifyMini />')).toBeLessThan(src.indexOf('className="ai-chips-header'));
    expect(src.indexOf('className="ai-chips-header')).toBeLessThan(src.indexOf('className="ai-classify-stage"'));
    expect(src).not.toContain('ai-classify-slot');
    // called after viewerRef exists
    expect(src.indexOf('const viewerRef = useRef')).toBeLessThan(src.indexOf('useClassifyZoom(viewerRef, classifyMiniRef, classifyStageRef);'));
    expect(src).toContain('<span className="ai-classify-txt">{word.text}</span>');
    expect(src).toContain('<span className="ai-classify-txt">{chip.label}</span>');
    // the heading only shows with the chart's words, not on its own
    expect(src).toContain('<div className="ai-chips-header ai-classify-txt">');
    expect(src).not.toContain('ai-chips-header rise-card');
    expect(readFileSync(resolve(root, 'src/utils/useClassifyZoom.ts'), 'utf8')).toContain("wrap.style.setProperty('--classify-text'");
    const css = readFileSync(resolve(root, 'src/styles/portfolio.css'), 'utf8');
    expect(css).toMatch(/\.ai-classify-txt \{\s*opacity: var\(--classify-text, 1\);\s*transition: opacity/);
    // hidden until placed
    expect(css).toMatch(/\.ai-classify-mini \{[^}]*display: none;/);
    expect(css).toMatch(/\.ai-classify-mini\.is-placed \{\s*display: block;/);
    // the AI core sits in the beams' row; the beams are scrubbed, not timed
    const row = src.slice(src.indexOf('<div className="ai-chips-row">'), src.indexOf('<div className="ai-chips">'));
    expect(row).toContain('<GoogleGeminiEffect onArriveChange={setArrivedBeams} scrubbed />');
    expect(row).toContain('<span className="ai-classify-core" aria-hidden="true">');
    expect(row).toContain('<i className="ph-fill ph-sparkle" />');
  });
});

describe('GoogleGeminiEffect scrubbed', () => {
  // jsdom has neither; motion's whileInView needs the observer
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} });
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('draws plain dashed paths someone else scrubs, and counts every chip as arrived', () => {
    let arrived: boolean[] = [];
    const { container } = render(<GoogleGeminiEffect scrubbed onArriveChange={a => { arrived = a; }} />);
    const paths = [...container.querySelectorAll('path')];
    expect(paths).toHaveLength(10);
    for (const p of paths) {
      expect(p.getAttribute('pathLength')).toBe('1');
      expect(p.getAttribute('stroke-dasharray')).toBe('1 1');
    }
    expect(arrived).toEqual([true, true, true, true, true]);
  });

  it('otherwise plays on view as before: no dashes, nothing arrived yet', () => {
    let arrived: boolean[] = [];
    const { container } = render(<GoogleGeminiEffect onArriveChange={a => { arrived = a; }} />);
    expect(container.querySelectorAll('path[stroke-dasharray="1 1"]')).toHaveLength(0);
    expect(arrived).toEqual([]);
  });
});
