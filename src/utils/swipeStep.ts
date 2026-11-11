// A horizontal swipe across a stepped viewer (How I Use AI on phones):
// which step it lands on, or null when it isn't a swipe — too short, more
// vertical than sideways (the page scrolling), or past either end.
// Swiping left goes to the next step, right to the previous one.
export const SWIPE_MIN = 50;

export function swipeStep(dx: number, dy: number, index: number, count: number): number | null {
  if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.5) return null;
  const next = dx < 0 ? index + 1 : index - 1;
  return next >= 0 && next < count ? next : null;
}
