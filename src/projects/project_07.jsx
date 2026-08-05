import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import gsap from 'gsap';
import ScrollToPlugin from 'gsap/ScrollToPlugin';
import {
    SharedIcons, BackButton, ScrollTopButton, HeroCTAButton, TabNav, ToolPill,
    InfoGrid, InfoCard, ProcessTimeline, FeatureCard,
    GalleryItemButton, BrowserFrame, ImageWithSkeleton,
} from './shared/index.js';

gsap.registerPlugin(ScrollToPlugin);

        // --- ICONS ---
        // XD/AI moved to shared/Icons.jsx (SharedIcons) — they appear as tool pills
        // across multiple project pages. Chart/Mascot/Map/Palette stay local: they're
        // this project's own solution-feature icons, not shared across pages.
        const Icons = {
            Chart: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
            Mascot: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            Map: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-1.447-.894L15 7m0 13V7" /></svg>,
            Palette: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
        };

        // --- TRANSLATIONS ---
        const TRANSLATIONS = {
            zh: {
                loader_step1: "讀取專案中繼資料",
                loader_step2: "載入視覺素材",
                loader_step3: "建構渲染畫布",
                loader_step4: "初始化完成",
                title_main: "石門水庫", title_sub: "觀光服務申請系統",
                hero_desc: "從繁瑣公文到親民體驗。協助公部門將紙本申請流程數位化，打造友善的線上服務入口。",
                btn_explore: "探索設計旅程", back_home: "Back to Portfolio",
                tab_request: "01. 業主需求", tab_process: "02. 流程", tab_highlights: "03. 特色", tab_gallery: "04. 成果",

                request_title: "業主需求 Client Request",
                request_desc: "北區水資源局希望將現有的觀光行政流程全面數位化，新增「貴賓參訪」、「預約解說」與「街頭藝人」等線上申請頁面。",
                role_title: "My Role", role_name: "UI 設計師", tools: "Tools",
                list_title: "待新增頁面列表",
                req_1_title: "貴賓參訪申請", req_1_desc: "供機關團體線上預約，需整合人數與時間限制說明。",
                req_2_title: "預約解說導覽", req_2_desc: "結合地圖與路線說明，讓申請者了解導覽內容。",
                req_3_title: "街頭藝人與場地申請", req_3_desc: "明確標示可展演區域與相關規範。",

                process_title: "製作流程 Workflow",
                step_1_title: "Step 1. 盤點與解構", step_1_desc: "收集所有紙本申請書與管理要點，將文字拆解為「必要條件」（如：申請期限、人數下限、證件需求）。",
                step_2_title: "Step 2. 動線簡化", step_2_desc: "設計流暢的引導動線：閱讀須知 → 確認資格 → 選擇日期 → 填寫表單",
                step_3_title: "Step 3. 視覺轉化 (Visualizing)", step_3_desc: "將枯燥的數字與注意事項轉化為醒目的粗體與圖表，降低閱讀疲勞。",
                step_4_title: "Step 4. 地圖整合", step_4_desc: "繪製專屬的向量地圖，將申請場地與導覽路線具象化，讓使用者對「地點」有直觀認識。",

                highlights_title: "設計特色 Highlights",
                gallery_title: "頁面展示 Gallery", gallery_desc: "點擊下方卡片預覽各個申請頁面的最終設計成果。",
                scroll_hint: "上下滾動瀏覽完整畫面"
            },
            en: {
                loader_step1: "Reading project metadata",
                loader_step2: "Loading visual assets",
                loader_step3: "Constructing render canvas",
                loader_step4: "Initialization complete",
                title_main: "Shimen Reservoir", title_sub: "Tourism Service System",
                hero_desc: "From paperwork to a friendly experience. Digitizing government application processes for a user-friendly online service portal.",
                btn_explore: "Explore the Journey", back_home: "Back to Portfolio",
                tab_request: "01. Request", tab_process: "02. Process", tab_highlights: "03. Highlights", tab_gallery: "04. Gallery",

                request_title: "Client Request",
                request_desc: "The Northern Region Water Resources Bureau aims to digitize existing tourism administrative processes, adding online applications for 'VIP Visits', 'Guided Tours', and 'Street Performers'.",
                role_title: "My Role", role_name: "UI Designer", tools: "Tools",
                list_title: "Required Pages",
                req_1_title: "VIP Visit Application", req_1_desc: "Online booking for groups, integrating capacity and time limit info.",
                req_2_title: "Guided Tour Reservation", req_2_desc: "Combining maps and route descriptions to explain tour content.",
                req_3_title: "Street Performer Application", req_3_desc: "Clearly indicating available performance areas and regulations.",

                process_title: "Workflow",
                step_1_title: "Step 1. Audit & Deconstruct", step_1_desc: "Collected all paper forms and guidelines, breaking text down into 'requirements' (e.g., deadlines, min pax, IDs).",
                step_2_title: "Step 2. Flow Simplification", step_2_desc: "Designed a smooth flow: Read Rules → Check Eligibility → Select Date → Fill Form.",
                step_3_title: "Step 3. Visualization", step_3_desc: "Transformed boring numbers and notes into bold text and charts to reduce reading fatigue.",
                step_4_title: "Step 4. Map Integration", step_4_desc: "Created custom vector maps to visualize venues and routes, giving users a clear sense of 'location'.",

                highlights_title: "Design Highlights",
                gallery_title: "Gallery", gallery_desc: "Click the cards below to preview the final design of each application page.",
                scroll_hint: "Scroll to view the full screen"
            }
        };

        // --- Dynamic Data Functions ---
        const getAnalysisFeatures = (lang) => {
            const isZh = lang === 'zh';
            return [
                { id: 'feat-01', title: isZh ? '高度資訊圖表化 (Infographic)' : 'Infographic Design', desc: isZh ? '將法規文字轉化為直觀圖表，解決閱讀疲勞。' : 'Converting legal text into intuitive charts to reduce fatigue.', icon: 'Chart', image: './img/project_07/石門水庫6觀光服務 6.3.3貴賓參訪申請0819.jpg', note: isZh ? 'Insight: 人數限制與申請時間採用醒目數字設計，大幅降低認知負擔。' : 'Insight: Limits and times use bold numbers to reduce cognitive load.' },
                { id: 'feat-02', title: isZh ? '活潑的吉祥物行銷' : 'Mascot Marketing', desc: isZh ? '利用角色引導填表流程，降低公文申請的嚴肅感。' : 'Using characters to guide the form process, softening the seriousness.', icon: 'Mascot', image: './img/project_07/石門水庫6觀光服務 6.3.3貴賓參訪申請0819.jpg', note: isZh ? 'Insight: 透過角色扮演（Role-play）增加情境感，提升親和力。' : 'Insight: Role-play adds context and increases approachability.' },
                { id: 'feat-03', title: isZh ? '直觀的地圖式導航' : 'Map-based Navigation', desc: isZh ? '將景點與動線直接整合在地理位置上，而非純清單。' : 'Integrating spots and routes directly onto maps, not just lists.', icon: 'Map', image: './img/project_07/石門水庫6觀光服務 6.3.4預約解說申請0822.jpg', note: isZh ? 'Insight: 使用者能預先建立空間感，明確知道「去哪裡看什麼」。' : 'Insight: Users build spatial awareness of "where to go and what to see".' },
                { id: 'feat-04', title: isZh ? '一致性的視覺識別' : 'Consistent Visual Identity', desc: isZh ? '嚴格遵守藍、青、湖水綠的主色調，搭配圓形元素。' : 'Strictly adhering to blue, cyan, and aqua tones with circular elements.', icon: 'Palette', image: './img/project_07/石門水庫6觀光服務 6.3.6街頭藝人申請0822.jpg', note: isZh ? 'Insight: 視覺語彙統一，強化了「水資源」與「觀光」的品牌聯想。' : 'Insight: Unified visual language reinforces "Water Resources" and "Tourism".' }
            ];
        };

        const getGalleryImages = (lang) => {
            const isZh = lang === 'zh';
            return [
                { id: '01', name: isZh ? '賞花主題地圖' : 'Flower Map', src: './img/project_07/new0327石門水庫   觀光服務   石門水庫   賞花主題.jpg', desc: isZh ? '結合時間軸與空間地圖的視覺化設計' : 'Visual design combining timeline and spatial map.' },
                { id: '02', name: isZh ? '貴賓參訪申請' : 'VIP Application', src: './img/project_07/石門水庫6觀光服務 6.3.3貴賓參訪申請0819.jpg', desc: isZh ? '大區塊按鈕與清楚的流程圖示' : 'Large buttons and clear process icons.' },
                { id: '03', name: isZh ? '預約解說導覽' : 'Guided Tour', src: './img/project_07/石門水庫6觀光服務 6.3.4預約解說申請0822.jpg', desc: isZh ? '將導覽路線與景點地圖結合' : 'Combining tour routes with attraction maps.' },
                { id: '04', name: isZh ? '街頭藝人申請' : 'Street Performer', src: './img/project_07/石門水庫6觀光服務 6.3.6街頭藝人申請0822.jpg', desc: isZh ? '場地位置以氣泡地圖呈現' : 'Venue locations presented as a bubble map.' }
            ];
        };

        const App = () => {
            const [lang, setLang] = useState('zh');
            const [loading, setLoading] = useState(true);
            const [loaderStep, setLoaderStep] = useState(0);
            const [loaderDone, setLoaderDone] = useState(false);
            const [activeTab, setActiveTab] = useState('request');
            const [currentImage, setCurrentImage] = useState('./img/project_07/display.jpg');
            const [activeGalleryId, setActiveGalleryId] = useState(null);
            const [activeFeatureId, setActiveFeatureId] = useState(null);
            const [showBackToHero, setShowBackToHero] = useState(false);

            // Refs
            const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
            const isScrollingRef = useRef(false);
            const mainContainerRef = useRef(null);
            const sectionsRef = useRef([]);
            const contentScrollRef = useRef(null);
            const swipeContentRef = useRef(null);
            const peekContentRef = useRef(null);
            const touchStartRef = useRef(null);
            const isDraggingRef = useRef(false);
            const dragDirRef = useRef(0);
            const [peekTab, setPeekTab] = useState(null);
            const TAB_ORDER = ['request', 'process', 'highlights', 'gallery'];
            const handleTabTouchStart = (e) => {
                if (e.target.closest('.overflow-x-auto')) { touchStartRef.current = null; return; }
                if (swipeContentRef.current) gsap.killTweensOf(swipeContentRef.current);
                if (peekContentRef.current) gsap.killTweensOf(peekContentRef.current);
                const t = e.touches[0];
                touchStartRef.current = { x: t.clientX, y: t.clientY };
                isDraggingRef.current = false;
            };
            const handleTabTouchEnd = (e) => {
                if (!touchStartRef.current) return;
                const t = e.changedTouches[0];
                const dx = t.clientX - touchStartRef.current.x;
                touchStartRef.current = null;
                const el = swipeContentRef.current;
                const peekEl = peekContentRef.current;
                if (!isDraggingRef.current) return;
                isDraggingRef.current = false;
                const idx = TAB_ORDER.indexOf(activeTab);
                const width = (contentScrollRef.current && contentScrollRef.current.offsetWidth) || 320;
                const threshold = Math.min(100, width * 0.22);
                const dir = dragDirRef.current;
                dragDirRef.current = 0;
                if (dir === 1 && dx <= -threshold && idx < TAB_ORDER.length - 1) {
                    const nextId = TAB_ORDER[idx + 1];
                    gsap.to(el, { x: -width, duration: 0.24, ease: 'power2.out' });
                    if (peekEl) {
                        gsap.to(peekEl, {
                            x: 0, duration: 0.24, ease: 'power2.out', onComplete: () => {
                                setActiveTab(nextId);
                                setPeekTab(null);
                                gsap.set(el, { x: 0 });
                            }
                        });
                    } else {
                        setActiveTab(nextId);
                        gsap.set(el, { x: 0 });
                    }
                } else if (dir === -1 && dx >= threshold && idx > 0) {
                    const prevId = TAB_ORDER[idx - 1];
                    gsap.to(el, { x: width, duration: 0.24, ease: 'power2.out' });
                    if (peekEl) {
                        gsap.to(peekEl, {
                            x: 0, duration: 0.24, ease: 'power2.out', onComplete: () => {
                                setActiveTab(prevId);
                                setPeekTab(null);
                                gsap.set(el, { x: 0 });
                            }
                        });
                    } else {
                        setActiveTab(prevId);
                        gsap.set(el, { x: 0 });
                    }
                } else {
                    gsap.to(el, { x: 0, duration: 0.25, ease: 'power2.out' });
                    if (peekEl && dir) {
                        gsap.to(peekEl, { x: dir * width, duration: 0.25, ease: 'power2.out', onComplete: () => setPeekTab(null) });
                    } else {
                        setPeekTab(null);
                    }
                }
            };
            useEffect(() => {
                const node = contentScrollRef.current;
                if (!node) return;
                const onTouchMove = (e) => {
                    if (!touchStartRef.current) return;
                    const t = e.touches[0];
                    const dx = t.clientX - touchStartRef.current.x;
                    const dy = t.clientY - touchStartRef.current.y;
                    if (!isDraggingRef.current) {
                        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
                            isDraggingRef.current = true;
                            const idx = TAB_ORDER.indexOf(activeTab);
                            const dir = dx < 0 ? 1 : -1;
                            const peekId = dir === 1 ? TAB_ORDER[idx + 1] : TAB_ORDER[idx - 1];
                            dragDirRef.current = peekId ? dir : 0;
                            if (peekId) setPeekTab(peekId);
                        } else if (Math.abs(dy) > 10) {
                            touchStartRef.current = null;
                            return;
                        } else {
                            return;
                        }
                    }
                    e.preventDefault();
                    const damped = dx * 0.5;
                    if (swipeContentRef.current) gsap.set(swipeContentRef.current, { x: damped });
                    if (peekContentRef.current && dragDirRef.current) {
                        const width = (contentScrollRef.current && contentScrollRef.current.offsetWidth) || 320;
                        gsap.set(peekContentRef.current, { x: dragDirRef.current * width + damped });
                    }
                };
                node.addEventListener('touchmove', onTouchMove, { passive: false });
                return () => node.removeEventListener('touchmove', onTouchMove);
            }, [activeTab]);
            const imageScrollRef = useRef(null);
            const heroRef = useRef(null);
            const splitRef = useRef(null);
            const touchStartY = useRef(0);
            const tabsContainerRef = useRef(null); // Ref for Tabs

            const t = (key) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) ? TRANSLATIONS[lang][key] : key;

            // Get Current Data based on Lang
            const features = getAnalysisFeatures(lang);
            const gallery = getGalleryImages(lang);

            // Initialize
            useEffect(() => {
                const savedLang = localStorage.getItem('lang');
                const initialLang = savedLang === 'en' ? 'en' : 'zh';
                setLang(initialLang);

                const preload = (src) => new Promise((resolve) => {
                    const img = new Image();
                    img.src = src;
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                });
                const assetsPromise = Promise.all([
                    preload('./img/project_07/hero_img.webp'),
                    preload('./img/project_07/display.webp'),
                ]);
                const forceTimeout = new Promise(resolve => setTimeout(resolve, 4000));
                Promise.race([assetsPromise, forceTimeout]).then(() => { setLoaderDone(true); setLoading(false); });
            }, []);

            useEffect(() => {
                const stepTimer = setInterval(() => setLoaderStep(i => (i + 1) % 3), 500);
                return () => clearInterval(stepTimer);
            }, []);

            // [新增] 響應式字體大小邏輯
            useEffect(() => {
                const setResponsiveFontSize = () => {
                    if (window.innerWidth >= 1024) {
                        document.documentElement.style.fontSize = (window.innerWidth / 1920) * 16 + "px";
                    } else {
                        document.documentElement.style.fontSize = '';
                    }
                };
                window.addEventListener('resize', setResponsiveFontSize);
                setResponsiveFontSize(); // Initial call
                return () => window.removeEventListener('resize', setResponsiveFontSize);
            }, []);

            // Tab / Lang Update
            useEffect(() => {
                if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
                if (swipeContentRef.current) gsap.set(swipeContentRef.current, { x: 0, opacity: 1 });
                if (imageScrollRef.current) imageScrollRef.current.scrollTop = 0;

                // Reset view based on tab
                switch (activeTab) {
                    case 'request':
                    case 'process':
                        setCurrentImage('./img/project_07/display.jpg');
                        setActiveGalleryId(null);
                        setActiveFeatureId(null);
                        break;
                    case 'highlights':
                        if (features && features.length > 0) {
                            setCurrentImage(features[0].image);
                            setActiveFeatureId(features[0].id);
                            setActiveGalleryId(null);
                        }
                        break;
                    case 'gallery':
                        if (gallery && gallery.length > 0) {
                            setCurrentImage(gallery[0].src);
                            setActiveGalleryId(gallery[0].id);
                            setActiveFeatureId(null);
                        }
                        break;
                }
            // galleryImages/solutionFeatures (or similarly named lists) are derived fresh
            // from `lang` every render, not stored state — already covered by the `lang`
            // dep, and listing them would just make this effect run on every render.
            // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [activeTab, lang]);

            useEffect(() => {
                sectionsRef.current = [heroRef.current, splitRef.current];
                if (sectionsRef.current[0]) sectionsRef.current[0].classList.add('active-section');
            }, [loading]);

            const handleGallerySwitch = (imgObj) => { setCurrentImage(imgObj.src); setActiveGalleryId(imgObj.id); };
            const handleFeatureSwitch = (featObj) => { setCurrentImage(featObj.image); setActiveFeatureId(featObj.id); };

            // Scroll Logic
            const scrollToSection = (index) => {
                if (index < 0 || index >= sectionsRef.current.length || isScrollingRef.current) return;
                isScrollingRef.current = true;
                const targetSection = sectionsRef.current[index];
                const currentSection = sectionsRef.current[currentSectionIndex];
                setShowBackToHero(index > 0);

                const tl = gsap.timeline({
                    onComplete: () => {
                        isScrollingRef.current = false;
                        setCurrentSectionIndex(index);
                        if (currentSection !== targetSection) currentSection.classList.remove('active-section');
                        targetSection.classList.add('active-section');
                    }
                });

                if (currentSectionIndex !== index) tl.to(currentSection, { opacity: 0, duration: 0.8, ease: "power2.out" });
                tl.to(mainContainerRef.current, { scrollTo: { y: targetSection.offsetTop, autoKill: false }, duration: 1.2, ease: "power2.inOut" }, "<");
                tl.to(targetSection, { opacity: 1, duration: 1, onStart: () => { targetSection.classList.add('active-section'); targetSection.style.visibility = 'visible'; } }, "-=0.8");
            };

            const handleWheel = (e) => {
                if (isScrollingRef.current) return;
                // Stop scroll if inside tabs
                if (tabsContainerRef.current && tabsContainerRef.current.contains(e.target)) return;

                const scrollable = e.target.closest('.scrollable-area');
                if (scrollable) {
                    const { scrollTop, scrollHeight, clientHeight } = scrollable;
                    const isScrollable = scrollHeight > clientHeight;
                    if (isScrollable) {
                        if (e.deltaY < 0) return;
                        const atBottom = Math.abs(scrollHeight - clientHeight - scrollTop) <= 1;
                        if (!atBottom) return;
                    }
                }
                if (e.deltaY > 0 && currentSectionIndex < sectionsRef.current.length - 1) scrollToSection(currentSectionIndex + 1);
            };

            const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };

            const handleTouchEnd = (e) => {
                if (isScrollingRef.current) return;
                // Stop swipe if inside tabs
                if (tabsContainerRef.current && tabsContainerRef.current.contains(e.target)) return;

                const diff = touchStartY.current - e.changedTouches[0].clientY;
                const scrollable = e.target.closest('.scrollable-area');

                if (Math.abs(diff) > 50 && diff > 0) {
                    if (scrollable) {
                        const { scrollTop, scrollHeight, clientHeight } = scrollable;
                        const atBottom = Math.abs(scrollHeight - clientHeight - scrollTop) <= 1;
                        if (scrollHeight > clientHeight && !atBottom) return;
                    }
                    if (currentSectionIndex < sectionsRef.current.length - 1) scrollToSection(currentSectionIndex + 1);
                }
            };

            useEffect(() => {
                const container = mainContainerRef.current;
                if (container) {
                    window.addEventListener('wheel', handleWheel, { passive: false });
                    window.addEventListener('touchstart', handleTouchStart, { passive: true });
                    window.addEventListener('touchend', handleTouchEnd, { passive: true });
                }
                return () => {
                    window.removeEventListener('wheel', handleWheel);
                    window.removeEventListener('touchstart', handleTouchStart);
                    window.removeEventListener('touchend', handleTouchEnd);
                };
            // handleWheel/handleTouchEnd are recreated every render and already close
            // over the latest currentSectionIndex; re-subscribing on every render would
            // be wasteful and risks detaching mid-gesture, so only resync on index change.
            // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [currentSectionIndex]);

            const goBack = () => {
                let sameOrigin = false;
                try { sameOrigin = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
                if (sameOrigin && window.history.length > 1) history.back();
                else location.href = '/#portfolio';
            };

            return (
                <React.Fragment>
                    <div className={`loader ${loading ? '' : 'hidden'}`}><div className="loader-animation"></div><p className="loader-text">{loaderDone ? t('loader_step4') : t(`loader_step${loaderStep + 1}`)}</p></div>

                    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center pointer-events-none">
                        <BackButton prefix="sm" label={t('back_home')} onClick={goBack} />
                    </nav>

                    <ScrollTopButton prefix="sm" visible={showBackToHero} onClick={() => scrollToSection(0)} />

                    <div id="main-scroller" ref={mainContainerRef}>
                        {/* [修改] bg-dark -> bg-sm-dark */}
                        <section id="hero" ref={heroRef} className="snap-section active-section flex items-center justify-center bg-sm-dark hero-bg-custom">
                            <div className="container max-w-7xl mx-auto px-8 z-20">
                                <div className="max-w-5xl text-left">
                                    <div className={`inline-block px-4 py-1 rounded-full border border-white text-white text-xs font-bold tracking-widest mb-6 font-sans ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.1s' }}>GOV. DIGITAL TRANSFORMATION</div>
                                    <h1 className={`text-5xl lg:text-7xl font-black mb-8 leading-tight text-white drop-shadow-2xl text-left font-heading ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.2s' }}>{t('title_main')}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-sm-accent to-white font-heading">{t('title_sub')}</span></h1>
                                    <h2 className={`text-xl md:text-2xl text-gray-300 font-light mb-12 max-w-2xl mr-auto leading-relaxed drop-shadow-md text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.3s' }}>{t('hero_desc')}</h2>
                                    <HeroCTAButton prefix="sm" shadowClass="shadow-[0_10px_30px_rgba(0,160,233,0.4)]" loading={loading} label={t('btn_explore')} onClick={() => scrollToSection(1)} />
                                </div>
                            </div>
                        </section>

                        {/* [修改] bg-dark -> bg-sm-dark */}
                        <section id="split-view" ref={splitRef} className="snap-section flex flex-col lg:flex-row bg-sm-dark overflow-hidden">
                            {/* [修改] bg-[#1e293b] (保留原色碼) */}
                            <div className="w-full shrink-0 z-20 lg:w-3/5 lg:h-full bg-[#1e293b] flex items-center justify-center p-4 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 shadow-2xl">
                                <div className="w-full h-[35vh] lg:h-full flex flex-col items-center justify-center">
                                    <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                                        {/* [修改] bg-dark-light -> bg-sm-dark-light */}
                                        <div className={`relative transition-all duration-500 shadow-2xl rounded-xl border border-white/10 overflow-hidden flex flex-col ${['highlights', 'gallery'].includes(activeTab) ? 'w-full h-full max-w-full max-h-full lg:max-h-[90%] bg-sm-dark-light' : 'w-auto h-auto max-w-full max-h-full lg:max-h-[90%] bg-transparent'}`}>
                                            {['highlights', 'gallery'].includes(activeTab) && <BrowserFrame />}
                                            <div ref={imageScrollRef} className={`relative w-full h-full scrollable-area ${['highlights', 'gallery'].includes(activeTab) ? 'flex-1 min-h-0 block bg-white/5' : 'overflow-hidden flex items-center justify-center h-full'}`}>
                                                <ImageWithSkeleton src={currentImage} alt="Preview" className={`transition-all duration-500 block ${['highlights', 'gallery'].includes(activeTab) ? 'w-full h-auto' : 'max-w-full max-h-full object-contain'}`} containerClassName={['highlights', 'gallery'].includes(activeTab) ? 'w-full h-auto' : 'w-full h-full flex items-center justify-center'} />
                                            </div>
                                        </div>
                                    </div>
                                    {['highlights', 'gallery'].includes(activeTab) && (
                                        <div className="text-center mt-2 text-xs text-gray-500 shrink-0"><i className="ph ph-arrows-down-up mr-2"></i>{t('scroll_hint')}</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 w-full relative z-10 lg:w-2/5 lg:h-full flex flex-col h-auto min-h-0">
                                <div className="w-full h-full flex flex-col glass-panel relative min-h-0">
                                    {/* [修改] bg-dark/95 -> bg-sm-dark/95 */}
                                    <div className="sticky top-0 bg-sm-dark/95 backdrop-blur-xl z-30 border-b border-white/10 shrink-0">
                                        <div className="p-4 lg:p-8 pb-0 lg:pb-0">
                                            <h2 className="text-xl lg:text-3xl font-bold text-white font-heading mb-1 leading-tight">{t('title_main')}<br />{t('title_sub')}</h2>
                                            <p className="text-gray-400 text-xs lg:text-sm mb-2 lg:mb-4">UI/UX Design Audit Report</p>

                                            <TabNav
                                                prefix="sm"
                                                containerRef={tabsContainerRef}
                                                activeTab={activeTab}
                                                onChange={setActiveTab}
                                                tabs={[{ id: 'request', label: t('tab_request') }, { id: 'process', label: t('tab_process') }, { id: 'highlights', label: t('tab_highlights') }, { id: 'gallery', label: t('tab_gallery') }]}
                                            />
                                        </div>
                                    </div>

                                    <div ref={contentScrollRef} onTouchStart={handleTabTouchStart} onTouchEnd={handleTabTouchEnd} className="flex-1 scroll-content scrollable-area custom-scroll overflow-x-hidden relative">
                                    <div ref={swipeContentRef} className="p-4 lg:p-8 pb-24">
                                        {activeTab === 'request' && (
                                            <div className="space-y-8 lg:space-y-12 animate-fadeIn">
                                                <div className="space-y-4 lg:space-y-6"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('request_title')}</h3><p className="text-gray-300 text-sm leading-relaxed mb-4">{t('request_desc')}</p><InfoGrid><InfoCard><div className="text-xs text-gray-500 uppercase mb-1">{t('role_title')}</div><div className="font-bold text-white">{t('role_name')}</div></InfoCard><InfoCard><div className="text-xs text-gray-500 uppercase mb-2">{t('tools')}</div><div className="flex flex-wrap gap-2"><ToolPill prefix="sm" color="primary" icon={<SharedIcons.XD />} label="Adobe XD" /><ToolPill prefix="sm" color="secondary" icon={<SharedIcons.AI />} label="Illustrator" /></div></InfoCard></InfoGrid><div className="grid grid-cols-1 gap-4"><div className="feature-card border border-white/10 p-5"><h4 className="text-sm-secondary font-bold text-sm mb-3">{t('list_title')}</h4><ul className="space-y-3 text-gray-300"><li className="flex items-start text-sm"><span className="text-sm-primary mr-3 mt-1"><i className="ph ph-check-circle"></i></span><div><strong className="text-white">{t('req_1_title')}</strong><span className="block text-xs text-gray-500">{t('req_1_desc')}</span></div></li><li className="flex items-start text-sm"><span className="text-sm-primary mr-3 mt-1"><i className="ph ph-check-circle"></i></span><div><strong className="text-white">{t('req_2_title')}</strong><span className="block text-xs text-gray-500">{t('req_2_desc')}</span></div></li><li className="flex items-start text-sm"><span className="text-sm-primary mr-3 mt-1"><i className="ph ph-check-circle"></i></span><div><strong className="text-white">{t('req_3_title')}</strong><span className="block text-xs text-gray-500">{t('req_3_desc')}</span></div></li></ul></div></div></div></div>
                                        )}
                                        {activeTab === 'process' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('process_title')}</h3><ProcessTimeline
                                                    prefix="sm"
                                                    glowShadowClass="shadow-[0_0_10px_rgba(0,160,233,0.5)]"
                                                    steps={[
                                                        { title: t('step_1_title'), desc: t('step_1_desc') },
                                                        { title: t('step_2_title'), desc: t('step_2_desc') },
                                                        { title: t('step_3_title'), desc: t('step_3_desc') },
                                                        { title: t('step_4_title'), desc: t('step_4_desc') },
                                                    ]}
                                                /></div>
                                        )}
                                        {activeTab === 'highlights' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('highlights_title')}</h3><div className="space-y-4">{features.map((feat) => { const IconComp = Icons[feat.icon]; return (
                                                <FeatureCard
                                                    key={feat.id}
                                                    prefix="sm"
                                                    active={activeFeatureId === feat.id}
                                                    onClick={() => handleFeatureSwitch(feat)}
                                                    icon={<IconComp />}
                                                    title={feat.title}
                                                    desc={feat.desc}
                                                    benefit={feat.note}
                                                    activeShadowClass="shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                                                />
                                            ); })}</div></div>
                                        )}
                                        {activeTab === 'gallery' && (
                                            /* [關鍵修正] 1. 外框: !border-sm-primary (藍色) 2. 標題: text-white (白色) */
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('gallery_title')}</h3><p className="text-gray-400 mb-6 text-sm">{t('gallery_desc')}</p><div className="grid gap-4">{gallery.map((img) => (
                                                <GalleryItemButton
                                                    key={img.id}
                                                    prefix="sm"
                                                    active={activeGalleryId === img.id}
                                                    onClick={() => handleGallerySwitch(img)}
                                                    id={img.id}
                                                    name={img.name}
                                                    desc={img.desc}
                                                    activeShadowClass="shadow-[0_0_15px_rgba(0,160,233,0.1)]"
                                                />
                                            ))}</div></div>
                                        )}
                                        <div className="h-8"></div>
                                    
                                    </div>
                                    {peekTab && (
                                    <div ref={peekContentRef} style={{ transform: `translateX(${dragDirRef.current * 100}%)` }} className="absolute inset-0 p-4 lg:p-8 pb-24 overflow-y-auto">
                                        {peekTab === 'request' && (
                                            <div className="space-y-8 lg:space-y-12 animate-fadeIn">
                                                <div className="space-y-4 lg:space-y-6"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('request_title')}</h3><p className="text-gray-300 text-sm leading-relaxed mb-4">{t('request_desc')}</p><InfoGrid><InfoCard><div className="text-xs text-gray-500 uppercase mb-1">{t('role_title')}</div><div className="font-bold text-white">{t('role_name')}</div></InfoCard><InfoCard><div className="text-xs text-gray-500 uppercase mb-2">{t('tools')}</div><div className="flex flex-wrap gap-2"><ToolPill prefix="sm" color="primary" icon={<SharedIcons.XD />} label="Adobe XD" /><ToolPill prefix="sm" color="secondary" icon={<SharedIcons.AI />} label="Illustrator" /></div></InfoCard></InfoGrid><div className="grid grid-cols-1 gap-4"><div className="feature-card border border-white/10 p-5"><h4 className="text-sm-secondary font-bold text-sm mb-3">{t('list_title')}</h4><ul className="space-y-3 text-gray-300"><li className="flex items-start text-sm"><span className="text-sm-primary mr-3 mt-1"><i className="ph ph-check-circle"></i></span><div><strong className="text-white">{t('req_1_title')}</strong><span className="block text-xs text-gray-500">{t('req_1_desc')}</span></div></li><li className="flex items-start text-sm"><span className="text-sm-primary mr-3 mt-1"><i className="ph ph-check-circle"></i></span><div><strong className="text-white">{t('req_2_title')}</strong><span className="block text-xs text-gray-500">{t('req_2_desc')}</span></div></li><li className="flex items-start text-sm"><span className="text-sm-primary mr-3 mt-1"><i className="ph ph-check-circle"></i></span><div><strong className="text-white">{t('req_3_title')}</strong><span className="block text-xs text-gray-500">{t('req_3_desc')}</span></div></li></ul></div></div></div></div>
                                        )}
                                        {peekTab === 'process' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('process_title')}</h3><ProcessTimeline
                                                    prefix="sm"
                                                    glowShadowClass="shadow-[0_0_10px_rgba(0,160,233,0.5)]"
                                                    steps={[
                                                        { title: t('step_1_title'), desc: t('step_1_desc') },
                                                        { title: t('step_2_title'), desc: t('step_2_desc') },
                                                        { title: t('step_3_title'), desc: t('step_3_desc') },
                                                        { title: t('step_4_title'), desc: t('step_4_desc') },
                                                    ]}
                                                /></div>
                                        )}
                                        {peekTab === 'highlights' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('highlights_title')}</h3><div className="space-y-4">{features.map((feat) => { const IconComp = Icons[feat.icon]; return (
                                                <FeatureCard
                                                    key={feat.id}
                                                    prefix="sm"
                                                    active={activeFeatureId === feat.id}
                                                    onClick={() => handleFeatureSwitch(feat)}
                                                    icon={<IconComp />}
                                                    title={feat.title}
                                                    desc={feat.desc}
                                                    benefit={feat.note}
                                                    activeShadowClass="shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                                                />
                                            ); })}</div></div>
                                        )}
                                        {peekTab === 'gallery' && (
                                            /* [關鍵修正] 1. 外框: !border-sm-primary (藍色) 2. 標題: text-white (白色) */
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('gallery_title')}</h3><p className="text-gray-400 mb-6 text-sm">{t('gallery_desc')}</p><div className="grid gap-4">{gallery.map((img) => (
                                                <GalleryItemButton
                                                    key={img.id}
                                                    prefix="sm"
                                                    active={activeGalleryId === img.id}
                                                    onClick={() => handleGallerySwitch(img)}
                                                    id={img.id}
                                                    name={img.name}
                                                    desc={img.desc}
                                                    activeShadowClass="shadow-[0_0_15px_rgba(0,160,233,0.1)]"
                                                />
                                            ))}</div></div>
                                        )}
                                        <div className="h-8"></div>
                                    
                                    
                                    </div>
                                    )}</div>
                                </div>
                            </div>

                        </section>
                    </div>
                </React.Fragment>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
