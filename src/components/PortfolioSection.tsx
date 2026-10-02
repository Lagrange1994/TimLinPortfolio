import { useEffect, useLayoutEffect, useRef, useState, useCallback, type CSSProperties } from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { useLang } from '../context/LangContext';
import { PROJECTS } from '../data/projects';
import { squircleRectPath, squircleRingMaskUrl } from '../utils/squircle';
import { portfolioWallMaskPath, DEFAULT_RADIUS, computeWallHeight } from '../utils/portfolioMask';
import { scrollToSectionAligned } from '../utils/navHeader';
import { INDICATOR_SPRING } from '../utils/tabIndicator';
import { attachPortfolioSkeleton } from '../utils/portfolioSkeleton';
import { RISE_FROM, RISE_TWEEN, RISE_START_EVENT, type RiseStartDetail } from '../utils/useRiseReveal';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// TEMP (2026-09-27): expanded grid cards' motion/glow effects are switched
// off — MagicBento glow/spotlight/magnetic tilt and the CSS hover lift/zoom/
// shadow (gated by #portfolio-grid.grid-fx-off in portfolio.css). Kept: the
// fly-in entrance on expand/filter switch, the hover hero-image ripple, and
// the marquee wall.
// Flip to true to restore.
const GRID_CARD_EFFECTS = false;

const SMOOTH_TAU = 0.18;
// Matches How I Use AI's card corner radius (.ai-card) so the squircle reads
// consistently across sections instead of scaling with each card's box size.
const CARD_CORNER_RADIUS = 44;
// Breathing room around the headline/subtitle text inside the wall outline's
// top-left notches, so the rounded corners don't cut in right at the glyphs.
// How far the headline text, the wall and the View All button rise from —
// larger than the site-wide default (28px) so the Portfolio entrance reads
// clearly. Carried on the label/title/sub via data-rise-y and read back by
// the wall-frame effect so all of them travel the same distance.
const PORTFOLIO_RISE_Y = 72;
const NOTCH_PADDING = 16;
// Fired on #portfolio whenever the desktop geometry effect sets the wall's
// top/height, so the notch-mask effect recuts the path for the new position.
const WALL_GEOMETRY_EVENT = 'wall-geometry';
// How far the wall's top edge rides up over the subtitle's bottom at the
// 1920×1080 reference layout (centred wall, settled 72px navbar) — reused to
// pin the wall to the headline on taller-than-16:9 screens, so the two modes
// meet at the same top edge (see applyDesktopGeometry).
const WALL_SUB_OVERLAP = 31;
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

    // Only animate while the row is on screen — four always-running rAF
    // loops rewriting transforms on off-screen layers keep the GPU busy for
    // the whole page (a contributor to phone tab reloads near Portfolio).
    let visible = true;
    let running = false;

    function tick(ts: number) {
      if (!visible) { running = false; return; }
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      velocity += (targetVelocity - velocity) * (1 - Math.exp(-dt / SMOOTH_TAU));
      offset += velocity * dt * direction;
      offset = ((offset % oneSetWidth) + oneSetWidth) % oneSetWidth;
      inner!.style.transform = `translateX(${-offset}px)`;
      requestAnimationFrame(tick);
    }

    function start() {
      if (running) return;
      running = true;
      lastTs = null;
      requestAnimationFrame(tick);
    }

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    }).observe(row);
    start();
    row.addEventListener('mouseenter', () => { targetVelocity = hoverSpeed; });
    row.addEventListener('mouseleave', () => { targetVelocity = normalSpeed; });
  }

  startRAF();
}

// project9~12 are deprioritized for the bento grid's enlarged slots — picked
// only if there aren't enough other projects to fill all 3.
const BENTO_BIG_AVOID_IDS = new Set(['p9', 'p10', 'p11', 'p12']);

function getBentoBigIndices(projects: typeof PROJECTS) {
  const preferred: number[] = [];
  const avoided: number[] = [];
  projects.forEach((p, i) => (BENTO_BIG_AVOID_IDS.has(p.id) ? avoided : preferred).push(i));

  const pool = [...preferred];
  if (pool.length < 3) pool.push(...avoided);

  const picked: number[] = [];
  while (picked.length < 3 && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
}

const bentoBigIndices = getBentoBigIndices(PROJECTS);
// The infinite scroller wall clones cards with plain DOM cloneNode (see
// createPortfolioScroller) — clones aren't React-managed, so their
// data-title never updates when the language changes. Keyed by href
// (identical on the original and every clone) so hover text can be
// re-derived from the live translation table instead of a stale attribute.
const projectsByLink = new Map(PROJECTS.map(p => [p.link, p]));

// Module-level (not nested inside PortfolioSection) so its function identity
// stays stable across PortfolioSection's own re-renders — nested here, a
// fresh ProjectCard reference on every render made React treat every
// <ProjectCard> as a brand-new component type each time, fully unmounting
// and remounting every project/grid card's real DOM node on ANY unrelated
// PortfolioSection re-render (activeFilter/expanded changes included).
// That silently wiped every imperative style written onto those
// nodes elsewhere (clip-path, --card-w/--card-h, MagicBento's --glow-*) the
// moment a remount landed, which is what broke the grid cards' hover ripple
// reveal and rounded corners. t/expanded/activeFilter are passed as props
// instead of closed over for the same reason: closing over them would still
// require PortfolioSection's own body to redefine this function each render.
function ProjectCard({ p, mode, index, t, expanded, activeFilter }: {
  p: typeof PROJECTS[0];
  mode: 'scroll' | 'grid';
  index?: number;
  t: Record<string, string>;
  expanded: boolean;
  activeFilter: string;
}) {
  const title = t[p.id + '_title'] || p.id;
  const desc = t[p.id + '_desc'] || '';
  const isBig = mode === 'grid' && index !== undefined && bentoBigIndices.includes(index);
  const cls = mode === 'grid' ? 'grid-card' : 'project-card';
  const categoryLabel = p.category === 'mobile' ? 'Apps Design' : p.category === 'web' ? 'Web Design' : '';
  // Grid cards' hover ripple reveals each project's hero shot — same
  // slug as the project's own page (project_XX.html -> project_XX/), not
  // the curated thumbnail in p.img. Uses a dedicated small preview
  // (~1000px wide, generated from hero_img.webp) instead of the full-size
  // hero_img itself — that file is sized for the project page's own
  // full-bleed background and is 2400px+ wide, ~15x more pixels than this
  // ripple ever renders at (capped at the grid card's own box size).
  const heroImg = `./img/${p.link.replace('.html', '')}/hero_img_preview.webp`;
  const card = (
    <a
      className={cls}
      href={p.link}
      data-category={p.category}
      data-title={title}
      data-sub={categoryLabel}
      // Skeleton fill (see .project-card::before) — inline so marquee
      // cloneNode copies carry it too.
      style={{ '--ph': p.color, '--ph2': p.heroColor } as CSSProperties}
      onClick={() => {
        sessionStorage.setItem('portfolioScrollY', String(window.scrollY));
        sessionStorage.setItem('portfolioExpanded', expanded ? 'true' : 'false');
        sessionStorage.setItem('portfolioActiveFilter', activeFilter);
      }}
    >
      <img src={p.img} alt={title} loading="lazy" decoding="async" />
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
  // Both .grid-card and .project-card carry a JS squircle clip-path (see
  // the squircle-measurement effect below), and box-shadow silently fails
  // to render past the edge of an element that also carries an imperative
  // clip-path (same failure mode as filter:drop-shadow — see
  // #bg-panel-shadow's comment in portfolio.css). These wrappers carry no
  // clip-path of their own, so their box-shadow traces the card's plain
  // rectangular footprint instead of chasing the squircle exactly, same
  // trade-off already made for the hero panel/portfolio wall shadows.
  if (mode !== 'grid') {
    return <div className="project-card-shadow">{card}</div>;
  }
  return (
    <div className={`grid-card-shadow${isBig ? ' mb-big' : ''}`}>
      {card}
    </div>
  );
}

export default function PortfolioSection() {
  const { t, lang } = useLang();
  const [expanded, setExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const scrollerInitRef = useRef(false);
  const wallOutlinePathRef = useRef<SVGPathElement | null>(null);
  // .portfolio-wall-clip holds the clip-path that contains the marquee
  // cards (see the JSX comment by <div className="portfolio-wall"> for why
  // this stays separate from .portfolio-wall-fill below). wallFillRef is
  // the wall's own visible background — clipped with the exact same `d`
  // string as wallOutlinePathRef, so the fill's edge and the outline stroke
  // can never drift apart.
  const wallClipRef = useRef<HTMLDivElement | null>(null);
  const wallFillRef = useRef<HTMLDivElement | null>(null);
  // .wall-frame-in's own scroll-in reveal target — see the ScrollTrigger
  // effect below and the .wall-frame-in comment in portfolio.css.
  const wallFrameRef = useRef<HTMLDivElement | null>(null);
  // The wall's top/height are measured once (see the wall-geometry effect
  // below) and then locked — re-measuring on every resize is what caused the
  // address-bar-driven svh jitter this replaces.
  const wallGeometryLockedRef = useRef(false);

  // Lazy-load skeleton — declared first so its capture listener is in place
  // before the scroller effect clones cards (see portfolioSkeleton.ts).
  useEffect(() => attachPortfolioSkeleton(), []);

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

    // .grid-card-shadow (see that class's own comment in portfolio.css) is
    // what actually carries the card's box-shadow, since .grid-card itself
    // can't (its JS clip-path silently clips box-shadow away, same failure
    // mode as filter:drop-shadow elsewhere in this file). The magnetic
    // pull/tilt below has to move THAT wrapper, not .grid-card, or the
    // image visibly drifts out from under its own shadow on every hover.
    function shadowTargetOf(card: HTMLElement) {
      return card.closest<HTMLElement>('.grid-card-shadow') || card;
    }

    function resetCard(card: HTMLElement) {
      gsap.to(shadowTargetOf(card), { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
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
        gsap.to(shadowTargetOf(hovered), {
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
  //
  // The notch is cut from label/title/sub's rects. apply() measures those (and
  // the frame) at rest — clearing their entrance transforms for the one
  // synchronous measure — so it can run immediately and at any point of the
  // entrance, while the wall rises together with the text (see the wall-frame
  // effect below). Earlier versions waited for label/title/sub's
  // 'rise-settled' event and faded the wall in afterwards, because reading
  // their still-animating rects deformed the notch.
  useLayoutEffect(() => {
    const section = document.getElementById('portfolio');
    const wall = document.getElementById('portfolio-scroller-desktop');
    // The positioned ancestor that actually carries the wall's on-page
    // offset (see the .portfolio-wall-frame/.rise-soft split above the JSX
    // below) — .portfolio-wall itself now just fills this at 100%, so any
    // top/marginTop this effect writes or reads has to target the frame,
    // not the wall.
    const frame = document.querySelector<HTMLElement>('.portfolio-wall-frame');
    const pathEl = wallOutlinePathRef.current;
    const clipEl = wallClipRef.current;
    const fillEl = wallFillRef.current;
    const label = document.querySelector<HTMLElement>('#portfolio .section-label');
    const title = document.querySelector<HTMLElement>('.portfolio-headline-title');
    const sub = document.querySelector<HTMLElement>('.portfolio-headline-sub');
    const viewAllBtn = document.getElementById('toggle-portfolio-view');
    const viewAllRow = document.querySelector<HTMLElement>('.view-all-row');
    if (!section || !wall || !frame || !pathEl || !clipEl || !fillEl || !label || !title || !sub || !viewAllBtn || !viewAllRow) return;

    // Measures label/title/sub/frame at REST: while they're mid-rise their
    // GSAP transforms (translateY, scaleY) skew getBoundingClientRect's
    // top/bottom/height, which is what used to force the whole wall to wait
    // for 'rise-settled' before it could show. Clearing the inline transforms
    // for the synchronous duration of one measure (no paint in between) gives
    // the true resting rects at any point of the entrance, so the wall can
    // rise together with the text instead of fading in after it.
    function apply() {
      const els = [label!, title!, sub!, frame!];
      const saved = els.map(el => el.style.transform);
      els.forEach(el => { el.style.transform = 'none'; });
      try {
        applyAtRest();
      } finally {
        els.forEach((el, i) => { el.style.transform = saved[i]; });
      }
    }

    function applyAtRest() {
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
      // Resting rect — apply() clears the entrance transforms while measuring.
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
      // Contains the marquee cards (see .portfolio-wall-clip's own comment
      // in the JSX below). fillEl uses this exact same `d` string, not a
      // separately-computed approximation — see .portfolio-wall-fill in
      // portfolio.css for why that match has to be exact, not just close.
      clipEl!.style.clipPath = `path('${d}')`;
      fillEl!.style.clipPath = `path('${d}')`;
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

    let ro: ResizeObserver | null = null;

    // Measures immediately and keeps the notch in sync via ResizeObserver.
    // Safe before label/title/sub finish their entrance because apply()
    // measures them at rest (see above); a language switch reruns this whole
    // effect and gets a fresh observer.
    function measureAndObserve() {
      apply();
      ro?.disconnect();
      ro = new ResizeObserver(apply);
      ro.observe(section!);
      ro.observe(wall!);
      ro.observe(viewAllBtn!);
      ro.observe(label!);
      ro.observe(title!);
      ro.observe(sub!);
    }
    measureAndObserve();
    // The geometry effect below moved the wall (see WALL_GEOMETRY_EVENT).
    function onWallGeometry() {
      apply();
    }
    section.addEventListener(WALL_GEOMETRY_EVENT, onWallGeometry);
    return () => {
      ro?.disconnect();
      section!.removeEventListener(WALL_GEOMETRY_EVENT, onWallGeometry);
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
    // Only mobile's branch below actually needs this (see tryLock).
    const label = document.querySelector<HTMLElement>('#portfolio .section-label');
    if (!wall || !frame || !inner || !section || !label) return;

    function measureContentHeight(): number {
      const rows = Array.from(inner!.querySelectorAll<HTMLElement>('.portfolio-row'))
        .filter(r => r.offsetHeight > 0);
      if (rows.length === 0) return 0;
      const gap = parseFloat(getComputedStyle(inner!).gap) || 0;
      return rows.reduce((sum, r) => sum + r.offsetHeight, 0) + gap * (rows.length - 1);
    }

    // dvh, not svh, here — unlike the CSS pre-lock fallback (.portfolio-
    // wall-frame's static 85svh in portfolio.css), this only ever reads the
    // probe's height once and throws it away, so there's no live recalc to
    // jitter. svh is pinned to the browser chrome's MOST expanded state
    // (address bar shown) by spec, which is smaller than the actual space
    // once the user has scrolled this far down the page and the chrome has
    // auto-collapsed — using it here permanently undercounts the real
    // available height, leaving the bottom gap bigger than the (correctly
    // sized) top gap. dvh reads whatever the chrome's state actually is at
    // the moment of this one-time measurement instead.
    function measureAvailableHeight(): number {
      const probe = document.createElement('div');
      // 100dvh / --z, same as portfolio.css's own dvh rules: above 1920px
      // wide, html's zoom (scaleLock / --z) scales viewport units up with it,
      // so a bare 100dvh overcounts the room in layout px and the centred
      // wall sinks away from the headline on high-res screens.
      probe.style.cssText = 'position:fixed; visibility:hidden; pointer-events:none; height:calc(100dvh / var(--z, 1) - var(--nav-h, 72px) - env(safe-area-inset-bottom, 0px));';
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
      probe.style.cssText = `position:fixed; visibility:hidden; pointer-events:none; height:calc(100dvh - var(--nav-h, 72px) - ${wallTopOffset}px - ${wallTopOffset}px - env(safe-area-inset-bottom, 0px));`;
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
        // Pin the top first (cap reads it back): offsetTop chain, not the
        // label's rect, so this is right even while the label is still
        // mid-rise — which is what lets the lock land before the wall is
        // ever visible instead of waiting for the label to settle.
        frame!.style.top = `${offsetTopWithin(label!)}px`;
        frame!.style.marginTop = '0px';
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
        baseContentHeight = contentHeight;
        applyDesktopGeometry();
      }
      wallGeometryLockedRef.current = true;
    }

    // 3-row stack height, captured at first lock (before .wall-fill can
    // reveal row 4 and inflate measureContentHeight()). Card sizes are
    // fixed layout px, so it never changes with the viewport.
    let baseContentHeight = 0;

    // Layout-px offset of el's top from the section's top, via the
    // offsetTop chain — unaffected by the headline's rise-soft transform
    // (which may still be mid-flight when this runs) and by the navbar's
    // --nav-h settling, unlike getBoundingClientRect().
    function offsetTopWithin(el: HTMLElement): number {
      let y = 0;
      let node: HTMLElement | null = el;
      while (node && node !== section) {
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return y;
    }

    function applyDesktopGeometry() {
      const availableHeight = measureAvailableHeight();
      const sub = section!.querySelector<HTMLElement>('.portfolio-headline-sub');
      const centredHeight = computeWallHeight(baseContentHeight, availableHeight);
      const centredTop = Math.max(0, (availableHeight - centredHeight) / 2);
      // Where the wall's top sits relative to the headline at 1920×1080 (the
      // reference layout): WALL_SUB_OVERLAP px above the subtitle's bottom,
      // so the notch wraps the text the same way on every screen.
      const anchoredTop = sub ? offsetTopWithin(sub) + sub.offsetHeight - WALL_SUB_OVERLAP : centredTop;
      // +2px slack: at exactly 16:9 the two land within a pixel of each
      // other and rounding shouldn't flip the mode.
      if (centredTop <= anchoredTop + 2) {
        // 16:9-or-wider: centring already keeps the wall at/above the
        // headline — the original content-fit wall.
        wall!.classList.remove('wall-fill', 'wall-fill-scale');
        frame!.style.top = `${centredTop}px`;
        frame!.style.height = `${centredHeight}px`;
        inner!.style.setProperty('--wall-scale', '1');
      } else {
        // Taller than 16:9 (2560×1600, square, portrait…): centring a
        // content-sized wall would strand it far below the headline. Pin its
        // top to the headline instead and let it fill down to an equal
        // bottom gap — size and aspect follow the screen, not the content.
        // .wall-fill reveals row 4 (top-aligned so rows 1–3 stay put); if
        // even 4 rows can't cover the height, scale the stack up to fill it,
        // the way mobile does (.wall-fill-scale re-centres it for the scale).
        const wallHeight = Math.max(centredHeight, availableHeight - anchoredTop * 2);
        frame!.style.top = `${anchoredTop}px`;
        frame!.style.height = `${wallHeight}px`;
        wall!.classList.add('wall-fill');
        const row4 = inner!.querySelector<HTMLElement>('.portfolio-row:nth-child(4)');
        if (row4) createPortfolioScroller(row4, 40, 12);
        const fullStack = measureContentHeight();
        const scale = fullStack > 0 && fullStack < wallHeight ? wallHeight / fullStack : 1;
        wall!.classList.toggle('wall-fill-scale', scale > 1);
        inner!.style.setProperty('--wall-scale', `${scale}`);
      }
      frame!.style.marginTop = '0px';
      // The notch mask (effect above) must be recut for the new top: a
      // position-only move (e.g. a language switch re-wrapping the headline
      // shifts anchoredTop) never trips its ResizeObserver, leaving the
      // notch cut for the old top — visibly misaligned with the text.
      section!.dispatchEvent(new Event(WALL_GEOMETRY_EVENT));
    }

    // Desktop/tablet geometry follows the viewport live; only mobile keeps
    // the one-time lock (address-bar jitter — see above).
    function onResize() {
      if (!wallGeometryLockedRef.current || baseContentHeight <= 0) return;
      if (window.matchMedia('(max-width: 767px)').matches) return;
      applyDesktopGeometry();
    }

    // threshold: 0.01 fires as soon as 1% of the (tall, mobile) section is
    // visible. Desktop/tablet's branch above computes top/height purely
    // from measureAvailableHeight() (dvh + --nav-h) and the row stack's own
    // static content height — neither reads anything about the entrance
    // animation's progress — so it can lock the instant the section is
    // visible, no wait needed. Locking it late used to mean the CSS pre-lock
    // fallback height (var(--wall-h, 75dvh) in portfolio.css) stayed applied
    // for the entrance's whole duration, then snapped to the real computed
    // height the moment the wait ended — an abrupt, untransitioned resize
    // landing right as the fade/rise settled read as a rubbery "stretch".
    // Locking immediately means the real height is already in place before
    // the entrance even starts, so there's nothing left to snap.
    // Mobile locks on intersection too — never wait for the label's rise.
    // Its top pin is read from the offsetTop chain (see lockWallGeometry),
    // which the rise transform can't skew, so the real height and row scale
    // are already in place while the wall is still invisible. Waiting for the
    // label's 'rise-settled' instead let the wall fade in at the CSS pre-lock
    // fallback size (85svh, unscaled rows) and then visibly jump (~30px, rows
    // shrinking ~19%) when the lock finally landed.
    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        lockWallGeometry();
        io.disconnect();
      }
    // Bottom rootMargin 100%: lock while the section is still a full screen
    // below the fold, i.e. always before the label's rise (and so the wall's
    // reveal) starts. Locking on first pixel let a fast jump into the section
    // reposition the wall in the very frame it started rising.
    }, { threshold: 0.01, rootMargin: '0px 0px 100% 0px' });
    io.observe(section);

    window.addEventListener('resize', onResize);
    // Both can settle after the first lock: the headline's layout (web font
    // swap, language change, wrapping) and the navbar's height (--nav-h is
    // still mid-shrink animation when the section first intersects) —
    // re-apply when either does, so the result doesn't depend on timing.
    const headerRo = new ResizeObserver(onResize);
    const header = section.querySelector<HTMLElement>('.portfolio-header');
    const navHeader = document.getElementById('main-header');
    if (header) headerRo.observe(header);
    if (navHeader) headerRo.observe(navHeader);

    return () => {
      io.disconnect();
      headerRo.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [expanded]);

  // The notched wall rises together with the headline text. It used to only
  // fade in, after the page stopped scrolling (scroll-settle debounce, opacity
  // only), because a transform on the frame visibly detached the notch
  // outline from the label/title/sub — whose rects the notch was computed
  // from while they were still mid-rise. Two things changed that:
  //  1. apply() (wall-mask effect) now measures label/title/sub/frame at rest
  //     by clearing their entrance transforms for the one synchronous
  //     measure, so the notch is correct at every moment of the entrance.
  //  2. The frame (and the "View All" button, which sits in the wall's leg
  //     notch but lives outside the frame) run the exact same y/opacity
  //     tween as the .rise-soft text (RISE_FROM / RISE_TWEEN from
  //     useRiseReveal), started by the label's own 'rise-start' event; the
  //     title/sub share the label's trigger (data-rise-with), so all of it
  //     moves as one beat and the notch stays aligned the whole way.
  // Deliberately y + opacity only: no scale (the frame's top edge would drift
  // from the squashing text) and no clip-path (cuts the outline stroke's
  // bleed even fully open).
  useLayoutEffect(() => {
    const section = document.getElementById('portfolio');
    const frame = wallFrameRef.current;
    const row = document.querySelector<HTMLElement>('.view-all-row');
    const label = document.querySelector<HTMLElement>('#portfolio .section-label');
    if (!section || !frame || !row || !label) return;
    const targets = [frame, row];
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(targets, { clearProps: 'all' });
      return;
    }
    let played = false;
    const ctx = gsap.context(() => {
      gsap.set(targets, { ...RISE_FROM, y: Number(label.dataset.riseY) || RISE_FROM.y });
    });
    const onRiseStart = (e: Event) => {
      if (played || e.target !== label) return;
      played = true;
      // Added to the label's own timeline (not a fresh tween) so the wall is
      // frame-exact with the text even through a hitchy first frame, and
      // enters from the same side: below when scrolling down, above when up.
      const { tl, dir, riseY } = (e as CustomEvent<RiseStartDetail>).detail;
      tl.fromTo(targets, { autoAlpha: 0, y: dir * riseY }, { ...RISE_TWEEN, clearProps: 'transform' }, 0);
    };
    section.addEventListener(RISE_START_EVENT, onRiseStart);
    return () => {
      section.removeEventListener(RISE_START_EVENT, onRiseStart);
      ctx.revert();
    };
  }, []);

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
        // clip-path: path() is laid out in the BORDER box — contentRect
        // (content box) made the path smaller than the card by the border
        // width on each side, pinned to the top-left, so the photo's
        // right/bottom edge got cut while a rim showed on the left/top.
        const box = entry.borderBoxSize?.[0];
        const width = box ? box.inlineSize : el.offsetWidth;
        const height = box ? box.blockSize : el.offsetHeight;
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
    cards.forEach(c => ro.observe(c, { box: 'border-box' }));
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
  useEffect(() => {
    tRef.current = t;
  }, [t]);

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
    if (expanded && GRID_CARD_EFFECTS) {
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
    // Targets .grid-card-shadow (see the entrance effect below for why) —
    // .grid-card itself carries no opacity/transform of its own during
    // entrance, so hiding it here instead of its wrapper would do nothing.
    grid.querySelectorAll<HTMLElement>('.grid-card-shadow').forEach(wrapper => {
      const card = wrapper.querySelector<HTMLElement>('.grid-card');
      const show = activeFilter === 'all' || card?.dataset.category === activeFilter;
      if (show) wrapper.style.opacity = '0';
    });
  }, [expanded, activeFilter]);

  // Animate grid cards in
  useEffect(() => {
    if (!expanded) return;
    const grid = document.getElementById('portfolio-grid');
    if (!grid) return;

    // Animates .grid-card-shadow (the wrapper), not .grid-card (the photo)
    // — box-shadow lives on the wrapper (see its comment in portfolio.css:
    // .grid-card's own JS squircle clip-path silently clips away any
    // box-shadow placed directly on it), so animating only the inner photo
    // left the shadow sitting fully visible in its final position/opacity
    // the instant a filter switch revealed it, while the photo itself flew
    // up into place below/inside it — shadow and image visibly out of sync.
    // Animating the wrapper instead carries the photo along for free (it's
    // a child), and the shadow now fades/moves/blurs as one unit with it.
    const wrappers = Array.from(grid.querySelectorAll<HTMLElement>('.grid-card-shadow')).filter(wrapper => {
      const card = wrapper.querySelector<HTMLElement>('.grid-card');
      const show = activeFilter === 'all' || card?.dataset.category === activeFilter;
      // #portfolio-grid is auto-placed (grid-auto-flow: dense, no per-card
      // grid-area), so display:none has to land on .grid-card-shadow — the
      // actual grid item — for the remaining cards to reflow into its spot.
      wrapper.style.display = show ? '' : 'none';
      return show;
    });

    setTimeout(() => {
      gsap.killTweensOf('#portfolio-grid .grid-card-shadow');
      wrappers.forEach(w => { w.style.transition = 'none'; });
      gsap.fromTo(wrappers,
        { y: 60, opacity: 0, filter: 'blur(8px)', scale: 0.95 },
        {
          y: 0, opacity: 1, filter: 'blur(0px)', scale: 1,
          duration: 0.65, ease: 'power3.out', stagger: 0.045,
          clearProps: 'transform,opacity,filter',
          onComplete() { wrappers.forEach(w => { w.style.transition = ''; }); }
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

  const rowProjects = [0, 1, 2, 3].map(row => PROJECTS.filter((_, i) => i % 4 === row));

  return (
    <div className="section-wrapper">
      <section id="portfolio" className={`section${expanded ? ' portfolio-expanded' : ''}`} data-lazy-keep={expanded || activeFilter !== 'all' ? '' : undefined}>
        <div className="portfolio-header">
          <div className="section-label rise-soft" data-rise-y={PORTFOLIO_RISE_Y} style={{ marginBottom: 0 }}>My Portfolio</div>
          <div className="portfolio-headline">
            <h2 className="portfolio-headline-title rise-soft" data-rise-with=".section-label" data-rise-y={PORTFOLIO_RISE_Y}><span className="headline-lead">Every Idea, Taken </span><span className="gradient-text">All the Way</span></h2>
            <p className="portfolio-headline-sub rise-soft" data-rise-with=".section-label" data-rise-y={PORTFOLIO_RISE_Y} dangerouslySetInnerHTML={{ __html: t.portfolio_headline_sub }} />
          </div>
        </div>

        {/* Scroller view — tilted 3-row marquee wall */}
        {/* .portfolio-wall itself can't carry the entrance transition
            directly: its own top/height/clip-path are fully JS-driven every
            frame (see the two effects above) to stay pinned to the eyebrow
            label and the "View All Projects" button, and a second system
            also writing its transform fights that JS ownership — tried
            once, and on real devices only the inner marquee rows visibly
            rose while the mobile height lock (lockWallGeometry) read a
            mid-animation offset and came out wrong. This wrapper decouples
            the two: a plain CSS transition owns the wrapper's
            transform/opacity (see the ScrollTrigger effect below
            and .wall-frame-in in portfolio.css — NOT the shared
            useRiseReveal system every other .rise-soft element uses, see
            that effect's comment for why), while .portfolio-wall stays
            untouched and just fills the wrapper at width/height 100% (see
            portfolio.css) so its own positioning math is unaffected.

            .portfolio-wall itself splits into three layers instead of one
            clipped div: .portfolio-wall-fill paints the panel's actual
            visible background, .portfolio-wall-clip holds the clip-path
            that contains the marquee cards, and the outline svg draws the
            stroke on top. The fill and the outline share the exact same `d`
            string (set together in apply() above) so their edges can never
            drift apart. The fill can't be merged into .portfolio-wall-clip:
            the cards live inside .portfolio-wall-inner's skewed 3D
            transform, and clipping has to happen in this untransformed box
            (not the skewed one) for the notch edges to stay straight
            instead of following the skew — see apply() in the effect
            above. */}
        <div ref={wallFrameRef} className="portfolio-wall-frame wall-frame-in" style={{ display: expanded ? 'none' : '' }}>
          <div id="portfolio-scroller-desktop" className="portfolio-wall">
            <div className="portfolio-wall-fill" aria-hidden="true" ref={wallFillRef} />
            <div className="portfolio-wall-clip" ref={wallClipRef}>
              <div className="portfolio-wall-inner">
                {rowProjects.map((projects, row) => (
                  <div
                    key={row}
                    className="portfolio-row"
                    data-direction={row % 2 === 1 ? 'left' : 'right'}
                  >
                    <div className="scroller-inner" id={`track-desk-row-${row}`}>
                      {projects.map(p => (
                        <ProjectCard
                          key={p.id}
                          p={p}
                          mode="scroll"
                          t={t as Record<string, string>}
                          expanded={expanded}
                          activeFilter={activeFilter}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
          <LayoutGroup id="portfolio-filters">
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
                    transition={INDICATOR_SPRING}
                    aria-hidden="true"
                  />
                )}
                <span className="portfolio-filter-label">
                  {f === 'all' ? 'All' : f === 'mobile' ? 'Apps Design' : 'Web Design'}
                </span>
              </button>
            ))}
          </div>
          </LayoutGroup>
        )}

        {/* Grid view */}
        <div
          id="portfolio-grid"
          className={GRID_CARD_EFFECTS ? undefined : 'grid-fx-off'}
          style={{ display: expanded ? 'grid' : 'none' }}
        >
          {/* Unmounted while folded (not just display:none) so the 13 cards'
              decoded images/ripples/masks are freed before the marquee wall
              re-paints — folding used to stack both and, on phones, the
              browser force-reloaded the tab. */}
          {expanded && PROJECTS.map((p, i) => (
            <ProjectCard
              key={p.id}
              p={p}
              mode="grid"
              index={i}
              t={t as Record<string, string>}
              expanded={expanded}
              activeFilter={activeFilter}
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
