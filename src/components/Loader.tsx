import { useEffect } from 'react';
import { PROJECTS } from '../data/projects';

// Must match HeroSection's "Hero spline desktop+tablet conditional" effect —
// that's the breakpoint below which the hero figure is a static <img> instead
// of a Spline scene.
const HERO_FIGURE_BREAKPOINT = 768;

// Safety net only: reveal the page anyway if an asset never reports ready
// (viewer script blocked, a scene 404s…). Long enough that the real signals
// below normally win — the previous 4s was shorter than the scenes take to
// load on a fast laptop, so it was what dismissed the loader every time.
// The three scenes this waits for (figure + both themes' backgrounds) take
// ~10-13s on a laptop iGPU with a cold shader cache (longer since
// index.html's link shim trades load time for a loader that keeps moving),
// more with the machine under load, hence the headroom.
export const LOADER_FORCE_MS = 25000;
// How often readiness is re-checked while waiting (see isReady).
const POLL_MS = 250;
// A bg scene with no `url` this long after mount has been dropped on purpose
// (BeamsBackground drops it when the hero is scrolled out of view), so it is
// not coming and must not hold the loader.
const DROPPED_URL_GRACE_MS = 600;
// After the assets report ready, hold until the main thread has actually gone
// quiet — a freshly loaded scene compiles more shaders on its first rendered
// frames — so the hero entrance starts on a calm frame budget, not on top of
// that tail. "Quiet" is CALM_FRAMES frames in a row with no long hitch, not a
// perfect 60fps: two live WebGL scenes legitimately run slower than that.
// Bounded: never more than CALM_MAX_WAIT_MS extra.
const CALM_FRAME_MS = 100;
const CALM_FRAMES = 3;
export const CALM_MAX_WAIT_MS = 1200;
// The static loader is removed (not just hidden) once its 0.1s fade is over,
// so its compositor animations don't keep ticking under the page forever.
const REMOVE_AFTER_MS = 400;

type SplineViewerEl = HTMLElement & { _loaded?: boolean };

// The loading screen itself is static markup in index.html (#page-loader),
// animated purely on the compositor — see the LOADER block there for why.
// This component renders nothing; it only decides when to dismiss it.
export default function Loader() {
  // Fire off fetch+decode for every portfolio marquee image as soon as the
  // loading screen mounts — well before ProjectCard's own `loading="lazy"`
  // <img> tags would normally start fetching. wall-frame-in's reveal fires
  // (see PortfolioSection.tsx) via a scroll-settle debounce, on a static
  // page — but if the 12 portfolio images (each cloned multiple times by
  // createPortfolioScroller to fill every marquee row) are still decoding
  // when the user arrives, that main-thread work can eat the reveal's own
  // animation frames and make it look instant regardless of how correct
  // its own timing is. Not gated on hideLoader/forceTimer — this must not
  // delay first paint of the hero, it only needs a head start.
  useEffect(() => {
    PROJECTS.forEach(p => {
      const img = new Image();
      img.src = p.img;
      img.decode?.().catch(() => {});
    });
  }, []);

  useEffect(() => {
    const loader = document.getElementById('page-loader');
    // StrictMode's second effect run (dev), after the first already dismissed.
    if (document.body.classList.contains('hero-ready')) {
      loader?.classList.add('hidden');
      return;
    }

    let dismissed = false;
    let settling = false;
    let forceTimer: ReturnType<typeof setTimeout> | undefined;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let calmTimer: ReturnType<typeof setTimeout> | undefined;
    let calmRaf = 0;
    const startedAt = performance.now();
    // ids of <spline-viewer>s that have reported load-complete.
    const reported = new Set<string>();

    function stopWaiting() {
      clearTimeout(forceTimer);
      clearInterval(pollTimer);
      clearTimeout(calmTimer);
      if (calmRaf) cancelAnimationFrame(calmRaf);
      document.removeEventListener('load-complete', onViewerEvent, true);
    }

    function hideLoader() {
      if (dismissed) return;
      dismissed = true;
      stopWaiting();
      loader?.classList.add('hidden');
      document.body.classList.add('hero-ready');
      window.dispatchEvent(new Event('hero-ready'));
      if (loader) setTimeout(() => loader.remove(), REMOVE_AFTER_MS);
    }

    // Hold the reveal until CALM_FRAMES frames in a row came in under
    // CALM_FRAME_MS (or the cap runs out).
    function settle() {
      if (settling || dismissed) return;
      settling = true;
      clearInterval(pollTimer);
      if (typeof requestAnimationFrame !== 'function') { hideLoader(); return; }
      calmTimer = setTimeout(hideLoader, CALM_MAX_WAIT_MS);
      let last = performance.now();
      let calm = 0;
      const frame = (now: number) => {
        calm = now - last < CALM_FRAME_MS ? calm + 1 : 0;
        last = now;
        if (calm >= CALM_FRAMES) hideLoader();
        else calmRaf = requestAnimationFrame(frame);
      };
      calmRaf = requestAnimationFrame(frame);
    }

    // <spline-viewer> never fires a native `load` — the scene being parsed,
    // compiled and ready is its `load-complete` CustomEvent. Listened for on
    // the document (capture) because the bg viewers are portaled into #home a
    // tick after this effect runs, so they don't exist yet to attach to.
    function viewerReady(id: string, droppable: boolean) {
      const el = document.getElementById(id) as SplineViewerEl | null;
      if (reported.has(id) || el?._loaded) return true;
      // Dropped on purpose (hero out of view) — it isn't going to load.
      return droppable && !!el && !el.getAttribute('url')
        && performance.now() - startedAt > DROPPED_URL_GRACE_MS;
    }

    function isReady() {
      if (window.innerWidth < HERO_FIGURE_BREAKPOINT) {
        // Phone: both hero layers are plain images; only the active
        // background is worth waiting for.
        const img = document.querySelector<HTMLImageElement>('img.spline-bg-layer.is-active');
        return !img || img.complete;
      }
      const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      // The other theme's scene loads behind the loading screen too (see
      // BeamsBackground) — started any later, its parse and shader compiles
      // land on the hero entrance. Both bg viewers are portaled in together,
      // so "not in the DOM" can only mean the active one is blocking anyway.
      const otherId = `spline-bg-${theme === 'light' ? 'dark' : 'light'}`;
      return viewerReady('hero-spline', false) && viewerReady(`spline-bg-${theme}`, true)
        && (!document.getElementById(otherId) || viewerReady(otherId, true));
    }

    function check() {
      if (!dismissed && !settling && isReady()) settle();
    }

    function onViewerEvent(e: Event) {
      const id = (e.target as HTMLElement | null)?.id;
      if (id) reported.add(id);
      check();
    }

    function waitForAssets() {
      const isDesktop = window.innerWidth >= HERO_FIGURE_BREAKPOINT;
      const waitsOnSomething = isDesktop
        ? !!document.getElementById('hero-spline')
        : !!document.querySelector('img.spline-bg-layer.is-active');
      // Nothing to wait for (and nothing heavy just happened): reveal now.
      if (!waitsOnSomething) { hideLoader(); return; }

      forceTimer = setTimeout(hideLoader, LOADER_FORCE_MS);
      document.addEventListener('load-complete', onViewerEvent, true);
      pollTimer = setInterval(check, POLL_MS);
      check();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', waitForAssets, { once: true });
    } else {
      waitForAssets();
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', waitForAssets);
      stopWaiting();
    };
  }, []);

  return null;
}
