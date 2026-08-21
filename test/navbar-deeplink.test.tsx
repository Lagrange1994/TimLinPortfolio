import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { LangProvider } from '../src/context/LangContext';
import Navbar from '../src/components/Navbar';

// Regression: ISSUE-002 — "Back to Portfolio" on project sub-pages navigated
// to location.href = '/#portfolio', but the homepage never scrolled to the
// #portfolio section because React mounts it after the browser's one-shot
// native hash-scroll already fired (and found nothing there).
//
// Follow-up fix: PortfolioSection.tsx already owns a richer restore (browsing
// mode — carousel vs. expanded bento grid — plus exact scroll position and
// active filter, via sessionStorage keys written on project-card click).
// Navbar's #portfolio handling must defer to it entirely instead of also
// scrolling, or the two race. The defer check uses 'portfolioExpanded' (only
// ever read, never removed) rather than 'portfolioScrollY' (one-shot
// removeItem()'d by PortfolioSection's restore) — React StrictMode
// double-invokes effects in dev, and checking the consumed key would read
// back null on the second pass even mid-restore, wrongly arming the fallback.
//
// Found by /qa-only on 2026-06-20, fixed via /qa on 2026-06-20.
describe('Navbar hash-on-load deep link', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      disconnect() {}
    });
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    document.body.innerHTML = '<section id="portfolio"></section>';
    window.location.hash = '';
    document.body.classList.remove('hero-ready');
    sessionStorage.clear();
  });

  it('scrolls to the hash target immediately if the page is already hero-ready', () => {
    window.location.hash = '#portfolio';
    document.body.classList.add('hero-ready');

    render(<LangProvider><Navbar /></LangProvider>);

    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('scrolls to the hash target once the hero-ready event fires', () => {
    window.location.hash = '#portfolio';

    render(<LangProvider><Navbar /></LangProvider>);
    expect(window.scrollTo).not.toHaveBeenCalled();

    document.body.classList.add('hero-ready');
    window.dispatchEvent(new Event('hero-ready'));

    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('defers to PortfolioSection and never scrolls when portfolioExpanded is saved (carousel mode)', () => {
    sessionStorage.setItem('portfolioExpanded', 'false');
    sessionStorage.setItem('portfolioScrollY', '3000');
    window.location.hash = '#portfolio';
    document.body.classList.add('hero-ready');

    render(<LangProvider><Navbar /></LangProvider>);
    window.dispatchEvent(new Event('hero-ready'));

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('defers to PortfolioSection when portfolioExpanded is saved even if portfolioScrollY was already consumed', () => {
    // Simulates the StrictMode double-invoke race: PortfolioSection's restore
    // effect removeItem()s portfolioScrollY as a one-shot consume, so by a
    // second effect pass it reads back null — portfolioExpanded must still
    // gate the defer correctly since it is never removed.
    sessionStorage.setItem('portfolioExpanded', 'true');
    window.location.hash = '#portfolio';
    document.body.classList.add('hero-ready');

    render(<LangProvider><Navbar /></LangProvider>);
    window.dispatchEvent(new Event('hero-ready'));

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('falls back to scrolling the #portfolio section into view when there is nothing to restore', () => {
    window.location.hash = '#portfolio';
    document.body.classList.add('hero-ready');

    render(<LangProvider><Navbar /></LangProvider>);

    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('does nothing when there is no hash', () => {
    render(<LangProvider><Navbar /></LangProvider>);
    document.body.classList.add('hero-ready');
    window.dispatchEvent(new Event('hero-ready'));

    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
