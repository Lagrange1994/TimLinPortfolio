import React from 'react';

// Drag grip for the mobile split-view resize interaction. Only render this
// where the underlying resize behavior already exists — it's a visual
// normalization, not a new feature.
export default function ResizeHandle({ prefix, onMouseDown, onTouchStart }) {
    return (
        <div
            className="lg:hidden absolute bottom-0 right-6 w-12 h-12 z-50 flex items-center justify-center cursor-row-resize touch-none translate-y-1/2"
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            <div className={`w-10 h-10 bg-${prefix}-dark-light/90 backdrop-blur-md rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-white/20 flex flex-col items-center justify-center transition-transform hover:scale-110 active:scale-95 group`}>
                <i className={`ph ph-caret-up text-[8px] text-gray-400 group-hover:text-${prefix}-primary mb-0.5`}></i>
                <div className="w-4 h-[2px] bg-gray-500 rounded-full"></div>
                <i className={`ph ph-caret-down text-[8px] text-gray-400 group-hover:text-${prefix}-primary mt-0.5`}></i>
            </div>
        </div>
    );
}
