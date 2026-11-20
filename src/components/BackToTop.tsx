import { useEffect, useRef } from 'react';
import { flushAtTop, flushSectionTops } from '../utils/navCompact';

// Fixed "back to top" button, mounted at App level — not in ContactSection,
// a LazyUnit that unmounts far from view and took this button with it.
// See utils/fixedUiFootprint.ts.
export default function BackToTop() {
  const ref = useRef<HTMLButtonElement>(null);

  // Toggle .visible based on scroll position
  useEffect(() => {
    const onScroll = () => {
      // hidden while a framed section (the Overview wall) sits flush at the
      // top: its bottom-right notch holds the availability card's buttons
      // right where this one floats
      ref.current?.classList.toggle('visible', window.scrollY > 400 && !flushAtTop(flushSectionTops()));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button ref={ref} id="back-to-top" className="btn-glass btn-grad" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <i className="fas fa-arrow-up"></i>
    </button>
  );
}
