import React, { useState } from 'react';

export function ResponsiveImage({ src, alt, className, onLoad, ...props }) {
    const webpSrc = encodeURI(src.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
    return (
        <picture style={{ display: 'contents' }}>
            <source srcSet={webpSrc} type="image/webp" />
            <img src={src} alt={alt} className={className} onLoad={onLoad} decoding="async" {...props} />
        </picture>
    );
}

export default function ImageWithSkeleton({ src, alt, containerClassName, className, ...props }) {
    const [loaded, setLoaded] = useState(false);
    // Reset synchronously during render (not in a useEffect) when src changes.
    // An effect-based reset races the <img>'s native onLoad: for a cached
    // image the browser can fire onLoad before the effect runs, so the
    // late setLoaded(false) clobbers the already-correct loaded state and
    // the skeleton is stuck covering a fully-loaded image forever.
    const [trackedSrc, setTrackedSrc] = useState(src);
    if (src !== trackedSrc) {
        setTrackedSrc(src);
        setLoaded(false);
    }
    return (
        <div className={`relative overflow-hidden ${containerClassName || 'w-full h-full'}`}>
            {!loaded && (
                <div className="absolute inset-0 skeleton z-10 flex items-center justify-center">
                    <i className="ph ph-image text-text/10 text-3xl"></i>
                </div>
            )}
            <ResponsiveImage src={src} alt={alt} className={className} onLoad={() => setLoaded(true)} {...props} />
        </div>
    );
}
