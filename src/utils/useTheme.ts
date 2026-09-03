import { useEffect, useRef, useState } from 'react';

export type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const isFirstRun = useRef(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Private-mode/storage-disabled: theme still applies for this load, just doesn't persist.
    }

    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    // Chromium leaves backdrop-filter content cards (.bento-card, .ai-card,
    // .tech-item, .process-card, .philosophy-card, .pill) painted with
    // their old background after a custom-property-only change like this
    // one — the property itself updates (confirmed via getPropertyValue)
    // but the composited layer's paint doesn't invalidate, so those cards
    // stay visually stuck in the previous theme until something forces
    // their layers to be torn down and rebuilt. A display:none/reflow/
    // restore does that.
    //
    // This used to scan the WHOLE document for any backdrop-filter element
    // (document.querySelectorAll('*'), 224+ matches on this page) — that
    // caught things far outside "content cards that need their background
    // fixed": the hero tag-capsule pills (which only gain backdrop-filter
    // in light mode, per :root[data-theme="light"] .tag-capsule in
    // portfolio.css) among them. Toggling display on an element resets
    // whatever IntersectionObserver-driven state it has (its intersection
    // ratio drops to 0, then back), so that broad scan was re-triggering
    // scroll-reveal/typewriter/carousel effects across large parts of the
    // page — the "refresh" the user was seeing wasn't imagined, it was
    // this. Naming only the actual content-card classes keeps this to the
    // ~28 elements that actually need it.
    const affected = Array.from(
      document.querySelectorAll<HTMLElement>('.bento-card, .ai-card, .tech-item, .process-card, .philosophy-card, .pill')
    );
    const prevDisplays = affected.map(el => el.style.display);
    affected.forEach(el => { el.style.display = 'none'; });
    void document.body.offsetHeight;
    affected.forEach((el, i) => { el.style.display = prevDisplays[i]; });
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}
