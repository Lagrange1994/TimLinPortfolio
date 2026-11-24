import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { LangProvider } from '../src/context/LangContext';
import { HtmlDemo, JsDemo, RwdDemo, TechArt, TechSats, TECH_DRAG_MQ } from '../src/components/TechDemos';
import { translations } from '../src/i18n/translations';

// Tech Stack illustrations: one code window per card, with the skill's art and
// two tools as satellite cards overlapping it (the How I Use AI composition).
const css = fs.readFileSync(path.resolve(__dirname, '../src/components/TechDemos.css'), 'utf8').replace(/\r\n/g, '\n');
const skills = fs.readFileSync(path.resolve(__dirname, '../src/components/SkillsSection.tsx'), 'utf8');

const setDesktop = (matches: boolean) => {
  window.matchMedia = ((q: string) => ({
    matches: q === TECH_DRAG_MQ ? matches : false, media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

const renderAll = () => render(<LangProvider><HtmlDemo /><JsDemo /><RwdDemo /></LangProvider>);

describe('Tech Stack code windows', () => {
  it('every card has its window, satellites and capsule', () => {
    for (const c of ['<HtmlDemo />', '<JsDemo />', '<RwdDemo />', '<TechSats k="html" />', '<TechSats k="js" />', '<TechSats k="react" />']) {
      expect(skills).toContain(c);
    }
    for (const b of ['DESIGN-READY', 'AI-ASSISTED', 'RESPONSIVE']) expect(skills).toContain(b);
  });

  it('keep the code, in the window frame, hidden from AT', () => {
    localStorage.setItem('lang', 'zh');
    const { container } = renderAll();
    const wins = container.querySelectorAll('.tech-code-preview.td');
    expect(wins).toHaveLength(3);
    for (const w of wins) {
      expect(w.getAttribute('aria-hidden')).toBe('true');
      expect(w.querySelector('.tcp-bar .tcp-filename')).not.toBeNull();
      expect(w.querySelector('.td-code .on')).not.toBeNull();
    }
    expect([...container.querySelectorAll('.tcp-filename')].map(f => f.textContent)).toEqual(['index.html', 'reveal.js', 'Layout.tsx']);
    expect(container.textContent).toContain('IntersectionObserver');
    expect(container.textContent).toContain('md:flex-row');
  });

  it('the markup quotes the page language', () => {
    localStorage.setItem('lang', 'zh');
    const zh = render(<LangProvider><HtmlDemo /></LangProvider>);
    expect(zh.container.textContent).toContain(`<h1>${translations.zh.td_html_h1}</h1>`);
    cleanup();
    localStorage.setItem('lang', 'en');
    const en = render(<LangProvider><HtmlDemo /></LangProvider>);
    expect(en.container.textContent).toContain(`<p>${translations.en.td_html_p}</p>`);
  });

  it('every demo string has an English version', () => {
    const keys = Object.keys(translations.zh).filter(k => k.startsWith('td_'));
    expect(keys).toEqual(['td_html_h1', 'td_html_p']);
    for (const k of keys) expect((translations.en as Record<string, string>)[k], k).toBeTruthy();
  });

  it('each drawing plays its code on a loop, paused when hidden, still under reduced motion', () => {
    localStorage.setItem('lang', 'en');
    const { container } = renderAll();
    const [html, js, react] = container.querySelectorAll('.td');
    expect(html.querySelector('.td-draw')).not.toBeNull();
    expect(html.querySelectorAll('.td-in')).toHaveLength(8);
    for (const c of ['.td-js-front', '.td-js-back', '.td-js-cursor', '.td-js-btn']) expect(js.querySelector(c), c).not.toBeNull();
    expect(react.querySelector('.td-rw-handle')).not.toBeNull();
    expect(react.querySelectorAll('.td-rise')).toHaveLength(3);
    // one typing caret per window
    for (const w of [html, js, react]) expect(w.querySelectorAll('.td-caret')).toHaveLength(1);
    // the animated parts carry no opacity attribute (it would fight the animation)
    expect(container.querySelector('.td svg [opacity]')).toBeNull();
    expect(css).toMatch(/@keyframes td-in \{\s*0% \{ opacity: 0; transform: var\(--td-from\); \}/);
    expect(css).toContain('.process-swipe-slot.is-out .td *, .process-swipe-slot.is-out .td *::after { animation-play-state: paused; }');
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{[^@]*\.td \*, \.td \*::after \{ animation: none !important; \}/);
  });

  it('scale off their own width', () => {
    expect(css).toMatch(/\.td-body \{[^}]*container-type: inline-size;[^}]*aspect-ratio: 508 \/ 302;/);
    expect(css).toMatch(/\.td-code \{[^}]*font-size: 2\.36cqw;/);
  });
});

describe('Tech Stack illustrations', () => {
  it('each skill has an existing dark and light file, hidden from AT', () => {
    for (const k of ['html', 'js', 'react'] as const) {
      const { container } = render(<TechArt k={k} />);
      expect(container.querySelector('.tech-art')!.getAttribute('aria-hidden')).toBe('true');
      const imgs = [...container.querySelectorAll('img')];
      expect(imgs.map(i => i.getAttribute('src'))).toEqual([`./img/tech/${k}.webp`, `./img/tech/${k}_l.webp`]);
      for (const i of imgs) {
        expect(i.getAttribute('loading')).toBe('lazy');
        expect(fs.existsSync(path.resolve(__dirname, '../public', i.getAttribute('src')!))).toBe(true);
      }
      cleanup();
    }
  });

  it('shows only the current theme, and only inside the satellite', () => {
    expect(css).toContain('.tech-art-light { display: none !important; }');
    expect(css).toContain(':root[data-theme="light"] .tech-art-dark { display: none !important; }');
    expect(skills).not.toContain('<TechArt');
    for (const k of ['html', 'js', 'react'] as const) {
      const { container } = render(<TechSats k={k} />);
      expect(container.querySelectorAll('.tech-art')).toHaveLength(1);
      expect(container.querySelector('.tech-sat--art .tech-art')).not.toBeNull();
      cleanup();
    }
  });

  it('sits in a square card with the My Design Process edge', () => {
    const card = css.match(/\n\.tech-sat--art \{[^}]*\}/)![0];
    expect(card).toContain('aspect-ratio: 1;');
    expect(card).toContain('border: 1px solid rgba(255, 255, 255, .1);');
    expect(card).toContain('#0d0a1c');
    expect(card).toContain('box-shadow: 0 4px 10px rgba(var(--shadow-near), .18), var(--card-edge);');
    expect(card).toContain('backdrop-filter: none;');
    const light = css.match(/:root\[data-theme="light"\] \.tech-sat--art \{[^}]*\}/)![0];
    expect(light).toContain('border-color: transparent;');
    expect(light).toContain('background: #fff;');
    expect(light).toContain('box-shadow: var(--neu-raised-tight);');
  });
});

describe('Tech Stack satellites', () => {
  it('art plus two tools per card; React / Vue\'s last is the phone', () => {
    for (const k of ['html', 'js', 'react'] as const) {
      const { container } = render(<TechSats k={k} />);
      const sats = container.querySelectorAll('.tech-sat');
      expect(sats).toHaveLength(3);
      expect(sats[0].classList.contains('tech-sat--art')).toBe(true);
      for (const s of sats) expect(s.getAttribute('aria-hidden')).toBe('true');
      for (const s of [sats[1], sats[2]]) expect(s.querySelector('.tm-m, .tm-pn')).not.toBeNull();
      expect(container.querySelector('.tech-sat--phone') !== null).toBe(k === 'react');
      expect(container.querySelector('.tech-sat--b') !== null).toBe(k !== 'react');
      cleanup();
    }
  });

  it('the art card lights up inside under the mouse, not a finger nor in light mode', () => {
    const { container } = render(<TechSats k="html" />);
    const art = container.querySelector<HTMLElement>('.tech-sat--art')!;
    expect(art.querySelector('.tech-art-spot')).not.toBeNull();
    art.getBoundingClientRect = () => ({ left: 10, top: 20 }) as DOMRect;
    fireEvent.pointerMove(art, { clientX: 40, clientY: 70, pointerType: 'mouse' });
    expect(art.style.getPropertyValue('--mouse-x')).toBe('30px');
    expect(art.style.getPropertyValue('--mouse-y')).toBe('50px');
    fireEvent.pointerMove(art, { clientX: 90, clientY: 90, pointerType: 'touch' });
    expect(art.style.getPropertyValue('--mouse-x')).toBe('30px');
    document.documentElement.setAttribute('data-theme', 'light');
    fireEvent.pointerMove(art, { clientX: 90, clientY: 90, pointerType: 'mouse' });
    expect(art.style.getPropertyValue('--mouse-x')).toBe('30px');
    document.documentElement.removeAttribute('data-theme');
    expect(css).toContain('.tech-sat--art:hover .tech-art-spot { opacity: 1; }');
    expect(css).toMatch(/\.touch-input \.tech-art-spot,\s*:root\[data-theme="light"\] \.tech-art-spot \{ display: none; \}/);
  });

  it('each card shows its own working tools', () => {
    const text = (k: 'html' | 'js' | 'react') => render(<TechSats k={k} />).container.textContent;
    expect(text('html')).toContain('#2563EB');
    expect(text('html')).toContain('Padding');
    expect(text('js')).toContain('ease-out');
    expect(text('js')).toContain('reveal.js');
    expect(text('react')).toContain('CardGrid');
    expect(text('react')).toContain('Dashboard');
  });

  it('tickers and the feed end on their first item, so loops never jump', () => {
    const { container } = render(<><TechSats k="html" /><TechSats k="react" /></>);
    for (const t of container.querySelectorAll('.tm-tick > span')) {
      expect(t.children).toHaveLength(4);
      expect(t.children[3].textContent).toBe(t.children[0].textContent);
    }
    const feed = [...container.querySelectorAll('.tm-pn-c')].map(c => c.textContent);
    expect(feed.slice(3)).toEqual(feed.slice(0, 2));
  });

  it('tools scale with the satellite, pause when hidden, rest under reduced motion', () => {
    expect(css).toMatch(/\.tm-m, \.tm-pn \{ --u: calc\(100cqw \/ 154\);/);
    expect(css).toContain('.process-swipe-slot.is-out .tech-sat * { animation-play-state: paused; }');
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{[^@]*\.tech-sat \* \{ animation: none !important; \}/);
  });

  it('use the liquid-glass spec, breathe, and rest under reduced motion', () => {
    const glass = css.match(/\n\.tech-sat \{[^}]*\}/)![0];
    expect(glass).toContain('var(--noise-grain)');
    expect(glass).toContain('backdrop-filter: blur(16px)');
    expect(glass).toContain('animation: tech-sat-breathe 2.4s ease-in-out infinite');
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s*\.tech-sat \{ animation: none; \}/);
    expect(css).toMatch(/\.is-out \.tech-sat \{\s*animation-play-state: paused;/);
  });

  it('the satellites and the code window ripple on hover, not on touch or reduced motion', () => {
    expect(css).toContain('.tech-sat, .tech-code-preview.td { outline: 1px solid transparent; }');
    expect(css).toContain('.tech-sat:hover { animation: tech-sat-breathe 2.4s ease-in-out infinite, card-radar 3s ease-out infinite; }');
    expect(css).toContain('.tech-sat--art:hover, .tech-code-preview.td:hover { animation: card-radar 3s ease-out infinite; }');
    expect(css).toContain('.touch-input :is(.tech-sat--art, .tech-code-preview.td):hover { animation: none; }');
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{[^@]*:is\(\.tech-sat, \.tech-code-preview\.td\):hover \{ animation: none; \}/);
  });

  it('desktop: drags, stays inside the wrap, and keeps the swipe from starting', () => {
    setDesktop(true);
    const onParent = vi.fn();
    const { container } = render(<div className="tech-item-wrap" onPointerDown={onParent}><TechSats k="html" /></div>);
    const wrap = container.querySelector<HTMLElement>('.tech-item-wrap')!;
    const sat = container.querySelector<HTMLElement>('.tech-sat--a')!;
    wrap.getBoundingClientRect = () => ({ left: 0, top: 0, right: 300, bottom: 300 }) as DOMRect;
    sat.getBoundingClientRect = () => ({ left: 100, top: 100, right: 200, bottom: 200 }) as DOMRect;
    fireEvent.pointerDown(sat, { button: 0, clientX: 150, clientY: 150, pointerId: 1 });
    expect(onParent).not.toHaveBeenCalled();
    expect(sat.classList.contains('is-dragging')).toBe(true);
    const move = (x: number, y: number) => {
      const e = new MouseEvent('pointermove', { clientX: x, clientY: y });
      sat.dispatchEvent(e);
    };
    move(170, 140);
    expect(sat.style.getPropertyValue('--dx')).toBe('20px');
    expect(sat.style.getPropertyValue('--dy')).toBe('-10px');
    move(900, -900);
    expect(sat.style.getPropertyValue('--dx')).toBe('100px');
    expect(sat.style.getPropertyValue('--dy')).toBe('-100px');
    sat.dispatchEvent(new MouseEvent('pointerup'));
    expect(sat.classList.contains('is-dragging')).toBe(false);
    move(150, 150);
    expect(sat.style.getPropertyValue('--dx')).toBe('100px');
  });

  it('below desktop, or on a non-primary button, a press does nothing', () => {
    setDesktop(false);
    const onParent = vi.fn();
    const first = render(<div onPointerDown={onParent}><TechSats k="js" /></div>);
    const sat = first.container.querySelector<HTMLElement>('.tech-sat')!;
    fireEvent.pointerDown(sat, { button: 0 });
    expect(sat.classList.contains('is-dragging')).toBe(false);
    expect(onParent).toHaveBeenCalledTimes(1);
    cleanup();
    setDesktop(true);
    const second = render(<TechSats k="js" />);
    const s2 = second.container.querySelector<HTMLElement>('.tech-sat')!;
    fireEvent.pointerDown(s2, { button: 2 });
    expect(s2.classList.contains('is-dragging')).toBe(false);
  });
});
