import { describe, it, expect } from 'vitest';
import { notchPath } from '../src/utils/notchPath';

// The notched card outline is one closed path (no stitched mask layers):
// the clip and the border stroke share it.
const pts = (d: string) => [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map(m => Number(m[0]));

describe('notchPath', () => {
  const opts = { nw: 120, nh: 50, r: 24, nr: 18, nf: 33 };

  it('is a single closed path, rounded at every corner', () => {
    for (const side of ['left', 'right'] as const) {
      const d = notchPath(400, 200, { ...opts, side });
      expect(d.startsWith('M ')).toBe(true);
      expect(d.endsWith(' Z')).toBe(true);
      expect((d.match(/M /g) ?? []).length).toBe(1);
      // six corners, each traced as a curve (13 points per corner)
      expect((d.match(/[ML] /g) ?? []).length).toBe(6 * 13);
    }
  });

  it('draws the card corners as squircles (or round), the notch inner corner round', () => {
    // mid-point of the top-left corner (r = 24): a squircle sits closer to
    // the vertex than a circle (24·(1 - 0.5^0.25) ≈ 3.82 vs 24·(1 - 0.5^0.5) ≈ 7.03)
    const mid = (shape: 'squircle' | 'round') => {
      const a = pts(notchPath(400, 200, { ...opts, side: 'left', shape }));
      return [a[12], a[13]];
    };
    const [sx, sy] = mid('squircle');
    const [rx, ry] = mid('round');
    expect(sx).toBeCloseTo(24 * (1 - Math.SQRT1_2 ** 0.5), 1);
    expect(sy).toBeCloseTo(sx, 1);
    expect(rx).toBeCloseTo(24 * (1 - Math.SQRT1_2), 1);
    expect(ry).toBeCloseTo(rx, 1);
  });

  it('cuts the notch from the requested bottom corner', () => {
    const left = pts(notchPath(400, 200, { ...opts, side: 'left' }));
    const right = pts(notchPath(400, 200, { ...opts, side: 'right' }));
    // the notch's straight side runs at x = nw on the left, w - nw on the
    // right, below the notch top (h - nh = 150)
    const side = (a: number[], x: number) => a.some((v, i) => i % 2 === 0 && Math.abs(v - x) < 0.01 && a[i + 1] > 150 && a[i + 1] < 200);
    expect(side(left, 120)).toBe(true);
    expect(side(right, 280)).toBe(true);
    // stays inside the card's box
    for (const a of [left, right]) {
      for (let i = 0; i < a.length; i += 2) {
        expect(a[i]).toBeGreaterThanOrEqual(0);
        expect(a[i]).toBeLessThanOrEqual(400);
        expect(a[i + 1]).toBeGreaterThanOrEqual(0);
        expect(a[i + 1]).toBeLessThanOrEqual(200);
      }
    }
  });
});
