import { useEffect } from 'react';
import { useLang } from '../context/LangContext';

export default function AboutSection() {
  const { t } = useLang();

  // Profile card 3D tilt
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
    };
  }, []);

  // Stat counters digit-wheel
  useEffect(() => {
    const statRow = document.getElementById('stat-row');
    if (!statRow) return;
    let triggered = false;

    function rollDigits() {
      if (triggered) return;
      triggered = true;
      const wraps = statRow!.querySelectorAll<HTMLElement>('.stat-num-wrap');
      wraps.forEach(wrap => {
        const value = parseInt(wrap.dataset.value || '0', 10);
        const digits = String(value).split('').map(Number);
        const cols = wrap.querySelectorAll<HTMLElement>('.digit-col');
        cols.forEach((col, i) => {
          const target = digits[i];
          const inner = col.querySelector<HTMLElement>('.digit-col-inner');
          const cellH = col.offsetHeight || 35;
          setTimeout(() => {
            if (inner) inner.style.transform = 'translateY(-' + (target * cellH) + 'px)';
          }, i * 120);
        });
      });
    }

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) rollDigits(); });
    }, { threshold: 0.1 });
    obs.observe(statRow);

    const onScroll = () => {
      const rect = statRow.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) rollDigits();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      obs.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Spotlight card effect
  useEffect(() => {
    function initSpotlightCardEffect() {
      document.querySelectorAll<HTMLElement>('.card-spotlight, .sidebar-block').forEach(card => {
        const onMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
          card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
        };
        card.addEventListener('mousemove', onMove);
      });
    }
    initSpotlightCardEffect();
  }, []);

  return (
    <div className="section-wrapper">
      <section id="about" className="section">
        <div className="section-label fade-in">About Me</div>
        <div className="about-grid stagger-item">

          {/* COL 1: ProfileCard */}
          <div className="about-left">
            <div
              className="pc-card-wrapper"
              id="profile-card-wrap"
              style={{
                ['--inner-gradient' as string]: 'linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)',
                ['--behind-glow-color' as string]: 'rgba(108,99,255,0.55)',
                ['--behind-glow-size' as string]: '50%',
              }}
            >
              <div className="pc-behind"></div>
              <div className="pc-card-shell" id="profile-card-shell">
                <section className="pc-card" id="profile-card-el">
                  <div className="pc-inside"></div>
                  <div className="pc-shine"></div>
                  <div className="pc-content pc-avatar-content">
                    <img className="avatar" src="./img/about_me.png" alt="Tim Lin" loading="lazy" />
                  </div>
                  <div className="pc-content">
                    <div className="pc-details">
                      <h3>Tim Lin</h3>
                      <p>UI/UX Designer</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* COL 2: bio text + stats + AI Workflow */}
          <div className="about-right">
            <div>
              <h2
                className="about-h2 stagger-item"
                dangerouslySetInnerHTML={{ __html: t.about_headline }}
              />
              <div className="about-body">
                <p dangerouslySetInnerHTML={{ __html: t.about_p1 }} />
                <p dangerouslySetInnerHTML={{ __html: t.about_p2 }} />
                <p dangerouslySetInnerHTML={{ __html: t.about_p3 }} />
              </div>
            </div>
            <div className="about-widgets">
              <div className="stat-row" id="stat-row">
                <div className="stat-cell">
                  <div className="stat-num-wrap" data-value="5" data-suffix="+">
                    <div className="digit-col">
                      <div className="digit-col-inner">
                        {[0,1,2,3,4,5,6,7,8,9].map(n => <span key={n}>{n}</span>)}
                      </div>
                    </div>
                    <span className="stat-suffix">+</span>
                  </div>
                  <p className="stat-lbl">Years</p>
                </div>
                <div className="stat-cell">
                  <div className="stat-num-wrap" data-value="10" data-suffix="+">
                    <div className="digit-col">
                      <div className="digit-col-inner">
                        {[0,1,2,3,4,5,6,7,8,9].map(n => <span key={n}>{n}</span>)}
                      </div>
                    </div>
                    <div className="digit-col">
                      <div className="digit-col-inner">
                        {[0,1,2,3,4,5,6,7,8,9].map(n => <span key={n}>{n}</span>)}
                      </div>
                    </div>
                    <span className="stat-suffix">+</span>
                  </div>
                  <p className="stat-lbl">Projects</p>
                </div>
                <div className="stat-cell">
                  <div className="stat-num-wrap" data-value="4" data-suffix="">
                    <div className="digit-col">
                      <div className="digit-col-inner">
                        {[0,1,2,3,4,5,6,7,8,9].map(n => <span key={n}>{n}</span>)}
                      </div>
                    </div>
                  </div>
                  <p className="stat-lbl">Domains</p>
                </div>
              </div>
              <div className="sidebar-block">
                <div className="sb-sub-title">AI Workflow</div>
                <div className="ai-chips">
                  <span className="ai-chip">Make</span>
                  <span className="ai-chip">LINE Bot</span>
                  <span className="ai-chip">Gemini</span>
                  <span className="ai-chip">Google Sheets</span>
                </div>
                <div className="sb-sub-title" style={{ marginTop: '14px' }}>Industry Focus</div>
                <div className="ai-chips">
                  <span className="domain-chip">Law Enforcement</span>
                  <span className="domain-chip">Healthcare</span>
                  <span className="domain-chip">Environmental Monitoring</span>
                  <span className="domain-chip">Entertainment</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
