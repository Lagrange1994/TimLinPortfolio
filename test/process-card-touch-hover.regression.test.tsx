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
  // A colour illustration on the card in view was tried and dropped: the
  // cards read as always coloured. They stay white on touch screens.
  it('does not single out the card in view', () => {
    const cards = [0, 1, 2].map(n => createElement('div', { key: n }, `card ${n}`));
    const { container } = render(createElement(ProcessCarousel, { cards, variant: 'process' }));
    expect(container.querySelectorAll('.process-swipe-slot.is-current')).toHaveLength(0);
    expect(read('src/styles/portfolio.css')).not.toMatch(/is-current \.border-glow-card/);
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

  it('ignores sticky :hover in the carousels and keeps the white illustration', () => {
    const css = read('src/styles/portfolio.css');
    const block = css.slice(css.indexOf('    @media (hover: none) {\n      .process-scroll-wrap'));
    const body = block.slice(0, block.indexOf('\n    }\n') + 6);
    expect(body).toMatch(/\.process-scroll-wrap :is\(\.process-card, \.tech-item\):hover \{\s*animation: none;\s*transform: none;/);
    expect(body).toMatch(/\.process-scroll-wrap \.process-card:hover > \.card-hover-shadow/);
    expect(body).toMatch(/\.process-scroll-wrap \.border-glow-card:hover \.process-card-bg-img--color \{ opacity: 0; \}/);
    expect(body).toMatch(/\.process-scroll-wrap \.border-glow-card:hover \.process-card-bg-img--white \{ opacity: 1; \}/);
    expect(body).toMatch(/\.border-glow-card:hover \.process-card-bg-img--light-white \{ opacity: 1; \}/);
  });
});
