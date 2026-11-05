// #main-header's height changes between its resting/un-scrolled and
// .scrolled (compact pill) states. Every `.section` uses scroll-margin-top:
// var(--nav-h) so menu/CTA navigation lands with the title exactly
// padding-top below the navbar. Force the header into its post-scroll
// (.scrolled) state and re-measure --nav-h synchronously before a nav jump,
// so the gap used is already the one that'll be active once the scroll
// settles (the animator below also re-reads --nav-h live every frame, but
// priming avoids a visible header-height jump at the very start).
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

// Native scrollIntoView({behavior:'smooth'}) / scrollTo({behavior:'smooth'})
// locks onto the target Y computed at call time and never re-targets. On a
// fresh load/refresh that's exactly when the target keeps moving: webfonts
// swap in (display=swap), images below the fold finish decoding, and GSAP
// scroll-reveal settles — every one of those reflows content above the
// target after the smooth scroll has already committed to the old position,
// so the first CTA/menu jump lands short and only a second click (page now
// static) hits the mark. The native smoother is also unreliable when the
// tab isn't focused. So drive the scroll ourselves with rAF and re-read the
// live target position + --nav-h every frame — any mid-flight layout shift
// is tracked automatically, and the jump converges on the real resting spot
// in one go.

// Tracks real touch use so the pull-to-refresh containment below (see
// animateScrollTo) can gate on an actual touch event instead of the
// `pointer: coarse` media feature, which Windows can report true for a
// touchscreen-equipped desktop/laptop even while the user is on a mouse —
// that false-positive silently blocked desktop wheel scrolling when this
// lived in CSS.
let lastTouchAt = 0;
window.addEventListener('touchstart', () => { lastTouchAt = performance.now(); }, { passive: true });

let rafId: number | null = null;
let cleanupInput: (() => void) | null = null;

// While a nav/CTA auto-scroll runs, <html data-auto-scroll="<target id>">
// marks it: the sections it flies past skip their entrance and scroll-zoom
// animations (portfolio.css, useRiseReveal.ts, PortfolioSection.tsx), so
// only the target section animates. Cleared, with AUTO_SCROLL_END_EVENT on
// window, once the scroll stops (landed or taken over by the user).
export const AUTO_SCROLL_END_EVENT = 'auto-scroll-end';
export function autoScrollTarget(): string | null {
  return document.documentElement.dataset.autoScroll ?? null;
}
// True while an auto-scroll is flying past `section` on its way elsewhere.
export function autoScrollSkips(section: Element): boolean {
  const id = autoScrollTarget();
  if (id == null) return false;
  if (section.id === id) return false;
  const target = document.getElementById(id);
  return !(target && section.contains(target));
}

function stopAnimatedScroll() {
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
  if (cleanupInput) cleanupInput();
  cleanupInput = null;
  if (autoScrollTarget() != null) {
    delete document.documentElement.dataset.autoScroll;
    window.dispatchEvent(new Event(AUTO_SCROLL_END_EVENT));
  }
}

// A section that sticks inside a scroll-zoom track ([data-zoom-track], e.g.
// Portfolio) moves with the scroll, so its own rect is no landing spot, and
// the track's top is where the zoom starts. Land at the track's end instead,
// where the zoom has finished: the section's document top if it sat at the
// bottom of its track. null when the target isn't stuck in a track.
export function zoomTrackRestTop(target: HTMLElement): number | null {
  const track = target.parentElement?.closest<HTMLElement>('[data-zoom-track]');
  if (!track || getComputedStyle(target).position !== 'sticky') return null;
  const trackTop = track.getBoundingClientRect().top + window.scrollY;
  return trackTop + track.offsetHeight - target.offsetHeight;
}

function desiredScrollY(target: HTMLElement): number {
  // A lazily unmounted section (LazyUnit) is a zero-size anchor span with the
  // section's id; once the real section mounts the span is removed, and a
  // detached node measures as 0 — callers re-resolve by id every frame.
  const navH =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
    ) || 0;
  const absTop = zoomTrackRestTop(target) ?? target.getBoundingClientRect().top + window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return Math.min(Math.max(absTop - navH, 0), max);
}

// A fixed proportional ease (cur += diff * k) is fastest at the very first
// frame — for a long jump that first step lurches hundreds of px with no
// ramp-up, which reads as "too fast / no damping". Instead run a
// duration-based tween with an ease-in-out curve so motion accelerates from
// rest and decelerates into the target. The end point is still read *live*
// every frame (start + (liveTarget - start) * ease(p)), so the tween stays
// self-correcting: if content loads and shifts the target mid-flight, the
// whole curve rescales and still lands exactly on the real resting spot.
//
// After the tween completes, a short grace phase gently follows any late
// layout shift (image decode, scroll-reveal settle) that lands after the
// curve is already done — small residuals only, so it never feels fast.
const GRACE_MS = 450; // post-tween window to absorb late reflow
const GRACE_EASE = 0.18;

// Standard easeInOutCubic: slow start, quick middle, slow finish.
function easeInOutCubic(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

function animateScrollTo(getTargetY: () => number, targetId: string) {
  stopAnimatedScroll();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, getTargetY());
    return;
  }
  document.documentElement.dataset.autoScroll = targetId;

  const startY = window.scrollY;
  const distance = Math.abs(getTargetY() - startY);
  // Scale duration with distance so a short hop and a full-page jump both
  // feel deliberate, clamped so neither drags nor flicks.
  const duration = Math.min(1600, Math.max(700, 650 + distance * 0.22));

  const t0 = performance.now();
  let doneAt: number | null = null; // when the main tween finished (grace start)
  let userTookOver = false;
  const onUserInput = () => { userTookOver = true; };
  (['wheel', 'touchstart', 'keydown'] as const).forEach(evt =>
    window.addEventListener(evt, onUserInput, { passive: true })
  );

  // Only a touch in the last 600ms is treated as "this scroll may be
  // fighting an active drag" — see the pull-to-refresh note above
  // lastTouchAt. Desktop mouse/trackpad users never touch this branch.
  let restoreOverscroll: (() => void) | null = null;
  if (performance.now() - lastTouchAt < 600) {
    const htmlPrev = document.documentElement.style.overscrollBehaviorY;
    const bodyPrev = document.body.style.overscrollBehaviorY;
    document.documentElement.style.overscrollBehaviorY = 'contain';
    document.body.style.overscrollBehaviorY = 'contain';
    restoreOverscroll = () => {
      document.documentElement.style.overscrollBehaviorY = htmlPrev;
      document.body.style.overscrollBehaviorY = bodyPrev;
    };
  }

  cleanupInput = () => {
    (['wheel', 'touchstart', 'keydown'] as const).forEach(evt =>
      window.removeEventListener(evt, onUserInput)
    );
    restoreOverscroll?.();
  };

  const step = () => {
    if (userTookOver) { stopAnimatedScroll(); return; }
    const now = performance.now();
    const target = getTargetY();

    if (doneAt == null) {
      const p = Math.min((now - t0) / duration, 1);
      window.scrollTo(0, startY + (target - startY) * easeInOutCubic(p));
      if (p >= 1) doneAt = now;
    } else {
      // Grace: softly track late shifts, then stop once settled or expired.
      const cur = window.scrollY;
      const diff = target - cur;
      if (Math.abs(diff) < 0.5) window.scrollTo(0, target);
      else window.scrollTo(0, cur + diff * GRACE_EASE);
      if (now - doneAt > GRACE_MS) { stopAnimatedScroll(); return; }
    }
    rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);
}

export function scrollToSectionAligned(id: string) {
  if (id === 'home') {
    animateScrollTo(() => 0, 'home');
    return;
  }
  if (!document.getElementById(id)) return;

  primeHeaderForNav();
  // Re-resolved by id on every frame, not captured once: the element can be
  // swapped mid-flight when a lazily unmounted section mounts (LazyUnit).
  animateScrollTo(() => {
    const target = document.getElementById(id);
    return target ? desiredScrollY(target) : window.scrollY;
  }, id);
}
