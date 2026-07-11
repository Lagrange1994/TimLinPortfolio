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
            const handleError = () => { console.warn("Image load failed", src); setLoaded(true); };

            return (
                <div className={`relative ${containerClassName || 'w-full h-full'}`}>
                    {!loaded && (<div className="absolute inset-0 bg-tmu-dark-lighter rounded-lg z-10 overflow-hidden flex items-center justify-center pointer-events-none"> <div className="absolute z-10 opacity-20"> <i className="ph ph-image text-white text-3xl"></i> </div> <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent z-20"></div> </div>)}
                    <ResponsiveImage src={src} alt={alt} className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setLoaded(true)} onError={handleError} {...props} />
                </div>
            );
        };

        // Icons
        const Icons = {
            Code: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
            Browser: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
            Chart: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
            Radar: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" /><circle cx="12" cy="12" r="3" /></svg>,
            Gap: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
            Efficiency: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
        };

        // --- TRANSLATIONS & DATA ---
        const TRANSLATIONS = {
            zh: {
                loader_step1: "讀取專案中繼資料",
                loader_step2: "載入視覺素材",
                loader_step3: "建構渲染畫布",
                loader_step4: "初始化完成",
                title_main: "台北醫學大學", title_sub: "臨床教育學習護照",
                hero_desc: "在舊有設備限制下，將繁瑣的成績表格轉化為視覺化儀表板，為醫學生打造看見成長軌跡的高效系統。",
                btn_explore: "探索設計旅程", back_home: "Back to Portfolio",
                tab_context: "01. 背景與痛點", tab_process: "02. 流程", tab_solution: "03. 方案", tab_climax: "04. 成果",

                context_title: "專案背景 Context",
                context_desc: "這是一個針對台北醫學大學醫學生臨床實習設計的電子學習歷程系統。我們的核心任務是將原本僅為純 HTML 文字列表的舊網頁，升級為一個具備視覺化圖表與決策輔助功能的現代化儀表板。",
                role_title: "My Role", role_name: "前端工程 / UI設計", tools: "Tech & Constraints",
                conflict_title: "痛點與挑戰 The Conflict", conflict_sub: "升級前的困境",
                pain_1_title: "資訊破碎 (Fragmentation)", pain_1_desc: "學生成績散落在密密麻麻的文字列表中，難以快速掌握缺少的學分或能力短版。",
                pain_2_title: "環境限制 (Legacy Constraints)", pain_2_desc: "醫院臨床工作站多為舊型電腦，無法支援高運算需求的現代 Web 3D 或複雜動畫。",
                pain_3_title: "缺乏洞察 (Lack of Insight)", pain_3_desc: "僅紀錄「分數」而未呈現「趨勢」，學生無法進行有效的自我反思與能力追蹤。",

                process_title: "執行過程 The Process", process_sub: "在技術限制中尋求最佳體驗的四個步驟",
                step_1_title: "01. 版面重構", step_1_desc: "捨棄華麗動態，改採清晰的區塊式架構，將資訊分為「教學活動」、「多元評核」與「能力表現」三大模組。",
                step_2_title: "02. 輕量化技術", step_2_desc: "選用相容舊版瀏覽器的輕量級 JavaScript 圖表庫，確保在低階硬體上也能流暢繪製圖表。",
                step_3_title: "03. 視覺轉化", step_3_desc: "將條列式數據轉化為「長條圖」（課程進度）與「雷達圖」（核心能力），讓數據產生意義。",
                step_4_title: "04. 反思設計", step_4_desc: "設計「雙色雷達圖」重疊自評與師評數據，透過視覺差異引導學生進行後設認知。",

                sol_title: "解決方案 The Solution",
                sol_1_title: "進度追蹤儀表板", sol_1_benefit: "Benefit: 利用長條圖區分一般與通識課程，學生登入即知「還缺什麼課」，無需人工核對。",
                sol_2_title: "EPA 能力雷達圖", sol_2_benefit: "Benefit: 落實能力導向教育 (CBME)，追蹤學生在特定醫療行為上的信任層級變化。",
                sol_3_title: "自我評估落差分析", sol_3_benefit: "Benefit: 直觀呈現「自評」與「師評」的分數落差，幫助學生看見盲點。",

                gallery_title: "成果展示 Result", gallery_desc: "從純文字到全方位成長地圖的轉變。",
                img_dashboard: "學習儀表板", img_dashboard_desc: "總覽課程完成度與核心指標。",
                img_assess: "多元評核表", img_assess_desc: "整合 Mini-CEX 與 DOPS 評分統計。",
                img_radar: "能力雷達圖", img_radar_desc: "視覺化呈現六大核心能力消長。",
                img_report: "完整總覽", img_report_desc: "支援行政所需的報表輸出功能。"
            },
            en: {
                loader_step1: "Reading project metadata",
                loader_step2: "Loading visual assets",
                loader_step3: "Constructing render canvas",
                loader_step4: "Initialization complete",
                title_main: "Taipei Medical Univ.", title_sub: "Clinical E-Portfolio",
                hero_desc: "Modernizing legacy systems. Transforming tedious grade tables into visual dashboards for medical students.",
                btn_explore: "Explore the Journey", back_home: "Back to Portfolio",
                tab_context: "01. Context", tab_process: "02. Process", tab_solution: "03. Solution", tab_climax: "04. Result",

                context_title: "Project Overview",
                context_desc: "An e-portfolio system designed for TMU medical students' clinical internships. Our core mission was to upgrade legacy HTML text lists into a modern dashboard with data visualization and decision support features.",
                role_title: "My Role", role_name: "Front-end Dev / UI Designer", tools: "Tech & Constraints",
                conflict_title: "The Conflict", conflict_sub: "Pain points before the upgrade",
                pain_1_title: "Fragmentation", pain_1_desc: "Grades were scattered in dense text lists, making it hard to track missing credits or weak points.",
                pain_2_title: "Legacy Constraints", pain_2_desc: "Hospital workstations are often outdated, unable to support modern Web 3D or complex animations.",
                pain_3_title: "Lack of Insight", pain_3_desc: "Only recorded 'scores' without 'trends', hindering effective self-reflection and capability tracking.",

                process_title: "The Process", process_sub: "Four steps to optimal experience within technical limits",
                step_1_title: "01. Restructuring", step_1_desc: "Discarded flashy animations for a clear block structure: 'Teaching Activities', 'Multi-Source Feedback', and 'Competency Performance'.",
                step_2_title: "02. Lightweight Tech", step_2_desc: "Selected lightweight JS chart libraries compatible with older browsers to ensure smooth rendering on low-end hardware.",
                step_3_title: "03. Visualization", step_3_desc: "Transformed list data into 'Bar Charts' (Course Progress) and 'Radar Charts' (Core Competencies) to make data meaningful.",
                step_4_title: "04. Reflection Design", step_4_desc: "Designed 'Dual-Color Radar Charts' to overlay self-assessment and teacher-assessment data, guiding students in metacognition.",

                sol_title: "The Solution",
                sol_1_title: "Progress Dashboard", sol_1_benefit: "Benefit: Bar charts separate general and core courses, letting students instantly know 'what's missing' without manual checking.",
                sol_2_title: "EPA Radar Chart", sol_2_benefit: "Benefit: Implementing Competency-Based Medical Education (CBME) to track trust levels in specific medical behaviors.",
                sol_3_title: "Self-Assessment Gap", sol_3_benefit: "Benefit: Intuitively displays the score gap between 'Self' and 'Teacher' assessments, helping students spot blind spots.",

                gallery_title: "Result Gallery", gallery_desc: "Transformation from plain text to a comprehensive growth map.",
                img_dashboard: "Learning Dashboard", img_dashboard_desc: "Overview of course completion and core metrics.",
                img_assess: "Multi-Source Assessment", img_assess_desc: "Integrating stats for Mini-CEX and DOPS.",
                img_radar: "Competency Radar", img_radar_desc: "Visualizing the growth of six core competencies.",
                img_report: "Full Overview", img_report_desc: "Supports report export functions for administration."
            }
        };

        const MAIN_IMAGE = './img/project_11/display.jpg';

        // --- Dynamic Data Helpers ---
        const getSolutionFeatures = (t) => [
            { id: 'sol-01', title: t('sol_1_title'), benefit: t('sol_1_benefit'), icon: 'Chart', image: './img/project_11/學習護照1_01.jpg' },
            { id: 'sol-02', title: t('sol_2_title'), benefit: t('sol_2_benefit'), icon: 'Radar', image: './img/project_11/學習護照2_01.jpg' },
            { id: 'sol-03', title: t('sol_3_title'), benefit: t('sol_3_benefit'), icon: 'Gap', image: './img/project_11/學習護照2_02.jpg' }
        ];

        const getGalleryImages = (t) => [
            { id: '01', name: t('img_dashboard'), src: './img/project_11/學習護照1_01.jpg', desc: t('img_dashboard_desc') },
            { id: '02', name: t('img_assess'), src: './img/project_11/學習護照2_02.jpg', desc: t('img_assess_desc') },
            { id: '03', name: t('img_radar'), src: './img/project_11/學習護照2_01.jpg', desc: t('img_radar_desc') },
            { id: '04', name: t('img_report'), src: './img/project_11/學習護照full.jpg', desc: t('img_report_desc') }
        ];

        const App = () => {
            const [lang, setLang] = useState('zh');
            const [loading, setLoading] = useState(true);
            const [loaderStep, setLoaderStep] = useState(0);
            const [loaderDone, setLoaderDone] = useState(false);
            const [activeTab, setActiveTab] = useState('context');
            const [currentImage, setCurrentImage] = useState(MAIN_IMAGE);
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
                    preload('./img/project_11/hero_img.jpg'),
                    preload(MAIN_IMAGE),
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

                switch (activeTab) {
                    case 'context':
                    case 'process':
                        setCurrentImage(MAIN_IMAGE);
                        setActiveGalleryId(null);
                        setActiveSolutionId(null);
                        break;
                    case 'solution':
                        // [保留修正] 預設選中第一個解決方案
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
                        setCurrentImage(MAIN_IMAGE);
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
                        {/* [修改] bg-dark-lighter -> bg-tmu-dark-lighter, border-primary -> border-tmu-primary */}
                        <button onClick={goBack} className="back-btn pointer-events-auto flex items-center justify-center h-10 w-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-gray-300 hover:text-white hover:border-tmu-primary/50 hover:bg-tmu-dark-lighter transition-all duration-300 shadow-lg group overflow-hidden hover:w-40">
                            {/* [修改] text-primary -> text-tmu-primary, group-hover:text-secondary -> group-hover:text-tmu-secondary */}
                            <i className="ph ph-arrow-left text-tmu-primary group-hover:text-tmu-secondary flex-shrink-0"></i>
                            <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[200px] ml-0 group-hover:ml-2 transition-all duration-300 whitespace-nowrap overflow-hidden text-sm font-bold">{t('back_home')}</span>
                        </button>
                    </nav>

                    <button onClick={() => scrollToSection(0)} className={`fixed bottom-8 right-8 z-[100] w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-tmu-primary hover:border-tmu-primary hover:scale-110 transition-all duration-300 cursor-pointer ${showBackToHero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}><i className="ph ph-arrow-up"></i></button>

                    <div id="main-scroller" ref={mainContainerRef}>
                        {/* [修改] bg-dark -> bg-tmu-dark */}
                        <section ref={heroRef} className="snap-section active-section flex items-center justify-center bg-tmu-dark hero-bg-custom">
                            <div className="container max-w-7xl mx-auto px-8 z-20">
                                <div className="max-w-5xl text-left">
                                    {/* [修正] 標籤改為白色 (border-white text-white) */}
                                    <div className={`inline-block px-4 py-1 rounded-full border border-white text-white text-xs font-bold tracking-widest mb-6 font-sans ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.1s' }}>SMART EDUCATION SYSTEM</div>
                                    {/* [修正] 標題文字改為 text-white，不使用漸層色 */}
                                    <h1 className={`text-5xl lg:text-7xl font-black mb-8 leading-tight text-white drop-shadow-2xl text-left font-heading ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.2s' }}>{t('title_main')}<br />{t('title_sub')}</h1>
                                    <h2 className={`text-xl md:text-2xl text-gray-300 font-light mb-12 max-w-2xl mr-auto leading-relaxed drop-shadow-md text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.3s' }}>{t('hero_desc')}</h2>
                                    {/* [修改] bg-primary -> bg-tmu-primary */}
                                    <button onClick={() => scrollToSection(1)} className={`px-10 py-4 bg-tmu-primary border border-tmu-primary/50 rounded-full text-white font-bold text-lg hover:bg-white hover:text-tmu-primary transition-all shadow-[0_10px_30px_rgba(43,108,176,0.4)] transform hover:-translate-y-1 ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.4s' }}>{t('btn_explore')} <i className="ph ph-arrow-down ml-2 animate-bounce"></i></button>
                                </div>
                            </div>
                        </section>

                        {/* [修改] bg-dark -> bg-tmu-dark */}
                        <section ref={splitRef} className="snap-section flex flex-col lg:flex-row bg-tmu-dark overflow-hidden">
                            {/* [修改] bg-[#1e293b] (保留原色碼) */}
                            <div className="w-full shrink-0 z-20 lg:w-3/5 lg:h-full bg-[#1e293b] flex items-center justify-center p-4 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 shadow-2xl">
                                <div className="w-full h-[35vh] lg:h-full flex items-center justify-center">
                                    {/* [修改] bg-dark-light -> bg-tmu-dark-light */}
                                    <div className={`relative transition-all duration-500 shadow-2xl rounded-xl border border-white/10 overflow-hidden flex flex-col ${showBrowserHeader ? 'w-full h-full max-w-full max-h-full lg:max-h-[90%] bg-tmu-dark-light' : 'w-auto h-auto max-w-full max-h-full lg:max-h-[90%] bg-transparent'}`}>
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
                                    {/* [修改] bg-dark/95 -> bg-tmu-dark/95 */}
                                    <div className="sticky top-0 bg-tmu-dark/95 backdrop-blur-xl z-30 border-b border-white/10 shrink-0">
                                        <div className="p-6 lg:p-8 pb-0 lg:pb-0">
                                            <h2 className="text-xl lg:text-3xl font-bold text-white font-heading mb-1 leading-tight">{t('title_main')}<br />{t('title_sub')}</h2>
                                            <p className="text-gray-400 text-xs lg:text-sm mb-4">Clinical Education E-Portfolio System</p>
                                            <div ref={tabsContainerRef} className="flex space-x-6 overflow-x-auto custom-scroll mt-4 pb-2 w-full touch-pan-x">
                                                {/* [修改] text-primary -> text-tmu-primary, border-primary -> border-tmu-primary */}
                                                {[{ id: 'context', label: t('tab_context') }, { id: 'process', label: t('tab_process') }, { id: 'solution', label: t('tab_solution') }, { id: 'climax', label: t('tab_climax') }].map(tab => (
                                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-tmu-primary border-b-2 border-tmu-primary pb-1' : 'text-gray-500 hover:text-white pb-1'}`}>{tab.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div ref={contentScrollRef} className="flex-1 p-6 lg:p-8 pb-24 scroll-content scrollable-area custom-scroll">
                                        {activeTab === 'context' && (
                                            <div className="space-y-12 animate-fadeIn">
                                                <div className="space-y-6"><h3 className="text-lg md:text-2xl font-bold text-white mb-4">{t('context_title')}</h3><p className="text-gray-300 text-sm leading-relaxed mb-4">{t('context_desc')}</p><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-white/5 rounded-xl border border-white/10"><div className="text-xs text-gray-500 uppercase mb-1">{t('role_title')}</div><div className="font-bold text-white">{t('role_name')}</div></div><div className="p-4 bg-white/5 rounded-xl border border-white/10"><div className="text-xs text-gray-500 uppercase mb-2">{t('tools')}</div><div className="flex flex-wrap gap-2"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-tmu-primary/20 text-tmu-primary border border-tmu-primary/30"><Icons.Code /> <span className="ml-1">HTML/JS</span></span><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-tmu-secondary/20 text-tmu-secondary border border-tmu-secondary/30"><Icons.Browser /> <span className="ml-1">Legacy Support</span></span></div></div></div></div>
                                                <div className="w-full h-px bg-white/10"></div>
                                                {/* [修改] bg-secondary -> bg-tmu-secondary */}
                                                <div className="space-y-6"><h3 className="text-lg md:text-2xl font-bold text-white mb-4 flex items-center"><span className="w-1 h-6 bg-tmu-secondary rounded-full mr-3"></span>{t('conflict_title')}</h3><div className="feature-card p-5 border-l-4 border-l-tmu-secondary"><h4 className="text-tmu-secondary font-bold text-sm mb-3">{t('conflict_sub')}</h4><ul className="space-y-4 text-gray-300"><li className="flex items-start text-sm text-gray-400"><span className="text-tmu-secondary mr-3 mt-1"><i className="ph ph-x-circle"></i></span><div><strong className="text-gray-200 block text-sm">{t('pain_1_title')}</strong>{t('pain_1_desc')}</div></li><li className="flex items-start text-sm text-gray-400"><span className="text-tmu-secondary mr-3 mt-1"><i className="ph ph-x-circle"></i></span><div><strong className="text-gray-200 block text-sm">{t('pain_2_title')}</strong>{t('pain_2_desc')}</div></li><li className="flex items-start text-sm text-gray-400"><span className="text-tmu-secondary mr-3 mt-1"><i className="ph ph-x-circle"></i></span><div><strong className="text-gray-200 block text-sm">{t('pain_3_title')}</strong>{t('pain_3_desc')}</div></li></ul></div></div>
                                            </div>
                                        )}
                                        {activeTab === 'process' && (
                                            <div className="space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-4">{t('process_title')}</h3><div className="relative pl-4 border-l border-white/10 space-y-8">
                                                {/* [修改] bg-primary -> bg-tmu-primary, text-primary -> text-tmu-primary, bg-dark -> bg-tmu-dark */}
                                                <div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-tmu-primary"></div><h4 className="text-sm font-bold text-tmu-primary mb-1">{t('step_1_title')}</h4><p className="text-xs text-gray-400">{t('step_1_desc')}</p></div><div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-tmu-dark border border-gray-600"></div><h4 className="text-sm font-bold text-tmu-primary mb-1">{t('step_2_title')}</h4><p className="text-xs text-gray-400">{t('step_2_desc')}</p></div><div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-tmu-dark border border-gray-600"></div><h4 className="text-sm font-bold text-tmu-primary mb-1">{t('step_3_title')}</h4><p className="text-xs text-gray-400">{t('step_3_desc')}</p></div><div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-tmu-primary shadow-[0_0_10px_rgba(43,108,176,0.5)]"></div><h4 className="text-sm font-bold text-white mb-1">{t('step_4_title')}</h4><p className="text-xs text-gray-400">{t('step_4_desc')}</p></div></div></div>
                                        )}
                                        {activeTab === 'solution' && (
                                            <div className="space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-6">{t('sol_title')}</h3><div className="space-y-4">{solutionFeatures.map((sol) => { const IconComp = Icons[sol.icon]; return (
                                                /* [修改] border-primary -> border-tmu-primary */
                                                <button key={sol.id} onClick={() => handleSolutionSwitch(sol)} className={`w-full text-left feature-card border p-5 flex items-start space-x-4 transition-all group ${activeSolutionId === sol.id ? '!border-tmu-primary bg-white/5 shadow-[0_0_15px_rgba(43,108,176,0.1)]' : 'border-white/5 hover:bg-white/5'}`}>
                                                    {/* [修改] bg-primary -> bg-tmu-primary, text-primary -> text-tmu-primary */}
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${activeSolutionId === sol.id ? 'bg-tmu-primary text-white' : 'bg-white/10 text-tmu-primary'}`}><IconComp /></div><div><h4 className={`font-bold text-sm mb-1 transition-colors ${activeSolutionId === sol.id ? 'text-tmu-primary' : 'text-white'}`}>{sol.title}</h4><p className="text-xs text-gray-400 leading-relaxed">{sol.benefit}</p></div></button>); })}</div></div>
                                        )}
                                        {activeTab === 'climax' && (
                                            /* [關鍵修正] 1. 藍框 (!border-tmu-primary) 2. 白字 (text-white) */
                                            <div className="space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-4">{t('gallery_title')}</h3><p className="text-gray-400 mb-6 text-sm">{t('gallery_desc')}</p><div className="grid gap-4">{galleryImages.map((img) => (<button key={img.id} onClick={() => handleGallerySwitch(img)} className={`text-left feature-card p-4 hover:bg-white/10 transition-colors group ${activeGalleryId === img.id ? '!border-tmu-primary bg-white/5' : ''}`}><div className="flex justify-between items-center mb-2"><h4 className={`font-bold transition-colors text-sm ${activeGalleryId === img.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}><span className="text-tmu-primary mr-2">{img.id}.</span>{img.name}</h4><i className={`ph ph-arrow-left transform transition-all ${activeGalleryId === img.id ? 'text-tmu-primary -translate-x-1' : 'text-gray-600 group-hover:text-tmu-primary group-hover:-translate-x-1'}`}></i></div><p className="text-xs text-gray-500 group-hover:text-gray-400">{img.desc}</p></button>))}</div></div>
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
