import { useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Site-wide scroll-reveal: left→right column start-stagger (per row, same
// trigger point) + soft elastic fast-in/slow-out rise + a secondary elastic
// "stretch" — cards squash→overshoot→settle in scaleY, text line-height
// squeezes tight then springs open. Bounce intensity tuned down from an
// earlier pass against the dailywebdesign IG reel reference, which reads as
// smooth ease-out with no real spring overshoot — this keeps a light single
// bounce instead of a wobbly multi-oscillation spring.
//
// Call once at the app root (see App.tsx). Scans every `section` in the
// document for `.rise-card`/`.rise-soft` descendants and reveals each
// section's items independently, mirroring the row/column bucketing
// previously done per-section by SkillsSection's IntersectionObserver.
const ROW_BAND = 40;
const COL_DELAY = 0.28; // seconds between columns, left fastest — widened so each card's entrance reads as a distinct beat instead of bunching together
const DUR = 1.05;
const POS_EASE = 'elastic.out(0.8, 0.75)'; // soft single-bounce rise
const STRETCH_EASE = 'elastic.out(0.8, 0.55)'; // gentler squash/stretch spring

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

export function useRiseReveal() {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section'));
    if (!sections.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set('.rise-card, .rise-soft', { clearProps: 'all' });
      return;
    }

    const ctx = gsap.context(() => {
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
          const delay = colIdx * COL_DELAY;
          const isCard = el.classList.contains('rise-card');

          gsap.set(el, { autoAlpha: 0, y: restY + 28 });
          if (isCard) {
            gsap.set(el, { scaleY: 0.82, transformOrigin: 'center bottom' });
          }

          const tl = gsap.timeline({
            scrollTrigger: { trigger: el, start: 'top 70%', once: true }, // 30% into view
            delay,
          });
          tl.to(el, { y: restY, autoAlpha: 1, duration: DUR, ease: POS_EASE }, 0);

          if (isCard) {
            tl.to(el, { scaleY: 1, duration: DUR * 1.15, ease: STRETCH_EASE }, 0);
          } else {
            // Must carry the 'px' unit explicitly — GSAP writes bare numbers
            // for lineHeight as-is, and unitless CSS line-height is a
            // font-size *multiplier*, not px.
            const naturalLH = parseFloat(getComputedStyle(el).lineHeight);
            if (!Number.isNaN(naturalLH)) {
              gsap.set(el, { lineHeight: (naturalLH * 0.6) + 'px' });
              tl.to(el, { lineHeight: naturalLH + 'px', duration: DUR * 1.15, ease: STRETCH_EASE }, 0);
            }
          }

          // Lets things that shouldn't start until the reveal has visually
          // settled (e.g. ProcessCarousel's autoplay) listen instead of
          // guessing at a matching duration of their own. Explicit position
          // (the longer of the two parallel tweens above) — relying on the
          // timeline's auto-advancing cursor after two position:0 inserts is
          // not guaranteed to land at the true end.
          tl.call(
            () => el.dispatchEvent(new CustomEvent('rise-settled', { bubbles: true })),
            undefined,
            DUR * 1.15
          );
        });
      });
    });

    return () => ctx.revert();
  }, []);
}
