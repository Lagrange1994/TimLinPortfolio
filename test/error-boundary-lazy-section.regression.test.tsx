import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { lazy, Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ErrorBoundary from '../src/components/ErrorBoundary';

// Regression: App.tsx's four React.lazy sections (About/Skills/Portfolio/
// Contact) had no error boundary. A rejected import() — a stale tab after a
// redeploy requesting a chunk hash the new dist/ no longer has
// ("ChunkLoadError"), or a flaky network — throws during render; with
// nothing to catch it, React unmounts the whole tree to a blank page
// instead of just the failed section. Flagged independently by this
// review's testing and adversarial passes.

function Thrower(): never {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders nothing instead of crashing when a child throws', () => {
    const { container } = render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders children normally when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="ok">fine</div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId('ok')).toBeTruthy();
  });

  it('contains a rejected React.lazy import instead of crashing a sibling', async () => {
    const LazyBroken = lazy(() =>
      Promise.reject(new Error('Failed to fetch dynamically imported module'))
    );

    render(
      <div>
        <div data-testid="sibling">still here</div>
        <ErrorBoundary>
          <Suspense fallback={null}>
            <LazyBroken />
          </Suspense>
        </ErrorBoundary>
      </div>
    );

    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());
    expect(screen.getByTestId('sibling')).toBeTruthy();
  });
});
