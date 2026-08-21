import '@testing-library/jest-dom/vitest';

class ResizeObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

globalThis.ResizeObserver = ResizeObserverMock;
