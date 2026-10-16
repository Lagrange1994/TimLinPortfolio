// Regression: the hero panel's drop shadow was `filter: drop-shadow()` on
// #bg-panel-shadow — the wrapper around the live WebGL background scene. A
// filter over content that changes every frame is re-run by the compositor
// every frame: a panel-sized blur at device resolution, 60 times a second.
// Measured on an integrated GPU (scenes at their lowest resolution): 27 fps
// with it, 49 without. The shadow is now cast by a static filled copy of
// the panel silhouette (#bg-panel-shadow-shape) behind the opaque panel.
//
// Same family: the dark theme's glow (#bg-frame-glow) animates a blurred
// panel-sized shape; on a GPU the quality governor found too slow it is
// frozen to a still (CSS pulse off, SMIL gradient flow paused).
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import BeamsBackground from '../src/components/BeamsBackground';
import { setSceneQuality } from '../src/utils/splineRunning';

const read = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8').replace(/\r\n/g, '\n');
const css = read('src/styles/portfolio.css');
const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
const tsx = read('src/components/BeamsBackground.tsx');
// Bodies of every rule whose whole selector is exactly `selector`.
const rule = (selector: string) => {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...bare.matchAll(new RegExp(`[{}]\\s*${esc}\\s*\\{([^}]*)\\}`, 'g'))].map(m => m[1]);
};

class FakeIO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
const origIO = globalThis.IntersectionObserver;

describe('hero panel shadow — static shape, no filter over the WebGL canvas', () => {
  it('no ancestor of the bg <spline-viewer>s carries a filter', () => {
    for (const body of [...rule('#bg-panel-shadow'), ...rule(':root[data-theme="light"] #bg-panel-shadow'), ...rule('#bg-spline-scene')]) {
      expect(body).not.toMatch(/(?:^|[\s;])(?:backdrop-)?filter\s*:/);
    }
    expect(rule('#bg-panel-shadow').join('')).toMatch(/z-index:\s*-3/); // still the panel's stacking slot
  });

  it('the shadow shape carries the same shadows the wrapper used to, per theme', () => {
    const base = rule('#bg-panel-shadow-shape').join('');
    expect(base).toMatch(/filter:\s*drop-shadow\(0 12px 32px rgba\(0, 0, 0, 0\.65\)\)/);
    expect(base).toMatch(/z-index:\s*-3/);
    expect(base).toMatch(/overflow:\s*visible/);
    const light = rule(':root[data-theme="light"] #bg-panel-shadow-shape').join('');
    expect(light).toMatch(/drop-shadow\(8px 8px 18px var\(--neu-shadow-dark\)\)\s*drop-shadow\(-8px -8px 18px var\(--neu-shadow-light\)\)/);
    // Hidden below the desktop breakpoint, like the outline and the glow.
    expect(rule('#bg-panel-shadow-shape')[0]).toMatch(/display:\s*none/);
  });

  it('is filled with the panel backdrop tone of each theme (no seam at the edge)', () => {
    expect(rule('.bg-panel-shadow-fill').join('')).toMatch(/fill:\s*var\(--bg-safe\)/);
    expect(rule(':root[data-theme="light"] .bg-panel-shadow-fill').join('')).toMatch(/fill:\s*var\(--frame-glow-base\)/);
  });

  it('gets the same path and viewBox as the outline and the glow', () => {
    expect(tsx).toMatch(/frameShadowRef\.current\?\.setAttribute\('d', d\);/);
    expect(tsx).toMatch(/getElementById\('bg-panel-shadow-shape'\)\?\.setAttribute\('viewBox'/);
  });

  describe('rendered', () => {
    let home: HTMLElement;
    beforeEach(() => {
      (globalThis as any).IntersectionObserver = FakeIO;
      home = document.createElement('section');
      home.id = 'home';
      document.body.appendChild(home);
    });
    afterEach(() => {
      (globalThis as any).IntersectionObserver = origIO;
      setSceneQuality(0);
      sessionStorage.clear();
      document.documentElement.removeAttribute('data-scene-quality');
      home.remove();
    });

    it('sits behind the panel: before #bg-panel-shadow in #home, with no viewer inside it', async () => {
      render(<BeamsBackground />);
      await act(async () => {});
      const shape = document.getElementById('bg-panel-shadow-shape')!;
      const panel = document.getElementById('bg-panel-shadow')!;
      expect(shape.parentElement).toBe(home);
      expect(shape.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(shape.querySelector('spline-viewer')).toBeNull();
      expect(panel.querySelectorAll('spline-viewer')).toHaveLength(2);
    });

    it('lowered scene quality pauses the glow gradient flow; full quality resumes it', async () => {
      render(<BeamsBackground />);
      await act(async () => {});
      const glow = document.getElementById('bg-frame-glow') as any;
      glow.pauseAnimations = vi.fn();
      glow.unpauseAnimations = vi.fn();
      act(() => setSceneQuality(1));
      expect(glow.pauseAnimations).toHaveBeenCalledTimes(1);
      expect(document.documentElement.getAttribute('data-scene-quality')).toBe('1');
      act(() => setSceneQuality(0));
      expect(glow.unpauseAnimations).toHaveBeenCalledTimes(1);
      expect(document.documentElement.getAttribute('data-scene-quality')).toBe('0');
    });
  });

  it('CSS switches the glow pulse off at any lowered quality level', () => {
    expect(css).toMatch(/html\[data-scene-quality\]:not\(\[data-scene-quality="0"\]\) \.bg-frame-glow-fill,\s*html\[data-static-scenes\] \.bg-frame-glow-fill\s*\{\s*animation:\s*none;\s*\}/);
  });
});
