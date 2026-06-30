import { useMemo, type CSSProperties, type ReactNode } from 'react';
import './SquircleCard.css';

interface SquircleCardProps {
  width: number;
  height: number;
  /** Superellipse exponent: 2 = circle/ellipse, 4-6 = iOS-style squircle, 10+ = near-rect. */
  cornerSmoothing?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

// Superellipse |x/a|^n + |y/b|^n = 1, sampled into a closed polygon path.
// Unlike border-radius (circular arc, curvature jumps at the corner), this
// has continuously varying curvature along the whole edge — the "squircle" look.
function buildSquirclePath(w: number, h: number, n: number, steps = 64): string {
  const a = w / 2;
  const b = h / 2;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const cos = Math.cos(t);
    const sin = Math.sin(t);
    const x = a * Math.sign(cos) * Math.abs(cos) ** (2 / n);
    const y = b * Math.sign(sin) * Math.abs(sin) ** (2 / n);
    d += `${i === 0 ? 'M' : 'L'} ${(a + x).toFixed(2)} ${(b + y).toFixed(2)} `;
  }
  return `${d}Z`;
}

export default function SquircleCard({
  width,
  height,
  cornerSmoothing = 5,
  className,
  style,
  children,
}: SquircleCardProps) {
  const clipPath = useMemo(
    () => `path('${buildSquirclePath(width, height, cornerSmoothing)}')`,
    [width, height, cornerSmoothing],
  );

  return (
    <div
      className={`squircle-card${className ? ` ${className}` : ''}`}
      style={{ width, height, clipPath, ...style }}
    >
      <div className="squircle-card__mesh" />
      <div className="squircle-card__content">{children}</div>
    </div>
  );
}
