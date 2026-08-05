import React from 'react';

export default function BackButton({ prefix, label, onClick }) {
    return (
        <button onClick={onClick} className={`back-btn pointer-events-auto flex items-center justify-center h-10 w-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-gray-300 hover:text-white hover:border-${prefix}-primary/50 hover:bg-${prefix}-dark-lighter transition-all duration-300 shadow-lg group overflow-hidden hover:w-40`}>
            <i className={`ph ph-arrow-left text-${prefix}-primary group-hover:text-${prefix}-secondary flex-shrink-0`}></i>
            <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[200px] ml-0 group-hover:ml-2 transition-all duration-300 whitespace-nowrap overflow-hidden text-sm font-bold">{label}</span>
        </button>
    );
}
