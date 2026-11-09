import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { translations } from '../src/i18n/translations';

// The Chinese page's language rule (CLAUDE.md "文案語言規則"): structure and
// names in English, sentences people must read in Chinese.
const zh = translations.zh as unknown as Record<string, string>;
const cjk = /[一-鿿]/;
const text = (v: string) => v.replace(/<[^>]+>/g, '');

describe('language rule on the Chinese page', () => {
  it('section headlines, labels, step names, tabs and status lines are English', () => {
    const keys = Object.keys(zh).filter(k =>
      /^nav_/.test(k) || /^about_(intro\d|stat_\w+|ai)_label$/.test(k) || /^(ih|fl)_name_\d+$/.test(k) || /^ai_ph_(research|structure|design|validate|delivery)$/.test(k)
      || ['about_headline', 'tab_inhouse', 'tab_freelance',
        'about_cta_status', 'open_for_work', 'chat_status', 'process_policy_team_title', 'hero_role'].includes(k));
    expect(keys.length).toBeGreaterThan(30);
    for (const k of keys) expect([k, cjk.test(text(zh[k]))]).toEqual([k, false]);
  });

  it('eyebrows and h2 written in the components are English too', () => {
    for (const f of ['AboutSection', 'SkillsSection', 'PortfolioSection', 'ContactSection']) {
      const src = readFileSync(resolve(__dirname, `../src/components/${f}.tsx`), 'utf8');
      for (const m of src.matchAll(/className="section-label[^"]*"[^>]*>([^<{]+)</g)) expect(cjk.test(m[1])).toBe(false);
    }
  });

  it('sentences stay Chinese: subtitles, body, principle titles, questions, buttons', () => {
    for (const k of ['about_lead', 'contact_sub', 'portfolio_headline_sub', 'about_principle1_title', 'about_principle2_title',
      'about_principle3_title', 'faq_exp_q1', 'faq_biz_q1', 'faq_more_label', 'faq_tab_experience', 'faq_tab_freelance', 'line_btn', 'open_for_work_sub', 'hero_ask_label', 'p1_desc'])
      expect([k, cjk.test(text(zh[k]))]).toEqual([k, true]);
  });
});
