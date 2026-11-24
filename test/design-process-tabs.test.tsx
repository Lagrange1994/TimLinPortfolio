import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

// My Design Process: In-house and Freelance share one column and switch by
// tabs (they were two stacked columns). jsdom lacks matchMedia and
// IntersectionObserver, which the carousel reads.
vi.hoisted(() => {
  window.matchMedia = ((q: string) => ({
    matches: false, media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  globalThis.IntersectionObserver = class {
    observe() {} unobserve() {} disconnect() {} takeRecords() { return []; }
  } as unknown as typeof IntersectionObserver;
});

import { DesignProcessSection } from '../src/components/SkillsSection';
import { LangProvider } from '../src/context/LangContext';
import { translations } from '../src/i18n/translations';

const t = translations.zh;
const mount = () => render(<LangProvider><DesignProcessSection /></LangProvider>);
// the open tab's steps
const names = (root: ParentNode) => [...root.querySelectorAll('.process-mode-panel.is-active .process-name')].map(n => n.textContent);

afterEach(() => { cleanup(); localStorage.removeItem('lang'); });

describe('My Design Process — In-house / Freelance tabs', () => {
  it('has its own English title and Chinese sub over the tabs', () => {
    const { container } = mount();
    expect(container.querySelector('.section-label')!.textContent).toBe('My Design Process');
    expect(container.querySelector('h2')!.textContent).toBe('Two ways to work, one process');
    expect(container.querySelector('.process-sub')!.textContent).toBe(t.process_sub.replace('<br>', ''));
    expect(translations.en.process_sub).toBeTruthy();
  });

  it('one column with two tabs, opening on In-house', () => {
    const { container, getByRole } = mount();
    expect(container.querySelectorAll('.process-column')).toHaveLength(1);
    expect(container.querySelector('.process-column-header')).toBeNull();
    const tabs = [...container.querySelectorAll('[role=tab]')].map(b => b.textContent);
    expect(tabs).toEqual([t.tab_inhouse, t.tab_freelance]);
    expect(getByRole('tab', { name: t.tab_inhouse }).getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('.process-mode-desc')!.textContent).toBe(t.tab_inhouse_desc);
    expect(names(container)).toEqual(['01', '02', '03', '04', '05', '06'].map(i => t[`ih_name_${i}` as keyof typeof t]));
    // the team pill is In-house only
    expect(container.querySelector('.policy-pill')).not.toBeNull();
    // the FAQ's pill tabs: one indicator, on the open tab
    expect(container.querySelectorAll('.faq-tabs [role=tab].faq-tab')).toHaveLength(2);
    expect(container.querySelectorAll('.faq-tab-indicator')).toHaveLength(1);
    expect(getByRole('tab', { name: t.tab_inhouse }).querySelector('.faq-tab-indicator')).not.toBeNull();
  });

  it('clicking Freelance swaps the line and the steps', () => {
    const { container, getByRole } = mount();
    fireEvent.click(getByRole('tab', { name: t.tab_freelance }));
    expect(getByRole('tab', { name: t.tab_freelance }).getAttribute('aria-selected')).toBe('true');
    expect(getByRole('tab', { name: t.tab_inhouse }).getAttribute('aria-selected')).toBe('false');
    expect(container.querySelector('.process-mode-desc')!.textContent).toBe(t.tab_freelance_desc);
    expect(names(container)).toEqual(['01', '02', '03', '04', '05', '06'].map(i => t[`fl_name_${i}` as keyof typeof t]));
    expect(container.querySelector('.policy-pill')).toBeNull();
    // both carousels stay mounted (the scroll reveal scans cards once);
    // the hidden one is out of reach
    const panels = [...container.querySelectorAll('[role="tabpanel"]')];
    expect(panels.map(p => p.getAttribute('aria-labelledby'))).toEqual(['process-tab-inhouse', 'process-tab-freelance']);
    expect(panels.map(p => p.hasAttribute('inert'))).toEqual([true, false]);
    expect(container.querySelectorAll('.process-card')).toHaveLength(12);
    expect(getByRole('tab', { name: t.tab_freelance }).getAttribute('aria-controls')).toBe('process-panel-freelance');
  });

  it('arrow keys and Home/End move between the tabs; other keys do nothing', () => {
    const { getByRole } = mount();
    const list = getByRole('tablist');
    const sel = (name: string) => getByRole('tab', { name }).getAttribute('aria-selected');
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(sel(t.tab_freelance)).toBe('true');
    expect(document.activeElement).toBe(getByRole('tab', { name: t.tab_freelance }));
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(sel(t.tab_inhouse)).toBe('true');
    fireEvent.keyDown(list, { key: 'ArrowLeft' });
    expect(sel(t.tab_freelance)).toBe('true');
    fireEvent.keyDown(list, { key: 'Home' });
    expect(sel(t.tab_inhouse)).toBe('true');
    fireEvent.keyDown(list, { key: 'End' });
    expect(sel(t.tab_freelance)).toBe('true');
    fireEvent.keyDown(list, { key: 'a' });
    expect(sel(t.tab_freelance)).toBe('true');
  });
});
