import { describe, it, expect, vi, beforeEach } from 'vitest';

// Scroll-in entrances follow the scroll direction: entering the viewport band
// from below (scrolling down) rises the item up into place, entering from above
// (scrolling up) drops it down into place. Each item reveals once per setup.
const g = vi.hoisted(() => {
  const state = {
    sets: [] as unknown[][],
    triggers: [] as Array<{ trigger: Element; start: string; end: string; onEnter: (st: unknown) => void; onEnterBack: (st: unknown) => void }>,
    timelines: [] as Array<{ vars: Record<string, unknown>; tos: unknown[][]; calls: Array<() => void> }>,
    reverted: 0,
  };
  return state;
});

vi.mock('gsap', () => {
  const gsap = {
    registerPlugin: vi.fn(),
    utils: { toArray: (x: ArrayLike<Element>) => Array.from(x) },
    set: (...a: unknown[]) => { g.sets.push(a); },
    timeline: (vars: Record<string, unknown>) => {
      const tl = { vars, tos: [] as unknown[][], calls: [] as Array<() => void>,
        to(...a: unknown[]) { this.tos.push(a); return this; },
        call(fn: () => void) { this.calls.push(fn); return this; } };
      g.timelines.push(tl);
      return tl;
    },
    context: () => {
      const ctx = { add: (fn: () => void) => fn(), revert: () => { g.reverted++; } };
      return ctx;
    },
  };
  return { default: gsap, gsap };
});
vi.mock('gsap/ScrollTrigger', () => ({
  default: { create: (cfg: (typeof g.triggers)[number]) => { g.triggers.push(cfg); return cfg; } },
}));

import { setupRiseReveal } from '../src/utils/useRiseReveal';

function buildSection() {
  const section = document.createElement('section');
  section.innerHTML = `
    <div class="section-label rise-soft" id="label"></div>
    <h2 class="rise-soft" id="title" data-rise-with=".section-label" data-rise-y="72"></h2>
    <div class="rise-card" id="card"></div>`;
  document.body.appendChild(section);
  return section;
}

const st = (scroll: number, start = 100, end = 300) => ({ scroll: () => scroll, start, end, kill: vi.fn() });

describe('setupRiseReveal direction', () => {
  beforeEach(() => {
    g.sets = []; g.triggers = []; g.timelines = []; g.reverted = 0;
    document.body.innerHTML = '';
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
  });

  it('hides every item up front and creates one in-view band trigger per item', () => {
    const section = buildSection();
    setupRiseReveal([section]);
    expect(g.triggers).toHaveLength(3);
    for (const t of g.triggers) {
      expect(t.start).toBe('top 70%');
      expect(t.end).toBe('bottom 30%');
    }
    const label = section.querySelector('#label');
    expect(g.sets.some(a => a[0] === label && (a[1] as { autoAlpha?: number }).autoAlpha === 0)).toBe(true);
    // Nothing is animating until a trigger fires.
    expect(g.timelines).toHaveLength(0);
  });

  it('entering the band from below (scrolling down) starts the item below its rest position', () => {
    const section = buildSection();
    setupRiseReveal([section]);
    const card = section.querySelector('#card');
    const trig = g.triggers.find(t => t.trigger === card)!;
    const self = st(200);
    trig.onEnter(self);
    expect(self.kill).toHaveBeenCalled();
    const yStart = g.sets.filter(a => a[0] === card).map(a => a[1] as { y?: number; transformOrigin?: string }).filter(v => v.y !== undefined).pop()!;
    expect(yStart.y).toBe(28); // default rise distance, below rest
    expect(g.timelines).toHaveLength(1);
  });

  it('entering the band from above (scrolling up) starts the item above its rest position', () => {
    const section = buildSection();
    setupRiseReveal([section]);
    const card = section.querySelector('#card');
    const trig = g.triggers.find(t => t.trigger === card)!;
    trig.onEnterBack(st(250));
    const sets = g.sets.filter(a => a[0] === card).map(a => a[1] as { y?: number; transformOrigin?: string });
    expect(sets.filter(v => v.y !== undefined).pop()!.y).toBe(-28);
    // The squash origin flips so the card springs open the other way.
    expect(sets.filter(v => v.transformOrigin).pop()!.transformOrigin).toBe('center top');
  });

  it('an item the page landed far beyond (outside its band) stays hidden until scrolled back to', () => {
    const section = buildSection();
    setupRiseReveal([section]);
    const card = section.querySelector('#card');
    const trig = g.triggers.find(t => t.trigger === card)!;
    const self = st(900); // already scrolled past the band's end
    trig.onEnter(self);
    expect(self.kill).not.toHaveBeenCalled();
    expect(g.timelines).toHaveLength(0);
    // Scrolling back up into the band then reveals it, dropping in.
    trig.onEnterBack(st(250));
    expect(g.timelines).toHaveLength(1);
  });

  it('reveals each item only once, even if both directions fire', () => {
    const section = buildSection();
    setupRiseReveal([section]);
    const card = section.querySelector('#card');
    const trig = g.triggers.find(t => t.trigger === card)!;
    trig.onEnter(st(200));
    trig.onEnterBack(st(200));
    trig.onEnter(st(200));
    expect(g.timelines).toHaveLength(1);
  });

  it('a data-rise-with item rides its group\'s trigger, uses its own distance, and skips the column delay', () => {
    const section = buildSection();
    setupRiseReveal([section]);
    const label = section.querySelector('#label');
    const title = section.querySelector('#title');
    const titleTrigger = g.triggers.filter(t => t.trigger === label);
    expect(titleTrigger).toHaveLength(2); // the label itself + the title riding on it
    titleTrigger[1].onEnterBack(st(200));
    const tl = g.timelines[0];
    expect(tl.vars.delay).toBe(0);
    const sets = g.sets.filter(a => a[0] === title).map(a => a[1] as { y?: number });
    expect(sets.filter(v => v.y !== undefined).pop()!.y).toBe(-72);
  });

  it('announces the reveal with direction and distance so companions (the wall frame) can follow', () => {
    const section = buildSection();
    setupRiseReveal([section]);
    const label = section.querySelector('#label')!;
    const seen = vi.fn();
    label.addEventListener('rise-start', e => seen((e as CustomEvent).detail));
    g.triggers.find(t => t.trigger === label)!.onEnterBack(st(200));
    g.timelines[0].calls[0](); // the call at position 0 fires the event
    expect(seen).toHaveBeenCalledTimes(1);
    const detail = seen.mock.calls[0][0];
    expect(detail.dir).toBe(-1);
    expect(detail.riseY).toBe(28);
    expect(detail.tl).toBe(g.timelines[0]);
  });

  it('cleanup reverts the whole setup (everything registered with the context)', () => {
    const cleanup = setupRiseReveal([buildSection()]);
    cleanup();
    expect(g.reverted).toBe(1);
  });

  it('with no sections it does nothing', () => {
    const cleanup = setupRiseReveal([]);
    expect(g.triggers).toHaveLength(0);
    expect(() => cleanup()).not.toThrow();
  });

  it('reduced motion clears inline styles and sets up no triggers', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const cleanup = setupRiseReveal([buildSection()]);
    expect(g.sets).toContainEqual(['.rise-card, .rise-soft', { clearProps: 'all' }]);
    expect(g.triggers).toHaveLength(0);
    expect(() => cleanup()).not.toThrow();
  });
});
