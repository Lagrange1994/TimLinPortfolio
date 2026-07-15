import { useEffect } from 'react';
import { squircleRectPath } from './squircle';

// Portfolio's .project-card/.grid-card (see CARD_CORNER_RADIUS in
// PortfolioSection.tsx) use squircleRectPath with a FIXED 44px radius,
// regardless of box size — squircleRectPath itself is explicitly designed
// to hold a constant corner radius rather than scale proportionally with
// the box (see the doc comment in squircle.ts). "Same proportion as
// Portfolio" therefore means reusing this same constant, not deriving a
// per-box ratio — squircleRectPath already clamps it down via
// Math.min(radius, w/2, h/2) for any box smaller than 88x88.
const CARD_CORNER_RADIUS = 44;

// Every selector here was checked for descendants that intentionally
// overhang the box (badges, glow rings) — clip-path clips ALL descendants
// to the path, which is what corrupted content on .ai-card/.process-card/
// .bento-card the first time this was tried. .tech-level-badge is a
// sibling of .tech-item, not a child (see .tech-item-wrap in portfolio.css),
// so it's unaffected; the rest have no overhanging children at all.
const SELECTOR = [
  '.tech-item',
  '.bento-area-years',
  '.bento-area-projects',
  '.bento-area-domains',
  '.bento-area-industry',
  '.contact-card',
  '.line-banner',
  '.cta-strip',
].join(', ');

export function useMobileCardSquircle() {
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    let ro: ResizeObserver | null = null;

    function clearAll() {
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach(el => {
        el.style.clipPath = '';
      });
    }

    function apply(el: HTMLElement, w: number, h: number) {
      if (w <= 0 || h <= 0) return;
      el.style.clipPath = `path('${squircleRectPath(w, h, CARD_CORNER_RADIUS)}')`;
    }

    function start() {
      ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          // borderBoxSize (not contentRect) — clip-path's reference box is
          // border-box, and every one of these cards has real padding, so
          // contentRect undersizes the path and clips into the padding.
          const box = entry.borderBoxSize?.[0];
          const w = box ? box.inlineSize : el.offsetWidth;
          const h = box ? box.blockSize : el.offsetHeight;
          apply(el, w, h);
        }
      });
      const els = document.querySelectorAll<HTMLElement>(SELECTOR);
      // ResizeObserver's first callback is async and not guaranteed to land
      // before paint (observed stuck at document.hidden in the preview tab,
      // and unreliable on some mobile browsers too) — apply once synchronously
      // off the already-laid-out box so the squircle shows immediately instead
      // of only after some later resize/reflow triggers the observer.
      els.forEach(el => {
        apply(el, el.offsetWidth, el.offsetHeight);
        ro!.observe(el);
      });
    }

    function sync() {
      ro?.disconnect();
      ro = null;
      if (mq.matches) {
        start();
      } else {
        clearAll();
      }
    }

    sync();
    mq.addEventListener('change', sync);

    return () => {
      mq.removeEventListener('change', sync);
      ro?.disconnect();
      clearAll();
    };
  }, []);
}
