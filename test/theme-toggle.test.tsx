import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LangProvider } from '../src/context/LangContext';
import Navbar from '../src/components/Navbar';

// useTheme (src/utils/useTheme.ts) backs both the desktop sun/moon switch
// (#theme-toggle-btn, .theme-switch) and a separately-styled mobile-panel
// switch (.sm-theme-switch, own class family sized/colored like .sm-lang-btn)
// sitting right above the Language pills — dark is the default (no stored
// preference), switching
// persists to localStorage and flips <html data-theme>, which is what
// portfolio.css's :root[data-theme="light"] block keys off. Both switches
// must stay in sync since they're driven by the same toggleTheme().
describe('theme toggle', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      disconnect() {}
    });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('defaults to dark mode with no stored preference', () => {
    render(<LangProvider><Navbar /></LangProvider>);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getAllByLabelText('Switch to light mode')).toHaveLength(2);
  });

  it('picks up a previously stored light preference on mount', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    render(<LangProvider><Navbar /></LangProvider>);
    expect(screen.getAllByLabelText('Switch to dark mode')).toHaveLength(2);
  });

  it('switches to light mode and persists the choice on click', () => {
    render(<LangProvider><Navbar /></LangProvider>);

    fireEvent.click(screen.getAllByLabelText('Switch to light mode')[0]);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(screen.getAllByLabelText('Switch to dark mode')).toHaveLength(2);
  });

  it('toggles back to dark mode on a second click', () => {
    render(<LangProvider><Navbar /></LangProvider>);

    fireEvent.click(screen.getAllByLabelText('Switch to light mode')[0]);
    fireEvent.click(screen.getAllByLabelText('Switch to dark mode')[0]);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('keeps the mobile panel switch in sync with the desktop one', () => {
    render(<LangProvider><Navbar /></LangProvider>);

    expect(screen.getAllByLabelText('Switch to light mode')).toHaveLength(2);

    fireEvent.click(screen.getAllByLabelText('Switch to light mode')[0]);

    expect(screen.getAllByLabelText('Switch to dark mode')).toHaveLength(2);
  });
});
