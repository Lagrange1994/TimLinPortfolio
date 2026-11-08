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
// The mockup's UI copy is bilingual (COPY below); content shared with the
// step cards comes from the ai_* translation keys.

export type AiStageStep = { id: string; title: string };

type T = Record<string, string>;
type ScreenProps = { active: boolean; t: T; c: Copy };

// The one request every screen follows: Celine's LINE message (Inbox) →
// form (Intake) → brief → tracker row → review → workflow plan.
const TICKET = 'DR-248';
const ARRIVED_AT = '10:42'; // the LINE message's timestamp, shown in Inbox + Intake
const FORM_AT = '10:58'; // when Celine sent the request form the bot replied with

// The mockup's own UI copy, both languages. Proper nouns (LINE, Make,
// Sheets, Figma, Gmail, RSS, JSON, DR-248, UI/UX, Web/App, P1, OKR, names
// and handles) stay as they are in Chinese too. Longer content shared with
// the step cards lives in translations.ts (the ai_* keys).
const COPY_EN = {
  nav: { sources: 'Inbox', intake: 'Intake', ai: 'AI Brief', tracking: 'Tracker', human: 'Review', workflow: 'Workflow' } as Record<string, string>,
  system: 'Intake System',
  live: 'Live',
  // Inbox
  inboxMeta: 'new · LINE OA · auto-routed',
  keywordRouter: 'Keyword router',
  isNew: 'New',
  filedAs: 'Filed as',
  unread: 'unread',
  routes: { uiux: 'UI/UX form', quote: 'Quote form', graphic: 'Graphic form', ai: 'AI expand', services: 'Services', human: 'To Tim' },
  inbox: [
    'Onboarding redesign for the new tier — Jun 17?',
    'How much for a 5-page website?',
    'New logo and menu for our café',
    'A booking app for my gym? Not sure what we need',
    'What kind of design work do you take on?',
    'Can I talk to Tim directly?',
  ],
  yesterday: 'Yday',
  monday: 'Mon',
  // Intake
  formMeta: 'UI/UX form',
  bubble: 'Hi Tim — we need the onboarding redesigned for the new pricing tier before Jun 17. It\'s on the Q3 OKR. Can you take it?',
  autoReply: 'Auto-reply',
  requestForm: 'UI/UX request form',
  fieldVals: ['LINE — @pm.celine', 'Web/App · Mobile', 'Redesign onboarding for new pricing tier', 'Jun 03 — Jun 17', 'P1 — Quarterly OKR', 'celine.h@firm.co'],
  high: 'HIGH',
  // Brief
  briefTitle: 'AI Brief · DR-248',
  briefMeta: 'Brief ready · 4.2s · saved to Sheets',
  draft: 'AI · Draft',
  trendRefs: 'Trend refs · RSS',
  trends: ['Pricing tables that explain, not upsell', 'Progressive onboarding checklists'],
  // Tracker
  records: 'records · Google Sheets',
  synced: 'Synced · just now',
  stats: ['New', 'In progress', 'Review', 'Done'],
  intake7d: 'Intake · 7 days',
  week: (w: number, d: number) => `<b>${w}</b> this week · <b>${d}</b> today`,
  perDay: 'Requests per day, last 7 days',
  cols: ['ID', 'Form', 'Type', 'Status', 'Updated'],
  forms: { uiux: 'UI/UX form', graphic: 'Graphic form', web: 'Web form' },
  graphic: 'Graphic',
  status: { brief: 'Brief ready', review: 'Review', done: 'Done', progress: 'In progress' },
  when: ['just now', '1h', '1d', '2d'],
  // Review
  reviewer: 'Reviewer · Tim Lin ·',
  due: 'Due Jun 17',
  approved: 'Approved · 11:05',
  reviewing: 'Reviewing',
  sentToYou: 'Brief sent to you · LINE + Gmail ·',
  gaps: (g: number, r: number, k: number) => `<b>${g}</b> gaps → <b>${r}</b> resolved, <b>${k}</b> risks`,
  // Workflow
  wfMeta: 'Approved in Review · kickoff Jun 03',
  eta: 'ETA Jun 17',
  figmaReady: 'Figma file ready ·',
  figmaPages: '· pages from the design system',
  phaseDates: ['Jun 03–04', 'Jun 05–06', 'Jun 07–11', 'Jun 12–13', 'Jun 14–17'],
  // Client phone
  phoneLabel: "The client's LINE chat",
  official: 'LINE Official',
  chat: {
    hi: 'Hi Celine! What do you need?',
    chips: ['Quote', 'UI/UX form', 'Talk to Tim'],
    form: ['UI/UX request form', 'About 3 min'],
    sent: 'Done, form sent.',
    questions: ['3 quick questions', 'Before we start'],
    answered: 'Answered all three.',
    progress: ['In progress', 'Track it any time'],
    approved: ['Brief approved', 'By Tim · 11:05'],
    kickoff: ['Kickoff Jun 03', 'Delivery Jun 17'],
  },
  // Make panel + handoff
  scenario: 'Scenario ·',
  running: 'Running',
  flowNames: { sources: 'LINE intake', intake: 'Request form', ai: 'AI brief', tracking: 'Tracker sync', human: 'Notify reviewer' } as Record<string, string>,
  nodes: { router: 'Router', reply: 'Reply', form: 'Form' },
  handoff: 'Handoff →',
  shared: 'Shared',
  handoffItems: [
    ['DR-248 Onboarding', 'Figma · 12 frames'],
    ['Specs & tokens', 'From the design system'],
    ['Build Jun 12–17', 'Review on Jun 13'],
  ],
};
type Copy = typeof COPY_EN;
const COPY_ZH: Copy = {
  // App chrome (title bar, mono meta lines, chips, stat and column labels,
  // system states, dates) reads like the product's own UI: English.
  nav: COPY_EN.nav,
  system: COPY_EN.system,
  live: COPY_EN.live,
  inboxMeta: COPY_EN.inboxMeta,
  keywordRouter: COPY_EN.keywordRouter,
  isNew: COPY_EN.isNew,
  filedAs: '已建檔為',
  unread: '未讀',
  routes: { uiux: 'UI/UX 表單', quote: '報價表單', graphic: '平面設計表單', ai: 'AI 整理', services: '服務總覽', human: '轉接 Tim' },
  inbox: [
    '新方案的導覽流程要改版，6/17 前可以嗎？',
    '做一個 5 頁的網站大概多少錢？',
    '小店想換新 logo 和品牌設計',
    '想做健身房預約 App，但不確定需要什麼',
    '請問你們接哪些類型的設計案？',
    '可以直接找 Tim 談嗎？',
  ],
  yesterday: '週二',
  monday: '週一',
  formMeta: COPY_EN.formMeta,
  bubble: 'Hi Tim，新的定價方案上線前，要先改版新用戶導覽，6/17 前要完成，這是 Q3 的 OKR。可以接嗎？',
  autoReply: COPY_EN.autoReply,
  requestForm: 'UI/UX 需求表單',
  fieldVals: ['LINE — @pm.celine', 'Web/App · 行動版', '為新定價方案改版新用戶導覽', '6/03 — 6/17', 'P1 — Q3 OKR', 'celine.h@firm.co'],
  high: '高',
  briefTitle: 'AI 簡報 · DR-248',
  briefMeta: COPY_EN.briefMeta,
  draft: COPY_EN.draft,
  trendRefs: COPY_EN.trendRefs,
  trends: ['說明清楚、不硬推銷的價格表', '漸進式的新手導覽清單'],
  records: COPY_EN.records,
  synced: COPY_EN.synced,
  stats: COPY_EN.stats,
  intake7d: COPY_EN.intake7d,
  week: COPY_EN.week,
  perDay: '近 7 天每日需求數',
  cols: COPY_EN.cols,
  forms: { uiux: 'UI/UX 表單', graphic: '平面設計表單', web: '網站表單' },
  graphic: '平面設計',
  status: { brief: '簡報完成', review: '審查中', done: '已完成', progress: '進行中' },
  when: ['1 分鐘前', '1 小時', '1 天', '2 天'],
  reviewer: COPY_EN.reviewer,
  due: COPY_EN.due,
  approved: COPY_EN.approved,
  reviewing: COPY_EN.reviewing,
  sentToYou: COPY_EN.sentToYou,
  gaps: COPY_EN.gaps,
  wfMeta: COPY_EN.wfMeta,
  eta: COPY_EN.eta,
  figmaReady: COPY_EN.figmaReady,
  figmaPages: COPY_EN.figmaPages,
  phaseDates: COPY_EN.phaseDates,
  phoneLabel: '客戶的 LINE 對話',
  official: 'LINE 官方帳號',
  chat: {
    hi: 'Hi Celine！請問需要什麼服務？',
    chips: ['報價', 'UI/UX 表單', '找 Tim'],
    form: ['UI/UX 需求表單', '約 3 分鐘'],
    sent: '填好了，已送出。',
    questions: ['開工前想先確認 3 件事', '請回覆'],
    answered: '三題都回覆了。',
    progress: ['進行中', '隨時可查進度'],
    approved: ['簡報已通過', 'Tim · 11:05'],
    kickoff: ['6/03 開工', '6/17 交付'],
  },
  // The Make panel stays in English: it's Make's own UI, mostly product names.
  scenario: COPY_EN.scenario,
  running: COPY_EN.running,
  flowNames: COPY_EN.flowNames,
  nodes: COPY_EN.nodes,
  handoff: '交接 →',
  shared: '已分享',
  handoffItems: [
    ['DR-248 Onboarding', 'Figma · 12 個畫面'],
    ['規格與 tokens', '來自設計系統'],
    ['6/12–17 開發', '6/13 檢查'],
  ],
};
const COPY: Record<string, Copy> = { en: COPY_EN, zh: COPY_ZH };

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
  uiux: { icon: 'ph-fill ph-clipboard-text', tone: 'form' },
  quote: { icon: 'ph-fill ph-currency-circle-dollar', tone: 'note' },
  graphic: { icon: 'ph-fill ph-palette', tone: 'slack' },
  ai: { icon: 'ph-fill ph-sparkle', tone: 'ai' },
  services: { icon: 'ph-fill ph-squares-four', tone: 'mail' },
  human: { icon: 'ph-fill ph-users-three', tone: 'line' },
} as const;
// Message text is COPY.inbox[i]; 'yday' / 'mon' are translated times.
const INBOX: { route: keyof typeof ROUTES; from: string; time: string }[] = [
  // Row 0 is DR-248's source message — it gets the UI/UX request form.
  { route: 'uiux', from: '@pm.celine', time: ARRIVED_AT },
  { route: 'quote', from: '@studio.kai', time: '10:16' },
  { route: 'graphic', from: '@mei.bakery', time: '09:51' },
  { route: 'ai', from: '@ryan.fit', time: '08:30' },
  { route: 'services', from: '@amy.hr', time: 'yday' },
  { route: 'human', from: '@jason.ops', time: 'mon' },
];
const msgTime = (time: string, c: Copy) => (time === 'yday' ? c.yesterday : time === 'mon' ? c.monday : time);

function InboxScreen({ active, t, c }: ScreenProps) {
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
          <p className="aas-meta"><span className="aas-count">{INBOX.length}</span> {c.inboxMeta}</p>
        </div>
        <div className="aas-chips">
          <span className="aas-chip"><MakeLogo size={12} /> {c.keywordRouter}</span>
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
                  {i === 0 && <span className="aas-msg-new">{c.isNew}</span>}
                  {i === 0 && (
                    <span className="aas-msg-ticket" title={`${c.filedAs} ${TICKET}`}>
                      <i className="ph-bold ph-arrow-right" aria-hidden="true" />{TICKET}
                    </span>
                  )}
                </span>
                <span className="aas-msg-text">{c.inbox[i]}</span>
              </span>
              <span className="aas-msg-side">
                <span className="aas-msg-time">{msgTime(m.time, c)}</span>
                {/* The auto-reply the router sent back. */}
                <span className={`aas-msg-route rt-${r.tone}`} title={c.routes[m.route]}><i className={r.icon} aria-hidden="true" /><span className="aas-msg-route-label">{c.routes[m.route]}</span></span>
              </span>
              {i < 2 && <span className="aas-unread" aria-label={c.unread} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── 02 Intake ──────────────────────────────────────────── */

function IntakeScreen({ active, t, c }: ScreenProps) {
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
  const labels = [t.ai_f_source, t.ai_f_projtype, t.ai_f_goal, t.ai_f_timeline, t.ai_f_priority_lbl, t.ai_f_contact];
  const fields: [string, ReactNode][] = labels.map((l, i) => [l, c.fieldVals[i]]);
  return (
    <div ref={ref} className="aas-screen-inner">
      <header className="aas-screen-head">
        <div>
          <h4>{t.ai_d_req_form}</h4>
          <p className="aas-meta">{c.formMeta} · {FORM_AT} · <MakeLogo size={13} /> → Sheets</p>
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
            <p>{c.bubble}</p>
            <span className="aas-bubble-time">{ARRIVED_AT}</span>
          </div>
          <div className="aas-reply">
            <span className="aas-reply-tag">{c.autoReply}</span>
            <span className="aas-reply-card"><i className="ph-fill ph-clipboard-text" aria-hidden="true" />{c.requestForm}<i className="ph-bold ph-arrow-right" aria-hidden="true" /></span>
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
                {i === 4 && <span className="aas-badge is-danger">{c.high}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 03 AI Brief ────────────────────────────────────────── */

function BriefScreen({ active, t, c }: ScreenProps) {
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
          <h4>{c.briefTitle}</h4>
          <p className="aas-meta aas-ai-state"><i className="ph-fill ph-check-circle" aria-hidden="true" /> {c.briefMeta}</p>
        </div>
        <span className="aas-chip is-accent"><i className="ph-fill ph-sparkle" aria-hidden="true" /> {c.draft}</span>
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
            <span className="aas-conf-row"><b>P1 · {c.high}</b><span><span className="aas-conf-num">87</span>%</span></span>
            <span className="aas-conf-bar"><span className="aas-conf-fill" style={{ width: '87%' }} /></span>
          </div>
          <div className="aas-block is-ok">
            <h5><i className="ph-bold ph-arrow-circle-right" aria-hidden="true" />{t.ai_d_direction_lbl}</h5>
            <p>{t.ai_d_direction_text}</p>
          </div>
          {/* The flow reads current design-trend articles (RSS) into the
              prompt, so the brief cites what it leaned on. */}
          <div className="aas-block is-trend">
            <h5><i className="ph-fill ph-file-text" aria-hidden="true" />{c.trendRefs}</h5>
            <ul className="aas-trends">
              {c.trends.map(a => <li key={a}>{a}</li>)}
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
// Labels: COPY.stats, same order.
const STATS = [
  { n: 6, tone: 'info' },
  { n: 14, tone: 'ok' },
  { n: 9, tone: 'warn' },
  { n: 113, tone: 'muted' },
];
const RECORDS = STATS.reduce((sum, s) => sum + s.n, 0);
// Requests filed per day, last 7 days; today is a morning so far — the four
// Inbox messages stamped today.
const INTAKE_7D = [9, 12, 8, 14, 11, 7, 4];
// DR-248 has just come out of AI Brief and waits for review.
// `src` is the request form the LINE bot sent; `type` the form router's
// two case lanes (Web/App UI gets the AI brief + Figma file).
const rowsFor = (c: Copy) => [
  { id: TICKET, src: c.forms.uiux, type: 'Web/App UI', status: c.status.brief, tone: 'now', when: c.when[0] },
  { id: 'DR-247', src: c.forms.graphic, type: c.graphic, status: c.status.review, tone: 'warn', when: c.when[1] },
  { id: 'DR-246', src: c.forms.web, type: 'Web/App UI', status: c.status.done, tone: 'muted', when: c.when[2] },
  { id: 'DR-245', src: c.forms.graphic, type: c.graphic, status: c.status.progress, tone: 'ok', when: c.when[3] },
];

function TrackerScreen({ active, t, c }: ScreenProps) {
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
          <p className="aas-meta"><span className="aas-records">{RECORDS}</span> {c.records}</p>
        </div>
        <span className="aas-chip aas-sync-pill"><span className="aas-live-dot" />{c.synced}</span>
      </header>
      <div className="aas-stats">
        {STATS.map((s, i) => (
          <div key={s.tone} className={`aas-stat is-${s.tone}`}>
            <span className="aas-stat-label">{c.stats[i]}</span>
            <span className="aas-stat-num">{s.n}</span>
            {/* Share of all records. */}
            <span className="aas-stat-bar"><span className="aas-stat-fill" style={{ width: `${Math.max(4, Math.round((s.n / RECORDS) * 100))}%` }} /></span>
          </div>
        ))}
      </div>
      <div className="aas-spark" role="img" aria-label={`${c.perDay}: ${INTAKE_7D.join(', ')}`}>
        <span className="aas-spark-head">
          <span className="aas-stat-label"><i className="ph-fill ph-chart-bar" aria-hidden="true" /> {c.intake7d}</span>
          <span className="aas-spark-sum" dangerouslySetInnerHTML={{ __html: c.week(INTAKE_7D.reduce((a, b) => a + b, 0), INTAKE_7D[INTAKE_7D.length - 1]) }} />
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
          {c.cols.map(h => <span key={h} role="columnheader">{h}</span>)}
        </div>
        {rowsFor(c).map(r => (
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

function ReviewScreen({ active, t, c }: ScreenProps) {
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
          <p className="aas-meta"><span className="aas-initials" aria-hidden="true">TL</span>{c.reviewer} <i className="ph-bold ph-clock" aria-hidden="true" /> {c.due}</p>
        </div>
        <span className="aas-approve">
          <span className="aas-approve-done"><i className="ph-fill ph-check-circle" aria-hidden="true" /> {c.approved}</span>
          <span className="aas-approve-wait"><span className="aas-dots"><i /><i /><i /></span> {c.reviewing}</span>
        </span>
      </header>
      {/* How the brief reached Tim: the flow pushes it to his own LINE and
          Gmail. Of its three gaps, the success metric is settled here
          (strategy row); the other two stay open as risks. */}
      <p className="aas-from">
        <i className="ph-fill ph-envelope-simple" aria-hidden="true" />
        {c.sentToYou} <span dangerouslySetInnerHTML={{ __html: c.gaps(3, 1, 2) }} />
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
// Dates: COPY.phaseDates.

function WorkflowScreen({ active, t, c }: ScreenProps) {
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
          <p className="aas-meta"><i className="ph-fill ph-check-circle" aria-hidden="true" /> {c.wfMeta}</p>
        </div>
        <span className="aas-chip"><i className="ph-fill ph-rocket-launch" aria-hidden="true" /> {c.eta}</span>
      </header>
      {/* Web/App UI cases also get a Figma file, built by the flow from the
          design system — the Design phase starts from it, not a blank page. */}
      <p className="aas-from">
        <i className="ph-fill ph-frame-corners" aria-hidden="true" />
        {c.figmaReady} <b>DR-248 Onboarding</b> {c.figmaPages}
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
              <span className="aas-phase-date">{c.phaseDates[i]}</span>
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
const chatFor = (c: Copy): ChatMsg[] => {
  const card = (icon: string, [title, sub]: string[]) => ({ icon, title, sub });
  return [
    { step: 0, from: 'me', text: c.inbox[0], time: ARRIVED_AT },
    { step: 0, from: 'oa', text: c.chat.hi, chips: c.chat.chips },
    { step: 1, from: 'oa', card: card('ph-fill ph-clipboard-text', c.chat.form) },
    { step: 1, from: 'me', text: c.chat.sent, time: FORM_AT },
    { step: 2, from: 'oa', card: card('ph-fill ph-sparkle', c.chat.questions) },
    { step: 3, from: 'me', text: c.chat.answered, time: '11:01' },
    { step: 3, from: 'oa', card: card('ph-fill ph-chart-bar', [`${TICKET} · ${c.chat.progress[0]}`, c.chat.progress[1]]) },
    { step: 4, from: 'oa', card: card('ph-fill ph-check-circle', c.chat.approved) },
    { step: 5, from: 'oa', card: card('ph-fill ph-rocket-launch', c.chat.kickoff) },
  ];
};

type SatProps = { onDragStart: (e: ReactPointerEvent<HTMLElement>) => void };

function ClientPhone({ step, c, onDragStart }: { step: number; c: Copy } & SatProps) {
  const chat = chatFor(c);
  return (
    <div className="aas-sat aas-phone" data-drag="phone" onPointerDown={onDragStart} aria-label={c.phoneLabel}>
      <div className="aas-phone-screen">
        <div className="aas-phone-head">
          <span className="aas-phone-avatar" aria-hidden="true">TL</span>
          <span className="aas-phone-name"><b>Tim Lin Design</b><small>{c.official}</small></span>
        </div>
        <div className="aas-phone-thread">
          {chat.map((m, i) => (
            <div
              key={i}
              className={`aas-chat-msg is-${m.from}${m.step === step ? ' is-new' : ''}`}
              hidden={m.step > step}
              // New messages of a step land one after another.
              style={{ '--d': `${chat.filter((x, j) => j < i && x.step === m.step).length * 0.5 + 0.35}s` } as CSSProperties}
            >
              {m.text && <span className="aas-chat-bubble">{m.text}</span>}
              {m.card && (
                <span className="aas-chat-card">
                  <i className={m.card.icon} aria-hidden="true" />
                  <span><b>{m.card.title}</b><small>{m.card.sub}</small></span>
                </span>
              )}
              {m.chips && <span className="aas-chat-chips">{m.chips.map(x => <span key={x}>{x}</span>)}</span>}
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
  router: { icon: 'ph-bold ph-git-branch', label: 'router', tone: 'router' },
  reply: { icon: 'ph-fill ph-chat-circle-text', label: 'reply', tone: 'line' },
  ai: { icon: 'ph-fill ph-sparkle', label: 'AI', tone: 'ai' },
  form: { icon: 'ph-fill ph-clipboard-text', label: 'form', tone: 'form' },
  sheets: { icon: 'ph-fill ph-grid-four', label: 'Sheets', tone: 'sheets' },
  rss: { icon: 'ph-fill ph-browsers', label: 'RSS', tone: 'rss' },
  json: { icon: 'ph-fill ph-file-text', label: 'JSON', tone: 'json' },
  gmail: { icon: 'ph-fill ph-envelope-simple', label: 'Gmail', tone: 'mail' },
} satisfies Record<string, FlowNode>;

// The real scenarios' modules behind each screen (vendor-neutral names for
// the AI and the form tool). Names: COPY.flowNames; a lower-case node label
// is a COPY.nodes key, the rest are product names.
const FLOWS: Record<string, FlowNode[]> = {
  sources: [N.line, N.router, N.reply, N.ai],
  intake: [N.form, N.sheets, N.router],
  ai: [N.rss, N.ai, N.json, N.sheets],
  tracking: [N.sheets, N.router, N.line],
  human: [N.router, N.line, N.gmail],
};
const nodeLabel = (label: string, c: Copy) => c.nodes[label as keyof Copy['nodes']] ?? label;

function FlowPanel({ id, on, c, onDragStart }: { id: string; on: boolean; c: Copy } & SatProps) {
  return (
    <div className={`aas-sat aas-front aas-flow${on ? ' is-on' : ''}`} data-drag="front" onPointerDown={onDragStart} aria-hidden={!on}>
      <div className="aas-sat-head">
        <MakeLogo size={14} />
        <span className="aas-sat-title">{c.scenario} <b>{c.flowNames[id]}</b></span>
        <span className="aas-sat-run"><span className="aas-live-dot" />{c.running}</span>
      </div>
      <ol className="aas-flow-nodes">
        {FLOWS[id].map((n, i) => (
          <li key={i} className={`aas-flow-node tn-${n.tone}`} style={{ '--i': i } as CSSProperties}>
            <span className="aas-flow-dot"><i className={n.icon} aria-hidden="true" /></span>
            <span className="aas-flow-label">{nodeLabel(n.label, c)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// What the build partner gets once the plan is set.
const HANDOFF_ICONS = ['ph-fill ph-frame-corners', 'ph-fill ph-file-text', 'ph-fill ph-clock'];

function HandoffCard({ on, c, onDragStart }: { on: boolean; c: Copy } & SatProps) {
  return (
    <div className={`aas-sat aas-front aas-handoff${on ? ' is-on' : ''}`} data-drag="front" onPointerDown={onDragStart} aria-hidden={!on}>
      <div className="aas-sat-head">
        <span className="aas-initials">AK</span>
        <span className="aas-sat-title">{c.handoff} <b>@dev.alex</b></span>
        <span className="aas-sat-run is-ok"><i className="ph-fill ph-check-circle" aria-hidden="true" />{c.shared}</span>
      </div>
      <ul className="aas-handoff-list">
        {c.handoffItems.map(([title, sub], i) => (
          <li key={i} style={{ '--i': i } as CSSProperties}><i className={HANDOFF_ICONS[i]} aria-hidden="true" /><span><b>{title}</b><small>{sub}</small></span></li>
        ))}
      </ul>
    </div>
  );
}

// Desktop: the app window, the phone and the front panel can be dragged
// around the viewer. The offset is a CSS variable pair (--dx / --dy)
// written straight to the DOM, no re-render per move. All front panels
// share one offset, so the next step's panel shows up wherever the last
// one was left.
const DRAG_MQ = '(min-width: 961px)';
type DragGroup = 'window' | 'phone' | 'front';

function useSatDrag() {
  const offsets = useRef<Record<DragGroup, { x: number; y: number }>>({ window: { x: 0, y: 0 }, phone: { x: 0, y: 0 }, front: { x: 0, y: 0 } });
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

const SCREENS: Record<string, (p: ScreenProps) => ReactNode> = {
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
  const { t, lang } = useLang();
  const tt = t as unknown as T;
  const c = COPY[lang] ?? COPY_EN;
  // No cursor-following tint/glow/edge ring: the window stays a calm
  // screenshot; only the hover radar ripple (CSS) remains.
  const step = Math.max(0, steps.findIndex(s => s.id === active));
  const onDragStart = useSatDrag();
  const current = active ?? steps[0]?.id;
  return (
    <>
    <div className="aas-window" data-drag="window" onPointerDown={onDragStart}>
      <div className="aas-titlebar">
        <span className="aas-lights" aria-hidden="true"><i /><i /><i /></span>
        {/* Every screen is the same request, DR-248, moving through the system. */}
        <span className="aas-title">
          <span className="aas-title-root">{c.system}<span className="aas-title-sep">/</span></span>
          <span className="aas-title-ticket">{TICKET}<span className="aas-title-sep">/</span></span>
          <b>{c.nav[active ?? 'sources']}</b>
        </span>
        <span className="aas-status"><span className="aas-live-dot" />{c.live}</span>
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
                {Screen && <Screen active={isActive} t={tt} c={c} />}
              </section>
            );
          })}
        </div>
      </div>
    </div>
    <ClientPhone step={step} c={c} onDragStart={onDragStart} />
    {Object.keys(FLOWS).map(id => <FlowPanel key={id} id={id} on={current === id} c={c} onDragStart={onDragStart} />)}
    <HandoffCard on={current === 'workflow'} c={c} onDragStart={onDragStart} />
    </>
  );
}
