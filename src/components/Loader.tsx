import { useEffect } from 'react';

// Must match HeroSection's "Hero spline desktop+tablet conditional" effect —
// that's the breakpoint below which the hero figure is a static <img> instead
// of a Spline scene.
const HERO_FIGURE_BREAKPOINT = 768;

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

    function waitForAssets() {
      // Background Spline scene (#spline-bg) loads at every viewport width.
      // The hero character Spline only gets a `url` (and thus only ever
      // fires `load`) at HERO_FIGURE_BREAKPOINT and up; below that it's a
      // static <img>, so there's nothing to wait for there — mobile only
      // waits on the background.
      const isDesktop = window.innerWidth >= HERO_FIGURE_BREAKPOINT;
      const pending = [
        document.getElementById('spline-bg'),
        isDesktop ? document.querySelector('.hero-fig-desktop') : null,
      ].filter((el): el is Element => !!el);

      if (!pending.length) {
        hideLoader();
        return;
      }

      let remaining = pending.length;
      pending.forEach(el => el.addEventListener('load', function () {
        remaining -= 1;
        if (remaining === 0) {
          clearTimeout(forceTimer);
          hideLoader();
        }
      }, { once: true }));
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', waitForAssets, { once: true });
    } else {
      waitForAssets();
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
