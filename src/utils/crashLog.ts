// Diagnostic for phone-only "page reloads on its own" reports that can't be
// reproduced on desktop. Keeps a small rolling event log in sessionStorage
// (survives a reload/tab-discard restore) plus a flag set on a clean
// pagehide. If the next load finds the flag missing, the previous session
// died abnormally (renderer crash / OOM discard) and the log's tail shows
// what it was doing. The overlay only renders with ?debug in the URL, so
// normal visitors never see it.
const LOG_KEY = '__crashLog';
const CLEAN_KEY = '__cleanExit';
const MAX_ENTRIES = 40;

function readLog(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

function push(msg: string) {
  try {
    const log = readLog();
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    const heap = mem ? ` heap=${Math.round(mem.usedJSHeapSize / 1048576)}MB` : '';
    log.push(`${new Date().toISOString().slice(11, 23)} y=${Math.round(window.scrollY)} h=${document.documentElement.scrollHeight} ${msg}${heap}`);
    sessionStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-MAX_ENTRIES)));
  } catch {
    // storage unavailable (private mode) — diagnostics just go silent.
  }
}

export function initCrashLog() {
  let previous: string[] = [];
  let crashed = false;
  try {
    previous = readLog();
    // Flag present = last session ended via pagehide (normal nav/reload
    // triggered by the page). Absent + a non-empty log = abnormal death.
    crashed = previous.length > 0 && sessionStorage.getItem(CLEAN_KEY) !== '1';
    sessionStorage.removeItem(CLEAN_KEY);
    sessionStorage.setItem(LOG_KEY, '[]');
  } catch {
    return;
  }

  push('load');

  let lastScrollLog = 0;
  window.addEventListener('scroll', () => {
    const now = Date.now();
    if (now - lastScrollLog < 500) return;
    lastScrollLog = now;
    push('scroll');
  }, { passive: true });
  window.addEventListener('resize', () => push(`resize ${window.innerWidth}x${window.innerHeight}`));
  window.addEventListener('error', (e) => push(`error ${e.message}`));
  window.addEventListener('unhandledrejection', () => push('unhandledrejection'));
  document.addEventListener('visibilitychange', () => push(`visibility=${document.visibilityState}`));
  window.addEventListener('pagehide', (e) => {
    push(`pagehide persisted=${e.persisted}`);
    try { sessionStorage.setItem(CLEAN_KEY, '1'); } catch { /* ignore */ }
  });
  document.addEventListener('webglcontextlost', () => push('webglcontextlost'), true);

  if (new URLSearchParams(location.search).has('debug') && previous.length > 0) {
    const box = document.createElement('pre');
    box.style.cssText = 'position:fixed;left:0;right:0;bottom:0;max-height:45vh;overflow:auto;margin:0;padding:8px;z-index:2147483647;background:#000c;color:#0f0;font:10px/1.3 monospace;white-space:pre-wrap;';
    box.textContent = `previous session ${crashed ? 'DIED ABNORMALLY' : 'ended via pagehide'}\n${previous.join('\n')}`;
    box.addEventListener('click', () => box.remove());
    document.body.appendChild(box);
  }
}
