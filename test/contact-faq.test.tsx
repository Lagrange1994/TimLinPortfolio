import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { LangProvider } from '../src/context/LangContext';
import ContactSection from '../src/components/ContactSection';

// SpecularOverlay (rendered by ContactSection's Send Email button) drives a
// real WebGL2 context via `ogl`, which jsdom can't provide — stub the
// library so mounting ContactSection in tests doesn't throw trying to
// create a GPU context.
vi.mock('ogl', () => {
  class Renderer {
    gl: any;
    constructor() {
      this.gl = {
        clearColor() {},
        enable() {},
        blendFunc() {},
        BLEND: 0,
        ONE: 0,
        ONE_MINUS_SRC_ALPHA: 0,
        canvas: document.createElement('canvas'),
        getExtension: () => null,
      };
    }
    setSize() {}
    render() {}
  }
  class Program {
    uniforms: any;
    constructor(_gl: unknown, opts: { uniforms: unknown }) {
      this.uniforms = opts.uniforms;
    }
  }
  class Mesh {}
  class Triangle {
    attributes = {};
  }
  class Color {
    r = 0;
    g = 0;
    b = 0;
    set() {}
  }
  return { Renderer, Program, Mesh, Triangle, Color };
});

describe('Contact FAQ accordion (Animate UI headless accordion)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('lang', 'en');
  });

  it('starts fully collapsed — no FAQ item open by default', () => {
    const { container } = render(<LangProvider><ContactSection /></LangProvider>);
    const questions = container.querySelectorAll('.faq-question');
    expect(questions).toHaveLength(8);
    for (const q of questions) {
      expect(q.getAttribute('aria-expanded')).toBe('false');
    }
  });

  it('switching to the freelance tab shows its own 6 items, also fully collapsed', () => {
    const { container } = render(<LangProvider><ContactSection /></LangProvider>);
    fireEvent.click(container.querySelector('.faq-tab:nth-of-type(2)')!);

    const questions = container.querySelectorAll('.faq-question');
    expect(questions).toHaveLength(6);
    for (const q of questions) {
      expect(q.getAttribute('aria-expanded')).toBe('false');
    }
  });

  it('clicking a closed item opens it and leaves the rest closed', () => {
    const { container } = render(<LangProvider><ContactSection /></LangProvider>);
    fireEvent.click(container.querySelectorAll('.faq-question')[3]);

    // The click remounts the accordion items to enforce exclusivity, so
    // re-query rather than reuse the stale pre-click node references.
    const questions = container.querySelectorAll('.faq-question');
    expect(questions[3].getAttribute('aria-expanded')).toBe('true');
    expect(questions[3].hasAttribute('data-open')).toBe(true);
    expect(questions[0].getAttribute('aria-expanded')).toBe('false');
    expect(questions[0].hasAttribute('data-open')).toBe(false);
  });

  it('clicking a different item collapses the previously-open one', () => {
    const { container } = render(<LangProvider><ContactSection /></LangProvider>);
    fireEvent.click(container.querySelectorAll('.faq-question')[3]);
    fireEvent.click(container.querySelectorAll('.faq-question')[5]);

    const questions = container.querySelectorAll('.faq-question');
    expect(questions[5].getAttribute('aria-expanded')).toBe('true');
    expect(questions[3].getAttribute('aria-expanded')).toBe('false');
  });

  it('clicking an open item closes it again', () => {
    const { container } = render(<LangProvider><ContactSection /></LangProvider>);
    fireEvent.click(container.querySelectorAll('.faq-question')[0]);
    fireEvent.click(container.querySelectorAll('.faq-question')[0]);

    const questions = container.querySelectorAll('.faq-question');
    expect(questions[0].getAttribute('aria-expanded')).toBe('false');
    expect(questions[0].hasAttribute('data-open')).toBe(false);
  });
});

// The long tail of questions is a row of "ask my AI" buttons under the list,
// answered by the chat bot (data/tim-faq.md) instead of taking up the page.
describe('Contact FAQ: ask my AI', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('lang', 'en');
  });

  it('each tab ends in its own questions, and a click asks the chat', () => {
    const asked: string[] = [];
    const onAsk = (e: Event) => asked.push((e as CustomEvent<{ q: string }>).detail.q);
    window.addEventListener('tim:ask', onAsk);
    const { container } = render(<LangProvider><ContactSection /></LangProvider>);
    const first = [...container.querySelectorAll<HTMLButtonElement>('.faq-more-btn')].map(b => b.textContent);
    expect(first).toEqual(['Remote work?', 'Ways to work?', 'Open to roles?', 'Learning lately?', 'Daily rhythm?']);
    fireEvent.click(container.querySelector('.faq-tab:nth-of-type(2)')!);
    const btns = [...container.querySelectorAll<HTMLButtonElement>('.faq-more-btn')];
    expect(btns.map(b => b.textContent)).toEqual(['What gets declined?', 'Pre-project review?', 'Why the review?']);
    fireEvent.click(btns[0]);
    expect(asked).toEqual(['What kinds of projects might Tim decline?']);
    window.removeEventListener('tim:ask', onAsk);
  });
});
