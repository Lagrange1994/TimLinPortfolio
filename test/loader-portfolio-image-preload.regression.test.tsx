import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import { LangProvider } from '../src/context/LangContext';
import Loader from '../src/components/Loader';
import { PROJECTS } from '../src/data/projects';

// PortfolioSection's ProjectCard uses `loading="lazy"`, so its 12 marquee
// images (each cloned multiple times by createPortfolioScroller to fill
// every row) would otherwise only start fetching once the user scrolls
// near them — right when .wall-frame-in's scroll-settle reveal is trying
// to play (see PortfolioSection.tsx). Decode work competing for the main
// thread at that exact moment was the root cause behind the reveal still
// looking instant even once its own scroll-settle timing was correct.
// Loader now force-starts fetch+decode for every portfolio image the
// moment it mounts, well ahead of the user ever reaching that section.
describe('Loader portfolio image preload', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates an Image for every PROJECTS entry and sets its src on mount', () => {
    const created: HTMLImageElement[] = [];
    const RealImage = window.Image;
    // jsdom's Image has no real decode(); stub it so `.decode?.()` doesn't
    // reject unhandled and so we can assert it was actually called.
    class TrackedImage extends RealImage {
      decode = vi.fn(() => Promise.resolve());
      constructor() {
        super();
        created.push(this);
      }
    }
    vi.stubGlobal('Image', TrackedImage);

    render(createElement(LangProvider, null, createElement(Loader)));

    expect(created.length).toBe(PROJECTS.length);
    const srcs = created.map(img => decodeURIComponent(img.src));
    for (const p of PROJECTS) {
      const filename = p.img.split('/').pop()!;
      expect(srcs.some(src => src.includes(filename))).toBe(true);
    }
    for (const img of created) expect(img.decode).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
