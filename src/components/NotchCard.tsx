import { useEffect, useId, useRef, type ReactNode } from 'react';
import { notchPath } from '../utils/notchPath';

// Gap between the notch's edge and what sits in it, and the radius of the
// notch's two outer ends.
const NOTCH_GAP = 10;
const NOTCH_END_RADIUS = 18;

// A card with a notch cut out of a bottom corner (left by default, or
// right), where its tags or action button sit. Built like My Portfolio's
// wall: one outline path (utils/notchPath.ts) clips the card
// (clip-path: path(), via --notch-clip on the wrapper so the card's own
// entrance animation can't wipe it) and is stroked as the card's border,
// so the border runs unbroken round the notch. What sits in the notch lives
// outside the card (the clip would hide it); its measured size sizes the
// notch, and its round end sets the notch's inner corner so the two share
// a centre. Used by About's bento cards and Contact's LINE banner /
// open-for-work strip.
export default function NotchCard({ area, className, notch, children, side = 'left', shadow = true }: {
  area: string;
  className: string;
  notch: ReactNode;
  children: ReactNode;
  side?: 'left' | 'right';
  // About's sibling hover-shadow span (.bento-shadow)
  shadow?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const tags = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const outline = useRef<SVGPathElement>(null);
  const ring = useRef<SVGPathElement>(null);
  const glow = useRef<SVGRadialGradientElement>(null);
  const glowId = `notch-ring-${useId().replace(/:/g, '')}`;
  useEffect(() => {
    const w = wrap.current, c = card.current, el = tags.current, s = svg.current, p = outline.current;
    const rg = ring.current, g = glow.current;
    if (!w || !c || !el || !s || !p || !rg || !g) return;
    const sync = () => {
      const tw = el.offsetWidth, th = el.offsetHeight;
      w.style.setProperty('--tw', tw + 'px');
      w.style.setProperty('--th', th + 'px');
      // the round end facing the notch's inner corner: the tags' tray, or
      // the lone action button
      const first = el.firstElementChild as HTMLElement | null;
      const pill = first?.classList.contains('about-proof-tag') ? el : first;
      const pr = pill ? Math.min(parseFloat(getComputedStyle(pill).borderTopRightRadius) || 0, pill.offsetHeight / 2) : 14;
      w.style.setProperty('--pr', pr + 'px');

      const cs = getComputedStyle(c);
      // the exact (fractional) border box: offsetWidth/Height round, which
      // left the path up to half a pixel short of the bottom/right edge
      const cw = parseFloat(cs.width) || c.offsetWidth, ch = parseFloat(cs.height) || c.offsetHeight;
      if (!cw || !ch || !tw) return;
      // the card's own corner shape (squircle on desktop, round on phones;
      // round wherever corner-shape isn't supported, like the CSS itself)
      const cornerShape = cs.getPropertyValue('corner-top-left-shape') || cs.getPropertyValue('corner-shape');
      const d = notchPath(cw, ch, {
        nw: tw + NOTCH_GAP,
        nh: th + NOTCH_GAP,
        r: parseFloat(cs.borderTopLeftRadius) || 0,
        nr: NOTCH_END_RADIUS,
        nf: pr + NOTCH_GAP,
        side,
        shape: /squircle|superellipse\(2\)/.test(cornerShape) ? 'squircle' : 'round',
      });
      w.style.setProperty('--notch-clip', `path('${d}')`);
      // the outline: the card's own border colour/width (its CSS border is
      // hidden, see .has-notch), or --notch-stroke / --notch-stroke-w for
      // cards whose rim isn't a plain border (the LINE banner)
      const bw = parseFloat(cs.getPropertyValue('--notch-stroke-w')) || parseFloat(cs.borderTopWidth) || 0;
      const color = cs.getPropertyValue('--notch-stroke').trim() || cs.borderTopColor;
      const inset = parseFloat(cs.borderTopWidth) || 0;
      s.style.left = s.style.top = -inset + 'px';
      s.setAttribute('width', String(cw));
      s.setAttribute('height', String(ch));
      p.setAttribute('d', d);
      p.setAttribute('stroke', color);
      // twice the width: the clip keeps only the inner half
      p.setAttribute('stroke-width', String(bw * 2));
      // the cursor ring (what .sc-card::after draws on other cards, with a
      // two-layer mask that can't follow the notch): the same path, stroked
      // with a radial glow that tracks the pointer
      rg.setAttribute('d', d);
      rg.setAttribute('stroke-width', '2');
    };
    const onMove = (e: MouseEvent) => {
      const r = c.getBoundingClientRect();
      g.setAttribute('cx', String(e.clientX - r.left));
      g.setAttribute('cy', String(e.clientY - r.top));
    };
    sync();
    c.addEventListener('mousemove', onMove);
    // border colours change with the theme and on hover
    c.addEventListener('transitionend', sync);
    const mo = typeof MutationObserver === 'undefined' ? null : new MutationObserver(sync);
    mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(sync);
    ro?.observe(el);
    ro?.observe(c);
    return () => {
      ro?.disconnect();
      mo?.disconnect();
      c.removeEventListener('transitionend', sync);
      c.removeEventListener('mousemove', onMove);
    };
  }, [side]);
  const sideClass = side === 'right' ? ' notch-right' : '';
  return (
    <div ref={wrap} className={`about-notch${sideClass} ${area}`}>
      <div ref={card} className={`${className} has-notch`}>
        <svg ref={svg} className="notch-outline" aria-hidden="true">
          <defs>
            <radialGradient ref={glow} id={glowId} gradientUnits="userSpaceOnUse" cx="-500" cy="-500" r="280">
              <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
              <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path ref={outline} fill="none" />
          <path ref={ring} className="notch-ring" fill="none" stroke={`url(#${glowId})`} />
        </svg>
        {children}
      </div>
      {shadow && <span className="bento-shadow" aria-hidden="true" />}
      {/* rises with its card (same trigger), not on its own later band */}
      <div ref={tags} className="about-proof about-notch-tags rise-soft" data-rise-with={`.${area} > .has-notch`}>{notch}</div>
    </div>
  );
}
