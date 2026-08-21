import { describe, it, expect, beforeEach, vi } from 'vitest';
import { scrollToSectionAligned } from '../src/utils/navHeader';

// Regression: fix(portfolio) 1ef6cb5 — overscroll-behavior-y:contain (added to
// stop the portfolio-grid fold's JS scroll from triggering mobile
// pull-to-refresh) used to be gated by `@media (pointer: coarse)` in CSS.
// That media feature reflects the browser's guess at the PRIMARY pointing
// device, not what's actually driving the page — on Windows machines with a
// touchscreen present, Chromium/Edge can report `pointer: coarse` even while
// the user scrolls with a mouse, which silently blocked desktop wheel
// scrolling for exactly those users. The fix now lives in navHeader.ts's
// animateScrollTo, gated on an actual touchstart event fired in the last
// 600ms — never on device capability alone.
//
// Found by /qa on 2026-08-21.
describe('navHeader animateScrollTo pull-to-refresh containment', () => {
  beforeEach(() => {
    window.matchMedia = window.matchMedia || (() => ({ matches: false }) as MediaQueryList);
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    document.body.innerHTML = '<section id="portfolio"></section>';
    document.documentElement.style.overscrollBehaviorY = '';
    document.body.style.overscrollBehaviorY = '';
  });

  it('does not apply overscroll containment for a mouse-only scroll (the regression)', () => {
    scrollToSectionAligned('portfolio');

    expect(document.documentElement.style.overscrollBehaviorY).toBe('');
    expect(document.body.style.overscrollBehaviorY).toBe('');
  });

  it('applies overscroll containment when a touch fired just before the scroll', () => {
    window.dispatchEvent(new Event('touchstart'));

    scrollToSectionAligned('portfolio');

    expect(document.documentElement.style.overscrollBehaviorY).toBe('contain');
    expect(document.body.style.overscrollBehaviorY).toBe('contain');
  });
});
