import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
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

const INBOX = [
  { ch: 'line', icon: 'ph-fill ph-chat-circle-text', from: 'LINE · @pm.celine', text: 'Onboarding redesign for the new tier — Jun 17?', time: '2m' },
  { ch: 'mail', icon: 'ph-fill ph-envelope-simple', from: 'Email · celine.h@firm.co', text: 'Quick question on tier-2 pricing visuals', time: '28m' },
  { ch: 'form', icon: 'ph-fill ph-clipboard-text', from: 'Form · Brief intake', text: 'Tier-2 pricing experiment — marketing', time: '1h' },
  { ch: 'slack', icon: 'ph-fill ph-hash', from: 'Slack · #design-requests', text: 'Mobile sign-up flow — usability review', time: '3h' },
  { ch: 'note', icon: 'ph-fill ph-note-pencil', from: 'Manual · Kickoff notes', text: 'In-person — Q3 roadmap dependencies', time: '1d' },
  { ch: 'mail', icon: 'ph-fill ph-envelope-simple', from: 'Email · ops@firm.co', text: 'Asset handoff checklist for the Q3 launch', time: '2d' },
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
      .fromTo(q('.aas-count'), { scale: 1.4 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', immediateRender: false }, 1.4);
  }, []);
  return (
    <div ref={ref} className="aas-screen-inner">
      <header className="aas-screen-head">
        <div>
          <h4>{t.ai_d_recent}</h4>
          <p className="aas-meta"><span className="aas-count">{INBOX.length}</span> new · 4 channels</p>
        </div>
        <div className="aas-chips">
          {['LINE', 'Email', 'Form', 'Slack'].map(c => <span key={c} className="aas-chip">{c}</span>)}
        </div>
      </header>
      <div className="aas-toast" aria-hidden="true"><i className="ph-fill ph-chat-circle-text" /> {t.ai_sources_loading}</div>
      <ul className="aas-inbox">
        {INBOX.map((m, i) => (
          <li key={m.from} className={`aas-msg ch-${m.ch}`}>
            <span className="aas-msg-icon"><i className={m.icon} /></span>
            <span className="aas-msg-body">
              <span className="aas-msg-from">{m.from}{i === 0 && <span className="aas-msg-new">New</span>}</span>
              <span className="aas-msg-text">{m.text}</span>
            </span>
            <span className="aas-msg-time">{m.time}</span>
            {i < 2 && <span className="aas-unread" aria-label="unread" />}
          </li>
        ))}
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
    [t.ai_f_projtype, 'Product UI · Mobile'],
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
          <p className="aas-meta">Auto-filled from LINE · <MakeLogo size={13} /> webhook</p>
        </div>
        <div className="aas-progress">
          <span className="aas-progress-label">{t.ai_f_complete}</span>
          <span className="aas-progress-bar"><span className="aas-progress-fill" /></span>
          <i className="ph-fill ph-check-circle aas-progress-check" aria-hidden="true" />
        </div>
      </header>
      <div className="aas-intake">
        <div className="aas-bubble">
          <div className="aas-bubble-from"><span className="aas-avatar ch-line"><i className="ph-fill ph-chat-circle-text" /></span>Celine · PM <em>LINE</em></div>
          <p>Hi Tim — we need the onboarding redesigned for the new pricing tier before Jun 17. It&apos;s on the Q3 OKR. Can you take it?</p>
          <span className="aas-bubble-time">10:42</span>
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
          <p className="aas-meta aas-ai-state"><i className="ph-fill ph-check-circle" aria-hidden="true" /> Brief ready · 4.2s</p>
        </div>
        <span className="aas-chip is-accent"><i className="ph-fill ph-sparkle" aria-hidden="true" /> Claude · Draft</span>
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
        </div>
        <aside className="aas-brief-side">
          <div className="aas-conf">
            <span className="aas-conf-label"><i className="ph-fill ph-grid-four" aria-hidden="true" />{t.ai_d_tasktype_lbl}</span>
            <span className="aas-conf-row"><b>Product UI</b><span><span className="aas-conf-num">92</span>%</span></span>
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
        </aside>
      </div>
    </div>
  );
}

/* ── 04 Tracker ─────────────────────────────────────────── */

const STATS = [
  { label: 'Active', n: 18, tone: 'ok' },
  { label: 'Review', n: 38, tone: 'info' },
  { label: 'Done', n: 72, tone: 'muted' },
  { label: 'Backlog', n: 14, tone: 'warn' },
];
const ROWS = [
  { id: 'DR-248', src: 'LINE', type: 'Product UI', status: 'Active', tone: 'ok', when: 'just now' },
  { id: 'DR-247', src: 'Form', type: 'Graphic', status: 'Review', tone: 'info', when: '1h' },
  { id: 'DR-246', src: 'Email', type: 'UX Review', status: 'Done', tone: 'muted', when: '1d' },
  { id: 'DR-245', src: 'LINE', type: 'Research', status: 'Backlog', tone: 'warn', when: '2d' },
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
      .from(q('.aas-sync-pill'), { opacity: 0.3, duration: 0.3 }, 1.4);
    q('.aas-stat-num').forEach((el, i) => countUp(tl, el, 0.25 + i * 0.08, restore));
    countUp(tl, q('.aas-records')[0], 0.3, restore, 1.1);
  }, [t]);
  return (
    <div ref={ref} className="aas-screen-inner">
      <header className="aas-screen-head">
        <div>
          <h4>{t.ai_d_sheets_lbl}</h4>
          <p className="aas-meta"><span className="aas-records">142</span> records · Google Sheets</p>
        </div>
        <span className="aas-chip aas-sync-pill"><span className="aas-live-dot" />Synced · just now</span>
      </header>
      <div className="aas-stats">
        {STATS.map(s => (
          <div key={s.label} className={`aas-stat is-${s.tone}`}>
            <span className="aas-stat-label">{s.label}</span>
            <span className="aas-stat-num">{s.n}</span>
            <span className="aas-stat-bar"><span className="aas-stat-fill" style={{ width: `${Math.round((s.n / 72) * 100)}%` }} /></span>
          </div>
        ))}
      </div>
      <div className="aas-table" role="table" aria-label={t.ai_d_sheets_lbl}>
        <div className="aas-table-head" role="row">
          <span role="columnheader">ID</span><span role="columnheader">Source</span><span role="columnheader">Type</span><span role="columnheader">Status</span><span role="columnheader">Updated</span>
        </div>
        {ROWS.map(r => (
          <div key={r.id} className="aas-row" role="row">
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
          <p className="aas-meta">Reviewer · Tim Lin</p>
        </div>
        <span className="aas-approve">
          <span className="aas-approve-done"><i className="ph-fill ph-check-circle" aria-hidden="true" /> Approved</span>
          <span className="aas-approve-wait"><span className="aas-dots"><i /><i /><i /></span> Reviewing</span>
        </span>
      </header>
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

function WorkflowScreen({ active, t }: { active: boolean; t: T }) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(PHASE_STATIC);
  useEffect(() => {
    if (!active || prefersReduced()) return;
    let i = 0;
    const start = setTimeout(() => setPhase(0), 0);
    const id = setInterval(() => {
      i = (i + 1) % PHASE_ICONS.length;
      setPhase(i);
    }, 1700);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, [active]);
  useScreenIntro(active, ref, (tl, q) => {
    tl.from(q('.aas-screen-head > *'), { opacity: 0, y: 8, duration: 0.35, ease: 'power2.out', stagger: 0.06 }, 0)
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
          <p className="aas-meta">Onboarding · new pricing tier</p>
        </div>
        <span className="aas-chip"><i className="ph-fill ph-rocket-launch" aria-hidden="true" /> ETA Jun 17</span>
      </header>
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
              <span className={`aas-badge is-${key}`}>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
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
  return (
    <div className="aas-window">
      <div className="aas-titlebar">
        <span className="aas-lights" aria-hidden="true"><i /><i /><i /></span>
        <span className="aas-title"><span className="aas-title-root">Intake System<span className="aas-title-sep">/</span></span><b>{active ? NAV_LABELS[active] : 'Inbox'}</b></span>
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
  );
}
