// Project-page cards get the homepage Contact card's cursor-following glow:
// one delegated pointermove sets --sc-x/--sc-y on the hovered card.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleSpotlightMove } from '../src/utils/cardSpotlight';

function makeCard(cls: string, left: number, top: number) {
  const card = document.createElement('div');
  card.className = cls;
  card.getBoundingClientRect = () => ({ left, top, right: left + 200, bottom: top + 100, width: 200, height: 100, x: left, y: top, toJSON() {} }) as DOMRect;
  const inner = document.createElement('span');
  card.appendChild(inner);
  document.body.appendChild(card);
  return { card, inner };
}

function move(target: Element, x: number, y: number, pointerType = 'mouse') {
  const e = new MouseEvent('pointermove', { clientX: x, clientY: y, bubbles: true }) as any;
  Object.defineProperty(e, 'pointerType', { value: pointerType });
  Object.defineProperty(e, 'target', { value: target });
  handleSpotlightMove(e);
}

describe('card spotlight', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { move(document.body, 0, 0); });

  it('tracks the pointer relative to the hovered .ds-card, from a nested child', () => {
    const { card, inner } = makeCard('ds-card', 100, 50);
    move(inner, 130, 90);
    expect(card.style.getPropertyValue('--sc-x')).toBe('30px');
    expect(card.style.getPropertyValue('--sc-y')).toBe('40px');
  });

  it('also covers .spotlight-card (project_13)', () => {
    const { card } = makeCard('chamfer-card spotlight-card', 0, 0);
    move(card, 12, 7);
    expect(card.style.getPropertyValue('--sc-x')).toBe('12px');
  });

  it('parks the previous card off-screen when the pointer moves to another card or off cards', () => {
    const a = makeCard('ds-card', 0, 0);
    const b = makeCard('ds-card', 300, 0);
    move(a.inner, 10, 10);
    move(b.inner, 310, 10);
    expect(a.card.style.getPropertyValue('--sc-x')).toBe('-500px');
    expect(b.card.style.getPropertyValue('--sc-x')).toBe('10px');
    move(document.body, 0, 0);
    expect(b.card.style.getPropertyValue('--sc-y')).toBe('-500px');
  });

  it('ignores touch and pen pointers', () => {
    const { card } = makeCard('ds-card', 0, 0);
    move(card, 20, 20, 'touch');
    expect(card.style.getPropertyValue('--sc-x')).toBe('');
  });
});

