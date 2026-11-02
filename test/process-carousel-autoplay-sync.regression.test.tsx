import { createElement } from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Phone width, so ProcessCarousel pages one card at a time and shows tabs.
vi.hoisted(() => {
  // jsdom has no AnimationEvent; without it React listens for the
  // vendor-prefixed name instead of plain 'animationend'.
  (window as unknown as { AnimationEvent: typeof Event }).AnimationEvent ??= class extends Event {};
  window.matchMedia = ((q: string) => ({
    matches: q === '(max-width: 767px)',
    media: q,
    onchange: null,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

import { ProcessCarousel } from '../src/components/SkillsSection';

// On a phone the tab's countdown bar and the slide drifted apart: autoplay
// ran on its own 6s setTimeout (throttled when the tab is backgrounded)
// while the bar is a CSS animation (not throttled). The bar's animationend
// now drives the advance; the timer is only a fallback.

const TABS = [
  { label: 'HTML / CSS', color: '#60a5fa' },
  { label: 'JavaScript', color: '#fb923c' },
  { label: 'React / Vue', color: '#8b7bff' },
];

function setup(withTabs = true) {
  const cards = [0, 1, 2].map(n => createElement('div', { key: n }, `card ${n}`));
  const utils = render(createElement(ProcessCarousel, { cards, ...(withTabs ? { tabs: TABS } : {}) }));
  const track = utils.container.querySelector<HTMLElement>('.process-column-grid--inhouse')!;
  // Cards finish their scroll-in, then the 1.5s buffer arms autoplay.
  act(() => { track.dispatchEvent(new Event('rise-settled', { bubbles: true })); });
  act(() => { vi.advanceTimersByTime(1500); });
  const active = () => utils.container.querySelector('.process-tab.is-active')?.textContent;
  const activeDot = () => [...utils.container.querySelectorAll('.process-swipe-dot')].findIndex(d => d.classList.contains('active'));
  return { ...utils, active, activeDot };
}

const endFill = (el: Element, animationName = 'process-dot-progress') =>
  act(() => {
    const ev = new Event('animationend', { bubbles: true });
    Object.defineProperty(ev, 'animationName', { value: animationName });
    el.dispatchEvent(ev);
  });

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('ProcessCarousel — autoplay follows the countdown bar', () => {
  it('advances the tab when its fill animation ends', () => {
    const { container, active } = setup();
    expect(active()).toBe('HTML / CSS');
    endFill(container.querySelector('.process-tab-fill.is-timing')!);
    expect(active()).toBe('JavaScript');
    endFill(container.querySelector('.process-tab-fill.is-timing')!);
    expect(active()).toBe('React / Vue');
    endFill(container.querySelector('.process-tab-fill.is-timing')!);
    expect(active()).toBe('HTML / CSS'); // loops back
  });

  it('a 6s wall-clock timer alone no longer moves the slide ahead of the bar', () => {
    const { active } = setup();
    act(() => { vi.advanceTimersByTime(6000); });
    expect(active()).toBe('HTML / CSS');
  });

  it('still advances on the fallback timer when no fill animation ever ends', () => {
    const { active } = setup();
    act(() => { vi.advanceTimersByTime(6500); });
    expect(active()).toBe('JavaScript');
  });

  it('ignores other animations ending inside the bar', () => {
    const { container, active } = setup();
    endFill(container.querySelector('.process-tab-fill')!, 'something-else');
    expect(active()).toBe('HTML / CSS');
  });

  it('the dots variant advances on its fill too', () => {
    const { container, activeDot } = setup(false);
    expect(activeDot()).toBe(0);
    endFill(container.querySelector('.process-swipe-dot-fill')!);
    expect(activeDot()).toBe(1);
  });
});

describe('How I Use AI compact pill row — current pill aligns left', () => {
  const read = (p: string) => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8').replace(/\r\n/g, '\n');
  it('scrolls the current pill to the row start and snaps pills to their start', () => {
    const skills = read('src/components/SkillsSection.tsx');
    // final sizes of the pills before it, not a mid-morph offsetLeft
    expect(skills).toMatch(/let left = padL - \(parseFloat\(cs\.scrollPaddingLeft\) \|\| 0\);/);
    expect(skills).toMatch(/el\.querySelector<HTMLElement>\('\.ai-pill-open'\)\?\.offsetWidth/);
    // a blank tail after the last pill lets the last ones reach the left too
    expect(skills).toMatch(/row\.style\.setProperty\('--ai-pills-tail'/);
    expect(skills).not.toMatch(/row\.clientWidth - li\.offsetWidth\) \/ 2/);
    // compact pills resize at once, so the row's snap never locks mid-morph
    expect(skills).toMatch(/if \(isCompact\) gsap\.set\(p\.li, sizes\[i\]\);/);
    const css = read('src/styles/portfolio.css');
    expect(css).toMatch(/\.ai-pill \{ flex-shrink: 0; scroll-snap-align: start; \}/);
    // flush with the row's 16px padding
    expect(css).toMatch(/scroll-padding-inline: 16px;/);
    expect(css).toMatch(/\.ai-pills::after \{\s*content: '';\s*flex: 0 0 var\(--ai-pills-tail, 0px\);/);
  });

  it('gives the compact stage frame a small top-left corner, large elsewhere', () => {
    const css = read('src/styles/portfolio.css');
    const compact = css.slice(css.indexOf('@media (max-width: 960px) {\n      .ai-viewer {'));
    const frame = compact.match(/\.ai-viewer \{([^}]*)\}/)![1];
    // concentric with the app window: 16px radius + 17px gap
    expect(frame).toMatch(/border-radius: 12px 33px 33px 33px;/);
    expect(frame).toMatch(/corner-shape: round;/);
    expect(read('src/components/AiAppStage.css')).toMatch(/\.aas-window \{ height: 520px; border-radius: 16px; \}/);
  });
});
