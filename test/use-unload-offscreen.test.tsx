import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  useUnloadOffscreen,
  UNLOADED_CLASS,
  RESTORING_CLASS,
  RESTORE_IN_UP_CLASS,
  RESTORE_IN_DOWN_CLASS,
  UNLOAD_HEIGHT_VAR,
  UNLOAD_CONTENT_HEIGHT_VAR,
} from '../src/utils/useUnloadOffscreen';

type Entry = Partial<IntersectionObserverEntry>;
type IOCallback = (entries: Entry[]) => void;

// The hook creates two observers: a wide-margin "range" one (unload/restore)
// and a plain viewport one (plays the held reveal). Told apart by rootMargin.
let rangeCb: IOCallback | null = null;
let revealCb: IOCallback | null = null;
let disconnected = 0;

class FakeIO {
  constructor(cb: IOCallback, opts?: IntersectionObserverInit) {
    if (opts?.rootMargin) rangeCb = cb;
    else revealCb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() { disconnected += 1; }
}

function Harness() {
  useUnloadOffscreen();
  return <section className="section" data-testid="s" />;
}

function setMedia({ mobile, reduced = false }: { mobile: boolean; reduced?: boolean }) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q.includes('max-width') ? mobile : q.includes('reduced-motion') ? reduced : false,
  })) as unknown as typeof window.matchMedia;
}

const range = (el: Element, isIntersecting: boolean) => act(() => rangeCb!([{ target: el, isIntersecting }]));
const reveal = (el: Element, isIntersecting: boolean) => act(() => revealCb!([{ target: el, isIntersecting }]));
const scrollTo = (y: number) => act(() => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  window.dispatchEvent(new Event('scroll'));
});

describe('useUnloadOffscreen', () => {
  beforeEach(() => {
    rangeCb = null;
    revealCb = null;
    disconnected = 0;
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    vi.stubGlobal('IntersectionObserver', FakeIO);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('does nothing on non-phone viewports', () => {
    setMedia({ mobile: false });
    render(<Harness />);
    expect(rangeCb).toBeNull();
  });

  it('never unloads a section that was not seen yet', () => {
    setMedia({ mobile: true });
    const { getByTestId } = render(<Harness />);
    const el = getByTestId('s');
    range(el, false);
    expect(el.classList.contains(UNLOADED_CLASS)).toBe(false);
  });

  it('unloads a seen section that leaves range, pinning its height', () => {
    setMedia({ mobile: true });
    const { getByTestId } = render(<Harness />);
    const el = getByTestId('s');
    el.style.paddingTop = '10px';
    el.style.paddingBottom = '11px';
    el.getBoundingClientRect = () => ({ height: 321 } as DOMRect);
    range(el, true);
    range(el, false);
    expect(el.classList.contains(UNLOADED_CLASS)).toBe(true);
    expect(el.style.getPropertyValue(UNLOAD_HEIGHT_VAR)).toBe('321px');
    // content box = border box minus padding (10 + 11)
    expect(el.style.getPropertyValue(UNLOAD_CONTENT_HEIGHT_VAR)).toBe('300px');
  });

  it('a first-time intersection does not trigger the restore animation', () => {
    setMedia({ mobile: true });
    const { getByTestId } = render(<Harness />);
    const el = getByTestId('s');
    range(el, true);
    expect(el.classList.contains(RESTORING_CLASS)).toBe(false);
  });

  it('restores a section held invisible until it reaches the viewport', () => {
    setMedia({ mobile: true });
    const { getByTestId } = render(<Harness />);
    const el = getByTestId('s');
    range(el, true);
    range(el, false);
    range(el, true);
    expect(el.classList.contains(UNLOADED_CLASS)).toBe(false);
    expect(el.style.getPropertyValue(UNLOAD_HEIGHT_VAR)).toBe('');
    expect(el.style.getPropertyValue(UNLOAD_CONTENT_HEIGHT_VAR)).toBe('');
    // Not on screen yet: held hidden, no animation started.
    expect(el.classList.contains(RESTORING_CLASS)).toBe(true);
    expect(el.classList.contains(RESTORE_IN_UP_CLASS)).toBe(false);
  });

  it('animates in from above when the user was scrolling up', () => {
    setMedia({ mobile: true });
    const { getByTestId } = render(<Harness />);
    const el = getByTestId('s');
    scrollTo(3000);
    range(el, true);
    range(el, false);
    scrollTo(2000); // moving up
    range(el, true);
    reveal(el, true);
    expect(el.classList.contains(RESTORING_CLASS)).toBe(false);
    expect(el.classList.contains(RESTORE_IN_UP_CLASS)).toBe(true);
    expect(el.classList.contains(RESTORE_IN_DOWN_CLASS)).toBe(false);
  });

  it('animates in from below when the user was scrolling down', () => {
    setMedia({ mobile: true });
    const { getByTestId } = render(<Harness />);
    const el = getByTestId('s');
    range(el, true);
    range(el, false);
    scrollTo(2000); // moving down
    range(el, true);
    reveal(el, true);
    expect(el.classList.contains(RESTORE_IN_DOWN_CLASS)).toBe(true);
    expect(el.classList.contains(RESTORE_IN_UP_CLASS)).toBe(false);
  });

  it('keeps holding while the restored section is still off screen', () => {
    setMedia({ mobile: true });
    const { getByTestId } = render(<Harness />);
    const el = getByTestId('s');
    range(el, true);
    range(el, false);
    range(el, true);
    reveal(el, false);
    expect(el.classList.contains(RESTORING_CLASS)).toBe(true);
  });

  it('drops the hold if the section is unloaded again before it played', () => {
    setMedia({ mobile: true });
    const { getByTestId } = render(<Harness />);
    const el = getByTestId('s');
    range(el, true);
    range(el, false);
    range(el, true);
    range(el, false);
    expect(el.classList.contains(RESTORING_CLASS)).toBe(false);
    expect(el.classList.contains(UNLOADED_CLASS)).toBe(true);
  });

  it('clears the animation class when it finishes', () => {
    setMedia({ mobile: true });
    const { getByTestId } = render(<Harness />);
    const el = getByTestId('s');
    range(el, true);
    range(el, false);
    range(el, true);
    reveal(el, true);
    act(() => { el.dispatchEvent(new Event('animationend')); });
    expect(el.classList.contains(RESTORE_IN_DOWN_CLASS)).toBe(false);
  });

  it('skips the animation entirely under prefers-reduced-motion', () => {
    setMedia({ mobile: true, reduced: true });
    const { getByTestId } = render(<Harness />);
    const el = getByTestId('s');
    range(el, true);
    range(el, false);
    range(el, true);
    expect(el.classList.contains(UNLOADED_CLASS)).toBe(false);
    expect(el.classList.contains(RESTORING_CLASS)).toBe(false);
  });

  it('cleans up on unmount', () => {
    setMedia({ mobile: true });
    const { getByTestId, unmount } = render(<Harness />);
    const el = getByTestId('s');
    range(el, true);
    range(el, false);
    unmount();
    expect(disconnected).toBe(2);
    expect(el.classList.contains(UNLOADED_CLASS)).toBe(false);
  });
});
