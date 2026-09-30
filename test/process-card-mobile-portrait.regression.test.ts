import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// Design Process cards (.process-card--has-img, used by both the In-house
// and Freelance columns) are square on desktop/tablet with the text
// overlaid on top of the illustration behind a dark scrim. On phones the
// square left the illustration and the text fighting for the same cramped
// area, so it becomes a portrait card instead: a real square image block
// (aspect-ratio 1/1, so it's exactly as tall as the card is wide) stacked
// in normal flow above an auto-height text block. See the <768px MOBILE
// block in portfolio.css.
describe('.process-card--has-img stacks a square image over auto-height text on phones', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/portfolio.css'), 'utf8');
  const mobileBlock = css.slice(css.indexOf('MOBILE (< 768px)'), css.indexOf('Responsive overrides (must be AFTER'));

  it('is scoped to the <768px MOBILE block, not the shared tablet+phone rules', () => {
    expect(mobileBlock).toBeTruthy();
    expect(mobileBlock.length).toBeGreaterThan(0);
  });

  it('drops the fixed square card ratio so height can come from content instead', () => {
    const block = mobileBlock.match(/\.process-card--has-img\.border-glow-card \{[^}]*\}/)?.[0];
    expect(block).toBeTruthy();
    expect(block).toMatch(/aspect-ratio:\s*auto;/);
  });

  // Regression: .process-swipe-slot (the grid item) is pinned to the
  // tallest card's height, but this card is only its slot's in-flow CHILD
  // — a taller slot doesn't stretch a shorter child on its own, so a
  // shorter card left leftover empty space inside its own slot instead of
  // the grid gap, making the vertical gap between rows look bigger than
  // the horizontal gap between columns even though both use the same 16px
  // grid gap.
  it("stretches the card to fill its slot's pinned height, so leftover slack becomes part of the card instead of an extra gap", () => {
    const block = mobileBlock.match(/\.process-card--has-img\.border-glow-card \{[^}]*\}/)?.[0];
    expect(block).toBeTruthy();
    expect(block).toMatch(/height:\s*100%;/);
  });

  it('makes the illustration a real 1:1 square block in normal flow (not an absolute full-card layer)', () => {
    const block = mobileBlock.match(/\.process-card--has-img \.border-glow-bg-slot \{[^}]*\}/)?.[0];
    expect(block).toBeTruthy();
    expect(block).toMatch(/position:\s*relative;/);
    expect(block).toMatch(/aspect-ratio:\s*1 \/ 1;/);
    // negative z-index only made sense as a full-card underlay behind an
    // absolute text overlay; kept as -2 here it would paint the image
    // behind the card's own background instead.
    expect(block).toMatch(/z-index:\s*auto;/);
  });

  it('flows the text block statically right after the image instead of absolutely overlaying the card', () => {
    const block = mobileBlock.match(/\.process-card--has-img \.border-glow-inner \{[^}]*\}/)?.[0];
    expect(block).toBeTruthy();
    expect(block).toMatch(/position:\s*static;/);
  });

  // The title used to sit in a flat gap right below the image; a negative
  // margin-top pulls it up to overlap the image's bottom edge instead —
  // the vignette (::after below) already fades that edge to the card's own
  // solid background color, so the title stays legible without bringing
  // back the old full-image scrim.
  it("pulls the title up to overlap the image's bottom edge with a negative margin-top", () => {
    const block = mobileBlock.match(/\.process-card--has-img \.border-glow-inner \{[^}]*\}/)?.[0];
    expect(block).toBeTruthy();
    expect(block).toMatch(/margin-top:\s*-\d+px;/);
  });

  it('drops the image-legibility scrim, since the text no longer sits on the illustration', () => {
    expect(mobileBlock).toMatch(/\.process-card--has-img \.border-glow-inner::before \{\s*display:\s*none;\s*\}/);
  });

  it('switches text off the fixed white/shadowed treatment back to the normal theme-adaptive tokens', () => {
    expect(mobileBlock).toMatch(/\.process-card--has-img \.process-name \{\s*color:\s*var\(--text\);\s*\}/);
    expect(mobileBlock).toMatch(/\.process-card--has-img \.process-desc \{\s*color:\s*var\(--text-50\);\s*\}/);
  });

  // The badge is a child of .border-glow-inner. Regression: an earlier
  // version kept .border-glow-inner positioned and tried to compensate the
  // badge's `top` with a percentage offset, which was computed wrong (used
  // -50% where the actual box-height fraction needed -100%) and visibly
  // moved the badge off the card's real top-left corner. Making
  // .border-glow-inner `position: static` lets the badge's own unmodified
  // `top: -7px; left: 18px` (portfolio.css's un-scoped base rule) escape to
  // .border-glow-card itself, so no mobile-specific badge override should
  // exist at all — its position doesn't change from the desktop rule.
  it("never re-declares .process-step-badge's top/left inside the mobile block (position escapes to the card, no override needed)", () => {
    const badgeBlock = mobileBlock.match(/\.process-card--has-img \.process-step-badge \{[^}]*\}/)?.[0];
    expect(badgeBlock).toBeTruthy();
    expect(badgeBlock).not.toMatch(/top:/);
    expect(badgeBlock).not.toMatch(/left:/);
  });

  // Cards now derive height from content (square image + auto-height
  // text) instead of a fixed aspect-ratio. Regression: the grid's own
  // default (stretch) would normally handle matching every card in a row
  // to its tallest row-mate, but ProcessCarousel actually renders
  // .process-column-grid--inhouse (reused for both columns despite the
  // name) — that class's own desktop rule sets align-items: flex-start
  // unconditionally, which is ALSO a valid (top-anchor) grid keyword, so it
  // silently wins over the plain .process-column-grid selector at equal
  // specificity regardless of source order and defeats stretch. Must be
  // re-declared on the --inhouse selector specifically.
  it('re-declares align-items: stretch on .process-column-grid--inhouse (not just .process-column-grid), so it actually beats the desktop flex-start rule', () => {
    const gridBlock = mobileBlock.match(/\.process-column-grid--inhouse \{[^}]*\}/)?.[0];
    expect(gridBlock).toBeTruthy();
    expect(gridBlock).toMatch(/align-items:\s*stretch;/);
  });

  // The illustration assets are baked with a solid white background, and
  // contain-sized into an exactly-square slot fills it edge-to-edge — so
  // the visible edge color is a fixed, known value per theme (not an
  // approximation), and matching the card's own background to it removes
  // the seam where the image half meets the plain text half below it.
  it('bumps the dark-mode vignette to fully opaque at the edge, and matches the card background to that same color', () => {
    const vignetteBlock = mobileBlock.match(/\.process-card--has-img \.border-glow-bg-slot::after \{[^}]*\}/)?.[0];
    expect(vignetteBlock).toBeTruthy();
    expect(vignetteBlock).toMatch(/rgba\(13, 10, 28, 1\) 100%/);

    const darkBgIdx = css.indexOf('.process-card--has-img.border-glow-card {\n      background-color: #0d0a1c !important;');
    expect(darkBgIdx).toBeGreaterThan(-1);

    const lightBgIdx = css.indexOf(':root[data-theme="light"] .process-card--has-img.border-glow-card {\n      background-color: #ffffff !important;');
    expect(lightBgIdx).toBeGreaterThan(-1);
  });

  // Regression: .process-card's own unconditional rule paints a noise-grain
  // texture + radial-gradient mesh over its background-color, both
  // !important. The dark-mode edge-match above only overrode
  // background-color at first, so that textured/tinted layer kept painting
  // on top of the flat #0d0a1c, leaving a visibly different (textured, not
  // flat) surface next to the image's smooth vignette fade — the seam this
  // whole rule exists to remove. background-image must be neutralized too.
  it('also clears background-image on the dark-mode edge-match, not just background-color', () => {
    const darkBgBlock = css.match(/\.process-card--has-img\.border-glow-card \{\s*background-color: #0d0a1c !important;\s*background-image: none !important;\s*\}/);
    expect(darkBgBlock).toBeTruthy();
  });

  // Light mode disables the vignette entirely (pre-existing rule), so the
  // image's true edge there is the asset's own baked-in white with no
  // darkening — the light background-color override above must come after
  // the shared light-mode --neu-bg rule (same selector specificity, both
  // !important) to actually win the cascade.
  it("positions the light-mode background override after the shared --neu-bg rule it must beat", () => {
    const neuBgIdx = css.indexOf('background: var(--neu-bg) !important;');
    const lightOverrideIdx = css.indexOf(':root[data-theme="light"] .process-card--has-img.border-glow-card {\n      background-color: #ffffff !important;');
    expect(neuBgIdx).toBeGreaterThan(-1);
    expect(lightOverrideIdx).toBeGreaterThan(neuBgIdx);
  });
});
