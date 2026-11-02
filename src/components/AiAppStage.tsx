import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react';
import { gsap } from 'gsap';
import { useLang } from '../context/LangContext';
import MakeLogo from './MakeLogo';
import './AiAppStage.css';

// How I Use AI — desktop stage. One fixed "product" (an app window, like
// Apple's viewer always showing the same MacBook) whose screen changes per
// step. Every screen renders its finished state in the markup; its intro
// timeline only runs when it becomes the active screen and is fully reverted
// when it stops being active, so switching back replays it from scratch and
// reduced-motion / no-JS visitors just see the final state.
//
// New UI chrome strings are English on purpose: the homepage GenSen font is
// subset to the characters translations.ts already uses, so new Chinese text
// here could render in a fallback face. Content comes from the existing
// ai_* translation keys.

export type AiStageStep = { id: string; title: string };

type T = Record<string, string>;

// The one request every screen follows: Celine's LINE message (Inbox) →
// form (Intake) → brief → tracker row → review → workflow plan.
const TICKET = 'DR-248';
const ARRIVED_AT = '10:42'; // the LINE message's timestamp, shown in Inbox + Intake
const FORM_AT = '10:58'; // when Celine sent the request form the bot replied with

const NAV_LABELS: Record<string, string> = {
  sources: 'Inbox',
  intake: 'Intake',
  ai: 'AI Brief',
  tracking: 'Tracker',
  human: 'Review',
  workflow: 'Workflow',
};

const prefersReduced = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

const stripTags = (html: string) => html.replace(/<[^>]*>/g, '');

// Runs `build` as a GSAP timeline while `active`, inside a context scoped to
// `root`; reverting on deactivation puts every tweened property back.
// `build` may return extra cleanup for DOM it changed directly (typed text).
function useScreenIntro(
  active: boolean,
  root: RefObject<HTMLElement | null>,
  build: (tl: gsap.core.Timeline, q: (sel: string) => HTMLElement[], restore: (() => void)[]) => void,
  deps: unknown[],
) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!active || !el || prefersReduced()) return;
    const restore: (() => void)[] = [];
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.22 });
      const q = (sel: string) => Array.from(el.querySelectorAll<HTMLElement>(sel));
      build(tl, q, restore);
    }, el);
    return () => {
      // Revert FIRST: it rewinds the typing/count tweens to frame 0, which
      // fires their onUpdate once more and blanks the text — restoring before
      // that left the fields empty, and the next intro then captured "" as
      // the text to type (02 Intake showed an empty form after a revisit,
      // and on first view under StrictMode's double effect run).
      ctx.revert();
      restore.forEach(fn => fn());
    };
    // `build` is recreated every render; `deps` carries what it reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps]);
}

// Types an element's text out from empty, then restores its original markup
// (so highlight spans land as a final "marker" beat). Height is pinned while
// typing so the content below doesn't jump.
function typeIn(tl: gsap.core.Timeline, el: HTMLElement | undefined, at: gsap.Position, restore: (() => void)[], cps = 70) {
  if (!el) return;
  const html = el.innerHTML;
  const text = stripTags(html).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  el.style.minHeight = `${el.offsetHeight}px`;
  el.textContent = '';
  restore.push(() => {
    el.innerHTML = html;
    el.style.minHeight = '';
    el.classList.remove('is-typing');
  });
  const o = { n: 0 };
  tl.to(o, {
    n: text.length,
    duration: Math.max(0.3, text.length / cps),
    ease: 'none',
    onStart: () => el.classList.add('is-typing'),
    onUpdate: () => { el.textContent = text.slice(0, Math.round(o.n)); },
    onComplete: () => {
      el.innerHTML = html;
      el.classList.remove('is-typing');
    },
  }, at);
}

function countUp(tl: gsap.core.Timeline, el: HTMLElement | undefined, at: gsap.Position, restore: (() => void)[], duration = 0.9) {
  if (!el) return;
  const final = el.textContent ?? '';
  const target = parseInt(final, 10);
  if (Number.isNaN(target)) return;
  el.textContent = '0';
  restore.push(() => { el.textContent = final; });
  const o = { n: 0 };
  tl.to(o, { n: target, duration, ease: 'power2.out', onUpdate: () => { el.textContent = String(Math.round(o.n)); } }, at);
}

/* ── 01 Inbox ───────────────────────────────────────────── */

// The real intake is one LINE Official Account: a Make router matches each
// message's keywords and auto-replies (a request form, the FAQ, the service
// list, or a hand-off to Tim); anything it can't match goes to AI, which
// expands the request first. Each row shows the route its message took.
const ROUTES = {
  uiux: { label: 'UI/UX form', icon: 'ph-fill ph-clipboard-text', tone: 'form' },
  quote: { label: 'Quote form', icon: 'ph-fill ph-currency-circle-dollar', tone: 'note' },
  graphic: { label: 'Graphic form', icon: 'ph-fill ph-palette', tone: 'slack' },
  ai: { label: 'AI expand', icon: 'ph-fill ph-sparkle', tone: 'ai' },
  services: { label: 'Services', icon: 'ph-fill ph-squares-four', tone: 'mail' },
  human: { label: 'To Tim', icon: 'ph-fill ph-users-three', tone: 'line' },
} as const;
const INBOX: { route: keyof typeof ROUTES; from: string; text: string; time: string }[] = [
  // Row 0 is DR-248's source message — it gets the UI/UX request form.
  { route: 'uiux', from: '@pm.celine', text: 'Onboarding redesign for the new tier — Jun 17?', time: ARRIVED_AT },
  { route: 'quote', from: '@studio.kai', text: 'How much for a 5-page website?', time: '10:16' },
  { route: 'graphic', from: '@mei.bakery', text: 'New logo and menu for our café', time: '09:51' },
  { route: 'ai', from: '@ryan.fit', text: 'A booking app for my gym? Not sure what we need', time: '08:30' },
  { route: 'services', from: '@amy.hr', text: 'What kind of design work do you take on?', time: 'Yday' },
  { route: 'human', from: '@jason.ops', text: 'Can I talk to Tim directly?', time: 'Mon' },
];

function InboxScreen({ active, t }: { active: boolean; t: T }) {
  const ref = useRef<HTMLDivElement>(null);
  useScreenIntro(active, ref, (tl, q) => {
    const [fresh, ...rest] = q('.aas-msg');
    tl.from(q('.aas-screen-head > *'), { opacity: 0, y: 8, duration: 0.35, ease: 'power2.out', stagger: 0.06 }, 0)
      .from(rest, { opacity: 0, y: 12, duration: 0.4, ease: 'power3.out', stagger: 0.07 }, 0.1)
      // The toast is hidden in CSS (it's only part of the arrival beat).
      .fromTo(q('.aas-toast'), { opacity: 0, y: -10, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2)' }, 0.9)
      .to(q('.aas-toast'), { opacity: 0, y: -6, duration: 0.3, ease: 'power2.in' }, 2.1)
      .from(fresh, { height: 0, paddingTop: 0, paddingBottom: 0, opacity: 0, duration: 0.55, ease: 'power3.out' }, 1.35)
      .fromTo(fresh, { '--flash': 1 }, { '--flash': 0, duration: 2.6, ease: 'power1.in', immediateRender: false }, 1.6)
      .from(q('.aas-msg-new'), { scale: 0, duration: 0.4, ease: 'back.out(3)' }, 1.7)
      // …then the system files it as a ticket: the hand-off to Intake.
      .from(q('.aas-msg-ticket'), { opacity: 0, x: -8, duration: 0.4, ease: 'power3.out' }, 2.5)
      .fromTo(q('.aas-count'), { scale: 1.4 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', immediateRender: false }, 1.4);
  }, []);
  return (
    <div ref={ref} className="aas-screen-inner">
      <header className="aas-screen-head">
        <div>
          <h4>{t.ai_d_recent}</h4>
          <p className="aas-meta"><span className="aas-count">{INBOX.length}</span> new · LINE OA · auto-routed</p>
        </div>
        <div className="aas-chips">
          <span className="aas-chip"><MakeLogo size={12} /> Keyword router</span>
        </div>
      </header>
      <div className="aas-toast" aria-hidden="true"><i className="ph-fill ph-chat-circle-text" /> {t.ai_sources_loading}</div>
      <ul className="aas-inbox">
        {INBOX.map((m, i) => {
          const r = ROUTES[m.route];
          return (
            <li key={m.from} className="aas-msg ch-line">
              <span className="aas-msg-icon"><i className="ph-fill ph-chat-circle-text" /></span>
              <span className="aas-msg-body">
                <span className="aas-msg-from">
                  <span className="aas-msg-name">{m.from}</span>
                  {i === 0 && <span className="aas-msg-new">New</span>}
                  {i === 0 && (
                    <span className="aas-msg-ticket" title={`Filed as ${TICKET}`}>
                      <i className="ph-bold ph-arrow-right" aria-hidden="true" />{TICKET}
                    </span>
                  )}
                </span>
                <span className="aas-msg-text">{m.text}</span>
              </span>
              <span className="aas-msg-side">
                <span className="aas-msg-time">{m.time}</span>
                {/* The auto-reply the router sent back. */}
                <span className={`aas-msg-route rt-${r.tone}`} title={r.label}><i className={r.icon} aria-hidden="true" /><span className="aas-msg-route-label">{r.label}</span></span>
              </span>
              {i < 2 && <span className="aas-unread" aria-label="unread" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── 02 Intake ──────────────────────────────────────────── */

function IntakeScreen({ active, t }: { active: boolean; t: T }) {
  const ref = useRef<HTMLDivElement>(null);
  useScreenIntro(active, ref, (tl, q, restore) => {
    const fields = q('.aas-field');
    const status = q('.aas-progress-label')[0];
    const statusText = status?.textContent ?? '';
    if (status) {
      status.textContent = t.ai_f_filling;
      restore.push(() => { status.textContent = statusText; });
    }
    tl.from(q('.aas-screen-head > *'), { opacity: 0, y: 8, duration: 0.35, ease: 'power2.out', stagger: 0.06 }, 0)
      .from(q('.aas-bubble'), { opacity: 0, x: -16, duration: 0.5, ease: 'power3.out' }, 0.05)
      .from(q('.aas-reply'), { opacity: 0, x: 12, duration: 0.45, ease: 'power3.out' }, 0.3)
      .from(q('.aas-pipe'), { opacity: 0, scale: 0.6, duration: 0.4, ease: 'back.out(2.4)' }, 0.35)
      .from(q('.aas-pipe-dot'), { x: -18, opacity: 0, duration: 0.6, ease: 'power2.inOut', repeat: 2 }, 0.5)
      .from(fields, { opacity: 0.35, duration: 0.2 }, 0.4)
      .from(q('.aas-progress-fill'), { scaleX: 0, duration: 2.6, ease: 'none' }, 0.6);
    let at = 0.6;
    let badgeAt = at;
    fields.forEach(f => {
      const val = f.querySelector<HTMLElement>('.aas-field-val > span');
      const len = (val?.textContent ?? '').length;
      tl.fromTo(f, { '--focus': 1 }, { '--focus': 0, duration: 0.6, ease: 'power1.in', immediateRender: false }, at);
      typeIn(tl, val ?? undefined, at, restore, 75);
      at += Math.max(0.3, len / 75) + 0.06;
      if (f.querySelector('.aas-badge')) badgeAt = at;
    });
    tl.from(q('.aas-field .aas-badge'), { opacity: 0, scale: 1.8, rotate: -10, duration: 0.4, ease: 'back.out(2.6)' }, badgeAt)
      .call(() => { if (status) status.textContent = t.ai_f_complete; }, undefined, at)
      .fromTo(q('.aas-progress'), { '--done': 0 }, { '--done': 1, duration: 0.4 }, at)
      .from(q('.aas-progress-check'), { scale: 0, duration: 0.4, ease: 'back.out(3)' }, at);
  }, [t]);
  const fields: [string, ReactNode][] = [
    [t.ai_f_source, 'LINE — @pm.celine'],
    [t.ai_f_projtype, 'Web/App · Mobile'],
    [t.ai_f_goal, 'Redesign onboarding for new pricing tier'],
    [t.ai_f_timeline, 'Jun 03 — Jun 17'],
    [t.ai_f_priority_lbl, 'P1 — Quarterly OKR'],
    [t.ai_f_contact, 'celine.h@firm.co'],
  ];
  return (
    <div ref={ref} className="aas-screen-inner">
      <header className="aas-screen-head">
        <div>
          <h4>{t.ai_d_req_form}</h4>
          <p className="aas-meta">UI/UX form · {FORM_AT} · <MakeLogo size={13} /> → Sheets</p>
        </div>
        <div className="aas-progress">
          <span className="aas-progress-label">{t.ai_f_complete}</span>
          <span className="aas-progress-bar"><span className="aas-progress-fill" /></span>
          <i className="ph-fill ph-check-circle aas-progress-check" aria-hidden="true" />
        </div>
      </header>
      <div className="aas-intake">
        {/* The LINE thread from Inbox: Celine's message, then the router's
            auto-reply carrying the UI/UX request form she fills in. */}
        <div className="aas-chat">
          <div className="aas-bubble">
            <div className="aas-bubble-from"><span className="aas-avatar ch-line"><i className="ph-fill ph-chat-circle-text" /></span>Celine · PM <em>LINE</em></div>
            <p>Hi Tim — we need the onboarding redesigned for the new pricing tier before Jun 17. It&apos;s on the Q3 OKR. Can you take it?</p>
            <span className="aas-bubble-time">{ARRIVED_AT}</span>
          </div>
          <div className="aas-reply">
            <span className="aas-reply-tag">Auto-reply</span>
            <span className="aas-reply-card"><i className="ph-fill ph-clipboard-text" aria-hidden="true" />UI/UX request form<i className="ph-bold ph-arrow-right" aria-hidden="true" /></span>
          </div>
        </div>
        <div className="aas-pipe" aria-hidden="true">
          <span className="aas-pipe-line"><span className="aas-pipe-dot" /></span>
          <span className="aas-pipe-chip"><MakeLogo size={22} /></span>
        </div>
        <div className="aas-form">
          {fields.map(([label, value], i) => (
            <div key={i} className={`aas-field${i === 2 ? ' is-wide' : ''}`}>
              <span className="aas-field-label">{label}</span>
              <span className="aas-field-val">
                <span>{value}</span>
                {i === 4 && <span className="aas-badge is-danger">HIGH</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 03 AI Brief ────────────────────────────────────────── */

const TRENDS = ['Pricing tables that explain, not upsell', 'Progressive onboarding checklists'];

function BriefScreen({ active, t }: { active: boolean; t: T }) {
  const ref = useRef<HTMLDivElement>(null);
  useScreenIntro(active, ref, (tl, q, restore) => {
    const state = q('.aas-ai-state')[0];
    const stateText = state?.innerHTML ?? '';
    if (state) {
      state.innerHTML = `<span class="aas-dots"><i></i><i></i><i></i></span>${t.ai_thinking}`;
      restore.push(() => { state.innerHTML = stateText; });
    }
    // Skeleton is hidden in CSS; it only covers the "analysing" beat.
    tl.from(q('.aas-screen-head > *'), { opacity: 0, y: 8, duration: 0.35, ease: 'power2.out', stagger: 0.06 }, 0)
      .fromTo(q('.aas-skeleton'), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25 }, 1.0)
      .from(q('.aas-brief-col > *'), { opacity: 0, y: 10, duration: 0.4, ease: 'power3.out', stagger: 0.12 }, 1.1);
    typeIn(tl, q('.aas-summary-text')[0], 1.25, restore, 95);
    tl.from(q('.aas-brief-side > *'), { opacity: 0, x: 12, duration: 0.45, ease: 'power3.out', stagger: 0.12 }, 1.4)
      .from(q('.aas-conf-fill'), { scaleX: 0, duration: 0.9, ease: 'power3.out', stagger: 0.15 }, 1.6)
      .from(q('.aas-missing li'), { opacity: 0, x: -8, duration: 0.35, ease: 'power2.out', stagger: 0.14 }, 2.6)
      .from(q('.aas-questions li'), { opacity: 0, x: -8, duration: 0.35, ease: 'power2.out', stagger: 0.14 }, 3.0)
      .call(() => { if (state) state.innerHTML = stateText; }, undefined, 3.1)
      .fromTo(q('.aas-ai-state'), { opacity: 0.4 }, { opacity: 1, duration: 0.3, immediateRender: false }, 3.1);
    countUp(tl, q('.aas-conf-num')[0], 1.6, restore, 0.9);
    countUp(tl, q('.aas-conf-num')[1], 1.75, restore, 0.9);
  }, [t]);
  return (
    <div ref={ref} className="aas-screen-inner">
      <header className="aas-screen-head">
        <div>
          <h4>AI Brief · DR-248</h4>
          <p className="aas-meta aas-ai-state"><i className="ph-fill ph-check-circle" aria-hidden="true" /> Brief ready · 4.2s · saved to Sheets</p>
        </div>
        <span className="aas-chip is-accent"><i className="ph-fill ph-sparkle" aria-hidden="true" /> AI · Draft</span>
      </header>
      <div className="aas-brief">
        <div className="aas-skeleton" aria-hidden="true">
          <i style={{ width: '92%' }} /><i style={{ width: '78%' }} /><i style={{ width: '85%' }} /><i style={{ width: '40%' }} />
        </div>
        <div className="aas-brief-col">
          <section className="aas-block">
            <h5><i className="ph-bold ph-file-text" aria-hidden="true" />{t.ai_d_summary_lbl}</h5>
            <p className="aas-summary-text" dangerouslySetInnerHTML={{ __html: t.ai_d_summary_text }} />
          </section>
          <section className="aas-block is-warn">
            <h5><i className="ph-fill ph-warning" aria-hidden="true" />{t.ai_d_missing_lbl}</h5>
            <ul className="aas-missing">
              <li>{t.ai_d_m1}</li>
              <li>{t.ai_d_m2}</li>
              <li>{t.ai_d_m3}</li>
            </ul>
          </section>
          {/* The questions that close those gaps — Review picks them up. */}
          <section className="aas-block is-ask">
            <h5><i className="ph-fill ph-chat-circle-text" aria-hidden="true" />{t.ai_d_questions_lbl}<span className="aas-block-to">→ Celine</span></h5>
            <ol className="aas-questions">
              <li>{t.ai_d_q1}</li>
              <li>{t.ai_d_q2}</li>
              <li>{t.ai_d_q3}</li>
            </ol>
          </section>
        </div>
        <aside className="aas-brief-side">
          <div className="aas-conf">
            <span className="aas-conf-label"><i className="ph-fill ph-grid-four" aria-hidden="true" />{t.ai_d_tasktype_lbl}</span>
            <span className="aas-conf-row"><b>Web/App UI</b><span><span className="aas-conf-num">92</span>%</span></span>
            <span className="aas-conf-bar"><span className="aas-conf-fill" style={{ width: '92%' }} /></span>
          </div>
          <div className="aas-conf is-warn">
            <span className="aas-conf-label"><i className="ph-fill ph-star" aria-hidden="true" />{t.ai_d_priority_lbl}</span>
            <span className="aas-conf-row"><b>P1 · HIGH</b><span><span className="aas-conf-num">87</span>%</span></span>
            <span className="aas-conf-bar"><span className="aas-conf-fill" style={{ width: '87%' }} /></span>
          </div>
          <div className="aas-block is-ok">
            <h5><i className="ph-bold ph-arrow-circle-right" aria-hidden="true" />{t.ai_d_direction_lbl}</h5>
            <p>{t.ai_d_direction_text}</p>
          </div>
          {/* The flow reads current design-trend articles (RSS) into the
              prompt, so the brief cites what it leaned on. */}
          <div className="aas-block is-trend">
            <h5><i className="ph-fill ph-file-text" aria-hidden="true" />Trend refs · RSS</h5>
            <ul className="aas-trends">
              {TRENDS.map(a => <li key={a}>{a}</li>)}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ── 04 Tracker ─────────────────────────────────────────── */

// A plausible pipeline: most requests are done, a handful in flight.
// The four add up to the 142 records in the header.
const STATS = [
  { label: 'New', n: 6, tone: 'info' },
  { label: 'In progress', n: 14, tone: 'ok' },
  { label: 'Review', n: 9, tone: 'warn' },
  { label: 'Done', n: 113, tone: 'muted' },
];
const RECORDS = STATS.reduce((sum, s) => sum + s.n, 0);
// Requests filed per day, last 7 days; today is a morning so far — the four
// Inbox messages stamped today.
const INTAKE_7D = [9, 12, 8, 14, 11, 7, 4];
const ROWS = [
  // DR-248 has just come out of AI Brief and waits for review.
  // `src` is the request form the LINE bot sent; `type` the form router's
  // two case lanes (Web/App UI gets the AI brief + Figma file).
  { id: TICKET, src: 'UI/UX form', type: 'Web/App UI', status: 'Brief ready', tone: 'now', when: 'just now' },
  { id: 'DR-247', src: 'Graphic form', type: 'Graphic', status: 'Review', tone: 'warn', when: '1h' },
  { id: 'DR-246', src: 'Web form', type: 'Web/App UI', status: 'Done', tone: 'muted', when: '1d' },
  { id: 'DR-245', src: 'Graphic form', type: 'Graphic', status: 'In progress', tone: 'ok', when: '2d' },
];

function TrackerScreen({ active, t }: { active: boolean; t: T }) {
  const ref = useRef<HTMLDivElement>(null);
  useScreenIntro(active, ref, (tl, q, restore) => {
    const [fresh, ...rest] = q('.aas-row');
    tl.from(q('.aas-screen-head > *'), { opacity: 0, y: 8, duration: 0.35, ease: 'power2.out', stagger: 0.06 }, 0)
      .from(q('.aas-stat'), { opacity: 0, y: 12, duration: 0.4, ease: 'power3.out', stagger: 0.08 }, 0.05)
      .from(q('.aas-stat-fill'), { scaleX: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, 0.25)
      .from(q('.aas-table-head'), { opacity: 0, duration: 0.3 }, 0.3)
      .from(rest, { opacity: 0, y: 10, duration: 0.35, ease: 'power3.out', stagger: 0.07 }, 0.4)
      .from(fresh, { height: 0, opacity: 0, duration: 0.5, ease: 'power3.out' }, 1.2)
      .fromTo(fresh, { '--flash': 1 }, { '--flash': 0, duration: 2.4, ease: 'power1.in' }, 1.5)
      // fromTo, not from: the head stagger above has already zeroed this
      // pill's opacity, so a .from() would capture 0 as its end value and
      // leave the pill invisible.
      .fromTo(q('.aas-sync-pill'), { opacity: 0.3 }, { opacity: 1, duration: 0.3, immediateRender: false }, 1.4)
      .from(q('.aas-spark-bar'), { scaleY: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05 }, 0.35);
    q('.aas-stat-num').forEach((el, i) => countUp(tl, el, 0.25 + i * 0.08, restore));
    countUp(tl, q('.aas-records')[0], 0.3, restore, 1.1);
  }, [t]);
  const peak = Math.max(...INTAKE_7D);
  return (
    <div ref={ref} className="aas-screen-inner">
      <header className="aas-screen-head">
        <div>
          <h4>{t.ai_d_sheets_lbl}</h4>
          <p className="aas-meta"><span className="aas-records">{RECORDS}</span> records · Google Sheets</p>
        </div>
        <span className="aas-chip aas-sync-pill"><span className="aas-live-dot" />Synced · just now</span>
      </header>
      <div className="aas-stats">
        {STATS.map(s => (
          <div key={s.label} className={`aas-stat is-${s.tone}`}>
            <span className="aas-stat-label">{s.label}</span>
            <span className="aas-stat-num">{s.n}</span>
            {/* Share of all records. */}
            <span className="aas-stat-bar"><span className="aas-stat-fill" style={{ width: `${Math.max(4, Math.round((s.n / RECORDS) * 100))}%` }} /></span>
          </div>
        ))}
      </div>
      <div className="aas-spark" role="img" aria-label={`Requests per day, last 7 days: ${INTAKE_7D.join(', ')}`}>
        <span className="aas-spark-head">
          <span className="aas-stat-label"><i className="ph-fill ph-chart-bar" aria-hidden="true" /> Intake · 7 days</span>
          <span className="aas-spark-sum"><b>{INTAKE_7D.reduce((a, b) => a + b, 0)}</b> this week · <b>{INTAKE_7D[INTAKE_7D.length - 1]}</b> today</span>
        </span>
        <span className="aas-spark-bars" aria-hidden="true">
          {INTAKE_7D.map((n, i) => (
            <span
              key={i}
              className={`aas-spark-bar${i === INTAKE_7D.length - 1 ? ' is-today' : ''}`}
              style={{ height: `${Math.round((n / peak) * 100)}%` }}
            />
          ))}
        </span>
      </div>
      <div className="aas-table" role="table" aria-label={t.ai_d_sheets_lbl}>
        <div className="aas-table-head" role="row">
          <span role="columnheader">ID</span><span role="columnheader">Form</span><span role="columnheader">Type</span><span role="columnheader">Status</span><span role="columnheader">Updated</span>
        </div>
        {ROWS.map(r => (
          <div key={r.id} className={`aas-row${r.id === TICKET ? ' is-current' : ''}`} role="row">
            <span role="cell" className="aas-mono">{r.id}</span>
            <span role="cell">{r.src}</span>
            <span role="cell">{r.type}</span>
            <span role="cell"><span className={`aas-badge is-${r.tone}`}>{r.status}</span></span>
            <span role="cell" className="aas-dim">{r.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 05 Review ──────────────────────────────────────────── */

function ReviewScreen({ active, t }: { active: boolean; t: T }) {
  const ref = useRef<HTMLDivElement>(null);
  useScreenIntro(active, ref, (tl, q, restore) => {
    const btn = q('.aas-approve')[0];
    if (btn) {
      btn.classList.add('is-pending');
      restore.push(() => btn.classList.remove('is-pending'));
    }
    const checks = q('.aas-review-check');
    tl.from(q('.aas-screen-head > *'), { opacity: 0, y: 8, duration: 0.35, ease: 'power2.out', stagger: 0.06 }, 0)
      .from(q('.aas-from'), { opacity: 0, y: 6, duration: 0.35, ease: 'power2.out' }, 0.05)
      .from(q('.aas-review-row'), { opacity: 0, y: 10, duration: 0.35, ease: 'power3.out', stagger: 0.1 }, 0.1)
      .from(checks, { scale: 0, opacity: 0, duration: 0.35, ease: 'back.out(3)', stagger: 0.32 }, 0.7)
      .from(q('.aas-stamp'), { opacity: 0, scale: 1.9, rotate: -14, duration: 0.45, ease: 'back.out(2.4)' }, 0.8)
      .fromTo(q('.aas-review-row.is-risk'), { '--risk': 0 }, { '--risk': 1, duration: 0.5 }, 1.4)
      .call(() => btn?.classList.remove('is-pending'), undefined, 0.7 + checks.length * 0.32 + 0.1)
      .fromTo(btn ?? [], { scale: 0.92 }, { scale: 1, duration: 0.35, ease: 'back.out(3)', immediateRender: false }, 0.7 + checks.length * 0.32 + 0.1)
      .from(q('.aas-quote'), { opacity: 0, y: 12, duration: 0.45, ease: 'power3.out' }, 2.2);
    typeIn(tl, q('.aas-quote-text')[0], 2.5, restore, 18);
  }, [t]);
  const rows: [string, ReactNode, string?][] = [
    [t.ai_hr_priority_row, <><span className="aas-stamp">P1</span>{t.ai_hr_priority_val.replace(/^P1\s*[—:-]\s*/, '')}</>],
    [t.ai_hr_strategy_row, t.ai_hr_strategy_val],
    [t.ai_hr_risks_row, t.ai_hr_risks_val, 'is-risk'],
    [t.ai_hr_nextstep_row, t.ai_hr_nextstep_val],
  ];
  return (
    <div ref={ref} className="aas-screen-inner">
      <header className="aas-screen-head">
        <div>
          <h4>{t.ai_d_assessment_lbl}</h4>
          <p className="aas-meta"><span className="aas-initials" aria-hidden="true">TL</span>Reviewer · Tim Lin · <i className="ph-bold ph-clock" aria-hidden="true" /> Due Jun 17</p>
        </div>
        <span className="aas-approve">
          <span className="aas-approve-done"><i className="ph-fill ph-check-circle" aria-hidden="true" /> Approved · 11:05</span>
          <span className="aas-approve-wait"><span className="aas-dots"><i /><i /><i /></span> Reviewing</span>
        </span>
      </header>
      {/* How the brief reached Tim: the flow pushes it to his own LINE and
          Gmail. Of its three gaps, the success metric is settled here
          (strategy row); the other two stay open as risks. */}
      <p className="aas-from">
        <i className="ph-fill ph-envelope-simple" aria-hidden="true" />
        Brief sent to you · LINE + Gmail · <b>3</b> gaps → <b>1</b> resolved, <b>2</b> risks
      </p>
      <div className="aas-review">
        {rows.map(([label, value, cls]) => (
          <div key={label} className={`aas-review-row${cls ? ' ' + cls : ''}`}>
            <span className="aas-review-check" aria-hidden="true"><i className="ph-fill ph-check-circle" /></span>
            <span className="aas-review-label">{label}</span>
            <span className="aas-review-val">{value}</span>
          </div>
        ))}
      </div>
      <figure className="aas-quote">
        <figcaption>{t.ai_hr_op_lbl}</figcaption>
        <blockquote className="aas-quote-text" dangerouslySetInnerHTML={{ __html: t.ai_hr_op_quote }} />
        <span className="aas-quote-by">— Tim Lin</span>
      </figure>
    </div>
  );
}

/* ── 06 Workflow ────────────────────────────────────────── */

const PHASE_ICONS = ['ph-fill ph-magnifying-glass', 'ph-fill ph-tree-structure', 'ph-fill ph-palette', 'ph-fill ph-check-circle', 'ph-fill ph-rocket-launch'];
const PHASE_STATIC = 2; // what the screen shows at rest / with reduced motion
// Intake's Jun 03 — Jun 17 window, split across the five phases.
const PHASE_DATES = ['Jun 03–04', 'Jun 05–06', 'Jun 07–11', 'Jun 12–13', 'Jun 14–17'];

function WorkflowScreen({ active, t }: { active: boolean; t: T }) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(PHASE_STATIC);
  useEffect(() => {
    if (!active || prefersReduced()) return;
    let i = 0;
    let id: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => setPhase(0), 0);
    const run = () => {
      id ??= setInterval(() => {
        i = (i + 1) % PHASE_ICONS.length;
        setPhase(i);
      }, 1700);
    };
    const stop = () => {
      clearInterval(id);
      id = undefined;
    };
    // Only cycle while the window is on screen — scrolled away, the timer
    // would keep re-rendering a screen nobody sees.
    const el = ref.current;
    let io: IntersectionObserver | undefined;
    if (el && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(entries => (entries.some(e => e.isIntersecting) ? run() : stop()));
      io.observe(el);
    } else run();
    return () => {
      clearTimeout(start);
      stop();
      io?.disconnect();
    };
  }, [active]);
  useScreenIntro(active, ref, (tl, q) => {
    tl.from(q('.aas-screen-head > *'), { opacity: 0, y: 8, duration: 0.35, ease: 'power2.out', stagger: 0.06 }, 0)
      .from(q('.aas-from'), { opacity: 0, y: 6, duration: 0.35, ease: 'power2.out' }, 0.05)
      .from(q('.aas-track-node'), { opacity: 0, scale: 0.6, duration: 0.4, ease: 'back.out(2.4)', stagger: 0.08 }, 0.1)
      .from(q('.aas-phase'), { opacity: 0, y: 10, duration: 0.35, ease: 'power3.out', stagger: 0.07 }, 0.3);
  }, [t]);
  const names = [t.ai_ph_research, t.ai_ph_structure, t.ai_ph_design, t.ai_ph_validate, t.ai_ph_delivery];
  const descs = [t.ai_ph_research_d, t.ai_ph_structure_d, t.ai_ph_design_d, t.ai_ph_validate_d, t.ai_ph_delivery_d];
  const status = (i: number) =>
    i < phase ? ['done', t.ai_ph_completed] : i === phase ? ['now', t.ai_ph_inprogress] : i === phase + 1 ? ['next', t.ai_ph_upnext] : ['queued', t.ai_ph_queued];
  return (
    <div ref={ref} className="aas-screen-inner" style={{ ['--phase' as string]: phase }}>
      <header className="aas-screen-head">
        <div>
          <h4>{t.ai_d_phases_lbl}</h4>
          <p className="aas-meta"><i className="ph-fill ph-check-circle" aria-hidden="true" /> Approved in Review · kickoff Jun 03</p>
        </div>
        <span className="aas-chip"><i className="ph-fill ph-rocket-launch" aria-hidden="true" /> ETA Jun 17</span>
      </header>
      {/* Web/App UI cases also get a Figma file, built by the flow from the
          design system — the Design phase starts from it, not a blank page. */}
      <p className="aas-from">
        <i className="ph-fill ph-frame-corners" aria-hidden="true" />
        Figma file ready · <b>DR-248 Onboarding</b> · pages from the design system
      </p>
      <div className="aas-track">
        <span className="aas-track-line"><span className="aas-track-fill" /></span>
        {names.map((n, i) => (
          <span key={n} className={`aas-track-node is-${status(i)[0]}`}>
            <span className="aas-track-dot"><i className={PHASE_ICONS[i]} aria-hidden="true" /></span>
            <span className="aas-track-name">{n}</span>
          </span>
        ))}
      </div>
      <ol className="aas-phases">
        {names.map((n, i) => {
          const [key, label] = status(i);
          return (
            <li key={n} className={`aas-phase is-${key}`}>
              <span className="aas-mono aas-dim">{String(i + 1).padStart(2, '0')}</span>
              <span className="aas-phase-text"><b>{n}</b><span>{descs[i]}</span></span>
              <span className="aas-phase-date">{PHASE_DATES[i]}</span>
              <span className={`aas-badge is-${key}`}>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── Around the window ──────────────────────────────────── */
// Pieces that sit outside the app window, layered like a product shot: the
// client's own LINE thread on a phone (it grows as DR-248 moves along), and
// in front, the Make scenario behind the current step — or, on the last
// step, the handoff a build partner receives. Same request, other people's
// view of it.

type ChatMsg = {
  step: number;
  from: 'me' | 'oa';
  text?: string;
  time?: string;
  chips?: string[];
  card?: { icon: string; title: string; sub: string };
};

// Celine's side of the thread. Times line up with the window's screens.
const CHAT: ChatMsg[] = [
  { step: 0, from: 'me', text: 'Onboarding redesign for the new tier — Jun 17?', time: ARRIVED_AT },
  { step: 0, from: 'oa', text: 'Hi Celine! What do you need?', chips: ['Quote', 'UI/UX form', 'Talk to Tim'] },
  { step: 1, from: 'oa', card: { icon: 'ph-fill ph-clipboard-text', title: 'UI/UX request form', sub: 'About 3 min' } },
  { step: 1, from: 'me', text: 'Done, form sent.', time: FORM_AT },
  { step: 2, from: 'oa', card: { icon: 'ph-fill ph-sparkle', title: '3 quick questions', sub: 'Before we start' } },
  { step: 3, from: 'me', text: 'Answered all three.', time: '11:01' },
  { step: 3, from: 'oa', card: { icon: 'ph-fill ph-chart-bar', title: `${TICKET} · In progress`, sub: 'Track it any time' } },
  { step: 4, from: 'oa', card: { icon: 'ph-fill ph-check-circle', title: 'Brief approved', sub: 'By Tim · 11:05' } },
  { step: 5, from: 'oa', card: { icon: 'ph-fill ph-rocket-launch', title: 'Kickoff Jun 03', sub: 'Delivery Jun 17' } },
];

type SatProps = { onDragStart: (e: ReactPointerEvent<HTMLElement>) => void };

function ClientPhone({ step, onDragStart }: { step: number } & SatProps) {
  return (
    <div className="aas-sat aas-phone" data-drag="phone" onPointerDown={onDragStart} aria-label="The client's LINE chat">
      <div className="aas-phone-screen">
        <div className="aas-phone-head">
          <span className="aas-phone-avatar" aria-hidden="true">TL</span>
          <span className="aas-phone-name"><b>Tim Lin Design</b><small>LINE Official</small></span>
        </div>
        <div className="aas-phone-thread">
          {CHAT.map((m, i) => (
            <div
              key={i}
              className={`aas-chat-msg is-${m.from}${m.step === step ? ' is-new' : ''}`}
              hidden={m.step > step}
              // New messages of a step land one after another.
              style={{ '--d': `${CHAT.filter((x, j) => j < i && x.step === m.step).length * 0.5 + 0.35}s` } as CSSProperties}
            >
              {m.text && <span className="aas-chat-bubble">{m.text}</span>}
              {m.card && (
                <span className="aas-chat-card">
                  <i className={m.card.icon} aria-hidden="true" />
                  <span><b>{m.card.title}</b><small>{m.card.sub}</small></span>
                </span>
              )}
              {m.chips && <span className="aas-chat-chips">{m.chips.map(c => <span key={c}>{c}</span>)}</span>}
              {m.time && <time>{m.time}</time>}
            </div>
          ))}
        </div>
        <div className="aas-phone-input" aria-hidden="true"><span>Aa</span></div>
      </div>
    </div>
  );
}

type FlowNode = { icon: string; label: string; tone: string };
const N = {
  line: { icon: 'ph-fill ph-chat-circle-text', label: 'LINE', tone: 'line' },
  router: { icon: 'ph-bold ph-git-branch', label: 'Router', tone: 'router' },
  reply: { icon: 'ph-fill ph-chat-circle-text', label: 'Reply', tone: 'line' },
  ai: { icon: 'ph-fill ph-sparkle', label: 'AI', tone: 'ai' },
  form: { icon: 'ph-fill ph-clipboard-text', label: 'Form', tone: 'form' },
  sheets: { icon: 'ph-fill ph-grid-four', label: 'Sheets', tone: 'sheets' },
  rss: { icon: 'ph-fill ph-browsers', label: 'RSS', tone: 'rss' },
  json: { icon: 'ph-fill ph-file-text', label: 'JSON', tone: 'json' },
  gmail: { icon: 'ph-fill ph-envelope-simple', label: 'Gmail', tone: 'mail' },
} satisfies Record<string, FlowNode>;

// The real scenarios' modules behind each screen (vendor-neutral names for
// the AI and the form tool).
const FLOWS: Record<string, { name: string; nodes: FlowNode[] }> = {
  sources: { name: 'LINE intake', nodes: [N.line, N.router, N.reply, N.ai] },
  intake: { name: 'Request form', nodes: [N.form, N.sheets, N.router] },
  ai: { name: 'AI brief', nodes: [N.rss, N.ai, N.json, N.sheets] },
  tracking: { name: 'Tracker sync', nodes: [N.sheets, N.router, N.line] },
  human: { name: 'Notify reviewer', nodes: [N.router, N.line, N.gmail] },
};

function FlowPanel({ id, on, onDragStart }: { id: string; on: boolean } & SatProps) {
  const flow = FLOWS[id];
  return (
    <div className={`aas-sat aas-front aas-flow${on ? ' is-on' : ''}`} data-drag="front" onPointerDown={onDragStart} aria-hidden={!on}>
      <div className="aas-sat-head">
        <MakeLogo size={14} />
        <span className="aas-sat-title">Scenario · <b>{flow.name}</b></span>
        <span className="aas-sat-run"><span className="aas-live-dot" />Running</span>
      </div>
      <ol className="aas-flow-nodes">
        {flow.nodes.map((n, i) => (
          <li key={i} className={`aas-flow-node tn-${n.tone}`} style={{ '--i': i } as CSSProperties}>
            <span className="aas-flow-dot"><i className={n.icon} aria-hidden="true" /></span>
            <span className="aas-flow-label">{n.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// What the build partner gets once the plan is set.
function HandoffCard({ on, onDragStart }: { on: boolean } & SatProps) {
  return (
    <div className={`aas-sat aas-front aas-handoff${on ? ' is-on' : ''}`} data-drag="front" onPointerDown={onDragStart} aria-hidden={!on}>
      <div className="aas-sat-head">
        <span className="aas-initials">AK</span>
        <span className="aas-sat-title">Handoff → <b>@dev.alex</b></span>
        <span className="aas-sat-run is-ok"><i className="ph-fill ph-check-circle" aria-hidden="true" />Shared</span>
      </div>
      <ul className="aas-handoff-list">
        <li style={{ '--i': 0 } as CSSProperties}><i className="ph-fill ph-frame-corners" aria-hidden="true" /><span><b>{TICKET} Onboarding</b><small>Figma · 12 frames</small></span></li>
        <li style={{ '--i': 1 } as CSSProperties}><i className="ph-fill ph-file-text" aria-hidden="true" /><span><b>Specs &amp; tokens</b><small>From the design system</small></span></li>
        <li style={{ '--i': 2 } as CSSProperties}><i className="ph-fill ph-clock" aria-hidden="true" /><span><b>Build Jun 12–17</b><small>Review on Jun 13</small></span></li>
      </ul>
    </div>
  );
}

// Desktop: the phone and the front panel can be dragged around the viewer.
// The offset is a CSS variable pair (--dx / --dy) written straight to the
// DOM, no re-render per move. All front panels share one offset, so the
// next step's panel shows up wherever the last one was left.
const DRAG_MQ = '(min-width: 961px)';
type DragGroup = 'phone' | 'front';

function useSatDrag() {
  const offsets = useRef<Record<DragGroup, { x: number; y: number }>>({ phone: { x: 0, y: 0 }, front: { x: 0, y: 0 } });
  return (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 || !window.matchMedia?.(DRAG_MQ).matches) return;
    const el = e.currentTarget;
    const group = el.dataset.drag as DragGroup;
    const peers = Array.from(el.parentElement?.querySelectorAll<HTMLElement>(`[data-drag="${group}"]`) ?? [el]);
    const start = { ...offsets.current[group] };
    const sx = e.clientX;
    const sy = e.clientY;
    // Keep it inside the viewer frame.
    const r = el.getBoundingClientRect();
    const box = el.closest('.ai-viewer')?.getBoundingClientRect();
    const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
    e.preventDefault();
    try { el.setPointerCapture?.(e.pointerId); } catch { /* synthetic pointer: no capture */ }
    el.classList.add('is-dragging');
    const move = (ev: PointerEvent) => {
      const dx = box ? clamp(ev.clientX - sx, box.left - r.left, box.right - r.right) : ev.clientX - sx;
      const dy = box ? clamp(ev.clientY - sy, box.top - r.top, box.bottom - r.bottom) : ev.clientY - sy;
      const pos = { x: start.x + dx, y: start.y + dy };
      offsets.current[group] = pos;
      peers.forEach(p => {
        p.style.setProperty('--dx', `${pos.x}px`);
        p.style.setProperty('--dy', `${pos.y}px`);
      });
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
  };
}

/* ── Window ─────────────────────────────────────────────── */

const SCREENS: Record<string, (p: { active: boolean; t: T }) => ReactNode> = {
  sources: InboxScreen,
  intake: IntakeScreen,
  ai: BriefScreen,
  tracking: TrackerScreen,
  human: ReviewScreen,
  workflow: WorkflowScreen,
};

// No in-window sidebar: the pill rail beside the window already is the
// navigation (a sidebar listing the same six steps was tried and dropped as
// redundant). The title bar names the open screen instead.
export default function AiAppStage({ steps, active }: {
  steps: AiStageStep[];
  active: string | null;
}) {
  const { t } = useLang();
  const tt = t as unknown as T;
  // No cursor-following tint/glow/edge ring: the window stays a calm
  // screenshot; only the hover radar ripple (CSS) remains.
  const step = Math.max(0, steps.findIndex(s => s.id === active));
  const onDragStart = useSatDrag();
  const current = active ?? steps[0]?.id;
  return (
    <>
    <div className="aas-window">
      <div className="aas-titlebar">
        <span className="aas-lights" aria-hidden="true"><i /><i /><i /></span>
        {/* Every screen is the same request, DR-248, moving through the system. */}
        <span className="aas-title">
          <span className="aas-title-root">Intake System<span className="aas-title-sep">/</span></span>
          <span className="aas-title-ticket">{TICKET}<span className="aas-title-sep">/</span></span>
          <b>{active ? NAV_LABELS[active] : 'Inbox'}</b>
        </span>
        <span className="aas-status"><span className="aas-live-dot" />Live</span>
      </div>
      <div className="aas-body">
        <div className="aas-main">
          {steps.map(s => {
            const Screen = SCREENS[s.id];
            const isActive = active === s.id;
            return (
              <section
                key={s.id}
                id={`ai-stage-${s.id}`}
                className={`aas-screen${isActive ? ' is-active' : ''}`}
                aria-label={s.title}
                aria-hidden={!isActive}
              >
                {Screen && <Screen active={isActive} t={tt} />}
              </section>
            );
          })}
        </div>
      </div>
    </div>
    <ClientPhone step={step} onDragStart={onDragStart} />
    {Object.keys(FLOWS).map(id => <FlowPanel key={id} id={id} on={current === id} onDragStart={onDragStart} />)}
    <HandoffCard on={current === 'workflow'} onDragStart={onDragStart} />
    </>
  );
}
