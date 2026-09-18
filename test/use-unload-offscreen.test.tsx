import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useUnloadOffscreen, UNLOADED_CLASS, UNLOAD_HEIGHT_VAR, UNLOAD_CONTENT_HEIGHT_VAR } from '../src/utils/useUnloadOffscreen';

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let ioCallback: IOCallback | null = null;
let disconnected = false;

class FakeIO {
  constructor(cb: IOCallback) { ioCallback = cb; disconnected = false; }
  observe() {}
  disconnect() { disconnected = true; }
}

function Harness() {
  useUnloadOffscreen();
  return <section className="section" data-testid="s" />;
}

function setMobile(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
}

const fire = (el: Element, isIntersecting: boolean) =>
  ioCallback!([{ target: el, isIntersecting }]);

describe('useUnloadOffscreen', () => {
  beforeEach(() => {
    ioCallback = null;
    vi.stubGlobal('IntersectionObserver', FakeIO);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('does nothing on non-phone viewports', () => {
    setMobile(false);
    render(<Harness />);
    expect(ioCallback).toBeNull();
  });

  it('never unloads a section that was not seen yet', () => {
    setMobile(true);
    const { getByTestId } = render(<Harness />);
    const el = getByTestId('s');
    fire(el, false);
    expect(el.classList.contains(UNLOADED_CLASS)).toBe(false);
  });

  it('unloads a seen section that leaves range, pinning its height', () => {
    setMobile(true);
    const { getByTestId } = render(<Harness />);
    const el = getByTestId('s');
    el.style.paddingTop = '10px';
    el.style.paddingBottom = '11px';
    el.getBoundingClientRect = () => ({ height: 321 } as DOMRect);
    fire(el, true);
    fire(el, false);
    expect(el.classList.contains(UNLOADED_CLASS)).toBe(true);
    expect(el.style.getPropertyValue(UNLOAD_HEIGHT_VAR)).toBe('321px');
    // content box = border box minus padding (10 + 11)
    expect(el.style.getPropertyValue(UNLOAD_CONTENT_HEIGHT_VAR)).toBe('300px');
  });

  it('restores the section when it comes back into range', () => {
    setMobile(true);
    const { getByTestId } = render(<Harness />);
    const el = getByTestId('s');
    fire(el, true);
    fire(el, false);
    fire(el, true);
    expect(el.classList.contains(UNLOADED_CLASS)).toBe(false);
    expect(el.style.getPropertyValue(UNLOAD_HEIGHT_VAR)).toBe('');
    expect(el.style.getPropertyValue(UNLOAD_CONTENT_HEIGHT_VAR)).toBe('');
  });

  it('cleans up on unmount', () => {
    setMobile(true);
    const { getByTestId, unmount } = render(<Harness />);
    const el = getByTestId('s');
    fire(el, true);
    fire(el, false);
    unmount();
    expect(disconnected).toBe(true);
    expect(el.classList.contains(UNLOADED_CLASS)).toBe(false);
  });
});
