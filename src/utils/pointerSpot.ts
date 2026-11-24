import type { PointerEvent as ReactPointerEvent } from 'react';

// A card lights up inside under the pointer, like the Design Process cards
// (BorderGlow's .bg-spotlight): the light follows --mouse-x/y. Not for a
// finger, nor in light mode (no glow there).
export function trackPointerSpot(e: ReactPointerEvent<HTMLElement>) {
  if (e.pointerType === 'touch' || document.documentElement.getAttribute('data-theme') === 'light') return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
  el.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
}
