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
// page. A rejected lazy() promise is cached by React, so remounting cannot
// retry it reliably; offer a page reload rather than silently removing the
// failed section.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Section failed to load:', error);
  }

  reloadPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="lazy-section-error" role="alert">
          <p>Unable to load this section.</p>
          <button type="button" onClick={this.reloadPage}>Reload page</button>
        </div>
      );
    }
    return this.props.children;
  }
}
