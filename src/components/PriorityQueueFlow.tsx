import { useEffect, useState, type CSSProperties } from 'react';

const STEP_INTERVAL_MS = 1800;

const TIERS = [
  { color: '#F97316', icon: 'ph-warning', label: 'Tier 1' },
  { color: '#4A9EFF', icon: 'ph-diamond', label: 'Tier 2' },
  { color: '#7BE3B5', icon: 'ph-circle', label: 'Tier 3' },
];

// 4 tickets, 3 priority tiers (Tier 1 repeats on the last ticket).
const DOCS = [
  { tier: TIERS[0], bars: ['70%', '45%'] },
  { tier: TIERS[1], bars: ['55%', '80%'] },
  { tier: TIERS[2], bars: ['90%', '35%'] },
  { tier: TIERS[0], bars: ['60%', '50%'] },
];

// Human Review card's flourish: a small inbox queue whose "being triaged"
// ticket advances one at a time, same active/complete/inactive state
// machine as AiFlowStepper (card 06's pipeline) — a ticket goes complete
// and *stays* complete-colored once passed, only resetting when the whole
// pass wraps back to ticket 1, rather than each ticket fading out on its
// own clock. No connector between tickets: independent inbox items, not
// stages of one pipeline. Ticket fill reuses 06's boxed-capsule colors
// verbatim (inactive #23232E -> active #6C63FF -> complete #4A4390) so the
// two flourishes read as one system; the tier glyph + label stay off that
// purple scale on purpose so a ticket's priority reads independently of
// whether it's currently mid-review.
export default function PriorityQueueFlow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setActive(a => (a + 1) % DOCS.length);
    }, STEP_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="ai-queue-flow" aria-hidden="true">
      {DOCS.map((doc, i) => {
        const status = i < active ? 'complete' : i === active ? 'active' : 'inactive';
        return (
          <div key={i} className={`ai-queue-item ai-queue-item-${status}`} style={{ '--tier-color': doc.tier.color } as CSSProperties}>
            <div className="ai-queue-head">
              <span className="ai-queue-check"><i className="ph-bold ph-check ai-queue-checkmark" /></span>
              <span className="ai-queue-tier-group">
                <i className={`ph-fill ${doc.tier.icon} ai-queue-tier`} />
                <span className="ai-queue-tier-label">{doc.tier.label}</span>
              </span>
            </div>
            <div className="ai-queue-doc">
              <span className="ai-queue-bar" style={{ width: doc.bars[0] }} />
              <span className="ai-queue-bar" style={{ width: doc.bars[1] }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
