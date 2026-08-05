import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { useLang } from '../context/LangContext';
import { PROJECTS } from '../data/projects';
import { squircleRectPath, squircleRingMaskUrl } from '../utils/squircle';
import { scrollToSectionAligned } from '../utils/navHeader';
import gsap from 'gsap';

const SMOOTH_TAU = 0.18;
// Spring tuning matches animata.design's Fluid Tabs indicator (see the FAQ tabs in ContactSection.tsx).
const FILTER_TAB_INDICATOR_SPRING = { type: 'spring' as const, stiffness: 380, damping: 34, mass: 0.75 };
// Matches How I Use AI's card corner radius (.ai-card) so the squircle reads
// consistently across sections instead of scaling with each card's box size.
const CARD_CORNER_RADIUS = 44;

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

  // Scale the whole tilted row stack (cards + gaps together) to fill the
  // viewport-height .portfolio-wall, instead of stretching gaps apart via
  // flexbox — keeps the original card spacing proportions intact.
  useEffect(() => {
    const wall = document.querySelector<HTMLElement>('.portfolio-wall');
    const inner = document.querySelector<HTMLElement>('.portfolio-wall-inner');
    if (!wall || !inner) return;

    function applyScale() {
      const rows = Array.from(inner!.querySelectorAll<HTMLElement>('.portfolio-row'))
        .filter(r => r.offsetHeight > 0);
      if (rows.length === 0 || wall!.offsetHeight === 0) return;
      const gap = parseFloat(getComputedStyle(inner!).gap) || 0;
      const contentHeight = rows.reduce((sum, r) => sum + r.offsetHeight, 0) + gap * (rows.length - 1);
      if (contentHeight <= 0) return;
      inner!.style.setProperty('--wall-scale', String(wall!.offsetHeight / contentHeight));
    }

    applyScale();
    const ro = new ResizeObserver(applyScale);
    ro.observe(wall);
    return () => ro.disconnect();
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
          <div className="project-overlay">
            <div className="project-title">{title}</div>
            <div className="project-desc">{desc}</div>
            <div className="project-tags">
              {p.tags.map(tag => <span key={tag} className="project-tag">{tag}</span>)}
            </div>
          </div>
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
        <div id="portfolio-scroller-desktop" className="rise-soft portfolio-wall" style={{ display: expanded ? 'none' : '' }}>
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
