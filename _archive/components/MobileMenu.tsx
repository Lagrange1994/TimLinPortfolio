import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onScrollTo: (index: number) => void;
}

const NAV_ITEMS = [
  { label: 'Home',      index: 0 },
  { label: 'About',     index: 1 },
  { label: 'Skills',    index: 2 },
  { label: 'Portfolio', index: 3 },
  { label: 'Contact',   index: 4 },
];

export default function MobileMenu({ isOpen, onClose, onScrollTo }: MobileMenuProps) {
  const pre1Ref   = useRef<HTMLDivElement>(null);
  const pre2Ref   = useRef<HTMLDivElement>(null);
  const panelRef  = useRef<HTMLElement>(null);
  const listRef   = useRef<HTMLUListElement>(null);
  const openTlRef  = useRef<gsap.core.Timeline | null>(null);
  const closeTwRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    gsap.set([pre1Ref.current, pre2Ref.current, panelRef.current], { xPercent: 100 });
  }, []);

  useEffect(() => {
    const prelayers = [pre1Ref.current, pre2Ref.current].filter(Boolean) as HTMLElement[];
    const panel = panelRef.current;
    const list  = listRef.current;
    if (!panel) return;

    const ALL      = [...prelayers, panel];
    const itemEls  = () => Array.from(list?.querySelectorAll<HTMLElement>('.sm-panel-itemLabel') ?? []);
    const numEls   = () => Array.from(list?.querySelectorAll<HTMLElement>('.sm-panel-item') ?? []);
    const socTitle = () => panel.querySelector<HTMLElement>('.sm-socials-title');
    const socLinks = () => Array.from(panel.querySelectorAll<HTMLElement>('.sm-socials-link'));

    if (isOpen) {
      if (closeTwRef.current) { closeTwRef.current.kill(); closeTwRef.current = null; }
      if (openTlRef.current) openTlRef.current.kill();

      const its = itemEls(), nums = numEls(), st = socTitle(), sls = socLinks();
      if (its.length)  gsap.set(its,  { yPercent: 140, rotate: 10 });
      if (nums.length) gsap.set(nums, { '--sm-num-opacity': 0 });
      if (st)          gsap.set(st,   { opacity: 0 });
      if (sls.length)  gsap.set(sls,  { y: 25, opacity: 0 });

      const tl = gsap.timeline();
      prelayers.forEach((el, i) =>
        tl.fromTo(el, { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07)
      );
      const pStart = (prelayers.length - 1) * 0.07 + 0.08;
      tl.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.65, ease: 'power4.out' }, pStart);

      const iStart = pStart + 0.65 * 0.15;
      if (its.length) {
        tl.to(its, { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: 0.1 }, iStart);
        if (nums.length) tl.to(nums, { '--sm-num-opacity': 1, duration: 0.6, ease: 'power2.out', stagger: 0.08 }, iStart + 0.1);
      }
      const sStart = pStart + 0.65 * 0.4;
      if (st)         tl.to(st,  { opacity: 1, duration: 0.5, ease: 'power2.out' }, sStart);
      if (sls.length) tl.to(sls, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.08 }, sStart + 0.04);

      openTlRef.current = tl;
      document.body.style.overflow = 'hidden';
    } else {
      if (openTlRef.current) { openTlRef.current.kill(); openTlRef.current = null; }
      if (closeTwRef.current) closeTwRef.current.kill();

      closeTwRef.current = gsap.to(ALL, {
        xPercent: 100, duration: 0.32, ease: 'power3.in', overwrite: 'auto',
        onComplete() {
          const its = itemEls(), nums = numEls(), st = socTitle(), sls = socLinks();
          if (its.length)  gsap.set(its,  { yPercent: 140, rotate: 10 });
          if (nums.length) gsap.set(nums, { '--sm-num-opacity': 0 });
          if (st)          gsap.set(st,   { opacity: 0 });
          if (sls.length)  gsap.set(sls,  { y: 25, opacity: 0 });
        },
      });
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleNav = (index: number) => { onScrollTo(index); onClose(); };

  return (
    <div className="sm-wrapper" id="staggered-menu" style={{ pointerEvents: isOpen ? 'auto' : 'none' }}>
      <div className="sm-prelayers" aria-hidden="true">
        <div ref={pre1Ref} className="sm-prelayer" style={{ background: '#2a1a4e' }} />
        <div ref={pre2Ref} className="sm-prelayer" style={{ background: '#6C63FF' }} />
      </div>
      <aside ref={panelRef} className="sm-panel" aria-hidden={!isOpen}>
        <div className="sm-panel-inner">
          <ul ref={listRef} className="sm-panel-list" data-numbering="true">
            {NAV_ITEMS.map(item => (
              <li key={item.index} className="sm-panel-itemWrap">
                <button className="sm-panel-item" onClick={() => handleNav(item.index)}>
                  <span className="sm-panel-itemLabel">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="sm-socials">
            <h3 className="sm-socials-title">Socials</h3>
            <ul className="sm-socials-list">
              <li>
                <a href="https://github.com/Lagrange1994" target="_blank" rel="noopener noreferrer" className="sm-socials-link">
                  GitHub
                </a>
              </li>
              <li>
                <a href="mailto:lyfun0202@gmail.com" className="sm-socials-link">Email</a>
              </li>
            </ul>
          </div>
        </div>
      </aside>
      {isOpen && <div className="fixed inset-0" style={{ zIndex: -1 }} onClick={onClose} />}
    </div>
  );
}
