type SizeTarget = { width: number; height: number; set(w: number, h: number): SizeTarget };
type SplineApp = {
  play?: () => void;
  stop?: () => void;
  render?: (time: number) => void;
  requestRender?: () => void;
  _resize?: (force?: boolean) => void;
  _isPaused?: boolean;
  _lastTime?: number;
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
  __loopPaused?: boolean;
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
  let last = -Infinity;
  app.render = (time: number) => {
    // Read per frame: the quality governor lowers a bg scene's cap later on.
    const interval = 1000 / (app.__fpsCap || maxFps);
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
  if (!app._isPaused && !app.__loopPaused) app._renderer?.setAnimationLoop?.(app.render);
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

// Quality levels for GPUs that can't keep up at full quality. Chromium on
// Windows runs WebGL on the integrated GPU of a hybrid laptop whatever the
// page asks for (the runtime already requests powerPreference
// 'high-performance'; it is ignored). Measured on an Iris Xe driving a
// HiDPI screen: figure at 1600×1600 + background at 2560×1440 = ~15 fps,
// against ~190 fps on the same machine's discrete GPU. Level 0 is what
// every scene starts on; sceneQualityGovernor.ts steps down only after
// measuring sustained slow frames, so a GPU that copes never leaves it.
// Each step lowers the drawing-buffer budgets; from level 2 the (slow,
// decorative) background also renders at 30 fps so the figure — the thing
// the visitor is interacting with — gets the frames. Any level above 0 also
// freezes the dark theme's panel glow (html[data-scene-quality] in
// portfolio.css + BeamsBackground): its breathing/flowing animation
// re-blurs a panel-sized shape every frame, which alone halved the frame
// rate on that Iris Xe.
//
// The figure's budget does NOT step down: it stays at its on-screen
// resolution on every level (HeroSection caps it at display pixels anyway).
// It used to drop to 1200² / 1000² / 800², and at level 3 on a 1.5x screen
// the 1200×1200-device-px figure was drawn at 800² and upscaled — visibly
// soft (edge sharpness −58%), the thing visitors look at most. Measured
// cost of keeping it sharp at level 3: ~10–20% fps; the background, not the
// figure, is what these GPUs are short of (hiding the figure: 48 → 54 fps,
// hiding the bg: 48 → ~190, 2026-10-14).
export type SceneKind = 'bg' | 'hero';
export const SCENE_QUALITY_LEVELS = [
  { bgPixels: SPLINE_MAX_PIXELS, heroPixels: SPLINE_MAX_PIXELS, bgFps: SPLINE_MAX_FPS },
  { bgPixels: 1920 * 1080, heroPixels: SPLINE_MAX_PIXELS, bgFps: SPLINE_MAX_FPS },
  { bgPixels: 1600 * 900, heroPixels: SPLINE_MAX_PIXELS, bgFps: 30 },
  { bgPixels: 1280 * 720, heroPixels: SPLINE_MAX_PIXELS, bgFps: 30 },
] as const;
export const SCENE_QUALITY_MAX = SCENE_QUALITY_LEVELS.length - 1;
// Per tab: a reload starts on the level this GPU already needed instead of
// stuttering through the measurement again. Not localStorage — a visitor who
// then switches the browser to the discrete GPU must not stay degraded.
const QUALITY_KEY = 'tl-scene-quality';

function clampLevel(n: number) {
  return Number.isFinite(n) ? Math.min(SCENE_QUALITY_MAX, Math.max(0, Math.round(n))) : 0;
}
function storedLevel() {
  try { return clampLevel(Number(sessionStorage.getItem(QUALITY_KEY) ?? 0)); } catch { return 0; }
}
let qualityLevel = storedLevel();
// Mirrored on <html> so CSS can react to it (see the glow note above).
function publishLevel() {
  if (typeof document !== 'undefined') document.documentElement.setAttribute('data-scene-quality', String(qualityLevel));
}
if (qualityLevel > 0) publishLevel();
const qualityListeners = new Set<() => void>();
const tracked = new Map<HTMLElement, SceneKind>();

export function getSceneQuality() { return qualityLevel; }
export function scenePixelBudget(kind: SceneKind): number {
  const level = SCENE_QUALITY_LEVELS[qualityLevel];
  return kind === 'hero' ? level.heroPixels : level.bgPixels;
}
// The hero figure's pixel ratio is owned by HeroSection (it overrides the
// runtime's own ratio getter), so it subscribes here and re-applies it
// itself; bg scenes are re-budgeted right away by applyQuality below.
export function onSceneQualityChange(cb: () => void) {
  qualityListeners.add(cb);
  return () => { qualityListeners.delete(cb); };
}
export function setSceneQuality(level: number) {
  const next = clampLevel(level);
  if (next === qualityLevel) return;
  qualityLevel = next;
  try { sessionStorage.setItem(QUALITY_KEY, String(next)); } catch { /* private mode */ }
  publishLevel();
  for (const [el, kind] of tracked) {
    const app = (el as SplineViewerEl)._spline;
    if (app) applyQuality(app, kind);
  }
  qualityListeners.forEach(cb => cb());
}
// True while any tracked scene's render loop is running — the governor only
// counts frames that a scene actually had a part in.
export function anySceneRunning() {
  for (const el of tracked.keys()) {
    const app = (el as SplineViewerEl)._spline;
    if (el.isConnected && app && !app._isPaused && !app.__loopPaused) return true;
  }
  return false;
}

function applyQuality(app: SplineApp, kind: SceneKind) {
  if (kind !== 'bg') return;
  if (app.__fpsCap) app.__fpsCap = SCENE_QUALITY_LEVELS[qualityLevel].bgFps;
  capSceneResolution(app, scenePixelBudget('bg'));
}

// One shared, debounced resize hook re-applies the budget to every bg scene
// that has been through setSceneRunning (the runtime's own resize keeps the
// load-time ratio, so a window grown past the budget would exceed it).
let resizeTimer: ReturnType<typeof setTimeout> | undefined;
function onWindowResize() {
  clearTimeout(resizeTimer);
  // After the runtime's own debounced resize has applied the new size.
  resizeTimer = setTimeout(() => {
    for (const [el, kind] of tracked) {
      if (!el.isConnected) { tracked.delete(el); continue; }
      const app = (el as SplineViewerEl)._spline;
      if (app) applyQuality(app, kind);
    }
  }, 400);
}
function track(el: HTMLElement, kind: SceneKind) {
  if (tracked.size === 0 && typeof window !== 'undefined') window.addEventListener('resize', onWindowResize);
  tracked.set(el, kind);
}

// Pause/resume a <spline-viewer>'s render loop via the viewer's internal
// runtime (`_spline`, not public API — no-op before it has loaded). The
// viewer's own visibility handling doesn't stop it: it keeps rendering at
// full rate at opacity:0 and when scrolled fully off-screen.
//
// Pausing only detaches the loop (setAnimationLoop(null)); it must NOT go
// through the runtime's stop(). stop() also calls _eventManager.pause(),
// and a Transition action's pause() drops its in-flight tweens and pending
// startTimeout — while play() only resume()s, never re-firing the Start
// event (its Transitions are runMode "Once"). A pause that landed mid-Start
// left that scene's looping motion frozen for good while it kept rendering
// (reproduced 2026-10-14: the hero figure's objects stopped moving after 4
// quick scroll-away/back cycles, prod and local alike). Any pause can land
// mid-Start — scrolling off the hero, the outgoing theme after a toggle,
// the preloaded theme 50ms after its load. With the loop detached, nothing
// renders or costs GPU, and the events/tweens are untouched.
//
// play() first re-syncs a runtime that an older stop() left `_isPaused`
// (it re-arms the loop and resumes events); the loop is then set
// explicitly either way, so a pause can't be lost to the runtime arming its
// loop after load. _lastTime is cleared on resume: the runtime's dt is
// unclamped, so the first frame would otherwise jump every animation
// forward by the whole pause.
// Also installs the frame-rate cap (see capSceneFps) and, for a bg scene,
// the resolution budget (see capSceneResolution) at the current quality
// level. `kind: 'hero'` leaves the resolution alone: HeroSection sets the
// figure's pixel ratio itself (from the same budget — scenePixelBudget) and
// a second writer here would undo it on every resume.
export function setSceneRunning(el: HTMLElement | null, running: boolean, kind: SceneKind = 'bg') {
  const app = (el as SplineViewerEl | null)?._spline;
  if (!el || !app) return;
  capSceneFps(app);
  applyQuality(app, kind);
  track(el, kind);
  app.play?.();
  if (running && app.__loopPaused) app._lastTime = undefined;
  app.__loopPaused = !running;
  app._renderer?.setAnimationLoop?.(running ? app.render ?? null : null);
}
