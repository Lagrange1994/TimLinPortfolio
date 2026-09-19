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

  it('uses lg:h-[90%] on the frame (desktop)', () => {
    expect(frameClassName).toBeTruthy();
    expect(frameClassName).toMatch(/lg:h-\[90%\]/);
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
    expect(imageAreaClassName).not.toMatch(/aspect-video/);
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
    expect(source).toMatch(/resizable \? 'max-lg:min-h-\[calc\(100%-4rem\)\]' : ''/);
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

  it('sizes the panel from mobileVisualHeight on phones, floor 35vh like project_02', () => {
    expect(source).toMatch(/useState\(35\)/);
    expect(source).toMatch(/\$\{mobileVisualHeight\}vh/);
    expect(source).toMatch(/newHeightVh < 35\) newHeightVh = 35/);
  });

  it('caps the drag at the height where the whole screenshot is visible (not a fixed 80vh)', () => {
    // upper limit comes from the rendered image height + the panel's fixed overhead
    expect(source).toMatch(/const getMaxVisualVh = \(\) =>/);
    expect(source).toMatch(/img\.offsetHeight \+ \(panel\.offsetHeight - area\.clientHeight\)/);
    expect(source).toMatch(/Math\.min\(80, Math\.max\(35,/);
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

// Phone panel = 35vh TOTAL on every project (project_02's spec), padding
// included. 01/03 used to put h-[35vh] on an inner box inside a p-4 panel
// (339px at 402x874), and project_06 defaulted to 40vh (350px).
describe('every project starts with the same 35vh phone panel as project_02', () => {
  const read = (file: string) => fs.readFileSync(path.join(ROOT, 'src/projects', file), 'utf8');

  it.each(['project_01.jsx', 'project_03.jsx'])('%s sizes the panel itself, not an inner box inside its padding', (file) => {
    const source = read(file);
    expect(source).toMatch(/shrink-0 max-lg:h-\[35vh\] z-20/);
    expect(source).not.toMatch(/w-full h-\[35vh\] lg:h-full/);
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
  ])('%s defaults the resizable panel to 35vh', (file) => {
    expect(read(file)).toMatch(/\[mobileVisualHeight, setMobileVisualHeight\] = useState\(35\)/);
  });

  it.each(['project_07.jsx', 'project_09.jsx', 'project_10.jsx', 'project_11.jsx'])(
    '%s floats the scroll hint in the gap below the frame on phones',
    (file) => {
      const source = read(file);
      expect(source).toMatch(/max-lg:absolute max-lg:bottom-0 max-lg:inset-x-0/);
      expect(source).toMatch(/className="relative w-full h-full flex flex-col items-center justify-center"/);
    },
  );
});
