import { useEffect } from 'react';
import { useLang } from '../context/LangContext';
import NotchCard from './NotchCard';
import { PrincipleArtContext, PrincipleArtRules, PrincipleArtSubtract } from './PrincipleArt';

// The portfolio projects behind each intro card's claims, in the order of
// the card's tag labels (about_tags_systems / about_tags_visuals).
const SYSTEMS_LINKS = ['project_04.html', 'project_09.html', 'project_01.html'];
const VISUAL_LINKS = ['project_13.html', 'project_12.html'];

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

        {/* One named-area grid: the headline, the three design principles,
            then the two intro cards. The profile, stats, Service Domains,
            AI workflow and availability cards live on the Overview wall
            (OverviewSection) now. See .about-grid in portfolio.css for the
            per-breakpoint areas. */}
        <div className="about-grid">

          <div className="about-headline">
            <h2
              className="about-h2 rise-soft"
              dangerouslySetInnerHTML={{ __html: t.about_headline }}
            />
            <p className="about-lead rise-soft" dangerouslySetInnerHTML={{ __html: t.about_lead }} />
          </div>

          {/* Design principles: their own row under the headline (desktop:
              one 3-column strip). */}
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

          {/* Desktop: the two intro cards side by side. Tablet/phone:
              display:contents, so the cards sit in the grid directly. */}
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

        </div>
      </section>
    </div>
  );
}
