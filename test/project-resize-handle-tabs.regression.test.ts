import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
// @ts-expect-error plain JS module
import get16by9FloorVh, { mobileStageHeightVh } from '../src/projects/shared/mobileVisualHeight.js';

// The phone-only drag handle that resizes a project page's stage used to be
// there on every tab — including background and process, whose stage holds a
// fixed 16:9 image that the handle would only stretch. It now exists (and a
// dragged height applies) only on the tabs whose stage shows a screenshot
// picked from the list: the solution/highlights tabs and the gallery.
const ROOT = path.resolve(__dirname, '..');

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
};
const original = { width: window.innerWidth, height: window.innerHeight };
afterEach(() => setViewport(original.width, original.height));

describe('mobileStageHeightVh', () => {
  it('uses the dragged height on a resizable tab', () => {
    setViewport(390, 844);
    expect(mobileStageHeightVh(true, 62)).toBe(62);
  });

  it('ignores the dragged height on any other tab and stays at the 16:9 floor', () => {
    setViewport(390, 844);
    expect(mobileStageHeightVh(false, 62)).toBe(get16by9FloorVh());
    expect((mobileStageHeightVh(false, 62) / 100) * 844 / 390).toBeCloseTo(9 / 16, 5);
  });
});

// [page, tabs that keep the handle, tabs that must not have it]
const PAGES: [string, string[], string[]][] = [
  ['project_02.jsx', ['features', 'gallery'], ['context', 'focus']],
  ['project_04.jsx', ['solution', 'climax'], ['context', 'process']],
  // project_05's 'process' id is its web back-office tab — no handle there
  // either; 'solution' is the mobile app tab
  ['project_05.jsx', ['solution', 'climax'], ['context', 'process']],
  // project_06's three middle tabs are before/after feature comparisons
  ['project_06.jsx', ['ux_strategy', 'biz_value', 'engagement', 'gallery'], ['context']],
  ['project_07.jsx', ['highlights', 'gallery'], ['request', 'process']],
  ['project_08.jsx', ['solution', 'climax'], ['context', 'process']],
  ['project_09.jsx', ['solution', 'climax'], ['context', 'process']],
  ['project_10.jsx', ['solution', 'climax'], ['context', 'process']],
  ['project_11.jsx', ['solution', 'climax'], ['context', 'process']],
];

describe.each(PAGES)('%s limits the resize handle to its screenshot tabs', (file, resizable, fixed) => {
  const jsx = fs.readFileSync(path.join(ROOT, 'src/projects', file), 'utf8');
  const list = (name: string) => {
    const m = jsx.match(new RegExp(`const ${name} = \\[([^\\]]*)\\];`));
    return m ? m[1].split(',').map(s => s.trim().replace(/'/g, '')) : null;
  };

  it('declares exactly those tabs as resizable, all of them real tabs', () => {
    expect(list('RESIZABLE_TABS')).toEqual(resizable);
    expect(list('TAB_ORDER')).toEqual(expect.arrayContaining([...resizable, ...fixed]));
    expect(list('TAB_ORDER')!.length).toBe(resizable.length + fixed.length);
    expect(jsx).toMatch(/const canResizeVisual = RESIZABLE_TABS\.includes\(activeTab\);/);
  });

  it('renders the handle only while the active tab is resizable', () => {
    expect(jsx.match(/<ResizeHandle /g)?.length).toBe(1);
    expect(jsx).toMatch(/\{canResizeVisual && <ResizeHandle prefix="[a-z]+" onMouseDown=\{handleResizeStart\} onTouchStart=\{handleResizeStart\} \/>\}/);
  });

  it('sizes the stage through mobileStageHeightVh, never from the dragged height directly', () => {
    expect(jsx).toContain("height: window.innerWidth < 1024 ? `${mobileStageHeightVh(canResizeVisual, mobileVisualHeight)}dvh` : '100%'");
    expect(jsx).not.toContain('`${mobileVisualHeight}vh`');
  });
});

describe('pages without a resizable stage', () => {
  it.each(['project_01.jsx', 'project_03.jsx', 'project_12.jsx', 'project_13.jsx'])('%s has no handle to gate', (file) => {
    expect(fs.readFileSync(path.join(ROOT, 'src/projects', file), 'utf8')).not.toMatch(/<ResizeHandle /);
  });
});
