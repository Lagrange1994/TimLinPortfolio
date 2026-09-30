import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// Every project page's split-view panel (title + subtitle + TabNav, sticky
// above the scrollable tab content) collapses its title/subtitle on phones
// as soon as the tab content scrolls at all, and only re-expands once
// scrolled all the way back to the top — not on any upward scroll, so a
// partial scroll-up mid-content doesn't pop it back open. The collapse
// itself is driven every rAF frame off a --collapse CSS var (not a class +
// fixed-duration CSS transition), with the per-frame damping factor derived
// from how hard the triggering scroll tick was — a fast/hard scroll snaps it
// shut or open quickly, a gentle scroll eases it in slowly. Desktop is
// untouched: the collapse CSS only exists inside the shared
// @media (max-width: 1023.98px) block, and --collapse is never written to
// outside that same per-project effect.
// project_01 first (see its own history in git blame), then rolled out
// identically to every other project page (02–12); project_13 uses its own
// separate layout/stylesheet (see CLAUDE.md) and isn't part of this system.
describe.each([
  'project_01.jsx', 'project_02.jsx', 'project_03.jsx', 'project_04.jsx',
  'project_05.jsx', 'project_06.jsx', 'project_07.jsx', 'project_08.jsx',
  'project_09.jsx', 'project_10.jsx', 'project_11.jsx', 'project_12.jsx',
])('%s sticky panel header collapses on scroll with scroll-force-driven damping (mobile only)', (file) => {
  const jsx = fs.readFileSync(path.join(ROOT, 'src/projects', file), 'utf8');

  it('gives the header wrapper its own ref instead of React state', () => {
    expect(jsx).toMatch(/const panelHeaderRef = useRef\(null\);/);
    expect(jsx).not.toMatch(/panelHeaderCollapsed/);
  });

  it('derives target (collapsed vs expanded) purely from scrollTop > 0', () => {
    const effect = jsx.match(/useEffect\(\(\) => \{\s*const scrollEl = contentScrollRef\.current;[\s\S]*?\}, \[\]\);/)?.[0];
    expect(effect).toBeTruthy();
    expect(effect).toMatch(/target = top > 0 \? 1 : 0;/);
  });

  it("derives the per-frame damping factor from this scroll tick's own force (scrollTop delta), not a constant", () => {
    const effect = jsx.match(/useEffect\(\(\) => \{\s*const scrollEl = contentScrollRef\.current;[\s\S]*?\}, \[\]\);/)?.[0];
    expect(effect).toMatch(/const force = Math\.abs\(top - lastScrollTop\);/);
    expect(effect).toMatch(/damping = Math\.min\(0\.35, Math\.max\(0\.08, force \/ 30\)\);/);
    expect(effect).toMatch(/progress \+= \(target - progress\) \* damping;/);
  });

  it('drives the CSS var straight from rAF (no React re-render in the hot path)', () => {
    const effect = jsx.match(/useEffect\(\(\) => \{\s*const scrollEl = contentScrollRef\.current;[\s\S]*?\}, \[\]\);/)?.[0];
    expect(effect).toMatch(/headerEl\.style\.setProperty\('--collapse', progress\);/);
    expect(effect).toMatch(/requestAnimationFrame\(tick\)/);
    expect(effect).toMatch(/cancelAnimationFrame\(raf\)/);
  });

  it('resets --collapse to 0 instantly (no damping) when the active tab changes', () => {
    expect(jsx).toMatch(/if \(panelHeaderRef\.current\) panelHeaderRef\.current\.style\.setProperty\('--collapse', 0\);/);
  });

  it('wraps the title + subtitle (not TabNav) in a ref-attached .panel-header-titles', () => {
    expect(jsx).toMatch(/<div ref=\{panelHeaderRef\} className="panel-header-titles">/);
    expect(jsx).toMatch(/panel-title/);
  });
});

describe('.panel-header-titles CSS', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/projects-tailwind.css'), 'utf8');

  it('scopes the collapse CSS to the shared mobile breakpoint and drives it continuously off --collapse', () => {
    const mobileBlockStart = css.indexOf('@media (max-width: 1023.98px)');
    const mobileBlockEnd = css.indexOf('\n}', css.indexOf('.panel-header-titles', mobileBlockStart));
    const block = css.slice(mobileBlockStart, mobileBlockEnd);
    expect(block).toMatch(/\.panel-header-titles \{\s*--collapse:\s*0;\s*max-height:\s*calc\(120px \* \(1 - var\(--collapse\)\)\);\s*opacity:\s*calc\(1 - var\(--collapse\)\);\s*overflow:\s*hidden;\s*\}/);
    // No CSS transition on this property — the JS rAF loop is the only
    // easing; a transition here would fight its per-frame writes.
    expect(block).not.toMatch(/\.panel-header-titles[^{]*\{[^}]*transition/);
    // sanity check: this rule must actually be nested inside the @media block.
    expect(css.indexOf('.panel-header-titles')).toBeGreaterThan(mobileBlockStart);
  });

  it('appears exactly once (shared by every project page, not duplicated per project)', () => {
    expect(css.match(/\.panel-header-titles \{/g)?.length).toBe(1);
  });
});
