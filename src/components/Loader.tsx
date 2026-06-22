import { useEffect } from 'react';

export default function Loader() {
  useEffect(() => {
    const loader = document.getElementById('page-loader');
    if (!loader) return;

    let dismissed = false;
    function hideLoader() {
      if (dismissed) return;
      dismissed = true;
      loader!.classList.add('hidden');
      document.body.classList.add('hero-ready');
      window.dispatchEvent(new Event('hero-ready'));
    }

    const forceTimer = setTimeout(hideLoader, 4000);

    function waitForSpline() {
      // The desktop hero figure only gets a Spline `url` (and thus only ever
      // fires `load`) when window.innerWidth >= 1025 — see HeroSection's
      // "Hero spline desktop conditional" effect. Below that breakpoint the
      // element exists but never loads anything, so waiting for its `load`
      // event would just burn the full 4s forceTimer on every mobile visit.
      const splineEl = document.querySelector('.hero-fig-desktop');
      if (!splineEl || window.innerWidth < 1025) {
        hideLoader();
        return;
      }
      splineEl.addEventListener('load', function () {
        clearTimeout(forceTimer);
        hideLoader();
      }, { once: true });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', waitForSpline, { once: true });
    } else {
      waitForSpline();
    }

    return () => {
      clearTimeout(forceTimer);
    };
  }, []);

  return (
    <div className="loader" id="page-loader">
      <div className="loader-animation"></div>
    </div>
  );
}
