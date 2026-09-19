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
//
// A restored section fades back in instead of popping into view. Restoring
// happens UNLOAD_MARGIN screens BEFORE the section is on screen, so playing
// the animation right then would finish off-camera; instead the section is
// held invisible (`.is-restoring`) until it actually intersects the viewport,
// then plays. Direction follows the scroll: scrolling up, content arrives
// from above (the opposite of the usual rise-from-below); scrolling down it
// rises from below.
const MOBILE_QUERY = '(max-width: 767px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const UNLOAD_MARGIN = '150%';

export const UNLOADED_CLASS = 'is-unloaded';
export const RESTORING_CLASS = 'is-restoring';
export const RESTORE_IN_UP_CLASS = 'is-restore-in-up';
export const RESTORE_IN_DOWN_CLASS = 'is-restore-in-down';
// Border-box height (used by the no-content-visibility fallback) and
// content-box height (contain-intrinsic-height describes the content box only,
// so passing the full height would add the section's padding twice).
export const UNLOAD_HEIGHT_VAR = '--unload-h';
export const UNLOAD_CONTENT_HEIGHT_VAR = '--unload-content-h';

const RESTORE_CLASSES = [RESTORING_CLASS, RESTORE_IN_UP_CLASS, RESTORE_IN_DOWN_CLASS];

export function useUnloadOffscreen(selector = 'section.section') {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    if (!window.matchMedia(MOBILE_QUERY).matches) return;

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const seen = new WeakSet<Element>();
    // Direction each pending section should animate in from, decided at the
    // moment it was restored.
    const pendingDir = new WeakMap<Element, 'up' | 'down'>();
    const sections = Array.from(document.querySelectorAll<HTMLElement>(selector));

    let lastY = window.scrollY;
    let scrollingUp = false;
    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) scrollingUp = y < lastY;
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const clearRestore = (el: HTMLElement) => {
      el.classList.remove(...RESTORE_CLASSES);
      pendingDir.delete(el);
      revealIo.unobserve(el);
    };

    const onAnimationEnd = (e: AnimationEvent) => {
      const el = e.currentTarget as HTMLElement;
      if (e.target !== el) return; // ignore children's own animations
      el.classList.remove(RESTORE_IN_UP_CLASS, RESTORE_IN_DOWN_CLASS);
    };

    // Second stage: the real viewport (no margin). Fires once a held section
    // is actually on screen, and only then swaps "hidden" for the animation.
    const revealIo = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const dir = pendingDir.get(el);
        if (!dir || !el.classList.contains(RESTORING_CLASS)) continue;
        revealIo.unobserve(el);
        pendingDir.delete(el);
        el.classList.remove(RESTORING_CLASS);
        el.classList.add(dir === 'up' ? RESTORE_IN_UP_CLASS : RESTORE_IN_DOWN_CLASS);
      }
    });

    const rangeIo = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          seen.add(el);
          const wasUnloaded = el.classList.contains(UNLOADED_CLASS);
          el.classList.remove(UNLOADED_CLASS);
          el.style.removeProperty(UNLOAD_HEIGHT_VAR);
          el.style.removeProperty(UNLOAD_CONTENT_HEIGHT_VAR);
          if (wasUnloaded && !reducedMotion) {
            pendingDir.set(el, scrollingUp ? 'up' : 'down');
            el.classList.remove(RESTORE_IN_UP_CLASS, RESTORE_IN_DOWN_CLASS);
            el.classList.add(RESTORING_CLASS);
            revealIo.observe(el);
          }
        } else if (seen.has(el) && !el.classList.contains(UNLOADED_CLASS)) {
          // Measure BEFORE flagging: once unloaded the box is size-contained
          // and would collapse to whatever this variable says.
          const cs = getComputedStyle(el);
          const box = el.getBoundingClientRect().height;
          const content = box - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0)
            - (parseFloat(cs.borderTopWidth) || 0) - (parseFloat(cs.borderBottomWidth) || 0);
          // Left the range again before its held reveal ever played — drop
          // the hold so it doesn't stay invisible if it's restored quietly.
          clearRestore(el);
          el.style.setProperty(UNLOAD_HEIGHT_VAR, `${box}px`);
          el.style.setProperty(UNLOAD_CONTENT_HEIGHT_VAR, `${Math.max(0, content)}px`);
          el.classList.add(UNLOADED_CLASS);
        }
      }
    }, { rootMargin: `${UNLOAD_MARGIN} 0px ${UNLOAD_MARGIN} 0px` });

    sections.forEach(s => {
      s.addEventListener('animationend', onAnimationEnd);
      rangeIo.observe(s);
    });

    return () => {
      window.removeEventListener('scroll', onScroll);
      rangeIo.disconnect();
      revealIo.disconnect();
      sections.forEach(s => {
        s.removeEventListener('animationend', onAnimationEnd);
        s.classList.remove(UNLOADED_CLASS, ...RESTORE_CLASSES);
        s.style.removeProperty(UNLOAD_HEIGHT_VAR);
        s.style.removeProperty(UNLOAD_CONTENT_HEIGHT_VAR);
      });
    };
  }, [selector]);
}
