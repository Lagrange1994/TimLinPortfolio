import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { useLang } from '../context/LangContext';
import { PROJECTS } from '../data/projects';
import { squircleRectPath, squircleRingMaskUrl } from '../utils/squircle';
import { portfolioWallMaskPath, DEFAULT_RADIUS, computeWallHeight } from '../utils/portfolioMask';
import { scrollToSectionAligned } from '../utils/navHeader';
import gsap from 'gsap';

const SMOOTH_TAU = 0.18;
// Spring tuning matches animata.design's Fluid Tabs indicator (see the FAQ tabs in ContactSection.tsx).
const FILTER_TAB_INDICATOR_SPRING = { type: 'spring' as const, stiffness: 380, damping: 34, mass: 0.75 };
// Matches How I Use AI's card corner radius (.ai-card) so the squircle reads
// consistently across sections instead of scaling with each card's box size.
const CARD_CORNER_RADIUS = 44;
// Breathing room around the headline/subtitle text inside the wall outline's
// top-left notches, so the rounded corners don't cut in right at the glyphs.
const NOTCH_PADDING = 16;
// Tighter padding under the subtitle specifically — that notch's bottom
// should hug the subtitle closer than the other notch edges. Paired with
// NOTCH2_TURN_RADIUS in portfolioMask.ts, which shrinks that turn's corner
// radius to match so the curve itself doesn't eat into the smaller gap.
const NOTCH2_BOTTOM_PADDING = 6;
// Padding above and to the left of the "View All Projects" button inside the
// bottom-right leg gap, so the notch tracks the button's own live
// width/height instead of a fixed ratio while still leaving it room to
// breathe. Shared by both sides (not a separate top value) so the leg gap's
// top-left corner can be made concentric with the button's own pill corner
// below — concentric circles only line up when the gap is equal on both
// straight edges, not just one.
const LEG_GAP_PADDING = 12;

function createPortfolioScroller(row: HTMLElement, normalSpeed: number, hoverSpeed: number) {
  const inner = row.querySelector<HTMLElement>('.scroller-inner');
  if (!inner) return;
  if (row.getAttribute('data-raf-init') === 'true') return;
  // Row is hidden (e.g. portfolio restored to "expanded" view on mount) —
  // offsetWidth would be 0, breaking the wrap-around math. Retry once visible.
  if (row.offsetWidth === 0) return;
  const isReverse = row.getAttribute('data-direction') === 'right';

  const origItems = Array.from(inner.children) as HTMLElement[];
  const gap = parseFloat(getComputedStyle(inner).gap) || 10;
  const oneSetWidth = origItems.reduce((sum, el) => sum + el.offsetWidth + gap, 0);
  if (oneSetWidth <= 0) return;

  // Clone enough full sets to cover the row's width — a single clone (2x
  // content) isn't enough once the row is wider than 2 sets of cards
  // (e.g. the full-bleed wall), which left a blank gap before the looped
  // content scrolled back into view.
  const setsToAdd = Math.max(1, Math.ceil(row.offsetWidth / oneSetWidth));
  for (let s = 0; s < setsToAdd; s++) {
    origItems.forEach(item => {
      const clone = item.cloneNode(true) as HTMLElement;
      clone.setAttribute('aria-hidden', 'true');
      inner.appendChild(clone);
    });
  }
  row.setAttribute('data-raf-init', 'true');

  function startRAF() {
    let offset = 0, velocity = normalSpeed, targetVelocity = normalSpeed, lastTs: number | null = null;
    const direction = isReverse ? -1 : 1;

    function tick(ts: number) {
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      velocity += (targetVelocity - velocity) * (1 - Math.exp(-dt / SMOOTH_TAU));
      offset += velocity * dt * direction;
      offset = ((offset % oneSetWidth) + oneSetWidth) % oneSetWidth;
      inner!.style.transform = `translateX(${-offset}px)`;
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    row.addEventListener('mouseenter', () => { targetVelocity = hoverSpeed; });
    row.addEventListener('mouseleave', () => { targetVelocity = normalSpeed; });
  }

  startRAF();
}

function getBentoBigIndices(total: number) {
  const a = Math.floor(Math.random() * Math.floor(total / 2));
  const b = Math.floor(total / 2) + Math.floor(Math.random() * Math.ceil(total / 2));
  return [a, b];
}

const bentoBigIndices = getBentoBigIndices(PROJECTS.length);
// The infinite scroller wall clones cards with plain DOM cloneNode (see
// createPortfolioScroller) — clones aren't React-managed, so their
// data-title never updates when the language changes. Keyed by href
// (identical on the original and every clone) so hover text can be
// re-derived from the live translation table instead of a stale attribute.
const projectsByLink = new Map(PROJECTS.map(p => [p.link, p]));

export default function PortfolioSection() {
  const { t, lang } = useLang();
  const [expanded, setExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const scrollerInitRef = useRef(false);
  const wallOutlinePathRef = useRef<SVGPathElement | null>(null);
  // The wall's top/height are measured once (see the wall-geometry effect
  // below) and then locked — re-measuring on every resize is what caused the
  // address-bar-driven svh jitter this replaces.
  const wallGeometryLockedRef = useRef(false);

  // MagicBento cleanup refs
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const moveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const leaveHandlerRef = useRef<(() => void) | null>(null);
  const gridLeaveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const currentCardRef = useRef<HTMLElement | null>(null);

  const MB_RADIUS = 170;

  function destroyMagicBento() {
    if (spotlightRef.current) { spotlightRef.current.remove(); spotlightRef.current = null; }
    if (moveHandlerRef.current) { document.removeEventListener('mousemove', moveHandlerRef.current); moveHandlerRef.current = null; }
    if (leaveHandlerRef.current) { document.removeEventListener('mouseleave', leaveHandlerRef.current); leaveHandlerRef.current = null; }
    const g = document.getElementById('portfolio-grid');
    if (g && gridLeaveHandlerRef.current) g.removeEventListener('mouseleave', gridLeaveHandlerRef.current);
    gridLeaveHandlerRef.current = null;
    currentCardRef.current = null;
  }

  const initMagicBento = useCallback(() => {
    destroyMagicBento();
    const grid = document.getElementById('portfolio-grid');
    if (!grid || grid.style.display === 'none') return;

    grid.querySelectorAll<HTMLElement>('.grid-card').forEach(c => {
      c.classList.add('mb-glow');
      c.style.transformOrigin = '50% 50%';
    });

    const sl = document.createElement('div');
    sl.className = 'mb-spotlight';
    document.body.appendChild(sl);
    spotlightRef.current = sl;

    const proximity = MB_RADIUS * 0.5;
    const fadeDistance = MB_RADIUS * 0.75;

    function updateGlow(card: HTMLElement, mx: number, my: number, intensity: number) {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--glow-x', `${((mx - r.left) / r.width * 100).toFixed(1)}%`);
      card.style.setProperty('--glow-y', `${((my - r.top) / r.height * 100).toFixed(1)}%`);
      card.style.setProperty('--glow-intensity', intensity.toFixed(3));
      card.style.setProperty('--glow-radius', `${MB_RADIUS}px`);
    }

    function resetCard(card: HTMLElement) {
      gsap.to(card, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      card.style.setProperty('--glow-intensity', '0');
    }

    moveHandlerRef.current = (e: MouseEvent) => {
      const section = document.getElementById('portfolio');
      if (!section) return;
      const sr = section.getBoundingClientRect();
      const inSection = e.clientX >= sr.left && e.clientX <= sr.right && e.clientY >= sr.top && e.clientY <= sr.bottom;

      const cards = grid.querySelectorAll<HTMLElement>('.grid-card.mb-glow');

      if (!inSection || grid.style.display === 'none') {
        gsap.to(sl, { opacity: 0, duration: 0.3, ease: 'power2.out' });
        cards.forEach(c => c.style.setProperty('--glow-intensity', '0'));
        return;
      }

      gsap.to(sl, { left: e.clientX, top: e.clientY, duration: 0.12, ease: 'power2.out' });

      let minDist = Infinity;
      cards.forEach(card => {
        const r = card.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const d = Math.max(0, Math.hypot(e.clientX - cx, e.clientY - cy) - Math.max(r.width, r.height) / 2);
        minDist = Math.min(minDist, d);
        const gi = d <= proximity ? 1 : d <= fadeDistance ? (fadeDistance - d) / (fadeDistance - proximity) : 0;
        updateGlow(card, e.clientX, e.clientY, gi);
      });

      const targetOp = minDist <= proximity ? 0.8 : minDist <= fadeDistance ? ((fadeDistance - minDist) / (fadeDistance - proximity)) * 0.8 : 0;
      gsap.to(sl, { opacity: targetOp, duration: targetOp > 0 ? 0.2 : 0.5, ease: 'power2.out' });

      const hovered = (e.target as HTMLElement).closest?.('.grid-card.mb-glow') as HTMLElement | null;
      if (currentCardRef.current && currentCardRef.current !== hovered) resetCard(currentCardRef.current);
      if (hovered) {
        currentCardRef.current = hovered;
        const r = hovered.getBoundingClientRect();
        const lx = e.clientX - r.left, ly = e.clientY - r.top;
        const cx = r.width / 2, cy = r.height / 2;
        gsap.to(hovered, {
          x: (lx - cx) * 0.05,
          y: (ly - cy) * 0.05,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    };

    leaveHandlerRef.current = () => {
      gsap.to(sl, { opacity: 0, duration: 0.35, ease: 'power2.out' });
      grid.querySelectorAll<HTMLElement>('.grid-card.mb-glow').forEach(resetCard);
      currentCardRef.current = null;
    };

    gridLeaveHandlerRef.current = (e: MouseEvent) => {
      if (!e.relatedTarget || !grid.contains(e.relatedTarget as Node)) {
        if (currentCardRef.current) { resetCard(currentCardRef.current); currentCardRef.current = null; }
      }
    };

    document.addEventListener('mousemove', moveHandlerRef.current);
    document.addEventListener('mouseleave', leaveHandlerRef.current);
    grid.addEventListener('mouseleave', gridLeaveHandlerRef.current);
  }, []);

  // Init portfolio scrollers after render
  useEffect(() => {
    const initScrollers = () => {
      document.querySelectorAll<HTMLElement>('.portfolio-row').forEach(s => {
        createPortfolioScroller(s, 40, 12);
      });
    };
    if (!scrollerInitRef.current) {
      if (document.fonts) {
        document.fonts.ready.then(initScrollers);
      } else {
        window.addEventListener('load', initScrollers, { once: true });
      }
      scrollerInitRef.current = true;
    }
    // Row 4 only becomes visible via a CSS breakpoint (tablet/mobile widths),
    // not a JS state change — resizing across that breakpoint without a full
    // reload would otherwise leave it permanently un-initialized since the
    // first measurement at desktop width found offsetWidth 0 and bailed out.
    window.addEventListener('resize', initScrollers);
    return () => window.removeEventListener('resize', initScrollers);
  }, [lang]);

  // Notched shape for the carousel wall (see src/utils/portfolioMask.ts) —
  // clipped onto .portfolio-wall itself (the OUTER, untransformed box), not
  // onto .portfolio-wall-inner (which carries the tilt). clip-path is
  // computed in the element's own untransformed coordinate space, so
  // clipping the tilted rows via this outer box keeps the shape's own edges
  // straight; clipping the skewed inner element directly would drag its
  // transform into the clip and turn straight edges diagonal. A stroked SVG
  // path is drawn on top of the same geometry for a crisp edge. The two
  // top-left notches and the bottom-right gap track the LIVE rendered size
  // of the headline title/label, subtitle, and "View All Projects" button
  // (per the Figma annotations), not a fixed ratio, so language switches,
  // font loading, and wrapping all need a re-measure.
  useEffect(() => {
    const section = document.getElementById('portfolio');
    const wall = document.getElementById('portfolio-scroller-desktop');
    // The positioned ancestor that actually carries the wall's on-page
    // offset (see the .portfolio-wall-frame/.rise-soft split above the JSX
    // below) — .portfolio-wall itself now just fills this at 100%, so any
    // top/marginTop this effect writes or reads has to target the frame,
    // not the wall.
    const frame = document.querySelector<HTMLElement>('.portfolio-wall-frame');
    const pathEl = wallOutlinePathRef.current;
    const label = document.querySelector<HTMLElement>('#portfolio .section-label');
    const title = document.querySelector<HTMLElement>('.portfolio-headline-title');
    const sub = document.querySelector<HTMLElement>('.portfolio-headline-sub');
    const viewAllBtn = document.getElementById('toggle-portfolio-view');
    const viewAllRow = document.querySelector<HTMLElement>('.view-all-row');
    if (!section || !wall || !frame || !pathEl || !label || !title || !sub || !viewAllBtn || !viewAllRow) return;

    function apply() {
      // Expanded (bento grid) mode hides the wall entirely, so none of this
      // geometry applies — .view-all-row falls back to normal document flow
      // via the .portfolio-expanded CSS override. Clear the inline
      // top/right/width this same function sets below, or they'd survive as
      // leftover offsets on top of that flow position (inline styles beat
      // any stylesheet rule regardless of selector), pushing the button off
      // toward wherever the wall last measured before collapsing to 0.
      if (expanded) {
        viewAllRow!.style.top = '';
        viewAllRow!.style.right = '';
        viewAllRow!.style.width = '';
        return;
      }
      const w = wall!.clientWidth;
      const h = wall!.clientHeight;
      if (w <= 0 || h <= 0) return;
      const sectionRect = section!.getBoundingClientRect();
      const labelRect = label!.getBoundingClientRect();
      // Mobile pins the wall's top edge flush with the "My Portfolio"
      // eyebrow's own live position instead of the position/height-lock
      // effect's symmetric viewport-centering formula, so the notch cut for
      // the label/title (sized right below) actually lines up with where
      // that text sits rather than floating independently. Desktop/tablet
      // don't pin to the label — they read back whatever top that other
      // effect already locked in.
      const isMobileBreakpoint = window.matchMedia('(max-width: 767px)').matches;
      let wallTopPx: number;
      if (isMobileBreakpoint) {
        wallTopPx = labelRect.top - sectionRect.top;
        frame!.style.top = `${wallTopPx}px`;
        frame!.style.marginTop = '0px';
      } else {
        wallTopPx = parseFloat(frame!.style.top) || 0;
      }
      // Measure notch extents as offsets from the wall's own top-left corner
      // (not each text element's own width/height) so the left inset before
      // the label/title/subtitle, and the full vertical run from the wall's
      // top edge down through each line, are both folded in — otherwise the
      // notch undershoots by exactly that left offset and clips the text.
      const wallRect = wall!.getBoundingClientRect();
      const titleRect = title!.getBoundingClientRect();
      const subRect = sub!.getBoundingClientRect();
      const notch1Right = Math.max(labelRect.right, titleRect.right);
      const notch1W = (notch1Right - wallRect.left) + NOTCH_PADDING;
      const notch1H = (titleRect.bottom - wallRect.top) + NOTCH_PADDING;
      const notch2W = (subRect.right - wallRect.left) + NOTCH_PADDING;
      const notch2H = (subRect.bottom - titleRect.bottom) + NOTCH2_BOTTOM_PADDING;
      const btnRect = viewAllBtn!.getBoundingClientRect();
      // On tablet AND mobile, the wall's bottom-right corner (where the
      // button sits) lands under the fixed #back-to-top / #chat-fab stack
      // (both right-anchored, stacked at the viewport's bottom-right at
      // every width below desktop — see portfolio.css). Instead of a
      // guessed magic-number push, measure #back-to-top's own live footprint
      // (both share the same width/right as #chat-fab at any given
      // breakpoint, so covering one covers both) and derive exactly how much
      // further the notch — and the button inside it — need to move: the
      // back-to-top button's own width plus its own live gap from the
      // viewport edge (its rendered `right` offset). Subtracting the wall's
      // own live side-inset (window width minus wallRect.right) cancels out
      // that inset from the resulting gap — without it, the two buttons'
      // gap would end up equal to the wall's own inset by coincidence, not
      // by design — then LEG_GAP_PADDING adds back exactly the gap actually
      // wanted: the same padding already used above the button on its own
      // left side.
      const needsFixedUiAvoidance = window.matchMedia('(max-width: 1024px)').matches;
      let btnExtraPush = 0;
      if (needsFixedUiAvoidance) {
        const backToTop = document.getElementById('back-to-top');
        if (backToTop) {
          const backToTopRect = backToTop.getBoundingClientRect();
          const backToTopRightPadding = window.innerWidth - backToTopRect.right;
          const wallInsetPx = window.innerWidth - wallRect.right;
          btnExtraPush = backToTopRect.width + backToTopRightPadding + LEG_GAP_PADDING - wallInsetPx;
        }
      }
      const legGapH = btnRect.height + LEG_GAP_PADDING;
      // Widened by the same push moving the button left below, so the notch
      // still fully contains it instead of clipping its now-further-left
      // edge — otherwise this and rowRightPx's push would disagree about
      // where the button actually ends up.
      const legGapW = btnRect.width + LEG_GAP_PADDING + btnExtraPush;
      // The button is a pill (borderRadius: 9999px), so its own rendered
      // corner radius is just half its (shorter) height. Concentric with the
      // leg gap's top-left corner requires that corner's radius to be the
      // button's radius plus the (now-equal) top/left gap — otherwise the
      // two curves share a center only by coincidence, not by construction.
      const legTopRadius = btnRect.height / 2 + LEG_GAP_PADDING;
      // Mobile's outline reads better with a tighter corner radius than
      // desktop/tablet share — half the default, scaling the subtitle-notch
      // and leg-bottom turns down with it (see portfolioMask.ts).
      const radius = isMobileBreakpoint ? DEFAULT_RADIUS / 2 : DEFAULT_RADIUS;
      // On desktop, the headline's own top-right corner (above the subtitle
      // notch entirely) matches the shared `radius` already (40px on
      // desktop) — see portfolioMask.ts.
      const isDesktopBreakpoint = window.matchMedia('(min-width: 1025px)').matches;
      // On mobile, the subtitle notch's own bottom-right corner matches
      // legTopRadius — the same radius already used for the leg gap's
      // top-left corner, which traces the OUTSIDE of the button's own
      // rounded corner (button radius + LEG_GAP_PADDING), not the button's
      // bare radius alone.
      const notch2BottomRadius = isDesktopBreakpoint ? 40 : isMobileBreakpoint ? legTopRadius : undefined;
      const d = portfolioWallMaskPath(w, h, notch1W, notch1H, notch2W, notch2H, legGapH, legGapW, radius, legTopRadius, undefined, notch2BottomRadius);
      pathEl!.setAttribute('d', d);
      wall!.style.clipPath = `path('${d}')`;
      // Flush the button's own bottom edge against the wall's actual bottom
      // edge. Built from wallTopPx + h (the same values just used to place
      // the wall itself), not a fresh getBoundingClientRect() on the wall —
      // .portfolio-wall-frame carries its own .rise-soft entrance animation
      // (translateY via GSAP), which ResizeObserver can't see since it's a
      // transform, not a box-size change; re-reading the rect here could
      // catch it mid-animation and freeze a stale offset (the old fixed
      // "-40" formula this replaces was also tuned for the button's old,
      // much smaller height and no longer lined up once it scales with
      // btnRect.height).
      const rowTopPx = (wallTopPx + h) - btnRect.height;
      viewAllRow!.style.top = `${rowTopPx}px`;
      // Flush against the wall's own right edge, hugging the button's own
      // width instead of a fixed 40% row. Measured live from wallRect/
      // sectionRect (both already computed above) rather than assuming the
      // wall's static WALL_SIDE_PADDING inset — .view-all-row and the wall
      // share the same containing block (#portfolio), so this stays flush
      // with wherever the wall's own right edge actually lands, even if its
      // CSS inset formula ever drifts from this constant.
      const rowRightPx = (sectionRect.right - wallRect.right) + btnExtraPush;
      viewAllRow!.style.right = `${rowRightPx}px`;
      viewAllRow!.style.width = 'max-content';
    }

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(section);
    ro.observe(wall);
    ro.observe(label);
    ro.observe(title);
    ro.observe(sub);
    ro.observe(viewAllBtn);
    // label/title/sub/frame all carry .rise-soft (see useRiseReveal.ts),
    // which animates a GSAP translateY transform on scroll-into-view —
    // invisible to ResizeObserver since it's not a box-size change. Without
    // this, every measurement above can get taken mid-animation (or before
    // it even starts, if the section hasn't scrolled into view yet at
    // mount) and never gets recomputed once it settles.
    section.addEventListener('rise-settled', apply);
    return () => {
      ro.disconnect();
      section.removeEventListener('rise-settled', apply);
    };
  }, [lang, expanded]);

  // Desktop/tablet: vertically centres the wall in the space below the fixed
  // navbar (and above any safe-area inset) — the gap from the navbar down to
  // the wall's top edge and the gap from the wall's bottom edge down to the
  // viewport's bottom edge come out equal, both folded into the wall's own
  // `top` offset from the section's top edge (the section lands flush
  // against the navbar once scrolled to, so the wall's real distance from
  // the navbar is exactly that `top` offset). Height is the row stack's
  // natural height, capped to whatever's left once that symmetric gap comes
  // out of the available space.
  // Mobile keeps its own, older rule instead: the geometry effect above pins
  // the wall's top to the label's live position (so the header notch lines
  // up with the text), and this effect only locks the HEIGHT, capped to
  // whatever room is left once that already-pinned top offset is mirrored as
  // bottom breathing room too — not solved for symmetric centering, since
  // the top itself isn't this effect's to set on mobile.
  // Both cases measure once, on first render (once the user has scrolled
  // into the section, not at raw page mount, where the navbar is still in
  // its taller unscrolled state and understates how much of the screen it
  // eats) via an IntersectionObserver (not the 'rise-settled' GSAP event
  // other effects here use, since prefers-reduced-motion visitors skip
  // GSAP's ScrollTrigger setup and never dispatch it), then locked —
  // re-measuring on every resize is exactly the address-bar-driven jitter
  // the codebase already works around elsewhere (see the svh-vs-dvh
  // comments on .portfolio-wall in portfolio.css).
  useEffect(() => {
    const wall = document.querySelector<HTMLElement>('.portfolio-wall');
    // Owns the wall's on-page top/height now (see the .portfolio-wall-frame
    // comment by the JSX below) — .portfolio-wall fills it at 100% instead
    // of positioning itself.
    const frame = document.querySelector<HTMLElement>('.portfolio-wall-frame');
    const inner = document.querySelector<HTMLElement>('.portfolio-wall-inner');
    const section = document.getElementById('portfolio');
    if (!wall || !frame || !inner || !section) return;

    function measureContentHeight(): number {
      const rows = Array.from(inner!.querySelectorAll<HTMLElement>('.portfolio-row'))
        .filter(r => r.offsetHeight > 0);
      if (rows.length === 0) return 0;
      const gap = parseFloat(getComputedStyle(inner!).gap) || 0;
      return rows.reduce((sum, r) => sum + r.offsetHeight, 0) + gap * (rows.length - 1);
    }

    function measureAvailableHeight(): number {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed; visibility:hidden; pointer-events:none; height:calc(100svh - var(--nav-h, 72px) - env(safe-area-inset-bottom, 0px));';
      document.body.appendChild(probe);
      const availablePx = probe.getBoundingClientRect().height;
      probe.remove();
      return availablePx;
    }

    // frame.style.top here is whatever the geometry effect above already
    // pinned to the label's position — mirrored as bottom breathing room too
    // so the wall reads as evenly framed within the section.
    function measureMobileCapPx(): number {
      const wallTopOffset = parseFloat(frame!.style.top) || 0;
      const probe = document.createElement('div');
      probe.style.cssText = `position:fixed; visibility:hidden; pointer-events:none; height:calc(100svh - var(--nav-h, 72px) - ${wallTopOffset}px - ${wallTopOffset}px - env(safe-area-inset-bottom, 0px));`;
      document.body.appendChild(probe);
      const capPx = probe.getBoundingClientRect().height;
      probe.remove();
      return capPx;
    }

    function lockWallGeometry() {
      if (wallGeometryLockedRef.current) return;
      const contentHeight = measureContentHeight();
      if (contentHeight <= 0) return;
      if (window.matchMedia('(max-width: 767px)').matches) {
        // Unlike desktop/tablet below, mobile's top is a fixed pin (to the
        // label's position), not derived from the wall's own height — so the
        // only way the bottom gap can come out equal to that fixed top gap
        // is if the wall's height IS the cap, not shrunk to fit whatever
        // content happens to render shorter than it. computeWallHeight's
        // usual min(content, cap) clamp (see portfolioMask.ts) would leave
        // the leftover cap space stranded below the wall instead.
        const capPx = Math.max(0, measureMobileCapPx());
        frame!.style.height = `${capPx}px`;
        // The 4-row stack's natural height (fixed card height + gaps) rarely
        // matches capPx exactly — a shorter stack would just center inside
        // the taller box (leaving dead space above/below instead of filling
        // it), and a taller one would clip a row via overflow:hidden instead
        // of showing all 4 in full. --wall-scale (read by .portfolio-wall-
        // inner's transform, transform-origin 50% 50% so it scales from the
        // box's own center, matching the flex box's justify-content: center)
        // stretches/shrinks the whole row stack — cards and gaps together —
        // to exactly fill capPx, so all 4 rows are always fully visible with
        // no leftover gap.
        inner!.style.setProperty('--wall-scale', contentHeight > 0 ? `${capPx / contentHeight}` : '1');
      } else {
        const availableHeight = measureAvailableHeight();
        const wallHeight = computeWallHeight(contentHeight, availableHeight);
        const topOffset = Math.max(0, (availableHeight - wallHeight) / 2);
        frame!.style.top = `${topOffset}px`;
        frame!.style.marginTop = '0px';
        frame!.style.height = `${wallHeight}px`;
        // Desktop/tablet's wallHeight is already content-fit-capped (see
        // computeWallHeight above), so the row stack matches the box at
        // scale 1 by construction — no stretch/shrink needed here.
        inner!.style.setProperty('--wall-scale', '1');
      }
      wallGeometryLockedRef.current = true;
    }

    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        lockWallGeometry();
        io.disconnect();
      }
    }, { threshold: 0.01 });
    io.observe(section);

    return () => {
      io.disconnect();
    };
  }, [expanded]);

  // Fixed-radius squircle clip-path for project/grid cards. These cards'
  // boxes are responsive (fixed 340x220 vs 260x170 on mobile for
  // .project-card; auto-sized grid cells, including the 2x2 .mb-big span,
  // for .grid-card), so a single static path doesn't fit every size —
  // ResizeObserver recomputes the path whenever a card's actual rendered
  // box changes, keeping the corner radius constant instead of scaling
  // proportionally with the box like a plain superellipse would.
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.project-card, .grid-card');
    if (cards.length === 0) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const { width, height } = entry.contentRect;
        if (width <= 0 || height <= 0) continue;
        el.style.clipPath = `path('${squircleRectPath(width, height, CARD_CORNER_RADIUS)}')`;
        if (el.classList.contains('grid-card')) {
          el.style.setProperty('--ring-mask', squircleRingMaskUrl(width, height, CARD_CORNER_RADIUS, 2));
          // The ripple span (.grid-card-ripple) grows well past the card's
          // own size so its circle can cover every corner — background-size
          // must stay pinned to the card's actual pixel size (not the
          // ripple's own, ever-growing box) or the revealed photo balloons
          // past its real dimensions as the ripple expands.
          el.style.setProperty('--card-w', `${width}px`);
          el.style.setProperty('--card-h', `${height}px`);
        }
      }
    });
    cards.forEach(c => ro.observe(c));
    return () => ro.disconnect();
  }, [lang, expanded, activeFilter]);

  // Restore state on mount
  useEffect(() => {
    const savedExpanded = sessionStorage.getItem('portfolioExpanded');
    const savedFilter = sessionStorage.getItem('portfolioActiveFilter');
    const savedScrollY = sessionStorage.getItem('portfolioScrollY');

    if (savedExpanded === 'true') {
      setExpanded(true);
      if (savedFilter) setActiveFilter(savedFilter);
    }

    if (savedScrollY !== null) {
      sessionStorage.removeItem('portfolioScrollY');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: parseFloat(savedScrollY), behavior: 'instant' });
        });
      });
    }

    // Clear on page reload
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry && navEntry.type === 'reload') {
      sessionStorage.removeItem('portfolioExpanded');
      sessionStorage.removeItem('portfolioScrollY');
      sessionStorage.removeItem('portfolioActiveFilter');
      setExpanded(false);
      setActiveFilter('all');
    }
  }, []);

  // Retry scroller init once it becomes visible (e.g. after folding back from
  // a restored "expanded" state, where init was skipped while hidden)
  useEffect(() => {
    if (expanded) return;
    document.querySelectorAll<HTMLElement>('.portfolio-row').forEach(s => {
      createPortfolioScroller(s, 40, 12);
    });
  }, [expanded]);

  // Cursor-following project info tag for the carousel wall (scroller view)
  // — same pattern as Spline's showcase gallery: a small label tracks the
  // pointer while hovering a card instead of an in-card overlay.
  const hoveredCardRef = useRef<HTMLElement | null>(null);
  const cursorTagTextRef = useRef<HTMLElement | null>(null);
  const cursorTagSubRef = useRef<HTMLElement | null>(null);
  // Always-current translation table for the mount-once listener below —
  // its closure is fixed at mount, so it can't see later `t` values itself.
  const tRef = useRef(t);
  tRef.current = t;

  const getCardTitle = useCallback((card: HTMLElement) => {
    const proj = projectsByLink.get(card.getAttribute('href') || '');
    if (!proj) return card.dataset.title || '';
    return (tRef.current as Record<string, string>)[proj.id + '_title'] || proj.id;
  }, []);

  useEffect(() => {
    const wall = document.getElementById('portfolio-scroller-desktop');
    if (!wall) return;

    const tag = document.createElement('div');
    tag.className = 'cursor-project-tag';
    tag.innerHTML = '<span class="cursor-project-tag-text"></span><span class="cursor-project-tag-sub"></span>';
    document.body.appendChild(tag);
    const textEl = tag.querySelector<HTMLElement>('.cursor-project-tag-text')!;
    const subEl = tag.querySelector<HTMLElement>('.cursor-project-tag-sub')!;
    cursorTagTextRef.current = textEl;
    cursorTagSubRef.current = subEl;

    // Spline drives its hover label straight off mousemove — the tag's
    // `transform` is set to the raw cursor position on every event, and a
    // short CSS transition (not a JS rAF/lerp loop) supplies the smoothing.
    // A JS lerp loop always lags a frame or two behind real input and reads
    // as "slow"; letting the compositor interpolate the transform keeps it
    // glued to the pointer while still looking eased rather than snapping.
    const OFFSET_X = 18, OFFSET_Y = 22;

    function onMove(e: MouseEvent) {
      tag.style.transform = `translate(${e.clientX + OFFSET_X}px, ${e.clientY + OFFSET_Y}px)`;
      const card = (e.target as HTMLElement).closest?.('.project-card') as HTMLElement | null;
      if (card) {
        if (card !== hoveredCardRef.current) {
          hoveredCardRef.current = card;
          textEl.textContent = getCardTitle(card);
          subEl.textContent = card.dataset.sub || '';
          tag.classList.add('visible');
        }
      } else if (hoveredCardRef.current) {
        hoveredCardRef.current = null;
        tag.classList.remove('visible');
      }
    }

    function onLeave() {
      hoveredCardRef.current = null;
      tag.classList.remove('visible');
    }

    wall.addEventListener('mousemove', onMove);
    wall.addEventListener('mouseleave', onLeave);

    return () => {
      wall.removeEventListener('mousemove', onMove);
      wall.removeEventListener('mouseleave', onLeave);
      tag.remove();
      hoveredCardRef.current = null;
      cursorTagTextRef.current = null;
      cursorTagSubRef.current = null;
    };
  }, [getCardTitle]);

  // Re-paint the tag immediately when the language changes instead of
  // waiting for the next mousemove — card is looked up by href through
  // getCardTitle, not read off the hovered DOM node's own attributes,
  // since scroller clones (see createPortfolioScroller) are plain
  // cloneNode copies that React never re-renders with the new text.
  useEffect(() => {
    const card = hoveredCardRef.current;
    if (!card || !cursorTagTextRef.current) return;
    cursorTagTextRef.current.textContent = getCardTitle(card);
  }, [lang, getCardTitle]);

  // Init MagicBento when expanded
  useEffect(() => {
    if (expanded) {
      setTimeout(() => initMagicBento(), 50);
    } else {
      destroyMagicBento();
    }
    return () => destroyMagicBento();
  }, [expanded, initMagicBento]);

  // Hide cards SYNCHRONOUSLY before paint — matches original's
  // `c.style.opacity = '0'` set immediately before `grid.style.display = 'grid'`,
  // preventing a flash of fully-visible content before the entrance animation.
  // Also re-runs on `activeFilter` change: switching filters reveals
  // previously `display:none` cards, which would otherwise flash at full
  // opacity (inherited from the prior animation's `clearProps`) before the
  // 120ms-delayed gsap.fromTo() in the effect below hides and re-animates them.
  useLayoutEffect(() => {
    if (!expanded) return;
    const grid = document.getElementById('portfolio-grid');
    if (!grid) return;
    grid.querySelectorAll<HTMLElement>('.grid-card').forEach(c => {
      const show = activeFilter === 'all' || c.dataset.category === activeFilter;
      if (show) c.style.opacity = '0';
    });
  }, [expanded, activeFilter]);

  // Animate grid cards in
  useEffect(() => {
    if (!expanded) return;
    const grid = document.getElementById('portfolio-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.grid-card')).filter(c => {
      const show = activeFilter === 'all' || c.dataset.category === activeFilter;
      c.style.display = show ? '' : 'none';
      return show;
    });

    setTimeout(() => {
      gsap.killTweensOf('#portfolio-grid .grid-card');
      cards.forEach(c => { c.style.transition = 'none'; });
      gsap.fromTo(cards,
        { y: 60, opacity: 0, filter: 'blur(8px)', scale: 0.95 },
        {
          y: 0, opacity: 1, filter: 'blur(0px)', scale: 1,
          duration: 0.65, ease: 'power3.out', stagger: 0.045,
          clearProps: 'transform,opacity,filter',
          onComplete() { cards.forEach(c => { c.style.transition = ''; }); }
        }
      );
    }, 120);
  }, [expanded, activeFilter]);

  // Save state when clicking project card
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const card = (e.target as HTMLElement).closest('.project-card, .grid-card');
      if (!card) return;
      const grid = document.getElementById('portfolio-grid');
      const isExpanded = grid && grid.style.display === 'grid';
      sessionStorage.setItem('portfolioExpanded', isExpanded ? 'true' : 'false');
      sessionStorage.setItem('portfolioActiveFilter', activeFilter);
      sessionStorage.setItem('portfolioScrollY', String(window.scrollY));
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [expanded, activeFilter]);

  function handleToggle() {
    if (expanded) {
      setExpanded(false);
      sessionStorage.setItem('portfolioExpanded', 'false');
      destroyMagicBento();
      scrollToSectionAligned('portfolio');
    } else {
      const portfolioSec = document.getElementById('portfolio');
      const header = document.getElementById('main-header');
      // Match every other section's scroll-margin-top landing exactly (no
      // extra offset) so "My Portfolio"'s gap to the navbar doesn't shift
      // when expanding into the bento grid.
      const headerOffset = header ? header.offsetHeight : 80;
      const targetScrollY = portfolioSec
        ? portfolioSec.getBoundingClientRect().top + window.pageYOffset - headerOffset
        : 0;

      document.documentElement.style.overflowAnchor = 'none';
      setExpanded(true);
      sessionStorage.setItem('portfolioExpanded', 'true');

      setTimeout(() => {
        window.scrollTo({ top: targetScrollY, behavior: 'instant' });
        setTimeout(() => { document.documentElement.style.overflowAnchor = ''; }, 100);
      }, 50);
    }
  }

  function handleFilter(filter: string) {
    setActiveFilter(filter);
    sessionStorage.setItem('portfolioActiveFilter', filter);
  }

  // Render project card
  function ProjectCard({ p, mode, index }: { p: typeof PROJECTS[0]; mode: 'scroll' | 'grid'; index?: number }) {
    const title = (t as Record<string, string>)[p.id + '_title'] || p.id;
    const desc = (t as Record<string, string>)[p.id + '_desc'] || '';
    const isBig = mode === 'grid' && index !== undefined && bentoBigIndices.includes(index);
    const cls = mode === 'grid' ? `grid-card${isBig ? ' mb-big' : ''}` : 'project-card';
    const categoryLabel = p.category === 'mobile' ? 'Apps Design' : p.category === 'web' ? 'Web Design' : '';
    // Grid cards' hover ripple reveals each project's hero shot — same
    // slug as the project's own page (project_XX.html -> project_XX/), not
    // the curated thumbnail in p.img.
    const heroImg = `./img/${p.link.replace('.html', '')}/hero_img.webp`;
    return (
      <a
        className={cls}
        href={p.link}
        data-category={p.category}
        data-title={title}
        data-sub={categoryLabel}
        onClick={() => {
          sessionStorage.setItem('portfolioScrollY', String(window.scrollY));
          sessionStorage.setItem('portfolioExpanded', expanded ? 'true' : 'false');
          sessionStorage.setItem('portfolioActiveFilter', activeFilter);
        }}
      >
        <img src={p.img} alt={title} loading="lazy" />
        {mode === 'grid' && (
          <>
            {/* Ripple — grow/fade keyframe copied straight from the
                reference codepen (https://codepen.io/VladimirVaize/pen/abvPadj:
                a circle animating width/height 0 -> full size, opacity
                fading). Adapted for a hover reveal instead of a click flash:
                background-image is the hero shot instead of solid white,
                and the fill direction/fill-mode hold the fully-grown,
                fully-opaque end state instead of fading back out — origin
                point reuses --glow-x/--glow-y, the same live cursor-tracked
                custom properties MagicBento already keeps on every
                .grid-card.mb-glow (see initMagicBento above). */}
            <span
              className="grid-card-ripple"
              aria-hidden="true"
              style={{ backgroundImage: `url(${heroImg})` }}
            />
            <div className="project-overlay">
              <div className="project-title">{title}</div>
              <div className="project-desc">{desc}</div>
              <div className="project-tags">
                {p.tags.map(tag => <span key={tag} className="project-tag">{tag}</span>)}
              </div>
            </div>
          </>
        )}
      </a>
    );
  }

  const rowProjects = [0, 1, 2, 3].map(row => PROJECTS.filter((_, i) => i % 4 === row));

  return (
    <div className="section-wrapper">
      <section id="portfolio" className={`section${expanded ? ' portfolio-expanded' : ''}`}>
        <div className="portfolio-header">
          <div className="section-label rise-soft" style={{ marginBottom: 0 }}>My Portfolio</div>
          <div className="portfolio-headline">
            <h2 className="portfolio-headline-title rise-soft"><span className="headline-lead">Every Idea, Taken </span><span className="gradient-text">All the Way</span></h2>
            <p className="portfolio-headline-sub rise-soft" dangerouslySetInnerHTML={{ __html: t.portfolio_headline_sub }} />
          </div>
        </div>

        {/* Scroller view — tilted 3-row marquee wall */}
        {/* .portfolio-wall itself can't carry .rise-soft directly: its own
            top/height/clip-path are fully JS-driven every frame (see the two
            effects above) to stay pinned to the eyebrow label and the "View
            All Projects" button, and putting GSAP's translateY entrance on
            that same element fights that JS ownership — tried once, and on
            real devices only the inner marquee rows visibly rose while the
            mobile height lock (lockWallGeometry) read a mid-animation offset
            and came out wrong. This wrapper decouples the two: GSAP owns
            the wrapper's transform/opacity (see useRiseReveal.ts), while
            .portfolio-wall stays untouched by GSAP and just fills the
            wrapper at width/height 100% (see portfolio.css) so its own
            positioning math is unaffected. */}
        <div className="portfolio-wall-frame rise-soft" style={{ display: expanded ? 'none' : '' }}>
          <div id="portfolio-scroller-desktop" className="portfolio-wall">
            <div className="portfolio-wall-inner">
              {rowProjects.map((projects, row) => (
                <div
                  key={row}
                  className="portfolio-row"
                  data-direction={row % 2 === 1 ? 'left' : 'right'}
                >
                  <div className="scroller-inner" id={`track-desk-row-${row}`}>
                    {projects.map(p => <ProjectCard key={p.id} p={p} mode="scroll" />)}
                  </div>
                </div>
              ))}
            </div>
            <svg className="portfolio-wall-outline" aria-hidden="true">
              <defs>
                <linearGradient id="portfolio-wall-outline-grad" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8A2BE2" />
                  <stop offset="50%" stopColor="#4A00E0" />
                  <stop offset="100%" stopColor="#00D4FF" />
                </linearGradient>
              </defs>
              <path ref={wallOutlinePathRef} fill="none" stroke="url(#portfolio-wall-outline-grad)" strokeWidth="3.5" />
            </svg>
          </div>
        </div>

        {/* Filter buttons */}
        {expanded && (
          <div id="portfolio-filters" className="portfolio-filter-tabs" role="tablist">
            {['all', 'mobile', 'web'].map(f => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={activeFilter === f}
                className={`portfolio-filter-tab${activeFilter === f ? ' active' : ''}`}
                data-filter={f}
                onClick={() => handleFilter(f)}
              >
                {activeFilter === f && (
                  <motion.span
                    layoutId="portfolio-filter-indicator"
                    className="portfolio-filter-indicator"
                    transition={FILTER_TAB_INDICATOR_SPRING}
                    aria-hidden="true"
                  />
                )}
                <span className="portfolio-filter-label">
                  {f === 'all' ? 'All' : f === 'mobile' ? 'Apps Design' : 'Web Design'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Grid view */}
        <div
          id="portfolio-grid"
          style={{ display: expanded ? 'grid' : 'none' }}
        >
          {PROJECTS.map((p, i) => (
            <ProjectCard
              key={p.id}
              p={p}
              mode="grid"
              index={i}
            />
          ))}
        </div>

        <div className="view-all-row">
          <button
            id="toggle-portfolio-view"
            className="btn-glass btn-grad"
            style={{ padding: '10px 10px 10px 34px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '12px', border: 'none', cursor: 'pointer', fontSize: '21px' }}
            onClick={handleToggle}
          >
            <span id="toggle-portfolio-text">{expanded ? 'Fold' : 'View All Projects'}</span>
            <span className="toggle-portfolio-icon-circle">
              <span className="toggle-portfolio-icon-spin">
                <i id="toggle-portfolio-icon" className={expanded ? 'fas fa-chevron-up' : 'fas fa-arrow-right'}></i>
              </span>
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
