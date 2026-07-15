import { useEffect } from 'react';
import { squircleRectPath } from './squircle';

// Portfolio's .project-card/.grid-card (see CARD_CORNER_RADIUS in
// PortfolioSection.tsx) use a fixed 44px radius on a 300x200 box — a ratio
// of 44 / (200/2) = 44% of the box's own half-short-side. Reusing that same
// *ratio* (rather than reapplying the raw 44px to every box regardless of
// size) is what actually reads as "the same corner as Portfolio": a flat
// 44px on a short box like .bento-area-industry (~343x75) would clamp to
// nearly half its height — a pill, not a rounded rectangle — while 44% of
// its own half-height keeps the same visual proportion Portfolio's cards
// have at their own size.
const PORTFOLIO_RADIUS_RATIO = 44 / (200 / 2);

function cardRadius(w: number, h: number) {
  return PORTFOLIO_RADIUS_RATIO * (Math.min(w, h) / 2);
}

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
          if (w <= 0 || h <= 0) continue;
          el.style.clipPath = `path('${squircleRectPath(w, h, cardRadius(w, h))}')`;
        }
      });
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach(el => ro!.observe(el));
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
