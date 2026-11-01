import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Light mode: the How I Use AI app window wears the Figma MCP mockup's
// palette (.mcp-grid light tokens) instead of the neumorphic surface.
const stage = fs.readFileSync(path.resolve(__dirname, '../src/components/AiAppStage.css'), 'utf8').replace(/\r\n/g, '\n');
const site = fs.readFileSync(path.resolve(__dirname, '../src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');

describe('AI app window in light mode', () => {
  it('uses the Figma MCP mockup palette', () => {
    const mcp = site.match(/:root\[data-theme="light"\] \.mcp-grid \{([^}]*)\}/)![1];
    expect(mcp).toMatch(/--mcp-fg-rgb: 58, 58, 66;/);
    expect(mcp).toMatch(/--mcp-surface: var\(--bg-hover\);/);
    expect(mcp).toMatch(/--mcp-card-bg: #ffffff;/);

    const win = stage.match(/:root\[data-theme="light"\] \.aas-window \{([^}]*)\}/)![1];
    expect(win).toMatch(/--w-bg: var\(--bg-hover\);/);
    expect(win).toMatch(/--w-line: rgba\(58, 58, 66, 0\.09\);/);
    expect(win).toMatch(/--w-panel: #ffffff;/);
    expect(win).toMatch(/box-shadow: 0 0 0 1px var\(--w-line\), var\(--card-shadow-md\), var\(--card-edge\);/);
    expect(win).not.toMatch(/neu-/);
  });

  // The stage card behind the rail + window wears the MCP mockup canvas's
  // dot grid (1px, 8% ink, 18px) in both themes.
  it('gives the stage the Figma MCP canvas dot grid', () => {
    const dark = site.match(/\n {4}\.ai-viewer \{([^}]*)\}/)![1];
    expect(dark).toMatch(/--ai-stage-dot: rgba\(255, 255, 255, \.08\);/);
    expect(dark).toMatch(/radial-gradient\(var\(--ai-stage-dot\) 1px, transparent 1px\),/);
    expect(dark).toMatch(/background-size: 180px 180px, 18px 18px, auto, auto;/);
    const light = site.match(/:root\[data-theme="light"\] \.ai-viewer \{([^}]*)\}/)![1];
    expect(light).toMatch(/--ai-stage-dot: rgba\(58, 58, 66, \.08\);/);
    expect(light).toMatch(/background: radial-gradient\(var\(--ai-stage-dot\) 1px, transparent 1px\) 0 0 \/ 18px 18px, var\(--neu-bg\);/);
  });

  it('puts every screen\'s content on white cards', () => {
    expect(stage).toMatch(/:root\[data-theme="light"\] \.aas-table,\s*:root\[data-theme="light"\] \.aas-review,\s*:root\[data-theme="light"\] \.aas-phases \{ background: var\(--w-panel\); \}/);
    expect(stage).toMatch(/:root\[data-theme="light"\] \.aas-inbox \{[^}]*background: var\(--w-panel\);/);
    // Tinted callouts mix their tint into white, not the lavender window.
    for (const sel of ['.aas-block.is-warn', '.aas-block.is-ok', '.aas-quote']) {
      const esc = sel.replace(/\./g, '\\.');
      expect(stage).toMatch(new RegExp(`:root\\[data-theme="light"\\] ${esc} \\{ background: color-mix\\(in oklab, var\\(--[a-z]+\\) \\d+%, var\\(--w-panel\\)\\); \\}`));
    }
  });
});
