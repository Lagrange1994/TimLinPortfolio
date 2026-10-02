type SizeTarget = { width: number; height: number; set(w: number, h: number): SizeTarget };
type SplineApp = {
  play?: () => void;
  stop?: () => void;
  render?: (time: number) => void;
  requestRender?: () => void;
  _resize?: (force?: boolean) => void;
  _isPaused?: boolean;
  _renderer?: {
    setAnimationLoop?: (cb: ((time: number) => void) | null) => void;
    getPixelRatio?: () => number;
    setPixelRatio?: (ratio: number) => void;
    getSize?: (target: SizeTarget) => SizeTarget;
    shadowMap?: {
      enabled?: boolean;
      autoUpdate?: boolean;
      needsUpdate?: boolean;
      render?: (...args: unknown[]) => void;
    };
  };
  __fpsCap?: number;
  __shadowEvery?: number;
  __basePixelRatio?: number;
};
type SplineViewerEl = HTMLElement & { _spline?: SplineApp };

// Spline's runtime renders on every display refresh while its scene has any
// running animation (both of ours always do) — 120/144 fps on high-refresh
// monitors, for decorative motion that reads identically at 60.
export const SPLINE_MAX_FPS = 60;

// Caps the runtime's frame rate by wrapping its own loop callback: frames
// arriving sooner than 1/maxFps after the last rendered one are skipped (the
// canvas keeps showing the previous frame). The runtime computes dt from the
// timestamps it actually receives, so animation speed is unaffected. play()
// re-arms the loop with `this.render` looked up at call time, so the wrapper
// survives every pause/resume. Idempotent; no-op on 60 Hz displays.
export function capSceneFps(app: SplineApp, maxFps = SPLINE_MAX_FPS) {
  if (app.__fpsCap || !app.render) return;
  const render = app.render;
  const interval = 1000 / maxFps;
  let last = -Infinity;
  app.render = (time: number) => {
    const elapsed = time - last;
    // 1ms slack so a 60 Hz display's slightly-early vsyncs aren't dropped.
    if (elapsed < interval - 1) return;
    // Advance on the interval grid (not to `time`) so a 144 Hz display
    // averages exactly maxFps instead of drifting down to every 3rd frame;
    // resync after a long gap (resume, tab switch) instead of bursting.
    last = elapsed > interval * 2 ? time : last + interval;
    render(time);
  };
  app.__fpsCap = maxFps;
  // Re-arm a loop that's already running so it picks up the wrapper now.
  if (!app._isPaused) app._renderer?.setAnimationLoop?.(app.render);
}

// The runtime re-renders its shadow map on every frame it draws (its opaque
// pass forces shadowMap.autoUpdate/needsUpdate on, later passes turn them
// back off) — for the hero figure that's the whole ~200k-triangle scene
// drawn one extra time per frame, for shadows that barely move. Wraps
// shadowMap.render so only every `every`th real refresh goes through: the
// map updates at 30 Hz under the 60 fps cap and the skipped frames reuse the
// previous one. Calls that wouldn't have drawn anyway (flags off, or no
// shadow-casting lights — the runtime issues several of those per frame)
// pass straight through uncounted. Idempotent.
export const SPLINE_SHADOW_EVERY = 2;
export function throttleSceneShadows(app: SplineApp, every = SPLINE_SHADOW_EVERY) {
  const shadowMap = app._renderer?.shadowMap;
  if (!shadowMap?.render || app.__shadowEvery) return;
  const render = shadowMap.render;
  let requests = 0;
  shadowMap.render = function (this: typeof shadowMap, ...args: unknown[]) {
    const lights = args[0];
    const wanted = this.enabled !== false
      && (this.autoUpdate !== false || this.needsUpdate === true)
      && (!Array.isArray(lights) || lights.length > 0);
    if (wanted && requests++ % every !== 0) {
      this.needsUpdate = false; // what a real refresh would have left behind
      return;
    }
    render.apply(this, args);
  };
  app.__shadowEvery = every;
}

// Render-resolution budget: a scene's drawing buffer never exceeds this many
// pixels (2560×1440), however large/dense the screen. The runtime sets its
// pixel ratio once at load (devicePixelRatio or the scene's export setting)
// — on a 4K / HiDPI screen the full-viewport bg scene otherwise renders at
// e.g. 3840×2160+, every pass of its pipeline at that size. Area-based so a
// portrait screen gets the same budget as a landscape one.
export const SPLINE_MAX_PIXELS = 2560 * 1440;

// Lowers (never raises past what the runtime chose) the renderer's pixel
// ratio so width×height×ratio² ≤ maxPixels, then lets the runtime's own
// _resize() re-size its canvas and post-processing buffers to match.
// Re-run whenever the viewer's logical size changes (see the resize hook
// below); a no-op when already within budget.
export function capSceneResolution(app: SplineApp, maxPixels = SPLINE_MAX_PIXELS) {
  const r = app._renderer;
  if (!r?.getSize || !r.getPixelRatio || !r.setPixelRatio) return;
  if (app.__basePixelRatio === undefined) app.__basePixelRatio = r.getPixelRatio();
  const size: SizeTarget = { width: 0, height: 0, set(w, h) { this.width = w; this.height = h; return this; } };
  r.getSize(size);
  if (size.width <= 0 || size.height <= 0) return;
  const budgetRatio = Math.sqrt(maxPixels / (size.width * size.height));
  const ratio = Math.min(app.__basePixelRatio, budgetRatio);
  if (Math.abs(ratio - r.getPixelRatio()) < 0.01) return;
  r.setPixelRatio(ratio);
  // _resize(true) = the runtime's forced path (setSize(w-1,h-1) then
  // setSize(w,h)): its renderer's setSize early-returns when the logical
  // size is unchanged, so a plain resize would leave the canvas and every
  // pipeline render target at the old pixel ratio.
  app._resize?.(true);
  app.requestRender?.();
}

// One shared, debounced resize hook re-applies the budget to every scene
// that has been through setSceneRunning (the runtime's own resize keeps the
// load-time ratio, so a window grown past the budget would exceed it).
const tracked = new Set<HTMLElement>();
let resizeTimer: ReturnType<typeof setTimeout> | undefined;
function onWindowResize() {
  clearTimeout(resizeTimer);
  // After the runtime's own debounced resize has applied the new size.
  resizeTimer = setTimeout(() => {
    for (const el of tracked) {
      if (!el.isConnected) { tracked.delete(el); continue; }
      const app = (el as SplineViewerEl)._spline;
      if (app) capSceneResolution(app);
    }
  }, 400);
}
function track(el: HTMLElement) {
  if (tracked.size === 0 && typeof window !== 'undefined') window.addEventListener('resize', onWindowResize);
  tracked.add(el);
}

// Pause/resume a <spline-viewer>'s render loop via the viewer's internal
// runtime (`_spline`, not public API — no-op before it has loaded). The
// viewer's own visibility handling doesn't stop it: it keeps rendering at
// full rate at opacity:0 and when scrolled fully off-screen. Pausing is
// play() THEN stop(): the runtime's stop() is a no-op once its `_isPaused`
// flag is set, and a stop() issued before load sets that flag without
// clearing the loop the load arms afterwards — leaving a "paused" scene that
// still renders every frame. play() first re-syncs the flag with the loop.
// Also installs the frame-rate cap (see capSceneFps) and the resolution
// budget (see capSceneResolution) on first call.
export function setSceneRunning(el: HTMLElement | null, running: boolean) {
  const app = (el as SplineViewerEl | null)?._spline;
  if (!el || !app) return;
  capSceneFps(app);
  capSceneResolution(app);
  track(el);
  app.play?.();
  if (!running) app.stop?.();
}
