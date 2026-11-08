// Diagrams for About's design-principle cards: the principle at a glance,
// filling the card's lower half (a dot-grid stage, like the Figma MCP
// mockup canvas) under its one-line rule. Drawn in the
// card's own colour (--tone via CSS).
//
// 02 "先刪減再設計": a crowded wide screen becomes a phone holding one main
// action. On hover the non-core blocks drop out and the action lights up.
export function PrincipleArtSubtract() {
  return (
    <div className="principle-stage" aria-hidden="true">
    <svg className="principle-art principle-art--subtract" viewBox="0 0 220 84" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {/* the wide back-office screen and its stand */}
      <rect className="pa-frame" x="2" y="4" width="122" height="66" rx="8" />
      <path className="pa-frame" d="M50 81h26M63 70v11" />
      {/* features: the core ones stay, the rest drop out */}
      <rect className="pa-bit" x="11" y="13" width="32" height="12" rx="3" />
      <rect className="pa-bit pa-cut" x="47" y="13" width="32" height="12" rx="3" />
      <rect className="pa-bit pa-cut" x="83" y="13" width="32" height="12" rx="3" />
      <rect className="pa-bit pa-cut" x="11" y="30" width="50" height="16" rx="3" />
      <rect className="pa-bit pa-cut" x="65" y="30" width="50" height="16" rx="3" />
      <rect className="pa-bit" x="11" y="51" width="70" height="10" rx="3" />
      <rect className="pa-bit pa-cut" x="85" y="51" width="30" height="10" rx="3" />
      {/* becomes */}
      <path className="pa-arrow" d="M138 31l7 7-7 7" />
      {/* the phone: one main action */}
      <rect className="pa-phone" x="160" y="2" width="44" height="80" rx="10" />
      <rect className="pa-bit" x="168" y="12" width="18" height="5" rx="2.5" />
      <rect className="pa-bit" x="168" y="23" width="28" height="18" rx="3" />
      <rect className="pa-cta" x="168" y="64" width="28" height="10" rx="5" />
    </svg>
    </div>
  );
}
