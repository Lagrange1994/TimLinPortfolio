import { Fragment, useEffect, useState } from 'react';
import './AiFlowStepper.css';

const STEP_INTERVAL_MS = 1800;

interface AiFlowStepperProps {
  steps: string[];
  // Lets a caller (e.g. the Design Workflow card's phase list) mirror this
  // stepper's own timer exactly instead of running a second setInterval
  // that would slowly drift out of sync with it.
  onActiveChange?: (active: number) => void;
}

// Auto-advancing progress-stepper for capsule-pipeline callouts (AI-Powered
// Workflow bento card, How I Use AI's Design Workflow card) — same visual
// language as React Bits' Stepper (dot + connector, active / complete /
// inactive states) but loops on its own instead of Back/Next buttons, since
// this is a passive illustration, not a real multi-step form.
export default function AiFlowStepper({ steps, onActiveChange }: AiFlowStepperProps) {
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
    <div className="ai-flow-stepper">
      {steps.map((label, i) => {
        const status = i === active ? 'active' : i < active ? 'complete' : 'inactive';
        return (
          <Fragment key={label}>
            <div className={`afs-step afs-step-${status}`}>
              <span className={`afs-dot afs-dot-${status}`} />
              <span className={`afs-label afs-label-${status}`}>{label}</span>
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
