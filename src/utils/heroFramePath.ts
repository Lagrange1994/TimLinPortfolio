/**
 * Outline of the hero's irregular background panel — the rounded rect that
 * holds the background Spline scene, with the two notches cut out of it (top-
 * left for the navbar logo, bottom-right for the chat FAB). Same idea as
 * portfolioMask.ts: ONE path describes the whole irregular shape, and the
 * caller uses that single `d` everywhere the shape is needed (see
 * BeamsBackground.tsx — an SVG stroke for the border, a wide clipped stroke
 * for the inner rim light, and a <clipPath> for that clip). Before this, the
 * border/glow lived on a plain CSS box (border + box-shadow on a
 * border-radius:48px div) while the notches were separate clip-path'd patches
 * painted over it — two shapes that only agreed along the four straight
 * edges, so around each notch the box's glow bloomed along a rounded-rect
 * corner that isn't where the panel visually ends, and the patch then covered
 * whatever part of it landed underneath. Hence the reported "glow is in the
 * wrong place and gets cut off". A stroke along this path can't drift: it IS
 * the panel's edge.
 *
 * Coordinates are in the panel's own space (0,0 = panel top-left), i.e. the
 * hero's box inset by FRAME_INSET on every side.
 *
 * The notch geometry is the Figma "Subtract" node's own boundary (fileKey
 * H94cQ9wrWHdL2tAJU2o726, node 19:30), rebased from hero-space into panel-
 * space by subtracting that same FRAME_INSET — it's the identical curve the
 * #bg-notch-tl / #bg-notch-br patches are clipped to (see notchPatchPath
 * below), so the stroke lands exactly on the seam where a patch stops
 * covering the panel. The two notches used to be a fixed 180°-point-
 * reflection of each other (both sharing one NOTCH_FLAT); they now take
 * independent flat widths (BeamsBackground.tsx measures each notch's own
 * content — .navbar-brand, #home .hero-ask — live) so each notch can be
 * exactly as wide as what's actually sitting in it, but the underlying
 * fillet math (radius, depth) is unchanged and still shared.
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

/**
 * Clip-path for a notch's own background-repaint patch (#bg-notch-tl /
 * #bg-notch-br in portfolio.css) — the small rect at the panel's corner that
 * re-paints #home's gradient over the area the panel's notch cuts away, in
 * the patch's own local space (0,0 = the patch's own top-left, e.g. the
 * hero's true outer corner for the tl patch).
 *
 * This traces the exact same fillet math as heroFramePath's notch (same
 * radius/depth constants, same `flat`), offset by FRAME_INSET on both axes —
 * patch-space starts FRAME_INSET before panel-space does — plus the outer
 * FRAME_INSET-wide strip along the patch's own top/left (tl) or bottom/right
 * (br) edge, which sits outside the panel entirely. Sharing this math with
 * heroFramePath (rather than each hand-writing its own copy of the curve, as
 * before) is what guarantees the patch's edge and the panel outline's stroke
 * land on the exact same seam.
 *
 * @param flat This notch's own flat width (independent per corner).
 * @param corner Which corner the patch sits in — 'br' point-reflects the
 *   'tl' shape through the patch's own box center.
 */
export function notchPatchPath(flat: number, corner: 'tl' | 'br'): string {
  const rad = NOTCH_RADIUS, k = K, depth = NOTCH_DEPTH, inset = FRAME_INSET;
  const f = Math.max(MIN_FLAT, flat);
  const pw = f + inset;
  const ph = depth + inset;

  const pts: [number, number][] = [
    [0, 0],
    [pw, 0],
    [pw, inset],
    [pw - k, inset], [pw - rad, inset + rad - k], [pw - rad, inset + rad],
    [pw - rad, inset + rad + k], [pw - 2 * rad + k, inset + 2 * rad], [pw - 2 * rad, inset + 2 * rad],
    [depth - 2 * rad + inset, inset + 2 * rad],
    [depth - 2 * rad - k + inset, inset + 2 * rad], [inset, depth - k + inset], [inset, depth + inset],
    [inset, 0],
  ];

  const toXY = corner === 'br'
    ? ([x, y]: [number, number]): [number, number] => [pw - x, ph - y]
    : ([x, y]: [number, number]): [number, number] => [x, y];

  const [m, l1, l2, ...rest] = pts.map(toXY);
  const [c1a, c1b, c1c, c2a, c2b, c2c, l3, c3a, c3b, c3c, l4] = rest;

  return [
    `M ${n(m[0])} ${n(m[1])}`,
    `L ${n(l1[0])} ${n(l1[1])}`,
    `L ${n(l2[0])} ${n(l2[1])}`,
    `C ${n(c1a[0])} ${n(c1a[1])} ${n(c1b[0])} ${n(c1b[1])} ${n(c1c[0])} ${n(c1c[1])}`,
    `C ${n(c2a[0])} ${n(c2a[1])} ${n(c2b[0])} ${n(c2b[1])} ${n(c2c[0])} ${n(c2c[1])}`,
    `L ${n(l3[0])} ${n(l3[1])}`,
    `C ${n(c3a[0])} ${n(c3a[1])} ${n(c3b[0])} ${n(c3b[1])} ${n(c3c[0])} ${n(c3c[1])}`,
    `L ${n(l4[0])} ${n(l4[1])}`,
    'Z',
  ].join(' ');
}
