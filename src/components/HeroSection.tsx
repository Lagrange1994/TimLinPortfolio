import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLang } from '../context/LangContext';
import { scrollToSectionAligned } from '../utils/navHeader';
import HeroAskStrip from './HeroAskStrip';
import gsap from 'gsap';

const SMOOTH_TAU = 0.18;

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
    const h1 = document.querySelector<HTMLElement>('#home .hero-h1');
    const h2 = document.querySelector<HTMLElement>('#home .hero-h2');

    bypass(h1); bypass(h2);
    if (heroFig) gsap.set(heroFig, { opacity: 0, y: 70 });

    const h1Words = h1 ? splitWords(h1) : [];
    const h2Chars = h2 ? splitChars(h2) : [];
    if (h1Words.length) gsap.set(h1Words, { opacity: 0, y: 40, rotation: 5 });
    if (h2Chars.length) gsap.set(h2Chars, { opacity: 0, y: 28 });

    // The scroll indicator starts hidden via CSS (.hero-scroll-indicator has
    // opacity:0) and is revealed by the idle-detection effect below by adding
    // .is-revealed, so the entrance sequence leaves it alone.

    function animate() {
      setTimeout(() => {
        if (heroFig) gsap.to(heroFig, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' });
        if (h1Words.length) gsap.to(h1Words, { opacity: 1, y: 0, rotation: 0, duration: 1.0, ease: 'power3.out', stagger: 0.11, delay: 0.15 });
        if (h2Chars.length) gsap.to(h2Chars, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.035, delay: 0.6 });
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
  // mobile width. Dropping the `url` (and thus the WebGL context) the
  // instant the hero scrolled out of view caused a visible pop-in/reset
  // every time it scrolled back, so e3e0e81 made it load once and stay.
  // But leaving it permanently mounted means it keeps burning a WebGL
  // context for the rest of the page's lifetime, stacked on top of the
  // beams shader canvas — with a background Spline scene added near the
  // top, that's up to 3 concurrent contexts, and sustained GPU contention
  // from an always-alive hero context has been the suspect for renderer
  // freezes (page stops responding to scroll — see homepage-webgl-stability
  // memory) since before e3e0e81. Debouncing the drop gets both: a normal
  // scroll-past-and-back within HERO_DROP_DELAY_MS never triggers a
  // reload (no pop-in), but a user who actually moves on sheds the
  // context after a few seconds instead of holding it forever.
  useEffect(() => {
    if (window.innerWidth < 768) return;
    const heroEl = document.getElementById('home');
    const heroSpline = document.getElementById('hero-spline');
    if (!heroEl || !heroSpline) return;

    const HERO_DROP_DELAY_MS = 4000;
    heroSpline.setAttribute('url', './models/hero_figure.splinecode');

    let dropTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (dropTimer) { clearTimeout(dropTimer); dropTimer = null; }
        if (!heroSpline.getAttribute('url')) heroSpline.setAttribute('url', './models/hero_figure.splinecode');
      } else if (!dropTimer) {
        dropTimer = setTimeout(() => {
          heroSpline.removeAttribute('url');
          dropTimer = null;
        }, HERO_DROP_DELAY_MS);
      }
    }, { threshold: 0 });
    observer.observe(heroEl);

    return () => {
      observer.disconnect();
      if (dropTimer) clearTimeout(dropTimer);
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

  return (
    <section id="home">
      <div className="hero-inner">
        <div className="hero-fig">
          <picture style={{ display: 'contents' }}>
            <source srcSet="./img/figure.webp" type="image/webp" />
            <img
              src="./img/figure.png"
              alt="Tim Lin"
              className="hero-fig-mobile"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
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
          into the space the ask-strip/navbar logo actually occupies. */}
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
