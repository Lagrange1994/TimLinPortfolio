import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { scrollToSectionAligned, autoScrollTarget, autoScrollSkips, AUTO_SCROLL_END_EVENT } from '../src/utils/navHeader';
import { wallShapeProgress } from '../src/utils/portfolioZoom';

// A nav/CTA auto-scroll marks <html data-auto-scroll="<id>"> while it runs,
// so sections it flies past skip their entrance and scroll-zoom animations
// and only the target section animates.
describe('auto-scroll marks its target', () => {
  let frame: FrameRequestCallback | null;
  let now: number;

  beforeEach(() => {
    frame = null;
    now = 0;
    window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => { frame = cb; return 1; }) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = (() => {}) as typeof window.cancelAnimationFrame;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.spyOn(window, 'scrollTo').mockImplementation((() => {}) as typeof window.scrollTo);
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 10000, configurable: true });
    document.body.innerHTML = '<section id="portfolio"><div id="inner"></div></section><section id="contact"></section>';
    delete document.documentElement.dataset.autoScroll;
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('sets the target id while scrolling, clears it and fires the end event on landing', () => {
    const onEnd = vi.fn();
    window.addEventListener(AUTO_SCROLL_END_EVENT, onEnd);
    scrollToSectionAligned('contact');
    expect(autoScrollTarget()).toBe('contact');
    // run past the tween and the grace window
    for (let i = 0; i < 4 && frame; i++) { now += 2000; const f = frame; frame = null; f(now); }
    expect(autoScrollTarget()).toBeNull();
    expect(onEnd).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTO_SCROLL_END_EVENT, onEnd);
  });

  it('clears the mark when the user takes over', () => {
    scrollToSectionAligned('contact');
    window.dispatchEvent(new Event('wheel'));
    frame?.(now);
    expect(autoScrollTarget()).toBeNull();
  });

  it('home is a target too', () => {
    scrollToSectionAligned('home');
    expect(autoScrollTarget()).toBe('home');
  });

  it('reduced motion jumps without marking', () => {
    window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;
    scrollToSectionAligned('contact');
    expect(autoScrollTarget()).toBeNull();
  });
});

describe('autoScrollSkips', () => {
  beforeEach(() => {
    document.body.innerHTML = '<section id="portfolio"></section><section id="wrap"><div id="contact"></div></section><section id="about"></section>';
  });
  afterEach(() => { delete document.documentElement.dataset.autoScroll; });

  it('skips nothing without an auto-scroll', () => {
    expect(autoScrollSkips(document.getElementById('about')!)).toBe(false);
  });

  it('skips every section but the target (or the one holding it)', () => {
    document.documentElement.dataset.autoScroll = 'contact';
    expect(autoScrollSkips(document.getElementById('about')!)).toBe(true);
    expect(autoScrollSkips(document.getElementById('portfolio')!)).toBe(true);
    expect(autoScrollSkips(document.getElementById('wrap')!)).toBe(false);
  });

  it('a section that is the target is not skipped', () => {
    document.documentElement.dataset.autoScroll = 'portfolio';
    expect(autoScrollSkips(document.getElementById('portfolio')!)).toBe(false);
  });
});

describe('wallShapeProgress holds the formed wall while flying past', () => {
  afterEach(() => { delete document.documentElement.dataset.autoScroll; vi.restoreAllMocks(); });

  function stuckSection() {
    document.body.innerHTML = '<div data-zoom-track=""><section id="portfolio"></section></div>';
    const section = document.getElementById('portfolio')!;
    const track = section.parentElement!;
    Object.defineProperty(track, 'offsetHeight', { value: 2000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    track.getBoundingClientRect = () => ({ top: 0 } as DOMRect); // track start: t = 0
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ position: 'sticky' } as CSSStyleDeclaration);
    return section;
  }

  it('forms with the scroll normally', () => {
    expect(wallShapeProgress(stuckSection())).toBe(0);
  });

  it('is 1 while an auto-scroll heads elsewhere', () => {
    const s = stuckSection();
    document.documentElement.dataset.autoScroll = 'contact';
    expect(wallShapeProgress(s)).toBe(1);
  });

  it('still forms when the auto-scroll targets the portfolio', () => {
    const s = stuckSection();
    document.documentElement.dataset.autoScroll = 'portfolio';
    expect(wallShapeProgress(s)).toBe(0);
  });
});

describe('wiring', () => {
  const css = readFileSync(resolve(__dirname, '../src/styles/portfolio.css'), 'utf8');
  const rise = readFileSync(resolve(__dirname, '../src/utils/useRiseReveal.ts'), 'utf8');
  const pf = readFileSync(resolve(__dirname, '../src/components/PortfolioSection.tsx'), 'utf8');

  it('portfolio zoom is off unless the portfolio is the target', () => {
    expect(css).toContain(':root[data-auto-scroll]:not([data-auto-scroll="portfolio"]) .portfolio-scroll > #portfolio,');
  });

  it('MCP zoom is off during any auto-scroll, Claude panel loop untouched', () => {
    const rule = css.slice(css.indexOf(':root[data-auto-scroll] .mcp-scroll'));
    const sel = rule.slice(0, rule.indexOf('{'));
    expect(sel).toContain('.mcp-zoom');
    expect(sel).not.toContain('.mcp-chat');
  });

  it('rise reveals in skipped sections play at once', () => {
    expect(rise).toMatch(/if \(autoScrollSkips\(section\)\) tl\.delay\(0\)\.timeScale\(SKIP_SPEED\)/);
  });

  it('portfolio redraws its shape when the auto-scroll ends', () => {
    expect(pf).toContain('window.addEventListener(AUTO_SCROLL_END_EVENT, drawShape)');
    expect(pf).toContain('window.removeEventListener(AUTO_SCROLL_END_EVENT, drawShape)');
  });
});
