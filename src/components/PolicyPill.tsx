import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Anchored chat-bubble popover: box + tail drawn as ONE SVG path (rounded
// rect with a triangular notch cut into its top edge) instead of two
// separately bordered elements. Two stacked DOM pieces with their own
// (semi-transparent) borders never look truly fused — the rotated tail's
// border and the box's border are antialiased independently, so the seam
// where they meet shows a faint doubled/misaligned line. A single stroked
// path has no seam because there's nothing to misalign.
// contentRef's rendered size (post layout, incl. any overflow-y:auto clamp
// to max-height) drives the path's box portion; the pill button's own
// rendered width drives where the tail notch sits, since the popover's
// left edge is pinned to the pill's left edge — so the tail must be
// recomputed (not hardcoded) to land on the pill regardless of label length.
export default function PolicyPill({ icon, label, body }: { icon: string; label: string; body: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pillBtnRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [bubble, setBubble] = useState<{ d: string; w: number; h: number } | null>(null);

  // Dismiss on outside click or Escape, same as a native menu/tooltip,
  // since it's an anchored popover rather than a modal Dialog.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) { setBubble(null); return; }
    const TAIL_H = 14;
    const TAIL_W = 24;
    const R = 20;
    const recalc = () => {
      const content = contentRef.current;
      const pillBtn = pillBtnRef.current;
      if (!content || !pillBtn) return;
      const w = content.offsetWidth;
      const h = content.offsetHeight;
      const minX = R + TAIL_W / 2 + 2;
      const maxX = w - R - TAIL_W / 2 - 2;
      const tx = Math.min(Math.max(pillBtn.offsetWidth / 2, minX), maxX);
      const d = [
        `M ${R},${TAIL_H}`,
        `L ${tx - TAIL_W / 2},${TAIL_H}`,
        `L ${tx},0`,
        `L ${tx + TAIL_W / 2},${TAIL_H}`,
        `L ${w - R},${TAIL_H}`,
        `A ${R},${R} 0 0 1 ${w},${TAIL_H + R}`,
        `L ${w},${TAIL_H + h - R}`,
        `A ${R},${R} 0 0 1 ${w - R},${TAIL_H + h}`,
        `L ${R},${TAIL_H + h}`,
        `A ${R},${R} 0 0 1 0,${TAIL_H + h - R}`,
        `L 0,${TAIL_H + R}`,
        `A ${R},${R} 0 0 1 ${R},${TAIL_H}`,
        'Z',
      ].join(' ');
      setBubble({ d, w, h: h + TAIL_H });
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [open, label, body]);

  return (
    <div className="policy-pill-wrap" ref={wrapRef}>
      <button type="button" className="policy-pill" ref={pillBtnRef} onClick={() => setOpen(prev => !prev)}>
        <i className={`ph ${icon}`} aria-hidden="true" />
        {label}
      </button>
      {open && (
        <div className="policy-popover-shell">
          {bubble && (
            <svg
              className="policy-popover-svg"
              width={bubble.w}
              height={bubble.h}
              viewBox={`0 0 ${bubble.w} ${bubble.h}`}
              aria-hidden="true"
            >
              <path d={bubble.d} fill="#13101c" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            </svg>
          )}
          <div className="policy-popover" role="dialog" aria-label={label} ref={contentRef}>
            <button type="button" className="policy-popover-close" onClick={() => setOpen(false)} aria-label="Close">
              <i className="ph ph-x" aria-hidden="true" />
            </button>
            <div className="policy-popover-title">{label}</div>
            <p className="policy-popover-body">{body}</p>
          </div>
        </div>
      )}
    </div>
  );
}
