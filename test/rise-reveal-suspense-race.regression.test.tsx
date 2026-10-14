import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lazy, Suspense, type ComponentType } from 'react';
import { render, waitFor } from '@testing-library/react';

// Regression: wrapping About/Skills/Portfolio/Contact in React.lazy +
// Suspense (App.tsx) broke their scroll-reveal entrance animation —
// content stayed permanently at opacity:0 after scrolling to it. Reported
// directly: "about me 內容捲動後顯示不出來".
//
// Root cause: both LazyUnit's reveal-setup effect (`[loaded]` deps) and
// useRiseReveal()'s one-time app-root scan (`[]` deps) ran BEFORE the
// lazy-loaded child's import resolved — Suspense was still showing
// `fallback={null}`, so `el.querySelectorAll('section')` found nothing.
// Neither ever ran a second time once the real content actually landed, so
// `.rise-card`/`.rise-soft` items inside it never got a ScrollTrigger and
// stayed hidden forever. This only affects the *first* resolution of each
// lazy import — a LazyUnit remount after that is synchronous (cached
// module), which is why this didn't show up as "every entrance animation
// is broken", only "the first time each lazy section appears".
window.matchMedia = (() => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
})) as unknown as typeof window.matchMedia;

const setupRiseRevealMock = vi.fn<(sections: HTMLElement[]) => () => void>(() => () => {});
// Only overrides setupRiseReveal for *cross-file* importers (LazyUnit.tsx,
// below) — useRiseReveal() is re-exported from the real module via
// importOriginal, and its own internal call to setupRiseReveal is a
// same-file reference that isn't rewritten by this mock, so the second
// describe block below still exercises the real implementation.
vi.mock('../src/utils/useRiseReveal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/utils/useRiseReveal')>();
  return {
    ...actual,
    setupRiseReveal: (sections: HTMLElement[]) => setupRiseRevealMock(sections),
  };
});

describe('LazyUnit + React.lazy/Suspense', () => {
  beforeEach(() => setupRiseRevealMock.mockClear());

  it('does not call setupRiseReveal on an empty Suspense fallback, then calls it once the real section lands', async () => {
    const { default: LazyUnit } = await import('../src/components/LazyUnit');

    let resolveImport!: (mod: { default: ComponentType }) => void;
    const importPromise = new Promise<{ default: ComponentType }>(resolve => { resolveImport = resolve; });
    const LazyChild = lazy(() => importPromise);

    render(
      <LazyUnit name="test">
        <Suspense fallback={null}>
          <LazyChild />
        </Suspense>
      </LazyUnit>
    );

    // LazyUnit's own effect already ran once (loaded starts true) and found
    // no <section> under the still-suspended fallback — the bug was calling
    // setupRiseReveal([]) here and never again, not skipping the call
    // entirely, so this specifically guards "skip, don't fire on nothing".
    expect(setupRiseRevealMock).not.toHaveBeenCalled();

    resolveImport({ default: () => <section>content</section> });

    await waitFor(() => expect(setupRiseRevealMock).toHaveBeenCalledTimes(1));
    const sections = setupRiseRevealMock.mock.calls[0][0];
    expect(sections).toHaveLength(1);
    expect(sections[0].tagName).toBe('SECTION');
  });

  it('calls setupRiseReveal immediately (no observer wait) when the child is not lazy', async () => {
    const { default: LazyUnit } = await import('../src/components/LazyUnit');

    render(
      <LazyUnit name="test">
        <section>content</section>
      </LazyUnit>
    );

    // Synchronous child (the normal case, and every LazyUnit remount after
    // a lazy child's first resolution): no need to wait on a
    // MutationObserver, and must not double-call.
    expect(setupRiseRevealMock).toHaveBeenCalledTimes(1);
  });
});

describe('useRiseReveal() root-level scan', () => {
  it('reveals a <section> that appears after the initial scan (a lazy-loaded sibling resolving later)', async () => {
    document.body.innerHTML = '';
    const { useRiseReveal } = await import('../src/utils/useRiseReveal');
    const { renderHook } = await import('@testing-library/react');

    renderHook(() => useRiseReveal());

    // Simulate SkillsSection resolving after useRiseReveal()'s one-shot
    // ([] deps) scan already ran and found nothing.
    const late = document.createElement('section');
    late.innerHTML = '<div class="rise-soft">late content</div>';
    document.body.appendChild(late);

    await waitFor(() => {
      // autoAlpha:0 is the first thing setupRiseReveal's gsap.set() writes
      // on a found .rise-soft item (hiding it ahead of its own reveal
      // tween) — a synchronous, observable side effect proving
      // setupRiseReveal actually ran against this late-arriving section,
      // without reaching into GSAP/ScrollTrigger internals to check.
      const item = late.querySelector<HTMLElement>('.rise-soft');
      expect(item?.style.opacity).toBe('0');
    });

    document.body.innerHTML = '';
  });
});
