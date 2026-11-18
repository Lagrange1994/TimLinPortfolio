import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scrollToSectionAligned } from '../src/utils/navHeader';

// A framed section ([data-nav-flush], the Overview wall) lands flush at the
// top on desktop — the navbar sits in its frame's notch, like the hero's —
// instead of one navbar height below it. Below the frame breakpoint there is
// no notch, so it lands under the navbar like any section.
describe('scrollToSectionAligned and [data-nav-flush]', () => {
  let scrolls: number[];
  let frame: FrameRequestCallback | null;

  const setDesktop = (desktop: boolean) => {
    window.matchMedia = ((q: string) => ({ matches: q.includes('min-width: 1025px') && desktop })) as unknown as typeof window.matchMedia;
  };

  beforeEach(() => {
    scrolls = [];
    frame = null;
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => { frame = cb; return 1; }) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = (() => {}) as typeof window.cancelAnimationFrame;
    vi.spyOn(window, 'scrollTo').mockImplementation(((_x: number, y: number) => { scrolls.push(y); }) as typeof window.scrollTo);
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 10000, configurable: true });
    document.documentElement.style.setProperty('--nav-h', '72px');
    document.body.innerHTML = '<header id="main-header"></header>';
    // primeHeaderForNav re-measures --nav-h from the header
    Object.defineProperty(document.getElementById('main-header')!, 'offsetHeight', { value: 72, configurable: true });
  });
  afterEach(() => { vi.restoreAllMocks(); });

  function land(flush: boolean) {
    const el = document.createElement('section');
    el.id = 'overview';
    if (flush) el.setAttribute('data-nav-flush', '');
    el.getBoundingClientRect = () => ({ top: 1080 } as DOMRect);
    document.body.appendChild(el);
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    scrollToSectionAligned('overview');
    now = 5000;
    frame!(now);
    return scrolls.at(-1);
  }

  it('desktop: a flush section lands at its own top', () => {
    setDesktop(true);
    expect(land(true)).toBe(1080);
  });

  it('desktop: other sections still land under the navbar', () => {
    setDesktop(true);
    expect(land(false)).toBe(1080 - 72);
  });

  it('below the frame breakpoint a flush section lands under the navbar too', () => {
    setDesktop(false);
    expect(land(true)).toBe(1080 - 72);
  });
});
