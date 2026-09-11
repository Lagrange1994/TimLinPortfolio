import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { LangProvider } from '../src/context/LangContext';

// GSAP ScrollTrigger's own create() does a synchronous state sync against the
// CURRENT scroll position, so when the trigger element already satisfies its
// `start` condition at creation time (e.g. the browser restored scroll
// position mid-page on reload), onEnter fires synchronously, before this
// component's wall-frame has ever been painted with opacity:0 — the CSS
// transition on .wall-frame-in has no "from" frame to interpolate from and
// the reveal collapses into an instant jump instead of a fade (see
// PortfolioSection.tsx's wall-frame-in reveal effect). This mock reproduces
// that exact race by invoking onEnter synchronously inside create(), the way
// real ScrollTrigger does when the trigger is already active on creation.
let capturedOnEnter: (() => void) | null = null;
vi.mock('gsap/ScrollTrigger', () => ({
  default: {
    create: (config: { onEnter?: () => void }) => {
      capturedOnEnter = config.onEnter ?? null;
      config.onEnter?.();
      return { kill: vi.fn() };
    },
  },
}));
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    to: vi.fn(),
    fromTo: vi.fn(),
    killTweensOf: vi.fn(),
  },
}));

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

describe('.wall-frame-in reveal — synchronous onEnter race', () => {
  let rafQueue: FrameRequestCallback[] = [];

  beforeEach(() => {
    capturedOnEnter = null;
    rafQueue = [];
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  function flushOneFrame() {
    const queued = rafQueue.splice(0, rafQueue.length);
    queued.forEach(cb => cb(0));
  }

  it('does not add .visible synchronously even when ScrollTrigger fires onEnter at creation', async () => {
    const { default: PortfolioSection } = await import('../src/components/PortfolioSection');
    render(<LangProvider><PortfolioSection /></LangProvider>);

    expect(capturedOnEnter).not.toBeNull();
    const frame = document.querySelector('.portfolio-wall-frame');
    expect(frame).not.toBeNull();

    // onEnter already ran synchronously during render (the race) — the fix
    // must have deferred the actual class add behind rAFs instead of doing
    // it inline, or this would already be true here.
    expect(frame!.classList.contains('visible')).toBe(false);

    flushOneFrame();
    expect(frame!.classList.contains('visible')).toBe(false);

    flushOneFrame();
    expect(frame!.classList.contains('visible')).toBe(true);
  });
});
