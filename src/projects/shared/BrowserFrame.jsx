import React from 'react';

// macOS-style traffic-light window chrome shown above web screenshots.
export default function BrowserFrame() {
    return (
        <div className="h-8 bg-[#252525] border-b border-white/5 flex items-center px-4 space-x-2 shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
        </div>
    );
}
