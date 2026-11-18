import { useEffect } from 'react';

// Profile card 3D tilt (the pc-card: #profile-card-wrap / -shell / -el) —
// pointer-based, no gate or filter (restored to the original working
// behavior). An earlier matchMedia('(hover:none)') gate and a later
// pointerType filter both wrongly disabled it for real mouse users on some
// devices; pointerleave still resets it on touch. Moved out of
// AboutSection when the card moved to the Overview wall.
export function useProfileTilt() {
  useEffect(() => {
    const wrap = document.getElementById('profile-card-wrap') as HTMLElement | null;
    const shell = document.getElementById('profile-card-shell') as HTMLElement | null;
    const card = document.getElementById('profile-card-el') as HTMLElement | null;
    if (!wrap || !shell || !card) return;

    let rafId: number | null = null, running = false, lastTs = 0;
    let curX = 0, curY = 0, tgtX = 0, tgtY = 0;
    const DEFAULT_TAU = 0.14, INITIAL_TAU = 0.6;
    let initialUntil = 0;
    let leaveRaf: number | null = null, enterTimer: ReturnType<typeof setTimeout> | null = null;

    function clampN(v: number, lo: number, hi: number) { return Math.min(Math.max(v, lo), hi); }
    function adj(v: number, f0: number, f1: number, t0: number, t1: number) {
      return parseFloat((t0 + (t1 - t0) * (v - f0) / (f1 - f0)).toFixed(3));
    }

    function applyXY(x: number, y: number) {
      const w = shell!.clientWidth || 1;
      const h = shell!.clientHeight || 1;
      const px = clampN((100 / w) * x, 0, 100);
      const py = clampN((100 / h) * y, 0, 100);
      const cx = px - 50, cy = py - 50;
      wrap!.style.setProperty('--pointer-x', px + '%');
      wrap!.style.setProperty('--pointer-y', py + '%');
      wrap!.style.setProperty('--background-x', adj(px, 0, 100, 35, 65) + '%');
      wrap!.style.setProperty('--background-y', adj(py, 0, 100, 35, 65) + '%');
      wrap!.style.setProperty('--pointer-from-center', String(clampN(Math.hypot(py - 50, px - 50) / 50, 0, 1)));
      wrap!.style.setProperty('--pointer-from-top', String(py / 100));
      wrap!.style.setProperty('--pointer-from-left', String(px / 100));
      wrap!.style.setProperty('--rotate-x', parseFloat((-(cx / 5)).toFixed(3)) + 'deg');
      wrap!.style.setProperty('--rotate-y', parseFloat((cy / 4).toFixed(3)) + 'deg');
    }

    function step(ts: number) {
      if (!running) return;
      if (!lastTs) lastTs = ts;
      const dt = (ts - lastTs) / 1000; lastTs = ts;
      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);
      curX += (tgtX - curX) * k; curY += (tgtY - curY) * k;
      applyXY(curX, curY);
      if (Math.abs(tgtX - curX) > 0.05 || Math.abs(tgtY - curY) > 0.05 || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else { running = false; lastTs = 0; if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }
    }

    function startRaf() { if (running) return; running = true; lastTs = 0; rafId = requestAnimationFrame(step); }
    function setTarget(x: number, y: number) { tgtX = x; tgtY = y; startRaf(); }
    function toCenter() { setTarget(shell!.clientWidth / 2, shell!.clientHeight / 2); }
    function getOff(e: PointerEvent) { const r = shell!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

    const onEnter = (e: PointerEvent) => {
      card!.classList.add('active');
      shell!.classList.add('entering');
      if (enterTimer) clearTimeout(enterTimer);
      enterTimer = setTimeout(() => shell!.classList.remove('entering'), 180);
      const o = getOff(e); setTarget(o.x, o.y);
    };
    const onMove = (e: PointerEvent) => { const o = getOff(e); setTarget(o.x, o.y); };
    const onLeave = () => {
      toCenter();
      function checkSettle() {
        if (Math.hypot(tgtX - curX, tgtY - curY) < 0.6) { card!.classList.remove('active'); leaveRaf = null; }
        else { leaveRaf = requestAnimationFrame(checkSettle); }
      }
      if (leaveRaf) cancelAnimationFrame(leaveRaf);
      leaveRaf = requestAnimationFrame(checkSettle);
    };

    shell.addEventListener('pointerenter', onEnter as EventListener);
    shell.addEventListener('pointermove', onMove as EventListener);
    shell.addEventListener('pointerleave', onLeave);

    // Initial entrance
    curX = (shell.clientWidth || 0) - 70; curY = 60;
    applyXY(curX, curY);
    toCenter();
    initialUntil = performance.now() + 1200;
    startRaf();

    return () => {
      shell.removeEventListener('pointerenter', onEnter as EventListener);
      shell.removeEventListener('pointermove', onMove as EventListener);
      shell.removeEventListener('pointerleave', onLeave);
      if (rafId) cancelAnimationFrame(rafId);
      if (leaveRaf) cancelAnimationFrame(leaveRaf);
      if (enterTimer) clearTimeout(enterTimer);
    };
  }, []);
}
