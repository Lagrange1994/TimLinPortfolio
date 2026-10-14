import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useRef } from 'react';
import {
  processCardLayers,
  useProcessCardThemes,
  PROCESS_IMG_ROOT_MARGIN,
  __resetProcessCardImagesForTest,
  type ProcessTheme,
} from '../src/utils/processCardImages';

// Fake IntersectionObserver: records instances so a test can decide when
// the section "comes near" the viewport.
type Cb = (entries: Array<{ isIntersecting: boolean }>) => void;
const observers: Array<{ cb: Cb; opts?: IntersectionObserverInit; disconnected: boolean }> = [];
class FakeIO {
  rec: (typeof observers)[number];
  constructor(cb: Cb, opts?: IntersectionObserverInit) {
    this.rec = { cb, opts, disconnected: false };
    observers.push(this.rec);
  }
  observe() {}
  disconnect() { this.rec.disconnected = true; }
}

// The hook's result, rendered so tests read it back from the DOM.
function Probe() {
  const ref = useRef<HTMLElement>(null);
  const themes = useProcessCardThemes(ref);
  return <section ref={ref} data-testid="probe" data-themes={[...themes].join(',')} />;
}
const seenList = () => (document.querySelector('[data-testid=probe]')!.getAttribute('data-themes') || '').split(',').filter(Boolean);
const seen = { get size() { return seenList().length; }, [Symbol.iterator]: () => seenList()[Symbol.iterator]() };
const near = () => act(() => { observers.at(-1)!.cb([{ isIntersecting: true }]); });
const setTheme = async (t: ProcessTheme) => {
  await act(async () => {
    if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
  });
};

describe('processCardLayers', () => {
  it('gives no layer an image before any theme is loaded', () => {
    expect(processCardLayers('Align', new Set()).every(l => l.image === undefined)).toBe(true);
  });

  it('only fills the dark pair (_w + color) for the dark theme', () => {
    const l = processCardLayers('AI Brief', new Set(['dark']));
    expect(l.map(x => x.image)).toEqual([
      'url("./img/process/AI Brief_w.webp")',
      'url("./img/process/AI Brief.webp")',
      undefined,
      undefined,
    ]);
  });

  it('only fills the light pair (_l_w + _l) for the light theme', () => {
    const l = processCardLayers('Align', new Set(['light']));
    expect(l.map(x => x.image)).toEqual([
      undefined,
      undefined,
      'url("./img/process/Align_l_w.webp")',
      'url("./img/process/Align_l.webp")',
    ]);
  });
});

describe('useProcessCardThemes', () => {
  const RealIO = globalThis.IntersectionObserver;
  beforeEach(() => {
    __resetProcessCardImagesForTest();
    observers.length = 0;
    document.documentElement.removeAttribute('data-theme');
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeIO;
  });
  afterEach(() => {
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = RealIO;
    document.documentElement.removeAttribute('data-theme');
  });

  it('loads nothing until the section is within one viewport', () => {
    render(<Probe />);
    expect(seen.size).toBe(0);
    expect(observers[0].opts?.rootMargin).toBe(PROCESS_IMG_ROOT_MARGIN);
    act(() => { observers[0].cb([{ isIntersecting: false }]); });
    expect(seen.size).toBe(0);
    near();
    expect([...seen]).toEqual(['dark']);
    expect(observers[0].disconnected).toBe(true);
  });

  it('starts with the light theme when the page is light', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    render(<Probe />);
    near();
    expect([...seen]).toEqual(['light']);
  });

  it('adds the other theme on toggle and keeps the first one', async () => {
    render(<Probe />);
    near();
    await setTheme('light');
    expect([...seen].sort()).toEqual(['dark', 'light']);
    await setTheme('dark');
    expect(seen.size).toBe(2);
  });

  it('does not add a theme toggled to before the section was near', async () => {
    render(<Probe />);
    await setTheme('light');
    await setTheme('dark');
    near();
    expect([...seen]).toEqual(['dark']);
  });

  it('a remount after arming shows images immediately, without a new observer', () => {
    const first = render(<Probe />);
    near();
    first.unmount();
    const count = observers.length;
    render(<Probe />);
    expect([...seen]).toEqual(['dark']);
    expect(observers.length).toBe(count);
  });

  it('loads right away where IntersectionObserver is unavailable', () => {
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = undefined;
    render(<Probe />);
    expect([...seen]).toEqual(['dark']);
  });
});
