import React from 'react';
import dsVars from './dsVars';

export function InfoGrid({ children }) {
    return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

// prefix is optional (older call sites omit it); ds-home pages pass it so
// the light-mode card fill matches the project's own panel tint.
export function InfoCard({ prefix, children }) {
    return <div className="ds-card ds-card--sm p-4 bg-border/5 rounded-xl border border-border/10" style={prefix ? dsVars(prefix) : undefined}>{children}</div>;
}
