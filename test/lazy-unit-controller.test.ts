import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  evaluateLazyUnits,
  registerLazyUnit,
  UNLOAD_IDLE_MS,
  type LazyUnitHandle,
} from '../src/utils/lazyUnit';

// A page of stacked 1000px sections in a 1000px viewport: hero [0,1000),
// then units A..E. scrollY moves them all.
const VH = 1000;
const SECTION_H = 1000;
let scrollY = 0;

function box(index: number) {
  const top = index * SECTION_H - scrollY;
  return { top, bottom: top + SECTION_H, height: SECTION_H, left: 0, right: 0, width: 0, x: 0, y: top, toJSON() {} } as DOMRect;
}

function makeUnit(index: number, opts: { keep?: boolean } = {}) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  el.getBoundingClientRect = () => box(index);
  const state = { loaded: true, loads: 0, unloads: 0 };
  const handle: LazyUnitHandle = {
    el,
    isLoaded: () => state.loaded,
    load: () => { state.loaded = true; state.loads++; },
    unload: () => { state.loaded = false; state.unloads++; },
    keep: () => !!opts.keep,
  };
  return { handle, state, el };
}

describe('evaluateLazyUnits — mount within one section, unmount beyond it', () => {
  let hero: HTMLElement;
  beforeEach(() => {
    scrollY = 0;
    Object.defineProperty(window, 'innerHeight', { value: VH, configurable: true });
    hero = document.createElement('section');
    hero.id = 'home';
    hero.getBoundingClientRect = () => box(0);
    document.body.appendChild(hero);
  });
  afterEach(() => { document.body.innerHTML = ''; });

  function setup(n = 5) {
    const units = Array.from({ length: n }, (_, i) => makeUnit(i + 1));
    const unregister = units.map(u => registerLazyUnit(u.handle));
    return { units, unregister: () => unregister.forEach(fn => fn()) };
  }

  it('keeps the section under the viewer and its neighbours, unmounts the rest', () => {
    vi.useFakeTimers();
    const { units, unregister } = setup();
    scrollY = 3 * SECTION_H; // viewer in the 3rd unit
    evaluateLazyUnits(true);
    expect(units.map(u => u.state.loaded)).toEqual([false, true, true, true, false]);
    unregister();
    vi.useRealTimers();
  });

  it('counts the hero as a section: at the top only the first unit stays', () => {
    vi.useFakeTimers();
    const { units, unregister } = setup();
    evaluateLazyUnits(true);
    expect(units.map(u => u.state.loaded)).toEqual([true, false, false, false, false]);
    unregister();
    vi.useRealTimers();
  });

  it('mounts a unit again as soon as the viewer comes within one section of it', () => {
    vi.useFakeTimers();
    const { units, unregister } = setup();
    evaluateLazyUnits(true);
    expect(units[3].state.loaded).toBe(false);
    scrollY = 3 * SECTION_H; // viewer in unit 3 → unit 4 is one away
    evaluateLazyUnits(false);
    expect(units[3].state.loaded).toBe(true);
    expect(units[3].state.loads).toBe(1);
    unregister();
    vi.useRealTimers();
  });

  it('never unmounts when unloading is not allowed (mid-scroll), only mounts', () => {
    vi.useFakeTimers();
    const { units, unregister } = setup();
    scrollY = 4 * SECTION_H;
    evaluateLazyUnits(false);
    expect(units.every(u => u.state.unloads === 0)).toBe(true);
    unregister();
    vi.useRealTimers();
  });

  it('leaves a unit holding user state mounted however far away it is', () => {
    vi.useFakeTimers();
    const keeper = makeUnit(1, { keep: true });
    const other = makeUnit(5);
    const un = [registerLazyUnit(keeper.handle), registerLazyUnit(other.handle)];
    scrollY = 4 * SECTION_H;
    evaluateLazyUnits(true);
    expect(keeper.state.loaded).toBe(true);
    un.forEach(fn => fn());
    vi.useRealTimers();
  });

  it('keeps a unit mounted while any part of it is within a screen of the viewport, even if it is two sections away', () => {
    vi.useFakeTimers();
    // Short 300px units: two sections away is still on/near the screen.
    const els = Array.from({ length: 4 }, (_, i) => {
      const u = makeUnit(i + 1);
      u.el.getBoundingClientRect = () => ({ top: 100 + i * 300 - scrollY, bottom: 400 + i * 300 - scrollY, height: 300 } as DOMRect);
      return u;
    });
    hero.getBoundingClientRect = () => ({ top: -900 - scrollY, bottom: 100 - scrollY, height: 1000 } as DOMRect);
    const un = els.map(u => registerLazyUnit(u.handle));
    evaluateLazyUnits(true);
    expect(els.every(u => u.state.loaded)).toBe(true);
    un.forEach(fn => fn());
    vi.useRealTimers();
  });

  it('does nothing without units', () => {
    expect(() => evaluateLazyUnits(true)).not.toThrow();
  });
});

describe('lazy unit scheduling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    scrollY = 0;
    Object.defineProperty(window, 'innerHeight', { value: VH, configurable: true });
  });
  afterEach(() => { vi.useRealTimers(); document.body.innerHTML = ''; });

  it('first evaluation happens once the page has settled, so far units unmount without a scroll', () => {
    const hero = document.createElement('section');
    hero.id = 'home';
    hero.getBoundingClientRect = () => box(0);
    document.body.appendChild(hero);
    const units = [makeUnit(1), makeUnit(2), makeUnit(3)];
    const un = units.map(u => registerLazyUnit(u.handle));
    expect(units[2].state.loaded).toBe(true);
    vi.advanceTimersByTime(UNLOAD_IDLE_MS * 8 + 10);
    expect(units.map(u => u.state.loaded)).toEqual([true, false, false]);
    un.forEach(fn => fn());
  });

  it('mounts on scroll (next frame) but only unmounts after scrolling has been idle', () => {
    const hero = document.createElement('section');
    hero.id = 'home';
    hero.getBoundingClientRect = () => box(0);
    document.body.appendChild(hero);
    const units = [makeUnit(1), makeUnit(2), makeUnit(3), makeUnit(4)];
    const un = units.map(u => registerLazyUnit(u.handle));
    vi.advanceTimersByTime(UNLOAD_IDLE_MS * 8 + 10); // settle: only unit 1 left
    expect(units.map(u => u.state.loaded)).toEqual([true, false, false, false]);

    scrollY = 3 * SECTION_H; // viewer in the 3rd unit (position 3)
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => { cb(0); return 1; });
    window.dispatchEvent(new Event('scroll'));
    // Mounted right away (neighbours of the viewer)…
    expect(units.map(u => u.state.loaded)).toEqual([true, true, true, true]);
    // …the first unit is now two sections behind but is not unmounted until
    // scrolling has been idle.
    expect(units[0].state.unloads).toBe(0);
    vi.advanceTimersByTime(UNLOAD_IDLE_MS + 10);
    expect(units.map(u => u.state.loaded)).toEqual([false, true, true, true]);
    raf.mockRestore();
    un.forEach(fn => fn());
  });

  it('removes its window listeners when the last unit unregisters', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const u = makeUnit(1);
    const un = registerLazyUnit(u.handle);
    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(add).toHaveBeenCalledWith('resize', expect.any(Function));
    un();
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
    add.mockRestore();
    remove.mockRestore();
  });

  it('re-evaluates on resize', () => {
    const hero = document.createElement('section');
    hero.id = 'home';
    hero.getBoundingClientRect = () => box(0);
    document.body.appendChild(hero);
    const units = [makeUnit(1), makeUnit(2), makeUnit(3)];
    const un = units.map(u => registerLazyUnit(u.handle));
    vi.advanceTimersByTime(UNLOAD_IDLE_MS * 8 + 10);
    scrollY = 2 * SECTION_H;
    window.dispatchEvent(new Event('resize'));
    expect(units[2].state.loaded).toBe(true);
    un.forEach(fn => fn());
  });
});
