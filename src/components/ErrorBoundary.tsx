import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Catches a rejected React.lazy import() — a stale tab requesting a chunk a
// newer deploy has already deleted (ChunkLoadError), or a flaky network —
// so one section's failed chunk doesn't unmount the whole app to a blank
// page. Renders nothing on error, matching the null Suspense fallback these
// boundaries wrap in App.tsx: a missing section degrades gracefully instead
// of crashing everything below the hero.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Section failed to load:', error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
