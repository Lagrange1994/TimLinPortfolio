import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

// 2026-09-23/24 history: the figure and the tag-capsule marquee were both
// portaled to document.body so they could out-rank the fixed navbar. That
// made the figure's entrance stutter (measured in the browser: ~12 slow
// frames vs 4 without the portals, matching the reference site) — so the
// figure-in-front-of-navbar requirement was dropped and both went back into
// #home. Only the marquee-in-front-of-figure ordering is kept, done with a
// plain z-index inside #home (no DOM move).
describe('hero figure and marquee live inside #home (no portals)', () => {
  const css = read('src/styles/portfolio.css');
  const tsx = read('src/components/HeroSection.tsx');

  it('does not use React portals for the hero figure or marquee', () => {
    expect(tsx).not.toMatch(/createPortal/);
    expect(tsx).not.toMatch(/isDesktopFrame/);
  });

  it('renders <spline-viewer id="hero-spline"> inside .hero-fig', () => {
    const heroFigBlock = tsx.match(/<div className="hero-fig">[\s\S]*?\n {8}<\/div>/)?.[0];
    expect(heroFigBlock).toBeTruthy();
    expect(heroFigBlock).toMatch(/<spline-viewer id="hero-spline" className="hero-fig-desktop" \/>/);
  });

  it('does not raise #home\'s own z-index above #main-header\'s (would hide the navbar behind the hero)', () => {
    const homeBlock = css.match(/@media \(min-width: 768px\) \{\s*#home \{[\s\S]*?\n {6}\}/)?.[0];
    expect(homeBlock).toBeTruthy();
    expect(homeBlock).not.toMatch(/z-index/);
  });

  it('paints the marquee above the figure with a plain z-index: 1 on #hero-tags-clip, in #home-relative geometry', () => {
    const clipBlock = css.match(/#hero-tags-clip \{\s*display: block;[\s\S]*?\}/)?.[0];
    expect(clipBlock).toBeTruthy();
    expect(clipBlock).toMatch(/z-index: 1;/);
    expect(clipBlock).toMatch(/top: 24px;/);
    expect(clipBlock).toMatch(/left: 24px;/);
    expect(clipBlock).toMatch(/width: calc\(100% - 48px\);/);
    expect(clipBlock).toMatch(/height: calc\(100% - 48px\);/);
  });

  it('keeps the desktop .hero-tags position override anchored on #home', () => {
    expect(css).toMatch(/#home \.hero-tags \{\s*bottom: 17\.2px;/);
    expect(css).not.toMatch(/#hero-tags-clip \.hero-tags \{/);
  });

  it('leaves the base (<1025px) #hero-tags-clip rule as a plain display:contents no-op', () => {
    expect(css).toMatch(/#hero-tags-clip \{\s*display: contents;\s*\}/);
  });
});
