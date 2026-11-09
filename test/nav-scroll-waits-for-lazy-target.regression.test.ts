import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scrollToSectionAligned, autoScrollTarget } from '../src/utils/navHeader';

// Bug: Contact Me landed short. Contact is lazily loaded; when the tween
// ended it hadn't mounted yet, the page was shorter, and the scroll stopped
// at the then page bottom. The grace phase ended after a fixed 450ms, so
// the section mounting a moment later was never followed. Now the scroll
// only counts as landed once the target is a real (non-zero-size) element
// whose position has held still, with a cap.
describe('auto-scroll waits for a lazily loaded target before landing', () => {
  let frame: FrameRequestCallback | null;
  let now: number;
  let y: number;

  beforeEach(() => {
    frame = null;
    now = 0;
    y = 0;
    window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => { frame = cb; return 1; }) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = (() => {}) as typeof window.cancelAnimationFrame;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.spyOn(window, 'scrollTo').mockImplementation(((_x: number, top: number) => { y = top; }) as typeof window.scrollTo);
    Object.defineProperty(window, 'scrollY', { get: () => y, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 100000, configurable: true });
    document.documentElement.style.setProperty('--nav-h', '0px');
    document.body.innerHTML = '';
    delete document.documentElement.dataset.autoScroll;
  });
  afterEach(() => { vi.restoreAllMocks(); delete document.documentElement.dataset.autoScroll; });

  function target(top: number, height: number) {
    const el = document.createElement('section');
    el.id = 'contact';
    el.getBoundingClientRect = () => ({ top: top - y } as DOMRect);
    Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
    document.body.appendChild(el);
    return el;
  }
  const tick = (ms: number) => { now += ms; const f = frame; frame = null; f?.(now); };

  it('keeps going while the target is still a zero-size anchor', () => {
    const anchor = target(5000, 0);
    scrollToSectionAligned('contact');
    tick(2000); // tween done
    tick(300);  // still and on target, but not mounted yet
    tick(300);
    expect(autoScrollTarget()).toBe('contact');

    // The real section mounts further down (the page grew).
    anchor.remove();
    target(5600, 900);
    for (let i = 0; i < 60 && frame; i++) tick(16);
    expect(y).toBeCloseTo(5600, 0);
    expect(autoScrollTarget()).toBeNull(); // landed once it held still
  });

  it('lands quickly on a target that is already real and still', () => {
    target(3000, 900);
    scrollToSectionAligned('contact');
    tick(2000);
    for (let i = 0; i < 20 && frame; i++) tick(16);
    expect(autoScrollTarget()).toBeNull();
    expect(y).toBe(3000);
  });

  it('gives up after the cap even if the target never mounts', () => {
    target(4000, 0);
    scrollToSectionAligned('contact');
    tick(2000);
    for (let i = 0; i < 200 && frame; i++) tick(16);
    expect(autoScrollTarget()).toBeNull();
  });
});
