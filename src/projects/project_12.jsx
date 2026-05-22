import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import gsap from "gsap";
import ScrollToPlugin from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

const { Fragment } = React;

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
                    {!loaded && (<div className="absolute inset-0 skeleton rounded-lg z-10 flex items-center justify-center"> <i className="ph ph-image text-white/10 text-3xl"></i> </div>)}
                    <ResponsiveImage src={src} alt={alt} className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setLoaded(true)} onError={handleError} {...props} />
                </div>
            );
        };

        // --- Icons ---
        const Icons = {
            Figma: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" /><path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" /><path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" /><path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" /><path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" /></svg>,
            AI: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l-9 18h18L12 3z" /><circle cx="12" cy="13" r="2" /></svg>,
            Coin: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            Shield: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            Home: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
            Storm: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        };

        // --- TRANSLATIONS & DATA ---
        const TRANSLATIONS = {
            zh: {
                title_main: "中央存保", title_sub: "購得好房-理財教育網頁遊戲",
                hero_desc: "讓「買房」與「存款保險」觀念不再沈重，打造寓教於樂的互動體驗。",
                btn_explore: "探索設計旅程", back_home: "Back to Portfolio",
                tab_context: "01. 背景與痛點", tab_process: "02. 策略", tab_solution: "03. 特色", tab_climax: "04. 成果",

                context_title: "專案背景 Context",
                context_desc: "許多民眾對於「買房」與「存款保險」等議題感到遙遠或壓力大，傳統的文字宣導難以產生共鳴。我們的任務是打造一款 Web Game，透過直覺的機制降低學習門檻。",
                role_title: "My Role", role_name: "Visual / UI 設計師", tools: "Tools",
                conflict_title: "痛點與挑戰 The Conflict", conflict_sub: "傳統宣導的困境",
                pain_1_title: "議題沈重感", pain_1_desc: "理財話題容易引發民眾焦慮，導致資訊排斥。",
                pain_2_title: "法規生硬難懂", pain_2_desc: "存款保險條例等內容枯燥，難以長時間閱讀。",
                pain_3_title: "缺乏互動反饋", pain_3_desc: "單向的政令宣導缺乏「做中學」的機會。",

                process_title: "設計策略 Design Strategy", process_sub: "如何將嚴肅議題轉化為沈浸式體驗",
                step_1_title: "01. 視覺心理學", step_1_desc: "捨棄科技感，改用「莫蘭迪色系」繪製田園背景，營造「成家」的溫馨願景，降低焦慮。",
                step_2_title: "02. 符號具象化", step_2_desc: "利用高彩度的「金黃色」作為資產焦點，深黑色「炸彈」代表風險，直觀引導玩家操作。",
                step_3_title: "03. 隱喻危機", step_3_desc: "將抽象的金融風暴設計為「擬人化龍捲風」，讓資產流失的過程變得可見且緊迫。",
                step_4_title: "04. 知識防護", step_4_desc: "打破說教，將枯燥的條文轉化為「遊戲保命道具」，激發玩家主動學習的動機。",

                sol_title: "核心特色 Core Features",
                sol_1_title: "沈浸式溫馨視覺", sol_1_desc: "低飽和度背景與柔和色調，傳遞歲月靜好的氛圍，符合「安居樂業」的最終目標。", sol_1_label: "Mood:",
                sol_2_title: "隨機事件：金融風暴", sol_2_desc: "擬人化的龍捲風會捲走金幣，視覺化呈現市場波動與資產縮水，製造遊戲張力。", sol_2_label: "Event:",
                sol_3_title: "UI 轉換：冷靜與防護", sol_3_desc: "危機時介面轉為深藍色，暗示理性思考。答對問題即啟動防護，強化正確觀念的重要性。", sol_3_label: "Interaction:",

                gallery_title: "介面展示 Gallery", gallery_desc: "點擊下方卡片查看遊戲畫面細節。",
                gallery_hint: "點擊預覽設計細節。",
                img_1: "溫馨主視覺", img_2: "擬人化危機", img_3: "知識防護罩", img_4: "結局1", img_5: "結局2"
            },
            en: {
                title_main: "CDIC Golden House", title_sub: "Financial Education Web Game",
                hero_desc: "From heavy topics to fun interaction. A gamified experience that makes 'buying a home' and 'deposit insurance' accessible.",
                btn_explore: "Explore the Journey", back_home: "Back to Portfolio",
                tab_context: "01. Context", tab_process: "02. Strategy", tab_solution: "03. Features", tab_climax: "04. Gallery",

                context_title: "Project Overview",
                context_desc: "Financial topics like 'home buying' and 'deposit insurance' often feel distant or stressful to the public. Traditional text-based campaigns lack engagement. Our mission was to create a Web Game that lowers the learning barrier through intuitive mechanics.",
                role_title: "My Role", role_name: "Visual / UI Designer", tools: "Tools",
                conflict_title: "The Conflict", conflict_sub: "Challenges of traditional campaigns",
                pain_1_title: "Heavy Topics", pain_1_desc: "Financial topics can trigger anxiety, causing information avoidance.",
                pain_2_title: "Dry Content", pain_2_desc: "Regulations like deposit insurance acts are boring and hard to read.",
                pain_3_title: "Lack of Feedback", pain_3_desc: "One-way government announcements lack 'learning by doing' opportunities.",

                process_title: "Design Strategy", process_sub: "Transforming serious topics into immersive experiences",
                step_1_title: "01. Visual Psychology", step_1_desc: "Used Morandi colors and pastoral backgrounds to create a warm 'home' vision, reducing anxiety.",
                step_2_title: "02. Symbolism", step_2_desc: "Used high-saturation 'Gold' for assets and dark 'Bombs' for risks to intuitively guide player actions.",
                step_3_title: "03. Metaphor", step_3_desc: "Visualized abstract financial storms as 'personified tornadoes', making asset loss visible and urgent.",
                step_4_title: "04. Knowledge Defense", step_4_desc: "Turned boring clauses into 'game-saving items', motivating players to learn actively.",

                sol_title: "Core Features",
                sol_1_title: "Immersive Warm Visuals", sol_1_desc: "Low-saturation backgrounds and soft tones convey a peaceful atmosphere, aligning with the goal of 'living in peace'.", sol_1_label: "Mood:",
                sol_2_title: "Random Event: Financial Storm", sol_2_desc: "Personified tornadoes sweep away coins, visualizing market volatility and asset shrinkage to create tension.", sol_2_label: "Event:",
                sol_3_title: "UI Shift: Calm & Defense", sol_3_desc: "Interface turns deep blue during crises, suggesting rational thinking. Correct answers trigger defense shields.", sol_3_label: "Interaction:",

                gallery_title: "Interface Gallery", gallery_desc: "Click the cards below to view game details.",
                gallery_hint: "Click to preview details.",
                img_1: "Warm Key Visual", img_2: "Personified Crisis", img_3: "Knowledge Shield", img_4: "Ending 1", img_5: "Ending 2"
            }
        };

        const MAIN_IMAGE = './img/project_12/display.jpg';

        // --- Dynamic Data Helpers ---
        const getSolutionFeatures = (t) => [
            { id: 'sol-01', title: t('sol_1_title'), desc: t('sol_1_desc'), label: t('sol_1_label'), icon: 'Home', image: './img/project_12/接金幣-01遊戲畫面.jpg' },
            { id: 'sol-02', title: t('sol_2_title'), desc: t('sol_2_desc'), label: t('sol_2_label'), icon: 'Storm', image: './img/project_12/接金幣-09金融風暴.jpg' },
            { id: 'sol-03', title: t('sol_3_title'), desc: t('sol_3_desc'), label: t('sol_3_label'), icon: 'Shield', image: './img/project_12/接金幣-10金融風暴popup.jpg' }
        ];

        const getGalleryImages = (t) => [
            { id: '01', name: t('img_1'), src: './img/project_12/接金幣-01遊戲畫面.jpg' },
            { id: '02', name: t('img_2'), src: './img/project_12/接金幣-09金融風暴.jpg' },
            { id: '03', name: t('img_3'), src: './img/project_12/接金幣-10金融風暴popup.jpg' },
            { id: '04', name: t('img_4'), src: './img/project_12/接金幣-11結局01.jpg' },
            { id: '05', name: t('img_5'), src: './img/project_12/接金幣-13結局03.jpg' }
        ];

        const App = () => {
            const [lang, setLang] = useState('zh');
            const [loading, setLoading] = useState(true);
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

                const heroImagePromise = new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = './img/project_12/hero_img.jpg';
                    img.onload = () => resolve('hero loaded');
                    img.onerror = () => resolve('hero error');
                });
                const timerPromise = new Promise(resolve => setTimeout(resolve, 1000));
                Promise.all([heroImagePromise, timerPromise]).then(() => setLoading(false));
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
            }, [currentSectionIndex]);

            const goBack = () => { history.length > 1 ? history.back() : (location.href = '/'); };
            const handleGallerySwitch = (imgObj) => { setCurrentImage(imgObj.src); setActiveGalleryId(imgObj.id); };
            const handleSolutionSwitch = (solObj) => { setCurrentImage(solObj.image); setActiveSolutionId(solObj.id); };

            const showBrowserHeader = !['context', 'process'].includes(activeTab);

            return (
                <Fragment>
                    <div className={`loader ${loading ? '' : 'hidden'}`}><div className="loader-animation"></div></div>

                    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center pointer-events-none">
                        {/* [修改] bg-dark-lighter -> bg-gh-dark-lighter, border-primary -> border-gh-primary */}
                        <button onClick={goBack} className="back-btn pointer-events-auto flex items-center justify-center h-10 w-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-gray-300 hover:text-white hover:border-gh-primary/50 hover:bg-gh-dark-lighter transition-all duration-300 shadow-lg group overflow-hidden hover:w-40">
                            {/* [修改] text-primary -> text-gh-primary, group-hover:text-secondary -> group-hover:text-gh-secondary */}
                            <i className="ph ph-arrow-left text-gh-primary group-hover:text-gh-secondary flex-shrink-0"></i>
                            <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[200px] ml-0 group-hover:ml-2 transition-all duration-300 whitespace-nowrap overflow-hidden text-sm font-bold">{t('back_home')}</span>
                        </button>
                    </nav>

                    <button onClick={() => scrollToSection(0)} className={`fixed bottom-8 right-8 z-[100] w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-gh-primary hover:border-gh-primary hover:scale-110 transition-all duration-300 cursor-pointer ${showBackToHero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}><i className="ph ph-arrow-up"></i></button>

                    <div id="main-scroller" ref={mainContainerRef}>
                        {/* [修改] bg-dark -> bg-gh-dark */}
                        <section ref={heroRef} className="snap-section active-section flex items-center justify-center bg-gh-dark hero-bg-custom">
                            <div className="container max-w-7xl mx-auto px-8 z-20">
                                <div className="max-w-5xl text-left">
                                    {/* [修改] border-primary -> border-gh-primary, bg-primary -> bg-gh-primary, text-primary -> text-gh-primary */}
                                    <div className={`inline-block px-4 py-1 rounded-full border border-gh-primary/50 bg-gh-primary/20 text-gh-primary text-xs font-bold tracking-widest mb-6 ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.1s' }}>
                                        FINANCIAL EDUCATION GAME
                                    </div>
                                    <h1 className={`text-5xl lg:text-7xl font-black mb-8 leading-tight text-white drop-shadow-2xl text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.2s' }}>
                                        {lang === 'zh' ? (
                                            <Fragment>
                                                {t('title_main')}<br className="md:hidden" />
                                                <span className="font-heading text-gh-primary"> Golden House</span>
                                                <br />
                                                {t('title_sub')}
                                            </Fragment>
                                        ) : (
                                            <Fragment>
                                                <span className="font-heading">{t('title_main')}</span>
                                                <br className="md:hidden" />
                                                <span className="font-heading text-gh-primary">{t('title_sub')}</span>
                                            </Fragment>
                                        )}
                                    </h1>
                                    <h2 className={`text-xl md:text-2xl text-gray-300 font-light font-heading mb-12 max-w-7xl mr-auto leading-relaxed drop-shadow-md text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.3s' }}>
                                        {t('hero_desc')}
                                    </h2>
                                    {/* [修改] bg-primary -> bg-gh-primary */}
                                    <button
                                        onClick={() => scrollToSection(1)}
                                        className={`px-10 py-4 bg-gh-primary border border-gh-primary/50 rounded-full text-black font-bold text-lg hover:bg-white hover:text-gh-primary transition-all shadow-[0_10px_30px_rgba(234,196,53,0.4)] transform hover:-translate-y-1 ${loading ? 'opacity-0' : 'fade-in-up'}`}
                                        style={{ animationDelay: '0.4s' }}
                                    >
                                        {t('btn_explore')} <i className="ph ph-arrow-down ml-2 animate-bounce"></i>
                                    </button>
                                </div>
                            </div>
                        </section>


                        <section ref={splitRef} className="snap-section flex flex-col lg:flex-row bg-gh-dark overflow-hidden relative">
                            {/* Left Column: Image / Preview Area */}
                            <div className="w-full shrink-0 z-20 lg:w-3/5 lg:h-full bg-[#1a1a1a] flex items-center justify-center p-4 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 shadow-2xl relative" 
                                 style={{ height: window.innerWidth < 1024 ? '35vh' : '100%' }}>
                                
                                <div className="w-full h-full flex items-center justify-center">
                                    {/* Browser Frame Container */}
                                    {/* [關鍵修正] 使用 max-h-[90%] 與 h-full，強迫容器先佔位，不依賴圖片撐開 */}
                                    <div className="relative w-full max-w-full max-h-full lg:max-h-[90%] bg-gh-dark-light rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
                                        
                                        {/* Browser Header (Conditional) */}
                                        {showBrowserHeader && (
                                            <div className="h-8 bg-[#252525] border-b border-white/5 flex items-center px-4 space-x-2 shrink-0">
                                                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                                                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                                                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                                            </div>
                                        )}

                                        {/* Image Area */}
                                        {/* [關鍵修正] 這裡使用 flex-1 與 min-h-0 確保填滿剩餘空間 */}
                                        <div ref={imageScrollRef} className={`w-full flex-1 min-h-0 relative bg-white/5 group ${showBrowserHeader ? 'block' : 'flex items-center justify-center'}`}>
                                            <ImageWithSkeleton
                                                key={currentImage}
                                                src={currentImage}
                                                alt="Preview"
                                                // 確保圖片與 Skeleton 都是 100% 寬高
                                                containerClassName="w-full h-full flex items-center justify-center"
                                                className={`transition-opacity duration-500 block ${showBrowserHeader ? 'w-full h-full object-contain' : 'max-w-full max-h-full object-contain'}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Content Area (保持不變) */}
                            <div className="flex-1 w-full relative z-10 lg:w-2/5 lg:h-full flex flex-col h-auto min-h-0">
                                <div className="w-full h-full flex flex-col glass-panel relative min-h-0">

                                    <div className="sticky top-0 bg-gh-dark/95 backdrop-blur-xl z-30 border-b border-white/10 shrink-0">
                                        <div className="p-6 lg:p-8 pb-0 lg:pb-0">
                                            <div className="mb-2">
                                                <span className="font-heading text-white text-xl lg:text-3xl font-bold">{lang === 'zh' ? '中央存保' : 'CDIC'}</span>
                                                <span className="font-heading text-white text-xl lg:text-3xl font-bold"> Golden House</span>
                                                <br />
                                                <h2 className="text-xl lg:text-3xl font-bold font-heading text-white mb-1 leading-tight">{t('title_sub')}</h2>
                                            </div>
                                            <p className="text-gray-400 text-xs lg:text-sm mb-4">Financial Education Web Game</p>

                                            <div ref={tabsContainerRef} className="flex space-x-6 overflow-x-auto custom-scroll mt-4 pb-2 w-full touch-pan-x">
                                                {[{ id: 'context', label: t('tab_context') }, { id: 'process', label: t('tab_process') }, { id: 'solution', label: t('tab_solution') }, { id: 'climax', label: t('tab_climax') }].map(tab => (
                                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`text-sm font-bold whitespace-nowrap transition-colors pb-1 ${activeTab === tab.id ? 'text-gh-primary border-b-2 border-gh-primary' : 'text-gray-500 hover:text-white'}`}>{tab.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div ref={contentScrollRef} className="flex-1 p-6 lg:p-8 pb-24 overflow-y-auto custom-scroll scroll-content scrollable-area">
                                        {activeTab === 'context' && (
                                            <div className="space-y-12 animate-fadeIn">
                                                <div className="space-y-6"><h3 className="text-lg md:text-2xl font-bold font-heading text-white mb-4">{t('context_title')}</h3><p className="text-gray-300 text-sm leading-relaxed mb-4">{t('context_desc')}</p><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-white/5 rounded-xl border border-white/10"><div className="text-xs text-gray-500 uppercase mb-1">{t('role_title')}</div><div className="font-bold text-white">{t('role_name')}</div></div><div className="p-4 bg-white/5 rounded-xl border border-white/10"><div className="text-xs text-gray-500 uppercase mb-2">{t('tools')}</div><div className="flex flex-wrap gap-2"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gh-primary/20 text-gh-primary border border-gh-primary/30"><Icons.Figma /> <span className="ml-1">Figma</span></span><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gh-secondary/20 text-gh-secondary border border-gh-secondary/30"><Icons.AI /> <span className="ml-1">Illustrator</span></span></div></div></div></div><div className="w-full h-px bg-white/10"></div>
                                                <div className="space-y-6"><h3 className="text-lg md:text-2xl font-bold font-heading text-white mb-4 flex items-center"><span className="w-1 h-6 bg-gh-secondary rounded-full mr-3"></span>{t('conflict_title')}</h3><div className="feature-card border border-white/10 p-5"><h4 className="text-gh-secondary font-bold text-sm mb-3">{t('conflict_sub')}</h4><ul className="space-y-4 text-gray-300"><li className="flex items-start text-sm text-gray-400"><span className="text-red-400 mr-3 mt-1"><i className="ph ph-x"></i></span><div><strong className="text-gray-200 block text-sm">{t('pain_1_title')}</strong>{t('pain_1_desc')}</div></li><li className="flex items-start text-sm text-gray-400"><span className="text-red-400 mr-3 mt-1"><i className="ph ph-x"></i></span><div><strong className="text-gray-200 block text-sm">{t('pain_2_title')}</strong>{t('pain_2_desc')}</div></li><li className="flex items-start text-sm text-gray-400"><span className="text-red-400 mr-3 mt-1"><i className="ph ph-x"></i></span><div><strong className="text-gray-200 block text-sm">{t('pain_3_title')}</strong>{t('pain_3_desc')}</div></li></ul></div></div>
                                            </div>
                                        )}
                                        {activeTab === 'process' && (
                                            <div className="space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold font-heading text-white mb-2">{t('process_title')}</h3><p className="text-xs text-gray-400 mb-6">{t('process_sub')}</p><div className="relative pl-4 border-l border-white/10 space-y-8">
                                                <div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-gh-primary"></div><h4 className="text-sm font-bold text-gh-primary mb-1">{t('step_1_title')}</h4><p className="text-xs text-gray-400">{t('step_1_desc')}</p></div><div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-gh-dark border border-gray-600"></div><h4 className="text-sm font-bold text-gh-primary mb-1">{t('step_2_title')}</h4><p className="text-xs text-gray-400">{t('step_2_desc')}</p></div><div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-gh-dark border border-gray-600"></div><h4 className="text-sm font-bold text-gh-primary mb-1">{t('step_3_title')}</h4><p className="text-xs text-gray-400">{t('step_3_desc')}</p></div><div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-gh-primary shadow-[0_0_10px_rgba(234,196,53,0.5)]"></div><h4 className="text-sm font-bold text-white mb-1">{t('step_4_title')}</h4><p className="text-xs text-gray-400">{t('step_4_desc')}</p></div></div></div>
                                        )}
                                        {activeTab === 'solution' && (
                                            <div className="space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold font-heading text-white mb-6">{t('sol_title')}</h3><div className="space-y-4">{solutionFeatures.map((sol) => { const IconComp = Icons[sol.icon]; return (
                                                <button key={sol.id} onClick={() => handleSolutionSwitch(sol)} className={`w-full text-left feature-card border p-5 flex items-start space-x-4 transition-all group ${activeSolutionId === sol.id ? 'border-gh-primary bg-white/5 shadow-[0_0_15px_rgba(234,196,53,0.1)]' : 'border-white/5 hover:bg-white/5'}`}>
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${activeSolutionId === sol.id ? 'bg-gh-primary text-dark' : 'bg-gradient-to-br from-gh-primary/20 to-gh-primary/5 text-gh-primary'}`}><IconComp /></div><div><h4 className={`font-bold text-sm mb-1 transition-colors ${activeSolutionId === sol.id ? 'text-gh-primary' : 'text-white'}`}>{sol.title}</h4><p className="text-xs text-gray-400 leading-relaxed"><span className="text-white font-semibold">{sol.label}</span> {sol.desc}</p></div></button>); })}</div></div>
                                        )}
                                        {activeTab === 'climax' && (
                                            <div className="space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold font-heading text-white mb-4">{t('gallery_title')}</h3><p className="text-gray-400 mb-6 text-sm">{t('gallery_desc')}</p><div className="grid gap-4">{galleryImages.map((img) => (<button key={img.id} onClick={() => handleGallerySwitch(img)} className={`text-left feature-card border p-4 hover:bg-white/10 transition-colors group ${activeGalleryId === img.id ? '!border-gh-primary bg-white/5' : 'border-white/5'}`}><div className="flex justify-between items-center mb-2"><h4 className={`font-bold transition-colors text-sm ${activeGalleryId === img.id ? 'text-gh-primary' : 'text-gray-300 group-hover:text-white'}`}><span className="text-gh-primary mr-2">{img.id}.</span>{img.name}</h4><i className={`ph ph-arrow-left transform transition-all ${activeGalleryId === img.id ? 'text-gh-primary -translate-x-1' : 'text-gray-600 group-hover:text-gh-primary group-hover:-translate-x-1'}`}></i></div><p className="text-xs text-gray-500 group-hover:text-gray-400">{t('gallery_hint')}</p></button>))}</div></div>
                                        )}
                                        <div className="h-8"></div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </Fragment>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>

