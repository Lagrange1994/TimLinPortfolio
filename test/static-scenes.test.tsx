// Static scenes: a desktop whose GPU can't run the Spline scenes gets the
// phones' still images instead (src/utils/staticScenes.ts). Covers the
// index.html probe that decides it before anything loads, the preloads it
// steers, the runtime fallback, and what the components/loader do with it.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  STATIC_SCENES_ATTR, STATIC_SCENES_KEY, fallBackToStaticScenes, onStaticScenesChange, staticScenesOn,
} from '../src/utils/staticScenes';
import Loader, { CALM_MAX_WAIT_MS } from '../src/components/Loader';
import BeamsBackground from '../src/components/BeamsBackground';

const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');

function inlineScript(marker: string) {
  const at = html.indexOf(marker);
  const start = html.lastIndexOf('<script>', at) + '<script>'.length;
  return html.slice(start, html.indexOf('</script>', at));
}

const RENDERERS = {
  hd4600: 'ANGLE (Intel, Intel(R) HD Graphics 4600 (0x00000416) Direct3D11 vs_5_0 ps_5_0, D3D11)',
  uhd620: 'ANGLE (Intel, Intel(R) UHD Graphics 620 (0x00005917) Direct3D11 vs_5_0 ps_5_0, D3D11)',
  irisXe: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x00009A49) Direct3D11 vs_5_0 ps_5_0, D3D11)',
  rtx: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Laptop GPU (0x00002560) Direct3D11 vs_5_0 ps_5_0, D3D11)',
  swiftshader: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
  basic: 'ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0, D3D11)',
};

type ProbeOpts = {
  renderer?: string | null; // null = no WebGL2 context
  desktop?: boolean;
  search?: string;
  stored?: string | null;
  cores?: number;
  memory?: number;
  legacy?: string | null;
};

// Runs index.html's tl-static-scenes script against a fake environment.
function probe({ renderer = RENDERERS.rtx, desktop = true, search = '', stored = null, cores = 8, memory = 8, legacy = null }: ProbeOpts = {}) {
  const attrs: Record<string, string> = {};
  const storage: Record<string, string> = stored === null ? {} : { [STATIC_SCENES_KEY]: stored };
  if (legacy !== null) storage['tl-static-scenes'] = legacy;
  const lost = vi.fn();
  const gl = renderer === null ? null : {
    RENDERER: 0x1F01,
    getExtension: (name: string) => (name === 'WEBGL_debug_renderer_info'
      ? { UNMASKED_RENDERER_WEBGL: 0x9246 }
      : name === 'WEBGL_lose_context' ? { loseContext: lost } : null),
    getParameter: (p: number) => (p === 0x9246 ? renderer : 'WebKit WebGL'),
  };
  const getContext = vi.fn(() => gl);
  const win: Record<string, unknown> = {
    matchMedia: () => ({ matches: desktop }),
  };
  const doc = {
    documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v; } },
    createElement: () => ({ getContext }),
  };
  const ls = {
    getItem: (k: string) => storage[k] ?? null,
    removeItem: (k: string) => { delete storage[k]; },
  };
  new Function('window', 'document', 'navigator', 'location', 'localStorage', inlineScript('/* tl-static-scenes */'))(
    win, doc, { hardwareConcurrency: cores, deviceMemory: memory }, { search }, ls,
  );
  return { reason: attrs[STATIC_SCENES_ATTR] ?? null, win, storage, getContext, lost };
}

describe('index.html static-scenes probe', () => {
  it('runs before the preloads and the viewer script', () => {
    const at = html.indexOf('/* tl-static-scenes */');
    expect(at).toBeGreaterThan(0);
    expect(at).toBeLessThan(html.indexOf("preload('fetch', '/models/hero_figure.splinecode')"));
    expect(at).toBeLessThan(html.indexOf('splineViewer.src'));
  });

  it('leaves capable GPUs on the 3D scenes (incl. Iris Xe, which the governor handles)', () => {
    expect(probe({ renderer: RENDERERS.rtx }).reason).toBeNull();
    expect(probe({ renderer: RENDERERS.irisXe }).reason).toBeNull();
  });

  it('sends older Intel HD / UHD iGPUs to the images', () => {
    expect(probe({ renderer: RENDERERS.hd4600 }).reason).toBe('old-igpu');
    expect(probe({ renderer: RENDERERS.uhd620 }).reason).toBe('old-igpu');
  });

  it('sends software renderers and missing WebGL2 to the images', () => {
    expect(probe({ renderer: RENDERERS.swiftshader }).reason).toBe('software');
    expect(probe({ renderer: RENDERERS.basic }).reason).toBe('software');
    expect(probe({ renderer: null }).reason).toBe('no-webgl2');
  });

  it('asks for no context rather than a software one, and releases its probe context', () => {
    const { getContext, lost } = probe();
    expect(getContext).toHaveBeenCalledWith('webgl2', { failIfMajorPerformanceCaveat: true });
    expect(lost).toHaveBeenCalled();
  });

  it('sends dual-core / 2 GB machines to the images', () => {
    expect(probe({ cores: 2 }).reason).toBe('low-end');
    expect(probe({ memory: 2 }).reason).toBe('low-end');
    expect(probe({ cores: 4, memory: 4 }).reason).toBeNull();
  });

  it('remembers a runtime give-up for the same GPU only', () => {
    expect(probe({ stored: RENDERERS.rtx }).reason).toBe('slow');
    expect(probe({ stored: 'some other GPU' }).reason).toBeNull();
  });

  it('exposes the renderer for the runtime fallback to remember', () => {
    expect(probe().win.__tlGpuRenderer).toBe(RENDERERS.rtx);
  });

  it('?scenes=3d forces 3D, forgets a stored give-up and disables the runtime fallback', () => {
    const r = probe({ renderer: RENDERERS.hd4600, search: '?scenes=3d', stored: RENDERERS.hd4600 });
    expect(r.reason).toBeNull();
    expect(r.win.__tlScenesForced).toBe(true);
    expect(r.storage[STATIC_SCENES_KEY]).toBeUndefined();
  });

  // Regression: v1 verdicts could come from a covered window's throttled
  // frames (sceneQualityGovernor.ts), e.g. an RTX 4070 pinned to the images.
  it('ignores and deletes a v1 (tl-static-scenes) verdict', () => {
    const r = probe({ renderer: RENDERERS.rtx, legacy: RENDERERS.rtx });
    expect(r.reason).toBeNull();
    expect(r.storage['tl-static-scenes']).toBeUndefined();
    expect(STATIC_SCENES_KEY).toBe('tl-static-scenes-v2');
  });

  it('?scenes=static forces the images', () => {
    expect(probe({ search: '?scenes=static' }).reason).toBe('forced');
  });

  it('does nothing on phones (they always use the images)', () => {
    const r = probe({ renderer: RENDERERS.hd4600, desktop: false });
    expect(r.reason).toBeNull();
    expect(r.getContext).not.toHaveBeenCalled();
  });
});

// Runs index.html's preload script against a fake environment.
function preloads({ desktop = true, isStatic = false, light = false } = {}) {
  const links: Record<string, string>[] = [];
  const win: Record<string, unknown> = { matchMedia: () => ({ matches: desktop }) };
  const doc = {
    documentElement: {
      getAttribute: (k: string) => (k === 'data-theme' && light ? 'light' : null),
      hasAttribute: (k: string) => k === STATIC_SCENES_ATTR && isStatic,
    },
    createElement: () => ({}),
    head: { appendChild: (l: Record<string, string>) => { links.push(l); } },
  };
  new Function('window', 'document', inlineScript("window.__tlSplineViewerSrc = "))(win, doc);
  return { hrefs: links.map(l => `${l.rel}:${l.href}`), loadViewer: win.__tlLoadSplineViewer };
}

describe('index.html preloads follow the static-scenes verdict', () => {
  it('3D desktop: viewer runtime, figure scene and the active theme’s bg scene', () => {
    const { hrefs, loadViewer } = preloads();
    expect(hrefs).toEqual([
      'modulepreload:https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js',
      'preload:/models/hero_figure.splinecode',
      'preload:/models/bg_scene.splinecode',
    ]);
    expect(loadViewer).toBe(true);
  });

  it('static desktop: only the desktop still background, no viewer runtime', () => {
    expect(preloads({ isStatic: true })).toEqual({ hrefs: ['preload:/img/bg_static.webp'], loadViewer: false });
    expect(preloads({ isStatic: true, light: true }).hrefs).toEqual(['preload:/img/bg_static_w.webp']);
  });

  it('phone: the phone background image, no viewer runtime', () => {
    expect(preloads({ desktop: false })).toEqual({ hrefs: ['preload:/img/bg.webp'], loadViewer: false });
    expect(preloads({ desktop: false, light: true }).hrefs).toEqual(['preload:/img/bg_w.webp']);
  });

  it('the viewer <script> is only inserted when a scene will run', () => {
    expect(html).toMatch(/if \(window\.__tlLoadSplineViewer !== false\) \{\s*var splineViewer = document\.createElement\('script'\);/);
    expect(html).not.toMatch(/<script type="module" src="https:\/\/unpkg\.com\/@splinetool/);
  });
});

describe('fallBackToStaticScenes', () => {
  afterEach(() => {
    document.documentElement.removeAttribute(STATIC_SCENES_ATTR);
    delete (window as unknown as Record<string, unknown>).__tlGpuRenderer;
    delete (window as unknown as Record<string, unknown>).__tlScenesForced;
    localStorage.clear();
  });

  it('flips the verdict, notifies subscribers and remembers this GPU', () => {
    (window as unknown as Record<string, unknown>).__tlGpuRenderer = RENDERERS.uhd620;
    const cb = vi.fn();
    const off = onStaticScenesChange(cb);
    expect(staticScenesOn()).toBe(false);
    fallBackToStaticScenes();
    expect(document.documentElement.getAttribute(STATIC_SCENES_ATTR)).toBe('slow');
    expect(staticScenesOn()).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(STATIC_SCENES_KEY)).toBe(RENDERERS.uhd620);
    fallBackToStaticScenes(); // already static: no second notification
    expect(cb).toHaveBeenCalledTimes(1);
    off();
  });

  it('does not remember anything when the renderer is unknown', () => {
    fallBackToStaticScenes();
    expect(staticScenesOn()).toBe(true);
    expect(localStorage.getItem(STATIC_SCENES_KEY)).toBeNull();
  });

  it('is a no-op when 3D was forced with ?scenes=3d', () => {
    (window as unknown as Record<string, unknown>).__tlScenesForced = true;
    fallBackToStaticScenes();
    expect(staticScenesOn()).toBe(false);
  });
});

describe('Loader on static scenes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
    document.documentElement.setAttribute(STATIC_SCENES_ATTR, 'old-igpu');
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    document.documentElement.removeAttribute(STATIC_SCENES_ATTR);
    document.body.classList.remove('hero-ready');
    document.body.innerHTML = '';
  });

  it('waits for the background image, even before it is portaled in', () => {
    render(createElement(Loader));
    vi.advanceTimersByTime(1000);
    expect(document.body.classList.contains('hero-ready')).toBe(false); // not in the DOM yet
    const img = document.createElement('img');
    img.className = 'spline-bg-layer is-active';
    let complete = false;
    Object.defineProperty(img, 'complete', { get: () => complete });
    document.body.appendChild(img);
    vi.advanceTimersByTime(1000);
    expect(document.body.classList.contains('hero-ready')).toBe(false);
    complete = true;
    vi.advanceTimersByTime(300 + CALM_MAX_WAIT_MS);
    expect(document.body.classList.contains('hero-ready')).toBe(true);
  });
});

describe('BeamsBackground on static scenes', () => {
  class FakeIO { observe() {} unobserve() {} disconnect() {} }
  class FakeRO { observe() {} disconnect() {} }
  const origIO = globalThis.IntersectionObserver;
  const origRO = globalThis.ResizeObserver;
  let home: HTMLElement;

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
    (globalThis as unknown as Record<string, unknown>).IntersectionObserver = FakeIO;
    (globalThis as unknown as Record<string, unknown>).ResizeObserver = FakeRO;
    home = document.createElement('section');
    home.id = 'home';
    document.body.appendChild(home);
  });
  afterEach(() => {
    cleanup();
    (globalThis as unknown as Record<string, unknown>).IntersectionObserver = origIO;
    (globalThis as unknown as Record<string, unknown>).ResizeObserver = origRO;
    document.documentElement.removeAttribute(STATIC_SCENES_ATTR);
    document.documentElement.removeAttribute('data-theme');
    home.remove();
  });

  it('keeps the desktop panel but shows the desktop still images instead of the viewers', () => {
    document.documentElement.setAttribute(STATIC_SCENES_ATTR, 'old-igpu');
    render(createElement(BeamsBackground));
    expect(home.querySelector('#bg-frame-outline')).not.toBeNull();
    expect(home.querySelectorAll('spline-viewer')).toHaveLength(0);
    const imgs = [...home.querySelectorAll<HTMLImageElement>('#bg-spline-scene img.spline-bg-layer')];
    expect(imgs.map(i => i.getAttribute('src'))).toEqual(['./img/bg_static.webp', './img/bg_static_w.webp']);
    expect(imgs.map(i => i.classList.contains('is-active'))).toEqual([true, false]);
  });

  it('swaps the running viewers for the images when the governor gives up', () => {
    render(createElement(BeamsBackground));
    expect(home.querySelectorAll('spline-viewer')).toHaveLength(2);
    act(() => { fallBackToStaticScenes(); });
    expect(home.querySelectorAll('spline-viewer')).toHaveLength(0);
    expect(home.querySelectorAll('#bg-spline-scene img.spline-bg-layer')).toHaveLength(2);
  });
});

describe('HeroSection / CSS on static scenes', () => {
  const hero = readFileSync(resolve(__dirname, '../src/components/HeroSection.tsx'), 'utf8');
  const css = readFileSync(resolve(__dirname, '../src/styles/portfolio.css'), 'utf8');

  it('does not mount the figure viewer, and skips loading/pausing/syncing it', () => {
    expect(hero).toContain('{!staticScenes && <spline-viewer id="hero-spline" className="hero-fig-desktop" />}');
    expect(hero.match(/if \(window\.innerWidth < 768 \|\| staticScenes[ )]/g)).toHaveLength(3);
  });

  it('shows the phones’ figure image on desktop, placed like the viewer', () => {
    expect(css).toMatch(/html\[data-static-scenes\] \.hero-fig-mobile \{\s*display: block !important;\s*position: absolute;\s*top: 0;\s*left: 50%;\s*height: 100%;\s*width: auto;\s*translate: -50% 0;/);
  });

  it('freezes the panel glow like a degraded quality level does', () => {
    expect(css).toMatch(/html\[data-scene-quality\]:not\(\[data-scene-quality="0"\]\) \.bg-frame-glow-fill,\s*html\[data-static-scenes\] \.bg-frame-glow-fill \{\s*animation: none;/);
  });
});
