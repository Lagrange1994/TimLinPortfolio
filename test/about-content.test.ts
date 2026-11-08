import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { translations } from '../src/i18n/translations';
import { PROJECTS } from '../src/data/projects';

// About Me, phase 1 of the revision plan: short card copy, a tag per
// project behind each intro card's claim, the AI card handing off to How I
// Use AI, and a Projects count that matches the portfolio.
const root = resolve(__dirname, '..');
const tsx = readFileSync(resolve(root, 'src/components/AboutSection.tsx'), 'utf8');
const css = readFileSync(resolve(root, 'src/styles/portfolio.css'), 'utf8');
const notchTsx = readFileSync(resolve(root, 'src/components/NotchCard.tsx'), 'utf8');
const links = (name: string) => JSON.parse(tsx.match(new RegExp(`const ${name} = (\\[[^\\]]*\\]);`))![1].replace(/'/g, '"')) as string[];

describe('About content', () => {
  it('the cards show the short copy; the full paragraphs stay for the chat bot', () => {
    expect(tsx).toContain('t.about_intro1_short');
    expect(tsx).toContain('t.about_intro2_short');
    expect(tsx).toContain('t.about_ai_short');
    expect(tsx).not.toMatch(/__html: t\.about_p[123]\b/);
    const chat = readFileSync(resolve(root, 'api/_chat-core.ts'), 'utf8');
    for (const k of ['about_p1', 'about_p2', 'about_p3'] as const) {
      expect(chat).toContain(`zh.${k}`);
      expect(translations.zh[k].length).toBeGreaterThan(100);
    }
  });

  it('card copy stays shorter than the full paragraphs, in both languages', () => {
    const strip = (h: string) => h.replace(/<[^>]+>/g, '');
    for (const lang of ['zh', 'en'] as const) {
      const t = translations[lang];
      expect(strip(t.about_intro1_short).length).toBeLessThan(strip(t.about_p1).length);
      expect(strip(t.about_intro2_short).length).toBeLessThan(strip(t.about_p2).length);
      expect(strip(t.about_ai_short).length).toBeLessThan(strip(t.about_p3).length / 2);
      expect(t.about_ai_more).toBeTruthy();
    }
  });

  it('the intro cards name the key skills and software', () => {
    for (const lang of ['zh', 'en'] as const) {
      const t = translations[lang];
      for (const tool of ['Figma', 'Adobe XD', 'HTML / CSS', 'React / Vue']) expect(t.about_intro1_short).toContain(tool);
      for (const tool of ['Blender', 'Spline', 'Dora', 'WebGL', 'Photoshop', 'Illustrator', 'Lightroom']) expect(t.about_intro2_short).toContain(tool);
      // names stand out in bold, not in colour
      for (const key of ['about_intro1_short', 'about_intro2_short'] as const) {
        expect(t[key]).not.toMatch(/text-(primary|secondary)/);
        expect(t[key]).toContain(key === 'about_intro1_short'
          ? '<strong class="tool-name"><img class="tool-logo" src="./img/others/Figma_logo.png" alt="" />Figma</strong>'
          : '<strong class="tool-name"><img class="tool-logo" src="./img/others/Blender_logo.png" alt="" />Blender</strong>');
      }
      expect(t.about_ai_short).not.toMatch(/text-purple/);
      expect(t.about_ai_short).toContain('<strong>Claude</strong>');
    }
  });

  it('the bento tells the case-study story: on site, subtract, visuals by context', () => {
    expect(translations.zh.about_lead).toContain('現場');
    // the three principles now have their own row (layout B)
    expect(translations.zh.about_principle1_title).toBe('環境決定視覺');
    expect(translations.zh.about_principle2_title).toBe('先刪減再設計');
    expect(translations.zh.about_principle3_title).toBe('讓規則看得見');
    expect(translations.zh.about_intro1_short).toContain('現場');
    for (const lang of ['zh', 'en'] as const) expect(translations[lang].about_intro2_label).toBe('Context-Driven Visuals');
    // both cards read as labelled rows, the same rows in both languages
    expect((tsx.match(/className="bento-text bento-points"/g) ?? []).length).toBe(2);
    expect(css).toMatch(/\.bento-text\.bento-points \{[^}]*grid-template-columns: max-content 1fr;/);
    // each row label is a capsule with an icon from the self-hosted subset
    expect(css).toMatch(/\.bento-point-label \{[^}]*border-radius: 9999px;/);
    const icons = readFileSync(resolve(root, 'src/styles/icon-faces.css'), 'utf8');
    for (const lang of ['zh', 'en'] as const) {
      for (const key of ['about_intro1_short', 'about_intro2_short', 'about_cta_text'] as const) {
        const labels = translations[lang][key].match(/<span class="bento-point-label">.*?<\/span>/g)!;
        for (const l of labels) {
          const icon = l.match(/<i class="ph-bold (ph-[a-z-]+)" aria-hidden="true"><\/i>/)?.[1];
          expect(icon, l).toBeTruthy();
          expect(icons).toContain(`.ph-bold.${icon}:before`);
        }
      }
    }
    const rows = (h: string) => (h.match(/class="bento-point-label"/g) ?? []).length;
    for (const [key, n] of [['about_intro1_short', 3], ['about_intro2_short', 3]] as const) {
      expect(rows(translations.zh[key])).toBe(n);
      expect(rows(translations.en[key])).toBe(n);
    }
    // the tags back the copy: Tainan patrol and the environment backend
    // (site research), the police video system (specs); the CNC sim and the
    // finance game
    expect(links('SYSTEMS_LINKS')).toEqual(['project_04.html', 'project_09.html', 'project_01.html']);
    expect(links('VISUAL_LINKS')).toEqual(['project_13.html', 'project_12.html']);
  });

  it('layout B: a principles row and an availability card linking to #contact', () => {
    // a general rule and a scene each: no project tags any more
    expect(tsx).toContain('const PRINCIPLES = [1, 2, 3] as const;');
    for (const n of [1, 2, 3]) {
      for (const lang of ['zh', 'en'] as const) {
        const t = translations[lang] as Record<string, string>;
        expect(t[`about_principle${n}_title`]).toBeTruthy();
        expect(t[`about_principle${n}_text`]).toBeTruthy();
        expect(t[`about_principle${n}_tags`]).toBeUndefined();
      }
    }
    expect(tsx).toContain(`scrollToSectionAligned('contact')`);
    // each principle card is labelled, not just numbered
    // the number rides the card's top border as a capsule (NotchCard badge)
    expect(tsx).toContain(`badge={<><span className="about-notch-badge-dot" aria-hidden="true" />DESIGN PRINCIPLE · {String(n).padStart(2, '0')}</>}`);
    expect(tsx).not.toContain('bento-principle-num');
    // outside the clipped card, rising glued to it
    const notch = readFileSync(resolve(root, 'src/components/NotchCard.tsx'), 'utf8');
    expect(notch).toContain('<div className="about-notch-badge rise-soft" data-rise-with={`.${area} > .about-notch-card`} data-rise-lock="">{badge}</div>');
    for (const lang of ['zh', 'en'] as const) {
      for (const k of ['about_cta_status', 'about_cta_text', 'about_cta_button'] as const) expect(translations[lang][k]).toBeTruthy();
    }
    expect(css).toMatch(/\.about-col--principles \{[^}]*grid-template-areas: "p1 p2 p3";/);
    expect(css).toMatch(/\.about-col--profile \{[^}]*grid-template-areas: "photo" "cta";[^}]*grid-template-rows: auto auto;[^}]*align-content: start;/);
  });

  it('notched cards: tags and action buttons sit in a bottom-left notch', () => {
    // principles (one map), intro1, intro2, workflow, cta
    expect((tsx.match(/<NotchCard\b/g) ?? []).length).toBe(5);
    for (const area of ['bento-area-p${n}', 'bento-area-intro1', 'bento-area-intro2', 'bento-area-workflow', 'bento-area-cta']) {
      expect(tsx).toMatch(new RegExp(`<NotchCard\\s+(key=\\{n\\}\\s+)?area=[{"\`]+${area.replace(/[${}]/g, '\\$&')}`));
    }
    // the notch is measured from the tags; jsdom has no ResizeObserver
    expect(notchTsx).toContain(`typeof ResizeObserver === 'undefined'`);
    expect(tsx).toContain("import NotchCard from './NotchCard';");
    // one outline path (like My Portfolio's wall) clips the card and is
    // stroked as its border, so the border runs round the notch; no mask
    expect(css).toMatch(/\.about-notch > \.has-notch \{\s*clip-path: var\(--notch-clip, none\);\s*border-image: linear-gradient\(transparent, transparent\) 1;/);
    expect(notchTsx).toContain("w.style.setProperty('--notch-clip', `path('${d}')`);");
    expect(notchTsx).toContain('<svg ref={svg} className="notch-outline" aria-hidden="true">');
    expect(notchTsx).toContain('<path ref={outline} fill="none" />');
    expect(css.slice(css.indexOf('Notched cards (NotchCard'), css.indexOf('.notch-outline {'))).not.toMatch(/mask-image|mask-position/);
    // the clip cuts the card's own box-shadow, so light mode shadows the wrapper
    expect(css).toMatch(/:root\[data-theme="light"\] \.about-notch \{\s*filter: drop-shadow/);
    // both action buttons: the bigger capsule in the card's own colour
    expect((tsx.match(/className="about-more about-action"/g) ?? []).length).toBe(1);
    // the availability title reads "Open for opportunities", in bold
    for (const lang of ['zh', 'en'] as const) expect(translations[lang].about_cta_status).toBe('Open for opportunities');
    expect(translations.zh.about_cta_text).toContain('接受全職 / 兼職 / 專案合作');
    expect(css).toMatch(/\.about-status \{[^}]*font-weight: 700;[^}]*color: var\(--text\);/);
    // the availability card copies Contact's "open for work" strip: its
    // fill/border and its gradient glass button
    expect(tsx).toContain('className="bento-card card-spotlight sc-card about-cta-card rise-card"');
    expect(tsx).toContain(`className="about-more btn-glass btn-grad about-cta-btn" onClick={() => scrollToSectionAligned('contact')}`);
    expect(css).toMatch(/\.bento-card\.about-cta-card \{\s*background: linear-gradient\(135deg, rgba\(108, 99, 255, 0\.12\), rgba\(255, 101, 132, 0\.06\)\);\s*border-color: rgba\(108, 99, 255, 0\.25\);/);
    // the workflow action is a secondary button: the GitHub / Email glass pill
    expect(css).toMatch(/\.about-action \{[^}]*height: 46px;[^}]*background: var\(--noise-grain\) 0 0 \/ 180px 180px repeat, var\(--glass-bg-premium\);[^}]*color: var\(--text\);/);
    expect(css).toContain(':root[data-theme="light"] .about-action { color: oklch(from rgb(108, 99, 255) .5 .2 h); }');
    expect(css).toMatch(/:root\[data-theme="light"\] \.about-action \{[^}]*box-shadow: var\(--neu-raised-sm\);/);
    // the notch's inner corner is concentric with the capsule's round end
    expect(css).toMatch(/--nf: calc\(var\(--pr, 14px\) \+ var\(--ng\)\);/);
    expect(notchTsx).toContain(`setProperty('--pr'`);
    // project tags sit on one tray capsule: the card's colour at 20%
    expect(css).toMatch(/\.about-notch-tags:has\(> \.about-proof-tag\) \{[^}]*border-radius: 20px;[^}]*color-mix\(in oklab, var\(--tone-vivid\) 20%, transparent\)/);
    // with the cards' liquid-glass edge: tinted border, inset sheen, top highlight
    expect(css).toMatch(/\.about-notch-tags:has\(> \.about-proof-tag\) \{[^}]*border: 1px solid rgba\(var\(--tone\), \.34\);[^}]*box-shadow: var\(--card-edge\);/);
    expect(css).toMatch(/\.about-notch-tags:has\(> \.about-proof-tag\)::before \{[^}]*linear-gradient\(90deg, transparent, rgba\(255, 255, 255, \.4\), transparent\)/);
    // light mode: the tray is a raised white-card capsule
    expect(css).toMatch(/:root\[data-theme="light"\] \.about-notch-tags:has\(> \.about-proof-tag\) \{\s*background: var\(--neu-bg\);\s*box-shadow: var\(--neu-raised-sm\);/);
    // the tags rise with their card, not on a later band of their own
    expect(notchTsx).toContain('data-rise-with={`.${area} > .has-notch`}');
  });

  it('each card colour variant feeds --tone, on the card and its notch wrapper', () => {
    for (const v of ['cyan', 'purple', 'violet', 'human', 'spectrum']) {
      expect(css).toContain(`.bento-card.bento-${v}, .about-notch:has(> .bento-${v}) { --tone: var(--ai-${v}-rgb); }`);
    }
    expect(css).toMatch(/--tone-vivid: oklch\(from rgb\(var\(--tone\)\)/);
    // card titles: usual size and place, solid text colour at half
    // strength; no per-card colour or gradient; gradient tiles excluded
    expect(css).not.toContain('--tone-title');
    const title = css.match(/\.bento-card:not\(\.bento-stat-big\) \.bento-label,[^{]*\{([^}]*)\}/)![1];
    expect(title).not.toMatch(/font-size|margin|gradient|background-clip/);
    // full text colour, like Tech Stack's .tech-name (no half-strength fade)
    expect(title).toMatch(/font-weight: 800;\s*color: var\(--text\);/);
    expect(title).not.toContain('opacity');
  });

  it('Years / Projects / Domains: a vivid tile in the card colour, the number in a multicolour gradient', () => {
    for (const area of ['years', 'projects', 'domains']) expect(tsx).toMatch(new RegExp(`bento-stat-big bento-area-${area}`));
    // the phone rules shrinking Service Domains' digit must not win over it
    expect(css).toMatch(/\.bento-card\.bento-stat-big \.digit-col-inner span,/);
    // Years / Projects: a big frosted-glass icon tile, bottom-right
    expect(tsx).toMatch(/bento-area-years rise-card">\s*<span className="card-glass-highlight" aria-hidden="true" \/>\s*<div className="stat-glass-icon" aria-hidden="true"><i className="ph-bold ph-clock" \/><\/div>/);
    expect(tsx).toMatch(/bento-area-projects rise-card">\s*<span className="card-glass-highlight" aria-hidden="true" \/>\s*<div className="stat-glass-icon" aria-hidden="true"><i className="ph-bold ph-squares-four" \/><\/div>/);
    // big, and pushed past the right / bottom edges so the card crops it
    expect(css).toMatch(/\.stat-glass-icon \{[^}]*position: absolute;[^}]*right: -24px;[^}]*bottom: -24px;[^}]*width: 120px;[^}]*backdrop-filter: blur\(8px\);/);
    // the principle cards: the intro cards' top-down tint, in the capsules' purple
    expect(css).toMatch(/\.bento-card\.bento-principle \{\s*--card-tint: rgba\(108, 99, 255, \.24\);\s*border-color: rgba\(108, 99, 255, \.34\);/);
    // each tile its own page colour, purple to blue: #8A2BE2, #6C63FF, #00D4FF
    expect(css).toContain('.about-grid .bento-card.bento-stat-big.bento-area-years { --tone: 138, 43, 226; }');
    expect(css).toContain('.about-grid .bento-card.bento-stat-big.bento-area-projects { --tone: 108, 99, 255; }');
    expect(css).toContain('.about-grid .bento-card.bento-stat-big.bento-area-domains { --tone: 0, 212, 255; }');
    // dark mode: deep and low-light, from each tile's own colour
    expect(css).toMatch(/:root:not\(\[data-theme="light"\]\) \.about-grid \.bento-card\.bento-stat-big \{\s*--tone-deep: oklch\(from rgb\(var\(--tone\)\) \.3 \.13 h\);/);
    // light mode: same size, faded so it doesn't fight the label
    expect(css).toMatch(/:root\[data-theme="light"\] \.stat-glass-icon \{[^}]*opacity: \.4;/);
    // the intro cards carry no floating icon art: the logos sit inline in the copy
    expect(tsx).not.toMatch(/about-float|about-orbit/);
    expect(css).not.toMatch(/\.about-float|\.about-orbit/);
    expect(css).toMatch(/\.tool-logo \{[^}]*width: 1\.05em;/);
    // the workflow card's step chips start right of the notch button,
    // left-aligned, their top edge level with the button's top
    expect(css).toMatch(/\.bento-area-workflow \.ai-flow-stepper \{\s*align-self: flex-start;\s*justify-content: flex-start;\s*margin-left: calc\(var\(--nw\) - 12px\);\s*max-width: calc\(100% \+ 12px - var\(--nw\)\);\s*margin-bottom: calc\(-1 \* \(var\(--th\) \+ 24px\) \+ \(var\(--th\) - 28px\)\);/);
    // step chips the size of the project tags: a fixed 28px, 12.5px text
    expect(css).toMatch(/\.bento-area-workflow \.afs-step \{\s*gap: 6px;\s*box-sizing: border-box;\s*height: 28px;\s*padding: 0 12px;/);
    expect(css).toMatch(/\.bento-area-workflow \.afs-label-sep \{\s*font-size: 12\.5px;\s*line-height: 1\.3;/);
    expect(css).not.toContain('.ai-flow-stepper::after');
    // a minimum gap under the copy, even when the card is only as tall as
    // its content
    expect(css).toMatch(/\.bento-area-workflow \.ai-flow-stepper \{[^}]*padding-top: 20px;/);
    // kept out of the "lift every child above the spotlight" rule
    expect(css).toContain(':not(.domain-swap-stage):not(.stat-glass-icon):not(.notch-outline):not(.principle-art) {');
    // Projects keeps its own (green) colour
    expect(tsx).toContain('bento-card bento-human card-spotlight sc-card bento-stat-big bento-area-projects');
    expect(css).toMatch(/\.bento-card\.bento-stat-big,[\s\S]*?linear-gradient\(160deg, var\(--tone-deep\) 0%, var\(--tone-vivid\) 55%, var\(--tone-bright\) 100%\) !important;/);
    expect(css).toMatch(/\.bento-stat-big \.digit-col-inner span,[^{]*\{[^}]*font-size: var\(--big\);/);
    // the number in the tile's own colour family, lighter than the tile
    expect(css).toMatch(/--big-ink: linear-gradient\(135deg,\s*oklch\(from rgb\(var\(--tone\)\) \.97 \.05 h\)/);
    expect(css).toMatch(/\.bento-card\.bento-stat-big \.digit-col-inner span,[^{]*\{\s*background: var\(--big-ink\);[^}]*background-clip: text;[^}]*-webkit-text-fill-color: transparent;/);
  });

  it('one tag per linked project, every link a real project page', () => {
    for (const [key, name] of [['about_tags_systems', 'SYSTEMS_LINKS'], ['about_tags_visuals', 'VISUAL_LINKS']] as const) {
      const pages = links(name);
      for (const lang of ['zh', 'en'] as const) expect(translations[lang][key].split('|')).toHaveLength(pages.length);
      for (const page of pages) {
        expect(existsSync(resolve(root, page))).toBe(true);
        expect(PROJECTS.some(p => p.link === page)).toBe(true);
      }
    }
    expect(css).toMatch(/\.about-proof-tag \{/);
  });

  it('the AI card hands off to How I Use AI (#my-skills)', () => {
    expect(tsx).toContain(`scrollToSectionAligned('my-skills')`);
    const skills = readFileSync(resolve(root, 'src/components/SkillsSection.tsx'), 'utf8');
    expect(skills).toMatch(/<section id="my-skills"[^>]*>\s*<div ref=\{aiLabelRef\} className="section-label rise-soft"[^>]*>How I Use AI<\/div>/);
  });

  it('each Service Domains cover carries its industry label, in both languages', () => {
    const covers = tsx.match(/const DOMAIN_COVERS = \[([\s\S]*?)\];/)![1].match(/label: '/g)!.length;
    for (const lang of ['zh', 'en'] as const) expect(translations[lang].about_domain_labels.split('|')).toHaveLength(covers);
    expect(tsx).toContain(`<span className="domain-cover-label" aria-hidden="true" style={{ ['--label-bg' as string]: d.tone }}>{t.about_domain_labels.split('|')[i]}</span>`);
    // each label takes its cover's key colour, not plain dark
    expect((tsx.match(/img: '\.\/img\/my_portfolio\/[^']+', tone: '#[0-9A-F]{6}' \}/g) ?? []).length).toBe(6);
    expect(css).toMatch(/\.domain-cover-label \{[^}]*background: color-mix\(in oklab, var\(--label-bg/);
    expect(css).toMatch(/\.domain-cover-label \{[^}]*position: absolute;[^}]*top: 8px;[^}]*left: 8px;/);
  });

  it('desktop: intro cards and stats are two independent columns; tablet/phone unwrap them', () => {
    expect(tsx).toMatch(/<div className="about-col about-col--intro">[\s\S]*bento-area-intro1[\s\S]*bento-area-intro2[\s\S]*?<\/div>\s*<div className="about-col about-col--stats">[\s\S]*bento-area-years[\s\S]*bento-area-projects[\s\S]*bento-area-domains/);
    expect(css).toMatch(/"profile principles principles principles principles"\s*"profile intro intro stats stats"\s*"profile workflow workflow workflow workflow";/);
    // the intro cards split their column evenly; the stats keep their own rows
    expect(css).toMatch(/\.about-col--intro \{[^}]*grid-template-rows: 1fr 1fr;/);
    // the three stat cards share one height: desktop column, tablet and phone rows
    expect(css).toMatch(/\.about-col--stats \{[^}]*grid-template-rows: 1fr 1fr;/);
    expect(css).toContain('grid-template-rows: auto auto auto auto 1fr 1fr auto;');
    expect(css).toContain('grid-template-rows: auto auto auto auto auto auto auto 1fr 1fr auto auto;');
    expect((css.match(/\.about-col \{\s*display: contents;\s*\}/g) ?? []).length).toBe(2);
  });

  it('Service Domains’ digit is the shared stat size (no cqh fill that threw the roll off)', () => {
    expect(css).not.toMatch(/\.bento-area-domains \.digit-col-inner span \{[^}]*cqh/);
    expect(css).not.toContain('container-name: domains-num');
    expect(css).toMatch(/\.bento-area-domains \{ grid-area: domains; min-height: 240px; \}/);
  });

  it('Service Domains counts the six industries the case studies cover (public sector as one)', () => {
    const covers = tsx.match(/const DOMAIN_COVERS = \[([\s\S]*?)\];/)![1].match(/label: '/g)!.length;
    expect(covers).toBe(6);
    expect(translations.zh.about_domain_labels.split('|')[0]).toBe('公部門');
    expect(tsx).toContain('data-value={String(DOMAIN_COVERS.length)}');
    for (const lang of ['zh', 'en'] as const) expect(translations[lang].about_domains_summary.split(/[・·]/)).toHaveLength(covers);
    // every cover image is a real file
    for (const [, img] of tsx.matchAll(/img: '\.\/(img\/my_portfolio\/[^']+)'/g)) expect(existsSync(resolve(root, 'public', img)), img).toBe(true);
    // the caption is two lines of three, at every width
    expect(tsx).toMatch(/\{domainsFirstHalf\}\s*<br \/>\s*\{domainsSecondHalf\}/);
    expect(css).not.toContain('domains-caption-break');
  });

  it('Projects Delivered counts the portfolio', () => {
    const value = Number(tsx.match(/bento-area-projects[\s\S]*?data-value="(\d+)"/)![1]);
    expect(value).toBe(PROJECTS.length);
  });

  // Desktop: the profile, intro and stats columns share the outer grid's row
  // lines (subgrid), so the photo and availability card end exactly on the
  // middle cards' edges instead of the photo's aspect ratio landing off.
  it('desktop columns share row lines through subgrid', () => {
    const start = css.indexOf('@media (min-width: 1025px) {\r\n      .about-grid {') >= 0
      ? css.indexOf('@media (min-width: 1025px) {\r\n      .about-grid {')
      : css.indexOf('@media (min-width: 1025px) {\n      .about-grid {');
    expect(start).toBeGreaterThan(-1);
    const block = css.slice(start, start + 1600);
    expect(block).toMatch(/"profile intro intro stats stats"\s*"profile intro intro stats stats"/);
    expect(block).toMatch(/\.about-col--intro,\s*\.about-col--stats \{\s*grid-template-rows: subgrid;/);
    // the profile column stops at the intro/stats band: the photo keeps its
    // ratio, the availability card its content height, a free slot below;
    // the workflow card runs the full width
    expect(block).toMatch(/"profile intro intro stats stats"\s*"workflow workflow workflow workflow workflow"/);
    expect(block).toMatch(/\.about-col--profile \{\s*grid-template-rows: auto auto 1fr;\s*grid-template-areas: "photo" "cta" "slot";/);
    expect(block).not.toContain('.about-photo .pc-card');
  });

  // Principles as "one general line + scene": the copy names no project, no
  // project tags (so no notch), and a scene fills each card's lower half on
  // a dot-grid stage (02 drawn; 01 / 03 the stage for now)
  it('principles: one general line and a scene across the lower half', () => {
    const named: Record<number, string[]> = {
      1: ['指揮中心', '航空站', 'command centre', 'airport'],
      2: ['報修', '大螢幕', 'repair', 'wall-screen'],
      3: ['雷達圖', '須知', 'radar', 'eligibility'],
    };
    for (const n of [1, 2, 3]) for (const lang of ['zh', 'en'] as const) {
      const text = (translations[lang] as Record<string, string>)[`about_principle${n}_text`];
      for (const project of named[n]) expect(text).not.toContain(project);
    }
    // no notch prop on the principle cards
    const card = tsx.slice(tsx.indexOf('{PRINCIPLES.map(n => {'), tsx.indexOf('</NotchCard>', tsx.indexOf('{PRINCIPLES.map(n => {')));
    expect(card).not.toContain('notch=');
    expect(card).toContain('{n === 2 ? <PrincipleArtSubtract /> : <div className="principle-stage" aria-hidden="true" />}');
    expect(css).toMatch(/\.principle-stage \{[^}]*min-height: 160px;/);
    // a NotchCard without a notch: no notch class, outline or tags
    expect(notchTsx).toContain("className={`${className} about-notch-card${hasNotch ? ' has-notch' : ''}`}");
    expect(notchTsx).toContain('{hasNotch && <div ref={tags}');
    const art = readFileSync(resolve(root, 'src/components/PrincipleArt.tsx'), 'utf8');
    expect(art).toContain('<div className="principle-stage" aria-hidden="true">');
    expect(art).toContain('className="principle-art principle-art--subtract"');
    expect((art.match(/className="pa-bit pa-cut"/g) ?? []).length).toBe(5);
    expect((art.match(/className="pa-cta"/g) ?? []).length).toBe(1);
    expect(css).toMatch(/\.principle-stage \{\s*flex: 1 1 0;/);
    expect(css).toMatch(/\.bento-principle:hover \.principle-art \.pa-cut \{ opacity: 0;/);
    // light mode: the plain card casts its own shadow, the wrapper none
    expect(css).toContain(':root[data-theme="light"] .about-notch:not(:has(> .has-notch)) { filter: none; }');
  });

  // the slot under the availability card: GitHub and Email, buttons only,
  // the same links as Contact's; desktop only
  it('the profile column ends in GitHub / Email link buttons on desktop', () => {
    const contact = readFileSync(resolve(root, 'src/components/ContactSection.tsx'), 'utf8');
    const url = tsx.match(/const GITHUB_URL = '([^']+)';/)![1];
    const email = tsx.match(/const EMAIL = '([^']+)';/)![1];
    expect(contact).toContain(`href="${url}"`);
    expect(contact).toContain(`mailto:${email}`);
    // the two buttons in one row first, then a dated "Now" card
    expect(tsx).toMatch(/const NOW_UPDATED = '\d{4}\.\d{2}';/);
    for (const lang of ['zh', 'en'] as const) expect(translations[lang].about_now).toBeTruthy();
    expect(tsx).toMatch(/<div className="about-links rise-card">\s*<div className="about-link-row">\s*<a className="about-link-btn" href=\{GITHUB_URL\} target="_blank" rel="noreferrer">[\s\S]*?<a className="about-link-btn" href=\{`mailto:\$\{EMAIL\}`\}>[\s\S]*?<div className="about-now">[\s\S]*?NOW · \{NOW_UPDATED\}[\s\S]*?\{t\.about_now\}/);
    expect((tsx.match(/className="about-link-btn"/g) ?? []).length).toBe(2);
    expect(css).toMatch(/\.about-link-row \{\s*display: grid;\s*grid-template-columns: 1fr 1fr;/);
    // hidden by default, shown in the desktop slot (the later rule wins)
    const hidden = css.indexOf('.about-links { display: none; }');
    const shown = css.search(/\.about-links \{\s*grid-area: slot;\s*display: grid;/);
    expect(hidden).toBeGreaterThan(-1);
    expect(shown).toBeGreaterThan(hidden);
  });

  it('card body text is no bigger than the section lead', () => {
    expect(css).toMatch(/\.bento-text \{\s*font-size: 14px;/);
    expect(css).toMatch(/\.about-lead \{[^}]*font-size: 14px;/);
  });
});
