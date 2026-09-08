import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { heroFramePath, FRAME_INSET, FRAME_RADIUS, NOTCH_FLAT, NOTCH_RADIUS } from '../utils/heroFramePath';

// Fixed gap between a notch's content and its reference point on the S-bend
// (NOTCH_CURVE_CLEARANCE below) — same 26px used for .navbar-brand's own
// left/top in portfolio.css, so all three sides read as one consistent gap
// instead of three unrelated numbers.
const NOTCH_CONTENT_GAP = 26;

// The right-side S-bend is two quarter-circle fillets back to back — see
// NOTCH_RADIUS's own comment in heroFramePath.ts. NOTCH_RADIUS (not
// 2*NOTCH_RADIUS) reaches only the seam where those two fillets meet, not
// all the way to the flat-depth plateau past the second one — a shallower,
// visually tighter reference point than the plateau, at the cost of the
// row's tallest content (the "TimLin" wordmark) having less curve depth to
// spare than it would against the plateau. The ask-strip's own shorter
// content (well under the wordmark's height) clears it with more room.
const NOTCH_CURVE_CLEARANCE = NOTCH_RADIUS;

export default function BeamsBackground() {
  // The decorative background Spline scene stays mounted and fully opaque
  // at every scroll position (both themes) — no scroll-driven fade/unmount.

  // Checked once on mount, matching the same one-shot (no resize listener)
  // convention HeroSection uses for its own figure.
  const [isMobile] = useState(() => window.innerWidth < 768);

  // useTheme (Navbar's instance) owns data-theme as its own component
  // state, so its toggles aren't visible to any other component's props —
  // only the DOM attribute it writes is shared. The desktop Spline scene's
  // url can't switch via CSS the way every other theme swap in this file
  // does, so it watches that attribute directly instead.
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'),
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // The inactive theme's scene only gets a `url` (and so only starts
  // loading) once the page's own priority content has already loaded —
  // Loader.tsx fires 'hero-ready' once the ACTIVE scene and the hero figure
  // are both up. Giving both scenes a real url from first paint made them
  // load concurrently, competing with the active one for bandwidth/GPU on
  // first load; this way first load only ever prioritizes one, and the
  // other's preload (for a later toggle's crossfade — see the render below)
  // starts only once there's nothing more urgent left to load.
  const [preloadOtherTheme, setPreloadOtherTheme] = useState(false);
  useEffect(() => {
    if (document.body.classList.contains('hero-ready')) {
      setPreloadOtherTheme(true);
      return;
    }
    const onHeroReady = () => setPreloadOtherTheme(true);
    window.addEventListener('hero-ready', onHeroReady, { once: true });
    return () => window.removeEventListener('hero-ready', onHeroReady);
  }, []);

  // Both background scenes' `url` is managed imperatively (refs, not a JSX
  // prop) for the same reason HeroSection.tsx's #hero-spline is: it needs to
  // be droppable/restorable from an IntersectionObserver without fighting
  // React's own diffing. Dropped whenever #home has been out of view for
  // HERO_DROP_DELAY_MS straight — same debounced pattern and delay as the
  // hero figure (see that comment), applied here because a scrolled-past
  // hero was otherwise left running up to 3 concurrent WebGL contexts (hero
  // figure + both preloaded theme scenes) for the rest of the page's
  // lifetime, exactly the sustained-GPU-contention setup blamed for the
  // renderer freezes in homepage-webgl-stability. Restored immediately (no
  // delay) once #home scrolls back into view.
  const splineDarkRef = useRef<HTMLElement>(null);
  const splineLightRef = useRef<HTMLElement>(null);
  const inHeroViewRef = useRef(true);
  const applyDesiredSplineUrls = useCallback(() => {
    const dark = splineDarkRef.current;
    const light = splineLightRef.current;
    if (!dark || !light || !inHeroViewRef.current) return;
    const wantDark = theme === 'dark' || preloadOtherTheme;
    const wantLight = theme === 'light' || preloadOtherTheme;
    if (wantDark) { if (!dark.getAttribute('url')) dark.setAttribute('url', './models/bg_scene.splinecode'); }
    else dark.removeAttribute('url');
    if (wantLight) { if (!light.getAttribute('url')) light.setAttribute('url', './models/bg_scene_w.splinecode'); }
    else light.removeAttribute('url');
  }, [theme, preloadOtherTheme]);

  useEffect(() => {
    applyDesiredSplineUrls();
  }, [applyDesiredSplineUrls]);

  useEffect(() => {
    if (isMobile) return;
    const heroEl = document.getElementById('home');
    if (!heroEl) return;

    const BG_DROP_DELAY_MS = 4000;
    let dropTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (dropTimer) { clearTimeout(dropTimer); dropTimer = null; }
        inHeroViewRef.current = true;
        applyDesiredSplineUrls();
      } else if (!dropTimer) {
        dropTimer = setTimeout(() => {
          inHeroViewRef.current = false;
          splineDarkRef.current?.removeAttribute('url');
          splineLightRef.current?.removeAttribute('url');
          dropTimer = null;
        }, BG_DROP_DELAY_MS);
      }
    }, { threshold: 0 });
    observer.observe(heroEl);

    return () => {
      observer.disconnect();
      if (dropTimer) clearTimeout(dropTimer);
    };
  }, [isMobile, applyDesiredSplineUrls]);

  // The desktop hero-frame pieces (spline scene + notches) are portaled into
  // #home (see the return statement below) instead of rendered where this
  // component sits in the tree, so their position:absolute geometry resolves
  // against #home's own real box (border-radius/inset/etc.) rather than a
  // viewport-height stand-in. #home doesn't exist yet on this component's
  // first render (BeamsBackground mounts before HeroSection in App.tsx), so
  // this is populated a tick later once it does.
  const [heroEl, setHeroEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setHeroEl(document.getElementById('home'));
  }, []);

  // Drives the visible 1px border stroke — see heroFramePath.ts. Same
  // pattern as the portfolio wall's outline — the shape is computed once
  // from the live box and drawn as a stroke, so the border traces the
  // panel's actual edge (notches included) instead of approximating it
  // with a rounded-rect box-shadow.
  const framePathRef = useRef<SVGPathElement>(null);
  const frameGlowRef = useRef<SVGPathElement>(null);
  const splineSceneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isMobile || !heroEl) return;
    // Queried once per effect run (not per sync() call) — .navbar-brand and
    // #home .hero-ask are siblings mounted in the same initial commit as
    // #home itself, so they already exist by the time heroEl is set.
    const navbarBrandEl = document.querySelector<HTMLElement>('.navbar-brand');
    const heroAskEl = document.querySelector<HTMLElement>('#home .hero-ask');

    const sync = () => {
      heroEl.style.setProperty('--hero-bg-w', `${heroEl.clientWidth}px`);
      heroEl.style.setProperty('--hero-bg-h', `${heroEl.clientHeight}px`);

      // The notched panel look is desktop-only in portfolio.css (gated to
      // min-width:1025px — #bg-frame-outline/#bg-frame-glow display:none and
      // #bg-spline-scene falls back to a plain fixed/full-bleed box below
      // that). isMobile above only gates 768px (raster-vs-Spline choice), so
      // without this check tablet (768-1024px) still fell into the notch
      // math below and got an inline clip-path the CSS never asked for,
      // carving corners out of what should read as a plain 100%-height
      // background. Clearing it here instead of leaving a stale clip from a
      // previous desktop-width sync matters too — the ResizeObserver below
      // re-runs sync() on every resize, including desktop-to-tablet.
      if (window.innerWidth < 1025) {
        splineSceneRef.current?.style.removeProperty('clip-path');
        document.getElementById('hero-tags-clip')?.style.removeProperty('clip-path');
        return;
      }

      const w = heroEl.clientWidth - FRAME_INSET * 2;
      const h = heroEl.clientHeight - FRAME_INSET * 2;
      if (w <= 0 || h <= 0) return;

      // Each notch's flat width = the distance from the panel's own corner
      // to its content's far edge, plus NOTCH_CURVE_CLEARANCE (the S-bend's
      // own run — without it the content's far edge lands mid-curve, not on
      // open floor) plus a further 24px gap past that — the notch
      // shrink-wraps to whatever's actually sitting in it (the navbar
      // tagline, the ask-strip capsule) instead of content being sized to
      // fit a fixed notch. Falls back to the old fixed NOTCH_FLAT if a
      // notch's content isn't in the DOM for some reason.
      const heroRect = heroEl.getBoundingClientRect();
      const panelLeft = heroRect.left + FRAME_INSET;
      const panelRight = heroRect.right - FRAME_INSET;
      // A reload restored to a scrolled position can already carry
      // #main-header's .scrolled class on this first sync() — under that
      // class .navbar-brand is display:contents (portfolio.css) and its
      // tagline/divider are hidden, so its getBoundingClientRect() comes
      // back zero-size and the notch locks in collapsed even once the user
      // scrolls back to top. Measuring is a one-shot (see the "pin to first
      // paint" comment below), so it must read the unscrolled box the notch
      // is actually sized for, regardless of the real scroll position at
      // mount — strip the class for the read, then restore it.
      const headerEl = document.getElementById('main-header');
      const wasScrolled = headerEl?.classList.contains('scrolled') ?? false;
      if (wasScrolled) headerEl!.classList.remove('scrolled');
      const flatTL = navbarBrandEl
        ? navbarBrandEl.getBoundingClientRect().right - panelLeft + NOTCH_CURVE_CLEARANCE + NOTCH_CONTENT_GAP
        : NOTCH_FLAT;
      if (wasScrolled) headerEl!.classList.add('scrolled');
      const flatBR = heroAskEl
        ? panelRight - heroAskEl.getBoundingClientRect().left + NOTCH_CURVE_CLEARANCE + NOTCH_CONTENT_GAP
        : NOTCH_FLAT;

      const d = heroFramePath(w, h, FRAME_RADIUS, flatTL, flatBR);
      // Single source of truth for the panel's actual shape: the same `d`
      // clips the real #bg-spline-scene box (the WebGL content itself),
      // the border stroke, and the glow fill below. Previously the panel
      // was left a plain rounded rect and the two notches were faked by a
      // separate pair of patch elements (clip-path: notchPatchPath(...))
      // painted over its corners — a second, independently-computed curve
      // that only approximately agreed with this one, and the seam between
      // them was exactly where a visible gap showed up once the border/glow
      // made that seam load-bearing instead of merely cosmetic. Clipping
      // the real container to this path removes the second curve (and the
      // patches) entirely — there's nothing left to disagree with.
      splineSceneRef.current?.style.setProperty('clip-path', `path("${d}")`);
      // Same box, same `d` — the tag-capsule marquee is a plain rectangle
      // with no curve of its own, so it needs the identical clip to taper
      // off at the notches instead of spilling into them.
      document.getElementById('hero-tags-clip')?.style.setProperty('clip-path', `path("${d}")`);
      framePathRef.current?.setAttribute('d', d);
      frameGlowRef.current?.setAttribute('d', d);
      // viewBox matches the element's own pixel box 1:1, so path units are
      // CSS px and the stroke width isn't scaled by the viewport.
      document.getElementById('bg-frame-outline')?.setAttribute('viewBox', `0 0 ${w} ${h}`);
      document.getElementById('bg-frame-glow')?.setAttribute('viewBox', `0 0 ${w} ${h}`);

      // .navbar-menu (Navbar.tsx, not a descendant of #home) reads this to
      // sit right after the tl notch's flap instead of at a fixed offset —
      // set on :root, same pattern as --nav-h, since a custom property only
      // inherits down the DOM tree and #main-header is #home's sibling, not
      // its descendant.
      document.documentElement.style.setProperty('--notch-tl-flat', `${flatTL}px`);
    };
    sync();
    // Deliberately the ONLY trigger for re-measuring .navbar-brand/.hero-ask:
    // each notch's flat width locks in at whatever it measured on this first
    // sync() and stays there — through scrolling, webfont swaps, the ask-
    // strip's pill rotation, anything — and only moves again when the
    // viewport itself is resized (heroEl's own box changing size). Earlier
    // versions also re-synced on ResizeObserver-for-content, fonts.ready, and
    // #main-header's `.scrolled` class (to chase the notch to content that
    // could change size after mount), but each of those was its own source
    // of a mismeasurement mid-transition/mid-load that then froze in as a
    // visibly wrong notch — see this file's git history for the specific
    // failures. A width fixed at first paint, touched only by real resize,
    // has no such window to get caught in.
    const ro = new ResizeObserver(sync);
    ro.observe(heroEl);
    return () => { ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, heroEl]);

  // Desktop-only hero-frame pieces (spline scene + its two notches) — see
  // the heroEl comment above for why these are portaled into #home rather
  // than rendered in place: #home is now the gradient (its own CSS
  // background — see portfolio.css) and these need to sit inside that same
  // box for their inset/position math to resolve against #home's real size.
  // Mobile has no notch/frame look at all (gated by isMobile here, not a
  // CSS media query, since the DOM structure itself differs — mobile's
  // #bg-spline-scene, rendered further down, stays a plain top-level fixed
  // full-bleed layer with an <img> fallback, unrelated to #home).
  // Checked directly at render time (not a state/effect pair) same as
  // HeroAskStrip's own rotation timer check — SMIL's <animateTransform>
  // below isn't a CSS animation, so it can't be paused through the
  // @media(prefers-reduced-motion) rule .bg-frame-glow-fill already has;
  // this is what keeps it off for that preference instead.
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const heroFrame = !isMobile && heroEl && createPortal(
    <>
      {/* Outer ambient glow — stacked at z-index -4, below #bg-spline-scene
          (-3), so the panel (now clipped to this identical shape, notches
          included) paints over it entirely; only the blurred edge spilling
          past the panel's real edge into the 24px frame band actually
          shows — see the #bg-frame-glow/.bg-frame-glow-fill comment in
          portfolio.css. Traces the identical `d` as #bg-frame-outline's
          border below (one heroFramePath() call in sync() feeds both).

          The gradient itself is a 4-colour hard-edged "flow" blend (an
          external blend-tool spec the brief handed over directly: 4 stops,
          3 divider offsets, soften:0). soften:0 means no interpolation
          between bands at all, hence each divider offset below is written
          twice — once for the band ending there, once for the band
          starting there — the standard SVG trick for a hard color cut
          instead of a smooth one. spreadMethod="repeat" + the
          <animateTransform> sliding the gradient by exactly its own (1,1)
          vector is what makes it "flow": one full slide is one full
          period, so the repeat tiles seamlessly with no visible jump. */}
      <svg id="bg-frame-glow" aria-hidden="true" role="presentation">
        <defs>
          <linearGradient id="bg-frame-glow-grad" x1="0" y1="0" x2="1" y2="1" spreadMethod="repeat">
            <stop offset="0%" style={{ stopColor: 'var(--frame-glow-base)' }} />
            <stop offset="39.6967%" style={{ stopColor: 'var(--frame-glow-base)' }} />
            <stop offset="39.6967%" style={{ stopColor: 'var(--frame-glow-2)' }} />
            <stop offset="70.3616%" style={{ stopColor: 'var(--frame-glow-2)' }} />
            <stop offset="70.3616%" style={{ stopColor: 'var(--frame-glow-3)' }} />
            <stop offset="87.9173%" style={{ stopColor: 'var(--frame-glow-3)' }} />
            <stop offset="87.9173%" style={{ stopColor: 'var(--frame-glow-4)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--frame-glow-4)' }} />
            {!prefersReducedMotion && (
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from="0 0"
                to="1 1"
                dur="10s"
                repeatCount="indefinite"
              />
            )}
          </linearGradient>
        </defs>
        <path ref={frameGlowRef} className="bg-frame-glow-fill" />
      </svg>
      {/* clip-path (set in sync(), same `d` as the border/glow paths below)
          IS the notch now — no separate patch elements repainting the two
          corners. See the clip-path comment in sync() for why that's the
          fix, not just a simplification.

          #bg-panel-shadow wraps it (rather than putting filter:drop-shadow
          directly on #bg-spline-scene) because clip-path and filter don't
          coexist on the same element here — confirmed live previously (see
          the #bg-panel-shadow comment in portfolio.css) that a filter
          silently fails to render at all on an element that also carries an
          imperative clip-path. The wrapper has no clip-path of its own, so
          its filter traces whatever shape its already-clipped child
          rendered — the exact notch silhouette, for free. */}
      <div id="bg-panel-shadow" aria-hidden="true" role="presentation">
        {/* Both theme scenes stay mounted permanently (no key-remount) and
            stacked in the same box, so a theme toggle just crossfades opacity
            between two already-ready WebGL contexts instead of tearing one
            down and re-fetching/re-initializing the other from scratch,
            which is what caused the visible stutter a single swapped-`url`
            element had. `url` itself is left unset here — the
            applyDesiredSplineUrls effect above owns it imperatively, so it
            can also drop/restore it on scroll without React fighting that
            write back on the next render. */}
        <div id="bg-spline-scene" ref={splineSceneRef} aria-hidden="true" role="presentation">
          <spline-viewer
            id="spline-bg-dark"
            ref={splineDarkRef}
            className={`spline-bg-layer${theme === 'dark' ? ' is-active' : ''}`}
          />
          <spline-viewer
            id="spline-bg-light"
            ref={splineLightRef}
            className={`spline-bg-layer${theme === 'light' ? ' is-active' : ''}`}
          />
        </div>
      </div>
      {/* The panel's crisp border, as a stroke along its real outline — see
          heroFramePath.ts. */}
      <svg id="bg-frame-outline" aria-hidden="true" role="presentation">
        <path ref={framePathRef} className="bg-frame-stroke" fill="none" />
      </svg>
    </>,
    heroEl,
  );

  return (
    <>
      <div id="bg-scene" aria-hidden="true" role="presentation" />
      {isMobile && (
        <div id="bg-spline-scene" aria-hidden="true" role="presentation">
          <picture>
            <source srcSet="./img/bg.webp" type="image/webp" />
            <img id="spline-bg" className="spline-bg-layer is-active" src="./img/bg.jpg" alt="" aria-hidden="true" />
          </picture>
        </div>
      )}
      {heroFrame}
    </>
  );
}
