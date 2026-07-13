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

        const ImageWithSkeleton = ({ src, className, alt, containerClassName, ...props }) => {
            const [loaded, setLoaded] = useState(false);
            useEffect(() => { setLoaded(false); }, [src]);
            const handleLoad = () => setLoaded(true);
            const handleError = () => { console.warn("Image error:", src); setLoaded(true); };
            return (
                <div className={`relative overflow-hidden ${containerClassName || 'w-full h-full'}`}>
                    {!loaded && <div className="absolute inset-0 skeleton rounded-lg z-10 flex items-center justify-center"><i className="ph ph-image text-white/10 text-3xl"></i></div>}
                    <ResponsiveImage src={src} alt={alt} className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={handleLoad} onError={handleError} {...props} />
                </div>
            );
        };

        // --- ICONS ---
        const Icons = {
            XD: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M8 8l4 8" /><path d="M12 8l-4 8" /></svg>,
            AI: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l-9 18h18L12 3z" /><circle cx="12" cy="13" r="2" /></svg>,
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
                gallery_title: "頁面展示 Gallery", gallery_desc: "點擊下方卡片預覽各個申請頁面的最終設計成果。"
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
                gallery_title: "Gallery", gallery_desc: "Click the cards below to preview the final design of each application page."
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

            const goBack = () => { location.href = '/#portfolio'; };

            return (
                <React.Fragment>
                    <div className={`loader ${loading ? '' : 'hidden'}`}><div className="loader-animation"></div><p className="loader-text">{loaderDone ? t('loader_step4') : t(`loader_step${loaderStep + 1}`)}</p></div>

                    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center pointer-events-none">
                        {/* [修改] bg-dark-lighter -> bg-sm-dark-lighter, border-primary -> border-sm-primary */}
                        <button onClick={goBack} className="back-btn pointer-events-auto flex items-center justify-center h-10 w-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-gray-300 hover:text-white hover:border-sm-primary/50 hover:bg-sm-dark-lighter transition-all duration-300 shadow-lg group overflow-hidden hover:w-40">
                            {/* [修改] text-primary -> text-sm-primary, group-hover:text-secondary -> group-hover:text-sm-secondary */}
                            <i className="ph ph-arrow-left text-sm-primary group-hover:text-sm-secondary flex-shrink-0"></i>
                            <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[200px] ml-0 group-hover:ml-2 transition-all duration-300 whitespace-nowrap overflow-hidden text-sm font-bold">{t('back_home')}</span>
                        </button>
                    </nav>

                    <button onClick={() => scrollToSection(0)} className={`fixed bottom-8 right-8 z-[100] w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-sm-primary hover:border-sm-primary hover:scale-110 transition-all duration-300 cursor-pointer ${showBackToHero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}><i className="ph ph-arrow-up"></i></button>

                    <div id="main-scroller" ref={mainContainerRef}>
                        {/* [修改] bg-dark -> bg-sm-dark */}
                        <section id="hero" ref={heroRef} className="snap-section active-section flex items-center justify-center bg-sm-dark hero-bg-custom">
                            <div className="container max-w-7xl mx-auto px-8 z-20">
                                <div className="max-w-5xl text-left">
                                    <div className={`inline-block px-4 py-1 rounded-full border border-white text-white text-xs font-bold tracking-widest mb-6 font-sans ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.1s' }}>GOV. DIGITAL TRANSFORMATION</div>
                                    <h1 className={`text-5xl lg:text-7xl font-black mb-8 leading-tight text-white drop-shadow-2xl text-left font-heading ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.2s' }}>{t('title_main')}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-sm-accent to-white font-heading">{t('title_sub')}</span></h1>
                                    <h2 className={`text-xl md:text-2xl text-gray-300 font-light mb-12 max-w-2xl mr-auto leading-relaxed drop-shadow-md text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.3s' }}>{t('hero_desc')}</h2>
                                    {/* [修改] bg-primary -> bg-sm-primary */}
                                    <button onClick={() => scrollToSection(1)} className={`px-10 py-4 bg-sm-primary border border-sm-primary/50 rounded-full text-white font-bold text-lg hover:bg-white hover:text-sm-primary transition-all shadow-[0_10px_30px_rgba(0,160,233,0.4)] transform hover:-translate-y-1 ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.4s' }}>{t('btn_explore')} <i className="ph ph-arrow-down ml-2 animate-bounce"></i></button>
                                </div>
                            </div>
                        </section>

                        {/* [修改] bg-dark -> bg-sm-dark */}
                        <section id="split-view" ref={splitRef} className="snap-section flex flex-col lg:flex-row bg-sm-dark overflow-hidden">
                            {/* [修改] bg-[#1e293b] (保留原色碼) */}
                            <div className="w-full shrink-0 z-20 lg:w-3/5 lg:h-full bg-[#1e293b] flex items-center justify-center p-4 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 shadow-2xl">
                                <div className="w-full h-[35vh] lg:h-full flex items-center justify-center">
                                    {/* [修改] bg-dark-light -> bg-sm-dark-light */}
                                    <div className={`relative transition-all duration-500 shadow-2xl rounded-xl border border-white/10 overflow-hidden flex flex-col ${['highlights', 'gallery'].includes(activeTab) ? 'w-full h-full max-w-full max-h-full lg:max-h-[90%] bg-sm-dark-light' : 'w-auto h-auto max-w-full max-h-full lg:max-h-[90%] bg-transparent'}`}>
                                        {['highlights', 'gallery'].includes(activeTab) && (
                                            <div className="h-8 bg-[#334155] border-b border-white/5 flex items-center px-4 space-x-2 shrink-0">
                                                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div><div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div><div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                                            </div>
                                        )}
                                        <div ref={imageScrollRef} className={`relative w-full h-full scrollable-area ${['highlights', 'gallery'].includes(activeTab) ? 'flex-1 min-h-0 block bg-white/5' : 'overflow-hidden flex items-center justify-center h-full'}`}>
                                            <ImageWithSkeleton src={currentImage} alt="Preview" className={`transition-all duration-500 block ${['highlights', 'gallery'].includes(activeTab) ? 'w-full h-auto' : 'max-w-full max-h-full object-contain'}`} containerClassName={['highlights', 'gallery'].includes(activeTab) ? 'w-full h-auto' : 'w-full h-full flex items-center justify-center'} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 w-full relative z-10 lg:w-2/5 lg:h-full flex flex-col h-auto min-h-0">
                                <div className="w-full h-full flex flex-col glass-panel relative min-h-0">
                                    {/* [修改] bg-dark/95 -> bg-sm-dark/95 */}
                                    <div className="sticky top-0 bg-sm-dark/95 backdrop-blur-xl z-30 border-b border-white/10 shrink-0">
                                        <div className="p-6 lg:p-8 pb-0 lg:pb-0">
                                            <h2 className="text-xl lg:text-3xl font-bold text-white font-heading mb-1 leading-tight">{t('title_main')}<br />{t('title_sub')}</h2>
                                            <p className="text-gray-400 text-xs lg:text-sm mb-4">UI/UX Design Audit Report</p>

                                            <div ref={tabsContainerRef} className="flex space-x-6 overflow-x-auto custom-scroll mt-4 pb-2 w-full touch-pan-x">
                                                {/* [修改] text-primary -> text-sm-primary, border-primary -> border-sm-primary */}
                                                {[{ id: 'request', label: t('tab_request') }, { id: 'process', label: t('tab_process') }, { id: 'highlights', label: t('tab_highlights') }, { id: 'gallery', label: t('tab_gallery') }].map(tab => (
                                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-sm-primary border-b-2 border-sm-primary pb-1' : 'text-gray-500 hover:text-white pb-1'}`}>{tab.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div ref={contentScrollRef} className="flex-1 p-6 lg:p-8 pb-24 scroll-content scrollable-area custom-scroll">
                                        {activeTab === 'request' && (
                                            <div className="space-y-12 animate-fadeIn">
                                                <div className="space-y-6"><h3 className="text-lg md:text-2xl font-bold text-white mb-4">{t('request_title')}</h3><p className="text-gray-300 text-sm leading-relaxed mb-4">{t('request_desc')}</p><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-white/5 rounded-xl border border-white/10"><div className="text-xs text-gray-500 uppercase mb-1">{t('role_title')}</div><div className="font-bold text-white">{t('role_name')}</div></div><div className="p-4 bg-white/5 rounded-xl border border-white/10"><div className="text-xs text-gray-500 uppercase mb-2">{t('tools')}</div><div className="flex flex-wrap gap-2"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sm-primary/20 text-sm-primary border border-sm-primary/30"><Icons.XD /> <span className="ml-1">Adobe XD</span></span><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sm-secondary/20 text-sm-secondary border border-sm-secondary/30"><Icons.AI /> <span className="ml-1">Illustrator</span></span></div></div></div><div className="grid grid-cols-1 gap-4"><div className="feature-card p-5"><h4 className="text-sm-secondary font-bold text-sm mb-3">{t('list_title')}</h4><ul className="space-y-3 text-gray-300"><li className="flex items-start text-sm"><span className="text-sm-primary mr-3 mt-1"><i className="ph ph-check-circle"></i></span><div><strong className="text-white">{t('req_1_title')}</strong><span className="block text-xs text-gray-500">{t('req_1_desc')}</span></div></li><li className="flex items-start text-sm"><span className="text-sm-primary mr-3 mt-1"><i className="ph ph-check-circle"></i></span><div><strong className="text-white">{t('req_2_title')}</strong><span className="block text-xs text-gray-500">{t('req_2_desc')}</span></div></li><li className="flex items-start text-sm"><span className="text-sm-primary mr-3 mt-1"><i className="ph ph-check-circle"></i></span><div><strong className="text-white">{t('req_3_title')}</strong><span className="block text-xs text-gray-500">{t('req_3_desc')}</span></div></li></ul></div></div></div></div>
                                        )}
                                        {activeTab === 'process' && (
                                            <div className="space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-4">{t('process_title')}</h3><div className="relative pl-4 border-l border-white/10 space-y-8"><div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-sm-primary"></div><h4 className="text-sm font-bold text-sm-primary mb-1">{t('step_1_title')}</h4><p className="text-sm text-gray-300">{t('step_1_desc')}</p></div><div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-sm-dark border border-gray-600"></div><h4 className="text-sm font-bold text-white mb-1">{t('step_2_title')}</h4><p className="text-sm text-gray-300">{t('step_2_desc')}</p></div><div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-sm-dark border border-gray-600"></div><h4 className="text-sm font-bold text-white mb-1">{t('step_3_title')}</h4><p className="text-sm text-gray-300">{t('step_3_desc')}</p></div><div className="relative"><div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-sm-secondary"></div><h4 className="text-sm font-bold text-sm-secondary mb-1">{t('step_4_title')}</h4><p className="text-sm text-gray-300">{t('step_4_desc')}</p></div></div></div>
                                        )}
                                        {activeTab === 'highlights' && (
                                            <div className="space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-4">{t('highlights_title')}</h3><div className="space-y-4">{features.map((feat) => { const IconComp = Icons[feat.icon]; return (
                                                /* [修改] border-primary -> border-sm-primary */
                                                <button key={feat.id} onClick={() => handleFeatureSwitch(feat)} className={`w-full text-left feature-card border p-5 flex items-start space-x-4 transition-all group ${activeFeatureId === feat.id ? '!border-sm-primary bg-white/5 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-white/5 hover:bg-white/5'}`}>
                                                    {/* [修改] bg-primary -> bg-sm-primary, text-primary -> text-sm-primary */}
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${activeFeatureId === feat.id ? 'bg-sm-primary text-white' : 'bg-white/10 text-sm-primary'}`}><IconComp /></div><div><h4 className={`font-bold text-sm mb-1 transition-colors ${activeFeatureId === feat.id ? 'text-sm-primary' : 'text-white'}`}>{feat.title}</h4><p className="text-xs text-gray-400 leading-relaxed">{feat.desc}<br /><br /><span className={`font-semibold ${activeFeatureId === feat.id ? 'text-white' : 'text-gray-500'}`}>{feat.note}</span></p></div></button>); })}</div></div>
                                        )}
                                        {activeTab === 'gallery' && (
                                            /* [關鍵修正] 1. 外框: !border-sm-primary (藍色) 2. 標題: text-white (白色) */
                                            <div className="space-y-8 animate-fadeIn"><h3 className="text-lg md:text-2xl font-bold text-white mb-4">{t('gallery_title')}</h3><p className="text-gray-400 mb-6 text-sm">{t('gallery_desc')}</p><div className="grid gap-4">{gallery.map((img) => (<button key={img.id} onClick={() => handleGallerySwitch(img)} className={`text-left feature-card p-4 hover:bg-white/10 transition-colors group ${activeGalleryId === img.id ? '!border-sm-primary bg-white/5' : ''}`}><div className="flex justify-between items-center mb-2"><h4 className={`font-bold transition-colors text-sm ${activeGalleryId === img.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}><span className="text-sm-primary mr-2">{img.id}.</span>{img.name}</h4><i className={`ph ph-eye transform transition-all ${activeGalleryId === img.id ? 'text-sm-primary' : 'text-gray-600 group-hover:text-sm-primary'}`}></i></div><p className="text-xs text-gray-500 group-hover:text-gray-400">{img.desc}</p></button>))}</div></div>
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
