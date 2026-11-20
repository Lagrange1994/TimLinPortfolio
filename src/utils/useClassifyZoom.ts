import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

// How I Use AI: the "AI 會自動歸類需求" chart starts as a mini icon (a small
// card of its shapes, no text) in the viewer, right of the viewer's
// Scenario card. Once you scroll past a threshold it plays out on its own,
// at its own pace (not tied to the scroll's speed; scrolling back above
// the threshold rewinds it into the icon), as a relay —
// problems >> AI >> solution, one after the other:
//   1. the icon's card dissolves and its sorted chips fade away;
//   2. its tilted pills fly down and become the word cloud, one by one;
//   3. its AI mark flies to the middle of the beams and starts working;
//   4. the beams draw through it, left to right, top to bottom;
//   5. the answer chips pop out of the AI, one by one;
//   6. only then the words: the heading, the cloud's labels, the chips'.
// Every piece moves with the individual `translate` / `scale` / `rotate`
// properties, so its own CSS `transform` (float, hover, centring) stays.

// the words show once everything is in place (CSS fades them, see
// .ai-classify-txt); the last chip settles before this
export const TEXT_AT = 0.95;
// The threshold: the relay fires once the chart's wrapper top is this far
// down the screen — the icon in the viewer above it is well on screen then
// (its top at ~60%).
export const RELAY_START = 'top 92%';
// Scrolling back up, it rewinds once the chart's top (its heading) drops
// past 60% of the screen: the viewer above is back in full view
export const REWIND_START = 'top 60%';
// However it plays, it is done by the time the chart's top reaches this
// (the chart then sits in the middle of the screen)
export const DONE_AT = 'top 30%';
// …and then plays this long (s) at a steady scroll…
export const RELAY_DURATION = 3.6;
// …faster or slower with how fast you scroll across the threshold, in or
// out: SPEED_REF px/s plays at 1×, clamped to SPEED_MIN–SPEED_MAX
// (3.6s → 4.8s … 1.2s). No scroll at all (opened past it) plays at 1×.
export const SPEED_REF = 1000;
export const SPEED_MIN = 0.75;
export const SPEED_MAX = 3;
export function relaySpeed(velocity: number) {
  const v = Math.abs(velocity);
  if (!v) return 1;
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, v / SPEED_REF));
}
// the icon: as tall as the Scenario card, this much wider, this far right of it
export const MINI_ASPECT = 2.3;
export const MINI_GAP = 24;
// …but no taller than this (layout px): the Scenario card's own height
export const MINI_MAX_H = 118;

// fades: gentle in and out (sine)
const ease = gsap.parseEase('sine.inOut');
// moves: fast in, slow out — each piece sets off at once and glides into
// its place; chips settle with a soft pop
const glide = gsap.parseEase('power3.out');
const pop = gsap.parseEase('back.out(1.2)');
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// The relay, as progress 0..1 per piece. `chips` carry `pop` (eased past 1:
// the overshoot) and `raw` (0..1, linear). Each piece takes its time and
// overlaps the next, so the whole reads as one flowing move.
export function relayFrame(p: number, words = 12, chips = 5, beams = 5) {
  const q = clamp01(p);
  return {
    frame: 1 - ease(span(q, 0, 0.22)),
    ghost: 1 - ease(span(q, 0.04, 0.22)),
    words: Array.from({ length: words }, (_, i) => glide(span(q, 0.04 + i * 0.03, 0.4 + i * 0.03))),
    core: glide(span(q, 0.2, 0.5)),
    processing: ease(span(q, 0.32, 0.5)) * (1 - ease(span(q, 0.8, 0.92))),
    beams: Array.from({ length: beams }, (_, i) => glide(span(q, 0.42 + i * 0.04, 0.68 + i * 0.04))),
    chips: Array.from({ length: chips }, (_, i) => {
      const raw = span(q, 0.52 + i * 0.05, 0.72 + i * 0.05);
      return { raw, pop: raw === 0 ? 0 : pop(raw) };
    }),
    // past the last chip (0.92)
    text: q >= TEXT_AT ? 1 : 0,
  };
}

type Pt = { x: number; y: number };

// A point `t` along the curve from `from` to `to` bent towards `ctrl`
// (quadratic Bézier): pieces swoop instead of sliding in straight lines.
export function arcPoint(from: Pt, ctrl: Pt, to: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * ctrl.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * ctrl.y + t * t * to.y,
  };
}

// Falling: mostly down first, then gliding across (the pills and the AI
// mark coming down from the icon).
export const dropCtrl = (from: Pt, to: Pt): Pt => ({ x: lerp(from.x, to.x, 0.25), y: lerp(from.y, to.y, 0.85) });
// Sent out: along the beams first, then curving to its row (the chips
// leaving the AI).
export const outCtrl = (from: Pt, to: Pt): Pt => ({ x: lerp(from.x, to.x, 0.6), y: from.y });

export type Rect = { left: number; top: number; right: number; bottom: number };

// The icon's box, in its own container's px, from the Scenario card's
// on-screen box: same height and bottom, MINI_GAP right of it. `k` turns
// on-screen px into the container's layout px (the >1920 html zoom).
export function miniBox(card: Rect, container: Rect, k = 1) {
  // never taller than the Scenario card, even beside a taller card (Handoff)
  const h = Math.min((card.bottom - card.top) * k, MINI_MAX_H);
  return {
    left: (card.right - container.left) * k + MINI_GAP,
    top: (card.bottom - container.top) * k - h,
    width: h * MINI_ASPECT,
    height: h,
  };
}

// The visitor's drag of the icon, kept as an offset from its place beside
// the card (layout px): `dx`/`dy` are the pointer's on-screen travel, `k`
// the on-screen → layout factor (the >1920 html zoom).
export function moveBy(off: Pt, dx: number, dy: number, k = 1): Pt {
  return { x: off.x + dx * k, y: off.y + dy * k };
}

const centre = (r: DOMRect): Pt => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

// One piece's in-between: from `from` (on screen) to its own place `to`,
// `t` of the way along the curve `bend` gives; `z` turns on-screen px into
// its layout px.
function fly(el: HTMLElement, from: Pt, to: Pt, t: number, z: number, scale: string, rotate = 0, bend = dropCtrl) {
  const at = arcPoint(from, bend(from, to), to, t);
  el.style.translate = `${(at.x - to.x) / z}px ${(at.y - to.y) / z}px`;
  el.style.scale = scale;
  el.style.rotate = `${rotate}deg`;
}

const PIECE_PROPS = ['translate', 'scale', 'rotate', 'opacity'] as const;

export function useClassifyZoom(
  viewerRef: RefObject<HTMLElement | null>,
  miniRef: RefObject<HTMLElement | null>,
  stageRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const viewer = viewerRef.current;
    const mini = miniRef.current;
    const stage = stageRef.current;
    const wrap = stage?.parentElement;
    if (!viewer || !mini || !stage || !wrap) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // registered here, not at import: the pure relayFrame is imported by
    // tests where ScrollTrigger can't initialise (no matchMedia)
    gsap.registerPlugin(ScrollTrigger);

    const row = stage.querySelector<HTMLElement>('.ai-chips-row');
    const core = stage.querySelector<HTMLElement>('.ai-classify-core');
    if (!row || !core) return;
    const words = [...stage.querySelectorAll<HTMLElement>('.ai-word-cloud > span')];
    // each word keeps its own opacity (React's inline style); the relay scales it
    const wordOpacity = words.map(w => w.style.opacity);
    const chips = [...stage.querySelectorAll<HTMLElement>('.ai-chip')];
    // PATHS run bottom to top, glow copies first: beam b (top = 0) is
    // path (n - 1 - b) of each set
    const paths = [...stage.querySelectorAll<SVGPathElement>('.gemini-beams path')];
    const beamCount = paths.length / 2;
    const pills = [...mini.querySelectorAll<SVGGraphicsElement>('.mini-pill')];
    const miniSvg = mini.querySelector<SVGSVGElement>('svg');
    const miniAi = mini.querySelector<SVGGElement>('.mini-ai');
    const miniCore = mini.querySelector<SVGGraphicsElement>('.mini-ai-core');
    const pieces: (HTMLElement | SVGElement)[] = [...words, ...chips, core, ...pills, ...paths];
    if (miniAi) pieces.push(miniAi);

    // Beside the Scenario card on show (it follows the card if the visitor
    // drags it). The desktop viewer only: the phone row has no app window
    // for the card to sit by.
    // …plus wherever the visitor dragged it (the cards drag too)
    let off: Pt = { x: 0, y: 0 };
    let k = 1;
    const place = () => {
      const card = viewer.querySelector<HTMLElement>('.aas-front.is-on') ?? viewer.querySelector<HTMLElement>('.aas-front');
      const r = card?.getBoundingClientRect();
      if (!card || !r || !viewer.classList.contains('is-stage') || r.width === 0) {
        mini.classList.remove('is-placed');
        return false;
      }
      k = card.offsetWidth / r.width || 1;
      const box = miniBox(r, wrap.getBoundingClientRect(), k);
      Object.assign(mini.style, { left: `${box.left + off.x}px`, top: `${box.top + off.y}px`, width: `${box.width}px`, height: `${box.height}px` });
      mini.classList.add('is-placed');
      return true;
    };

    // Every piece back on its own styles: the finished chart is the chart
    // as it always was (plus the AI core), no inline leftovers.
    const settle = () => {
      for (const el of pieces) {
        for (const prop of PIECE_PROPS) el.style.removeProperty(prop);
      }
      words.forEach((w, i) => { w.style.opacity = wordOpacity[i]; });
      for (const path of paths) path.style.removeProperty('stroke-dashoffset');
      core.style.removeProperty('--core-processing');
      stage.classList.remove('is-relaying');
    };

    let miniShown = true;
    const apply = (p: number) => {
      if (p >= 1) {
        miniShown = false;
        mini.classList.remove('is-placed');
        settle();
        wrap.style.setProperty('--classify-text', '1');
        return;
      }
      // pieces fly in from the icon, over the cloud's clipping edge
      stage.classList.add('is-relaying');
      const f = relayFrame(p, words.length, chips.length, beamCount);
      miniShown = f.core < 1;
      const placed = miniShown && place();
      if (!miniShown) mini.classList.remove('is-placed');

      // the icon itself: its card and tangle dissolve, its sorted chips go
      mini.style.setProperty('--mini-frame', String(f.frame));
      mini.style.setProperty('--mini-ghost', String(f.ghost));

      const rowR = row.getBoundingClientRect();
      const z = rowR.width / (row.offsetWidth || 1) || 1;
      const at = (el: HTMLElement, dx: number, dy: number): Pt => ({ x: rowR.left + (el.offsetLeft + dx) * z, y: rowR.top + (el.offsetTop + dy) * z });
      const svgR = placed && miniSvg ? miniSvg.getBoundingClientRect() : null;
      const u = svgR ? svgR.width / 230 : 1;

      // 2. problems: each pill becomes a word (the rest come out of the tangle)
      words.forEach((w, i) => {
        const t = f.words[i];
        const to = at(w, w.offsetWidth / 2, w.offsetHeight / 2);
        const pill = pills[i];
        if (svgR && pill) {
          // width and tilt off the pill itself: width="30" transform="rotate(-14 …)"
          const pw = Number(pill.getAttribute('width'));
          const pr = parseFloat(pill.getAttribute('transform')?.slice('rotate('.length) ?? '') || 0;
          const wr = parseFloat(w.style.getPropertyValue('--word-rotate')) || 0;
          const sx = (pw * u) / (w.offsetWidth * z), sy = (8 * u) / (w.offsetHeight * z);
          fly(w, centre(pill.getBoundingClientRect()), to, t, z, `${lerp(sx, 1, t)} ${lerp(sy, 1, t)}`, (pr - wr) * (1 - t));
          w.style.opacity = String(Number(wordOpacity[i] || 1) * clamp01(t * 8));
          pill.style.opacity = String(0.2 * (1 - clamp01(t * 8)));
        } else if (svgR) {
          fly(w, { x: svgR.left + 50 * u, y: svgR.top + 50 * u }, to, t, z, String(lerp(0.15, 1, t)));
          w.style.opacity = String(Number(wordOpacity[i] || 1) * clamp01(t * 3));
        } else {
          fly(w, { x: to.x, y: to.y + 40 }, to, t, z, String(lerp(0.6, 1, t)));
          w.style.opacity = String(Number(wordOpacity[i] || 1) * t);
        }
      });

      // 3. the AI mark flies to the middle and works
      const coreTo = at(core, core.offsetWidth / 2, core.offsetHeight / 2);
      if (svgR && miniCore) {
        const mr = miniCore.getBoundingClientRect();
        fly(core, centre(mr), coreTo, f.core, z, String(lerp(mr.width / (core.offsetWidth * z), 1, f.core)));
        core.style.opacity = String(clamp01(f.core * 6));
        if (miniAi) miniAi.style.opacity = String(1 - clamp01(f.core * 6));
      } else {
        fly(core, coreTo, coreTo, 1, z, String(f.core));
        core.style.opacity = String(f.core);
      }
      core.style.setProperty('--core-processing', String(f.processing));

      // 4. the beams draw through it
      paths.forEach((path, j) => {
        const b = beamCount - 1 - (j % beamCount);
        path.style.strokeDashoffset = String(1 - f.beams[b]);
      });

      // 5. the answers pop out of the AI
      chips.forEach((c, i) => {
        const { raw, pop: t } = f.chips[i];
        // centred on its offsetTop (CSS translateY(-50%))
        fly(c, coreTo, at(c, c.offsetWidth / 2, 0), t, z, String(lerp(0.2, 1, t)), 0, outCtrl);
        c.style.opacity = String(clamp01(raw * 3));
      });

      // 6. words last (on the wrapper: the heading fades with them)
      wrap.style.setProperty('--classify-text', String(f.text));
    };

    // The relay's own clock: it runs RELAY_DURATION once fired, linear —
    // relayFrame eases each piece. Scrolling back above the threshold
    // rewinds it from wherever it is, back into the icon.
    const clock = { p: 0 };
    const play = gsap.to(clock, { p: 1, duration: RELAY_DURATION, ease: 'none', paused: true, onUpdate: () => apply(clock.p) });
    // each crossing sets the pace from the scroll's speed at that moment
    const fire = (st: ScrollTrigger) => { play.timeScale(relaySpeed(st.getVelocity())).play(); };
    const rewind = (st: ScrollTrigger) => { play.timeScale(relaySpeed(st.getVelocity())).reverse(); };

    apply(0);
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        // Measured on the wrapper (never transformed). Also fires when the
        // page opens already past it.
        trigger: wrap,
        start: RELAY_START,
        onEnter: fire,
        onLeaveBack: rewind,
      });
      // Scrolling back up rewinds sooner: once the heading drops past 60%
      // (if it got that far up).
      ScrollTrigger.create({
        trigger: wrap,
        start: REWIND_START,
        onEnter: fire,
        onLeaveBack: rewind,
      });
      // The scroll is a floor, not the driver: scrolling faster than it
      // plays pulls it along, so it is in place by the time the chart is
      // (its top at DONE_AT)…
      ScrollTrigger.create({
        trigger: wrap,
        start: RELAY_START,
        end: DONE_AT,
        onUpdate: (st) => {
          if (st.direction > 0 && !play.reversed() && play.progress() < st.progress) play.progress(st.progress);
        },
        onLeave: () => { play.progress(1); },
      });
      // …and back in the icon by the time you are back above the threshold.
      ScrollTrigger.create({
        trigger: wrap,
        start: RELAY_START,
        end: REWIND_START,
        onUpdate: (st) => {
          if (st.direction < 0 && play.reversed() && play.progress() > st.progress) play.progress(st.progress);
        },
        onLeaveBack: () => { play.progress(0); },
      });
    });

    // The card moves without the scroll: the viewer rises into view
    // (transform) and its cards swap in. Before the trigger's start there
    // are no updates, so while the icon is near the screen it re-places
    // itself every frame.
    let near = false;
    const tick = () => { if (near && miniShown) place(); };
    gsap.ticker.add(tick);
    const io = new IntersectionObserver(([e]) => { near = e.isIntersecting; }, { rootMargin: '50% 0px' });
    io.observe(viewer);

    // layout above can change without a resize (lazy sections, fonts)
    const ro = new ResizeObserver(() => ScrollTrigger.refresh());
    ro.observe(wrap);

    // Drag the icon anywhere (mouse, pen or finger); the relay then flies
    // out of wherever it sits.
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const start = off;
      const sx = e.clientX, sy = e.clientY;
      try { mini.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
      mini.classList.add('is-dragging');
      const move = (ev: PointerEvent) => {
        off = moveBy(start, ev.clientX - sx, ev.clientY - sy, k);
        place();
      };
      const end = () => {
        mini.classList.remove('is-dragging');
        mini.removeEventListener('pointermove', move);
        mini.removeEventListener('pointerup', end);
        mini.removeEventListener('pointercancel', end);
      };
      mini.addEventListener('pointermove', move);
      mini.addEventListener('pointerup', end);
      mini.addEventListener('pointercancel', end);
    };
    mini.addEventListener('pointerdown', onDown);

    return () => {
      mini.removeEventListener('pointerdown', onDown);
      gsap.ticker.remove(tick);
      play.kill();
      io.disconnect();
      ro.disconnect();
      ctx.revert();
      mini.classList.remove('is-placed');
      settle();
      mini.style.removeProperty('--mini-frame');
      mini.style.removeProperty('--mini-ghost');
      wrap.style.removeProperty('--classify-text');
    };
  }, [viewerRef, miniRef, stageRef]);
}
