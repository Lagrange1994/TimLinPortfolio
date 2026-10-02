// Mobile swipe-back for project pages, with a Chrome-style edge indicator.
//
// Only a touch that STARTS within EDGE_ZONE of the left screen edge can be a
// back gesture; every other horizontal drag stays with the page (tab
// switching, galleries). Once an edge touch commits to a rightward drag, the
// move events are stopped at window capture so the tab-swipe handlers (native
// touchmove listeners on the tab content) never see them, and the browser's own
// edge-swipe navigation is cancelled so it can't also fire on release.
//
// "Forceful" = recent finger velocity, not just distance: a fast flick past
// MIN_DISTANCE goes back, a slow drag only does once pulled FAR_DISTANCE. The
// bubble shows how far the pull is and turns white when releasing would go back;
// release acts on that last-shown state, so a flick that pauses before lifting
// the finger still goes back exactly as the bubble promised.

export const EDGE_ZONE = 24;
export const MIN_DISTANCE = 60;
export const FAR_DISTANCE = 140;
export const MIN_VELOCITY = 0.5;
const VELOCITY_WINDOW = 120;
const ENGAGE_SLOP = 10;
const MAX_PULL = 120;
const SIZE = 44;
const PEEK = 28;

export function recentVelocity(samples, now) {
    const recent = samples.filter(s => now - s.t <= VELOCITY_WINDOW);
    if (recent.length < 2) return 0;
    const first = recent[0];
    const last = recent[recent.length - 1];
    const span = last.t - first.t;
    return span > 0 ? (last.x - first.x) / span : 0;
}

export function willGoBack(dx, velocity) {
    return dx >= MIN_DISTANCE && (velocity >= MIN_VELOCITY || dx >= FAR_DISTANCE);
}

const ARROW = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';

export function installBackSwipe(goBack) {
    let start = null;
    let engaged = false;
    let samples = [];
    let armed = false;
    let bubble = null;
    let bubbleY = 0;

    const ensureBubble = () => {
        if (bubble) return bubble;
        bubble = document.createElement('div');
        bubble.setAttribute('aria-hidden', 'true');
        bubble.dataset.backSwipeIndicator = '';
        Object.assign(bubble.style, {
            position: 'fixed', top: '0', left: '0', width: SIZE + 'px', height: SIZE + 'px',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: '2147483000', opacity: '0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.45)', willChange: 'transform, opacity',
            transform: `translate(${-SIZE}px, 0px)`,
        });
        bubble.innerHTML = ARROW;
        document.body.appendChild(bubble);
        return bubble;
    };

    const paint = (armed) => {
        bubble.style.background = armed ? '#ffffff' : 'rgba(30,30,36,0.88)';
        bubble.style.color = armed ? '#111111' : '#ffffff';
        bubble.dataset.armed = armed ? 'true' : 'false';
    };

    const render = (dx, y, armed) => {
        const el = ensureBubble();
        const pull = Math.min(dx, MAX_PULL) / MAX_PULL;
        bubbleY = Math.min(Math.max(y - SIZE / 2, 8), window.innerHeight - SIZE - 8);
        el.style.transition = 'none';
        el.style.opacity = String(Math.min(1, 0.25 + pull * 1.5));
        el.style.transform = `translate(${-SIZE + pull * (SIZE + PEEK)}px, ${bubbleY}px) scale(${armed ? 1.15 : 1})`;
        paint(armed);
    };

    const hide = () => {
        if (!bubble) return;
        bubble.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
        bubble.style.opacity = '0';
        bubble.style.transform = `translate(${-SIZE}px, ${bubbleY}px) scale(1)`;
    };

    const reset = () => {
        start = null;
        engaged = false;
        samples = [];
        armed = false;
        window.removeEventListener('touchmove', onMove, true);
    };

    function onMove(e) {
        if (!start) return;
        const t = e.touches[0];
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        if (!engaged) {
            if (dx < -ENGAGE_SLOP || (Math.abs(dy) > ENGAGE_SLOP && Math.abs(dy) >= Math.abs(dx))) { reset(); return; }
            if (!(dx > ENGAGE_SLOP && dx > Math.abs(dy))) return;
            engaged = true;
        }
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        samples.push({ x: t.clientX, t: e.timeStamp });
        samples = samples.filter(s => e.timeStamp - s.t <= VELOCITY_WINDOW);
        armed = willGoBack(dx, recentVelocity(samples, e.timeStamp));
        render(dx, t.clientY, armed);
    }

    const onStart = (e) => {
        reset();
        if (e.touches.length !== 1) return;
        const t = e.touches[0];
        if (t.clientX > EDGE_ZONE) return;
        start = { x: t.clientX, y: t.clientY };
        samples = [{ x: t.clientX, t: e.timeStamp }];
        window.addEventListener('touchmove', onMove, { capture: true, passive: false });
    };

    const onEnd = (e) => {
        const go = engaged && armed && e.type === 'touchend';
        const wasEngaged = engaged;
        reset();
        if (wasEngaged) hide();
        if (go) goBack();
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
        window.removeEventListener('touchstart', onStart);
        window.removeEventListener('touchend', onEnd);
        window.removeEventListener('touchcancel', onEnd);
        reset();
        if (bubble) { bubble.remove(); bubble = null; }
    };
}
