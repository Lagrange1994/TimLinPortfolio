/**
 * Fixed-radius squircle path for a W×H box — unlike a plain superellipse
 * (which scales the whole curve proportionally to box size), this keeps a
 * constant corner radius R with straight edges in between, just like
 * border-radius, but with continuous (squircle) curvature instead of a
 * circular arc.
 */
export function squircleRectPath(
  w: number, h: number, radius: number, n = 5, steps = 12, offsetX = 0, offsetY = 0,
): string {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const pts: [number, number][] = [];

  function corner(cx: number, cy: number, sx: number, sy: number, t0: number, t1: number) {
    for (let i = 0; i <= steps; i++) {
      const t = t0 + (t1 - t0) * (i / steps);
      const x = cx + sx * r * Math.abs(Math.cos(t)) ** (2 / n);
      const y = cy + sy * r * Math.abs(Math.sin(t)) ** (2 / n);
      pts.push([x, y]);
    }
  }

  pts.push([r, 0]);
  pts.push([w - r, 0]);
  corner(w - r, r, 1, -1, Math.PI / 2, 0);
  pts.push([w, h - r]);
  corner(w - r, h - r, 1, 1, 0, Math.PI / 2);
  pts.push([r, h]);
  corner(r, h - r, -1, 1, Math.PI / 2, Math.PI);
  pts.push([0, r]);
  corner(r, r, -1, -1, Math.PI, Math.PI / 2);

  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p[0] + offsetX).toFixed(2)} ${(p[1] + offsetY).toFixed(2)}`).join(' ') + ' Z';
}

/**
 * A squircle-cornered ring mask (outer edge minus an inset inner edge, both
 * using the same fixed-radius squircle curve) encoded as a CSS mask-image
 * data URI. Used for hover glow rings on squircle-clipped cards — the
 * content-box/border-box mask-composite trick only understands border-radius
 * geometry, so it can't trace a squircle curve; this bakes both edges as
 * explicit paths instead, combined with fill-rule="evenodd".
 */
export function squircleRingMaskUrl(w: number, h: number, radius: number, thickness = 2): string {
  const outer = squircleRectPath(w, h, radius);
  const innerR = Math.max(radius - thickness, 0);
  const innerW = Math.max(w - thickness * 2, 0);
  const innerH = Math.max(h - thickness * 2, 0);
  const inner = squircleRectPath(innerW, innerH, innerR, 5, 12, thickness, thickness);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
    + `<path fill-rule="evenodd" fill="#fff" d="${outer} ${inner}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
