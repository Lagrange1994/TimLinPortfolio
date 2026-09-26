import { useRef, useCallback } from 'react';
import './BorderGlow.css';

// Card shell for the My Design Process cards. The React Bits original also
// drew a cursor-following edge glow (.edge-light ring + ::before/::after
// mesh-gradient border); replaced 2026-09-27 by About Me's white border ring
// (.sc-ring at --sc-x/--sc-y). The interior spotlight (.bg-spotlight) also
// tracks the pointer.
const BorderGlow = ({
  children,
  backgroundSlot,
  className = '',
  backgroundColor = '#120F17',
  spotlightColor = 'rgba(255, 255, 255, 0.08)',
}) => {
  const cardRef = useRef(null);

  const handlePointerMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    // Light mode hides .bg-spotlight and .sc-ring (opacity:0 !important in
    // portfolio.css's light-mode block) — skip the getBoundingClientRect +
    // setProperty calls per pointermove, they'd paint nothing.
    if (document.documentElement.getAttribute('data-theme') === 'light') return;
    const rect = card.getBoundingClientRect();
    const x = `${e.clientX - rect.left}px`;
    const y = `${e.clientY - rect.top}px`;
    card.style.setProperty('--mouse-x', x);
    card.style.setProperty('--mouse-y', y);
    card.style.setProperty('--sc-x', x);
    card.style.setProperty('--sc-y', y);
  }, []);

  const handlePointerLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--sc-x', '-500px');
    card.style.setProperty('--sc-y', '-500px');
  }, []);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`border-glow-card ${className}`}
      style={{ '--card-bg': backgroundColor }}
    >
      <span className="sc-ring" aria-hidden="true" />
      {backgroundSlot && (
        <div className="border-glow-bg-slot">{backgroundSlot}</div>
      )}
      <span className="card-glass-highlight" aria-hidden="true" />
      <div className="border-glow-inner">
        {children}
      </div>
      <div
        className="bg-spotlight"
        style={{ '--spotlight-color': spotlightColor }}
      />
      {/* Opacity-crossfade hover shadow, same technique as .ai-card's
          .card-hover-shadow (see that rule's comment in portfolio.css). */}
      <span className="card-hover-shadow" />
    </div>
  );
};

export default BorderGlow;
