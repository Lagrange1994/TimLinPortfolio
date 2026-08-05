import React from 'react';

export default function TabNav({ prefix, tabs, activeTab, onChange, containerRef }) {
    return (
        <div ref={containerRef} className="flex space-x-6 overflow-x-auto custom-scroll mt-2 lg:mt-4 pb-2 w-full touch-pan-x">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === tab.id ? `text-${prefix}-primary border-b-2 border-${prefix}-primary pb-1` : 'text-gray-500 hover:text-white pb-1'}`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
