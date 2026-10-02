import { render, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  usePauseOffscreenAnimations,
  OFFSCREEN_PAUSED_CLASS,
} from '../src/utils/usePauseOffscreenAnimations';

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let ioCb: IOCallback | null = null;
let observed: Element[] = [];
let disconnected = 0;

class FakeIO {
  constructor(cb: IOCallback) { ioCb = cb; }
  observe(el: Element) { observed.push(el); }
  unobserve() {}
  disconnect() { disconnected += 1; }
}

function Harness() {
  usePauseOffscreenAnimations();
  return (
    <>
      <section id="home" data-testid="hero" />
      <section className="section" data-testid="s" />
      <section className="pc-card" data-testid="nested" />
    </>
  );
}

const origIO = globalThis.IntersectionObserver;

describe('usePauseOffscreenAnimations', () => {
  beforeEach(() => {
    ioCb = null; observed = []; disconnected = 0;
    (globalThis as any).IntersectionObserver = FakeIO;
  });
  afterEach(() => { (globalThis as any).IntersectionObserver = origIO; });

  it('observes the hero and every section.section, not other sections', () => {
    const { getByTestId } = render(<Harness />);
    expect(observed).toContain(getByTestId('hero'));
    expect(observed).toContain(getByTestId('s'));
    expect(observed).not.toContain(getByTestId('nested'));
  });

  it('pauses when a section leaves range and resumes when it comes back', () => {
    const { getByTestId } = render(<Harness />);
    const s = getByTestId('s');
    act(() => ioCb!([{ target: s, isIntersecting: false }]));
    expect(s.classList.contains(OFFSCREEN_PAUSED_CLASS)).toBe(true);
    act(() => ioCb!([{ target: s, isIntersecting: true }]));
    expect(s.classList.contains(OFFSCREEN_PAUSED_CLASS)).toBe(false);
  });

  it('disconnects and clears the class on unmount', () => {
    const { getByTestId, unmount } = render(<Harness />);
    const s = getByTestId('s');
    act(() => ioCb!([{ target: s, isIntersecting: false }]));
    unmount();
    expect(disconnected).toBe(1);
    expect(s.classList.contains(OFFSCREEN_PAUSED_CLASS)).toBe(false);
  });

  it('re-observes the current sections when a lazy unit mounts or unmounts', () => {
    const { container } = render(<Harness />);
    const before = observed.length;
    // A LazyUnit swapped in a fresh section element.
    const fresh = document.createElement('section');
    fresh.className = 'section';
    container.appendChild(fresh);
    act(() => { window.dispatchEvent(new Event('lazy-unit-change')); });
    expect(observed.length).toBeGreaterThan(before);
    expect(observed).toContain(fresh);
    // The old observer was disconnected before re-observing.
    expect(disconnected).toBeGreaterThanOrEqual(1);
  });

  it('does nothing without IntersectionObserver', () => {
    delete (globalThis as any).IntersectionObserver;
    expect(() => render(<Harness />)).not.toThrow();
  });
});

describe('off-screen pause wiring', () => {
  const read = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');

  it('the stylesheet pauses animations inside a paused section', () => {
    expect(read('src/styles/portfolio.css')).toMatch(
      /\.is-offscreen-paused \*::after\s*\{\s*animation-play-state:\s*paused !important;/,
    );
  });

  it('App mounts the hook', () => {
    expect(read('src/App.tsx')).toMatch(/usePauseOffscreenAnimations\(\);/);
  });

  // Regression: the hero tag scroller and the skills marquees kept their rAF
  // loops running for the whole visit, even scrolled out of view.
  it.each(['src/components/HeroSection.tsx', 'src/components/SkillsSection.tsx'])(
    '%s marquee tick stops when off screen',
    file => {
      const src = read(file);
      expect(src).toMatch(/function tick\(ts: number\) \{\s*if \(!visible\) \{ running = false; return; \}/);
      expect(src).toMatch(/visible = entry\.isIntersecting;\s*if \(visible\) start\(\);/);
    },
  );
});
