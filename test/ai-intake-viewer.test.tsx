import { render, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// How I Use AI on desktop (>960px) is an Apple-style product viewer: a
// column of step pills on the left, one open at a time as a summary card,
// and a stage on the right showing that step's live demo. Tablet/phone keep
// the original expanding cards. The width is read from matchMedia, which
// jsdom lacks — `viewport` below decides what it answers.
const viewport = vi.hoisted(() => ({ desktop: true }));
vi.hoisted(() => {
  window.matchMedia = ((q: string) => ({
    matches: q === '(max-width: 960px)' ? !viewport.desktop : q === '(min-width: 961px)' ? viewport.desktop : false,
    media: q,
    onchange: null,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

// Only fires when a test says the viewer scrolled into view.
const observers = vi.hoisted(() => [] as { cb: IntersectionObserverCallback; targets: Element[]; self: unknown }[]);
vi.hoisted(() => {
  class IOMock {
    entry: { cb: IntersectionObserverCallback; targets: Element[]; self: unknown };
    constructor(cb: IntersectionObserverCallback) {
      this.entry = { cb, targets: [], self: this };
      observers.push(this.entry);
    }
    observe(el: Element) { this.entry.targets.push(el); }
    unobserve() {}
    disconnect() { this.entry.targets = []; }
    takeRecords() { return []; }
  }
  globalThis.IntersectionObserver = IOMock as unknown as typeof IntersectionObserver;
});

import { gsap } from 'gsap';
import { AiIntakeSection, resetAiViewerStep } from '../src/components/SkillsSection';
import { LangProvider } from '../src/context/LangContext';

function scrollIntoView(el: Element) {
  act(() => {
    observers.filter(o => o.targets.includes(el)).forEach(o => {
      o.cb([{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry], o.self as IntersectionObserver);
    });
  });
}

function setup({ inView = true } = {}) {
  const utils = render(<LangProvider><AiIntakeSection /></LangProvider>);
  const q = (sel: string) => utils.container.querySelector<HTMLElement>(sel);
  const pill = (id: string) => q(`.ai-pill-open[aria-controls="ai-stage-${id}"]`)!;
  const panel = (id: string) => q(`#ai-stage-${id}`)!;
  const viewer = q('.ai-viewer');
  if (inView && viewer) scrollIntoView(viewer);
  return { ...utils, q, pill, panel, viewer };
}

afterEach(() => {
  cleanup();
  resetAiViewerStep();
  localStorage.removeItem('lang');
  observers.length = 0;
  viewport.desktop = true;
});

describe('How I Use AI — desktop viewer', () => {
  it('renders six step pills and a stage instead of the card grid', () => {
    const { container, q } = setup();
    expect(q('.ai-viewer')).not.toBeNull();
    expect(q('.ai-flow-grid')).toBeNull();
    expect(container.querySelectorAll('.ai-pill')).toHaveLength(6);
    expect(container.querySelectorAll('.aas-screen')).toHaveLength(6);
  });

  it('opens step 01 once the viewer scrolls into view, not before', () => {
    const { container, pill, panel, viewer } = setup({ inView: false });
    expect(container.querySelectorAll('.aas-screen.is-active')).toHaveLength(0);
    scrollIntoView(viewer!);
    expect(pill('sources').getAttribute('aria-expanded')).toBe('true');
    expect(panel('sources').classList.contains('is-active')).toBe(true);
    expect(panel('intake').classList.contains('is-active')).toBe(false);
  });

  it('switches the open pill and stage panel together, keeping exactly one open', () => {
    const { container, pill, panel } = setup();
    act(() => { fireEvent.click(pill('ai')); });
    expect(pill('ai').getAttribute('aria-expanded')).toBe('true');
    expect(pill('sources').getAttribute('aria-expanded')).toBe('false');
    expect(panel('ai').classList.contains('is-active')).toBe(true);
    expect(panel('sources').classList.contains('is-active')).toBe(false);
    expect(container.querySelectorAll('.aas-screen.is-active')).toHaveLength(1);
    expect(container.querySelectorAll('.ai-pill.is-open')).toHaveLength(1);
  });

  it('the app window has no sidebar of its own; its title bar names the open screen', () => {
    localStorage.setItem('lang', 'en');
    const { q, pill } = setup();
    expect(q('.aas-side')).toBeNull();
    expect(q('.aas-title b')?.textContent).toBe('Inbox');
    act(() => { fireEvent.click(pill('tracking')); });
    expect(q('.aas-title b')?.textContent).toBe('Tracker');
  });

  // Regression: leaving a screen used to restore its typed text BEFORE
  // reverting the GSAP context, and the revert rewound the typing tween to
  // frame 0 — blanking the text again. 02 Intake then showed an empty form.
  it('keeps a screen\'s text intact after leaving it mid-intro, so a revisit can replay it', () => {
    const { container, pill } = setup();
    const values = () => [...container.querySelectorAll('#ai-stage-intake .aas-field-val > span:first-child')].map(s => s.textContent);
    const stats = () => [...container.querySelectorAll('#ai-stage-tracking .aas-stat-num')].map(s => s.textContent);
    const full = values();
    const fullStats = stats();
    expect(full.every(v => v && v.length > 3)).toBe(true);
    // jsdom never ticks GSAP on its own; without real progress the revert
    // has nothing to rewind and the bug can't show. Advance the clock.
    const advance = (s: number) => act(() => { gsap.updateRoot(gsap.ticker.time + s); });
    act(() => { fireEvent.click(pill('intake')); });
    advance(1.5); // first fields typed part-way
    act(() => { fireEvent.click(pill('tracking')); });
    expect(values()).toEqual(full);
    advance(0.6); // stats counting up
    act(() => { fireEvent.click(pill('intake')); });
    expect(stats()).toEqual(fullStats);
    advance(8);
    expect(values()).toEqual(full);
  });

  // The glow writes on the next animation frame (one measure per frame).
  const nextFrame = () => act(() => new Promise<void>(r => requestAnimationFrame(() => r())));

  it('every pill carries the Contact Me card hover layers (wash, edge ring, hover shadow)', async () => {
    const { container } = setup();
    const pills = container.querySelectorAll('.ai-pill');
    pills.forEach(li => {
      const bg = li.querySelector('.ai-pill-bg')!;
      expect(bg.querySelectorAll(':scope > .card-hover-shadow, :scope > .sc-overlay, :scope > .sc-ring')).toHaveLength(3);
      // About Me card extras: tinted spotlight + glass top-line highlight
      expect(bg.querySelectorAll(':scope > .spotlight-layer, :scope > .card-glass-highlight')).toHaveLength(2);
    });
    // a closed pill follows the mouse too, not just the open card
    const closed = container.querySelector<HTMLElement>('.ai-pill:not(.is-open)')!;
    fireEvent.pointerMove(closed, { pointerType: 'mouse', clientX: 12, clientY: 8 });
    await nextFrame();
    expect(closed.querySelector<HTMLElement>('.ai-pill-bg')!.style.getPropertyValue('--sc-x')).toBe('12px');
  });

  it('the cursor glow follows a mouse, ignores touch, and parks off-card on leave', async () => {
    const { container } = setup();
    const li = container.querySelector<HTMLElement>('.ai-pill.is-open')!;
    const bg = li.querySelector<HTMLElement>('.ai-pill-bg')!;
    fireEvent.pointerMove(li, { pointerType: 'touch', clientX: 40, clientY: 30 });
    await nextFrame();
    expect(bg.style.getPropertyValue('--sc-x')).toBe('');
    // A burst of moves inside one frame lands as one write, at the last spot.
    fireEvent.pointerMove(li, { pointerType: 'mouse', clientX: 10, clientY: 10 });
    fireEvent.pointerMove(li, { pointerType: 'mouse', clientX: 40, clientY: 30 });
    expect(bg.style.getPropertyValue('--sc-x')).toBe('');
    await nextFrame();
    expect(bg.style.getPropertyValue('--sc-x')).toBe('40px');
    expect(bg.style.getPropertyValue('--mouse-y')).toBe('30px');
    fireEvent.pointerLeave(li, { pointerType: 'mouse' });
    expect(bg.style.getPropertyValue('--sc-x')).toBe('-500px');
  });

  // The cursor-following tint/glow/edge ring was removed from the window.
  it('the app window has no cursor-following colour layers', () => {
    const { container } = setup();
    const win = container.querySelector<HTMLElement>('.aas-window')!;
    expect(win.querySelectorAll(':scope > .spotlight-layer, :scope > .sc-overlay, :scope > .sc-ring')).toHaveLength(0);
    fireEvent.mouseMove(win, { clientX: 120, clientY: 64 });
    expect(win.style.getPropertyValue('--mouse-x')).toBe('');
    expect(win.style.getPropertyValue('--sc-x')).toBe('');
  });

  it('Intake screen shows Make as its official logo alone; the card\'s tag pill stays plain text', () => {
    const { container } = setup();
    const chip = container.querySelector('#ai-stage-intake .aas-pipe-chip')!;
    expect(chip.querySelector('.make-logo svg path')).not.toBeNull();
    expect(chip.textContent).toBe('');
    const meta = container.querySelector('#ai-stage-intake .aas-meta')!;
    expect(meta.querySelector('.make-logo')?.getAttribute('aria-label')).toBe('Make');
    expect(meta.textContent).not.toMatch(/Make/);
    const tag = [...container.querySelectorAll('.ai-pill.ai-purple .ai-tag')].find(t => t.textContent === 'Make');
    expect(tag).toBeDefined();
    expect(tag!.querySelector('.make-logo')).toBeNull();
  });

  it('clicking the already-open step does not close it', () => {
    const { pill } = setup();
    act(() => { fireEvent.click(pill('sources')); });
    expect(pill('sources').getAttribute('aria-expanded')).toBe('true');
  });

  it('prev/next buttons step through the list and disable at the ends', () => {
    const { getByLabelText, pill } = setup();
    const prev = getByLabelText('Previous step') as HTMLButtonElement;
    const next = getByLabelText('Next step') as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    act(() => { fireEvent.click(next); });
    expect(pill('intake').getAttribute('aria-expanded')).toBe('true');
    expect(prev.disabled).toBe(false);
    act(() => { fireEvent.click(prev); });
    expect(pill('sources').getAttribute('aria-expanded')).toBe('true');
  });

  // The lazy unit unmounts like every other section (so the entrance
  // replays on the way back); the picked step survives the remount.
  it('never holds the lazy unit mounted, and reopens the picked step after a remount', () => {
    const first = setup();
    act(() => { fireEvent.click(first.pill('ai')); });
    expect(first.q('[data-lazy-keep]')).toBeNull();
    first.unmount();
    const again = setup({ inView: false });
    expect(again.pill('ai').getAttribute('aria-expanded')).toBe('true');
    expect(again.pill('sources').getAttribute('aria-expanded')).toBe('false');
  });
});

describe('How I Use AI — compact viewer (≤960px, Apple phone layout)', () => {
  const compact = () => { viewport.desktop = false; return setup(); };

  // The pill's own card text, to check the summary prints the same thing.
  const cardText = (q: (s: string) => HTMLElement | null, id: string) =>
    q(`.ai-pill-open[aria-controls="ai-stage-${id}"]`)!.parentElement!.querySelector('.ai-pill-inner p')!.textContent;

  it('renders the viewer (not the retired card grid): pills as tabs, step 01 content under them', () => {
    const { container, q, pill, panel } = compact();
    expect(q('.ai-flow-grid')).toBeNull();
    const viewer = q('.ai-viewer')!;
    expect(viewer.classList.contains('is-compact')).toBe(true);
    expect(panel('sources').classList.contains('is-active')).toBe(true);
    expect(container.querySelector('.ai-pill.ai-cyan')!.classList.contains('is-current')).toBe(true);
    // no pill ever unfolds into a card on compact
    expect(container.querySelectorAll('.ai-pill.is-open')).toHaveLength(0);
    expect(pill('sources').getAttribute('aria-expanded')).toBe('false');
    // the summary sits between the pill row and the stage
    const summary = q('.ai-compact-summary')!;
    expect(summary.textContent).toContain(cardText(q, 'sources'));
    expect(summary.previousElementSibling!.classList.contains('ai-viewer-rail')).toBe(true);
    expect(summary.nextElementSibling!.classList.contains('ai-stage')).toBe(true);
  });

  it('tapping a pill swaps the content under the row and the stage, without unfolding', () => {
    const { container, q, pill, panel } = compact();
    act(() => { fireEvent.click(pill('intake')); });
    expect(container.querySelectorAll('.ai-pill.is-open')).toHaveLength(0);
    expect(panel('intake').classList.contains('is-active')).toBe(true);
    expect(q('.ai-compact-summary')!.textContent).toContain(cardText(q, 'intake'));
    expect(q('.ai-pill.is-current .ai-pill-open[aria-controls="ai-stage-intake"]')).not.toBeNull();
  });

  it('the summary skips what the pill already shows (icon, step, title); the badge rides the viewer frame', () => {
    const { q, pill } = compact();
    expect(q('.ai-viewer > .ai-stage-badge')).toBeNull(); // step 01 has none
    act(() => { fireEvent.click(pill('ai')); });
    const summary = q('.ai-compact-summary')!;
    expect(summary.querySelector('h3, .ai-glyph, .ai-pill-step, .ai-focal-badge')).toBeNull();
    expect(summary.querySelectorAll('.ai-tag').length).toBeGreaterThan(0);
    expect(q('.ai-viewer > .ai-stage-badge')!.textContent).toBe('CLAUDE · DRAFT');
  });

  it('every pill carries its step icon, shown in place of + on the current one', () => {
    const { container } = compact();
    container.querySelectorAll('.ai-pill').forEach(li => {
      expect(li.querySelector('.ai-pill-open .ai-pill-icon svg')).not.toBeNull();
    });
    // the unfold-only controls are gone
    expect(container.querySelector('.ai-pill-close')).toBeNull();
  });
});

// The six screens follow one request, DR-248, from Celine's LINE message to
// the delivery plan, and their details agree with each other.
describe('How I Use AI — the DR-248 thread across the screens', () => {
  beforeEach(() => { localStorage.setItem('lang', 'en'); });
  it('names DR-248 in the title bar and marks it on every hand-off', () => {
    const { q, panel } = setup();
    expect(q('.aas-title-ticket')!.textContent).toContain('DR-248');
    // Inbox: the LINE message is filed as DR-248, at the time Intake shows
    const first = panel('sources').querySelector('.aas-msg')!;
    expect(first.querySelector('.aas-msg-ticket')!.textContent).toBe('DR-248');
    const arrived = first.querySelector('.aas-msg-time')!.textContent;
    expect(panel('intake').querySelector('.aas-bubble-time')!.textContent).toBe(arrived);
    // …where the bot's keyword route answered with the UI/UX form she filled in
    expect(first.querySelector('.aas-msg-route')!.textContent).toBe('UI/UX form');
    expect(panel('intake').querySelector('.aas-reply-card')!.textContent).toContain('UI/UX request form');
    expect(panel('intake').querySelector('.aas-meta')!.textContent).toContain('UI/UX form');
    // AI Brief: three questions for the three gaps
    expect(panel('ai').querySelectorAll('.aas-missing li')).toHaveLength(3);
    expect(panel('ai').querySelectorAll('.aas-questions li')).toHaveLength(3);
    // Tracker: DR-248 is the highlighted row, fresh out of the brief
    const row = panel('tracking').querySelector('.aas-row.is-current')!;
    expect(row.textContent).toContain('DR-248');
    expect(row.textContent).toContain('Brief ready');
    // Review: picks up the brief's gaps; Workflow: kicks off once approved
    expect(panel('human').querySelector('.aas-from')!.textContent).toMatch(/3 gaps → 1 resolved, 2 risks/);
    expect(panel('workflow').querySelector('.aas-meta')!.textContent).toContain('Approved in Review');
  });

  // Mirrors Tim's real Make flows, kept tool-generic: a LINE OA keyword
  // router (forms / FAQ / services / hand-off, AI for the rest), a request
  // form → Sheets, an AI brief fed with design-trend RSS, a LINE + Gmail
  // ping to himself, and a Figma file built from the design system.
  it('follows the real intake flow without naming the AI vendor', () => {
    const { panel, container } = setup();
    const routes = Array.from(panel('sources').querySelectorAll('.aas-msg-route'), el => el.textContent);
    expect(routes).toEqual(expect.arrayContaining(['UI/UX form', 'Quote form', 'Graphic form', 'AI expand', 'Services', 'To Tim']));
    expect(panel('ai').querySelectorAll('.aas-trends li').length).toBeGreaterThan(0);
    expect(panel('human').querySelector('.aas-from')!.textContent).toContain('LINE + Gmail');
    expect(panel('workflow').querySelector('.aas-from')!.textContent).toContain('Figma file ready');
    expect(container.querySelector('.aas-window')!.textContent).not.toMatch(/Claude|Gemini|Tally/);
  });

  it('keeps the Tracker numbers consistent', () => {
    const { panel } = setup();
    const p = panel('tracking');
    const stats = Array.from(p.querySelectorAll('.aas-stat-num'), el => Number(el.textContent));
    expect(stats.reduce((a, b) => a + b, 0)).toBe(Number(p.querySelector('.aas-records')!.textContent));
    expect(p.querySelectorAll('.aas-spark-bar')).toHaveLength(7);
  });

  it('dates every Workflow phase inside Intake\'s Jun 03 — Jun 17 window', () => {
    const { panel } = setup();
    const dates = Array.from(panel('workflow').querySelectorAll('.aas-phase-date'), el => el.textContent);
    expect(dates).toHaveLength(5);
    expect(dates[0]).toMatch(/^Jun 03/);
    expect(dates[4]).toMatch(/Jun 14–17$/);
  });
});

// Regression: the Tracker's "Synced" pill is a header child, so the header
// stagger zeroes its opacity first; a later .from() then captured 0 as its
// end value and the pill stayed invisible after the intro.
it('the Tracker sync pill is visible once its intro has played', () => {
  const { q, pill } = setup();
  const advance = (s: number) => act(() => { gsap.updateRoot(gsap.ticker.time + s); });
  act(() => { fireEvent.click(pill('tracking')); });
  advance(0.5);
  advance(3);
  expect(q('#ai-stage-tracking .aas-sync-pill')!.style.opacity).not.toBe('0');
});

// Around the window: the client's LINE thread on a phone, the Make scenario
// behind each step in front, and the partner handoff on the last step.
describe('How I Use AI — the client, partner and Make views around the window', () => {
  beforeEach(() => { localStorage.setItem('lang', 'en'); });
  const visible = (root: Element) => Array.from(root.querySelectorAll<HTMLElement>('.aas-chat-msg')).filter(m => !m.hidden);

  it('grows the client chat one step at a time', () => {
    const { q, pill } = setup();
    const phone = q('.aas-phone')!;
    const counts: number[] = [];
    for (const id of ['sources', 'intake', 'ai', 'tracking', 'human', 'workflow']) {
      act(() => { fireEvent.click(pill(id)); });
      counts.push(visible(phone).length);
      // only the latest step's messages animate in
      const fresh = phone.querySelectorAll('.aas-chat-msg.is-new');
      expect(fresh.length).toBeGreaterThan(0);
      fresh.forEach(m => expect((m as HTMLElement).hidden).toBe(false));
    }
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(counts[0]).toBeLessThan(counts[5]);
    expect(phone.textContent).toContain('Onboarding redesign for the new tier');
    expect(phone.textContent).toContain('Kickoff Jun 03');
  }, 15000); // six full step intros: slow when the whole suite runs in parallel

  it('shows the current Make scenario in front, and the handoff on the last step', () => {
    const { q, container, pill } = setup();
    const on = () => Array.from(container.querySelectorAll('.aas-front.is-on'));
    act(() => { fireEvent.click(pill('ai')); });
    expect(on()).toHaveLength(1);
    expect(on()[0].textContent).toContain('AI brief');
    expect(Array.from(on()[0].querySelectorAll('.aas-flow-label'), l => l.textContent)).toEqual(['RSS', 'AI', 'JSON', 'Sheets']);
    act(() => { fireEvent.click(pill('workflow')); });
    expect(on()).toHaveLength(1);
    expect(on()[0].classList.contains('aas-handoff')).toBe(true);
    expect(on()[0].textContent).toContain('Figma');
    // hidden panels stay out of the accessibility tree
    container.querySelectorAll('.aas-front:not(.is-on)').forEach(f => expect(f.getAttribute('aria-hidden')).toBe('true'));
    expect(q('.ai-stage')!.textContent).not.toMatch(/Claude|Gemini|Tally/);
  });

  // jsdom has no layout: give the viewer frame a box to keep drags inside.
  const fakeLayout = () => vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return this.classList.contains('ai-viewer') ? new DOMRect(-100, -100, 200, 200) : new DOMRect(0, 0, 0, 0);
  });

  it('drags the phone and the front panels together on desktop', () => {
    fakeLayout();
    const { q, container } = setup();
    const phone = q('.aas-phone')!;
    fireEvent.pointerDown(phone, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(phone, { clientX: 60, clientY: 130, pointerId: 1 });
    fireEvent.pointerUp(phone, { pointerId: 1 });
    expect(phone.style.getPropertyValue('--dx')).toBe('-40px');
    expect(phone.style.getPropertyValue('--dy')).toBe('30px');
    expect(phone.classList.contains('is-dragging')).toBe(false);
    // every front panel shares one offset
    const front = container.querySelector<HTMLElement>('.aas-front.is-on')!;
    fireEvent.pointerDown(front, { button: 0, clientX: 0, clientY: 0, pointerId: 2 });
    fireEvent.pointerMove(front, { clientX: 25, clientY: -10, pointerId: 2 });
    fireEvent.pointerUp(front, { pointerId: 2 });
    container.querySelectorAll<HTMLElement>('.aas-front').forEach(f => {
      expect(f.style.getPropertyValue('--dx')).toBe('25px');
      expect(f.style.getPropertyValue('--dy')).toBe('-10px');
    });
    // moves after release don't drag it
    fireEvent.pointerMove(front, { clientX: 300, clientY: 300, pointerId: 2 });
    expect(front.style.getPropertyValue('--dx')).toBe('25px');
    vi.restoreAllMocks();
  });

  it('keeps a dragged piece inside the viewer frame', () => {
    fakeLayout();
    const { q } = setup();
    const phone = q('.aas-phone')!;
    fireEvent.pointerDown(phone, { button: 0, clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(phone, { clientX: -5000, clientY: 5000, pointerId: 1 });
    fireEvent.pointerUp(phone, { pointerId: 1 });
    expect(phone.style.getPropertyValue('--dx')).toBe('-100px');
    expect(phone.style.getPropertyValue('--dy')).toBe('100px');
    vi.restoreAllMocks();
  });

  it('does not drag on the compact (phone/tablet) layout', () => {
    viewport.desktop = false;
    const { q } = setup();
    const phone = q('.aas-phone')!;
    fireEvent.pointerDown(phone, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(phone, { clientX: 10, clientY: 10, pointerId: 1 });
    expect(phone.style.getPropertyValue('--dx')).toBe('');
  });
});

// Chinese mode: the mockup's content (messages, form values, statuses, the
// client's chat, the handoff) is Chinese apart from product names; the app
// chrome (title bar, meta lines, chips, column labels, dates) and the Make
// panel stay in English, as the products themselves would show them.
describe('How I Use AI — the mockup in Chinese', () => {
  it('writes the content in Chinese and keeps the chrome and Make panel English', () => {
    localStorage.setItem('lang', 'zh');
    const { q, pill, panel, container } = setup();
    // chrome
    expect(q('.aas-title b')!.textContent).toBe('Inbox');
    expect(q('.aas-status')!.textContent).toBe('Live');
    expect(panel('tracking').querySelector('.aas-sync-pill')!.textContent).toContain('Synced');
    expect(panel('workflow').querySelector('.aas-phase-date')!.textContent).toBe('Jun 03–04');
    // content
    expect(panel('sources').querySelector('.aas-msg-route')!.textContent).toBe('UI/UX 表單');
    expect(panel('sources').querySelector('.aas-msg-text')!.textContent).toContain('6/17 前可以嗎');
    expect(panel('intake').querySelector('.aas-reply-card')!.textContent).toBe('UI/UX 需求表單');
    expect(panel('tracking').querySelector('.aas-row.is-current')!.textContent).toContain('簡報完成');
    const phone = q('.aas-phone')!;
    expect(phone.textContent).toContain('LINE 官方帳號');
    expect(phone.textContent).not.toMatch(/Kickoff|Done, form sent|What do you need/);
    act(() => { fireEvent.click(pill('ai')); });
    const flow = container.querySelector('.aas-front.is-on')!;
    expect(flow.textContent).toContain('Scenario');
    expect(flow.textContent).toContain('AI brief');
    expect(Array.from(flow.querySelectorAll('.aas-flow-label'), l => l.textContent)).toEqual(['RSS', 'AI', 'JSON', 'Sheets']);
  });
});
