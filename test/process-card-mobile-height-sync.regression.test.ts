import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// CSS Grid's align-items: stretch (see process-card-mobile-portrait's own
// regression test) only equalizes cards within the SAME row/grid — the
// In-house and Freelance Design Process columns render as two separate
// grids (ProcessCarousel is called twice) with different description
// lengths, so their own rows can settle at different heights from each
// other even though each grid is internally uniform. A useEffect in
// SkillsSection.tsx measures every card and pins them all to one shared
// (tallest) height via a CSS custom property instead.
describe('Design Process cards share one global height on phones, not just per-row', () => {
  const tsx = fs.readFileSync(path.join(ROOT, 'src/components/SkillsSection.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/portfolio.css'), 'utf8');

  const effectBlock = tsx.match(/useEffect\(\(\) => \{\s*let timer = 0;[\s\S]*?\}, \[t\]\);/)?.[0];

  it('the sync effect exists', () => {
    expect(effectBlock).toBeTruthy();
  });

  it('measures every .process-swipe-slot and keeps the single tallest as --process-card-mobile-h', () => {
    expect(effectBlock).toMatch(/document\.querySelectorAll<HTMLElement>\('\.process-swipe-slot'\)/);
    expect(effectBlock).toMatch(/max = Math\.max\(max, slot\.offsetHeight\)/);
    expect(effectBlock).toMatch(/setProperty\('--process-card-mobile-h', `\$\{max\}px`\)/);
  });

  it('uses offsetHeight (transform-independent), not getBoundingClientRect, so the .rise-card scroll-reveal scaleY squash mid-animation can\'t undershoot the measurement', () => {
    expect(effectBlock).not.toMatch(/getBoundingClientRect\(\)\.height/);
  });

  it('skips pinning a height at tablet/desktop widths (>=768px), where cards are still the fixed-ratio square design', () => {
    expect(effectBlock).toMatch(/if \(window\.innerWidth >= 768\) return;/);
  });

  // Regression: the first version measured once on mount with no way to
  // catch a late web-font swap reflowing description text into a
  // different number of lines — waiting on document.fonts.ready and
  // re-measuring after it resolves closes that gap.
  it('re-measures after web fonts finish loading, not just once on mount', () => {
    expect(effectBlock).toMatch(/document\.fonts\?\.ready\.then\(scheduleSync\)/);
  });

  // Regression: also watches each card's own text block (not the slot this
  // effect pins, and not the card that just stretches to fill that pin) so
  // any other genuine content/layout change re-triggers a measurement too,
  // without the observer looping back on this effect's own writes.
  it("observes .border-glow-inner (not .process-swipe-slot or the card itself) with a ResizeObserver, so its own height writes can't self-trigger a loop", () => {
    expect(effectBlock).toMatch(/new ResizeObserver\(scheduleSync\)/);
    expect(effectBlock).toMatch(/querySelectorAll\('\.process-card--has-img \.border-glow-inner'\)/);
  });

  // Regression: requestAnimationFrame never fires at all while the page/tab
  // isn't visible (confirmed live — a backgrounded load left the very first
  // measurement stuck forever, no callback ever ran, --process-card-mobile-h
  // stayed unset). setTimeout still fires there, and the very first
  // measurement additionally runs synchronously so it isn't gated on any
  // async callback firing at all.
  it('measures synchronously up front, then debounces follow-ups with setTimeout (not requestAnimationFrame)', () => {
    expect(effectBlock).not.toMatch(/requestAnimationFrame\(/);
    expect(effectBlock).not.toMatch(/cancelAnimationFrame\(/);
    expect(effectBlock).toMatch(/sync\(\);\s*\n\s*scheduleSync\(\);/);
    expect(effectBlock).toMatch(/window\.setTimeout\(sync, 50\)/);
  });

  it('re-syncs on window resize and cleans up on unmount', () => {
    expect(effectBlock).toMatch(/window\.addEventListener\('resize', scheduleSync\)/);
    expect(effectBlock).toMatch(/window\.removeEventListener\('resize', scheduleSync\)/);
    expect(effectBlock).toMatch(/observer\.disconnect\(\)/);
    expect(effectBlock).toMatch(/document\.documentElement\.style\.removeProperty\('--process-card-mobile-h'\)/);
  });

  it('applies the shared height to .process-swipe-slot (the actual grid item) inside the <768px MOBILE block', () => {
    const mobileBlock = css.slice(css.indexOf('MOBILE (< 768px)'), css.indexOf('Responsive overrides (must be AFTER'));
    expect(mobileBlock).toMatch(/\.process-swipe-slot \{\s*height:\s*var\(--process-card-mobile-h, auto\);\s*margin-top:\s*0 !important;\s*\}/);
  });

  // Regression: ProcessCarousel (SkillsSection.tsx) sets an inline
  // margin-top on every .process-swipe-slot for the desktop swipe
  // carousel's left-low/right-high staircase stagger (card 0: 64px, card
  // 1: 32px, card 2+: 0px) — the same markup is reused for the mobile 2-col
  // grid, so without an override those inline values persist, making the
  // first row's two cards sit at different heights and every row's gap
  // uneven. margin-top: 0 !important neutralizes it so the grid's own gap
  // is the only spacing.
  it("overrides ProcessCarousel's inline stagger margin-top so stacked rows get equal gaps", () => {
    const mobileBlock = css.slice(css.indexOf('MOBILE (< 768px)'), css.indexOf('Responsive overrides (must be AFTER'));
    const slotBlock = mobileBlock.match(/\.process-swipe-slot \{[^}]*\}/)?.[0];
    expect(slotBlock).toBeTruthy();
    expect(slotBlock).toMatch(/margin-top:\s*0 !important;/);
  });
});
