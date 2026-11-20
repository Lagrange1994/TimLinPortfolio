/**
 * Shared spring for every Motion `layoutId` tab indicator (Portfolio filter
 * tabs, Contact FAQ tabs) — animata.design Fluid Tabs: a layoutId span mounted
 * only in the active tab, animated by Motion's own FLIP. Don't hand-measure
 * and mutate one span's transform: inside a backdrop-filter ancestor Chromium
 * may not recomposite it, and the reflow workaround kills CSS transitions.
 */
export const INDICATOR_SPRING = { type: 'spring' as const, stiffness: 380, damping: 34, mass: 0.75 };
