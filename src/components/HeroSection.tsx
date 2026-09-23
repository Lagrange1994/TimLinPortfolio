import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLang } from '../context/LangContext';
import { scrollToSectionAligned } from '../utils/navHeader';
import HeroAskStrip from './HeroAskStrip';
import gsap from 'gsap';

const HERO_SCENE_SIZE = 800; // px, the Spline scene's authored canvas (measured)

const SMOOTH_TAU = 0.18;

interface HoverEventLike {
  data?: { actions?: { data?: { type?: string; runMode?: string; tweens?: { data?: { state?: string | null } }[] } }[] };
}

export default function HeroSection() {
  const { t, heroDescs, lang } = useLang();
  const typerRef = useRef<{
    stop: () => void;
    restart: (texts: string[]) => void;
  } | null>(null);

  // Hero split text + typer
  useEffect(() => {
    function splitWords(el: HTMLElement) {
      // Idempotent guard: React StrictMode runs effects twice in dev, which
      // would otherwise re-wrap already-split spans (nested opacity:0 → invisible)
      if (el.dataset.split === 'words') {
        return Array.from(el.children).filter(c => c.tagName === 'SPAN') as HTMLElement[];
      }
      el.dataset.split = 'words';
      const result: HTMLElement[] = [];
      const nodes = Array.from(el.childNodes);
      while (el.firstChild) el.removeChild(el.firstChild);
      nodes.forEach(n => {
        if (n.nodeType === 3) {
          (n as Text).textContent!.split(/(\s+)/).forEach(part => {
            if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(part)); }
            else if (part) {
              const s = document.createElement('span');
              s.style.cssText = 'display:inline-block;will-change:transform,opacity';
              s.textContent = part;
              el.appendChild(s); result.push(s);
            }
          });
        } else if (n.nodeType === 1) {
          const el2 = n as HTMLElement;
          if (el2.nodeName === 'BR') { el.appendChild(n); return; }
          const s = document.createElement('span');
          s.style.cssText = 'display:inline-block;will-change:transform,opacity';
          s.appendChild(n); el.appendChild(s); result.push(s);
        }
      });
      return result;
    }

    function splitChars(el: HTMLElement) {
      if (el.dataset.split === 'chars') {
        return Array.from(el.querySelectorAll('span > span')) as HTMLElement[];
      }
      el.dataset.split = 'chars';
      const result: HTMLElement[] = [];
      const nodes = Array.from(el.childNodes);
      while (el.firstChild) el.removeChild(el.firstChild);
      nodes.forEach(n => {
        if (n.nodeType === 3) {
          // Split into words first and wrap each word's char-spans in an
          // inline-block container. Without this, every character is its
          // own independently-breakable inline-block box, so the browser
          // can (and does) wrap mid-word, e.g. "Develope" / "r".
          (n as Text).textContent!.split(/(\s+)/).forEach(part => {
            if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(part)); return; }
            if (!part) return;
            const word = document.createElement('span');
            word.style.cssText = 'display:inline-block';
            Array.from(part).forEach(c => {
              const s = document.createElement('span');
              s.style.cssText = 'display:inline-block;will-change:transform,opacity';
              s.textContent = c; word.appendChild(s); result.push(s);
            });
            el.appendChild(word);
          });
        } else if (n.nodeType === 1 && (n as Element).nodeName === 'BR') {
          el.appendChild(n);
        }
      });
      return result;
    }

    function bypass(el: HTMLElement | null) {
      if (!el) return;
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.transition = 'none';
    }

    const heroFig = document.querySelector<HTMLElement>('#home .hero-fig');
    const heroSplineViewer = document.getElementById('hero-spline');
    const h1 = document.querySelector<HTMLElement>('#home .hero-h1');
    const h2 = document.querySelector<HTMLElement>('#home .hero-h2');

    bypass(h1); bypass(h2);
    if (heroFig) gsap.set(heroFig, { opacity: 0, y: 70 });
    // Off for the entrance's duration: the Spline runtime hit-tests pointer
    // moves against the canvas regardless of its opacity/in-flight transform,
    // so a hover mid-slide could still fire a prop's pop-up. Restored in the
    // tween's onComplete below, once the figure has stopped moving.
    if (heroSplineViewer) heroSplineViewer.style.pointerEvents = 'none';

    const h1Words = h1 ? splitWords(h1) : [];
    const h2Chars = h2 ? splitChars(h2) : [];
    if (h1Words.length) gsap.set(h1Words, { opacity: 0, y: 40, rotation: 5 });
    if (h2Chars.length) gsap.set(h2Chars, { opacity: 0, y: 28 });

    // The scroll indicator starts hidden via CSS (.hero-scroll-indicator has
    // opacity:0) and is revealed by the idle-detection effect below by adding
    // .is-revealed, so the entrance sequence leaves it alone.

    // splitWords/splitChars hardcode will-change:transform,opacity on every
    // word/char span so this one-shot entrance tween stays smooth. Both
    // h1Words and h2Chars now get unsplit back to plain text once their
    // tween completes (unsplitH1/unsplitH2 below), which drops the spans
    // — and their will-change — entirely rather than just clearing it.

    // Clearing will-change alone isn't enough — reproduced live (including
    // via a plain light/dark theme toggle, with no re-animation involved
    // at all): as long as .hero-h1's word spans exist in the DOM, ANY
    // repaint of the `-webkit-background-clip: text` gradient (see
    // .hero-h1.grad-settled in portfolio.css) can render overlapping
    // "ghost" strokes instead of clean glyphs. A one-time forced repaint
    // right after the entrance tween (tried first, via a self-assigned
    // outerHTML) fixed the very next paint but not later ones — e.g. the
    // theme toggle re-triggers the gradient clip long after entrance and
    // hit the same corruption again. The word spans themselves are the
    // trigger (a background-clip:text ancestor with descendants that were
    // ever independently composited), so the real fix is to remove them:
    // once the tween is done, collapse .hero-h1 back to the exact plain
    // markup it started as. No split spans left behind means nothing left
    // to ever mis-paint, on this repaint or any future theme switch.
    function unsplitH1(el: HTMLElement) {
      el.innerHTML = 'Hi, I\'m <span>Tim Lin</span>';
      delete el.dataset.split;
    }

    // Same ghosting risk applies to .hero-h2 now that light mode paints it
    // with a background-clip:text gradient (--grad-role) instead of a flat
    // color — see unsplitH1's comment above. h2 has no nested markup, so
    // restoring it is just putting the plain text back.
    const h2OriginalText = h2 ? h2.textContent ?? '' : '';
    function unsplitH2(el: HTMLElement) {
      el.textContent = h2OriginalText;
      delete el.dataset.split;
    }

    function animate() {
      setTimeout(() => {
        // onComplete dispatches 'hero-fig-settled' — picked up by the Spline
        // sizing effect below to re-sync the runtime's cached hover-hit-test
        // rect once this box has actually stopped moving (a fixed delay
        // there undershoots on a slow device/tab, where this tween itself
        // can take longer than the delay to even finish).
        if (heroFig) {
          gsap.to(heroFig, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', onComplete: () => {
            window.dispatchEvent(new Event('hero-fig-settled'));
            if (heroSplineViewer) heroSplineViewer.style.pointerEvents = 'auto';
          } });
        }
        if (h1Words.length) gsap.to(h1Words, { opacity: 1, y: 0, rotation: 0, duration: 1.0, ease: 'power3.out', stagger: 0.11, delay: 0.15, onComplete: () => {
          // bypass() above left an inline transition:none on h1 itself (not
          // the word spans it was actually meant to bypass) — harmless while
          // .grad-settled had no transition of its own, but an inline style
          // always beats a stylesheet rule, so it would silently swallow
          // .hero-h1.grad-settled's own -webkit-text-fill-color transition
          // (the fade from solid to gradient) the moment that class lands.
          if (h1) { h1.style.transition = ''; h1.classList.add('grad-settled'); unsplitH1(h1); }
        } });
        if (h2Chars.length) gsap.to(h2Chars, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.035, delay: 0.6, onComplete: () => {
          if (h2) { h2.style.transition = ''; h2.classList.add('grad-settled'); unsplitH2(h2); }
        } });
      }, 350);
    }

    // Guard against StrictMode double-invoke racing with the one-shot event:
    // Loader sets a persistent class marker when it dispatches 'hero-ready'.
    if (document.body.classList.contains('hero-ready')) {
      animate();
    } else {
      window.addEventListener('hero-ready', animate, { once: true });
    }
    return () => window.removeEventListener('hero-ready', animate);
  }, []);

  // Hero typer
  useEffect(() => {
    const descTextEl = document.getElementById('hero-desc-text');
    const descCursorEl = document.getElementById('hero-desc-cursor');
    if (!descTextEl) return;

    class TextTyper {
      textEl: HTMLElement;
      cursorEl: HTMLElement | null;
      texts: string[];
      typingSpeed: number;
      deletingSpeed: number;
      pauseDuration: number;
      idx = 0;
      charIdx = 0;
      deleting = false;
      current = '';
      timer: ReturnType<typeof setTimeout> | null = null;

      constructor(textEl: HTMLElement, cursorEl: HTMLElement | null, texts: string[], opts: {
        typingSpeed?: number;
        deletingSpeed?: number;
        pauseDuration?: number;
      } = {}) {
        this.textEl = textEl;
        this.cursorEl = cursorEl;
        this.texts = texts;
        this.typingSpeed = opts.typingSpeed || 75;
        this.deletingSpeed = opts.deletingSpeed || 40;
        this.pauseDuration = opts.pauseDuration || 1500;
        this._startCursor();
        this._tick();
      }

      _startCursor() {
        if (this.cursorEl) {
          gsap.killTweensOf(this.cursorEl);
          gsap.set(this.cursorEl, { opacity: 1 });
          gsap.to(this.cursorEl, { opacity: 0, duration: 0.5, repeat: -1, yoyo: true, ease: 'power2.inOut' });
        }
      }

      _tick() {
        const word = this.texts[this.idx];
        if (this.deleting) {
          if (this.current === '') {
            this.deleting = false;
            this.idx = (this.idx + 1) % this.texts.length;
            this.charIdx = 0;
            this.timer = setTimeout(() => this._tick(), 300);
          } else {
            this.current = this.current.slice(0, -1);
            this.textEl.textContent = this.current;
            this.timer = setTimeout(() => this._tick(), this.deletingSpeed);
          }
        } else {
          if (this.charIdx < word.length) {
            this.current += word[this.charIdx++];
            this.textEl.textContent = this.current;
            this.timer = setTimeout(() => this._tick(), this.typingSpeed);
          } else {
            this.timer = setTimeout(() => { this.deleting = true; this._tick(); }, this.pauseDuration);
          }
        }
      }

      stop() {
        if (this.timer) clearTimeout(this.timer);
        if (this.cursorEl) gsap.killTweensOf(this.cursorEl);
      }

      restart(newTexts: string[]) {
        this.stop();
        this.texts = newTexts;
        this.idx = 0; this.charIdx = 0; this.deleting = false; this.current = '';
        this.textEl.textContent = '';
        this._startCursor();
        this._tick();
      }
    }

    const startTyper = () => {
      const typer = new TextTyper(descTextEl, descCursorEl, heroDescs, { typingSpeed: 60, deletingSpeed: 35, pauseDuration: 2000 });
      typerRef.current = typer;
    };

    const timerId = setTimeout(startTyper, 2200);
    return () => clearTimeout(timerId);
    // Mount-once: starts the typer with the initial heroDescs. Lang-driven
    // updates are handled separately by the [lang, heroDescs] effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restart typer on lang change
  useEffect(() => {
    if (typerRef.current) {
      typerRef.current.restart(heroDescs);
    }
  }, [lang, heroDescs]);

  // Hero tag scroller
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const initHeroScrollers = () => {
      document.querySelectorAll<HTMLElement>('.hero-scroller').forEach(scroller => {
        const inner = scroller.querySelector<HTMLElement>('.scroller-inner');
        if (!inner || scroller.getAttribute('data-raf-init') === 'true') return;
        scroller.setAttribute('data-raf-init', 'true');

        const gap = parseFloat(getComputedStyle(inner).gap) || 12;
        const allItems = Array.from(inner.children) as HTMLElement[];
        const halfCount = Math.floor(allItems.length / 2);
        const oneSetWidth = allItems.slice(0, halfCount).reduce((sum, el) => sum + el.offsetWidth + gap, 0);
        if (oneSetWidth <= 0) return;

        let offset = 0, velocity = 80, targetVelocity = 80, lastTs: number | null = null;

        function tick(ts: number) {
          if (!lastTs) lastTs = ts;
          const dt = Math.min((ts - lastTs) / 1000, 0.05);
          lastTs = ts;
          velocity += (targetVelocity - velocity) * (1 - Math.exp(-dt / SMOOTH_TAU));
          offset = ((offset + velocity * dt) % oneSetWidth + oneSetWidth) % oneSetWidth;
          inner!.style.transform = `translateX(${-offset}px)`;
          requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        scroller.addEventListener('mouseenter', () => { targetVelocity = 25; });
        scroller.addEventListener('mouseleave', () => { targetVelocity = 80; });
      });
    };

    if (document.fonts) {
      document.fonts.ready.then(initHeroScrollers);
    } else {
      window.addEventListener('load', initHeroScrollers, { once: true });
    }
  }, []);

  // Hero scroll indicator (mouse icon) — stays hidden after the intro and only
  // surfaces once the user has sat completely still on the hero for
  // SCROLL_INDICATOR_IDLE_MS. ANY movement (scroll/wheel/touch/mouse/pointer/
  // key) resets the clock, so it never nudges a user who's actively exploring
  // the hero, and the count only starts once the hero entrance is ready — so
  // it can't elapse mid-animation and pop the moment the intro lands.
  useEffect(() => {
    const indicator = document.querySelector<HTMLElement>('.hero-scroll-indicator');
    if (!indicator) return;
    // Reduced-motion users opt out of the idle-timing choreography — just show
    // the hint (CSS keeps it hidden by default otherwise).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      indicator.classList.add('is-revealed');
      return;
    }

    const SCROLL_INDICATOR_IDLE_MS = 6000;
    let revealed = false;
    let idleStarted = false;
    let lastActivity = Date.now();
    let heroInView = true;

    const markActivity = () => { lastActivity = Date.now(); };
    const activityEvents = ['scroll', 'wheel', 'touchmove', 'mousemove', 'pointermove', 'keydown'] as const;
    activityEvents.forEach(ev => window.addEventListener(ev, markActivity, { passive: true }));

    const heroEl = document.getElementById('home');
    const observer = heroEl ? new IntersectionObserver(([entry]) => {
      heroInView = entry.isIntersecting;
      if (heroInView) lastActivity = Date.now();
    }, { threshold: 0.5 }) : null;
    if (heroEl) observer!.observe(heroEl);

    // Don't begin counting stillness until the hero entrance has played,
    // resetting the baseline at that moment so the 6s window measures idle
    // time *after* the animation, not from page mount.
    const startIdle = () => { idleStarted = true; lastActivity = Date.now(); };
    if (document.body.classList.contains('hero-ready')) startIdle();
    else window.addEventListener('hero-ready', startIdle, { once: true });

    const cleanupListeners = () => {
      activityEvents.forEach(ev => window.removeEventListener(ev, markActivity));
      window.removeEventListener('hero-ready', startIdle);
    };

    const idleCheck = setInterval(() => {
      if (revealed || !idleStarted || !heroInView || Date.now() - lastActivity < SCROLL_INDICATOR_IDLE_MS) return;
      revealed = true;
      clearInterval(idleCheck);
      observer?.disconnect();
      cleanupListeners();
      indicator.classList.add('is-revealed');
    }, 300);

    return () => {
      clearInterval(idleCheck);
      observer?.disconnect();
      cleanupListeners();
    };
  }, []);

  // Hero spline desktop+tablet conditional — only load the 3D figure above
  // mobile width. Loaded once and left alone: an IntersectionObserver used
  // to drop the `url` (and thus the WebGL context) 4s after the hero left
  // view, on the theory that fewer concurrent contexts prevents renderer
  // freezes — but that's the same GPU-contention theory already rejected
  // once for the sibling bg-Spline scene (see homepage-webgl-stability
  // memory: user said "put it back, this isn't a Spline problem," and the
  // real freeze root cause turned out to be an unrelated overscroll-behavior
  // /touchstart bug). Measured cost of the drop-and-reload cycle: a 1.8s
  // dropped frame and ~10s of cumulative main-thread longtasks every time a
  // user scrolls away for >4s and back — a real, reproducible jank that's
  // worse than the theoretical risk it was guarding against.
  //
  // Set as early as possible (not deferred to any later event): Loader.tsx's
  // waitForAssets() listens for THIS element's own `load` event to decide
  // when to dismiss the loading screen and fire 'hero-ready' — deferring
  // `url` to something gated on 'hero-ready' (tried once) is a deadlock,
  // since 'hero-ready' can then never fire without the loader's own 4s
  // force-timeout.
  useEffect(() => {
    if (window.innerWidth < 768) return;
    const heroSpline = document.getElementById('hero-spline');
    if (!heroSpline) return;
    heroSpline.setAttribute('url', './models/hero_figure.splinecode');
  }, []);

  // The Spline runtime sizes its canvas off the host <spline-viewer>
  // element's own LAYOUT size (clientWidth/clientHeight — unaffected by a CSS
  // transform on that same element), not the scene's authored resolution. Two
  // things follow from that:
  //   - Giving the host `width/height: 100%` (i.e. the box's own ~720px) makes
  //     the runtime render at 720x720 — but its camera is pixel-based, so a
  //     smaller canvas shows a smaller CROP of the scene (hips down + the
  //     side props cut off), not a shrunk whole scene.
  //   - A CSS transform: scale() on a 100%-sized host doesn't fix this: the
  //     transform doesn't change clientWidth, so the runtime keeps rendering
  //     at the box's small size and the transform then shrinks that already-
  //     cropped render even further — same crop, just smaller (confirmed live:
  //     canvas stayed a plain 720x720 crop with a scale(0.667) applied).
  // The fix: give the host a FIXED size equal to the scene's own authored
  // resolution (measured 800x800) so the runtime always renders the whole,
  // uncropped scene, then shrink that fixed-size host into the (smaller) box
  // with a CSS transform + absolute position (see portfolio.css).
  //
  // That alone left the props' hover pop-ups offset by a small, fixed amount
  // for some users but not others (root-caused by reading the bundled
  // @splinetool/viewer source, unpkg.com/@splinetool/viewer@1.12.98/build/
  // spline-viewer.js): the runtime's EventManager caches the canvas's
  // getBoundingClientRect() ONCE, in its constructor, as `eventContext.
  // domRect`, and maps every pointer event through that same cached rect
  // forever after (`Lne`/`Bne` in the bundle: `(pageX - domRect.left) /
  // domRect.width`, etc.) — it only gets refreshed on a real `window`
  // `resize` event (and that listener is itself only attached if the scene
  // has scroll-triggered objects, which ours doesn't) or on `scroll`. A pure
  // CSS transform never fires either, so if the box's final position isn't
  // settled yet at construction time (e.g. a webfont swap reflows `.hero-fig`
  // after the scene has already loaded), the cached rect goes stale forever
  // and every hover lands off by exactly however much the box later moved —
  // confirmed live: the cached rect's top can drift ~14px from the canvas's
  // real one. syncSplineDomRect() re-points the cache at the live rect
  // whenever this box resizes, so it can never go stale again. Undocumented
  // internals (`_spline`, `_canvas`, `eventManager.eventContext.domRect`) —
  // every step is optional-chained so a future viewer version that removes
  // them just makes this a no-op, not a crash.
  useEffect(() => {
    if (window.innerWidth < 768 || typeof ResizeObserver === 'undefined') return;
    const fig = document.querySelector<HTMLElement>('#home .hero-fig');
    const viewer = document.getElementById('hero-spline') as
      | (HTMLElement & {
          _spline?: {
            eventManager?: {
              eventContext?: { domRect?: DOMRect };
              handlers?: {
                MouseHover?: {
                  handleMouseHoverEvent?: (leaveAll?: boolean) => void;
                  objects?: unknown[];
                  eventsPerObjects?: Record<string, HoverEventLike[]>;
                };
              };
            };
            _renderer?: { setDrawingBufferSize?: (w: number, h: number, ratio: number) => void };
            _getPixelRatio?: () => number;
            requestRender?: () => void;
          };
          _canvas?: HTMLCanvasElement;
        })
      | null;
    if (!fig) return;
    // The canvas is a fixed 800x800 css px (native scene size) shown at
    // ~0.4x, but the runtime backs it at devicePixelRatio (1620x1620 on a
    // 1.5x screen) — ~5x more pixels than the ~450px it actually displays,
    // vs. the reference site's ~765x672 backing. That per-frame GPU cost is
    // what made the entrance stutter. Render at display resolution instead
    // (backing pixels == on-screen pixels, still sharp), overriding the
    // runtime's own pixel-ratio getter so its internal resizes keep it.
    let lastPixelRatio = 0;
    const syncSplinePixelRatio = (scale: number) => {
      const sp = viewer?._spline;
      const renderer = sp?._renderer;
      if (!sp || !renderer?.setDrawingBufferSize) return;
      const ratio = Math.min(window.devicePixelRatio || 1, Math.max(0.5, (window.devicePixelRatio || 1) * scale));
      sp._getPixelRatio = () => ratio;
      if (Math.abs(ratio - lastPixelRatio) < 0.01) return;
      lastPixelRatio = ratio;
      renderer.setDrawingBufferSize(HERO_SCENE_SIZE, HERO_SCENE_SIZE, ratio);
      sp.requestRender?.();
    };
    // The runtime's hover manager listens for `pointermove` on the canvas
    // only and dispatches an object's "leave" (the Toggle-mode return to Base)
    // from the NEXT in-canvas move that misses it. A pointer that exits the
    // canvas straight from an object near its edge never produces that move,
    // so the object stays stuck "hovered" and its next hover-in is ignored —
    // the first hover animates, later ones don't. Flush every hovered object
    // when the pointer leaves the host (handleMouseHoverEvent(true) = leave
    // all). Undocumented internals, optional-chained like the rest here.
    const onPointerLeave = () => {
      viewer?._spline?.eventManager?.handlers?.MouseHover?.handleMouseHoverEvent?.(true);
    };
    viewer?.addEventListener('pointerleave', onPointerLeave);
    // Some props (controller/ipad/wacom) ship a Toggle-mode Mouse Hover
    // Transition whose FIRST tween — the return-to-Base half — has `state`
    // missing ("Current State") instead of `null` ("Base State"). The runtime
    // resolves a missing state to the object's state captured at init(), which
    // gets re-captured while hovered, so the leave never returns to Base and
    // every hover after the first appears to do nothing. computer/p c have an
    // explicit `null` and work. Normalise to `null` (Base) once the hover
    // manager exists, before any hover can happen (pointer-events are off
    // during the entrance). The proper fix is re-picking Base State in the
    // Spline editor; this keeps the site working regardless.
    const fixHoverBaseStates = () => {
      const hover = viewer?._spline?.eventManager?.handlers?.MouseHover;
      if (!hover?.objects?.length || !hover.eventsPerObjects) return false;
      for (const events of Object.values(hover.eventsPerObjects)) {
        for (const ev of events) {
          for (const action of ev.data?.actions ?? []) {
            const a = action.data;
            const first = a?.tweens?.[0]?.data;
            if (a?.type === 'Transition' && a.runMode === 'Toggle' && first && first.state === undefined) first.state = null;
          }
        }
      }
      return true;
    };
    const syncSplineDomRect = () => {
      const canvas = viewer?._canvas;
      const ctx = viewer?._spline?.eventManager?.eventContext;
      if (canvas && ctx) ctx.domRect = canvas.getBoundingClientRect();
    };
    const sync = () => {
      const rect = fig.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (!w || !h) return;
      // Scale by HEIGHT alone (not Math.min(w, h)) so the scene always spans
      // the box's full height, bottom to top — `.hero-fig` isn't a square, it
      // can be wider than it is tall, and scaling by the smaller dimension
      // left a gap between the figure's head and the top of the box. Width
      // overflow beyond the box is fine: `.hero-fig` has `overflow: hidden`.
      const scale = h / HERO_SCENE_SIZE;
      const size = HERO_SCENE_SIZE * scale;
      syncSplinePixelRatio(scale);
      // Scale via the individual `scale` CSS property (origin 0 0, see the
      // stylesheet rule) — the viewer sits inside `.hero-fig`, whose own
      // entrance tween carries it along, so nothing else touches its transform.
      if (viewer) viewer.style.scale = String(scale);
      viewer?.style.setProperty('--hero-fig-x', (w - size) / 2 + 'px');
      viewer?.style.setProperty('--hero-fig-y', '0px');
      syncSplineDomRect();
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(fig);
    // Also re-sync: once the scene actually finishes loading (its own
    // constructor captures its first, possibly-stale rect right around this
    // event); once the entrance tween's own onComplete fires (see animate()
    // above — the authoritative "this box has actually stopped moving"
    // signal, since neither `.hero-fig`'s own slide-up transform nor the
    // spline-viewer's `--hero-fig-scale` transform change clientWidth/Height,
    // so this ResizeObserver never fires for either on its own); and once
    // more on a fixed delay as a fallback for whichever of those two fires
    // first (a slow device/tab can still be mid-tween when the scene's
    // 'load' event lands).
    viewer?.addEventListener('load', sync);
    window.addEventListener('hero-fig-settled', sync);
    const settleTimer = window.setTimeout(sync, 1500);
    // The viewer's `load` event can fire before `_spline`/`_renderer` exist
    // (and the 1500ms fallback above can fire before the scene even loads),
    // so nothing else guarantees a sync() call once the runtime is really
    // up — poll for it so the reduced pixel ratio lands before the entrance.
    let runtimeTimer = 0;
    let hoverFixTimer = 0;
    const waitForHover = () => {
      if (!fixHoverBaseStates()) hoverFixTimer = window.setTimeout(waitForHover, 100);
    };
    waitForHover();
    const waitForRuntime = () => {
      if (viewer?._spline?._renderer) { sync(); return; }
      runtimeTimer = window.setTimeout(waitForRuntime, 100);
    };
    waitForRuntime();
    return () => {
      window.clearTimeout(runtimeTimer);
      window.clearTimeout(hoverFixTimer);
      viewer?.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('hero-fig-settled', sync);
      ro.disconnect();
      viewer?.removeEventListener('load', sync);
      window.clearTimeout(settleTimer);
    };
  }, []);

  // Mobile hero layout: the image+headline+CTA group (.hero-inner) must sit
  // an equal gap from the fixed navbar above and the tag-capsule row below,
  // and — if the viewport is too short for the figure's natural width-driven
  // height to fit alongside the headline/CTA block — only the figure should
  // shrink, not the section overflow. Navbar height and the tag row's own
  // reserved zone are measured (not hardcoded) since they're driven by CSS
  // that can change independently of this file; useLayoutEffect (not
  // useEffect) so the padding/cap are applied before first paint.
  //
  // Measured once (plus a retry once the image's natural size is known) and
  // then locked: #main-header toggles a `.scrolled` compact-pill state as the
  // page scrolls, which changes nav.getBoundingClientRect().height even
  // though the device height hasn't changed. Re-measuring on every one of
  // those toggles (previously via a ResizeObserver on nav) made the figure
  // visibly resize mid-scroll. Only a genuine viewport change (resize/
  // orientationchange) should trigger a re-measure.
  useLayoutEffect(() => {
    const home = document.getElementById('home');
    const nav = document.getElementById('main-header');
    const tags = document.querySelector<HTMLElement>('.hero-tags');
    const text = document.querySelector<HTMLElement>('.hero-text');
    const img = document.querySelector<HTMLImageElement>('.hero-fig-mobile');
    if (!home || !nav || !tags || !text || !img) return;

    const GAP = 20; // px of breathing room on each side of the group

    function measure() {
      if (window.innerWidth >= 768 || !img!.naturalWidth) return;

      const navClearance = nav!.getBoundingClientRect().height + GAP;
      const tagsClearance = (home!.getBoundingClientRect().bottom - tags!.getBoundingClientRect().top) + GAP;
      home!.style.setProperty('--hero-navbar-clearance', `${navClearance}px`);
      home!.style.setProperty('--hero-tags-clearance', `${tagsClearance}px`);

      const availableForFig = home!.clientHeight - navClearance - tagsClearance - text!.getBoundingClientRect().height;
      const naturalFigH = window.innerWidth * (img!.naturalHeight / img!.naturalWidth);
      home!.style.setProperty('--hero-fig-max-h', naturalFigH <= availableForFig ? 'none' : `${Math.max(0, availableForFig)}px`);
    }

    measure();
    if (!img.naturalWidth) img.addEventListener('load', measure, { once: true });

    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  const tagsMarquee = (
    <div id="hero-tags-clip">
      <div className="hero-tags scroller hero-scroller" data-direction="left" data-animated="true">
        <div className="scroller-inner">
          <span className="tag-capsule"><i className="fas fa-rocket" style={{ color: '#4ade80' }}></i>Open for Opportunities</span>
          <span className="tag-capsule"><i className="fas fa-sitemap" style={{ color: '#60a5fa' }}></i>Complex System UX</span>
          <span className="tag-capsule"><i className="fas fa-cube" style={{ color: '#c084fc' }}></i>3D Web Experience</span>
          <span className="tag-capsule"><i className="fas fa-robot" style={{ color: '#67e8f9' }}></i>AI-Powered Workflow</span>
          <span className="tag-capsule"><i className="fas fa-mobile-alt" style={{ color: '#fb923c' }}></i>Mobile App UI</span>
          <span className="tag-capsule"><i className="fas fa-landmark" style={{ color: '#4ade80' }}></i>Gov &amp; Enterprise Projects</span>
          <span className="tag-capsule"><i className="fas fa-puzzle-piece" style={{ color: '#facc15' }}></i>Problem Solver</span>
          <span className="tag-capsule"><i className="ph-fill ph-map-pin" style={{ color: '#f87171' }}></i>Taipei, Taiwan</span>
          <span className="tag-capsule" aria-hidden="true"><i className="fas fa-rocket" style={{ color: '#4ade80' }}></i>Open for Opportunities</span>
          <span className="tag-capsule" aria-hidden="true"><i className="fas fa-sitemap" style={{ color: '#60a5fa' }}></i>Complex System UX</span>
          <span className="tag-capsule" aria-hidden="true"><i className="fas fa-cube" style={{ color: '#c084fc' }}></i>3D Web Experience</span>
          <span className="tag-capsule" aria-hidden="true"><i className="fas fa-robot" style={{ color: '#67e8f9' }}></i>AI-Powered Workflow</span>
          <span className="tag-capsule" aria-hidden="true"><i className="fas fa-mobile-alt" style={{ color: '#fb923c' }}></i>Mobile App UI</span>
          <span className="tag-capsule" aria-hidden="true"><i className="fas fa-landmark" style={{ color: '#4ade80' }}></i>Gov &amp; Enterprise Projects</span>
          <span className="tag-capsule" aria-hidden="true"><i className="fas fa-puzzle-piece" style={{ color: '#facc15' }}></i>Problem Solver</span>
          <span className="tag-capsule" aria-hidden="true"><i className="ph-fill ph-map-pin" style={{ color: '#f87171' }}></i>Taipei, Taiwan</span>
        </div>
      </div>
    </div>
  );

  return (
    <section id="home">
      <div className="hero-inner">
        <div className="hero-fig">
          <img
            src="./img/figure.webp"
            alt="Tim Lin"
            className="hero-fig-mobile"
            fetchPriority="high"
            decoding="async"
          />
          <spline-viewer id="hero-spline" className="hero-fig-desktop" />
        </div>
        <div className="hero-text">
          <h1 className="hero-h1 stagger-item">Hi, I&apos;m <span>Tim Lin</span></h1>
          <h2 className="hero-h2 stagger-item" data-i18n="hero_role">{t.hero_role}</h2>
          <p className="hero-desc hero-desc-wrap">
            <span id="hero-desc-text"></span>
            <span id="hero-desc-cursor" className="tt-cursor">|</span>
          </p>
          <div className="hero-btns hero-btns-seq">
            <button
              className="btn-glass btn-grad"
              style={{ padding: '12px 28px', borderRadius: '9999px' }}
              data-scroll-to="portfolio"
              onClick={() => scrollToSectionAligned('portfolio')}
            >
              View My Work
            </button>
            <button
              className="btn-glass"
              style={{ padding: '12px 28px', borderRadius: '9999px' }}
              data-scroll-to="contact"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Contact Me
            </button>
          </div>
        </div>
      </div>
      {/* Desktop-only clip box (display:contents below 1025px — see
          portfolio.css): shares the panel's exact box and clip-path
          (BeamsBackground.tsx's sync() writes both from the same
          heroFramePath() `d` as the border/glow), so the marquee gets cut
          off wherever it crosses into either notch instead of spilling
          into the space the ask-strip/navbar logo actually occupies.

          Portaled to document.body at >=1025px (same threshold
          BeamsBackground.tsx's own sync() uses for the notch/clip-path
          system) for the same reason #hero-spline is (see its own portal
          comment above): the figure now paints above #main-header, and a
          descendant of #home can never out-rank that — so to keep the
          marquee in front of the figure too (not just the navbar) where
          they overlap, it has to leave #home's stacking context the same
          way. Below 1025px it renders in place exactly as before (no
          notch/clip-path system exists there for it to need to share, and
          the figure doesn't reach it in practice at those widths) —
          switching the render target on every resize would be pointless
          churn for a case that doesn't need fixing. */}
      {tagsMarquee}
      <HeroAskStrip />
      <button
        className="hero-scroll-indicator"
        aria-label="Scroll to next section"
        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <div className="mouse">
          <div className="wheel"></div>
        </div>
        <div>
          <span className="m_scroll_arrows unu"></span>
          <span className="m_scroll_arrows doi"></span>
          <span className="m_scroll_arrows trei"></span>
        </div>
      </button>
    </section>
  );
}
