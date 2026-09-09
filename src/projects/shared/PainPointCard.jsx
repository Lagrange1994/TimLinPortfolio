import React from 'react';

// items: [{ title, desc }]
export default function PainPointCard({ prefix, subtitle, items }) {
    return (
        <div className="feature-card border border-border/10 p-5">
            <h4 className={`text-${prefix}-secondary font-bold text-sm mb-3`}>{subtitle}</h4>
            <ul className="space-y-4 text-text/80">
                {items.map((item, i) => (
                    <li key={i} className="flex items-start text-sm text-text/60">
                        <span className={`text-${prefix}-secondary mr-3 mt-1`}><i className="ph ph-x-circle"></i></span>
                        <div><strong className="text-text/90 block text-sm">{item.title}</strong>{item.desc}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
