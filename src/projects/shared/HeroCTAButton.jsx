import React from 'react';

// shadowClass is passed in literally (e.g. "shadow-[0_10px_30px_rgba(0,113,184,0.4)]")
// because the rgba glow is tied to each project's own primary color and can't
// be derived from the prefix alone.
export default function HeroCTAButton({ prefix, shadowClass, loading, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`px-10 py-4 bg-${prefix}-primary border border-${prefix}-primary/50 rounded-full text-white font-bold text-lg hover:bg-white hover:text-${prefix}-primary transition-all ${shadowClass} transform hover:-translate-y-1 ${loading ? 'opacity-0' : 'fade-in-up'}`}
            style={{ animationDelay: '0.4s' }}
        >
            {label} <i className="ph ph-arrow-down ml-2 animate-bounce"></i>
        </button>
    );
}
