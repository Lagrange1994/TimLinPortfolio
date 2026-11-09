import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { translations, heroDescTexts } from '../src/i18n/translations';
import { PROJECTS } from '../src/data/projects';

const root = resolve(__dirname, '..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

// The hero says who Tim is the way About does (a product designer who makes
// complex systems manageable), and the site tells one set of numbers.
describe('positioning and numbers', () => {
  it('one role everywhere, never "Web Developer" (Tech Stack: "I am not an engineer")', () => {
    const role = 'UI/UX Product Designer';
    for (const lang of ['zh', 'en'] as const) {
      expect(translations[lang].hero_role).toBe(role);
      expect(`${translations[lang].nav_tagline_l1} ${translations[lang].nav_tagline_l2}`).toBe(role);
    }
    expect(read('src/components/ContactSection.tsx')).toContain(`<p>${role}</p>`);
    expect(read('src/components/AboutSection.tsx')).toContain(`<p>${role}</p>`);
    const html = read('index.html');
    expect(html).toContain(`"jobTitle": "${role}",`);
    expect(html).toContain(`<h1>Tim Lin — ${role}</h1>`);
    for (const src of [JSON.stringify(translations), html, read('src/components/ContactSection.tsx')]) expect(src).not.toContain('Web Developer');
  });

  it('the hero lines are the positioning, not generic marketing', () => {
    expect(heroDescTexts.zh).toEqual(['讓複雜系統變得可被掌控', '從現場觀察到開發交付，一路做到底']);
    expect(heroDescTexts.en[0]).toMatch(/complex systems/);
    for (const lang of ['zh', 'en'] as const) expect(translations[lang].hero_desc.split('<br>')).toEqual(heroDescTexts[lang]);
  });

  it('years and projects match the About stat tiles', () => {
    const about = read('src/components/AboutSection.tsx');
    expect(about).toContain('<div className="stat-num-wrap" data-value="5">');
    expect(about).toContain('<div className="stat-num-wrap" data-value="13">');
    expect(PROJECTS.length).toBe(13);
    expect(translations.zh.faq_exp_a1).toContain('5 年以上');
    expect(translations.zh.faq_exp_a1).toContain('交付 13 個以上專案');
    expect(translations.en.faq_exp_a1).toContain('5+ years');
    expect(translations.en.faq_exp_a1).toContain('13+ projects');
    expect(translations.zh.about_p1).toContain('五年以上');
    expect(translations.en.about_p1).toContain('five-plus years');
  });
});

describe('no sentence said twice', () => {
  it('Figma MCP and the FAQ do not repeat Tech Stack', () => {
    for (const lang of ['zh', 'en'] as const) {
      const t = translations[lang];
      expect(t.faq_exp_a6).not.toBe(t.skill_js);
    }
    expect(translations.zh.figma_mcp_desc).not.toContain('縮短設計與開發之間的溝通距離');
    expect(translations.zh.tech_sub).toContain('縮短設計與開發之間的溝通距離');
    expect(translations.en.figma_mcp_desc).not.toContain('closing the');
  });

  it('the risk review is one FAQ answer, the details left to the chat bot', () => {
    const keys = Object.keys(translations.zh);
    for (const k of ['faq_biz_q7', 'faq_biz_q8', 'faq_biz_q9', 'faq_exp_q7', 'process_policy_body']) expect(keys).not.toContain(k);
    expect(translations.zh.faq_biz_a4).toContain('合規審查');
    const bot = readFileSync(resolve(root, 'data/tim-faq.md'), 'utf8');
    for (const q of ['哪些案件可能會被拒絕？', '接案前會做哪些風險評估？', '為什麼要做這些審查？', '可以遠端工作嗎？', '目前是否開放工作機會？', '可以接受什麼類型的合作？', 'Tim 最近在研究或學習什麼？']) expect(bot).toContain(q);
  });
});

describe('project cards', () => {
  it('every card line is its own and the bot tells the same lines', async () => {
    const bot = (await import('../data/translations')) as unknown as { translations: Record<'zh' | 'en', Record<string, string>> };
    for (const lang of ['zh', 'en'] as const) {
      const lines = PROJECTS.map(p => translations[lang][`${p.id}_desc`]);
      expect(new Set(lines).size).toBe(PROJECTS.length);
      for (const l of lines) expect(l).not.toMatch(/介面設計$|介面修改$/);
      for (const p of PROJECTS) expect(bot.translations[lang][`${p.id}_desc`]).toBe(translations[lang][`${p.id}_desc`]);
    }
  });

  it('the big grid slots are the curated work, not random', () => {
    const src = read('src/components/PortfolioSection.tsx');
    expect(src).toContain("BENTO_FEATURED_IDS = ['p13', 'p1', 'p2']");
    expect(src).not.toContain('Math.random(');
    for (const id of ['p13', 'p1', 'p2']) expect(PROJECTS.some(p => p.id === id)).toBe(true);
  });
});

describe('the AI intake story deepens, it is not retold', () => {
  it('the FAQ answers their own question without the AI workflow', () => {
    for (const lang of ['zh', 'en'] as const) for (const k of ['faq_biz_a1', 'faq_biz_a3'])
      expect(translations[lang][k]).not.toMatch(/AI/);
  });
});
