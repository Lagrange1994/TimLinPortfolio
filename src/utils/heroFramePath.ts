/**
 * Outline of the hero's irregular background panel — the rounded rect that
 * holds the background Spline scene, with the two notches cut out of it (top-
 * left for the navbar logo, bottom-right for the chat FAB). ONE path
 * describes the whole irregular shape, and BeamsBackground.tsx's sync() uses
 * that single `d` everywhere the shape is needed: as #bg-spline-scene's own
 * clip-path (the WebGL content, notches included), as the stroke for
 * #bg-frame-outline's border, and as the fill for #bg-frame-glow's ambient
 * glow. Earlier versions computed the notches a second time, independently,
 * to clip a pair of patch elements that painted flat fill over the panel's
 * corners instead of actually cutting the container — a second curve that
 * only approximately agreed with this one, and the seam between them showed
 * up as a visible gap once the border/glow made it load-bearing instead of
 * merely cosmetic. Clipping the real container to this same path removes
 * that second curve (and the patches) entirely.
 *
 * Coordinates are in the panel's own space (0,0 = panel top-left), i.e. the
 * hero's box inset by FRAME_INSET on every side.
 *
 * The notch geometry is the Figma "Subtract" node's own boundary (fileKey
 * H94cQ9wrWHdL2tAJU2o726, node 19:30), rebased from hero-space into panel-
 * space by subtracting that same FRAME_INSET. The two notches used to be a
 * fixed 180°-point-reflection of each other (both sharing one NOTCH_FLAT);
 * they now take independent flat widths (BeamsBackground.tsx measures each
 * notch's own content — .navbar-brand, #home .hero-ask — live) so each notch
 * can be exactly as wide as what's actually sitting in it, but the
 * underlying fillet math (radius, depth) is unchanged and still shared.
 */

/** Frame thickness — the gap between the hero's edge and the panel's edge. */
export const FRAME_INSET = 24;

/** Panel corner radius, matching the CSS border-radius on #bg-spline-scene. */
export const FRAME_RADIUS = 48;

/** Fallback flat width, used only before a notch's content has been measured. */
export const NOTCH_FLAT = 605;

// How far the notch reaches down the panel's left/right edge (y, in panel
// space). Fixed — only the notches' *width* (flat) adapts to content; their
// depth is a constant property of the cut, not of what's inside it.
const NOTCH_DEPTH = 114;

// The S-bend between the notch's flat (top/bottom) edge and its depth
// (left/right) edge is three quarter-circle fillets of this radius stacked
// back to back — NOTCH_DEPTH is exactly 3 * NOTCH_RADIUS by construction
// (the Figma source's own numbers), which is what makes the S-bend meet the
// depth edge tangentially instead of with a visible kink.
//
// Exported because a flat-width caller (BeamsBackground.tsx's sync()) needs
// it too: the two fillets nearest a notch's outer end burn 2*NOTCH_RADIUS of
// its flat width just getting the curve from full depth down to the
// FRAME_INSET+2*NOTCH_RADIUS plateau — content whose edge lands inside that
// stretch sits in the middle of the S-bend, not on the flat floor, so sizing
// a notch to content needs this to know how much extra flat width to add
// beyond the content's own edge.
export const NOTCH_RADIUS = 38;

// Cubic-bezier control-point offset that approximates a quarter-circle arc of
// radius NOTCH_RADIUS (the standard ~0.5522847 "kappa" constant).
const K = 0.5522847 * NOTCH_RADIUS;

/** A notch can't be narrower than it is deep — below that the S-bend and the
 * straight run between its two ends invert and the outline self-intersects.
 * Content this narrow never occurs in practice, but clamp defensively. */
const MIN_FLAT = NOTCH_DEPTH;

const n = (v: number) => (Math.round(v * 100) / 100).toString();

/**
 * @param w Panel width  (hero width  - FRAME_INSET * 2)
 * @param h Panel height (hero height - FRAME_INSET * 2)
 * @param flatTL Top-left notch's flat width (its content's measured width + gap)
 * @param flatBR Bottom-right notch's flat width, independent of flatTL
 */
export function heroFramePath(
  w: number,
  h: number,
  radius = FRAME_RADIUS,
  flatTL = NOTCH_FLAT,
  flatBR = NOTCH_FLAT,
): string {
  // Corner radius can't exceed half of either side, and the notches can't
  // reach so far in that they'd swallow the corner they're heading toward —
  // both only matter at absurd viewport/content sizes, but an unclamped path
  // there self-intersects into a visibly knotted outline rather than
  // degrading.
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const flat = Math.max(MIN_FLAT, Math.min(flatTL, w - r));
  const depth = Math.max(r, Math.min(NOTCH_DEPTH, h - r));
  const flatBr = Math.max(MIN_FLAT, Math.min(flatBR, w - r));
  const rad = NOTCH_RADIUS, k = K;

  // Sweep-flag 0 on both arcs: the whole outline is traced in one direction
  // (down the left edge first, so counter-clockwise in SVG's y-down space).
  return [
    // left edge, from where the top-left notch rejoins it, down to the corner
    `M 0 ${n(depth)}`,
    `L 0 ${n(h - r)}`,
    `A ${n(r)} ${n(r)} 0 0 0 ${n(r)} ${n(h)}`,
    // bottom edge, up to where the bottom-right notch starts
    `L ${n(w - flatBr)} ${n(h)}`,
    // bottom-right notch (top-left's point reflection, using its own flat)
    `C ${n(w - (flatBr - k))} ${n(h)} ${n(w - (flatBr - rad))} ${n(h - (rad - k))} ${n(w - (flatBr - rad))} ${n(h - rad)}`,
    `C ${n(w - (flatBr - rad))} ${n(h - (rad + k))} ${n(w - (flatBr - 2 * rad + k))} ${n(h - 2 * rad)} ${n(w - (flatBr - 2 * rad))} ${n(h - 2 * rad)}`,
    `L ${n(w - (depth - 2 * rad))} ${n(h - 2 * rad)}`,
    `C ${n(w - (depth - 2 * rad - k))} ${n(h - 2 * rad)} ${n(w)} ${n(h - (depth - k))} ${n(w)} ${n(h - depth)}`,
    // right edge up to the corner, then the top edge back to the notch
    `L ${n(w)} ${n(r)}`,
    `A ${n(r)} ${n(r)} 0 0 0 ${n(w - r)} 0`,
    `L ${n(flat)} 0`,
    // top-left notch
    `C ${n(flat - k)} 0 ${n(flat - rad)} ${n(rad - k)} ${n(flat - rad)} ${n(rad)}`,
    `C ${n(flat - rad)} ${n(rad + k)} ${n(flat - 2 * rad + k)} ${n(2 * rad)} ${n(flat - 2 * rad)} ${n(2 * rad)}`,
    `L ${n(depth - 2 * rad)} ${n(2 * rad)}`,
    `C ${n(depth - 2 * rad - k)} ${n(2 * rad)} 0 ${n(depth - k)} 0 ${n(depth)}`,
    'Z',
  ].join(' ');
}
