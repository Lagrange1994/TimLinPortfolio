// Regression: switching language re-wraps the headline, so the desktop
// geometry effect moves the wall's top (anchoredTop). That's a position-only
// change — the notch mask's ResizeObserver never fired, leaving the notch cut
// for the old top: visibly deformed/misaligned against the text. The
// geometry effect now fires 'wall-geometry' and the mask recuts on it.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { LangProvider } from '../src/context/LangContext';
import PortfolioSection from '../src/components/PortfolioSection';

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(), to: vi.fn(), fromTo: vi.fn(), set: vi.fn(), killTweensOf: vi.fn(),
    context: (fn: () => void) => { fn(); return { revert: vi.fn() }; },
  },
}));
vi.mock('gsap/ScrollTrigger', () => ({ default: { create: () => ({ kill: vi.fn() }), refresh: vi.fn() } }));

class NoopObserver { observe() {} unobserve() {} disconnect() {} }

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON() {} } as DOMRect;
}

describe('portfolio notch mask follows the wall top', () => {
  const origRect = Element.prototype.getBoundingClientRect;
  const origCW = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth')!;
  const origCH = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight')!;

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', NoopObserver);
    vi.stubGlobal('ResizeObserver', NoopObserver);
    // Desktop + reduced motion (so the mask effect measures immediately).
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('prefers-reduced-motion') || q.includes('min-width: 1025px'),
      addEventListener() {}, removeEventListener() {},
    }));
    Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 1600 });
    Object.defineProperty(Element.prototype, 'clientHeight', { configurable: true, get: () => 700 });
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const frame = document.querySelector<HTMLElement>('.portfolio-wall-frame');
      const top = parseFloat(frame?.style.top || '0') || 0;
      if (this.id === 'portfolio-scroller-desktop') return rect(160, top, 1600, 700);
      if (this.classList.contains('section-label')) return rect(200, 160, 230, 20);
      if (this.classList.contains('portfolio-headline-title')) return rect(200, 240, 1030, 80);
      if (this.classList.contains('portfolio-headline-sub')) return rect(200, 340, 500, 70);
      if (this.id === 'toggle-portfolio-view') return rect(1500, 800, 160, 48);
      return rect(0, 0, 1920, 1080);
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Element.prototype.getBoundingClientRect = origRect;
    Object.defineProperty(Element.prototype, 'clientWidth', origCW);
    Object.defineProperty(Element.prototype, 'clientHeight', origCH);
  });

  it('recuts the notch when the wall moves without resizing', () => {
    render(<LangProvider><PortfolioSection /></LangProvider>);
    const section = document.getElementById('portfolio')!;
    const frame = document.querySelector<HTMLElement>('.portfolio-wall-frame')!;
    const path = document.querySelector('.portfolio-wall-outline path')!;

    act(() => {
      frame.style.top = '200px';
      section.dispatchEvent(new Event('wall-geometry'));
    });
    const before = path.getAttribute('d');
    expect(before).toBeTruthy();

    // Headline re-wrapped → wall moved up 40px, same size.
    act(() => {
      frame.style.top = '160px';
      section.dispatchEvent(new Event('wall-geometry'));
    });
    const after = path.getAttribute('d');
    expect(after).not.toBe(before);
  });
});
