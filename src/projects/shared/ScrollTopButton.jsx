import React from 'react';

export default function ScrollTopButton({ prefix, visible, onClick }) {
    return (
        <button
            onClick={onClick}
            title="Back to Hero Section"
            className={`fixed bottom-8 right-8 z-[100] w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-${prefix}-primary hover:border-${prefix}-primary hover:scale-110 transition-all duration-300 cursor-pointer ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        >
            <i className="ph ph-arrow-up"></i>
        </button>
    );
}
