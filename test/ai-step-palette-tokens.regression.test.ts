import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// The How I Use AI step palette (one hue per step, shared by the .ai-card /
// .bento-card variants and the desktop viewer) lives in portfolio.css's
// :root as --ai-<name>-rgb + --ai-<name>. This fails if one of those hues is
// written out literally again instead of through the token, so a palette
// change stays a one-line edit.
const PALETTE: [string, string, string][] = [
  ['cyan', '00D4FF', '0,\\s*212,\\s*255'],
  ['purple', '139FF8', '19,\\s*159,\\s*248'],
  ['focal', 'B58BFF', '181,\\s*139,\\s*255'],
  ['violet', '2566F0', '37,\\s*102,\\s*240'],
  ['human', '7BE3B5', '123,\\s*227,\\s*181'],
  ['spectrum', '4A00E0', '74,\\s*0,\\s*224'],
  ['spectrum-bright', '8A2BE2', '138,\\s*43,\\s*226'],
];

const root = path.resolve(__dirname, '..');
// Keeps the newlines inside comments so reported line numbers stay real.
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ''));

// Lines that legitimately carry these hues as plain values: the token
// definitions themselves, and the logo gradient family (--grad-logo and the
// two hand-written copies of it), which predates this palette and is its
// own token set.
const allowed = (line: string) =>
  /--ai-[a-z-]+-rgb:|--grad-logo|--frame-glow|linear-gradient\(45deg|linear-gradient\(135deg,\s*#8A2BE2/i.test(line);

describe('How I Use AI step palette is tokenized', () => {
  it('defines a -rgb and a solid token for every step hue', () => {
    const css = fs.readFileSync(path.join(root, 'src/styles/portfolio.css'), 'utf8');
    for (const [name] of PALETTE) {
      expect(css).toMatch(new RegExp(`--ai-${name}-rgb:\\s*\\d+,\\s*\\d+,\\s*\\d+;`));
      expect(css).toMatch(new RegExp(`--ai-${name}:\\s*rgb\\(var\\(--ai-${name}-rgb\\)\\);`));
    }
  });

  // The viewer's pills take their accent from the rail's own light-blue →
  // purple ramp, in step order, not from the per-card palette above.
  it('maps the six viewer steps onto the rail ramp in order', () => {
    const css = fs.readFileSync(path.join(root, 'src/styles/portfolio.css'), 'utf8');
    for (let i = 1; i <= 6; i++) expect(css).toMatch(new RegExp(`--ai-step-${i}:\\s*[^;]+;`));
    expect(css).toMatch(/--ai-step-1:\s*var\(--ai-cyan\);/);
    expect(css).toMatch(/--ai-step-6:\s*var\(--ai-spectrum-bright\);/);
    ['ai-cyan', 'ai-purple', 'ai-focal', 'ai-violet', 'ai-human', 'ai-spectrum'].forEach((v, i) => {
      expect(css).toContain(`.ai-pill.${v}, .ai-viewer[data-accent="${v}"] { --ai-accent: var(--ai-step-${i + 1}); }`);
    });
    // The card icon follows the ramp too, in both themes.
    const flat = css.replace(/\r\n/g, '\n');
    expect(flat).toMatch(/\n {4}\.ai-viewer \.ai-pill \.ai-glyph \{[^}]*color: var\(--ai-accent\);/);
    expect(flat).toMatch(/:root\[data-theme="light"\] \.ai-viewer \.ai-pill \.ai-glyph \{[^}]*color: color-mix\(in oklab, var\(--ai-accent\)/);
    // …and so does the "Claude · Draft" badge, not the old pink gradient.
    // (the compact summary's badge shares these rules: `,\n    .ai-compact-summary …`)
    expect(flat).toMatch(/\n {4}\.ai-viewer \.ai-pill \.ai-focal-badge[^{]*\{[^}]*background: linear-gradient\(135deg, var\(--ai-accent\)/);
    expect(flat).toMatch(/:root\[data-theme="light"\] \.ai-viewer \.ai-pill \.ai-focal-badge[^{]*\{[^}]*color: color-mix\(in oklab, var\(--ai-accent\)/);
  });

  it.each(['src/styles/portfolio.css', 'src/components/AiAppStage.css'])('%s never writes a step hue literally', file => {
    const lines = stripComments(fs.readFileSync(path.join(root, file), 'utf8')).split(/\r?\n/);
    const offenders: string[] = [];
    lines.forEach((line, i) => {
      if (allowed(line)) return;
      for (const [name, hex, rgb] of PALETTE) {
        if (new RegExp(`#${hex}\\b|rgba?\\(\\s*${rgb}\\b`, 'i').test(line)) {
          offenders.push(`${file}:${i + 1} ${name} → use var(--ai-${name}) / rgba(var(--ai-${name}-rgb), a): ${line.trim().slice(0, 100)}`);
        }
      }
    });
    expect(offenders).toEqual([]);
  });
});
