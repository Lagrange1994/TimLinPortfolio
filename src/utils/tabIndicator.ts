/**
 * Shared spring for every Motion `layoutId` tab indicator (Portfolio's
 * filter tabs, Contact's FAQ tabs) — animata.design's Fluid Tabs technique
 * (https://animata.design/docs/tabs/fluid-tabs): a shared layoutId span,
 * mounted only inside the active tab, that Motion animates between tabs via
 * its own layout-diff (FLIP) transform instead of this project hand-
 * measuring box geometry in JS.
 *
 * useSlidingIndicator.ts (deleted) tried the hand-measured version — one
 * absolutely-positioned span whose transform/width were computed in JS and
 * animated with a plain CSS transition — to work around what looked like a
 * Motion-specific freeze bug (the indicator visually stuck at its first-
 * rendered position on every later activation). The real cause was a
 * Chromium bug: an inline-style transform update on an element inside a
 * backdrop-filter ancestor (both tab tracks are one) doesn't always get
 * recomposited. That version's own fix — forcibly toggling
 * display:none/reflow/restore right after applying the new transform —
 * turned out to defeat CSS transitions outright (confirmed live:
 * transitionend never fires, the pill just snaps to the new spot), which is
 * worse than the bug it was chasing.
 *
 * Motion's layoutId sidesteps the problem entirely: each activation mounts
 * a genuinely new element inside the new tab (inset:0, no JS-measured
 * geometry at all) and Motion computes+animates the FLIP delta itself —
 * nothing here ever mutates an existing element's transform in place, so
 * there's no stale layer to fight. Matches the working reference deployment
 * (timlin-design.vercel.app) exactly.
 */
export const INDICATOR_SPRING = { type: 'spring' as const, stiffness: 380, damping: 34, mass: 0.75 };
