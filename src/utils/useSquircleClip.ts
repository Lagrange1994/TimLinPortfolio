import { useEffect } from 'react';
import { squircleRectPath } from './squircle';

// Give the homepage cards the *exact* same corner as the portfolio project
// cards, which are clipped with a fixed-radius superellipse (n=5) squircle via
// squircleRectPath (see PortfolioSection.tsx, CARD_CORNER_RADIUS = 44). The
// cards here previously used CSS `corner-shape: squircle`, whose curve reads
// visibly rounder/larger at the same radius than that superellipse clip — so
// matching the radius number (44) still looked "too large" next to the
// portfolio cards. Using the same clip-path path makes the curve identical.
//
// Scoped to mobile (<=767px) on purpose. clip-path clips the element's
// box-shadow and any overflowing descendants — including the hover glow rings
// on .ai-card / .process-card that sit at inset:-10px. Those rings only appear
// on :hover, which doesn't fire on touch, so on phones (where the corner
// mismatch was reported) clipping costs nothing visible. Desktop keeps its CSS
// corner-shape corners and working hover glows untouched. The thin strips
// (.cta-strip / .bento-area-industry) are intentionally excluded: at ~75-81px
// tall a 44px radius collapses their short ends into a pill.
const MOBILE_MAX = 767;
const CARD_RADIUS = 44; // == PortfolioSection CARD_CORNER_RADIUS
const SELECTOR = [
  '.tech-item',
  '.bento-area-years',
  '.bento-area-projects',
  '.bento-area-domains',
  '.contact-card',
  '.line-banner',
  '.process-card',
  '.ai-card',
].join(', ');

export function useSquircleClip() {
  useEffect(() => {
    let ro: ResizeObserver | null = null;

    const teardown = () => {
      if (ro) { ro.disconnect(); ro = null; }
    };

    const setup = () => {
      teardown();
      const els = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
      if (window.innerWidth > MOBILE_MAX) {
        // Above the breakpoint: hand the corners back to CSS corner-shape and
        // let the hover glow rings render outside the (now unclipped) box.
        els.forEach(el => { el.style.clipPath = ''; });
        return;
      }
      // Recompute per card whenever its rendered box changes (font swap,
      // i18n text length, orientation) so the corner radius stays a constant
      // 44px superellipse instead of scaling with the box.
      ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const { width, height } = entry.contentRect;
          if (width <= 0 || height <= 0) continue;
          el.style.clipPath = `path('${squircleRectPath(width, height, CARD_RADIUS)}')`;
        }
      });
      els.forEach(el => ro!.observe(el));
    };

    setup();
    // Webfonts (display=swap) reflow card heights after first paint; re-run
    // once they settle in case a card was 0-height when the RO first attached.
    if (document.fonts?.ready) document.fonts.ready.then(setup);

    window.addEventListener('resize', setup);
    return () => {
      window.removeEventListener('resize', setup);
      teardown();
    };
  }, []);
}
