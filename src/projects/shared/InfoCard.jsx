import React from 'react';

export function InfoGrid({ children }) {
    return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

export function InfoCard({ children }) {
    return <div className="p-4 bg-white/5 rounded-xl border border-white/10">{children}</div>;
}
