// apple.com's gallery play/pause control: a round, softly filled button
// beside the dot nav (or in a media card's corner). Every auto-moving thing
// on the page gets one, so it can be stopped (WCAG 2.2.2 Pause, Stop, Hide).
export default function PlayPauseButton({ paused, onToggle, className }: {
  paused: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`autoplay-toggle${className ? ` ${className}` : ''}`}
      aria-label={paused ? 'Play animation' : 'Pause animation'}
      onClick={onToggle}
    >
      {paused ? (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" /></svg>
      )}
    </button>
  );
}

