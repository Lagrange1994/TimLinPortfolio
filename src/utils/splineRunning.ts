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
    renderSplineScene?: (...args: unknown[]) => unknown;
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
  __taaIsolated?: boolean;
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
  let prevTime: number | undefined;
  let frameMs = 0; // running estimate of the display's frame interval
  app.render = (time: number) => {
    if (prevTime !== undefined) {
      const d = time - prevTime;
      if (d > 0 && d < 100) frameMs = frameMs ? frameMs * 0.9 + d * 0.1 : d;
    }
    prevTime = time;
    // Read per frame: the quality governor lowers a bg scene's cap later on.
    const interval = 1000 / (app.__fpsCap || maxFps);
    const elapsed = time - last;
    // Half a display frame of slack (≥1ms): a flat 1ms skipped early ticks on
    // 120Hz screens with wobbly timestamps (16.7/25/8ms stutter). Half a frame
    // can't double-render or skip a due one.
    const slack = Math.max(1, frameMs / 2);
    if (elapsed < interval - slack) return;
    // Advance on the interval grid (not to `time`) so a 144 Hz display
    // averages exactly maxFps instead of drifting down to every 3rd frame,
    // but never let the grid fall more than the slack behind `time` (a late
    // tick would otherwise make the next gap short); resync after a long
    // gap (resume, tab switch) instead of bursting.
    last = elapsed > interval * 2 ? time : Math.max(last + interval, time - slack);
    render(time);
  };
  app.__fpsCap = maxFps;
  // Re-arm a loop that's already running so it picks up the wrapper now.
  if (!app._isPaused && !app.__loopPaused) app._renderer?.setAnimationLoop?.(app.render);
}

// Freezes a bg scene's TAA jitter. The bg always animates, so TAA history is
// rejected and the raw sub-pixel jitter shows — the tile wall shakes once the
// quality governor lowers bg resolution. frameIndex is a render global shared
// by every scene; this pins it to 0 while the bg renders and restores it, so
// the figure's sequence isn't advanced (per-scene sequences shook more).
// Cost: no TAA on bg edges. Idempotent; no-op without these internals.
type FrameIndexGlobal = { value: number; isRenderGlobal?: boolean };
function findFrameIndexGlobal(root: unknown): FrameIndexGlobal | null {
  const seen = new Set<object>();
  const walk = (o: unknown, depth: number): FrameIndexGlobal | null => {
    if (!o || typeof o !== 'object' || seen.has(o) || depth > 7) return null;
    seen.add(o);
    const fi = (o as { frameIndex?: FrameIndexGlobal }).frameIndex;
    if (fi && typeof fi === 'object' && fi.isRenderGlobal && typeof fi.value === 'number') return fi;
    for (const key of Object.keys(o)) {
      let v: unknown;
      try { v = (o as Record<string, unknown>)[key]; } catch { continue; }
      const found = walk(v, depth + 1);
      if (found) return found;
    }
    return null;
  };
  return walk(root, 0);
}
export function freezeSceneTaaJitter(app: SplineApp) {
  const renderer = app._renderer;
  if (!renderer?.renderSplineScene || app.__taaIsolated) return;
  const frameIndex = findFrameIndexGlobal(app);
  if (!frameIndex) return;
  app.__taaIsolated = true;
  const renderSplineScene = renderer.renderSplineScene;
  renderer.renderSplineScene = function (this: unknown, ...args: unknown[]) {
    const shared = frameIndex.value;
    frameIndex.value = 0;
    try {
      return renderSplineScene.apply(this, args);
    } finally {
      frameIndex.value = shared;
    }
  };
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

// Quality levels for GPUs that can't keep up. Chromium on Windows renders
// WebGL on a hybrid laptop's integrated GPU regardless of powerPreference
// (Iris Xe + HiDPI: ~15 fps at full quality). Level 0 is the start;
// sceneQualityGovernor.ts steps down only after sustained slow frames. Each
// step lowers drawing-buffer budgets; from level 2 the bg also runs at 30 fps.
// Any level >0 freezes the dark panel glow (html[data-scene-quality]) — its
// per-frame re-blur alone halved fps.
//
// The figure is fill-bound: full on-screen resolution on levels 0–1, 1000²
// on 2–3 (≈95 fps vs 70 at 1200² on Iris Xe; lower looked visibly soft).
export type SceneKind = 'bg' | 'hero';
export const SCENE_QUALITY_LEVELS = [
  { bgPixels: SPLINE_MAX_PIXELS, heroPixels: SPLINE_MAX_PIXELS, bgFps: SPLINE_MAX_FPS },
  { bgPixels: 1920 * 1080, heroPixels: SPLINE_MAX_PIXELS, bgFps: SPLINE_MAX_FPS },
  { bgPixels: 1600 * 900, heroPixels: 1000 * 1000, bgFps: 30 },
  { bgPixels: 1280 * 720, heroPixels: 1000 * 1000, bgFps: 30 },
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

// Pause/resume a <spline-viewer>'s render loop via the internal runtime
// (`_spline`; no-op before load). The viewer's own visibility handling keeps
// rendering at opacity:0 and off-screen.
//
// Pause only detaches the loop (setAnimationLoop(null)) — NEVER the runtime's
// stop(): its _eventManager.pause() drops in-flight Start tweens and play()
// never re-fires Start (runMode "Once"), freezing the scene's looping motion.
//
// play() re-syncs a runtime an older stop() left `_isPaused`, then sets the
// loop explicitly. _lastTime is cleared on resume (dt is unclamped).
// Also installs the fps cap (capSceneFps) and, for bg scenes, frozen TAA
// jitter and the resolution budget (capSceneResolution). `kind: 'hero'` skips
// resolution: HeroSection sets the figure's pixel ratio itself.
export function setSceneRunning(el: HTMLElement | null, running: boolean, kind: SceneKind = 'bg') {
  const app = (el as SplineViewerEl | null)?._spline;
  if (!el || !app) return;
  capSceneFps(app);
  if (kind === 'bg') freezeSceneTaaJitter(app);
  applyQuality(app, kind);
  track(el, kind);
  app.play?.();
  if (running && app.__loopPaused) app._lastTime = undefined;
  app.__loopPaused = !running;
  app._renderer?.setAnimationLoop?.(running ? app.render ?? null : null);
}
