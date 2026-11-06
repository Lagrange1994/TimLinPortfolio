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

  it('short copy is short, in both languages', () => {
    for (const lang of ['zh', 'en'] as const) {
      const t = translations[lang];
      for (const k of ['about_intro1_short', 'about_intro2_short', 'about_ai_short'] as const) {
        const text = t[k].replace(/<[^>]+>/g, '');
        expect(text.length).toBeLessThan(lang === 'zh' ? 70 : 180);
        expect(text.length).toBeLessThan(t[k === 'about_ai_short' ? 'about_p3' : k === 'about_intro1_short' ? 'about_p1' : 'about_p2'].length / 2);
      }
      expect(t.about_ai_more).toBeTruthy();
    }
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

  it('Projects Delivered counts the portfolio', () => {
    const value = Number(tsx.match(/bento-area-projects[\s\S]*?data-value="(\d+)"/)![1]);
    expect(value).toBe(PROJECTS.length);
  });
});
