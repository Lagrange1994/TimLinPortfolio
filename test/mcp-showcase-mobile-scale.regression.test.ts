import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// The Figma MCP showcase (two side-by-side mockup cards + a connecting
// "Figma MCP" hub) used to stack the cards vertically on phones, since they
// don't fit side by side at their natural size. Replaced with scaling the
// whole two-card grid down via `transform: scale()` (computed from the
// wrapper's measured width vs a fixed design width) so the layout stays
// horizontal, matching desktop, at every width — see FigmaMcpShowcase.tsx
// and the .mcp-grid-wrap/.mcp-grid rules in portfolio.css.
describe('FigmaMcpShowcase keeps the two-card grid horizontal on phones via scale, not stacking', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/components/FigmaMcpShowcase.tsx'), 'utf8');

  it('computes a scale factor from the wrapper width against a fixed design width', () => {
    expect(source).toMatch(/const MCP_DESIGN_WIDTH = \d+;/);
    expect(source).toMatch(/const scale = w \/ MCP_DESIGN_WIDTH;/);
  });

  it('scales the grid with transform, not CSS zoom (zoom needs hand-picked heights; transform keeps offsetHeight accurate)', () => {
    expect(source).toMatch(/grid\.style\.transform = `scale\(\$\{scale\}\)`/);
    expect(source).not.toMatch(/\bzoom\s*[:=]/);
  });

  it('syncs the wrapper height from the grid\'s own (pre-transform) offsetHeight times the scale', () => {
    expect(source).toMatch(/wrap\.style\.height = `\$\{grid\.offsetHeight \* scale\}px`/);
  });

  it('skips scaling once the wrapper is wide enough for the natural layout', () => {
    expect(source).toMatch(/const scaling = w < MCP_DESIGN_WIDTH;/);
    expect(source).toMatch(/if \(!scaling\)/);
    expect(source).toMatch(/grid\.style\.transform = '';/);
  });

  // The shadow/glow used to be dropped via an .is-scaled class while scaled
  // because the clip box sat flush against the cards. The clip is now x-only
  // and out at the screen edge, so nothing needs dropping any more.
  it('no longer toggles .is-scaled (shadow/glow stay on while scaled)', () => {
    expect(source).not.toMatch(/is-scaled/);
  });
});

describe('.mcp-grid-wrap clips instead of stacking the two-card grid on phones', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/styles/portfolio.css'), 'utf8');

  it('keeps the 2-column grid at every width (no mobile grid-template-columns: 1fr stacking override)', () => {
    expect(source).not.toMatch(/grid-template-columns:\s*1fr;\s*\n\s*row-gap:\s*24px;/);
  });

  it('anchors the scale transform at the top-left corner', () => {
    const gridBlock = source.match(/\.mcp-grid \{[^}]*\}/)?.[0];
    expect(gridBlock).toMatch(/transform-origin:\s*top left;/);
  });

  // Regression: `overflow: hidden` still accepts a programmatic scrollLeft
  // (e.g. from Element.scrollIntoView() landing on something inside), which
  // silently shifted the clipped viewport and cut off the left edge of the
  // mockups. `overflow: clip` crops the same oversized pre-transform box
  // without ever becoming a scroll container, so no scrollLeft drift is
  // possible. The clip itself lives on .mcp-bleed, not .mcp-grid-wrap — see
  // the next describe block.
  it('.mcp-grid-wrap itself no longer clips (that moved to .mcp-bleed)', () => {
    const wrapBlock = source.match(/\.mcp-grid-wrap \{[^}]*\}/)?.[0];
    expect(wrapBlock).toBeTruthy();
    expect(wrapBlock).not.toMatch(/overflow:/);
  });

  // Regression: the card's box-shadow and the hub's glow filter bleed well
  // past their own element (the shadow alone up to ~64px). They must stay on
  // at every width — .mcp-bleed clips x only, so nothing crops them above or
  // below the cards.
  it('keeps the card shadow and hub glow at every width (no .is-scaled override)', () => {
    expect(source).not.toMatch(/\.mcp-grid-wrap\.is-scaled/);
    const cardBlock = source.match(/\.mcp-card \{[^}]*\}/)?.[0];
    expect(cardBlock).toMatch(/box-shadow:\s*var\(--card-shadow-md\), var\(--card-edge\);/);
  });
});

// .mcp-bleed wraps .mcp-grid-wrap (see FigmaMcpShowcase.tsx) so the clip
// boundary sits at the actual browser edge instead of flush against the
// cards, while the visible cards themselves stay exactly as wide as every
// other card on the page — .mcp-grid-wrap's own width measurement (which
// drives the scale-sync effect above) is unaffected by the bleed.
describe('.mcp-bleed pushes the clip boundary out to the browser edge without changing the visible card width', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/styles/portfolio.css'), 'utf8');

  it('breaks out to the full viewport width with the negative-margin bleed trick, and clips there', () => {
    const block = source.match(/\.mcp-bleed \{[^}]*\}/)?.[0];
    expect(block).toBeTruthy();
    expect(block).toMatch(/width:\s*calc\(100vw \/ var\(--z, 1\)\);/);
    expect(block).toMatch(/margin-left:\s*calc\(50% - 50vw \/ var\(--z, 1\)\);/);
    expect(block).toMatch(/margin-right:\s*calc\(50% - 50vw \/ var\(--z, 1\)\);/);
    expect(block).toMatch(/overflow-x:\s*clip;/);
    expect(block).toMatch(/overflow-y:\s*visible;/);
  });

  // Regression: without matching .section's own side padding at each
  // breakpoint, the viewport-edge bleed would also widen the visible cards
  // (not just the invisible clip room), instead of just the fold changing
  // where they'd otherwise be.
  it('mirrors .section\'s own side padding at every breakpoint so the visible cards land back where they started', () => {
    const desktopBlock = source.match(/\.mcp-bleed \{[^}]*\}/)?.[0];
    expect(desktopBlock).toMatch(/padding:\s*0 calc\(max\(0px, \(100vw \/ var\(--z, 1\) - 1440px\) \/ 2\) \+ 48px\);/);

    const tabletSection = source.slice(
      source.indexOf('TABLET (768px'),
      source.indexOf('MOBILE (< 768px)')
    );
    expect(tabletSection).toMatch(/\.mcp-bleed \{\s*padding:\s*0 32px;\s*\}/);

    const mobileSection = source.slice(source.indexOf('MOBILE (< 768px)'));
    expect(mobileSection).toMatch(/\.mcp-bleed \{\s*padding:\s*0 16px;\s*\}/);
  });
});
