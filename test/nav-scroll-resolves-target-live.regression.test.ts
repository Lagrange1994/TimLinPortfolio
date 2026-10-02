import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scrollToSectionAligned } from '../src/utils/navHeader';

// Regression: lazily unmounted sections (LazyUnit) are zero-size anchor spans
// carrying the section's id. scrollToSectionAligned used to capture that span
// once; when the real section mounted mid-flight the span was removed, a
// detached node measures as top 0, and the animation drifted back toward the
// current scroll position instead of landing on the section. The target must
// be re-resolved by id on every frame.
describe('scrollToSectionAligned re-resolves its target every frame', () => {
  let scrolls: number[];
  let frame: FrameRequestCallback | null;

  beforeEach(() => {
    scrolls = [];
    frame = null;
    window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => { frame = cb; return 1; }) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = (() => {}) as typeof window.cancelAnimationFrame;
    vi.spyOn(window, 'scrollTo').mockImplementation(((_x: number, y: number) => { scrolls.push(y); }) as typeof window.scrollTo);
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 10000, configurable: true });
    document.documentElement.style.setProperty('--nav-h', '0px');
    document.body.innerHTML = '';
  });
  afterEach(() => { vi.restoreAllMocks(); });

  function placeAt(el: Element, top: number) {
    (el as HTMLElement).getBoundingClientRect = () => ({ top } as DOMRect);
  }

  it('follows the real section after the anchor span it started from is replaced', () => {
    const anchor = document.createElement('span');
    anchor.id = 'contact';
    placeAt(anchor, 5000);
    document.body.appendChild(anchor);

    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    scrollToSectionAligned('contact');

    // The unit mounts: the anchor is replaced by the real section (same spot).
    anchor.remove();
    const section = document.createElement('section');
    section.id = 'contact';
    placeAt(section, 5000);
    document.body.appendChild(section);

    now = 5000; // well past the tween: it lands on the live target
    frame!(now);
    expect(scrolls.at(-1)).toBe(5000);
  });

  it('holds position instead of jumping to 0 if the target vanishes mid-flight', () => {
    const el = document.createElement('section');
    el.id = 'contact';
    placeAt(el, 5000);
    document.body.appendChild(el);
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    scrollToSectionAligned('contact');
    el.remove();
    now = 5000;
    frame!(now);
    expect(scrolls.at(-1)).toBe(0); // current scrollY, not a stray jump
  });

  it('ignores ids that do not exist', () => {
    expect(() => scrollToSectionAligned('nope')).not.toThrow();
    expect(frame).toBeNull();
  });
});
