import { useEffect } from 'react';
import { useLang } from '../context/LangContext';
import gsap from 'gsap';

const SMOOTH_TAU = 0.18;

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

export default function SkillsSection() {
  const { t } = useLang();

  // Restart SVG SMIL animations (<animateMotion>/<mpath>) injected via
  // dangerouslySetInnerHTML — browsers only auto-start SMIL on document
  // parse, not on dynamic innerHTML insertion, so the flow-particle
  // animation in the AI workflow diagram never begins on its own.
  useEffect(() => {
    const svg = document.querySelector('.ai-flow-grid svg');
    if (!svg) return;
    const restart = () => {
      svg.querySelectorAll('animateMotion, animate, animateTransform').forEach(anim => {
        try { (anim as any).beginElement(); } catch { /* unsupported in some engines */ }
      });
    };
    // Defer to next frame so the injected markup is fully parsed/laid out
    const raf = requestAnimationFrame(restart);
    return () => cancelAnimationFrame(raf);
  }, [t]);

  // Border glow cards
  useEffect(() => {
    const GLOW_COLOR = '264 70 75';
    const BG = '#13101c';
    const COLORS = ['#6C63FF', '#f472b6', '#38bdf8'];
    const INTENSITY = 1.1;
    const GRAD_POS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
    const GRAD_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
    const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

    function parseHSL(s: string) {
      const m = s.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
      return m ? { h: +m[1], s: +m[2], l: +m[3] } : { h: 264, s: 70, l: 75 };
    }
    function setGlowVars(el: HTMLElement, hslStr: string, intensity: number) {
      const { h, s, l } = parseHSL(hslStr);
      const base = `${h}deg ${s}% ${l}%`;
      [100, 60, 50, 40, 30, 20, 10].forEach((op, i) => {
        const suffix = i === 0 ? '' : `-${op}`;
        el.style.setProperty(`--glow-color${suffix}`, `hsl(${base} / ${Math.min(op * intensity, 100)}%)`);
      });
    }
    function setGradientVars(el: HTMLElement, colors: string[]) {
      GRAD_KEYS.forEach((key, i) => {
        const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
        el.style.setProperty(key, `radial-gradient(at ${GRAD_POS[i]}, ${c} 0px, transparent 50%)`);
      });
      el.style.setProperty('--gradient-base', `linear-gradient(${colors[0]} 0 100%)`);
    }
    function getCenter(el: HTMLElement) {
      const r = el.getBoundingClientRect();
      return [r.width / 2, r.height / 2];
    }
    function edgeProximity(el: HTMLElement, x: number, y: number) {
      const [cx, cy] = getCenter(el);
      const dx = x - cx, dy = y - cy;
      let kx = Infinity, ky = Infinity;
      if (dx !== 0) kx = cx / Math.abs(dx);
      if (dy !== 0) ky = cy / Math.abs(dy);
      return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
    }
    function cursorAngle(el: HTMLElement, x: number, y: number) {
      const [cx, cy] = getCenter(el);
      const dx = x - cx, dy = y - cy;
      if (!dx && !dy) return 0;
      let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      return deg < 0 ? deg + 360 : deg;
    }

    document.querySelectorAll<HTMLElement>('.process-card').forEach(card => {
      if (card.querySelector('.edge-light')) return; // already initialized
      const el = document.createElement('span');
      el.className = 'edge-light';
      card.insertBefore(el, card.firstChild);

      const inner = document.createElement('div');
      inner.className = 'border-glow-inner';
      Array.from(card.children)
        .filter(c => !c.classList.contains('edge-light'))
        .forEach(c => inner.appendChild(c));
      card.appendChild(inner);

      card.classList.add('border-glow-card');
      card.style.setProperty('--card-bg', BG);
      setGlowVars(card, GLOW_COLOR, INTENSITY);
      setGradientVars(card, COLORS);

      card.addEventListener('pointermove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--edge-proximity', (edgeProximity(card, x, y) * 100).toFixed(3));
        card.style.setProperty('--cursor-angle', `${cursorAngle(card, x, y).toFixed(3)}deg`);
      });
    });
  }, [t]);

  // Spotlight cards
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('.sc-card').forEach(card => {
      if (card.querySelector(':scope > .sc-overlay')) return;
      const ov = document.createElement('div');
      ov.className = 'sc-overlay';
      card.insertBefore(ov, card.firstChild);

      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--sc-x', (e.clientX - r.left) + 'px');
        card.style.setProperty('--sc-y', (e.clientY - r.top) + 'px');
      };
      const onLeave = () => {
        card.style.setProperty('--sc-x', '-500px');
        card.style.setProperty('--sc-y', '-500px');
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }, [t]);

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

  // Scroll animations
  useEffect(() => {
    const ROW_BAND = 80;
    const ROW_DELAY = 230;
    const COL_DELAY = 110;

    function revealSection(section: HTMLElement) {
      const items = Array.from(section.querySelectorAll<HTMLElement>('.stagger-item, .fade-in'))
        .filter(el => !el.classList.contains('visible'));
      if (!items.length) return;

      const secTop = section.getBoundingClientRect().top;
      const measured = items.map(el => {
        const r = el.getBoundingClientRect();
        return { el, relTop: r.top - secTop, left: r.left };
      }).sort((a, b) => {
        const ra = Math.round(a.relTop / ROW_BAND);
        const rb = Math.round(b.relTop / ROW_BAND);
        return ra !== rb ? ra - rb : a.left - b.left;
      });

      let baseRowKey = -1, rowIdx = -1, colIdx = 0;
      measured.forEach(({ el, relTop }) => {
        const key = Math.round(relTop / ROW_BAND);
        if (key !== baseRowKey) { baseRowKey = key; rowIdx++; colIdx = 0; }
        else colIdx++;
        const delay = rowIdx * ROW_DELAY + colIdx * COL_DELAY;
        setTimeout(() => el.classList.add('visible'), delay);
      });
    }

    const seen = new Set<HTMLElement>();
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section.section'));

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const sec = entry.target as HTMLElement;
        if (seen.has(sec)) return;
        seen.add(sec);
        observer.unobserve(sec);
        revealSection(sec);
      });
    }, { threshold: 0.05 });
    sections.forEach(sec => observer.observe(sec));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* DESIGN PROCESS */}
      <section className="section">
        <div className="section-label fade-in">My Design Process</div>
        <div className="process-dual stagger-item">
          <div className="process-column">
            <div className="process-column-header">
              <i className="ph-bold ph-buildings"></i>
              <span>{t.tab_inhouse}</span>
            </div>
            <div className="process-column-grid">
              {(['01','02','03','04','05','06'] as const).map((num, i) => {
                const idx = String(i + 1).padStart(2, '0') as '01'|'02'|'03'|'04'|'05'|'06';
                const nameKey = `ih_name_${idx}` as keyof typeof t;
                const descKey = `ih_desc_${idx}` as keyof typeof t;
                return (
                  <div className="process-card" key={num}>
                    <div className="process-num">{num}</div>
                    <div className="process-name">{t[nameKey] as string}</div>
                    <div className="process-desc">{t[descKey] as string}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="process-column">
            <div className="process-column-header">
              <i className="ph-bold ph-handshake"></i>
              <span>{t.tab_freelance}</span>
            </div>
            <div className="process-column-grid">
              {(['01','02','03','04','05','06'] as const).map((num, i) => {
                const idx = String(i + 1).padStart(2, '0') as '01'|'02'|'03'|'04'|'05'|'06';
                const nameKey = `fl_name_${idx}` as keyof typeof t;
                const descKey = `fl_desc_${idx}` as keyof typeof t;
                return (
                  <div className="process-card" key={num}>
                    <div className="process-num">{num}</div>
                    <div className="process-name">{t[nameKey] as string}</div>
                    <div className="process-desc">{t[descKey] as string}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="section">
        <div className="section-label fade-in">Tech Stack</div>
        <h2 className="tech-headline stagger-item">Web development <span className="gradient-text">literacy</span></h2>
        <p className="tech-sub stagger-item">{t.tech_sub}</p>
        <div className="tech-items stagger-item">
          <div className="tech-item html-item card-spotlight sc-card">
            <div className="tech-item-header">
              <span className="tech-name"><i className="fab fa-html5" style={{ color: '#60a5fa', marginRight: '8px' }}></i>HTML / CSS / Tailwind</span>
              <span className="tech-level-badge">DESIGN-READY</span>
            </div>
            <div className="tech-desc">{t.skill_html}</div>
          </div>
          <div className="tech-item js-item card-spotlight sc-card">
            <div className="tech-item-header">
              <span className="tech-name"><i className="fab fa-js" style={{ color: '#fb923c', marginRight: '8px' }}></i>JavaScript</span>
              <span className="tech-level-badge">AI-ASSISTED</span>
            </div>
            <div className="tech-desc">{t.skill_js}</div>
          </div>
          <div className="tech-item react-item card-spotlight sc-card">
            <div className="tech-item-header">
              <span className="tech-name"><i className="fab fa-react" style={{ color: '#a5b4fc', marginRight: '8px' }}></i>React.js / Vue.js</span>
              <span className="tech-level-badge">RESPONSIVE</span>
            </div>
            <div className="tech-desc">{t.skill_css}</div>
          </div>
        </div>
        <div className="tech-note fade-in" dangerouslySetInnerHTML={{ __html: t.figma_mcp }} />
      </section>

      {/* MY SKILLS */}
      <section id="my-skills" className="section">
        <div className="section-label fade-in">My Skills</div>
        <div className="skills-outer scroller skills-scroller" data-direction="left">
          <div className="scroller-inner">
            <span className="skill-pill"><img src="./img/others/Figma_logo.png" className="skill-icon-img" alt="Figma" loading="lazy" />Figma</span>
            <span className="skill-pill"><img src="./img/others/Adobe_XD_logo.png" className="skill-icon-img" alt="Adobe XD" loading="lazy" />Adobe XD</span>
            <span className="skill-pill"><img src="./img/others/Blender_logo.png" className="skill-icon-img" alt="Blender" loading="lazy" />Blender</span>
            <span className="skill-pill"><img src="./img/others/Spline_logo.webp" className="skill-icon-img" alt="Spline" loading="lazy" />Spline</span>
            <span className="skill-pill"><img src="./img/others/Lightroom_logo.png" className="skill-icon-img" alt="Lightroom" loading="lazy" />Lightroom</span>
            <span className="skill-pill"><img src="./img/others/Krita_logo.png" className="skill-icon-img" alt="Krita" loading="lazy" />Krita</span>
            <span className="skill-pill"><img src="./img/others/Photoshop_logo.png" className="skill-icon-img" alt="Photoshop" loading="lazy" />Photoshop</span>
            <span className="skill-pill"><img src="./img/others/Illustrator_logo.png" className="skill-icon-img" alt="Illustrator" loading="lazy" />Illustrator</span>
            <span className="skill-pill"><img src="./img/others/Dora_logo.png" className="skill-icon-img" alt="Dora" loading="lazy" />Dora</span>
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
      </section>

      {/* HOW I USE AI */}
      <section className="section">
        <div className="section-label fade-in">How I Use AI</div>
        <h2 className="stagger-item" style={{ fontSize: 'clamp(1.6rem,2.5vw,2rem)', fontWeight: 700, letterSpacing: '-.02em', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
          AI-Assisted Design <span className="gradient-text">Intake System</span>
        </h2>
        <p className="stagger-item" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', marginBottom: '32px' }}>
          {t.ai_sub}
        </p>

        <div className="ai-flow-grid stagger-item" dangerouslySetInnerHTML={{ __html: `
          <div class="ai-connectors" aria-hidden="true">
            <svg viewBox="0 0 230 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ag-down" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#00D4FF" stop-opacity="0"/>
                  <stop offset="40%" stop-color="#00D4FF" stop-opacity="0.55"/>
                  <stop offset="100%" stop-color="#8A2BE2" stop-opacity="0.5"/>
                </linearGradient>
                <linearGradient id="ag-ur" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stop-color="#00D4FF" stop-opacity="0.55"/>
                  <stop offset="100%" stop-color="#8A2BE2" stop-opacity="0.6"/>
                </linearGradient>
                <linearGradient id="ag-vv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#8A2BE2" stop-opacity="0.6"/>
                  <stop offset="100%" stop-color="#4A00E0" stop-opacity="0.5"/>
                </linearGradient>
                <linearGradient id="ag-pg" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stop-color="#4A00E0" stop-opacity="0.55"/>
                  <stop offset="100%" stop-color="#7BE3B5" stop-opacity="0.55"/>
                </linearGradient>
                <linearGradient id="ag-sw" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#7BE3B5" stop-opacity="0.55"/>
                  <stop offset="100%" stop-color="#00D4FF" stop-opacity="0.45"/>
                </linearGradient>
                <path id="agp1" d="M 37 39 C 26 45, 26 53, 37 59" stroke="url(#ag-down)" stroke-width="0.2" fill="none" opacity="0.7" stroke-dasharray="1 9" stroke-linecap="round"/>
                <path id="agp2" d="M 60 68 C 74 63, 90 45, 97 30" stroke="url(#ag-ur)" stroke-width="0.22" fill="none" opacity="0.78" stroke-dasharray="1 9" stroke-linecap="round"/>
                <path id="agp3" d="M 115 39 C 126 45, 126 53, 115 59" stroke="url(#ag-vv)" stroke-width="0.22" fill="none" opacity="0.78" stroke-dasharray="1 9" stroke-linecap="round"/>
                <path id="agp4" d="M 138 68 C 152 63, 168 45, 175 30" stroke="url(#ag-pg)" stroke-width="0.22" fill="none" opacity="0.7" stroke-dasharray="1 9" stroke-linecap="round"/>
                <path id="agp5" d="M 193 39 C 215 50, 210 65, 193 59" stroke="url(#ag-sw)" stroke-width="0.22" fill="none" opacity="0.7" stroke-dasharray="1 9" stroke-linecap="round"/>
              </defs>
              <use href="#agp1"/><use href="#agp2"/><use href="#agp3"/><use href="#agp4"/><use href="#agp5"/>
              <circle fill="#00D4FF" r="0.58"><animateMotion dur="4s" repeatCount="indefinite" rotate="auto"><mpath href="#agp1"/></animateMotion></circle>
              <circle fill="#8A2BE2" r="0.65"><animateMotion dur="3.6s" repeatCount="indefinite" rotate="auto" begin="0.5s"><mpath href="#agp2"/></animateMotion></circle>
              <circle fill="#4A00E0" r="0.65"><animateMotion dur="3.4s" repeatCount="indefinite" rotate="auto" begin="1.4s"><mpath href="#agp3"/></animateMotion></circle>
              <circle fill="#7BE3B5" r="0.58"><animateMotion dur="3.6s" repeatCount="indefinite" rotate="auto" begin="0.2s"><mpath href="#agp4"/></animateMotion></circle>
              <circle fill="#8A2BE2" r="0.50"><animateMotion dur="6s" repeatCount="indefinite" rotate="auto" begin="0.9s"><mpath href="#agp5"/></animateMotion></circle>
            </svg>
          </div>

          <article class="ai-card">
            <span class="ai-step-badge"><em>01</em></span>
            <div class="ai-card-head">
              <div class="ai-glyph"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M8.2 6h7.6M6 8.2v7.6M18 8.2v7.6M8.2 18h7.6"/></svg></div>
              <h3>Request Sources</h3>
            </div>
            <p>PMs, stakeholders, clients — anything from a LINE message to a Tally form lands in one inbox.</p>
            <div class="ai-tags"><span class="ai-tag">LINE</span><span class="ai-tag">Email</span><span class="ai-tag">Form</span><span class="ai-tag">Slack</span></div>
          </article>

          <article class="ai-card ai-focal">
            <span class="ai-step-badge"><em>03</em></span>
            <span class="ai-focal-badge">GEMINI · DRAFT</span>
            <div class="ai-card-head">
              <div class="ai-glyph"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 13.6 8.4 19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z"/><path d="M19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z"/></svg></div>
              <h3>AI Brief</h3>
            </div>
            <p>Gemini summarizes the request, classifies the task type, identifies missing context, and suggests the first questions — before I read a single message.</p>
            <div class="ai-tags"><span class="ai-tag">Gemini</span><span class="ai-tag">Classify</span><span class="ai-tag">Summarize</span><span class="ai-tag">Gap-find</span></div>
          </article>

          <article class="ai-card ai-human">
            <span class="ai-step-badge"><em>05</em></span>
            <div class="ai-card-head">
              <div class="ai-glyph"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5"/></svg></div>
              <h3>Human Review</h3>
            </div>
            <p>I read the brief, judge priority, confirm strategy, spot risks, and decide the first action — the part that requires design judgment.</p>
            <div class="ai-tags"><span class="ai-tag">Priority</span><span class="ai-tag">Strategy</span><span class="ai-tag">Risk</span><span class="ai-tag">Next step</span></div>
          </article>

          <article class="ai-card">
            <span class="ai-step-badge"><em>02</em></span>
            <div class="ai-card-head">
              <div class="ai-glyph"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 9h8M8 13h8M8 17h5"/></svg></div>
              <h3>Intake</h3>
            </div>
            <p>Make receives each request and normalizes it — source, project type, goal, timeline, priority, and contact all captured in structured fields.</p>
            <div class="ai-tags"><span class="ai-tag">Make</span><span class="ai-tag">Webhooks</span><span class="ai-tag">Fields</span></div>
          </article>

          <article class="ai-card">
            <span class="ai-step-badge"><em>04</em></span>
            <div class="ai-card-head">
              <div class="ai-glyph"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="1.8"/><path d="M3.5 9.5h17M9 4.5v15M14.5 4.5v15"/></svg></div>
              <h3>Tracking</h3>
            </div>
            <p>Every structured brief is written to Google Sheets with a stable record ID — a searchable, always-up-to-date intake log.</p>
            <div class="ai-tags"><span class="ai-tag">Sheets</span><span class="ai-tag">Record ID</span><span class="ai-tag">History</span></div>
          </article>

          <article class="ai-card">
            <span class="ai-step-badge"><em>06</em></span>
            <div class="ai-card-head">
              <div class="ai-glyph"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h4l2-6 4 12 2-6h4"/></svg></div>
              <h3>Design Workflow</h3>
            </div>
            <p>The brief enters the design pipeline — already structured, prioritized, and contextualized.</p>
            <div class="ai-pipeline">
              <span class="ai-pstep">Research</span><span class="ai-psep">→</span>
              <span class="ai-pstep">Structure</span><span class="ai-psep">→</span>
              <span class="ai-pstep">Design</span><span class="ai-psep">→</span>
              <span class="ai-pstep">Validate</span><span class="ai-psep">→</span>
              <span class="ai-pstep">Delivery</span>
            </div>
          </article>
        ` }} />

        <div className="ai-chips-row stagger-item">
          <div className="ai-chips-label"><span>AI classifies requests as</span></div>
          <div className="ai-chips">
            <span className="ai-chip"><span className="ai-chip-dot"></span>Product UI<span className="ai-chip-count">42%</span></span>
            <span className="ai-chip"><span className="ai-chip-dot"></span>Graphic Design<span className="ai-chip-count">21%</span></span>
            <span className="ai-chip"><span className="ai-chip-dot"></span>UX Review<span className="ai-chip-count">19%</span></span>
            <span className="ai-chip"><span className="ai-chip-dot"></span>Research Planning<span className="ai-chip-count">18%</span></span>
          </div>
        </div>

        <div className="ai-principle stagger-item">
          AI handles <em>structure</em><span className="ai-principle-dot"></span>I handle <em>judgment</em>.
        </div>
      </section>
    </>
  );
}
