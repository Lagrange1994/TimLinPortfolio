import { describe, it, expect } from 'vitest';
import { heroFramePath, notchPatchPath, FRAME_RADIUS } from '../src/utils/heroFramePath';

// Pulls every coordinate pair out of a path string, in order.
function points(d: string): Array<[number, number]> {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const out: Array<[number, number]> = [];
  // Walk command by command so arc flags/radii aren't mistaken for points.
  const cmds = d.match(/[MLACZ][^MLACZ]*/g) ?? [];
  let i = 0;
  for (const cmd of cmds) {
    const count = (cmd.match(/-?\d+(?:\.\d+)?/g) ?? []).length;
    const slice = nums.slice(i, i + count);
    i += count;
    // A takes rx ry rot large sweep x y — only the trailing pair is a point.
    const tail = cmd[0] === 'A' ? slice.slice(5) : slice;
    for (let j = 0; j + 1 < tail.length; j += 2) out.push([tail[j], tail[j + 1]]);
  }
  return out;
}

describe('heroFramePath', () => {
  const W = 1392;
  const H = 852;

  it('closes the path back on its start point', () => {
    const d = heroFramePath(W, H);
    expect(d.trim().endsWith('Z')).toBe(true);
    const pts = points(d);
    expect(pts[0]).toEqual(pts[pts.length - 1]);
  });

  it('keeps every point inside the panel box', () => {
    for (const [x, y] of points(heroFramePath(W, H))) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(W);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(H);
    }
  });

  it('is 180°-symmetric — every point has a partner mirrored through the centre', () => {
    const pts = points(heroFramePath(W, H));
    const key = (x: number, y: number) => `${x.toFixed(2)},${y.toFixed(2)}`;
    const seen = new Set(pts.map(([x, y]) => key(x, y)));
    for (const [x, y] of pts) {
      expect(seen.has(key(W - x, H - y))).toBe(true);
    }
  });

  it('clamps the corner radius so it can never exceed half the shorter side', () => {
    // 60px tall panel: a 48px radius would overrun, so both arcs must drop to 30.
    const d = heroFramePath(400, 60);
    const arcs = d.match(/A (\d+(?:\.\d+)?) /g) ?? [];
    expect(arcs.length).toBe(2);
    for (const a of arcs) expect(Number(a.slice(2))).toBeLessThanOrEqual(30);
  });

  it('uses the full radius when there is room for it', () => {
    const d = heroFramePath(W, H);
    expect(d).toContain(`A ${FRAME_RADIUS} ${FRAME_RADIUS} 0 0 0`);
  });

  it('leaves the notches unclamped at real desktop widths', () => {
    // The top-left notch meets the top edge at x=605 and the left edge at
    // y=114 — the seam the #bg-notch-tl patch is clipped to. If either got
    // clamped the stroke would stop tracing that patch's edge.
    const d = heroFramePath(W, H);
    expect(d).toContain('L 605 0');
    expect(d).toContain('M 0 114');
  });

  it('sizes each notch independently from its own flat width', () => {
    // A narrower top-left (short logo) and a wider bottom-right (long
    // ask-strip labels) than the 605 default — the two notches must not
    // move together.
    const d = heroFramePath(W, H, FRAME_RADIUS, 300, 500);
    expect(d).toContain('L 300 0'); // top-left notch meets the top edge at x=300
    expect(d).toContain(`L ${W - 500} ${H}`); // bottom-right meets the bottom edge at w-500
  });

  it('floors a notch at its own depth so the S-bend never inverts', () => {
    // A flat narrower than the fixed depth (114) would make the straight
    // run between the two end fillets negative-length and self-intersect.
    const d = heroFramePath(W, H, FRAME_RADIUS, 10, 605);
    expect(d).toContain('L 114 0');
  });
});

describe('notchPatchPath', () => {
  const TL_605 = 'M 0 0 L 629 0 L 629 24 C 608.01 24 591 41.01 591 62 C 591 82.99 573.99 100 553 100 L 62 100 C 41.01 100 24 117.01 24 138 L 24 0 Z';
  const BR_605 = 'M 629 138 L 0 138 L 0 114 C 20.99 114 38 96.99 38 76 C 38 55.01 55.01 38 76 38 L 567 38 C 587.99 38 605 20.99 605 0 L 605 138 Z';

  it('matches the original hardcoded tl patch exactly at the default 605 flat width', () => {
    expect(notchPatchPath(605, 'tl')).toBe(TL_605);
  });

  it('matches the original hardcoded br patch exactly at the default 605 flat width', () => {
    expect(notchPatchPath(605, 'br')).toBe(BR_605);
  });

  it('shrinks the patch box to a narrower flat width', () => {
    // Patch width = flat + FRAME_INSET(24); a 300-wide flat gives a 324-wide box.
    const d = notchPatchPath(300, 'tl');
    expect(d.startsWith('M 0 0 L 324 0')).toBe(true);
  });

  it('closes the shape and stays inside its own patch box for both corners', () => {
    const flat = 450;
    const pw = flat + 24; // FRAME_INSET
    const ph = 138; // NOTCH_DEPTH(114) + FRAME_INSET(24)
    for (const corner of ['tl', 'br'] as const) {
      const d = notchPatchPath(flat, corner);
      expect(d.trim().endsWith('Z')).toBe(true);
      for (const n of d.match(/-?\d+(?:\.\d+)?/g) ?? []) {
        const v = Number(n);
        // Every coordinate is either an x (0..pw) or a y (0..ph); a value
        // outside [0, max(pw,ph)] would mean the shape leaked outside its box.
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(Math.max(pw, ph));
      }
    }
  });
});
