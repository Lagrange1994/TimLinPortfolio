// Regression: the other theme's background Spline scene is preloaded (so a
// toggle doesn't parse/compile a scene mid-transition), but it used to be
// parked at opacity:0 still RENDERING at full rate — a
// Spline viewer doesn't stop for opacity. Measured ~41k draw calls/s on its
// own canvas. Only the shown scene (plus the outgoing one during the
// crossfade) may run; the preloaded one must be paused.
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import BeamsBackground from '../src/components/BeamsBackground';

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let ioCbs: IOCallback[] = [];
class FakeIO {
  constructor(cb: IOCallback) { ioCbs.push(cb); }
  observe() {}
  unobserve() {}
  disconnect() {}
}
const origIO = globalThis.IntersectionObserver;

// Mirrors the real runtime: `running` = its render loop is armed. stop() is a
// no-op once paused and also pauses the event manager (which is what froze
// Start animations); play() re-arms both.
function mockRuntime(el: HTMLElement) {
  const app: any = {
    running: true,
    eventsPaused: false,
    _isPaused: false,
    render: () => {},
    _renderer: { setAnimationLoop: (cb: unknown) => { app.running = !!cb; } },
    play: vi.fn(function (this: any) { if (this._isPaused) { this._isPaused = false; this.eventsPaused = false; this.running = true; } }),
    stop: vi.fn(function (this: any) { if (!this._isPaused) { this._isPaused = true; this.eventsPaused = true; this.running = false; } }),
  };
  (el as any)._spline = app;
  return app;
}

function loadComplete(el: HTMLElement) {
  (el as any)._loaded = true;
  act(() => { el.dispatchEvent(new CustomEvent('load-complete')); });
}

async function setTheme(theme: 'dark' | 'light') {
  await act(async () => {
    if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
  });
}

async function heroReady() {
  await act(async () => {
    document.body.classList.add('hero-ready');
    window.dispatchEvent(new Event('hero-ready'));
  });
}

describe('background Spline scenes — preload the other theme, but paused', () => {
  let home: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    ioCbs = [];
    (globalThis as any).IntersectionObserver = FakeIO;
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('hero-ready');
    home = document.createElement('section');
    home.id = 'home';
    document.body.appendChild(home);
  });

  afterEach(() => {
    vi.useRealTimers();
    (globalThis as any).IntersectionObserver = origIO;
    home.remove();
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('hero-ready');
  });

  async function mount() {
    render(<BeamsBackground />);
    await act(async () => {}); // heroEl state → portal mounts the viewers
    act(() => ioCbs.forEach(cb => cb([{ isIntersecting: true }]))); // #home in view
    const dark = document.getElementById('spline-bg-dark')!;
    const light = document.getElementById('spline-bg-light')!;
    return { dark, light };
  }

  // Regression: the other theme's scene used to start loading AT
  // 'hero-ready' — its parse + shader compiles then froze the hero entrance
  // on a first visit (1.3s of dropped frames in the first 2.8s, measured).
  // Both load from the start now, behind the loading screen.
  it('loads both themes from the start, not at hero-ready', async () => {
    const { dark, light } = await mount();
    expect(dark.getAttribute('url')).toBe('./models/bg_scene.splinecode');
    expect(light.getAttribute('url')).toBe('./models/bg_scene_w.splinecode');
    expect(document.body.classList.contains('hero-ready')).toBe(false);
  });

  // Regression: both urls used to be dropped once the hero had been off
  // screen for 4s. Unloading a viewer disposes the tween engine that every
  // Spline scene on the page shares, which killed the hero figure's looping
  // Start transitions for good — the figure stood still after returning from
  // the page bottom or a project page. Off the hero they are only paused.
  it('keeps both scenes loaded however long the hero is off screen — paused, never unloaded', async () => {
    const { dark, light } = await mount();
    const darkApp = mockRuntime(dark);
    loadComplete(dark);
    await heroReady();
    act(() => { vi.advanceTimersByTime(50); });
    act(() => ioCbs.forEach(cb => cb([{ isIntersecting: false }])));
    act(() => { vi.advanceTimersByTime(60000); });
    expect(dark.getAttribute('url')).toBe('./models/bg_scene.splinecode');
    expect(light.getAttribute('url')).toBe('./models/bg_scene_w.splinecode');
    expect(darkApp.running).toBe(false);
    act(() => ioCbs.forEach(cb => cb([{ isIntersecting: true }])));
    expect(dark.getAttribute('url')).toBe('./models/bg_scene.splinecode');
    expect(darkApp.running).toBe(true);
  });

  it('never removes a scene url anywhere in the component', async () => {
    const src = (await import('node:fs')).readFileSync('src/components/BeamsBackground.tsx', 'utf8');
    expect(src).toMatch(/setAttribute\('url', '\.\/models\/bg_scene\.splinecode'\)/);
    expect(src).not.toMatch(/removeAttribute\(\s*['"]url['"]\s*\)/);
  });

  it('the preloaded scene is paused once it has loaded — and stays paused', async () => {
    const { dark, light } = await mount();
    const darkApp = mockRuntime(dark);
    loadComplete(dark);
    await heroReady();
    const lightApp = mockRuntime(light);
    loadComplete(light);
    act(() => { vi.advanceTimersByTime(50); });
    expect(lightApp.running).toBe(false);
    expect(darkApp.running).toBe(true);
    act(() => { vi.advanceTimersByTime(10000); });
    expect(lightApp.running).toBe(false);
  });

  it('pauses for real even if stop() was already called before the scene loaded', async () => {
    const { dark, light } = await mount();
    mockRuntime(dark);
    loadComplete(dark);
    await heroReady();
    const lightApp = mockRuntime(light);
    lightApp._isPaused = true; // an early stop() (older build / the viewer itself)
    // The runtime's load then arms its loop regardless of _isPaused:
    lightApp.running = true;
    loadComplete(light);
    act(() => { vi.advanceTimersByTime(50); });
    expect(lightApp.running).toBe(false);
  });

  // Regression: the shown scene used to render continuously under the opaque
  // loading screen from its load until hero-ready, fighting the hero
  // figure's load (which comes last) for the GPU — the cold-load stalls.
  it('holds even the shown scene paused behind the loading screen, resumes it at hero-ready', async () => {
    const { dark } = await mount();
    const darkApp = mockRuntime(dark);
    loadComplete(dark);
    act(() => { vi.advanceTimersByTime(50); });
    expect(darkApp.running).toBe(false);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(darkApp.running).toBe(false);
    await heroReady();
    expect(darkApp.running).toBe(true);
    expect(darkApp.stop).not.toHaveBeenCalled();
  });

  it('toggle with the other scene preloaded: swaps at once, pauses the outgoing one after the crossfade', async () => {
    const { dark, light } = await mount();
    const darkApp = mockRuntime(dark);
    loadComplete(dark);
    await heroReady();
    const lightApp = mockRuntime(light);
    loadComplete(light);
    act(() => { vi.advanceTimersByTime(50); });

    await setTheme('light');
    expect(light.classList.contains('is-active')).toBe(true);
    expect(dark.classList.contains('is-active')).toBe(false);
    expect(lightApp.running).toBe(true);
    expect(darkApp.running).toBe(true); // still fading out
    act(() => { vi.advanceTimersByTime(800); });
    expect(darkApp.running).toBe(false);
    expect(dark.getAttribute('url')).not.toBeNull(); // kept loaded for the next toggle

    await setTheme('dark');
    expect(darkApp.running).toBe(true);
    act(() => { vi.advanceTimersByTime(800); });
    expect(lightApp.running).toBe(false);
  });

  it('toggle before the other scene has loaded: keeps the old scene shown until it does', async () => {
    const { dark, light } = await mount();
    mockRuntime(dark);
    loadComplete(dark);

    await setTheme('light');
    expect(light.getAttribute('url')).not.toBeNull();
    expect(dark.classList.contains('is-active')).toBe(true);
    loadComplete(light);
    expect(light.classList.contains('is-active')).toBe(true);
  });

  it('pauses the shown scene as soon as the hero scrolls off, resumes when it returns', async () => {
    const { dark } = await mount();
    const darkApp = mockRuntime(dark);
    loadComplete(dark);
    await heroReady(); // after the loading screen (see the hold test above)
    act(() => { vi.advanceTimersByTime(50); });
    expect(darkApp.running).toBe(true);

    act(() => ioCbs.forEach(cb => cb([{ isIntersecting: false }])));
    expect(darkApp.running).toBe(false); // immediately

    act(() => ioCbs.forEach(cb => cb([{ isIntersecting: true }])));
    expect(darkApp.running).toBe(true);
  });

  it('swaps anyway if the new scene never finishes loading', async () => {
    const { light } = await mount();
    await setTheme('light');
    act(() => { vi.advanceTimersByTime(8000); });
    expect(light.classList.contains('is-active')).toBe(true);
  });
});
