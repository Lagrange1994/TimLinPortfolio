import { useEffect, useRef, type CSSProperties } from 'react';

export type CubeWork = { id: string; link: string; img: string; title: string; kind: 'App' | 'Web' };

// The four sides of a live tile's cube for a given step: side k sits at
// -90k deg, the cube has turned `step` quarter-turns, so side step % 4 faces
// front showing work `step`, and the side below it already holds the next.
export function cubeFaces(count: number, step: number) {
  return [0, 1, 2, 3].map(k => {
    const ahead = (k - (step % 4) + 4) % 4;
    return { k, ahead, index: (step + ahead) % count };
  });
}

// A Windows 8 style live tile: the works stand on a cube that rolls up a
// quarter turn each time `step` goes up. Sits in a positioned tile (its
// parent), whose height sets the cube's depth (--half).
export default function WorkCube({ works, step }: { works: CubeWork[]; step: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    const set = () => el.style.setProperty('--half', `${host.clientHeight / 2}px`);
    set();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(set);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="work-cube" style={{ '--n': step } as CSSProperties}>
      {cubeFaces(works.length, step).map(f => {
        const w = works[f.index];
        const front = f.ahead === 0;
        return (
          <a
            key={f.k}
            className={`work-face${front ? ' is-front' : ''}`}
            href={w.link}
            style={{ '--k': f.k } as CSSProperties}
            aria-label={w.title}
            aria-hidden={front ? undefined : true}
            tabIndex={front ? undefined : -1}
          >
            <img src={w.img} alt="" loading="lazy" />
            <span className="overview-pill">{w.kind}</span>
          </a>
        );
      })}
    </div>
  );
}
