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
    expect(translations.zh.about_intro1_short).toContain('減法');
    expect(translations.zh.about_intro2_short).toContain('跟著環境');
    for (const lang of ['zh', 'en'] as const) expect(translations[lang].about_intro2_label).toBe('Context-Driven Visuals');
    // the tags back the examples in the copy: the Hsinchu app, the Kaohsiung
    // repair flow and the TMU radar chart; the CNC sim and the finance game
    expect(links('SYSTEMS_LINKS')).toEqual(['project_02.html', 'project_03.html', 'project_11.html']);
    expect(links('VISUAL_LINKS')).toEqual(['project_13.html', 'project_12.html']);
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
    expect(css).toMatch(/"photo intro intro stats stats"\s*"photo workflow workflow workflow workflow";/);
    // the intro cards split their column evenly; the stats keep their own rows
    expect(css).toMatch(/\.about-col--intro \{[^}]*grid-template-rows: 1fr 1fr;/);
    expect(css).toMatch(/\.about-col--stats \{[^}]*grid-template-rows: auto 1fr;/);
    expect((css.match(/\.about-col \{\s*display: contents;\s*\}/g) ?? []).length).toBe(2);
  });

  it('Service Domains’ digit is the shared stat size (no cqh fill that threw the roll off)', () => {
    expect(css).not.toMatch(/\.bento-area-domains \.digit-col-inner span \{[^}]*cqh/);
    expect(css).not.toContain('container-name: domains-num');
    expect(css).toMatch(/\.bento-area-domains \{ grid-area: domains; min-height: 240px; \}/);
  });

  it('Projects Delivered counts the portfolio', () => {
    const value = Number(tsx.match(/bento-area-projects[\s\S]*?data-value="(\d+)"/)![1]);
    expect(value).toBe(PROJECTS.length);
  });
});
