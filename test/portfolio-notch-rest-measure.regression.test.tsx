// The notch is cut from label/title/sub/frame rects. Those carry GSAP
// entrance transforms (translateY while the wall rises with the text), which
// skew getBoundingClientRect — apply() must measure them at rest by clearing
// the inline transforms for the one synchronous measure, then restore them.
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
const shift = (el: Element) => {
  const t = (el as HTMLElement).style.transform;
  return t && t !== 'none' ? 28 : 0;
};

describe('portfolio notch is measured at rest, mid-entrance', () => {
  const origRect = Element.prototype.getBoundingClientRect;
  const origCW = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth')!;
  const origCH = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight')!;

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', NoopObserver);
    vi.stubGlobal('ResizeObserver', NoopObserver);
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('min-width: 1025px'),
      addEventListener() {}, removeEventListener() {},
    }));
    Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 1600 });
    Object.defineProperty(Element.prototype, 'clientHeight', { configurable: true, get: () => 700 });
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const frame = document.querySelector<HTMLElement>('.portfolio-wall-frame');
      const wallTop = (parseFloat(frame?.style.top || '0') || 0) + (frame ? shift(frame) : 0);
      if (this.id === 'portfolio-scroller-desktop') return rect(160, wallTop, 1600, 700);
      if (this.classList.contains('section-label')) return rect(200, 160 + shift(this), 230, 20);
      if (this.classList.contains('portfolio-headline-title')) return rect(200, 240 + shift(this), 1030, 80);
      if (this.classList.contains('portfolio-headline-sub')) return rect(200, 340 + shift(this), 500, 70);
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

  it('cuts the same notch whether or not the entrance transforms are applied, and restores them', () => {
    render(<LangProvider><PortfolioSection /></LangProvider>);
    const section = document.getElementById('portfolio')!;
    const frame = document.querySelector<HTMLElement>('.portfolio-wall-frame')!;
    const label = document.querySelector<HTMLElement>('#portfolio .section-label')!;
    const title = document.querySelector<HTMLElement>('.portfolio-headline-title')!;
    const sub = document.querySelector<HTMLElement>('.portfolio-headline-sub')!;
    const path = document.querySelector('.portfolio-wall-outline path')!;
    const els = [frame, label, title, sub];

    act(() => {
      frame.style.top = '200px';
      section.dispatchEvent(new Event('wall-geometry'));
    });
    const atRest = path.getAttribute('d');
    expect(atRest).toBeTruthy();

    els.forEach(el => { el.style.transform = 'translateY(28px)'; });
    act(() => { section.dispatchEvent(new Event('wall-geometry')); });
    expect(path.getAttribute('d')).toBe(atRest);
    // The in-flight transforms are put back untouched.
    els.forEach(el => expect(el.style.transform).toBe('translateY(28px)'));
  });
});
