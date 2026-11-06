import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Performance regressions in the How I Use AI viewer (2026-11 review).
const read = (p: string) => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8').replace(/\r\n/g, '\n');
const site = read('src/styles/portfolio.css');
const stage = read('src/components/AiAppStage.css');
const stageTsx = read('src/components/AiAppStage.tsx');
const skills = read('src/components/SkillsSection.tsx');

describe('How I Use AI viewer — performance', () => {
  // An animated outline on the window repainted all of it every frame while
  // hovered; the ripple is now a separate ring animating transform/opacity.
  it('draws the window ripple as a compositor-only ring, not an animated outline', () => {
    expect(stage).not.toMatch(/\.aas-window:hover \{[^}]*animation/);
    const ring = site.match(/\n {4}\.ai-stage::after \{([^}]*)\}/)![1];
    expect(ring).toMatch(/will-change: transform, opacity;/);
    expect(site).toMatch(/\.ai-stage:has\(> \.aas-window:hover\)::after \{ animation: aas-radar/);
    const kf = site.match(/@keyframes aas-radar \{([\s\S]*?)\n {4}\}/)![1];
    expect(kf).not.toMatch(/outline|inset|width|height/);
    expect(site).toMatch(/:root\[data-theme="light"\] \.ai-stage::after \{ display: none; \}/);
  });

  // The client phone and the front panel ripple on hover too, the same
  // compositor-only way as the window.
  it('ripples the phone and the front panel on hover without repainting them', () => {
    const ring = stage.match(/\n\.aas-sat::after \{([^}]*)\}/)![1];
    expect(ring).toMatch(/will-change: transform, opacity;/);
    expect(ring).toMatch(/pointer-events: none;/);
    expect(stage).toMatch(/\.aas-sat:hover::after \{ animation: aas-sat-radar 3s ease-out infinite; \}/);
    const kf = stage.match(/@keyframes aas-sat-radar \{([\s\S]*?)\n\}/)![1];
    expect(kf).not.toMatch(/outline|inset|width|height|box-shadow/);
    expect(stage).toMatch(/:root\[data-theme="light"\] \.aas-sat::after \{ display: none; \}/);
  });

  // Desktop: the window gives up room right and below so the phone and the
  // panel mostly sit outside it.
  it('keeps the phone and the front panel mostly outside the window on desktop', () => {
    const desk = stage.slice(stage.indexOf('@media (min-width: 961px) {\n  .ai-viewer .ai-stage {'));
    expect(desk).toMatch(/margin-bottom: var\(--aas-sat-below\);/);
    expect(desk).toMatch(/\.aas-phone \{[^}]*right: calc\(-1 \* var\(--aas-sat-reach\)\);/);
    expect(desk).toMatch(/\.aas-front \{[^}]*left: calc\(-1 \* clamp\(48px, 6vw, 90px\)\);/);
  });

  // Light mode uses three whites across the stage: page #F7FAFC, sunken
  // surfaces in the window's lavender, raised cards #fff. The phone screen
  // had its own blue-grey.
  it('gives the light-mode phone screen the window\'s sunken lavender', () => {
    expect(stage).toMatch(/:root\[data-theme="light"\] \.aas-phone-screen \{ background: var\(--bg-hover\); \}/);
    expect(stage).not.toMatch(/#eef1f6/i);
    expect(stage).toMatch(/:root\[data-theme="light"\] \.aas-window \{\n {2}--w-bg: var\(--bg-hover\);/);
  });

  it('drops the backdrop blur on the opaque light-mode stage', () => {
    const light = site.match(/:root\[data-theme="light"\] \.ai-viewer \{([^}]*)\}/)![1];
    expect(light).toMatch(/backdrop-filter: none;/);
  });

  it('skips layout and paint for hidden screens, after their exit fade', () => {
    const base = stage.match(/\n\.aas-screen \{([^}]*)\}/)![1];
    expect(base).toMatch(/content-visibility: hidden;/);
    expect(base).toMatch(/content-visibility \.3s allow-discrete/);
    const on = stage.match(/\n\.aas-screen\.is-active \{([^}]*)\}/)![1];
    expect(on).toMatch(/content-visibility: visible;/);
  });

  it('pauses the Workflow phase timer while the window is off screen', () => {
    const fx = stageTsx.slice(stageTsx.indexOf('function WorkflowScreen'), stageTsx.indexOf('useScreenIntro(active, ref', stageTsx.indexOf('function WorkflowScreen')));
    expect(fx).toMatch(/new IntersectionObserver\(entries => \(entries\.some\(e => e\.isIntersecting\) \? run\(\) : stop\(\)\)\)/);
    expect(fx).toMatch(/io\?\.disconnect\(\);/);
  });

  it('measures every pill before tweening (one layout pass per morph)', () => {
    const fx = skills.slice(skills.indexOf('const pills = Array.from(pillRefs.current'), skills.indexOf('}, [expandedAiCard, isViewer, isCompact, t, viewerResizeTick]);'));
    const read = fx.indexOf('const sizes = pills.map');
    expect(read).toBeGreaterThan(fx.indexOf("gsap.set(p.li, { clearProps: 'width' })"));
    expect(fx.indexOf('gsap.set(p.li, sizes[i])')).toBeGreaterThan(read);
    expect(fx.indexOf('gsap.to(p.li')).toBeGreaterThan(read);
  });

  it('legacy-card effects bail out in viewer mode', () => {
    for (const marker of [
      "aiFlowGridRef.current?.classList.toggle('has-expanded'",
      "cardRefs.current.get('workflow')",
      "document.querySelector('.ai-flow-grid svg')",
      "document.querySelectorAll<HTMLElement>('.ai-card').forEach",
    ]) {
      const at = skills.indexOf(marker);
      const head = skills.slice(skills.lastIndexOf('Effect(() => {', at), at);
      expect(head, marker).toMatch(/if \(isViewer\) return;/);
    }
  });
});
