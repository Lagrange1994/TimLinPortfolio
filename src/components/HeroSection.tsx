import { useEffect, useRef } from 'react';
import { useLang } from '../context/LangContext';
import gsap from 'gsap';

const SMOOTH_TAU = 0.18;

function createScroller(scroller: HTMLElement, normalSpeed: number, hoverSpeed: number) {
  const inner = scroller.querySelector<HTMLElement>('.scroller-inner');
  if (!inner) return;
  const isReverse = scroller.getAttribute('data-direction') === 'right';
  if (scroller.getAttribute('data-raf-init') === 'true') return;

  const origItems = Array.from(inner.children) as HTMLElement[];
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

    function tick(ts: number) {
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

    requestAnimationFrame(tick);
    scroller.addEventListener('mouseenter', () => { targetVelocity = hoverSpeed; });
    scroller.addEventListener('mouseleave', () => { targetVelocity = normalSpeed; });
  }

  const images = inner.querySelectorAll('img');
  if (images.length === 0) {
    startRAF();
  } else {
    let loaded = 0;
    const onLoad = () => { if (++loaded >= images.length) startRAF(); };
    images.forEach(img => {
      if (img.complete) onLoad();
      else {
        img.addEventListener('load', onLoad, { once: true });
        img.addEventListener('error', onLoad, { once: true });
      }
    });
  }
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
        return Array.from(el.children).filter(c => c.tagName === 'SPAN') as HTMLElement[];
      }
      el.dataset.split = 'chars';
      const result: HTMLElement[] = [];
      const nodes = Array.from(el.childNodes);
      while (el.firstChild) el.removeChild(el.firstChild);
      nodes.forEach(n => {
        if (n.nodeType === 3) {
          Array.from((n as Text).textContent!).forEach(c => {
            if (c === ' ') { el.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.style.cssText = 'display:inline-block;will-change:transform,opacity';
            s.textContent = c; el.appendChild(s); result.push(s);
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

  // Hero spline desktop conditional
  useEffect(() => {
    if (window.innerWidth >= 1025) {
      const heroSpline = document.getElementById('hero-spline');
      if (heroSpline) heroSpline.setAttribute('url', './models/hero_figure.splinecode');
    }
  }, []);

  return (
    <section id="home">
      <div className="hero-inner">
        <div className="hero-fig">
          <img
            src="./img/figure.png"
            alt="Tim Lin"
            className="hero-fig-mobile"
            fetchPriority="high"
            decoding="async"
          />
          <spline-viewer id="hero-spline" className="hero-fig-desktop" />
        </div>
        <div className="hero-text">
          <h1 className="hero-h1 stagger-item">Hi, I'm <span>Tim Lin</span></h1>
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
              onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
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
    </section>
  );
}
