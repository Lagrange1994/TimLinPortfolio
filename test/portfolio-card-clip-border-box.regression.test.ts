import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// Portfolio cards' squircle clip-path is recomputed by a ResizeObserver.
// clip-path: path() is laid out in the card's BORDER box, but the observer
// used entry.contentRect (content box) — the path came out smaller than
// the card by the border width on each side, pinned top-left, so the photo
// was cut on the right/bottom while a glass rim showed on the left/top,
// and the 16px-radius border broke up against the 44px squircle corners.
describe('portfolio card clip-path uses the border box', () => {
  const tsx = fs.readFileSync(path.join(ROOT, 'src/components/PortfolioSection.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/portfolio.css'), 'utf8');

  it('sizes the path from borderBoxSize, not contentRect', () => {
    expect(tsx).toMatch(/entry\.borderBoxSize/);
    expect(tsx).not.toMatch(/=\s*entry\.contentRect/);
  });

  it('observes the border box', () => {
    expect(tsx).toMatch(/ro\.observe\(c,\s*\{\s*box:\s*'border-box'\s*\}\)/);
  });

  it('photo tiles carry no border to mismatch the clip', () => {
    expect(css).toMatch(/\.project-card,\s*\.grid-card\s*\{\s*border:\s*0;/);
  });
});
