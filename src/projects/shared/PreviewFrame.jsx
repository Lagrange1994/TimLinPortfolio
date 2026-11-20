import React, { useRef, useLayoutEffect, useEffect, useImperativeHandle } from 'react';
import ImageWithSkeleton from './ImageWithSkeleton';
import BrowserFrame from './BrowserFrame';

// Shared browser-mockup preview for projects whose image swaps per tab
// (project_01/03/07/09/11/12). Always a DEFINITE height, so the frame never
// collapses while the next image loads (the skeleton adds no flow height).
// - Phones: whole frame is aspect-video, centred in the caller's 35vh panel;
//   contain:size keeps tall screenshots (project_10) scrolling inside it.
// - Desktop: image area is 16:9 under the chrome header, width capped so the
//   frame fits 90% of the panel's height.
// - `resizable` (project_07/09/10/11 drag handle): phones get a floor of panel
//   minus 2rem top/bottom; desktop hugs the screenshot (h-auto, ≤90%) and holds
//   its last height (min-height) until the new image loads.
// chromeClassName must be a literal Tailwind class at the call site (scanner).
// scrollRef forwards to the image area (callers reset scrollTop on tab change).
const PreviewFrame = React.forwardRef(function PreviewFrame({
    chromeClassName,
    showChrome = true,
    showHeader = false,
    imageSrc,
    imageAlt = 'Preview',
    imageClassName = 'w-full h-full object-contain',
    imageContainerClassName = 'w-full h-full flex items-center justify-center',
    imageAreaClassName = 'group',
    resizable = false,
    children,
}, scrollRef) {
    const frameRef = useRef(null);
    const areaRef = useRef(null);
    const lastH = useRef(0);
    useImperativeHandle(scrollRef, () => areaRef.current);

    useEffect(() => {
        const frame = frameRef.current;
        if (!resizable || !frame || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(() => {
            if (frame.style.minHeight || frame.querySelector('.skeleton')) return;
            lastH.current = frame.getBoundingClientRect().height;
        });
        ro.observe(frame);
        const release = () => { frame.style.minHeight = ''; };
        frame.addEventListener('load', release, true);
        return () => { ro.disconnect(); frame.removeEventListener('load', release, true); };
    }, [resizable]);

    useLayoutEffect(() => {
        const frame = frameRef.current;
        if (!resizable || !frame || !lastH.current || window.innerWidth < 1024) return;
        if (frame.querySelector('.skeleton')) frame.style.minHeight = `${lastH.current}px`;
    }, [imageSrc, resizable]);

    return (
        <div className={resizable
            ? 'max-lg:w-full max-lg:h-full max-lg:[container-type:size] max-lg:flex max-lg:items-center max-lg:justify-center lg:contents'
            : 'w-full h-full [container-type:size] flex items-center justify-center'}>
        <div
            ref={frameRef}
            className={`preview-frame relative w-full max-w-full aspect-video max-lg:[contain:size] max-lg:w-[min(100%,calc(100cqh*16/9))] ${resizable ? 'max-lg:min-h-[calc(100%-4rem)] lg:aspect-auto lg:h-auto lg:max-h-[90%]' : (showHeader ? 'lg:aspect-auto lg:h-auto lg:w-[min(100%,calc((90cqh-2rem)*16/9))]' : 'lg:aspect-auto lg:h-auto lg:w-[min(100%,calc(90cqh*16/9))]')} rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${
                showChrome ? `${chromeClassName} border border-border/10 shadow-2xl` : 'bg-transparent'
            }`}
        >
            {showHeader && <BrowserFrame />}
            <div ref={areaRef} className={`w-full flex-1 min-h-0 relative bg-border/5 ${resizable ? 'lg:flex-[0_1_auto]' : 'lg:flex-none lg:aspect-video'} ${imageAreaClassName}`}>
                <ImageWithSkeleton
                    src={imageSrc}
                    alt={imageAlt}
                    containerClassName={imageContainerClassName}
                    className={imageClassName}
                />
            </div>
            {children}
        </div>
        </div>
    );
});

export default PreviewFrame;
