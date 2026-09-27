import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { attachPortfolioSkeleton, sweepPortfolioImages, IMG_LOADED_CLASS } from '../src/utils/portfolioSkeleton';
import { PROJECTS } from '../src/data/projects';

// Portfolio thumbnails show a shimmer skeleton in each image's own mean
// color until the <img> is done. The loaded state is set by a delegated
// capture listener (not React state) because the marquee's cloneNode
// copies are never React-managed — see portfolioSkeleton.ts.

function card(cls = 'project-card', complete = false) {
  const a = document.createElement('a');
  a.className = cls;
  const img = document.createElement('img');
  Object.defineProperty(img, 'complete', { value: complete, configurable: true });
  a.appendChild(img);
  document.body.appendChild(a);
  return { a, img };
}

describe('portfolio lazy-load skeleton', () => {
  let cleanup: (() => void) | undefined;
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    document.body.innerHTML = '';
  });

  it('marks the card loaded when its image fires load', () => {
    const { a, img } = card();
    cleanup = attachPortfolioSkeleton();
    expect(a.classList.contains(IMG_LOADED_CLASS)).toBe(false);
    img.dispatchEvent(new Event('load'));
    expect(a.classList.contains(IMG_LOADED_CLASS)).toBe(true);
  });

  it('also clears the skeleton on error so a broken image does not shimmer forever', () => {
    const { a, img } = card('grid-card');
    cleanup = attachPortfolioSkeleton();
    img.dispatchEvent(new Event('error'));
    expect(a.classList.contains(IMG_LOADED_CLASS)).toBe(true);
  });

  it('catches cards added after attach (marquee clones)', () => {
    cleanup = attachPortfolioSkeleton();
    const { a, img } = card();
    const clone = a.cloneNode(true) as HTMLElement;
    document.body.appendChild(clone);
    clone.querySelector('img')!.dispatchEvent(new Event('load'));
    expect(clone.classList.contains(IMG_LOADED_CLASS)).toBe(true);
    expect(a.classList.contains(IMG_LOADED_CLASS)).toBe(false);
    img.dispatchEvent(new Event('load'));
    expect(a.classList.contains(IMG_LOADED_CLASS)).toBe(true);
  });

  it('sweep marks already-complete images and leaves pending ones', () => {
    const done = card('project-card', true);
    const pending = card('project-card', false);
    sweepPortfolioImages();
    expect(done.a.classList.contains(IMG_LOADED_CLASS)).toBe(true);
    expect(pending.a.classList.contains(IMG_LOADED_CLASS)).toBe(false);
  });

  it('ignores images outside portfolio cards', () => {
    cleanup = attachPortfolioSkeleton();
    const div = document.createElement('div');
    const img = document.createElement('img');
    div.appendChild(img);
    document.body.appendChild(div);
    img.dispatchEvent(new Event('load'));
    expect(div.classList.contains(IMG_LOADED_CLASS)).toBe(false);
  });

  it('stops listening after cleanup', () => {
    const { a, img } = card();
    attachPortfolioSkeleton()();
    img.dispatchEvent(new Event('load'));
    expect(a.classList.contains(IMG_LOADED_CLASS)).toBe(false);
  });

  it('every project has its own skeleton color', () => {
    for (const p of PROJECTS) expect(p.color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(new Set(PROJECTS.map(p => p.color)).size).toBe(PROJECTS.length);
  });

  it('every project has a hover hero-image color for the overlay tint', () => {
    for (const p of PROJECTS) expect(p.heroColor).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('ProjectCard passes both colors to the card as --ph / --ph2', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../src/components/PortfolioSection.tsx'), 'utf8');
    expect(src).toMatch(/'--ph':\s*p\.color/);
    expect(src).toMatch(/'--ph2':\s*p\.heroColor/);
  });

  // Regression: a fixed white sweep vanished over the near-white thumbnail
  // colors in light mode, so the skeleton looked like it had no animation.
  it('light mode sweeps a darker shade of the card color, not white', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../src/styles/portfolio.css'), 'utf8');
    expect(css).toMatch(/var\(--skeleton-sweep\) 50%/);
    expect(css).toMatch(
      /:root\[data-theme="light"\] :is\(\.project-card, \.grid-card\)::before \{\s*--skeleton-sweep: color-mix\(in srgb, var\(--ph[^;]*, #000\);/,
    );
  });
});
