import React, { useRef, useLayoutEffect, useEffect, useImperativeHandle } from 'react';
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
// back open. This component always uses a DEFINITE height so the frame never
// depends on the image inside it: lg:h-[90%] on desktop, and on phones the
// whole frame (browser-chrome header included) is a 16:9 box — aspect-video,
// derived from the width, not the content — sitting vertically centred in the
// caller's 35vh panel, exactly like project_02's window frame (panel 35vh,
// frame 16:9, ~48px above and below it at 402px wide). It used to be h-full
// there, which stretched the frame to the whole panel and cropped or
// letterboxed images, and later a 16:9 image area that made header tabs taller
// than the others. contain:size keeps the box coming ONLY from that ratio: a
// tall scrolling screenshot (project_10's 1920x3200 page) stays inside a
// fixed-ratio window the visitor scrolls, instead of stretching the frame to
// the image's height (aspect-ratio + overflow otherwise lets some engines,
// notably WebKit, size the box from its content).
// `resizable` is for pages with a drag handle that resizes the panel on phones
// (project_07/09/10/11, the long-strip website demos): the frame keeps the
// same 16:9 default but also gets a floor of "panel minus 2rem top and bottom",
// so dragging the handle down makes the frame taller too (aspect-ratio boxes
// grow to their min-height), and the tall screenshot scrolls inside it.
// chromeClassName must be a literal Tailwind class string at the call site
// (e.g. "bg-police-dark-light") — Tailwind's scanner needs to see it as
// written text, so it can't be built dynamically in here from a prefix prop.
// scrollRef forwards to the image-area div — some callers reset its
// scrollTop on tab change (galleries taller than the frame scroll inside it).
// Desktop, non-resizable: the IMAGE AREA is 16:9 (the browser-chrome header, if
// any, sits on top of it, so the frame is 2rem taller than 16:9 and never crops
// an object-cover screenshot); width is capped so the whole frame fits in 90%
// of the panel's height, instead of a tall 90% box that letterboxes it. Desktop + `resizable`: the frame hugs its screenshot (h-auto, capped at 90%
// of the panel) instead of a fixed 90% height, so a screenshot shorter than
// that no longer leaves empty frame-coloured bands above and below it. Because
// an unloaded <img> has no height, the frame would collapse mid tab-switch, so
// it holds its last settled height (min-height) until the new image loads.
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
            className={`relative w-full max-w-full aspect-video max-lg:[contain:size] max-lg:w-[min(100%,calc(100cqh*16/9))] ${resizable ? 'max-lg:min-h-[calc(100%-4rem)] lg:aspect-auto lg:h-auto lg:max-h-[90%]' : (showHeader ? 'lg:aspect-auto lg:h-auto lg:w-[min(100%,calc((90cqh-2rem)*16/9))]' : 'lg:aspect-auto lg:h-auto lg:w-[min(100%,calc(90cqh*16/9))]')} rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${
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
