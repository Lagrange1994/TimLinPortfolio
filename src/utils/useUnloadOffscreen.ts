import { useEffect } from 'react';

// Phones only. Every section stays mounted for the whole visit, so painted
// layers/tiles, running CSS animations and decoded images pile up as the
// user scrolls down — iOS WebKit kills the tab once that total passes its
// memory budget (confirmed with the ?debug crash log: died scrolling into
// "My Skills"). Once a section has been seen and is then far (UNLOAD_MARGIN
// screens) from the viewport, it's flagged `.is-unloaded` (see portfolio.css:
// content-visibility:hidden, height pinned to its last measured size) so the
// browser drops its rendering, animations and layers; it's restored as soon
// as it comes back within range. The DOM/React state is never touched, only
// rendering, and the pinned height keeps the page's total scroll height (and
// every scroll offset below it) unchanged.
const MOBILE_QUERY = '(max-width: 767px)';
const UNLOAD_MARGIN = '150%';

export const UNLOADED_CLASS = 'is-unloaded';
// Border-box height (used by the no-content-visibility fallback) and
// content-box height (contain-intrinsic-height describes the content box only,
// so passing the full height would add the section's padding twice).
export const UNLOAD_HEIGHT_VAR = '--unload-h';
export const UNLOAD_CONTENT_HEIGHT_VAR = '--unload-content-h';

export function useUnloadOffscreen(selector = 'section.section') {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    if (!window.matchMedia(MOBILE_QUERY).matches) return;

    const seen = new WeakSet<Element>();
    const sections = Array.from(document.querySelectorAll<HTMLElement>(selector));

    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          seen.add(el);
          el.classList.remove(UNLOADED_CLASS);
          el.style.removeProperty(UNLOAD_HEIGHT_VAR);
          el.style.removeProperty(UNLOAD_CONTENT_HEIGHT_VAR);
        } else if (seen.has(el) && !el.classList.contains(UNLOADED_CLASS)) {
          // Measure BEFORE flagging: once unloaded the box is size-contained
          // and would collapse to whatever this variable says.
          const cs = getComputedStyle(el);
          const box = el.getBoundingClientRect().height;
          const content = box - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0)
            - (parseFloat(cs.borderTopWidth) || 0) - (parseFloat(cs.borderBottomWidth) || 0);
          el.style.setProperty(UNLOAD_HEIGHT_VAR, `${box}px`);
          el.style.setProperty(UNLOAD_CONTENT_HEIGHT_VAR, `${Math.max(0, content)}px`);
          el.classList.add(UNLOADED_CLASS);
        }
      }
    }, { rootMargin: `${UNLOAD_MARGIN} 0px ${UNLOAD_MARGIN} 0px` });

    sections.forEach(s => io.observe(s));

    return () => {
      io.disconnect();
      sections.forEach(s => {
        s.classList.remove(UNLOADED_CLASS);
        s.style.removeProperty(UNLOAD_HEIGHT_VAR);
        s.style.removeProperty(UNLOAD_CONTENT_HEIGHT_VAR);
      });
    };
  }, [selector]);
}
