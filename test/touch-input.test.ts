import { describe, it, expect, vi, afterEach } from 'vitest';
import { initTouchInput, TOUCH_CLASS, MOUSE_GRACE_MS } from '../src/utils/touchInput';

// Touch-only CSS keys off a real touch, not the hardware's hover/pointer
// guess (which matched mouse-driven Windows touchscreen laptops).
describe('touch input marker', () => {
  let stop = () => {};
  afterEach(() => { stop(); vi.restoreAllMocks(); document.documentElement.classList.remove(TOUCH_CLASS); });

  it('a touch marks the page, a later mouse move clears it', () => {
    let now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    stop = initTouchInput();
    const root = document.documentElement;
    expect(root.classList.contains(TOUCH_CLASS)).toBe(false);
    window.dispatchEvent(new Event('touchstart'));
    expect(root.classList.contains(TOUCH_CLASS)).toBe(true);
    // the tap's own compatibility mousemove keeps it
    now += 100;
    window.dispatchEvent(new Event('mousemove'));
    expect(root.classList.contains(TOUCH_CLASS)).toBe(true);
    now += MOUSE_GRACE_MS + 1;
    window.dispatchEvent(new Event('mousemove'));
    expect(root.classList.contains(TOUCH_CLASS)).toBe(false);
  });

  it('a mouse alone never marks it, and cleanup removes the listeners', () => {
    stop = initTouchInput();
    window.dispatchEvent(new Event('mousemove'));
    expect(document.documentElement.classList.contains(TOUCH_CLASS)).toBe(false);
    stop();
    window.dispatchEvent(new Event('touchstart'));
    expect(document.documentElement.classList.contains(TOUCH_CLASS)).toBe(false);
  });
});
