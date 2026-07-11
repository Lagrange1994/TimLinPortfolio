import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import gsap from 'gsap';
import ScrollToPlugin from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

// --- COMPONENTS ---
        const ResponsiveImage = ({ src, className, alt, style, onLoad, ...props }) => {
            if (!src) return null;
            const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            return (<picture style={{ display: 'contents' }}> <source srcSet={webpSrc} type="image/webp" /> <img src={src} className={className} alt={alt} style={style} onLoad={onLoad} {...props} /> </picture>);
        };

        const ImageWithSkeleton = ({ src, className, alt, containerClassName, ...props }) => {
            const [loaded, setLoaded] = useState(false);
            useEffect(() => { setLoaded(false); }, [src]);
            return (
                <div className={`relative ${containerClassName || 'w-full h-full'}`}>
                    {!loaded && (<div className="absolute inset-0 skeleton rounded-lg z-10 flex items-center justify-center pointer-events-none"> <i className="ph ph-image text-white/10 text-3xl"></i> </div>)}
                    <ResponsiveImage src={src} alt={alt} className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setLoaded(true)} {...props} />
                </div>
            );
        };

        const Icons = {
            XD: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M8 8l4 8" /><path d="M12 8l-4 8" /></svg>,
            AI: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l-9 18h18L12 3z" /><circle cx="12" cy="13" r="2" /></svg>,
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
                img_admin: "管理者後台", img_news: "消息中心", img_booking: "預約表單", img_meeting: "局務會議"
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
                img_admin: "Admin Dashboard", img_news: "News Center", img_booking: "Reservation Form", img_meeting: "Bureau Meeting"
            }
        };

        // --- Dynamic Data Helpers ---
        const getSolutionFeatures = (t) => [
            { id: 'sol-01', title: t('sol_1_title'), desc: t('sol_1_desc'), icon: 'Efficiency', image: './img/project_09/Room Reservation.jpg', benefit: t('sol_1_benefit') },
            { id: 'sol-02', title: t('sol_2_title'), desc: t('sol_2_desc'), icon: 'Users', image: './img/project_09/menu.jpg', benefit: t('sol_2_benefit') },
            { id: 'sol-03', title: t('sol_3_title'), desc: t('sol_3_desc'), icon: 'Lock', image: './img/project_09/manage.jpg', benefit: t('sol_3_benefit') }
        ];

        const getGalleryImages = (t) => [
            { id: '01', name: t('img_admin'), src: './img/project_09/manage.jpg' },
            { id: '02', name: t('img_news'), src: './img/project_09/News.jpg' },
            { id: '03', name: t('img_booking'), src: './img/project_09/Room Reservation non.jpg' },
            { id: '04', name: t('img_meeting'), src: './img/project_09/Authority.jpg' }
        ];

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
                const savedLang = localStorage.getItem('preferredLang');
                const initialLang = savedLang === 'en' ? 'en' : 'zh';
                setLang(initialLang);

                const preload = (src) => new Promise((resolve) => {
                    const img = new Image();
                    img.src = src;
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                });
                const assetsPromise = Promise.all([
                    preload('./img/project_09/hero_img.jpg'),
                    preload('./img/project_09/display.jpg'),
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

            const goBack = () => { location.href = '/#portfolio'; };
            const handleGallerySwitch = (imgObj) => { setCurrentImage(imgObj.src); setActiveGalleryId(imgObj.id); };
            const handleSolutionSwitch = (solObj) => { setCurrentImage(solObj.image); setActiveSolutionId(solObj.id); };

            const showBrowserHeader = !['context', 'process'].includes(activeTab);

            return (
                <React.Fragment>
                    <div className={`loader ${loading ? '' : 'hidden'}`}><div className="loader-animation"></div><p className="loader-text">{loaderDone ? t('loader_step4') : t(`loader_step${loaderStep + 1}`)}</p></div>

                    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center pointer-events-none">
                        {/* [修改] bg-dark-lighter -> bg-epb-dark-lighter, border-primary -> border-epb-primary */}
                        <button onClick={goBack} className="back-btn pointer-events-auto flex items-center justify-center h-10 w-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-gray-300 hover:text-white hover:border-epb-primary/50 hover:bg-epb-dark-lighter transition-all duration-300 shadow-lg group overflow-hidden hover:w-40">
                            {/* [修改] text-primary -> text-epb-primary, group-hover:text-secondary -> group-hover:text-epb-secondary */}
                            <i className="ph ph-arrow-left text-epb-primary group-hover:text-epb-secondary flex-shrink-0"></i>
                            <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[200px] ml-0 group-hover:ml-2 transition-all duration-300 whitespace-nowrap overflow-hidden text-sm font-bold">{t('back_home')}</span>
                        </button>
                    </nav>

                    <button onClick={() => scrollToSection(0)} className={`fixed bottom-8 right-8 z-[100] w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-epb-primary hover:border-epb-primary hover:scale-110 transition-all duration-300 cursor-pointer ${showBackToHero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}><i className="ph ph-arrow-up"></i></button>

                    <div id="main-scroller" ref={mainContainerRef}>
                        {/* [修改] bg-dark -> bg-epb-dark */}
                        <section ref={heroRef} className="snap-section active-section flex items-center justify-center bg-epb-dark hero-bg-custom">
                            <div className="container max-w-7xl mx-auto px-8 z-20">
                                <div className="max-w-5xl text-left">
                                    {/* [修改] border-white -> border-epb-accent, text-white -> text-epb-accent */}
                                    <div className={`inline-block px-4 py-1 rounded-full border border-epb-accent text-epb-accent text-xs font-bold tracking-widest mb-6 font-sans ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.1s' }}>GOV. DIGITAL TRANSFORMATION</div>
                                    <h1 className={`text-5xl lg:text-7xl font-black mb-8 leading-tight text-white drop-shadow-2xl text-left font-heading ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.2s' }}>{t('title_main')}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-epb-accent to-white font-heading">{t('title_sub')}</span></h1>
                                    <h2 className={`text-xl md:text-2xl text-gray-300 font-light mb-12 max-w-2xl mr-auto leading-relaxed drop-shadow-md text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.3s' }}>{t('hero_desc')}</h2>
                                    {/* [修改] bg-primary -> bg-epb-primary */}
                                    <button onClick={() => scrollToSection(1)} className={`px-10 py-4 bg-epb-primary border border-epb-primary/50 rounded-full text-white font-bold text-lg hover:bg-white hover:text-epb-primary transition-all shadow-[0_10px_30px_rgba(0,113,184,0.4)] transform hover:-translate-y-1 ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.4s' }}>{t('btn_explore')} <i className="ph ph-arrow-down ml-2 animate-bounce"></i></button>
                                </div>
                            </div>
                        </section>

                        {/* [修改] bg-dark -> bg-epb-dark */}
                        <section ref={splitRef} className="snap-section flex flex-col lg:flex-row bg-epb-dark overflow-hidden">
                            {/* [修改] bg-[#1e293b] (保留原色碼) */}
                            <div className="w-full shrink-0 z-20 lg:w-3/5 lg:h-full bg-[#1e293b] flex items-center justify-center p-4 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 shadow-2xl">
                                <div className="w-full h-[35vh] lg:h-full flex items-center justify-center">
                                    {/* [修改] bg-dark-light -> bg-epb-dark-light */}
                                    <div className={`relative transition-all duration-500 shadow-2xl rounded-xl border border-white/10 overflow-hidden flex flex-col ${showBrowserHeader ? 'w-full h-full max-w-full max-h-full lg:max-h-[90%] bg-epb-dark-light' : 'w-auto h-auto max-w-full max-h-full lg:max-h-[90%] bg-transparent'}`}>
                                        {showBrowserHeader && (
                                            <div className="h-8 bg-[#334155] border-b border-white/5 flex items-center px-4 space-x-2 shrink-0">
                                                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div><div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div><div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                                            </div>
                                        )}
                                        <div ref={imageScrollRef} className={`relative w-full h-full scrollable-area ${showBrowserHeader ? 'flex-1 min-h-0 block bg-white/5' : 'overflow-hidden flex items-center justify-center h-full'}`}>
                                            <ImageWithSkeleton src={currentImage} alt="Preview" className={`transition-all duration-500 block ${showBrowserHeader ? 'w-full h-auto' : 'max-w-full max-h-full object-contain'}`} containerClassName={showBrowserHeader ? 'w-full h-auto' : 'w-full h-full flex items-center justify-center'} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 w-full relative z-10 lg:w-2/5 lg:h-full flex flex-col h-auto min-h-0">
                                <div className="w-full h-full flex flex-col glass-panel relative min-h-0">
                                    {/* [修改] bg-dark/95 -> bg-epb-dark/95 */}
                                    <div className="sticky top-0 bg-epb-dark/95 backdrop-blur-xl z-30 border-b border-white/10 shrink-0">
                                        <div className="p-6 lg:p-8 pb-0 lg:pb-0">
                                            <h2 className="text-xl lg:text-3xl font-bold text-white font-heading mb-1 leading-tight">{t('title_main')}<br />{t('title_sub')}</h2>
                                            <p className="text-gray-400 text-xs lg:text-sm mb-4">UI/UX Design Audit Report</p>
                                            <div ref={tabsContainerRef} className="flex space-x-6 overflow-x-auto custom-scroll mt-4 pb-2 w-full touch-pan-x">
                                                {/* [修改] text-primary -> text-epb-primary, border-primary -> border-epb-primary */}
                                                {[{ id: 'context', label: t('tab_context') }, { id: 'process', label: t('tab_process') }, { id: 'solution', label: t('tab_solution') }, { id: 'climax', label: t('tab_climax') }].map(tab => (
                                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-epb-primary border-b-2 border-epb-primary pb-1' : 'text-gray-500 hover:text-white pb-1'}`}>{tab.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div ref={contentScrollRef} className="flex-1 p-6 lg:p-8 pb-24 scroll-content scrollable-area custom-scroll">
                                        {activeTab === 'context' && (
                                            <div className="space-y-12 animate-fadeIn">
                                                <div className="space-y-6"><h3 className="text-lg md:text-2xl font-bold text-white mb-4">{t('context_title')}</h3><p className="text-gray-300 text-sm leading-relaxed mb-4">{t('context_desc')}</p><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-white/5 rounded-xl border border-white/10"><div className="text-xs text-gray-500 uppercase mb-1">{t('role_title')}</div><div className="font-bold text-white">{t('role_name')}</div></div><div className="p-4 bg-white/5 rounded-xl border border-white/10"><div className="text-xs text-gray-500 uppercase mb-2">{t('tools')}</div><div className="flex flex-wrap gap-2"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-epb-primary/20 text-epb-primary border border-epb-primary/30"><Icons.XD /> <span className="ml-1">Adobe XD</span></span><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-epb-secondary/20 text-epb-secondary border border-epb-secondary/30"><Icons.AI /> <span className="ml-1">Illustrator</span></span></div></div></div></div>
                                                <div className="w-full h-px bg-white/10"></div>
                                                {/* [修改] bg-secondary -> bg-epb-secondary */}
                                                <div className="space-y-6">
                                                    <h3 className="text-lg md:text-2xl font-bold text-white mb-4 flex items-center"><span className="w-1 h-6 bg-epb-secondary rounded-full mr-3"></span>{t('conflict_title')}</h3>
                                                    {/* [修改] 插入新標題，取代原有的 grid */}
                                                    <div className="feature-card border border-white/10 p-5">
                                                        <h4 className="text-epb-secondary font-bold text-sm mb-3">{t('conflict_sub')}</h4>
                                                        <ul className="space-y-3 text-gray-300">
                                                            <li className="flex items-start text-sm"><span className="text-epb-secondary mr-3 mt-1"><i className="ph ph-x-circle"></i></span><div><strong className="text-white">{t('pain_1_title')}</strong><span className="block text-xs text-gray-500">{t('pain_1_desc')}</span></div></li>
                                                            <li className="flex items-start text-sm"><span className="text-epb-secondary mr-3 mt-1"><i className="ph ph-x-circle"></i></span><div><strong className="text-white">{t('pain_2_title')}</strong><span className="block text-xs text-gray-500">{t('pain_2_desc')}</span></div></li>
                                                            <li className="flex items-start text-sm"><span className="text-epb-secondary mr-3 mt-1"><i className="ph ph-x-circle"></i></span><div><strong className="text-white">{t('pain_3_title')}</strong><span className="block text-xs text-gray-500">{t('pain_3_desc')}</span></div></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {activeTab === 'process' && (
                                            <div className="space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-4">{t('process_title')}</h3><div className="relative pl-4 border-l border-white/10 space-y-8"><div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-epb-primary"></div><h4 className="text-sm font-bold text-epb-primary mb-1">{t('step_1_title')}</h4><p className="text-sm text-gray-300">{t('step_1_desc')}</p></div><div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-epb-dark border border-gray-600"></div><h4 className="text-sm font-bold text-white mb-1">{t('step_2_title')}</h4><p className="text-sm text-gray-300">{t('step_2_desc')}</p></div><div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-epb-dark border border-gray-600"></div><h4 className="text-sm font-bold text-white mb-1">{t('step_3_title')}</h4><p className="text-sm text-gray-300">{t('step_3_desc')}</p></div><div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-epb-secondary"></div><h4 className="text-sm font-bold text-epb-secondary mb-1">{t('step_4_title')}</h4><p className="text-sm text-gray-300">{t('step_4_desc')}</p></div></div></div>
                                        )}
                                        {activeTab === 'solution' && (
                                            <div className="space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-4">{t('sol_title')}</h3><div className="space-y-4">{solutionFeatures.map((sol) => { const IconComp = Icons[sol.icon]; return (
                                                /* [修改] border-primary -> border-epb-primary */
                                                <button key={sol.id} onClick={() => handleSolutionSwitch(sol)} className={`w-full text-left feature-card p-5 flex items-start space-x-4 transition-all group ${activeSolutionId === sol.id ? '!border-epb-primary bg-white/5 shadow-[0_0_15px_rgba(0,212,255,0.1)]' : 'border-white/5 hover:bg-white/5'}`}>
                                                    {/* [修改] bg-primary -> bg-epb-primary, text-primary -> text-epb-primary */}
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${activeSolutionId === sol.id ? 'bg-epb-primary text-white' : 'bg-white/10 text-epb-primary'}`}><IconComp /></div><div><h4 className={`font-bold text-sm mb-1 transition-colors ${activeSolutionId === sol.id ? 'text-epb-primary' : 'text-white'}`}>{sol.title}</h4><p className="text-xs text-gray-400 leading-relaxed">{sol.desc}<br /><br /><span className={`font-semibold ${activeSolutionId === sol.id ? 'text-white' : 'text-gray-500'}`}>{sol.benefit}</span></p></div></button>); })}</div></div>
                                        )}
                                        {activeTab === 'climax' && (
                                            /* [關鍵修正] 比照 P6/P7/P8 標準：1. 藍框 (!border-epb-primary) 2. 白字 (text-white) */
                                            <div className="space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-4">{t('gallery_title')}</h3><p className="text-gray-400 mb-6 text-sm">{t('gallery_desc')}</p><div className="grid gap-4">{galleryImages.map((img) => (<button key={img.id} onClick={() => handleGallerySwitch(img)} className={`text-left feature-card p-4 hover:bg-white/10 transition-colors group ${activeGalleryId === img.id ? '!border-epb-primary bg-white/5' : ''}`}><div className="flex justify-between items-center mb-2"><h4 className={`font-bold transition-colors text-sm ${activeGalleryId === img.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}><span className="text-epb-primary mr-2">{img.id}.</span>{img.name}</h4><i className={`ph ph-arrow-left transform transition-all ${activeGalleryId === img.id ? 'text-epb-primary -translate-x-1' : 'text-gray-600 group-hover:text-epb-primary group-hover:-translate-x-1'}`}></i></div><p className="text-xs text-gray-500 group-hover:text-gray-400">點擊預覽 {img.name} 介面細節。</p></button>))}</div></div>
                                        )}
                                        <div className="h-8"></div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </React.Fragment>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
