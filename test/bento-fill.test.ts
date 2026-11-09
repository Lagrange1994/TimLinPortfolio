import { describe, it, expect } from 'vitest';
import { bentoSpans, placeDense } from '../src/utils/bentoFill';
import { PROJECTS } from '../src/data/projects';

const BIG = ['p13', 'p1', 'p2'];
// Grid order puts the featured cards wherever PROJECTS has them.
const items = (filter?: string) =>
  PROJECTS.filter(p => !filter || p.category === filter).map(p => ({ big: BIG.includes(p.id) }));

function emptyCells(list: { big: boolean }[], cols: number) {
  const spans = bentoSpans(list, cols);
  const placed = placeDense(list.map((it, i) => ({ w: spans[i], h: it.big && cols >= 4 ? 2 : 1 })), cols);
  const rows = Math.max(...placed.map(p => p.row + p.h));
  const used = placed.reduce((n, p) => n + p.w * p.h, 0);
  return rows * cols - used;
}

describe('bentoSpans', () => {
  it('dense placement matches the grid: 3 big + 10 small leaves 2 holes at 4 columns', () => {
    const list = items();
    const placed = placeDense(list.map(it => ({ w: it.big ? 2 : 1, h: it.big ? 2 : 1 })), 4);
    const rows = Math.max(...placed.map(p => p.row + p.h));
    expect(rows * 4 - 22).toBe(2);
  });

  it('fills every hole for each filter and column count', () => {
    for (const filter of [undefined, 'web', 'mobile']) {
      for (const cols of [4, 2, 1]) {
        expect(emptyCells(items(filter), cols), `${filter ?? 'all'} @ ${cols}`).toBe(0);
      }
    }
  });

  it('only small cards widen; big cards keep 2 columns at desktop', () => {
    const list = items();
    const spans = bentoSpans(list, 4);
    list.forEach((it, i) => { if (it.big) expect(spans[i]).toBe(2); });
    expect(spans.filter((s, i) => !list[i].big && s > 1).length).toBeGreaterThan(0);
  });

  it('spreads the spare width: the last row of All is 2 + 2, not 1 + 3', () => {
    const list = items();
    const spans = bentoSpans(list, 4);
    const wide = spans.filter((s, i) => !list[i].big && s > 1);
    expect(wide).toEqual([2, 2]);
  });

  it('a full grid is left alone', () => {
    expect(bentoSpans([{ big: false }, { big: false }, { big: false }, { big: false }], 4)).toEqual([1, 1, 1, 1]);
    expect(bentoSpans([{ big: false }], 1)).toEqual([1]);
  });

  it('gives up instead of looping when no small card can fill a hole', () => {
    expect(bentoSpans([{ big: true }], 4)).toEqual([2]);
  });
});
