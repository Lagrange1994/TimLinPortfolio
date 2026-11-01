import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// The How I Use AI pills reuse the site's card hover layers. Light mode turns
// those layers' dark big-blur shadow off per card family by name — the pills
// were missing from that list, so a hovered pill in light mode showed the
// dark-mode rgba(0,0,0,.7) halo. Light cards are also plain --neu-bg, no tint.
const css = fs.readFileSync(path.resolve(__dirname, '../src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');

describe('How I Use AI pills in light mode', () => {
  it('turns the dark hover shadow off for the pills like every other card', () => {
    const rule = css.match(/((?::root\[data-theme="light"\][^{,]*,\s*)+:root\[data-theme="light"\][^{,]*)\{\s*box-shadow: none !important;\s*opacity: 0 !important;/);
    expect(rule, 'light-mode hover-shadow-off rule').not.toBeNull();
    expect(rule![1]).toContain('.ai-pill-bg > .card-hover-shadow');
    expect(rule![1]).toContain('.ai-card > .card-hover-shadow');
  });

  it('the open card is a chat bubble: small top-left corner, like .aas-bubble', () => {
    const block = css.match(/\n {4}\.ai-pill\.is-open \.ai-pill-bg \{([^}]*)\}/);
    expect(block, 'open-card rule').not.toBeNull();
    expect(block![1]).toMatch(/border-top-left-radius:\s*7px;/);
  });

  // Regression (phones): the pills' hidden card content still counted as
  // scrollable overflow, so a vertical drag scrolled the pill row ~240px and
  // the pills slid out of view.
  it('the compact pill row only scrolls sideways and drops the never-shown card content', () => {
    const compact = css.slice(css.indexOf('HOW I USE AI — compact viewer'));
    const row = compact.match(/\n {6}\.ai-pills \{[^}]*\}/)?.[0];
    expect(row).toMatch(/overflow-x:\s*auto;/);
    expect(row).toMatch(/overflow-y:\s*hidden;/);
    expect(compact).toMatch(/\n {6}\.ai-pill-inner \{ display: none; \}/);
  });

  // Phones: the chips heading sits 68px below the viewer — the Figma MCP
  // heading's gap to its cards (56 + 12).
  it('spaces the phone chips heading 68px below the viewer', () => {
    expect(css).toMatch(/\.process-scroll-wrap--tech \+ \.figma-mcp-header \{\s*margin-top: 56px;/);
    expect(css).toMatch(/\.ai-viewer \+ \.ai-chips-header \{\s*margin-top: 68px;/);
  });

  // Regression (phones): the selected pill's 1.5px light-cyan ring was hard to
  // see on white. Light mode: a soft 2px ring in the step colour, no fill,
  // and a shallower raise than the other pills so it reads as pressed.
  it('marks the selected compact pill in light mode as pressed, with a coloured ring only', () => {
    const block = css.match(/:root\[data-theme="light"\] \.ai-pill\.is-current:not\(\.is-open\) \.ai-pill-bg,\s*:root\[data-theme="light"\] \.ai-pill\.is-current:not\(\.is-open\):hover \.ai-pill-bg \{([^}]*)\}/);
    expect(block, 'light current-pill rule').not.toBeNull();
    expect(block![1]).toMatch(/inset 0 0 0 2px color-mix\(in oklab, var\(--ai-accent\) 55%, transparent\),/);
    expect(block![1]).toMatch(/var\(--neu-pressed\);/);
    expect(block![1]).not.toMatch(/background/);
  });

  // Phones: the selected pill's icon sits in the desktop .ai-glyph's rounded,
  // step-tinted box (ringed in dark; no ring and a darker icon in light).
  it('boxes the selected compact pill icon like the desktop glyph', () => {
    const dark = css.match(/\n {6}\.ai-pill\.is-current \.ai-pill-icon \{([^}]*)\}/)?.[1];
    expect(dark).toMatch(/border-radius:\s*8px;/);
    expect(dark).toMatch(/background: color-mix\(in oklab, var\(--ai-accent\) 16%, transparent\);/);
    expect(dark).toMatch(/border: 1px solid color-mix\(in oklab, var\(--ai-accent\) 42%, transparent\);/);
    const light = css.match(/:root\[data-theme="light"\] \.ai-pill\.is-current \.ai-pill-icon \{([^}]*)\}/)?.[1];
    expect(light).toMatch(/border: none;/);
    expect(light).toMatch(/color: color-mix\(in oklab, var\(--ai-accent\) 80%, #000\);/);
  });

  it('gives the open card a plain --neu-bg background, no step-colour tint', () => {
    const block = css.match(/:root\[data-theme="light"\] \.ai-pill\.is-open \.ai-pill-bg,\s*:root\[data-theme="light"\] \.ai-pill\.is-open:hover \.ai-pill-bg \{([^}]*)\}/);
    expect(block, 'light open-card rule').not.toBeNull();
    expect(block![1]).toMatch(/background:\s*var\(--neu-bg\);/);
    expect(block![1]).not.toMatch(/background:[^;]*--ai-accent/);
    // …but reads as pressed: the dark card's 1px step-colour ring and the
    // shallow --neu-pressed raise, which hover doesn't lift.
    expect(block![1]).toMatch(/box-shadow: inset 0 0 0 1px color-mix\(in oklab, var\(--ai-accent\) 32%, transparent\), var\(--neu-pressed\);/);
    expect(css).toMatch(/\n {4}\.ai-pill\.is-open \.ai-pill-bg \{[^}]*inset 0 0 0 1px color-mix\(in oklab, var\(--ai-accent\) 32%, transparent\)/);
  });

  // Desktop: ⌃ ⌄ sit like apple.com's MacBook Pro viewer — stacked in their
  // own column left of the pill list, centred on it; no visible counter.
  it('stacks the ⌃ ⌄ buttons in a column left of the pills, like Apple', () => {
    expect(css).toMatch(/grid-template-columns: calc\(var\(--ai-rail-w\) \+ var\(--ai-nav-col\)\) minmax\(0, 1fr\);/);
    const rail = css.match(/\n {4}\.ai-viewer-rail \{([^}]*)\}/)![1];
    expect(rail).toMatch(/align-items: center;/);
    expect(rail).not.toMatch(/flex-direction: column/);
    const nav = css.match(/\n {4}\.ai-viewer-nav \{([^}]*)\}/)![1];
    expect(nav).toMatch(/order: -1;/);
    expect(nav).toMatch(/flex-direction: column;/);
    expect(css).toMatch(/\.ai-viewer-count \{[^}]*clip-path: inset\(50%\);/);
  });

  // Light mode: anything clickable on a raised neumorphic shadow drops to
  // the shallow --neu-pressed while held down.
  it('flattens raised clickables to --neu-pressed while pressed', () => {
    expect(css).toMatch(/--neu-pressed:\s*2px 2px 5px var\(--neu-shadow-dark\),\s*-2px -2px 5px var\(--neu-shadow-light\);/);
    const block = css.slice(css.indexOf('LIGHT PRESSED'));
    for (const sel of ['.bento-card', '.process-card', '.contact-card', '.project-card-shadow', '.tech-item', '.slink', '.line-banner', '.cta-strip']) {
      expect(block).toContain(sel);
    }
    expect(block).toMatch(/:is\([^)]*\):active,\s*:root\[data-theme="light"\] \.process-scroll-wrap :is\(\.process-card, \.tech-item\):active \{\s*box-shadow: var\(--neu-pressed\) !important;/);
    expect(block).toMatch(/\.process-swipe-arrow:active:not\(:disabled\),\s*:root\[data-theme="light"\] \.ai-viewer-nav-btn:active:not\(:disabled\),\s*:root\[data-theme="light"\] \.ai-pill:not\(\.is-open\):not\(\.is-current\):active \.ai-pill-bg \{\s*box-shadow: var\(--neu-pressed\);/);
    expect(block).toMatch(/\.btn-glass:active \{\s*box-shadow:/);
  });
});
