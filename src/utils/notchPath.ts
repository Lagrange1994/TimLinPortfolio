// One closed outline for a card with a notch cut out of a bottom corner —
// the same approach as My Portfolio's wall (portfolioMask.ts): a single
// orthogonal polygon with rounded corners, used both as the card's
// clip-path and as the stroked border drawn along it, so the border runs
// unbroken round the notch. No mask layers stitched together.
//
// Unlike the wall's quadratic corners, each corner here is drawn in the
// card's own CSS corner shape, so the outline matches every other card:
// 'squircle' (corner-shape: squircle = superellipse(2), exponent 4) or
// 'round' (a circular arc).

export type CornerShape = 'squircle' | 'round';
type Corner = { x: number; y: number; r: number; shape: CornerShape };

const SEGMENTS = 12;

// Exponent of the corner curve |x|^n + |y|^n = 1: 4 for a squircle, 2 for a
// circle.
const EXPONENT: Record<CornerShape, number> = { squircle: 4, round: 2 };

function cornerPoints(prev: Corner, cur: Corner, next: Corner, r: number): { x: number; y: number }[] {
  if (r <= 0.01) return [{ x: cur.x, y: cur.y }];
  const len = (a: Corner, b: Corner) => Math.hypot(b.x - a.x, b.y - a.y) || 1;
  // u points back along the incoming edge, w along the outgoing one; the
  // curve runs from cur + u·r to cur + w·r, bulging toward the vertex, for
  // convex and concave corners alike.
  const u = { x: (prev.x - cur.x) / len(prev, cur), y: (prev.y - cur.y) / len(prev, cur) };
  const w = { x: (next.x - cur.x) / len(cur, next), y: (next.y - cur.y) / len(cur, next) };
  const cx = cur.x + (u.x + w.x) * r;
  const cy = cur.y + (u.y + w.y) * r;
  const e = 2 / EXPONENT[cur.shape];
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = (i / SEGMENTS) * (Math.PI / 2);
    const c = Math.pow(Math.cos(t), e);
    const s = Math.pow(Math.sin(t), e);
    pts.push({ x: cx - w.x * r * c - u.x * r * s, y: cy - w.y * r * c - u.y * r * s });
  }
  return pts;
}

function cornerPath(corners: Corner[]): string {
  const n = corners.length;
  // Two corners sharing a short edge scale down together (as CSS
  // border-radius does), so their curves never overlap.
  const radii = corners.map(c => Math.max(0, c.r));
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      const a = corners[i], b = corners[(i + 1) % n];
      const edge = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
      const sum = radii[i] + radii[(i + 1) % n];
      if (sum > edge && sum > 0) {
        radii[i] *= edge / sum;
        radii[(i + 1) % n] *= edge / sum;
      }
    }
  }
  const pts = corners.flatMap((c, i) => cornerPoints(corners[(i - 1 + n) % n], c, corners[(i + 1) % n], radii[i]));
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z';
}

// A top-left notch in two steps, like My Portfolio's wall headline: the
// first (n1w × n1h) holds the label and title, the second, narrower one
// (n2w × n2h) under it holds the subtitle. Card corners are `r` in `shape`;
// the notch's own turns are round, `ri`. A second step as wide as the first
// (or wider) folds into one notch.
// `bay`, optional: a notch cut into the left edge (top..bottom, w deep)
// for buttons sitting at that edge, its inner corners `ri` (concentric
// with the buttons), its two ends `ro`.
export type EdgeBay = { top: number; bottom: number; w: number; ri: number; ro: number };

export function stairNotchPath(
  w: number,
  h: number,
  { n1w, n1h, n2w, n2h, r, ri, shape = 'squircle', bay }: {
    n1w: number; n1h: number; n2w: number; n2h: number; r: number; ri: number; shape?: CornerShape; bay?: EdgeBay;
  },
): string {
  const k = (x: number, y: number, rr: number, s: CornerShape = shape): Corner => ({ x, y, r: rr, shape: s });
  const x1 = Math.max(0, Math.min(n1w, w));
  const x2 = Math.max(0, Math.min(n2w, w));
  const y1 = Math.max(0, Math.min(n1h, h));
  const y2 = Math.max(y1, Math.min(n1h + n2h, h));
  // the left-edge bay, between the card's bottom-left corner and the notch
  const left: Corner[] = [];
  if (bay && bay.w > 0) {
    const bt = Math.max(y2, Math.min(bay.top, h));
    const bb = Math.max(bt, Math.min(bay.bottom, h));
    const bw = Math.min(bay.w, w);
    if (bb - bt > 0.5) {
      left.push(k(0, bb, bay.ro, 'round'), k(bw, bb, bay.ri, 'round'), k(bw, bt, bay.ri, 'round'), k(0, bt, bay.ro, 'round'));
    }
  }
  if (x2 >= x1 - 0.5) {
    const x = Math.max(x1, x2);
    return cornerPath([k(x, 0, r), k(w, 0, r), k(w, h, r), k(0, h, r), ...left, k(0, y2, r), k(x, y2, ri, 'round')]);
  }
  return cornerPath([
    k(x1, 0, r), k(w, 0, r), k(w, h, r), k(0, h, r), ...left, k(0, y2, r),
    k(x2, y2, ri, 'round'), k(x2, y1, ri, 'round'), k(x1, y1, ri, 'round'),
  ]);
}

// w/h: the card's border box. nw/nh: the notch's width/height. r: the
// card's own corner radius, in its corner `shape`. nr: the notch's two
// outer ends (same shape). nf: its inner corner — always a circular arc,
// concentric with the round end of what sits in the notch.
export function notchPath(
  w: number,
  h: number,
  { nw, nh, r, nr, nf, side, shape = 'squircle' }: {
    nw: number; nh: number; r: number; nr: number; nf: number; side: 'left' | 'right'; shape?: CornerShape;
  },
): string {
  const k = (x: number, y: number, rr: number, s: CornerShape = shape): Corner => ({ x, y, r: rr, shape: s });
  return cornerPath(side === 'left'
    ? [k(0, 0, r), k(w, 0, r), k(w, h, r), k(nw, h, nr), k(nw, h - nh, nf, 'round'), k(0, h - nh, nr)]
    : [k(0, 0, r), k(w, 0, r), k(w, h - nh, nr), k(w - nw, h - nh, nf, 'round'), k(w - nw, h, nr), k(0, h, r)]);
}
