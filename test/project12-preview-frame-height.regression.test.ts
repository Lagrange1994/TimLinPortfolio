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
// height (h-full / lg:h-[90%]). jsdom doesn't run real CSS layout, so this
// can't be caught by rendering and measuring — these are source-level
// guards that every project keeps using that shared component instead of a
// hand-rolled, content-driven frame.
describe('shared PreviewFrame sizes itself with a definite height', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/projects/shared/PreviewFrame.jsx'), 'utf8');

  const frameClassName = source.match(/relative w-full max-w-full[\s\S]*?\n\s*>/)?.[0];

  it('uses h-full and lg:h-[90%] on the frame', () => {
    expect(frameClassName).toBeTruthy();
    expect(frameClassName).toMatch(/\bh-full\b/);
    expect(frameClassName).toMatch(/lg:h-\[90%\]/);
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
