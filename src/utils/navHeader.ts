// #main-header's height changes between its resting/un-scrolled and
// .scrolled (compact pill) states. Every `.section` uses scroll-margin-top:
// var(--nav-h) so menu/CTA navigation lands with the title exactly
// padding-top below the navbar — but native scrollIntoView() snapshots that
// margin once at call time. If navigation starts near the top of the page
// (header still in its pre-scroll state) the header then flips to .scrolled
// mid-animation, changing height and throwing off the resting gap.
//
// Call this right before scrollIntoView()/scrollTo() for any non-home
// target: it forces the header into its post-scroll (.scrolled) state and
// re-measures --nav-h synchronously, so the margin used for the scroll is
// already the one that'll be active once the scroll settles.
//
// #main-header and #nav-container both carry `transition: all .3s` (for the
// normal scroll-driven compact-pill animation), so just adding the class and
// reading offsetHeight in the same tick would catch the height mid-transition
// — not the final one. Transitions are disabled for one frame to force the
// final layout synchronously, then restored so the visual animation (for
// later scroll-position changes, e.g. scrolling back up past the threshold)
// still plays normally.
export function primeHeaderForNav() {
  const header = document.getElementById('main-header');
  const navContainer = document.getElementById('nav-container');
  if (!header) return;
  if (window.scrollY <= 40) {
    const headerTransition = header.style.transition;
    const navTransition = navContainer ? navContainer.style.transition : '';
    header.style.transition = 'none';
    if (navContainer) navContainer.style.transition = 'none';

    header.classList.add('scrolled');
    void header.offsetHeight; // force synchronous layout at the final state
    document.documentElement.style.setProperty('--nav-h', `${header.offsetHeight}px`);

    requestAnimationFrame(() => {
      header.style.transition = headerTransition;
      if (navContainer) navContainer.style.transition = navTransition;
    });
  }
}

// Google Fonts are loaded with `display=swap` (see index.html), so on a
// fresh load/refresh the page first paints with fallback metrics and swaps
// to the real webfont a beat later. If that swap reflows anything above the
// nav target (header text, earlier sections), it shifts the whole page
// after scrollIntoView() has already locked onto its target Y — the
// in-flight smooth scroll keeps heading for the pre-swap position and lands
// short/long. Re-align once fonts settle, but only for the request that's
// still current (id match) and only if the user hasn't since taken over
// scrolling themselves (wheel/touch/key), so this can't yank them back
// mid-manual-scroll.
let pendingAlignId: string | null = null;

function cancelPendingAlignOnUserInput() {
  const cancel = () => { pendingAlignId = null; };
  (['wheel', 'touchmove', 'keydown'] as const).forEach(evt =>
    window.addEventListener(evt, cancel, { once: true, passive: true })
  );
}

export function scrollToSectionAligned(id: string) {
  if (id === 'home') {
    pendingAlignId = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const target = document.getElementById(id);
  if (!target) return;

  primeHeaderForNav();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (document.fonts && document.fonts.status !== 'loaded') {
    pendingAlignId = id;
    cancelPendingAlignOnUserInput();
    document.fonts.ready.then(() => {
      if (pendingAlignId !== id) return;
      pendingAlignId = null;
      primeHeaderForNav();
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  }
}
