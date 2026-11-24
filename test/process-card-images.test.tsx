import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useRef } from 'react';
import { readFileSync } from 'node:fs';
import { toWebpSrc } from '../src/projects/shared/ImageWithSkeleton';
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

  it('one white illustration per theme, no colour layers', () => {
    expect(processCardLayers('AI Brief', new Set(['dark'])).map(x => x.image)).toEqual(['url("./img/process/AI Brief_w.webp")', undefined]);
    expect(processCardLayers('Align', new Set(['light'])).map(x => x.image)).toEqual([undefined, 'url("./img/process/Align_l_w.webp")']);
    expect(processCardLayers('Align', new Set(['dark', 'light'])).map(x => x.cls)).toEqual(['process-card-bg-img--white', 'process-card-bg-img--light-white']);
  });

  it('hover keeps the white illustration: no colour crossfade left in the stylesheet', () => {
    const css = readFileSync('src/styles/portfolio.css', 'utf8');
    expect(css).not.toContain('process-card-bg-img--color');
    expect(css).not.toMatch(/process-card-bg-img--light[^-]/);
    expect(css).not.toMatch(/:hover .process-card-bg-img/);
  });
});

describe('resource loading config', () => {
  it('toWebpSrc maps raster sources to the encoded webp that is displayed', () => {
    expect(toWebpSrc('./img/project_11/display.jpg')).toBe('./img/project_11/display.webp');
    expect(toWebpSrc('./img/a b.PNG')).toBe('./img/a%20b.webp');
    expect(toWebpSrc('./img/a.webp')).toBe('./img/a.webp');
  });

  it.each(['08', '11', '12'])('project_%s preloads the webp, not a second jpg', n => {
    const src = readFileSync(`src/projects/project_${n}.jsx`, 'utf8');
    expect(src).toContain('preload(toWebpSrc(MAIN_IMAGE))');
    expect(src).not.toContain('preload(MAIN_IMAGE)');
  });

  it('caches only hashed /assets as immutable', () => {
    const { headers } = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      headers: Array<{ source: string; headers: Array<{ value: string }> }>;
    };
    const immutable = headers.filter(h => h.headers.some(x => x.value.includes('immutable')));
    expect(immutable.map(h => h.source)).toEqual(['/assets/(.*)']);
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
