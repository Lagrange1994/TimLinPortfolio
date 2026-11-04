import { describe, it, expect } from 'vitest';
import {
  fitCodeCard, jumpToCoding, ZOOM_ORIGIN_X, FIT_MAX, FIT_SIDE, FIT_BOTTOM,
  LOOP_MS, CODING_START, CODING_END,
} from '../src/utils/mcpCodeFocus';

// Where a point of the zoom layer lands after scale s about its origin and
// translate (x, y): the same maths the browser does for .mcp-zoom.
const land = (zoom: { x: number; y: number; w: number }, fit: { scale: number; x: number; y: number }, px: number, py: number) => {
  const ox = zoom.x + zoom.w * ZOOM_ORIGIN_X;
  return [ox + fit.scale * (px - ox) + fit.x, zoom.y + fit.scale * (py - zoom.y) + fit.y];
};

describe('fitCodeCard: VS Code close-up fits the frame whole', () => {
  // 1440×900, measured on the dev build
  const frame = { w: 1440, h: 900 };
  const zoom = { x: 48, y: 303, w: 1344, h: 434 };
  const card = { x: 728, y: 303, w: 664, h: 434 };
  const top = 108;

  it('scales as far as the height allows and centres the card in the free area', () => {
    const fit = fitCodeCard(frame, zoom, card, top);
    expect(fit.scale).toBeCloseTo((900 - top - FIT_BOTTOM) / 434);
    const [l, t] = land(zoom, fit, card.x, card.y);
    const [r, b] = land(zoom, fit, card.x + card.w, card.y + card.h);
    expect((l + r) / 2).toBeCloseTo(720);
    expect(t).toBeCloseTo(top);
    expect(b).toBeCloseTo(900 - FIT_BOTTOM);
    expect(l).toBeGreaterThanOrEqual(FIT_SIDE);
    expect(r).toBeLessThanOrEqual(1440 - FIT_SIDE);
  });

  it('is limited by the width on a wide, short card', () => {
    const fit = fitCodeCard({ w: 1000, h: 2000 }, zoom, { ...card, w: 600, h: 200 }, top);
    expect(fit.scale).toBeCloseTo(Math.min(FIT_MAX, (1000 - FIT_SIDE * 2) / 600));
  });

  it('never goes past the opening shot, nor below the full grid', () => {
    expect(fitCodeCard({ w: 4000, h: 4000 }, zoom, card, top).scale).toBe(FIT_MAX);
    expect(fitCodeCard({ w: 300, h: 300 }, zoom, card, top).scale).toBe(1);
  });
});

describe('jumpToCoding: the close-up shows Claude writing Card.tsx', () => {
  const anim = (currentTime: number | null, duration: number, delay = 0) => ({
    currentTime,
    effect: { getTiming: () => ({ duration, delay }) } as unknown as AnimationEffect,
  });

  it('moves every 20s loop forward by the same amount, onto the coding part', () => {
    const a = anim(LOOP_MS * 2 + 1000, LOOP_MS);
    const line = anim(LOOP_MS * 2 + 1000, LOOP_MS, 480);
    expect(jumpToCoding([a, line])).toBe(true);
    expect((a.currentTime as number) % LOOP_MS).toBeCloseTo(CODING_START * LOOP_MS);
    expect((a.currentTime as number) - line.currentTime!).toBe(0);
    expect(a.currentTime).toBeGreaterThan(LOOP_MS * 2 + 1000); // forward only
  });

  it('wraps past the loop end when it is already beyond the coding part', () => {
    const a = anim(LOOP_MS * 0.9, LOOP_MS);
    jumpToCoding([a]);
    expect(a.currentTime).toBeCloseTo(LOOP_MS + CODING_START * LOOP_MS);
  });

  it('leaves the loop alone while it is already coding', () => {
    const a = anim(LOOP_MS * (CODING_START + CODING_END) / 2, LOOP_MS);
    const before = a.currentTime;
    expect(jumpToCoding([a])).toBe(false);
    expect(a.currentTime).toBe(before);
  });

  it('ignores the scroll-driven zoom and the spinner', () => {
    const spin = anim(500, 800);
    const scroll = anim(null, 'auto' as unknown as number);
    const a = anim(1000, LOOP_MS);
    jumpToCoding([spin, scroll, a]);
    expect(spin.currentTime).toBe(500);
    expect(scroll.currentTime).toBeNull();
    expect(jumpToCoding([spin, scroll])).toBe(false);
  });
});
