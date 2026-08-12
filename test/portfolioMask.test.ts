import { describe, it, expect } from 'vitest';
import { computeMobileWallHeight } from '../src/utils/portfolioMask';

describe('computeMobileWallHeight', () => {
  it('returns the natural content height when it fits under the cap', () => {
    expect(computeMobileWallHeight(500, 800)).toBe(500);
  });

  it('clamps to the cap when content is taller than available space', () => {
    expect(computeMobileWallHeight(1000, 800)).toBe(800);
  });

  it('returns the exact value when content height equals the cap', () => {
    expect(computeMobileWallHeight(800, 800)).toBe(800);
  });

  it('never returns a negative height when the cap itself is negative', () => {
    expect(computeMobileWallHeight(500, -50)).toBe(0);
  });
});
