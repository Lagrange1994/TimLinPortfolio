import { useEffect } from 'react';

// Stat counters digit-wheel — starts spinning random digits as soon as the
// card mounts (slot-machine flicker), independent of scroll/reveal state,
// then waits for each card's GSAP rise-reveal (useRiseReveal) to finish
// settling before smoothly gliding to the real value. Falls back to
// scroll-into-view triggering (no spin, immediate value) when reduced-motion
// is on, since useRiseReveal skips the animation (and the 'rise-settled'
// event) in that case. Scans every .stat-num-wrap under the element with
// `rowId` (any DOM depth). Moved out of AboutSection when the stat cards
// moved to the Overview wall.
export const SPIN_FLIP_MS = 160;

export function useDigitWheel(rowId: string) {
  useEffect(() => {
    const statRow = document.getElementById(rowId);
    if (!statRow) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const spinners = new Map<HTMLElement, number>();
    const timers: ReturnType<typeof setTimeout>[] = [];

    function startSpin(inner: HTMLElement, cellH: number) {
      if (spinners.has(inner)) return;
      // Quick flip transition for each random tick (slower 2s CSS transition
      // only kicks back in for the final glide to the real value).
      inner.style.transition = `transform ${SPIN_FLIP_MS}ms cubic-bezier(.4,0,.2,1)`;
      const id = window.setInterval(() => {
        const r = Math.floor(Math.random() * 10);
        inner.style.transform = 'translateY(-' + (r * cellH) + 'px)';
      }, SPIN_FLIP_MS);
      spinners.set(inner, id);
    }

    function stopSpin(inner: HTMLElement) {
      const id = spinners.get(inner);
      if (id !== undefined) { window.clearInterval(id); spinners.delete(inner); }
    }

    const rolled = new WeakSet<HTMLElement>();
    function rollWrap(wrap: HTMLElement) {
      if (rolled.has(wrap)) return;
      rolled.add(wrap);
      const value = parseInt(wrap.dataset.value || '0', 10);
      const digits = String(value).split('').map(Number);
      const cols = wrap.querySelectorAll<HTMLElement>('.digit-col');
      cols.forEach((col, i) => {
        const target = digits[i];
        const inner = col.querySelector<HTMLElement>('.digit-col-inner');
        const cellH = col.offsetHeight || 35;
        timers.push(setTimeout(() => {
          if (!inner) return;
          stopSpin(inner);
          // Re-enable the CSS transition (cleared while spinning) and force a
          // reflow so the glide to the real value animates from whatever
          // random digit the spin last landed on, instead of jumping.
          inner.style.transition = '';
          void inner.offsetHeight;
          inner.style.transform = 'translateY(-' + (target * cellH) + 'px)';
        }, i * 120));
      });
    }

    if (reduceMotion) {
      const rollAll = () => {
        statRow.querySelectorAll<HTMLElement>('.stat-num-wrap').forEach(rollWrap);
      };
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) rollAll(); });
      }, { threshold: 0.1 });
      obs.observe(statRow);
      return () => obs.disconnect();
    }

    statRow.querySelectorAll<HTMLElement>('.stat-num-wrap').forEach(wrap => {
      wrap.querySelectorAll<HTMLElement>('.digit-col').forEach(col => {
        const inner = col.querySelector<HTMLElement>('.digit-col-inner');
        const cellH = col.offsetHeight || 35;
        if (inner) startSpin(inner, cellH);
      });
    });

    const onSettled = (e: Event) => {
      const card = e.target as HTMLElement;
      card.querySelectorAll<HTMLElement>('.stat-num-wrap').forEach(rollWrap);
    };
    statRow.addEventListener('rise-settled', onSettled);
    return () => {
      statRow.removeEventListener('rise-settled', onSettled);
      spinners.forEach(id => window.clearInterval(id));
      timers.forEach(clearTimeout);
    };
  }, [rowId]);
}
