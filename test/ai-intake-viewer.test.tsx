import { render, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

// How I Use AI on desktop (>960px) is an Apple-style product viewer: a
// column of step pills on the left, one open at a time as a summary card,
// and a stage on the right showing that step's live demo. Tablet/phone keep
// the original expanding cards. The width is read from matchMedia, which
// jsdom lacks — `viewport` below decides what it answers.
const viewport = vi.hoisted(() => ({ desktop: true }));
vi.hoisted(() => {
  window.matchMedia = ((q: string) => ({
    matches: q === '(max-width: 960px)' ? !viewport.desktop : false,
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
import { AiIntakeSection } from '../src/components/SkillsSection';
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

  it('every pill carries the Contact Me card hover layers (wash, edge ring, hover shadow)', () => {
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
    expect(closed.querySelector<HTMLElement>('.ai-pill-bg')!.style.getPropertyValue('--sc-x')).toBe('12px');
  });

  it('the cursor glow follows a mouse, ignores touch, and parks off-card on leave', () => {
    const { container } = setup();
    const li = container.querySelector<HTMLElement>('.ai-pill.is-open')!;
    const bg = li.querySelector<HTMLElement>('.ai-pill-bg')!;
    fireEvent.pointerMove(li, { pointerType: 'touch', clientX: 40, clientY: 30 });
    expect(bg.style.getPropertyValue('--sc-x')).toBe('');
    fireEvent.pointerMove(li, { pointerType: 'mouse', clientX: 40, clientY: 30 });
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

  it('only holds the lazy unit mounted once the visitor picked a step other than the default', () => {
    const { q, pill } = setup();
    expect(q('[data-lazy-keep]')).toBeNull();
    act(() => { fireEvent.click(pill('ai')); });
    expect(q('[data-lazy-keep]')?.classList.contains('ai-stage')).toBe(true);
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
