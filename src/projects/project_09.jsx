import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import gsap from 'gsap';
import ScrollToPlugin from 'gsap/ScrollToPlugin';
import {
    SharedIcons, BackButton, ScrollTopButton, HeroCTAButton, TabNav, ToolPill,
    InfoGrid, InfoCard, PainPointCard, ProcessTimeline, FeatureCard,
    GalleryItemButton, BrowserFrame, ImageWithSkeleton,
} from './shared/index.js';

gsap.registerPlugin(ScrollToPlugin);

// --- COMPONENTS ---
        const Icons = {
            Clock: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            Users: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
            Shield: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            Efficiency: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
            Lock: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        };

        // --- TRANSLATIONS & DATA ---
        const TRANSLATIONS = {
            zh: {
                loader_step1: "讀取專案中繼資料",
                loader_step2: "載入視覺素材",
                loader_step3: "建構渲染畫布",
                loader_step4: "初始化完成",
                title_main: "新竹縣環保局", title_sub: "內部整合資訊系統",
                hero_desc: "從繁瑣到直觀，為公部門打造的高效數位辦公樞紐。",
                btn_explore: "探索設計旅程", back_home: "Back to Portfolio",
                tab_context: "01. 背景與痛點", tab_process: "02. 流程", tab_solution: "03. 方案", tab_climax: "04. 成果",

                context_title: "專案背景 Context",
                context_desc: "這是一個針對新竹縣環保局內部員工設計的整合資訊系統。我們的任務是將分散的行政流程（如通訊錄查找、會議室預約、公文下載）集中到一個統一、直觀的入口網站。",
                role_title: "My Role", role_name: "UI 設計師", tools: "Tools",
                conflict_title: "痛點與挑戰 The Conflict", conflict_sub: "解決方案出現前的困境",
                pain_1_title: "行政效率低落", pain_1_desc: "會議室預約依賴人工登記，經常發生時段衝突。",
                pain_2_title: "資訊傳遞斷層", pain_2_desc: "公文與公告分散，員工難以追溯歷史資料。",
                pain_3_title: "權限管理鬆散", pain_3_desc: "缺乏系統化的權限分級，資料安全有隱憂。",

                process_title: "執行過程 The Process", process_sub: "從需求分析到最終交付的四個關鍵階段",
                step_1_title: "01. 需求分析", step_1_desc: "訪談各科室代表，盤點高頻使用的行政功能與痛點。",
                step_2_title: "02. 邏輯設計", step_2_desc: "規劃核心模組，確立清晰的資訊層級與導航架構。",
                step_3_title: "03. 視覺優化", step_3_desc: "導入大圖示與現代化配色，降低使用者的學習門檻。",
                step_4_title: "04. 互動開發", step_4_desc: "定義按鈕狀態、RWD 響應式行為與回饋機制。",

                sol_title: "解決方案與亮點 The Solution",
                sol_1_title: "視覺化預約系統", sol_1_desc: "整合即時日曆視圖，解決人工登記的衝突痛點。", sol_1_benefit: "Benefit: 透過直觀的日曆視圖，員工可一秒辨識空檔並直接預約，杜絕撞期，大幅節省溝通成本。",
                sol_2_title: "結構化員工通訊錄", sol_2_desc: "打破部門藩籬，建立統一的數位化聯絡中心。", sol_2_benefit: "Benefit: 清晰列出人員職稱、科室與分機，強化跨部門協作效率。",
                sol_3_title: "分級權限管理", sol_3_desc: "針對不同科室與職級設定專屬權限，確保資料流向安全可控。", sol_3_benefit: "Benefit: 針對不同科室設定專屬權限，確保資料流向安全可控。",

                gallery_title: "介面展示 Gallery", gallery_desc: "點擊下方卡片查看高保真設計。",
                gallery_item_hint: "點擊預覽 {name} 介面細節。",
                img_admin: "管理者後台", img_news: "消息中心", img_booking: "預約表單", img_meeting: "局務會議",
                scroll_hint: "上下滾動瀏覽完整畫面"
            },
            en: {
                loader_step1: "Reading project metadata",
                loader_step2: "Loading visual assets",
                loader_step3: "Constructing render canvas",
                loader_step4: "Initialization complete",
                title_main: "Hsinchu EPB", title_sub: "Internal Info System",
                hero_desc: "From tedious to intuitive. Creating an efficient digital office hub for the public sector.",
                btn_explore: "Explore the Journey", back_home: "Back to Portfolio",
                tab_context: "01. Context", tab_process: "02. Process", tab_solution: "03. Solution", tab_climax: "04. Gallery",

                context_title: "Project Overview",
                context_desc: "An integrated information system designed for the Hsinchu County Environmental Protection Bureau staff. Our mission was to centralize scattered administrative processes (like directory search, meeting room booking, document downloads) into a unified, intuitive portal.",
                role_title: "My Role", role_name: "UI Designer", tools: "Tools",
                conflict_title: "The Conflict", conflict_sub: "Pain points before the solution",
                pain_1_title: "Low Efficiency", pain_1_desc: "Meeting room booking relied on manual entry, often causing conflicts.",
                pain_2_title: "Info Gap", pain_2_desc: "Documents and announcements were scattered, making history hard to trace.",
                pain_3_title: "Loose Security", pain_3_desc: "Lack of systematic permission levels caused data security concerns.",

                process_title: "The Process", process_sub: "Four key stages from analysis to delivery",
                step_1_title: "01. Analysis", step_1_desc: "Interviewed department reps to identify high-frequency tasks.",
                step_2_title: "02. Logic Design", step_2_desc: "Planned core modules and established clear information hierarchy.",
                step_3_title: "03. Visual Optimization", step_3_desc: "Introduced large icons and modern colors to lower the learning curve.",
                step_4_title: "04. Interaction Dev", step_4_desc: "Defined button states, RWD behavior, and feedback mechanisms.",

                sol_title: "The Solution",
                sol_1_title: "Visualized Reservation", sol_1_desc: "Integrated real-time calendar view to solve manual booking conflicts.", sol_1_benefit: "Benefit: Intuitive calendar allows employees to spot open slots instantly, saving communication costs.",
                sol_2_title: "Structured Directory", sol_2_desc: "Breaking departmental silos to build a unified digital contact center.", sol_2_benefit: "Benefit: Clearly lists titles, departments, and extensions to boost collaboration.",
                sol_3_title: "Permission Management", sol_3_desc: "Specific permissions for different departments and ranks to ensure data security.", sol_3_benefit: "Benefit: Custom permissions ensure controllable and secure data flow.",

                gallery_title: "Interface Gallery", gallery_desc: "Click the cards below to view high-fidelity designs.",
                gallery_item_hint: "Click to preview interface details for {name}.",
                img_admin: "Admin Dashboard", img_news: "News Center", img_booking: "Reservation Form", img_meeting: "Bureau Meeting",
                scroll_hint: "Scroll to view the full screen"
            }
        };

        // --- Dynamic Data Helpers ---
        const getSolutionFeatures = (t) => [
            { id: 'sol-01', title: t('sol_1_title'), desc: t('sol_1_desc'), icon: 'Efficiency', image: './img/project_09/Room Reservation.jpg', benefit: t('sol_1_benefit') },
            { id: 'sol-02', title: t('sol_2_title'), desc: t('sol_2_desc'), icon: 'Users', image: './img/project_09/menu.jpg', benefit: t('sol_2_benefit') },
            { id: 'sol-03', title: t('sol_3_title'), desc: t('sol_3_desc'), icon: 'Lock', image: './img/project_09/manage.jpg', benefit: t('sol_3_benefit') }
        ];

        const getGalleryImages = (t) => {
            const items = [
                { id: '01', name: t('img_admin'), src: './img/project_09/manage.jpg' },
                { id: '02', name: t('img_news'), src: './img/project_09/News.jpg' },
                { id: '03', name: t('img_booking'), src: './img/project_09/Room Reservation non.jpg' },
                { id: '04', name: t('img_meeting'), src: './img/project_09/Authority.jpg' }
            ];
            return items.map((img) => ({ ...img, desc: t('gallery_item_hint').replace('{name}', img.name) }));
        };

        const App = () => {
            const [lang, setLang] = useState('zh');
            const [loading, setLoading] = useState(true);
            const [loaderStep, setLoaderStep] = useState(0);
            const [loaderDone, setLoaderDone] = useState(false);
            const [activeTab, setActiveTab] = useState('context');
            const [currentImage, setCurrentImage] = useState('./img/project_09/display.jpg');
            const [activeGalleryId, setActiveGalleryId] = useState(null);
            const [activeSolutionId, setActiveSolutionId] = useState(null);
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
            const TAB_ORDER = ['context', 'process', 'solution', 'climax'];
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
            const tabsContainerRef = useRef(null);

            const t = (key) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) ? TRANSLATIONS[lang][key] : key;

            // Derived Data
            const solutionFeatures = getSolutionFeatures((k) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][k]) ? TRANSLATIONS[lang][k] : k);
            const galleryImages = getGalleryImages((k) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][k]) ? TRANSLATIONS[lang][k] : k);

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
                    preload('./img/project_09/hero_img.webp'),
                    preload('./img/project_09/display.webp'),
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
                    case 'context':
                    case 'process':
                        setCurrentImage('./img/project_09/display.jpg');
                        setActiveGalleryId(null);
                        setActiveSolutionId(null);
                        break;
                    case 'solution':
                        setCurrentImage(solutionFeatures[0].image);
                        setActiveSolutionId(solutionFeatures[0].id);
                        setActiveGalleryId(null);
                        break;
                    case 'climax':
                        setCurrentImage(galleryImages[0].src);
                        setActiveGalleryId(galleryImages[0].id);
                        setActiveSolutionId(null);
                        break;
                    default:
                        setCurrentImage('./img/project_09/display.jpg');
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

            // Scroll Logic
            const scrollToSection = (index) => {
                if (index < 0 || index >= sectionsRef.current.length || isScrollingRef.current) return;
                isScrollingRef.current = true;
                const targetSection = sectionsRef.current[index];
                const currentSection = sectionsRef.current[currentSectionIndex];
                setShowBackToHero(index > 0);

                const tl = gsap.timeline({ onComplete: () => { isScrollingRef.current = false; setCurrentSectionIndex(index); if (currentSection !== targetSection) currentSection.classList.remove('active-section'); targetSection.classList.add('active-section'); } });
                if (currentSectionIndex !== index) tl.to(currentSection, { opacity: 0, duration: 0.8, ease: "power2.out" });
                tl.to(mainContainerRef.current, { scrollTo: { y: targetSection.offsetTop, autoKill: false }, duration: 1.2, ease: "power2.inOut" }, "<");
                tl.to(targetSection, { opacity: 1, duration: 1, onStart: () => { targetSection.classList.add('active-section'); targetSection.style.visibility = 'visible'; } }, "-=0.8");
            };

            const handleWheel = (e) => {
                if (isScrollingRef.current) return;
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
            const handleGallerySwitch = (imgObj) => { setCurrentImage(imgObj.src); setActiveGalleryId(imgObj.id); };
            const handleSolutionSwitch = (solObj) => { setCurrentImage(solObj.image); setActiveSolutionId(solObj.id); };

            const showBrowserHeader = !['context', 'process'].includes(activeTab);

            return (
                <React.Fragment>
                    <div className={`loader ${loading ? '' : 'hidden'}`}><div className="loader-animation"></div><p className="loader-text">{loaderDone ? t('loader_step4') : t(`loader_step${loaderStep + 1}`)}</p></div>

                    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center pointer-events-none">
                        <BackButton prefix="epb" label={t('back_home')} onClick={goBack} />
                    </nav>

                    <ScrollTopButton prefix="epb" visible={showBackToHero} onClick={() => scrollToSection(0)} />

                    <div id="main-scroller" ref={mainContainerRef}>
                        {/* [修改] bg-dark -> bg-epb-dark */}
                        <section ref={heroRef} className="snap-section active-section flex items-center justify-center bg-epb-dark hero-bg-custom">
                            <div className="container max-w-7xl mx-auto px-8 z-20">
                                <div className="max-w-5xl text-left">
                                    {/* [修改] border-white -> border-epb-accent, text-white -> text-epb-accent */}
                                    <div className={`inline-block px-4 py-1 rounded-full border border-epb-accent text-epb-accent text-xs font-bold tracking-widest mb-6 font-sans ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.1s' }}>GOV. DIGITAL TRANSFORMATION</div>
                                    <h1 className={`text-5xl lg:text-7xl font-black mb-8 leading-tight text-white drop-shadow-2xl text-left font-heading ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.2s' }}>{t('title_main')}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-epb-accent to-white font-heading">{t('title_sub')}</span></h1>
                                    <h2 className={`text-xl md:text-2xl text-gray-300 font-light mb-12 max-w-2xl mr-auto leading-relaxed drop-shadow-md text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.3s' }}>{t('hero_desc')}</h2>
                                    <HeroCTAButton prefix="epb" shadowClass="shadow-[0_10px_30px_rgba(0,113,184,0.4)]" loading={loading} label={t('btn_explore')} onClick={() => scrollToSection(1)} />
                                </div>
                            </div>
                        </section>

                        {/* [修改] bg-dark -> bg-epb-dark */}
                        <section ref={splitRef} className="snap-section flex flex-col lg:flex-row bg-epb-dark overflow-hidden">
                            {/* [修改] bg-[#1e293b] (保留原色碼) */}
                            <div className="w-full shrink-0 z-20 lg:w-3/5 lg:h-full bg-[#1e293b] flex items-center justify-center p-4 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 shadow-2xl">
                                <div className="w-full h-[35vh] lg:h-full flex flex-col items-center justify-center">
                                    <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                                        {/* [修改] bg-dark-light -> bg-epb-dark-light */}
                                        <div className={`relative transition-all duration-500 shadow-2xl rounded-xl border border-white/10 overflow-hidden flex flex-col ${showBrowserHeader ? 'w-full h-full max-w-full max-h-full lg:max-h-[90%] bg-epb-dark-light' : 'w-auto h-auto max-w-full max-h-full lg:max-h-[90%] bg-transparent'}`}>
                                            {showBrowserHeader && <BrowserFrame />}
                                            <div ref={imageScrollRef} className={`relative w-full h-full scrollable-area ${showBrowserHeader ? 'flex-1 min-h-0 block bg-white/5' : 'overflow-hidden flex items-center justify-center h-full'}`}>
                                                <ImageWithSkeleton src={currentImage} alt="Preview" className={`transition-all duration-500 block ${showBrowserHeader ? 'w-full h-auto' : 'max-w-full max-h-full object-contain'}`} containerClassName={showBrowserHeader ? 'w-full h-auto' : 'w-full h-full flex items-center justify-center'} />
                                            </div>
                                        </div>
                                    </div>
                                    {showBrowserHeader && (
                                        <div className="text-center mt-2 text-xs text-gray-500 shrink-0"><i className="ph ph-arrows-down-up mr-2"></i>{t('scroll_hint')}</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 w-full relative z-10 lg:w-2/5 lg:h-full flex flex-col h-auto min-h-0">
                                <div className="w-full h-full flex flex-col glass-panel relative min-h-0">
                                    {/* [修改] bg-dark/95 -> bg-epb-dark/95 */}
                                    <div className="sticky top-0 bg-epb-dark/95 backdrop-blur-xl z-30 border-b border-white/10 shrink-0">
                                        <div className="p-4 lg:p-8 pb-0 lg:pb-0">
                                            <h2 className="text-xl lg:text-3xl font-bold text-white font-heading mb-1 leading-tight">{t('title_main')}<br />{t('title_sub')}</h2>
                                            <p className="text-gray-400 text-xs lg:text-sm mb-2 lg:mb-4">UI/UX Design Audit Report</p>
                                            <TabNav
                                                prefix="epb"
                                                containerRef={tabsContainerRef}
                                                activeTab={activeTab}
                                                onChange={setActiveTab}
                                                tabs={[{ id: 'context', label: t('tab_context') }, { id: 'process', label: t('tab_process') }, { id: 'solution', label: t('tab_solution') }, { id: 'climax', label: t('tab_climax') }]}
                                            />
                                        </div>
                                    </div>

                                    <div ref={contentScrollRef} onTouchStart={handleTabTouchStart} onTouchEnd={handleTabTouchEnd} className="flex-1 scroll-content scrollable-area custom-scroll overflow-x-hidden relative">
                                    <div ref={swipeContentRef} className="p-4 lg:p-8 pb-24">
                                        {activeTab === 'context' && (
                                            <div className="space-y-8 lg:space-y-12 animate-fadeIn">
                                                <div className="space-y-4 lg:space-y-6"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('context_title')}</h3><p className="text-gray-300 text-sm leading-relaxed mb-4">{t('context_desc')}</p>
                                                    <InfoGrid>
                                                        <InfoCard><div className="text-xs text-gray-500 uppercase mb-1">{t('role_title')}</div><div className="font-bold text-white">{t('role_name')}</div></InfoCard>
                                                        <InfoCard>
                                                            <div className="text-xs text-gray-500 uppercase mb-2">{t('tools')}</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <ToolPill prefix="epb" color="primary" icon={<SharedIcons.XD />} label="Adobe XD" />
                                                                <ToolPill prefix="epb" color="secondary" icon={<SharedIcons.AI />} label="Illustrator" />
                                                            </div>
                                                        </InfoCard>
                                                    </InfoGrid>
                                                </div>
                                                <div className="w-full h-px bg-white/10"></div>
                                                <div className="space-y-6">
                                                    <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-epb-secondary rounded-full mr-3"></span>{t('conflict_title')}</h3>
                                                    <PainPointCard
                                                        prefix="epb"
                                                        subtitle={t('conflict_sub')}
                                                        items={[
                                                            { title: t('pain_1_title'), desc: t('pain_1_desc') },
                                                            { title: t('pain_2_title'), desc: t('pain_2_desc') },
                                                            { title: t('pain_3_title'), desc: t('pain_3_desc') },
                                                        ]}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {activeTab === 'process' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('process_title')}</h3>
                                                <ProcessTimeline
                                                    prefix="epb"
                                                    glowShadowClass="shadow-[0_0_10px_rgba(0,113,184,0.5)]"
                                                    steps={[
                                                        { title: t('step_1_title'), desc: t('step_1_desc') },
                                                        { title: t('step_2_title'), desc: t('step_2_desc') },
                                                        { title: t('step_3_title'), desc: t('step_3_desc') },
                                                        { title: t('step_4_title'), desc: t('step_4_desc') },
                                                    ]}
                                                />
                                            </div>
                                        )}
                                        {activeTab === 'solution' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('sol_title')}</h3><div className="space-y-4">{solutionFeatures.map((sol) => { const IconComp = Icons[sol.icon]; return (
                                                <FeatureCard
                                                    key={sol.id}
                                                    prefix="epb"
                                                    active={activeSolutionId === sol.id}
                                                    onClick={() => handleSolutionSwitch(sol)}
                                                    icon={<IconComp />}
                                                    title={sol.title}
                                                    desc={sol.desc}
                                                    benefit={sol.benefit}
                                                    activeShadowClass="shadow-[0_0_15px_rgba(0,212,255,0.1)]"
                                                />
                                            ); })}</div></div>
                                        )}
                                        {activeTab === 'climax' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('gallery_title')}</h3><p className="text-gray-400 mb-6 text-sm">{t('gallery_desc')}</p><div className="grid gap-4">{galleryImages.map((img) => (
                                                <GalleryItemButton
                                                    key={img.id}
                                                    prefix="epb"
                                                    active={activeGalleryId === img.id}
                                                    onClick={() => handleGallerySwitch(img)}
                                                    id={img.id}
                                                    name={img.name}
                                                    desc={img.desc}
                                                    activeShadowClass="shadow-[0_0_15px_rgba(0,113,184,0.1)]"
                                                />
                                            ))}</div></div>
                                        )}
                                        <div className="h-8"></div>
                                    
                                    </div>
                                    {peekTab && (
                                    <div ref={peekContentRef} style={{ transform: `translateX(${dragDirRef.current * 100}%)` }} className="absolute inset-0 p-4 lg:p-8 pb-24 overflow-y-auto">
                                        {peekTab === 'context' && (
                                            <div className="space-y-8 lg:space-y-12 animate-fadeIn">
                                                <div className="space-y-4 lg:space-y-6"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('context_title')}</h3><p className="text-gray-300 text-sm leading-relaxed mb-4">{t('context_desc')}</p>
                                                    <InfoGrid>
                                                        <InfoCard><div className="text-xs text-gray-500 uppercase mb-1">{t('role_title')}</div><div className="font-bold text-white">{t('role_name')}</div></InfoCard>
                                                        <InfoCard>
                                                            <div className="text-xs text-gray-500 uppercase mb-2">{t('tools')}</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <ToolPill prefix="epb" color="primary" icon={<SharedIcons.XD />} label="Adobe XD" />
                                                                <ToolPill prefix="epb" color="secondary" icon={<SharedIcons.AI />} label="Illustrator" />
                                                            </div>
                                                        </InfoCard>
                                                    </InfoGrid>
                                                </div>
                                                <div className="w-full h-px bg-white/10"></div>
                                                <div className="space-y-6">
                                                    <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-epb-secondary rounded-full mr-3"></span>{t('conflict_title')}</h3>
                                                    <PainPointCard
                                                        prefix="epb"
                                                        subtitle={t('conflict_sub')}
                                                        items={[
                                                            { title: t('pain_1_title'), desc: t('pain_1_desc') },
                                                            { title: t('pain_2_title'), desc: t('pain_2_desc') },
                                                            { title: t('pain_3_title'), desc: t('pain_3_desc') },
                                                        ]}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {peekTab === 'process' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('process_title')}</h3>
                                                <ProcessTimeline
                                                    prefix="epb"
                                                    glowShadowClass="shadow-[0_0_10px_rgba(0,113,184,0.5)]"
                                                    steps={[
                                                        { title: t('step_1_title'), desc: t('step_1_desc') },
                                                        { title: t('step_2_title'), desc: t('step_2_desc') },
                                                        { title: t('step_3_title'), desc: t('step_3_desc') },
                                                        { title: t('step_4_title'), desc: t('step_4_desc') },
                                                    ]}
                                                />
                                            </div>
                                        )}
                                        {peekTab === 'solution' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('sol_title')}</h3><div className="space-y-4">{solutionFeatures.map((sol) => { const IconComp = Icons[sol.icon]; return (
                                                <FeatureCard
                                                    key={sol.id}
                                                    prefix="epb"
                                                    active={activeSolutionId === sol.id}
                                                    onClick={() => handleSolutionSwitch(sol)}
                                                    icon={<IconComp />}
                                                    title={sol.title}
                                                    desc={sol.desc}
                                                    benefit={sol.benefit}
                                                    activeShadowClass="shadow-[0_0_15px_rgba(0,212,255,0.1)]"
                                                />
                                            ); })}</div></div>
                                        )}
                                        {peekTab === 'climax' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('gallery_title')}</h3><p className="text-gray-400 mb-6 text-sm">{t('gallery_desc')}</p><div className="grid gap-4">{galleryImages.map((img) => (
                                                <GalleryItemButton
                                                    key={img.id}
                                                    prefix="epb"
                                                    active={activeGalleryId === img.id}
                                                    onClick={() => handleGallerySwitch(img)}
                                                    id={img.id}
                                                    name={img.name}
                                                    desc={img.desc}
                                                    activeShadowClass="shadow-[0_0_15px_rgba(0,113,184,0.1)]"
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
