import React from 'react';
import ImageWithSkeleton from './ImageWithSkeleton.jsx';

export default function PhoneFrame({ src, alt }) {
    return (
        <div className="flex items-center justify-center w-full h-full p-4 lg:p-8">
            <div className="relative h-full w-auto max-w-full aspect-[9/19] border-[6px] md:border-[8px] border-[#2d2d2d] rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden shadow-2xl bg-black animate-fadeIn shrink-0">
                <ImageWithSkeleton src={src} alt={alt} className="w-full h-full object-cover block" />
            </div>
        </div>
    );
}
