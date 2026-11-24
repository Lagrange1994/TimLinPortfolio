import { useEffect, useState, type RefObject } from 'react';

// One tile turns every FLIP_MS, the tiles taking turns (so no two ever turn
// together): each tile's own step count, for WorkCube.
export const FLIP_MS = 3500;

export function nextSteps(steps: number[], tick: number): number[] {
  const out = steps.slice();
  out[tick % steps.length] += 1;
  return out;
}

// Runs only while the wall is on screen, and not at all for reduced motion.
export function useLiveTiles(count: number, ref: RefObject<HTMLElement | null>): number[] {
  const [steps, setSteps] = useState<number[]>(() => Array(count).fill(0));
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let tick = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        const t = tick++;
        setSteps(s => nextSteps(s, t));
      }, FLIP_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      start();
      return stop;
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, [count, ref]);
  return steps;
}
