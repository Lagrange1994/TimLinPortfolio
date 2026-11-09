// Bento grid gap filler. The portfolio grid auto-places cards with
// grid-auto-flow: dense; big cards take 2x2, small ones 1x1. With 13 cards
// (or a filtered subset) the cells rarely add up to whole rows, so holes
// are left behind. This widens small cards next to a hole until none is left.

export interface BentoItem {
  /** 2x2 card (only when the layout has room for it). */
  big: boolean;
}

interface Placed { row: number; col: number; w: number; h: number }

// Mirrors CSS grid's dense auto-placement: each item takes the first
// row-major slot (from the top) where it fits.
export function placeDense(sizes: { w: number; h: number }[], cols: number): Placed[] {
  const taken: boolean[][] = [];
  const free = (r: number, c: number) => !taken[r]?.[c];
  return sizes.map(({ w, h }) => {
    const width = Math.min(w, cols);
    for (let row = 0; ; row++) {
      for (let col = 0; col + width <= cols; col++) {
        let fits = true;
        for (let dr = 0; dr < h && fits; dr++) {
          for (let dc = 0; dc < width && fits; dc++) fits = free(row + dr, col + dc);
        }
        if (!fits) continue;
        for (let dr = 0; dr < h; dr++) {
          taken[row + dr] ??= [];
          for (let dc = 0; dc < width; dc++) taken[row + dr][col + dc] = true;
        }
        return { row, col, w: width, h };
      }
    }
  });
}

function holes(placed: Placed[], cols: number): { row: number; col: number }[] {
  const rows = Math.max(0, ...placed.map(p => p.row + p.h));
  const out: { row: number; col: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const covered = placed.some(p => row >= p.row && row < p.row + p.h && col >= p.col && col < p.col + p.w);
      if (!covered) out.push({ row, col });
    }
  }
  return out;
}

/** Column span for each item so the grid ends without empty cells. */
export function bentoSpans(items: BentoItem[], cols: number): number[] {
  const spans = items.map(it => (it.big && cols >= 4 ? 2 : 1));
  const size = (i: number) => ({ w: spans[i], h: items[i].big && cols >= 4 ? 2 : 1 });
  // Each pass closes one hole; the cap only guards against a layout that
  // never settles.
  for (let pass = 0; pass < items.length * cols; pass++) {
    const placed = placeDense(items.map((_, i) => size(i)), cols);
    const gaps = holes(placed, cols);
    if (gaps.length === 0) break;
    const before = gaps.length;
    // Widen the narrowest small card in the first hole's row (leftmost on a
    // tie), so the spare width spreads out: 2+2, not 1+3.
    const { row } = gaps[0];
    const isSmall = (p: Placed, i: number) => p.h === 1 && !(items[i].big && cols >= 4);
    let target = -1;
    placed.forEach((p, i) => {
      if (!isSmall(p, i) || p.row !== row) return;
      if (target < 0 || p.w < placed[target].w || (p.w === placed[target].w && p.col < placed[target].col)) target = i;
    });
    if (target < 0) break;
    spans[target]++;
    const after = holes(placeDense(items.map((_, i) => size(i)), cols), cols).length;
    if (after >= before) { spans[target]--; break; }
  }
  return spans;
}
