import React from 'react';

// Dark-mode --color-{prefix}-primary values from projects-tailwind.css, used
// as a fixed color regardless of theme — the hero CTA sits on the same
// fixed-dark hero photo as the hero title/overlay, so it must not re-tint
// when {prefix}-primary itself gets re-tuned for light-mode contrast.
const PRIMARY_HEX = {
    app: '#FF4A00', epb: '#0071B8', gh: '#EAC435', hc: '#00D4FF',
    kh: '#00A8E8', lv: '#00D2A0', police: '#00D4FF', sm: '#00A0E9',
    tmu: '#2B6CB0', tn: '#2DD4BF', tym: '#7F3F98', zoo: '#86C232',
};

// shadowClass is passed in literally (e.g. "shadow-[0_10px_30px_rgba(0,113,184,0.4)]")
// because the rgba glow is tied to each project's own primary color and can't
// be derived from the prefix alone.
export default function HeroCTAButton({ prefix, shadowClass, loading, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`hero-cta-btn px-10 py-4 border rounded-full text-white font-bold text-lg transition-all ${shadowClass} transform hover:-translate-y-1 ${loading ? 'opacity-0' : 'fade-in-up'}`}
            style={{ animationDelay: '0.4s', '--hero-cta-color': PRIMARY_HEX[prefix] }}
        >
            {label} <i className="ph ph-arrow-down ml-2 animate-bounce"></i>
        </button>
    );
}
