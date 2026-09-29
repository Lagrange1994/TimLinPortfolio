import { describe, it, expect, afterEach } from 'vitest';
import get16by9FloorVh from '../src/projects/shared/mobileVisualHeight.js';

// The resizable mobile preview panel (project_02/04-11) used to start — and
// refuse to drag shorter than — a flat 35 (vh) magic number, unrelated to
// the device's actual proportions. get16by9FloorVh() replaces that with a
// value computed from the real viewport, so the un-dragged panel is exactly
// 16:9 (matching project_01/03's plain `aspect-video` box) on any device.
describe('get16by9FloorVh', () => {
  const setViewport = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
  };
  const original = { width: window.innerWidth, height: window.innerHeight };
  afterEach(() => setViewport(original.width, original.height));

  it('returns the vh value whose height, at the viewport width, is exactly 16:9', () => {
    setViewport(375, 812);
    const vh = get16by9FloorVh();
    const heightPx = (vh / 100) * 812;
    expect(heightPx / 375).toBeCloseTo(9 / 16, 5);
  });

  it('scales with viewport width relative to height (taller device -> smaller vh)', () => {
    setViewport(390, 844);
    const narrow = get16by9FloorVh();
    setViewport(390, 1200);
    const tall = get16by9FloorVh();
    expect(tall).toBeLessThan(narrow);
  });

  it('has a typeof-window guard for non-DOM environments', () => {
    const source = get16by9FloorVh.toString();
    expect(source).toMatch(/typeof window === .undefined./);
    expect(source).toMatch(/return 35/);
  });
});
