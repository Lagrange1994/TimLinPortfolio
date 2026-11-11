import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { swipeStep, SWIPE_MIN } from '../src/utils/swipeStep';

// How I Use AI on phones: a sideways swipe across the viewer moves a step.
describe('swipeStep', () => {
  it('left goes to the next step, right to the previous one', () => {
    expect(swipeStep(-80, 5, 2, 6)).toBe(3);
    expect(swipeStep(80, -5, 2, 6)).toBe(1);
  });

  it('ignores short or mostly vertical drags (the page scrolling)', () => {
    expect(swipeStep(-(SWIPE_MIN - 1), 0, 2, 6)).toBeNull();
    expect(swipeStep(-80, 60, 2, 6)).toBeNull();
  });

  it('stops at both ends', () => {
    expect(swipeStep(80, 0, 0, 6)).toBeNull();
    expect(swipeStep(-80, 0, 5, 6)).toBeNull();
  });

  it('is wired to the compact viewer, away from the pill row', () => {
    const tsx = fs.readFileSync(path.resolve(__dirname, '../src/components/SkillsSection.tsx'), 'utf8');
    expect(tsx).toMatch(/onTouchStart=\{onViewerTouchStart\}\s*onTouchMove=\{onViewerTouchMove\}\s*onTouchEnd=\{onViewerTouchEnd\}\s*onTouchCancel=\{onViewerTouchCancel\}/);
    expect(tsx).toContain("isCompact && e.touches.length === 1 && !(e.target as HTMLElement).closest('.ai-viewer-rail')");
    // the track follows the finger on the locked axis, resisting past
    // either end, and the pill row scrolls along
    expect(tsx).toContain("if (!s.lock && Math.hypot(dx, dy) > 8) s.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';");
    expect(tsx).toContain('setTrack(atEnd ? dx * 0.3 : dx, false);');
    expect(tsx).toContain('if (!atEnd) syncPills(-dx / (swipeTrackRef.current?.offsetWidth || 360));');
    // or spring back; past the threshold that step is current at once and
    // its slide glides on from where the drag left it
    expect(tsx).toContain('if (to === null) { setTrack(0, !reduced); releasePills(true); return; }');
    expect(tsx).toContain('swipeCommitRef.current = { offset: dx < 0 ? dx + w : dx - w };');
    expect(tsx).toMatch(/setTrack\(c\.offset, false\);\s*void swipeTrackRef\.current\?\.offsetWidth;[^\n]*\s*setTrack\(0, true\);/);
    // track, pill row and highlight settle on one time and curve
    expect(tsx).toContain("const SWIPE_EASE = 'power2.out';");
    expect(tsx).toContain("const SWIPE_EASE_CSS = 'cubic-bezier(.33, 1, .68, 1)';");
    expect(tsx).toContain('gsap.to(row, { scrollLeft: left, duration: SWIPE_SLIDE_MS / 1000, ease: SWIPE_EASE');
    expect(tsx).toContain('duration: snap ? 0 : swiped ? SWIPE_SLIDE_MS / 1000 : AI_PILL_MORPH_S, ease: swiped ? SWIPE_EASE');
    // neighbours render as still peeks
    const stage = fs.readFileSync(path.resolve(__dirname, '../src/components/AiAppStage.tsx'), 'utf8');
    expect(stage).toContain('id={peek ? undefined : `ai-stage-${s.id}`}');
    expect(stage).toContain('<Screen active={isActive && !peek} t={tt} c={c} />');
    const css = fs.readFileSync(path.resolve(__dirname, '../src/styles/portfolio.css'), 'utf8');
    expect(css).toMatch(/\.ai-swipe \{\s*--swipe-gap: 24px;\s*overflow-x: clip;\s*touch-action: pan-y;/);
    expect(css).toMatch(/\.ai-swipe-track \{\s*display: flex;\s*gap: var\(--swipe-gap\);\s*transform: translateX\(calc\(-100% - var\(--swipe-gap\)\)\);/);
  });
});
