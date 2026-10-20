import { createElement } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// SkillsSection's imports (GSAP etc.) read matchMedia at load time; jsdom
// has none. Phone width, so ProcessCarousel pages one card at a time.
vi.hoisted(() => {
  window.matchMedia = ((q: string) => ({
    matches: q === '(max-width: 767px)',
    media: q,
    onchange: null,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

import { ProcessCarousel } from '../src/components/SkillsSection';

// Finger swipes on the phone carousels used to stutter: every pointermove
// called setState, re-rendering all the cards ~60×/s. The drag now writes
// the track's transform straight to the DOM and only touches React state
// on press and release.

const STEP = 375; // card width 343 + 32px gap (jsdom has no layout; faked below)
let now = 0;
let renders = 0;

function Card({ n }: { n: number }) {
  renders++;
  return createElement('div', null, `card ${n}`);
}

function setup() {
  const cards = [0, 1, 2].map(n => createElement(Card, { key: n, n }));
  const utils = render(createElement(ProcessCarousel, { cards }));
  const track = utils.container.querySelector<HTMLElement>('.process-column-grid--inhouse')!;
  return { ...utils, track };
}

function pointer(track: HTMLElement, type: 'pointerDown' | 'pointerMove' | 'pointerUp', clientX: number, atMs: number) {
  now = atMs;
  act(() => { fireEvent[type](track, { clientX, pointerId: 1 }); });
}

beforeEach(() => {
  now = 0;
  renders = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  const real = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
    const cs = real(el, pseudo);
    if ((el as HTMLElement).classList?.contains('process-swipe-slot')) return { ...cs, width: '343px' } as CSSStyleDeclaration;
    if ((el as HTMLElement).classList?.contains('process-column-grid--inhouse')) return { ...cs, gap: '32px' } as CSSStyleDeclaration;
    return cs;
  });
  HTMLElement.prototype.setPointerCapture = () => {};
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProcessCarousel finger drag', () => {
  it('moves the track during a drag without re-rendering the cards', () => {
    const { track } = setup();
    pointer(track, 'pointerDown', 300, 0);
    const before = renders;
    for (let i = 1; i <= 10; i++) pointer(track, 'pointerMove', 300 - i * 10, i * 16);
    expect(track.style.transform).toBe('translateX(-100px)');
    expect(renders).toBe(before);
  });

  it('a long-enough drag turns the page', () => {
    const { track } = setup();
    pointer(track, 'pointerDown', 300, 0);
    pointer(track, 'pointerMove', 150, 400);
    pointer(track, 'pointerMove', 150, 800);
    pointer(track, 'pointerUp', 150, 900);
    expect(track.style.transform).toBe(`translateX(${-STEP}px)`);
  });

  it('a short but quick flick turns the page', () => {
    const { track } = setup();
    pointer(track, 'pointerDown', 300, 0);
    pointer(track, 'pointerMove', 280, 16);
    pointer(track, 'pointerMove', 250, 32); // ~1.9 px/ms, only 50px (< 20% of a step)
    pointer(track, 'pointerUp', 250, 40);
    expect(track.style.transform).toBe(`translateX(${-STEP}px)`);
  });

  it('a short slow drag snaps back home, animated', () => {
    const { track } = setup();
    pointer(track, 'pointerDown', 300, 0);
    pointer(track, 'pointerMove', 290, 200);
    pointer(track, 'pointerMove', 280, 400);
    expect(track.style.transform).toBe('translateX(-20px)');
    pointer(track, 'pointerUp', 280, 420);
    expect(track.style.transform).toBe('translateX(0px)');
    expect(track.style.transition).toContain('transform');
  });

  it('a flick that stopped before the finger lifted is not a flick', () => {
    const { track } = setup();
    pointer(track, 'pointerDown', 300, 0);
    pointer(track, 'pointerMove', 250, 30);
    pointer(track, 'pointerUp', 250, 500);
    expect(track.style.transform).toBe('translateX(0px)');
  });

  it('rubber-bands past the first card instead of sliding freely', () => {
    const { track } = setup();
    pointer(track, 'pointerDown', 100, 0);
    pointer(track, 'pointerMove', 200, 300);
    expect(track.style.transform).toBe(`translateX(${100 * 0.35}px)`);
    pointer(track, 'pointerUp', 200, 900);
    expect(track.style.transform).toBe('translateX(0px)');
  });
});
