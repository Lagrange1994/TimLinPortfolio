'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useRouter } from 'next/navigation';

interface MasonryItem {
  id: string;
  img: string;
  url: string;
  height: number;
}

interface GridItem extends MasonryItem {
  x: number;
  y: number;
  w: number;
  h: number;
}

const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    const get = () => values[queries.findIndex(q => matchMedia(q).matches)] ?? defaultValue;
    setValue(get());
    const handler = () => setValue(get());
    queries.forEach(q => matchMedia(q).addEventListener('change', handler));
    return () => queries.forEach(q => matchMedia(q).removeEventListener('change', handler));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
};

const useMeasure = (): [React.RefObject<HTMLDivElement | null>, { width: number; height: number }] => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
};

const preloadImages = (urls: string[]) =>
  Promise.all(
    urls.map(
      src => new Promise<void>(resolve => {
        const img = new Image();
        img.src = src;
        img.onload = img.onerror = () => resolve();
      })
    )
  );

interface MasonryProps {
  items: MasonryItem[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'random';
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
  colorShiftOnHover?: boolean;
}

export default function Masonry({
  items,
  ease = 'power3.out',
  duration = 0.6,
  stagger = 0.05,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false,
}: MasonryProps) {
  const router = useRouter();

  const columns = useMedia(
    ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
    [4, 3, 2, 2],
    1
  );

  const [containerRef, { width }] = useMeasure();
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    setImagesReady(false);
    preloadImages(items.map(i => i.img)).then(() => setImagesReady(true));
  }, [items]);

  const grid = useMemo<GridItem[]>(() => {
    if (!width) return [];
    const colHeights = new Array(columns).fill(0);
    const columnWidth = width / columns;
    return items.map(child => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = columnWidth * col;
      const h = child.height / 2;
      const y = colHeights[col];
      colHeights[col] += h;
      return { ...child, x, y, w: columnWidth, h };
    });
  }, [columns, items, width]);

  const containerHeight = useMemo(
    () => (grid.length ? Math.max(...grid.map(g => g.y + g.h)) : 0),
    [grid]
  );

  const hasMounted = useRef(false);

  const getInitialPosition = (item: GridItem) => {
    const rect = containerRef.current?.getBoundingClientRect();
    let dir: string = animateFrom;
    if (animateFrom === 'random') {
      const dirs = ['top', 'bottom', 'left', 'right'];
      dir = dirs[Math.floor(Math.random() * dirs.length)];
    }
    switch (dir) {
      case 'top':    return { x: item.x, y: -200 };
      case 'bottom': return { x: item.x, y: window.innerHeight + 200 };
      case 'left':   return { x: -200, y: item.y };
      case 'right':  return { x: window.innerWidth + 200, y: item.y };
      case 'center': return {
        x: (rect?.width ?? 0) / 2 - item.w / 2,
        y: (rect?.height ?? 0) / 2 - item.h / 2,
      };
      default:       return { x: item.x, y: item.y + 100 };
    }
  };

  useLayoutEffect(() => {
    if (!imagesReady || !grid.length) return;

    grid.forEach((item, index) => {
      const sel = `[data-key="${item.id}"]`;
      const target = { x: item.x, y: item.y, width: item.w, height: item.h };

      if (!hasMounted.current) {
        const init = getInitialPosition(item);
        gsap.fromTo(sel,
          { opacity: 0, x: init.x, y: init.y, width: item.w, height: item.h, ...(blurToFocus && { filter: 'blur(10px)' }) },
          { opacity: 1, ...target, ...(blurToFocus && { filter: 'blur(0px)' }), duration: 0.8, ease: 'power3.out', delay: index * stagger }
        );
      } else {
        gsap.to(sel, { ...target, duration, ease, overwrite: 'auto' });
      }
    });

    hasMounted.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, imagesReady]);

  const handleMouseEnter = (item: GridItem) => {
    if (scaleOnHover) gsap.to(`[data-key="${item.id}"]`, { scale: hoverScale, duration: 0.3, ease: 'power2.out' });
    if (colorShiftOnHover) gsap.to(`[data-key="${item.id}"] .masonry-color-overlay`, { opacity: 0.3, duration: 0.3 });
  };

  const handleMouseLeave = (item: GridItem) => {
    if (scaleOnHover) gsap.to(`[data-key="${item.id}"]`, { scale: 1, duration: 0.3, ease: 'power2.out' });
    if (colorShiftOnHover) gsap.to(`[data-key="${item.id}"] .masonry-color-overlay`, { opacity: 0, duration: 0.3 });
  };

  return (
    <div ref={containerRef} className="masonry-list" style={{ height: containerHeight }}>
      {grid.map(item => (
        <div
          key={item.id}
          data-key={item.id}
          className="masonry-item-wrapper"
          onClick={() => router.push(item.url)}
          onMouseEnter={() => handleMouseEnter(item)}
          onMouseLeave={() => handleMouseLeave(item)}
        >
          <div className="masonry-item-img" style={{ backgroundImage: `url(${item.img})` }}>
            {colorShiftOnHover && (
              <div className="masonry-color-overlay" style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(45deg, rgba(255,0,150,0.5), rgba(0,150,255,0.5))',
                opacity: 0, pointerEvents: 'none', borderRadius: '10px',
              }} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
