import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Figma MCP showcase: Apple-style scroll zoom-out. A tall .mcp-scroll track
// pins .mcp-bleed (sticky) while its view-timeline zooms .mcp-zoom out from
// the Figma card, then brings in the hub, trails and code card. CSS only.
const read = (p: string) => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8').replace(/\r\n/g, '\n');
const css = read('src/styles/portfolio.css');
const tsx = read('src/components/FigmaMcpShowcase.tsx');
const block = css.slice(css.indexOf('@supports (animation-timeline: view()) {'));

describe('Figma MCP scroll zoom-out', () => {
  it('nests track > bleed > wrap > zoom > grid, so the phone scale-sync keeps its own layer', () => {
    expect(tsx).toMatch(/className="mcp-scroll">\s*<div className="mcp-bleed">[\s\S]*?<div className="mcp-grid-wrap[^"]*"[^>]*>\s*<div className="mcp-zoom">\s*<div className="mcp-grid" ref=\{gridRef\}>/);
  });

  // Measured while stuck, the sticky wrap's own ScrollTrigger band landed in
  // the wrong place and its rise reveal never fired (cards stayed opacity 0).
  it('reveals the wrap on the track\'s band, not its own sticky one', () => {
    expect(tsx).toMatch(/className="mcp-grid-wrap rise-card" data-rise-with="\.mcp-scroll"/);
  });

  it('only runs where scroll-driven animations exist and motion is allowed', () => {
    expect(block).toMatch(/^@supports \(animation-timeline: view\(\)\) \{\n\s*@media \(prefers-reduced-motion: no-preference\) \{/);
  });

  it('pins the grid with sticky inside a tall track that owns the timeline', () => {
    expect(block).toMatch(/\.mcp-scroll \{[^}]*height: 240svh;[^}]*view-timeline: --mcp-zoom block;/);
    expect(block).toMatch(/\.mcp-scroll \.mcp-bleed \{[^}]*position: sticky;[^}]*top: 0;[^}]*height: 100svh;/);
  });

  it('zooms out first, then brings in hub, code card and trails, in that order', () => {
    const range = (sel: string) => block.match(new RegExp(`${sel} \\{[^}]*animation-range: contain (\\d+)% contain (\\d+)%;`))!.slice(1).map(Number);
    const zoom = range('\\.mcp-zoom');
    const hub = range('\\.mcp-scroll \\.mcp-hub');
    const code = range('\\.mcp-scroll \\.mcp-card\\.code-card');
    const trail = range('\\.mcp-scroll \\.mcp-trail-svg');
    expect(zoom).toEqual([0, 50]);
    expect(hub[0]).toBeLessThan(code[0]);
    expect(code[0]).toBeLessThan(trail[0]);
    expect(Math.max(hub[1], code[1], trail[1])).toBeLessThan(100);
    expect(block).toMatch(/@keyframes mcp-zoom-out \{ from \{ translate: 25\.6% 0; scale: 2; \} \}/);
  });

  // The hub is centred with transform: translate(-50%, -50%); animating the
  // separate scale/opacity properties leaves that intact.
  it('animates the hub with scale and opacity, never transform', () => {
    const kf = block.match(/@keyframes mcp-hub-in \{([^\n]*)\}/)![1];
    expect(kf).not.toMatch(/transform/);
  });

  it('keeps the hover radar on the code card while its scroll animation runs', () => {
    expect(block).toMatch(/\.mcp-scroll \.mcp-card\.code-card:hover \{[^}]*card-radar 3s ease-out infinite;[^}]*animation-timeline: --mcp-zoom, auto;/);
  });
});
