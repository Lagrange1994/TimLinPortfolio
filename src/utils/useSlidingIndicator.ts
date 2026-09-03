import { useLayoutEffect, useState, type RefObject } from 'react';

export interface SlidingIndicatorRect {
  transform: string;
  width: number;
  height: number;
  top: number;
}

/**
 * Measures the active item inside `containerRef` (matched by `itemSelector`,
 * in DOM order) and returns absolute-positioning geometry for a single
 * indicator element that a plain CSS transition can then slide/resize
 * between items. Re-measures on container resize (covers language-driven
 * label width changes) and whenever `activeIndex` changes.
 *
 * This used to be two Motion `layoutId`-shared spans; that looked broken
 * (froze at the first-rendered position on every later activation) but the
 * real cause turned out to be a Chromium bug, not Motion: an element whose
 * `transform` is updated via inline style stays painted at its OLD position
 * if it sits inside a `backdrop-filter` ancestor (both the FAQ and filter
 * tab tracks do) — the style/computed value updates correctly, only the
 * composited paint doesn't. Same family of bug already worked around for
 * theme-driven background-color staleness in useTheme.ts. Switching away
 * from Motion didn't fix it (this hook's own plain-transform version hit
 * the exact same freeze); forcing a synchronous reflow after each geometry
 * update does.
 */
function sameRect(a: SlidingIndicatorRect | null, b: SlidingIndicatorRect): boolean {
  return !!a && a.transform === b.transform && a.width === b.width && a.height === b.height && a.top === b.top;
}

export function useSlidingIndicator(
  containerRef: RefObject<HTMLElement | null>,
  itemSelector: string,
  activeIndex: number
): SlidingIndicatorRect | null {
  const [rect, setRect] = useState<SlidingIndicatorRect | null>(null);

  // No dependency array: this needs to re-measure whenever the container
  // mounts (e.g. a filter bar that only renders once its section expands),
  // not just when activeIndex changes. Safe from render loops because
  // setRect bails out via sameRect() when the measured geometry hasn't
  // actually moved, so a stable layout converges after one measurement.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const items = container.querySelectorAll<HTMLElement>(itemSelector);
      const active = items[activeIndex];
      if (!active) return;
      const next: SlidingIndicatorRect = {
        transform: `translateX(${active.offsetLeft}px)`,
        width: active.offsetWidth,
        height: active.offsetHeight,
        top: active.offsetTop,
      };
      setRect(prev => (sameRect(prev, next) ? prev : next));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  });

  // Runs after the indicator element has actually received its new
  // transform (the render triggered by the `rect` update above). A
  // display:none/reflow/restore on the container — not document.body, so
  // this can't disturb page scroll the way the theme toggle's fix has to
  // guard against — busts the stale composited paint described above.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !rect) return;
    const prevDisplay = container.style.display;
    container.style.display = 'none';
    void container.offsetHeight;
    container.style.display = prevDisplay;
  }, [rect, containerRef]);

  return rect;
}
