import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Regression (phones, light mode): the Design Process / Tech Stack carousel
// cards used a downward-only shadow (spread = -blur), which on white read as
// no shadow at all. They now use the full neumorphism pair, kept within the
// 16px side room before the carousel's horizontal clip.
const css = fs.readFileSync(path.resolve(__dirname, '../src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');

const SIDE_ROOM = 16;

function layers(selector: string) {
  const i = css.indexOf(selector);
  expect(i, selector).toBeGreaterThan(-1);
  const block = css.slice(i, css.indexOf('}', i));
  const value = block.match(/box-shadow:([^;]*);/)![1].replace(/!important/, '');
  return value.split(/,(?![^(]*\))/).map(l => {
    const [x, y, blur, spread = '0px'] = l.trim().split(/\s+/).slice(0, 4).map(v => parseFloat(v));
    return { x, y, blur, spread: Number.isNaN(spread) ? 0 : spread };
  });
}

describe('phone carousel cards in light mode', () => {
  it.each([
    ':root[data-theme="light"] .process-scroll-wrap .process-card.border-glow-card,',
    ':root[data-theme="light"] .process-scroll-wrap .process-card:hover,',
  ])('%s has a visible shadow that fits the side room', selector => {
    const ls = layers(selector);
    expect(ls).toHaveLength(2);
    for (const l of ls) {
      // Visible: the blur is not cancelled out by an equal negative spread.
      expect(l.blur + l.spread).toBeGreaterThan(l.blur / 2);
      // Not clipped: side reach within the room up to the clip.
      expect(Math.abs(l.x) + l.blur + l.spread).toBeLessThanOrEqual(SIDE_ROOM);
    }
  });
});
