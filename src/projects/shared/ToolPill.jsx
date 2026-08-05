import React from 'react';

// color: 'primary' | 'secondary' — which of the project's theme tokens the pill uses.
export default function ToolPill({ prefix, color = 'primary', icon, label }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${prefix}-${color}/20 text-${prefix}-${color} border border-${prefix}-${color}/30`}>
            {icon}<span className="ml-1">{label}</span>
        </span>
    );
}
