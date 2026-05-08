'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useLang } from '@/context/LanguageContext';

interface HeroSectionProps {
  onScrollTo: (index: number) => void;
}

const TAGS = [
  { icon: 'fas fa-rocket animate-pulse', color: 'text-primary/90', border: 'border-primary/40', bg: 'bg-primary/10', label: 'Open for Opportunities' },
  { icon: 'fas fa-sitemap', color: 'text-blue-400', label: 'Complex System UX' },
  { icon: 'fas fa-cube', color: 'text-purple-400', label: '3D Web Experience' },
  { icon: 'fas fa-robot', color: 'text-cyan-400', label: 'AI-Powered Workflow' },
  { icon: 'fas fa-mobile-alt', color: 'text-orange-400', label: 'Mobile App UI' },
  { icon: 'fas fa-landmark', color: 'text-green-400', label: 'Gov & Enterprise Projects' },
  { icon: 'fas fa-puzzle-piece', color: 'text-yellow-400', label: 'Problem Solver' },
  { icon: 'ph-fill ph-map-pin', color: 'text-red-500', label: 'Taipei, Taiwan', isPhosphor: true },
];

export default function HeroSection({ onScrollTo }: HeroSectionProps) {
  const { t } = useLang();
  const scrollerRef = useRef<HTMLUListElement>(null);

  // Infinite scroll: clone items
  useEffect(() => {
    const ul = scrollerRef.current;
    if (!ul || ul.dataset.animated) return;
    const items = Array.from(ul.children);
    items.forEach(item => ul.appendChild(item.cloneNode(true)));
    ul.closest('.scroller')?.setAttribute('data-animated', 'true');
  }, []);

  return (
    <section id="home" className="snap-section active-section md:flex md:items-center overflow-hidden relative">
      <div className="container max-w-8xl mx-auto pb-20 md:pb-0">
        <div className="flex flex-col md:flex-row items-center">
          {/* Left: image / Spline */}
          <div
            id="hero-img-container"
            className="w-full md:w-1/2 flex justify-center items-end px-0 md:h-[45rem] md:aspect-auto stagger-item relative overflow-hidden"
          >
            {/* Mobile: static image */}
            <Image
              src="/img/figure.png"
              alt="Hero Figure"
              width={600}
              height={720}
              className="h-full w-auto object-contain object-bottom md:hidden block pointer-events-none"
              priority
            />
            {/* Desktop: Spline 3D */}
            {/* @ts-ignore */}
            <spline-viewer
              url="/models/hero_figure.splinecode"
              className="w-full h-full overflow-hidden hidden md:block"
            />
          </div>

          {/* Right: text */}
          <div className="w-full md:w-1/2 mt-6 mb-6 md:mt-0 md:mb-0 px-6 flex flex-col items-center text-center md:items-start md:text-left">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-4 font-heading stagger-item">
              Hi, I&apos;m <span>Tim Lin</span>
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-medium mb-6 text-gray-200 font-heading stagger-item">
              UI/UX Designer &amp; Web Developer
            </h2>
            <p
              className="text-xs md:text-base text-gray-200 mb-8 max-w-6xl stagger-item"
              dangerouslySetInnerHTML={{ __html: t.hero_desc }}
            />
            <div className="flex space-x-4 stagger-item justify-center md:justify-start">
              <button
                onClick={() => onScrollTo(3)}
                className="liquid-glass-btn liquid-glass-gradient px-5 py-2 md:px-8 md:py-3 text-xs md:text-lg rounded-full font-medium"
              >
                View My Work
              </button>
              <button
                onClick={() => onScrollTo(4)}
                className="liquid-glass-btn px-5 py-2 md:px-8 md:py-3 text-xs md:text-lg rounded-full font-medium"
              >
                Contact Me
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tag carousel */}
      <div
        className="absolute bottom-6 md:bottom-8 left-0 right-0 mx-auto w-[calc(100%-2rem)] max-w-8xl z-20 overflow-hidden rounded-full opacity-0 fade-in visible"
        style={{ animationDelay: '1.2s', pointerEvents: 'none' }}
      >
        <div className="scroller" data-direction="left" data-speed="slow" style={{ pointerEvents: 'auto' }}>
          <ul ref={scrollerRef} className="scroller-inner tag-list flex flex-wrap gap-3 md:gap-4 list-none py-2 px-0 m-0 w-max">
            {TAGS.map((tag, i) => (
              <li
                key={i}
                className={`tag-capsule group ${tag.border ?? ''} ${tag.bg ?? ''} ${tag.color ?? ''}`}
              >
                <i
                  className={`${tag.icon} mr-2 ${tag.isPhosphor ? '' : 'text-sm'} ${tag.color} group-hover:text-white transition-colors`}
                  style={tag.isPhosphor ? { fontSize: 20 } : undefined}
                />
                {tag.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
