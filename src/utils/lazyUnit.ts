// Shared constants + the controller for the lazily unmounted page units
// (components/LazyUnit.tsx).

// Wrapper marker: the unit's wrapper div carries data-lazy-unit="<name>".
export const LAZY_UNIT_ATTR = 'data-lazy-unit';

// Any element inside a unit carrying this attribute holds user-made state
// (expanded grid, open card…) that would be lost on unmount, so the unit is
// kept mounted for as long as it exists.
export const LAZY_KEEP_ATTR = 'data-lazy-keep';

// Fired on window after a unit's sections were mounted or unmounted, so code
// that cached `section` elements (nav highlight, off-screen animation pause)
// can re-query them.
export const LAZY_UNIT_EVENT = 'lazy-unit-change';

// Units unmount once the viewer is more than one section away from them, but
// only after scrolling has been idle this long — so a fast scroll doesn't
// churn the DOM mid-flight. Mounting is immediate.
export const UNLOAD_IDLE_MS = 250;

// After a remount the wrapper keeps the unit's old height for this long, so
// late-sizing content (images) can't shrink the page above the viewport.
export const HOLD_HEIGHT_MS = 1500;

export interface LazyUnitHandle {
  el: HTMLElement;
  isLoaded: () => boolean;
  load: () => void;
  unload: () => void;
  /** True while the unit holds user state that must not be lost. */
  keep: () => boolean;
}

// Section order, top to bottom: the always-mounted hero counts as a section
// for distance purposes, then every registered unit in document order.
const units = new Set<LazyUnitHandle>();
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let rafId = 0;
let listening = false;

function orderedUnits(): LazyUnitHandle[] {
  return Array.from(units).sort((a, b) =>
    a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
}

/**
 * Mounts every unit within one section of the viewer (or within a screen of
 * the viewport, so a short section is never seen empty); unmounts the rest
 * when `allowUnload` and they hold no user state.
 */
export function evaluateLazyUnits(allowUnload: boolean) {
  const list = orderedUnits();
  if (!list.length) return;
  const vh = window.innerHeight;
  const mid = vh / 2;
  const hero = document.getElementById('home');
  const boxes: { top: number; bottom: number }[] = [];
  if (hero) boxes.push(hero.getBoundingClientRect());
  const offset = hero ? 1 : 0;
  list.forEach(u => boxes.push(u.el.getBoundingClientRect()));

  // The section under the viewport's middle line (or the nearest one).
  let active = boxes.findIndex(b => b.top <= mid && b.bottom > mid);
  if (active < 0) {
    let best = Infinity;
    boxes.forEach((b, i) => {
      const d = b.top > mid ? b.top - mid : mid - b.bottom;
      if (d < best) { best = d; active = i; }
    });
  }

  list.forEach((u, i) => {
    const b = boxes[i + offset];
    const withinOne = Math.abs(i + offset - active) <= 1;
    const nearViewport = b.bottom > -vh && b.top < 2 * vh;
    if (withinOne || nearViewport) {
      if (!u.isLoaded()) u.load();
    } else if (allowUnload && u.isLoaded() && !u.keep()) {
      u.unload();
    }
  });
}

function onScroll() {
  if (!rafId) {
    rafId = requestAnimationFrame(() => { rafId = 0; evaluateLazyUnits(false); });
  }
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { idleTimer = null; evaluateLazyUnits(true); }, UNLOAD_IDLE_MS);
}

function onResize() {
  evaluateLazyUnits(false);
}

export function registerLazyUnit(unit: LazyUnitHandle): () => void {
  units.add(unit);
  if (!listening) {
    listening = true;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
  }
  // First evaluation once the page has settled, so units far from the
  // starting position unmount without waiting for a scroll.
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { idleTimer = null; evaluateLazyUnits(true); }, UNLOAD_IDLE_MS * 8);
  return () => {
    units.delete(unit);
    if (!units.size && listening) {
      listening = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = null;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
}
