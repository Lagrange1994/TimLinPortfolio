import { RISE_START_EVENT, type RiseStartDetail } from './useRiseReveal';

// How I Use AI viewer entrance. The viewer itself is a .rise-card, so the
// whole stage rises in from below (useRiseReveal). When that rise starts,
// three pieces inside it join on the same timeline (frame-exact, see
// RISE_START_EVENT):
//   - the app window rises in from below and, beside it, the pill rail
//     fades in from the left,
//   - the front panel (Make flow, or the handoff card on step 06) from the left,
//   - the client's LINE phone from the right.
// Reduced motion never fires the rise, so nothing here runs and everything
// stays where the CSS puts it.
export const ENTER_X = 56;       // px each piece travels sideways
export const ENTER_Y = 40;       // px the app window rises
export const ENTER_AT = 0.18;    // s into the stage's rise
export const ENTER_STAGGER = 0.14;
export const ENTER_DUR = 0.9;
const EASE = 'power3.out';

export function attachAiViewerEntrance(viewer: HTMLElement): () => void {
  const onRise = (e: Event) => {
    if (e.target !== viewer) return;
    const { tl } = (e as CustomEvent<RiseStartDetail>).detail;
    const rail = viewer.querySelector<HTMLElement>('.ai-viewer-rail');
    // Only the panel that is showing: the others sit at opacity 0 and must
    // stay there.
    const front = viewer.querySelector<HTMLElement>('.aas-front.is-on');
    const phone = viewer.querySelector<HTMLElement>('.aas-phone');
    const win = viewer.querySelector<HTMLElement>('.aas-window');

    // Window, rail and phone have no transform of their own, so they move
    // on x / y directly.
    if (win) {
      tl.fromTo(win, { y: ENTER_Y, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: ENTER_DUR, ease: EASE, clearProps: 'transform,opacity,visibility' }, ENTER_AT);
    }
    if (rail) {
      tl.fromTo(rail, { x: -ENTER_X, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: ENTER_DUR, ease: EASE, clearProps: 'transform,opacity,visibility' }, ENTER_AT);
    }
    // The front panel's transform runs its step switch (CSS transition) and
    // its `translate` holds the drag offset, which is 0 before anyone has
    // dragged it. So: slide on translate, fade inline with the CSS
    // transition off, then hand everything back to the stylesheet.
    if (front) {
      tl.fromTo(front, { translate: `${-ENTER_X}px 0px`, opacity: 0, transition: 'none' },
        { translate: '0px 0px', opacity: 1, duration: ENTER_DUR, ease: EASE, clearProps: 'translate,opacity,transition' }, ENTER_AT + ENTER_STAGGER);
    }
    if (phone) {
      tl.fromTo(phone, { x: ENTER_X, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: ENTER_DUR, ease: EASE, clearProps: 'transform,opacity,visibility' }, ENTER_AT + ENTER_STAGGER * 2);
    }
  };
  viewer.addEventListener(RISE_START_EVENT, onRise);
  // The tweens live on the rise timeline and are reverted with it.
  return () => viewer.removeEventListener(RISE_START_EVENT, onRise);
}
