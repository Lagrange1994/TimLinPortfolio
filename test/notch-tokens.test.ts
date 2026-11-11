import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CARD_RADIUS, NOTCH_GAP, NOTCH_TEXT_PAD, NOTCH_TURN } from '../src/utils/notchTokens';
import { DEFAULT_RADIUS } from '../src/utils/portfolioMask';

// Every notched card (About / Contact's NotchCard, My Portfolio's wall,
// How I Use AI's viewer) cuts its notch from one size system.
const css = fs.readFileSync(path.resolve(__dirname, '../src/styles/portfolio.css'), 'utf8');
const src = (f: string) => fs.readFileSync(path.resolve(__dirname, '../src', f), 'utf8');

describe('notch size system', () => {
  it('the CSS tokens mirror the JS ones', () => {
    expect(css).toContain(`--card-r: ${CARD_RADIUS}px;`);
    expect(css).toContain(`--notch-gap: ${NOTCH_GAP}px;`);
    expect(css).toContain(`--notch-text-pad: ${NOTCH_TEXT_PAD}px;`);
    expect(css).toContain(`--notch-turn: ${NOTCH_TURN}px;`);
    expect(css).toMatch(/\.about-notch \{\s*--ng: var\(--notch-gap\);\s*--nr: var\(--notch-turn\);/);
  });

  it('the notch gap is the bento gutter, the turn half the card corner', () => {
    expect(css).toMatch(/\.about-grid \{[^}]*gap: 12px;/);
    expect(NOTCH_GAP).toBe(12);
    expect(NOTCH_TURN).toBe(CARD_RADIUS / 2);
  });

  it('every implementation reads the shared sizes', () => {
    const stage = src('utils/aiStageNotch.ts');
    for (const line of ['STAGE_NOTCH_PAD = NOTCH_TEXT_PAD;', 'STAGE_NOTCH_TURN = NOTCH_TURN;', 'NAV_BAY_GAP = NOTCH_GAP;', 'NAV_BAY_END = NOTCH_TURN;']) expect(stage).toContain(line);
    expect(DEFAULT_RADIUS).toBe(CARD_RADIUS);
    expect(src('components/NotchCard.tsx')).toContain("import { NOTCH_GAP, NOTCH_TURN as NOTCH_END_RADIUS } from '../utils/notchTokens';");
    const wall = src('components/PortfolioSection.tsx');
    expect(wall).toContain('const NOTCH_PADDING = NOTCH_TEXT_PAD;');
    expect(wall).toContain('const LEG_GAP_PADDING = NOTCH_GAP;');
    expect(wall).toContain('isDesktopBreakpoint ? NOTCH_TURN :');
  });

  it('info cards share one padding and one hover lift', () => {
    expect(css).toContain('--card-pad: 24px;');
    expect(css).toContain('--card-lift: -4px;');
    const block = (sel: string) => css.match(new RegExp(String.raw`\n    \.${sel} \{[^}]*\}`))?.[0] ?? '';
    for (const sel of ['bento-card', 'tech-item', 'line-banner', 'contact-card']) {
      expect(block(sel), sel).toContain('padding: var(--card-pad);');
    }
    expect(block('cta-strip')).toContain('padding: 18px var(--card-pad);');
    for (const sel of ['bento-card', 'process-card', 'line-banner', 'contact-card', 'cta-strip']) {
      expect(block(`${sel}:hover`), sel).toContain('transform: translateY(var(--card-lift));');
    }
  });
});
