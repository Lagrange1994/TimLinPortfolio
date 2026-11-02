import { createElement } from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Phone width, so ProcessCarousel pages one card at a time.
vi.hoisted(() => {
  (window as unknown as { AnimationEvent: typeof Event }).AnimationEvent ??= class extends Event {};
  window.matchMedia = ((q: string) => ({
    matches: q === '(max-width: 767px)',
    media: q,
    onchange: null,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

import { ProcessCarousel } from '../src/components/SkillsSection';
import BorderGlow from '../src/components/BorderGlow';

// Phone swipes on the Design Process cards stuttered: a tap left the card
// in a sticky :hover (colour crossfade, repainting radar ring, lift, hover
// shadow over the ‹ ›) just as the drag began, and BorderGlow read the
// card's rect and wrote four CSS variables on every finger move.

const read = (p: string) => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8').replace(/\r\n/g, '\n');

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('Design Process cards on touch screens', () => {
  it('marks the card in view as current, following the slide', () => {
    const cards = [0, 1, 2].map(n => createElement('div', { key: n }, `card ${n}`));
    const { container } = render(createElement(ProcessCarousel, { cards, variant: 'process' }));
    const current = () => Array.from(container.querySelectorAll('.process-swipe-slot'), s => s.classList.contains('is-current'));
    expect(current()).toEqual([true, false, false]);
    const track = container.querySelector<HTMLElement>('.process-column-grid--inhouse')!;
    act(() => { track.dispatchEvent(new Event('rise-settled', { bubbles: true })); });
    act(() => { vi.advanceTimersByTime(1500); }); // autoplay armed
    act(() => { vi.advanceTimersByTime(6500); }); // fallback advance
    expect(current()).toEqual([false, true, false]);
  });

  it('BorderGlow follows a mouse but not a finger', () => {
    const { container } = render(createElement(BorderGlow, null, 'x'));
    const card = container.querySelector<HTMLElement>('.border-glow-card')!;
    const move = (pointerType: string, clientX: number) => {
      const ev = new Event('pointermove', { bubbles: true });
      Object.assign(ev, { pointerType, clientX, clientY: 5 });
      act(() => { card.dispatchEvent(ev); });
    };
    move('touch', 40);
    expect(card.style.getPropertyValue('--sc-x')).toBe('');
    move('mouse', 30);
    expect(card.style.getPropertyValue('--sc-x')).toBe('30px');
  });

  it('ignores sticky :hover in the carousels and colours the current card instead', () => {
    const css = read('src/styles/portfolio.css');
    const block = css.slice(css.indexOf('    @media (hover: none) {\n      .process-scroll-wrap'));
    const body = block.slice(0, block.indexOf('\n    }\n') + 6);
    expect(body).toMatch(/\.process-scroll-wrap :is\(\.process-card, \.tech-item\):hover \{\s*animation: none;\s*transform: none;/);
    expect(body).toMatch(/\.process-scroll-wrap \.process-card:hover > \.card-hover-shadow/);
    expect(body).toMatch(/\.process-scroll-wrap \.border-glow-card:hover \.process-card-bg-img--color \{ opacity: 0; \}/);
    expect(body).toMatch(/\.process-swipe-slot\.is-current \.border-glow-card \.process-card-bg-img--color \{ opacity: 1; \}/);
    expect(body).toMatch(/\.process-swipe-slot\.is-current \.border-glow-card \.process-card-bg-img--light \{ opacity: 1; \}/);
  });
});
