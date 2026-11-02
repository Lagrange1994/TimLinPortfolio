import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Light mode uses three whites site-wide: the page #F7FAFC (--neu-bg),
// sunken surfaces in lavender (--bg-hover, #EFEDF7) and raised cards #fff.
// These were the stray ones folded into that scale (2026-11).
const read = (p: string) => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8').replace(/\r\n/g, '\n');
const site = read('src/styles/portfolio.css');

describe('light mode — three whites', () => {
  it('defines the scale', () => {
    const light = site.match(/:root\[data-theme="light"\] \{([\s\S]*?)\n {4}\}/g)!.join('\n');
    expect(light).toMatch(/--neu-bg: #F7FAFC;/i);
    expect(light).toMatch(/--bg-hover: #EFEDF7;/i);
  });

  it('no longer uses the stray near-whites', () => {
    for (const hex of ['#ECECF1', '#F8FBFD', '#F3F1FA', '#FBFAFD', '#EEF1F6']) {
      expect(site.toUpperCase(), hex).not.toContain(`: ${hex};`);
    }
  });

  it('maps the theme switch and the MCP code window onto it', () => {
    expect(site).toMatch(/\.theme-switch\.theme-switch--light \{[^}]*background: var\(--bg-hover\);/);
    const mcp = site.match(/:root\[data-theme="light"\] \.mcp-grid \{([^}]*)\}/)![1];
    expect(mcp).toMatch(/--mcp-code-bg: var\(--bg-hover\);/);
    expect(mcp).toMatch(/--mcp-code-editor-bg: #ffffff;/);
    // the one deliberate step below the scale: the tab track on the window
    expect(mcp).toMatch(/--mcp-code-tab-bg: #E4E1F0;/);
    expect(site).toMatch(/--frame-glow-base: #F7FAFC;/);
  });
});
