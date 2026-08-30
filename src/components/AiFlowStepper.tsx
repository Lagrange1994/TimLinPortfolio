import { Fragment, useEffect, useState } from 'react';
import './AiFlowStepper.css';

const STEP_INTERVAL_MS = 1800;

// A brand icon is an image URL; a concept icon (e.g. a process phase with no
// product behind it) is a Phosphor icon-font class string instead.
function isIconFontClass(icon: string) {
  return icon.startsWith('ph-');
}

interface AiFlowStepperProps {
  steps: string[];
  // Per-step brand icon(s) (index-aligned with steps), swapped in for the
  // dot when present — an array renders multiple icons for a step that
  // bundles more than one product (e.g. "LINE / Email"). Steps without one
  // keep the plain dot. Each entry is either an image URL or a Phosphor
  // icon-font class string (e.g. "ph-fill ph-magnifying-glass").
  icons?: (string | string[] | null)[];
  // Lets a caller (e.g. the Design Workflow card's phase list) mirror this
  // stepper's own timer exactly instead of running a second setInterval
  // that would slowly drift out of sync with it.
  onActiveChange?: (active: number) => void;
  // Modifier appended to the root class — lets one caller opt into a
  // different capsule layout (e.g. stacked icon-over-label) without
  // affecting the other usages of this shared component.
  className?: string;
}

// Auto-advancing progress-stepper for capsule-pipeline callouts (AI-Powered
// Workflow bento card, How I Use AI's Design Workflow card) — same visual
// language as React Bits' Stepper (dot + connector, active / complete /
// inactive states) but loops on its own instead of Back/Next buttons, since
// this is a passive illustration, not a real multi-step form.
export default function AiFlowStepper({ steps, icons, onActiveChange, className }: AiFlowStepperProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  useEffect(() => {
    // Site-wide convention (see CardSwap) — reduced-motion users get the
    // resting first frame instead of a looping animation.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setActive(a => (a + 1) % steps.length);
    }, STEP_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [steps.length]);

  return (
    <div className={`ai-flow-stepper${className ? ' ' + className : ''}`}>
      {steps.map((label, i) => {
        const status = i === active ? 'active' : i < active ? 'complete' : 'inactive';
        const icon = icons?.[i];
        const iconList = icon ? (Array.isArray(icon) ? icon : [icon]) : null;
        // "LINE / Email"-style compound steps: when a step has one icon per
        // " / "-joined label segment, pin each icon next to its own word
        // instead of bunching every icon before the whole label.
        const labelParts = label.split(' / ');
        const paired = iconList && iconList.length > 1 && iconList.length === labelParts.length;
        return (
          <Fragment key={label}>
            <div className={`afs-step afs-step-${status}`}>
              {paired ? (
                labelParts.map((part, pi) => (
                  <Fragment key={part}>
                    {pi > 0 && <span className="afs-label-sep">/</span>}
                    {isIconFontClass(iconList![pi]) ? (
                      <i className={`afs-icon afs-icon-${status} ${iconList![pi]}`} aria-hidden="true" />
                    ) : (
                      <img className={`afs-icon afs-icon-${status}`} src={iconList![pi]} alt="" />
                    )}
                    <span className={`afs-label afs-label-${status}`}>{part}</span>
                  </Fragment>
                ))
              ) : (
                <>
                  {iconList ? (
                    <span className="afs-icon-group">
                      {iconList.map(src => (
                        isIconFontClass(src) ? (
                          <i key={src} className={`afs-icon afs-icon-${status} ${src}`} aria-hidden="true" />
                        ) : (
                          <img key={src} className={`afs-icon afs-icon-${status}`} src={src} alt="" />
                        )
                      ))}
                    </span>
                  ) : (
                    <span className={`afs-dot afs-dot-${status}`} />
                  )}
                  <span className={`afs-label afs-label-${status}`}>{label}</span>
                </>
              )}
            </div>
            {i < steps.length - 1 && (
              <span className={`afs-connector ${i < active ? 'afs-connector-filled' : ''}`} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
