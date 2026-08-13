/**
 * Notched panel shape for the portfolio carousel wall — traced from the
 * Figma export (file H94cQ9wrWHdL2tAJU2o726, node 1:2). Two staircase
 * notches cut into the top-left (sized to the live-measured headline title
 * and subtitle, per the Figma annotations — not a fixed ratio, so language
 * switches / font loading / wrapping all need a re-measure in
 * PortfolioSection.tsx), and the right portion of the panel is shorter than
 * the left — it steps up short of the right edge by legGapW and stops short
 * of the bottom by legGapH (both live-measured, from the "View All
 * Projects" button's own width/height plus its padding), leaving an empty
 * gap at the bottom-right for that button. Every corner uses the same
 * `radius` (40px by default, like squircleRectPath but for this outline —
 * PortfolioSection.tsx passes a smaller value on mobile), except the two
 * corners where the subtitle notch turns (the step at x=notch2W), which use
 * half that radius so that turn can sit closer to the subtitle without the
 * curve itself eating into the clearance; and the leg gap's own top-left
 * corner (where the button sits), whose radius is passed in live from
 * PortfolioSection.tsx so its curve stays concentric with the button's own
 * pill-shaped corner — same centre point, so the button reads equidistant
 * from the notch on its top and left sides instead of just its two straight
 * edges lining up. The leg gap's other (bottom) corner is kept tighter to
 * match, since matching the top corner to the button's own (much larger,
 * pill-shaped) radius would otherwise look oversized next to it.
 */

const DEFAULT_LEG_GAP_W_RATIO = 1 - 728 / 1328;
const DEFAULT_LEG_GAP_RATIO = 1 - 548 / 666;
export const DEFAULT_RADIUS = 40;

// The wall grows to fit its natural card-stack height instead of being
// scaled to a fixed viewport percentage, but only up to whatever room the
// screen actually has — past that cap it just crops (overflow: hidden),
// same as any other natural-height box. Pulled out as pure math so the
// clamp itself is unit-testable without a DOM.
export function computeWallHeight(contentHeight: number, capPx: number): number {
  return Math.max(0, Math.min(contentHeight, capPx));
}

type Vertex = { x: number; y: number; r: number };

// Rounds every corner of a closed orthogonal polygon (axis-aligned edges
// only) with a per-vertex radius, clamped so neighbouring corners on a short
// edge can't overlap. Each corner is cut with a single quadratic Bézier
// whose control point is the original sharp vertex itself — that's tangent
// to both edges by construction, so it's correct for convex AND concave
// (reflex) turns with no separate direction/winding logic to get wrong,
// unlike a circular-arc sweep which needs to know which way to turn.
function roundedOrthogonalPath(vertices: Vertex[]): string {
  const count = vertices.length;

  // Two corners sharing an edge can't both keep their full requested radius
  // if the edge is too short to fit both curves — scale that pair down
  // together (the same overlap resolution CSS border-radius uses), not each
  // corner pre-clamped independently to half its own edge. Independent
  // half-clamping is overly conservative whenever an edge's two corners want
  // very different radii (e.g. the leg gap's button-concentric corner next
  // to its deliberately tighter neighbour) — it would cut the larger one
  // down to half even though the smaller one leaves it plenty of room. Two
  // passes around the loop so a corner shrunk while acting as an edge's
  // second vertex is re-checked against its other edge too.
  const radii = vertices.map(v => Math.max(0, v.r));
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < count; i++) {
      const a = vertices[i];
      const b = vertices[(i + 1) % count];
      const edgeLen = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
      const sum = radii[i] + radii[(i + 1) % count];
      if (sum > edgeLen && sum > 0) {
        const scale = edgeLen / sum;
        radii[i] *= scale;
        radii[(i + 1) % count] *= scale;
      }
    }
  }

  const cmds: string[] = [];
  for (let i = 0; i < count; i++) {
    const prev = vertices[(i - 1 + count) % count];
    const cur = vertices[i];
    const next = vertices[(i + 1) % count];
    const r = radii[i];

    if (r <= 0.01) {
      cmds.push(`${i === 0 ? 'M' : 'L'} ${cur.x.toFixed(2)} ${cur.y.toFixed(2)}`);
      continue;
    }

    const dinLen = Math.hypot(cur.x - prev.x, cur.y - prev.y) || 1;
    const din = { x: (cur.x - prev.x) / dinLen, y: (cur.y - prev.y) / dinLen };
    const doutLen = Math.hypot(next.x - cur.x, next.y - cur.y) || 1;
    const dout = { x: (next.x - cur.x) / doutLen, y: (next.y - cur.y) / doutLen };

    const p0 = { x: cur.x - din.x * r, y: cur.y - din.y * r };
    const p1 = { x: cur.x + dout.x * r, y: cur.y + dout.y * r };

    cmds.push(`${i === 0 ? 'M' : 'L'} ${p0.x.toFixed(2)} ${p0.y.toFixed(2)}`);
    cmds.push(`Q ${cur.x.toFixed(2)} ${cur.y.toFixed(2)} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`);
  }

  return cmds.join(' ') + ' Z';
}

export function portfolioWallMaskPath(
  w: number,
  h: number,
  notch1W: number,
  notch1H: number,
  notch2W: number,
  notch2H: number,
  legGapH = h * DEFAULT_LEG_GAP_RATIO,
  legGapW = w * DEFAULT_LEG_GAP_W_RATIO,
  radius = DEFAULT_RADIUS,
  legTopRadius = radius,
  // notch1's own top-right corner (where the outline starts dropping down
  // alongside the headline title, above the subtitle notch entirely) —
  // independent from the shared `radius` used by every other main corner,
  // so a caller can tune the headline's own top turn without affecting the
  // rest of the outline.
  notch1TopRadius = radius,
  // notch2's own bottom-right corner (where the outline turns back left
  // below the subtitle) — independent from the shared tight-radius so a
  // caller can tune it without affecting the leg gap's bottom-left corner,
  // which still shares the tight-radius below.
  notch2BottomRadius = radius / 2,
): string {
  const n1w = Math.max(0, Math.min(notch1W, w));
  const n1h = Math.max(0, Math.min(notch1H, h));
  const n2w = Math.max(0, Math.min(notch2W, n1w));
  const n2h = Math.max(0, Math.min(notch2H, h - n1h));

  // legX only needs to stay within [0, w] — it does NOT need to stay right
  // of n1w. The leg gap's own top edge (legY, clamped below) is already
  // held at or below n1h+n2h, so the leg notch's y-range can never overlap
  // the header notches' y-range regardless of how far left legX reaches;
  // clamping it to n1w was an unnecessary extra constraint that silently
  // capped how wide the leg gap could grow (e.g. widening it to clear a
  // button pushed further left on narrow tablet widths, where n1w — sized
  // to the headline text — can exceed the leg gap's own natural width).
  const legX = Math.max(0, Math.min(w, w - legGapW));
  const legY = Math.max(n1h + n2h, Math.min(h, h - legGapH));

  // notch2's own top corner and the leg gap's bottom corner both use a
  // tighter radius than the rest of the outline (see file header) — always
  // exactly half the main radius, so scaling `radius` down (e.g. the halved
  // mobile size) scales them proportionally instead of leaving them fixed
  // at the desktop/tablet 20px.
  const tightRadius = radius / 2;

  const vertices: Vertex[] = [
    { x: n1w, y: 0, r: notch1TopRadius },
    { x: n1w, y: n1h, r: radius },
    { x: n2w, y: n1h, r: tightRadius },
    { x: n2w, y: n1h + n2h, r: notch2BottomRadius },
    { x: 0, y: n1h + n2h, r: radius },
    { x: 0, y: h, r: radius },
    { x: legX, y: h, r: tightRadius },
    { x: legX, y: legY, r: legTopRadius },
    { x: w, y: legY, r: radius },
    { x: w, y: 0, r: radius },
  ];

  return roundedOrthogonalPath(vertices);
}
