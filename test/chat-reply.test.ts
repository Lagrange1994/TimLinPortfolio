import { describe, it, expect } from 'vitest';
import { chatReplyText } from '../src/utils/chatReply';
import { translations } from '../src/i18n/translations';

describe('chatReplyText', () => {
  for (const lang of ['zh', 'en'] as const) {
    const t = translations[lang] as unknown as Record<string, string>;
    it(`${lang}: a reply passes through; an empty 200 falls back`, () => {
      expect(chatReplyText(200, { reply: 'Hi' }, t)).toBe('Hi');
      expect(chatReplyText(200, {}, t)).toBe(t.chat_fallback_error);
    });
    it(`${lang}: our own refusal and limit messages pass through`, () => {
      expect(chatReplyText(400, { error: 'scope' }, t)).toBe('scope');
      expect(chatReplyText(429, { error: 'limit' }, t)).toBe('limit');
    });
    it(`${lang}: 402, 5xx and non-JSON platform errors show the calm line, never the raw error`, () => {
      for (const status of [402, 500, 502, 503, 504]) expect(chatReplyText(status, { error: 'RESOURCE_EXHAUSTED' }, t)).toBe(t.chat_unavailable);
      expect(chatReplyText(429, {}, t)).toBe(t.chat_unavailable);
      expect(t.chat_unavailable).toMatch(lang === 'zh' ? /AI 助理暫時無法使用/ : /temporarily unavailable/);
    });
  }
});
