import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

// About Me: the site's tabs (My Skills, My Design Process, Tech Stack)
// above the cards: Design Principles (three cards) and What I Do (the two
// intro cards). jsdom lacks matchMedia and ResizeObserver-based bits.
vi.hoisted(() => {
  window.matchMedia ??= ((q: string) => ({
    matches: false, media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

import AboutSection from '../src/components/AboutSection';
import { LangProvider } from '../src/context/LangContext';
import { translations } from '../src/i18n/translations';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const t = translations.zh;
const mount = () => render(<LangProvider><AboutSection /></LangProvider>);
const openPanel = (c: HTMLElement) => c.querySelector('.about-panel.is-active')!.id;

afterEach(() => { cleanup(); localStorage.removeItem('lang'); });

describe('About Me tabs', () => {
  it('two English tabs over the cards, opening on Design Principles', () => {
    const { container, getAllByRole } = mount();
    expect(getAllByRole('tab').map(b => b.textContent)).toEqual(['Design Principles', 'What I Do']);
    expect(getAllByRole('tab')[0].getAttribute('aria-selected')).toBe('true');
    expect(openPanel(container)).toBe('about-panel-principles');
    // no line under the tabs
    expect(container.querySelector('.about-tab-desc')).toBeNull();
    // the tabs come before the cards
    expect(container.querySelector('.about-tabs-head + .about-panels')).not.toBeNull();
    // both panels mounted (the reveal scans them once); only one shows
    expect(container.querySelectorAll('.about-panel')).toHaveLength(2);
    expect(container.querySelector('#about-panel-intro')!.getAttribute('aria-hidden')).toBe('true');
    // the cards are the original ones
    expect(container.querySelectorAll('#about-panel-principles .bento-principle')).toHaveLength(3);
    expect(container.querySelectorAll('#about-panel-intro .bento-area-intro1, #about-panel-intro .bento-area-intro2')).toHaveLength(2);
  });

  it('clicking What I Do swaps the cards', () => {
    const { container, getByRole } = mount();
    fireEvent.click(getByRole('tab', { name: 'What I Do' }));
    expect(openPanel(container)).toBe('about-panel-intro');
    expect(container.querySelector('#about-panel-principles')!.getAttribute('aria-hidden')).toBe('true');
    // the FAQ's pill tabs: one indicator, on the open tab
    expect(container.querySelectorAll('.faq-tabs [role=tab].faq-tab')).toHaveLength(2);
    expect(container.querySelectorAll('.faq-tab-indicator')).toHaveLength(1);
    expect(getByRole('tab', { name: 'What I Do' }).querySelector('.faq-tab-indicator')).not.toBeNull();
  });

  it('arrow keys, Home and End move between the tabs; other keys do nothing', () => {
    const { container, getByRole, getAllByRole } = mount();
    const list = getByRole('tablist');
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(openPanel(container)).toBe('about-panel-intro');
    expect(document.activeElement).toBe(getAllByRole('tab')[1]);
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(openPanel(container)).toBe('about-panel-principles');
    fireEvent.keyDown(list, { key: 'ArrowLeft' });
    expect(openPanel(container)).toBe('about-panel-intro');
    fireEvent.keyDown(list, { key: 'Home' });
    expect(openPanel(container)).toBe('about-panel-principles');
    fireEvent.keyDown(list, { key: 'End' });
    expect(openPanel(container)).toBe('about-panel-intro');
    fireEvent.keyDown(list, { key: 'Enter' });
    expect(openPanel(container)).toBe('about-panel-intro');
  });

  it('the pill takes the full row on phones (above them: see tab-type-spec)', () => {
    const css = readFileSync(resolve(__dirname, '../src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
    expect(css).toMatch(/\.about-tab \{\s*flex: 1 1 0;\s*\}/);
    expect(css).toMatch(/\.process-tabs\.about-tabs \{ width: 100%; \}\s*\.about-tab \{ min-width: 0; \}/);
  });
});
