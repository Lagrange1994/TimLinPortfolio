// Marks the page while it is actually being driven by touch: <html> gets
// .touch-input on a real touchstart and loses it on the next mouse move.
// CSS that must only apply to finger input (e.g. the carousels ignoring a
// sticky :hover left by a tap) keys off this class instead of
// @media (hover: none) / (pointer: coarse), which report the hardware's
// guess and match on Windows touchscreen laptops driven by a mouse.

export const TOUCH_CLASS = 'touch-input';
// a tap fires compatibility mouse events right after it; ignore those
export const MOUSE_GRACE_MS = 800;

export function initTouchInput(root: HTMLElement = document.documentElement, win: Window = window) {
  let lastTouch = -Infinity;
  const onTouch = () => {
    lastTouch = performance.now();
    root.classList.add(TOUCH_CLASS);
  };
  const onMouse = () => {
    if (performance.now() - lastTouch > MOUSE_GRACE_MS) root.classList.remove(TOUCH_CLASS);
  };
  win.addEventListener('touchstart', onTouch, { passive: true, capture: true });
  win.addEventListener('mousemove', onMouse, { passive: true });
  return () => {
    win.removeEventListener('touchstart', onTouch, { capture: true });
    win.removeEventListener('mousemove', onMouse);
  };
}
