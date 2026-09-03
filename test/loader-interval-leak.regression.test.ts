import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import { LangProvider } from '../src/context/LangContext';
import Loader from '../src/components/Loader';

// Loader stays mounted forever (only its "hidden" class toggles once assets
// are ready — see hideLoader in Loader.tsx), so its step-cycling
// setInterval must be cleared explicitly when loading finishes. Without
// that, it re-renders a permanently hidden component every second for the
// rest of the page's lifetime, which showed up as ~1s main-thread long
// tasks recurring roughly once per second (measured via
// PerformanceObserver({entryTypes:['longtask']}) — 4 tasks of ~1000-1300ms
// each in a 3s idle window before the fix, 0 after).
describe('Loader step-interval cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears the step-cycling interval once the loader is dismissed, even though it never unmounts', () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval');
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

    render(createElement(LangProvider, null, createElement(Loader)));

    // No .spline-bg-layer.is-active / .hero-fig-desktop in this test DOM,
    // so waitForAssets() finds nothing pending and calls hideLoader()
    // synchronously inside the mount effect.
    expect(document.getElementById('page-loader')?.classList.contains('hidden')).toBe(true);

    const stepTimerId = setIntervalSpy.mock.results[0]?.value;
    expect(stepTimerId).toBeDefined();
    expect(clearIntervalSpy).toHaveBeenCalledWith(stepTimerId);
  });
});
