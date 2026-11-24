import { useEffect, useRef, useState } from 'react';
import { useLang } from '../context/LangContext';
import CardSwap, { Card } from './CardSwap';
import AiFlowStepper from './AiFlowStepper';
import NotchCard from './NotchCard';
import WorkCube, { type CubeWork } from './WorkCube';
import { useLiveTiles } from '../utils/useLiveTiles';
import { chunkLines } from '../utils/chunkLines';
import { scrollToSectionAligned } from '../utils/navHeader';
import { useProfileTilt } from '../utils/useProfileTilt';
import { useDigitWheel } from '../utils/useDigitWheel';
import { useCardGlow } from '../utils/useCardGlow';
import { PROJECTS } from '../data/projects';

// The Overview wall, right under the hero: one tile per part of the site
// (profile, a Web and an App work, tools, How I Design, the AI workflow,
// the stats, Service Domains, availability), each an entry to its deeper
// section. Desktop wraps it in the hero's own notched frame (same path,
// stroke and glow; the navbar sits in its top-left notch and menu bar, the
// AI ask strip and chat button in its bottom-right one). The layout was
// drafted in the Claude Design canvas "Overview Bento Wall" (Layout A).

// One representative project cover per Service Domains industry, reused
// from the portfolio project images.
export const DOMAIN_COVERS = [
  { label: 'Public Sector', img: './img/my_portfolio/police.webp', tone: '#24589A' },
  { label: 'Healthcare', img: './img/my_portfolio/student.webp', tone: '#7A1A22' },
  { label: 'Transport', img: './img/my_portfolio/Taoyuan_MRT.webp', tone: '#7B4FD6' },
  { label: 'Finance', img: './img/my_portfolio/coin.webp', tone: '#7E8C2E' },
  { label: 'Entertainment', img: './img/my_portfolio/stream.webp', tone: '#12907E' },
  { label: 'Manufacturing', img: './img/my_portfolio/CNC.webp', tone: '#2F78B8' },
];

// The works wall's three live tiles (Windows 8 style, rolling to the next
// work in turn): two App tiles on the left, one big Web tile on the right.
export const WALL_TILES = [
  ['p2', 'p6'],
  ['p4', 'p8'],
  ['p1', 'p3', 'p13', 'p5'],
] as const;

// Tools: the design software row, then the web skills row.
export const DESIGN_TOOLS = [
  { name: 'Figma', img: './img/others/Figma_logo.png' },
  { name: 'Adobe XD', img: './img/others/Adobe_XD_logo.png' },
  { name: 'Spline', img: './img/others/Spline_logo.webp' },
  { name: 'Blender', img: './img/others/Blender_logo.png' },
  { name: 'Photoshop', img: './img/others/Photoshop_logo.png' },
  { name: 'Illustrator', img: './img/others/Illustrator_logo.png' },
  { name: 'Lightroom', img: './img/others/Lightroom_logo.png' },
];
export const WEB_SKILLS = [
  { name: 'HTML', icon: 'html5/E34F26' },
  { name: 'CSS', icon: 'css/663399' },
  { name: 'JavaScript', icon: 'javascript/F7DF1E' },
  { name: 'TypeScript', icon: 'typescript/3178C6' },
  { name: 'React', icon: 'react/61DAFB' },
  { name: 'Tailwind CSS', icon: 'tailwindcss/06B6D4' },
  { name: 'GSAP', icon: 'gsap/0AE448' },
  { name: 'Vite', icon: 'vite/9135FF' },
];

// How I Design: the four steps the card's images cycle through (one every
// STEP_MS, CSS keyframes in portfolio.css), a dot for each.
// The Freelance process's six steps, by their names (and illustrations)
// in My Design Process below.
export const DESIGN_STEPS = ['Intake', 'AI Brief', 'Triage', 'Discovery', 'Proposal', 'Delivery'] as const;
export const STEP_MS = 3000;

// The availability card's links (the same as Contact's)
const GITHUB_URL = 'https://github.com/Lagrange1994';
const EMAIL = 'lyfun0202@gmail.com';

function useLightTheme() {
  const read = () => typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light';
  const [light, setLight] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setLight(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  return light;
}

const Digits = () => (
  <div className="digit-col">
    <div className="digit-col-inner">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <span key={n}>{n}</span>)}
    </div>
  </div>
);

// Desktop (>=1025px): the wall is laid out on the canvas's rows (848px tall: its 920 less the 56px notch row and its gap),
// at least WALL_MIN_W wide, and scaled as one piece to the section's width,
// so a narrower screen shrinks the whole wall instead of squeezing its rows
// and cropping tiles; spare width just widens the columns. Never above 1:
// the 4K scale lock already maps big screens to the 1920 canvas. Below
// 1025px the wall is a plain stacked grid and the scale is unused.
export const WALL_MIN_W = 1600;
export const WALL_H = 848;
export function wallScale(fitW: number): number {
  const s = Math.min(fitW / WALL_MIN_W, 1);
  return s > 0 ? s : 1;
}

export default function OverviewSection() {
  const { t } = useLang();
  const light = useLightTheme();
  const fitRef = useRef<HTMLDivElement>(null);
  const worksRef = useRef<HTMLDivElement>(null);
  const steps = useLiveTiles(WALL_TILES.length, worksRef);

  useProfileTilt();
  useDigitWheel('overview-grid');
  useCardGlow('overview');

  useEffect(() => {
    const fit = fitRef.current;
    if (!fit) return;
    const apply = () => fit.style.setProperty('--wall-scale', String(wallScale(fit.clientWidth)));
    apply();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(apply);
    ro.observe(fit);
    return () => ro.disconnect();
  }, []);

  // Service Domains caption: the six industries as whole lines (Chinese two
  // lines of three, English three lines of two), so it never wraps mid-list.
  const domainsSeparator = t.about_domains_summary.includes('・') ? '・' : ' · ';
  const domainsWords = t.about_domains_summary.split(/[・·]/).map(w => w.trim());
  const domainsLines = chunkLines(domainsWords, domainsSeparator === '・' ? 3 : 2, domainsSeparator);

  const title = (id: string) => (t as unknown as Record<string, string>)[`${id}_title`];
  const tiles: CubeWork[][] = WALL_TILES.map(ids => ids.map(id => {
    const p = PROJECTS.find(x => x.id === id)!;
    return { id, link: p.link, img: p.img, title: title(id), kind: p.category === 'mobile' ? 'App' : 'Web' };
  }));

  return (
    <div className="section-wrapper">
      <section id="overview" className="section overview">
        <div className="section-label rise-soft">Overview</div>
        {/* the site's headline and lead, above the wall */}
        <div className="overview-headline">
          <h2 className="about-h2 rise-soft" dangerouslySetInnerHTML={{ __html: t.overview_headline }} />
          <p className="about-lead rise-soft" dangerouslySetInnerHTML={{ __html: t.overview_lead }} />
        </div>
        <div className="overview-fit" ref={fitRef}>
        <div className="overview-grid" id="overview-grid">

          {/* Profile: the pc-card, at the column's full height */}
          <div className="overview-area-profile overview-profile rise-card">
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

          {/* The works: three live tiles, each rolling to its next work in
              turn; the big Web one carries the wall's only "all work" button */}
          <div className="overview-area-works overview-works" ref={worksRef}>
            <div className="bento-card overview-tile overview-tile--a rise-card">
              <WorkCube works={tiles[0]} step={steps[0]} />
            </div>
            <div className="bento-card overview-tile overview-tile--b rise-card">
              <WorkCube works={tiles[1]} step={steps[1]} />
            </div>
            <NotchCard
              area="overview-tile-big"
              side="right"
              shadow={false}
              className="bento-card overview-tile overview-tile--web rise-card"
              notch={
                <button type="button" className="about-more about-action" onClick={() => scrollToSectionAligned('portfolio')}>
                  {t.overview_all_work} <span aria-hidden="true">→</span>
                </button>
              }
            >
              <WorkCube works={tiles[2]} step={steps[2]} />
            </NotchCard>
          </div>

          {/* Tools: software over web skills */}
          <div className="overview-area-tools overview-tools">
            <div className="bento-card overview-tool-row overview-tool-row--design rise-card" aria-label="Design tools">
              {/* marquee: the list twice, the copy hidden from assistive tech */}
              <div className="overview-tool-track">
                {[...DESIGN_TOOLS, ...DESIGN_TOOLS].map((tool, i) => (
                  <span key={i} className="overview-tool" title={tool.name} aria-hidden={i >= DESIGN_TOOLS.length || undefined}>
                    <img src={tool.img} alt={i < DESIGN_TOOLS.length ? tool.name : ''} loading="lazy" />
                  </span>
                ))}
              </div>
            </div>
            <div className="bento-card overview-tool-row overview-tool-row--web rise-card" aria-label="Web skills">
              <div className="overview-tool-track overview-tool-track--reverse">
                {[...WEB_SKILLS, ...WEB_SKILLS].map((s, i) => (
                  <span key={i} className="overview-tool overview-tool--icon" title={s.name} aria-hidden={i >= WEB_SKILLS.length || undefined}>
                    <img src={`https://cdn.simpleicons.org/${s.icon}`} alt={i < WEB_SKILLS.length ? s.name : ''} loading="lazy" />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* How I Design: the steps' illustrations in turn, with the step
              chips lighting up in sync; the full process in #process */}
          <NotchCard
            area="overview-area-design"
            side="right"
            shadow={false}
            className="bento-card overview-design rise-card"
            notch={
              <button type="button" className="about-more about-action" onClick={() => scrollToSectionAligned('process')}>
                {t.overview_process_more} <span aria-hidden="true">→</span>
              </button>
            }
          >
            {DESIGN_STEPS.map((s, i) => (
              <img
                key={s}
                className="overview-design-img"
                src={`./img/process/${s}${light ? '_l_w' : '_w'}.webp`}
                alt=""
                loading="lazy"
                style={{ animationDelay: `${i * STEP_MS}ms` }}
              />
            ))}
            <span className="overview-design-scrim" aria-hidden="true" />
            <div className="overview-design-head">
              <div className="bento-label">How I Design</div>
              {/* the current step's name, swiped in with the image's cycle
                  (one name per STEP_MS, same offsets as the images) */}
              <span className="overview-design-sub" aria-live="off">
                {DESIGN_STEPS.map((s, i) => (
                  <span key={s} className="overview-design-step-name" style={{ animationDelay: `${i * STEP_MS}ms` }}
                    aria-hidden={i > 0 || undefined}>{s}</span>
                ))}
              </span>
            </div>
            <div className="overview-design-steps" role="list" aria-label="Design steps">
              {DESIGN_STEPS.map((s, i) => (
                <span key={s} className="overview-design-step-wrap" role="listitem">
                  <span className="overview-design-chip" title={s} style={{ animationDelay: `${i * STEP_MS}ms` }}>
                    <span className="overview-sr">{s}</span>
                  </span>
                </span>
              ))}
            </div>
          </NotchCard>

          {/* AI workflow: the horizontal stepper; the full workflow in How I
              Use AI (#my-skills) */}
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

          {/* Years / Projects */}
          <div className="overview-stats">
            <div className="bento-card card-spotlight sc-card bento-stat-big bento-area-years rise-card">
              <span className="card-glass-highlight" aria-hidden="true" />
              <div className="stat-glass-icon" aria-hidden="true"><i className="ph-bold ph-clock" /></div>
              <div className="bento-label">{t.about_stat_years_label}</div>
              <div className="bento-num-center">
                <div className="stat-num-wrap" data-value="5">
                  <Digits />
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
                  <Digits />
                  <Digits />
                  <span className="stat-suffix bento-accent">+</span>
                </div>
              </div>
            </div>
            <span className="bento-shadow bento-area-projects" aria-hidden="true" />
          </div>

          {/* Service Domains */}
          <div className="bento-card bento-purple card-spotlight sc-card bento-stat-big bento-area-domains rise-card">
            <span className="card-glass-highlight" aria-hidden="true" />
            <div className="bento-label">{t.about_stat_domains_label}</div>
            <div className="bento-num-center">
              <div className="stat-num-wrap" data-value={String(DOMAIN_COVERS.length)}>
                <Digits />
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
                    <span className="domain-cover-label" aria-hidden="true" style={{ ['--label-bg' as string]: d.tone }}>{t.about_domain_labels.split('|')[i]}</span>
                  </Card>
                ))}
              </CardSwap>
            </div>
            <span className="domains-scrim" aria-hidden="true" />
          </div>
          <span className="bento-shadow bento-area-domains" aria-hidden="true" />

          {/* Availability: status and terms; GitHub, Email and 聯絡我 in
              the bottom-right notch */}
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
            <div className="bento-text bento-points about-cta-points">
              <span className="bento-point-rows" dangerouslySetInnerHTML={{ __html: t.about_cta_text }} />
              <span className="bento-point">
                <span className="bento-point-label"><i className="ph-bold ph-clock" aria-hidden="true" />{t.about_reply_label}</span>
                <span>{t.about_reply}</span>
              </span>
            </div>
          </NotchCard>

        </div>
        </div>
      </section>
    </div>
  );
}
