import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { useLang } from '../context/LangContext';
import { translations, type Lang } from '../i18n/translations';
import { DOMAIN_COVERS } from '../data/domainCovers';
import { INDICATOR_SPRING } from '../utils/tabIndicator';
import { trackPointerSpot } from '../utils/pointerSpot';

// apple.com's upgrader ("pick the Mac you have now") in My Skills' layout:
// the copy and the role tabs on the left, the picked role's proof on the
// right as My Skills' purple cards in two stepped columns (wide, tall | tall,
// wide), closed by a tile that hands over to Contact. Every card carries a
// small live scene modelled on a React Bits component (Counter, CardSwap,
// Service Domains' covers, TextType, Radar, Stepper, TrueFocus, OrbitImages,
// AnimatedList, DecryptedText, LogoLoop, Cubes, ShinyText), rebuilt in CSS
// plus two small tickers; icons come from the self-hosted subset.
type Txt = Record<Lang, string>;
export type ListMark = 'spec' | 'check' | 'line';
type Scene =
  | { kind: 'counter'; to: number; unit: string }
  | { kind: 'swap' }
  | { kind: 'domains' }
  | { kind: 'type'; tag: string; text: string }
  | { kind: 'radar' }
  | { kind: 'stepper'; steps: string[] }
  | { kind: 'focus'; words: Txt[] }
  | { kind: 'orbit'; people: string[] }
  | { kind: 'list'; mark: ListMark; rows: Txt[] }
  | { kind: 'decrypt'; lines: string[] }
  | { kind: 'loop'; items: { name: string; src: string }[] }
  | { kind: 'cubes' }
  | { kind: 'shiny'; title: Txt; rows: Txt[] };
export type FitCard = { name: string; icon: string; text: Txt; scene: Scene };
// cards 0 and 3 are wide (copy beside the scene), 1 and 2 tall (scene under)
export type FitRole = { id: string; label: string; line: Txt; cards: [FitCard, FitCard, FitCard, FitCard] };

// The "This site" card's stack, each with its logo (Simple Icons, as in
// Overview's web skills; the dark-brand ones in white, Spline from its own file)
const SI = 'https://cdn.simpleicons.org/';
export const LOOP_STACK = [
  { name: 'React', src: `${SI}react/61DAFB` },
  { name: 'GSAP', src: `${SI}gsap/0AE448` },
  { name: 'Vite', src: `${SI}vite/9135FF` },
  { name: 'WebGL', src: `${SI}webgl/ffffff` },
  { name: 'Spline', src: './img/others/Spline_logo.webp' },
  { name: 'Three.js', src: `${SI}threedotjs/ffffff` },
];

export const FIT_ROLES: FitRole[] = [
  {
    id: 'recruiter',
    label: 'Recruiter',
    line: { zh: '年資、專案量與產業經驗，一次看完。', en: 'Years, projects and industries at a glance.' },
    cards: [
      { name: 'Experience', icon: 'ph-clock', scene: { kind: 'counter', to: 5, unit: 'yr' }, text: { zh: 'UI/UX 設計與前端開發經驗', en: 'Across UI/UX design and frontend development' } },
      { name: 'Shipped', icon: 'ph-rocket-launch', scene: { kind: 'swap' }, text: { zh: '13 個以上上線專案，從後台系統到 3D 互動網頁', en: '13+ projects shipped, from admin systems to 3D interactive web' } },
      { name: 'Domains', icon: 'ph-squares-four', scene: { kind: 'domains' }, text: { zh: '從公部門到製造業，橫跨不同產業的專案', en: 'Projects across industries, from the public sector to manufacturing' } },
      { name: 'English', icon: 'ph-chat-circle-text', scene: { kind: 'type', tag: 'EN', text: 'Sure, I will write the spec in English and share it today.' }, text: { zh: '可用英文溝通、寫文件與跨團隊協作', en: 'Works, writes documentation and collaborates in English' } },
    ],
  },
  {
    id: 'pm',
    label: 'PM',
    line: { zh: '從現場研究到資訊架構，我怎麼把需求理清楚。', en: 'From field research to information architecture: how I untangle needs.' },
    cards: [
      { name: 'On site', icon: 'ph-map-pin', scene: { kind: 'radar' }, text: { zh: '到現場場勘，訪談第一線使用者', en: 'On site, observing and interviewing frontline users' } },
      { name: 'Process', icon: 'ph-flow-arrow', scene: { kind: 'stepper', steps: ['Interview', 'Log', 'IA', 'Hi-fi'] }, text: { zh: '從現場訪談到高保真稿，先理清楚再畫', en: 'From on-site interviews to hi-fi, untangled before any pixels' } },
      { name: 'Focus', icon: 'ph-cursor-click', scene: { kind: 'focus', words: [{ zh: '查詢', en: 'Search' }, { zh: '預約', en: 'Book' }, { zh: '分享', en: 'Share' }] }, text: { zh: '先拿掉不是核心的功能，每個畫面只留一個主要動作', en: 'Cuts what is not core; one main action per screen' } },
      { name: 'Team', icon: 'ph-users-three', scene: { kind: 'orbit', people: ['PM', 'FE', 'BE', 'UI'] }, text: { zh: '帶領過設計團隊，與 PM 和工程師一起協作', en: 'Has led design teams, working closely with PMs and engineers' } },
    ],
  },
  {
    id: 'engineer',
    label: 'Engineer',
    line: { zh: '規格、交付與前端實作，我能直接和你對齊。', en: 'Specs, handoff and frontend work, aligned with you directly.' },
    cards: [
      { name: 'Handoff', icon: 'ph-clipboard-text', scene: { kind: 'list', mark: 'spec', rows: ['16px', '#6C63FF', 'Auto layout', 'API'].map(x => ({ zh: x, en: x })) }, text: { zh: '定地圖與即時資料規格，交付前先對齊', en: 'Specs maps and live data, aligned before handoff' } },
      { name: 'Frontend', icon: 'ph-browsers', scene: { kind: 'decrypt', lines: ['const ui = <Card />;', 'display: grid;', 'gsap.to(card, { y: 0 });'] }, text: { zh: '能看懂並修改 HTML / CSS 與 React / Vue', en: 'Reads and edits HTML / CSS and React / Vue' } },
      { name: 'This site', icon: 'ph-sparkle', scene: { kind: 'loop', items: LOOP_STACK }, text: { zh: '你正在看的這個網站，是我親手做的', en: 'The site you are looking at is my own work' } },
      { name: '3D', icon: 'ph-cube', scene: { kind: 'cubes' }, text: { zh: 'Blender、Spline 建模，Three.js 與 GSAP 上線', en: 'Models in Blender and Spline, ships with Three.js and GSAP' } },
    ],
  },
  {
    id: 'client',
    label: 'Client',
    line: { zh: '從報價到交付，合作的每一步都說清楚。', en: 'From quote to delivery, every step made clear.' },
    cards: [
      { name: 'Quote', icon: 'ph-file-text', scene: { kind: 'shiny', title: { zh: '報價單', en: 'Quote' }, rows: [{ zh: '範圍', en: 'Scope' }, { zh: '時程', en: 'Timeline' }, { zh: '費用', en: 'Fee' }] }, text: { zh: '開工前先報價，範圍寫清楚', en: 'A written quote with a clear scope before work starts' } },
      { name: 'Process', icon: 'ph-flow-arrow', scene: { kind: 'stepper', steps: ['Discovery', 'Proposal', 'Wireframe', 'Design', 'Deliver'] }, text: { zh: '5 個階段，確認方向後才進入設計', en: 'Five stages; design starts once the direction is agreed' } },
      { name: 'Review', icon: 'ph-shield-check', scene: { kind: 'list', mark: 'check', rows: [{ zh: '範圍', en: 'Scope' }, { zh: '金流', en: 'Payments' }, { zh: '合規', en: 'Compliance' }] }, text: { zh: '高風險金流需求，報價前先做合規審查', en: 'High-risk payment work gets a compliance review before a quote' } },
      { name: 'Updates', icon: 'ph-chat-circle-text', scene: { kind: 'list', mark: 'line', rows: [{ zh: '設計稿已更新', en: 'Designs updated' }, { zh: '第一階段完成', en: 'Stage one done' }, { zh: '明天交付', en: 'Delivery tomorrow' }] }, text: { zh: 'LINE 或 Email，重大進度主動通知', en: 'LINE or email, with major progress reported proactively' } },
    ],
  },
];

// the shipped-works fan: three of the portfolio's covers
export const FIT_WORKS = ['./img/my_portfolio/CNC.webp', './img/my_portfolio/police.webp', './img/my_portfolio/coin.webp'];

// the two columns: left (set lower) wide then tall, right tall then wide
export const FIT_COLUMNS = [[0, 1], [2, 3]] as const;
// phones read the columns row by row: 0, 2, 1, 3
export const FIT_PHONE_ORDER = [0, 2, 1, 3];

export const findRole = (id: string) => FIT_ROLES.find(r => r.id === id) ?? FIT_ROLES[0];

// ← → (and Home/End) between the tabs, wrapping; -1 for any other key
export function nextRoleIndex(i: number, key: string, n = FIT_ROLES.length) {
  return key === 'ArrowRight' ? (i + 1) % n : key === 'ArrowLeft' ? (i - 1 + n) % n
    : key === 'Home' ? 0 : key === 'End' ? n - 1 : -1;
}

const k = (i: number) => ({ '--k': i } as CSSProperties);

// TextType: the text typed out, then held for `hold` ticks before it restarts
export function typedFrame(text: string, tick: number, hold = 30) {
  return text.slice(0, Math.min(tick % (text.length + hold), text.length));
}

const GLYPHS = '!<>-_/[]{}=+*^?#01';
// DecryptedText: line i resolves left to right over `span` ticks, starting
// `lag` ticks after the line above; what is not resolved yet is noise
export function decryptFrame(line: string, phase: number, i: number, rand: () => number = Math.random, span = 26, lag = 6) {
  const shown = Math.max(0, Math.min(line.length, Math.floor(((phase - i * lag) * line.length) / span)));
  const noise = [...line.slice(shown)].map(ch => (ch === ' ' ? ' ' : GLYPHS[Math.floor(rand() * GLYPHS.length)])).join('');
  return { done: line.slice(0, shown), noise };
}

export const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// a tick count while mounted; null under reduced motion (the scene then
// shows its finished state and nothing runs)
export function useTicker(ms: number, on = true) {
  const [tick, setTick] = useState<number | null>(() => (reducedMotion() ? null : 0));
  useEffect(() => {
    if (!on || reducedMotion()) return;
    const id = window.setInterval(() => setTick(t => (t ?? 0) + 1), ms);
    return () => window.clearInterval(id);
  }, [ms, on]);
  return tick;
}

function TypeScene({ tag, text, on }: { tag: string; text: string; on: boolean }) {
  const tick = useTicker(70, on);
  return (
    <span className="fit-type">
      <b className="fit-type-tag">{tag}</b>
      <span className="fit-type-bubble">{tick === null ? text : typedFrame(text, tick)}<i className="fit-caret" /></span>
    </span>
  );
}

function DecryptScene({ lines, on }: { lines: string[]; on: boolean }) {
  const tick = useTicker(70, on);
  return (
    <span className="fit-decrypt">
      <span className="fit-decrypt-bar"><i /><i /><i /></span>
      <code>
        {lines.map((l, i) => {
          const f = tick === null ? { done: l, noise: '' } : decryptFrame(l, tick % 70, i);
          return <span key={l}><b className="n">{i + 1}</b><b className="d">{f.done}</b><b className="x">{f.noise}</b></span>;
        })}
      </code>
    </span>
  );
}

const MARKS: Record<ListMark, (i: number) => string> = {
  spec: i => String(i + 1),
  check: () => '',
  line: () => 'L',
};

// on: the scene's role is the one shown (the tickers run only then, and a
// fresh key restarts them from the top each time it is picked)
function FitScene({ s, lang, on }: { s: Scene; lang: Lang; on: boolean }) {
  switch (s.kind) {
    case 'counter':
      return (
        <span className="fit-counter">
          <span className="fit-roll">
            <span style={{ '--roll': `${(-100 * s.to) / (s.to + 1)}%` } as CSSProperties}>
              {Array.from({ length: s.to + 1 }, (_, i) => <b key={i}>{i}</b>)}
            </span>
          </span>
          <em>+</em>
          <i className="fit-unit">{s.unit}</i>
        </span>
      );
    case 'swap':
      return <span className="fit-swap">{FIT_WORKS.map((src, i) => <img key={src} src={src} alt="" loading="lazy" decoding="async" style={k(i)} />)}</span>;
    case 'domains': {
      // the six Service Domains covers, each with its industry, lit in turn
      const labels = translations[lang].about_domain_labels.split('|');
      return (
        <span className="fit-domains">
          {DOMAIN_COVERS.map((d, i) => (
            <span key={d.label} className="fit-domain" style={{ ...k(i), '--label-bg': d.tone } as CSSProperties}>
              <img src={d.img} alt="" loading="lazy" decoding="async" />
              <i>{labels[i]}</i>
            </span>
          ))}
        </span>
      );
    }
    case 'type':
      return <TypeScene key={String(on)} tag={s.tag} text={s.text} on={on} />;
    case 'radar':
      return (
        <span className="fit-radar">
          <i className="fit-radar-ring" /><i className="fit-radar-ring fit-radar-ring--in" />
          <i className="fit-radar-sweep" />
          {[0, 1, 2].map(i => <i key={i} className="fit-radar-blip" style={k(i)} />)}
          <i className="fit-radar-pin ph-bold ph-map-pin" />
        </span>
      );
    case 'stepper':
      return (
        <ol className="fit-stepper">
          {s.steps.map((x, i) => <li key={x} style={k(i)}><b>{i + 1}</b><span>{x}</span></li>)}
        </ol>
      );
    case 'focus':
      return <span className="fit-truefocus">{s.words.map((w, i) => <b key={w.en} style={k(i)}>{w[lang]}</b>)}</span>;
    case 'orbit':
      return (
        <span className="fit-orbit">
          <b className="fit-orbit-core">Tim</b>
          <span className="fit-orbit-ring">{s.people.map((p, i) => <b key={p} style={k(i)}><span>{p}</span></b>)}</span>
        </span>
      );
    case 'list':
      return (
        <ul className={`fit-list fit-list--${s.mark}`}>
          {s.rows.map((r, i) => (
            <li key={r.en} style={k(i)}>
              <b>{s.mark === 'check' ? <i className="ph-bold ph-check" /> : MARKS[s.mark](i)}</b>
              <span>{r[lang]}</span>
            </li>
          ))}
        </ul>
      );
    case 'decrypt':
      return <DecryptScene key={String(on)} lines={s.lines} on={on} />;
    case 'loop':
      return (
        <span className="fit-loop">
          {[s.items, [...s.items].reverse()].map((row, r) => (
            <span key={r} className={`fit-loop-track${r ? ' fit-loop-track--back' : ''}`}>
              {[...row, ...row].map((x, i) => <b key={i}><img src={x.src} alt="" width={16} height={16} loading="lazy" decoding="async" />{x.name}</b>)}
            </span>
          ))}
        </span>
      );
    case 'cubes':
      return <span className="fit-cubes">{Array.from({ length: 16 }, (_, i) => <i key={i} style={k((i >> 2) + (i & 3))} />)}</span>;
    case 'shiny':
      return (
        <span className="fit-shiny">
          <b className="fit-shiny-title">{s.title[lang]}</b>
          {s.rows.map((r, i) => <span key={r.en} style={k(i)}>{r[lang]}<i className="ph-bold ph-check" /></span>)}
        </span>
      );
  }
}

function Card({ card, index, lang, on }: { card: FitCard; index: number; lang: Lang; on: boolean }) {
  const wide = index === 0 || index === 3;
  return (
    <article
      className={`skill-card skill-card--${wide ? 'wide' : 'tall'} fit-card fit-card--${card.scene.kind}`}
      style={{ '--i': index, '--order': FIT_PHONE_ORDER.indexOf(index) } as CSSProperties}
      onPointerMove={trackPointerSpot}
    >
      <span className="fit-spot" aria-hidden="true" />
      <div className="skill-card-text">
        <span className="skill-card-logo fit-logo" aria-hidden="true"><i className={`ph-bold ${card.icon}`} /></span>
        <h3 className="skill-card-name">{card.name}</h3>
        <p className="skill-card-desc">{card.text[lang]}</p>
      </div>
      <div className="skill-card-art fit-art" aria-hidden="true"><FitScene s={card.scene} lang={lang} on={on} /></div>
    </article>
  );
}

export default function RoleFit() {
  const { t, lang } = useLang();
  const [roleId, setRoleId] = useState(FIT_ROLES[0].id);
  const role = findRole(roleId);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const next = nextRoleIndex(FIT_ROLES.findIndex(r => r.id === role.id), e.key);
    if (next < 0) return;
    e.preventDefault();
    setRoleId(FIT_ROLES[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="for-you" className="section role-fit">
      <div className="skills-showcase fit-showcase">
        <div className="skills-intro">
          <div className="section-label rise-soft">For You</div>
          <h2 className="about-h2 skills-h2 rise-soft">The proof, <span className="gradient-text">for your role</span></h2>
          <p className="tech-sub skills-head-sub rise-soft">{t.fit_sub}</p>
          <div className="skills-chooser">
            <div className="process-tabs faq-tabs skills-tabs fit-tabs rise-soft" role="tablist" aria-label="For You" onKeyDown={onTabKey}>
              {FIT_ROLES.map((r, i) => (
                <button
                  key={r.id}
                  ref={el => { tabRefs.current[i] = el; }}
                  type="button"
                  role="tab"
                  id={`fit-tab-${r.id}`}
                  aria-controls={`fit-panel-${r.id}`}
                  aria-selected={r.id === role.id}
                  tabIndex={r.id === role.id ? 0 : -1}
                  className={`faq-tab skills-tab${r.id === role.id ? ' active' : ''}`}
                  onClick={() => setRoleId(r.id)}
                >
                  {r.id === role.id && (
                    <motion.span layoutId="fit-tab-indicator" className="faq-tab-indicator" transition={INDICATOR_SPRING} aria-hidden="true" />
                  )}
                  <span className="faq-tab-label">{r.label}</span>
                </button>
              ))}
            </div>
            <div className="skills-sub rise-soft" aria-live="polite">
              {FIT_ROLES.map(r => (
                <p key={r.id} className={`skills-sub-line${r.id === role.id ? ' is-active' : ''}`} aria-hidden={r.id !== role.id}>{r.line[lang]}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="skills-tools rise-card">
          {/* every role's cards in one cell (My Skills' .skills-panels): the
              area is as tall as the tallest role, so the tabs centred on it
              hold still; a pick turns is-active on, replaying the entrance */}
          <div className="skills-panels fit-panels">
            {FIT_ROLES.map(r => {
              const on = r.id === role.id;
              return (
                <div
                  key={r.id}
                  id={`fit-panel-${r.id}`}
                  role="tabpanel"
                  aria-labelledby={`fit-tab-${r.id}`}
                  aria-hidden={!on}
                  inert={!on}
                  className={`skills-panel skills-cards fit-cards${on ? ' is-active' : ''}`}
                >
                  {FIT_COLUMNS.map((col, c) => (
                    <div key={c} className={`skills-col skills-col--${c === 0 ? 'low' : 'high'}`}>
                      {col.map(i => <Card key={i} card={r.cards[i]} index={i} lang={lang} on={on} />)}
                      {c === 1 && (
                        <a className="skills-tag-tile fit-next" href="#contact" style={{ '--i': 4, '--order': 4 } as CSSProperties}>
                          <span className="skills-tag-tile-label">Next step</span>
                          <span className="fit-next-row">
                            <span className="fit-next-text">{t.fit_next}</span>
                            <span className="fit-next-btn">{t.fit_next_cta}<i className="ph-bold ph-arrow-right" aria-hidden="true" /></span>
                          </span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
