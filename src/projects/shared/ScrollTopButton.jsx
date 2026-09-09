import React from 'react';

export default function ScrollTopButton({ prefix, visible, onClick }) {
    return (
        <button
            onClick={onClick}
            title="Back to Hero Section"
            className={`fixed bottom-8 right-8 z-[100] w-12 h-12 bg-border/10 backdrop-blur-md border border-border/20 rounded-full flex items-center justify-center text-text shadow-2xl hover:bg-${prefix}-primary hover:border-${prefix}-primary hover:text-white hover:scale-110 transition-all duration-300 cursor-pointer ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        >
            <i className="ph ph-arrow-up"></i>
        </button>
    );
}
