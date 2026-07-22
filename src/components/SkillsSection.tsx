import { useEffect, useLayoutEffect, useState, useRef, useMemo, type ReactNode, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { gsap } from 'gsap';
import { useLang } from '../context/LangContext';
import BorderGlow from './BorderGlow';
import TypingCode, { flatten, toRuns, type CodeVersion, type CodeToken } from './TypingCode';
import AiFlowStepper from './AiFlowStepper';

const SMOOTH_TAU = 0.18;
const AI_THINK_MS = 700;

// Two "drafts" per tech-stack code preview — TypingCode loops between them,
// backspacing to wherever the next draft diverges and typing the rest
// forward, so the snippet reads as code actively being revised.
const CSS_CODE_A: CodeVersion = [
  [{ text: ':root', cls: 'tok-sel' }, { text: ' ' }, { text: '{', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: '--primary', cls: 'tok-prop' }, { text: ':', cls: 'tok-muted' }, { text: '   ' }, { text: '#6C63FF', cls: 'tok-val' }, { text: ';', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: '--secondary', cls: 'tok-prop' }, { text: ':', cls: 'tok-muted' }, { text: ' ' }, { text: '#FF6584', cls: 'tok-val' }, { text: ';', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: '--bg', cls: 'tok-prop' }, { text: ':', cls: 'tok-muted' }, { text: '        ' }, { text: '#121212', cls: 'tok-val' }, { text: ';', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: '--border', cls: 'tok-prop' }, { text: ':', cls: 'tok-muted' }, { text: '    ' }, { text: 'rgba', cls: 'tok-fn' }, { text: '(255,255,255,', cls: 'tok-muted' }, { text: '0.1', cls: 'tok-num' }, { text: ');', cls: 'tok-muted' }],
  [{ text: '}', cls: 'tok-muted' }],
];
const CSS_CODE_B: CodeVersion = [
  CSS_CODE_A[0],
  CSS_CODE_A[1],
  CSS_CODE_A[2],
  [{ text: '  ' }, { text: '--bg', cls: 'tok-prop' }, { text: ':', cls: 'tok-muted' }, { text: '        ' }, { text: '#0f0f10', cls: 'tok-val' }, { text: ';', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: '--border', cls: 'tok-prop' }, { text: ':', cls: 'tok-muted' }, { text: '    ' }, { text: 'rgba', cls: 'tok-fn' }, { text: '(255,255,255,', cls: 'tok-muted' }, { text: '0.12', cls: 'tok-num' }, { text: ');', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: '--radius', cls: 'tok-prop' }, { text: ':', cls: 'tok-muted' }, { text: '    ' }, { text: '14px', cls: 'tok-val' }, { text: ';', cls: 'tok-muted' }],
  [{ text: '}', cls: 'tok-muted' }],
];

const JS_CODE_A: CodeVersion = [
  [{ text: 'gsap', cls: 'tok-kw' }, { text: '.', cls: 'tok-muted' }, { text: 'to', cls: 'tok-fn' }, { text: '(', cls: 'tok-muted' }, { text: 'h1Words' }, { text: ', {', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: 'opacity', cls: 'tok-pink' }, { text: ':', cls: 'tok-muted' }, { text: ' ' }, { text: '1', cls: 'tok-num' }, { text: ',', cls: 'tok-muted' }, { text: ' ' }, { text: 'y', cls: 'tok-pink' }, { text: ':', cls: 'tok-muted' }, { text: ' ' }, { text: '0', cls: 'tok-num' }, { text: ',', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: 'duration', cls: 'tok-pink' }, { text: ':', cls: 'tok-muted' }, { text: ' ' }, { text: '1.0', cls: 'tok-num' }, { text: ',', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: 'ease', cls: 'tok-pink' }, { text: ':', cls: 'tok-muted' }, { text: '     ' }, { text: "'power3.out'", cls: 'tok-val' }, { text: ',', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: 'stagger', cls: 'tok-pink' }, { text: ':', cls: 'tok-muted' }, { text: '  ' }, { text: '0.11', cls: 'tok-num' }],
  [{ text: '})', cls: 'tok-muted' }],
];
const JS_CODE_B: CodeVersion = [
  JS_CODE_A[0],
  JS_CODE_A[1],
  [{ text: '  ' }, { text: 'duration', cls: 'tok-pink' }, { text: ':', cls: 'tok-muted' }, { text: ' ' }, { text: '0.8', cls: 'tok-num' }, { text: ',', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: 'ease', cls: 'tok-pink' }, { text: ':', cls: 'tok-muted' }, { text: '     ' }, { text: "'expo.out'", cls: 'tok-val' }, { text: ',', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: 'stagger', cls: 'tok-pink' }, { text: ':', cls: 'tok-muted' }, { text: '  ' }, { text: '0.08', cls: 'tok-num' }],
  JS_CODE_A[5],
];

const JSX_CODE_A: CodeVersion = [
  [{ text: '<', cls: 'tok-muted' }, { text: 'BorderGlow', cls: 'tok-sel' }],
  [{ text: '  ' }, { text: 'className', cls: 'tok-pink' }, { text: '=', cls: 'tok-muted' }, { text: '"process-card"', cls: 'tok-val' }],
  [{ text: '  ' }, { text: 'colors', cls: 'tok-pink' }, { text: '={[', cls: 'tok-muted' }, { text: "'#6C63FF'", cls: 'tok-val' }, { text: ',', cls: 'tok-muted' }, { text: ' ' }, { text: "'#FF6584'", cls: 'tok-val' }, { text: ']}', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: 'glowIntensity', cls: 'tok-pink' }, { text: '={', cls: 'tok-muted' }, { text: '1.1', cls: 'tok-num' }, { text: '}', cls: 'tok-muted' }],
  [{ text: '>', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: '{t[nameKey]}', cls: 'tok-fn' }],
  [{ text: '<', cls: 'tok-muted' }, { text: '/', cls: 'tok-muted' }, { text: 'BorderGlow', cls: 'tok-sel' }, { text: '>', cls: 'tok-muted' }],
];
const JSX_CODE_B: CodeVersion = [
  JSX_CODE_A[0],
  JSX_CODE_A[1],
  JSX_CODE_A[2],
  [{ text: '  ' }, { text: 'glowIntensity', cls: 'tok-pink' }, { text: '={', cls: 'tok-muted' }, { text: '1.3', cls: 'tok-num' }, { text: '}', cls: 'tok-muted' }],
  [{ text: '  ' }, { text: 'edgeSensitivity', cls: 'tok-pink' }, { text: '={', cls: 'tok-muted' }, { text: '20', cls: 'tok-num' }, { text: '}', cls: 'tok-muted' }],
  JSX_CODE_A[4],
  JSX_CODE_A[5],
  JSX_CODE_A[6],
];

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Splits the static `<span class="hl">...</span>`-annotated summary HTML
// (see translations.ts ai_d_summary_text) into typewriter tokens so the
// AI Brief card can type it out while keeping the highlight styling.
function tokenizeHighlight(html: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  const re = /<span class="hl">([^<]*)<\/span>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m.index > last) tokens.push({ text: html.slice(last, m.index) });
    tokens.push({ text: m[1], cls: 'hl' });
    last = m.index + m[0].length;
  }
  if (last < html.length) tokens.push({ text: html.slice(last) });
  return tokens;
}

function runsToHtml(runs: { text: string; cls?: string }[]) {
  return runs.map(r => (r.cls ? `<span class="${r.cls}">${escapeHtml(r.text)}</span>` : escapeHtml(r.text))).join('');
}

// Horizon UI–style badge/alert primitives (Tailwind utility classes) — the
// "How I Use AI" card details used to render this content via SGDS web
// components; class strings must stay fully literal (not template-built) so
// Tailwind's source scanner can find them.
type HColor = 'neutral' | 'purple' | 'cyan' | 'warning' | 'danger' | 'success' | 'info' | 'primary';

const BADGE_COLORS: Record<HColor, { solid: string; outline: string }> = {
  neutral: { solid: 'bg-white/10 text-white/70', outline: 'border border-white/25 text-white/70' },
  purple: { solid: 'bg-violet-400/15 text-violet-300', outline: 'border border-violet-400/40 text-violet-300' },
  cyan: { solid: 'bg-cyan-400/15 text-cyan-300', outline: 'border border-cyan-400/40 text-cyan-300' },
  warning: { solid: 'bg-amber-400/15 text-amber-300', outline: 'border border-amber-400/40 text-amber-300' },
  danger: { solid: 'bg-red-400/15 text-red-300', outline: 'border border-red-400/40 text-red-300' },
  success: { solid: 'bg-emerald-400/15 text-emerald-300', outline: 'border border-emerald-400/40 text-emerald-300' },
  info: { solid: 'bg-blue-400/15 text-blue-300', outline: 'border border-blue-400/40 text-blue-300' },
  primary: { solid: 'bg-indigo-400/15 text-indigo-300', outline: 'border border-indigo-400/40 text-indigo-300' },
};

function HBadge({ variant = 'neutral', outline = false, style, children }: { variant?: HColor; outline?: boolean; style?: CSSProperties; children: ReactNode }) {
  const c = BADGE_COLORS[variant] ?? BADGE_COLORS.neutral;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ${outline ? c.outline : c.solid}`} style={style}>
      {children}
    </span>
  );
}

const ALERT_COLORS: Record<string, string> = {
  neutral: 'border-white/15 bg-white/[0.04]',
  warning: 'border-amber-400/25 bg-amber-400/[0.06]',
  info: 'border-blue-400/25 bg-blue-400/[0.06]',
  success: 'border-emerald-400/25 bg-emerald-400/[0.06]',
};
const ALERT_ICON_COLORS: Record<string, string> = {
  neutral: 'bg-white/10 text-white/70',
  warning: 'bg-amber-400/15 text-amber-300',
  info: 'bg-blue-400/15 text-blue-300',
  success: 'bg-emerald-400/15 text-emerald-300',
};

function HAlert({ variant = 'neutral', icon, title, children }: { variant?: 'neutral' | 'warning' | 'info' | 'success'; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border p-3 ${ALERT_COLORS[variant] ?? ALERT_COLORS.neutral}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-sm ${ALERT_ICON_COLORS[variant] ?? ALERT_ICON_COLORS.neutral}`}>
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-white/80">{title}</span>
      </div>
      <div className="text-[13px] leading-relaxed text-white/70">{children}</div>
    </div>
  );
}

function HRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/10 py-2 text-[12.5px] last:border-0">
      <span className="text-white/50">{label}</span>
      <span className="text-right font-medium text-white/85">{children}</span>
    </div>
  );
}

function makeAiCards(t: Record<string, string>) {
  return [
    {
      id: 'sources',
      step: '01',
      variant: 'ai-cyan',
      badge: null as string | null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="6" cy="18" r="2.2" /><circle cx="18" cy="18" r="2.2" />
          <path d="M8.2 6h7.6M6 8.2v7.6M18 8.2v7.6M8.2 18h7.6" />
        </svg>
      ),
      title: 'Request Sources',
      summary: t.ai_sources_sum,
      tags: ['LINE', 'Email', 'Form', 'Slack'],
      pipeline: null as string[] | null,
      detail: (
        <div className="detail-section">
          <div className="channel-loader" aria-hidden="true">
            <span className="channel-loader-spinner" />
            <span className="channel-loader-text">{t.ai_sources_loading}</span>
          </div>
          <div className="msg-panel">
            <div className="msg-panel-head">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="6" cy="18" r="2.2" /><circle cx="18" cy="18" r="2.2" />
                <path d="M8.2 6h7.6M6 8.2v7.6M18 8.2v7.6M8.2 18h7.6" />
              </svg>
              <span>{t.ai_d_recent}</span>
            </div>
            <div className="channel-list">
              <div className="channel">
                <span className="ch-icon"><i className="ph-fill ph-chat-circle-text" /></span>
                <div className="ch-body">
                  <div className="ch-name">LINE · @pm.celine</div>
                  <div className="ch-snippet">Onboarding redesign for the new tier — Jun 17?</div>
                </div>
                <HBadge variant="neutral" outline>2m</HBadge>
              </div>
              <div className="channel">
                <span className="ch-icon"><i className="ph-fill ph-envelope-simple" /></span>
                <div className="ch-body">
                  <div className="ch-name">Email · celine.h@firm.co</div>
                  <div className="ch-snippet">Quick question on tier-2 pricing visuals</div>
                </div>
                <HBadge variant="neutral" outline>28m</HBadge>
              </div>
              <div className="channel">
                <span className="ch-icon"><i className="ph-fill ph-clipboard-text" /></span>
                <div className="ch-body">
                  <div className="ch-name">Form · Brief intake</div>
                  <div className="ch-snippet">Tier-2 pricing experiment — marketing</div>
                </div>
                <HBadge variant="neutral" outline>1h</HBadge>
              </div>
              <div className="channel">
                <span className="ch-icon"><i className="ph-fill ph-hash" /></span>
                <div className="ch-body">
                  <div className="ch-name">Slack · #design-requests</div>
                  <div className="ch-snippet">Mobile sign-up flow — usability review</div>
                </div>
                <HBadge variant="neutral" outline>3h</HBadge>
              </div>
              <div className="channel">
                <span className="ch-icon"><i className="ph-fill ph-note-pencil" /></span>
                <div className="ch-body">
                  <div className="ch-name">Manual · Kickoff notes</div>
                  <div className="ch-snippet">In-person — Q3 roadmap dependencies</div>
                </div>
                <HBadge variant="neutral" outline>1d</HBadge>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'intake',
      step: '02',
      variant: 'ai-purple',
      badge: null as string | null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
      ),
      title: 'Intake',
      summary: t.ai_intake_sum,
      tags: ['Make', 'Webhooks', 'Fields'],
      pipeline: null as string[] | null,
      detail: (
        <div className="detail-section">
          <div className="msg-panel">
            <div className="msg-panel-head">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M8 9h8M8 13h8M8 17h5" />
              </svg>
              <span>{t.ai_d_req_form}</span>
            </div>
            <div className="form-mini">
              <div className="field"><label>{t.ai_f_source}</label><div className="val"><span>LINE — @pm.celine</span></div></div>
              <div className="field"><label>{t.ai_f_projtype}</label><div className="val"><span>Product UI · Mobile</span></div></div>
              <div className="field"><label>{t.ai_f_goal}</label><div className="val"><span>Redesign onboarding for new pricing tier</span></div></div>
              <div className="field-row">
                <div className="field"><label>{t.ai_f_timeline}</label><div className="val"><span>Jun 03 — Jun 17</span></div></div>
                <div className="field"><label>{t.ai_f_budget}</label><div className="val"><span>Internal</span></div></div>
              </div>
              <div className="field"><label>{t.ai_f_priority_lbl}</label><div className="val"><span>P1 — Quarterly OKR</span><HBadge variant="danger">HIGH</HBadge></div></div>
              <div className="field"><label>{t.ai_f_contact}</label><div className="val"><span>celine.h@firm.co</span></div></div>
              <div className="form-status">
                <span>{t.ai_f_complete}</span>
                <div className="bar">
                  {Array.from({ length: 7 }).map((_, i) => <div key={i} className="pdot" />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'ai',
      step: '03',
      variant: 'ai-focal',
      badge: 'CLAUDE · DRAFT',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3 13.6 8.4 19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" />
          <path d="M19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z" />
        </svg>
      ),
      title: 'AI Brief',
      summary: t.ai_ai_sum,
      tags: ['Claude', 'Classify', 'Summarize', 'Gap-find'],
      pipeline: null as string[] | null,
      detail: (
        <>
          <div className="ai-thinking-indicator" aria-hidden="true">
            <span className="ai-thinking-dot" />
            <span className="ai-thinking-dot" />
            <span className="ai-thinking-dot" />
            <span className="ai-thinking-label">{t.ai_thinking}</span>
          </div>
          <div className="ai-block summary">
            <HAlert variant="neutral" title={t.ai_d_summary_lbl} icon={<i className="ph-bold ph-file-text" />}>
              <p dangerouslySetInnerHTML={{ __html: t.ai_d_summary_text }} />
            </HAlert>
          </div>
          <div className="ai-row">
            <div className="ai-block tasktype">
              <HAlert variant="neutral" title={t.ai_d_tasktype_lbl} icon={<i className="ph-fill ph-grid-four" />}>
                <div className="vv">
                  <HBadge variant="purple" outline>Product UI</HBadge>
                  <HBadge variant="neutral" outline>conf · 0.92</HBadge>
                </div>
              </HAlert>
            </div>
            <div className="ai-block priority">
              <HAlert variant="warning" title={t.ai_d_priority_lbl} icon={<i className="ph-fill ph-star" />}>
                <div className="vv">
                  <HBadge variant="warning">P1 · HIGH</HBadge>
                  <HBadge variant="neutral" outline>conf · 0.87</HBadge>
                </div>
              </HAlert>
            </div>
          </div>
          <div className="ai-block missing">
            <HAlert variant="warning" title={t.ai_d_missing_lbl} icon={<i className="ph-fill ph-warning" />}>
              <ul>
                <li>{t.ai_d_m1}</li>
                <li>{t.ai_d_m2}</li>
                <li>{t.ai_d_m3}</li>
              </ul>
            </HAlert>
          </div>
          <div className="ai-block questions">
            <HAlert variant="info" title={t.ai_d_questions_lbl} icon={<i className="ph-fill ph-info" />}>
              <ol>
                <li>{t.ai_d_q1}</li>
                <li>{t.ai_d_q2}</li>
                <li>{t.ai_d_q3}</li>
              </ol>
            </HAlert>
          </div>
          <div className="ai-block direction">
            <HAlert variant="success" title={t.ai_d_direction_lbl} icon={<i className="ph-bold ph-arrow-circle-right" />}>
              <p>{t.ai_d_direction_text}</p>
            </HAlert>
          </div>
        </>
      ),
    },
    {
      id: 'tracking',
      step: '04',
      variant: 'ai-violet',
      badge: null as string | null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="4.5" width="17" height="15" rx="1.8" /><path d="M3.5 9.5h17M9 4.5v15M14.5 4.5v15" />
        </svg>
      ),
      title: 'Tracking',
      summary: t.ai_tracking_sum,
      tags: ['Sheets', 'Record ID', 'History'],
      pipeline: null as string[] | null,
      detail: (
        <div className="detail-section">
          <div className="msg-panel">
            <div className="msg-panel-head">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3.5" y="4.5" width="17" height="15" rx="1.8" /><path d="M3.5 9.5h17M9 4.5v15M14.5 4.5v15" />
              </svg>
              <span>{t.ai_d_sheets_lbl}</span>
            </div>
          <div className="tracking-chart-container" style={{ height: 72, marginBottom: 8 }} />
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="border-b border-white/15 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">ID</th>
                <th className="border-b border-white/15 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">Source</th>
                <th className="border-b border-white/15 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">Type</th>
                <th className="border-b border-white/15 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-white/10 py-2">DR-248</td>
                <td className="border-b border-white/10 py-2">LINE</td>
                <td className="border-b border-white/10 py-2">Product UI</td>
                <td className="border-b border-white/10 py-2"><HBadge variant="success">Active</HBadge></td>
              </tr>
              <tr>
                <td className="border-b border-white/10 py-2">DR-247</td>
                <td className="border-b border-white/10 py-2">Form</td>
                <td className="border-b border-white/10 py-2">Graphic</td>
                <td className="border-b border-white/10 py-2"><HBadge variant="primary" outline>Review</HBadge></td>
              </tr>
              <tr>
                <td className="border-b border-white/10 py-2">DR-246</td>
                <td className="border-b border-white/10 py-2">Email</td>
                <td className="border-b border-white/10 py-2">UX Review</td>
                <td className="border-b border-white/10 py-2"><HBadge variant="neutral">Done</HBadge></td>
              </tr>
              <tr>
                <td className="py-2">DR-245</td>
                <td className="py-2">LINE</td>
                <td className="py-2">Research</td>
                <td className="py-2"><HBadge variant="neutral" outline>Backlog</HBadge></td>
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
      summary: t.ai_human_sum,
      tags: ['Priority', 'Strategy', 'Risk', 'Next step'],
      pipeline: null as string[] | null,
      detail: (
        <div className="detail-section">
          <div className="msg-panel msg-panel-green">
            <div className="msg-panel-head">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" />
              </svg>
              <span>{t.ai_d_assessment_lbl}</span>
            </div>
            <div>
              <HRow label={t.ai_hr_priority_row}>
                <HBadge variant="danger" style={{ marginRight: '6px' }}>P1</HBadge>
                {t.ai_hr_priority_val.replace(/^P1[^a-z]+/i, '')}
              </HRow>
              <HRow label={t.ai_hr_strategy_row}>{t.ai_hr_strategy_val}</HRow>
              <HRow label={t.ai_hr_risks_row}>{t.ai_hr_risks_val}</HRow>
              <HRow label={t.ai_hr_nextstep_row}>{t.ai_hr_nextstep_val}</HRow>
            </div>
          </div>
          <div className="msg-panel msg-panel-green">
            <div className="msg-panel-head">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 8h10M7 12h7M7 16h4" /><rect x="3.5" y="4" width="17" height="16" rx="2.5" />
              </svg>
              <span>{t.ai_hr_op_lbl}</span>
            </div>
            <div className="qq" dangerouslySetInnerHTML={{ __html: t.ai_hr_op_quote }} />
          </div>
        </div>
      ),
    },
    {
      id: 'workflow',
      step: '06',
      variant: 'ai-spectrum',
      badge: null as string | null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12h4l2-6 4 12 2-6h4" />
        </svg>
      ),
      title: 'Design Workflow',
      summary: t.ai_workflow_sum,
      tags: null as string[] | null,
      pipeline: [t.ai_ph_research, t.ai_ph_structure, t.ai_ph_design, t.ai_ph_validate, t.ai_ph_delivery],
      detail: (
        <div className="detail-section">
          <div className="msg-panel msg-panel-violet">
            <div className="msg-panel-head">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12h4l2-6 4 12 2-6h4" />
              </svg>
              <span>{t.ai_d_phases_lbl}</span>
            </div>
            <div className="phases">
              <div className="phase next">
                <div className="pn">01</div>
                <div>
                  <div className="pt">{t.ai_ph_research}</div>
                  <div className="pd">{t.ai_ph_research_d}</div>
                </div>
                <HBadge variant="cyan">{t.ai_ph_upnext}</HBadge>
              </div>
              <div className="phase">
                <div className="pn">02</div>
                <div>
                  <div className="pt">{t.ai_ph_structure}</div>
                  <div className="pd">{t.ai_ph_structure_d}</div>
                </div>
                <HBadge variant="neutral" outline>{t.ai_ph_queued}</HBadge>
              </div>
              <div className="phase">
                <div className="pn">03</div>
                <div>
                  <div className="pt">{t.ai_ph_design}</div>
                  <div className="pd">{t.ai_ph_design_d}</div>
                </div>
                <HBadge variant="neutral" outline>{t.ai_ph_queued}</HBadge>
              </div>
              <div className="phase">
                <div className="pn">04</div>
                <div>
                  <div className="pt">{t.ai_ph_validate}</div>
                  <div className="pd">{t.ai_ph_validate_d}</div>
                </div>
                <HBadge variant="neutral" outline>{t.ai_ph_queued}</HBadge>
              </div>
              <div className="phase">
                <div className="pn">05</div>
                <div>
                  <div className="pt">{t.ai_ph_delivery}</div>
                  <div className="pd">{t.ai_ph_delivery_d}</div>
                </div>
                <HBadge variant="neutral" outline>{t.ai_ph_queued}</HBadge>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];
}

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

const PROCESS_VISIBLE = 3;

const STAIR_STEP = 32;

// Swipe carousel for the Design Process rows. Always shows PROCESS_VISIBLE
// cards; offset is clamped to [0, cards.length - PROCESS_VISIBLE] so the last
// page borrows back cards instead of showing a short, unbalanced page.
//
// The left-low/right-high stagger is computed per SLOT (index - offset), not
// per card, and transitions whenever offset changes. A card's margin-top is
// pinned to 0 until it scrolls into the visible window, then grows as it
// crosses toward the left edge — so cards visibly step DOWN as they slide
// left, instead of the whole staircase just translating sideways with each
// card's height already fixed.
function ProcessCarousel({ cards }: { cards: ReactNode[] }) {
  const maxOffset = Math.max(0, cards.length - PROCESS_VISIBLE);
  const [offset, setOffset] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef(0);
  const [cardStepPx, setCardStepPx] = useState(0);
  const [risen, setRisen] = useState(false);

  // Hold off autoplay until the cards have finished useRiseReveal's scroll-in
  // animation, instead of starting immediately on mount — otherwise the
  // carousel could start sliding mid-reveal. useRiseReveal dispatches
  // 'rise-settled' (bubbling) on each card as it finishes; the left→right
  // stagger means later columns settle after the first one fires, so wait
  // out that same worst-case stagger window (5 columns * 0.15s delay + the
  // ~1.2s settle duration, rounded up) before flipping ready. Skips straight
  // to ready under reduced motion, since useRiseReveal never fires the event
  // there at all.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRisen(true);
      return;
    }
    const track = trackRef.current;
    if (!track) return;
    let bufferId: ReturnType<typeof setTimeout> | null = null;
    const onSettled = () => {
      track.removeEventListener('rise-settled', onSettled);
      bufferId = setTimeout(() => setRisen(true), 1500);
    };
    track.addEventListener('rise-settled', onSettled);
    return () => {
      track.removeEventListener('rise-settled', onSettled);
      if (bufferId) clearTimeout(bufferId);
    };
  }, []);

  function cardStep() {
    const track = trackRef.current;
    const card = track?.children[0] as HTMLElement | undefined;
    if (!track || !card) return 0;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    return card.getBoundingClientRect().width + gap;
  }

  // Measure the rendered card width/gap after layout — cardStep() reads the
  // DOM, so it can't run during render (refs aren't guaranteed attached yet,
  // and React may discard/redo a render pass before committing).
  useLayoutEffect(() => {
    setCardStepPx(cardStep());
    const onResize = () => setCardStepPx(cardStep());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [cards.length]);

  function goTo(next: number) {
    setOffset(Math.min(maxOffset, Math.max(0, next)));
  }

  function onPointerDown(e: ReactPointerEvent) {
    if (maxOffset === 0) return;
    dragStartRef.current = e.clientX;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!dragging) return;
    setDragPx(e.clientX - dragStartRef.current);
  }

  function endDrag() {
    if (!dragging) return;
    setDragging(false);
    const step = cardStepPx;
    if (step > 0 && Math.abs(dragPx) > step * 0.2) {
      goTo(offset + (dragPx < 0 ? 1 : -1));
    }
    setDragPx(0);
  }

  // Autoplay: advance one card every 6s, looping back to the start. Paused
  // while the user is dragging so it doesn't fight a manual swipe. A single
  // re-scheduling setTimeout (not setInterval) keyed on `offset` — not just
  // `[maxOffset, dragging, risen]` — so a manual swipe (drag or the Swipe
  // button) restarts the 6s countdown from that moment instead of leaving
  // the old interval's phase running underneath. This keeps the dot-fill
  // animation below (also keyed on `offset`, see render) in sync with when
  // the *next* auto-advance actually happens, instead of drifting apart.
  useEffect(() => {
    if (maxOffset === 0 || dragging || !risen) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setTimeout(() => {
      setOffset(o => (o >= maxOffset ? 0 : o + 1));
    }, 6000);
    return () => clearTimeout(id);
  }, [maxOffset, dragging, risen, offset]);

  const translatePx = -(offset * cardStepPx) + dragPx;
  const dotCount = maxOffset + 1;
  // Gate on `risen` too — otherwise the dot-fill span below mounts (and its
  // 6s CSS fill starts ticking) the instant the carousel renders, well
  // before the autoplay effect above is actually allowed to advance, so the
  // dot would show "full" long before the carousel really slides.
  const autoplayLive = maxOffset > 0 && !dragging && risen && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="process-scroll-wrap">
      <div
        className={`process-column-grid process-column-grid--inhouse${dragging ? ' is-dragging' : ''}`}
        ref={trackRef}
        style={{ transform: `translateX(${translatePx}px)`, transition: dragging ? 'none' : 'transform .45s cubic-bezier(.22,.61,.36,1)' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {cards.map((card, i) => {
          const slot = i - offset;
          // Clamp both ends to the visible range's max — cards waiting
          // off-screen don't need to keep climbing/sinking past what the
          // tallest visible card already uses, since that's invisible
          // anyway (clipped by .process-scroll-wrap). Without this clamp,
          // off-screen cards on the left grow taller than any visible step
          // and inflate the track's height, which pushes the gap to the
          // title above and the swipe controls below out of place.
          const maxMargin = (PROCESS_VISIBLE - 1) * STAIR_STEP;
          const marginTop = Math.min(maxMargin, Math.max(0, (PROCESS_VISIBLE - 1 - slot) * STAIR_STEP));
          return (
            <div
              key={i}
              className="process-swipe-slot"
              style={{ marginTop, transition: dragging ? 'none' : 'margin-top .45s cubic-bezier(.22,.61,.36,1)' }}
            >
              {card}
            </div>
          );
        })}
      </div>
      {maxOffset > 0 && (
        <>
          <div className="process-swipe-controls">
            <div className="process-swipe-dots">
              {Array.from({ length: dotCount }).map((_, i) => (
                <span key={i} className={`process-swipe-dot${i === offset ? ' active' : ''}`}>
                  {i === offset && autoplayLive && <span key={offset} className="process-swipe-dot-fill" />}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="process-swipe-btn"
            onClick={() => goTo(offset >= maxOffset ? 0 : offset + 1)}
          >
            Swipe <i className="ph-bold ph-arrow-right" />
          </button>
        </>
      )}
    </div>
  );
}

export default function SkillsSection() {
  const { t } = useLang();
  const aiCards = useMemo(() => makeAiCards(t), [t]);
  const [expandedAiCard, setExpandedAiCard] = useState<string | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);
  const policyRef = useRef<HTMLDivElement>(null);
  const policyPillBtnRef = useRef<HTMLButtonElement>(null);
  const policyContentRef = useRef<HTMLDivElement>(null);
  const [policyBubble, setPolicyBubble] = useState<{ d: string; w: number; h: number } | null>(null);
  const aiFlowGridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const aiThinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toggle the bento "has-expanded" class imperatively (not via React's className prop) —
  // .ai-flow-grid is a .rise-card whose entrance is driven by useRiseReveal() writing
  // inline style/transform outside React. Keeping this outside the className prop avoids
  // an unnecessary re-render of the whole grid's class string on every card expand/collapse.
  useEffect(() => {
    aiFlowGridRef.current?.classList.toggle('has-expanded', !!expandedAiCard);
  }, [expandedAiCard]);

  // Policy popover: dismiss on outside click or Escape, same as a native
  // menu/tooltip, since it's an anchored popover rather than a modal Dialog.
  useEffect(() => {
    if (!policyOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (policyRef.current && !policyRef.current.contains(e.target as Node)) {
        setPolicyOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPolicyOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [policyOpen]);

  // Policy popover bubble outline: box + tail drawn as ONE SVG path (rounded
  // rect with a triangular notch cut into its top edge) instead of two
  // separate bordered elements. Two stacked DOM pieces with their own
  // (semi-transparent) borders never look truly fused — the rotated tail's
  // border and the box's border are antialiased independently, so the seam
  // where they meet shows a faint doubled/misaligned line. A single stroked
  // path has no seam because there's nothing to misalign.
  // contentRef's rendered size (post layout, incl. any overflow-y:auto clamp
  // to max-height) drives the path's box portion; the pill button's own
  // rendered width drives where the tail notch sits, since the popover's
  // left edge is pinned to the pill's left edge — so the tail must be
  // recomputed (not hardcoded) to land on the pill regardless of label
  // length across zh/en.
  useLayoutEffect(() => {
    if (!policyOpen) { setPolicyBubble(null); return; }
    const TAIL_H = 14;
    const TAIL_W = 24;
    const R = 20;
    const recalc = () => {
      const content = policyContentRef.current;
      const pillBtn = policyPillBtnRef.current;
      if (!content || !pillBtn) return;
      const w = content.offsetWidth;
      const h = content.offsetHeight;
      const minX = R + TAIL_W / 2 + 2;
      const maxX = w - R - TAIL_W / 2 - 2;
      const tx = Math.min(Math.max(pillBtn.offsetWidth / 2, minX), maxX);
      const d = [
        `M ${R},${TAIL_H}`,
        `L ${tx - TAIL_W / 2},${TAIL_H}`,
        `L ${tx},0`,
        `L ${tx + TAIL_W / 2},${TAIL_H}`,
        `L ${w - R},${TAIL_H}`,
        `A ${R},${R} 0 0 1 ${w},${TAIL_H + R}`,
        `L ${w},${TAIL_H + h - R}`,
        `A ${R},${R} 0 0 1 ${w - R},${TAIL_H + h}`,
        `L ${R},${TAIL_H + h}`,
        `A ${R},${R} 0 0 1 0,${TAIL_H + h - R}`,
        `L 0,${TAIL_H + R}`,
        `A ${R},${R} 0 0 1 ${R},${TAIL_H}`,
        'Z',
      ].join(' ');
      setPolicyBubble({ d, w, h: h + TAIL_H });
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [policyOpen, t]);

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
      const deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
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
        card.classList.remove('border-glow-card');
        card.querySelector('.edge-light')?.remove();
        const inner = card.querySelector<HTMLElement>('.border-glow-inner');
        if (inner) {
          Array.from(inner.children).forEach(c => card.insertBefore(c, inner));
          inner.remove();
        }
      });
    };
  }, [t]);

  // How I Use AI — live demo animations on open, echoing the Tech Stack
  // section's "actively being edited" feel: Sources stacks its first 4 rows
  // in (see toggle() in the card map), then simulates a new message landing
  // — loader, then the 5th row slides in at the top while the others glide
  // smoothly down (FLIP) to make room; AI Brief types out its summary.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (expandedAiCard === 'sources') {
      const card = cardRefs.current.get('sources');
      const list = card?.querySelector<HTMLElement>('.channel-list');
      const loader = card?.querySelector<HTMLElement>('.channel-loader');
      const channels = list ? Array.from(list.querySelectorAll<HTMLElement>('.channel')) : [];
      if (!list || channels.length < 2) return;
      const incoming = channels[channels.length - 1];
      const movers = channels.filter(c => c !== incoming);

      if (reduced) {
        incoming.classList.remove('channel-collapsed');
        return () => incoming.classList.remove('channel-collapsed');
      }

      // Give the stack-in entrance (toggle(), ~4 * 0.14 stagger + 0.5s) time
      // to finish before showing the loader for the new message.
      const loaderTimer = setTimeout(() => {
        loader?.classList.add('is-active');
      }, 1300);

      const revealTimer = setTimeout(() => {
        loader?.classList.remove('is-active');

        // Pin the grow target to an already-expanded row's real height so
        // it finishes growing exactly when its transition ends, in sync
        // with the siblings' FLIP slide below.
        const targetHeight = movers[0].getBoundingClientRect().height;
        const before = new Map(movers.map(c => [c, c.getBoundingClientRect().top] as const));
        list.prepend(incoming);
        incoming.style.maxHeight = `${targetHeight}px`;
        incoming.classList.remove('channel-collapsed');
        void list.offsetHeight;

        movers.forEach(c => {
          const delta = (before.get(c) ?? 0) - c.getBoundingClientRect().top;
          if (delta) {
            c.style.transition = 'none';
            c.style.transform = `translateY(${delta}px)`;
          }
        });
        void list.offsetHeight;
        requestAnimationFrame(() => {
          movers.forEach(c => {
            c.style.transition = '';
            c.style.transform = '';
          });
        });
      }, 2700);

      return () => {
        clearTimeout(loaderTimer);
        clearTimeout(revealTimer);
        loader?.classList.remove('is-active');
        channels.forEach(c => {
          c.classList.remove('channel-collapsed');
          c.style.maxHeight = '';
          c.style.transition = '';
          c.style.transform = '';
        });
      };
    }

    if (expandedAiCard === 'ai') {
      const card = cardRefs.current.get('ai');
      const p = card?.querySelector<HTMLParagraphElement>('.ai-block.summary p');
      if (!p || reduced) return;
      const original = p.innerHTML;
      const flat = flatten([tokenizeHighlight(original)]);
      let count = 0;
      let intervalId: ReturnType<typeof setInterval> | null = null;
      // Wait out the "thinking" beat (see toggle() in the card map) before
      // typing, so the summary starts right as it fades into view.
      const startTimer = setTimeout(() => {
        intervalId = setInterval(() => {
          count += 1;
          const done = count >= flat.length;
          p.innerHTML = runsToHtml(toRuns(flat, count)) + (done ? '' : '<span class="tcp-cursor"></span>');
          if (done && intervalId) clearInterval(intervalId);
        }, 28);
      }, AI_THINK_MS);
      return () => {
        clearTimeout(startTimer);
        if (intervalId) clearInterval(intervalId);
        p.innerHTML = original;
      };
    }

    if (expandedAiCard === 'tracking') {
      let echartsInstance: { dispose: () => void } | null = null;
      const timer = setTimeout(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore — echarts ships its own types; tsc finds them post-install
        const echarts = await import('echarts');
        const el = cardRefs.current.get('tracking')?.querySelector<HTMLElement>('.tracking-chart-container');
        if (!el) return;
        const chart = echarts.init(el, undefined, { renderer: 'svg' });
        chart.setOption({
          backgroundColor: 'transparent',
          grid: { top: 6, bottom: 6, left: 56, right: 48, containLabel: false },
          xAxis: { type: 'value', show: false },
          yAxis: {
            type: 'category',
            data: ['Backlog', 'Done', 'Review', 'Active'],
            axisLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontFamily: 'inherit' },
            axisLine: { show: false },
            axisTick: { show: false },
          },
          series: [{
            type: 'bar',
            data: [
              { value: 14, itemStyle: { color: '#7e6917' } },
              { value: 72, itemStyle: { color: '#00758d' } },
              { value: 38, itemStyle: { color: '#0269d0' } },
              { value: 18, itemStyle: { color: '#0e7c3d' } },
            ],
            label: { show: true, position: 'right', color: 'rgba(255,255,255,0.45)', fontSize: 10, formatter: '{c}' },
            barMaxWidth: 10,
            itemStyle: { borderRadius: [0, 4, 4, 0] },
          }],
          animation: !reduced,
        });
        echartsInstance = chart;
      }, 380);
      return () => {
        clearTimeout(timer);
        echartsInstance?.dispose();
      };
    }
  }, [expandedAiCard]);

  // Spotlight cards — identical mechanism to ContactSection's working
  // effect: plain mousemove/mouseleave, scoped to this section's own root
  // so it doesn't cross-contaminate About's/Contact's .sc-card elements. No
  // matchMedia gate and no pointerType filter — a filter on pointerType
  // wrongly bailed on devices whose mouse/trackpad reports a non-'mouse'
  // pointerType, killing the effect entirely. These tech cards also carry
  // the .card-spotlight colored tint (::before at --mouse-x/--mouse-y), which
  // Contact's plain sc-cards don't, so drive those vars here too.
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('#tech-stack .sc-card').forEach(card => {
      if (card.querySelector(':scope > .sc-overlay')) return;
      const ov = document.createElement('div');
      ov.className = 'sc-overlay';
      card.insertBefore(ov, card.firstChild);

      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) + 'px';
        const y = (e.clientY - r.top) + 'px';
        card.style.setProperty('--sc-x', x);
        card.style.setProperty('--sc-y', y);
        card.style.setProperty('--mouse-x', x);
        card.style.setProperty('--mouse-y', y);
      };
      const onLeave = () => {
        card.style.setProperty('--sc-x', '-500px');
        card.style.setProperty('--sc-y', '-500px');
        card.style.setProperty('--mouse-x', '-500px');
        card.style.setProperty('--mouse-y', '-500px');
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }, [t]);

  // Tech Stack / How I Use AI: the description text sits only 16px above
  // the first card (by design, to match the grid gap), so a drag-select
  // started in one can cross into the other. `user-select: contain` would
  // be the clean CSS fix but isn't implemented in any major browser —
  // clamp the Range manually instead, so each block stays independently
  // selectable.
  useEffect(() => {
    function clampSelection() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      const anchorEl = sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode?.parentElement;
      const container = anchorEl?.closest<HTMLElement>('.tech-sub, .tech-item, .ai-sub, .ai-card');
      if (!container) return;

      const range = sel.getRangeAt(0);
      if (container.contains(range.commonAncestorContainer)) return;

      const forward = sel.anchorNode === range.startContainer && sel.anchorOffset === range.startOffset;
      const clamped = document.createRange();
      if (forward) {
        clamped.setStart(range.startContainer, range.startOffset);
        clamped.setEnd(container, container.childNodes.length);
      } else {
        clamped.setStart(container, 0);
        clamped.setEnd(range.endContainer, range.endOffset);
      }
      sel.removeAllRanges();
      sel.addRange(clamped);
    }
    document.addEventListener('selectionchange', clampSelection);
    return () => document.removeEventListener('selectionchange', clampSelection);
  }, []);

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

  // Scroll-reveal (.rise-card/.rise-soft → elastic rise + squash-stretch) is
  // handled site-wide by useRiseReveal(), called once in App.tsx.

  return (
    <>
      {/* DESIGN PROCESS */}
      <section className="section">
        <div className="section-label rise-soft">My Design Process</div>
        <div className="process-dual">
          <div className="process-column">
            <div className="process-column-head">
              <div className="process-column-header">
                <span>{t.tab_inhouse}</span>
              </div>
              <p className="process-column-desc">{t.tab_inhouse_desc}</p>
            </div>
            <ProcessCarousel
              cards={(['Align','Research','Structure','Design','Validate','Iterate'] as const).map((slug, i) => {
                const idx = String(i + 1).padStart(2, '0') as '01'|'02'|'03'|'04'|'05'|'06';
                const nameKey = `ih_name_${idx}` as keyof typeof t;
                const descKey = `ih_desc_${idx}` as keyof typeof t;
                return (
                  <BorderGlow
                    key={slug}
                    className="process-card process-card--has-img rise-card"
                    backgroundColor="#13101c"
                    borderRadius={44}
                    colors={['#6C63FF', '#FF6584', '#38bdf8']}
                    glowColor="264 70 75"
                    edgeSensitivity={25}
                    glowRadius={24}
                    glowIntensity={1.1}
                    coneSpread={25}
                    fillOpacity={0}
                    spotlightColor="rgba(108, 99, 255, 0.12)"
                    backgroundSlot={
                      <>
                        <div className="process-card-bg-img process-card-bg-img--white" style={{ backgroundImage: `url("./img/process/${slug}_w.png")` }} />
                        <div className="process-card-bg-img process-card-bg-img--color" style={{ backgroundImage: `url("./img/process/${slug}.png")` }} />
                      </>
                    }
                  >
                    <div className="process-num">{String(i + 1).padStart(2, '0')}</div>
                    <div className="process-name">{t[nameKey] as string}</div>
                    <div className="process-desc">{t[descKey] as string}</div>
                  </BorderGlow>
                );
              })}
            />
          </div>
          <div className="process-column">
            <div className="process-column-head">
              <div className="process-column-header">
                <span>{t.tab_freelance}</span>
              </div>
              <p className="process-column-desc">{t.tab_freelance_desc}</p>
              <div className="policy-pill-wrap" ref={policyRef}>
                <button
                  type="button"
                  className="policy-pill"
                  ref={policyPillBtnRef}
                  onClick={() => setPolicyOpen(prev => !prev)}
                >
                  <i className="ph ph-shield-check" aria-hidden="true" />
                  {t.process_policy_title}
                </button>
                {policyOpen && (
                  <div className="policy-popover-shell">
                    {policyBubble && (
                      <svg
                        className="policy-popover-svg"
                        width={policyBubble.w}
                        height={policyBubble.h}
                        viewBox={`0 0 ${policyBubble.w} ${policyBubble.h}`}
                        aria-hidden="true"
                      >
                        <path d={policyBubble.d} fill="#13101c" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                      </svg>
                    )}
                    <div className="policy-popover" role="dialog" aria-label={t.process_policy_title} ref={policyContentRef}>
                      <button
                        type="button"
                        className="policy-popover-close"
                        onClick={() => setPolicyOpen(false)}
                        aria-label="Close"
                      >
                        <i className="ph ph-x" aria-hidden="true" />
                      </button>
                      <div className="policy-popover-title">{t.process_policy_title}</div>
                      <p className="policy-popover-body">{t.process_policy_body}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <ProcessCarousel
              cards={(['Intake','AI Brief','Triage','Discovery','Proposal','Delivery'] as const).map((slug, i) => {
                const idx = String(i + 1).padStart(2, '0') as '01'|'02'|'03'|'04'|'05'|'06';
                const nameKey = `fl_name_${idx}` as keyof typeof t;
                const descKey = `fl_desc_${idx}` as keyof typeof t;
                return (
                  <BorderGlow
                    key={slug}
                    className="process-card process-card--has-img rise-card"
                    backgroundColor="#13101c"
                    borderRadius={44}
                    colors={['#6C63FF', '#FF6584', '#38bdf8']}
                    glowColor="264 70 75"
                    edgeSensitivity={25}
                    glowRadius={24}
                    glowIntensity={1.1}
                    coneSpread={25}
                    fillOpacity={0}
                    spotlightColor="rgba(108, 99, 255, 0.12)"
                    backgroundSlot={
                      <>
                        <div className="process-card-bg-img process-card-bg-img--white" style={{ backgroundImage: `url("./img/process/${slug}_w.png")` }} />
                        <div className="process-card-bg-img process-card-bg-img--color" style={{ backgroundImage: `url("./img/process/${slug}.png")` }} />
                      </>
                    }
                  >
                    <div className="process-num">{idx}</div>
                    <div className="process-name">{t[nameKey] as string}</div>
                    <div className="process-desc">{t[descKey] as string}</div>
                  </BorderGlow>
                );
              })}
            />
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section id="tech-stack" className="section">
        <div className="section-label rise-soft">Tech Stack</div>
        <h2 className="about-h2 rise-soft" style={{ marginBottom: '8px' }}>Web development <span className="gradient-text">literacy</span></h2>
        <p className="tech-sub rise-soft" dangerouslySetInnerHTML={{ __html: t.tech_sub }} />
        <div className="tech-items">
          <div className="tech-item-wrap rise-card">
            <div className="tech-item html-item card-spotlight sc-card">
              <span className="card-glass-highlight" aria-hidden="true" />
              <div className="tech-item-header">
                <span className="tech-name"><i className="fab fa-html5" style={{ color: '#60a5fa', marginRight: '8px' }}></i>HTML / CSS / Tailwind</span>
              </div>
              <div className="tech-desc">{t.skill_html}</div>
              <div className="tech-code-preview">
                <div className="tcp-bar">
                  <span className="tcp-dot"/><span className="tcp-dot"/><span className="tcp-dot"/>
                  <span className="tcp-filename">portfolio.css</span>
                </div>
                <TypingCode versions={[CSS_CODE_A, CSS_CODE_B]} />
              </div>
            </div>
            <span className="tech-level-badge html-item">DESIGN-READY</span>
          </div>
          <div className="tech-item-wrap rise-card">
            <div className="tech-item js-item card-spotlight sc-card">
              <span className="card-glass-highlight" aria-hidden="true" />
              <div className="tech-item-header">
                <span className="tech-name"><i className="fab fa-js" style={{ color: '#fb923c', marginRight: '8px' }}></i>JavaScript</span>
              </div>
              <div className="tech-desc">{t.skill_js}</div>
              <div className="tech-code-preview">
                <div className="tcp-bar">
                  <span className="tcp-dot"/><span className="tcp-dot"/><span className="tcp-dot"/>
                  <span className="tcp-filename">HeroSection.tsx</span>
                </div>
                <TypingCode versions={[JS_CODE_A, JS_CODE_B]} />
              </div>
            </div>
            <span className="tech-level-badge js-item">AI-ASSISTED</span>
          </div>
          <div className="tech-item-wrap rise-card">
            <div className="tech-item react-item card-spotlight sc-card">
              <span className="card-glass-highlight" aria-hidden="true" />
              <div className="tech-item-header">
                <span className="tech-name"><i className="fab fa-react" style={{ color: '#a5b4fc', marginRight: '8px' }}></i>React.js / Vue.js</span>
              </div>
              <div className="tech-desc">{t.skill_css}</div>
              <div className="tech-code-preview">
                <div className="tcp-bar">
                  <span className="tcp-dot"/><span className="tcp-dot"/><span className="tcp-dot"/>
                  <span className="tcp-filename">SkillsSection.tsx</span>
                </div>
                <TypingCode versions={[JSX_CODE_A, JSX_CODE_B]} />
              </div>
            </div>
            <span className="tech-level-badge react-item">RESPONSIVE</span>
          </div>
        </div>
        <div className="tech-note rise-soft" dangerouslySetInnerHTML={{ __html: t.figma_mcp }} />
      </section>

      {/* MY SKILLS + HOW I USE AI (merged) */}
      <section id="my-skills" className="section">
        <div className="section-label rise-soft">My Skills and How I Use AI</div>
        <h2 className="about-h2 rise-soft" style={{ letterSpacing: '-.02em', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
          AI-Assisted Design <span className="gradient-text">Intake System</span>
        </h2>
        <p
          className="ai-sub rise-soft"
          style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', marginBottom: '-32px', maxWidth: 392 }}
          dangerouslySetInnerHTML={{ __html: t.ai_sub }}
        />

        <div className="ai-flow-grid" ref={aiFlowGridRef}>
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

          {aiCards.map(card => {
            const isOpen = expandedAiCard === card.id;
            const toggle = () => {
              const opening = !isOpen;
              setExpandedAiCard(opening ? card.id : null);
              const el = cardRefs.current.get(card.id);
              if (!el) return;
              if (opening) {
                gsap.fromTo(el,
                  { scale: 0.972, y: 6 },
                  { scale: 1, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.55)', clearProps: 'transform' }
                );
                const detail = el.querySelector('.ai-card-detail');
                if (detail) {
                  if (card.id === 'ai') {
                    // "Thinking" beat before content streams in line-by-line —
                    // mirrors the Tech Stack section's live-demo feel but for
                    // a reasoning step rather than typed code.
                    el.classList.add('is-thinking');
                    const targets = [
                      detail.querySelector('.ai-block.summary'),
                      detail.querySelector('.ai-block.tasktype'),
                      detail.querySelector('.ai-block.priority'),
                      detail.querySelector('.ai-block.missing'),
                      detail.querySelector('.ai-block.questions'),
                      detail.querySelector('.ai-block.direction'),
                    ].filter((node): node is Element => !!node);
                    gsap.set(targets, { opacity: 0, y: 14 });
                    if (aiThinkTimeoutRef.current) clearTimeout(aiThinkTimeoutRef.current);
                    aiThinkTimeoutRef.current = setTimeout(() => {
                      el.classList.remove('is-thinking');
                      gsap.fromTo(targets,
                        { opacity: 0, y: 14 },
                        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.12, clearProps: 'all' }
                      );
                    }, AI_THINK_MS);
                  } else if (card.id === 'sources') {
                    // Stack the first 4 rows in one by one; the 5th stays
                    // collapsed here so the live-demo effect in the effect
                    // below can reveal it afterward as a new message landing.
                    const rows = Array.from(detail.querySelectorAll<HTMLElement>('.channel'));
                    const incoming = rows[rows.length - 1];
                    const visible = rows.slice(0, -1);
                    incoming.classList.add('channel-collapsed');
                    gsap.set(visible, { opacity: 0, y: 26, scale: 0.96 });
                    gsap.to(visible,
                      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out', stagger: 0.14, clearProps: 'all' }
                    );
                  } else {
                    gsap.fromTo(Array.from(detail.children),
                      { opacity: 0, y: 14 },
                      { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.07, delay: 0.22, clearProps: 'all' }
                    );
                  }
                }
              } else {
                if (card.id === 'ai') {
                  el.classList.remove('is-thinking');
                  if (aiThinkTimeoutRef.current) {
                    clearTimeout(aiThinkTimeoutRef.current);
                    aiThinkTimeoutRef.current = null;
                  }
                }
                gsap.fromTo(el,
                  { scale: 1 },
                  { scale: 0.988, duration: 0.16, ease: 'power2.in', yoyo: true, repeat: 1, clearProps: 'transform' }
                );
              }
            };
            return (
              <article
                key={card.id}
                ref={(el: HTMLElement | null) => { if (el) cardRefs.current.set(card.id, el); else cardRefs.current.delete(card.id); }}
                className={`ai-card ai-card-glow rise-card${card.variant ? ' ' + card.variant : ''}${isOpen ? ' is-open' : ''}`}
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
                {card.pipeline && <AiFlowStepper steps={card.pipeline} />}
                <div className="ai-card-detail">{card.detail}</div>
              </article>
            );
          })}
        </div>

        <div className="ai-chips-row rise-card">
          <div className="ai-chips-label"><span>{t.ai_chips_label}</span></div>
          <div className="ai-chips">
            <span className="ai-chip"><span className="ai-chip-dot"></span>Product UI<span className="ai-chip-count">42%</span></span>
            <span className="ai-chip"><span className="ai-chip-dot"></span>Graphic Design<span className="ai-chip-count">21%</span></span>
            <span className="ai-chip"><span className="ai-chip-dot"></span>UX Review<span className="ai-chip-count">19%</span></span>
            <span className="ai-chip"><span className="ai-chip-dot"></span>Research Planning<span className="ai-chip-count">18%</span></span>
          </div>
        </div>

        <div className="ai-principle rise-card">
          AI handles <em>structure</em><span className="ai-principle-dot"></span>I handle <em>judgment</em>.
        </div>

        <div className="skills-marquee-group">
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
        </div>
      </section>
    </>
  );
}
