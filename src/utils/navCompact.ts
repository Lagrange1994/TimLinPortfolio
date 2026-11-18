// When #main-header switches to its compact .scrolled pill. Past the first
// NAV_COMPACT_AT px of scroll it compacts — except while a framed section
// (marked [data-nav-flush], the Overview wall) sits flush at the top of the
// viewport: that frame has the hero's notch and menu-bar slot, so the full
// navbar layout fits it again, the same as at the hero.
export const NAV_COMPACT_AT = 40;

// The frame (and so the notch the full navbar fills) is desktop-only.
export const NAV_FLUSH_MQ = '(min-width: 1025px)';

/** A framed section sits flush (within NAV_COMPACT_AT px) at the top. */
export function flushAtTop(flushTops: readonly number[]): boolean {
  return flushTops.some(top => Math.abs(top) <= NAV_COMPACT_AT);
}

export function navShouldCompact(scrollY: number, flushTops: readonly number[]): boolean {
  if (scrollY <= NAV_COMPACT_AT) return false;
  return !flushAtTop(flushTops);
}

/** Viewport tops of the flush sections (none below the frame breakpoint). */
export function flushSectionTops(): number[] {
  if (!window.matchMedia?.(NAV_FLUSH_MQ).matches) return [];
  return [...document.querySelectorAll<HTMLElement>('[data-nav-flush]')].map(el => el.getBoundingClientRect().top);
}
