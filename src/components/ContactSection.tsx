import { useEffect, useRef } from 'react';
import { useLang } from '../context/LangContext';
import SpecularOverlay from './SpecularOverlay';

export default function ContactSection() {
  const { t } = useLang();
  const sendEmailRef = useRef(null);

  // Back-to-top: toggle .visible class based on scroll position
  useEffect(() => {
    const onScroll = () => {
      const btn = document.getElementById('back-to-top');
      if (btn) btn.classList.toggle('visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Spotlight card effect — scoped to this section's own root; see the
  // matching comment in SkillsSection.tsx (all three sections run this same
  // effect and an unscoped query would cross-contaminate).
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('#contact .sc-card').forEach(card => {
      if (card.querySelector(':scope > .sc-overlay')) return;
      const ov = document.createElement('div');
      ov.className = 'sc-overlay';
      card.insertBefore(ov, card.firstChild);

      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--sc-x', (e.clientX - r.left) + 'px');
        card.style.setProperty('--sc-y', (e.clientY - r.top) + 'px');
      };
      const onLeave = () => {
        card.style.setProperty('--sc-x', '-500px');
        card.style.setProperty('--sc-y', '-500px');
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }, []);

  return (
    <>
      <div className="section-wrapper">
        <section id="contact" className="section">
          <div className="section-label rise-soft">Contact Me</div>
          <h2 className="contact-headline rise-soft">
            Let&apos;s build something <span className="gradient-text">worth using.</span>
          </h2>
          <p className="contact-sub rise-soft">{t.contact_sub}</p>

          <div className="line-banner rise-card sc-card">
            <div className="line-icon-box">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0" />
              </svg>
            </div>
            <div>
              <div className="line-eyebrow">{t.line_eyebrow}</div>
              <div className="line-title">{t.line_title}</div>
              <div className="line-desc">{t.line_desc}</div>
            </div>
            <div className="line-cta">
              <a
                className="line-btn"
                href="https://line.me/R/ti/p/@072fubpj"
                target="_blank"
                rel="noreferrer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0" />
                </svg>
                <span>{t.line_btn}</span>
              </a>
              <div className="line-id">官方帳號 <span>@072fubpj</span></div>
            </div>
          </div>

          <div className="contact-two-col">
            <div className="contact-card sc-card rise-card">
              <div className="card-title">Contact Info</div>
              <div className="crow">
                <div className="icon-circle"><i className="ph-fill ph-map-pin" style={{ fontSize: '18px' }}></i></div>
                <div>
                  <div className="rl">Location</div>
                  <div className="rv">Taipei, Taiwan</div>
                </div>
              </div>
              <div className="crow">
                <div className="icon-circle"><i className="ph-fill ph-envelope-simple" style={{ fontSize: '18px' }}></i></div>
                <div>
                  <div className="rl">Email</div>
                  <div className="rv"><a href="mailto:lyfun0202@gmail.com">lyfun0202@gmail.com</a></div>
                </div>
              </div>
              <div className="crow">
                <div className="icon-circle"><i className="ph-fill ph-phone" style={{ fontSize: '18px' }}></i></div>
                <div>
                  <div className="rl">Phone</div>
                  <div className="rv">+886-928051947</div>
                </div>
              </div>
            </div>

            <div className="rise-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="contact-card sc-card" style={{ flex: 1 }}>
                <div className="card-title">Follow Me</div>
                <div className="social-links">
                  <a className="slink" href="https://github.com/Lagrange1994" target="_blank" rel="noreferrer">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    <span className="sn">GitHub</span><span className="sv">Lagrange1994</span>
                  </a>
                  <a className="slink" href="https://lagrange1994.github.io/TimLinPortfolio" target="_blank" rel="noreferrer">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <path d="M8 21h8M12 17v4" />
                    </svg>
                    <span className="sn">Portfolio</span><span className="sv">lagrange1994.github.io</span>
                  </a>
                </div>
              </div>
              <div className="cta-strip sc-card">
                <div className="cta-txt">
                  <strong>{t.open_for_work}</strong><br />
                  <span className="cta-txt-sub">{t.open_for_work_sub}</span>
                </div>
                <button
                  ref={sendEmailRef}
                  className="btn-glass btn-grad"
                  style={{ padding: '9px 20px', borderRadius: '9999px', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={() => { window.location.href = 'mailto:lyfun0202@gmail.com'; }}
                >
                  Send Email ↗
                </button>
                <SpecularOverlay
                  targetRef={sendEmailRef}
                  lineColor="#FF6584"
                  baseColor="#6C63FF"
                  proximity={220}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
            <span className="gradient-text-brand">Tim</span><span style={{ color: '#fff' }}>Lin</span>
          </div>
          <p>UI/UX Designer &amp; Web Developer</p>
        </div>
        <p>© 2025 Tim Lin. All rights reserved.</p>
      </footer>

      {/* BACK TO TOP */}
      <button id="back-to-top" className="btn-glass btn-grad" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <i className="fas fa-arrow-up"></i>
      </button>
    </>
  );
}
