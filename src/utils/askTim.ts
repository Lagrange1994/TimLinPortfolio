/**
 * One-way channel from anywhere on the page to the chat widget: "open the
 * panel and ask this". ChatPanel owns the panel's open state and the actual
 * /api/chat call, and it lives at the App root — far from the hero — so a
 * window-level event is the cheapest way to reach it without threading a
 * callback (or lifting `open` into a context) through everything in between.
 *
 * Currently fired by the hero's notch strip (HeroAskStrip); the event is
 * deliberately generic so any future entry point (a CTA in About, a link in a
 * case study) can reuse it.
 */

export const ASK_TIM_EVENT = 'tim:ask';

export interface AskTimDetail {
  /** The full question to send — not the short button label. */
  q: string;
}

/** Opens the chat panel and submits `q`. No-op outside a browser. */
export function askTim(q: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AskTimDetail>(ASK_TIM_EVENT, { detail: { q } }));
}
