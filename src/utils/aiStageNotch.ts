import { stairNotchPath, type EdgeBay } from './notchPath';
import { RISE_START_EVENT } from './useRiseReveal';
import { NOTCH_GAP, NOTCH_TEXT_PAD, NOTCH_TURN } from './notchTokens';

// How I Use AI: the viewer (the stage card) gets My Portfolio's top-left
// notch, with the section's subtitle sitting in it (the card's top edge is
// level with the subtitle; the label and the title sit above the card). Same
// approach as the wall and the About notches: one outline path, measured
// from the live text, clips the card's surface and is stroked as its border.
//
// Everything is measured with offsetLeft/offsetTop (blind to the rise
// entrance's transforms) plus a text range for each line's right end (the
// entrance only moves/scales on y), so it can run at any point of the
// entrance. The values go on the section (data-ai-notch + CSS vars) — the
// viewer is a .rise-card whose entrance clears its own inline styles.

// Gap between the text and the notch's edges (the wall's NOTCH_PADDING).
export const STAGE_NOTCH_PAD = NOTCH_TEXT_PAD;
// Radius of the notch's own turns.
export const STAGE_NOTCH_TURN = NOTCH_TURN;
// Desktop viewer only; the compact (≤960px) layout keeps its plain card.
export const STAGE_NOTCH_MQ = '(min-width: 961px)';

export type StageNotch = { n1w: number; n1h: number; n2w: number; n2h: number };

// The notch round the subtitle alone: one step, from its text extents
// relative to the card's top-left corner (the label and the title sit above
// the card).
export function subNotchSize({ subRight, subBottom }: { subRight: number; subBottom: number }, pad = STAGE_NOTCH_PAD): StageNotch {
  const w = subRight + pad;
  return { n1w: w, n1h: subBottom + pad, n2w: w, n2h: 0 };
}

// Gap between the notch and the content under it.
export const STAGE_NOTCH_GAP = 24;

// How far down each column must start: below every notch step that spans
// its left edge. `pieces` are what the app window column shows (the window,
// the phone, the front panel), as left edge + top relative to the column's
// top: each must clear the notch too, so nothing gets cut. `centre` lines
// the middle of that whole mockup (railMid / groupMid, each from its own
// column's top) up with the middle of the progress rail beside it.
export function stageContentTops(
  n: StageNotch,
  { rail, stage, pieces = [], centre }: {
    rail: number; stage: number; pieces?: { x: number; top: number }[];
    centre?: { railMid: number; groupMid: number };
  },
  gap = STAGE_NOTCH_GAP,
) {
  const clear = (x: number) => (x < n.n2w ? n.n1h + n.n2h : x < n.n1w ? n.n1h : 0) + gap;
  const railTop = clear(rail);
  return {
    rail: railTop,
    // centred on the rail, and never higher than the title step's bottom
    // or the notch allows
    stage: Math.max(
      centre ? railTop + centre.railMid - centre.groupMid : 0,
      n.n1h + gap,
      clear(stage),
      ...pieces.map(p => clear(p.x) - p.top),
    ),
  };
}

// The columns' left edges inside the card, and the mockup's pieces and
// middle against the progress rail's. The pieces are measured at rest:
// their entrance transforms are lifted for the one synchronous measure (as
// My Portfolio's wall does), and the card's own rise scale is divided out.
function columns(viewer: HTMLElement) {
  const rail = viewer.querySelector<HTMLElement>('.ai-viewer-rail');
  const stage = viewer.querySelector<HTMLElement>('.ai-stage');
  const track = viewer.querySelector<HTMLElement>('.ai-rail-track');
  const v = docOffset(viewer);
  const s = stage ? docOffset(stage) : v;
  const out = { rail: rail ? docOffset(rail).x - v.x : 0, stage: s.x - v.x };
  if (!stage) return out;

  const items = [...stage.querySelectorAll<HTMLElement>('.aas-window, .aas-phone, .aas-front.is-on')];
  // (a drag offset, --dx / --dy, doesn't count either: the mockup is placed
  // by where its pieces rest, not where someone left them)
  const saved = items.map(el => [el.style.transform, el.style.translate, el.style.getPropertyValue('--dx'), el.style.getPropertyValue('--dy')]);
  items.forEach(el => {
    el.style.transform = ''; el.style.translate = '';
    el.style.setProperty('--dx', '0px'); el.style.setProperty('--dy', '0px');
  });
  const sr = stage.getBoundingClientRect();
  const k = sr.height / (stage.offsetHeight || 1) || 1;
  const boxes = items.map(el => ({ el, r: el.getBoundingClientRect() })).filter(({ r }) => r.height > 0)
    .map(({ el, r }) => ({
      // the front panel changes with every step: it only has to clear the
      // notch, the centring goes by the window and the phone (so the
      // mockup doesn't jump on a step switch)
      steady: !el.classList.contains('aas-front'),
      x: (r.left - sr.left) / k + out.stage,
      top: (r.top - sr.top) / k,
      bottom: (r.bottom - sr.top) / k,
    }));
  items.forEach((el, i) => {
    el.style.transform = saved[i][0]; el.style.translate = saved[i][1];
    for (const [k, val] of [['--dx', saved[i][2]], ['--dy', saved[i][3]]]) {
      if (val) el.style.setProperty(k, val); else el.style.removeProperty(k);
    }
  });
  const steady = boxes.filter(b => b.steady);
  if (!steady.length) return { ...out, pieces: boxes.map(b => ({ x: b.x, top: b.top })) };

  const groupMid = (Math.min(...steady.map(b => b.top)) + Math.max(...steady.map(b => b.bottom))) / 2;
  const railMid = rail && track
    ? docOffset(track).y - docOffset(rail).y + track.offsetHeight / 2
    : (rail?.offsetHeight ?? 0) / 2;
  return { ...out, pieces: boxes.map(b => ({ x: b.x, top: b.top })), centre: { railMid, groupMid } };
}

// Gap between the ⌃ ⌄ buttons and their bay, and the radius of the bay's
// two ends at the card's edge.
export const NAV_BAY_GAP = NOTCH_GAP;
export const NAV_BAY_END = NOTCH_TURN;

// The bay cut into the card's left edge round the ⌃ ⌄ buttons (which sit
// flush with that edge, see [data-ai-notch] .ai-viewer-nav): `gap` round
// them, its inner corners concentric with the round buttons. Box: the
// buttons' extent in the card's border box.
export function navBaySize(box: { top: number; bottom: number; right: number; radius: number }, gap = NAV_BAY_GAP): EdgeBay {
  return {
    top: box.top - gap,
    bottom: box.bottom + gap,
    w: box.right + gap,
    ri: box.radius + gap,
    ro: NAV_BAY_END,
  };
}

function navBay(viewer: HTMLElement, border: number): EdgeBay | undefined {
  const btns = [...viewer.querySelectorAll<HTMLElement>('.ai-viewer-nav-btn')];
  if (!btns.length) return undefined;
  const v = docOffset(viewer);
  // offsets of the card's children run from inside its border
  const at = (el: HTMLElement) => { const o = docOffset(el); return { x: o.x - v.x + border, y: o.y - v.y + border }; };
  const first = btns[0], last = btns[btns.length - 1];
  return navBaySize({
    top: at(first).y,
    bottom: at(last).y + last.offsetHeight,
    right: Math.max(...btns.map(b => at(b).x + b.offsetWidth)),
    radius: Math.min(parseFloat(getComputedStyle(first).borderTopLeftRadius) || 0, first.offsetWidth / 2),
  });
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
  // About's card border effect: a second path along the outline, stroked
  // with a radial glow that follows the pointer (NotchCard's .notch-ring)
  const ring = svg.querySelector<SVGPathElement>('.notch-ring');
  const glow = svg.querySelector<SVGRadialGradientElement>('radialGradient');
  const mq = typeof window.matchMedia === 'function' ? window.matchMedia(STAGE_NOTCH_MQ) : null;

  const clear = () => {
    delete host.dataset.aiNotch;
    for (const v of ['--ai-viewer-mt', '--ai-rail-top', '--ai-stage-top', '--ai-notch-clip', '--ai-viewer-bw', '--ai-flow-h', '--ai-notch-x']) host.style.removeProperty(v);
    path.removeAttribute('d');
    ring?.removeAttribute('d');
  };

  const sync = () => {
    if (!mq?.matches) { clear(); return; }
    host.dataset.aiNotch = '';
    // the Make flow panel's height (steps 01–05; hidden ones are still laid
    // out): the phone's bottom lines up with that panel's bottom
    const flowH = Math.max(0, ...[...viewer.querySelectorAll<HTMLElement>('.aas-front.aas-flow')].map(el => el.offsetHeight));
    if (flowH) host.style.setProperty('--ai-flow-h', `${flowH}px`);
    // the card's top edge level with the subtitle's top: the label and the
    // title sit above the card, only the subtitle in its notch
    const mt = parseFloat(getComputedStyle(viewer).marginTop) || 0;
    const shift = docOffset(viewer).y - docOffset(sub).y;
    if (Math.abs(shift) > 0.5) host.style.setProperty('--ai-viewer-mt', `${mt - shift}px`);

    const v = docOffset(viewer);
    const n = subNotchSize({
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
      bay: navBay(viewer, (parseFloat(cs.borderLeftWidth) || 0)),
    });
    host.style.setProperty('--ai-notch-clip', `path('${d}')`);
    // where the card's top edge starts (right of the notch): the glass
    // highlight line runs along that edge only
    host.style.setProperty('--ai-notch-x', `${n.n1w}px`);
    // the border, drawn along the outline (the CSS border is hidden); twice
    // the width, since the clip keeps only the inner half
    const bw = parseFloat(cs.borderTopWidth) || 0;
    // the skin (and the outline in it) covers the card's border box
    host.style.setProperty('--ai-viewer-bw', `${bw}px`);
    svg.style.left = svg.style.top = '0px';
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    path.setAttribute('d', d);
    path.setAttribute('stroke', cs.borderTopColor);
    path.setAttribute('stroke-width', String(bw * 2));
    ring?.setAttribute('d', d);
    ring?.setAttribute('stroke-width', '2');
  };

  const onMove = (e: MouseEvent) => {
    if (!glow) return;
    const r = viewer.getBoundingClientRect();
    glow.setAttribute('cx', String(e.clientX - r.left));
    glow.setAttribute('cy', String(e.clientY - r.top));
  };
  viewer.addEventListener('mousemove', onMove);

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
    viewer.removeEventListener('mousemove', onMove);
    ro?.disconnect();
    mo?.disconnect();
    mq?.removeEventListener?.('change', sync);
    viewer.removeEventListener('transitionend', sync);
    viewer.removeEventListener(RISE_START_EVENT, sync);
    clear();
  };
}
