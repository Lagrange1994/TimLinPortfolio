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
        expect(t[key]).toContain(key === 'about_intro1_short' ? '<strong>Figma</strong>' : '<strong>Blender</strong>');
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
    const principles = [...tsx.matchAll(/\{ n: (\d), links: (\[[^\]]*\]) \}/g)]
      .map(m => ({ n: Number(m[1]), links: JSON.parse(m[2].replace(/'/g, '"')) as string[] }));
    expect(principles.map(p => p.n)).toEqual([1, 2, 3]);
    for (const { n, links: pages } of principles) {
      for (const lang of ['zh', 'en'] as const) {
        const t = translations[lang] as Record<string, string>;
        expect(t[`about_principle${n}_title`]).toBeTruthy();
        expect(t[`about_principle${n}_text`]).toBeTruthy();
        expect(t[`about_principle${n}_tags`].split('|')).toHaveLength(pages.length);
      }
      for (const page of pages) expect(PROJECTS.some(p => p.link === page), page).toBe(true);
    }
    expect(tsx).toContain(`scrollToSectionAligned('contact')`);
    for (const lang of ['zh', 'en'] as const) {
      for (const k of ['about_cta_status', 'about_cta_text', 'about_cta_button'] as const) expect(translations[lang][k]).toBeTruthy();
    }
    expect(css).toMatch(/\.about-col--principles \{[^}]*grid-template-areas: "p1 p2 p3";/);
    expect(css).toMatch(/\.about-col--profile \{[^}]*grid-template-areas: "photo" "cta";[^}]*grid-template-rows: auto auto;[^}]*align-content: start;/);
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
    expect(skills).toMatch(/<section id="my-skills"[^>]*>\s*<div className="section-label rise-soft">How I Use AI<\/div>/);
  });

  it('each Service Domains cover carries its industry label, in both languages', () => {
    const covers = tsx.match(/const DOMAIN_COVERS = \[([\s\S]*?)\];/)![1].match(/label: '/g)!.length;
    for (const lang of ['zh', 'en'] as const) expect(translations[lang].about_domain_labels.split('|')).toHaveLength(covers);
    expect(tsx).toMatch(/<span className="domain-cover-label" aria-hidden="true">\{t\.about_domain_labels\.split\('\|'\)\[i\]\}<\/span>/);
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
});
