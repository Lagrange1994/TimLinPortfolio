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

function stopAnimatedScroll() {
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
  if (cleanupInput) cleanupInput();
  cleanupInput = null;
}

function desiredScrollY(target: HTMLElement): number {
  const navH =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
    ) || 0;
  const absTop = target.getBoundingClientRect().top + window.scrollY;
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

function animateScrollTo(getTargetY: () => number) {
  stopAnimatedScroll();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, getTargetY());
    return;
  }

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
    animateScrollTo(() => 0);
    return;
  }
  const target = document.getElementById(id);
  if (!target) return;

  primeHeaderForNav();
  animateScrollTo(() => desiredScrollY(target));
}
