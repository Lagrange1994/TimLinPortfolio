import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createElement } from 'react';
import Loader, { LOADER_FORCE_MS, CALM_MAX_WAIT_MS } from '../src/components/Loader';

// The loading screen is static markup in index.html; Loader.tsx only decides
// when to dismiss it. These tests build that markup by hand.
function addStaticLoader() {
  const el = document.createElement('div');
  el.id = 'page-loader';
  el.className = 'loader';
  document.body.appendChild(el);
  return el;
}

function addViewer(id: string, url: string | null = './models/x.splinecode') {
  const el = document.createElement('spline-viewer');
  el.id = id;
  if (url) el.setAttribute('url', url);
  document.body.appendChild(el);
  return el;
}

const loadComplete = (el: HTMLElement) => el.dispatchEvent(new CustomEvent('load-complete'));
const isRevealed = () => document.body.classList.contains('hero-ready');
const mount = () => render(createElement(Loader));

describe('Loader', () => {
  let heroReady: number;
  const onHeroReady = () => { heroReady += 1; };

  beforeEach(() => {
    vi.useFakeTimers();
    heroReady = 0;
    window.addEventListener('hero-ready', onHeroReady);
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    window.removeEventListener('hero-ready', onHeroReady);
    document.body.classList.remove('hero-ready');
    document.body.innerHTML = '';
  });

  it('renders nothing of its own — the loader is the static element', () => {
    addStaticLoader();
    const { container } = mount();
    expect(container.innerHTML).toBe('');
  });

  // Loader stays mounted forever, so anything it schedules must be cleared
  // when loading finishes. An earlier step-cycling setInterval leaked and
  // re-rendered a hidden component every second for the page's lifetime.
  it('with nothing to wait for, dismisses at once and leaves no timer running', () => {
    const loader = addStaticLoader();
    const setIntervalSpy = vi.spyOn(window, 'setInterval');
    mount();
    expect(loader.classList.contains('hidden')).toBe(true);
    expect(isRevealed()).toBe(true);
    expect(heroReady).toBe(1);
    expect(setIntervalSpy).not.toHaveBeenCalled();
    setIntervalSpy.mockRestore();
  });

  it('removes the static loader from the DOM once its fade is over', () => {
    addStaticLoader();
    mount();
    expect(document.getElementById('page-loader')).not.toBeNull();
    vi.advanceTimersByTime(500);
    expect(document.getElementById('page-loader')).toBeNull();
  });

  // Regression: this listened for a native `load` on <spline-viewer>, which
  // the element never fires (its signal is the `load-complete` CustomEvent) —
  // so the loader never waited for the scenes and always exited through the
  // fallback timer, often mid-load.
  it('waits for load-complete from the hero figure AND the active background scene', () => {
    addStaticLoader();
    const hero = addViewer('hero-spline');
    const bg = addViewer('spline-bg-dark');
    mount();
    expect(isRevealed()).toBe(false);

    hero.dispatchEvent(new Event('load'));
    bg.dispatchEvent(new Event('load'));
    vi.advanceTimersByTime(2000);
    expect(isRevealed()).toBe(false); // a native `load` means nothing here

    loadComplete(hero);
    vi.advanceTimersByTime(2000);
    expect(isRevealed()).toBe(false); // background still loading

    loadComplete(bg);
    vi.advanceTimersByTime(CALM_MAX_WAIT_MS);
    expect(isRevealed()).toBe(true);
    expect(heroReady).toBe(1);
  });

  it('finds the background viewer even though it is added after mount (portal)', () => {
    addStaticLoader();
    const hero = addViewer('hero-spline');
    mount();
    loadComplete(hero);
    vi.advanceTimersByTime(300);
    expect(isRevealed()).toBe(false); // bg viewer not in the DOM yet → not ready
    const bg = addViewer('spline-bg-dark');
    loadComplete(bg);
    vi.advanceTimersByTime(CALM_MAX_WAIT_MS);
    expect(isRevealed()).toBe(true);
  });

  it('waits on the light scene, not the dark one, in light theme', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    addStaticLoader();
    const hero = addViewer('hero-spline');
    const light = addViewer('spline-bg-light');
    mount();
    loadComplete(hero);
    vi.advanceTimersByTime(2000);
    expect(isRevealed()).toBe(false);
    loadComplete(light);
    vi.advanceTimersByTime(CALM_MAX_WAIT_MS);
    expect(isRevealed()).toBe(true);
  });

  it('accepts a scene that had already finished loading before mount', () => {
    addStaticLoader();
    const hero = addViewer('hero-spline');
    const bg = addViewer('spline-bg-dark');
    (hero as unknown as { _loaded: boolean })._loaded = true;
    (bg as unknown as { _loaded: boolean })._loaded = true;
    mount();
    vi.advanceTimersByTime(CALM_MAX_WAIT_MS);
    expect(isRevealed()).toBe(true);
  });

  it('does not wait for a background scene whose url was dropped (hero scrolled out of view)', () => {
    addStaticLoader();
    const hero = addViewer('hero-spline');
    addViewer('spline-bg-dark', null);
    mount();
    loadComplete(hero);
    vi.advanceTimersByTime(1000 + CALM_MAX_WAIT_MS);
    expect(isRevealed()).toBe(true);
  });

  it('holds the reveal until the main thread is calm, but never past the cap', () => {
    addStaticLoader();
    const hero = addViewer('hero-spline');
    const bg = addViewer('spline-bg-dark');
    // Every frame is a long hitch: the calm streak can never build up.
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => (
      setTimeout(() => cb(performance.now()), 400) as unknown as number
    ));
    const caf = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => clearTimeout(id));
    mount();
    loadComplete(hero);
    loadComplete(bg);
    vi.advanceTimersByTime(CALM_MAX_WAIT_MS - 100);
    expect(isRevealed()).toBe(false);
    vi.advanceTimersByTime(200);
    expect(isRevealed()).toBe(true);
    raf.mockRestore();
    caf.mockRestore();
  });

  it('reveals as soon as a few smooth frames have gone by', () => {
    addStaticLoader();
    const hero = addViewer('hero-spline');
    const bg = addViewer('spline-bg-dark');
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => (
      setTimeout(() => cb(performance.now()), 16) as unknown as number
    ));
    const caf = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => clearTimeout(id));
    mount();
    loadComplete(hero);
    loadComplete(bg);
    vi.advanceTimersByTime(100);
    expect(isRevealed()).toBe(true);
    raf.mockRestore();
    caf.mockRestore();
  });

  it('reveals anyway after the force timeout if an asset never reports ready', () => {
    addStaticLoader();
    addViewer('hero-spline');
    addViewer('spline-bg-dark');
    mount();
    vi.advanceTimersByTime(LOADER_FORCE_MS - 100);
    expect(isRevealed()).toBe(false);
    vi.advanceTimersByTime(200);
    expect(isRevealed()).toBe(true);
  });

  it('clears its poll, force timer and listeners once dismissed', () => {
    addStaticLoader();
    const hero = addViewer('hero-spline');
    const bg = addViewer('spline-bg-dark');
    const setIntervalSpy = vi.spyOn(window, 'setInterval');
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    mount();
    const pollId = setIntervalSpy.mock.results[0]?.value;
    expect(pollId).toBeDefined();
    loadComplete(hero);
    loadComplete(bg);
    vi.advanceTimersByTime(CALM_MAX_WAIT_MS);
    expect(isRevealed()).toBe(true);
    expect(clearIntervalSpy).toHaveBeenCalledWith(pollId);
    expect(removeSpy).toHaveBeenCalledWith('load-complete', expect.any(Function), true);
    // Nothing left to fire a second hero-ready later.
    vi.advanceTimersByTime(LOADER_FORCE_MS * 2);
    expect(heroReady).toBe(1);
    [setIntervalSpy, clearIntervalSpy, removeSpy].forEach(s => s.mockRestore());
  });

  it('phone: waits only for the active background image', () => {
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
    addStaticLoader();
    const img = document.createElement('img');
    img.className = 'spline-bg-layer is-active';
    let complete = false;
    Object.defineProperty(img, 'complete', { get: () => complete });
    document.body.appendChild(img);
    mount();
    vi.advanceTimersByTime(1000);
    expect(isRevealed()).toBe(false);
    complete = true;
    vi.advanceTimersByTime(300 + CALM_MAX_WAIT_MS);
    expect(isRevealed()).toBe(true);
  });

  it('still fires hero-ready when the static loader element is missing', () => {
    mount();
    expect(isRevealed()).toBe(true);
    expect(heroReady).toBe(1);
  });

  it('a second effect run after dismissal (StrictMode) does not fire hero-ready again', () => {
    addStaticLoader();
    const first = mount();
    expect(heroReady).toBe(1);
    first.unmount();
    mount();
    expect(heroReady).toBe(1);
  });
});
