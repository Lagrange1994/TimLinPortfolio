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

export function scrollToSectionAligned(id: string) {
  if (id === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const target = document.getElementById(id);
  if (!target) return;

  primeHeaderForNav();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
