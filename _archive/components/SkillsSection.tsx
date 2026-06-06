import { useEffect, useRef } from 'react';
import { useLang } from '@/context/LanguageContext';

const DESIGN_TOOLS = [
  { name: 'Figma',       src: '/img/others/Figma_logo.png',        sub: 'UI Design' },
  { name: 'Adobe XD',    src: '/img/others/Adobe_XD_logo.png',     sub: 'UI Design' },
  { name: 'Photoshop',   src: '/img/others/Photoshop_logo.png',    sub: 'Image Editing' },
  { name: 'Illustrator', src: '/img/others/Illustrator_logo.png',  sub: 'Vector Design' },
  { name: 'Blender',     src: '/img/others/Blender_logo.png',      sub: '3D Modeling' },
  { name: 'Spline',      src: '/img/others/Spline_logo.webp',      sub: 'Web 3D' },
  { name: 'Dora',        src: '/img/others/Dora_logo.png',         sub: 'No-Code 3D' },
  { name: 'Lightroom',   src: '/img/others/Lightroom_logo.png',    sub: 'Color Grading' },
  { name: 'Krita',       src: '/img/others/Krita_logo.png',        sub: 'Digital Painting' },
];

const FOCUS_AREAS = [
  { label: 'Web System Design', icon: 'fas fa-laptop-code', color: 'text-p-primary', sub: 'Dashboard & backend UI', pct: 60, gradient: 'from-[#6C63FF] to-[#FF6584]' },
  { label: 'Mobile App UI', icon: 'fas fa-mobile-alt', color: 'text-orange-400', sub: 'iOS & Android prototypes', pct: 30, gradient: 'from-orange-400 to-yellow-400' },
  { label: '3D & Motion', icon: 'fas fa-cube', color: 'text-pink-500', sub: 'Interactive web experiences', pct: 10, gradient: 'from-red-500 to-pink-500' },
];

export default function SkillsSection() {
  const { t } = useLang();
  const counterRef = useRef<HTMLSpanElement>(null);
  const barsAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || barsAnimated.current) return;
          barsAnimated.current = true;
          document.querySelectorAll<HTMLElement>('.progress-bar-fill').forEach(bar => {
            const target = bar.dataset.width ?? '0%';
            bar.style.width = target;
          });
          if (counterRef.current) {
            let n = 0;
            const interval = setInterval(() => {
              n++;
              if (counterRef.current) counterRef.current.textContent = String(n);
              if (n >= 12) clearInterval(interval);
            }, 80);
          }
        });
      },
      { threshold: 0.3 }
    );
    const section = document.getElementById('my-skills');
    if (section) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="my-skills" className="snap-section md:flex md:items-center relative">
      <div className="container max-w-8xl mx-auto px-8 w-full">
        <div className="section-header stagger-item">
          <h2>My <span className="gradient-text">Skills</span></h2>
        </div>

        <div className="dashboard-grid grid grid-cols-1 md:grid-cols-4 gap-6 w-full stagger-item">

          {/* Design Tools (9 cards, 2×md:3 columns) */}
          <div className="design-tools-area md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {DESIGN_TOOLS.map(tool => (
              <div key={tool.name} className="card p-3 md:p-4 rounded-2xl skill-card flex flex-row items-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative">
                <div className="skill-icon mr-1.5 mb-0 w-12 h-12 md:w-16 md:h-16 p-2 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                  <img src={tool.src} alt={tool.name} width={48} height={48} className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col items-start">
                  <strong className="text-white text-base md:text-lg">{tool.name}</strong>
                  <span className="text-gray-400 text-xs md:text-sm mt-1">{tool.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tech Stack */}
          <div className="card dev-skills-panel p-4 md:p-6 rounded-2xl md:col-span-2 md:row-span-2 flex flex-col justify-center">
            <div className="mb-2 md:mb-4 flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold font-heading text-white">Tech Stack</h2>
            </div>
            <div className="space-y-3 md:space-y-4">
              <div className="skill-group bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl hover:bg-blue-500/20 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-white text-base font-heading flex items-center gap-3">
                    <i className="fab fa-html5 text-blue-500 text-xl" /> HTML / Structure
                  </h3>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold tracking-wide rounded-full border border-blue-500/20">DESIGN-READY</span>
                </div>
                <p className="text-gray-300 text-xs md:text-base leading-relaxed pl-1">{t.skill_html}</p>
              </div>
              <div className="skill-group bg-[#FF6584]/10 border border-[#FF6584]/20 p-4 rounded-xl hover:bg-[#FF6584]/20 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-white text-base font-heading flex items-center gap-3">
                    <i className="fab fa-css3-alt text-[#FF6584] text-xl" /> CSS / Tailwind
                  </h3>
                  <span className="px-3 py-1 bg-[#FF6584]/10 text-[#FF6584] text-[10px] font-bold tracking-wide rounded-full border border-[#FF6584]/20">RESPONSIVE</span>
                </div>
                <p className="text-gray-300 text-xs md:text-base leading-relaxed pl-1">{t.skill_css}</p>
              </div>
              <div className="skill-group bg-orange-400/10 border border-orange-400/20 p-4 rounded-xl hover:bg-orange-400/20 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-white text-base font-heading flex items-center gap-3">
                    <i className="fab fa-js text-orange-400 text-xl" /> JavaScript
                  </h3>
                  <span className="px-3 py-1 bg-orange-400/10 text-orange-400 text-[10px] font-bold tracking-wide rounded-full border border-orange-400/20">AI-ASSISTED</span>
                </div>
                <p className="text-gray-300 text-xs md:text-base leading-relaxed pl-1">{t.skill_js}</p>
              </div>
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-4 rounded-xl relative overflow-hidden group">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-white text-lg font-heading flex items-center gap-2">
                    <i className="fas fa-robot text-cyan-300 text-xl" /> AI-Tools
                  </h3>
                  <span className="px-3 py-1 bg-cyan-400/20 text-cyan-300 text-[10px] font-bold rounded-full border border-cyan-400/30 flex items-center gap-1">
                    <i className="ph ph-circle-fill" style={{ fontSize: 14 }} />ADVANCED
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="pl-3 border-l-2 border-cyan-500">
                    <h4 className="text-cyan-300 font-bold text-sm mb-1">Gemini / Claude</h4>
                    <p className="text-gray-300 text-xs md:text-base leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: t.ai_gemini_1 }} />
                    <p className="text-gray-300 text-xs md:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: t.ai_gemini_2 }} />
                  </div>
                  <div className="pl-3 border-l-2 border-pink-500">
                    <h4 className="text-pink-300 font-bold text-sm mb-1">Rodin / Stitch</h4>
                    <p className="text-gray-300 text-xs md:text-base leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: t.ai_rodin_1 }} />
                    <p className="text-gray-300 text-xs md:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: t.ai_rodin_2 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Shipped counter */}
          <div className="card stat-card p-4 md:p-6 rounded-2xl md:col-span-1 flex flex-col relative overflow-hidden group">
            <div className="mb-2 md:mb-4 border-b border-white/10 pb-2 w-full">
              <h3 className="text-lg md:text-xl font-bold font-heading text-white">Projects Shipped</h3>
            </div>
            <div className="flex-grow flex flex-col justify-center">
              <div className="flex items-baseline gap-1 mb-2">
                <span ref={counterRef} className="text-6xl md:text-8xl font-bold gradient-text-brand font-heading">0</span>
                <span className="text-3xl md:text-4xl font-bold text-white">+</span>
              </div>
              <div className="text-green-400 text-sm font-bold flex items-center gap-2">
                <span className="bg-green-500/20 p-1 rounded-md"><i className="fas fa-arrow-up" /></span>
                projects
              </div>
            </div>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#6C63FF] opacity-20 blur-3xl rounded-full pointer-events-none group-hover:opacity-30 transition-opacity duration-500" />
          </div>

          {/* Focus Areas */}
          <div className="card project-distribution p-4 md:p-6 rounded-2xl md:col-span-1 flex flex-col">
            <div className="mb-4 border-b border-white/10 pb-2 w-full">
              <h3 className="text-lg md:text-xl font-bold font-heading text-white">Focus Areas</h3>
            </div>
            <div className="flex flex-col justify-center flex-grow space-y-3">
              {FOCUS_AREAS.map(area => (
                <div key={area.label}>
                  <div className="flex justify-between text-xs md:text-base mb-1">
                    <span className="text-gray-300 font-medium">
                      <i className={`${area.icon} mr-2 ${area.color}`} />{area.label}
                    </span>
                    <span className="text-white font-bold">{area.pct}%</span>
                  </div>
                  <p className="text-gray-500 text-[10px] md:text-xs mb-2 pl-5">{area.sub}</p>
                  <div className="progress-bg">
                    <div className={`progress-bar-fill bg-gradient-to-r ${area.gradient}`} data-width={`${area.pct}%`} style={{ width: 0 }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-[10px] md:text-xs mt-4 pt-3 border-t border-white/5">
              Based on 13 delivered projects
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
