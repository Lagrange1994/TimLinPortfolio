import { useEffect } from 'react';
import { LAZY_UNIT_EVENT } from './lazyUnit';

// Every breakpoint. The homepage keeps dozens of decorative `infinite` CSS
// animations (orbit rings, glows, blinking cursors, chip marquees…) running
// in every section for the whole visit, so the compositor keeps repainting
// them long after they've scrolled away. While a section is well outside the
// viewport it gets `.is-offscreen-paused` (portfolio.css), which pauses every
// CSS animation inside it; they pick up where they stopped once it's back
// within PAUSE_MARGIN.
//
// A class + `animation-play-state` rather than Animation.pause(): once the
// Web Animations API pauses/plays a CSS animation, later
// `animation-play-state` changes stop applying to it, which would break the
// stylesheet's own hover-pause rules.
export const OFFSCREEN_PAUSED_CLASS = 'is-offscreen-paused';
const PAUSE_MARGIN = '200px 0px';

export function usePauseOffscreenAnimations(selector = '#home, section.section') {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        entry.target.classList.toggle(OFFSCREEN_PAUSED_CLASS, !entry.isIntersecting);
      }
    }, { rootMargin: PAUSE_MARGIN });
    // Lazily unmounted page units (LazyUnit) swap their section elements, so
    // the observed set is re-queried on every LAZY_UNIT_EVENT.
    const seen = new Set<HTMLElement>();
    let first = true;
    const observe = () => {
      if (!first) io.disconnect();
      first = false;
      document.querySelectorAll<HTMLElement>(selector).forEach(s => { seen.add(s); io.observe(s); });
    };
    observe();
    window.addEventListener(LAZY_UNIT_EVENT, observe);
    return () => {
      window.removeEventListener(LAZY_UNIT_EVENT, observe);
      io.disconnect();
      seen.forEach(s => s.classList.remove(OFFSCREEN_PAUSED_CLASS));
    };
  }, [selector]);
}
