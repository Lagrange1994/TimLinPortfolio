import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { LangProvider } from '../src/context/LangContext';
import PortfolioSection from '../src/components/PortfolioSection';

// .wall-frame-in went through several broken shapes before landing here —
// a plain CSS transition (never actually played, in any trigger mechanism,
// confirmed even toggling the class by hand with no JS involved), then a
// GSAP tween fired once by ScrollTrigger's 'top 85%' (confirmed via GSAP's
// own onUpdate/markers instrumentation to run correctly, but finishes
// playing while the frame is still scrolling up from off-screen). Switched
// to scrub (progress tied to scroll position) — fixed slow hand-scroll, but
// a live opacity+scrollY sampler (click the real CTA button, sample
// getComputedStyle(frame).opacity + window.scrollY every rAF, in the real
// browser) proved fast scroll/CTA-jump still looked instant: the raw
// scroll-linked progress saturated near/at 1 while the page was still
// moving, leaving only an imperceptible tail once it actually stopped. Two
// follow-up one-shot 'top X%' thresholds (55%, then a measured 19%) hit the
// same wall from the other direction — no percentage reliably separates
// "trigger fired" from "page still has a few decelerating px left", because
// scrollToSectionAligned's landing target and this element's natural
// resting view converge by construction (see navHeader.ts). Fixed for real
// by dropping scroll *position* as the trigger entirely: gate on scroll
// *stopping* — a 200ms debounce on the 'scroll' event — so the reveal
// always plays against an already-static page, however the user got there
// (CTA click, fast flick, or slow hand-scroll). Initial timing (150ms
// debounce, 0.6s duration) was correct but too subtle to register against
// post-scroll attention lag — confirmed via a deliberately exaggerated
// debug pass (2.5s duration, 600ms debounce) that the mechanism itself was
// visible and correct, then tuned back to 200ms/1s. This test guards
// against silently reverting to any of the earlier broken versions.
const state = vi.hoisted(() => ({
  toCalls: [] as unknown[][],
  setCalls: [] as unknown[][],
  stCreateCalls: [] as unknown[][],
}));

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    to: (...args: unknown[]) => {
      state.toCalls.push(args);
    },
    fromTo: vi.fn(),
    killTweensOf: vi.fn(),
    set: (...args: unknown[]) => {
      state.setCalls.push(args);
    },
    context: (fn: () => void) => {
      fn();
      return { revert: vi.fn() };
    },
  },
}));
vi.mock('gsap/ScrollTrigger', () => ({
  default: {
    create: (...args: unknown[]) => {
      state.stCreateCalls.push(args);
      return { kill: vi.fn() };
    },
  },
}));

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

type WallFrameToVars = {
  autoAlpha: number;
  duration?: number;
  clipPath?: string;
};

type ScrollTriggerCreateVars = {
  trigger?: unknown;
  start?: string;
  onEnter?: () => void;
};

// Any of these on .portfolio-wall-frame moves/scales it, which drags
// .portfolio-wall-outline's notch stroke out of alignment with the wall —
// see the effect's own comment. Opacity must be the only thing this
// element ever animates — no transform, and no clip-path either (that was
// also tried and reverted, for a different reason: it cuts the outline
// stroke's edge bleed even fully open).
const FORBIDDEN_KEYS = ['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotation', 'skewX', 'skewY', 'clipPath'];

describe('.wall-frame-in reveal', () => {
  beforeEach(() => {
    state.toCalls = [];
    state.setCalls = [];
    state.stCreateCalls = [];
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('is opacity-only and reveals only after scroll settles (150ms of no scroll events), not on raw scroll position', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    render(<LangProvider><PortfolioSection /></LangProvider>);
    const frame = document.querySelector('.portfolio-wall-frame');
    expect(frame).not.toBeNull();

    // Initial hidden state set imperatively by GSAP — not left to a CSS
    // `opacity: 0` + `transition` pair. Opacity only, no transform or
    // clip-path props.
    const initialSet = state.setCalls.find(call => call[0] === frame) as
      | [unknown, { autoAlpha: number }]
      | undefined;
    expect(initialSet?.[1].autoAlpha).toBe(0);
    for (const key of FORBIDDEN_KEYS) expect(initialSet?.[1]).not.toHaveProperty(key);

    // Only watches for "has the frame been scrolled into general view" —
    // does not itself drive the reveal (no scrub, no once:true tween tied
    // to this threshold).
    const stCreate = state.stCreateCalls.find(call => (call[0] as ScrollTriggerCreateVars).trigger === frame) as
      | [ScrollTriggerCreateVars]
      | undefined;
    expect(stCreate?.[0].start).toBeTruthy();
    expect(typeof stCreate?.[0].onEnter).toBe('function');

    // Before the frame has ever entered view, scroll events alone must not
    // reveal it — this asserts the `entered` gate exists, not just the
    // settle debounce.
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(200);
    expect(state.toCalls.find(call => call[0] === frame)).toBeUndefined();

    // Simulate the frame entering view (ScrollTrigger's onEnter), then a
    // burst of scroll events (as scrollToSectionAligned's rAF loop fires
    // window.scrollTo every frame) — must NOT reveal mid-burst.
    stCreate?.[0].onEnter?.();
    for (let i = 0; i < 5; i++) {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(50); // < 200ms debounce — scroll still "in flight"
    }
    expect(state.toCalls.find(call => call[0] === frame)).toBeUndefined();

    // Once scroll events stop for the full debounce window, the reveal
    // fires — this is the settle-gated behavior replacing every earlier
    // scroll-*position*-based mechanism.
    vi.advanceTimersByTime(200);
    const revealTo = state.toCalls.find(call => call[0] === frame) as
      | [unknown, WallFrameToVars]
      | undefined;
    expect(revealTo?.[1].autoAlpha).toBe(1);
    expect(revealTo?.[1].duration).toBeGreaterThan(0);
    for (const key of FORBIDDEN_KEYS) expect(revealTo?.[1]).not.toHaveProperty(key);

    // Reveals exactly once — further scroll settling must not re-trigger it.
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(200);
    expect(state.toCalls.filter(call => call[0] === frame).length).toBe(1);

    // Never falls back to toggling .visible — that was the broken mechanism.
    expect(frame!.classList.contains('visible')).toBe(false);
  });

  it('prefers-reduced-motion visitors skip the scroll-settle reveal entirely and land fully visible', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    render(<LangProvider><PortfolioSection /></LangProvider>);
    const frame = document.querySelector('.portfolio-wall-frame');
    expect(frame).not.toBeNull();

    expect(state.setCalls).toContainEqual([frame, { clearProps: 'all' }]);
    expect(state.toCalls.find(call => call[0] === frame)).toBeUndefined();
  });
});
