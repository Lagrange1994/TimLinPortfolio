import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { navShouldCompact, NAV_COMPACT_AT, flushSectionTops, flushAtTop } from '../src/utils/navCompact';
import { PROJECTS } from '../src/data/projects';

const scrollTo = vi.hoisted(() => vi.fn());
vi.mock('../src/utils/navHeader', () => ({ scrollToSectionAligned: scrollTo }));

import OverviewSection, {
  wallScale, WALL_MIN_W, WALL_H, DESIGN_STEPS, DESIGN_TOOLS, WALL_TILES, STEP_MS,
} from '../src/components/OverviewSection';
import { LangProvider } from '../src/context/LangContext';
import { translations } from '../src/i18n/translations';

const root = resolve(__dirname, '..');

function stubMatchMedia(desktop: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: q.includes('min-width: 1025px') ? desktop : false,
    media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe('navbar compact state', () => {
  it('stays full at the top of the page', () => {
    expect(navShouldCompact(0, [])).toBe(false);
    expect(navShouldCompact(NAV_COMPACT_AT, [])).toBe(false);
  });

  it('compacts once scrolled, unless a framed section sits flush at the top', () => {
    expect(navShouldCompact(500, [])).toBe(true);
    expect(navShouldCompact(1080, [0])).toBe(false);
    expect(navShouldCompact(1080, [-30])).toBe(false);
    expect(navShouldCompact(1080, [-300])).toBe(true);
    expect(navShouldCompact(1080, [600, 2])).toBe(false);
  });

  it('flushAtTop: a framed section within the compact threshold of the top', () => {
    expect(flushAtTop([])).toBe(false);
    expect(flushAtTop([NAV_COMPACT_AT])).toBe(true);
    expect(flushAtTop([NAV_COMPACT_AT + 1])).toBe(false);
    // BackToTop hides then, since the wall's notch buttons sit where it floats
    expect(readFileSync(resolve(root, 'src/components/BackToTop.tsx'), 'utf8')).toContain("window.scrollY > 400 && !flushAtTop(flushSectionTops())");
  });

  it('reads flush sections only where the frame exists (desktop)', () => {
    document.body.innerHTML = '<section data-nav-flush=""></section>';
    stubMatchMedia(false);
    expect(flushSectionTops()).toEqual([]);
    stubMatchMedia(true);
    expect(flushSectionTops()).toEqual([0]);
    document.body.innerHTML = '';
  });
});

describe('OverviewSection', () => {
  beforeAll(() => stubMatchMedia(true));
  afterEach(() => { cleanup(); scrollTo.mockClear(); });

  const mount = () => render(<LangProvider><OverviewSection /></LangProvider>);

  it('renders the wall as its own section, with no frame or ask strip', () => {
    const { container } = mount();
    const section = container.querySelector('section#overview')!;
    expect(section.hasAttribute('data-nav-flush')).toBe(false);
    expect(section.querySelector('.hero-ask, .overview-frame, svg.overview-frame-glow')).toBeNull();
    expect(section.querySelector(':scope > .overview-fit > #overview-grid')).not.toBeNull();
    // the moved About cards
    for (const sel of ['#profile-card-wrap', '.bento-area-years', '.bento-area-projects', '.bento-area-domains', '.bento-area-workflow', '.bento-area-cta'])
      expect(section.querySelector(sel), sel).not.toBeNull();
  });

  it('the works are three live tiles: two App on the left, a big Web one with the notch', () => {
    const { container } = mount();
    const cat = (id: string) => PROJECTS.find(p => p.id === id)!.category;
    expect(WALL_TILES[0].every(id => cat(id) === 'mobile')).toBe(true);
    expect(WALL_TILES[1].every(id => cat(id) === 'mobile')).toBe(true);
    expect(WALL_TILES[2].every(id => cat(id) === 'web')).toBe(true);
    const works = container.querySelector('.overview-area-works')!;
    expect(works.querySelectorAll('.work-cube')).toHaveLength(3);
    // the big tile is the notched card, its button in the notch
    expect(works.querySelector('.overview-tile-big .overview-tile--web .work-cube')).not.toBeNull();
    expect(works.querySelector('.overview-tile-big .about-notch-tags button')).not.toBeNull();
    // each tile's front face links its first work; the hidden sides are out of the tab order
    WALL_TILES.forEach((ids, i) => {
      const cube = works.querySelectorAll('.work-cube')[i];
      const front = cube.querySelector('.work-face.is-front')!;
      expect(front.getAttribute('href')).toBe(PROJECTS.find(p => p.id === ids[0])!.link);
      expect(cube.querySelectorAll('.work-face[tabindex="-1"][aria-hidden="true"]')).toHaveLength(3);
    });
  });

  it('each notch button scrolls to its section', () => {
    const { getByText } = mount();
    const zh = translations.zh;
    for (const [label, id] of [[zh.overview_all_work, 'portfolio'], [zh.overview_process_more, 'process'], [zh.about_ai_more, 'my-skills'], [zh.about_cta_button, 'contact']] as const) {
      fireEvent.click(getByText(label, { exact: false }).closest('button')!);
      expect(scrollTo).toHaveBeenLastCalledWith(id);
    }
  });

  it('How I Design cycles the six Freelance step images, offset by one step each', () => {
    const { container } = mount();
    const imgs = [...container.querySelectorAll<HTMLImageElement>('.overview-design-img')];
    expect(imgs.map(i => i.getAttribute('src'))).toEqual(DESIGN_STEPS.map(s => `./img/process/${s}_w.webp`));
    expect(imgs.map(i => i.style.animationDelay)).toEqual(DESIGN_STEPS.map((_, i) => `${i * STEP_MS}ms`));
    // the Freelance steps, by the names My Design Process gives them
    expect(DESIGN_STEPS).toEqual(['Intake', 'AI Brief', 'Triage', 'Discovery', 'Proposal', 'Delivery']);
    const zh = translations.zh as Record<string, string>;
    expect(DESIGN_STEPS.map((_, i) => zh[`fl_name_0${i + 1}`])).toEqual([...DESIGN_STEPS]);
    // one name and one dot per step
    expect([...container.querySelectorAll('.overview-design-step-name')].map(e => e.textContent)).toEqual([...DESIGN_STEPS]);
    expect(container.querySelectorAll('.overview-design-chip')).toHaveLength(DESIGN_STEPS.length);
    // the CSS loops are as long as the steps
    const css = readFileSync(resolve(root, 'src/styles/portfolio.css'), 'utf8');
    for (const k of ['show', 'name', 'chip'])
      expect(css).toContain(`animation: overview-step-${k} ${(DESIGN_STEPS.length * STEP_MS) / 1000}s linear infinite both;`);
  });

  it('light theme swaps in the light (uncoloured) step images', async () => {
    document.documentElement.setAttribute('data-theme', 'light');
    const { container } = mount();
    expect(container.querySelector('.overview-design-img')!.getAttribute('src')).toBe('./img/process/Intake_l_w.webp');
    document.documentElement.removeAttribute('data-theme');
  });

  it('every image the wall uses is a real file', () => {
    for (const s of DESIGN_STEPS) for (const v of ['_w', '_l_w']) expect(existsSync(resolve(root, `public/img/process/${s}${v}.webp`))).toBe(true);
    for (const t of DESIGN_TOOLS) expect(existsSync(resolve(root, 'public', t.img.slice(2))), t.img).toBe(true);
  });
});

describe('wall scale (desktop)', () => {
  it('1 once the section is at least WALL_MIN_W wide', () => {
    expect(wallScale(WALL_MIN_W)).toBe(1);
    expect(wallScale(1856)).toBe(1);
  });

  it('a narrower section shrinks the whole wall', () => {
    expect(wallScale(1216)).toBeCloseTo(1216 / WALL_MIN_W);
  });

  it('a sane value before layout', () => {
    expect(wallScale(0)).toBe(1);
  });

  it("CSS: the grid keeps the canvas's rows (848px) and scales with the section width", () => {
    const css = readFileSync(resolve(root, 'src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
    expect(css).toMatch(new RegExp(`\\.overview-fit \\{\\s*position: relative;\\s*height: calc\\(${WALL_H}px \\* var\\(--wall-scale, 1\\)\\);`));
    expect(css).toMatch(new RegExp(`left: 0;\\s*top: 0;\\s*width: calc\\(100% \\/ var\\(--wall-scale, 1\\)\\);\\s*height: ${WALL_H}px;\\s*transform: scale\\(var\\(--wall-scale, 1\\)\\);\\s*transform-origin: 0 0;`));
    // no hero stage left behind
    for (const gone of ['hero-stage', 'hero-clip', 'overview-window', '--panel-clip']) expect(css).not.toContain(gone);
  });
});

describe('Overview wiring', () => {
  it('mounts right after the hero, lazily, with Overview in the menu after Home', () => {
    const app = readFileSync(resolve(root, 'src/App.tsx'), 'utf8');
    expect(app.indexOf('<HeroSection />')).toBeLessThan(app.indexOf('<OverviewSection />'));
    expect(app.indexOf('<OverviewSection />')).toBeLessThan(app.indexOf('<AboutSection />'));
    expect(app).toContain('<LazyUnit name="overview">');
    const nav = readFileSync(resolve(root, 'src/components/Navbar.tsx'), 'utf8');
    expect(nav).toMatch(/\{ key: 'home'[^\n]*\n\s*\{ key: 'overview', label: 'Overview', scrollTo: 'overview' \}/);
    expect(readFileSync(resolve(root, 'src/components/SkillsSection.tsx'), 'utf8')).toContain('<section id="process"');
  });
});
