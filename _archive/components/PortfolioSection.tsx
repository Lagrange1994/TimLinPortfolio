import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/context/LanguageContext';
import { PROJECTS, Project } from '@/data/projects';
import Masonry from './Masonry';

type Filter = 'all' | 'mobile' | 'web';

const HEIGHTS = [500, 400, 550, 380, 600, 450, 480, 360, 520, 420, 580, 400, 460];

function ProjectCard({ project, isGrid }: { project: Project; isGrid: boolean }) {
  const { t } = useLang();
  const title = t[project.titleKey as keyof typeof t] as string;
  const desc = t[project.descKey as keyof typeof t] as string;

  return (
    <a
      href={project.link}
      className={`project-card fade-in${isGrid ? ' aspect-[3/2]' : ''}`}
      data-category={project.category}
      style={isGrid ? { position: 'relative' } : { width: '15.5rem', flexShrink: 0, margin: '0.5rem', position: 'relative' }}
    >
      <img
        src={project.img}
        alt={title}
        style={isGrid ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } : { width: '100%', height: '100%', objectFit: 'cover' }}
        loading="lazy"
      />
      <div className="project-overlay">
        <h3 className={`${isGrid ? 'text-base md:text-xl' : 'text-sm md:text-base'} font-bold mb-2 font-heading`}>{title}</h3>
        <p className="text-xs md:text-sm text-gray-200 mb-4">{desc}</p>
        <div className="flex space-x-2 flex-wrap gap-1">
          {project.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-white bg-opacity-20 text-white text-[10px] md:text-xs rounded-full border border-white">{tag}</span>
          ))}
        </div>
      </div>
    </a>
  );
}

function InfiniteTrack({ projects, direction }: { projects: Project[]; direction: 'left' | 'right' }) {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || inner.dataset.animated) return;
    const children = Array.from(inner.children);
    children.forEach(c => inner.appendChild(c.cloneNode(true)));
    inner.closest('.scroller')?.setAttribute('data-animated', 'true');
  }, []);

  return (
    <div className="scroller" data-direction={direction} data-speed="slow">
      <div ref={innerRef} className="scroller-inner">
        {projects.map(p => (
          <ProjectCard key={p.id} project={p} isGrid={false} />
        ))}
      </div>
    </div>
  );
}

export default function PortfolioSection() {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = filter === 'all' ? PROJECTS : PROJECTS.filter(p => p.category === filter);

  const mob1 = PROJECTS.slice(0, 5);
  const mob2 = PROJECTS.slice(5, 9);
  const mob3 = PROJECTS.slice(9);
  const desk1 = PROJECTS.slice(0, 7);
  const desk2 = PROJECTS.slice(7);

  const toggleExpanded = () => {
    setExpanded(v => !v);
    if (!expanded) {
      document.body.classList.add('expanded-view');
    } else {
      document.body.classList.remove('expanded-view');
    }
  };

  return (
    <section id="portfolio" className="snap-section bg-p-dark-light md:flex md:items-center">
      <div className="container max-w-8xl mx-auto px-8">
        <div className="section-header stagger-item">
          <h2>My <span className="gradient-text">Portfolio</span></h2>
        </div>

        {/* Mobile scroller (3 tracks) */}
        {!expanded && (
          <div id="portfolio-scroller-mobile" className="stagger-item md:hidden">
            <InfiniteTrack projects={mob1} direction="left" />
            <InfiniteTrack projects={mob2} direction="right" />
            <InfiniteTrack projects={mob3} direction="left" />
          </div>
        )}

        {/* Desktop scroller (2 tracks) */}
        {!expanded && (
          <div id="portfolio-scroller-desktop" className="stagger-item hidden md:block">
            <InfiniteTrack projects={desk1} direction="right" />
            <InfiniteTrack projects={desk2} direction="left" />
          </div>
        )}

        {/* Filters (only in expanded) */}
        {expanded && (
          <div className="flex flex-nowrap justify-center mb-8 stagger-item">
            {(['all', 'mobile', 'web'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`liquid-glass-btn portfolio-filter-btn${filter === f ? ' active' : ''} mx-1 px-3 py-1 md:m-2 md:px-6 md:py-2 text-xs md:text-base rounded-full whitespace-nowrap`}
              >
                {f === 'all' ? 'All' : f === 'mobile' ? 'Apps Design' : 'Web Design'}
              </button>
            ))}
          </div>
        )}

        {/* Masonry grid (only in expanded) */}
        {expanded && (
          <div className="stagger-item">
            <Masonry
              key={filter}
              items={filtered.map((p, i) => ({
                id: p.id,
                img: p.img,
                url: p.link,
                height: HEIGHTS[i % HEIGHTS.length],
              }))}
              animateFrom="bottom"
              stagger={0.04}
              duration={0.6}
              blurToFocus={true}
              scaleOnHover={true}
              hoverScale={0.97}
            />
          </div>
        )}

        {/* Toggle button */}
        <div className="text-center mt-8 stagger-item">
          <button
            onClick={toggleExpanded}
            className="liquid-glass-btn liquid-glass-gradient px-5 py-2 md:px-8 md:py-3 text-xs md:text-base rounded-full font-medium"
          >
            <span>{expanded ? 'Fold' : 'View All Projects'}</span>
            <i className={`fas fa-arrow-${expanded ? 'up' : 'right'} ml-2`} />
          </button>
        </div>
      </div>
    </section>
  );
}
