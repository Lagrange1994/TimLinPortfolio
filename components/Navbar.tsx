import { useState, useEffect, useRef } from 'react';
import { useLang } from '@/context/LanguageContext';

interface NavbarProps {
  currentSection: number;
  onScrollTo: (index: number) => void;
  onMenuOpen: () => void;
  isMenuOpen?: boolean;
}

const NAV_ITEMS = ['Home', 'About', 'Skills', 'Portfolio', 'Contact Me'];

export default function Navbar({ currentSection, onScrollTo, onMenuOpen, isMenuOpen = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { lang, setLang } = useLang();
  const hoverBgRef = useRef<HTMLSpanElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const btn = document.getElementById('lang-menu-btn');
      if (btn && !btn.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleNavHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const bg = hoverBgRef.current;
    const nav = navRef.current;
    if (!bg || !nav) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    bg.style.left = `${rect.left - navRect.left}px`;
    bg.style.width = `${rect.width}px`;
    bg.style.opacity = '1';
  };

  const handleNavLeave = () => {
    if (hoverBgRef.current) hoverBgRef.current.style.opacity = '0';
  };

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300${scrolled ? ' nav-scrolled' : ''}`}
    >
      <div id="nav-container" className="container max-w-8xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <a href="#" className="text-2xl font-bold gradient-text-brand font-heading" onClick={e => { e.preventDefault(); onScrollTo(0); }}>
          Tim<span className="text-white">Lin</span>
        </a>

        {/* Desktop nav */}
        <nav ref={navRef} className="hidden md:flex space-x-2 relative" onMouseLeave={handleNavLeave}>
          <span ref={hoverBgRef} id="nav-hover-bg" />
          {NAV_ITEMS.map((label, i) => (
            <a
              key={i}
              href={`#${['home','about','my-skills','portfolio','contact'][i]}`}
              onClick={e => { e.preventDefault(); onScrollTo(i); }}
              onMouseEnter={handleNavHover}
              className={`nav-link${currentSection === i ? ' active' : ''}`}
              data-index={i}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Language switcher */}
        <div className="hidden md:block relative ml-4">
          <button
            id="lang-menu-btn"
            className="liquid-glass-btn px-4 py-2 rounded-full text-xs font-bold items-center gap-2 group"
            onClick={e => { e.stopPropagation(); setLangOpen(v => !v); }}
          >
            <i className="fas fa-globe text-gray-300 group-hover:text-white transition-colors" />
            <span className="ml-1">{lang === 'zh' ? '繁體中文' : 'English'}</span>
            <i className="fas fa-chevron-down text-[10px] ml-1 opacity-70" />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-3 w-32 bg-[#1E1E1E]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              {(['zh', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => { setLang(l); setLangOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <span>{l === 'zh' ? '繁體中文' : 'English'}</span>
                  {lang === l && <i className="fas fa-check text-xs" style={{ color: '#6C63FF' }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile StaggeredMenu toggle */}
        <button
          id="sm-toggle-btn"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          onClick={onMenuOpen}
        >
          <span className="sm-toggle-textWrap" aria-hidden="true">
            <span className="sm-toggle-textInner">
              <span className="sm-toggle-line">{isMenuOpen ? 'Close' : 'Menu'}</span>
            </span>
          </span>
          <span className="sm-icon" style={{ transform: isMenuOpen ? 'rotate(225deg)' : 'rotate(0deg)', transition: 'transform 0.35s ease' }} aria-hidden="true">
            <span className="sm-icon-line" />
            <span className="sm-icon-line" style={{ transform: 'translate(-50%,-50%) rotate(90deg)' }} />
          </span>
        </button>
      </div>
    </header>
  );
}
