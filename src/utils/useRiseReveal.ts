import { useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

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

// Shared with elements that must rise in lockstep with a .rise-soft item but
// can't be .rise-soft themselves (PortfolioSection's notched wall frame).
export const RISE_TWEEN = { y: 0, autoAlpha: 1, duration: DUR, ease: POS_EASE };
export const RISE_FROM = { autoAlpha: 0, y: RISE_Y };
// Fired (bubbling) on an item the moment its rise tween starts. `detail.tl` is
// the item's own timeline, so a companion element can add its tween to it and
// stay frame-exact in sync (a separately created tween starts a tick late);
// `dir` is 1 when the item rises in from below and -1 when it drops in from
// above, `riseY` the distance it travels.
export const RISE_START_EVENT = 'rise-start';
export type RiseDir = 1 | -1;
export interface RiseStartDetail { tl: gsap.core.Timeline; dir: RiseDir; riseY: number }

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
        return { el, relTop: r.top - secTop - base.y - pos.y, left: r.left - base.x - pos.x, restY: base.y };
      }).sort((a, b) => {
        const ra = Math.round(a.relTop / ROW_BAND);
        const rb = Math.round(b.relTop / ROW_BAND);
        return ra !== rb ? ra - rb : a.left - b.left;
      });

      let baseRowKey = -1, colIdx = 0;
      measured.forEach(({ el, relTop, restY }) => {
        const key = Math.round(relTop / ROW_BAND);
        if (key !== baseRowKey) { baseRowKey = key; colIdx = 0; } else colIdx++;
        // A data-rise-with item (see below) moves in the same beat as the
        // item it's grouped with — no column stagger.
        const delay = el.dataset.riseWith ? 0 : colIdx * COL_DELAY;
        const isCard = el.classList.contains('rise-card');
        // data-rise-y overrides the default rise distance for one item/group.
        const riseY = Number(el.dataset.riseY) || RISE_Y;

        // Hidden until its trigger fires; the starting y (and, for cards,
        // the squash origin) depend on which way it enters, so they're set
        // again at reveal time.
        gsap.set(el, { autoAlpha: 0, y: restY + riseY });
        if (isCard) {
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
        const reveal = (dir: RiseDir) => {
          if (revealed) return;
          revealed = true;
          // Created after setup, so register with the context (ctx.revert()
          // must still be able to kill it when the unit unmounts).
          ctx.add(() => {
            gsap.set(el, { y: restY + dir * riseY });
            if (isCard) gsap.set(el, { transformOrigin: dir === 1 ? 'center bottom' : 'center top' });

            const tl = gsap.timeline({ delay });
            tl.to(el, { y: restY, autoAlpha: 1, duration: DUR, ease: POS_EASE }, 0);
            tl.call(
              () => el.dispatchEvent(new CustomEvent<RiseStartDetail>(RISE_START_EVENT, { bubbles: true, detail: { tl, dir, riseY } })),
              undefined,
              0
            );

            if (isCard) {
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
            } else {
              tl.to(el, { scaleY: 1, duration: DUR * 1.15, ease: STRETCH_EASE }, 0);
            }

            // Lets things that shouldn't start until the reveal has visually
            // settled (e.g. ProcessCarousel's autoplay) listen instead of
            // guessing at a matching duration of their own. Explicit position
            // (the longer of the two parallel tweens above) — relying on the
            // timeline's auto-advancing cursor after two position:0 inserts is
            // not guaranteed to land at the true end.
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
              DUR * 1.15
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
        ScrollTrigger.create({
          trigger: triggerEl,
          start: 'top 70%',
          end: 'bottom 30%',
          onEnter: st => { if (inBand(st)) { reveal(1); st.kill(); } },
          onEnterBack: st => { if (inBand(st)) { reveal(-1); st.kill(); } },
        });
      });
    });
  });

  return () => ctx.revert();
}

// Sections that are always mounted (everything outside a LazyUnit).
export function useRiseReveal() {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section'))
      .filter(s => !s.closest('[data-lazy-unit]'));
    return setupRiseReveal(sections);
  }, []);
}
