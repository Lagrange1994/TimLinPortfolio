import { useEffect, useRef } from 'react';

// Fixed "back to top" button. Mounted once at the App level, next to
// ChatPanel — NOT inside ContactSection, where it used to live: that section
// is a LazyUnit and gets unmounted while the viewer is more than one section
// away, which took this page-wide button with it (gone through most of the
// page, and missing whenever the portfolio wall measured it to keep its
// "View All" button clear — see utils/fixedUiFootprint.ts).
export default function BackToTop() {
  const ref = useRef<HTMLButtonElement>(null);

  // Toggle .visible based on scroll position
  useEffect(() => {
    const onScroll = () => {
      ref.current?.classList.toggle('visible', window.scrollY > 400);
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
