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
export function startSceneQualityGovernor() {
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
    // Only frames a running scene had a part in, on a visible page, count.
    if (now < quietUntil || dt > STALL_MS || document.visibilityState !== 'visible' || !anySceneRunning()) {
      reset(now);
      return;
    }
    frames.push(dt);
    elapsed += dt;
    if (elapsed < GOVERNOR_WINDOW_MS) return;
    const typical = median(frames);
    reset(now);
    if (typical <= GOVERNOR_SLOW_MS) return;
    setSceneQuality(getSceneQuality() + (typical > GOVERNOR_VERY_SLOW_MS ? 2 : 1));
    if (getSceneQuality() >= SCENE_QUALITY_MAX) { stop(); return; }
    quietUntil = now + GOVERNOR_SETTLE_MS;
  };

  const start = () => {
    if (stopped || getSceneQuality() >= SCENE_QUALITY_MAX) return;
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
