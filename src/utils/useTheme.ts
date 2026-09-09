import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

const STALE_PAINT_SELECTOR = '.bento-card, .ai-card, .tech-item, .process-card, .philosophy-card, .pill, [class*="-dark"]:not(.snap-section):not(.theme-switch):not(.sm-theme-switch)';

function bustStalePaint(el: HTMLElement) {
  const prevDisplay = el.style.display;
  el.style.display = 'none';
  void el.offsetHeight;
  el.style.display = prevDisplay;
}

// How long to hold the bust off after a toggle. It display:none's ~28
// backdrop-filter elements at once and forces a layout — one heavy
// composited-layer teardown/rebuild. requestIdleCallback alone wasn't
// enough separation: its 500ms timeout fires while the switch knob's Motion
// spring (~400ms to settle) and the color crossfade (280ms) are still
// running, so on a phone that block landed mid-animation and the knob
// visibly stopped partway across before finishing ("卡在路上"). Waiting
// past both, and only then asking for idle time, keeps the repair
// completely outside the window where anything is animating.
const BUST_DELAY_MS = 700;

// requestIdleCallback lets the forced-layout bust below wait for genuine
// spare main-thread time instead of competing with whatever frame it lands
// on. Falls back to setTimeout (Safari has no rIC).
function onIdle(cb: () => void): number {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
  return w.requestIdleCallback ? w.requestIdleCallback(cb, { timeout: 500 }) : window.setTimeout(cb, 100);
}
function cancelIdle(id: number) {
  const w = window as Window & { cancelIdleCallback?: (id: number) => void };
  if (w.cancelIdleCallback) w.cancelIdleCallback(id);
  else window.clearTimeout(id);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const isFirstRun = useRef(true);
  const lazyObserverRef = useRef<IntersectionObserver | null>(null);
  const idleIdRef = useRef<number | null>(null);

  // Layout effect, not a passive one: the attribute flip is what every
  // themed rule keys off, so it should land in the same commit as the
  // render that changed `theme`, before the browser paints — not a frame
  // later, which shows up as the switch knob moving before the colors do.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Private-mode/storage-disabled: theme still applies for this load, just doesn't persist.
    }
  }, [theme]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    // Arms portfolio.css's html.theme-transitioning rule for just this
    // window, so the color crossfade is scoped to an actual toggle instead
    // of sitting on every element permanently (a bare `*` transition was
    // tried first and made the mobile menu and every hover ease too).
    //
    // document.startViewTransition was also tried here, to cross-fade the
    // whole page as one compositor blend. Removed: a view transition hides
    // the LIVE DOM for the length of its animation and shows static
    // before/after snapshots instead, but the switch knob's position is a
    // live Motion spring (motion.span animate={{x}}, Navbar.tsx) running
    // underneath, unseen — so the knob appeared frozen for the transition's
    // duration and then jumped to wherever the hidden spring had already
    // reached ("卡在中間才到另一端"). Its one real advantage — cross-fading
    // light mode's background-IMAGE against dark mode's flat color, which a
    // background-color transition genuinely cannot interpolate — went away
    // once both page-background layers became flat colors on mobile (see
    // #bg-scene in portfolio.css).
    document.documentElement.classList.add('theme-transitioning');
    const transitionTimeoutId = window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);

    // Chromium can leave an already-rendered node pinned to its pre-toggle
    // background even though the custom property it's built from has
    // already updated — verified by comparing a mounted .bento-card against
    // a freshly created one with the same classes, which resolved correctly
    // straight away. Forcing the stuck node through display:none/reflow/
    // restore is what clears it.
    lazyObserverRef.current?.disconnect();
    if (idleIdRef.current !== null) cancelIdle(idleIdRef.current);
    const bustDelayId = window.setTimeout(() => {
      idleIdRef.current = onIdle(() => {
        const affected = Array.from(document.querySelectorAll<HTMLElement>(STALE_PAINT_SELECTOR));
        const vh = window.innerHeight;
        const near: HTMLElement[] = [];
        const far: HTMLElement[] = [];
        affected.forEach(el => {
          const r = el.getBoundingClientRect();
          (r.bottom > -vh && r.top < vh * 2 ? near : far).push(el);
        });

        const prevDisplays = near.map(el => el.style.display);
        near.forEach(el => { el.style.display = 'none'; });
        void document.body.offsetHeight;
        near.forEach((el, i) => { el.style.display = prevDisplays[i]; });

        if (far.length) {
          const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                bustStalePaint(entry.target as HTMLElement);
                obs.unobserve(entry.target);
              }
            });
          }, { rootMargin: '200px' });
          far.forEach(el => observer.observe(el));
          lazyObserverRef.current = observer;
        }
      });
    }, BUST_DELAY_MS);

    return () => {
      window.clearTimeout(bustDelayId);
      if (idleIdRef.current !== null) cancelIdle(idleIdRef.current);
      lazyObserverRef.current?.disconnect();
      window.clearTimeout(transitionTimeoutId);
    };
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}
