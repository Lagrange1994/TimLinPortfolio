import { useEffect, useRef } from 'react';
import { useLang } from '../context/LangContext';
import gsap from 'gsap';

declare global {
  interface Window {
    gsap: typeof gsap;
  }
}

const NAV_ITEMS = [
  { key: 'home', label: 'Home', scrollTo: 'home' },
  { key: 'about', label: 'About', scrollTo: 'about' },
  { key: 'skills', label: 'Skills', scrollTo: 'my-skills' },
  { key: 'portfolio', label: 'Portfolio', scrollTo: 'portfolio' },
  { key: 'contact', label: 'Contact Me', scrollTo: 'contact' },
];

function scrollToSection(id: string) {
  if (id === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Navbar() {
  const { lang, setLang } = useLang();
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const isOpenRef = useRef(false);
  const busyRef = useRef(false);

  // Nav shrink on scroll + persist scroll position. The persisted value lets
  // a project sub-page's "Back to Portfolio" link restore the exact spot the
  // user left (not just jump to the top of a section) — sessionStorage is
  // tab-scoped, so it never leaks into a genuinely fresh visit.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let raf = 0;
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sessionStorage.setItem('home-scroll-y', String(window.scrollY));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Deep-link support: a fresh page load with a #section hash (e.g. a project
  // sub-page's "Back to Portfolio" link) needs a manual scroll once content is
  // ready — the browser's one-shot native hash-scroll fires before React has
  // mounted the target section, so it silently does nothing. For #portfolio
  // specifically, prefer the exact saved scroll position over the section top.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const goToHash = () => {
      const savedY = hash === 'portfolio' ? sessionStorage.getItem('home-scroll-y') : null;
      if (savedY !== null) {
        window.scrollTo({ top: Number(savedY), behavior: 'auto' });
        return;
      }
      scrollToSection(hash);
    };
    if (document.body.classList.contains('hero-ready')) {
      goToHash();
    } else {
      window.addEventListener('hero-ready', goToHash, { once: true });
    }
    return () => window.removeEventListener('hero-ready', goToHash);
  }, []);

  // Nav circles hover effect
  useEffect(() => {
    const navLinks = document.querySelectorAll<HTMLElement>('.nav-link');
    const tlMap = new Map<HTMLElement, gsap.core.Timeline>();
    const tweenMap = new Map<HTMLElement, gsap.core.Tween>();
    // Track listeners/timelines for cleanup (StrictMode double-invoke safety)
    const cleanups: Array<() => void> = [];

    navLinks.forEach(link => {
      const circle = link.querySelector<HTMLElement>('.nav-circle')!;
      const label = link.querySelector<HTMLElement>('.nav-label')!;
      const labelHover = link.querySelector<HTMLElement>('.nav-label-hover')!;
      if (!circle || !label || !labelHover) return;

      function layout() {
        const rect = link.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        if (!w || !h) return;
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;
        circle.style.width = D + 'px';
        circle.style.height = D + 'px';
        circle.style.bottom = -delta + 'px';
        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: '50% ' + originY + 'px' });
        gsap.set(label, { y: 0 });
        gsap.set(labelHover, { y: Math.ceil(h + 12), opacity: 0 });
        const old = tlMap.get(link);
        if (old) old.kill();
        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease: 'power3.out' }, 0);
        tl.to(label, { y: -(h + 8), duration: 2, ease: 'power3.out' }, 0);
        tl.to(labelHover, { y: 0, opacity: 1, duration: 2, ease: 'power3.out' }, 0);
        tlMap.set(link, tl);
      }

      layout();
      window.addEventListener('resize', layout);

      const onEnter = () => {
        const tl = tlMap.get(link);
        if (!tl) return;
        tweenMap.get(link)?.kill();
        tweenMap.set(link, gsap.to(tl, { time: tl.duration(), duration: 0.3, ease: 'power3.out', overwrite: 'auto' }));
      };
      const onLeave = () => {
        const tl = tlMap.get(link);
        if (!tl) return;
        tweenMap.get(link)?.kill();
        tweenMap.set(link, gsap.to(tl, { time: 0, duration: 0.2, ease: 'power3.out', overwrite: 'auto' }));
      };

      link.addEventListener('mouseenter', onEnter);
      link.addEventListener('mouseleave', onLeave);

      cleanups.push(() => {
        window.removeEventListener('resize', layout);
        link.removeEventListener('mouseenter', onEnter);
        link.removeEventListener('mouseleave', onLeave);
        tlMap.get(link)?.kill();
        tweenMap.get(link)?.kill();
        // Reset circle to hidden state so a re-mount starts clean
        gsap.set(circle, { scale: 0 });
        gsap.set(label, { y: 0 });
        gsap.set(labelHover, { y: 0, opacity: 0 });
      });
    });

    // Nav highlight on scroll
    const sections = document.querySelectorAll<HTMLElement>('section[id]');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
          const l = document.querySelector<HTMLElement>(`.nav-link[data-scroll-to="${e.target.id}"]`);
          if (l) l.classList.add('active');
        }
      });
    }, { threshold: 0.35 });
    sections.forEach(s => io.observe(s));

    return () => {
      io.disconnect();
      cleanups.forEach(fn => fn());
    };
  }, []);

  // Staggered menu
  useEffect(() => {
    const wrapper = menuRef.current!;
    const panel = panelRef.current!;
    const toggleBtn = document.getElementById('sm-toggle-btn')!;
    if (!wrapper || !panel || !toggleBtn) return;

    const prelayers = Array.from(document.querySelectorAll<HTMLElement>('#sm-prelayers .sm-prelayer'));
    const icon = document.getElementById('sm-icon') as HTMLElement;
    const plusH = document.getElementById('sm-plusH') as HTMLElement;
    const plusV = document.getElementById('sm-plusV') as HTMLElement;
    const textInner = document.getElementById('sm-toggle-textInner') as HTMLElement;

    const ALL = [...prelayers, panel];
    let openTl: gsap.core.Timeline | null = null;
    let closeTw: gsap.core.Tween | null = null;
    let spinTw: gsap.core.Tween | null = null;
    let textAnim: gsap.core.Tween | null = null;

    gsap.set(ALL, { xPercent: 100 });
    gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
    gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
    gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });

    function itemEls() { return Array.from(panel.querySelectorAll<HTMLElement>('.sm-panel-itemLabel')); }
    function numEls() { return Array.from(panel.querySelectorAll<HTMLElement>('.sm-panel-list[data-numbering] .sm-panel-item')); }
    function langTitle() { return panel.querySelector<HTMLElement>('.sm-lang-title'); }
    function langBtns() { return Array.from(panel.querySelectorAll<HTMLElement>('.sm-lang-btn')); }

    function buildOpen() {
      if (openTl) openTl.kill();
      if (closeTw) { closeTw.kill(); closeTw = null; }
      const its = itemEls(), nums = numEls(), lt = langTitle(), lbs = langBtns();
      if (its.length) gsap.set(its, { yPercent: 140, rotate: 10 });
      if (nums.length) gsap.set(nums, { '--sm-num-opacity': 0 } as gsap.TweenVars);
      if (lt) gsap.set(lt, { opacity: 0 });
      if (lbs.length) gsap.set(lbs, { y: 20, opacity: 0 });

      const tl = gsap.timeline({ paused: true });
      prelayers.forEach((el, i) =>
        tl.fromTo(el, { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07)
      );
      const pStart = (prelayers.length - 1) * 0.07 + 0.08;
      tl.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.65, ease: 'power4.out' }, pStart);

      if (its.length) {
        const iStart = pStart + 0.65 * 0.15;
        tl.to(its, { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: 0.1 }, iStart);
        if (nums.length) tl.to(nums, { '--sm-num-opacity': 1, duration: 0.6, ease: 'power2.out', stagger: 0.08 } as gsap.TweenVars, iStart + 0.1);
      }
      const lStart = pStart + 0.65 * 0.4;
      if (lt) tl.to(lt, { opacity: 1, duration: 0.5, ease: 'power2.out' }, lStart);
      if (lbs.length) tl.to(lbs, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.08 }, lStart + 0.04);
      openTl = tl;
      return tl;
    }

    function playOpen() {
      if (busyRef.current) return;
      busyRef.current = true;
      wrapper.style.pointerEvents = 'auto';
      buildOpen().eventCallback('onComplete', () => { busyRef.current = false; }).play(0);
    }

    function playClose() {
      if (openTl) { openTl.kill(); openTl = null; }
      if (closeTw) closeTw.kill();
      wrapper.style.pointerEvents = 'none';
      closeTw = gsap.to(ALL, {
        xPercent: 100, duration: 0.32, ease: 'power3.in', overwrite: 'auto',
        onComplete() {
          const its = itemEls(), nums = numEls(), lt = langTitle(), lbs = langBtns();
          if (its.length) gsap.set(its, { yPercent: 140, rotate: 10 });
          if (nums.length) gsap.set(nums, { '--sm-num-opacity': 0 } as gsap.TweenVars);
          if (lt) gsap.set(lt, { opacity: 0 });
          if (lbs.length) gsap.set(lbs, { y: 20, opacity: 0 });
          busyRef.current = false;
        }
      });
    }

    function animateIcon(opening: boolean) {
      if (spinTw) spinTw.kill();
      spinTw = gsap.to(icon, opening
        ? { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' }
        : { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
    }

    function animateText(opening: boolean) {
      if (textAnim) textAnim.kill();
      const cur = opening ? 'Menu' : 'Close';
      const tgt = opening ? 'Close' : 'Menu';
      const seq = [cur];
      let last = cur;
      for (let i = 0; i < 3; i++) { last = last === 'Menu' ? 'Close' : 'Menu'; seq.push(last); }
      if (last !== tgt) seq.push(tgt);
      seq.push(tgt);
      textInner.innerHTML = seq.map(l => `<span class="sm-toggle-line">${l}</span>`).join('');
      gsap.set(textInner, { yPercent: 0 });
      textAnim = gsap.to(textInner, {
        yPercent: -((seq.length - 1) / seq.length) * 100,
        duration: 0.5 + seq.length * 0.07, ease: 'power4.out'
      });
    }

    function openMenu() {
      isOpenRef.current = true;
      toggleBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      document.body.classList.add('sm-menu-open');
      wrapper.classList.add('sm-open');
      playOpen(); animateIcon(true); animateText(true);
    }

    function closeMenu() {
      isOpenRef.current = false;
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      document.body.classList.remove('sm-menu-open');
      wrapper.classList.remove('sm-open');
      playClose(); animateIcon(false); animateText(false);
    }

    const onToggle = () => isOpenRef.current ? closeMenu() : openMenu();
    toggleBtn.addEventListener('click', onToggle);

    const panelCloseBtn = document.getElementById('sm-panel-close-btn');
    const onPanelClose = () => { if (isOpenRef.current) closeMenu(); };
    if (panelCloseBtn) panelCloseBtn.addEventListener('click', onPanelClose);

    const onMousedown = (e: MouseEvent) => {
      if (!isOpenRef.current) return;
      if (!panel.contains(e.target as Node) && !toggleBtn.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener('mousedown', onMousedown);

    panel.querySelectorAll<HTMLElement>('.sm-panel-item').forEach(btn => {
      btn.addEventListener('click', () => { setTimeout(closeMenu, 80); });
    });

    return () => {
      toggleBtn.removeEventListener('click', onToggle);
      if (panelCloseBtn) panelCloseBtn.removeEventListener('click', onPanelClose);
      document.removeEventListener('mousedown', onMousedown);
    };
  }, []);

  const toggleLangDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dd = document.getElementById('lang-dropdown');
    const chevron = document.getElementById('lang-chevron');
    if (!dd) return;
    const isOpen = dd.classList.contains('open');
    dd.classList.toggle('open');
    if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('#lang-menu-btn') && !target.closest('#lang-dropdown')) {
        const dd = document.getElementById('lang-dropdown');
        const chevron = document.getElementById('lang-chevron');
        if (dd) dd.classList.remove('open');
        if (chevron) chevron.style.transform = '';
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleLangSelect = (newLang: 'zh' | 'en') => {
    setLang(newLang);
    const dd = document.getElementById('lang-dropdown');
    const chevron = document.getElementById('lang-chevron');
    if (dd) dd.classList.remove('open');
    if (chevron) chevron.style.transform = '';
  };

  return (
    <>
      <header id="main-header" ref={headerRef}>
        <div id="nav-container">
          <a href="#home" className="logo">
            <span className="gradient-text-brand">Tim</span>
            <span style={{ color: '#fff' }}>Lin</span>
          </a>
          <nav>
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                className={`nav-link${item.key === 'home' ? ' active' : ''}`}
                data-scroll-to={item.scrollTo}
                onClick={() => scrollToSection(item.scrollTo)}
              >
                <span className="nav-circle" aria-hidden="true"></span>
                <span className="nav-label-stack">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-label-hover" aria-hidden="true">{item.label}</span>
                </span>
              </button>
            ))}
          </nav>
          <div style={{ position: 'relative' }}>
            <button id="lang-menu-btn" onClick={toggleLangDropdown}>
              <i className="fas fa-globe"></i>
              <span id="lang-label">{lang === 'zh' ? '繁體中文' : 'English'}</span>
              <i className="fas fa-chevron-down" id="lang-chevron" style={{ fontSize: '10px', opacity: 0.7, transition: 'transform 0.2s' }}></i>
            </button>
            <div id="lang-dropdown">
              <button className={`lang-opt${lang === 'zh' ? ' active' : ''}`} onClick={() => handleLangSelect('zh')}>
                <i className="fas fa-check" id="check-zh"></i>繁體中文
              </button>
              <button className={`lang-opt${lang === 'en' ? ' active' : ''}`} onClick={() => handleLangSelect('en')}>
                <i className="fas fa-check" id="check-en"></i>English
              </button>
            </div>
          </div>
          <button id="sm-toggle-btn" aria-label="Open menu" aria-expanded="false">
            <span className="sm-toggle-textWrap" aria-hidden="true">
              <span className="sm-toggle-textInner" id="sm-toggle-textInner">
                <span className="sm-toggle-line">Menu</span>
              </span>
            </span>
            <span id="sm-icon" className="sm-icon" aria-hidden="true">
              <span id="sm-plusH" className="sm-icon-line"></span>
              <span id="sm-plusV" className="sm-icon-line sm-icon-line-v"></span>
            </span>
          </button>
        </div>
      </header>

      {/* Staggered Menu Overlay */}
      <div id="staggered-menu" className="sm-wrapper" data-position="right" ref={menuRef}>
        <div id="sm-prelayers" className="sm-prelayers" aria-hidden="true">
          <div className="sm-prelayer" style={{ background: '#2a1a4e' }}></div>
          <div className="sm-prelayer" style={{ background: '#6C63FF' }}></div>
        </div>
        <aside id="sm-panel" className="sm-panel" aria-hidden="true" ref={panelRef}>
          <button className="sm-panel-close" id="sm-panel-close-btn" aria-label="Close menu">
            Close
            <span className="sm-panel-close-icon"><span></span><span></span></span>
          </button>
          <div className="sm-panel-inner">
            <ul className="sm-panel-list" id="sm-panel-list" data-numbering="true">
              {NAV_ITEMS.map(item => (
                <li key={item.key} className="sm-panel-itemWrap">
                  <button
                    className="sm-panel-item"
                    data-scroll-to={item.scrollTo}
                    onClick={() => scrollToSection(item.scrollTo)}
                  >
                    <span className="sm-panel-itemLabel">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="sm-lang">
              <h3 className="sm-lang-title">Language</h3>
              <div className="sm-lang-btns">
                <button
                  className={`sm-lang-btn${lang === 'zh' ? ' active' : ''}`}
                  id="sm-lang-zh"
                  onClick={() => { setLang('zh'); }}
                >繁體中文</button>
                <button
                  className={`sm-lang-btn${lang === 'en' ? ' active' : ''}`}
                  id="sm-lang-en"
                  onClick={() => { setLang('en'); }}
                >English</button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
