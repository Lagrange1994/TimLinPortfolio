// The fixed buttons stacked at the viewport's bottom-right corner (see
// #back-to-top / #chat-fab in portfolio.css).
export const FIXED_UI_IDS = ['back-to-top', 'chat-fab'] as const;

/**
 * Width of the strip those buttons occupy, measured from the viewport's right
 * edge: the widest button plus its own gap from that edge. 0 when none of
 * them is in the DOM.
 *
 * Reads every one of them rather than a single one: the portfolio wall used
 * to measure #back-to-top alone, which then lived inside the lazily unmounted
 * contact unit — whenever the wall mounted first it found nothing, left its
 * "View All" button unpushed, and the chat button ended up on top of it.
 */
export function fixedUiFootprint(): number {
  let footprint = 0;
  for (const id of FIXED_UI_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) continue;
    footprint = Math.max(footprint, window.innerWidth - rect.left);
  }
  return footprint;
}
