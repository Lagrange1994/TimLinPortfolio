'use client';

import { useEffect } from 'react';
import { useLang } from '@/context/LanguageContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onScrollTo: (index: number) => void;
}

const NAV_ITEMS = [
  { label: 'Home', index: 0 },
  { label: 'About', index: 1 },
  { label: 'Skills', index: 2 },
  { label: 'Portfolio', index: 3 },
  { label: 'Contact Me', index: 4 },
];

export default function MobileMenu({ isOpen, onClose, onScrollTo }: MobileMenuProps) {
  const { lang, setLang } = useLang();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleNav = (index: number) => {
    onScrollTo(index);
    onClose();
  };

  const copyEmail = async () => {
    await navigator.clipboard.writeText('lyfun0202@gmail.com');
  };

  return (
    <>
      <div className={`menu-overlay${isOpen ? ' active' : ''}`} onClick={onClose} />
      <div className={`mobile-menu${isOpen ? ' active' : ''}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <span className="text-xl font-bold gradient-text-brand font-heading">
              Tim<span className="text-white">Lin</span>
            </span>
            <button className="text-white focus:outline-none" onClick={onClose}>
              <i className="fas fa-times text-xl" />
            </button>
          </div>

          <nav className="flex flex-col space-y-6">
            {NAV_ITEMS.map(item => (
              <a
                key={item.index}
                href="#"
                className="mobile-nav-link text-lg"
                onClick={e => { e.preventDefault(); handleNav(item.index); }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={copyEmail}
              className="liquid-glass-btn px-4 py-2 rounded-full w-full justify-start group active:scale-95 transition-transform"
            >
              <i className="ph-fill ph-envelope-simple mr-2 w-5 text-center" style={{ fontSize: 20 }} />
              <span className="text-xs sm:text-sm tracking-wide">lyfun0202@gmail.com</span>
              <i className="fas fa-copy ml-auto text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <a
              href="https://github.com/Lagrange1994"
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass-btn px-4 py-2 rounded-full w-full justify-start hover:text-white"
            >
              <i className="ph-fill ph-github-logo mr-2 w-5 text-center" style={{ fontSize: 20 }} />
              <span className="text-xs sm:text-sm tracking-wide">github.com/Lagrange1994</span>
            </a>
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <p className="text-gray-400 text-sm mb-3 pl-1">Language</p>
            <div className="flex gap-2">
              <button
                onClick={() => setLang('zh')}
                className={`liquid-glass-btn px-4 py-2 rounded-xl justify-center text-xs sm:text-sm transition-all duration-300${lang === 'zh' ? ' active-lang-btn' : ' opacity-70 border-white/10 bg-transparent text-gray-300'}`}
              >
                繁體中文
              </button>
              <button
                onClick={() => setLang('en')}
                className={`liquid-glass-btn px-4 py-2 rounded-xl justify-center text-xs sm:text-sm transition-all duration-300${lang === 'en' ? ' active-lang-btn' : ' opacity-70 border-white/10 bg-transparent text-gray-300'}`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
