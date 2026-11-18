import { useEffect } from 'react';

const OFF = '-500px';

// The bento cards' two cursor glows, scoped to one section (About keeps its
// own copy): .card-spotlight's --mouse-x/y and the white border ring on
// .sc-card (an injected .sc-overlay, driven by --sc-x/y). Plain
// mousemove/mouseleave, no matchMedia gate or pointerType filter (both once
// wrongly disabled it for real mouse users). Light mode paints neither
// (opacity:0 !important in portfolio.css), so it skips the measuring there.
// Unlike About's copy it removes its listeners on unmount — LazyUnit
// remounts the section, and stale listeners would pile up.
export function useCardGlow(rootId: string) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const cleanups: (() => void)[] = [];
    const cards = new Set<HTMLElement>([
      ...root.querySelectorAll<HTMLElement>('.card-spotlight'),
      ...root.querySelectorAll<HTMLElement>('.sc-card'),
    ]);
    cards.forEach(card => {
      const ring = card.classList.contains('sc-card');
      if (ring && !card.querySelector(':scope > .sc-overlay')) {
        const ov = document.createElement('div');
        ov.className = 'sc-overlay';
        card.insertBefore(ov, card.firstChild);
      }
      const set = (x: string, y: string) => {
        card.style.setProperty('--mouse-x', x);
        card.style.setProperty('--mouse-y', y);
        if (ring) {
          card.style.setProperty('--sc-x', x);
          card.style.setProperty('--sc-y', y);
        }
      };
      const onMove = (e: MouseEvent) => {
        if (document.documentElement.getAttribute('data-theme') === 'light') return;
        const r = card.getBoundingClientRect();
        set(`${e.clientX - r.left}px`, `${e.clientY - r.top}px`);
      };
      const onLeave = () => set(OFF, OFF);
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    });
    return () => cleanups.forEach(fn => fn());
  }, [rootId]);
}
