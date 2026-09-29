import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// The browser-frame box wrapping the switchable preview image (project_01/
// 03/04/07/09/11/12, all keyed off currentImage) used to size itself off its
// own content via max-h-full/lg:max-h-[90%] or w-auto h-auto — an upper
// bound or auto value, never a definite height. ImageWithSkeleton's skeleton
// div is `absolute inset-0`, so it doesn't contribute flow height either —
// the moment currentImage changes, the old <img> unmounts and the new one
// hasn't loaded yet, so nothing in the chain has a size and the whole frame
// collapses toward 0 height until the new image's intrinsic size arrives,
// then snaps back. Fixed by extracting the shared PreviewFrame component
// (src/projects/shared/PreviewFrame.jsx), which always uses a definite
// height (lg:h-[90%] on desktop; on phones the whole frame is a 16:9
// aspect-video box, derived from the width rather than the content, so every
// project's frame matches project_02's: 35vh panel, ~48px above/below).
// jsdom doesn't run real CSS layout, so this
// can't be caught by rendering and measuring — these are source-level
// guards that every project keeps using that shared component instead of a
// hand-rolled, content-driven frame.
describe('shared PreviewFrame sizes itself with a definite height', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/projects/shared/PreviewFrame.jsx'), 'utf8');

  const frameClassName = source.match(/relative w-full max-w-full[\s\S]*?\n\s*>/)?.[0];

  const imageAreaClassName = source.match(/className=\{`w-full flex-1 min-h-0 relative bg-border\/5[^`]*`\}/)?.[0];

  it('caps the desktop 16:9 frame at 90% of the panel height (no tall letterboxed box)', () => {
    expect(frameClassName).toBeTruthy();
    expect(frameClassName).toMatch(/lg:w-\[min\(100%,calc\(90cqh\*16\/9\)\)\]/);
  });

  it('sizes the whole phone frame (header included) as 16:9, like project_02', () => {
    expect(frameClassName).toMatch(/\baspect-video\b/);
    // size comes from the ratio alone, never from a tall scrolling image inside
    expect(frameClassName).toMatch(/max-lg:\[contain:size\]/);
    // desktop goes back to a percentage height
    expect(frameClassName).toMatch(/lg:aspect-auto/);
  });

  it('lets the image area fill whatever is left below the browser header', () => {
    expect(imageAreaClassName).toBeTruthy();
    expect(imageAreaClassName).toMatch(/\bflex-1\b/);
    expect(imageAreaClassName).toMatch(/\bmin-h-0\b/);
    expect(imageAreaClassName).not.toMatch(/(?<!lg:)aspect-video/); // only the desktop-only lg:aspect-video variant
  });

  it('never falls back to a content-driven max-h-only frame', () => {
    expect(frameClassName).not.toMatch(/max-h-full/);
    expect(frameClassName).not.toMatch(/w-auto h-auto/);
  });
});

describe.each([
  'project_01.jsx',
  'project_03.jsx',
  'project_04.jsx',
  'project_07.jsx',
  'project_09.jsx',
  'project_10.jsx',
  'project_11.jsx',
  'project_12.jsx',
])('%s preview frame reuses the shared PreviewFrame component', (file) => {
  const source = fs.readFileSync(path.join(ROOT, 'src/projects', file), 'utf8');

  it('imports PreviewFrame from shared/index.js', () => {
    expect(source).toMatch(/\bPreviewFrame\b/);
    expect(source).toMatch(/from '\.\/shared\/index\.js'/);
  });

  it('renders <PreviewFrame instead of a hand-rolled max-h-full frame div', () => {
    expect(source).toMatch(/<PreviewFrame\b/);
  });
});

// Long-strip website demos (the pages that show the "scroll to view the full
// screen" hint) get project_02's phone drag handle: dragging it down makes
// the panel — and, via PreviewFrame's `resizable` mode, the demo frame
// itself — taller, while the tall screenshot stays a full-width image the
// visitor scrolls inside it.
describe('PreviewFrame resizable mode', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/projects/shared/PreviewFrame.jsx'), 'utf8');

  it('keeps the 16:9 default but grows with the panel (floor = panel minus 2rem top and bottom)', () => {
    expect(source).toMatch(/resizable = false/);
    expect(source).toMatch(/resizable \? 'max-lg:min-h-\[calc\(100%-4rem\)\] lg:aspect-auto lg:h-auto lg:max-h-\[90%\]'/);
  });
});

describe.each([
  ['project_07.jsx', 'sm'],
  ['project_09.jsx', 'epb'],
  ['project_10.jsx', 'hc'],
  ['project_11.jsx', 'tmu'],
])('%s long-strip demo has a resize handle', (file, prefix) => {
  const source = fs.readFileSync(path.join(ROOT, 'src/projects', file), 'utf8');

  it('renders the shared ResizeHandle and passes resizable to PreviewFrame', () => {
    expect(source).toMatch(new RegExp(`<ResizeHandle prefix="${prefix}"`));
    expect(source).toMatch(/\r?\n\s*resizable\r?\n/);
  });

  it('sizes the panel from mobileVisualHeight on phones, floor computed as 16:9 of the viewport', () => {
    expect(source).toMatch(/useState\(get16by9FloorVh\)/);
    expect(source).toMatch(/\$\{mobileVisualHeight\}vh/);
    expect(source).toMatch(/newHeightVh < get16by9FloorVh\(\)\) newHeightVh = get16by9FloorVh\(\)/);
  });

  it('caps the drag at the height where the whole screenshot is visible (not a fixed 80vh)', () => {
    // upper limit comes from the rendered image height + the panel's fixed overhead
    expect(source).toMatch(/const getMaxVisualVh = \(\) =>/);
    expect(source).toMatch(/img\.offsetHeight \+ \(panel\.offsetHeight - area\.clientHeight\)/);
    expect(source).toMatch(/Math\.min\(80, Math\.max\(get16by9FloorVh\(\),/);
    expect(source).toMatch(/newHeightVh > maxVh\) newHeightVh = maxVh/);
    expect(source).toMatch(/<div ref=\{visualPanelRef\}/);
  });

  it("doesn't switch sections when the finger lifts after dragging the handle", () => {
    expect(source).toMatch(/isScrollingRef\.current \|\| isResizingRef\.current/);
  });

  it('keeps the tall screenshot full-width and scrollable inside the frame', () => {
    expect(source).toMatch(/imageAreaClassName="overflow-y-auto overscroll-contain custom-scroll block"/);
    expect(source).toMatch(/imageClassName="w-full h-auto block/);
  });
});

// Phone panel starts (and won't shrink below) a 16:9 box on every resizable
// project (project_02's spec) — computed from the viewport via
// get16by9FloorVh() instead of a flat 35 (vh) magic number, so the un-dragged
// panel is exactly 16:9 on any device, not just one tuned for a single test
// viewport. 01/03 don't have a resize handle, so they just size the panel as
// a plain 16:9 box directly (max-lg:aspect-video) — no JS floor needed.
describe('every project starts with a 16:9 phone panel as project_02', () => {
  const read = (file: string) => fs.readFileSync(path.join(ROOT, 'src/projects', file), 'utf8');

  it.each(['project_01.jsx', 'project_03.jsx', 'project_12.jsx'])('%s sizes the panel itself as a 16:9 box, not a fixed-vh inner box inside its padding', (file) => {
    const source = read(file);
    expect(source).toMatch(/shrink-0 max-lg:aspect-video z-20/);
    expect(source).not.toMatch(/max-lg:h-\[35vh\]/);
    expect(source).not.toMatch(/w-full h-\[35vh\] lg:h-full/);
    expect(source).not.toMatch(/'35vh'/);
  });

  it.each([
    'project_02.jsx',
    'project_04.jsx',
    'project_05.jsx',
    'project_06.jsx',
    'project_07.jsx',
    'project_08.jsx',
    'project_09.jsx',
    'project_10.jsx',
    'project_11.jsx',
  ])('%s defaults the resizable panel to a computed 16:9 floor', (file) => {
    expect(read(file)).toMatch(/\[mobileVisualHeight, setMobileVisualHeight\] = useState\(get16by9FloorVh\)/);
    expect(read(file)).toMatch(/get16by9FloorVh/);
  });

  it.each(['project_07.jsx', 'project_09.jsx', 'project_10.jsx', 'project_11.jsx'])(
    '%s floats the scroll hint in the gap below the frame on phones, in a fixed dark scrim pill (legible over any screenshot, both site themes)',
    (file) => {
      const source = read(file);
      // bottom-3, not bottom-0: a gap between the pill and the frame's edge.
      expect(source).toMatch(/max-lg:absolute max-lg:bottom-3 max-lg:inset-x-0/);
      // Fixed black/white by default, NOT the theme-flipping --color-border
      // token: the pill sits over an arbitrary screenshot (unrelated to the
      // site's own light/dark toggle), so a theme-adaptive translucent tint
      // can land light-on-light there. Same reasoning as the hero eyebrow
      // badge (bg-black/20 text-white, also fixed regardless of site theme)
      // — a dark scrim + white text reads over any screenshot content.
      expect(source).toMatch(/scroll-hint-pill max-lg:inline-flex/);
      expect(source).toMatch(/max-lg:rounded-full max-lg:bg-black\/55 max-lg:backdrop-blur-md max-lg:border max-lg:border-white\/15 max-lg:text-white/);
      expect(source).toMatch(/className="relative w-full h-full flex flex-col items-center justify-center"/);
    },
  );
});

// Light mode is already a bright page, so the dark scrim above reads like an
// error/warning chip instead of a hint. It flips to a white pill + gray text
// in light mode via a dedicated .scroll-hint-pill hook, keeping the same
// "fixed regardless of the screenshot underneath" property in both themes.
describe('scroll-hint pill flips to a white/gray pill in light mode', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/styles/projects-tailwind.css'), 'utf8');

  it('overrides .scroll-hint-pill under :root[data-theme="light"] with a white background and gray text', () => {
    const block = source.match(/:root\[data-theme="light"\] \.scroll-hint-pill \{[^}]*\}/)?.[0];
    expect(block).toBeTruthy();
    expect(block).toMatch(/background-color:\s*#fff(?:fff)?;/);
    expect(block).toMatch(/color:\s*#4b5563;/);
  });
});
