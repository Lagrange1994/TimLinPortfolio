import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LangProvider } from '../src/context/LangContext';
import HeroAskStrip from '../src/components/HeroAskStrip';
import ChatPanel from '../src/components/ChatPanel';
import { ASK_TIM_EVENT, askTim } from '../src/utils/askTim';
import { pickReplacement } from '../src/utils/heroAskRotation';
import type { AskTimDetail } from '../src/utils/askTim';

describe('askTim', () => {
  it('dispatches the question on the window', () => {
    const seen: string[] = [];
    const onAsk = (e: Event) => seen.push((e as CustomEvent<AskTimDetail>).detail.q);
    window.addEventListener(ASK_TIM_EVENT, onAsk);
    askTim('Is Tim currently open to job opportunities?');
    window.removeEventListener(ASK_TIM_EVENT, onAsk);
    expect(seen).toEqual(['Is Tim currently open to job opportunities?']);
  });
});

describe('HeroAskStrip', () => {
  beforeEach(() => localStorage.clear());

  it('renders the guidance label and three question pills in Traditional Chinese', () => {
    localStorage.setItem('lang', 'zh');
    render(<LangProvider><HeroAskStrip /></LangProvider>);
    expect(screen.getByText('有問題？問我的 AI 分身')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tim 目前開放工作機會嗎？' })).toHaveTextContent('開放機會？');
    expect(screen.getByRole('button', { name: 'Tim 的設計流程是什麼？' })).toHaveTextContent('設計流程？');
    expect(screen.getByRole('button', { name: '如何聯繫 Tim？' })).toHaveTextContent('如何聯繫？');
  });

  it('renders in English when lang=en', () => {
    localStorage.setItem('lang', 'en');
    render(<LangProvider><HeroAskStrip /></LangProvider>);
    expect(screen.getByText('Curious? Ask my AI bot')).toBeInTheDocument();
    // The short visible label is clipped for width; the accessible name is the
    // full question that actually gets sent.
    expect(screen.getByRole('button', { name: "What is Tim's design process?" })).toHaveTextContent('Process?');
  });

  it('fires the full question, not the short label, when a pill is clicked', () => {
    localStorage.setItem('lang', 'zh');
    const onAsk = vi.fn();
    window.addEventListener(ASK_TIM_EVENT, onAsk);
    render(<LangProvider><HeroAskStrip /></LangProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Tim 目前開放工作機會嗎？' }));
    window.removeEventListener(ASK_TIM_EVENT, onAsk);
    expect(onAsk).toHaveBeenCalledTimes(1);
    expect((onAsk.mock.calls[0][0] as CustomEvent<AskTimDetail>).detail.q).toBe('Tim 目前開放工作機會嗎？');
  });
});

describe('ChatPanel reacts to tim:ask', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('lang', 'en');
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ reply: 'Yes — open to work.' }) })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('opens the panel and sends the question', async () => {
    render(<LangProvider><ChatPanel /></LangProvider>);
    const panel = document.getElementById('chat-panel')!;
    expect(panel.className).not.toContain('open');

    fireEvent(window, new CustomEvent(ASK_TIM_EVENT, { detail: { q: 'Can Tim work remotely?' } }));

    expect(panel.className).toContain('open');
    expect(await screen.findByText('Can Tim work remotely?')).toBeInTheDocument();
    expect(await screen.findByText('Yes — open to work.')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ method: 'POST' }));
  });
});

describe('pickReplacement', () => {
  const pool = ['a', 'b', 'c', 'd'];

  it('never returns something already on screen', () => {
    for (let r = 0; r < 1; r += 0.05) {
      expect(['c', 'd']).toContain(pickReplacement(pool, ['a', 'b'], () => r));
    }
  });

  it('spreads across every free candidate as rand sweeps 0..1', () => {
    const picked = new Set([0.0, 0.34, 0.67, 0.99].map(r => pickReplacement(pool, [], () => r)));
    expect(picked).toEqual(new Set(pool));
  });

  it('returns null when the pool is exhausted', () => {
    expect(pickReplacement(pool, pool)).toBeNull();
  });

  it('clamps a rand of exactly 1 to the last candidate instead of running off the end', () => {
    expect(pickReplacement(pool, [], () => 1)).toBe('d');
  });
});
