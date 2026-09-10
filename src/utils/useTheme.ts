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

// ── TEMPORARY diagnostic HUD ──────────────────────────────────────────────
// Not for commit. Chasing "1st toggle fades, 2nd snaps" on real Android
// Chrome specifically — headless Chromium (same engine) cannot reproduce it
// even after eliminating a stale-dev-server variable, so the next step is
// reading real frame-by-frame numbers off the actual failing phone instead
// of guessing again. Opt-in via ?themedebug=1 so it never shows otherwise.
// Prints, per toggle: when the class/attribute land, then samples a visible
// menu label's computed color on every rAF for ~900ms and reports SNAP (<=2
// distinct values — went straight from start color to end color) or
// SMOOTH(n) (n interpolated steps seen). Also logs the exact moment the
// stale-paint bust's forced reflow runs, tagged with ms-since-toggle, so a
// bust landing inside the sampling window shows up directly instead of
// being inferred. Remove this whole block once the phone confirms the fix.
const THEME_DEBUG = typeof window !== 'undefined' && /[?&]themedebug=1\b/.test(window.location.search);
let __themeDebugEl: HTMLDivElement | null = null;
let __themeDebugN = 0;
function themeDebugLine(s: string) {
  if (!THEME_DEBUG) return;
  if (!__themeDebugEl) {
    // Wrapper is pointer-events:none so it never blocks taps on the real
    // site underneath; the log text and the copy button opt back into
    // pointer-events individually so they're the only tappable parts.
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:2147483647;pointer-events:none;display:flex;flex-direction:column;';
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 複製 log（測完再按，不用搶時間）';
    copyBtn.style.cssText = 'pointer-events:auto;font:12px/1.4 ui-monospace,Menlo,monospace;padding:10px;background:#222;color:#7CFC7C;border:none;border-top:1px solid #444;';
    copyBtn.onclick = async () => {
      const text = __themeDebugEl!.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = '✅ 已複製，貼到聊天視窗給我';
      } catch {
        // Clipboard API can be blocked (no HTTPS/permission) — fall back to
        // a selectable textarea the user can long-press → select all → copy.
        copyBtn.textContent = '⬇️ 複製失敗，改用下面文字框長按選取';
        __themeDebugEl!.style.userSelect = 'text';
        __themeDebugEl!.style.pointerEvents = 'auto';
      }
      window.setTimeout(() => { copyBtn.textContent = '📋 複製 log（測完再按，不用搶時間）'; }, 2500);
    };
    const el = document.createElement('div');
    el.id = '__theme_debug__';
    el.style.cssText = 'max-height:40vh;overflow:auto;background:rgba(0,0,0,.9);color:#7CFC7C;font:10px/1.55 ui-monospace,Menlo,monospace;padding:6px 8px;white-space:pre-wrap;pointer-events:auto;-webkit-user-select:text;user-select:text;';
    wrap.appendChild(el);
    wrap.appendChild(copyBtn);
    document.body.appendChild(wrap);
    __themeDebugEl = el;
  }
  __themeDebugEl.textContent += s + '\n';
  __themeDebugEl.scrollTop = __themeDebugEl.scrollHeight;
}
function themeDebugSample(n: number) {
  if (!THEME_DEBUG) return;
  // Must actually be rendered — a display:none candidate (the desktop
  // switch label, hidden below 1025px) never runs a CSS transition at all
  // and would misreport SNAP unconditionally, which isn't the real bug.
  const candidates = document.querySelectorAll<HTMLElement>('.sm-panel-itemLabel, .theme-switch-label');
  let el: HTMLElement | null = null;
  for (const c of candidates) { if (c.getClientRects().length > 0) { el = c; break; } }
  if (!el) { themeDebugLine(`  [#${n}] no VISIBLE probe element (menu closed, or viewport ≥1025px)`); return; }
  themeDebugLine(`  [#${n}] probing <${el.className}>`);
  const t0 = performance.now();
  const samples: Array<[number, string]> = [];
  const tick = () => {
    const t = performance.now() - t0;
    samples.push([Math.round(t), getComputedStyle(el).color]);
    if (t < 900) { requestAnimationFrame(tick); return; }
    const uniq: Array<[number, string]> = [];
    for (const s of samples) if (!uniq.length || uniq[uniq.length - 1][1] !== s[1]) uniq.push(s);
    const verdict = uniq.length <= 2 ? 'SNAP' : `SMOOTH(${uniq.length} steps)`;
    themeDebugLine(`  [#${n}] ${verdict} — ${samples.length} frames sampled — change-times(ms): ${uniq.map(([t]) => t).join(',')}`);
  };
  requestAnimationFrame(tick);
}
// ───────────────────────────────────────────────────────────────────────

// How long to hold the bust off after a toggle. It display:none's ~28
// backdrop-filter elements at once and forces a layout — one heavy
// composited-layer teardown/rebuild. requestIdleCallback alone wasn't
// enough separation: its 500ms timeout fires while the animations are still
// running, so on a phone that block landed mid-flight and the knob visibly
// stopped partway across before finishing ("卡在路上"). Waiting past all of
// them, and only then asking for idle time, keeps the repair completely
// outside the window where anything is animating.
// Derived, in order: the longest transition is the mobile menu's breathing
// crossfade (--theme-breathe-dur, 0.68s), the theme-transitioning class
// comes off at 800ms, and this sits past that. Raise it if that duration
// ever goes up — this landing early is the exact shape of the bug it was
// introduced to avoid.
const BUST_DELAY_MS = 1100;

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
  // The theme this hook has actually written to the DOM. Compared against
  // `theme` to tell a real toggle from a re-run, which is what decides
  // whether to arm the crossfade at all. A boolean isFirstRun ref was used
  // for this before and got it wrong under StrictMode: dev double-invokes
  // effects as mount → unmount → remount, so the ref was already spent by
  // the remount and page load ran the whole toggle path — crossfade class,
  // stale-paint bust and all — with nothing having changed. Comparing the
  // value can't be fooled by an extra invocation.
  const appliedThemeRef = useRef<Theme | null>(null);
  const lazyObserverRef = useRef<IntersectionObserver | null>(null);
  const idleIdRef = useRef<number | null>(null);
  const didChangeRef = useRef(false);

  // Layout effect, not a passive one, and BOTH the attribute flip and the
  // class that arms the crossfade happen here, in one synchronous block.
  //
  // Splitting them is what made the transition intermittent — "only the
  // first toggle animates, after that the colors just snap". data-theme was
  // set here, before paint, while html.theme-transitioning (which is what
  // actually carries the `transition` declarations) was added from a passive
  // effect, which React runs AFTER paint. Whenever the browser got a paint
  // in between, the themed values had already landed at their final colors
  // with no transition declared on anything, so there was nothing left to
  // interpolate; the class then arrived too late to matter. Whether that
  // paint happens depends on how busy the main thread is at that instant,
  // which is why it looked like a first-time-only effect rather than a
  // straightforward bug.
  //
  // Landing both in a single style change is enough for Chromium: CSS
  // Transitions resolves transition-property/duration from the AFTER-change
  // style, so a property that gains its transition in the very change that
  // alters its value still transitions. Verified in headless Chromium —
  // 30+ distinct interpolated colors per toggle, every toggle, both
  // directions. WebKit has never reliably done that: it wants the
  // transition already declared in the BEFORE-change style, and if it isn't,
  // the value just lands. Which is why the crossfade could look correct in
  // one browser and snap in another on the same build.
  // So the class goes on, the style is flushed, and only then does the
  // attribute flip — two style changes, the transition declared in the
  // first, the themed values changing in the second. The extra recalc only
  // touches transition-* properties: no layout, no paint, and it's read
  // through getComputedStyle rather than offsetHeight so it doesn't force a
  // layout pass on the way.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const changed = appliedThemeRef.current !== null && appliedThemeRef.current !== theme;
    didChangeRef.current = changed;
    appliedThemeRef.current = theme;

    // Arms portfolio.css's html.theme-transitioning rules — the color
    // crossfade is scoped to an actual toggle instead of sitting on every
    // element permanently (a bare `*` transition was tried first and made
    // the mobile menu and every hover ease too).
    //
    // document.startViewTransition was also tried, to cross-fade the whole
    // page as one compositor blend. Removed: a view transition hides the
    // LIVE DOM for the length of its animation and shows static before/after
    // snapshots instead, while the switch knob kept moving underneath,
    // unseen — so the knob appeared frozen for the transition's duration and
    // then jumped to wherever it had already reached ("卡在中間才到另一端").
    // Its one real advantage — cross-fading light mode's background-IMAGE
    // against dark mode's flat color, which a background-color transition
    // genuinely cannot interpolate — went away once both page-background
    // layers became flat colors on mobile (see #bg-scene in portfolio.css).
    let debugN = 0;
    if (changed) {
      root.classList.add('theme-transitioning');
      // Commit the arming as its own style change — see the note above.
      void getComputedStyle(root).transitionDuration;
    }
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Private-mode/storage-disabled: theme still applies for this load, just doesn't persist.
    }

    if (changed && THEME_DEBUG) {
      debugN = ++__themeDebugN;
      themeDebugLine(`toggle #${debugN} → ${theme} @ t=${performance.now().toFixed(1)}`);
      themeDebugSample(debugN);
    }

    if (!changed) return;

    // Must outlast the LONGEST transition those rules declare. That's the
    // mobile menu's breathing crossfade at --theme-breathe-dur (0.68s), not
    // the 0.38s the navbar, page text and knob use. Removing the class also
    // removes the transition property, and a transition whose property
    // disappears mid-flight doesn't finish — it jumps straight to its end
    // value, which is exactly the snap this is here to avoid. The extra
    // ~120ms is margin for a frame landing late.
    const transitionTimeoutId = window.setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 800);
    return () => window.clearTimeout(transitionTimeoutId);
  }, [theme]);

  useEffect(() => {
    if (!didChangeRef.current) return;
    const debugToggleT0 = performance.now();
    const debugN = THEME_DEBUG ? __themeDebugN : 0;

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
        if (THEME_DEBUG) {
          themeDebugLine(`  [#${debugN}] BUST running @ t=+${(performance.now() - debugToggleT0).toFixed(1)}ms`);
        }
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
      if (THEME_DEBUG) {
        themeDebugLine(`  [#${debugN}] cleanup (bust cancelled if still pending) @ t=+${(performance.now() - debugToggleT0).toFixed(1)}ms`);
      }
    };
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}
