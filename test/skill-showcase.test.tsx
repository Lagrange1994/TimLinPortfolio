import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, cleanup, fireEvent } from '@testing-library/react';
import SkillShowcase, { SKILL_TABS, phoneOrder } from '../src/components/SkillShowcase';
import { LangProvider } from '../src/context/LangContext';
import { translations } from '../src/i18n/translations';

const root = resolve(__dirname, '..');
const cjk = /[一-鿿]/;
const allTools = SKILL_TABS.flatMap(tb => tb.columns.flat());

describe('My Skills showcase', () => {
  afterEach(cleanup);
  const mount = () => render(<LangProvider><SkillShowcase /></LangProvider>);
  const names = (el: Element) => [...el.querySelectorAll('.skill-card-name')].map(n => n.textContent);

  it('has a Chinese sub under its English title, before the tabs', () => {
    const { container } = mount();
    const sub = container.querySelector('.skills-head-sub')!;
    expect(sub.previousElementSibling!.classList.contains('skills-h2')).toBe(true);
    expect(sub.nextElementSibling!.matches('.skills-chooser')).toBe(true);
    expect(sub.nextElementSibling!.firstElementChild!.classList.contains('skills-tabs')).toBe(true);
    expect(sub.textContent).toBe(translations.zh.skills_head_sub.replace('<br>', ''));
    expect(translations.en.skills_head_sub).toBeTruthy();
  });

  it('is static now: no marquee scroller left', () => {
    const { container } = mount();
    expect(container.querySelector('.scroller, .skills-scroller, .scroller-inner')).toBeNull();
    const src = readFileSync(resolve(root, 'src/components/SkillsSection.tsx'), 'utf8');
    expect(src).toContain('<SkillShowcase />');
    expect(src).not.toMatch(/skills-scroller|createScroller|skills-marquee-group/);
  });

  it('tabs sort every tool, each tool once', () => {
    expect(SKILL_TABS.map(tb => tb.label)).toEqual(['UI/UX', 'Visual', '3D']);
    expect(SKILL_TABS.map(tb => tb.columns.map(c => c.map(t => t.name)))).toEqual([
      [['Figma', 'Adobe XD'], ['Dora']],
      [['Lightroom', 'Illustrator'], ['Photoshop', 'Krita']],
      [['Blender'], ['Spline']],
    ]);
    expect(new Set(allTools.map(t => t.id)).size).toBe(9);
  });

  it('opens on UI/UX; clicking a tab swaps the panel', () => {
    const { container, getByRole } = mount();
    const active = () => container.querySelector('.skills-cards.is-active')!;
    expect(names(active())).toEqual(['Figma', 'Adobe XD', 'Dora']);
    fireEvent.click(getByRole('tab', { name: 'Visual' }));
    expect(getByRole('tab', { name: 'Visual' }).getAttribute('aria-selected')).toBe('true');
    expect(getByRole('tab', { name: 'UI/UX' }).getAttribute('aria-selected')).toBe('false');
    expect(names(active())).toEqual(['Lightroom', 'Illustrator', 'Photoshop', 'Krita']);
    // the FAQ's pill tabs: one indicator, on the open tab
    expect(container.querySelectorAll('.faq-tabs [role=tab].faq-tab')).toHaveLength(3);
    expect(container.querySelectorAll('.faq-tab-indicator')).toHaveLength(1);
    expect(getByRole('tab', { name: 'Visual' }).querySelector('.faq-tab-indicator')).not.toBeNull();
    // the line under the tabs follows them; the tabs sit in the copy column
    expect(container.querySelector('.skills-intro [role=tablist]')).not.toBeNull();
    expect(container.querySelector('.skills-sub-line.is-active')!.textContent).toBe(translations.zh.skills_tab_visual);
    expect(container.querySelectorAll('.skills-sub-line.is-active')).toHaveLength(1);
    expect([...container.querySelectorAll('.skills-tag-list.is-active > li')].map(l => l.textContent)).toEqual(SKILL_TABS[1].tags.map(s => s.label));
    expect(container.querySelectorAll('.skills-tag-list.is-active')).toHaveLength(1);
    // the hidden panels stay laid out (one shared cell) but out of reach
    const panels = [...container.querySelectorAll('[role="tabpanel"]')];
    expect(panels).toHaveLength(3);
    expect(panels.map(p => p.hasAttribute('inert'))).toEqual([true, false, true]);
  });

  it('arrow keys move between tabs and wrap', () => {
    const { getByRole } = mount();
    const list = getByRole('tablist');
    fireEvent.keyDown(list, { key: 'ArrowLeft' });
    expect(getByRole('tab', { name: '3D' }).getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(getByRole('tab', { name: '3D' }));
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(getByRole('tab', { name: 'UI/UX' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(list, { key: 'End' });
    expect(getByRole('tab', { name: '3D' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(list, { key: 'Home' });
    expect(getByRole('tab', { name: 'UI/UX' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(list, { key: 'a' });
    expect(getByRole('tab', { name: 'UI/UX' }).getAttribute('aria-selected')).toBe('true');
  });

  it('phoneOrder reads the two columns row by row', () => {
    expect(phoneOrder(SKILL_TABS[1].columns)).toEqual(['lightroom', 'photoshop', 'illustrator', 'krita']);
    expect(phoneOrder(SKILL_TABS[0].columns)).toEqual(['figma', 'dora', 'xd']);
    const { container } = mount();
    const krita = container.querySelector<HTMLElement>('[data-tool="krita"]')!;
    expect(krita.style.getPropertyValue('--order')).toBe('3');
  });

  it('every card has its art; the skill tags sit under the copy', () => {
    const { container } = mount();
    expect(container.querySelectorAll('.skill-card')).toHaveLength(9);
    for (const card of container.querySelectorAll('.skill-card')) expect(card.querySelector('.skill-card-art svg')).not.toBeNull();
    // in the copy column, after the line under the tabs
    expect(container.querySelectorAll('.skills-intro .skills-tag-list')).toHaveLength(3);
    expect(container.querySelector('.skills-tools .skills-tag-list')).toBeNull();
    expect(container.querySelector('.skills-sub + .skills-tags')).not.toBeNull();
    // the copy and every tab's cards line up at the top
    const css = readFileSync(resolve(__dirname, '../src/styles/portfolio.css'), 'utf8');
    expect(css).toMatch(/\.skills-panels > \.skills-panel \{[^}]*align-self: start;/);
    expect(css).toMatch(/\.skills-showcase \{[^}]*align-items: start;/);
    // the tags shown are the open tab's
    expect([...container.querySelectorAll('.skills-tag-list.is-active > li.skill-pill')].map(l => l.textContent)).toEqual(SKILL_TABS[0].tags.map(s => s.label));
  });

  it('language rule: label, h2 and tabs English; sub and card copy Chinese', () => {
    const { container } = mount();
    expect(container.querySelector('.section-label')!.textContent).toBe('My Skills');
    expect(cjk.test(container.querySelector('h2')!.textContent!)).toBe(false);
    for (const tb of SKILL_TABS) expect(cjk.test(tb.label)).toBe(false);
    const zh = translations.zh as unknown as Record<string, string>;
    const en = translations.en as unknown as Record<string, string>;
    for (const k of [...SKILL_TABS.map(tb => `skills_tab_${tb.id}`), ...allTools.map(t => t.descKey)]) {
      expect([k, cjk.test(zh[k])]).toEqual([k, true]);
      expect([k, cjk.test(en[k])]).toEqual([k, false]);
    }
  });

  it('tags: English, distinct within a tab, icons in the self-hosted subset', () => {
    const icons = readFileSync(resolve(root, 'src/styles/icon-faces.css'), 'utf8');
    for (const tb of SKILL_TABS) {
      expect(tb.tags.length).toBeGreaterThanOrEqual(5);
      expect(new Set(tb.tags.map(s => s.label)).size).toBe(tb.tags.length);
      for (const s of tb.tags) {
        expect(cjk.test(s.label)).toBe(false);
        expect(icons, s.icon).toContain(`.ph-bold.${s.icon}:before`);
      }
    }
  });

  it('every logo is a real file', () => {
    for (const t of allTools) expect(existsSync(resolve(root, 'public', t.logo.slice(2))), t.logo).toBe(true);
  });
});
