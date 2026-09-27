import React from 'react';
import dsVars from './dsVars';

// items: [{ title, desc }]
// One spec for every "pain points / challenges" card (project_01 is the
// reference): a subtitle plus titled items, each with the ph-x-circle icon,
// all in the shared pain-point red (--color-pain, = police-secondary) rather
// than each project's secondary — those ranged from orange to blue.
export default function PainPointCard({ prefix, subtitle, items }) {
    return (
        <div className="ds-card feature-card border border-border/10 p-5" style={dsVars(prefix)}>
            <h4 className="text-pain font-bold text-sm mb-3">{subtitle}</h4>
            <ul className="space-y-4 text-text/80">
                {items.map((item, i) => (
                    <li key={i} className="flex items-start text-sm text-text/60">
                        <span className="text-pain mr-3 mt-1"><i className="ph ph-x-circle"></i></span>
                        <div><strong className="text-text/90 block text-sm">{item.title}</strong>{item.desc}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
