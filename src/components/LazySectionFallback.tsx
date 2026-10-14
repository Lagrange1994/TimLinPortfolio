import type { CSSProperties } from 'react';

type SectionName = 'about' | 'skills' | 'portfolio' | 'contact';

interface Props {
  name: SectionName;
}

// React.lazy renders its fallback before a section's module has arrived. Keep
// a conservative amount of document flow during that short window so the
// sections below do not jump upward from a zero-height placeholder. The
// wrapper is deliberately not a <section>: LazyUnit/useRiseReveal must wait
// for the real section element before it arms its entrance animation.
const MIN_HEIGHT: Record<SectionName, string> = {
  about: '72rem',
  skills: '260rem',
  portfolio: '104rem',
  contact: '58rem',
};

export default function LazySectionFallback({ name }: Props) {
  const style = { '--lazy-section-min-height': MIN_HEIGHT[name] } as CSSProperties;

  return (
    <div
      className={`lazy-section-fallback lazy-section-fallback--${name}`}
      style={style}
      aria-busy="true"
      aria-label="Loading section"
    />
  );
}
