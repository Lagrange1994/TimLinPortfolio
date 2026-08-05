import React from 'react';

// Clickable icon-avatar card used by the Solution / Feature / Highlight tabs
// to switch the preview image. activeShadowClass is passed in literally
// (tied to each project's own primary rgba value).
export default function FeatureCard({ prefix, active, onClick, icon, title, desc, benefit, activeShadowClass }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left feature-card border p-5 flex items-start space-x-4 transition-all group ${active ? `border-${prefix}-primary bg-white/5 ${activeShadowClass}` : 'border-white/5 hover:bg-white/5'}`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${active ? `bg-${prefix}-primary text-${prefix}-dark` : `bg-white/10 text-${prefix}-primary`}`}>{icon}</div>
            <div>
                <h4 className={`font-bold text-sm mb-1 transition-colors ${active ? `text-${prefix}-primary` : 'text-white'}`}>{title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                    {desc}
                    {benefit && (<><br /><br /><span className={`font-semibold ${active ? 'text-white' : 'text-gray-300'}`}>{benefit}</span></>)}
                </p>
            </div>
        </button>
    );
}
