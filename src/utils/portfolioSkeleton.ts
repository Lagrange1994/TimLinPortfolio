/**
 * Lazy-load skeleton for Portfolio thumbnails. Each card shows a shimmering
 * fill in its thumbnail's own mean color (`--ph`, from projects.ts) until its
 * <img> finishes, then gets `.img-loaded` and the skeleton fades out.
 *
 * Driven by one capture-phase listener instead of React state because the
 * marquee wall's clones are plain `cloneNode` copies (see
 * createPortfolioScroller) that React never touches — a delegated listener
 * catches their `load` events too (load doesn't bubble, but it does capture).
 * `error` also clears the skeleton so a broken image doesn't shimmer forever.
 */
export const PORTFOLIO_CARD_SELECTOR = '.project-card, .grid-card';
export const IMG_LOADED_CLASS = 'img-loaded';

function markIfDone(img: HTMLImageElement) {
  if (!img.complete) return;
  img.closest(PORTFOLIO_CARD_SELECTOR)?.classList.add(IMG_LOADED_CLASS);
}

/** Marks every card whose image is already done (cache hits / loaded before attach). */
export function sweepPortfolioImages(root: ParentNode = document) {
  root
    .querySelectorAll<HTMLImageElement>(`:is(${PORTFOLIO_CARD_SELECTOR}) > img`)
    .forEach(markIfDone);
}

/** Attaches the load/error listener and sweeps once. Returns a cleanup fn. */
export function attachPortfolioSkeleton(root: Document | HTMLElement = document): () => void {
  const onDone = (e: Event) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    img.closest(PORTFOLIO_CARD_SELECTOR)?.classList.add(IMG_LOADED_CLASS);
  };
  root.addEventListener('load', onDone, true);
  root.addEventListener('error', onDone, true);
  sweepPortfolioImages(root);
  return () => {
    root.removeEventListener('load', onDone, true);
    root.removeEventListener('error', onDone, true);
  };
}
