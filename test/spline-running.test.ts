// Spline's runtime renders on every display refresh (120/144 fps on
// high-refresh monitors) — capSceneFps throttles its loop to 60, and
// setSceneRunning pauses/resumes it (installing the cap on the way).
import { describe, it, expect, vi } from 'vitest';
import { capSceneFps, capSceneResolution, setSceneRunning, throttleSceneShadows } from '../src/utils/splineRunning';

// Logical (CSS) size + pixel ratio, like the runtime's WebGLRenderer.
function mockRendererApp(w: number, h: number, pr: number) {
  const r = {
    pr,
    getPixelRatio: () => r.pr,
    setPixelRatio: vi.fn((v: number) => { r.pr = v; }),
    getSize: (t: any) => t.set(w, h),
  };
  const app: any = { _renderer: r, _resize: vi.fn(), requestRender: vi.fn() };
  return { app, r };
}

describe('capSceneResolution — drawing buffer ≤ 2560×1440 pixels', () => {
  it('lowers a HiDPI full-screen scene to the budget and force-resizes', () => {
    const { app, r } = mockRendererApp(1920, 1080, 2); // 3840×2160 buffer
    capSceneResolution(app);
    expect(r.pr).toBeCloseTo(4 / 3);
    expect(1920 * r.pr * 1080 * r.pr).toBeCloseTo(2560 * 1440, -1);
    expect(app._resize).toHaveBeenCalledWith(true);
  });

  it('leaves a scene already within budget alone', () => {
    const { app, r } = mockRendererApp(1920, 1080, 1);
    capSceneResolution(app);
    expect(r.setPixelRatio).not.toHaveBeenCalled();
    const hero = mockRendererApp(800, 800, 1.8); // 1440×1440
    capSceneResolution(hero.app);
    expect(hero.r.setPixelRatio).not.toHaveBeenCalled();
  });

  it('never raises the ratio past what the runtime picked, even after the viewport shrinks', () => {
    const big = mockRendererApp(1920, 1080, 2);
    capSceneResolution(big.app);
    // Same app, now small enough that the budget alone would allow > 2.
    big.r.getSize = (t: any) => t.set(800, 600);
    capSceneResolution(big.app);
    expect(big.r.pr).toBe(2);
  });

  it('is a no-op before the renderer exists or at zero size', () => {
    expect(() => capSceneResolution({} as any)).not.toThrow();
    const { app, r } = mockRendererApp(0, 0, 2);
    capSceneResolution(app);
    expect(r.setPixelRatio).not.toHaveBeenCalled();
  });
});

function mockApp(paused = false) {
  const renders: number[] = [];
  const app: any = {
    _isPaused: paused,
    render: (t: number) => { renders.push(t); },
    _renderer: { setAnimationLoop: vi.fn() },
    play: vi.fn(function (this: any) { if (this._isPaused) { this._isPaused = false; this._renderer.setAnimationLoop(this.render); } }),
    stop: vi.fn(function (this: any) { if (!this._isPaused) { this._isPaused = true; this._renderer.setAnimationLoop(null); } }),
  };
  return { app, renders };
}

// Drive the (wrapped) loop callback with vsync timestamps for 1 second.
function drive(app: any, hz: number) {
  for (let i = 0; i < hz; i++) app.render((i * 1000) / hz);
}

describe('capSceneFps', () => {
  it('renders every frame on a 60 Hz display', () => {
    const { app, renders } = mockApp();
    capSceneFps(app);
    drive(app, 60);
    expect(renders.length).toBe(60);
  });

  it('throttles a 144 Hz display to ~60 fps', () => {
    const { app, renders } = mockApp();
    capSceneFps(app);
    drive(app, 144);
    expect(renders.length).toBeGreaterThanOrEqual(55);
    expect(renders.length).toBeLessThanOrEqual(61);
  });

  it('halves a 120 Hz display exactly', () => {
    const { app, renders } = mockApp();
    capSceneFps(app);
    drive(app, 120);
    expect(renders.length).toBe(60);
  });

  it('re-arms a running loop with the wrapper, but not a paused one', () => {
    const running = mockApp(false);
    capSceneFps(running.app);
    expect(running.app._renderer.setAnimationLoop).toHaveBeenCalledWith(running.app.render);

    const paused = mockApp(true);
    capSceneFps(paused.app);
    expect(paused.app._renderer.setAnimationLoop).not.toHaveBeenCalled();
  });

  it('is idempotent — wrapping twice would halve the rate again', () => {
    const { app, renders } = mockApp();
    capSceneFps(app);
    const wrapped = app.render;
    capSceneFps(app);
    expect(app.render).toBe(wrapped);
    drive(app, 60);
    expect(renders.length).toBe(60);
  });
});

describe('throttleSceneShadows', () => {
  // Like three's WebGLShadowMap: render() draws only when enabled and
  // (autoUpdate || needsUpdate), then clears needsUpdate.
  function mockShadowApp() {
    const shadowMap: any = {
      enabled: true, autoUpdate: false, needsUpdate: false, drawn: 0,
      render(lights: unknown[]) {
        if (!this.enabled || (!this.autoUpdate && !this.needsUpdate) || !lights.length) return;
        this.drawn++;
        this.needsUpdate = false;
      },
    };
    return { app: { _renderer: { shadowMap } } as any, shadowMap };
  }
  // One runtime frame, as observed live: the opaque pass forces a refresh,
  // later passes render with the flags back off, and one render has
  // autoUpdate on but no shadow-casting lights.
  function frames(shadowMap: any, n: number) {
    for (let i = 0; i < n; i++) {
      shadowMap.needsUpdate = true; shadowMap.autoUpdate = true;
      shadowMap.render([{}]);
      shadowMap.needsUpdate = false; shadowMap.autoUpdate = false;
      shadowMap.render([{}]);
      shadowMap.autoUpdate = true;
      shadowMap.render([]);
      shadowMap.autoUpdate = false;
    }
    return shadowMap.drawn;
  }

  it('unthrottled, the shadow map is redrawn every frame', () => {
    expect(frames(mockShadowApp().shadowMap, 60)).toBe(60);
  });

  it('lets only every 2nd refresh through, starting with the first', () => {
    const { app, shadowMap } = mockShadowApp();
    throttleSceneShadows(app);
    expect(frames(shadowMap, 1)).toBe(1);
    expect(frames(shadowMap, 59)).toBe(30);
  });

  it('leaves a disabled shadow map alone', () => {
    const { app, shadowMap } = mockShadowApp();
    shadowMap.enabled = false;
    throttleSceneShadows(app);
    expect(frames(shadowMap, 10)).toBe(0);
  });

  it('is idempotent and a no-op before the renderer exists', () => {
    const { app, shadowMap } = mockShadowApp();
    throttleSceneShadows(app);
    const wrapped = shadowMap.render;
    throttleSceneShadows(app);
    expect(shadowMap.render).toBe(wrapped);
    expect(() => throttleSceneShadows({} as any)).not.toThrow();
  });
});

describe('setSceneRunning', () => {
  it('pauses and resumes, keeping the capped loop across resume', () => {
    const { app } = mockApp();
    const el = document.createElement('div') as any;
    el._spline = app;
    setSceneRunning(el, false);
    expect(app._isPaused).toBe(true);
    setSceneRunning(el, true);
    expect(app._isPaused).toBe(false);
    expect(app._renderer.setAnimationLoop).toHaveBeenLastCalledWith(app.render);
    expect(app.__fpsCap).toBe(60);
  });

  it('is a no-op before the viewer has loaded', () => {
    expect(() => setSceneRunning(document.createElement('div'), false)).not.toThrow();
    expect(() => setSceneRunning(null, true)).not.toThrow();
  });
});
