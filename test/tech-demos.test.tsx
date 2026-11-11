import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { LangProvider } from '../src/context/LangContext';
import { HtmlDemo, JsDemo, RwdDemo } from '../src/components/TechDemos';
import { translations } from '../src/i18n/translations';

// Tech Stack cards: each mock screen acts out its card's copy (design comp
// ↔ markup; request → AI → interaction; one flex layout at three widths),
// in the page's language, and loops only while on screen.
const css = fs.readFileSync(path.resolve(__dirname, '../src/components/TechDemos.css'), 'utf8');
const skills = fs.readFileSync(path.resolve(__dirname, '../src/components/SkillsSection.tsx'), 'utf8');

type IOCallback = (entries: { isIntersecting: boolean }[]) => void;
let ioCallbacks: IOCallback[] = [];
class FakeIO {
  cb: IOCallback;
  constructor(cb: IOCallback) { this.cb = cb; ioCallbacks.push(cb); }
  observe() {}
  disconnect() {}
}

afterEach(() => {
  cleanup();
  ioCallbacks = [];
  vi.unstubAllGlobals();
  localStorage.clear();
});

const renderAll = () => render(<LangProvider><HtmlDemo /><JsDemo /><RwdDemo /></LangProvider>);

describe('Tech Stack demos', () => {
  it('replace the typing code snippets in all three cards', () => {
    expect(skills).toContain('<HtmlDemo />');
    expect(skills).toContain('<JsDemo />');
    expect(skills).toContain('<RwdDemo />');
    expect(skills).not.toContain('TECH_CODE_LINES');
  });

  it('render in the page language, inside the code window frame', () => {
    localStorage.setItem('lang', 'zh');
    vi.stubGlobal('IntersectionObserver', FakeIO);
    const { container } = renderAll();
    const wins = container.querySelectorAll('.tech-code-preview.td');
    expect(wins).toHaveLength(3);
    for (const w of wins) expect(w.getAttribute('aria-hidden')).toBe('true');
    const zh = translations.zh;
    expect(container.textContent).toContain(zh.td_html_bar);
    expect(container.textContent).toContain(zh.td_js_prompt);
    expect(container.textContent).toContain(zh.td_rwd_tablet);
    // the markup quotes the comp's own copy
    expect(container.textContent).toContain(`<button class="btn">${zh.td_html_btn}</button>`);
  });

  it('every demo string has an English version', () => {
    const keys = Object.keys(translations.zh).filter(k => k.startsWith('td_'));
    expect(keys.length).toBeGreaterThan(10);
    for (const k of keys) expect((translations.en as Record<string, string>)[k], k).toBeTruthy();
  });

  it('loops only while on screen', () => {
    vi.stubGlobal('IntersectionObserver', FakeIO);
    const { container } = renderAll();
    const wins = [...container.querySelectorAll('.td')];
    expect(wins.every(w => !w.hasAttribute('data-play'))).toBe(true);
    act(() => ioCallbacks.forEach(cb => cb([{ isIntersecting: true }])));
    expect(wins.every(w => w.hasAttribute('data-play'))).toBe(true);
    act(() => ioCallbacks.forEach(cb => cb([{ isIntersecting: false }])));
    expect(wins.every(w => !w.hasAttribute('data-play'))).toBe(true);
    expect(css).toMatch(/\.td:not\(\[data-play\]\) \* \{ animation-play-state: paused; \}/);
  });

  it('plays right away where IntersectionObserver is missing', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { container } = renderAll();
    expect([...container.querySelectorAll('.td')].every(w => w.hasAttribute('data-play'))).toBe(true);
  });

  it('the RWD tiles are a real flex wrap, sized off the demo width', () => {
    expect(css).toMatch(/\.td-tiles \{[^}]*flex-wrap: wrap;/);
    expect(css).toMatch(/\.td-tile \{[^}]*flex: 1 1 27cqw;/);
    expect(css).toContain('@keyframes td-width { 0%, 26% { width: 100%; } 33%, 59% { width: 64%; } 66%, 92% { width: 38%; } 100% { width: 100%; } }');
  });

  it('reduced motion rests every demo on its telling frame', () => {
    const rm = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*)\}\s*$/)![1];
    expect(rm).toContain('animation: none !important');
    expect(rm).toMatch(/\.td-s4, \.td-swatch, \.td-ask, \.td-answer, \.td-rise, \.td-bp-2 \{ opacity: 1; \}/);
    expect(rm).toContain('.td-frame { width: 64%; }');
  });
});
