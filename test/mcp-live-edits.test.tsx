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

afterEach(() => { cleanup(); vi.unstubAllGlobals(); ioCallback = null; disconnect.mockClear(); });

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

  it('renders without IntersectionObserver (stays paused)', () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('IntersectionObserver', undefined);
    const { container } = render(<FigmaMcpShowcase />);
    expect(container.querySelector('.mcp-grid')!.classList.contains('is-live')).toBe(false);
  });

  it('pauses every loop through --mcp-play and runs it under .is-live', () => {
    expect(ops).toMatch(/\.mcp-grid \{ --mcp-play: paused; \}/);
    expect(ops).toMatch(/\.mcp-grid\.is-live \{ --mcp-play: running; \}/);
    const loops = ops.match(/animation: mcp-[\w-]+ 12s[^;]*;/g)!;
    expect(loops.length).toBeGreaterThanOrEqual(7);
    for (const l of loops) expect(l, l).toMatch(/infinite var\(--mcp-play\);$/);
  });

  it('moves cursors with translate only (compositor), x in %, y in px', () => {
    for (const kf of ['mcp-tim-path', 'mcp-ai-path']) {
      const body = ops.match(new RegExp(`@keyframes ${kf} \\{([\\s\\S]*?)\\n {4}\\}`))![1];
      expect(body).not.toMatch(/left|top|transform/);
      expect(body).toMatch(/translate: var\(--p-/);
    }
    // canvas points: x %, y px; sidebar points (left of the canvas): px, px
    for (const m of ops.matchAll(/--p-[\w-]+: ([^;]+);/g)) expect(m[1]).toMatch(/^(\d+%|-\d+px) \d+px$/);
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

    const path = ops.match(/@keyframes mcp-tim-path \{([\s\S]*?)\n {4}\}/)![1];
    expect(path).toMatch(/^\s*0%, 3%\s+\{ translate: var\(--p-pg-desk\); \}/);
    expect(path).toMatch(/9%, 12%\s+\{ translate: var\(--p-pg-comp\); \}/);
    // the click (10.5%) is what flips the sidebar and the page
    expect(ops).toMatch(/@keyframes mcp-tim-click \{\n[^\n]*\n\s*10\.5%, /);
    expect(ops).toMatch(/@keyframes mcp-op-pg-on \{\n\s*0%, 10\.5%, 96%, 100% \{ background-color: transparent; \}/);
    expect(ops).toMatch(/@keyframes mcp-op-page-out \{\n\s*0%, 10\.5%, 96%, 100% \{ opacity: 1; \}/);
    // no sidebar on tablet/phone: Tim's first stops move onto the canvas
    expect(ops).toMatch(/@media \(max-width: 1024px\) \{\n\s*\.mcp-ops \{ --p-pg-desk: \d+% \d+px; --p-pg-comp: \d+% \d+px; \}/);
  });

  it('keeps cursor tag text white on the accent fill', () => {
    expect(ops).toMatch(/\.mcp-cur-tag \{[^}]*background: var\(--cur-c\);[^}]*color: #fff;/);
  });

  it('stops all of it for reduced motion', () => {
    expect(ops).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\n\s*\.mcp-cur, \.mcp-cur-in, \.mcp-cur-ring, \.mcp-op-btn::after, \.mcp-op-line::before,\n\s*\.mcp-op-type, \.mcp-op-bars > span, \.mcp-op-comment,\n\s*\.mcp-op-pg, \.mcp-op-pg > span:last-child, \.mcp-op-page, \.mcp-op-desk-page \{ animation: none; \}\n\s*\.mcp-op-desk-page \{ display: none; \}/);
  });
});
