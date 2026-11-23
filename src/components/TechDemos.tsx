import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { useLang } from '../context/LangContext';
import './TechDemos.css';

// Tech Stack illustrations, composed like How I Use AI: one large card (the
// code window below) with satellite cards overlapping its corners.
//   HTML / CSS  — a design comp and its markup, the same block lit in both
//   JavaScript  — the scroll-reveal code, with the card it animates
//   React / Vue — a component's classes beside the layout they produce
// Everything inside scales off the window's width (cqw), so one drawing
// serves every breakpoint.

export type TechKey = 'html' | 'js' | 'react';

function DemoWindow({ k, file, children }: { k: TechKey; file: string; children: ReactNode }) {
  return (
    <div className={`tech-code-preview td tk tk-${k}`} aria-hidden="true">
      <div className="tcp-bar">
        <span className="tcp-dot" /><span className="tcp-dot" /><span className="tcp-dot" />
        <span className="tcp-filename">{file}</span>
      </div>
      <div className={`td-body td-body--${k}`}>{children}</div>
    </div>
  );
}

export function HtmlDemo() {
  const { t } = useLang();
  return (
    <DemoWindow k="html" file="index.html">
      <svg className="td-art" viewBox="0 0 226 302">
        <circle cx="20" cy="23" r="6" fill="var(--a)" />
        <rect x="32" y="20" width="42" height="6" rx="3" fill="var(--mute)" />
        <rect x="168" y="21" width="20" height="5" rx="2.5" fill="var(--dim)" />
        <rect x="194" y="21" width="20" height="5" rx="2.5" fill="var(--dim)" />
        <rect x="12" y="40" width="202" height="96" rx="10" fill="none" stroke="var(--a2)" strokeWidth="1.5" />
        <rect x="15" y="43" width="196" height="90" rx="8" fill="var(--a3)" />
        <rect x="27" y="57" width="118" height="11" rx="5" fill="var(--soft)" />
        <rect x="27" y="77" width="150" height="6" rx="3" fill="var(--a2)" />
        <rect x="27" y="88" width="104" height="6" rx="3" fill="var(--a2)" />
        <rect x="27" y="103" width="54" height="13" rx="6.5" fill="var(--soft)" />
        <rect x="12" y="146" width="62" height="60" rx="7" fill="var(--a)" opacity=".55" />
        <rect x="82" y="146" width="62" height="60" rx="7" fill="var(--a2)" opacity=".75" />
        <rect x="152" y="146" width="62" height="60" rx="7" fill="var(--a)" opacity=".55" />
      </svg>
      <div className="td-code">
        <div>&lt;<u>header</u>&gt;…&lt;/<u>header</u>&gt;</div>
        <div>&lt;<u>main</u>&gt;</div>
        <div className="on">{'  '}&lt;<u>section</u> <em>class</em>=&quot;hero&quot;&gt;</div>
        <div className="on">{'    '}&lt;<u>h1</u>&gt;{t.td_html_h1}&lt;/<u>h1</u>&gt;</div>
        <div className="on">{'    '}&lt;<u>p</u>&gt;{t.td_html_p}&lt;/<u>p</u>&gt;</div>
        <div className="on">{'  '}&lt;/<u>section</u>&gt;</div>
        <div>{'  '}&lt;<u>ul</u>&gt;…&lt;/<u>ul</u>&gt;</div>
        <div>&lt;/<u>main</u>&gt;</div>
      </div>
    </DemoWindow>
  );
}

export function JsDemo() {
  return (
    <DemoWindow k="js" file="reveal.js">
      <div className="td-code">
        <div><u>const</u> cards = <u>await</u> <em>fetchProjects</em>();</div>
        <div>{' '}</div>
        <div><u>const</u> io = <u>new</u> <em>IntersectionObserver</em>(([e]) =&gt; {'{'}</div>
        <div className="on">{'  '}<u>if</u> (!e.isIntersecting) <u>return</u>;</div>
        <div className="on">{'  '}gsap.<em>to</em>(e.target, {'{'} y: 0, opacity: 1 {'}'});</div>
        <div className="on">{'  '}io.<em>unobserve</em>(e.target);</div>
        <div>{'});'}</div>
        <div>{' '}</div>
        <div>cards.<em>forEach</em>(c =&gt; io.<em>observe</em>(c));</div>
      </div>
      <svg className="td-js-card" viewBox="0 0 118 112">
        <rect x="10" y="30" width="76" height="52" rx="10" fill="var(--a)" opacity=".28" transform="rotate(-8 48 56)" />
        <rect x="26" y="16" width="86" height="60" rx="11" fill="var(--a3)" stroke="var(--a2)" />
        <circle cx="44" cy="35" r="8" fill="var(--a2)" />
        <rect x="58" y="30" width="42" height="6" rx="3" fill="var(--soft)" />
        <rect x="38" y="54" width="42" height="12" rx="6" fill="var(--soft)" />
        <path d="M70 58v29l8-7 5 12 7-3-5-12 10-1Z" fill="var(--soft)" stroke="var(--a3)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </DemoWindow>
  );
}

export function RwdDemo() {
  return (
    <DemoWindow k="react" file="Layout.tsx">
      <div className="td-code">
        <div>&lt;<u>section</u></div>
        <div className="on">{'  '}<em>className</em>=&quot;flex flex-col</div>
        <div className="on">{'    '}gap-6 md:flex-row&quot;</div>
        <div>&gt;</div>
        <div>{'  {'}cards.<u>map</u>(c =&gt; (</div>
        <div>{'    '}&lt;<u>Card</u> <em>key</em>={'{'}c.id{'}'} /&gt;</div>
        <div>{'  ))}'}</div>
        <div>&lt;/<u>section</u>&gt;</div>
      </div>
      <svg className="td-art" viewBox="0 0 270 300">
        <circle cx="24" cy="26" r="7" fill="var(--a)" />
        <rect x="38" y="22" width="46" height="8" rx="4" fill="var(--soft)" />
        <rect x="14" y="46" width="188" height="82" rx="10" fill="var(--a3)" />
        <circle cx="170" cy="74" r="12" fill="var(--a2)" />
        <path d="M100 128l36-34 22 20 16-14 28 28Z" fill="var(--a)" />
        <rect x="28" y="66" width="70" height="9" rx="4.5" fill="var(--soft)" />
        <rect x="28" y="84" width="46" height="7" rx="3.5" fill="var(--a2)" />
        <rect x="14" y="140" width="56" height="70" rx="8" fill="var(--a)" fillOpacity=".34" stroke="var(--a)" />
        <rect x="80" y="140" width="56" height="70" rx="8" fill="var(--a)" fillOpacity=".34" stroke="var(--a)" />
        <rect x="146" y="140" width="56" height="70" rx="8" fill="var(--a)" fillOpacity=".34" stroke="var(--a)" />
        <circle cx="42" cy="175" r="14" fill="var(--a2)" />
        <rect x="95" y="162" width="26" height="26" rx="6" fill="var(--soft)" />
        <path d="M174 161l15 27h-30Z" fill="var(--a2)" stroke="var(--a2)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M218 0V300" stroke="var(--a)" strokeWidth="1.5" strokeDasharray="4 6" />
        <rect x="211" y="18" width="14" height="36" rx="7" fill="var(--a)" />
      </svg>
    </DemoWindow>
  );
}

// The skill's illustration, shown in its own square satellite. One file per theme; the hidden theme's image is
// display:none, so with lazy loading it isn't fetched until a switch.
export function TechArt({ k }: { k: TechKey }) {
  return (
    <div className="tech-art" aria-hidden="true">
      <img className="tech-art-dark" src={`./img/tech/${k}.webp`} alt="" width={960} height={735} loading="lazy" decoding="async" draggable={false} />
      <img className="tech-art-light" src={`./img/tech/${k}_l.webp`} alt="" width={960} height={735} loading="lazy" decoding="async" draggable={false} />
    </div>
  );
}

/* ── Satellites ─────────────────────────────────────────── */

// Small working tools, each running its own loop: a colour picker, a spacing
// inspector, the easing this site uses, a network log, a render trace, a feed.
function Tick({ values }: { values: [string, string, string] }) {
  return (
    <span className="tm-tick">
      <span>{[...values, values[0]].map((v, i) => <b key={i}>{v}</b>)}</span>
    </span>
  );
}

const HtmlPicker = () => (
  <div className="tm-m">
    <div className="tm-m-h">Primary<small>HEX</small></div>
    <div className="tm-cp-f"><span className="tm-cp-t" /></div>
    <div className="tm-cp-h"><span className="tm-cp-k" /></div>
    <div className="tm-m-r"><span className="tm-cp-s" /><Tick values={['#2563EB', '#0EA5E9', '#7C3AED']} /></div>
  </div>
);

const HtmlSpacing = () => (
  <div className="tm-m">
    <div className="tm-m-h">Button<small>Hug</small></div>
    <div className="tm-sp-st"><div className="tm-sp-b"><i /><i /><i /><i />Get started</div></div>
    <div className="tm-m-r">Size<span className="tm-m-v"><Tick values={['94×28', '110×36', '102×24']} /></span></div>
    <div className="tm-m-r">Padding<span className="tm-m-v"><Tick values={['8 14', '12 22', '6 18']} /></span></div>
  </div>
);

const JsEasing = () => (
  <div className="tm-m">
    <div className="tm-ez">
      <div className="tm-ez-g">
        <svg viewBox="0 0 96 96">
          <path d="M24 0v96M48 0v96M72 0v96M0 24h96M0 48h96M0 72h96" stroke="var(--dim)" />
          <path d="M0 96 21 37M35 0h61" stroke="var(--a2)" strokeOpacity=".7" />
          <path d="M0 96C21 37 35 0 96 0" fill="none" stroke="var(--a)" strokeWidth="2.2" />
          <circle cx="21" cy="37" r="3.2" fill="var(--soft)" stroke="var(--a3)" />
          <circle cx="35" cy="0" r="3.2" fill="var(--soft)" stroke="var(--a3)" />
        </svg>
        <div className="tm-ez-x"><div className="tm-ez-y" /></div>
      </div>
      <div className="tm-ez-r">
        <div className="tm-m-h">ease-out</div>
        <div>.22 .61<br />.36 1</div>
        <div className="tm-ez-tr"><span className="tm-ez-c" /></div>
        <div className="tm-m-r">Time<span className="tm-strong">450ms</span></div>
      </div>
    </div>
  </div>
);

const NET_ROWS = [['projects', 200], ['cover.webp', 200], ['reveal.js', 304], ['chat', 200]] as const;

const JsNetwork = () => (
  <div className="tm-m">
    <div className="tm-m-h">Network<small>412ms</small></div>
    <div className="tm-nw">
      {NET_ROWS.map(([name, code]) => (
        <div className="tm-nw-r" key={name}>
          <div className="tm-nw-l"><span>{name}</span><span className="tm-nw-s">{code}<span className="tm-nw-d" /></span></div>
          <div className="tm-nw-t"><i /></div>
        </div>
      ))}
    </div>
  </div>
);

const TREE_ROWS = [['App', '1.8ms', ''], ['Layout', '1.1ms', ' tm-tr-1'], ['CardGrid', '.7ms', ' tm-tr-2'], ['Card ×3', '.4ms', ' tm-tr-2']] as const;

const ReactTree = () => (
  <div className="tm-m">
    <div className="tm-m-h">Components<small>4 renders</small></div>
    <div className="tm-tr">
      {TREE_ROWS.map(([name, ms, indent]) => (
        <div className={`tm-tr-r${indent}`} key={name}>{name}<small>{ms}</small></div>
      ))}
    </div>
  </div>
);

// The first two cards repeat at the end, so the scroll loops without a jump.
const FEED = [['a', 'Landing'], ['b', 'Dashboard'], ['d', 'Mobile'], ['a', 'Landing'], ['b', 'Dashboard']] as const;

const ReactPhone = () => (
  <span className="tech-sat-screen">
    <div className="tm-pn">
      <span className="tm-pn-i" />
      <div className="tm-pn-top">
        <span>Work</span>
        <svg className="tm-pn-menu" viewBox="0 0 10 8"><path d="M0 1h10M0 4h10M0 7h10" stroke="currentColor" /></svg>
      </div>
      <div className="tm-pn-f">
        {FEED.map(([art, name], i) => (
          <div className="tm-pn-c" key={i}>
            <div className={`tm-pn-img tm-pn-${art}`} />
            <div className="tm-pn-m">
              <span>{name}</span>
              <svg className="tm-pn-h" viewBox="0 0 12 11"><path d="M6 10.6 1.2 5.9a2.9 2.9 0 0 1 4.1-4.1l.7.7.7-.7a2.9 2.9 0 0 1 4.1 4.1Z" fill="currentColor" /></svg>
            </div>
          </div>
        ))}
      </div>
      <div className="tm-pn-tab"><i /><i /><i /><i /></div>
    </div>
  </span>
);

const SATS: Record<TechKey, [() => ReactNode, () => ReactNode]> = {
  html: [HtmlPicker, HtmlSpacing],
  js: [JsEasing, JsNetwork],
  react: [ReactTree, ReactPhone],
};

// Desktop: a satellite can be dragged around its card, like How I Use AI's.
// The offset lives in --dx / --dy on the element, so a move never re-renders.
export const TECH_DRAG_MQ = '(min-width: 1025px)';

export function startSatDrag(e: ReactPointerEvent<HTMLElement>) {
  if (e.button !== 0 || !window.matchMedia?.(TECH_DRAG_MQ).matches) return;
  // the carousel's own swipe must not start under it
  e.stopPropagation();
  e.preventDefault();
  const el = e.currentTarget;
  const startX = parseFloat(el.style.getPropertyValue('--dx')) || 0;
  const startY = parseFloat(el.style.getPropertyValue('--dy')) || 0;
  const sx = e.clientX;
  const sy = e.clientY;
  const r = el.getBoundingClientRect();
  const box = el.closest('.tech-item-wrap')?.getBoundingClientRect();
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
  try { el.setPointerCapture?.(e.pointerId); } catch { /* synthetic pointer: no capture */ }
  el.classList.add('is-dragging');
  const move = (ev: PointerEvent) => {
    const dx = box ? clamp(ev.clientX - sx, box.left - r.left, box.right - r.right) : ev.clientX - sx;
    const dy = box ? clamp(ev.clientY - sy, box.top - r.top, box.bottom - r.bottom) : ev.clientY - sy;
    el.style.setProperty('--dx', `${startX + dx}px`);
    el.style.setProperty('--dy', `${startY + dy}px`);
  };
  const end = () => {
    el.classList.remove('is-dragging');
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', end);
    el.removeEventListener('pointercancel', end);
  };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

export function TechSats({ k }: { k: TechKey }) {
  const [First, Second] = SATS[k];
  return (
    <>
      <div className={`tech-sat tech-sat--art tk tk-${k}`} onPointerDown={startSatDrag} aria-hidden="true"><TechArt k={k} /></div>
      <div className={`tech-sat tech-sat--a tech-sat--a-${k} tk tk-${k}`} onPointerDown={startSatDrag} aria-hidden="true"><First /></div>
      <div className={`tech-sat ${k === 'react' ? 'tech-sat--phone' : 'tech-sat--b'} tk tk-${k}`} onPointerDown={startSatDrag} aria-hidden="true"><Second /></div>
    </>
  );
}
