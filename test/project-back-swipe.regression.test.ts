import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
// @ts-expect-error plain JS module
import { installBackSwipe, willGoBack, recentVelocity, EDGE_ZONE, MIN_DISTANCE, FAR_DISTANCE, MIN_VELOCITY } from '../src/projects/shared/backSwipe.js';

const ROOT = path.resolve(__dirname, '..');

// Every project page installs the shared swipe-back (left-edge start only,
// velocity-gated, Chrome-style bubble) instead of carrying its own copy.
describe.each([
  'project_01.jsx', 'project_02.jsx', 'project_03.jsx', 'project_04.jsx',
  'project_05.jsx', 'project_06.jsx', 'project_07.jsx', 'project_08.jsx',
  'project_09.jsx', 'project_10.jsx', 'project_11.jsx', 'project_12.jsx',
  'project_13.jsx',
])('%s uses the shared back-swipe', (file) => {
  const jsx = fs.readFileSync(path.join(ROOT, 'src/projects', file), 'utf8');

  it('imports and installs installBackSwipe once, wired to goBack', () => {
    expect(jsx).toMatch(/import \{ installBackSwipe \} from '\.\/shared\/backSwipe';/);
    expect(jsx.match(/installBackSwipe\(/g)?.length).toBe(1);
    expect(jsx).toMatch(/useEffect\(\(\) => installBackSwipe\((\(\) => goBack\(\)|goBack)\), \[\]\);/);
  });

  it('carries no leftover per-page copy of the old handlers', () => {
    expect(jsx).not.toMatch(/handleBackTouch|BACK_EDGE_ZONE|backSwipeRef/);
  });
});

describe('shared backSwipe: pure helpers', () => {
  it('willGoBack needs MIN_DISTANCE plus either a fast flick or a FAR_DISTANCE pull', () => {
    expect(willGoBack(MIN_DISTANCE - 1, 5)).toBe(false);
    expect(willGoBack(MIN_DISTANCE, MIN_VELOCITY)).toBe(true);
    expect(willGoBack(MIN_DISTANCE + 20, MIN_VELOCITY - 0.1)).toBe(false);
    expect(willGoBack(FAR_DISTANCE, 0)).toBe(true);
  });

  it('recentVelocity uses only the last 120ms and is 0 with <2 samples or zero span', () => {
    expect(recentVelocity([], 1000)).toBe(0);
    expect(recentVelocity([{ x: 0, t: 900 }], 1000)).toBe(0);
    expect(recentVelocity([{ x: 0, t: 0 }, { x: 80, t: 40 }], 1000)).toBe(0);
    expect(recentVelocity([{ x: 5, t: 900 }, { x: 5, t: 900 }], 1000)).toBe(0);
    expect(recentVelocity([{ x: 0, t: 920 }, { x: 60, t: 960 }], 1000)).toBeCloseTo(1.5);
  });
});

describe('shared backSwipe: gesture behaviour (jsdom)', () => {
  let goBack: ReturnType<typeof vi.fn>;
  let cleanup: () => void;
  let tabMove: ReturnType<typeof vi.fn>;
  let tabNode: HTMLElement;

  const fire = (target: EventTarget, type: string, x: number, y: number, t: number, touches = 1) => {
    const ev = new Event(type, { bubbles: true, cancelable: true });
    const list = type === 'touchend' || type === 'touchcancel' ? [] : Array.from({ length: touches }, () => ({ clientX: x, clientY: y }));
    Object.defineProperty(ev, 'touches', { value: list });
    Object.defineProperty(ev, 'changedTouches', { value: [{ clientX: x, clientY: y }] });
    Object.defineProperty(ev, 'timeStamp', { value: t });
    target.dispatchEvent(ev);
    return ev;
  };
  const bubble = () => document.querySelector<HTMLElement>('[data-back-swipe-indicator]');

  beforeEach(() => {
    goBack = vi.fn();
    tabNode = document.createElement('div');
    document.body.appendChild(tabNode);
    tabMove = vi.fn();
    tabNode.addEventListener('touchmove', tabMove);
    cleanup = installBackSwipe(goBack);
  });
  afterEach(() => { cleanup(); tabNode.remove(); });

  it('a fast flick from the left edge goes back, shows the bubble, and hides it on release', () => {
    fire(tabNode, 'touchstart', 4, 300, 0);
    fire(tabNode, 'touchmove', 40, 302, 40);
    fire(tabNode, 'touchmove', 100, 303, 80);
    expect(bubble()?.dataset.armed).toBe('true');
    fire(tabNode, 'touchend', 100, 303, 90);
    expect(goBack).toHaveBeenCalledTimes(1);
    expect(bubble()?.style.opacity).toBe('0');
  });

  it('stops edge-origin moves before the tab swipe handlers and cancels native nav (distinguishes back from tab switch)', () => {
    fire(tabNode, 'touchstart', 4, 300, 0);
    const ev = fire(tabNode, 'touchmove', 60, 301, 40);
    expect(tabMove).not.toHaveBeenCalled();
    expect(ev.defaultPrevented).toBe(true);
  });

  it('a horizontal drag NOT starting at the edge is left alone for the tab swipe', () => {
    fire(tabNode, 'touchstart', EDGE_ZONE + 40, 300, 0);
    const ev = fire(tabNode, 'touchmove', EDGE_ZONE + 200, 301, 40);
    fire(tabNode, 'touchend', EDGE_ZONE + 200, 301, 50);
    expect(tabMove).toHaveBeenCalledTimes(1);
    expect(ev.defaultPrevented).toBe(false);
    expect(goBack).not.toHaveBeenCalled();
    expect(bubble()).toBeNull();
  });

  it('a flick that pauses before lifting the finger still goes back (release honours the last shown armed state)', () => {
    fire(tabNode, 'touchstart', 4, 300, 0);
    fire(tabNode, 'touchmove', 40, 301, 40);
    fire(tabNode, 'touchmove', 100, 302, 80);
    expect(bubble()?.dataset.armed).toBe('true');
    fire(tabNode, 'touchend', 100, 302, 2000);
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('a slow short drag shows an unarmed bubble and does not go back', () => {
    fire(tabNode, 'touchstart', 4, 300, 0);
    fire(tabNode, 'touchmove', 40, 301, 400);
    fire(tabNode, 'touchmove', 80, 301, 800);
    expect(bubble()?.dataset.armed).toBe('false');
    fire(tabNode, 'touchend', 80, 301, 1200);
    expect(goBack).not.toHaveBeenCalled();
  });

  it('a slow but long pull past FAR_DISTANCE still goes back', () => {
    fire(tabNode, 'touchstart', 4, 300, 0);
    fire(tabNode, 'touchmove', 60, 301, 500);
    fire(tabNode, 'touchmove', 4 + FAR_DISTANCE + 5, 301, 1000);
    fire(tabNode, 'touchend', 4 + FAR_DISTANCE + 5, 301, 1500);
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('a vertical scroll that starts at the edge is abandoned and never engages', () => {
    fire(tabNode, 'touchstart', 4, 300, 0);
    fire(tabNode, 'touchmove', 6, 340, 30);
    const ev = fire(tabNode, 'touchmove', 90, 345, 60);
    fire(tabNode, 'touchend', 90, 345, 70);
    expect(ev.defaultPrevented).toBe(false);
    expect(goBack).not.toHaveBeenCalled();
    expect(bubble()).toBeNull();
  });

  it('a leftward move from the edge abandons the gesture', () => {
    fire(tabNode, 'touchstart', 20, 300, 0);
    fire(tabNode, 'touchmove', 2, 300, 20);
    fire(tabNode, 'touchmove', 120, 300, 40);
    fire(tabNode, 'touchend', 120, 300, 50);
    expect(goBack).not.toHaveBeenCalled();
  });

  it('tiny movement under the slop keeps waiting without engaging', () => {
    fire(tabNode, 'touchstart', 4, 300, 0);
    fire(tabNode, 'touchmove', 8, 301, 10);
    expect(bubble()).toBeNull();
    fire(tabNode, 'touchend', 8, 301, 20);
    expect(goBack).not.toHaveBeenCalled();
  });

  it('multi-finger touches never arm', () => {
    fire(tabNode, 'touchstart', 4, 300, 0, 2);
    fire(tabNode, 'touchmove', 120, 300, 40);
    fire(tabNode, 'touchend', 120, 300, 50);
    expect(goBack).not.toHaveBeenCalled();
  });

  it('touchcancel hides the bubble without navigating', () => {
    fire(tabNode, 'touchstart', 4, 300, 0);
    fire(tabNode, 'touchmove', 40, 301, 40);
    fire(tabNode, 'touchmove', 120, 301, 80);
    fire(tabNode, 'touchcancel', 120, 301, 90);
    expect(goBack).not.toHaveBeenCalled();
    expect(bubble()?.style.opacity).toBe('0');
  });

  it('cleanup removes the bubble and the listeners', () => {
    fire(tabNode, 'touchstart', 4, 300, 0);
    fire(tabNode, 'touchmove', 60, 301, 30);
    expect(bubble()).not.toBeNull();
    cleanup();
    expect(bubble()).toBeNull();
    fire(tabNode, 'touchstart', 4, 300, 100);
    fire(tabNode, 'touchmove', 120, 301, 130);
    fire(tabNode, 'touchend', 120, 301, 140);
    expect(goBack).not.toHaveBeenCalled();
    cleanup = () => {};
  });
});
