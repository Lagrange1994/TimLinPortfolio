import { SCENE_QUALITY_MAX, anySceneRunning, getSceneQuality, setSceneQuality } from './splineRunning';

// Steps the Spline scenes down a quality level (see SCENE_QUALITY_LEVELS)
// when this GPU demonstrably can't keep up, and never otherwise. The signal
// is the page's own frame pacing: a GPU-bound page gets its animation frames
// late, so the median interval between them is the frame rate the visitor
// is actually seeing.

// How much frame time one verdict is based on.
export const GOVERNOR_WINDOW_MS = 2000;
// Median slower than 50 fps = not keeping up → one level down. Was 25ms
// (40 fps): on Iris Xe the light theme settled at ~23ms (~43 fps) on level
// 1 — full-resolution, 60 fps background — and never stepped down, while
// level 2 is what gets it near 60. 20ms still leaves a 60 Hz display
// (16.7ms) and its jitter well clear, and a 50 Hz one exactly at the line.
export const GOVERNOR_SLOW_MS = 20;
// Median slower than 20 fps = nowhere near → two levels at once, so a weak
// GPU doesn't sit through three measurement rounds at a slideshow rate.
export const GOVERNOR_VERY_SLOW_MS = 50;
// Still slower than 30 fps with every scene on the lowest level = this GPU
// can't run them at all → onGiveUp (App: swap the scenes for still images,
// see staticScenes.ts). Looser than GOVERNOR_SLOW_MS on purpose: the
// lowest level at 35–50 fps still beats a picture.
export const GOVERNOR_GIVE_UP_MS = 1000 / 30;
// After a step (or at start), let the resized buffers / entrance settle
// before measuring again.
export const GOVERNOR_SETTLE_MS = 1200;
// A gap this long is a stall (tab switch, scene load, shader compile), not a
// frame rate — it restarts the window instead of counting.
const STALL_MS = 500;

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[sorted.length >> 1];
}

// Returns a stop function. Does nothing until 'hero-ready': frames behind
// the loading screen say how long the scenes take to load, not how they run.
// Once on the lowest level it takes one more measurement there, calls
// onGiveUp if even that is too slow, and stops either way.
export function startSceneQualityGovernor(onGiveUp?: () => void) {
  if (typeof requestAnimationFrame !== 'function') return () => {};
  let raf = 0;
  let stopped = false;
  let last = 0;
  let quietUntil = 0;
  let frames: number[] = [];
  let elapsed = 0;

  const reset = (now: number, settleMs = 0) => {
    frames = [];
    elapsed = 0;
    last = now;
    quietUntil = Math.max(quietUntil, now + settleMs);
  };

  const tick = (now: number) => {
    if (stopped) return;
    raf = requestAnimationFrame(tick);
    const dt = now - last;
    last = now;
    // Only frames a running scene had a part in, on a visible, focused page,
    // count. visibilityState alone isn't enough: a window that's covered by
    // another app (or a background pane) stays 'visible' while the browser
    // throttles its frames to well under 30 fps — that once pinned an RTX
    // 4070 to the static images for good.
    if (now < quietUntil || dt > STALL_MS || document.visibilityState !== 'visible' || !document.hasFocus() || !anySceneRunning()) {
      reset(now);
      return;
    }
    frames.push(dt);
    elapsed += dt;
    if (elapsed < GOVERNOR_WINDOW_MS) return;
    const typical = median(frames);
    reset(now);
    if (getSceneQuality() >= SCENE_QUALITY_MAX) {
      stop();
      if (typical > GOVERNOR_GIVE_UP_MS) onGiveUp?.();
      return;
    }
    if (typical <= GOVERNOR_SLOW_MS) return;
    setSceneQuality(getSceneQuality() + (typical > GOVERNOR_VERY_SLOW_MS ? 2 : 1));
    // Nothing left to measure on the lowest level unless there's a fallback.
    if (getSceneQuality() >= SCENE_QUALITY_MAX && !onGiveUp) { stop(); return; }
    quietUntil = now + GOVERNOR_SETTLE_MS;
  };

  const start = () => {
    // Already on the lowest level (restored for this tab): only the
    // give-up measurement is left, if there is a fallback to give up to.
    if (stopped || (getSceneQuality() >= SCENE_QUALITY_MAX && !onGiveUp)) return;
    const now = performance.now();
    reset(now, GOVERNOR_SETTLE_MS);
    raf = requestAnimationFrame(tick);
  };

  function stop() {
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('hero-ready', start);
  }

  if (document.body.classList.contains('hero-ready')) start();
  else window.addEventListener('hero-ready', start, { once: true });
  return stop;
}
