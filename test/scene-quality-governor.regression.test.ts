// Regression: on a hybrid-GPU laptop Chromium runs WebGL on the integrated
// GPU whatever the page asks for. On a HiDPI screen the hero figure
// (1600×1600 buffer) plus the background scene (2560×1440) then ran at ~15
// fps — interacting with the figure stuttered and the GPU sat at 100%.
// The scenes now have quality levels (splineRunning.ts) and a governor
// (sceneQualityGovernor.ts) that steps down only after measuring sustained
// slow frames, so a GPU that copes keeps full quality.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  SCENE_QUALITY_LEVELS, SCENE_QUALITY_MAX, anySceneRunning, getSceneQuality, onSceneQualityChange,
  scenePixelBudget, setSceneQuality, setSceneRunning,
} from '../src/utils/splineRunning';
import {
  GOVERNOR_SETTLE_MS, GOVERNOR_WINDOW_MS, startSceneQualityGovernor,
} from '../src/utils/sceneQualityGovernor';

// A viewer element with a runtime like the real one: logical size + pixel
// ratio on the renderer, a render loop that play()/stop() arm and clear.
function mockViewer(w = 1920, h = 1080, pr = 2) {
  const r = {
    pr,
    getPixelRatio: () => r.pr,
    setPixelRatio: vi.fn((v: number) => { r.pr = v; }),
    getSize: (t: any) => t.set(w, h),
    setAnimationLoop: vi.fn(),
  };
  const app: any = {
    _isPaused: false,
    _renderer: r,
    _resize: vi.fn(),
    requestRender: vi.fn(),
    render: vi.fn(),
    play() { if (this._isPaused) { this._isPaused = false; r.setAnimationLoop(this.render); } },
    stop() { if (!this._isPaused) { this._isPaused = true; r.setAnimationLoop(null); } },
  };
  const el = document.createElement('div') as any;
  el._spline = app;
  document.body.appendChild(el);
  return { el, app, r };
}
const pixels = (r: { pr: number }, w = 1920, h = 1080) => w * r.pr * h * r.pr;

describe('scene quality levels', () => {
  afterEach(() => {
    setSceneQuality(0);
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('every level is cheaper than the one before (background only), and level 0 is the old budget', () => {
    expect(SCENE_QUALITY_LEVELS[0]).toEqual({ bgPixels: 2560 * 1440, heroPixels: 2560 * 1440, bgFps: 60 });
    for (let i = 1; i <= SCENE_QUALITY_MAX; i++) {
      expect(SCENE_QUALITY_LEVELS[i].bgPixels).toBeLessThan(SCENE_QUALITY_LEVELS[i - 1].bgPixels);
      // The figure never steps down faster than the bg, and stays sharp (see below).
      expect(SCENE_QUALITY_LEVELS[i].heroPixels).toBeLessThanOrEqual(SCENE_QUALITY_LEVELS[i - 1].heroPixels);
      expect(SCENE_QUALITY_LEVELS[i].bgFps).toBeLessThanOrEqual(SCENE_QUALITY_LEVELS[i - 1].bgFps);
    }
  });

  it('lowering the level re-budgets a running bg scene at once', () => {
    const { el, app, r } = mockViewer();
    setSceneRunning(el, true);
    expect(pixels(r)).toBeCloseTo(2560 * 1440, -1);
    app._resize.mockClear();

    setSceneQuality(1);
    expect(pixels(r)).toBeCloseTo(1920 * 1080, -1);
    expect(app._resize).toHaveBeenCalledWith(true);
    expect(app.__fpsCap).toBe(60);

    setSceneQuality(2);
    expect(pixels(r)).toBeCloseTo(1600 * 900, -1);
    expect(app.__fpsCap).toBe(30);
  });

  it('the bg frame-rate cap follows the level on the already-wrapped loop', () => {
    const { el, app } = mockViewer();
    const inner = app.render;
    setSceneRunning(el, true);
    let t = 100000;
    // One second of 60 Hz vsyncs, a long gap after the previous second.
    const count = () => { inner.mockClear(); t += 5000; for (let i = 0; i < 60; i++) app.render(t + (i * 1000) / 60); return inner.mock.calls.length; };
    expect(count()).toBe(60);
    setSceneQuality(2);
    expect(count()).toBe(30);
  });

  it('a scene loaded after the level dropped starts on that level', () => {
    setSceneQuality(3);
    const { el, app, r } = mockViewer();
    setSceneRunning(el, true);
    expect(pixels(r)).toBeCloseTo(1280 * 720, -1);
    expect(app.__fpsCap).toBe(30);
  });

  it("leaves the hero figure's resolution to HeroSection, and tells it", () => {
    const { el, app, r } = mockViewer(800, 800, 2);
    const onChange = vi.fn();
    const off = onSceneQualityChange(onChange);
    setSceneRunning(el, true, 'hero');
    setSceneQuality(2);
    expect(r.setPixelRatio).not.toHaveBeenCalled();
    expect(app.__fpsCap).toBe(60); // the figure is what's being interacted with
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(scenePixelBudget('hero')).toBe(1000 * 1000);
    off();
    setSceneQuality(3);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('clamps the level and remembers it for the tab', () => {
    setSceneQuality(99);
    expect(getSceneQuality()).toBe(SCENE_QUALITY_MAX);
    expect(sessionStorage.getItem('tl-scene-quality')).toBe(String(SCENE_QUALITY_MAX));
    setSceneQuality(-5);
    expect(getSceneQuality()).toBe(0);
    setSceneQuality(NaN);
    expect(getSceneQuality()).toBe(0);
  });

  it('a reload in the same tab starts on the remembered level', async () => {
    sessionStorage.setItem('tl-scene-quality', '2');
    vi.resetModules();
    const fresh = await import('../src/utils/splineRunning');
    expect(fresh.getSceneQuality()).toBe(2);
    sessionStorage.setItem('tl-scene-quality', 'garbage');
    vi.resetModules();
    expect((await import('../src/utils/splineRunning')).getSceneQuality()).toBe(0);
  });

  it('anySceneRunning: only loaded, connected, unpaused scenes count', () => {
    expect(anySceneRunning()).toBe(false);
    const { el } = mockViewer();
    setSceneRunning(el, false);
    expect(anySceneRunning()).toBe(false);
    setSceneRunning(el, true);
    expect(anySceneRunning()).toBe(true);
    el.remove();
    expect(anySceneRunning()).toBe(false);
  });

  // Regression, both ways. Level 3 drew the 800px figure at 800² on a 1.5x
  // screen (1200² on-screen) and upscaled it — visibly soft — so no level may
  // go below 1.25x per side (1000², the chosen floor). And keeping a 2x
  // screen's full 1600² on levels 2–3 was too heavy for Iris Xe (the figure
  // is fill-bound: 1200² ≈ 70 fps, 1000² ≈ 95), so those levels cap it there.
  it('the figure budget never drops below 1000², and only levels 0–1 cover 2x', () => {
    for (let i = 0; i <= SCENE_QUALITY_MAX; i++) {
      setSceneQuality(i);
      const perSide = Math.sqrt(scenePixelBudget('hero')) / 800;
      expect(perSide).toBeGreaterThanOrEqual(1.25);
      if (i <= 1) expect(perSide).toBeGreaterThanOrEqual(2);
      else expect(perSide).toBe(1.25);
    }
  });

  it('HeroSection caps the figure ratio by the hero budget and re-syncs on a level change', () => {
    const tsx = readFileSync(resolve(__dirname, '../src/components/HeroSection.tsx'), 'utf8');
    expect(tsx).toMatch(/const budgetRatio = Math\.sqrt\(scenePixelBudget\('hero'\)\) \/ HERO_SCENE_SIZE;/);
    expect(tsx).toMatch(/Math\.max\(0\.5, \(window\.devicePixelRatio \|\| 1\) \* scale\), budgetRatio\)/);
    expect(tsx).toMatch(/const offQuality = onSceneQualityChange\(sync\);/);
    expect(tsx).toMatch(/offQuality\(\);/);
    expect(tsx).toMatch(/setSceneRunning\(heroSpline, visible, 'hero'\)/);
    expect(tsx).not.toMatch(/setSceneRunning\(heroSpline, visible\)/);
  });
});

describe('scene quality governor', () => {
  let now: number;
  let rafCbs: Map<number, FrameRequestCallback>;
  let rafId: number;
  let stop: () => void;
  const origRaf = globalThis.requestAnimationFrame;
  const origCancel = globalThis.cancelAnimationFrame;

  // Advance `ms` of page time at a steady frame interval.
  function run(ms: number, frameMs: number) {
    const end = now + ms;
    while (now < end) {
      now += frameMs;
      const cbs = [...rafCbs.values()];
      rafCbs.clear();
      cbs.forEach(cb => cb(now));
    }
  }
  function heroReady() {
    document.body.classList.add('hero-ready');
    window.dispatchEvent(new Event('hero-ready'));
  }
  function runningScene() {
    const v = mockViewer();
    setSceneRunning(v.el, true);
    return v;
  }

  beforeEach(() => {
    now = 1000;
    rafCbs = new Map();
    rafId = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => { rafCbs.set(++rafId, cb); return rafId; };
    globalThis.cancelAnimationFrame = (id: number) => { rafCbs.delete(id); };
    stop = () => {};
  });

  afterEach(() => {
    stop();
    vi.restoreAllMocks();
    globalThis.requestAnimationFrame = origRaf;
    globalThis.cancelAnimationFrame = origCancel;
    setSceneQuality(0);
    sessionStorage.clear();
    document.body.classList.remove('hero-ready');
    document.body.innerHTML = '';
  });

  it('does nothing behind the loading screen', () => {
    runningScene();
    stop = startSceneQualityGovernor();
    expect(rafCbs.size).toBe(0);
    run(10000, 70);
    expect(getSceneQuality()).toBe(0);
  });

  it('a GPU that keeps up never leaves full quality', () => {
    runningScene();
    stop = startSceneQualityGovernor();
    heroReady();
    run(30000, 1000 / 60);
    expect(getSceneQuality()).toBe(0);
    run(10000, 1000 / 240); // high-refresh display
    expect(getSceneQuality()).toBe(0);
  });

  it('sustained ~30 fps steps down one level per measurement window', () => {
    runningScene();
    stop = startSceneQualityGovernor();
    heroReady();
    run(GOVERNOR_SETTLE_MS, 33);
    expect(getSceneQuality()).toBe(0); // still settling after the reveal
    run(GOVERNOR_WINDOW_MS + 100, 33);
    expect(getSceneQuality()).toBe(1);
    run(GOVERNOR_SETTLE_MS + GOVERNOR_WINDOW_MS + 100, 33);
    expect(getSceneQuality()).toBe(2);
  });

  // Regression: ~43 fps (23ms) sat under the old 25ms line, so the light
  // theme on Iris Xe stayed on level 1 instead of reaching level 2's ~60 fps.
  it('a ~43 fps page steps down; 50–60 Hz pacing does not', () => {
    runningScene();
    stop = startSceneQualityGovernor();
    heroReady();
    run(GOVERNOR_SETTLE_MS + GOVERNOR_WINDOW_MS * 3, 20); // 50 Hz display
    expect(getSceneQuality()).toBe(0);
    run(GOVERNOR_WINDOW_MS + 100, 23);
    expect(getSceneQuality()).toBe(1);
  });

  it('a slideshow frame rate (under 20 fps) drops two levels at once', () => {
    runningScene();
    stop = startSceneQualityGovernor();
    heroReady();
    run(GOVERNOR_SETTLE_MS + GOVERNOR_WINDOW_MS + 200, 67);
    expect(getSceneQuality()).toBe(2);
  });

  it('stops for good at the lowest level', () => {
    runningScene();
    stop = startSceneQualityGovernor();
    heroReady();
    run(20000, 67);
    expect(getSceneQuality()).toBe(SCENE_QUALITY_MAX);
    expect(rafCbs.size).toBe(0);
  });

  it('stops stepping once the lower level is fast enough', () => {
    runningScene();
    stop = startSceneQualityGovernor();
    heroReady();
    run(GOVERNOR_SETTLE_MS + GOVERNOR_WINDOW_MS + 100, 33);
    expect(getSceneQuality()).toBe(1);
    run(20000, 1000 / 60);
    expect(getSceneQuality()).toBe(1);
  });

  it('a few long freezes among smooth frames (shader compiles) are not a slow GPU', () => {
    runningScene();
    stop = startSceneQualityGovernor();
    heroReady();
    for (let i = 0; i < 12; i++) { run(600, 1000 / 60); run(300, 300); }
    expect(getSceneQuality()).toBe(0);
  });

  it('a stall (tab switch, scene load) restarts the window instead of counting', () => {
    runningScene();
    stop = startSceneQualityGovernor();
    heroReady();
    run(GOVERNOR_SETTLE_MS, 33);
    for (let i = 0; i < 10; i++) { run(GOVERNOR_WINDOW_MS - 400, 33); run(900, 900); }
    expect(getSceneQuality()).toBe(0);
  });

  it('slow frames with every scene paused (hero scrolled away) are not counted', () => {
    const { el } = runningScene();
    setSceneRunning(el, false);
    stop = startSceneQualityGovernor();
    heroReady();
    run(15000, 67);
    expect(getSceneQuality()).toBe(0);
  });

  it('does not count frames while the page is hidden', () => {
    runningScene();
    const vis = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    stop = startSceneQualityGovernor();
    heroReady();
    run(15000, 67);
    expect(getSceneQuality()).toBe(0);
    vis.mockRestore();
  });

  it('does not start at all when the tab is already on the lowest level', () => {
    setSceneQuality(SCENE_QUALITY_MAX);
    stop = startSceneQualityGovernor();
    heroReady();
    expect(rafCbs.size).toBe(0);
  });

  it('stop() cancels the loop and the hero-ready listener', () => {
    runningScene();
    const stopNow = startSceneQualityGovernor();
    stopNow();
    heroReady();
    expect(rafCbs.size).toBe(0);
    run(10000, 67);
    expect(getSceneQuality()).toBe(0);
  });

  it('App starts it on desktop widths only', () => {
    const app = readFileSync(resolve(__dirname, '../src/App.tsx'), 'utf8');
    expect(app).toMatch(/if \(window\.innerWidth < 768\) return;\s*return startSceneQualityGovernor\(\);/);
  });
});
