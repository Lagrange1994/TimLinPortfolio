import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { LangProvider } from '../src/context/LangContext';
import Navbar from '../src/components/Navbar';

// Regression: ISSUE-002 — "Back to Portfolio" on project sub-pages navigated
// to location.href = '/#portfolio', but the homepage never scrolled to the
// #portfolio section because React mounts it after the browser's one-shot
// native hash-scroll already fired (and found nothing there).
// Found by /qa-only on 2026-06-20, fixed via /qa on 2026-06-20.
describe('Navbar hash-on-load deep link', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      disconnect() {}
    });
    document.body.innerHTML = '<section id="portfolio"></section>';
    window.location.hash = '';
    document.body.classList.remove('hero-ready');
    sessionStorage.removeItem('home-scroll-y');
  });

  it('scrolls to the hash target immediately if the page is already hero-ready', () => {
    window.location.hash = '#portfolio';
    document.body.classList.add('hero-ready');
    const target = document.getElementById('portfolio')!;
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;

    render(<LangProvider><Navbar /></LangProvider>);

    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('scrolls to the hash target once the hero-ready event fires', () => {
    window.location.hash = '#portfolio';
    const target = document.getElementById('portfolio')!;
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;

    render(<LangProvider><Navbar /></LangProvider>);
    expect(scrollIntoView).not.toHaveBeenCalled();

    document.body.classList.add('hero-ready');
    window.dispatchEvent(new Event('hero-ready'));

    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('restores the exact saved scroll position for #portfolio instead of jumping to the section top', () => {
    // The user asked: returning to the portfolio should restore the homepage's
    // exact prior scroll position, not just scroll the #portfolio section into view.
    sessionStorage.setItem('home-scroll-y', '2750');
    window.location.hash = '#portfolio';
    document.body.classList.add('hero-ready');
    const target = document.getElementById('portfolio')!;
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo;

    render(<LangProvider><Navbar /></LangProvider>);

    expect(scrollTo).toHaveBeenCalledWith({ top: 2750, behavior: 'auto' });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('falls back to scrolling the #portfolio section into view when no scroll position was saved', () => {
    window.location.hash = '#portfolio';
    document.body.classList.add('hero-ready');
    const target = document.getElementById('portfolio')!;
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;

    render(<LangProvider><Navbar /></LangProvider>);

    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('does nothing when there is no hash', () => {
    const target = document.getElementById('portfolio')!;
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;

    render(<LangProvider><Navbar /></LangProvider>);
    document.body.classList.add('hero-ready');
    window.dispatchEvent(new Event('hero-ready'));

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
