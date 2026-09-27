import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import dsVars from '../src/projects/shared/dsVars.js';

const ROOT = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// Homepage design language on project pages: opt-in per page via
// <html class="ds-home">, styles in src/styles/ds-home.css, hooks on the
// shared components. project_01 is the pilot.
describe('ds-home opt-in design layer', () => {
  it('dsVars maps a prefix to its theme tokens', () => {
    expect(dsVars('police')).toEqual({
      '--ds-accent': 'var(--color-police-primary)',
      '--ds-on-accent': 'var(--color-police-dark)',
      '--ds-surface': 'var(--color-police-dark)',
    });
  });

  it('is loaded by the shared project stylesheet', () => {
    expect(read('src/styles/projects-tailwind.css')).toMatch(/@import "\.\/ds-home\.css";/);
  });

  it('every rule outside :root/keyframes/media is scoped to .ds-home', () => {
    const css = read('src/styles/ds-home.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const selectors = [...css.matchAll(/([^{}]+)\{/g)]
      .map(m => m[1].trim())
      .filter(s => s && !s.startsWith('@') && !/^(from|to)$/.test(s) && !/^:root(\[data-theme="light"\])?$/.test(s));
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(s).toContain('.ds-home');
  });

  it('dark cards use a lighter shade of the panel color, not flat neutral', () => {
    const css = read('src/styles/ds-home.css').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).toMatch(/\.ds-home \.ds-card \{[^}]*background-color: color-mix\(in srgb, var\(--ds-surface, #0F172A\) \d+%, #fff\)/);
  });

  // Regression: project_02's comparison cards jittered on hover — Tailwind v4
  // hover:translate-x-1 sets the standalone `translate` property, which the
  // static-card rule's transform:none didn't cancel.
  // Regression: the section grain rule excluded the hero by #hero, but most
  // pages' hero has no such id, so grain replaced the hero photo (04–12).
  it('section grain never targets the hero photo section', () => {
    const css = read('src/styles/ds-home.css').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).toMatch(/\.ds-home \.snap-section:not\(\[class\*="hero-bg-"\]\) \{[^}]*background-image: var\(--ds-grain\)/);
    expect(css).not.toMatch(/\.snap-section:not\(#hero\)/);
    for (let i = 1; i <= 12; i++) {
      const n = String(i).padStart(2, '0');
      expect(read(`src/projects/project_${n}.jsx`)).toMatch(/<section[^>]*className="snap-section[^"]*hero-bg-/);
    }
  });

  // One pain-card spec (project_01): subtitle + titled items + x-circle icon,
  // all in the shared pain red.
  it('PainPointCard always uses the shared pain red', () => {
    const card = read('src/projects/shared/PainPointCard.jsx').replace(/^\s*\/\/.*$/gm, '');
    expect(card).toMatch(/<h4 className="text-pain font-bold text-sm mb-3">\{subtitle\}/);
    expect(card).toMatch(/<span className="text-pain mr-3 mt-1"><i className="ph ph-x-circle"><\/i>/);
    expect(card).not.toMatch(/-secondary|tone/);
    const css = read('src/styles/projects-tailwind.css');
    expect(css).toMatch(/--color-pain: #FF6584;/);
    expect(css).toMatch(/:root\[data-theme="light"\] \{[^}]*--color-pain: #DA002C;/);
  });

  it.each(['01', '03', '04', '05', '06', '09', '10', '11', '12'])('project_%s pain block uses PainPointCard with a subtitle and titled items', (n) => {
    const jsx = read(`src/projects/project_${n}.jsx`);
    // up to the self-closing tag after items={…} (subtitles may hold <Icon />)
    const cards = jsx.match(/<PainPointCard[\s\S]*?items=\{[\s\S]*?\}\s*\/>/g) || [];
    expect(cards.length).toBeGreaterThanOrEqual(2); // main + swipe-peek copy
    for (const c of cards) {
      expect(c).toMatch(/subtitle=/);
      expect(c).toMatch(/title: t\(/);
    }
    expect(jsx).not.toMatch(/text-red-400 mr-3 mt-1">✕/);
  });

  it('project_06 pain items have titles in both languages', () => {
    const p06 = read('src/projects/project_06.jsx');
    expect((p06.match(/pain_(user|biz)_titles: \[("[^"]+",? ?){3}\]/g) || []).length).toBe(4);
  });

  it('project_06 strategy cards (tabs 2–4) use the FeatureCard text layout', () => {
    const cards = read('src/projects/project_06.jsx').split('\n').filter(l => l.includes('feature-card-minimal'));
    expect(cards.length).toBe(12);
    for (const l of cards) {
      expect(l).toMatch(/ p-5 /);
      expect(l).toMatch(/<h4 className="text-text font-bold text-sm mb-1">/);
      expect(l).toMatch(/<p className="text-xs text-text\/60 leading-relaxed">/);
    }
  });

  it('project_06 tabs 2–4 all stack their cards in the same space-y-4 wrapper', () => {
    const p06 = read('src/projects/project_06.jsx');
    for (const key of ['strat_1_desc', 'strat_2_desc', 'strat_3_desc']) {
      expect((p06.match(new RegExp(`\\{t\\('${key}'\\)\\}</p></div><div className="space-y-4">`, 'g')) || []).length).toBe(2);
    }
  });

  it('project_06 panel follows the shared page layout (project_01 rhythm, no one-off labels)', () => {
    const p06 = read('src/projects/project_06.jsx');
    expect(p06).not.toMatch(/p-4 lg:p-10 pb-24/);
    expect((p06.match(/space-y-8 lg:space-y-12 animate-fadeIn">\s*<div className="space-y-4 lg:space-y-6">/g) || []).length).toBe(2);
    expect(p06).not.toMatch(/tracking-wide uppercase mb-4">\{t\('strat_\d_sub'\)\}/);
    expect(p06).not.toMatch(/Value Delivered:|>Interface Gallery</);
    expect(p06).not.toMatch(/blur-\[60px\]/);
    expect(p06).not.toMatch(/lg:mb-3"/);
  });

  it('project_06 Before/After toggle uses white text when selected', () => {
    const p06 = read('src/projects/project_06.jsx');
    expect(p06).toMatch(/'bg-red-500 text-white shadow-lg/);
    expect(p06).toMatch(/'bg-tym-primary text-white shadow-lg/);
  });

  // Regression: the hover fill/border outweighed .is-active, so a just-clicked
  // card kept its hover look until the pointer left.
  it('hover fill/border never applies to the selected card', () => {
    const css = read('src/styles/ds-home.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const hoverBlocks = [...css.matchAll(/([^{}]*button\.ds-card[^{}]*:hover)\s*\{([^}]*)\}/g)];
    for (const [, sel, body] of hoverBlocks) {
      if (/background|border-color|box-shadow/.test(body)) expect(sel).toMatch(/:not\(\.is-active\)/);
    }
  });

  it('clickable cards lift 5px on hover from the shared layer, not per-page CSS', () => {
    const css = read('src/styles/ds-home.css').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).toMatch(/\.ds-home :is\(button\.ds-card\):hover \{[^}]*transform: translateY\(-5px\);/);
  });

  it('project_02 feature list buttons are hooked into ds-card', () => {
    const p02 = read('src/projects/project_02.jsx');
    expect((p02.match(/setActiveFeatureId\(feat\.id\)\} style=\{dsVars\('app'\)\} className=\{`ds-card ds-card--sm\$\{activeFeatureId === feat\.id \? ' is-active' : ''\}/g) || []).length).toBe(2);
  });

  it('static cards cancel both transform and translate on hover', () => {
    const css = read('src/styles/ds-home.css').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).toMatch(/\.ds-home div\.ds-card:hover \{[^}]*transform: none;[^}]*translate: none;/);
  });

  it('theme switch label is hidden unless the page opts in', () => {
    // `hidden` keeps non-ds pages' round icon button unchanged; ds-home.css
    // (unlayered) overrides it with display:flex.
    expect(read('src/projects/shared/ThemeToggle.jsx')).toMatch(/className="ds-switch-label hidden"/);
    expect(read('src/styles/ds-home.css')).toMatch(/\.ds-home \.ds-switch-label \{[^}]*display: flex;/);
  });

  it('project_01 marks its screenshot column as the shared page canvas', () => {
    expect(read('src/projects/project_01.jsx')).toMatch(/className="ds-stage /);
  });

  it('chrome buttons get the homepage .btn-glass hover glint without losing `fixed`', () => {
    const css = read('src/styles/ds-home.css').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).toMatch(/\.ds-home \.ds-chrome-btn::before \{[^}]*left: -100%;[^}]*transition: left 0\.6s ease;/);
    expect(css).toMatch(/\.ds-home \.ds-chrome-btn:hover::before \{\s*left: 100%;/);
    expect(css).toMatch(/\.ds-home \.ds-switch::before \{\s*content: none;/);
    // ScrollTopButton relies on Tailwind `fixed`; the shared chrome rule must not set position.
    const chrome = [...css.matchAll(/\.ds-home \.ds-chrome-btn \{([^}]*)\}/g)].map(m => m[1]).join('');
    expect(chrome).not.toMatch(/position:/);
  });

  // project_13 is its own design (own stylesheet, no shared chrome) and is
  // deliberately left out.
  it('project_01–12 opt in, project_13 does not', () => {
    const optedIn = fs.readdirSync(ROOT)
      .filter(f => /^project_\d+\.html$/.test(f))
      .filter(f => /<html[^>]*class="[^"]*\bds-home\b/.test(read(f)))
      .sort();
    expect(optedIn).toEqual(Array.from({ length: 12 }, (_, i) => `project_${String(i + 1).padStart(2, '0')}.html`));
  });

  it.each(Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')))(
    'project_%s: stage marked, InfoCards carry a prefix, no heading bars, hand-rolled cards hooked',
    (n) => {
      const jsx = read(`src/projects/project_${n}.jsx`);
      expect(jsx).toMatch(/className="ds-stage /);
      expect(jsx).not.toMatch(/<InfoCard>/);
      expect(jsx).not.toMatch(/w-1 h-6 bg-[a-z]+-[a-z]+ rounded-full mr-3/);
      expect(jsx).not.toMatch(/<div( key=\{[^}]*\})? className="feature-card/);
    },
  );

  it.each([
    ['InfoCard.jsx', /ds-card ds-card--sm/],
    ['PainPointCard.jsx', /ds-card feature-card/],
    ['FeatureCard.jsx', /ds-card\$\{active \? ' is-active' : ''\}/],
    ['GalleryItemButton.jsx', /ds-card ds-card--sm\$\{active \? ' is-active' : ''\}/],
    ['TabNav.jsx', /ds-tab\$\{activeTab === tab\.id \? ' is-active' : ''\}/],
    ['BackButton.jsx', /ds-chrome-btn/],
    ['ThemeToggle.jsx', /ds-chrome-btn ds-switch ds-switch--\$\{theme\}/],
    ['BackButton.jsx', /ds-back-label/],
    ['TabNav.jsx', /layoutId="ds-tab-indicator"\s+className="ds-tab-indicator hidden"/],
    ['ScrollTopButton.jsx', /ds-chrome-btn/],
    ['ToolPill.jsx', /ds-pill/],
  ])('%s carries its ds hook', (file, re) => {
    expect(read(`src/projects/shared/${file}`)).toMatch(re);
  });
});
