import React, { useEffect, useState } from 'react';

export function ResponsiveImage({ src, alt, className, onLoad, ...props }) {
    const webpSrc = encodeURI(src.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
    return (
        <picture style={{ display: 'contents' }}>
            <source srcSet={webpSrc} type="image/webp" />
            <img src={src} alt={alt} className={className} onLoad={onLoad} {...props} />
        </picture>
    );
}

export default function ImageWithSkeleton({ src, alt, containerClassName, className, ...props }) {
    const [loaded, setLoaded] = useState(false);
    useEffect(() => setLoaded(false), [src]);
    return (
        <div className={`relative overflow-hidden ${containerClassName || 'w-full h-full'}`}>
            {!loaded && (
                <div className="absolute inset-0 skeleton z-10 flex items-center justify-center">
                    <i className="ph ph-image text-white/10 text-3xl"></i>
                </div>
            )}
            <ResponsiveImage src={src} alt={alt} className={className} onLoad={() => setLoaded(true)} {...props} />
        </div>
    );
}
