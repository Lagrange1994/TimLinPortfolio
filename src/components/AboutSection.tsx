import { useEffect } from 'react';
import { useLang } from '../context/LangContext';
import CardSwap, { Card } from './CardSwap';
import AiFlowStepper from './AiFlowStepper';
import NotchCard from './NotchCard';
import { PrincipleArtContext, PrincipleArtRules, PrincipleArtSubtract } from './PrincipleArt';
import { chunkLines } from '../utils/chunkLines';
import { scrollToSectionAligned } from '../utils/navHeader';

// One representative project cover per Service Domains chip (Law
// Enforcement/Healthcare/Environmental Monitoring/Entertainment), reused
// from the portfolio project images rather than duplicated assets.
const DOMAIN_COVERS = [
  // police, environmental bureau, reservoir, airport, zoo
  { label: 'Public Sector', img: './img/my_portfolio/police.webp', tone: '#24589A' },
  { label: 'Healthcare', img: './img/my_portfolio/student.webp', tone: '#7A1A22' },
  { label: 'Transport', img: './img/my_portfolio/Taoyuan_MRT.webp', tone: '#7B4FD6' },
  { label: 'Finance', img: './img/my_portfolio/coin.webp', tone: '#7E8C2E' },
  { label: 'Entertainment', img: './img/my_portfolio/stream.webp', tone: '#12907E' },
  { label: 'Manufacturing', img: './img/my_portfolio/CNC.webp', tone: '#2F78B8' },
];

// The portfolio projects behind each intro card's claims, in the order of
// the card's tag labels (about_tags_systems / about_tags_visuals).
const SYSTEMS_LINKS = ['project_04.html', 'project_09.html', 'project_01.html'];
const VISUAL_LINKS = ['project_13.html', 'project_12.html'];

// When the "Now" card (about_now) was last brought up to date: change it
// with the copy, so the card shows the page is kept current.
const NOW_UPDATED = '2026.11';

// The profile column's link buttons (the same as Contact's)
const GITHUB_URL = 'https://github.com/Lagrange1994';
const EMAIL = 'lyfun0202@gmail.com';

// The three design principles row (about_principleN_*): a one-line
// general rule and a scene illustration each, no project tags.
const PRINCIPLES = [1, 2, 3] as const;

// The project tags behind a card's claim, each a link to its page.
function proofTags(labels: string, links: readonly string[]) {
  return labels.split('|').map((label, i) => (
    <a key={links[i]} className="about-proof-tag" href={links[i]}>{label}</a>
  ));
}

export default function AboutSection() {
  const { t } = useLang();

  // Service Domains caption: the six industries as whole lines, so it never
  // wraps mid-list — Chinese two lines of three ("公部門・醫療・交通" /
  // "金融・娛樂・製造"), English (longer words) three lines of two, which
  // keeps it clear of the cover stack on the card's right.
  const domainsSeparator = t.about_domains_summary.includes('・') ? '・' : ' · ';
  const domainsWords = t.about_domains_summary.split(/[・·]/).map(w => w.trim());
  const domainsLines = chunkLines(domainsWords, domainsSeparator === '・' ? 3 : 2, domainsSeparator);

  // Profile card 3D tilt — pointer-based, no gate or filter (restored to the
  // original working behavior). An earlier matchMedia('(hover:none)') gate
  // and a later pointerType filter both wrongly disabled it for real mouse
  // users on some devices; pointerleave still resets it on touch.
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

  // Stat counters digit-wheel — starts spinning random digits as soon as
  // the card mounts (slot-machine flicker), independent of scroll/reveal
  // state, then waits for each card's GSAP rise-reveal (useRiseReveal) to
  // finish settling before smoothly gliding to the real value. Falls back
  // to scroll-into-view triggering (no spin, immediate value) when
  // reduced-motion is on, since useRiseReveal skips the animation (and the
  // 'rise-settled' event) in that case.
  useEffect(() => {
    const statRow = document.getElementById('stat-row');
    if (!statRow) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const spinners = new Map<HTMLElement, number>();

    const SPIN_FLIP_MS = 160;

    function startSpin(inner: HTMLElement, cellH: number) {
      if (spinners.has(inner)) return;
      // Quick flip transition for each random tick (slower 2s CSS
      // transition only kicks back in for the final glide to the real
      // value, see rollWrap below).
      inner.style.transition = `transform ${SPIN_FLIP_MS}ms cubic-bezier(.4,0,.2,1)`;
      const id = window.setInterval(() => {
        const r = Math.floor(Math.random() * 10);
        inner.style.transform = 'translateY(-' + (r * cellH) + 'px)';
      }, SPIN_FLIP_MS);
      spinners.set(inner, id);
    }

    function stopSpin(inner: HTMLElement) {
      const id = spinners.get(inner);
      if (id !== undefined) { window.clearInterval(id); spinners.delete(inner); }
    }

    const rolled = new WeakSet<HTMLElement>();
    function rollWrap(wrap: HTMLElement) {
      if (rolled.has(wrap)) return;
      rolled.add(wrap);
      const value = parseInt(wrap.dataset.value || '0', 10);
      const digits = String(value).split('').map(Number);
      const cols = wrap.querySelectorAll<HTMLElement>('.digit-col');
      cols.forEach((col, i) => {
        const target = digits[i];
        const inner = col.querySelector<HTMLElement>('.digit-col-inner');
        const cellH = col.offsetHeight || 35;
        setTimeout(() => {
          if (!inner) return;
          stopSpin(inner);
          // Re-enable the CSS transition (cleared while spinning) and force
          // a reflow so the glide to the real value animates from whatever
          // random digit the spin last landed on, instead of jumping.
          inner.style.transition = '';
          void inner.offsetHeight;
          inner.style.transform = 'translateY(-' + (target * cellH) + 'px)';
        }, i * 120);
      });
    }

    if (reduceMotion) {
      const rollAll = () => {
        statRow.querySelectorAll<HTMLElement>('.stat-num-wrap').forEach(rollWrap);
      };
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) rollAll(); });
      }, { threshold: 0.1 });
      obs.observe(statRow);
      return () => obs.disconnect();
    }

    statRow.querySelectorAll<HTMLElement>('.stat-num-wrap').forEach(wrap => {
      wrap.querySelectorAll<HTMLElement>('.digit-col').forEach(col => {
        const inner = col.querySelector<HTMLElement>('.digit-col-inner');
        const cellH = col.offsetHeight || 35;
        if (inner) startSpin(inner, cellH);
      });
    });

    const onSettled = (e: Event) => {
      const card = e.target as HTMLElement;
      card.querySelectorAll<HTMLElement>('.stat-num-wrap').forEach(rollWrap);
    };
    statRow.addEventListener('rise-settled', onSettled);
    return () => {
      statRow.removeEventListener('rise-settled', onSettled);
      spinners.forEach(id => window.clearInterval(id));
    };
  }, []);

  // Spotlight card effect — plain mousemove, matching ContactSection's
  // working pattern. No matchMedia gate and no pointerType filter (both
  // wrongly disabled it for real mouse users on some devices).
  useEffect(() => {
    function initSpotlightCardEffect() {
      document.querySelectorAll<HTMLElement>('.card-spotlight').forEach(card => {
        const onMove = (e: MouseEvent) => {
          // Light mode's neumorphism swap forces .card-spotlight::before to
          // opacity:0 !important (portfolio.css) — skip the reflow-triggering
          // getBoundingClientRect() for an effect that can't paint.
          if (document.documentElement.getAttribute('data-theme') === 'light') return;
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
          card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
        };
        card.addEventListener('mousemove', onMove);
      });
    }
    initSpotlightCardEffect();
  }, []);

  // White border-ring hover effect — identical mechanism to
  // ContactSection's working effect: plain mousemove/mouseleave, no
  // matchMedia gate and no pointerType filter (a pointerType filter wrongly
  // bailed on devices reporting a non-'mouse' pointerType, killing it). Bento
  // cards are also .card-spotlight, so drive --mouse-x/y here too so both
  // glow layers track.
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('#about .sc-card').forEach(card => {
      if (card.querySelector(':scope > .sc-overlay')) return;
      const ov = document.createElement('div');
      ov.className = 'sc-overlay';
      card.insertBefore(ov, card.firstChild);

      const onMove = (e: MouseEvent) => {
        // .sc-overlay/.card-spotlight::before are opacity:0 !important in
        // light mode's neumorphism block (portfolio.css) — nothing to paint.
        if (document.documentElement.getAttribute('data-theme') === 'light') return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) + 'px';
        const y = (e.clientY - r.top) + 'px';
        card.style.setProperty('--sc-x', x);
        card.style.setProperty('--sc-y', y);
        card.style.setProperty('--mouse-x', x);
        card.style.setProperty('--mouse-y', y);
      };
      const onLeave = () => {
        card.style.setProperty('--sc-x', '-500px');
        card.style.setProperty('--sc-y', '-500px');
        card.style.setProperty('--mouse-x', '-500px');
        card.style.setProperty('--mouse-y', '-500px');
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }, []);

  // Scroll-reveal (.rise-card/.rise-soft → elastic rise + squash-stretch) is
  // handled site-wide by useRiseReveal(), called once in App.tsx.

  return (
    <div className="section-wrapper">
      <section id="about" className="section">
        <div className="section-label rise-soft">About Me</div>

        {/* One unified named-area grid — photo, headline, intro cards, and
            the stat/chip/workflow cards are all direct grid items, no
            nested sub-grid. See .about-grid in portfolio.css for the
            per-breakpoint areas. id=stat-row keeps the existing digit-wheel
            IntersectionObserver working (it just needs any .stat-num-wrap
            descendants, regardless of DOM depth). */}
        <div className="about-grid" id="stat-row">

          <div className="about-headline">
            <h2
              className="about-h2 rise-soft"
              dangerouslySetInnerHTML={{ __html: t.about_headline }}
            />
            <p className="about-lead rise-soft" dangerouslySetInnerHTML={{ __html: t.about_lead }} />
          </div>

          {/* Design principles: their own row under the headline (desktop:
              one 3-column strip beside the photo). */}
          <div className="about-col about-col--principles">
            {PRINCIPLES.map(n => {
              const key = `about_principle${n}` as const;
              return (
                <NotchCard
                  key={n}
                  area={`bento-area-p${n}`}
                  className="bento-card card-spotlight sc-card bento-principle rise-card"
                  badge={<><span className="about-notch-badge-dot" aria-hidden="true" />DESIGN PRINCIPLE · {String(n).padStart(2, '0')}</>}
                >
                  <span className="card-glass-highlight" aria-hidden="true" />
                  <div className="bento-label">{t[`${key}_title`]}</div>
                  <p className="bento-text">{t[`${key}_text`]}</p>
                  {/* the principle as a scene, across the card's lower half */}
                  {n === 1 ? <PrincipleArtContext modes={t.about_principle1_scenes.split('|')} reach={t.about_principle1_reach.split('|')} />
                    : n === 2 ? <PrincipleArtSubtract />
                    : <PrincipleArtRules states={t.about_principle3_states.split('|')} steps={t.about_principle3_steps.split('|')} />}
                </NotchCard>
              );
            })}
          </div>

          {/* Desktop: photo with the availability card filling the rest of
              the left column. Tablet/phone: display:contents. */}
          <div className="about-col about-col--profile">
          <div className="about-photo rise-card">
            <div className="pc-card-wrapper" id="profile-card-wrap">
              <div className="pc-behind"></div>
              <div className="pc-card-shell" id="profile-card-shell">
                <section className="pc-card" id="profile-card-el">
                  <div className="pc-inside"></div>
                  <div className="pc-shine"></div>
                  <div className="pc-content pc-avatar-content">
                    <img className="avatar" src="./img/about_me.webp" alt="Tim Lin" loading="lazy" />
                  </div>
                  <div className="pc-content">
                    <div className="pc-details">
                      <h3>Tim Lin</h3>
                      <p>UI/UX Product Designer</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* One availability card: status with the GitHub / Email links
              beside it, the terms, then what I'm working on now; 聯絡我 in
              the bottom-right notch (a card's action always sits there). */}
          <NotchCard
            area="bento-area-cta"
            side="right"
            className="bento-card card-spotlight sc-card about-cta-card rise-card"
            notch={<>
                <a className="about-icon-link" href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>
                <a className="about-icon-link" href={`mailto:${EMAIL}`} aria-label="Email">
                  <i className="ph-bold ph-envelope-simple" aria-hidden="true" />
                </a>
                <button type="button" className="about-more btn-glass btn-grad about-cta-btn" onClick={() => scrollToSectionAligned('contact')}>
                  {t.about_cta_button} <span aria-hidden="true">→</span>
                </button>
              </>}
          >
            <span className="card-glass-highlight" aria-hidden="true" />
            <div className="about-status">
              <span className="about-status-dot" aria-hidden="true" />
              {t.about_cta_status}
            </div>
            {/* the terms, then what I'm working on now as a third row */}
            <div className="bento-text bento-points about-cta-points">
              <span className="bento-point-rows" dangerouslySetInnerHTML={{ __html: t.about_cta_text }} />
              {/* the same reply time as Contact's open-for-work strip */}
              <span className="bento-point">
                <span className="bento-point-label"><i className="ph-bold ph-clock" aria-hidden="true" />{t.about_reply_label}</span>
                <span>{t.about_reply}</span>
              </span>
              <span className="bento-point about-now">
                <span className="bento-point-label"><span className="about-now-dot" aria-hidden="true" />{t.about_now_label}</span>
                <span>{t.about_now} <span className="about-now-date">· {NOW_UPDATED}</span></span>
              </span>
            </div>
          </NotchCard>
          </div>

          {/* Desktop: two independent columns beside the photo — the intro
              cards (equal halves) and the stats; their row splits don't have
              to line up. Tablet/phone: display:contents, so the cards sit in
              the grid as before. */}
          <div className="about-col about-col--intro">
          {/* Intro cards — the bio prose (about_p1/about_p2) */}
          <NotchCard
            area="bento-area-intro1"
            side="right"
            className="bento-card bento-violet card-spotlight sc-card rise-card"
            notch={proofTags(t.about_tags_systems, SYSTEMS_LINKS)}
          >
            <span className="card-glass-highlight" aria-hidden="true" />
            <div className="bento-label">{t.about_intro1_label}</div>
            <p className="bento-text bento-points" dangerouslySetInnerHTML={{ __html: t.about_intro1_short }} />
          </NotchCard>

          <NotchCard
            area="bento-area-intro2"
            side="right"
            className="bento-card bento-cyan card-spotlight sc-card rise-card"
            notch={proofTags(t.about_tags_visuals, VISUAL_LINKS)}
          >
            <span className="card-glass-highlight" aria-hidden="true" />
            <div className="bento-label">{t.about_intro2_label}</div>
            <p className="bento-text bento-points" dangerouslySetInnerHTML={{ __html: t.about_intro2_short }} />
          </NotchCard>

          </div>

          <div className="about-col about-col--stats">
          <div className="bento-card card-spotlight sc-card bento-stat-big bento-area-years rise-card">
            <span className="card-glass-highlight" aria-hidden="true" />
            <div className="stat-glass-icon" aria-hidden="true"><i className="ph-bold ph-clock" /></div>
            <div className="bento-label">{t.about_stat_years_label}</div>
            <div className="bento-num-center">
              <div className="stat-num-wrap" data-value="5">
                <div className="digit-col">
                  <div className="digit-col-inner">
                    {[0,1,2,3,4,5,6,7,8,9].map(n => <span key={n}>{n}</span>)}
                  </div>
                </div>
                <span className="stat-suffix bento-accent">+</span>
              </div>
            </div>
          </div>
          <span className="bento-shadow bento-area-years" aria-hidden="true" />

          <div className="bento-card bento-human card-spotlight sc-card bento-stat-big bento-area-projects rise-card">
            <span className="card-glass-highlight" aria-hidden="true" />
            <div className="stat-glass-icon" aria-hidden="true"><i className="ph-bold ph-squares-four" /></div>
            <div className="bento-label">{t.about_stat_projects_label}</div>
            <div className="bento-num-center">
              <div className="stat-num-wrap" data-value="13">
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
                <span className="stat-suffix bento-accent">+</span>
              </div>
            </div>
          </div>
          <span className="bento-shadow bento-area-projects" aria-hidden="true" />

          <div className="bento-card bento-purple card-spotlight sc-card bento-stat-big bento-area-domains rise-card">
            <span className="card-glass-highlight" aria-hidden="true" />
            <div className="bento-label">{t.about_stat_domains_label}</div>
            <div className="bento-num-center">
              <div className="stat-num-wrap" data-value={String(DOMAIN_COVERS.length)}>
                <div className="digit-col">
                  <div className="digit-col-inner">
                    {[0,1,2,3,4,5,6,7,8,9].map(n => <span key={n}>{n}</span>)}
                  </div>
                </div>
              </div>
            </div>
            <p className="bento-caption">
              {domainsLines.map((line, i) => <span key={line}>{i > 0 && <br />}{line}</span>)}
            </p>
            <div className="domain-swap-stage">
              <CardSwap width={216} height={144} cardDistance={18} verticalDistance={16} skewAmount={4} delay={3400} pauseOnHover>
                {DOMAIN_COVERS.map((d, i) => (
                  <Card key={d.label} customClass="domain-cover-card">
                    <img src={d.img} alt={d.label} loading="lazy" />
                    {/* the industry each cover stands for (was the
                        Industry Focus card's chips) */}
                    <span className="domain-cover-label" aria-hidden="true" style={{ ['--label-bg' as string]: d.tone }}>{t.about_domain_labels.split('|')[i]}</span>
                  </Card>
                ))}
              </CardSwap>
            </div>
            <span className="domains-scrim" aria-hidden="true" />
          </div>
          <span className="bento-shadow bento-area-domains" aria-hidden="true" />

          </div>

          {/* the full workflow lives in How I Use AI (#my-skills): a bold
              action button in the card's bottom-right notch */}
          <NotchCard
            area="bento-area-workflow"
            side="right"
            className="bento-card bento-spectrum card-spotlight sc-card bento-card--wide rise-card"
            notch={
              <button type="button" className="about-more about-action" onClick={() => scrollToSectionAligned('my-skills')}>
                {t.about_ai_more} <span aria-hidden="true">→</span>
              </button>
            }
          >
            <span className="card-glass-highlight" aria-hidden="true" />
            <div className="bento-label">{t.about_ai_label}</div>
            <p className="bento-text" dangerouslySetInnerHTML={{ __html: t.about_ai_short }} />
            <AiFlowStepper
              steps={['Make', 'Claude', 'Sheets', 'LINE / Email']}
              icons={[
                'https://cdn.simpleicons.org/make/ffffff',
                'https://cdn.simpleicons.org/claude/ffffff',
                'https://cdn.simpleicons.org/googlesheets/ffffff',
                ['https://cdn.simpleicons.org/line/ffffff', 'https://cdn.simpleicons.org/gmail/ffffff'],
              ]}
            />
          </NotchCard>

        </div>
      </section>
    </div>
  );
}
