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
  // run the start check right away instead of on the next frame
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 1; });
  return render(<FigmaMcpShowcase />);
};

// Desktop with the scroll zoom running: .mcp-zoom reports its animation and
// the track is `progress` of the way through (jsdom has neither).
const zoomAt = (container: HTMLElement, progress: { value: number }) => {
  const zoom = container.querySelector('.mcp-zoom')!;
  const track = container.querySelector('.mcp-scroll')!;
  const real = window.getComputedStyle;
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) =>
    el === zoom ? ({ animationName: 'mcp-zoom-out' } as CSSStyleDeclaration) : real(el, pseudo));
  const len = 1000;
  vi.spyOn(track, 'getBoundingClientRect').mockImplementation(() =>
    ({ top: -progress.value * len, height: len + window.innerHeight } as DOMRect));
};
const scrollTo = (progress: { value: number }, value: number) =>
  act(() => { progress.value = value; window.dispatchEvent(new Event('scroll')); });
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

  // The loop used to start the moment the grid came on screen, at the very
  // start of the zoom: people landed mid-story. Now it waits until the zoom
  // is halfway (25% of the track, the mockup mostly in view) and always
  // starts from 0s.
  it('waits until the scroll zoom is halfway, then plays from the start', () => {
    const { container } = setup();
    const grid = container.querySelector('.mcp-grid')!;
    const loop = { animationName: 'mcp-tim-x', currentTime: 4200 };
    const other = { animationName: 'mcp-zoom-out', currentTime: 300 };
    (grid as HTMLElement & { getAnimations: () => unknown[] }).getAnimations = () => [loop, other];
    const progress = { value: 0.1 };
    zoomAt(container, progress);

    fire(true);                      // on screen, but the zoom just began
    expect(grid.classList.contains('is-live')).toBe(false);
    scrollTo(progress, 0.24);
    expect(grid.classList.contains('is-live')).toBe(false);
    scrollTo(progress, 0.25);        // zoom halfway
    expect(grid.classList.contains('is-live')).toBe(true);
    expect(loop.currentTime).toBe(0);     // rewound to the Desktop page
    expect(other.currentTime).toBe(300);  // the scroll-driven zoom untouched

    loop.currentTime = 7000;
    scrollTo(progress, 0.8);         // still live: keeps playing, no rewind
    expect(loop.currentTime).toBe(7000);
    scrollTo(progress, 0.15);        // back up before halfway: pause
    expect(grid.classList.contains('is-live')).toBe(false);
    scrollTo(progress, 0.4);         // past halfway again: from the start again
    expect(grid.classList.contains('is-live')).toBe(true);
    expect(loop.currentTime).toBe(0);
  });

  it('stops listening to scroll on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = setup();
    unmount();
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
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
    for (const l of loops) expect(l, l).toMatch(/^mcp-[\w-]+ (16s|\.8s) .*infinite(?: backwards)? var\(--mcp-play\)$/);
    // one loop length for everything that has to stay in step
    expect(ops).not.toMatch(/mcp-[\w-]+ 12s/);
  });

  // x and y on nested layers with different easing: every move is an arc
  it('moves cursors in arcs, translate only, x in % and y in px', () => {
    expect(ops).toMatch(/\.mcp-cur \{[^}]*animation: mcp-tim-x 16s cubic-bezier\(\.45, 0, \.25, 1\)/);
    expect(ops).toMatch(/\.mcp-cur-y \{[^}]*animation: mcp-tim-y 16s cubic-bezier\(\.2, \.6, \.3, 1\)/);
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
    expect(x).toMatch(/^\s*0%, 4%\s+\{ translate: var\(--p-pgdesk-x\) 0; \}/);
    expect(x).toMatch(/9%, 12%\s+\{ translate: var\(--p-pgcomp-x\) 0; \}/);
    // the click (10.1%) is what flips the sidebar and the page
    expect(ops).toMatch(/@keyframes mcp-tim-click \{[\s\S]*?\n\s*10\.1%, /);
    expect(ops).toMatch(/@keyframes mcp-op-pg-on \{\n\s*0%, 10\.3%, 98\.5%, 100% \{ background-color: transparent; \}/);
    expect(ops).toMatch(/@keyframes mcp-op-page-out \{\n\s*0%, 10\.5%, 99\.5%, 100% \{ opacity: 1; \}/);
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
    // Tim's click at 20.1% lands between the hover and the selection
    expect(at('mcp-tim-click')).toMatch(/20\.1%/);
    expect(at('mcp-op-card-hover')).toMatch(/16\.5%, 20% \{ opacity: 1; \}/);
    expect(at('mcp-op-card-sel')).toMatch(/20\.4%, 54\.8% \{ opacity: 1; \}/);
    // then the button: hover, select (55.1%), and the title: hover, edit
    expect(at('mcp-op-btn-sel')).toMatch(/55\.1%, 66% \{ outline-color: #38bdf8; \}/);
    expect(at('mcp-op-title-sel')).toMatch(/69\.6%, 81% \{ outline-color: #38bdf8; \}/);
  });

  // The properties panel was dropped as clutter: Tim stays on the button,
  // clicks once to select it and once more to set its fill
  it('recolours the button from the button itself, no properties panel', () => {
    const { container } = setup();
    expect(container.querySelector('.mcp-pp')).toBeNull();
    expect(ops).not.toMatch(/mcp-pp|--p-swatch|mcp-op-swatch/);
    const x = ops.match(/@keyframes mcp-tim-x \{([\s\S]*?)\n {4}\}/)![1];
    expect(x).toMatch(/53%, 64%\s+\{ translate: var\(--p-btn-x\) 0; \}/);
    expect(ops).toMatch(/@keyframes mcp-tim-click \{[^@]*55\.1%, 61\.1%/);
    expect(ops).toMatch(/@keyframes mcp-op-recolor \{\n\s*0%, 61\.1%, 98%, 100% \{ opacity: 0; \}/);
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
    // each line 1% (.16s) after the last, from 35%, after the call returns
    expect(ops).toMatch(/\.mcp-op-ln \{ animation: mcp-op-ln 16s ease-out infinite backwards var\(--mcp-play\); animation-delay: calc\(var\(--i, 0\) \* \.16s\); \}/);
    expect(ops).toMatch(/@keyframes mcp-op-ln \{\n\s*0%, 35% \{ opacity: 0;/);
    expect(ops).toMatch(/@keyframes mcp-chat-spinning \{\n\s*0%, 25%, 34%, 100% \{ opacity: 0; \}\n\s*25\.5%, 33\.5% \{ opacity: 1; \}/);
    // Regression: each chat line held no keyframe after its entrance, so it
    // faded slowly from there to the end of the loop
    for (const kf of ['mcp-chat-user', 'mcp-chat-tool', 'mcp-chat-done']) {
      expect(ops, kf).toMatch(new RegExp(`@keyframes ${kf} \\{\\n\\s*0%, [\\d.]+%, 98%, 100% \\{ opacity: 0;[^}]*\\}\\n\\s*[\\d.]+%, 97% \\{ opacity: 1;`));
    }
    // Claude's cursor reads the selection while the call spins
    expect(ops).toMatch(/@keyframes mcp-ai-x \{\n\s*0%, 25%\s+\{ translate: var\(--p-read1-x\) 0; \}\n\s*33%, 36\.5%\s+\{ translate: var\(--p-read2-x\) 0; \}/);
  });

  // Claude's cursor used to wander over the chart, KPIs and swatches after
  // reading the selection, which had nothing to do with MCP. It now only
  // shows while an MCP call is at work: reading, then answering comment 1.
  it('shows Claude only while MCP works: reading the selection, answering the comment', () => {
    const at = (kf: string) => ops.match(new RegExp(`@keyframes ${kf} \\{([\\s\\S]*?)\\n {4}\\}`))![1];
    expect(ops).not.toMatch(/--p-(dash|chart|kpi|chip)-|mcp-op-bar\b|mcp-op-bar-alt/);
    expect(ops).toMatch(/\.mcp-cur--ai \.mcp-cur-in \{ opacity: 0; animation: mcp-ai-show 16s/);
    expect(at('mcp-ai-show')).toMatch(/0%, 23\.5%, 38%, 85\.5%, 97\.5%, 100% \{ opacity: 0; \}\n\s*25%, 36\.5%, 87%, 96% \{ opacity: 1; \}/);
    expect(at('mcp-ai-x')).toMatch(/89\.5%, 96%\s+\{ translate: var\(--p-reply-x\) 0; \}/);
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
    expect(at('mcp-cm-reply')).toMatch(/91%, 99% \{ opacity: 1;/);
    expect(at('mcp-op-gap1')).toMatch(/93%, 97% \{ translate: 0 4px; \}/);
    expect(at('mcp-op-gap2')).toMatch(/93%, 97% \{ translate: 0 8px; \}/);
    expect(ops).toMatch(/\.mcp-op-gap::after \{[^}]*content: '16';/);
    // Tim steps aside after opening it, so his tag doesn't cover the thread
    expect(at('mcp-tim-x')).toMatch(/85%, 87\.5%\s+\{ translate: var\(--p-badge-x\) 0; \}\n\s*91%, 95%\s+\{ translate: var\(--p-rest-x\) 0; \}/);
  });

  // The trails used to flow all the time. Now they drift dim and slow, run
  // fast and bright only during the two MCP calls (forward for
  // get_design_context, backward for use_figma), and the hub pulses then.
  it('runs the hub and trails only during the MCP calls', () => {
    const at = (kf: string) => ops.match(new RegExp(`@keyframes ${kf} \\{([\\s\\S]*?)\\n {4}\\}`))![1];
    expect(ops).toMatch(/\.mcp-trail-line \{ animation: mcp-op-trail 16s linear infinite var\(--mcp-play\); \}/);
    const offset = (stop: string) => Number(at('mcp-op-trail').match(new RegExp(`\\n\\s*${stop}\\s+\\{ stroke-dashoffset: (-?\\d+);`))![1]);
    const idle1 = offset('25\\.5%') - offset('0%');
    const call1 = offset('34%') - offset('25\\.5%');
    const call2 = offset('93\\.2%') - offset('90\\.5%');
    expect(Math.abs(call1)).toBeGreaterThan(Math.abs(idle1) * 10);  // much faster
    expect(call1).toBeLessThan(0);                                   // Figma -> code
    expect(call2).toBeGreaterThan(0);                                // code -> Figma
    expect(Math.abs(offset('100%') % 16)).toBe(0);                   // seamless loop (dash period 16)
    expect(at('mcp-op-hub-ring')).toMatch(/25\.6%, 28\.1%, 30\.6%, 90\.6% \{ opacity: \.9;/);
    expect(at('mcp-op-hub')).toMatch(/27%, 30%, 33%, 92% \{ scale: 1\.07; \}/);
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
      // modifiers and :nth-child variants are covered by their base selector
      if (one.includes('--') || one.includes(':nth-child')) continue;
      expect(list, one).toContain(one.replace(/^\.mcp-scroll /, ''));
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
