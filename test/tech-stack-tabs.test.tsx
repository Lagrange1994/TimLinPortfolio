import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Tech Stack: ProcessCarousel `single` pages one card at a time under its
// tabs even on desktop (matchMedia false = no phone query match).
vi.hoisted(() => {
  window.matchMedia = ((q: string) => ({
    matches: false, media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

import { ProcessCarousel, TechSquare } from '../src/components/SkillsSection';
import fs from 'node:fs';
import path from 'node:path';

describe('TechSquare (desktop tile at the card\'s lower-left)', () => {
  it('shows its card\'s illustration on the card\'s colour, hidden from AT', () => {
    const { container } = render(<TechSquare k="js" />);
    const sq = container.querySelector('.tech-square')!;
    expect(sq.classList.contains('tech-square--js')).toBe(true);
    expect(sq.getAttribute('aria-hidden')).toBe('true');
    expect((sq as HTMLElement).style.getPropertyValue('--sq-c')).toBe('#fb923c');
    expect(sq.querySelector('svg.tech-square-art--js')).not.toBeNull();
  });

  // each drawing says what its card's text says
  it('html: a page whose four blocks are read in turn', () => {
    const { container } = render(<TechSquare k="html" />);
    expect(container.querySelectorAll('.sq-block')).toHaveLength(4);
    expect(container.querySelectorAll('.sq-scan')).toHaveLength(4);
  });
  it('js: request → AI spark → pressed button, a card rising', () => {
    const { container } = render(<TechSquare k="js" />);
    for (const c of ['.sq-spark', '.sq-press', '.sq-cursor', '.sq-rise']) expect(container.querySelector(c), c).not.toBeNull();
    expect(container.querySelectorAll('.sq-flow')).toHaveLength(2);
  });
  it('react: three flex items between a wide and a narrow frame', () => {
    const { container } = render(<TechSquare k="react" />);
    expect(container.querySelector('.sq-frame-wide')).not.toBeNull();
    expect(container.querySelector('.sq-frame-narrow')).not.toBeNull();
    expect(container.querySelectorAll('rect.sq-tile')).toHaveLength(3);
  });

  it('the drawings loop, and hold still under reduced motion', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
    expect(css).toMatch(/\.tech-square-art \.sq-scan \{[^}]*animation: sq-scan 6s ease-in-out infinite;/);
    expect(css).toMatch(/@keyframes sq-t1 \{[\s\S]*?translate\(28px, -23px\)/);
    // the tile itself breathes (scale + glow), like the AI core
    expect(css).toMatch(/\.tech-square \{\s*animation: tech-square-breathe 2\.4s ease-in-out infinite;/);
    expect(css).toMatch(/@keyframes tech-square-breathe \{[\s\S]*?50% \{\s*scale: 1\.04;/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.tech-square \{ animation: none; \}/);
    expect(css).toMatch(/\.tech-square-art \* \{ animation: none !important; \}/);
  });

  it('desktop only; the tile reaches only half into the card\'s padding (never over the demo)', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
    expect(css).toMatch(/\n {4}\.tech-square \{\s*display: none;/);
    const desk = css.slice(css.indexOf('Tech Stack on desktop: the phone switcher'));
    expect(desk).toMatch(/--sq-in: calc\(var\(--card-pad\) \/ 2\);/);
    // not level with the card: it hangs below its bottom edge
    expect(desk).toMatch(/--sq-drop: 40px;\s*padding-bottom: var\(--sq-drop\);/);
    expect(desk).toMatch(/\.tech-item-wrap::after \{\s*bottom: var\(--sq-drop\);/);
    expect(desk).toMatch(/\.process-scroll-wrap--tech \.tech-item \{\s*margin-left: calc\(var\(--sq\) - var\(--sq-in\)\);/);
    expect(desk).toMatch(/\.process-scroll-wrap--tech \.tech-item-wrap::after \{\s*left: calc\(var\(--sq\) - var\(--sq-in\)\);/);
    expect(desk).toMatch(/\.tech-square \{[^}]*position: absolute;\s*left: 0;\s*bottom: 0;[^}]*aspect-ratio: 1;/);
    const tsx = fs.readFileSync(path.resolve(__dirname, '../src/components/SkillsSection.tsx'), 'utf8');
    expect(tsx.match(/<TechSquare k="(html|js|react)" \/>/g)).toHaveLength(3);
  });
});

const tabs = [
  { label: 'HTML / CSS', color: '#60a5fa', color2: '#3b82f6' },
  { label: 'JavaScript', color: '#fb923c', color2: '#f97316' },
  { label: 'React / Vue', color: '#8b7bff', color2: '#6C63FF' },
];
const cards = tabs.map(t => <div key={t.label} className="card">{t.label}</div>);

afterEach(cleanup);

describe('ProcessCarousel single', () => {
  it('desktop + single: tabs, no dots or ‹ ›, first tab open', () => {
    const { container, getAllByRole } = render(<ProcessCarousel single variant="tech" tabs={tabs} cards={cards} />);
    expect(container.querySelector('.process-scroll-wrap--tabs')).not.toBeNull();
    expect(getAllByRole('tab').map(b => b.textContent)).toEqual(tabs.map(t => t.label));
    expect(getAllByRole('tab')[0].getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('.process-swipe-dots')).toBeNull();
    expect(container.querySelector('.process-swipe-nav')).toBeNull();
  });

  it('clicking a tab opens that card', () => {
    const { getAllByRole } = render(<ProcessCarousel single variant="tech" tabs={tabs} cards={cards} />);
    fireEvent.click(getAllByRole('tab')[2]);
    expect(getAllByRole('tab').map(b => b.getAttribute('aria-selected'))).toEqual(['false', 'false', 'true']);
  });

  it('aside: the open card\'s text under the tabs, following the tab', () => {
    const aside = tabs.map(t => <p key={t.label}>{`${t.label} text`}</p>);
    const { container, getAllByRole } = render(<ProcessCarousel single variant="tech" tabs={tabs} aside={aside} cards={cards} />);
    const text = () => container.querySelector('.process-tab-aside')!.textContent;
    expect(text()).toBe('HTML / CSS text');
    // sits between the tabs and the track (grid places it under the tabs)
    expect(container.querySelector('.process-tabs + .process-tab-aside + .process-column-grid')).not.toBeNull();
    fireEvent.click(getAllByRole('tab')[1]);
    expect(text()).toBe('JavaScript text');
  });

  it('no aside without one passed', () => {
    const { container } = render(<ProcessCarousel single variant="tech" tabs={tabs} cards={cards} />);
    expect(container.querySelector('.process-tab-aside')).toBeNull();
  });

  it('without single, desktop shows three a page and no tabs', () => {
    const { container } = render(<ProcessCarousel variant="tech" tabs={tabs} cards={cards} />);
    expect(container.querySelector('[role=tab]')).toBeNull();
    expect(container.querySelector('.process-scroll-wrap--tabs')).toBeNull();
  });
});
