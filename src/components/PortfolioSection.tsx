import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useLang } from '../context/LangContext';
import { PROJECTS } from '../data/projects';
import gsap from 'gsap';

const SMOOTH_TAU = 0.18;

function createPortfolioScroller(scroller: HTMLElement, normalSpeed: number, hoverSpeed: number) {
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
    scroller.addEventListener('mouseenter', () => { targetVelocity = hoverSpeed; });
    scroller.addEventListener('mouseleave', () => { targetVelocity = normalSpeed; });
  }

  startRAF();
}

function getBentoBigIndices(total: number) {
  const a = Math.floor(Math.random() * Math.floor(total / 2));
  const b = Math.floor(total / 2) + Math.floor(Math.random() * Math.ceil(total / 2));
  return [a, b];
}

const bentoBigIndices = getBentoBigIndices(PROJECTS.length);

export default function PortfolioSection() {
  const { t, lang } = useLang();
  const [expanded, setExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const scrollerInitRef = useRef(false);

  // MagicBento cleanup refs
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const moveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const leaveHandlerRef = useRef<(() => void) | null>(null);
  const gridLeaveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const currentCardRef = useRef<HTMLElement | null>(null);

  const MB_GLOW = '74, 0, 224';
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
          rotateX: ((ly - cy) / cy) * -9,
          rotateY: ((lx - cx) / cx) * 9,
          x: (lx - cx) * 0.04,
          y: (ly - cy) * 0.04,
          transformPerspective: 900,
          duration: 0.15,
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
    if (scrollerInitRef.current) return;
    const initScrollers = () => {
      document.querySelectorAll<HTMLElement>('.portfolio-scroller').forEach(s => {
        createPortfolioScroller(s, 100, 30);
      });
    };
    if (document.fonts) {
      document.fonts.ready.then(initScrollers);
    } else {
      window.addEventListener('load', initScrollers, { once: true });
    }
    scrollerInitRef.current = true;
  }, [lang]);

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
      const portfolioSec = document.getElementById('portfolio');
      if (portfolioSec) {
        const header = document.getElementById('main-header');
        const headerOffset = header ? header.offsetHeight + 20 : 80;
        const top = portfolioSec.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    } else {
      const portfolioSec = document.getElementById('portfolio');
      const header = document.getElementById('main-header');
      const headerOffset = header ? header.offsetHeight + 20 : 80;
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
    return (
      <a
        className={cls}
        href={p.link}
        data-category={p.category}
        onClick={() => {
          sessionStorage.setItem('portfolioScrollY', String(window.scrollY));
          sessionStorage.setItem('portfolioExpanded', expanded ? 'true' : 'false');
          sessionStorage.setItem('portfolioActiveFilter', activeFilter);
        }}
      >
        <img src={p.img} alt={title} loading="lazy" />
        <div className="project-overlay">
          <div className="project-title">{title}</div>
          <div className="project-desc">{desc}</div>
          <div className="project-tags">
            {p.tags.map(tag => <span key={tag} className="project-tag">{tag}</span>)}
          </div>
        </div>
      </a>
    );
  }

  const desk1Projects = PROJECTS.slice(0, 7);
  const desk2Projects = PROJECTS.slice(7);

  return (
    <div className="section-wrapper">
      <section id="portfolio" className="section">
        <div className="portfolio-header">
          <div className="section-label fade-in" style={{ marginBottom: 0 }}>My Portfolio</div>
        </div>

        {/* Scroller view */}
        <div id="portfolio-scroller-desktop" className="stagger-item" style={{ display: expanded ? 'none' : '' }}>
          <div className="scroller portfolio-scroller" data-direction="right" data-speed="slow">
            <div className="scroller-inner" id="track-desk-1">
              {desk1Projects.map(p => <ProjectCard key={p.id} p={p} mode="scroll" />)}
            </div>
          </div>
          <div style={{ height: '20px' }} />
          <div className="scroller portfolio-scroller" data-direction="left" data-speed="slow">
            <div className="scroller-inner" id="track-desk-2">
              {desk2Projects.map(p => <ProjectCard key={p.id} p={p} mode="scroll" />)}
            </div>
          </div>
        </div>

        {/* Filter buttons */}
        {expanded && (
          <div id="portfolio-filters" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {['all', 'mobile', 'web'].map(f => (
              <button
                key={f}
                className={`btn-glass filter-btn${activeFilter === f ? ' active' : ''}`}
                data-filter={f}
                onClick={() => handleFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'mobile' ? 'Apps Design' : 'Web Design'}
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

        <div className="view-all-row fade-in">
          <button
            id="toggle-portfolio-view"
            className="btn-glass btn-grad"
            style={{ padding: '12px 28px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
            onClick={handleToggle}
          >
            <span id="toggle-portfolio-text">{expanded ? 'Fold' : 'View All Projects'}</span>
            <i id="toggle-portfolio-icon" className={expanded ? 'fas fa-chevron-up' : 'fas fa-arrow-right'}></i>
          </button>
        </div>
      </section>
    </div>
  );
}
