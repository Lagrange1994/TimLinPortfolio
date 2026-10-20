import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// Phones (<768px) used to flatten the Design Process carousel into a 2-col
// grid listing all 12 cards. They now get the same swipe carousel as
// desktop, one card per page at the column's full width (edges aligned with
// the text above, no neighbours peeking in), and the dots + Swipe button.
describe('Design Process is a 1-per-page full-width carousel on phones', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
  const mobileBlock = css.slice(css.indexOf('MOBILE (< 768px)'), css.indexOf('Responsive overrides (must be AFTER'));
  const tsx = fs.readFileSync(path.join(ROOT, 'src/components/SkillsSection.tsx'), 'utf8').replace(/\r\n/g, '\n');

  it('ProcessCarousel pages by 1 below 768px and 3 above', () => {
    expect(tsx).toMatch(/const PROCESS_VISIBLE = 3;/);
    expect(tsx).toMatch(/const PROCESS_VISIBLE_MOBILE = 1;/);
    expect(tsx).toMatch(/const PROCESS_MOBILE_QUERY = '\(max-width: 767px\)';/);
    expect(tsx).toMatch(/return isMobile \? PROCESS_VISIBLE_MOBILE : PROCESS_VISIBLE;/);
    expect(tsx).toMatch(/const maxOffset = Math\.max\(0, cards\.length - visible\);/);
  });

  it('clamps the offset when the breakpoint changes maxOffset', () => {
    expect(tsx).toMatch(/const offset = Math\.min\(rawOffset, maxOffset\);/);
  });

  it('the mobile track is a horizontal flex strip, not a grid', () => {
    const track = mobileBlock.match(/\.process-column-grid--inhouse \{[^}]*\}/)?.[0];
    expect(track).toMatch(/display:\s*flex;/);
    expect(track).toMatch(/flex-wrap:\s*nowrap;/);
    expect(track).toMatch(/touch-action:\s*pan-y;/);
    // 16px side padding cancels the wrap's -16px margins: the card spans
    // the column edge to edge.
    expect(track).toMatch(/padding:\s*12px 16px;/);
    // Wider than the 16px side room, so no neighbour shows at rest.
    expect(track).toMatch(/gap:\s*32px;/);
    const slot = mobileBlock.match(/\.process-column-grid--inhouse \.process-swipe-slot \{[^}]*\}/)?.[0];
    expect(slot).toMatch(/flex:\s*0 0 100%;/);
  });

  // Phones used to turn the cards portrait (square image block above a
  // separate text block, smaller type, one shared pinned height). With one
  // full-width card per page they now keep the desktop square card: the
  // illustration fills it and the text sits on it behind the scrim.
  it('keeps the desktop square card on phones (no portrait overrides)', () => {
    expect(mobileBlock).not.toMatch(/\.process-card--has-img\.border-glow-card \{[^}]*aspect-ratio:\s*auto/);
    expect(mobileBlock).not.toMatch(/\.process-card--has-img \.border-glow-bg-slot \{/);
    expect(mobileBlock).not.toMatch(/\.process-card--has-img \.border-glow-inner \{/);
    expect(mobileBlock).not.toMatch(/\.process-name \{\s*font-size:\s*11px;/);
    expect(mobileBlock).not.toMatch(/--process-card-mobile-h/);
    expect(tsx).not.toMatch(/--process-card-mobile-h/);
    const base = css.match(/\.process-card--has-img\.border-glow-card \{\s*aspect-ratio:\s*1 \/ 1;\s*\}/);
    expect(base).toBeTruthy();
  });

  // Regression: tapping a card on a phone showed its hover glow cut off by
  // the wrap's clip. Every carousel card shadow now has spread = -blur, so
  // it stays inside the card's width and only falls downward.
  it('reshapes the carousel card shadows to fall only downward (spread = -blur)', () => {
    const rules = [
      /\.process-scroll-wrap \.process-card--has-img\.border-glow-card \{[^}]*\}/,
      /\.process-scroll-wrap \.process-card > \.card-hover-shadow,\s*\.process-scroll-wrap--tech \.tech-item-wrap::after \{[^}]*\}/,
      /\.process-scroll-wrap--tech \.tech-item \{\s*box-shadow[^}]*\}/,
      /:root\[data-theme="light"\] \.process-scroll-wrap \.process-card\.border-glow-card,[^{]*\{[^}]*\}/,
      /:root\[data-theme="light"\] \.process-scroll-wrap \.process-card:hover,[^{]*\{[^}]*\}/,
    ];
    for (const re of rules) {
      const block = mobileBlock.match(re)?.[0];
      expect(block, String(re)).toBeTruthy();
      const layers = [...block!.matchAll(/0 (-?\d+)px (\d+)px (-?\d+)px/g)];
      expect(layers.length).toBeGreaterThan(0);
      for (const [, , blur, spread] of layers) expect(Number(spread)).toBe(-Number(blur));
    }
  });

  it('the track stretches the cards (beats the desktop flex-start rule)', () => {
    const track = mobileBlock.match(/\.process-column-grid--inhouse \{[^}]*\}/)?.[0];
    expect(track).toMatch(/align-items:\s*stretch;/);
  });

  it('no peek styling: neighbours are not dimmed or shrunk', () => {
    expect(mobileBlock).not.toMatch(/\.process-swipe-slot\.is-current/);
    const slot = mobileBlock.match(/\.process-column-grid--inhouse \.process-swipe-slot \{[^}]*\}/)?.[0];
    expect(slot).not.toMatch(/opacity|scale\(/);
  });

  it('the wrap clips the off-page cards and the grid no longer pins transform: none', () => {
    const wrap = mobileBlock.match(/\.process-scroll-wrap \{[^}]*\}/)?.[0];
    // Clip only sideways: shadows below and badges above stay visible.
    expect(wrap).toMatch(/overflow-x:\s*clip;/);
    expect(wrap).toMatch(/overflow-y:\s*visible;/);
    // Regression: the hover radar ring (outline pulsing up to 17px outside
    // the card) was cut on both sides when the clip sat on the card edges.
    // The clip box now reaches the screen edges (= .section's 16px padding).
    expect(wrap).toMatch(/margin:\s*0 -16px;/);
    expect(css).toMatch(/to\s*\{ outline-offset: 17px;/);
    expect(mobileBlock).not.toMatch(/\.process-column-grid \{[^}]*transform:\s*none !important;/);
  });

  // Regression: cardStep() read getBoundingClientRect().width, which
  // includes any transform on the slot (the old peek layout scaled the
  // neighbours to 0.92) — every slide under-stepped and drifted.
  it("measures the slide step from the card's layout width, not its transformed rect", () => {
    const fn = tsx.slice(tsx.indexOf('function cardStep()'), tsx.indexOf('useLayoutEffect(() => {', tsx.indexOf('function cardStep()')));
    expect(fn).toMatch(/parseFloat\(getComputedStyle\(card\)\.width\)/);
    expect(fn).not.toMatch(/card\.getBoundingClientRect\(\)/);
  });

  it('centres the dots and the Swipe button on the card axis', () => {
    const controls = mobileBlock.match(/\.process-swipe-controls \{[^}]*\}/)?.[0];
    expect(controls).toMatch(/left:\s*0;\s*right:\s*0;/);
    const btn = mobileBlock.match(/\.process-swipe-btn \{[^}]*\}/)?.[0];
    expect(btn).toMatch(/left:\s*50%;/);
    expect(btn).toMatch(/transform:\s*translateX\(-50%\);/);
  });

  it('shows the dots and Swipe button on phones', () => {
    expect(mobileBlock).not.toMatch(/\.process-swipe-controls,\s*\.process-swipe-btn \{\s*display:\s*none !important;/);
  });
});
