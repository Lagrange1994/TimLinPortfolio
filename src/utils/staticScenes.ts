import { useSyncExternalStore } from 'react';

// "Static scenes": a desktop/tablet visitor whose GPU can't run the Spline
// scenes gets the phones' approach instead — still images of the hero
// figure and the background — inside the normal desktop layout (panel,
// notches, glow all unchanged).
//
// The verdict is <html data-static-scenes="<reason>">. Two writers:
//   - index.html's inline tl-static-scenes script, before anything loads:
//     no usable WebGL2, a software renderer, an older Intel HD/UHD iGPU, a
//     dual-core / 2 GB machine, or this same GPU already failed here
//     before (STATIC_SCENES_KEY). Decided that early so such a visitor never
//     downloads the viewer runtime or the .splinecode files at all.
//   - fallBackToStaticScenes() below, at runtime: the quality governor
//     (sceneQualityGovernor.ts) ran the scenes at the lowest quality level
//     and the page still couldn't hold 30 fps.
// `?scenes=3d` / `?scenes=static` on the URL force either way (testing);
// a forced 3d also disables the runtime fallback.
//
// Phones (<768px) always use the images; that check stays a one-shot width
// read in each component, as before — this module is only the desktop
// verdict.

export const STATIC_SCENES_ATTR = 'data-static-scenes';
// localStorage: the GPU renderer string the runtime fallback was taken on.
// Keyed by renderer, not a plain flag, so a visitor who later moves the
// browser to a discrete GPU (or another machine profile) gets 3D again.
// -v2: v1 entries could be false verdicts from a covered (throttled) window;
// index.html drops them. Keep the two in sync.
export const STATIC_SCENES_KEY = 'tl-static-scenes-v2';

type ScenesWindow = Window & { __tlGpuRenderer?: string; __tlScenesForced?: boolean };

const listeners = new Set<() => void>();

export function staticScenesOn(): boolean {
  return typeof document !== 'undefined' && document.documentElement.hasAttribute(STATIC_SCENES_ATTR);
}

export function onStaticScenesChange(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

// Re-renders the caller when the runtime fallback flips the verdict.
export function useStaticScenes(): boolean {
  return useSyncExternalStore(onStaticScenesChange, staticScenesOn, () => false);
}

// A real GPU name rather than a masked one (Brave reports just "Brave"):
// a give-up is only remembered for these, or one slow visit would pin every
// GPU the browser ever runs on to the images. Same pattern as index.html's
// tl-static-scenes probe.
export const GPU_NAME_RE = /angle|nvidia|geforce|quadro|amd|radeon|intel|apple|mali|adreno|powervr|qualcomm|mesa/i;

// Switches a running page from the Spline scenes to the images and
// remembers it for this GPU. No-op if already static or forced to 3D. Not
// remembered on the dev server: unminified code runs the scenes slower than
// production, so its give-ups say nothing about the GPU.
export function fallBackToStaticScenes(reason = 'slow') {
  const w = window as ScenesWindow;
  if (staticScenesOn() || w.__tlScenesForced) return;
  document.documentElement.setAttribute(STATIC_SCENES_ATTR, reason);
  if (w.__tlGpuRenderer && GPU_NAME_RE.test(w.__tlGpuRenderer) && import.meta.env.MODE !== 'development') {
    try { localStorage.setItem(STATIC_SCENES_KEY, w.__tlGpuRenderer); } catch { /* storage blocked */ }
  }
  listeners.forEach(cb => cb());
}
