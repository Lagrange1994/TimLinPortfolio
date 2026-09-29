// Cursor-following glow for project-page cards (see card-spotlight.css).
// One delegated pointermove on the document instead of per-card listeners:
// cards mount/unmount with tab switches, and a delegated listener needs no
// re-binding or cleanup. Mouse only — a touch tap would leave a sticky
// :hover glow. Coordinates are 1920-based under the 4K zoom via scaleLock.
import '../styles/card-spotlight.css';

export const SPOTLIGHT_SELECTOR = '.ds-card, .spotlight-card';

let current: HTMLElement | null = null;

function park(card: HTMLElement) {
  card.style.setProperty('--sc-x', '-500px');
  card.style.setProperty('--sc-y', '-500px');
}

export function handleSpotlightMove(e: PointerEvent) {
  if (e.pointerType && e.pointerType !== 'mouse') return;
  const target = e.target as Element | null;
  const card = (target?.closest?.(SPOTLIGHT_SELECTOR) as HTMLElement | null) ?? null;
  if (card !== current) {
    if (current) park(current);
    current = card;
  }
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty('--sc-x', `${e.clientX - r.left}px`);
  card.style.setProperty('--sc-y', `${e.clientY - r.top}px`);
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointermove', handleSpotlightMove, { passive: true });
}
