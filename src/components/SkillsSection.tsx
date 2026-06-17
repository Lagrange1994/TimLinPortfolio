import { useEffect, useState, useRef, Fragment } from 'react';
import { useLang } from '../context/LangContext';
import BorderGlow from './BorderGlow';

const SMOOTH_TAU = 0.18;

const AI_CARDS = [
  {
    id: 'sources',
    step: '01',
    variant: '',
    badge: null as string | null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="6" cy="18" r="2.2" /><circle cx="18" cy="18" r="2.2" />
        <path d="M8.2 6h7.6M6 8.2v7.6M18 8.2v7.6M8.2 18h7.6" />
      </svg>
    ),
    title: 'Request Sources',
    summary: 'PMs, stakeholders, clients — anything from a LINE message to a Tally form lands in one inbox.',
    tags: ['LINE', 'Email', 'Form', 'Slack'],
    pipeline: null as string[] | null,
    detail: (
      <div className="detail-section">
        <div className="d-label"><span className="dot" />Recent inbound</div>
        <div className="channel-list">
          <div className="channel">
            <span className="ch-icon">L</span>
            <div className="ch-body">
              <div className="ch-name">LINE · @pm.celine</div>
              <div className="ch-snippet">Onboarding redesign for the new tier — Jun 17?</div>
            </div>
            <span className="ch-time">2m</span>
          </div>
          <div className="channel">
            <span className="ch-icon">E</span>
            <div className="ch-body">
              <div className="ch-name">Email · celine.h@firm.co</div>
              <div className="ch-snippet">Quick question on tier-2 pricing visuals</div>
            </div>
            <span className="ch-time">28m</span>
          </div>
          <div className="channel">
            <span className="ch-icon">F</span>
            <div className="ch-body">
              <div className="ch-name">Form · Brief intake</div>
              <div className="ch-snippet">Tier-2 pricing experiment — marketing</div>
            </div>
            <span className="ch-time">1h</span>
          </div>
          <div className="channel">
            <span className="ch-icon">S</span>
            <div className="ch-body">
              <div className="ch-name">Slack · #design-requests</div>
              <div className="ch-snippet">Mobile sign-up flow — usability review</div>
            </div>
            <span className="ch-time">3h</span>
          </div>
          <div className="channel">
            <span className="ch-icon">M</span>
            <div className="ch-body">
              <div className="ch-name">Manual · Kickoff notes</div>
              <div className="ch-snippet">In-person — Q3 roadmap dependencies</div>
            </div>
            <span className="ch-time">1d</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'ai',
    step: '03',
    variant: 'ai-focal',
    badge: 'GEMINI · DRAFT',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 13.6 8.4 19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" />
        <path d="M19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z" />
      </svg>
    ),
    title: 'AI Brief',
    summary: 'Gemini summarizes the request, classifies the task type, identifies missing context, and suggests the first questions — before I read a single message.',
    tags: ['Gemini', 'Classify', 'Summarize', 'Gap-find'],
    pipeline: null as string[] | null,
    detail: (
      <>
        <div className="ai-summary">
          <div className="d-label"><span className="dot" />Summary</div>
          <p>Redesign the <span className="hl">first-run onboarding</span> to introduce a new pricing tier without disrupting the existing free-to-paid funnel. PM signals a Q3 dependency — ship before <span className="hl">Jun 17</span>.</p>
        </div>
        <div className="ai-row">
          <div className="ai-cell">
            <div className="d-label"><span className="dot" />Task Type</div>
            <div className="vv">
              <span className="badge violet">Product UI</span>
              <span className="conf">conf · 0.92</span>
            </div>
          </div>
          <div className="ai-cell">
            <div className="d-label amber"><span className="dot" />Priority</div>
            <div className="vv">
              <span className="badge amber">P1 · HIGH</span>
              <span className="conf">conf · 0.87</span>
            </div>
          </div>
        </div>
        <div className="ai-block missing">
          <div className="d-label amber"><span className="dot" />Missing Context</div>
          <ul>
            <li>No success metric defined (activation? conversion?)</li>
            <li>Pricing tier copy not yet finalized by marketing</li>
            <li>Analytics access for the current funnel</li>
          </ul>
        </div>
        <div className="ai-block questions">
          <div className="d-label blue"><span className="dot" />Suggested Questions</div>
          <ol>
            <li>What's the target lift on tier-2 conversion?</li>
            <li>Are existing free users grandfathered in?</li>
            <li>Is the iOS / Android rollout simultaneous?</li>
          </ol>
        </div>
        <div className="ai-block direction">
          <div className="d-label"><span className="dot" />Initial Direction</div>
          <p>Augment the existing onboarding with a single tier-intro screen and a light upsell at activation, rather than forking the flow. Lower risk, faster ship.</p>
        </div>
      </>
    ),
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
    summary: 'I read the brief, judge priority, confirm strategy, spot risks, and decide the first action — the part that requires design judgment.',
    tags: ['Priority', 'Strategy', 'Risk', 'Next step'],
    pipeline: null as string[] | null,
    detail: (
      <div className="detail-section">
        <div className="d-label green"><span className="dot" />Assessment · DR-248</div>
        <div className="review-grid">
          <div className="rrow">
            <div className="rl">Priority</div>
            <div className="rv">P1 — ship before Jun 17 to unblock pricing launch.</div>
          </div>
          <div className="rrow">
            <div className="rl">Strategy</div>
            <div className="rv">Augment the existing onboarding rather than fork; smaller surface, faster ship.</div>
          </div>
          <div className="rrow">
            <div className="rl">Risks</div>
            <div className="rv">Pricing copy unfinalized; analytics access not yet granted; mixed cohort behaviour.</div>
          </div>
          <div className="rrow">
            <div className="rl">Next step</div>
            <div className="rv">30-min kickoff w/ PM; request analytics access; capture baseline funnel.</div>
          </div>
        </div>
        <div className="review-quote">
          <div className="ql">Operating Principle</div>
          <div className="qq">AI handles <span className="pivot">structure</span>. I handle <span className="pivot">judgment</span>.</div>
        </div>
      </div>
    ),
  },
  {
    id: 'intake',
    step: '02',
    variant: '',
    badge: null as string | null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M8 9h8M8 13h8M8 17h5" />
      </svg>
    ),
    title: 'Intake',
    summary: 'Make receives each request and normalizes it — source, project type, goal, timeline, priority, and contact all captured in structured fields.',
    tags: ['Make', 'Webhooks', 'Fields'],
    pipeline: null as string[] | null,
    detail: (
      <div className="detail-section">
        <div className="d-label"><span className="dot" />Request Form · DR-248</div>
        <div className="form-mini">
          <div className="field"><label>Source</label><div className="val"><span>LINE — @pm.celine</span></div></div>
          <div className="field"><label>Project Type</label><div className="val"><span>Product UI · Mobile</span></div></div>
          <div className="field"><label>Goal</label><div className="val"><span>Redesign onboarding for new pricing tier</span></div></div>
          <div className="field-row">
            <div className="field"><label>Timeline</label><div className="val"><span>Jun 03 — Jun 17</span></div></div>
            <div className="field"><label>Budget</label><div className="val"><span>Internal</span></div></div>
          </div>
          <div className="field"><label>Priority</label><div className="val"><span>P1 — Quarterly OKR</span><span className="priority-pill">HIGH</span></div></div>
          <div className="field"><label>Contact</label><div className="val"><span>celine.h@firm.co</span></div></div>
          <div className="form-status">
            <span>Form complete</span>
            <div className="bar">
              {Array.from({ length: 7 }).map((_, i) => <div key={i} className="pdot" />)}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'tracking',
    step: '04',
    variant: '',
    badge: null as string | null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="4.5" width="17" height="15" rx="1.8" /><path d="M3.5 9.5h17M9 4.5v15M14.5 4.5v15" />
      </svg>
    ),
    title: 'Tracking',
    summary: 'Every structured brief is written to Google Sheets with a stable record ID — a searchable, always-up-to-date intake log.',
    tags: ['Sheets', 'Record ID', 'History'],
    pipeline: null as string[] | null,
    detail: (
      <div className="detail-section">
        <div className="d-label"><span className="dot" />Sheets · Design Requests</div>
        <div className="sheet">
          <div className="sheet-tabs">
            <span className="tab active">Tracker</span>
            <span className="tab">Backlog</span>
            <span className="tab">Archive</span>
          </div>
          <table>
            <thead>
              <tr><th>ID</th><th>Src</th><th>Type</th><th>Pri</th><th>Status</th><th>Owner</th></tr>
            </thead>
            <tbody>
              <tr className="current">
                <td>DR-248</td><td>LINE</td><td>Product UI</td><td>P1</td><td><span className="st active">Active</span></td><td>TL</td>
              </tr>
              <tr>
                <td>DR-247</td><td>Form</td><td>Graphic</td><td>P2</td><td><span className="st review">Review</span></td><td>TL</td>
              </tr>
              <tr>
                <td>DR-246</td><td>Email</td><td>UX Review</td><td>P2</td><td><span className="st done">Done</span></td><td>TL</td>
              </tr>
              <tr>
                <td>DR-245</td><td>LINE</td><td>Research</td><td>P3</td><td><span className="st queue">Backlog</span></td><td>TL</td>
              </tr>
            </tbody>
          </table>
          <div className="sheet-foot">
            <span>4 of 142 records</span>
            <span>Updated · 2m ago</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'workflow',
    step: '06',
    variant: '',
    badge: null as string | null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h4l2-6 4 12 2-6h4" />
      </svg>
    ),
    title: 'Design Workflow',
    summary: 'The brief enters the design pipeline — already structured, prioritized, and contextualized.',
    tags: null as string[] | null,
    pipeline: ['Research', 'Structure', 'Design', 'Validate', 'Delivery'],
    detail: (
      <div className="detail-section">
        <div className="d-label blue"><span className="dot" />Phases · DR-248</div>
        <div className="phases">
          <div className="phase next">
            <div className="pn">01</div>
            <div>
              <div className="pt">Research</div>
              <div className="pd">Context, stakeholder interviews, baseline funnel data.</div>
            </div>
            <span className="ps">Up next</span>
          </div>
          <div className="phase">
            <div className="pn">02</div>
            <div>
              <div className="pt">Structure</div>
              <div className="pd">IA, primary flows, decision points.</div>
            </div>
            <span className="ps">Queued</span>
          </div>
          <div className="phase">
            <div className="pn">03</div>
            <div>
              <div className="pt">Design</div>
              <div className="pd">Wireframes → hi-fi mocks → polish.</div>
            </div>
            <span className="ps">Queued</span>
          </div>
          <div className="phase">
            <div className="pn">04</div>
            <div>
              <div className="pt">Validate</div>
              <div className="pd">Usability test, internal review, PM signoff.</div>
            </div>
            <span className="ps">Queued</span>
          </div>
          <div className="phase">
            <div className="pn">05</div>
            <div>
              <div className="pt">Delivery</div>
              <div className="pd">Specs, asset export, dev handoff.</div>
            </div>
            <span className="ps">Queued</span>
          </div>
        </div>
      </div>
    ),
  },
];

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
  const [expandedAiCard, setExpandedAiCard] = useState<string | null>(null);
  const aiFlowGridRef = useRef<HTMLDivElement>(null);

  // Toggle the bento "has-expanded" class imperatively (not via React's className prop) —
  // .ai-flow-grid is a .stagger-item whose .visible class is added by the scroll-reveal
  // effect outside React. If className were recomputed on state change, React's diff
  // would overwrite the attribute and strip .visible, hiding the whole grid.
  useEffect(() => {
    aiFlowGridRef.current?.classList.toggle('has-expanded', !!expandedAiCard);
  }, [expandedAiCard]);

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

    const handlers = new Map<HTMLElement, (e: PointerEvent) => void>();

    // Radar ring — inject into ALL process cards (inhouse + freelance)
    document.querySelectorAll<HTMLElement>('.process-card').forEach(card => {
      if (card.querySelector('.process-radar')) return;
      const radar = document.createElement('span');
      radar.className = 'process-radar';
      card.insertBefore(radar, card.firstChild);
    });

    // Freelance cards — full border-glow-card treatment
    document.querySelectorAll<HTMLElement>('.process-card').forEach(card => {
      if (card.querySelector('.edge-light')) return;

      const el = document.createElement('span');
      el.className = 'edge-light';
      card.insertBefore(el, card.firstChild);

      const inner = document.createElement('div');
      inner.className = 'border-glow-inner';
      Array.from(card.children)
        .filter(c => !c.classList.contains('edge-light') && !c.classList.contains('process-radar'))
        .forEach(c => inner.appendChild(c));
      card.appendChild(inner);

      card.classList.add('border-glow-card');
      card.style.setProperty('--card-bg', BG);
      setGlowVars(card, GLOW_COLOR, INTENSITY);
      setGradientVars(card, COLORS);

      const handler = (e: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--edge-proximity', (edgeProximity(card, x, y) * 100).toFixed(3));
        card.style.setProperty('--cursor-angle', `${cursorAngle(card, x, y).toFixed(3)}deg`);
      };

      card.addEventListener('pointermove', handler);
      handlers.set(card, handler);
    });

    // How I Use AI cards — outer edge-light glow only
    // (ai-card already uses ::before/::after for its own line/radar effects,
    // so we only add the cursor-following edge-light ring, not the full
    // border-glow-card treatment)
    document.querySelectorAll<HTMLElement>('.ai-card').forEach(card => {
      if (card.querySelector(':scope > .edge-light')) return;

      const el = document.createElement('span');
      el.className = 'edge-light';
      card.insertBefore(el, card.firstChild);

      card.classList.add('ai-card-glow');
      setGlowVars(card, GLOW_COLOR, INTENSITY);

      const handler = (e: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--edge-proximity', (edgeProximity(card, x, y) * 100).toFixed(3));
        card.style.setProperty('--cursor-angle', `${cursorAngle(card, x, y).toFixed(3)}deg`);
      };

      card.addEventListener('pointermove', handler);
      handlers.set(card, handler);
    });

    return () => {
      // Remove radar from ALL process cards (inhouse cards aren't in handlers)
      document.querySelectorAll<HTMLElement>('.process-card .process-radar').forEach(el => el.remove());
      // Remove listeners AND fully undo DOM changes so Strict Mode's second
      // invocation finds clean cards and can re-initialize with fresh listeners.
      handlers.forEach((handler, card) => {
        card.removeEventListener('pointermove', handler);
        card.classList.remove('border-glow-card', 'ai-card-glow');
        card.querySelector('.edge-light')?.remove();
        const inner = card.querySelector<HTMLElement>('.border-glow-inner');
        if (inner) {
          Array.from(inner.children).forEach(c => card.insertBefore(c, inner));
          inner.remove();
        }
      });
    };
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

  // In-house process cards: horizontal scroll independent of page scroll.
  // The row is a native horizontal scroll container (drag/trackpad/wheel);
  // vertical wheel input over the cards scrolls the row sideways instead of
  // scrolling the page, until the row reaches its start/end, at which point
  // the page takes over again.
  useEffect(() => {
    const wraps = Array.from(document.querySelectorAll<HTMLElement>('.process-scroll-wrap'));
    if (!wraps.length) return;

    const cleanups = wraps.map(wrap => {
      const onWheel = (e: WheelEvent) => {
        if (window.matchMedia('(max-width: 767px)').matches) return;
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (delta === 0) return;

        const { scrollLeft, scrollWidth, clientWidth } = wrap;
        const atStart = scrollLeft <= 0;
        const atEnd = scrollLeft + clientWidth >= scrollWidth - 1;
        if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return;

        e.preventDefault();
        wrap.scrollBy({ left: delta, behavior: 'auto' });
      };

      wrap.addEventListener('wheel', onWheel, { passive: false });
      return () => wrap.removeEventListener('wheel', onWheel);
    });

    return () => cleanups.forEach(fn => fn());
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
        <div className="process-dual">
          <div className="process-column">
            <div className="process-column-header stagger-item">
              <i className="ph-bold ph-buildings"></i>
              <span>{t.tab_inhouse}</span>
            </div>
            <div className="process-scroll-wrap">
              <div className="process-column-grid process-column-grid--inhouse">
                {(['Align','Research','Structure','Design','Validate','Iterate'] as const).map((slug, i) => {
                  const idx = String(i + 1).padStart(2, '0') as '01'|'02'|'03'|'04'|'05'|'06';
                  const nameKey = `ih_name_${idx}` as keyof typeof t;
                  const descKey = `ih_desc_${idx}` as keyof typeof t;
                  return (
                    <BorderGlow
                      key={slug}
                      className="process-card process-card--has-img"
                      backgroundColor="#13101c"
                      borderRadius={14}
                      colors={['#6C63FF', '#FF6584', '#38bdf8']}
                      glowColor="264 70 75"
                      edgeSensitivity={25}
                      glowRadius={24}
                      glowIntensity={1.1}
                      coneSpread={25}
                      fillOpacity={0.4}
                      spotlightColor="rgba(108, 99, 255, 0.12)"
                      backgroundSlot={
                        <div
                          className="process-card-bg-img"
                          style={{ backgroundImage: `url(./img/process/${slug}.png)` }}
                        />
                      }
                    >
                      <div className="process-num">{String(i + 1).padStart(2, '0')}</div>
                      <div className="process-name">{t[nameKey] as string}</div>
                      <div className="process-desc">{t[descKey] as string}</div>
                    </BorderGlow>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="process-column stagger-item">
            <div className="process-column-header">
              <i className="ph-bold ph-handshake"></i>
              <span>{t.tab_freelance}</span>
            </div>
            <div className="process-scroll-wrap">
            <div className="process-column-grid process-column-grid--inhouse">
              {(['Intake','AI Brief','Triage','Discovery','Proposal','Delivery'] as const).map((slug, i) => {
                const idx = String(i + 1).padStart(2, '0') as '01'|'02'|'03'|'04'|'05'|'06';
                const nameKey = `fl_name_${idx}` as keyof typeof t;
                const descKey = `fl_desc_${idx}` as keyof typeof t;
                return (
                  <BorderGlow
                    key={slug}
                    className="process-card process-card--has-img"
                    backgroundColor="#13101c"
                    borderRadius={14}
                    colors={['#6C63FF', '#FF6584', '#38bdf8']}
                    glowColor="264 70 75"
                    edgeSensitivity={25}
                    glowRadius={24}
                    glowIntensity={1.1}
                    coneSpread={25}
                    fillOpacity={0.4}
                    spotlightColor="rgba(108, 99, 255, 0.12)"
                    backgroundSlot={
                      <div
                        className="process-card-bg-img"
                        style={{ backgroundImage: `url("./img/process/${slug}.png")` }}
                      />
                    }
                  >
                    <div className="process-num">{idx}</div>
                    <div className="process-name">{t[nameKey] as string}</div>
                    <div className="process-desc">{t[descKey] as string}</div>
                  </BorderGlow>
                );
              })}
            </div>
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
            <span className="skill-pill"><img src="./img/others/Figma_logo.png" className="skill-icon-img" alt="Figma" />Figma</span>
            <span className="skill-pill"><img src="./img/others/Adobe_XD_logo.png" className="skill-icon-img" alt="Adobe XD" />Adobe XD</span>
            <span className="skill-pill"><img src="./img/others/Blender_logo.png" className="skill-icon-img" alt="Blender" />Blender</span>
            <span className="skill-pill"><img src="./img/others/Spline_logo.webp" className="skill-icon-img" alt="Spline" />Spline</span>
            <span className="skill-pill"><img src="./img/others/Lightroom_logo.png" className="skill-icon-img" alt="Lightroom" />Lightroom</span>
            <span className="skill-pill"><img src="./img/others/Krita_logo.png" className="skill-icon-img" alt="Krita" />Krita</span>
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

        <div className="ai-flow-grid stagger-item" ref={aiFlowGridRef}>
          <div className="ai-connectors" aria-hidden="true" dangerouslySetInnerHTML={{ __html: `
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
          ` }} />

          {AI_CARDS.map(card => {
            const isOpen = expandedAiCard === card.id;
            const toggle = () => setExpandedAiCard(isOpen ? null : card.id);
            return (
              <article
                key={card.id}
                className={`ai-card${card.variant ? ' ' + card.variant : ''}${isOpen ? ' is-open' : ''}`}
                onClick={toggle}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
              >
                <span className="ai-step-badge"><em>{card.step}</em></span>
                {card.badge && <span className="ai-focal-badge">{card.badge}</span>}
                <div className="ai-card-head">
                  <div className="ai-glyph">{card.icon}</div>
                  <h3>{card.title}</h3>
                  <span className="ai-card-toggle" aria-hidden="true" />
                </div>
                <p>{card.summary}</p>
                {card.tags && (
                  <div className="ai-tags">
                    {card.tags.map(tag => <span key={tag} className="ai-tag">{tag}</span>)}
                  </div>
                )}
                {card.pipeline && (
                  <div className="ai-pipeline">
                    {card.pipeline.map((step, i) => (
                      <Fragment key={step}>
                        {i > 0 && <span className="ai-psep">→</span>}
                        <span className="ai-pstep">{step}</span>
                      </Fragment>
                    ))}
                  </div>
                )}
                <div className="ai-card-detail">{card.detail}</div>
              </article>
            );
          })}
        </div>

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
