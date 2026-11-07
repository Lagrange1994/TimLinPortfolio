import { stairNotchPath } from './notchPath';
import { RISE_START_EVENT } from './useRiseReveal';

// How I Use AI: the viewer (the stage card) gets My Portfolio's top-left
// notch, with the section's label, title and subtitle sitting in it. Same
// approach as the wall and the About notches: one outline path, measured
// from the live text, clips the card and is stroked as its border.
//
// Everything is measured with offsetLeft/offsetTop (blind to the rise
// entrance's transforms) plus a text range for each line's right end (the
// entrance only moves/scales on y), so it can run at any point of the
// entrance. The values go on the section (data-ai-notch + CSS vars) — the
// viewer is a .rise-card whose entrance clears its own inline styles.

// Gap between the text and the notch's edges (the wall's NOTCH_PADDING).
export const STAGE_NOTCH_PAD = 16;
// Radius of the notch's own turns.
export const STAGE_NOTCH_TURN = 24;
// Desktop viewer only; the compact (≤960px) layout keeps its plain card.
export const STAGE_NOTCH_MQ = '(min-width: 961px)';

export type StageNotch = { n1w: number; n1h: number; n2w: number; n2h: number };

// The two steps from the text's extents, all relative to the card's
// top-left corner: label + title in the first, the subtitle in the second.
export function stageNotchSize(
  { labelRight, titleRight, titleBottom, subRight, subBottom }: {
    labelRight: number; titleRight: number; titleBottom: number; subRight: number; subBottom: number;
  },
  pad = STAGE_NOTCH_PAD,
): StageNotch {
  const n1h = titleBottom + pad;
  return {
    n1w: Math.max(labelRight, titleRight) + pad,
    n1h,
    n2w: subRight + pad,
    n2h: Math.max(0, subBottom + pad - n1h),
  };
}

// Gap between the notch and the content under it.
export const STAGE_NOTCH_GAP = 24;

// How far down each column must start: below every notch step that spans
// its left edge. `pieces` are what the app window column shows past its
// own box (the window, the front panel), as left edge + top relative to the
// column's top: each must clear the notch too, so nothing gets cut.
export function stageContentTops(
  n: StageNotch,
  { rail, stage, pieces = [] }: { rail: number; stage: number; pieces?: { x: number; top: number }[] },
  gap = STAGE_NOTCH_GAP,
) {
  const clear = (x: number) => (x < n.n2w ? n.n1h + n.n2h : x < n.n1w ? n.n1h : 0) + gap;
  return {
    rail: clear(rail),
    stage: Math.max(clear(stage), ...pieces.map(p => clear(p.x) - p.top)),
  };
}

// The columns' left edges inside the card and the stage's pieces (offsets,
// so the entrance's transforms don't count).
function columns(viewer: HTMLElement) {
  const rail = viewer.querySelector<HTMLElement>('.ai-viewer-rail');
  const stage = viewer.querySelector<HTMLElement>('.ai-stage');
  const v = docOffset(viewer);
  const s = stage ? docOffset(stage) : v;
  const pieces = stage
    ? [...stage.querySelectorAll<HTMLElement>('.aas-window, .aas-front')].map(el => {
      const o = docOffset(el);
      return { x: o.x - v.x, top: o.y - s.y };
    })
    : [];
  return { rail: rail ? docOffset(rail).x - v.x : 0, stage: s.x - v.x, pieces };
}

function docOffset(el: HTMLElement) {
  let x = 0, y = 0;
  for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement | null) {
    x += e.offsetLeft;
    y += e.offsetTop;
  }
  return { x, y };
}

// Where the element's text actually ends on the right (a block's own box
// spans the whole row).
function textRight(el: HTMLElement): number {
  const range = document.createRange();
  range.selectNodeContents(el);
  // (no text layout without it, e.g. jsdom: the element's own box)
  if (typeof range.getBoundingClientRect !== 'function') return docOffset(el).x + el.offsetWidth;
  const r = range.getBoundingClientRect();
  return docOffset(el).x + (r.right - el.getBoundingClientRect().left);
}

export function attachStageNotch(
  viewer: HTMLElement,
  label: HTMLElement,
  title: HTMLElement,
  sub: HTMLElement,
  svg: SVGSVGElement,
  path: SVGPathElement,
): () => void {
  const host = viewer.closest('section') ?? viewer.parentElement!;
  const mq = typeof window.matchMedia === 'function' ? window.matchMedia(STAGE_NOTCH_MQ) : null;

  const clear = () => {
    delete host.dataset.aiNotch;
    for (const v of ['--ai-viewer-mt', '--ai-rail-top', '--ai-stage-top', '--ai-notch-clip']) host.style.removeProperty(v);
    path.removeAttribute('d');
  };

  const sync = () => {
    if (!mq?.matches) { clear(); return; }
    host.dataset.aiNotch = '';
    // the card's top edge level with the label's top
    const mt = parseFloat(getComputedStyle(viewer).marginTop) || 0;
    const shift = docOffset(viewer).y - docOffset(label).y;
    if (Math.abs(shift) > 0.5) host.style.setProperty('--ai-viewer-mt', `${mt - shift}px`);

    const v = docOffset(viewer);
    const titleBottom = docOffset(title).y + title.offsetHeight - v.y;
    const n = stageNotchSize({
      labelRight: textRight(label) - v.x,
      titleRight: textRight(title) - v.x,
      titleBottom,
      subRight: textRight(sub) - v.x,
      subBottom: docOffset(sub).y + sub.offsetHeight - v.y,
    });
    // the card's content moves up as far as the notch lets it: each column
    // clears only the steps it actually sits under (the rail, under both;
    // the app window, under the title step only when it starts right of
    // the subtitle)
    const tops = stageContentTops(n, columns(viewer));
    host.style.setProperty('--ai-rail-top', `${tops.rail}px`);
    host.style.setProperty('--ai-stage-top', `${tops.stage}px`);

    const cs = getComputedStyle(viewer);
    const w = parseFloat(cs.width) || viewer.offsetWidth;
    const h = parseFloat(cs.height) || viewer.offsetHeight;
    if (!w || !h) return;
    const cornerShape = cs.getPropertyValue('corner-top-left-shape') || cs.getPropertyValue('corner-shape');
    const d = stairNotchPath(w, h, {
      ...n,
      r: parseFloat(cs.borderTopLeftRadius) || 0,
      ri: STAGE_NOTCH_TURN,
      shape: /squircle|superellipse\(2\)/.test(cornerShape) ? 'squircle' : 'round',
    });
    host.style.setProperty('--ai-notch-clip', `path('${d}')`);
    // the border, drawn along the outline (the CSS border is hidden); twice
    // the width, since the clip keeps only the inner half
    const bw = parseFloat(cs.borderTopWidth) || 0;
    svg.style.left = svg.style.top = `${-bw}px`;
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    path.setAttribute('d', d);
    path.setAttribute('stroke', cs.borderTopColor);
    path.setAttribute('stroke-width', String(bw * 2));
  };

  sync();
  // once more as the card starts rising in, from the settled layout
  viewer.addEventListener(RISE_START_EVENT, sync);
  // border colour follows the open step (data-accent, a CSS transition)
  // and the theme; sizes follow the text (language, fonts, wrapping)
  viewer.addEventListener('transitionend', sync);
  mq?.addEventListener?.('change', sync);
  const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => sync());
  for (const el of [viewer, label, title, sub]) ro?.observe(el);
  const mo = typeof MutationObserver === 'undefined' ? null : new MutationObserver(() => sync());
  mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  for (const el of [label, title, sub]) mo?.observe(el, { childList: true, characterData: true, subtree: true });
  let live = true;
  document.fonts?.ready.then(() => { if (live) sync(); }).catch(() => {});

  return () => {
    live = false;
    ro?.disconnect();
    mo?.disconnect();
    mq?.removeEventListener?.('change', sync);
    viewer.removeEventListener('transitionend', sync);
    viewer.removeEventListener(RISE_START_EVENT, sync);
    clear();
  };
}
