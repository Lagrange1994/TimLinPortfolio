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
    expect(tsx).toMatch(/className="mcp-scroll">\s*<div className="mcp-bleed" ref=\{bleedRef\}>[\s\S]*?<div className="mcp-grid-wrap[^"]*"[^>]*>\s*<div className="mcp-zoom" ref=\{zoomRef\}>\s*<div className="mcp-grid" ref=\{gridRef\}>/);
  });

  // Measured while stuck, the sticky wrap's own ScrollTrigger band landed in
  // the wrong place and its rise reveal never fired (cards stayed opacity 0).
  it('reveals the wrap on the track\'s band, not its own sticky one', () => {
    expect(tsx).toMatch(/className="mcp-grid-wrap rise-card" data-rise-with="\.mcp-scroll"/);
  });

  // The heading used to scroll away while the grid was pinned. It now
  // renders inside the pinned frame, in the upper quarter, above the grid.
  it('pins the heading in the upper quarter, above the grid', () => {
    expect(tsx).toMatch(/<div className="mcp-bleed" ref=\{bleedRef\}>\s*\{header\}/);
    const skills = read('src/components/SkillsSection.tsx');
    expect(skills).toMatch(/<FigmaMcpShowcase\s+header=\{\s*<div className="figma-mcp-header rise-soft" data-rise-with="\.mcp-scroll">/);
    expect(block).toMatch(/\.mcp-scroll \.mcp-bleed \{[^}]*justify-content: flex-start;[^}]*padding-top: max\(96px, 12svh\);/);
    expect(block).toMatch(/\.mcp-scroll \.figma-mcp-header \{\s*margin: 0;/);
    // zoom grows down from the grid's top, never up over the heading
    expect(block).toMatch(/\.mcp-zoom \{\s*transform-origin: 24\.4% 0;/);
  });

  // phones (< 768px) keep the plain grid that scrolls with the page
  it('only runs where scroll-driven animations exist, motion is allowed, and not on phones', () => {
    expect(block).toMatch(/^@supports \(animation-timeline: view\(\)\) \{\n\s*@media \(prefers-reduced-motion: no-preference\) and \(min-width: 768px\) \{/);
  });

  it('pins the grid with sticky inside a tall track that owns the timeline', () => {
    expect(block).toMatch(/\.mcp-scroll \{[^}]*height: 340svh;[^}]*view-timeline: --mcp-zoom block;/);
    expect(block).toMatch(/\.mcp-scroll \.mcp-bleed \{[^}]*position: sticky;[^}]*top: 0;[^}]*height: 100svh;/);
  });

  it('zooms out first, then brings in hub, code card and trails, in that order', () => {
    const range = (sel: string) => block.match(new RegExp(`${sel} \\{[^}]*animation-range: contain (\\d+)% contain (\\d+)%[;,]`))!.slice(1).map(Number);
    const zoom = range('\\.mcp-zoom');
    const hub = range('\\.mcp-scroll \\.mcp-hub');
    const code = range('\\.mcp-scroll \\.mcp-card\\.code-card');
    const trail = range('\\.mcp-scroll \\.mcp-trail-svg');
    expect(zoom).toEqual([0, 80]);
    expect(hub[0]).toBeLessThan(code[0]);
    expect(code[0]).toBeLessThan(trail[0]);
    // everything is in before the closing zoom starts (52%)
    expect(Math.max(hub[1], code[1], trail[1])).toBeLessThan(52);
  });

  // After the full grid holds, the camera moves on to the VS Code card: the
  // mirror of the opening Figma close-up, on the same single animation.
  it('opens on the Figma card, holds the full grid, then closes on the VS Code card', () => {
    const kf = block.match(/@keyframes mcp-zoom-out \{([\s\S]*?)\n\s*\}/)![1];
    expect(kf).toMatch(/0% \{ translate: 25\.6% 0; scale: 2;/);
    expect(kf).toMatch(/36\.5%, 65% \{ translate: 0% 0; scale: 1;/);
    // the close-up's size comes from FigmaMcpShowcase (--mcp-fit-*); the
    // fallback is the mirror of the opening shot
    expect(kf).toMatch(/100% \{ translate: var\(--mcp-fit-x, -76\.2%\) var\(--mcp-fit-y, 0px\); scale: var\(--mcp-fit-s, 2\); \}/);
  });

  // The closing zoom hands the frame to the AI: the heading fades out, the
  // hub and trails dim, Claude's panel grows and lights up.
  it('fades the heading, dims hub and trails, brings Claude forward during the closing zoom', () => {
    expect(block).toMatch(/\.mcp-scroll \.figma-mcp-header \{[^}]*animation: mcp-head-out[^}]*animation-range: contain 52% contain 62%;/);
    expect(block).toMatch(/\.mcp-scroll \.mcp-hub \{[^}]*mcp-dim linear both;[^}]*contain 52% contain 66%;/);
    expect(block).toMatch(/\.mcp-scroll \.mcp-trail-svg \{[^}]*mcp-dim linear both;[^}]*contain 52% contain 66%;/);
    // the AI is the focus, not the card: no glow on the card itself
    expect(block).not.toMatch(/mcp-code-focus/);
    expect(block).toMatch(/\.mcp-scroll \.mcp-chat \{[^}]*transform-origin: 100% 100%;[^}]*animation: mcp-chat 20s [^;]*var\(--mcp-play\), mcp-ai-focus ease-out both;[^}]*animation-timeline: auto, --mcp-zoom;[^}]*animation-range: normal, contain 56% contain 80%;/);
    // the loop shorthand restated here must match the original
    const loop = css.match(/\n {4}\.mcp-chat \{[^}]*animation: (mcp-chat 20s [^;]*);/)![1];
    expect(block).toContain(`animation: ${loop}, mcp-ai-focus`);
    // the marker only shows on the zoom track
    expect(css).toMatch(/\.mcp-code-cue \{\s*display: none;/);
    expect(block).toMatch(/\.mcp-code-cue \{\s*display: block;\s*top: calc\(100svh \+ 240svh \* \.68\);/);
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
