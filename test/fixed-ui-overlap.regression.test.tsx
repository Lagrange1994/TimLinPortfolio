import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render, fireEvent, cleanup } from '@testing-library/react';
import BackToTop from '../src/components/BackToTop';
import { fixedUiFootprint, FIXED_UI_IDS } from '../src/utils/fixedUiFootprint';

// Regression: on a phone the chat button sometimes sat on top of the
// portfolio's "View All Projects" button. The wall keeps that button clear of
// the fixed bottom-right buttons by measuring them — but it only measured
// #back-to-top, which was rendered by ContactSection, a LazyUnit that is
// unmounted while the viewer is more than one section away. Scrolling down
// from the top, the portfolio unit mounts before the contact unit: no
// #back-to-top to measure, no push, and nothing re-measured afterwards
// (reproduced in a 390px headless phone viewport: View All's right edge at
// 374px, the chat button spanning 330–374px).
const ROOT = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function addFixedButton(id: string, left: number, width: number) {
  const el = document.createElement('button');
  el.id = id;
  el.getBoundingClientRect = () => ({ left, right: left + width, width, top: 0, bottom: width, height: width, x: left, y: 0, toJSON() {} }) as DOMRect;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('fixedUiFootprint', () => {
  it('covers both fixed buttons', () => {
    expect(FIXED_UI_IDS).toEqual(['back-to-top', 'chat-fab']);
  });

  it('is 0 when neither button is mounted', () => {
    expect(fixedUiFootprint()).toBe(0);
  });

  it('measures the chat button alone — the case that used to return nothing', () => {
    vi.stubGlobal('innerWidth', 390);
    addFixedButton('chat-fab', 330, 44);
    // 44px button + its 16px gap from the right edge
    expect(fixedUiFootprint()).toBe(60);
  });

  it('measures the back-to-top button alone', () => {
    vi.stubGlobal('innerWidth', 390);
    addFixedButton('back-to-top', 330, 44);
    expect(fixedUiFootprint()).toBe(60);
  });

  it('takes the wider strip when both are mounted', () => {
    vi.stubGlobal('innerWidth', 1000);
    addFixedButton('back-to-top', 920, 48);
    addFixedButton('chat-fab', 900, 68);
    expect(fixedUiFootprint()).toBe(100);
  });

  it('ignores a button with no box (display: none)', () => {
    vi.stubGlobal('innerWidth', 390);
    addFixedButton('chat-fab', 0, 0);
    expect(fixedUiFootprint()).toBe(0);
  });
});

describe('BackToTop', () => {
  it('renders the fixed button with the classes its CSS targets', () => {
    render(<BackToTop />);
    const btn = document.getElementById('back-to-top')!;
    expect(btn.className).toBe('btn-glass btn-grad');
  });

  it('shows past 400px of scroll and hides again above it', () => {
    vi.stubGlobal('scrollY', 0);
    render(<BackToTop />);
    const btn = document.getElementById('back-to-top')!;
    expect(btn.classList.contains('visible')).toBe(false);
    vi.stubGlobal('scrollY', 401);
    fireEvent.scroll(window);
    expect(btn.classList.contains('visible')).toBe(true);
    vi.stubGlobal('scrollY', 400);
    fireEvent.scroll(window);
    expect(btn.classList.contains('visible')).toBe(false);
  });

  it('is already visible when mounted on a scrolled page', () => {
    vi.stubGlobal('scrollY', 900);
    render(<BackToTop />);
    expect(document.getElementById('back-to-top')!.classList.contains('visible')).toBe(true);
  });

  it('scrolls smoothly to the top on click', () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    render(<BackToTop />);
    fireEvent.click(document.getElementById('back-to-top')!);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('stops listening once unmounted', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<BackToTop />);
    unmount();
    expect(remove.mock.calls.some(c => c[0] === 'scroll')).toBe(true);
    remove.mockRestore();
  });
});

describe('where the fixed buttons live', () => {
  it('App mounts BackToTop outside every LazyUnit, like ChatPanel', () => {
    const app = read('src/App.tsx').replace(/\r\n/g, '\n');
    expect(app).toMatch(/^ {6}<BackToTop \/>\n {6}<ChatPanel \/>$/m);
    expect(app).not.toMatch(/<LazyUnit[^>]*>[^\n]*<BackToTop/);
  });

  it('ContactSection (a lazily unmounted unit) no longer owns it', () => {
    expect(read('src/components/ContactSection.tsx')).not.toMatch(/back-to-top/);
  });

  it('the portfolio wall measures the shared footprint, not #back-to-top alone', () => {
    const src = read('src/components/PortfolioSection.tsx');
    expect(src).toMatch(/import \{ fixedUiFootprint \} from '\.\.\/utils\/fixedUiFootprint';/);
    expect(src).toMatch(/btnExtraPush = footprint \+ LEG_GAP_PADDING - wallInsetPx;/);
    expect(src).not.toMatch(/getElementById\('back-to-top'\)/);
  });
});
