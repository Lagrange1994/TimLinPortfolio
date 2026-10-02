// Mobile browsers fire `resize` every time the URL bar slides in or out while
// scrolling — a height-only change of a few dozen px. Several components
// re-measure and re-lay-out on window `resize` (portfolio wall geometry,
// marquee scrollers, process-card heights…), so each of those toggles showed
// up as a small layout nudge mid-scroll. This capture-phase listener is
// registered before any of theirs (import it first in main.tsx) and swallows
// those events; a real change — different width (rotation, split screen) or a
// large height change (on-screen keyboard) — passes through untouched.

const MOBILE_MAX_WIDTH = 1024;
const CHROME_HEIGHT_RATIO = 0.2;

export function isChromeOnlyResize(prev: { w: number; h: number }, next: { w: number; h: number }): boolean {
  return next.w < MOBILE_MAX_WIDTH
    && next.w === prev.w
    && Math.abs(next.h - prev.h) <= prev.h * CHROME_HEIGHT_RATIO;
}

export function installIgnoreChromeResize(): () => void {
  let accepted = { w: window.innerWidth, h: window.innerHeight };
  const onResize = (e: Event) => {
    const next = { w: window.innerWidth, h: window.innerHeight };
    if (isChromeOnlyResize(accepted, next)) {
      e.stopImmediatePropagation();
      return;
    }
    accepted = next;
  };
  window.addEventListener('resize', onResize, true);
  return () => window.removeEventListener('resize', onResize, true);
}
