import { useEffect, useRef, useState, type ReactNode } from 'react';
import { setupRiseReveal } from '../utils/useRiseReveal';
import {
  LAZY_UNIT_ATTR,
  LAZY_KEEP_ATTR,
  LAZY_UNIT_EVENT,
  HOLD_HEIGHT_MS,
  registerLazyUnit,
} from '../utils/lazyUnit';

// Keeps the page's memory flat while scrolling: once the viewer is more than
// one section away from this unit (see evaluateLazyUnits in utils/lazyUnit.ts)
// its whole React subtree is unmounted — DOM, decoded images, compositor
// layers, GSAP timelines, listeners all go — and replaced by an empty box of
// the exact same height, so nothing below it moves. It is mounted again as
// soon as the viewer comes back within one section, and its entrance
// animations (setupRiseReveal) replay — rising in when scrolling down to it,
// dropping in from above when scrolling up.
//
// The wrapper div itself never changes. While unmounted it renders zero-size
// anchors with the unit's section ids at their old offsets, so nav links /
// CTA buttons that look sections up by id (scrollToSectionAligned,
// scrollIntoView) still find a target; the nav animator re-reads the live
// position every frame, so it lands correctly once the real section replaces
// the anchor mid-scroll.
interface Anchor { id: string; top: number }
interface Snapshot { height: number; anchors: Anchor[] }

export default function LazyUnit({ name, children }: { name: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(true);
  const [snap, setSnap] = useState<Snapshot>({ height: 0, anchors: [] });
  const [holdMin, setHoldMin] = useState(0);
  const loadedRef = useRef(true);
  const snapRef = useRef<Snapshot>(snap);

  // Registers with the shared controller, which decides when to (un)mount.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;

    const unregister = registerLazyUnit({
      el,
      isLoaded: () => loadedRef.current,
      keep: () => !!el.querySelector(`[${LAZY_KEEP_ATTR}]`),
      unload: () => {
        const box = el.getBoundingClientRect();
        const anchors = Array.from(el.querySelectorAll<HTMLElement>('section.section[id]'))
          .map(s => ({ id: s.id, top: s.getBoundingClientRect().top - box.top }));
        snapRef.current = { height: box.height, anchors };
        loadedRef.current = false;
        if (holdTimer) clearTimeout(holdTimer);
        setSnap(snapRef.current);
        setHoldMin(0);
        setLoaded(false);
      },
      load: () => {
        loadedRef.current = true;
        setHoldMin(snapRef.current.height);
        if (holdTimer) clearTimeout(holdTimer);
        holdTimer = setTimeout(() => setHoldMin(0), HOLD_HEIGHT_MS);
        setLoaded(true);
      },
    });

    return () => {
      unregister();
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, []);

  // A resize can change the unit's natural height, so a held height from
  // before it is stale: let a mounted unit size itself again.
  useEffect(() => {
    const onResize = () => { if (loadedRef.current) setHoldMin(0); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // (Re)mount: run the entrance setup for this unit's sections; tell anything
  // that cached `section` elements to re-query.
  useEffect(() => {
    const el = ref.current;
    let cleanup: (() => void) | undefined;
    if (loaded && el) {
      cleanup = setupRiseReveal(Array.from(el.querySelectorAll<HTMLElement>('section')));
    }
    window.dispatchEvent(new Event(LAZY_UNIT_EVENT));
    return () => cleanup?.();
  }, [loaded]);

  const style = loaded
    ? (holdMin ? { minHeight: holdMin } : undefined)
    : { height: snap.height, position: 'relative' as const };

  return (
    <div ref={ref} {...{ [LAZY_UNIT_ATTR]: name }} data-lazy-state={loaded ? 'loaded' : 'unloaded'} style={style}>
      {loaded
        ? children
        : snap.anchors.map(a => (
            <span
              key={a.id}
              id={a.id}
              aria-hidden="true"
              style={{ position: 'absolute', left: 0, top: a.top, scrollMarginTop: 'var(--nav-h)' }}
            />
          ))}
    </div>
  );
}
