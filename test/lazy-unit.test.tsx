import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';

const state = vi.hoisted(() => ({
  handle: null as null | {
    el: HTMLElement; isLoaded: () => boolean; load: () => void; unload: () => void; keep: () => boolean;
  },
  unregister: vi.fn(),
  riseSetups: [] as HTMLElement[][],
  riseCleanups: 0,
}));

vi.mock('../src/utils/lazyUnit', async (orig) => {
  const actual = await orig<typeof import('../src/utils/lazyUnit')>();
  return {
    ...actual,
    registerLazyUnit: (h: NonNullable<typeof state.handle>) => { state.handle = h; return state.unregister; },
  };
});
vi.mock('../src/utils/useRiseReveal', () => ({
  setupRiseReveal: (sections: HTMLElement[]) => {
    state.riseSetups.push(sections);
    return () => { state.riseCleanups++; };
  },
}));

import LazyUnit from '../src/components/LazyUnit';
import { LAZY_UNIT_EVENT, HOLD_HEIGHT_MS } from '../src/utils/lazyUnit';

function Child() {
  return (
    <>
      <section id="a" className="section" data-testid="a">A</section>
      <section id="b" className="section" data-testid="b">B</section>
      <section className="section pc">no id</section>
    </>
  );
}

describe('LazyUnit', () => {
  beforeEach(() => {
    state.handle = null;
    state.unregister.mockClear();
    state.riseSetups = [];
    state.riseCleanups = 0;
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  function mount() {
    const view = render(<LazyUnit name="x"><Child /></LazyUnit>);
    const wrapper = view.container.querySelector<HTMLElement>('[data-lazy-unit="x"]')!;
    return { ...view, wrapper };
  }

  // Layout sizes only exist in a real browser — fake them for the snapshot.
  function fakeLayout(wrapper: HTMLElement) {
    wrapper.getBoundingClientRect = () => ({ top: 100, height: 640, bottom: 740 } as DOMRect);
    wrapper.querySelectorAll<HTMLElement>('section').forEach((s, i) => {
      s.getBoundingClientRect = () => ({ top: 100 + i * 300, height: 300, bottom: 400 + i * 300 } as DOMRect);
    });
  }

  it('starts mounted, registers itself with the controller, and runs the entrance setup for its sections', () => {
    const { wrapper, getByTestId } = mount();
    expect(wrapper.dataset.lazyState).toBe('loaded');
    expect(getByTestId('a')).toBeTruthy();
    expect(state.handle?.el).toBe(wrapper);
    expect(state.riseSetups).toHaveLength(1);
    expect(state.riseSetups[0]).toHaveLength(3);
  });

  it('unloads to an empty box of the same height with anchors for the section ids, and tears down the entrance setup', () => {
    const { wrapper, queryByTestId } = mount();
    fakeLayout(wrapper);
    act(() => state.handle!.unload());

    expect(wrapper.dataset.lazyState).toBe('unloaded');
    expect(queryByTestId('a')).toBeNull();
    expect(wrapper.style.height).toBe('640px');
    expect(wrapper.style.position).toBe('relative');
    const anchors = wrapper.querySelectorAll<HTMLElement>('span[id]');
    // Only sections with an id get an anchor, at their old offsets.
    expect([...anchors].map(a => a.id)).toEqual(['a', 'b']);
    expect(anchors[0].style.top).toBe('0px');
    expect(anchors[1].style.top).toBe('300px');
    expect(anchors[0].style.position).toBe('absolute');
    expect(state.riseCleanups).toBe(1);
    expect(state.handle!.isLoaded()).toBe(false);
  });

  it('reloads with the children back, holds the old height briefly, then lets it size itself', () => {
    const { wrapper, getByTestId } = mount();
    fakeLayout(wrapper);
    act(() => state.handle!.unload());
    act(() => state.handle!.load());

    expect(wrapper.dataset.lazyState).toBe('loaded');
    expect(getByTestId('a')).toBeTruthy();
    expect(wrapper.querySelectorAll('span[id]')).toHaveLength(0);
    expect(wrapper.style.minHeight).toBe('640px');
    expect(state.riseSetups).toHaveLength(2); // entrance replays on every mount
    expect(state.handle!.isLoaded()).toBe(true);

    act(() => { vi.advanceTimersByTime(HOLD_HEIGHT_MS + 10); });
    expect(wrapper.style.minHeight).toBe('');
  });

  it('a resize drops the held height of a mounted unit', () => {
    const { wrapper } = mount();
    fakeLayout(wrapper);
    act(() => state.handle!.unload());
    act(() => state.handle!.load());
    expect(wrapper.style.minHeight).toBe('640px');
    act(() => { window.dispatchEvent(new Event('resize')); });
    expect(wrapper.style.minHeight).toBe('');
  });

  it('reports user state via data-lazy-keep so the controller leaves it mounted', () => {
    const { wrapper } = mount();
    expect(state.handle!.keep()).toBe(false);
    const el = document.createElement('div');
    el.setAttribute('data-lazy-keep', '');
    wrapper.appendChild(el);
    expect(state.handle!.keep()).toBe(true);
  });

  it('announces every mount/unmount so cached section elements can be re-queried', () => {
    const seen = vi.fn();
    window.addEventListener(LAZY_UNIT_EVENT, seen);
    const { wrapper } = mount();
    const afterMount = seen.mock.calls.length;
    expect(afterMount).toBeGreaterThan(0);
    fakeLayout(wrapper);
    act(() => state.handle!.unload());
    act(() => state.handle!.load());
    expect(seen.mock.calls.length).toBe(afterMount + 2);
    window.removeEventListener(LAZY_UNIT_EVENT, seen);
  });

  it('unregisters from the controller on unmount', () => {
    const { unmount } = mount();
    unmount();
    expect(state.unregister).toHaveBeenCalled();
    expect(state.riseCleanups).toBe(1);
  });
});
