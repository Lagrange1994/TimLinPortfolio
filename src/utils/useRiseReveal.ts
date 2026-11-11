import { useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { autoScrollSkips, autoScrollLandsIn, msSinceAutoScrollEnd, AUTO_SCROLL_END_EVENT } from './navHeader';

gsap.registerPlugin(ScrollTrigger);

// Site-wide scroll-reveal: left→right column start-stagger (per row, same
// trigger point) + soft elastic fast-in/slow-out rise + a secondary elastic
// "stretch" — cards and text both squash→overshoot→settle in scaleY (a
// transform, so no layout shift). Bounce intensity tuned down from an
// earlier pass against the dailywebdesign IG reel reference, which reads as
// smooth ease-out with no real spring overshoot — this keeps a light single
// bounce instead of a wobbly multi-oscillation spring.
//
// Direction follows the scroll: an item entering from below (scrolling down)
// rises up into place; one entering from above (scrolling up) drops down into
// place — the mirror image. Each item is revealed once per mount; the lazily
// unmounted page units (LazyUnit.tsx) call setupRiseReveal() again on every
// remount, so reloaded content replays its entrance in the right direction.
//
// useRiseReveal() (called once at the app root, see App.tsx) covers the
// sections that are always mounted; LazyUnit calls setupRiseReveal() for its
// own sections. Both scan their `section`s for `.rise-card`/`.rise-soft`
// descendants and reveal each section's items independently, mirroring the
// row/column bucketing previously done per-section by SkillsSection's
// IntersectionObserver.
const ROW_BAND = 40;
const COL_DELAY = 0.28; // seconds between columns, left fastest — widened so each card's entrance reads as a distinct beat instead of bunching together
const DUR = 1.05;
const POS_EASE = 'elastic.out(0.8, 0.75)'; // soft single-bounce rise
const RISE_Y = 28; // px each item travels by default (data-rise-y overrides)
const STRETCH_EASE = 'elastic.out(0.8, 0.55)'; // gentler squash/stretch spring
const SKIP_SPEED = 40; // reveal speed-up while an auto-scroll flies past (~30ms)
// Where a nav/CTA auto-scroll lands, the content fades up instead of the
// elastic rise: a short, plain rise with no squash, so the finished screen
// just appears.
const LAND_Y = 16;
const LAND_DUR = 0.6;
const LAND_EASE = 'power2.out';
const LAND_COL_DELAY = 0.08;
// A section mounted this soon after a landing (a neighbour LazyUnit loads
// then) fades up with it instead of waiting to be scrolled back to.
const LATE_LAND_MS = 1000;

// Shared with elements that must rise in lockstep with a .rise-soft item but
// can't be .rise-soft themselves (PortfolioSection's notched wall frame).
export const RISE_TWEEN = { y: 0, autoAlpha: 1, duration: DUR, ease: POS_EASE };
export const RISE_FROM = { autoAlpha: 0, y: RISE_Y };
// Fired (bubbling) on an item the moment its rise tween starts. `detail.tl` is
// the item's own timeline, so a companion element can add its tween to it and
// stay frame-exact in sync (a separately created tween starts a tick late);
// `dir` is 1 when the item rises in from below and -1 when it drops in from
// above, `riseY` the distance it travels and `tween` its duration and ease
// (the fade-up after an auto-scroll lands differs from the scroll rise).
export const RISE_START_EVENT = 'rise-start';
export type RiseDir = 1 | -1;
export interface RiseStartDetail {
  tl: gsap.core.Timeline;
  dir: RiseDir;
  riseY: number;
  tween: { duration: number; ease: string };
}

// Some elements carry their own decorative CSS transform (e.g. Tech Stack's
// `--stagger-y` staircase offset on .tech-item). GSAP's own transform writes
// replace the full inline transform, which would otherwise flatten that
// offset to 0. Read the existing translate component so row/column
// bucketing measures *layout* position (not the decorative offset) and the
// reveal can rest back at the element's real, offset position instead of 0.
function getBaseTranslate(el: HTMLElement): { x: number; y: number } {
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return { x: 0, y: 0 };
  try {
    const m = new DOMMatrixReadOnly(t);
    return { x: m.m41, y: m.m42 };
  } catch {
    return { x: 0, y: 0 };
  }
}

// Some elements carry a decorative CSS `top`/`left` offset instead of a
// transform (e.g. the How I Use AI staircase, which deliberately uses `top`
// so it doesn't collide with the card's own hover/GSAP transforms — see
// portfolio.css). That offset is baked into getBoundingClientRect() but
// isn't part of the element's underlying grid-row position, so it has to be
// discounted before row/column bucketing — otherwise a same-row sibling
// with a large enough offset (relative to ROW_BAND) gets misclassified as
// a separate row.
function getPositionOffset(el: HTMLElement): { x: number; y: number } {
  const cs = getComputedStyle(el);
  if (cs.position === 'static') return { x: 0, y: 0 };
  const top = parseFloat(cs.top);
  const left = parseFloat(cs.left);
  return { x: Number.isNaN(left) ? 0 : left, y: Number.isNaN(top) ? 0 : top };
}

// 'scroll': the item scrolled into its band. 'land': a nav/CTA auto-scroll
// landed with the item reached or passed (see onLanded).
type RevealMode = 'scroll' | 'land';
const justLanded = (): RevealMode => (msSinceAutoScrollEnd() < LATE_LAND_MS ? 'land' : 'scroll');

export function setupRiseReveal(sections: HTMLElement[]): () => void {
  if (!sections.length) return () => {};

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set('.rise-card, .rise-soft', { clearProps: 'all' });
    return () => {};
  }

  // Empty context first, then add() the setup: a trigger already inside its
  // band fires onEnter synchronously during ScrollTrigger.create(), and its
  // reveal needs ctx to exist by then.
  const ctx = gsap.context(() => {});
  // Items whose band a nav/CTA auto-scroll may have skipped (see onLanded).
  const pending: Array<{ st: ScrollTrigger; reveal: (dir: RiseDir, mode?: RevealMode) => void }> = [];
  ctx.add(() => {
    sections.forEach(section => {
      const all = gsap.utils.toArray<HTMLElement>(
        section.querySelectorAll<HTMLElement>('.rise-card, .rise-soft')
      );
      if (!all.length) return;

      const secTop = section.getBoundingClientRect().top;
      const measured = all.map(el => {
        const r = el.getBoundingClientRect();
        const base = getBaseTranslate(el);
        const pos = getPositionOffset(el);
        return { el, rect: r, relTop: r.top - secTop - base.y - pos.y, left: r.left - base.x - pos.x, restY: base.y };
      }).sort((a, b) => {
        const ra = Math.round(a.relTop / ROW_BAND);
        const rb = Math.round(b.relTop / ROW_BAND);
        return ra !== rb ? ra - rb : a.left - b.left;
      });

      // Column stagger per item, worked out first so a data-rise-with item
      // (see below) can take the delay of the item it rides: it moves in
      // the same beat as that item — e.g. a notched card's tags rise with
      // the card, not ahead of it when the card is late in its row.
      const ownDelay = new Map<HTMLElement, number>();
      let baseRowKey = -1, colIdx = 0;
      measured.forEach(({ el, relTop }) => {
        const key = Math.round(relTop / ROW_BAND);
        if (key !== baseRowKey) { baseRowKey = key; colIdx = 0; } else colIdx++;
        ownDelay.set(el, colIdx * COL_DELAY);
      });

      // Rects taken before any item below gets its starting transform.
      const rects = new Map(measured.map(m => [m.el, m.rect]));

      measured.forEach(({ el, restY, rect }) => {
        const rideSel = el.dataset.riseWith;
        const rides = rideSel ? section.querySelector<HTMLElement>(rideSel) : null;
        const delay = rideSel ? (rides && ownDelay.get(rides)) || 0 : ownDelay.get(el) ?? 0;
        // data-rise-lock: move as if glued to the item it rides — same
        // distance, same squash, round that item's pivot instead of its own.
        // What sits in a card's notch lives outside the card (the clip would
        // hide it), so without this the two squash round different edges and
        // drift apart mid-rise.
        const lockRect = rides && el.dataset.riseLock !== undefined ? rects.get(rides) : undefined;
        const isCard = el.classList.contains('rise-card');
        // data-rise-y overrides the default rise distance for one item/group.
        const riseY = Number((lockRect ? rides! : el).dataset.riseY) || RISE_Y;
        // Origin (in this element's own box) of the ridden item's pivot: its
        // bottom edge rising in, its top edge dropping in.
        const lockOrigin = (dir: RiseDir, l: DOMRect = lockRect!, own: DOMRect = rect) =>
          `${l.left + l.width / 2 - own.left}px ${(dir === 1 ? l.bottom : l.top) - own.top}px`;
        // The setup rects can be stale by reveal time: a card's content
        // (fonts, a lazy scene) can change its height after setup, so a
        // pivot from setup sits off the card's real edge and the rider drifts
        // away from the card mid-squash. Re-measured at reveal, untransformed.
        const layoutRect = (n: HTMLElement) => {
          const prev = n.style.transform;
          n.style.transform = 'none';
          const r = n.getBoundingClientRect();
          n.style.transform = prev;
          return r;
        };

        // Hidden until its trigger fires; the starting y (and, for cards,
        // the squash origin) depend on which way it enters, so they're set
        // again at reveal time.
        gsap.set(el, { autoAlpha: 0, y: restY + riseY });
        if (lockRect) {
          gsap.set(el, { scaleY: 0.82, transformOrigin: lockOrigin(1) });
        } else if (isCard) {
          gsap.set(el, { scaleY: 0.82, transformOrigin: 'center bottom' });
        } else {
          // Text squash/stretch is a scaleY transform, NOT a line-height
          // tween. line-height is a layout property: squeezing it to 60%
          // made every rise-soft block shorter than its final height until
          // revealed, then grow while scrolling — each tick (and the final
          // jump) pushed everything below it, which read as the page
          // nudging itself while you scroll. A transform never changes the
          // element's layout box, so nothing else moves. Origin is the top
          // edge so the text springs open downward, like the line-height
          // opening it replaces.
          gsap.set(el, { scaleY: 0.82, transformOrigin: 'center top' });
        }

        let revealed = false;
        const reveal = (dir: RiseDir, mode: RevealMode = 'scroll') => {
          if (revealed) return;
          revealed = true;
          const landing = mode === 'land';
          const distance = landing ? LAND_Y : riseY;
          const tween = landing ? { duration: LAND_DUR, ease: LAND_EASE } : { duration: DUR, ease: POS_EASE };
          // Created after setup, so register with the context (ctx.revert()
          // must still be able to kill it when the unit unmounts).
          ctx.add(() => {
            gsap.set(el, { y: restY + dir * distance });
            if (landing) gsap.set(el, { scaleY: 1 });
            else if (lockRect) gsap.set(el, { transformOrigin: lockOrigin(dir, layoutRect(rides!), layoutRect(el)) });
            else if (isCard) gsap.set(el, { transformOrigin: dir === 1 ? 'center bottom' : 'center top' });

            const tl = gsap.timeline({ delay: landing ? (delay / COL_DELAY) * LAND_COL_DELAY : delay });
            tl.to(el, { y: restY, autoAlpha: 1, ...tween }, 0);
            tl.call(
              () => el.dispatchEvent(new CustomEvent<RiseStartDetail>(RISE_START_EVENT, { bubbles: true, detail: { tl, dir, riseY: distance, tween } })),
              undefined,
              0
            );

            // The fade-up after landing is a plain rise: no squash/stretch.
            if (!landing && isCard) {
              // Many .rise-card elements (process-card, ai-card, tech-item-wrap)
              // also carry backdrop-filter: blur() — animating a transform
              // (scaleY) on an element with an active backdrop-filter forces
              // Chromium to resample the blurred backdrop every frame, and a
              // section scrolling into view can stagger 10+ of these at once.
              // The blur adds nothing visible while the card is still scaling
              // up from 0.82 and fading in (autoAlpha 0→1 on the same
              // timeline), so it's dropped for just the tween's duration and
              // restored once the card settles.
              //
              // Uses gsap.set (not a raw el.style write) so ctx.revert() can
              // undo it — this file's effect runs under React StrictMode,
              // which double-invokes on mount; a plain DOM mutation made
              // outside GSAP's tracking survives the first mount's cleanup,
              // so the second mount's "did this card have a backdrop-filter
              // to restore later" check reads back its own leftover `none`
              // and concludes there's nothing to restore — the blur then
              // never comes back. gsap.set()'s writes are reverted alongside
              // every other property this effect touches, so the check
              // starts clean on every (re)mount.
              let hadBackdropFilter = false;
              tl.call(() => {
                hadBackdropFilter = getComputedStyle(el).backdropFilter !== 'none';
                if (hadBackdropFilter) gsap.set(el, { backdropFilter: 'none' });
              }, undefined, 0);
              tl.to(el, {
                scaleY: 1, duration: DUR * 1.15, ease: STRETCH_EASE,
                onComplete: () => {
                  if (hadBackdropFilter) gsap.set(el, { clearProps: 'backdropFilter' });
                },
              }, 0);
            } else if (!landing) {
              tl.to(el, { scaleY: 1, duration: DUR * 1.15, ease: STRETCH_EASE }, 0);
            }

            // Lets things that shouldn't start until the reveal has visually
            // settled (e.g. ProcessCarousel's autoplay) listen instead of
            // guessing at a matching duration of their own. Explicit position
            // (the longer of the two parallel tweens above) — relying on the
            // timeline's auto-advancing cursor after two position:0 inserts is
            // not guaranteed to land at the true end.
            // A nav/CTA auto-scroll flying past this section on its way
            // elsewhere: play the whole reveal (and anything riding on its
            // timeline via RISE_START_EVENT) at once, so only the target
            // section animates. Callbacks still fire in order.
            if (!landing && autoScrollSkips(section)) tl.delay(0).timeScale(SKIP_SPEED);

            tl.call(
              () => {
                // portfolio.css gives .rise-card/.rise-soft will-change up front
                // so the reveal starts smoothly; once settled the element never
                // moves again, so drop the layer instead of keeping ~30 of them
                // for the rest of the visit. gsap.set so ctx.revert() undoes it.
                gsap.set(el, { willChange: 'auto' });
                el.dispatchEvent(new CustomEvent('rise-settled', { bubbles: true }));
              },
              undefined,
              landing ? LAND_DUR : DUR * 1.15
            );
          });
        };

        // The band an item counts as "in view" for: from its top reaching 70%
        // of the viewport (30% in view, entering from below) to its bottom
        // reaching 30% (30% in view, entering from above). Entering the band
        // from below rises it up; re-entering from above drops it down. An
        // item the page loaded far beyond (already past the band) stays
        // hidden until the user scrolls back up to it, so it's seen arriving.
        // data-rise-with: ride another item's band so a group (e.g. the
        // Portfolio headline's label/title/sub) moves as one beat.
        const withSel = el.dataset.riseWith;
        const triggerEl = (withSel && section.querySelector<HTMLElement>(withSel)) || el;
        const inBand = (st: ScrollTrigger) => { const y = st.scroll(); return y >= st.start && y <= st.end; };
        const st = ScrollTrigger.create({
          trigger: triggerEl,
          start: 'top 70%',
          end: 'bottom 30%',
          // The section an auto-scroll is landing on holds its items for the
          // fade-up on landing (onLanded) instead of revealing mid-flight.
          // Just after a landing (a neighbour mounting late) it fades up too.
          onEnter: st => { if (inBand(st) && !autoScrollLandsIn(section)) { reveal(1, justLanded()); st.kill(); } },
          onEnterBack: st => { if (inBand(st) && !autoScrollLandsIn(section)) { reveal(-1, justLanded()); st.kill(); } },
        });
        pending.push({ st, reveal });
      });
    });
  });

  // A nav/CTA auto-scroll lands the visitor on a finished screen. Its flight
  // can jump clean over an item's band (a long jump, a janky frame, or a
  // lazily mounted section appearing mid-flight), the landing spot puts a
  // section's label and title above their band, where an item stays hidden
  // until scrolled back to, and the target section holds its items during
  // the flight. So on landing, everything the scroll has reached or passed
  // fades up.
  const onLanded = () => {
    pending.forEach(({ st, reveal }) => {
      if (st.scroll() < st.start) return;
      reveal(1, 'land');
      st.kill();
    });
  };
  window.addEventListener(AUTO_SCROLL_END_EVENT, onLanded);
  if (msSinceAutoScrollEnd() < LATE_LAND_MS) onLanded();

  return () => {
    window.removeEventListener(AUTO_SCROLL_END_EVENT, onLanded);
    ctx.revert();
  };
}

// Sections that are always mounted (everything outside a LazyUnit) — but
// "always mounted" doesn't mean "mounted on the very first render": a
// React.lazy + Suspense child in this group (SkillsSection, see App.tsx)
// renders nothing until its import resolves, so this effect's one-time (`[]`
// deps) DOM scan can run before that <section> exists. Without watching for
// it, that section's .rise-card/.rise-soft items would stay hidden forever —
// this hook never runs a second time to find them.
export function useRiseReveal() {
  useEffect(() => {
    const revealed = new Set<HTMLElement>();
    const cleanups: Array<() => void> = [];

    const scanAndReveal = () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>('section'))
        .filter(s => !s.closest('[data-lazy-unit]') && !revealed.has(s));
      if (!sections.length) return false;
      sections.forEach(s => revealed.add(s));
      cleanups.push(setupRiseReveal(sections));
      return true;
    };

    scanAndReveal();

    // Every currently-lazy section outside a LazyUnit resolves in one wave
    // (there's one such section today); disconnect as soon as that wave is
    // found instead of watching the whole document's subtree for the rest
    // of the page's life. If a later addition needs a second independent
    // wave, this will miss it — the `revealed` guard (not this disconnect)
    // is what actually prevents double setup, so widening this to keep
    // watching is safe if that's ever needed.
    const observer = new MutationObserver(() => {
      if (scanAndReveal()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanups.forEach(c => c());
    };
  }, []);
}
