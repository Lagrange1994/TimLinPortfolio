import { useEffect, useState, type RefObject } from 'react';

// Design Process card illustrations (12 cards × 4 webp ≈ 12.6MB) used to be
// plain inline `background-image`s, and LazyUnit mounts every section once
// at load before unmounting the far ones — so all 48 were requested ~0.7s
// in, competing with the Spline scenes behind the loader, for a section two
// screens down. Now a card only gets its URLs once the section is within
// one viewport of the screen, and only for the theme(s) actually shown: the
// other theme's pair loads the first time the visitor switches to it.

export type ProcessTheme = 'dark' | 'light';

// Half a viewport ahead (vertical only) — lead for ~300KB webps to arrive
// before a normally-scrolling visitor reaches the cards. Not a full
// viewport: About is only ~1 screen tall, so at 1920×1080 the section sits
// ~2070px down and `100%` already matched at scroll 0 — loading all of
// them behind the loader again.
export const PROCESS_IMG_ROOT_MARGIN = '50% 0px';

// Page-lifetime latches: LazyUnit unmounts/remounts the section while
// scrolling, and a remount must not wait for the observer again or drop
// URLs it already showed (the files are in the HTTP cache by then).
let armed = false;
const loadedThemes = new Set<ProcessTheme>();

export function __resetProcessCardImagesForTest() {
  armed = false;
  loadedThemes.clear();
}

function readTheme(): ProcessTheme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function processCardBg(slug: string) {
  return `url("./img/process/${slug}.webp")`;
}

// The four stacked layers per card (see portfolio.css: dark theme crossfades
// _w → color on hover, light theme _l_w → _l). A layer whose theme hasn't
// been loaded yet gets no image; it's opacity 0 in that case anyway.
export function processCardLayers(slug: string, themes: ReadonlySet<ProcessTheme>) {
  const dark = themes.has('dark');
  const light = themes.has('light');
  return [
    { cls: 'process-card-bg-img--white', image: dark ? processCardBg(`${slug}_w`) : undefined },
    { cls: 'process-card-bg-img--color', image: dark ? processCardBg(slug) : undefined },
    { cls: 'process-card-bg-img--light-white', image: light ? processCardBg(`${slug}_l_w`) : undefined },
    { cls: 'process-card-bg-img--light', image: light ? processCardBg(`${slug}_l`) : undefined },
  ];
}

// Which themes' illustrations the section may show right now. Empty until
// `sectionRef` comes within PROCESS_IMG_ROOT_MARGIN of the viewport.
export function useProcessCardThemes(sectionRef: RefObject<HTMLElement | null>): ReadonlySet<ProcessTheme> {
  const [isArmed, setArmed] = useState(armed);
  const [theme, setTheme] = useState<ProcessTheme>(readTheme);
  const [themes, setThemes] = useState<ReadonlySet<ProcessTheme>>(() => new Set(loadedThemes));

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    setTheme(readTheme());
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isArmed) return;
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      armed = true;
      setArmed(true);
      return;
    }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        armed = true;
        setArmed(true);
        io.disconnect();
      }
    }, { rootMargin: PROCESS_IMG_ROOT_MARGIN });
    io.observe(el);
    return () => io.disconnect();
  }, [isArmed, sectionRef]);

  useEffect(() => {
    if (!isArmed) return;
    loadedThemes.add(theme);
    setThemes(prev => (prev.size === loadedThemes.size ? prev : new Set(loadedThemes)));
  }, [isArmed, theme]);

  return themes;
}
