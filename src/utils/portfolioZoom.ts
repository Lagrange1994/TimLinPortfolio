// Portfolio scroll zoom-in, in step with .portfolio-scroll in portfolio.css
// (the track's view-timeline, `contain` range). Over 0–70%, all at once:
// the section zooms from 1.5× to 1×, the wall's shape closes in from the
// browser window's edges with its notches opening (drawn here, frame by
// frame), the outline fades in, then the headline and button. 70–100% holds.
import { autoScrollSkips } from './navHeader';

export const SHAPE_FROM = 0;
export const SHAPE_TO = 0.7;

// How far along the track's `contain` range the page is: 0 when the track's
// top meets the window's top, 1 when its bottom meets the window's bottom.
export function trackProgress(track: HTMLElement): number {
  const len = track.offsetHeight - window.innerHeight;
  if (len <= 0) return 1;
  return Math.max(0, Math.min(1, -track.getBoundingClientRect().top / len));
}

// CSS cubic-bezier(x1, y1, x2, y2) at x: the zoom's own easing, so the
// shape forms in step with the scale.
export function cubicBezier(x1: number, y1: number, x2: number, y2: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bx = (t: number) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3;
  const by = (t: number) => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
  // bisection: bx is monotonic for x1, x2 in [0, 1]
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 30; i++) {
    t = (lo + hi) / 2;
    if (bx(t) < x) lo = t; else hi = t;
  }
  return by(t);
}
// .portfolio-scroll > #portfolio's animation-timing-function
export const ZOOM_EASE = [0.3, 0, 0.2, 1] as const;

// 0–1 for how formed the wall's shape is. 1 whenever the section isn't stuck
// in its track: phones, reduced motion, expanded grid view, no
// scroll-driven animations — the plain wall, as before.
// Also 1 while a nav/CTA auto-scroll flies past on its way to another
// section (its zoom is off then too, see portfolio.css).
export function wallShapeProgress(section: HTMLElement): number {
  const track = section.parentElement?.closest<HTMLElement>('[data-zoom-track]');
  if (!track || getComputedStyle(section).position !== 'sticky') return 1;
  if (autoScrollSkips(section)) return 1;
  const p = trackProgress(track);
  const t = (p - SHAPE_FROM) / (SHAPE_TO - SHAPE_FROM);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return cubicBezier(...ZOOM_EASE, t);
}
