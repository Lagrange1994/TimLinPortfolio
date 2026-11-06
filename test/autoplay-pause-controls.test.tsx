import { createElement } from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { render, act, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Desktop width (dots, not tabs) unless a test says otherwise.
const mq = vi.hoisted(() => ({ reduce: false, phone: false }));
vi.hoisted(() => {
  (window as unknown as { AnimationEvent: typeof Event }).AnimationEvent ??= class extends Event {};
  // modules read it on import
  window.matchMedia = ((q: string) => ({
    matches: false, media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});
beforeEach(() => {
  window.matchMedia = ((q: string) => ({
    matches: q.includes('reduce') ? mq.reduce : q === '(max-width: 767px)' ? mq.phone : false,
    media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

import { ProcessCarousel } from '../src/components/SkillsSection';

// Auto-moving content can be paused (WCAG 2.2.2): a play/pause button in
// the same round style as the ‹ › paddles, leading that row.
const css = fs.readFileSync(path.resolve(__dirname, '../src/styles/portfolio.css'), 'utf8');

function setupCarousel(tabs = false) {
  const cards = [0, 1, 2, 3, 4].map(n => createElement('div', { key: n }, `card ${n}`));
  const tabProps = tabs ? { tabs: cards.map((_, i) => ({ label: `t${i}`, color: '#000' })) } : {};
  const utils = render(createElement(ProcessCarousel, { cards, ...tabProps }));
  const track = utils.container.querySelector<HTMLElement>('.process-column-grid--inhouse')!;
  act(() => { track.dispatchEvent(new Event('rise-settled', { bubbles: true })); });
  act(() => { vi.advanceTimersByTime(1500); });
  const activeDot = () => [...utils.container.querySelectorAll('.process-swipe-dot')].findIndex(d => d.classList.contains('active'));
  const toggle = () => utils.container.querySelector<HTMLButtonElement>('.process-swipe-nav .autoplay-toggle')!;
  return { ...utils, activeDot, toggle };
}

beforeEach(() => { vi.useFakeTimers(); mq.reduce = false; mq.phone = false; });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('ProcessCarousel play/pause', () => {
  it('leads the ‹ › row, styled as one of the paddles; the dots stay plain', () => {
    const { container, toggle } = setupCarousel();
    const nav = container.querySelector('.process-swipe-nav')!;
    expect(nav.firstElementChild).toBe(toggle());
    expect(toggle().classList.contains('process-swipe-arrow')).toBe(true);
    expect(toggle().getAttribute('aria-label')).toBe('Pause animation');
    expect(container.querySelector('.process-swipe-dots button')).toBeNull();
  });

  it('pause freezes the countdown and stops the fallback timer; play resumes', () => {
    const { container, activeDot, toggle } = setupCarousel();
    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-label')).toBe('Play animation');
    expect(container.querySelector('.process-swipe-dot-fill')!.classList.contains('is-paused')).toBe(true);
    act(() => { vi.advanceTimersByTime(20000); });
    expect(activeDot()).toBe(0);
    fireEvent.click(toggle());
    expect(container.querySelector('.process-swipe-dot-fill')!.classList.contains('is-paused')).toBe(false);
    act(() => { vi.advanceTimersByTime(6500); });
    expect(activeDot()).toBe(1);
  });

  it('phones: a second button right after the dots pill, sharing the same state', () => {
    const { container, toggle } = setupCarousel();
    const controls = container.querySelector('.process-swipe-controls')!;
    const phone = controls.querySelector<HTMLButtonElement>(':scope > .autoplay-toggle.process-swipe-toggle--phone')!;
    expect(phone.previousElementSibling!.classList.contains('process-swipe-dots')).toBe(true);
    expect(toggle().classList.contains('process-swipe-toggle--nav')).toBe(true);
    fireEvent.click(phone);
    expect(toggle().getAttribute('aria-label')).toBe('Play animation');
    expect(phone.getAttribute('aria-label')).toBe('Play animation');
    // CSS: hidden off phones; on phones the pill + button centred, no ‹ ›
    expect(css).toMatch(/\.process-swipe-controls > \.process-swipe-toggle--phone \{\s*display: none;/);
  });

  it('tabs mode (Tech Stack on phones) has no button', () => {
    mq.phone = true;
    const { container } = setupCarousel(true);
    expect(container.querySelector('.autoplay-toggle')).toBeNull();
    expect(container.querySelector('.process-tabs-controls')).toBeNull();
  });

  it('no button under reduced motion (nothing plays)', () => {
    mq.reduce = true;
    const { container } = setupCarousel();
    expect(container.querySelector('.autoplay-toggle')).toBeNull();
  });

  it('a paused fill stops in place', () => {
    expect(css).toMatch(/\.process-swipe-dot-fill\.is-paused,\s*\.process-tab-fill\.is-paused \{\s*animation-play-state: paused;/);
  });
});
