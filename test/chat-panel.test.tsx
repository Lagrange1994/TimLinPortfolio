import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../src/context/LangContext';
import ChatPanel from '../src/components/ChatPanel';

// Regression: ISSUE-001 — chat widget ignored the site-wide language toggle
// and stayed hardcoded in Traditional Chinese even when the user switched
// the rest of the site to English.
// Found by /qa on 2026-06-20
// Report: .gstack/qa-reports/qa-report-localhost-5173-2026-06-20.md
describe('ChatPanel i18n', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the greeting, placeholder, and quick questions in English when lang=en', () => {
    localStorage.setItem('lang', 'en');
    render(<LangProvider><ChatPanel /></LangProvider>);
    expect(screen.getByText(/Ask me anything about his design background/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask anything about Tim…')).toBeInTheDocument();
    expect(screen.getByText('Open to work?')).toBeInTheDocument();
  });

  it('renders the greeting, placeholder, and quick questions in Traditional Chinese when lang=zh', () => {
    localStorage.setItem('lang', 'zh');
    render(<LangProvider><ChatPanel /></LangProvider>);
    expect(screen.getByText(/想了解 Tim 的設計背景/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('問任何關於 Tim 的問題…')).toBeInTheDocument();
    expect(screen.getByText('開放機會？')).toBeInTheDocument();
  });
});
