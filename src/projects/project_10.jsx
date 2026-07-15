import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import gsap from 'gsap';
import ScrollToPlugin from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

// --- COMPONENTS ---
        const ResponsiveImage = ({ src, className, alt, style, onLoad, ...props }) => {
            if (!src) return null;
            const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            return (
                <picture style={{ display: 'contents' }}>
                    <source srcSet={encodeURI(webpSrc)} type="image/webp" />
                    <img src={src} className={className} alt={alt} style={style} onLoad={onLoad} {...props} />
                </picture>
            );
        };

        const loadedImageCache = new Set();

        const ImageWithSkeleton = ({ src, className, alt, containerClassName, ...props }) => {
            const [loaded, setLoaded] = useState(() => loadedImageCache.has(src));
            useEffect(() => { setLoaded(loadedImageCache.has(src)); }, [src]);
            const handleLoad = () => { loadedImageCache.add(src); setLoaded(true); };
            const handleError = () => { console.warn("Image load failed", src); setLoaded(true); };

            return (
                <div className={`relative ${containerClassName || 'w-full h-full'}`}>
                    {!loaded && (<div className="absolute inset-0 skeleton rounded-lg z-10 flex items-center justify-center pointer-events-none"> <i className="ph ph-image text-white/10 text-3xl"></i> </div>)}
                    <ResponsiveImage src={src} alt={alt} className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={handleLoad} onError={handleError} {...props} />
                </div>
            );
        };

        // Icons
        const Icons = {
            XD: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M8 8l4 8" /><path d="M12 8l-4 8" /></svg>,
            AI: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l-9 18h18L12 3z" /><circle cx="12" cy="13" r="2" /></svg>,
            Color: () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>,
            Map: () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" x2="9" y1="3" y2="18" /><line x1="15" x2="15" y1="6" y2="21" /></svg>,
            Layout: () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" x2="21" y1="9" y2="9" /><line x1="9" x2="9" y1="21" y2="9" /></svg>
        };

        // --- TRANSLATIONS ---
        const TRANSLATIONS = {
            zh: {
                loader_step1: "讀取專案中繼資料",
                loader_step2: "載入視覺素材",
                loader_step3: "建構渲染畫布",
                loader_step4: "初始化完成",
                title_main: "恆春航空站", title_sub: "網站設計提案",
                hero_desc: "從功能性到體驗感 —— 在嚴格的預算與法規限制下，重新定義公部門網站的視覺想像。",
                btn_explore: "探索設計旅程", back_home: "Back to Portfolio",
                tab_context: "01. 背景與痛點", tab_process: "02. 過程", tab_solution: "03. 方案", tab_climax: "04. 成果",

                context_title: "專案背景 Context",
                context_desc: "這是一個典型的政府公開招標案件：一是為了消化預算必須要更新網站，才能撥款到其他專案；二是希望能在有限資源下，擺脫傳統公家機關網站「生硬、冰冷」的刻板印象。",
                role_title: "My Role", role_name: "UI 設計師", tools: "Tools",
                challenge_title: "痛點與挑戰 The Challenge",
                pain_1_title: "資訊混亂", pain_1_desc: "資訊層級混亂，旅客難以直覺找到航班資訊。",
                pain_2_title: "缺乏特色", pain_2_desc: "視覺陳舊，無法傳遞恆春特有的度假氛圍。",
                pain_3_title: "維護困難", pain_3_desc: "後台操作複雜，業主希望「越簡單越好」。",

                process_title: "執行過程 The Process", process_sub: "從法規解構到視覺重塑的四個階段",
                step_1_title: "01. 需求解構", step_1_desc: "分析標案規格，將生硬法規轉化為可執行的 UI 元件。",
                step_2_title: "02. 情境定義", step_2_desc: "確立「海洋、藍天」核心，決定採用大面積去背影像與漸層。",
                step_3_title: "03. 模組化設計", step_3_desc: "建立標準化卡片系統 (Card System)，達成易維護目標。",
                step_4_title: "04. 視覺優化", step_4_desc: "重新梳理繁雜資訊並分門別類，讓不同需求的使用者能直覺獲取所需內容。",

                sol_title: "解決方案 The Solution",
                sol_1_title: "色彩心理學應用", sol_1_desc: "全站採用漸層藍 (#0072ce to #0099ff) 與留白，透過色彩喚起「體感記憶」，讓使用者在瀏覽時預先感受到南國的放鬆感。",
                sol_2_title: "情境式地圖導航", sol_2_desc: "將 Google Maps 轉化為向量繪製的半島地圖，結合真實景點攝影，創造「圖文整合」體驗，強化觀光樞紐定位。",
                sol_3_title: "彈性化資訊佈局", sol_3_desc: "在資訊呈現上明確劃分為「最新消息」與「機場資訊」兩大核心類別，分別對應即時公告與靜態導覽需求。",

                gallery_title: "介面展示 Gallery", gallery_desc: "點擊下方卡片查看高保真設計。",
                img_hero: "首頁 Hero Header", img_hero_desc: "展示「衝出畫框」的飛機動態視覺",
                img_map: "情境導覽地圖", img_map_desc: "中段的情境地圖，將帆船石與燈塔融入介面",
                img_list: "列表式排版", img_list_desc: "針對高密度資訊設計的整潔列表模式",
                scroll_hint: "上下滾動瀏覽完整畫面"
            },
            en: {
                loader_step1: "Reading project metadata",
                loader_step2: "Loading visual assets",
                loader_step3: "Constructing render canvas",
                loader_step4: "Initialization complete",
                title_main: "Hengchun Airport", title_sub: "Web Design Proposal",
                hero_desc: "From Function to Experience. Redefining public sector web design under strict budget and regulations.",
                btn_explore: "Explore the Journey", back_home: "Back to Portfolio",
                tab_context: "01. Context", tab_process: "02. Process", tab_solution: "03. Solution", tab_climax: "04. Gallery",

                context_title: "Project Overview",
                context_desc: "A typical government tender project: updating the website to utilize budget and shedding the 'stiff, cold' stereotype of public sector sites. The goal was to create a warm, engaging portal with limited resources.",
                role_title: "My Role", role_name: "UI Designer", tools: "Tools",
                challenge_title: "The Challenge",
                pain_1_title: "Information Chaos", pain_1_desc: "Hierarchy was messy; passengers struggled to find flight info.",
                pain_2_title: "Lack of Character", pain_2_desc: "Outdated visuals failed to convey Hengchun's holiday vibe.",
                pain_3_title: "Hard Maintenance", pain_3_desc: "Complex backend; client requested simplicity.",

                process_title: "The Process", process_sub: "Four stages from analysis to redesign",
                step_1_title: "01. Deconstruction", step_1_desc: "Analyzing specs to turn rigid regulations into actionable UI components.",
                step_2_title: "02. Context Definition", step_2_desc: "Establishing 'Ocean & Blue Sky' as the core visual theme.",
                step_3_title: "03. Modular Design", step_3_desc: "Building a standardized Card System for easy maintenance.",
                step_4_title: "04. Visual Optimization", step_4_desc: "Reorganizing complex info so users can find content intuitively.",

                sol_title: "The Solution",
                sol_1_title: "Color Psychology", sol_1_desc: "Using gradient blues and whitespace to evoke 'sensory memory' of a relaxing southern vacation.",
                sol_2_title: "Contextual Map", sol_2_desc: "Converting Google Maps into a custom vector map combined with real photos for a unified tourism experience.",
                sol_3_title: "Flexible Layout", sol_3_desc: "Clearly dividing content into 'News' (Dynamic) and 'Airport Info' (Static) for better navigation.",

                gallery_title: "Interface Gallery", gallery_desc: "Click the cards below to view high-fidelity designs.",
                img_hero: "Hero Header", img_hero_desc: "Dynamic visual of the plane 'breaking the frame'.",
                img_map: "Contextual Map", img_map_desc: "Mid-section map integrating local landmarks.",
                img_list: "List View Layout", img_list_desc: "Clean list mode for high-density information.",
                scroll_hint: "Scroll to view the full screen"
            }
        };

        // --- Dynamic Data Helpers ---
        // [修正] 加入 ID 與 Target 以供互動識別
        const getSolutionFeatures = (t) => [
            { id: 'sol-01', title: t('sol_1_title'), desc: t('sol_1_desc'), icon: 'Color', target: 'v15' },
            { id: 'sol-02', title: t('sol_2_title'), desc: t('sol_2_desc'), icon: 'Map', target: 'v15' },
            { id: 'sol-03', title: t('sol_3_title'), desc: t('sol_3_desc'), icon: 'Layout', target: 'v16' }
        ];

        const getGalleryItems = (t) => [
            { title: t('img_hero'), desc: t('img_hero_desc'), target: 'v15' },
            { title: t('img_map'), desc: t('img_map_desc'), target: 'v15' },
            { title: t('img_list'), desc: t('img_list_desc'), target: 'v16' }
        ];

        const App = () => {
            const [lang, setLang] = useState('zh');
            const [loading, setLoading] = useState(true);
            const [loaderStep, setLoaderStep] = useState(0);
            const [loaderDone, setLoaderDone] = useState(false);
            const [activeTab, setActiveTab] = useState('context');
            const [previewImage, setPreviewImage] = useState('v15');
            const [showBackToHero, setShowBackToHero] = useState(false);
            const [activeItemIndex, setActiveItemIndex] = useState(0); 
            // [修正] 新增 Solution 區塊的狀態
            const [activeSolutionId, setActiveSolutionId] = useState(null);

            // GSAP State
            const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
            const isScrollingRef = useRef(false);
            const mainContainerRef = useRef(null);
            const sectionsRef = useRef([]);
            const heroRef = useRef(null);
            const splitRef = useRef(null);

            // Scroll Refs
            const contentScrollRef = useRef(null);
            const touchStartRef = useRef({ x: 0, y: 0 });
            const TAB_ORDER = ['context', 'process', 'solution', 'climax'];
            const handleTabTouchStart = (e) => {
                if (e.target.closest('.overflow-x-auto')) { touchStartRef.current = null; return; }
                const t = e.touches[0];
                touchStartRef.current = { x: t.clientX, y: t.clientY };
            };
            const handleTabTouchEnd = (e) => {
                if (!touchStartRef.current) return;
                const t = e.changedTouches[0];
                const dx = t.clientX - touchStartRef.current.x;
                const dy = t.clientY - touchStartRef.current.y;
                touchStartRef.current = null;
                if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
                const idx = TAB_ORDER.indexOf(activeTab);
                if (dx < 0 && idx < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[idx + 1]);
                else if (dx > 0 && idx > 0) setActiveTab(TAB_ORDER[idx - 1]);
            };
            const imageScrollRef = useRef(null);
            const touchStartY = useRef(0);
            const tabsContainerRef = useRef(null);

            const t = (key) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) ? TRANSLATIONS[lang][key] : key;

            // Derived Data
            const solutionFeatures = getSolutionFeatures((k) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][k]) ? TRANSLATIONS[lang][k] : k);
            const galleryItems = getGalleryItems((k) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][k]) ? TRANSLATIONS[lang][k] : k);

            // Initialize
            useEffect(() => {
                const savedLang = localStorage.getItem('preferredLang');
                const initialLang = savedLang === 'en' ? 'en' : 'zh';
                setLang(initialLang);

                const preload = (src) => new Promise((resolve) => {
                    const img = new Image();
                    img.src = src;
                    if (img.complete) { resolve(); return; }
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                });
                const assetsPromise = Promise.all([
                    preload('./img/project_10/hero_img.webp'),
                    preload('./img/project_10/tw_index_lg_v15.jpg.webp'),
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

            useEffect(() => {
                sectionsRef.current = [heroRef.current, splitRef.current];
                if (sectionsRef.current[0]) sectionsRef.current[0].classList.add('active-section');
            }, [loading]);

            // Auto-scroll to top on tab change
            useEffect(() => {
                if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
                
                // [修正] 切換 Tab 時重置狀態
                if (activeTab === 'solution') {
                    setPreviewImage(solutionFeatures[0].target);
                    setActiveSolutionId(solutionFeatures[0].id);
                    setActiveItemIndex(null);
                } else if (activeTab === 'climax') {
                    setPreviewImage(galleryItems[0].target);
                    setActiveItemIndex(0);
                    setActiveSolutionId(null);
                }
            // galleryItems/solutionFeatures are derived fresh from `lang` every render,
            // not stored state, so listing them would make this effect run every render.
            // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [activeTab]);

            const handleGalleryClick = (target, index) => {
                setPreviewImage(target);
                setActiveItemIndex(index);
                setActiveSolutionId(null);
            };

            // [修正] Solution 點擊互動
            const handleSolutionSwitch = (sol) => {
                setPreviewImage(sol.target);
                setActiveSolutionId(sol.id);
                setActiveItemIndex(null);
            };

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
                        <button onClick={goBack} className="back-btn pointer-events-auto flex items-center justify-center h-10 w-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-gray-300 hover:text-white hover:border-hc-primary/50 hover:bg-hc-dark-lighter transition-all duration-300 shadow-lg group overflow-hidden hover:w-40">
                            <i className="ph ph-arrow-left text-hc-primary group-hover:text-hc-secondary flex-shrink-0"></i>
                            <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[200px] ml-0 group-hover:ml-2 transition-all duration-300 whitespace-nowrap overflow-hidden text-sm font-bold">{t('back_home')}</span>
                        </button>
                    </nav>

                    <button onClick={() => scrollToSection(0)} className={`fixed bottom-8 right-8 z-[100] w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-hc-primary hover:border-hc-primary hover:scale-110 transition-all duration-300 cursor-pointer ${showBackToHero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}><i className="ph ph-arrow-up"></i></button>

                    <div id="main-scroller" ref={mainContainerRef}>
                        <section id="hero-section" ref={heroRef} className="snap-section active-section flex items-center justify-center bg-black relative overflow-hidden hero-bg-custom">
                            <div className="container max-w-7xl mx-auto px-8 z-20">
                                <div className="max-w-5xl text-left">
                                    <div className={`inline-block px-4 py-1 rounded-full border border-hc-primary/50 bg-hc-primary/20 text-hc-primary text-xs font-bold tracking-widest mb-6 ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.1s' }}>AIRPORT WEBSITE DESIGN PROPOSAL</div>
                                    <h1 className={`text-5xl lg:text-7xl font-black mb-8 leading-tight text-white drop-shadow-2xl text-left font-heading ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.2s' }}>{t('title_main')}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-hc-primary to-white font-heading">{t('title_sub')}</span></h1>
                                    <h2 className={`text-xl md:text-2xl text-gray-300 font-light mb-12 max-w-2xl mr-auto leading-relaxed drop-shadow-md text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.3s' }}>{t('hero_desc')}</h2>
                                    <button onClick={() => scrollToSection(1)} className={`px-10 py-4 bg-hc-primary border border-hc-primary/50 rounded-full text-black font-bold text-lg hover:bg-white hover:text-hc-primary transition-all shadow-[0_10px_30px_rgba(0,212,255,0.4)] transform hover:-translate-y-1 ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.4s' }}>{t('btn_explore')} <i className="ph ph-arrow-down ml-2 animate-bounce"></i></button>
                                </div>
                            </div>
                        </section>

                        <section id="split-section" ref={splitRef} className="snap-section flex flex-col lg:flex-row bg-black overflow-hidden relative">
                            <div className="w-full shrink-0 z-20 lg:w-3/5 lg:h-full bg-[#050505] flex items-center justify-center p-4 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/10 shadow-2xl">
                                <div className="w-full h-[35vh] lg:h-full flex flex-col items-center justify-center">
                                    <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                                        <div className="relative w-full h-auto max-w-full max-h-full lg:max-h-[90%] bg-hc-dark-light rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-500">
                                            <div className="h-8 bg-[#252525] border-b border-white/5 flex items-center px-4 space-x-2 shrink-0"><div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div><div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div><div className="w-3 h-3 rounded-full bg-[#27C93F]"></div></div>
                                            <div ref={imageScrollRef} className="flex-1 min-h-0 overflow-y-auto custom-scroll relative bg-white/5 block">
                                                <ImageWithSkeleton src={previewImage === 'v15' ? "./img/project_10/tw_index_lg_v15.jpg.jpg" : "./img/project_10/tw_index_lg_v16.jpg.jpg"} alt="Website Preview" className="w-full h-auto block transition-opacity duration-500" containerClassName="w-full h-auto" />
                                            </div>
                                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-1 md:space-x-2 p-1 md:p-1.5 bg-black/80 backdrop-blur rounded-full border border-white/10 shadow-xl z-20">
                                                <button onClick={() => setPreviewImage('v16')} className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all whitespace-nowrap ${previewImage === 'v16' ? 'bg-hc-primary text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>News</button>
                                                <button onClick={() => setPreviewImage('v15')} className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all whitespace-nowrap ${previewImage === 'v15' ? 'bg-hc-primary text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Info</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center mt-2 text-xs text-gray-500 shrink-0"><i className="ph ph-arrows-down-up mr-2"></i>{t('scroll_hint')}</div>
                                </div>
                            </div>

                            <div className="flex-1 w-full relative z-10 lg:w-2/5 lg:h-full flex flex-col h-auto min-h-0">
                                <div className="w-full h-full flex flex-col content-panel relative min-h-0">
                                    <div className="sticky top-0 bg-black z-30 border-b border-white/10 shrink-0">
                                        <div className="p-4 lg:p-8 pb-0 lg:pb-0">
                                            <h2 className="text-xl lg:text-3xl font-bold font-heading text-white mb-1 leading-tight">{t('title_main')}<br />{t('title_sub')}</h2>
                                            <p className="text-gray-400 text-xs lg:text-sm mb-2 lg:mb-4">Hengchun Airport Web Design Proposal</p>
                                            <div ref={tabsContainerRef} className="flex space-x-6 overflow-x-auto custom-scroll mt-2 lg:mt-4 pb-2 w-full touch-pan-x">
                                                {[{ id: 'context', label: t('tab_context') }, { id: 'process', label: t('tab_process') }, { id: 'solution', label: t('tab_solution') }, { id: 'climax', label: t('tab_climax') }].map(tab => (
                                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`text-sm font-bold whitespace-nowrap transition-colors pb-1 ${activeTab === tab.id ? 'text-hc-primary border-b-2 border-hc-primary' : 'text-gray-500 hover:text-white'}`}>{tab.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div ref={contentScrollRef} onTouchStart={handleTabTouchStart} onTouchEnd={handleTabTouchEnd} className="flex-1 p-4 lg:p-8 pb-24 overflow-y-auto custom-scroll scroll-content scrollable-area">
                                        {activeTab === 'context' && (
                                            <div className="space-y-8 lg:space-y-12 animate-fadeIn">
                                                <div className="space-y-4 lg:space-y-6"><h3 className="text-lg md:text-2xl font-bold font-heading text-white mb-2 lg:mb-4">{t('context_title')}</h3><p className="text-gray-300 text-sm leading-relaxed mb-4">{t('context_desc')}</p><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-white/5 rounded-xl border border-white/10"><div className="text-xs text-gray-500 uppercase mb-1">{t('role_title')}</div><div className="font-bold text-white">{t('role_name')}</div></div><div className="p-4 bg-white/5 rounded-xl border border-white/10"><div className="text-xs text-gray-500 uppercase mb-2">{t('tools')}</div><div className="flex flex-wrap gap-2"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-hc-primary/20 text-hc-primary border border-hc-primary/30"><Icons.XD /> <span className="ml-1">Adobe XD</span></span><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-hc-secondary/20 text-hc-secondary border border-hc-secondary/30"><Icons.AI /> <span className="ml-1">Illustrator</span></span></div></div></div></div>
                                                <div className="w-full h-px bg-white/10"></div>
                                                <div className="space-y-6"><h3 className="text-lg md:text-2xl font-bold font-heading text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-hc-secondary rounded-full mr-3"></span>{t('challenge_title')}</h3><div className="feature-card border border-white/10 p-5"><ul className="space-y-4 text-gray-300"><li className="flex items-start text-sm text-gray-400"><span className="text-red-400 mr-3 mt-1">✕</span><div><strong className="text-gray-200 block text-sm">{t('pain_1_title')}</strong>{t('pain_1_desc')}</div></li><li className="flex items-start text-sm text-gray-400"><span className="text-red-400 mr-3 mt-1">✕</span><div><strong className="text-gray-200 block text-sm">{t('pain_2_title')}</strong>{t('pain_2_desc')}</div></li><li className="flex items-start text-sm text-gray-400"><span className="text-red-400 mr-3 mt-1">✕</span><div><strong className="text-gray-200 block text-sm">{t('pain_3_title')}</strong>{t('pain_3_desc')}</div></li></ul></div></div>
                                            </div>
                                        )}
                                        {activeTab === 'process' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold font-heading text-white mb-2">{t('process_title')}</h3><p className="text-xs text-gray-400 mb-6">{t('process_sub')}</p>
                                                <div className="relative pl-4 border-l border-white/10 space-y-8">
                                                    <div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-hc-primary"></div><h4 className="text-sm font-bold text-hc-primary mb-1">{t('step_1_title')}</h4><p className="text-xs text-gray-400">{t('step_1_desc')}</p></div>
                                                    <div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-black border border-gray-600"></div><h4 className="text-sm font-bold text-hc-primary mb-1">{t('step_2_title')}</h4><p className="text-xs text-gray-400">{t('step_2_desc')}</p></div>
                                                    <div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-black border border-gray-600"></div><h4 className="text-sm font-bold text-hc-primary mb-1">{t('step_3_title')}</h4><p className="text-xs text-gray-400">{t('step_3_desc')}</p></div>
                                                    <div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-hc-primary shadow-[0_0_10px_rgba(0,212,255,0.5)]"></div><h4 className="text-sm font-bold text-white mb-1">{t('step_4_title')}</h4><p className="text-xs text-gray-400">{t('step_4_desc')}</p></div>
                                                </div>
                                            </div>
                                        )}
                                        {activeTab === 'solution' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold font-heading text-white mb-2 lg:mb-6">{t('sol_title')}</h3>
                                                <div className="space-y-4">{solutionFeatures.map((item) => { const IconComp = Icons[item.icon]; return (
                                                    /* [修正] 加入 activeSolutionId 判斷，選中時變色 */
                                                    <button key={item.id} onClick={() => handleSolutionSwitch(item)} className={`w-full text-left feature-card border p-5 flex items-start space-x-4 transition-all group ${activeSolutionId === item.id ? 'border-hc-primary bg-white/10 shadow-[0_0_15px_rgba(0,212,255,0.1)]' : 'border-white/5 hover:bg-white/5'}`}>
                                                        {/* [修正] 選中時 Icon 背景實心，圖示變黑 */}
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${activeSolutionId === item.id ? 'bg-hc-primary text-hc-dark' : 'bg-gradient-to-br from-hc-primary/20 to-hc-primary/5 text-hc-primary'}`}><IconComp /></div>
                                                        <div><h4 className={`font-bold text-sm mb-1 transition-colors ${activeSolutionId === item.id ? 'text-hc-primary' : 'text-white'}`}>{item.title}</h4><p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p></div>
                                                    </button>
                                                ) })}</div>
                                            </div>
                                        )}
                                        {activeTab === 'climax' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold font-heading text-white mb-2 lg:mb-4">{t('gallery_title')}</h3><p className="text-gray-400 mb-6 text-sm">{t('gallery_desc')}</p>
                                                <div className="grid gap-4">{galleryItems.map((item, idx) => (
                                                    <button key={idx} onClick={() => handleGalleryClick(item.target, idx)} className={`text-left feature-card border p-4 hover:bg-white/10 transition-colors group ${activeItemIndex === idx ? '!border-hc-primary bg-white/5' : 'border-white/5 hover:bg-white/5'}`}>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className={`font-bold text-sm transition-colors ${activeItemIndex === idx ? 'text-hc-primary' : 'text-white group-hover:text-hc-primary'}`}>
                                                                <span className="text-hc-primary mr-2">0{idx + 1}.</span>{item.title}
                                                            </h4>
                                                            <i className={`ph ph-arrow-left text-gray-600 transform transition-all ${activeItemIndex === idx ? 'text-hc-primary' : 'group-hover:text-hc-primary group-hover:-translate-x-1'}`}></i>
                                                        </div>
                                                        <p className="text-xs text-gray-500 group-hover:text-gray-400">{item.desc}</p>
                                                    </button>
                                                ))}</div>
                                            </div>
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
