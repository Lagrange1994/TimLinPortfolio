import { describe, it, expect, afterEach, vi } from 'vitest';

// useRiseReveal registers ScrollTrigger on import, which needs matchMedia.
vi.hoisted(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

import gsap from 'gsap';
import { attachAiViewerEntrance, ENTER_X, ENTER_Y, ENTER_AT, ENTER_STAGGER, ENTER_DUR } from '../src/utils/aiViewerEntrance';
import { RISE_START_EVENT, type RiseStartDetail } from '../src/utils/useRiseReveal';

// How I Use AI entrance: the stage rises in from below (rise-card), and on
// that rise the app window rises in too, the rail and front panel slide in
// from the left, the LINE phone from the right, all on the stage's own rise
// timeline.
const build = () => {
  document.body.innerHTML = `
    <div class="ai-viewer">
      <div class="ai-viewer-rail"><div class="ai-pills-wrap"></div><div class="ai-viewer-nav"></div></div>
      <div class="ai-stage">
        <div class="aas-window"></div>
        <div class="aas-sat aas-phone"></div>
        <div class="aas-sat aas-front aas-flow is-on"></div>
        <div class="aas-sat aas-front aas-flow"></div>
        <div class="aas-sat aas-front aas-handoff"></div>
      </div>
    </div>`;
  const viewer = document.querySelector<HTMLElement>('.ai-viewer')!;
  const q = (s: string) => viewer.querySelector<HTMLElement>(s)!;
  return { viewer, win: q('.aas-window'), rail: q('.ai-pills-wrap'), nav: q('.ai-viewer-nav'), phone: q('.aas-phone'), front: q('.aas-front.is-on'), offs: Array.from(viewer.querySelectorAll<HTMLElement>('.aas-front:not(.is-on)')) };
};
const rise = (target: HTMLElement, dir: 1 | -1 = 1) => {
  const tl = gsap.timeline({ paused: true });
  target.dispatchEvent(new CustomEvent<RiseStartDetail>(RISE_START_EVENT, { bubbles: true, detail: { tl, dir, riseY: 28, tween: { duration: 1.05, ease: 'elastic.out(0.8, 0.75)' } } }));
  return tl;
};
const tweenOf = (tl: gsap.core.Timeline, el: HTMLElement) =>
  tl.getChildren(false, true, false).find(t => (t as gsap.core.Tween).targets().includes(el)) as gsap.core.Tween | undefined;

afterEach(() => { document.body.innerHTML = ''; });

describe('How I Use AI viewer entrance', () => {
  it('raises the window, slides the rail and front panel in from the left, the phone from the right', () => {
    const { viewer, win, rail, nav, phone, front } = build();
    attachAiViewerEntrance(viewer);
    const tl = rise(viewer);
    // the step buttons sit in the card's notch: they stay on the card
    expect(tweenOf(tl, nav)).toBeUndefined();
    expect(tweenOf(tl, rail.parentElement!)).toBeUndefined();
    // starting state, rendered right away
    expect(gsap.getProperty(rail, 'x')).toBe(-ENTER_X);
    expect(gsap.getProperty(phone, 'x')).toBe(ENTER_X);
    expect(gsap.getProperty(win, 'y')).toBe(ENTER_Y);
    expect(front.style.translate).toBe(`${-ENTER_X}px 0px`);
    for (const el of [win, rail, phone]) expect(el.style.opacity).toBe('0');
    expect(front.style.opacity).toBe('0');
    // window and rail together, then the panel, then the phone, inside the stage's rise
    expect(tweenOf(tl, win)!.startTime()).toBeCloseTo(ENTER_AT);
    expect(tweenOf(tl, rail)!.startTime()).toBeCloseTo(ENTER_AT);
    expect(tweenOf(tl, front)!.startTime()).toBeCloseTo(ENTER_AT + ENTER_STAGGER);
    expect(tweenOf(tl, phone)!.startTime()).toBeCloseTo(ENTER_AT + ENTER_STAGGER * 2);
    // settled: all inline styles handed back to the stylesheet
    tl.progress(1);
    for (const el of [win, rail, phone]) expect(el.style.transform + el.style.opacity + el.style.visibility).toBe('');
    expect(front.style.translate + front.style.opacity + front.style.transition).toBe('');
    expect(tl.duration()).toBeCloseTo(ENTER_AT + ENTER_STAGGER * 2 + ENTER_DUR);
  });

  // The front panel's transform runs its step switch and its translate the
  // drag offset; the hidden panels must stay at opacity 0.
  it('moves the showing front panel on translate only, and leaves the hidden ones alone', () => {
    const { viewer, front, offs } = build();
    attachAiViewerEntrance(viewer);
    rise(viewer);
    expect(front.style.transform).toBe('');
    expect(front.style.transition).toBe('none');
    for (const el of offs) expect(el.getAttribute('style')).toBeNull();
  });

  it('ignores rises from anything but the viewer, and stops listening when detached', () => {
    const { viewer, rail } = build();
    const detach = attachAiViewerEntrance(viewer);
    expect(rise(rail).getChildren().length).toBe(0);
    detach();
    expect(rise(viewer).getChildren().length).toBe(0);
  });

  // Scrolling up the stage drops in from above: the window mirrors, the
  // sideways pieces keep their directions.
  it('drops the window in from above when scrolling up, sideways pieces unchanged', () => {
    const { viewer, win, rail, phone, front } = build();
    attachAiViewerEntrance(viewer);
    rise(viewer, -1);
    expect(gsap.getProperty(win, 'y')).toBe(-ENTER_Y);
    expect(gsap.getProperty(rail, 'x')).toBe(-ENTER_X);
    expect(front.style.translate).toBe(`${-ENTER_X}px 0px`);
    expect(gsap.getProperty(phone, 'x')).toBe(ENTER_X);
  });

  it('skips pieces a layout does not show (phone stage: no front panel)', () => {
    const { viewer } = build();
    viewer.querySelectorAll('.aas-front').forEach(el => el.remove());
    attachAiViewerEntrance(viewer);
    expect(rise(viewer).getChildren().length).toBe(3);
  });
});
