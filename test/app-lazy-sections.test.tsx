import fs from 'node:fs';
import path from 'node:path';
import { lazy, Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LangProvider } from '../src/context/LangContext';

// Regression coverage for App.tsx splitting About/Skills/Portfolio/Contact
// out of the main bundle via React.lazy + Suspense (main chunk went from
// 379KB to 107KB raw). Two things could silently break this and only show
// up at runtime, never at build time:
//
// 1. A lazy() wrapper without a Suspense ancestor throws
//    "A component suspended while responding to synchronous input" the
//    moment the page tries to render it — build/typecheck don't catch a
//    missing <Suspense> boundary, since lazy()'s return type is a normal
//    component type either way.
// 2. The dynamic import() resolving to something without a usable default
//    export (e.g. a refactor that changes a component to a named export)
//    fails the same way, silently, only in the browser.
//
// Rendering the full <App/> tree here would drag in Navbar/HeroSection/
// BeamsBackground's IntersectionObserver/GSAP ScrollTrigger/Spline-runtime
// setup, none of which this change touches. Testing the lazy+Suspense
// mechanism directly (same pattern App.tsx uses, on one of the same
// components) covers the actual failure modes above without that unrelated
// mocking burden.

// SpecularOverlay (rendered by ContactSection's Send Email button) drives a
// real WebGL2 context via `ogl`, which jsdom can't provide — same stub as
// test/contact-faq.test.tsx, needed here for the same reason.
vi.mock('ogl', () => {
  class Renderer {
    gl: unknown;
    constructor() {
      this.gl = {
        clearColor() {},
        enable() {},
        blendFunc() {},
        BLEND: 0,
        ONE: 0,
        ONE_MINUS_SRC_ALPHA: 0,
        canvas: document.createElement('canvas'),
        getExtension: () => null,
      };
    }
    setSize() {}
    render() {}
  }
  class Program {
    uniforms: unknown;
    constructor(_gl: unknown, opts: { uniforms: unknown }) {
      this.uniforms = opts.uniforms;
    }
  }
  class Mesh {}
  class Triangle {
    attributes = {};
  }
  class Color {
    r = 0;
    g = 0;
    b = 0;
    set() {}
  }
  return { Renderer, Program, Mesh, Triangle, Color };
});

describe('App.tsx lazy-loaded sections', () => {
  it('resolves a lazy-loaded section through Suspense to real content', async () => {
    const ContactSection = lazy(() => import('../src/components/ContactSection'));
    render(
      <LangProvider>
        <Suspense fallback={<div data-testid="fallback">loading</div>}>
          <ContactSection />
        </Suspense>
      </LangProvider>
    );
    // Resolves to the component's own content once the import settles —
    // the fallback render on the synchronous first pass isn't asserted
    // directly (it races the already-resolved import cache across test
    // runs), only that real content shows up. Default findByRole timeout
    // (1000ms) is too tight under the full suite's transform/module load;
    // the dynamic import itself is what's being waited on here, not a
    // fixed-delay animation, so a generous timeout costs nothing when fast.
    // The enclosing `it()` needs the same generous budget (vitest's own
    // default 5000ms test timeout raced findByRole's internal one and lost
    // under full-suite load, even though both were nominally 5000ms).
    expect(await screen.findByRole('heading', { level: 2 }, { timeout: 15000 })).toBeTruthy();
  }, 20000);

  it('wraps every lazy-loaded section usage in a height-reserving <Suspense> fallback', () => {
    const appSrc = fs.readFileSync(path.resolve(__dirname, '../src/App.tsx'), 'utf8');
    const sections = {
      AboutSection: 'about',
      SkillsSection: 'skills',
      PortfolioSection: 'portfolio',
      ContactSection: 'contact',
    };
    for (const [name, fallback] of Object.entries(sections)) {
      expect(appSrc).toMatch(new RegExp(`const ${name} = lazy\\(`));
      // Every *usage* of <Name /> must have a <Suspense ...> immediately
      // before it on the same line (App.tsx renders these inline, one
      // element per JSX line) — not just a Suspense boundary existing
      // somewhere else in the file.
      const usageLines = appSrc.split('\n').filter(l => l.includes(`<${name} />`));
      expect(usageLines.length).toBeGreaterThan(0);
      for (const line of usageLines) {
        expect(line).toMatch(/<Suspense[\s>]/);
        expect(line).toContain(`fallback={<LazySectionFallback name="${fallback}" />}`);
      }
    }
  });

  // Regression: a rejected import() (stale tab after a redeploy requesting a
  // deleted chunk hash, or a flaky network) throws during render. With no
  // error boundary, React unmounts the whole tree to a blank page instead of
  // just the failed section. See test/error-boundary-lazy-section.regression.test.tsx
  // for the catching behavior itself — this only checks App.tsx actually
  // wires the boundary around every lazy usage.
  it('wraps every lazy-loaded section usage in its own <ErrorBoundary>', () => {
    const appSrc = fs.readFileSync(path.resolve(__dirname, '../src/App.tsx'), 'utf8');
    for (const name of ['AboutSection', 'SkillsSection', 'PortfolioSection', 'ContactSection']) {
      const usageLines = appSrc.split('\n').filter(l => l.includes(`<${name} />`));
      expect(usageLines.length).toBeGreaterThan(0);
      for (const line of usageLines) {
        expect(line).toMatch(/<ErrorBoundary[\s>]/);
      }
    }
  });
});
