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
      const splineEl = document.querySelector('.hero-fig-desktop');
      if (!splineEl) {
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
