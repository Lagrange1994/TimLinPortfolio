import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import FigmaMcpShowcase from '../src/components/FigmaMcpShowcase';

// Live edits on the Figma MCP mockup: Tim's and Claude's cursors working on
// the file in a 12s CSS loop that only plays while the grid is on screen.
const css = fs.readFileSync(path.resolve(__dirname, '../src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
const ops = css.slice(css.indexOf('/* Live edits on the Figma mockup'), css.indexOf('/* Tablet: the two mockups'));

let ioCallback: IntersectionObserverCallback | null = null;
const disconnect = vi.fn();
class FakeIO {
  constructor(cb: IntersectionObserverCallback) { ioCallback = cb; }
  observe() {}
  disconnect() { disconnect(); }
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); ioCallback = null; disconnect.mockClear(); });

const setup = () => {
  vi.stubGlobal('IntersectionObserver', FakeIO);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  return render(<FigmaMcpShowcase />);
};

const fire = (isIntersecting: boolean) =>
  act(() => ioCallback!([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver));

describe('Figma MCP live edits', () => {
  it('draws both cursors and every edit target inside the Figma canvas', () => {
    const { container } = setup();
    const canvas = container.querySelector('.mcp-canvas')!;
    expect(canvas.querySelector('.mcp-ops .mcp-cur--tim .mcp-cur-tag')!.textContent).toBe('Tim');
    expect(canvas.querySelector('.mcp-ops .mcp-cur--ai .mcp-cur-tag')!.textContent).toBe('Claude');
    for (const sel of ['.mcp-op-btn', '.mcp-op-type', '.mcp-op-bars', '.mcp-op-comment']) {
      expect(canvas.querySelector(sel), sel).not.toBeNull();
    }
    // the MCP side of the button recolour: Card.tsx line 7 flashes
    expect(container.querySelector('.code-card .mcp-op-line')).not.toBeNull();
  });

  it('plays only while the grid is on screen', () => {
    const { container, unmount } = setup();
    const grid = container.querySelector('.mcp-grid')!;
    expect(grid.classList.contains('is-live')).toBe(false);
    fire(true);
    expect(grid.classList.contains('is-live')).toBe(true);
    fire(false);
    expect(grid.classList.contains('is-live')).toBe(false);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  // A scroll-position start gate and a rewind to 0s were tried and dropped:
  // the loop just plays while visible and resumes where it paused.
  it('resumes where it paused: no rewind, no scroll listener', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const { container } = setup();
    const grid = container.querySelector('.mcp-grid')!;
    const loop = { animationName: 'mcp-tim-x', currentTime: 4200 };
    (grid as HTMLElement & { getAnimations: () => unknown[] }).getAnimations = () => [loop];
    fire(true);
    fire(false);
    fire(true);
    expect(grid.classList.contains('is-live')).toBe(true);
    expect(loop.currentTime).toBe(4200);
    expect(add).not.toHaveBeenCalledWith('scroll', expect.anything(), expect.anything());
  });

  it('renders without IntersectionObserver (stays paused)', () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('IntersectionObserver', undefined);
    const { container } = render(<FigmaMcpShowcase />);
    expect(container.querySelector('.mcp-grid')!.classList.contains('is-live')).toBe(false);
  });

  it('pauses every loop through --mcp-play and runs it under .is-live', () => {
    expect(ops).toMatch(/\.mcp-grid \{ --mcp-play: paused; \}/);
    expect(ops).toMatch(/\.mcp-grid\.is-live \{ --mcp-play: running; \}/);
    // every animation in each shorthand (comma lists split before the name)
    const loops = Array.from(ops.matchAll(/animation: (mcp-[^;]+);/g))
      .flatMap(m => m[1].split(/,\s*(?=mcp-)/));
    expect(loops.length).toBeGreaterThanOrEqual(20);
    for (const l of loops) expect(l, l).toMatch(/^mcp-[\w-]+ (20s|\.8s) .*infinite(?: backwards)? var\(--mcp-play\)$/);
    // one loop length for everything that has to stay in step
    expect(ops).not.toMatch(/mcp-[\w-]+ 12s/);
  });

  // x and y on nested layers with different easing: every move is an arc
  it('moves cursors in arcs, translate only, x in % and y in px', () => {
    expect(ops).toMatch(/\.mcp-cur \{[^}]*animation: mcp-tim-x 20s cubic-bezier\(\.45, 0, \.25, 1\)/);
    expect(ops).toMatch(/\.mcp-cur-y \{[^}]*animation: mcp-tim-y 20s cubic-bezier\(\.2, \.6, \.3, 1\)/);
    const { container } = setup();
    for (const who of ['tim', 'ai']) {
      expect(container.querySelector(`.mcp-cur--${who} > .mcp-cur-y > .mcp-cur-in`), who).not.toBeNull();
    }
    for (const kf of ['mcp-tim-x', 'mcp-tim-y', 'mcp-ai-x', 'mcp-ai-y']) {
      const body = ops.match(new RegExp(`@keyframes ${kf} \\{([\\s\\S]*?)\\n {4}\\}`))![1];
      expect(body, kf).not.toMatch(/left|top|transform/);
      const axis = kf.endsWith('-x') ? /translate: var\(--p-\w+-x\) 0;/ : /translate: 0 var\(--p-\w+-y\);/;
      for (const line of body.trim().split('\n')) expect(line, kf).toMatch(axis);
    }
    // canvas x: %, sidebar x: -px (left of the canvas)
    for (const m of ops.matchAll(/--p-\w+-x: ([^;]+);/g)) expect(m[1]).toMatch(/^(\d+%|-\d+px)$/);
    for (const m of ops.matchAll(/--p-\w+-y: ([^;]+);/g)) expect(m[1]).toMatch(/^\d+px$/);
  });

  // The loop opens on the Desktop page, then Tim picks Components in the
  // Pages sidebar: highlight moves over and the canvas swaps pages.
  it('starts on the Desktop page and switches to Components from the sidebar', () => {
    const { container } = setup();
    const desk = container.querySelector('.mcp-op-pg--desk')!;
    const comp = container.querySelector('.mcp-op-pg--comp')!;
    expect(desk.textContent!.trim()).toBe('Desktop');
    expect(comp.textContent!.trim()).toBe('Components');
    expect(container.querySelectorAll('.mcp-canvas > .mcp-op-page')).toHaveLength(2);
    // the Desktop page is the very same Desktop Dashboard skeleton as the
    // small frame on the Components page, scaled up
    const big = container.querySelector('.mcp-canvas > .mcp-op-desk-page .mcp-op-desk-zoom')!;
    const small = Array.from(container.querySelectorAll('.mcp-canvas > .mcp-op-page span'))
      .find(el => el.textContent === 'Desktop Dashboard')!.nextElementSibling!;
    expect(big.innerHTML.trim()).toBe(small.innerHTML.trim());
    expect(big.querySelectorAll('svg')).toHaveLength(6);
    expect(css).toMatch(/\.mcp-op-desk-zoom \{[^}]*width: calc\(100% \/ 1\.6\);[^}]*height: calc\(100% \/ 1\.6\);[^}]*scale: 1\.6;/);
    // full size fills the panels: chart to the bottom, a bigger donut; the
    // small frame keeps its own 34px / 28px
    expect(css).toMatch(/\.mcp-op-desk-zoom \.mcp-op-bars \{[^}]*flex: 1;[^}]*height: auto !important;/);
    expect(css).toMatch(/\.mcp-op-desk-zoom \.mcp-dash-donut-row \{[^}]*flex: 1;/);
    expect(css).toMatch(/\.mcp-op-desk-zoom \.mcp-dash-donut \{[^}]*width: 64px !important;/);
    expect(css).not.toMatch(/(?<!mcp-op-desk-zoom )\.mcp-dash-donut \{/);
    expect(small.querySelector('.mcp-op-bars')!.getAttribute('style')).toMatch(/height: 34px;/);

    const x = ops.match(/@keyframes mcp-tim-x \{([\s\S]*?)\n {4}\}/)![1];
    expect(x).toMatch(/^\s*0%, 3\.2%\s+\{ translate: var\(--p-pgdesk-x\) 0; \}/);
    expect(x).toMatch(/7\.2%, 9\.6%\s+\{ translate: var\(--p-pgcomp-x\) 0; \}/);
    // the click (8.08%) is what flips the sidebar and the page
    expect(ops).toMatch(/@keyframes mcp-tim-click \{[\s\S]*?\n\s*8\.08%, /);
    expect(ops).toMatch(/@keyframes mcp-op-pg-on \{\n\s*0%, 8\.24%, 98\.8%, 100% \{ background-color: transparent; \}/);
    expect(ops).toMatch(/@keyframes mcp-op-page-out \{\n\s*0%, 8\.4%, 99\.6%, 100% \{ opacity: 1; \}/);
    // no sidebar on tablet/phone: Tim's first stops move onto the canvas
    expect(ops).toMatch(/@media \(max-width: 1024px\) \{\n\s*\.mcp-ops \{ --p-pgdesk-x: \d+%; --p-pgdesk-y: \d+px; --p-pgcomp-x: \d+%; --p-pgcomp-y: \d+px; \}/);
  });

  // Figma: hover outline first, the selection only once Tim clicks
  it('hovers, then selects Card / Primary on the click', () => {
    const { container } = setup();
    const sel = container.querySelector('.mcp-op-sel')!;
    expect(sel.textContent!.trim()).toBe('Card / Primary');
    expect(sel.querySelectorAll('span')).toHaveLength(5); // label + 4 handles
    expect(sel.previousElementSibling!.classList.contains('mcp-op-hover')).toBe(true);
    const at = (kf: string) => ops.match(new RegExp(`@keyframes ${kf} \\{([\\s\\S]*?)\\n {4}\\}`))![1];
    // Tim's click at 16.08% lands between the hover and the selection
    expect(at('mcp-tim-click')).toMatch(/16\.08%/);
    expect(at('mcp-op-card-hover')).toMatch(/13\.2%, 16% \{ opacity: 1; \}/);
    expect(at('mcp-op-card-sel')).toMatch(/16\.32%, 53\.84% \{ opacity: 1; \}/);
    // then the button: hover, select (54.08%), and the title: hover, edit
    expect(at('mcp-op-btn-sel')).toMatch(/54\.08%, 62\.8% \{ outline-color: #38bdf8; \}/);
    expect(at('mcp-op-title-sel')).toMatch(/65\.68%, 74\.8% \{ outline-color: #38bdf8; \}/);
  });

  // The properties panel was dropped as clutter: Tim stays on the button,
  // clicks once to select it and once more to set its fill
  it('recolours the button from the button itself, no properties panel', () => {
    const { container } = setup();
    expect(container.querySelector('.mcp-pp')).toBeNull();
    expect(ops).not.toMatch(/mcp-pp|--p-swatch|mcp-op-swatch/);
    const x = ops.match(/@keyframes mcp-tim-x \{([\s\S]*?)\n {4}\}/)![1];
    expect(x).toMatch(/52\.4%, 61\.2%\s+\{ translate: var\(--p-btn-x\) 0; \}/);
    expect(ops).toMatch(/@keyframes mcp-tim-click \{[^@]*54\.08%, 58\.88%/);
    expect(ops).toMatch(/@keyframes mcp-op-recolor \{\n\s*0%, 58\.88%, 98\.4%, 100% \{ opacity: 0; \}/);
  });

  // VS Code: the prompt, the Figma MCP tool call, then Card.tsx written
  it('runs the MCP call in VS Code and writes Card.tsx line by line', () => {
    const { container } = setup();
    const chat = container.querySelector('.code-card .mcp-chat')!;
    expect(chat.querySelector('.mcp-chat-user')!.textContent).toBe('Build the selected Figma frame');
    expect(chat.querySelector('.mcp-chat-tool')!.textContent).toBe('figma · get_design_context');
    expect(chat.querySelector('.mcp-chat-tool .mcp-chat-spin')).not.toBeNull();
    expect(chat.querySelector('.mcp-chat-done')!.textContent).toBe('Card.tsx+13');
    const lines = Array.from(container.querySelectorAll<HTMLElement>('.code-card .mcp-op-ln'));
    expect(lines).toHaveLength(13);
    expect(lines.map(l => l.style.getPropertyValue('--i'))).toEqual(Array.from({ length: 13 }, (_, i) => String(i)));
    expect(lines[4].classList.contains('mcp-op-line')).toBe(true); // line 7
    // each line .16s after the last, once the call returns
    expect(ops).toMatch(/\.mcp-op-ln \{ animation: mcp-op-ln 20s ease-out infinite backwards var\(--mcp-play\); animation-delay: calc\(var\(--i, 0\) \* \.16s\); \}/);
    expect(ops).toMatch(/@keyframes mcp-op-ln \{\n\s*0%, 38% \{ opacity: 0;/);
    expect(ops).toMatch(/@keyframes mcp-chat-spinning \{\n\s*0%, 20%, 37\.2%, 100% \{ opacity: 0; \}\n\s*20\.4%, 36\.21% \{ opacity: 1; \}/);
    // Regression: each chat line held no keyframe after its entrance, so it
    // faded slowly from there to the end of the loop
    for (const kf of ['mcp-chat-user', 'mcp-chat-tool', 'mcp-chat-done']) {
      expect(ops, kf).toMatch(new RegExp(`@keyframes ${kf} \\{\\n\\s*0%, [\\d.]+%, 98.4%, 100% \\{ opacity: 0;[^}]*\\}\\n\\s*[\\d.]+%, 97.6% \\{ opacity: 1;`));
    }
    // Claude's cursor reads the selection while the call spins
    expect(ops).toMatch(/@keyframes mcp-ai-x \{\n\s*0%, 20%\s+\{ translate: var\(--p-read1-x\) 0; \}\n\s*35\.22%, 39\.2%\s+\{ translate: var\(--p-read2-x\) 0; \}/);
  });

  // Claude's cursor used to wander over the chart, KPIs and swatches after
  // reading the selection, which had nothing to do with MCP. It now only
  // shows while an MCP call is at work: reading, then answering comment 1.
  it('shows Claude only while MCP works: reading the selection, answering the comment', () => {
    const at = (kf: string) => ops.match(new RegExp(`@keyframes ${kf} \\{([\\s\\S]*?)\\n {4}\\}`))![1];
    expect(ops).not.toMatch(/--p-(dash|chart|kpi|chip)-|mcp-op-bar\b|mcp-op-bar-alt/);
    expect(ops).toMatch(/\.mcp-cur--ai \.mcp-cur-in \{ opacity: 0; animation: mcp-ai-show 20s/);
    expect(at('mcp-ai-show')).toMatch(/0%, 18\.8%, 40\.4%, 78\.4%, 98%, 100% \{ opacity: 0; \}\n\s*20%, 39\.2%, 79\.6%, 96\.8% \{ opacity: 1; \}/);
    expect(at('mcp-ai-x')).toMatch(/81\.6%, 96\.8%\s+\{ translate: var\(--p-reply-x\) 0; \}/);
  });

  // Comment 1 has words now: Tim asks for a 16px gap, Claude answers in the
  // thread and makes the change through use_figma (the second MCP call)
  it('answers comment 1 and widens the gap through use_figma', () => {
    const { container } = setup();
    const thread = container.querySelector('.mcp-op-comment')!;
    expect(Array.from(thread.querySelectorAll('.mcp-cm'), m => m.textContent)).toEqual(['TGap 16px?', 'Done · updated via MCP']);
    expect(thread.querySelector('.mcp-cm-reply .mcp-cm-av.is-ai svg')).not.toBeNull();
    // the panel whose gap changes is the one that carries comment 1
    expect(thread.parentElement!.querySelector('.mcp-op-gap')!.children).toHaveLength(3);
    expect(container.querySelector('.code-card .mcp-chat-write')!.textContent).toBe('figma · use_figma');
    const at = (kf: string) => ops.match(new RegExp(`@keyframes ${kf} \\{([\\s\\S]*?)\\n {4}\\}`))![1];
    expect(at('mcp-cm-reply')).toMatch(/84\.65%, 99\.2% \{ opacity: 1;/);
    expect(at('mcp-op-gap1')).toMatch(/93\.66%, 97\.6% \{ translate: 0 4px; \}/);
    expect(at('mcp-op-gap2')).toMatch(/93\.66%, 97\.6% \{ translate: 0 8px; \}/);
    expect(ops).toMatch(/\.mcp-op-gap::after \{[^}]*content: '16';/);
    // Tim steps aside after opening it, so his tag doesn't cover the thread
    expect(at('mcp-tim-x')).toMatch(/78%, 80%\s+\{ translate: var\(--p-badge-x\) 0; \}\n\s*84\.65%, 96%\s+\{ translate: var\(--p-rest-x\) 0; \}/);
  });

  // The trails used to flow all the time. Now they drift dim and slow, run
  // fast and bright only during the two MCP calls (forward for
  // get_design_context, backward for use_figma), and the hub pulses then.
  it('runs the hub and trails only during the MCP calls', () => {
    const at = (kf: string) => ops.match(new RegExp(`@keyframes ${kf} \\{([\\s\\S]*?)\\n {4}\\}`))![1];
    expect(ops).toMatch(/\.mcp-trail-line \{ animation: mcp-op-trail 20s linear infinite var\(--mcp-play\); \}/);
    const offset = (stop: string) => Number(at('mcp-op-trail').match(new RegExp(`\\n\\s*${stop}\\s+\\{ stroke-dashoffset: (-?\\d+);`))![1]);
    const idle1 = offset('20\\.4%') - offset('0%');
    const call1 = offset('37\\.2%') - offset('20\\.4%');
    const call2 = offset('94\\.56%') - offset('82\\.4%');
    // per second: calls run clearly faster than the drift, but not
    // so much faster that the speed-up and slow-down feel like a jolt
    const ratio = (call1 / 16.8) / (idle1 / 20.4);
    expect(ratio).toBeGreaterThan(3);
    expect(ratio).toBeLessThan(6);
    expect(call1).toBeLessThan(0);                                   // Figma -> code
    expect(call2).toBeGreaterThan(0);                                // code -> Figma
    expect(Math.abs(offset('100%') % 16)).toBe(0);                   // seamless loop (dash period 16)
    expect(at('mcp-op-hub-ring')).toMatch(/21\.19%, 26\.92%, 32\.65%, 84\.2% \{ opacity: \.9;/);
    expect(at('mcp-op-hub')).toMatch(/23\.17%, 28\.9%, 34\.63%, 89\.16% \{ scale: 1\.06; \}/);  // three pulses, then one
    // curves, not jumps: both calls ease in and out, the hub on a sine ease,
    // the ripples on an ease-out
    for (const stop of ['20\\.4%', '82\\.4%']) {
      expect(at('mcp-op-trail')).toMatch(new RegExp(`\\n\\s*${stop}\\s+\\{[^}]*animation-timing-function: cubic-bezier\\(\\.37, 0, \\.63, 1\\); \\}`));
    }
    expect(ops).toMatch(/\.mcp-hub-pill \{ animation: mcp-op-hub 20s cubic-bezier\(\.37, 0, \.63, 1\)/);
    expect(ops).toMatch(/\.mcp-hub-ring \{ opacity: 0; animation: mcp-op-hub-ring 20s cubic-bezier\(\.22, 1, \.36, 1\)/);
    // phones keep the flow and ring they always had
    expect(ops).toMatch(/@media \(max-width: 767px\) and \(prefers-reduced-motion: no-preference\) \{\n\s*\.mcp-trail-line \{ animation: mcpDashFlow 6s linear infinite; \}\n\s*\.mcp-hub-ring \{ opacity: 1; animation: aiRingP 3s ease-out infinite; \}/);
  });

  it('keeps cursor tag text white on the accent fill', () => {
    expect(ops).toMatch(/\.mcp-cur-tag \{[^}]*background: var\(--cur-c\);[^}]*color: #fff;/);
  });

  it('stops all of it for reduced motion, on the finished state', () => {
    const rm = ops.slice(ops.lastIndexOf('@media (prefers-reduced-motion: reduce), (max-width: 767px) {'));
    expect(rm.length).toBeLessThan(ops.length);
    const list = rm.slice(rm.indexOf('{') + 1, rm.indexOf('{ animation: none; }'));
    // every rule that starts a loop (animation-name-only rules just swap
    // the keyframes on an element already listed)
    const animated = new Set(Array.from(ops.matchAll(/\n {4}([^\n{@]+?) \{[^}]*animation: mcp-/g), m => m[1].trim()));
    for (const sel of animated) for (const one of sel.split(/,\s*/)) {
      // modifiers are covered by their base selector. :nth-child(N) rules
      // outrank a plain off-switch (the gap rows kept looping on phones),
      // so they need an equally specific :nth-child(n) one
      if (one.includes('--')) continue;
      expect(list, one).toContain(one.replace(/^\.mcp-scroll /, '').replace(/:nth-child\(\d+\)/, ':nth-child(n)'));
    }
    expect(rm).toMatch(/\.mcp-op-desk-page \{ display: none; \}/);
  });

  // Phones keep the simple static mockup from before the live edits: the
  // same frozen finished state, minus cursors, Claude's chat and the hover
  it('shows phones the static mockup: no loop, cursors or chat', () => {
    expect(ops).toMatch(/@media \(prefers-reduced-motion: reduce\), \(max-width: 767px\) \{\n\s*\.mcp-cur, /);
    expect(ops).toMatch(/@media \(max-width: 767px\) \{\n\s*\.mcp-ops, \.mcp-chat, \.mcp-op-hover \{ display: none; \}/);
  });
});
