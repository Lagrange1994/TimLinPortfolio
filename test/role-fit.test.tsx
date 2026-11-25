import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, cleanup, fireEvent, act } from '@testing-library/react';
import RoleFit, { FIT_ROLES, FIT_WORKS, FIT_COLUMNS, FIT_PHONE_ORDER, findRole, nextRoleIndex, typedFrame, decryptFrame, reducedMotion } from '../src/components/RoleFit';
import { LangProvider } from '../src/context/LangContext';
import { translations } from '../src/i18n/translations';

const root = resolve(__dirname, '..');
const cjk = /[一-鿿]/;
const css = readFileSync(resolve(root, 'src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
const icons = readFileSync(resolve(root, 'src/styles/icon-faces.css'), 'utf8');
const mount = () => render(<LangProvider><RoleFit /></LangProvider>);
// every role's cards are mounted (stacked in one cell); the shown one is is-active
const shown = (el: Element) => el.querySelector('.fit-cards.is-active')!;
const descs = (el: Element) => [...shown(el).querySelectorAll('.fit-card .skill-card-desc')].map(n => n.textContent);

describe('For You: proof by role, in My Skills\' layout', () => {
  afterEach(cleanup);

  it('is My Skills\' showcase: copy and tabs left, two stepped card columns right', () => {
    const { container } = mount();
    const show = container.querySelector('.skills-showcase.fit-showcase')!;
    expect(show.querySelector('.skills-intro .skills-chooser [role=tablist]')).not.toBeNull();
    const cols = show.querySelectorAll('.skills-tools .skills-cards.is-active > .skills-col');
    expect([...cols].map(c => c.className)).toEqual(['skills-col skills-col--low', 'skills-col skills-col--high']);
    // left: wide then tall; right: tall, wide, then the hand-over tile
    const shapes = (c: Element) => [...c.children].map(x => x.classList.contains('skill-card--wide') ? 'wide' : x.classList.contains('skill-card--tall') ? 'tall' : x.className);
    expect(shapes(cols[0])).toEqual(['wide', 'tall']);
    expect(shapes(cols[1])).toEqual(['tall', 'wide', 'skills-tag-tile fit-next']);
    expect(FIT_COLUMNS).toEqual([[0, 1], [2, 3]]);
    expect(FIT_PHONE_ORDER).toEqual([0, 2, 1, 3]);
    expect((shown(container).querySelectorAll<HTMLElement>('.fit-card')[2]).style.getPropertyValue('--order')).toBe('1');
  });

  it('four roles of four cards; every card an icon from the subset and a scene', () => {
    expect(FIT_ROLES.map(r => r.id)).toEqual(['recruiter', 'pm', 'engineer', 'client']);
    for (const r of FIT_ROLES) {
      expect(r.cards).toHaveLength(4);
      for (const c of r.cards) {
        expect(icons, c.icon).toContain(`.ph-bold.${c.icon}:before`);
      }
    }
    for (const i of ['ph-check', 'ph-arrow-right', 'ph-map-pin']) expect(icons).toContain(`.ph-bold.${i}:before`);
    for (const src of FIT_WORKS) expect(existsSync(resolve(root, 'public', src.slice(2))), src).toBe(true);
  });

  it('renders each role\'s React Bits scenes', () => {
    const { container, getByRole } = mount();
    const scenes = () => [...shown(container).querySelectorAll('.fit-card')].map(c => [...c.classList].find(x => x.startsWith('fit-card--'))!.slice(10));
    expect(scenes()).toEqual(['counter', 'swap', 'rotate', 'type']);
    // Counter rolls 0..5 and stops on the last digit
    expect([...shown(container).querySelectorAll('.fit-roll b')].map(b => b.textContent)).toEqual(['0', '1', '2', '3', '4', '5']);
    expect(shown(container).querySelector<HTMLElement>('.fit-roll > span')!.style.getPropertyValue('--roll')).toBe(`${-500 / 6}%`);
    // the unit sits at the number's bottom right, so the copy doesn't open with it
    expect(shown(container).querySelector('.fit-counter > .fit-unit')!.textContent).toBe('yr');
    expect(css).toMatch(/\.fit-unit \{\n {6}grid-area: 1 \/ 2;\n {6}align-self: end;/);
    for (const lang of ['zh', 'en'] as const) expect(FIT_ROLES[0].cards[0].text[lang]).not.toMatch(/^(年|Years)/);
    expect(shown(container).querySelectorAll('.fit-swap img')).toHaveLength(3);
    // RotatingText repeats its first word so the loop is seamless
    expect([...shown(container).querySelectorAll('.fit-rotate-win b')].map(b => b.textContent)).toEqual(['Government', 'Enterprise', 'Freelance', 'Government']);
    expect(shown(container).querySelector('.fit-type-tag')!.textContent).toBe('EN');
    fireEvent.click(getByRole('tab', { name: 'PM' }));
    expect(scenes()).toEqual(['radar', 'stepper', 'focus', 'orbit']);
    expect(shown(container).querySelectorAll('.fit-stepper li')).toHaveLength(4);
    expect([...shown(container).querySelectorAll('.fit-truefocus b')].map(b => b.textContent)).toEqual(['查詢', '預約', '分享']);
    expect(shown(container).querySelectorAll('.fit-orbit-ring b')).toHaveLength(4);
    fireEvent.click(getByRole('tab', { name: 'Engineer' }));
    expect(scenes()).toEqual(['list', 'decrypt', 'loop', 'cubes']);
    expect(shown(container).querySelector('.fit-list--spec b')!.textContent).toBe('1');
    // LogoLoop: two rows, each its items twice for the seamless run
    expect([...shown(container).querySelectorAll('.fit-loop-track')].map(t => t.children.length)).toEqual([12, 12]);
    expect(shown(container).querySelectorAll('.fit-cubes i')).toHaveLength(16);
    fireEvent.click(getByRole('tab', { name: 'Client' }));
    expect(scenes()).toEqual(['shiny', 'stepper', 'list', 'list']);
    // a mock's words follow the page language
    expect([...shown(container).querySelectorAll('.fit-list--check li')].map(l => l.textContent)).toEqual(['範圍', '金流', '合規']);
    expect(shown(container).querySelector('.fit-list--check .ph-check')).not.toBeNull();
    expect(shown(container).querySelector('.fit-list--line b')!.textContent).toBe('L');
    expect(shown(container).querySelector('.fit-shiny-title')!.textContent).toBe('報價單');
  });

  it('TextType and DecryptedText run on a ticker and stop on unmount', () => {
    vi.useFakeTimers();
    try {
      const { container, getByRole, unmount } = mount();
      const bubble = () => shown(container).querySelector('.fit-type-bubble')!.textContent;
      expect(bubble()).toBe('');
      // only the shown role's ticker runs (Recruiter's TextType)
      expect(vi.getTimerCount()).toBe(1);
      act(() => { vi.advanceTimersByTime(70 * 4); });
      expect(bubble()).toBe('Sure');
      fireEvent.click(getByRole('tab', { name: 'Engineer' }));
      act(() => { vi.advanceTimersByTime(70 * 69); });
      const line = shown(container).querySelector('.fit-decrypt code span')!;
      expect(line.querySelector('.d')!.textContent).toBe('const ui = <Card />;');
      expect(line.querySelector('.x')!.textContent).toBe('');
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('under reduced motion the texts show finished and no ticker starts', () => {
    const mm = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    vi.useFakeTimers();
    try {
      expect(reducedMotion()).toBe(true);
      const { container, getByRole } = mount();
      expect(shown(container).querySelector('.fit-type-bubble')!.textContent).toBe('Sure, I will write the spec in English and share it today.');
      fireEvent.click(getByRole('tab', { name: 'Engineer' }));
      expect(shown(container).querySelector('.fit-decrypt .x')!.textContent).toBe('');
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
      window.matchMedia = mm;
    }
  });

  it('typedFrame types then holds; decryptFrame resolves line by line', () => {
    expect(typedFrame('abc', 0)).toBe('');
    expect(typedFrame('abc', 2)).toBe('ab');
    expect(typedFrame('abc', 10, 30)).toBe('abc');
    expect(typedFrame('abc', 33, 30)).toBe('');
    const zero = () => 0;
    expect(decryptFrame('ab cd', 0, 0, zero)).toEqual({ done: '', noise: '!! !!' });
    expect(decryptFrame('ab cd', 26, 0, zero)).toEqual({ done: 'ab cd', noise: '' });
    // the second line starts later than the first
    expect(decryptFrame('ab cd', 6, 1, zero).done).toBe('');
    expect(decryptFrame('ab cd', 100, 1, zero).done).toBe('ab cd');
  });

  it('a tab swaps the cards and the line under the tabs; the panel follows it', () => {
    const { container, getByRole } = mount();
    expect(descs(container)).toEqual(FIT_ROLES[0].cards.map(c => c.text.zh));
    fireEvent.click(getByRole('tab', { name: 'Engineer' }));
    expect(descs(container)).toEqual(findRole('engineer').cards.map(c => c.text.zh));
    expect(container.querySelector('.skills-sub-line.is-active')!.textContent).toBe(findRole('engineer').line.zh);
    expect(container.querySelectorAll('.skills-sub-line.is-active')).toHaveLength(1);
    expect(getByRole('tabpanel').getAttribute('aria-labelledby')).toBe('fit-tab-engineer');
    expect(container.querySelectorAll('.faq-tab-indicator')).toHaveLength(1);
    // all four roles stay mounted in one cell, so the area keeps the tallest
    // role's height and the tabs centred on it never move
    const panels = [...container.querySelectorAll<HTMLElement>('.skills-panels.fit-panels > .skills-panel')];
    expect(panels.map(p => p.id)).toEqual(FIT_ROLES.map(r => `fit-panel-${r.id}`));
    expect(panels.filter(p => p.classList.contains('is-active')).map(p => p.id)).toEqual(['fit-panel-engineer']);
    for (const p of panels.filter(p => !p.classList.contains('is-active'))) {
      expect(p.getAttribute('aria-hidden')).toBe('true');
      expect(p.hasAttribute('inert')).toBe(true);
    }
    expect(getByRole('tab', { name: 'Engineer' }).getAttribute('aria-controls')).toBe('fit-panel-engineer');
  });

  it('arrow keys move between tabs and wrap; other keys do nothing', () => {
    expect(nextRoleIndex(0, 'ArrowLeft')).toBe(3);
    expect(nextRoleIndex(3, 'ArrowRight')).toBe(0);
    expect(nextRoleIndex(2, 'Home')).toBe(0);
    expect(nextRoleIndex(0, 'End')).toBe(3);
    expect(nextRoleIndex(1, 'a')).toBe(-1);
    const { getByRole } = mount();
    fireEvent.keyDown(getByRole('tablist'), { key: 'ArrowLeft' });
    expect(getByRole('tab', { name: 'Client' }).getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(getByRole('tab', { name: 'Client' }));
    fireEvent.keyDown(getByRole('tablist'), { key: 'x' });
    expect(getByRole('tab', { name: 'Client' }).getAttribute('aria-selected')).toBe('true');
  });

  it('an unknown role falls back to the first', () => {
    expect(findRole('nobody')).toBe(FIT_ROLES[0]);
    expect(findRole('client').label).toBe('Client');
  });

  it('the last tile hands over to Contact', () => {
    const { container } = mount();
    const next = shown(container).querySelector<HTMLAnchorElement>('a.fit-next')!;
    expect(next.getAttribute('href')).toBe('#contact');
    expect(next.querySelector('.skills-tag-tile-label')!.textContent).toBe('Next step');
    expect(next.textContent).toContain(translations.zh.fit_next_cta);
  });

  it('a card lights up under the mouse, not a finger', () => {
    const { container } = mount();
    const card = shown(container).querySelector<HTMLElement>('.fit-card')!;
    card.getBoundingClientRect = () => ({ left: 10, top: 20 }) as DOMRect;
    fireEvent.pointerMove(card, { clientX: 40, clientY: 70, pointerType: 'mouse' });
    expect(card.style.getPropertyValue('--mouse-x')).toBe('30px');
    fireEvent.pointerMove(card, { clientX: 90, clientY: 90, pointerType: 'touch' });
    expect(card.style.getPropertyValue('--mouse-x')).toBe('30px');
    expect(css).toContain('.fit-card:hover .fit-spot { opacity: 1; }');
  });

  it('language rule: label, h2, tabs and card names English; lines and copy Chinese', () => {
    const { container } = mount();
    expect(container.querySelector('.section-label')!.textContent).toBe('For You');
    expect(cjk.test(container.querySelector('h2')!.textContent!)).toBe(false);
    for (const r of FIT_ROLES) {
      expect(cjk.test(r.label)).toBe(false);
      expect(cjk.test(r.line.zh)).toBe(true);
      expect(cjk.test(r.line.en)).toBe(false);
      for (const c of r.cards) {
        expect(cjk.test(c.name)).toBe(false);
        expect(cjk.test(c.text.zh), c.text.zh).toBe(true);
        expect(cjk.test(c.text.en), c.text.en).toBe(false);
      }
    }
    for (const k of ['fit_sub', 'fit_next', 'fit_next_cta'] as const) {
      expect(cjk.test(translations.zh[k])).toBe(true);
      expect(cjk.test(translations.en[k])).toBe(false);
    }
  });

  it('its Chinese copy is all in the homepage font subset', () => {
    const chars: Record<string, string> = JSON.parse(readFileSync(resolve(root, 'scripts/gensen-homepage-chars.json'), 'utf8'));
    const have = new Set([...Object.values(chars).join('')]);
    const copy = [
      translations.zh.fit_sub, translations.zh.fit_next, translations.zh.fit_next_cta,
      ...FIT_ROLES.flatMap(r => [r.line.zh, ...r.cards.map(c => c.text.zh)]),
      ...FIT_ROLES.flatMap(r => r.cards.flatMap(c => {
        const s = c.scene;
        if (s.kind === 'list' || s.kind === 'shiny') return [...s.rows.map(x => x.zh), ...(s.kind === 'shiny' ? [s.title.zh] : [])];
        if (s.kind === 'focus') return s.words.map(x => x.zh);
        if (s.kind === 'rotate') return [s.lead.zh];
        return [];
      })),
    ].join('');
    expect([...copy].filter(c => cjk.test(c) && !have.has(c))).toEqual([]);
  });

  it('sits right before Contact; scenes fit their cards and rest under reduced motion', () => {
    const src = readFileSync(resolve(root, 'src/components/ContactSection.tsx'), 'utf8');
    expect(src).toMatch(/<RoleFit \/>\s*<\/div>\s*<div className="section-wrapper">\s*<section id="contact"/);
    expect(css).toContain('.fit-showcase { margin-top: 0; }');
    expect(css).toMatch(/\.skill-card--wide \.skill-card-art\.fit-art \{[^}]*aspect-ratio: auto;[^}]*align-self: stretch;/);
    expect(css).toMatch(/\.fit-showcase \.faq-tab\.skills-tab \{ flex: 1 1 0; min-width: 0;/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s*\.fit-card \*,\s*\.fit-card \*::after \{ animation: none !important; \}/);
    // the roles not shown hold still in their shared cell
    expect(css).toMatch(/\.fit-cards:not\(\.is-active\) \*,[^{]*\{ animation: none !important; \}/);
    // the number card uses Overview's big stat number
    expect(css).toMatch(/\.fit-counter \{[^}]*--big: clamp\(4\.5rem, 6\.4vw, 6\.25rem\);/);
    expect(css).toMatch(/\.fit-roll b,\s*\.fit-counter em \{[^}]*font-family: var\(--font-heading\);[^}]*font-weight: 800;/);
    // the top-right card sits lower than the left column's tall one
    expect(css).toContain('.fit-cards .skills-col--high > .skill-card--tall .skill-card-art.fit-art { min-height: 120px; }');
    // the old hand-drawn scenes are gone
    for (const old of ['.fit-fan', '.fit-chain', '.fit-bubbles', '.fit-pulse', '.fit-avatars', '.fit-specs', '.fit-quote ']) expect(css).not.toContain(old);
  });
});
