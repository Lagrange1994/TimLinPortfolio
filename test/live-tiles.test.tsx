import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { useRef } from 'react';
import WorkCube, { cubeFaces, type CubeWork } from '../src/components/WorkCube';
import { useLiveTiles, nextSteps, FLIP_MS } from '../src/utils/useLiveTiles';

const works: CubeWork[] = [
  { id: 'a', link: 'a.html', img: 'a.webp', title: 'A', kind: 'App' },
  { id: 'b', link: 'b.html', img: 'b.webp', title: 'B', kind: 'App' },
];

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('live tile cube', () => {
  it('the front side shows work `step`, the side below it the next', () => {
    expect(cubeFaces(2, 0).map(f => [f.ahead, f.index])).toEqual([[0, 0], [1, 1], [2, 0], [3, 1]]);
    // one quarter-turn: side 1 is in front with work 1, side 2 holds work 0 (wrapped)
    const one = cubeFaces(2, 1);
    expect(one.find(f => f.ahead === 0)).toMatchObject({ k: 1, index: 1 });
    expect(one.find(f => f.ahead === 1)).toMatchObject({ k: 2, index: 0 });
    // past a full turn the sides repeat
    expect(cubeFaces(4, 5).find(f => f.ahead === 0)).toMatchObject({ k: 1, index: 1 });
  });

  it('renders four linked sides, only the front one reachable', () => {
    const { container } = render(<WorkCube works={works} step={1} />);
    const faces = container.querySelectorAll('.work-face');
    expect(faces).toHaveLength(4);
    const front = container.querySelector('.work-face.is-front')!;
    expect(front.getAttribute('href')).toBe('b.html');
    expect(front.getAttribute('tabindex')).toBeNull();
    expect(front.textContent).toContain('App');
    // no title on the tile: the work is named for AT only
    expect(container.querySelector('.work-face-title')).toBeNull();
    expect(front.getAttribute('aria-label')).toBe('B');
    expect(container.querySelectorAll('.work-face[aria-hidden="true"][tabindex="-1"]')).toHaveLength(3);
    expect((container.querySelector('.work-cube') as HTMLElement).style.getPropertyValue('--n')).toBe('1');
  });
});

function Probe({ onSteps }: { onSteps: (s: number[]) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  onSteps(useLiveTiles(3, ref));
  return <div ref={ref} />;
}

describe('How I Design turns left / right', () => {
  it('its illustrations are the sides of a cube turning on the Y axis, in the step loop', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const css = readFileSync(resolve(__dirname, '../src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
    expect(css).toMatch(/\.bento-card\.overview-design \{[^}]*container-type: inline-size;[^}]*perspective: 1400px;/);
    expect(css).toMatch(/\.overview-design-img \{[^}]*backface-visibility: hidden;[^}]*transform-origin: 50% 50% -40cqw;[^}]*animation: overview-step-show 18s/);
    const kf = css.match(/@keyframes overview-step-show \{[\s\S]*?\n {4}\}/)![0];
    expect(kf).toContain('transform: rotateY(90deg);');
    expect(kf).toContain('transform: rotateY(-90deg);');
    // reduced motion: the first one, flat
    expect(css).toContain('.overview-design-img:first-of-type { opacity: 1; transform: none; }');
  });

  it('the current step dot stretches into a pill', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const css = readFileSync(resolve(__dirname, '../src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
    const kf = css.match(/@keyframes overview-step-chip \{[\s\S]*?\n {4}\}/)![0];
    expect(kf).toMatch(/2%, 16\.667% \{\s*width: 28px;/);
    expect(kf).toMatch(/18\.667%, 100% \{\s*width: 8px;/);
    expect(kf).not.toContain('box-shadow');
    // reduced motion: the first step stays the pill
    expect(css).toContain('.overview-design-step-wrap:first-child .overview-design-chip { width: 28px; background: #6C63FF; }');
  });
});

describe('works wall and How I Design details', () => {
  it('the App / Web tags are small, and How I Design keeps the grid cards\' top tint', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const css = readFileSync(resolve(__dirname, '../src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
    const pill = css.match(/\n {4}\.overview-pill \{[^}]*\}/)![0];
    expect(pill).toContain('font-size: 13px;');
    expect(pill).toContain('padding: 5px 11px;');
    const scrim = css.match(/\n {4}\.overview-design-scrim \{[^}]*\}/)![0];
    expect(scrim).toMatch(/radial-gradient\(var\(--card-tint-shape, 380px 220px at 50% 0%\), var\(--card-tint/);
  });
});

describe('useLiveTiles', () => {
  it('nextSteps turns one tile per tick, the tiles in turn', () => {
    expect(nextSteps([0, 0, 0], 0)).toEqual([1, 0, 0]);
    expect(nextSteps([1, 0, 0], 4)).toEqual([1, 1, 0]);
  });

  it('turns a tile every FLIP_MS (no IntersectionObserver: always on)', () => {
    vi.useFakeTimers();
    const io = globalThis.IntersectionObserver;
    // @ts-expect-error jsdom: remove it for this test
    delete globalThis.IntersectionObserver;
    let last: number[] = [];
    render(<Probe onSteps={s => { last = s; }} />);
    expect(last).toEqual([0, 0, 0]);
    act(() => { vi.advanceTimersByTime(FLIP_MS * 4); });
    expect(last).toEqual([2, 1, 1]);
    globalThis.IntersectionObserver = io;
  });

  it('runs only while on screen', () => {
    vi.useFakeTimers();
    let cb: (e: { isIntersecting: boolean }[]) => void = () => {};
    const io = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class {
      constructor(f: typeof cb) { cb = f; }
      observe() {} disconnect() {} unobserve() {} takeRecords() { return []; }
    } as unknown as typeof IntersectionObserver;
    let last: number[] = [];
    render(<Probe onSteps={s => { last = s; }} />);
    act(() => { vi.advanceTimersByTime(FLIP_MS * 2); });
    expect(last).toEqual([0, 0, 0]);
    act(() => { cb([{ isIntersecting: true }]); vi.advanceTimersByTime(FLIP_MS); });
    expect(last).toEqual([1, 0, 0]);
    act(() => { cb([{ isIntersecting: false }]); vi.advanceTimersByTime(FLIP_MS * 3); });
    expect(last).toEqual([1, 0, 0]);
    globalThis.IntersectionObserver = io;
  });

  it('never turns for reduced motion', () => {
    vi.useFakeTimers();
    const mm = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    let last: number[] = [];
    render(<Probe onSteps={s => { last = s; }} />);
    act(() => { vi.advanceTimersByTime(FLIP_MS * 5); });
    expect(last).toEqual([0, 0, 0]);
    window.matchMedia = mm;
  });
});
