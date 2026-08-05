import React from 'react';

// activeShadowClass is passed in literally (tied to each project's own
// primary rgba value). desc is optional — projects whose gallery data has no
// per-item description simply omit it rather than fabricating copy.
export default function GalleryItemButton({ prefix, active, onClick, id, name, desc, activeShadowClass }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left feature-card border p-3 hover:bg-white/10 transition-all group flex items-center justify-between gap-3 ${active ? `border-${prefix}-primary bg-white/5 ${activeShadowClass || ''}` : 'border-white/5'}`}
        >
            <div className="min-w-0">
                <h4 className={`font-medium transition-colors text-xs lg:text-sm ${active ? 'text-white' : 'text-gray-300 group-hover:text-gray-200'}`}>
                    <span className={`text-${prefix}-primary/70 mr-2 text-xs font-mono`}>{id}</span>{name}
                </h4>
                {desc && <p className="text-xs text-gray-500 group-hover:text-gray-400 leading-relaxed mt-1">{desc}</p>}
            </div>
            <i className={`ph ph-caret-right transform transition-all text-xs flex-shrink-0 ${active ? `text-${prefix}-primary translate-x-0 opacity-100` : 'text-gray-600 -translate-x-2 opacity-0 group-hover:opacity-50'}`}></i>
        </button>
    );
}
