import React from 'react';
import ImageWithSkeleton from './ImageWithSkeleton';
import BrowserFrame from './BrowserFrame';

// Shared "browser-mockup" left-panel preview used by every project whose
// currentImage swaps across tabs (project_01/03/07/09/11/12). Each of these
// files used to hand-roll this block with a `max-h-full`/`w-auto h-auto`
// (content-driven) frame height. ImageWithSkeleton's skeleton div is
// `absolute inset-0` — it contributes no flow height — so the instant
// currentImage changes, the old <img> is gone and the new one hasn't loaded
// yet: nothing in the chain has a size, and a content-driven frame collapses
// to 0 height until the next image's intrinsic size arrives, then snaps
// back open. This component always uses a DEFINITE height (h-full /
// lg:h-[90%]) so the frame never depends on the image inside it.
// chromeClassName must be a literal Tailwind class string at the call site
// (e.g. "bg-police-dark-light") — Tailwind's scanner needs to see it as
// written text, so it can't be built dynamically in here from a prefix prop.
// scrollRef forwards to the image-area div — some callers reset its
// scrollTop on tab change (galleries taller than the frame scroll inside it).
const PreviewFrame = React.forwardRef(function PreviewFrame({
    chromeClassName,
    showChrome = true,
    showHeader = false,
    imageSrc,
    imageAlt = 'Preview',
    imageClassName = 'w-full h-full object-contain',
    imageContainerClassName = 'w-full h-full flex items-center justify-center',
    imageAreaClassName = 'group',
    children,
}, scrollRef) {
    return (
        <div
            className={`relative w-full max-w-full h-full lg:h-[90%] rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${
                showChrome ? `${chromeClassName} border border-border/10 shadow-2xl` : 'bg-transparent'
            }`}
        >
            {showHeader && <BrowserFrame />}
            <div ref={scrollRef} className={`w-full flex-1 min-h-0 relative bg-border/5 ${imageAreaClassName}`}>
                <ImageWithSkeleton
                    src={imageSrc}
                    alt={imageAlt}
                    containerClassName={imageContainerClassName}
                    className={imageClassName}
                />
            </div>
            {children}
        </div>
    );
});

export default PreviewFrame;
