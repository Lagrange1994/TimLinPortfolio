import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Bug: after a hero CTA (View My Work / Contact Me) auto-scroll, the target
// section landed blank. The flight can jump over an item's in-view band (a
// long jump, a janky frame, or the section mounting mid-flight), and the
// landing spot leaves the label and title above their band, where an item
// stays hidden until scrolled back to.
// Now: the target section holds its items during the flight, and on landing
// (AUTO_SCROLL_END_EVENT) everything the scroll reached or passed fades up
// (short plain rise, no elastic, no squash). A section mounting just after
// the landing fades up the same way.
const g = vi.hoisted(() => ({
  sets: [] as unknown[][],
  triggers: [] as Array<{
    trigger: Element;
    scroll: () => number;
    start: number;
    end: number;
    kill: () => void;
    onEnter: (st: unknown) => void;
  }>,
  timelines: [] as Array<{ vars: Record<string, unknown>; tos: unknown[][]; scales: number[] }>,
}));

vi.mock('gsap', () => {
  const gsap = {
    registerPlugin: vi.fn(),
    utils: { toArray: (x: ArrayLike<Element>) => Array.from(x) },
    set: (...a: unknown[]) => { g.sets.push(a); },
    timeline: (vars: Record<string, unknown>) => {
      const tl = {
        vars, tos: [] as unknown[][], scales: [] as number[],
        to(...a: unknown[]) { tl.tos.push(a); return tl; },
        call() { return tl; },
        delay() { return tl; },
        timeScale(s: number) { tl.scales.push(s); return tl; },
      };
      g.timelines.push(tl);
      return tl;
    },
    context: () => ({ add: (fn: () => void) => fn(), revert: vi.fn() }),
  };
  return { default: gsap, gsap };
});
vi.mock('gsap/ScrollTrigger', () => ({
  default: {
    create: (cfg: { trigger: Element; onEnter: (st: unknown) => void }) => {
      const st = { ...cfg, scroll: () => 0, start: 0, end: 0, kill: vi.fn() };
      g.triggers.push(st);
      return st;
    },
  },
}));

const nav = vi.hoisted(() => ({ since: Infinity }));
vi.mock('../src/utils/navHeader', async importOriginal => ({
  ...(await importOriginal<typeof import('../src/utils/navHeader')>()),
  msSinceAutoScrollEnd: () => nav.since,
}));

import { setupRiseReveal } from '../src/utils/useRiseReveal';
import { AUTO_SCROLL_END_EVENT } from '../src/utils/navHeader';

function buildSection(id = 'contact') {
  const section = document.createElement('section');
  section.id = id;
  section.innerHTML = `
    <div class="section-label rise-soft" id="label"></div>
    <div class="rise-card" id="below"></div>`;
  document.body.appendChild(section);
  return section;
}
// [id=…], not #…: two test sections share the item ids, and jsdom resolves
// an #id selector document-wide before checking the scope.
const trig = (section: Element, sel: string) => g.triggers.find(t => t.trigger === section.querySelector(`[id="${sel.slice(1)}"]`))!;
const lastY = (el: Element) => g.sets.filter(a => a[0] === el).map(a => (a[1] as { y?: number }).y).filter(y => y !== undefined).pop();

describe('rise reveal after a CTA auto-scroll lands', () => {
  let cleanup: () => void = () => {};

  beforeEach(() => {
    g.sets = []; g.triggers = []; g.timelines = [];
    nav.since = Infinity;
    document.body.innerHTML = '';
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
  });
  afterEach(() => { cleanup(); cleanup = () => {}; delete document.documentElement.dataset.autoScroll; });

  it('fades up every item the scroll reached or passed, and leaves the rest', () => {
    const section = buildSection();
    cleanup = setupRiseReveal([section]);
    const label = trig(section, '#label');
    const below = trig(section, '#below');
    // Landed at 5000: the label's band started at 4200 (passed), the card's
    // starts at 5600 (still below the viewport's trigger line).
    label.scroll = below.scroll = () => 5000;
    label.start = 4200;
    below.start = 5600;

    window.dispatchEvent(new Event(AUTO_SCROLL_END_EVENT));

    expect(g.timelines).toHaveLength(1);
    const tl = g.timelines[0];
    expect(lastY(section.querySelector('#label')!)).toBe(16); // short rise
    const tween = tl.tos[0][1] as { ease: string; duration: number };
    expect(tween.ease).toBe('power2.out'); // no elastic bounce
    expect(tween.duration).toBeLessThan(1);
    expect(tl.tos).toHaveLength(1); // no squash/stretch tween
    expect(tl.scales).toEqual([]); // not the instant skip speed
    expect(label.kill).toHaveBeenCalled();
    expect(below.kill).not.toHaveBeenCalled();
  });

  it('the target section holds its items during the flight, a section flown past does not', () => {
    const target = buildSection('contact');
    const past = buildSection('about');
    cleanup = setupRiseReveal([target, past]);
    document.documentElement.dataset.autoScroll = 'contact';
    for (const t of g.triggers) { t.scroll = () => 150; t.start = 100; t.end = 300; }

    trig(target, '#label').onEnter(trig(target, '#label'));
    expect(g.timelines).toHaveLength(0); // held for the landing

    trig(past, '#label').onEnter(trig(past, '#label'));
    expect(g.timelines).toHaveLength(1);
    expect(g.timelines[0].scales[0]).toBeGreaterThan(1); // flown past: instant
  });

  it('does nothing to items that already revealed', () => {
    const section = buildSection();
    cleanup = setupRiseReveal([section]);
    for (const t of g.triggers) { t.scroll = () => 9000; t.start = 0; }
    window.dispatchEvent(new Event(AUTO_SCROLL_END_EVENT));
    window.dispatchEvent(new Event(AUTO_SCROLL_END_EVENT));
    expect(g.timelines).toHaveLength(2); // one per item, not one per landing
  });

  it('a section mounted just after a landing fades up right away', () => {
    nav.since = 200;
    const section = buildSection('portfolio');
    // ScrollTrigger measures on create; the mock fills it in afterwards, so
    // patch the prototype values through the create hook instead.
    const realCreate = g.triggers.push.bind(g.triggers);
    g.triggers.push = ((st: (typeof g.triggers)[number]) => { st.scroll = () => 9000; st.start = 0; return realCreate(st); }) as typeof g.triggers.push;
    cleanup = setupRiseReveal([section]);
    expect(g.timelines).toHaveLength(2);
    expect(lastY(section.querySelector('#label')!)).toBe(16);
  });

  it('long after a landing, a new section waits for the scroll as usual', () => {
    nav.since = 5000;
    const section = buildSection('portfolio');
    const realCreate = g.triggers.push.bind(g.triggers);
    g.triggers.push = ((st: (typeof g.triggers)[number]) => { st.scroll = () => 9000; st.start = 0; return realCreate(st); }) as typeof g.triggers.push;
    cleanup = setupRiseReveal([section]);
    expect(g.timelines).toHaveLength(0);
  });

  it('stops listening once the section is cleaned up', () => {
    const section = buildSection();
    setupRiseReveal([section])();
    for (const t of g.triggers) { t.scroll = () => 9000; t.start = 0; }
    window.dispatchEvent(new Event(AUTO_SCROLL_END_EVENT));
    expect(g.timelines).toHaveLength(0);
  });
});
