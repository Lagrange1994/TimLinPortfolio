import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { notchPath, notchRingMaskUrl } from '../src/utils/notchPath';

// View All grid cards: a bottom-right notch round a ↗ button, like every
// other card's action.
const tsx = fs.readFileSync(path.resolve(__dirname, '../src/components/PortfolioSection.tsx'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, '../src/styles/portfolio.css'), 'utf8');
const opts = { nw: 56, nh: 56, r: 48, nr: 24, nf: 34, side: 'right' as const };

describe('grid card notch', () => {
  it('the ring mask is the outline with the inset outline cut out, both closed', () => {
    const url = notchRingMaskUrl(600, 400, opts, 2);
    const svg = decodeURIComponent(url.slice('url("data:image/svg+xml,'.length, -2));
    const d = svg.match(/ d="([^"]+)"/)![1];
    expect(d.startsWith(notchPath(600, 400, opts))).toBe(true);
    expect(d.match(/M /g)).toHaveLength(2);
    expect(d.match(/Z/g)).toHaveLength(2);
    expect(svg).toContain('fill-rule="evenodd"');
    // the inset outline stays inside the card box
    const inner = d.slice(d.lastIndexOf('M '));
    const nums = inner.match(/-?\d+\.\d+/g)!.map(Number);
    expect(Math.min(...nums)).toBeGreaterThanOrEqual(2);
    expect(Math.max(...nums.filter((_, i) => i % 2 === 0))).toBeLessThanOrEqual(598);
  });

  it('grid cards cut the notch round a 44px ↗ with the shared sizes', () => {
    expect(tsx).toContain('const GRID_GO_SIZE = 44;');
    expect(tsx).toContain("const gridNotch = { nw: GRID_GO_SIZE + NOTCH_GAP, nh: GRID_GO_SIZE + NOTCH_GAP, r: CARD_CORNER_RADIUS, nr: NOTCH_TURN, nf: GRID_GO_SIZE / 2 + NOTCH_GAP, side: 'right' as const };");
    expect(tsx).toContain("isGrid ? notchPath(width, height, gridNotch) : squircleRectPath(width, height, CARD_CORNER_RADIUS)");
    expect(tsx).toContain("notchRingMaskUrl(width, height, gridNotch, 2)");
    // the ↗ sits outside the clipped card, the same link out of the tab order
    expect(tsx).toMatch(/\{card\}\s*\{\/\*[\s\S]*?\*\/\}\s*<a className="grid-card-go" href=\{p\.link\} tabIndex=\{-1\} aria-hidden="true" onClick=\{remember\}>/);
    expect(css).toMatch(/\.grid-card-go \{[^}]*right: 0;\s*bottom: 0;[^}]*width: 44px;\s*height: 44px;/);
    expect(css).toContain('.grid-card .project-overlay { padding-right: calc(44px + var(--notch-gap) + 12px); }');
  });
});
