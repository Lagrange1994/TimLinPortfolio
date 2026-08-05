import React from 'react';

// steps: [{ title, desc }] — first and last steps get a filled/glowing dot and
// primary-colored title; middle steps get an outlined dot. glowShadowClass is
// passed in literally (tied to each project's own primary rgba value).
export default function ProcessTimeline({ prefix, steps, glowShadowClass }) {
    return (
        <div className="relative pl-4 border-l border-white/10 space-y-8">
            {steps.map((step, i) => {
                const isFirst = i === 0;
                const isLast = i === steps.length - 1;
                const dotClass = (isFirst || isLast)
                    ? `bg-${prefix}-primary${isLast ? ` ${glowShadowClass}` : ''}`
                    : `bg-${prefix}-dark border border-gray-600`;
                return (
                    <div className="relative" key={i}>
                        <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full ${dotClass}`}></div>
                        <h4 className={`text-sm font-bold mb-1 ${isLast ? 'text-white' : `text-${prefix}-primary`}`}>{step.title}</h4>
                        <p className="text-xs text-gray-400">{step.desc}</p>
                    </div>
                );
            })}
        </div>
    );
}
