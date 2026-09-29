// Regression: the other theme's background Spline scene is preloaded after
// 'hero-ready' (so a toggle doesn't parse/compile a scene mid-transition),
// but it used to be parked at opacity:0 still RENDERING at full rate — a
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

// Mirrors the real runtime: stop() is a no-op once paused; play() re-arms.
function mockRuntime(el: HTMLElement) {
  const app = {
    running: true,
    _isPaused: false,
    play: vi.fn(function (this: any) { if (this._isPaused) { this._isPaused = false; this.running = true; } }),
    stop: vi.fn(function (this: any) { if (!this._isPaused) { this._isPaused = true; this.running = false; } }),
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

  it('loads only the active theme until hero-ready, then preloads the other', async () => {
    const { dark, light } = await mount();
    expect(dark.getAttribute('url')).toBe('./models/bg_scene.splinecode');
    expect(light.getAttribute('url')).toBeNull();
    await heroReady();
    expect(light.getAttribute('url')).toBe('./models/bg_scene_w.splinecode');
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
    act(() => { vi.advanceTimersByTime(1000); }); // any early pause attempt → _isPaused=true
    // The runtime's load then arms its loop regardless of _isPaused:
    lightApp.running = true;
    loadComplete(light);
    act(() => { vi.advanceTimersByTime(50); });
    expect(lightApp.running).toBe(false);
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

  it('toggle before the preload: keeps the old scene shown until the new one loads', async () => {
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
    act(() => { vi.advanceTimersByTime(50); });
    expect(darkApp.running).toBe(true);

    act(() => ioCbs.forEach(cb => cb([{ isIntersecting: false }])));
    expect(darkApp.running).toBe(false); // immediately, not after the 4s url drop

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
