import { useEffect, useId, useLayoutEffect, useState, useRef, useMemo, type ReactNode, type CSSProperties, type PointerEvent as ReactPointerEvent, type AnimationEvent as ReactAnimationEvent, type TouchEvent as ReactTouchEvent } from 'react';
import { gsap } from 'gsap';
import { useLang } from '../context/LangContext';
import BorderGlow from './BorderGlow';
import { HtmlDemo, JsDemo, RwdDemo } from './TechDemos';
import PolicyPill from './PolicyPill';
import GoogleGeminiEffect, { GEMINI_BEAM_STOPS } from './GoogleGeminiEffect';
import FigmaMcpShowcase from './FigmaMcpShowcase';
import PlayPauseButton from './PlayPauseButton';
import AiAppStage from './AiAppStage';
import { attachAiViewerEntrance } from '../utils/aiViewerEntrance';
import { attachStageNotch, navBaySize } from '../utils/aiStageNotch';
import { swipeStep } from '../utils/swipeStep';
import { notchPath, leftBayPath } from '../utils/notchPath';
import { CARD_RADIUS, NOTCH_GAP, NOTCH_TURN } from '../utils/notchTokens';
import LazyUnit from './LazyUnit';
import { processCardLayers, useProcessCardThemes, type ProcessTheme } from '../utils/processCardImages';

function ProcessCardBg({ slug, themes }: { slug: string; themes: ReadonlySet<ProcessTheme> }) {
  return (
    <>
      {processCardLayers(slug, themes).map(l => (
        <div key={l.cls} className={`process-card-bg-img ${l.cls}`} style={l.image ? { backgroundImage: l.image } : undefined} />
      ))}
    </>
  );
}

// Top-to-bottom, index-paired with GEMINI_BEAM_STOPS so each chip's vertical
// center lands on the beam that "feeds" it.
const AI_CHIP_CATEGORIES = [
  { label: 'Dev Handoff', pct: '12%' },
  { label: 'Product UI', pct: '37%' },
  { label: 'Graphic Design', pct: '18%' },
  { label: 'UX Review', pct: '17%' },
  { label: 'Research Planning', pct: '16%' },
];

// Decorative word cloud on the beams' left (input) side — scattered raw data
// sources that flow in and get sorted into AI_CHIP_CATEGORIES on the right.
// Positions/sizes are hand-placed to spread across the left ~32% band without
// clumping; purely illustrative, so aria-hidden in the JSX.
const AI_SOURCE_CLOUD = [
  { text: 'User Interviews', icon: 'fa-solid fa-comments', top: '10%', left: '2%', size: 13, opacity: 0.64, rotate: -4 },
  { text: 'Support Tickets', icon: 'fa-solid fa-headset', top: '24%', left: '9%', size: 11, opacity: 0.52, rotate: 3 },
  { text: 'Analytics Events', icon: 'fa-solid fa-chart-line', top: '6%', left: '11%', size: 12, opacity: 0.58, rotate: -2 },
  { text: 'Figma Comments', icon: 'fa-brands fa-figma', top: '38%', left: '1.5%', size: 14, opacity: 0.7, rotate: 2 },
  { text: 'Slack Threads', icon: 'fa-brands fa-slack', top: '50%', left: '10%', size: 11, opacity: 0.5, rotate: -3 },
  { text: 'GitHub Issues', icon: 'fa-brands fa-github', top: '62%', left: '3%', size: 13, opacity: 0.62, rotate: 4 },
  { text: 'Design Specs', icon: 'fa-solid fa-swatchbook', top: '74%', left: '11%', size: 15, opacity: 0.72, rotate: -2 },
  { text: 'Roadmap Docs', icon: 'fa-solid fa-route', top: '86%', left: '3%', size: 11, opacity: 0.52, rotate: 3 },
  { text: 'A/B Test Results', icon: 'fa-solid fa-flask', top: '90%', left: '12%', size: 10.5, opacity: 0.48, rotate: -5 },
  { text: 'Survey Responses', icon: 'fa-solid fa-clipboard-list', top: '18%', left: '5%', size: 11, opacity: 0.5, rotate: 5 },
  { text: 'Meeting Notes', icon: 'fa-solid fa-users', top: '46%', left: '3%', size: 12, opacity: 0.56, rotate: -3 },
  { text: 'Competitor Audits', icon: 'fa-solid fa-magnifying-glass-chart', top: '68%', left: '10%', size: 10.5, opacity: 0.48, rotate: 2 },
];

const SMOOTH_TAU = 0.18;
// ≤960px the viewer switches to Apple's phone layout (stage on top, pill row
// below) — beside the pill column the stage gets too narrow for the demos.
const AI_COMPACT_MQ = '(max-width: 960px)';
// Pill ↔ summary-card morph (Apple's product viewer uses the same beats:
// label out almost at once, card content in only once the shape is underway).
const AI_PILL_MORPH_S = 0.5;
const AI_VIEWER_FIRST = 'sources';
// A swiped step settling into place: the track, the pill row's scroll and
// the current pill's highlight all take this time and this curve, so they
// arrive together (SWIPE_EASE_CSS is gsap's power2.out as a CSS curve).
const SWIPE_SLIDE_MS = 320;
const SWIPE_EASE = 'power2.out';
const SWIPE_EASE_CSS = 'cubic-bezier(.33, 1, .68, 1)';
// The headline sits in the viewer's notch, so it rises glued to the card
// (useRiseReveal's data-rise-lock), not on its own beat.
const AI_HEAD_RIDE = { 'data-rise-with': '.ai-viewer', 'data-rise-lock': '' };
// TRIAL: the viewer without its stage card (no notch, no fill / border /
// shadow, .ai-viewer.is-bare): the rail and the app window sit straight on
// the section. Flip to true to restore the notched stage.
const AI_VIEWER_NOTCH = false;
// TRIAL: on desktop the stage comes back as a solid card (no outline), its
// ⌃ ⌄ in a bay cut into its left edge, as the old notched stage had them
// (.is-stage, --av-clip). Phones keep the bare layout. Needs
// AI_VIEWER_NOTCH off.
const AI_VIEWER_STAGE = true;
export const AI_STAGE_MQ = '(min-width: 961px)';

function makeAiCards(t: Record<string, string>) {
  return [
    {
      id: 'sources',
      step: '01',
      variant: 'ai-cyan',
      badge: null as string | null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="6" cy="18" r="2.2" /><circle cx="18" cy="18" r="2.2" />
          <path d="M8.2 6h7.6M6 8.2v7.6M18 8.2v7.6M8.2 18h7.6" />
        </svg>
      ),
      title: 'Request Sources',
      summary: t.ai_sources_sum,
      tags: ['LINE', 'Form', 'Make'],
    },
    {
      id: 'intake',
      step: '02',
      variant: 'ai-purple',
      badge: null as string | null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
      ),
      title: 'Intake',
      summary: t.ai_intake_sum,
      tags: ['Make', 'Webhooks', 'Fields'],
    },
    {
      id: 'ai',
      step: '03',
      variant: 'ai-focal',
      badge: 'CLAUDE · DRAFT',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3 13.6 8.4 19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" />
          <path d="M19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z" />
        </svg>
      ),
      title: 'AI Brief',
      summary: t.ai_ai_sum,
      tags: ['Claude', 'Classify', 'Summarize', 'Gap-find'],
    },
    {
      id: 'tracking',
      step: '04',
      variant: 'ai-violet',
      badge: null as string | null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="4.5" width="17" height="15" rx="1.8" /><path d="M3.5 9.5h17M9 4.5v15M14.5 4.5v15" />
        </svg>
      ),
      title: 'Tracking',
      summary: t.ai_tracking_sum,
      tags: ['Sheets', 'Record ID', 'History'],
    },
    {
      id: 'human',
      step: '05',
      variant: 'ai-human',
      badge: null as string | null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" />
        </svg>
      ),
      title: 'Human Review',
      summary: t.ai_human_sum,
      tags: ['Priority', 'Strategy', 'Risk', 'Next step'],
    },
    {
      id: 'workflow',
      step: '06',
      variant: 'ai-spectrum',
      badge: null as string | null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12h4l2-6 4 12 2-6h4" />
        </svg>
      ),
      title: 'Design Workflow',
      summary: t.ai_workflow_sum,
      tags: null as string[] | null,
    },
  ];
}

function createScroller(scroller: HTMLElement, normalSpeed: number, hoverSpeed: number) {
  const inner = scroller.querySelector<HTMLElement>('.scroller-inner');
  if (!inner) return;
  const isReverse = scroller.getAttribute('data-direction') === 'right';
  if (scroller.getAttribute('data-raf-init') === 'true') return;

  const origItems = Array.from(inner.children) as HTMLElement[];
  // Snapshot images BEFORE cloning — querying after cloning would count both
  // originals and clones (e.g. 18 instead of 9), and cached clones often don't
  // re-fire load/error events, so the `loaded >= images.length` tally never
  // completes and startRAF() never runs (silent, permanent failure).
  const images = Array.from(origItems.flatMap(el => Array.from(el.querySelectorAll('img'))));

  origItems.forEach(item => {
    const clone = item.cloneNode(true) as HTMLElement;
    clone.setAttribute('aria-hidden', 'true');
    inner.appendChild(clone);
  });
  scroller.setAttribute('data-raf-init', 'true');

  const gap = parseFloat(getComputedStyle(inner).gap) || 10;

  function startRAF() {
    const oneSetWidth = origItems.reduce((sum, el) => sum + el.offsetWidth + gap, 0);
    if (oneSetWidth <= 0) return;

    let offset = 0;
    let velocity = normalSpeed;
    let targetVelocity = normalSpeed;
    let lastTs: number | null = null;
    const direction = isReverse ? -1 : 1;
    // Only animate while on screen (same as PortfolioSection's rows) —
    // otherwise both skill rows keep rewriting transforms every frame for
    // the whole visit.
    let visible = true;
    let running = false;

    function tick(ts: number) {
      if (!visible) { running = false; return; }
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      const factor = 1 - Math.exp(-dt / SMOOTH_TAU);
      velocity += (targetVelocity - velocity) * factor;
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
    }).observe(scroller);
    start();
    scroller.addEventListener('mouseenter', () => { targetVelocity = hoverSpeed; });
    scroller.addEventListener('mouseleave', () => { targetVelocity = normalSpeed; });
  }

  if (images.length === 0) {
    startRAF();
  } else {
    let started = false;
    const start = () => { if (!started) { started = true; startRAF(); } };
    let loaded = 0;
    const onLoad = () => { if (++loaded >= images.length) start(); };
    images.forEach(img => {
      if (img.complete) onLoad();
      else {
        img.addEventListener('load', onLoad, { once: true });
        img.addEventListener('error', onLoad, { once: true });
      }
    });
    // Safety net: in case a load/error event is missed (e.g. fires between
    // the `.complete` check and listener attachment), don't leave the
    // scroller permanently frozen — start once layout has settled regardless.
    setTimeout(start, 1500);
  }
}

const PROCESS_VISIBLE = 3;
// Phones (<768px) page one full-column-width card at a time; tablets run
// the desktop carousel, three cards a page.
const PROCESS_VISIBLE_MOBILE = 1;
const PROCESS_MOBILE_QUERY = '(max-width: 767px)';
// Tech Stack (mobileOnly) pages one card at a time under its tabs on
// tablets too.
export const TECH_CAROUSEL_QUERY = '(max-width: 1024px)';

const STAIR_STEP = 32;
// The notched containers' border (Design Process, How I Use AI's stage),
// like the hero frame's: the outline path stroked twice as wide, the svg
// clipped to the same path (CSS), so an even 1px shows inside every edge.
// The notched containers' neumorphic inset shadow (light theme): what
// box-shadow: inset 6px 6px 12px dark, -6px -6px 12px light does on a plain
// box, along the notched outline, which box-shadow can't follow. The
// outline filled, and the filter keeps only the inverse shape, offset and
// blurred, inside it. Its own svg under the content (z-index -1, above the
// fill), so it never shades what sits in the box.
export function StageInset({ className }: { className: string }) {
  // (Design Process has two carousels: one filter id each)
  const id = `stage-inset-${useId().replace(/:/g, '')}`;
  return (
    <svg className={`stage-inset ${className}`} aria-hidden="true">
      <defs>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feFlood className="si-dark" result="dk" />
          <feComposite in="dk" in2="SourceAlpha" operator="out" />
          <feOffset dx="6" dy="6" />
          <feGaussianBlur stdDeviation="6" />
          <feComposite in2="SourceAlpha" operator="in" result="shadeDark" />
          <feFlood className="si-light" result="lt" />
          <feComposite in="lt" in2="SourceAlpha" operator="out" />
          <feOffset dx="-6" dy="-6" />
          <feGaussianBlur stdDeviation="6" />
          <feComposite in2="SourceAlpha" operator="in" result="shadeLight" />
          <feMerge><feMergeNode in="shadeDark" /><feMergeNode in="shadeLight" /></feMerge>
        </filter>
      </defs>
      <path fill="#000" filter={`url(#${id})`} />
    </svg>
  );
}

function setOutline(svg: SVGSVGElement | null, w: number, h: number, d: string) {
  if (!svg) return;
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  // (the inset shadow's svg too: every path takes the outline)
  svg.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
  const path = svg.querySelector('path');
  if (!path) return;
  // twice the line, the clip keeps the inner half
  path.style.strokeWidth = `${rimPx() * 2}px`;
}

// The cards' 1.5px border as the browser draws it: borders snap down to
// whole device pixels (2 on a 1.5× display, 1.333 CSS px). The container's
// SVG stroke isn't snapped, so it takes the same width here to match.
export function rimPx(dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1) {
  return Math.max(1, Math.floor(1.5 * dpr)) / dpr;
}

// Design Process on desktop: the carousel sits in a filled container whose
// bottom-right corner is cut round the ⏸ ‹ › row (the staircase leaves that
// corner free: the rightmost card is the highest). Only where the ‹ › row
// shows.
export const PROCESS_NOTCH_MQ = '(min-width: 1025px)';
export function processNotchOpts(nav: { width: number; height: number }, r: number) {
  return { nw: nav.width + NOTCH_GAP, nh: nav.height + NOTCH_GAP, r, nr: NOTCH_TURN, nf: nav.height / 2 + NOTCH_GAP, side: 'right' as const };
}
const SWIPE_TRANSITION = 'transform .45s cubic-bezier(.22,.61,.36,1)';
// Release speed (px/ms) that turns a short drag into a page turn.
const SWIPE_FLICK_PX_PER_MS = 0.35;
// The countdown fill (process-dot-progress, 6s) advances the carousel on its
// animationend; this timer only covers a fill that never runs.
const AUTOPLAY_FALLBACK_MS = 6500;

function processVisibleCount(isMobile: boolean) {
  return isMobile ? PROCESS_VISIBLE_MOBILE : PROCESS_VISIBLE;
}

// Swipe carousel for the Design Process rows. Shows PROCESS_VISIBLE cards
// (PROCESS_VISIBLE_MOBILE on phones); offset is clamped to
// [0, cards.length - visible] so the last
// page borrows back cards instead of showing a short, unbalanced page.
//
// The left-low/right-high stagger is computed per SLOT (index - offset), not
// per card, and transitions whenever offset changes. A card's margin-top is
// pinned to 0 until it scrolls into the visible window, then grows as it
// crosses toward the left edge — so cards visibly step DOWN as they slide
// left, instead of the whole staircase just translating sideways with each
// card's height already fixed.
// `mobileOnly` (Tech Stack): above the phone breakpoint, render the cards
// straight into a plain <div className={className}> — that section keeps
// its own desktop/tablet grid — and only become a carousel on phones.
// `variant` adds a modifier class to the wrap for per-section styling.
// `tabs` (one per card; only used with one card per page, i.e. phones):
// swaps the dots + ‹ › for apple.com-style tabs — a label per card over a
// thin underline whose current segment fills with the autoplay countdown
// (MacBook Pro page, "M5 Pro / M5 Max").
// color → color2: the matching card's own colour pair (underline fill).
export type ProcessCarouselTab = { label: string; color: string; color2?: string };
export function ProcessCarousel({ cards, mobileOnly = false, className, variant, tabs }: {
  cards: ReactNode[];
  mobileOnly?: boolean;
  className?: string;
  variant?: string;
  tabs?: ProcessCarouselTab[];
}) {
  const singleQuery = mobileOnly ? TECH_CAROUSEL_QUERY : PROCESS_MOBILE_QUERY;
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(singleQuery).matches);
  const visible = processVisibleCount(isMobile);
  const maxOffset = Math.max(0, cards.length - visible);
  const [rawOffset, setOffset] = useState(0);
  // Crossing the breakpoint changes maxOffset; clamp instead of resetting so
  // the current card stays in view.
  const offset = Math.min(rawOffset, maxOffset);

  useEffect(() => {
    const mq = window.matchMedia(singleQuery);
    setIsMobile(mq.matches);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [singleQuery]);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // The container's notch round the ⏸ ‹ › row (variant "process", desktop):
  // its fill is a ::before clipped to the outline (--pn-clip), so the row
  // sitting in the notch is never cut.
  useLayoutEffect(() => {
    const w = wrapRef.current;
    if (variant !== 'process' || !w) return;
    const mq = window.matchMedia(PROCESS_NOTCH_MQ);
    const sync = () => {
      const nav = navRef.current;
      const ww = w.offsetWidth, wh = w.offsetHeight;
      if (!mq.matches || !nav || !nav.offsetWidth || !ww || !wh) {
        delete w.dataset.notch;
        w.style.removeProperty('--pn-clip');
        return;
      }
      w.dataset.notch = '';
      // (the site-wide card corner: the wrap itself stays square, see CSS)
      const opts = processNotchOpts({ width: nav.offsetWidth, height: nav.offsetHeight }, CARD_RADIUS);
      const d = notchPath(ww, wh, opts);
      // the notch's size, for the wrap's clip (room for the buttons' shadows)
      w.style.setProperty('--pn-nw', `${opts.nw}px`);
      w.style.setProperty('--pn-nh', `${opts.nh}px`);
      // the cards' rim as drawn (device-pixel snapped): their border and
      // the hover ring lying on it take this exact width
      w.style.setProperty('--rim', `${rimPx()}px`);
      w.style.setProperty('--pn-clip', `path('${d}')`);
      setOutline(w.querySelector<SVGSVGElement>(':scope > .pn-outline'), ww, wh, d);
      setOutline(w.querySelector<SVGSVGElement>(':scope > .pn-inset'), ww, wh, d);
    };
    sync();
    mq.addEventListener?.('change', sync);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(sync);
    ro?.observe(w);
    if (navRef.current) ro?.observe(navRef.current);
    return () => {
      ro?.disconnect();
      mq.removeEventListener?.('change', sync);
    };
  }, [variant, maxOffset]);
  // Live drag state lives in a ref, not React state: a setState per
  // pointermove re-rendered every card (BorderGlow, illustration layers)
  // ~60×/s and made finger swipes stutter on phones. The move handler
  // writes the track's transform straight to the DOM instead.
  const dragRef = useRef({ active: false, startX: 0, dx: 0, lastX: 0, lastT: 0, vx: 0 });
  const [cardStepPx, setCardStepPx] = useState(0);
  const [risen, setRisen] = useState(false);
  // The play/pause button in the ‹ › row: paused holds the countdown
  // (fill frozen where it is) until played again.
  const [paused, setPaused] = useState(false);

  // Hold off autoplay until the cards have finished useRiseReveal's scroll-in
  // animation, instead of starting immediately on mount — otherwise the
  // carousel could start sliding mid-reveal. useRiseReveal dispatches
  // 'rise-settled' (bubbling) on each card as it finishes; the left→right
  // stagger means later columns settle after the first one fires, so wait
  // out that same worst-case stagger window (5 columns * 0.15s delay + the
  // ~1.2s settle duration, rounded up) before flipping ready. Skips straight
  // to ready under reduced motion, since useRiseReveal never fires the event
  // there at all.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRisen(true);
      return;
    }
    const track = trackRef.current;
    if (!track) return;
    let bufferId: ReturnType<typeof setTimeout> | null = null;
    const onSettled = () => {
      track.removeEventListener('rise-settled', onSettled);
      bufferId = setTimeout(() => setRisen(true), 1500);
    };
    track.addEventListener('rise-settled', onSettled);
    return () => {
      track.removeEventListener('rise-settled', onSettled);
      if (bufferId) clearTimeout(bufferId);
    };
  }, []);

  function cardStep() {
    const track = trackRef.current;
    const card = track?.children[0] as HTMLElement | undefined;
    if (!track || !card) return 0;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    // Computed width, not getBoundingClientRect: the rect includes any
    // transform on the slot, which would mis-size every slide.
    return (parseFloat(getComputedStyle(card).width) || 0) + gap;
  }

  // Measure the rendered card width/gap after layout — cardStep() reads the
  // DOM, so it can't run during render (refs aren't guaranteed attached yet,
  // and React may discard/redo a render pass before committing).
  // The ResizeObserver also catches the track getting its real size after
  // mount — e.g. a LazyUnit/Suspense boundary that commits this subtree
  // hidden (display: none) first, where the first measurement reads 0.
  useLayoutEffect(() => {
    setCardStepPx(cardStep());
    const onResize = () => setCardStepPx(cardStep());
    window.addEventListener('resize', onResize);
    const track = trackRef.current;
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    if (track) observer?.observe(track);
    return () => {
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
    };
  }, [cards.length, isMobile]);

  function goTo(next: number) {
    setOffset(Math.min(maxOffset, Math.max(0, next)));
  }

  function onPointerDown(e: ReactPointerEvent) {
    if (maxOffset === 0) return;
    const now = performance.now();
    dragRef.current = { active: true, startX: e.clientX, dx: 0, lastX: e.clientX, lastT: now, vx: 0 };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent) {
    const d = dragRef.current;
    if (!d.active) return;
    const now = performance.now();
    if (now > d.lastT) d.vx = (e.clientX - d.lastX) / (now - d.lastT);
    d.lastX = e.clientX;
    d.lastT = now;
    let dx = e.clientX - d.startX;
    // Rubber-band past either end instead of sliding freely into nothing.
    if ((offset === 0 && dx > 0) || (offset === maxOffset && dx < 0)) dx *= 0.35;
    d.dx = dx;
    const track = trackRef.current;
    if (track) track.style.transform = `translateX(${-(offset * cardStepPx) + dx}px)`;
  }

  function endDrag() {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    const step = cardStepPx;
    // A quick flick counts even if it's short; the velocity is the last
    // pointermove's, must point the same way as the drag, and is stale
    // (a finger that stopped before lifting) after 100ms.
    const flick = performance.now() - d.lastT < 100
      && Math.abs(d.vx) > SWIPE_FLICK_PX_PER_MS && Math.sign(d.vx) === Math.sign(d.dx);
    const next = step > 0 && (Math.abs(d.dx) > step * 0.2 || flick)
      ? Math.min(maxOffset, Math.max(0, offset + (d.dx < 0 ? 1 : -1)))
      : offset;
    // The move handler wrote the transform behind React's back; settle it
    // here too, so a snap-back to the same offset (where React sees no prop
    // change and writes nothing) still animates home.
    const track = trackRef.current;
    if (track) {
      track.style.transition = SWIPE_TRANSITION;
      track.style.transform = `translateX(${-(next * step)}px)`;
    }
    setDragging(false);
    if (next !== offset) goTo(next);
  }

  // Autoplay: advance one card every 6s, looping back to the start. Paused
  // while the user is dragging so it doesn't fight a manual swipe. A single
  // re-scheduling setTimeout (not setInterval) keyed on `offset` — not just
  // `[maxOffset, dragging, risen]` — so a manual swipe (drag or the Swipe
  // button) restarts the 6s countdown from that moment instead of leaving
  // the old interval's phase running underneath. This keeps the dot-fill
  // animation below (also keyed on `offset`, see render) in sync with when
  // the *next* auto-advance actually happens, instead of drifting apart.
  // The fill's own animationend is what advances (advanceOnFill below), so
  // the bar and the slide can't drift apart: a phone throttles timers
  // (backgrounded tab, app switch) but not the CSS animation, and a
  // separate 6s timer then slid the card while the bar sat full or half-way.
  // This timer is only the fallback for when no fill is running.
  useEffect(() => {
    if (maxOffset === 0 || dragging || !risen || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setTimeout(() => {
      setOffset(o => (o >= maxOffset ? 0 : o + 1));
    }, AUTOPLAY_FALLBACK_MS);
    return () => clearTimeout(id);
  }, [maxOffset, dragging, risen, offset, paused]);

  const advanceOnFill = (e: ReactAnimationEvent) => {
    if (e.animationName === 'process-dot-progress') setOffset(o => (o >= maxOffset ? 0 : o + 1));
  };

  const translatePx = -(offset * cardStepPx);
  const dotCount = maxOffset + 1;
  // Gate on `risen` too — otherwise the dot-fill span below mounts (and its
  // 6s CSS fill starts ticking) the instant the carousel renders, well
  // before the autoplay effect above is actually allowed to advance, so the
  // dot would show "full" long before the carousel really slides.
  const autoplayLive = maxOffset > 0 && !dragging && risen && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Only when there is an autoplay to stop (not under reduced motion).
  const canAutoplay = maxOffset > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toggle = (where: string) => canAutoplay && (
    <PlayPauseButton className={`process-swipe-arrow process-swipe-toggle--${where}`} paused={paused} onToggle={() => setPaused(p => !p)} />
  );

  if (mobileOnly && !isMobile) return <div className={className}>{cards}</div>;

  const showTabs = !!tabs && visible === 1 && tabs.length === cards.length;

  return (
    <div ref={wrapRef} className={`process-scroll-wrap${variant ? ` process-scroll-wrap--${variant}` : ''}${showTabs ? ' process-scroll-wrap--tabs' : ''}`}>
      {/* the notched container's border (desktop, variant "process") */}
      {variant === 'process' && <StageInset className="pn-inset" />}
      {variant === 'process' && <svg className="stage-outline pn-outline" aria-hidden="true"><path fill="none" /></svg>}
      {/* Tabs sit above the cards (apple.com puts them below; here they
          read as the section's chooser before the card). */}
      {showTabs && maxOffset > 0 && (
        <div className="process-tabs" role="tablist">
          {tabs!.map((tab, i) => {
            const on = i === offset;
            return (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={on}
                className={`process-tab${on ? ' is-active' : ''}`}
                style={{ '--tab-c': tab.color, '--tab-c2': tab.color2 ?? tab.color } as CSSProperties}
                onClick={() => goTo(i)}
              >
                <span className="process-tab-label">{tab.label}</span>
                <span className="process-tab-bar" aria-hidden="true">
                  {on && <span key={offset} className={`process-tab-fill${autoplayLive ? ' is-timing' : ''}${paused ? ' is-paused' : ''}`} onAnimationEnd={advanceOnFill} />}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <div
        className={`process-column-grid process-column-grid--inhouse${dragging ? ' is-dragging' : ''}`}
        ref={trackRef}
        style={{ transform: `translateX(${translatePx}px)`, transition: dragging ? 'none' : SWIPE_TRANSITION }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {cards.map((card, i) => {
          const slot = i - offset;
          // Clamp both ends to the visible range's max — cards waiting
          // off-screen don't need to keep climbing/sinking past what the
          // tallest visible card already uses, since that's invisible
          // anyway (clipped by .process-scroll-wrap). Without this clamp,
          // off-screen cards on the left grow taller than any visible step
          // and inflate the track's height, which pushes the gap to the
          // title above and the swipe controls below out of place.
          const maxMargin = (visible - 1) * STAIR_STEP;
          const marginTop = Math.min(maxMargin, Math.max(0, (visible - 1 - slot) * STAIR_STEP));
          return (
            <div
              key={i}
              // (out of view: the neighbours peeking at the container's edges)
              className={`process-swipe-slot${slot < 0 || slot >= visible ? ' is-out' : ''}`}
              style={{ marginTop, transition: dragging ? 'none' : 'margin-top .45s cubic-bezier(.22,.61,.36,1)' }}
            >
              {card}
            </div>
          );
        })}
      </div>
      {!showTabs && maxOffset > 0 && (
        <>
          {/* phones (apple.com's phone carousels): the dots in a pill with
              the play/pause button beside it, centred; wider screens keep
              the button in the ‹ › row (CSS shows one or the other) */}
          <div className="process-swipe-controls">
            <div className="process-swipe-dots">
              {Array.from({ length: dotCount }).map((_, i) => (
                <span key={i} className={`process-swipe-dot${i === offset ? ' active' : ''}`}>
                  {i === offset && autoplayLive && <span key={offset} className={`process-swipe-dot-fill${paused ? ' is-paused' : ''}`} onAnimationEnd={advanceOnFill} />}
                </span>
              ))}
            </div>
            {toggle('phone')}
          </div>
          {/* Apple-style ‹ › pair (apple.com product carousels): round
              buttons, the one facing an end greyed out. Autoplay still
              loops back to the start on its own. */}
          <div className="process-swipe-nav" ref={navRef}>
            {/* play/pause leads the ‹ › row, same round button */}
            {toggle('nav')}
            <button
              type="button"
              className="process-swipe-arrow"
              aria-label="Previous"
              disabled={offset <= 0}
              onClick={() => goTo(offset - 1)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button
              type="button"
              className="process-swipe-arrow"
              aria-label="Next"
              disabled={offset >= maxOffset}
              onClick={() => goTo(offset + 1)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// The three sections below are separate components so each can be a
// LazyUnit of its own: it unmounts once the viewer is more than one section
// away and remounts (replaying its entrance) when they come back.

// DESIGN PROCESS
function DesignProcessSection() {
  const { t } = useLang();
  const sectionRef = useRef<HTMLElement>(null);
  const processThemes = useProcessCardThemes(sectionRef);

  return (
      <section className="section section-band" ref={sectionRef}>
        <div className="section-label rise-soft">My Design Process</div>
        <div className="process-dual">
          <div className="process-column">
            <div className="process-column-head">
              <div className="process-column-header">
                <span>{t.tab_inhouse}</span>
              </div>
              <p className="process-column-desc">{t.tab_inhouse_desc}</p>
              <PolicyPill icon="ph-users-three" label={t.process_policy_team_title} body={t.process_policy_team_body} />
            </div>
            <ProcessCarousel
              variant="process"
              cards={(['Align','Research','Structure','Design','Validate','Iterate'] as const).map((slug, i) => {
                const idx = String(i + 1).padStart(2, '0') as '01'|'02'|'03'|'04'|'05'|'06';
                const nameKey = `ih_name_${idx}` as keyof typeof t;
                const descKey = `ih_desc_${idx}` as keyof typeof t;
                return (
                  <BorderGlow
                    key={slug}
                    className="process-card process-card--has-img rise-card"
                    backgroundColor="#13101c"
                    spotlightColor="rgba(108, 99, 255, 0.12)"
                    backgroundSlot={<ProcessCardBg slug={slug} themes={processThemes} />}
                  >
                    <span className="process-step-badge"><span className="about-notch-badge-dot" aria-hidden="true" />STEP · {idx}</span>
                    <div className="process-name">{t[nameKey] as string}</div>
                    <div className="process-desc">{t[descKey] as string}</div>
                  </BorderGlow>
                );
              })}
            />
          </div>
          <div className="process-column">
            <div className="process-column-head">
              <div className="process-column-header">
                <span>{t.tab_freelance}</span>
              </div>
              <p className="process-column-desc">{t.tab_freelance_desc}</p>
            </div>
            <ProcessCarousel
              variant="process"
              cards={(['Intake','AI Brief','Triage','Discovery','Proposal','Delivery'] as const).map((slug, i) => {
                const idx = String(i + 1).padStart(2, '0') as '01'|'02'|'03'|'04'|'05'|'06';
                const nameKey = `fl_name_${idx}` as keyof typeof t;
                const descKey = `fl_desc_${idx}` as keyof typeof t;
                return (
                  <BorderGlow
                    key={slug}
                    className="process-card process-card--has-img rise-card"
                    backgroundColor="#13101c"
                    spotlightColor="rgba(108, 99, 255, 0.12)"
                    backgroundSlot={<ProcessCardBg slug={slug} themes={processThemes} />}
                  >
                    <span className="process-step-badge"><span className="about-notch-badge-dot" aria-hidden="true" />STEP · {idx}</span>
                    <div className="process-name">{t[nameKey] as string}</div>
                    <div className="process-desc">{t[descKey] as string}</div>
                  </BorderGlow>
                );
              })}
            />
          </div>
        </div>
      </section>
  );
}

// TECH STACK
function TechStackSection() {
  const { t } = useLang();

  // Spotlight cards — identical mechanism to ContactSection's working
  // effect: plain mousemove/mouseleave, scoped to this section's own root
  // so it doesn't cross-contaminate About's/Contact's .sc-card elements. No
  // matchMedia gate and no pointerType filter — a filter on pointerType
  // wrongly bailed on devices whose mouse/trackpad reports a non-'mouse'
  // pointerType, killing the effect entirely. These tech cards also carry
  // the .card-spotlight colored tint (::before at --mouse-x/--mouse-y), which
  // Contact's plain sc-cards don't, so drive those vars here too.
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('#tech-stack .sc-card').forEach(card => {
      if (card.querySelector(':scope > .sc-overlay')) return;
      const ov = document.createElement('div');
      ov.className = 'sc-overlay';
      card.insertBefore(ov, card.firstChild);

      const onMove = (e: MouseEvent) => {
        // .sc-overlay/.card-spotlight::before are opacity:0 !important in
        // light mode's neumorphism block (portfolio.css) — nothing to paint.
        if (document.documentElement.getAttribute('data-theme') === 'light') return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) + 'px';
        const y = (e.clientY - r.top) + 'px';
        card.style.setProperty('--sc-x', x);
        card.style.setProperty('--sc-y', y);
        card.style.setProperty('--mouse-x', x);
        card.style.setProperty('--mouse-y', y);
      };
      const onLeave = () => {
        card.style.setProperty('--sc-x', '-500px');
        card.style.setProperty('--sc-y', '-500px');
        card.style.setProperty('--mouse-x', '-500px');
        card.style.setProperty('--mouse-y', '-500px');
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }, [t]);

  return (
      <section id="tech-stack" className="section">
        <div className="section-label rise-soft">Tech Stack</div>
        <h2 className="about-h2 rise-soft" style={{ marginBottom: '8px' }}>Web development <span className="gradient-text">literacy</span></h2>
        <p className="tech-sub rise-soft" dangerouslySetInnerHTML={{ __html: t.tech_sub }} />
        <ProcessCarousel
          mobileOnly
          className="tech-items"
          variant="tech"
          tabs={[
            { label: 'HTML / CSS', color: '#60a5fa', color2: '#3b82f6' },
            { label: 'JavaScript', color: '#fb923c', color2: '#f97316' },
            { label: 'React / Vue', color: '#8b7bff', color2: '#6C63FF' },
          ]}
          cards={[
          <div key="html" className="tech-item-wrap rise-card">
            <div className="tech-item html-item card-spotlight sc-card">
              <span className="card-glass-highlight" aria-hidden="true" />
              <div className="tech-item-text">
                <div className="tech-item-header">
                  <span className="tech-name"><i className="fab fa-html5" style={{ color: '#60a5fa', marginRight: '8px' }}></i>HTML / CSS / Tailwind</span>
                </div>
                <div className="tech-desc">{t.skill_html}</div>
              </div>
              <HtmlDemo />
            </div>
            <span className="tech-level-badge html-item">DESIGN-READY</span>
          </div>,
          <div key="js" className="tech-item-wrap rise-card">
            <div className="tech-item js-item card-spotlight sc-card">
              <span className="card-glass-highlight" aria-hidden="true" />
              <div className="tech-item-text">
                <div className="tech-item-header">
                  <span className="tech-name"><i className="fab fa-js" style={{ color: '#fb923c', marginRight: '8px' }}></i>JavaScript</span>
                </div>
                <div className="tech-desc">{t.skill_js}</div>
              </div>
              <JsDemo />
            </div>
            <span className="tech-level-badge js-item">AI-ASSISTED</span>
          </div>,
          <div key="react" className="tech-item-wrap rise-card">
            <div className="tech-item react-item card-spotlight sc-card">
              <span className="card-glass-highlight" aria-hidden="true" />
              <div className="tech-item-text">
                <div className="tech-item-header">
                  <span className="tech-name"><i className="fab fa-react" style={{ color: '#a5b4fc', marginRight: '8px' }}></i>React.js / Vue.js</span>
                </div>
                <div className="tech-desc">{t.skill_css}</div>
              </div>
              <RwdDemo />
            </div>
            <span className="tech-level-badge react-item">RESPONSIVE</span>
          </div>
          ]}
        />
        {/* the heading pins with the showcase; it rides the track's reveal
            band for the same reason the grid does (see FigmaMcpShowcase) */}
        <FigmaMcpShowcase
          header={
            <div className="figma-mcp-header rise-soft" data-rise-with=".mcp-scroll">
              <h3>{t.figma_mcp_title}</h3>
              <p dangerouslySetInnerHTML={{ __html: t.figma_mcp_desc }} />
            </div>
          }
        />
      </section>
  );
}

// The viewer step the visitor last picked. It lives outside the component
// so the lazy unit can unmount (and replay its entrance on the way back,
// like every other section) without losing the visitor's place.
let lastViewerStep: string | null = null;
export function resetAiViewerStep() { lastViewerStep = null; }

// MY SKILLS + HOW I USE AI (merged)
export function AiIntakeSection() {
  const { t } = useLang();
  const aiCards = useMemo(() => makeAiCards(t), [t]);
  const [expandedAiCard, setExpandedAiCard] = useState<string | null>(() => lastViewerStep);
  // Which AI_CHIP_CATEGORIES / GEMINI_BEAM_STOPS chips their beam has
  // reached yet — drives the arrival glow on .ai-chip (see GoogleGeminiEffect's
  // onArriveChange).
  const [arrivedBeams, setArrivedBeams] = useState<boolean[]>([false, false, false, false, false]);

  // The steps are an Apple-style product viewer at every width.
  // Desktop (>960px): a column of pills on the left, the open one grown into
  // a summary card, the app-window stage on the right.
  // Compact (≤960px, Apple's phone layout): stage on top, the pills as a
  // swipeable row under it; tapping one grows it into a centred card with
  // ‹ › to step through and ✕ to fold it back into the row.
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(AI_COMPACT_MQ).matches);
  useEffect(() => {
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia(AI_COMPACT_MQ) : null;
    if (!mq) return;
    const onChange = () => setIsCompact(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  const viewerRef = useRef<HTMLDivElement>(null);
  // the section's label / title / subtitle, which sit in the viewer's
  // top-left notch, and the outline drawn along it (utils/aiStageNotch.ts)
  const aiLabelRef = useRef<HTMLDivElement>(null);
  const aiTitleRef = useRef<HTMLHeadingElement>(null);
  const aiSubRef = useRef<HTMLParagraphElement>(null);
  const aiOutlineRef = useRef<SVGSVGElement>(null);
  const aiOutlinePathRef = useRef<SVGPathElement>(null);
  const pillRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  // Skills scrollers
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const init = () => {
      document.querySelectorAll<HTMLElement>('.skills-scroller').forEach(s => createScroller(s, 80, 25));
    };

    if (document.fonts) {
      document.fonts.ready.then(init);
    } else {
      window.addEventListener('load', init, { once: true });
    }
  }, []);

  // Scroll-reveal (.rise-card/.rise-soft → elastic rise + squash-stretch) is
  // handled site-wide by useRiseReveal(), called once in App.tsx.

  // Desktop viewer — exactly one step is always open; picking another
  // swaps it (there's no "close", same as Apple's viewer).
  const expandedRef = useRef<string | null>(expandedAiCard);
  // The stage (AiAppStage) runs its own per-screen intros.
  const selectAiStep = (id: string) => {
    if (id === expandedRef.current) return;
    expandedRef.current = id;
    lastViewerStep = id;
    setExpandedAiCard(id);
  };
  const selectAiStepRef = useRef(selectAiStep);
  // Keep both refs current for the IntersectionObserver callback below,
  // which outlives the render it was created in.
  useLayoutEffect(() => {
    expandedRef.current = expandedAiCard;
    selectAiStepRef.current = selectAiStep;
  });

  // Entrance: the stage rises in from below (rise-card); the rail and the
  // front panel come in from the left, the LINE phone from the right.
  useEffect(() => {
    if (!viewerRef.current) return;
    return attachAiViewerEntrance(viewerRef.current);
  }, []);

  // My Portfolio's top-left notch, cut round the section's headline.
  useLayoutEffect(() => {
    const v = viewerRef.current, l = aiLabelRef.current, t = aiTitleRef.current, s = aiSubRef.current;
    const svg = aiOutlineRef.current, p = aiOutlinePathRef.current;
    if (!AI_VIEWER_NOTCH || !v || !l || !t || !s || !svg || !p) return;
    return attachStageNotch(v, l, t, s, svg, p);
  }, []);

  // The solid stage's left-edge bay round the ⌃ ⌄ pair (desktop): the fill
  // is the viewer's ::before, clipped to the outline (--av-clip).
  useLayoutEffect(() => {
    const v = viewerRef.current;
    if (AI_VIEWER_NOTCH || !AI_VIEWER_STAGE || !v) return;
    const mq = window.matchMedia(AI_STAGE_MQ);
    const sync = () => {
      const nav = v.querySelector<HTMLElement>('.ai-viewer-nav');
      const w = v.offsetWidth, h = v.offsetHeight;
      if (!mq.matches || !nav || !nav.offsetWidth || !w || !h) {
        delete v.dataset.avNotch;
        v.style.removeProperty('--av-clip');
        return;
      }
      v.dataset.avNotch = '';
      const cs = getComputedStyle(v);
      const cornerShape = cs.getPropertyValue('corner-top-left-shape') || cs.getPropertyValue('corner-shape');
      // the buttons' box in the viewer's own (untransformed) frame: the
      // rise entrance moves / squashes the viewer, so divide its scale out
      const vr = v.getBoundingClientRect();
      const kx = vr.width / w || 1, ky = vr.height / h || 1;
      const btns = [...nav.querySelectorAll<HTMLElement>('.ai-viewer-nav-btn')].map(b => b.getBoundingClientRect());
      if (!btns.length) return;
      const first = nav.querySelector<HTMLElement>('.ai-viewer-nav-btn')!;
      const d = leftBayPath(w, h, {
        r: parseFloat(cs.borderTopLeftRadius) || 0,
        shape: /squircle|superellipse\(2\)/.test(cornerShape) ? 'squircle' : 'round',
        bay: navBaySize({
          top: (btns[0].top - vr.top) / ky,
          bottom: (btns[btns.length - 1].bottom - vr.top) / ky,
          right: Math.max(...btns.map(b => (b.right - vr.left) / kx)),
          radius: first.offsetWidth / 2,
        }),
      });
      v.style.setProperty('--av-clip', `path('${d}')`);
      setOutline(v.querySelector<SVGSVGElement>(':scope > .av-outline'), w, h, d);
      setOutline(v.querySelector<SVGSVGElement>(':scope > .av-inset'), w, h, d);
    };
    sync();
    mq.addEventListener?.('change', sync);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(sync);
    ro?.observe(v);
    const nav = v.querySelector<HTMLElement>('.ai-viewer-nav');
    if (nav) ro?.observe(nav);
    return () => {
      ro?.disconnect();
      mq.removeEventListener?.('change', sync);
    };
  }, []);

  // Open step 01 the first time the viewer scrolls into view, so its demo
  // plays where it can be seen (it replays after a lazy-unit remount too).
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const openFirst = () => {
      if (expandedRef.current == null) selectAiStepRef.current(AI_VIEWER_FIRST);
    };
    if (typeof IntersectionObserver === 'undefined') {
      openFirst();
      return;
    }
    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      io.disconnect();
      openFirst();
    }, { rootMargin: '0px 0px -25% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pill ↔ summary-card morph. The background layer tweens to the measured
  // size of whatever it should wrap (the open card's content, or the
  // closed pill's label button); its 28px radius never changes, so 56px-tall
  // reads as a pill and anything taller reads as a rounded card. The <li>
  // tweens its height alongside so the pills below slide out of the way.
  // One gsap.context for the viewer's lifetime: reverting it on every
  // change would snap the pills back to their CSS size mid-morph.
  const pillCtxRef = useRef<gsap.Context | null>(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {}, viewerRef);
    pillCtxRef.current = ctx;
    return () => {
      ctx.revert();
      pillCtxRef.current = null;
    };
  }, []);
  // The open card's width follows the rail column (clamp(…, 29vw, …)), so a
  // window resize leaves the tweened sizes stale — re-measure, without
  // animating, whenever the viewer itself changes size.
  const [viewerResizeTick, setViewerResizeTick] = useState(0);
  const pillSnapRef = useRef(false);
  // set by a swipe that changes step (see the compact swipe below)
  const swipeMorphRef = useRef(false);
  const swipeCommitRef = useRef<{ offset: number } | null>(null);
  useEffect(() => {
    const el = viewerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let lastWidth = el.getBoundingClientRect().width;
    const ro = new ResizeObserver(() => {
      const width = el.getBoundingClientRect().width;
      if (width === lastWidth) return; // height changes come from the morph itself
      lastWidth = width;
      pillSnapRef.current = true;
      setViewerResizeTick(n => n + 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useLayoutEffect(() => {
    const ctx = pillCtxRef.current;
    if (!ctx) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const snap = reduced || pillSnapRef.current;
    pillSnapRef.current = false;
    // a swipe's step: the highlight lands with the track (same time, curve)
    const swiped = swipeMorphRef.current;
    swipeMorphRef.current = false;
    ctx.add(() => {
      const pills = Array.from(pillRefs.current, ([id, li]) => {
        // Compact never unfolds a pill: the step's content sits under the row.
        const open = id === expandedAiCard && !isCompact;
        const bg = li.querySelector<HTMLElement>('.ai-pill-bg');
        const target = li.querySelector<HTMLElement>(open ? '.ai-pill-inner' : '.ai-pill-open');
        return bg && target ? { li, bg, target } : null;
      }).filter(p => p !== null);
      // Writes, then all reads, then the tweens: one layout pass instead of
      // a forced reflow per pill (a 0s snap tween writes immediately).
      if (!isCompact) pills.forEach(p => gsap.set(p.li, { clearProps: 'width' }));
      const sizes = pills.map(p => ({ width: p.target.offsetWidth, height: p.target.offsetHeight }));
      const tween = { duration: snap ? 0 : swiped ? SWIPE_SLIDE_MS / 1000 : AI_PILL_MORPH_S, ease: swiped ? SWIPE_EASE : 'power3.inOut', overwrite: 'auto' as const };
      pills.forEach((p, i) => {
        // Compact: the <li> takes its new size at once (the + / icon swap is
        // only ~6px) while the background still eases. A tweening row would
        // let the row's scroll snap lock onto a mid-morph position, leaving
        // the current pill short of its spot at the start. Desktop: the <li>
        // keeps the closed pill's width and the card overhangs it.
        if (isCompact) gsap.set(p.li, sizes[i]);
        else gsap.to(p.li, { height: sizes[i].height, ...tween });
        gsap.to(p.bg, { ...sizes[i], ...tween });
      });
    });
  }, [expandedAiCard, isCompact, t, viewerResizeTick]);

  // Compact: a pill is a tab — tapping it puts that step's content under the
  // row (.ai-compact-summary) and its demo on stage; the row then scrolls the
  // current pill to its left edge (without moving the page).
  const openStep = (id: string) => selectAiStep(id);
  useEffect(() => {
    if (!isCompact || !expandedAiCard) return;
    const li = pillRefs.current.get(expandedAiCard);
    const row = li?.parentElement;
    if (!li || !row) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    // Sizes from each pill's own label box (its final size, whatever the
    // morph above is doing to the <li>).
    const cs = getComputedStyle(row);
    const gap = parseFloat(cs.columnGap) || 0;
    const padL = parseFloat(cs.paddingLeft) || 0;
    const width = (el: Element) => el.querySelector<HTMLElement>('.ai-pill-open')?.offsetWidth ?? (el as HTMLElement).offsetWidth;
    // Room after the last pill (.ai-pills::after) so the last few can reach
    // the left edge too, instead of stopping where the row runs out.
    const last = row.lastElementChild;
    if (last) {
      const tail = row.clientWidth - padL - (parseFloat(cs.paddingRight) || 0) - width(last) - gap;
      row.style.setProperty('--ai-pills-tail', `${Math.max(0, tail)}px`);
    }
    let left = padL - (parseFloat(cs.scrollPaddingLeft) || 0);
    for (let el = row.firstElementChild; el && el !== li; el = el.nextElementSibling) left += width(el) + gap;
    // a swipe's step: the row glides on from where the drag left it, with
    // the track (snap off until it lands, or it would yank the row)
    if (swipeCommitRef.current && !reduced) {
      row.style.scrollSnapType = 'none';
      gsap.to(row, { scrollLeft: left, duration: SWIPE_SLIDE_MS / 1000, ease: SWIPE_EASE, overwrite: true, onComplete: () => { row.style.scrollSnapType = ''; } });
    } else {
      row.scrollTo?.({ left, behavior: reduced ? 'auto' : 'smooth' });
    }
    swipeCommitRef.current = null;
  }, [isCompact, expandedAiCard, viewerResizeTick]);

  // Cursor position for a pill's hover glow layers, written straight to the
  // background element (no re-render). Mouse only: a touch tap would leave
  // the glow parked wherever the finger landed. Skipped in light mode, where
  // the site hides these layers anyway.
  const setPillGlow = (bg: HTMLElement, x: string, y: string) => {
    bg.style.setProperty('--sc-x', x);
    bg.style.setProperty('--sc-y', y);
    bg.style.setProperty('--mouse-x', x);
    bg.style.setProperty('--mouse-y', y);
  };
  // At most one measure + write per frame: pointermove fires far more often
  // than the screen paints, and each read forces layout mid-morph.
  const pillGlowRef = useRef<{ bg: HTMLElement; x: number; y: number } | null>(null);
  const pillGlowRafRef = useRef(0);
  useEffect(() => () => cancelAnimationFrame(pillGlowRafRef.current), []);
  const onPillPointerMove = (e: ReactPointerEvent<HTMLLIElement>) => {
    if (e.pointerType !== 'mouse' || document.documentElement.getAttribute('data-theme') === 'light') return;
    const bg = e.currentTarget.querySelector<HTMLElement>('.ai-pill-bg');
    if (!bg) return;
    pillGlowRef.current = { bg, x: e.clientX, y: e.clientY };
    if (pillGlowRafRef.current) return;
    pillGlowRafRef.current = requestAnimationFrame(() => {
      pillGlowRafRef.current = 0;
      const p = pillGlowRef.current;
      if (!p) return;
      const r = p.bg.getBoundingClientRect();
      setPillGlow(p.bg, `${p.x - r.left}px`, `${p.y - r.top}px`);
    });
  };
  const onPillPointerLeave = (e: ReactPointerEvent<HTMLLIElement>) => {
    pillGlowRef.current = null;
    cancelAnimationFrame(pillGlowRafRef.current);
    pillGlowRafRef.current = 0;
    const bg = e.currentTarget.querySelector<HTMLElement>('.ai-pill-bg');
    if (bg) setPillGlow(bg, '-500px', '-500px');
  };

  const viewerIndex = aiCards.findIndex(c => c.id === expandedAiCard);
  // Compact (phones): drag the step track sideways. It follows the finger
  // (resisting past either end), so the next / previous step's content and
  // demo are pulled in beside the current one, and the pill row scrolls
  // along toward that step's pill. Let go far enough and the track slides
  // the rest of the way and that step becomes the current one; otherwise it
  // springs back. Not from the pill row, which scrolls sideways itself; a
  // mostly vertical drag stays the page's scroll (the drag locks to one
  // axis on its first few pixels).
  const swipeRef = useRef<{ x: number; y: number; lock: 'x' | 'y' | null } | null>(null);
  const swipeTrackRef = useRef<HTMLDivElement>(null);
  const setTrack = (px: number, animate: boolean) => {
    const tr = swipeTrackRef.current;
    if (!tr) return;
    tr.style.transition = animate ? `transform ${SWIPE_SLIDE_MS}ms ${SWIPE_EASE_CSS}` : 'none';
    // (the resting offset, the centre slide in view, is the CSS one)
    tr.style.transform = px ? `translateX(calc(-100% - var(--swipe-gap) + ${px}px))` : '';
  };
  // the row's scroll position that puts a pill at its left edge (as the
  // compact row-scroll effect above does)
  const pillLeft = (row: HTMLElement, li: Element) => {
    const cs = getComputedStyle(row);
    const gap = parseFloat(cs.columnGap) || 0;
    let left = (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.scrollPaddingLeft) || 0);
    for (let el = row.firstElementChild; el && el !== li; el = el.nextElementSibling) {
      left += (el.querySelector<HTMLElement>('.ai-pill-open')?.offsetWidth ?? (el as HTMLElement).offsetWidth) + gap;
    }
    return left;
  };
  // the pill row follows the drag: part way from the current pill to the
  // one the drag heads for (snap off meanwhile, or it would fight)
  const syncPills = (progress: number) => {
    const i = Math.max(viewerIndex, 0);
    const cur = pillRefs.current.get(aiCards[i].id);
    const row = cur?.parentElement;
    const target = aiCards[i + (progress < 0 ? -1 : 1)];
    const to = target && pillRefs.current.get(target.id);
    if (!cur || !row || !to) return;
    row.style.scrollSnapType = 'none';
    const from = pillLeft(row, cur);
    row.scrollTo?.({ left: from + (pillLeft(row, to) - from) * Math.min(Math.abs(progress), 1), behavior: 'instant' as ScrollBehavior });
  };
  const releasePills = (back: boolean) => {
    const i = Math.max(viewerIndex, 0);
    const cur = pillRefs.current.get(aiCards[i].id);
    const row = cur?.parentElement;
    if (!cur || !row) return;
    // back to the current pill with the track's spring-back (time, curve)
    gsap.to(row, { scrollLeft: pillLeft(row, cur), duration: back ? SWIPE_SLIDE_MS / 1000 : 0, ease: SWIPE_EASE, overwrite: true, onComplete: () => { row.style.scrollSnapType = ''; } });
  };
  // a new current step: the track back to its centre slide, at once (the
  // slide dragged in is now that centre slide, keyed by step)
  // After a swipe it starts where the drag left that slide and glides the
  // rest of the way, in step with the pill row.
  useLayoutEffect(() => {
    const c = swipeCommitRef.current;
    if (!c) { setTrack(0, false); return; }
    setTrack(c.offset, false);
    void swipeTrackRef.current?.offsetWidth; // commit that start before the glide
    setTrack(0, true);
  }, [expandedAiCard]);
  const onViewerTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    swipeRef.current = isCompact && e.touches.length === 1 && !(e.target as HTMLElement).closest('.ai-viewer-rail')
      ? { x: touch.clientX, y: touch.clientY, lock: null } : null;
  };
  const onViewerTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    const s = swipeRef.current;
    const touch = e.touches[0];
    if (!s || !touch) return;
    const dx = touch.clientX - s.x, dy = touch.clientY - s.y;
    if (!s.lock && Math.hypot(dx, dy) > 8) s.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (s.lock !== 'x') return;
    const i = Math.max(viewerIndex, 0);
    const atEnd = (dx < 0 && i >= aiCards.length - 1) || (dx > 0 && i <= 0);
    setTrack(atEnd ? dx * 0.3 : dx, false);
    if (!atEnd) syncPills(-dx / (swipeTrackRef.current?.offsetWidth || 360));
  };
  const onViewerTouchEnd = (e: ReactTouchEvent<HTMLDivElement>) => {
    const s = swipeRef.current;
    swipeRef.current = null;
    const touch = e.changedTouches[0];
    if (!s || !touch || s.lock !== 'x') return;
    const dx = touch.clientX - s.x;
    const to = swipeStep(dx, touch.clientY - s.y, Math.max(viewerIndex, 0), aiCards.length);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (to === null) { setTrack(0, !reduced); releasePills(true); return; }
    if (reduced) { releasePills(false); openStep(aiCards[to].id); return; }
    // That step becomes the current one now; its slide (now the centre one)
    // starts where the drag left it (one slide plus the gap over) and the
    // track, pill row and highlight settle together (see the layout effect).
    const tr = swipeTrackRef.current;
    const w = (tr?.offsetWidth ?? 360) + (tr ? parseFloat(getComputedStyle(tr).columnGap) || 0 : 0);
    swipeCommitRef.current = { offset: dx < 0 ? dx + w : dx - w };
    swipeMorphRef.current = true;
    openStep(aiCards[to].id);
  };
  const onViewerTouchCancel = () => {
    if (swipeRef.current?.lock === 'x') { setTrack(0, true); releasePills(true); }
    swipeRef.current = null;
  };
  const aiViewer = (
    // One card holds both the pill rail and the demo (Apple's viewer keeps
    // its controls inside the product stage); its glow follows the open step.
    // The shell casts the card's shadow, which the notch clip would cut.
    <div className="ai-viewer-shell">
    <div
      className={`ai-viewer rise-card${isCompact ? ' is-compact' : ''}${AI_VIEWER_NOTCH ? '' : ' is-bare'}${!AI_VIEWER_NOTCH && AI_VIEWER_STAGE ? ' is-stage' : ''}`}
      ref={viewerRef}
      data-accent={aiCards[Math.max(viewerIndex, 0)].variant}
      onTouchStart={onViewerTouchStart}
      onTouchMove={onViewerTouchMove}
      onTouchEnd={onViewerTouchEnd}
      onTouchCancel={onViewerTouchCancel}
    >
      {/* The card's surface (fill, blur, border stroke) when notched: the
          clip sits on this untransformed layer, not on the viewer, whose
          rise entrance (transform + opacity) drops a clip on itself. */}
      <div className="ai-viewer-skin" aria-hidden="true">
        <svg ref={aiOutlineRef} className="notch-outline ai-viewer-outline">
          <defs>
            <radialGradient id="ai-viewer-ring-glow" gradientUnits="userSpaceOnUse" cx="-500" cy="-500" r="280">
              <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
              <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path ref={aiOutlinePathRef} fill="none" />
          <path className="notch-ring" fill="none" stroke="url(#ai-viewer-ring-glow)" />
        </svg>
      </div>
      {/* the solid stage's border (AI_VIEWER_STAGE), along its bay path */}
      <StageInset className="av-inset" />
      <svg className="stage-outline av-outline" aria-hidden="true"><path fill="none" /></svg>
      {isCompact && viewerIndex >= 0 && aiCards[viewerIndex].badge && (
        <span className="ai-focal-badge ai-stage-badge">{aiCards[viewerIndex].badge}</span>
      )}
      <div className="ai-viewer-rail">
        <div className="ai-pills-wrap">
          <span className="ai-rail-track" aria-hidden="true"><span className="ai-rail-spark" /></span>
          <ul className="ai-pills">
            {aiCards.map(card => {
              const isCurrent = expandedAiCard === card.id;
              // Desktop: the current step is always unfolded. Compact: never —
              // its content is shown under the row instead.
              const isOpen = isCurrent && !isCompact;
              return (
                <li
                  key={card.id}
                  ref={(el: HTMLLIElement | null) => { if (el) pillRefs.current.set(card.id, el); else pillRefs.current.delete(card.id); }}
                  className={`ai-pill ${card.variant}${isCurrent ? ' is-current' : ''}${isOpen ? ' is-open' : ''}`}
                  onPointerMove={onPillPointerMove}
                  onPointerLeave={onPillPointerLeave}
                >
                  <span className="ai-pill-node" aria-hidden="true" />
                  {/* Hover treatment = the About Me / Contact Me cards'
                      (.card-spotlight + .sc-card + card-radar): tinted cursor
                      spotlight (open card only), cursor wash, cursor edge
                      ring, big-blur hover shadow, radar pulse, 4px lift, plus
                      the glass top-line highlight. The layers sit inside the
                      background because that — not the <li>, which keeps the
                      closed pill's width — is the card's real size. */}
                  <span className="ai-pill-bg" aria-hidden="true">
                    <span className="card-hover-shadow" />
                    <span className="spotlight-layer" />
                    <span className="sc-overlay" />
                    <span className="sc-ring" />
                    <span className="card-glass-highlight" />
                  </span>
                  <button
                    type="button"
                    className="ai-pill-open"
                    aria-expanded={isOpen}
                    aria-controls={`ai-stage-${card.id}`}
                    onClick={() => openStep(card.id)}
                  >
                    <span className="ai-pill-plus" aria-hidden="true" />
                    {/* Compact: the step whose content is showing swaps its + for its icon. */}
                    <span className="ai-pill-icon" aria-hidden="true">{card.icon}</span>
                    <span className="ai-pill-step">{card.step}</span>
                    <span className="ai-pill-label">{card.title}</span>
                  </button>
                  <div className="ai-pill-inner" aria-hidden={!isOpen}>
                    {card.badge && <span className="ai-focal-badge">{card.badge}</span>}
                    <div className="ai-pill-head">
                      <div className="ai-glyph">{card.icon}</div>
                      <div className="ai-pill-head-text">
                        <span className="ai-pill-step">{card.step}</span>
                        <h3>{card.title}</h3>
                      </div>
                    </div>
                    <p>{card.summary}</p>
                    {card.tags && (
                      <div className="ai-tags">
                        {card.tags.map(tag => <span key={tag} className="ai-tag">{tag}</span>)}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="ai-viewer-nav">
          <button
            type="button"
            className="ai-viewer-nav-btn"
            aria-label="Previous step"
            disabled={viewerIndex <= 0}
            onClick={() => openStep(aiCards[viewerIndex - 1].id)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
          </button>
          <button
            type="button"
            className="ai-viewer-nav-btn"
            aria-label="Next step"
            disabled={viewerIndex < 0 || viewerIndex >= aiCards.length - 1}
            onClick={() => openStep(aiCards[viewerIndex + 1].id)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <span className="ai-viewer-count">{viewerIndex < 0 ? '01' : aiCards[viewerIndex].step} / {String(aiCards.length).padStart(2, '0')}</span>
        </div>
      </div>
      {/* Compact: the current step's card content, printed straight under
          the pill row and above the app window (no unfolding card). The
          pill already carries the icon, step and title, so only the text;
          the step's badge sits on the viewer frame's top edge instead. */}
      {isCompact ? (
        // Compact: the previous, current and next steps side by side on one
        // track (content + demo each), the current one in view; a sideways
        // drag moves the whole track, so the neighbour is pulled in with it.
        // Slides are keyed by step, so after a swipe the one dragged in
        // stays the same element as it becomes the current one.
        <div className="ai-swipe">
          <div className="ai-swipe-track" ref={swipeTrackRef}>
            {[viewerIndex - 1, Math.max(viewerIndex, 0), viewerIndex + 1].map((i, slot) => {
              const card = aiCards[i];
              const peek = slot !== 1;
              if (!card || (peek && viewerIndex < 0)) return <div key={`end-${slot}`} className="ai-swipe-slide" aria-hidden="true" />;
              return (
                <div key={card.id} className={`ai-swipe-slide${peek ? ' is-peek' : ''}`} aria-hidden={peek || undefined} inert={peek}>
                  {(peek || viewerIndex >= 0) && (
                    <div className={peek ? 'ai-peek-summary' : 'ai-compact-summary'} aria-live={peek ? undefined : 'polite'}>
                      <p>{card.summary}</p>
                      {card.tags && (
                        <div className="ai-tags">
                          {card.tags.map(tag => <span key={tag} className="ai-tag">{tag}</span>)}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="ai-stage">
                    <AiAppStage steps={aiCards} active={peek ? card.id : expandedAiCard} peek={peek} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="ai-stage">
          <AiAppStage steps={aiCards} active={expandedAiCard} />
        </div>
      )}
    </div>
    </div>
  );

  return (
      <section id="my-skills" className="section section-band">
        <div ref={aiLabelRef} className="section-label rise-soft" {...AI_HEAD_RIDE}>How I Use AI</div>
        <h2 ref={aiTitleRef} className="about-h2 rise-soft" {...AI_HEAD_RIDE} style={{ letterSpacing: '-.02em', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
          AI-Assisted Design <span className="gradient-text">Intake System</span>
        </h2>
        <p
          ref={aiSubRef}
          className="ai-sub rise-soft"
          {...AI_HEAD_RIDE}
          style={{ fontSize: '14px', marginBottom: '-32px', maxWidth: 392 }}
          dangerouslySetInnerHTML={{ __html: t.ai_sub }}
        />

        {aiViewer}

        <div className="ai-chips-header rise-card">
          <h3>{t.ai_chips_label}</h3>
          <p>AI handles <em>structure</em><span className="ai-principle-dot"></span>I handle <em>judgment</em>.</p>
        </div>

        <div className="ai-chips-row rise-card">
          <div className="ai-word-cloud" aria-hidden="true">
            {AI_SOURCE_CLOUD.map(word => (
              <span
                key={word.text}
                style={{
                  top: word.top,
                  left: word.left,
                  fontSize: `${word.size}px`,
                  opacity: word.opacity,
                  ['--word-rotate' as string]: `${word.rotate}deg`,
                }}
              >
                <i className={word.icon} aria-hidden="true" />
                {word.text}
              </span>
            ))}
          </div>
          <GoogleGeminiEffect onArriveChange={setArrivedBeams} />
          <div className="ai-chips">
            {AI_CHIP_CATEGORIES.map((chip, i) => {
              const stop = GEMINI_BEAM_STOPS[i];
              return (
                <span
                  key={chip.label}
                  className={`ai-chip${arrivedBeams[i] ? ' is-arrived' : ''}`}
                  style={{ top: `${stop.topPercent}%`, ['--chip-glow' as string]: stop.color }}
                >
                  <span className="ai-chip-dot" style={{ background: stop.color, boxShadow: `0 0 8px ${stop.color}` }}></span>
                  {chip.label}
                  <span className="ai-chip-count">{chip.pct}</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="skills-marquee-group">
        <div className="section-label rise-soft">My Skills</div>
        <div className="skills-outer scroller skills-scroller" data-direction="left">
          <div className="scroller-inner">
            <span className="skill-pill"><img src="./img/others/Figma_logo.png" className="skill-icon-img" alt="Figma" />Figma</span>
            <span className="skill-pill"><img src="./img/others/Adobe_XD_logo.png" className="skill-icon-img" alt="Adobe XD" />Adobe XD</span>
            <span className="skill-pill"><img src="./img/others/Blender_logo.png" className="skill-icon-img" alt="Blender" />Blender</span>
            <span className="skill-pill"><img src="./img/others/Spline_logo.webp" className="skill-icon-img" alt="Spline" />Spline</span>
            <span className="skill-pill"><img src="./img/others/Lightroom_logo.png" className="skill-icon-img" alt="Lightroom" />Lightroom</span>
            <span className="skill-pill"><img src="./img/others/Krita_logo.webp" className="skill-icon-img" alt="Krita" />Krita</span>
            <span className="skill-pill"><img src="./img/others/Photoshop_logo.png" className="skill-icon-img" alt="Photoshop" />Photoshop</span>
            <span className="skill-pill"><img src="./img/others/Illustrator_logo.png" className="skill-icon-img" alt="Illustrator" />Illustrator</span>
            <span className="skill-pill"><img src="./img/others/Dora_logo.png" className="skill-icon-img" alt="Dora" />Dora</span>
          </div>
        </div>
        <div className="skills-outer scroller skills-scroller" data-direction="right">
          <div className="scroller-inner">
            <span className="skill-pill"><i className="ph-bold ph-sketch-logo" style={{ color: '#6C63FF' }}></i>UX Research</span>
            <span className="skill-pill"><i className="ph-bold ph-tree-structure" style={{ color: '#6C63FF' }}></i>IA Planning</span>
            <span className="skill-pill"><i className="ph-bold ph-squares-four" style={{ color: '#6C63FF' }}></i>Design System</span>
            <span className="skill-pill"><i className="ph-bold ph-frame-corners" style={{ color: '#6C63FF' }}></i>Wireframing</span>
            <span className="skill-pill"><i className="ph-bold ph-cursor-click" style={{ color: '#FF6584' }}></i>Prototype</span>
            <span className="skill-pill"><i className="ph-bold ph-git-branch" style={{ color: '#8A2BE2' }}></i>Dev Handoff</span>
            <span className="skill-pill"><i className="ph-bold ph-flow-arrow" style={{ color: '#6C63FF' }}></i>User Flow</span>
            <span className="skill-pill"><i className="ph-bold ph-browsers" style={{ color: '#60a5fa' }}></i>Component Library</span>
            <span className="skill-pill"><i className="ph-bold ph-robot" style={{ color: '#67e8f9' }}></i>AI Workflow</span>
            <span className="skill-pill"><i className="ph-bold ph-wheelchair" style={{ color: '#4ade80' }}></i>Accessibility</span>
            <span className="skill-pill"><i className="ph-bold ph-chart-bar" style={{ color: '#fb923c' }}></i>Data Visualization</span>
          </div>
        </div>
        </div>
      </section>
  );
}

export default function SkillsSection() {
  // Tech Stack / How I Use AI: the description text sits only 16px above
  // the first card (by design, to match the grid gap), so a drag-select
  // started in one can cross into the other. `user-select: contain` would
  // be the clean CSS fix but isn't implemented in any major browser —
  // clamp the Range manually instead, so each block stays independently
  // selectable.
  useEffect(() => {
    function clampSelection() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      const anchorEl = sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode?.parentElement;
      const container = anchorEl?.closest<HTMLElement>('.tech-sub, .tech-item, .ai-sub');
      if (!container) return;

      const range = sel.getRangeAt(0);
      if (container.contains(range.commonAncestorContainer)) return;

      const forward = sel.anchorNode === range.startContainer && sel.anchorOffset === range.startOffset;
      const clamped = document.createRange();
      if (forward) {
        clamped.setStart(range.startContainer, range.startOffset);
        clamped.setEnd(container, container.childNodes.length);
      } else {
        clamped.setStart(container, 0);
        clamped.setEnd(range.endContainer, range.endOffset);
      }
      sel.removeAllRanges();
      sel.addRange(clamped);
    }
    document.addEventListener('selectionchange', clampSelection);
    return () => document.removeEventListener('selectionchange', clampSelection);
  }, []);

  return (
    <>
      <LazyUnit name="design-process"><DesignProcessSection /></LazyUnit>
      <LazyUnit name="tech-stack"><TechStackSection /></LazyUnit>
      <LazyUnit name="ai-intake"><AiIntakeSection /></LazyUnit>
    </>
  );
}
