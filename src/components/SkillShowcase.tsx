import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { useLang } from '../context/LangContext';
import { INDICATOR_SPRING } from '../utils/tabIndicator';

// My Skills: a static showcase (it was two RAF marquees of pills). The copy
// on the left holds the tabs; the line under them and the cards on the
// right follow the open tab. Each tab's
// cards sit in two columns, the left one lower so the cards step like a
// staggered wall. The cards' art is drawn inline (SVG): a small picture of
// what each tool is for.

type ToolId = 'figma' | 'xd' | 'dora' | 'photoshop' | 'illustrator' | 'lightroom' | 'krita' | 'blender' | 'spline';

export type SkillTool = {
  id: ToolId;
  name: string;
  logo: string;
  descKey: `skills_${ToolId}`;
  shape: 'wide' | 'tall';
};

export type SkillTag = { label: string; icon: string };

export type SkillTab = {
  id: 'uiux' | 'visual' | '3d';
  label: string;
  // what the work in this tab covers (icons must be in the homepage's
  // Phosphor subset, src/styles/icon-faces.css)
  tags: SkillTag[];
  // [left column (lower)], [right column (higher)]
  columns: SkillTool[][];
};

const tool = (id: ToolId, name: string, logo: string, shape: SkillTool['shape']): SkillTool =>
  ({ id, name, logo: `./img/others/${logo}`, descKey: `skills_${id}`, shape });

export const SKILL_TABS: SkillTab[] = [
  {
    id: 'uiux',
    label: 'UI/UX',
    tags: [
      { label: 'UX Research', icon: 'ph-magnifying-glass' },
      { label: 'User Flow', icon: 'ph-flow-arrow' },
      { label: 'Wireframing', icon: 'ph-frame-corners' },
      { label: 'Prototyping', icon: 'ph-cursor-click' },
      { label: 'Design System', icon: 'ph-squares-four' },
      { label: 'Accessibility', icon: 'ph-wheelchair' },
      { label: 'Dev Handoff', icon: 'ph-git-branch' },
    ],
    columns: [
      [tool('figma', 'Figma', 'Figma_logo.png', 'wide'), tool('xd', 'Adobe XD', 'Adobe_XD_logo.png', 'tall')],
      [tool('dora', 'Dora', 'Dora_logo.png', 'tall')],
    ],
  },
  {
    id: 'visual',
    label: 'Visual',
    tags: [
      { label: 'Retouching', icon: 'ph-sparkle' },
      { label: 'Color Grading', icon: 'ph-palette' },
      { label: 'Illustration', icon: 'ph-note-pencil' },
      { label: 'Icon Design', icon: 'ph-diamond' },
      { label: 'Brand Graphics', icon: 'ph-star' },
      { label: 'Marketing Visuals', icon: 'ph-rocket-launch' },
    ],
    columns: [
      [tool('lightroom', 'Lightroom', 'Lightroom_logo.png', 'wide'), tool('illustrator', 'Illustrator', 'Illustrator_logo.png', 'tall')],
      [tool('photoshop', 'Photoshop', 'Photoshop_logo.png', 'tall'), tool('krita', 'Krita', 'Krita_logo.webp', 'wide')],
    ],
  },
  {
    id: '3d',
    label: '3D',
    tags: [
      { label: 'Modeling', icon: 'ph-cube' },
      { label: 'Materials', icon: 'ph-palette' },
      { label: 'Lighting', icon: 'ph-sparkle' },
      { label: 'Rendering', icon: 'ph-film-strip' },
      { label: 'Web 3D', icon: 'ph-browsers' },
      { label: 'Interaction', icon: 'ph-cursor-click' },
    ],
    columns: [
      [tool('blender', 'Blender', 'Blender_logo.png', 'tall')],
      [tool('spline', 'Spline', 'Spline_logo.webp', 'tall')],
    ],
  },
];

// phones show one column: the tab's cards in reading order, row by row
export function phoneOrder(columns: SkillTool[][]): ToolId[] {
  const out: ToolId[] = [];
  const rows = Math.max(...columns.map(c => c.length));
  for (let r = 0; r < rows; r++) for (const c of columns) if (c[r]) out.push(c[r].id);
  return out;
}

function ToolArt({ id }: { id: ToolId }) {
  switch (id) {
    case 'figma': // frames on a canvas, a collaborator's cursor
      return (
        <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
          <rect width="200" height="120" fill="#f3f1ff" />
          <rect x="18" y="18" width="72" height="84" rx="6" fill="#fff" stroke="#d9d4ff" />
          <rect x="26" y="28" width="56" height="26" rx="4" fill="#a259ff" opacity=".85" />
          <rect x="26" y="60" width="40" height="6" rx="3" fill="#1e1e2e" opacity=".75" />
          <rect x="26" y="72" width="52" height="5" rx="2.5" fill="#1e1e2e" opacity=".25" />
          <rect x="26" y="84" width="28" height="10" rx="5" fill="#0acf83" />
          <rect x="102" y="18" width="80" height="40" rx="6" fill="#fff" stroke="#0d99ff" strokeWidth="1.5" />
          <circle cx="118" cy="38" r="9" fill="#ff7262" />
          <rect x="133" y="31" width="38" height="5" rx="2.5" fill="#1e1e2e" opacity=".7" />
          <rect x="133" y="41" width="26" height="4" rx="2" fill="#1e1e2e" opacity=".25" />
          <rect x="102" y="66" width="80" height="36" rx="6" fill="#fff" stroke="#d9d4ff" />
          <rect x="110" y="76" width="18" height="18" rx="4" fill="#1abcfe" />
          <rect x="134" y="76" width="18" height="18" rx="4" fill="#f24e1e" />
          <rect x="158" y="76" width="18" height="18" rx="4" fill="#ffc700" />
          <path d="M146 50 l0 18 5-5 4 9 4-2-4-9 7 0z" fill="#0d99ff" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="157" y="69" width="22" height="11" rx="3" fill="#0d99ff" />
          <text x="168" y="77.5" fontSize="7" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="sans-serif">Tim</text>
        </svg>
      );
    case 'xd': // artboards wired into a prototype flow
      return (
        <svg viewBox="0 0 200 160" preserveAspectRatio="xMidYMid slice">
          <rect width="200" height="160" fill="#fbefff" />
          {[[20, 30], [80, 62], [140, 30]].map(([x, y]) => (
            <g key={x}>
              <rect x={x} y={y} width="44" height="78" rx="7" fill="#fff" stroke="#f3c2ff" />
              <rect x={x + 6} y={y + 8} width="32" height="18" rx="3" fill="#ff61f6" opacity=".7" />
              <rect x={x + 6} y={y + 32} width="26" height="4" rx="2" fill="#470137" opacity=".6" />
              <rect x={x + 6} y={y + 40} width="20" height="4" rx="2" fill="#470137" opacity=".25" />
              <rect x={x + 6} y={y + 62} width="32" height="9" rx="4.5" fill="#470137" />
            </g>
          ))}
          <path d="M58 101 C 70 112, 70 120, 80 118" fill="none" stroke="#2680eb" strokeWidth="1.6" />
          <circle cx="58" cy="101" r="3" fill="#2680eb" />
          <path d="M118 134 C 136 140, 150 130, 152 108" fill="none" stroke="#2680eb" strokeWidth="1.6" />
          <circle cx="118" cy="134" r="3" fill="#2680eb" />
          <path d="M148 112 l4 -6 4 6z" fill="#2680eb" />
        </svg>
      );
    case 'dora': // a site hero with a 3D shape and scroll cue
      return (
        <svg viewBox="0 0 200 160" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="skills-dora-orb" cx=".35" cy=".3" r=".8">
              <stop offset="0" stopColor="#c6f6ff" />
              <stop offset=".5" stopColor="#7c6cff" />
              <stop offset="1" stopColor="#2b1d6e" />
            </radialGradient>
          </defs>
          <rect width="200" height="160" fill="#0f0d1d" />
          <rect x="12" y="18" width="176" height="14" rx="4" fill="#fff" opacity=".08" />
          <circle cx="22" cy="25" r="2.5" fill="#ff6584" />
          <circle cx="30" cy="25" r="2.5" fill="#ffc700" />
          <circle cx="38" cy="25" r="2.5" fill="#0acf83" />
          <rect x="22" y="48" width="70" height="9" rx="4" fill="#fff" />
          <rect x="22" y="62" width="54" height="9" rx="4" fill="#fff" opacity=".85" />
          <rect x="22" y="80" width="62" height="5" rx="2.5" fill="#fff" opacity=".3" />
          <rect x="22" y="98" width="40" height="14" rx="7" fill="#7c6cff" />
          <circle cx="142" cy="82" r="36" fill="url(#skills-dora-orb)" />
          <ellipse cx="142" cy="82" rx="50" ry="12" fill="none" stroke="#c6f6ff" strokeWidth="1.2" opacity=".6" transform="rotate(-18 142 82)" />
          <rect x="96" y="124" width="8" height="14" rx="4" fill="none" stroke="#fff" strokeWidth="1.2" opacity=".5" />
          <circle cx="100" cy="129" r="1.5" fill="#fff" opacity=".7" />
        </svg>
      );
    case 'photoshop': // a photo being cut out: marquee, layers
      return (
        <svg viewBox="0 0 200 160" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="skills-ps-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffb38a" />
              <stop offset="1" stopColor="#ff6f91" />
            </linearGradient>
          </defs>
          <rect width="200" height="160" fill="url(#skills-ps-sky)" />
          <circle cx="132" cy="58" r="20" fill="#ffe29a" />
          <path d="M0 120 L46 72 L78 104 L112 64 L160 112 L200 84 L200 160 L0 160z" fill="#5b3fa8" />
          <path d="M0 136 L60 100 L104 130 L150 104 L200 128 L200 160 L0 160z" fill="#2e2366" />
          <rect x="96" y="30" width="72" height="62" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="5 4" />
          <rect x="10" y="18" width="54" height="48" rx="6" fill="#001e36" opacity=".88" />
          <rect x="16" y="25" width="42" height="9" rx="2" fill="#31a8ff" />
          <rect x="16" y="38" width="42" height="9" rx="2" fill="#fff" opacity=".22" />
          <rect x="16" y="51" width="42" height="9" rx="2" fill="#fff" opacity=".22" />
        </svg>
      );
    case 'illustrator': // a vector path being drawn: anchors and handles
      return (
        <svg viewBox="0 0 200 160" preserveAspectRatio="xMidYMid slice">
          <rect width="200" height="160" fill="#fff6e8" />
          <path d="M28 120 C 50 30, 110 30, 108 82 S 168 132, 176 46" fill="none" stroke="#ff9a00" strokeWidth="9" strokeLinecap="round" />
          <path d="M28 120 C 50 30, 110 30, 108 82 S 168 132, 176 46" fill="none" stroke="#330000" strokeWidth="1" />
          <circle cx="120" cy="118" r="26" fill="#ff6f61" opacity=".85" />
          <path d="M36 140 l20-30 20 30z" fill="#7b61ff" opacity=".85" />
          <line x1="108" y1="82" x2="84" y2="58" stroke="#0d99ff" strokeWidth="1" />
          <line x1="108" y1="82" x2="132" y2="106" stroke="#0d99ff" strokeWidth="1" />
          <circle cx="84" cy="58" r="3.5" fill="#fff" stroke="#0d99ff" strokeWidth="1.2" />
          <circle cx="132" cy="106" r="3.5" fill="#fff" stroke="#0d99ff" strokeWidth="1.2" />
          {[[28, 120], [108, 82], [176, 46]].map(([x, y]) => (
            <rect key={x} x={x - 4} y={y - 4} width="8" height="8" fill={x === 108 ? '#0d99ff' : '#fff'} stroke="#0d99ff" strokeWidth="1.2" />
          ))}
          <path d="M150 20 l10 26 -6 4 -4 -10 -8 6z" fill="#330000" />
        </svg>
      );
    case 'lightroom': // a photo next to its tone sliders
      return (
        <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="skills-lr-photo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2a6f97" />
              <stop offset="1" stopColor="#f4a261" />
            </linearGradient>
          </defs>
          <rect width="200" height="120" fill="#0f1a24" />
          <rect x="12" y="14" width="104" height="92" rx="6" fill="url(#skills-lr-photo)" />
          <path d="M12 86 L44 60 L66 78 L92 54 L116 76 L116 100 Q116 106 110 106 L18 106 Q12 106 12 100z" fill="#123047" />
          <circle cx="90" cy="34" r="9" fill="#ffe8b0" />
          {[['#31a8ff', 0.62], ['#f4a261', 0.4], ['#e76f51', 0.74], ['#fff', 0.5]].map(([c, v], i) => (
            <g key={i}>
              <rect x="130" y={22 + i * 22} width="58" height="3" rx="1.5" fill="#fff" opacity=".18" />
              <rect x="130" y={22 + i * 22} width={58 * (v as number)} height="3" rx="1.5" fill={c as string} />
              <circle cx={130 + 58 * (v as number)} cy={23.5 + i * 22} r="4.5" fill="#fff" />
            </g>
          ))}
        </svg>
      );
    case 'krita': // brush strokes on a canvas, a colour wheel
      return (
        <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
          <rect width="200" height="120" fill="#fdf8f2" />
          <path d="M14 92 C 40 40, 70 108, 104 58 S 150 30, 128 92" fill="none" stroke="#7b5cff" strokeWidth="12" strokeLinecap="round" opacity=".8" />
          <path d="M22 40 C 50 20, 80 46, 112 26" fill="none" stroke="#ff6584" strokeWidth="7" strokeLinecap="round" opacity=".8" />
          <path d="M60 104 C 84 90, 110 110, 140 98" fill="none" stroke="#33c3a5" strokeWidth="5" strokeLinecap="round" />
          <g transform="translate(166 44)">
            {['#ff6584', '#ffc700', '#33c3a5', '#31a8ff', '#7b5cff', '#ff9a00'].map((c, i) => (
              <path key={c} d="M0 0 L22 0 A22 22 0 0 1 11 19.05z" fill={c} transform={`rotate(${i * 60})`} />
            ))}
            <circle r="8" fill="#fdf8f2" />
          </g>
          <path d="M150 104 l26 -26 6 6 -26 26 -9 3z" fill="#3a2f55" />
        </svg>
      );
    case 'blender': // a lit cube on a grid
      return (
        <svg viewBox="0 0 200 160" preserveAspectRatio="xMidYMid slice">
          <rect width="200" height="160" fill="#24232b" />
          <g stroke="#3d3b47" strokeWidth="1">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <line key={`h${i}`} x1="0" y1={96 + i * 9} x2="200" y2={96 + i * 9} />)}
            {[-3, -2, -1, 0, 1, 2, 3].map(i => <line key={`v${i}`} x1={100 + i * 22} y1="96" x2={100 + i * 70} y2="165" />)}
          </g>
          <line x1="0" y1="124" x2="200" y2="124" stroke="#ff3352" strokeWidth="1" opacity=".7" />
          <path d="M100 36 L140 56 L100 76 L60 56z" fill="#f5a35c" />
          <path d="M60 56 L100 76 L100 120 L60 100z" fill="#c76b2a" />
          <path d="M140 56 L100 76 L100 120 L140 100z" fill="#e5853c" />
          <path d="M100 36 L140 56 L140 100 L100 120 L60 100 L60 56z" fill="none" stroke="#ffb46b" strokeWidth="1.2" />
          <circle cx="160" cy="30" r="6" fill="none" stroke="#ffd166" strokeWidth="1.5" />
          <path d="M160 18v-4M160 46v-4M148 30h-4M176 30h-4" stroke="#ffd166" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'spline': // a soft 3D shape with its move gizmo
      return (
        <svg viewBox="0 0 200 160" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="skills-spline-ball" cx=".38" cy=".32" r=".75">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset=".45" stopColor="#ff9ad5" />
              <stop offset="1" stopColor="#6c63ff" />
            </radialGradient>
          </defs>
          <rect width="200" height="160" fill="#eceaf6" />
          <ellipse cx="100" cy="128" rx="46" ry="8" fill="#6c63ff" opacity=".18" />
          <circle cx="100" cy="76" r="44" fill="url(#skills-spline-ball)" />
          <line x1="100" y1="76" x2="100" y2="26" stroke="#0acf83" strokeWidth="2" />
          <path d="M96 30 l4 -8 4 8z" fill="#0acf83" />
          <line x1="100" y1="76" x2="150" y2="76" stroke="#ff3352" strokeWidth="2" />
          <path d="M146 72 l8 4 -8 4z" fill="#ff3352" />
          <line x1="100" y1="76" x2="70" y2="104" stroke="#31a8ff" strokeWidth="2" />
          <path d="M70 98 l-5 11 11 -4z" fill="#31a8ff" />
          <circle cx="100" cy="76" r="4" fill="#fff" stroke="#1e1e2e" strokeWidth="1.2" />
        </svg>
      );
  }
}

function ToolCard({ tool, index, order }: { tool: SkillTool; index: number; order: number }) {
  const { t } = useLang();
  return (
    <article
      className={`skill-card skill-card--${tool.shape}`}
      data-tool={tool.id}
      style={{ '--i': index, '--order': order } as CSSProperties}
    >
      <div className="skill-card-text">
        <span className="skill-card-logo"><img src={tool.logo} alt="" loading="lazy" /></span>
        <h3 className="skill-card-name">{tool.name}</h3>
        <p className="skill-card-desc">{t[tool.descKey]}</p>
      </div>
      <div className="skill-card-art" aria-hidden="true"><ToolArt id={tool.id} /></div>
    </article>
  );
}

export default function SkillShowcase() {
  const { t } = useLang();
  const [active, setActive] = useState<SkillTab['id']>(SKILL_TABS[0].id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // ← → (and Home/End) move between tabs, as a tablist should
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = SKILL_TABS.findIndex(tb => tb.id === active);
    const next = e.key === 'ArrowRight' ? (i + 1) % SKILL_TABS.length
      : e.key === 'ArrowLeft' ? (i - 1 + SKILL_TABS.length) % SKILL_TABS.length
        : e.key === 'Home' ? 0 : e.key === 'End' ? SKILL_TABS.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(SKILL_TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="skills-showcase">
      <div className="skills-intro">
        <div className="section-label rise-soft">My Skills</div>
        <h2 className="about-h2 skills-h2 rise-soft">Tools behind <span className="gradient-text">the work</span></h2>
        <p className="tech-sub skills-head-sub rise-soft" dangerouslySetInnerHTML={{ __html: t.skills_head_sub }} />
        {/* the tabs and their line as one block (desktop centres it on the
            cards); each tab's tags are a tile among its cards */}
        <div className="skills-chooser">
        {/* the FAQ's pill tabs, the indicator sliding between them */}
        <div className="process-tabs faq-tabs skills-tabs rise-soft" role="tablist" aria-label="Tools" onKeyDown={onTabKey}>
          {SKILL_TABS.map((tb, i) => (
            <button
              key={tb.id}
              ref={el => { tabRefs.current[i] = el; }}
              type="button"
              role="tab"
              id={`skills-tab-${tb.id}`}
              aria-controls={`skills-panel-${tb.id}`}
              aria-selected={tb.id === active}
              tabIndex={tb.id === active ? 0 : -1}
              className={`faq-tab skills-tab${tb.id === active ? ' active' : ''}`}
              onClick={() => setActive(tb.id)}
            >
              {tb.id === active && (
                <motion.span layoutId="skills-tab-indicator" className="faq-tab-indicator" transition={INDICATOR_SPRING} aria-hidden="true" />
              )}
              <span className="faq-tab-label">{tb.label}</span>
            </button>
          ))}
        </div>
        {/* the line for each tab, all in one cell (no height jump) */}
        <div className="skills-sub rise-soft" aria-live="polite">
          {SKILL_TABS.map(tb => (
            <p key={tb.id} className={`skills-sub-line${tb.id === active ? ' is-active' : ''}`} aria-hidden={tb.id !== active}>
              {t[`skills_tab_${tb.id}`]}
            </p>
          ))}
        </div>
        </div>
      </div>
      <div className="skills-tools rise-card">
        {/* every panel stays in the one grid cell, so the area is as tall
            as the tallest tab and switching never shifts the page */}
        <div className="skills-panels">
          {SKILL_TABS.map(tb => {
            const order = phoneOrder(tb.columns);
            const on = tb.id === active;
            let n = 0;
            return (
              <div
                key={tb.id}
                id={`skills-panel-${tb.id}`}
                role="tabpanel"
                aria-labelledby={`skills-tab-${tb.id}`}
                className={`skills-panel${on ? ' is-active' : ''}`}
                inert={!on}
              >
                <div className={`skills-cards${on ? ' is-active' : ''}`}>
                  {tb.columns.map((col, i) => (
                    <div key={i} className={`skills-col skills-col--${i === 0 ? 'low' : 'high'}`}>
                      {col.map(tl => <ToolCard key={tl.id} tool={tl} index={n++} order={order.indexOf(tl.id)} />)}
                      {/* what the tab covers: a tile closing the
                          right column (the cards' bottom-right) */}
                      {i === tb.columns.length - 1 && (
                        <div className="skills-tag-tile" style={{ '--i': n } as CSSProperties}>
                          <span className="skills-tag-tile-label">Covers</span>
                          {/* a marquee: the list, then an unread copy so the
                              loop never shows a gap */}
                          <div className="skills-tag-marquee" style={{ '--n': tb.tags.length } as CSSProperties}>
                            <div className="skills-tag-track">
                              {[0, 1].map(copy => (
                                <ul
                                  key={copy}
                                  className={`skills-tag-list${on && copy === 0 ? ' is-active' : ''}${copy ? ' skills-tag-list--copy' : ''}`}
                                  aria-label={copy ? undefined : `${tb.label} skills`}
                                  aria-hidden={copy ? true : undefined}
                                >
                                  {tb.tags.map((s, k) => (
                                    <li key={s.label} className="skill-pill" style={{ '--i': k } as CSSProperties}>
                                      <i className={`ph-bold ${s.icon}`} aria-hidden="true" />{s.label}
                                    </li>
                                  ))}
                                </ul>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
