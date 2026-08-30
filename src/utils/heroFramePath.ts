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
 * #bg-notch-tl / #bg-notch-br patches are clipped to, so the stroke lands
 * exactly on the seam where a patch stops covering the panel. The bottom-
 * right notch is the top-left one point-reflected through the panel's centre
 * ((x, y) -> (w - x, h - y)); the shape is genuinely 180°-symmetric, so both
 * come from one set of numbers.
 */

/** Frame thickness — the gap between the hero's edge and the panel's edge. */
export const FRAME_INSET = 24;

/** Panel corner radius, matching the CSS border-radius on #bg-spline-scene. */
export const FRAME_RADIUS = 48;

// Where the notch meets the panel's top edge (x, measured from the panel's
// own left edge) and its left edge (y). The curve between them is the
// S-shaped double fillet below.
const NOTCH_FLAT = 605;
const NOTCH_DEPTH = 114;

const n = (v: number) => (Math.round(v * 100) / 100).toString();

/**
 * @param w Panel width  (hero width  - FRAME_INSET * 2)
 * @param h Panel height (hero height - FRAME_INSET * 2)
 */
export function heroFramePath(w: number, h: number, radius = FRAME_RADIUS): string {
  // Corner radius can't exceed half of either side, and the notches can't
  // reach so far in that they'd swallow the corner they're heading toward —
  // both only matter at absurd viewport sizes, but an unclamped path there
  // self-intersects into a visibly knotted outline rather than degrading.
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const flat = Math.max(r, Math.min(NOTCH_FLAT, w - r));
  const depth = Math.max(r, Math.min(NOTCH_DEPTH, h - r));

  // Sweep-flag 0 on both arcs: the whole outline is traced in one direction
  // (down the left edge first, so counter-clockwise in SVG's y-down space).
  return [
    // left edge, from where the top-left notch rejoins it, down to the corner
    `M 0 ${n(depth)}`,
    `L 0 ${n(h - r)}`,
    `A ${n(r)} ${n(r)} 0 0 0 ${n(r)} ${n(h)}`,
    // bottom edge, up to where the bottom-right notch starts
    `L ${n(w - flat)} ${n(h)}`,
    // bottom-right notch (top-left's point reflection)
    `C ${n(w - 584.01)} ${n(h)} ${n(w - 567)} ${n(h - 17.01)} ${n(w - 567)} ${n(h - 38)}`,
    `C ${n(w - 567)} ${n(h - 58.99)} ${n(w - 549.99)} ${n(h - 76)} ${n(w - 529)} ${n(h - 76)}`,
    `L ${n(w - 38)} ${n(h - 76)}`,
    `C ${n(w - 17.01)} ${n(h - 76)} ${n(w)} ${n(h - 93.01)} ${n(w)} ${n(h - depth)}`,
    // right edge up to the corner, then the top edge back to the notch
    `L ${n(w)} ${n(r)}`,
    `A ${n(r)} ${n(r)} 0 0 0 ${n(w - r)} 0`,
    `L ${n(flat)} 0`,
    // top-left notch
    `C 584.01 0 567 17.01 567 38`,
    `C 567 58.99 549.99 76 529 76`,
    `L 38 76`,
    `C 17.01 76 0 93.01 0 ${n(depth)}`,
    'Z',
  ].join(' ');
}
