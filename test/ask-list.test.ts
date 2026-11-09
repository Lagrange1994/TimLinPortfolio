import { describe, it, expect } from 'vitest';
import { parseAskList } from '../src/utils/askList';
import { translations } from '../src/i18n/translations';

describe('parseAskList', () => {
  it('splits label|question pairs', () => {
    expect(parseAskList('A?|Full A?;B?|Full B?')).toEqual([{ label: 'A?', q: 'Full A?' }, { label: 'B?', q: 'Full B?' }]);
  });

  it('a label alone is also its question; empty items drop', () => {
    expect(parseAskList('Only;;')).toEqual([{ label: 'Only', q: 'Only' }]);
  });

  it('the FAQ rows: 5 questions for experience, 3 for freelance, in each language', () => {
    for (const lang of ['zh', 'en'] as const) {
      for (const [key, n] of [['faq_more_experience', 5],['faq_more_freelance', 3]] as const) {
        const items = parseAskList(translations[lang][key]);
        expect(items).toHaveLength(n);
        for (const it of items) expect(it.q.length).toBeGreaterThan(it.label.length);
      }
    }
  });
});
