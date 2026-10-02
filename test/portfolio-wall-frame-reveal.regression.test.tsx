import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render } from '@testing-library/react';
import { LangProvider } from '../src/context/LangContext';
import PortfolioSection from '../src/components/PortfolioSection';

// The notched wall used to only fade in (opacity-only, after a scroll-settle
// debounce) while the headline text rose — a transform on the frame detached
// the notch outline from text that was still mid-rise. Now the wall and the
// "View All" button run the same y/opacity tween as the text, added to the
// label's own timeline when it fires 'rise-start', so everything moves as one
// beat (measured in a real browser: label/title/sub/button offsets from the
// frame stay constant for the whole entrance, phone and desktop).
const state = vi.hoisted(() => ({
  toCalls: [] as unknown[][],
  setCalls: [] as unknown[][],
  stCreateCalls: [] as unknown[][],
}));

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    to: (...args: unknown[]) => { state.toCalls.push(args); },
    fromTo: vi.fn(),
    killTweensOf: vi.fn(),
    set: (...args: unknown[]) => { state.setCalls.push(args); },
    context: (fn: () => void) => { fn(); return { revert: vi.fn() }; },
  },
}));
vi.mock('gsap/ScrollTrigger', () => ({
  default: {
    create: (...args: unknown[]) => { state.stCreateCalls.push(args); return { kill: vi.fn() }; },
  },
}));

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

describe('wall frame rises with the headline text', () => {
  beforeEach(() => {
    state.toCalls = [];
    state.setCalls = [];
    state.stCreateCalls = [];
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts hidden and offset, then adds a y + opacity tween to the label's timeline on rise-start, once", () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    render(<LangProvider><PortfolioSection /></LangProvider>);
    const frame = document.querySelector('.portfolio-wall-frame')!;
    const row = document.querySelector('.view-all-row')!;
    const label = document.querySelector('#portfolio .section-label')!;
    const section = document.getElementById('portfolio')!;

    // Initial hidden + offset state is the shared RISE_FROM, for both the
    // wall and the button that sits in its leg notch.
    const initialSet = state.setCalls.find(c => Array.isArray(c[0]) && (c[0] as unknown[]).includes(frame)) as
      | [Element[], { autoAlpha: number; y: number }]
      | undefined;
    expect(initialSet?.[0]).toEqual([frame, row]);
    // Same distance as the label/title/sub (data-rise-y), not the 28px default.
    expect(initialSet?.[1]).toEqual({ autoAlpha: 0, y: 72 });

    // No scroll listener / ScrollTrigger of its own: the label's trigger drives it.
    expect(state.stCreateCalls.find(c => (c[0] as { trigger?: unknown }).trigger === frame)).toBeUndefined();

    const tl = { fromTo: vi.fn() };
    // Events from anything other than the label are ignored.
    section.dispatchEvent(new CustomEvent('rise-start', { detail: { tl, dir: 1, riseY: 72 } }));
    expect(tl.fromTo).not.toHaveBeenCalled();

    label.dispatchEvent(new CustomEvent('rise-start', { bubbles: true, detail: { tl, dir: -1, riseY: 72 } }));
    expect(tl.fromTo).toHaveBeenCalledTimes(1);
    const [targets, from, vars, position] = tl.fromTo.mock.calls[0];
    // Enters from the same side as the text: dir -1 (scrolling up) = from above.
    expect(from).toEqual({ autoAlpha: 0, y: -72 });
    expect(targets).toEqual([frame, row]);
    expect(vars).toMatchObject({ y: 0, autoAlpha: 1, clearProps: 'transform' });
    expect(vars.duration).toBeGreaterThan(0);
    // Never scale or clip the frame (its top edge would drift from the text /
    // the outline stroke's bleed would be cut).
    for (const key of ['scale', 'scaleX', 'scaleY', 'rotation', 'clipPath']) expect(vars).not.toHaveProperty(key);
    expect(position).toBe(0);

    // Plays once.
    label.dispatchEvent(new CustomEvent('rise-start', { bubbles: true, detail: { tl, dir: 1, riseY: 72 } }));
    expect(tl.fromTo).toHaveBeenCalledTimes(1);
    // And never via its own free-standing tween.
    expect(state.toCalls.find(c => c[0] === frame || (Array.isArray(c[0]) && c[0].includes(frame)))).toBeUndefined();
  });

  it('prefers-reduced-motion visitors skip the reveal and land fully visible', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    render(<LangProvider><PortfolioSection /></LangProvider>);
    const frame = document.querySelector('.portfolio-wall-frame')!;
    const row = document.querySelector('.view-all-row')!;
    expect(state.setCalls).toContainEqual([[frame, row], { clearProps: 'all' }]);
    expect(state.setCalls.find(c => (c[1] as { autoAlpha?: number })?.autoAlpha === 0)).toBeUndefined();
  });
});

describe('rise grouping plumbing', () => {
  const rise = fs.readFileSync(path.resolve(__dirname, '..', 'src/utils/useRiseReveal.ts'), 'utf8');
  const section = fs.readFileSync(path.resolve(__dirname, '..', 'src/components/PortfolioSection.tsx'), 'utf8');

  it("useRiseReveal lets an item share another item's trigger and skips its column stagger", () => {
    expect(rise).toMatch(/const withSel = el\.dataset\.riseWith;/);
    expect(rise).toMatch(/trigger: triggerEl,\s*start: 'top 70%'/);
    expect(rise).toMatch(/const delay = el\.dataset\.riseWith \? 0 : colIdx \* COL_DELAY;/);
  });

  it('useRiseReveal announces each rise start with its own timeline as the event detail', () => {
    expect(rise).toMatch(/export const RISE_START_EVENT = 'rise-start';/);
    expect(rise).toMatch(/new CustomEvent<RiseStartDetail>\(RISE_START_EVENT, \{ bubbles: true, detail: \{ tl, dir, riseY \} \}\)/);
  });

  it("the headline title and sub ride the label's trigger", () => {
    expect(section).toMatch(/portfolio-headline-title rise-soft" data-rise-with="\.section-label"/);
    expect(section).toMatch(/portfolio-headline-sub rise-soft" data-rise-with="\.section-label"/);
  });

  it('the headline group carries one shared, larger rise distance that useRiseReveal honours', () => {
    expect(section).toMatch(/const PORTFOLIO_RISE_Y = 72;/);
    expect(section.match(/data-rise-y={PORTFOLIO_RISE_Y}/g)).toHaveLength(3);
    expect(rise).toMatch(/const riseY = Number\(el\.dataset\.riseY\) \|\| RISE_Y;/);
    expect(rise).toMatch(/y: restY \+ riseY/);
  });

  it('wall geometry locks a screen early so it never repositions in the frame the rise starts', () => {
    expect(section).toMatch(/threshold: 0\.01, rootMargin: '0px 0px 100% 0px'/);
  });
});
