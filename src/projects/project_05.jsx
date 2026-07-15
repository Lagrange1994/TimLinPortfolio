import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import gsap from 'gsap';
import ScrollToPlugin from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

// --- COMPONENTS ---

        const loadedImageCache = new Set();

        const ImageWithSkeleton = ({ src, className, alt, containerClassName, objectFit }) => {
            const [loaded, setLoaded] = useState(() => loadedImageCache.has(src));
            const fitClass = objectFit || "object-contain";
            useEffect(() => { setLoaded(loadedImageCache.has(src)); }, [src]);
            const handleLoad = () => { loadedImageCache.add(src); setLoaded(true); };
            const handleError = () => { console.warn("Image error:", src); setLoaded(true); };
            return (
                <div className={`relative overflow-hidden ${containerClassName || 'w-full h-full'}`}>
                    {!loaded && <div className="absolute inset-0 skeleton z-10 flex items-center justify-center"><i className="ph ph-image text-white/10 text-3xl"></i></div>}
                    <picture style={{ display: 'contents' }}>
                        <source srcSet={encodeURI(src.replace(/\.(jpg|jpeg|png)$/i, '.webp'))} type="image/webp" />
                        <img src={src} alt={alt} className={`${className || ''} ${fitClass} w-full h-full transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={handleLoad} onError={handleError} />
                    </picture>
                </div>
            );
        };

        const WebFrame = ({ src }) => (
            <div className="w-full h-full flex items-center justify-center pointer-events-none p-4 lg:p-12">
                <div className="relative z-10 w-full h-auto max-w-full max-h-[90vh] bg-dark-light rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 pointer-events-auto">
                    <div className="h-8 bg-[#252525] border-b border-white/5 flex items-center px-4 space-x-2 shrink-0">
                        <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div><div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div><div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                    </div>
                    <div className="w-full h-full bg-white/5 flex items-center justify-center overflow-hidden relative group">
                        <ImageWithSkeleton src={src} alt="Web View" objectFit="object-contain" />
                    </div>
                </div>
            </div>
        );

        const SimpleRoundedFrame = ({ src }) => (
            <div className="w-full h-full flex items-center justify-center pointer-events-none p-4 lg:p-12">
                <div className="relative z-10 w-full h-auto max-w-full max-h-[90vh] bg-dark-light rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 pointer-events-auto">
                    <div className="w-full h-full bg-white/5 flex items-center justify-center overflow-hidden relative group">
                        <ImageWithSkeleton src={src} alt="Context View" objectFit="object-contain" />
                    </div>
                </div>
            </div>
        );

        const AppRawFrame = ({ src }) => (
            <div className="flex items-center justify-center w-full h-full p-4 lg:p-8 pointer-events-none">
                <div className="relative h-full w-auto max-w-full bg-transparent animate-fadeIn shrink-0 pointer-events-auto flex justify-center">
                    <ImageWithSkeleton src={src} alt="App View" objectFit="object-contain" />
                </div>
            </div>
        );

        // --- DATA ---
        const TRANSLATIONS = {
            zh: {
                loader_step1: "讀取專案中繼資料",
                loader_step2: "載入視覺素材",
                loader_step3: "建構渲染畫布",
                loader_step4: "初始化完成",
                title_main: "新竹市動物園", title_sub: "內部管理與行動應變系統",
                hero_desc: "從辦公室的「數據司令部」到現場的「行動先鋒」，打造全方位的智慧園區管理體驗。",
                btn_explore: "探索設計旅程", back_home: "Back to Portfolio",
                tab_context: "01. 背景", tab_web: "02. 網頁後台", tab_app: "03. 行動APP", tab_climax: "04. 介面總覽",
                context_title: "專案背景 Context", context_desc: "這是一個專為新竹市動物園內部員工與志工設計的整合管理系統。目標是將龐大的園區營運數據（動物照護、志工排班、人流安全）進行高效整合，並延伸至行動端以應對現場突發狀況。",
                role_title: "My Role", role_name: "UI 設計師",
                pain_title: "管理痛點 Pain Points", pain_sub: "轉型前的困境",
                pain_1_title: "決策受限", pain_1_desc: "管理者必須回到後台電腦才能查看數據，無法現場調度。",
                pain_2_title: "反應過慢", pain_2_desc: "通報流程繁瑣，延誤黃金處理時間。",
                pain_3_title: "資訊斷層", pain_3_desc: "志工無法快速查閱正確資訊。",
                web_title: "網頁後台 (Desktop)", web_summary: "決策與分析司令部",
                web_core: "核心功能 Core Features",
                web_p1: "全盤數據：人流長期趨勢分析、歷史報表。",
                web_p2: "深度管理：排班管理、知識庫建檔、系統設定。",
                web_p3: "適用情境：辦公室內的行政作業與策略規劃。",
                app_title: "手機 APP (Mobile)", app_summary: "現場執行與應變先鋒",
                app_core: "行動亮點 Mobile Highlights",
                app_p1: "即時資訊：現場人流熱區圖 (Heatmap)、當日活動。",
                app_p2: "緊急應變：專屬緊急協助按鈕 (長按3秒)。",
                app_p3: "適用情境：巡邏、現場導覽、突發狀況處理。",
                gallery_title: "介面總覽 Gallery", gallery_desc: "完整系統介面展示"
            },
            en: {
                loader_step1: "Reading project metadata",
                loader_step2: "Loading visual assets",
                loader_step3: "Constructing render canvas",
                loader_step4: "Initialization complete",
                title_main: "Hsinchu Zoo", title_sub: "Management & Response System",
                hero_desc: "From the office 'Command Center' to the frontline 'Mobile Pioneer'.",
                btn_explore: "Explore the Journey", back_home: "Back to Portfolio",
                tab_context: "01. Context", tab_web: "02. Web System", tab_app: "03. Mobile App", tab_climax: "04. Gallery",
                context_title: "Context", context_desc: "An integrated management system for Hsinchu Zoo staff, integrating operational data and extending to mobile.",
                role_title: "My Role", role_name: "UI Designer",
                pain_title: "Pain Points", pain_sub: "Before Transformation",
                pain_1_title: "Office-Bound", pain_1_desc: "Managers must return to office PC to view data.",
                pain_2_title: "Slow Response", pain_2_desc: "Cumbersome reporting processes delay response.",
                pain_3_title: "Info Gap", pain_3_desc: "Volunteers cannot quickly access info.",
                web_title: "Web Dashboard", web_summary: "Decision HQ",
                web_core: "Core Features",
                web_p1: "Full Data: Long-term traffic trends.",
                web_p2: "Deep Mgmt: Scheduling, knowledge base.",
                web_p3: "Scenario: Admin tasks and planning.",
                app_title: "Mobile App", app_summary: "Field Execution",
                app_core: "Mobile Highlights",
                app_p1: "Real-time: Heatmaps, daily events.",
                app_p2: "Emergency: SOS button (Long press 3s).",
                app_p3: "Scenario: Patrol, on-site guidance.",
                gallery_title: "Gallery", gallery_desc: "Complete Interface Showcase"
            }
        };

        const Icons = {
            Figma: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2H8.5C6.57 2 5 3.57 5 5.5C5 7.43 6.57 9 8.5 9H12V2Z" /><path d="M12 9H8.5C6.57 9 5 10.57 5 12.5C5 14.43 6.57 16 8.5 16H12V9Z" /><path d="M12 16H8.5C6.57 16 5 17.57 5 19.5C5 21.43 6.57 23 8.5 23C10.43 23 12 21.43 12 19.5V16Z" /><path d="M12 2H15.5C17.43 2 19 3.57 19 5.5C19 7.43 17.43 9 15.5 9H12V2Z" /><circle cx="15.5" cy="12.5" r="3.5" /></svg>,
            Illustrator: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 4H4V20H20V4Z" /><path d="M8 16L11 8L14 16" /><path d="M8.5 14H13.5" /><circle cx="17" cy="15" r="1" /></svg>,
            Chart: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
            Mobile: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
            Alert: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
            Map: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
            Calendar: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
            Camera: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
        };

        const getWebFeatures = (lang) => {
            const isZh = lang === 'zh';
            return [
                { id: 'w1', title: isZh ? '全方位數據儀表板' : 'Dashboard', desc: isZh ? '整合人流與事件' : 'Traffic & Events', icon: 'Chart', image: './img/project_05/web_01_dashboard.jpg', benefit: 'primary' },
                { id: 'w2', title: isZh ? '智慧排班與維護' : 'Smart Scheduling', desc: isZh ? '志工排班與維護' : 'Shifts & Maintenance', icon: 'Calendar', image: './img/project_05/web_02_schedule.jpg', benefit: 'blue-400' },
                { id: 'w3', title: isZh ? '即時監控' : 'Monitor', desc: isZh ? '影像與熱區' : 'Video & Heatmap', icon: 'Camera', image: './img/project_05/web_03_cctv.jpg', benefit: 'purple-400' }
            ];
        };

        const getAppFeatures = (lang) => {
            const isZh = lang === 'zh';
            return [
                { id: 'a1', title: isZh ? '緊急協助通報' : 'SOS Report', desc: isZh ? '長按3秒通報' : 'Long press SOS', icon: 'Alert', image: './img/project_05/app_04_sos.jpg', benefit: 'secondary' },
                { id: 'a2', title: isZh ? '即時人流熱區' : 'Heatmap', desc: isZh ? '手機查看熱區' : 'Mobile Heatmap', icon: 'Map', image: './img/project_05/app_03_realtime.jpg', benefit: 'yellow' },
                { id: 'a3', title: isZh ? '行動儀表板' : 'Mobile Dash', desc: isZh ? '隨時掌握狀況' : 'Status on the go', icon: 'Mobile', image: './img/project_05/app_02_home.jpg', benefit: 'primary' }
            ];
        };

        const getGalleryCategories = (lang) => {
            const isZh = lang === 'zh';
            return [
                {
                    id: 'cat_web', title: isZh ? '網頁後台' : 'Web Admin', type: 'web',
                    images: [
                        { id: 'w01', name: isZh ? '首頁儀表板' : 'Dashboard', src: './img/project_05/web_01_dashboard.jpg' },
                        { id: 'w02', name: isZh ? '人流熱區' : 'Heatmap', src: './img/project_05/web_04_heatmap.jpg' },
                        { id: 'w03', name: isZh ? '營運排班' : 'Scheduling', src: './img/project_05/web_02_schedule.jpg' },
                        { id: 'w04', name: isZh ? '影像監控' : 'CCTV', src: './img/project_05/web_03_cctv.jpg' },
                        { id: 'w05', name: isZh ? '知識庫' : 'Knowledge', src: './img/project_05/web_05_knowledge.jpg' }
                    ]
                },
                {
                    id: 'cat_app', title: isZh ? '行動APP' : 'Mobile App', type: 'app',
                    images: [
                        { id: 'a01', name: isZh ? '登入頁' : 'Login', src: './img/project_05/app_01_login.jpg' },
                        { id: 'a02', name: isZh ? '行動首頁' : 'Home', src: './img/project_05/app_02_home.jpg' },
                        { id: 'a03', name: isZh ? '即時資訊' : 'Real-time', src: './img/project_05/app_03_realtime.jpg' },
                        { id: 'a04', name: isZh ? '緊急通報' : 'SOS', src: './img/project_05/app_04_sos.jpg' },
                        { id: 'a05', name: isZh ? '行動行事曆' : 'Calendar', src: './img/project_05/app_05_calendar.jpg' },
                        { id: 'a06', name: isZh ? '行動知識庫' : 'Knowledge', src: './img/project_05/app_06_knowledge.jpg' }
                    ]
                }
            ];
        };

        const App = () => {
            const [lang, setLang] = useState('zh');
            const [loading, setLoading] = useState(true);
            const [loaderStep, setLoaderStep] = useState(0);
            const [loaderDone, setLoaderDone] = useState(false);
            const [activeTab, setActiveTab] = useState('context');

            // Data
            const [webFeatures, setWebFeatures] = useState([]);
            const [appFeatures, setAppFeatures] = useState([]);
            const [galleryCategories, setGalleryCategories] = useState([]);

            // View State
            const [currentImage, setCurrentImage] = useState('./img/project_05/display.jpg');
            const [imageType, setImageType] = useState('context');
            const [activeFeatureId, setActiveFeatureId] = useState(null);
            const [activeGalleryId, setActiveGalleryId] = useState(null);
            const [showBackToHero, setShowBackToHero] = useState(false);

            // Refs
            const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
            const isScrollingRef = useRef(false);
            const mainContainerRef = useRef(null);
            const sectionsRef = useRef([]);
            const heroRef = useRef(null);
            const splitRef = useRef(null);
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
            const tabsContainerRef = useRef(null);
            const touchStartY = useRef(0);
            const overscrollAccumulator = useRef(0);

            const [mobileVisualHeight, setMobileVisualHeight] = useState(35);
            const [isResizing, setIsResizing] = useState(false);

            const t = (key) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) ? TRANSLATIONS[lang][key] : key;

            // Initialize
            useEffect(() => {
                const savedLang = localStorage.getItem('preferredLang');
                const initialLang = savedLang === 'en' ? 'en' : 'zh';
                setLang(initialLang);

                setWebFeatures(getWebFeatures(initialLang));
                setAppFeatures(getAppFeatures(initialLang));
                setGalleryCategories(getGalleryCategories(initialLang));

                const setResponsiveFontSize = () => {
                    if (window.innerWidth >= 1024) document.documentElement.style.fontSize = (window.innerWidth / 1920) * 16 + "px";
                    else document.documentElement.style.fontSize = '';
                };
                window.addEventListener('resize', setResponsiveFontSize);
                setResponsiveFontSize();

                const displayPromise = new Promise((resolve) => {
                    const img = new Image();
                    img.src = './img/project_05/display.webp';
                    if (img.complete) { resolve(); return; }
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                });
                const forceTimeout = new Promise(resolve => setTimeout(resolve, 4000));
                Promise.race([displayPromise, forceTimeout]).then(() => { setLoaderDone(true); setLoading(false); });

                return () => window.removeEventListener('resize', setResponsiveFontSize);
            }, []);

            useEffect(() => {
                const stepTimer = setInterval(() => setLoaderStep(i => (i + 1) % 3), 500);
                return () => clearInterval(stepTimer);
            }, []);

            // Mobile Resize
            const handleResizeStart = () => { if (window.innerWidth >= 1024) return; setIsResizing(true); document.body.style.userSelect = 'none'; };
            useEffect(() => {
                const handleResizeMove = (e) => {
                    if (!isResizing) return;
                    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
                    let newHeightVh = (clientY / window.innerHeight) * 100;
                    if (newHeightVh < 35) newHeightVh = 35; if (newHeightVh > 80) newHeightVh = 80;
                    setMobileVisualHeight(newHeightVh);
                };
                const handleResizeEnd = () => { setIsResizing(false); document.body.style.userSelect = ''; };
                window.addEventListener('mousemove', handleResizeMove); window.addEventListener('touchmove', handleResizeMove, { passive: false });
                window.addEventListener('mouseup', handleResizeEnd); window.addEventListener('touchend', handleResizeEnd);
                return () => { window.removeEventListener('mousemove', handleResizeMove); window.removeEventListener('touchmove', handleResizeMove); window.removeEventListener('mouseup', handleResizeEnd); window.removeEventListener('touchend', handleResizeEnd); };
            }, [isResizing]);

            // Update Content on Lang/Tab Change
            useEffect(() => {
                if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;

                const wFeats = getWebFeatures(lang);
                const aFeats = getAppFeatures(lang);
                const galleries = getGalleryCategories(lang);
                setWebFeatures(wFeats);
                setAppFeatures(aFeats);
                setGalleryCategories(galleries);

                setActiveFeatureId(null);
                setActiveGalleryId(null);

                // Safe access Logic
                if (activeTab === 'context') {
                    setCurrentImage('./img/project_05/display.jpg');
                    setImageType('context');
                } else if (activeTab === 'process') {
                    if (wFeats && wFeats.length > 0) {
                        setCurrentImage(wFeats[0].image);
                        setActiveFeatureId(wFeats[0].id);
                        setImageType('web');
                    }
                } else if (activeTab === 'solution') {
                    if (aFeats && aFeats.length > 0) {
                        setCurrentImage(aFeats[0].image);
                        setActiveFeatureId(aFeats[0].id);
                        setImageType('app');
                    }
                } else if (activeTab === 'climax') {
                    if (galleries && galleries.length > 0 && galleries[0].images && galleries[0].images.length > 0) {
                        setCurrentImage(galleries[0].images[0].src);
                        setActiveGalleryId(galleries[0].images[0].id);
                        setImageType('web');
                    }
                }
            }, [activeTab, lang]);

            useEffect(() => {
                sectionsRef.current = [heroRef.current, splitRef.current];
                if (sectionsRef.current[0]) sectionsRef.current[0].classList.add('active-section');
            }, [loading]);

            const handleFeatureClick = (src, id, type) => { setCurrentImage(src); setActiveFeatureId(id); setImageType(type); setActiveGalleryId(null); };
            const handleGallerySwitch = (img, type) => { setCurrentImage(img.src); setActiveGalleryId(img.id); setImageType(type); setActiveFeatureId(null); };

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
                if (tabsContainerRef.current && tabsContainerRef.current.contains(e.target)) return;
                if (isScrollingRef.current) return;
                const isSplitView = currentSectionIndex === 1;
                const contentEl = contentScrollRef.current;
                if (isSplitView && contentEl) {
                    const { scrollTop, scrollHeight, clientHeight } = contentEl;
                    if (e.deltaY < 0 && scrollTop <= 0) { overscrollAccumulator.current += Math.abs(e.deltaY) * 2; }
                    else {
                        overscrollAccumulator.current = 0;
                        if (scrollHeight > clientHeight && e.deltaY > 0) return;
                        if (scrollHeight > clientHeight && e.deltaY < 0 && scrollTop > 0) return;
                    }
                } else {
                    if (e.deltaY < 0) overscrollAccumulator.current += Math.abs(e.deltaY) * 2;
                    else overscrollAccumulator.current = 0;
                }
                if (e.deltaY > 0 && currentSectionIndex < sectionsRef.current.length - 1) scrollToSection(currentSectionIndex + 1);
            };

            const handleTouchEnd = (e) => {
                if (isScrollingRef.current || isResizing) return;
                if (tabsContainerRef.current && tabsContainerRef.current.contains(e.target)) return;
                const diff = touchStartY.current - e.changedTouches[0].clientY;
                const isSplitView = currentSectionIndex === 1;
                const contentEl = contentScrollRef.current;
                if (Math.abs(diff) > 50 && diff > 0) {
                    if (isSplitView && contentEl) {
                        const { scrollTop, scrollHeight, clientHeight } = contentEl;
                        if (scrollHeight > clientHeight && scrollTop + clientHeight < scrollHeight - 5) return;
                    }
                    if (currentSectionIndex < sectionsRef.current.length - 1) scrollToSection(currentSectionIndex + 1);
                }
            };

            useEffect(() => {
                const container = mainContainerRef.current;
                if (container) {
                    window.addEventListener('wheel', handleWheel, { passive: false });
                    window.addEventListener('touchstart', (e) => touchStartY.current = e.touches[0].clientY, { passive: true });
                    window.addEventListener('touchend', handleTouchEnd, { passive: true });
                }
                return () => { window.removeEventListener('wheel', handleWheel); };
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

            const renderPreview = () => {
                if (imageType === 'context') return <SimpleRoundedFrame src={currentImage} />;
                if (imageType === 'app') return <AppRawFrame src={currentImage} />;
                return <WebFrame src={currentImage} />;
            };

            return (
                <React.Fragment>
                    <div className={`loader ${loading ? '' : 'hidden'}`}><div className="loader-animation"></div><p className="loader-text">{loaderDone ? t('loader_step4') : t(`loader_step${loaderStep + 1}`)}</p></div>

                    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center pointer-events-none">
                        <button onClick={goBack} className="back-btn pointer-events-auto flex items-center justify-center h-10 w-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-gray-300 hover:text-white hover:border-zoo-primary/50 hover:bg-dark-lighter transition-all duration-300 shadow-lg group overflow-hidden hover:w-40">
                            <i className="ph ph-arrow-left text-zoo-primary group-hover:text-zoo-secondary flex-shrink-0"></i>
                            <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[200px] ml-0 group-hover:ml-2 transition-all duration-300 whitespace-nowrap overflow-hidden text-sm font-bold">{t('back_home')}</span>
                        </button>
                    </nav>

                    <button onClick={() => scrollToSection(0)} className={`fixed bottom-8 right-8 z-[100] w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-zoo-primary hover:border-zoo-primary hover:scale-110 transition-all duration-300 cursor-pointer ${showBackToHero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}><i className="ph ph-arrow-up"></i></button>

                    <div id="main-scroller" ref={mainContainerRef}>
                        <section ref={heroRef} className="snap-section active-section flex items-center justify-center bg-dark relative hero-bg-custom">
                            <div className="container max-w-7xl mx-auto px-8 z-20">
                                <div className="max-w-5xl text-left">
                                    <div className={`inline-block px-4 py-1 rounded-full border border-zoo-accent/50 bg-zoo-accent/20 text-zoo-accent text-xs font-bold tracking-widest mb-6 ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.1s' }}>SMART ZOO MANAGEMENT</div>
                                    <h1 className={`text-5xl lg:text-7xl font-heading font-black mb-8 leading-tight text-white drop-shadow-2xl text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.2s' }}>{t('title_main')}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-zoo-primary to-zoo-secondary font-heading" dangerouslySetInnerHTML={{ __html: t('title_sub').replace('\n', '<br/>') }}></span></h1>
                                    <h2 className={`text-xl md:text-2xl text-gray-300 font-light mb-12 max-w-2xl mr-auto leading-relaxed drop-shadow-md text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.3s' }}>{t('hero_desc')}</h2>
                                    <button onClick={() => scrollToSection(1)} className={`px-10 py-4 bg-zoo-primary border border-zoo-primary/50 rounded-full text-white font-bold text-lg hover:bg-white hover:text-zoo-primary transition-all shadow-[0_10px_30px_rgba(134,194,50,0.4)] transform hover:-translate-y-1 ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.4s' }}>{t('btn_explore')} <i className="ph ph-arrow-down ml-2 animate-bounce"></i></button>
                                </div>
                            </div>
                        </section>

                        <section ref={splitRef} className="snap-section flex flex-col lg:flex-row bg-dark h-screen overflow-hidden relative">
                            <div ref={imageScrollRef} className="w-full shrink-0 z-20 lg:w-3/5 lg:h-full bg-black flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 shadow-2xl relative" style={{ height: window.innerWidth < 1024 ? `${mobileVisualHeight}vh` : '100%', transition: isResizing ? 'none' : 'height 0.3s ease' }}>
                                {renderPreview()}
                                <div className="lg:hidden absolute bottom-0 right-6 w-12 h-12 z-50 flex items-center justify-center cursor-row-resize touch-none translate-y-1/2" onMouseDown={handleResizeStart} onTouchStart={handleResizeStart}>
                                    <div className="w-10 h-10 bg-dark-light/90 backdrop-blur-md rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-white/20 flex flex-col items-center justify-center transition-transform hover:scale-110 active:scale-95 group"><i className="ph ph-caret-up text-[8px] text-gray-400 group-hover:text-zoo-primary mb-0.5"></i><div className="w-4 h-[2px] bg-gray-500 rounded-full"></div><i className="ph ph-caret-down text-[8px] text-gray-400 group-hover:text-zoo-primary mt-0.5"></i></div>
                                </div>
                            </div>

                            <div className="flex-1 w-full relative z-10 lg:w-2/5 lg:h-full flex flex-col h-auto min-h-0">
                                <div className="w-full h-full flex flex-col glass-panel relative min-h-0">
                                    <div className="sticky top-0 bg-dark/95 backdrop-blur-xl z-30 border-b border-white/10 shrink-0">
                                        <div className="p-4 lg:p-8 pb-0 lg:pb-0">
                                            <h2 className="text-xl lg:text-3xl font-bold text-white font-heading mb-1 leading-tight">{t('title_main')}<br />{t('title_sub')}</h2>
                                            <p className="text-gray-400 text-xs lg:text-sm mb-2 lg:mb-4">Internal Management & Mobile Response</p>
                                            <div ref={tabsContainerRef} className="flex space-x-6 overflow-x-auto custom-scroll mt-2 lg:mt-4 pb-2 w-full touch-pan-x">
                                                {[{ id: 'context', label: t('tab_context') }, { id: 'process', label: t('tab_web') }, { id: 'solution', label: t('tab_app') }, { id: 'climax', label: t('tab_climax') }].map(tab => (
                                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === tab.id ? 'text-zoo-primary border-b-2 border-zoo-primary pb-1' : 'text-gray-500 hover:text-white pb-1'}`}>{tab.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div ref={contentScrollRef} onTouchStart={handleTabTouchStart} onTouchEnd={handleTabTouchEnd} className="flex-1 p-4 lg:p-8 pb-24 overflow-y-auto custom-scroll scroll-content">
                                        {activeTab === 'context' && (
                                            <div className="space-y-8 lg:space-y-12 animate-fadeIn">
                                                <div className="space-y-4 lg:space-y-6"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('context_title')}</h3><p className="text-gray-300 text-sm leading-relaxed mb-4">{t('context_desc')}</p><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-white/5 rounded-xl border border-white/10"><div className="text-xs text-gray-500 uppercase mb-1">{t('role_title')}</div><div className="font-bold text-white">{t('role_name')}</div></div><div className="p-4 bg-white/5 rounded-xl border border-white/10"><div className="text-xs text-gray-500 uppercase mb-2">Tools</div><div className="flex flex-wrap gap-2"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zoo-primary/20 text-zoo-primary border border-zoo-primary/30"><Icons.Figma /> <span className="ml-1">Figma</span></span><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zoo-secondary/20 text-zoo-secondary border border-zoo-secondary/30"><Icons.Illustrator /> <span className="ml-1">Illustrator</span></span></div></div></div></div>
                                                <div className="w-full h-px bg-white/10"></div>
                                                <div className="space-y-6"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-zoo-secondary rounded-full mr-3"></span>{t('pain_title')}</h3><div className="feature-card feature-card-secondary p-5"><h4 className="text-zoo-secondary font-bold text-sm mb-3">{t('pain_sub')}</h4><ul className="space-y-4 text-gray-300"><li className="flex items-start text-sm text-gray-400"><span className="text-red-400 mr-3 mt-1"><i className="ph ph-x"></i></span><div><strong className="text-gray-200 block text-sm">{t('pain_1_title')}</strong>{t('pain_1_desc')}</div></li><li className="flex items-start text-sm text-gray-400"><span className="text-red-400 mr-3 mt-1"><i className="ph ph-x"></i></span><div><strong className="text-gray-200 block text-sm">{t('pain_2_title')}</strong>{t('pain_2_desc')}</div></li><li className="flex items-start text-sm text-gray-400"><span className="text-red-400 mr-3 mt-1"><i className="ph ph-x"></i></span><div><strong className="text-gray-200 block text-sm">{t('pain_3_title')}</strong>{t('pain_3_desc')}</div></li></ul></div></div>
                                            </div>
                                        )}
                                        {activeTab === 'process' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-6">{t('web_title')}</h3>
                                                <div className="feature-card feature-card-primary p-5 mb-8"><h4 className="text-zoo-primary font-bold text-lg mb-3 flex items-center"><span className="text-2xl mr-2">♜</span> {t('web_summary')}</h4><ul className="space-y-3"><li className="flex items-start text-sm text-gray-300"><span className="text-zoo-primary mr-2">•</span><span>{t('web_p1')}</span></li><li className="flex items-start text-sm text-gray-300"><span className="text-zoo-primary mr-2">•</span><span>{t('web_p2')}</span></li><li className="flex items-start text-sm text-gray-300"><span className="text-zoo-primary mr-2">•</span><span>{t('web_p3')}</span></li></ul></div>
                                                <div className="w-full h-px bg-white/10 mb-8"></div>
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-zoo-primary rounded-full mr-3"></span>{t('web_core')}</h3>
                                                <div className="space-y-4">{webFeatures.map(feat => {
                                                    const IconComp = Icons[feat.icon];
                                                    let benefitColor, bgClass, bgGradient, borderColor, shadowClass;
                                                    if (feat.benefit === 'primary') { 
                                                        benefitColor = 'text-zoo-primary'; 
                                                        bgClass = 'bg-zoo-primary'; 
                                                        bgGradient = 'bg-gradient-to-br from-zoo-primary/20 to-zoo-primary/5'; 
                                                        borderColor = '!border-zoo-primary';
                                                        shadowClass = 'shadow-[0_0_15px_rgba(134,194,50,0.2)]';
                                                    } else if (feat.benefit === 'blue-400') { 
                                                        benefitColor = 'text-blue-400'; 
                                                        bgClass = 'bg-blue-400'; 
                                                        bgGradient = 'bg-gradient-to-br from-blue-400/20 to-blue-400/5'; 
                                                        borderColor = '!border-blue-400';
                                                        shadowClass = 'shadow-[0_0_15px_rgba(96,165,250,0.2)]';
                                                    } else { 
                                                        benefitColor = 'text-purple-400'; 
                                                        bgClass = 'bg-purple-400'; 
                                                        bgGradient = 'bg-gradient-to-br from-purple-400/20 to-purple-400/5'; 
                                                        borderColor = '!border-purple-400';
                                                        shadowClass = 'shadow-[0_0_15px_rgba(192,132,252,0.2)]';
                                                    }

                                                    return (<button key={feat.id} onClick={() => handleFeatureClick(feat.image, feat.id, 'web')} className={`w-full text-left feature-card p-5 flex items-start space-x-4 transition-all group ${activeFeatureId === feat.id ? `${borderColor} bg-white/10 ${shadowClass}` : 'border-white/10 hover:bg-white/5'}`}><div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${activeFeatureId === feat.id ? `${bgClass} text-dark` : `${bgGradient} ${benefitColor}`}`}><IconComp /></div><div><h4 className={`font-bold text-sm mb-1 transition-colors ${activeFeatureId === feat.id ? benefitColor : 'text-white'}`}>{feat.title}</h4><p className="text-xs text-gray-400 leading-relaxed">{feat.desc}</p></div></button>);
                                                })}</div>
                                            </div>
                                        )}
                                        {activeTab === 'solution' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-6">{t('app_title')}</h3>
                                                <div className="feature-card feature-card-secondary p-5 mb-8"><h4 className="text-zoo-secondary font-bold text-lg mb-3 flex items-center"><span className="text-2xl mr-2">⚡</span> {t('app_summary')}</h4><ul className="space-y-3"><li className="flex items-start text-sm text-gray-300"><span className="text-zoo-secondary mr-2">•</span><span>{t('app_p1')}</span></li><li className="flex items-start text-sm text-gray-300"><span className="text-zoo-secondary mr-2">•</span><span>{t('app_p2')}</span></li><li className="flex items-start text-sm text-gray-300"><span className="text-zoo-secondary mr-2">•</span><span>{t('app_p3')}</span></li></ul></div>
                                                <div className="w-full h-px bg-white/10 mb-8"></div>
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-zoo-secondary rounded-full mr-3"></span>{t('app_core')}</h3>
                                                <div className="space-y-4">{appFeatures.map(feat => {
                                                    const IconComp = Icons[feat.icon];
                                                    let benefitColor, bgClass, bgGradient, borderColor, shadowClass;
                                                    if (feat.benefit === 'primary') { 
                                                        benefitColor = 'text-zoo-primary'; 
                                                        bgClass = 'bg-zoo-primary'; 
                                                        bgGradient = 'bg-gradient-to-br from-zoo-primary/20 to-zoo-primary/5'; 
                                                        borderColor = '!border-zoo-primary';
                                                        shadowClass = 'shadow-[0_0_15px_rgba(134,194,50,0.2)]';
                                                    } else if (feat.benefit === 'secondary') { 
                                                        benefitColor = 'text-zoo-secondary'; 
                                                        bgClass = 'bg-zoo-secondary'; 
                                                        bgGradient = 'bg-gradient-to-br from-zoo-secondary/20 to-zoo-secondary/5'; 
                                                        borderColor = '!border-zoo-secondary';
                                                        shadowClass = 'shadow-[0_0_15px_rgba(255,150,113,0.2)]';
                                                    } else if (feat.benefit === 'yellow') { 
                                                        // Corrected logic for 'yellow' to use accent/specific yellow color
                                                        benefitColor = 'text-yellow-400'; 
                                                        bgClass = 'bg-yellow-400'; 
                                                        bgGradient = 'bg-gradient-to-br from-yellow-400/20 to-yellow-400/5'; 
                                                        borderColor = '!border-yellow-400';
                                                        shadowClass = 'shadow-[0_0_15px_rgba(250,204,21,0.2)]';
                                                    } else { 
                                                        benefitColor = 'text-zoo-accent'; 
                                                        bgClass = 'bg-zoo-accent'; 
                                                        bgGradient = 'bg-gradient-to-br from-zoo-accent/20 to-zoo-accent/5'; 
                                                        borderColor = '!border-zoo-accent';
                                                        shadowClass = 'shadow-[0_0_15px_rgba(255,199,95,0.2)]';
                                                    }

                                                    return (<button key={feat.id} onClick={() => handleFeatureClick(feat.image, feat.id, 'app')} className={`w-full text-left feature-card p-5 flex items-start space-x-4 transition-all group ${activeFeatureId === feat.id ? `${borderColor} bg-white/10 ${shadowClass}` : 'border-white/10 hover:bg-white/5'}`}><div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${activeFeatureId === feat.id ? `${bgClass} text-dark` : `${bgGradient} ${benefitColor}`}`}><IconComp /></div><div><h4 className={`font-bold text-sm mb-1 transition-colors ${activeFeatureId === feat.id ? benefitColor : 'text-white'}`}>{feat.title}</h4><p className="text-xs text-gray-400 leading-relaxed">{feat.desc}</p></div></button>);
                                                })}</div>
                                            </div>
                                        )}
                                        {activeTab === 'climax' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn pb-12">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('gallery_title')}</h3>
                                                <p className="text-gray-400 mb-8 text-sm">{t('gallery_desc')}</p>
                                                <div className="space-y-6">
                                                    {galleryCategories.map(category => (
                                                        <div key={category.id} className="space-y-3">
                                                            <h4 className={`font-bold text-md flex items-center ${category.type === 'web' ? 'text-zoo-primary' : 'text-zoo-secondary'}`}>
                                                                <span className={`w-2 h-2 rounded-full mr-2 ${category.type === 'web' ? 'bg-zoo-primary' : 'bg-zoo-secondary'}`}></span>
                                                                {category.title}
                                                            </h4>
                                                            <div className="grid gap-3 pl-4 border-l border-white/10">
                                                                {category.images.map(img => {
                                                                    const isWeb = category.type === 'web';
                                                                    const activeClass = isWeb 
                                                                        ? 'border-zoo-primary shadow-[0_0_15px_rgba(134,194,50,0.1)]' 
                                                                        : 'border-zoo-secondary shadow-[0_0_15px_rgba(255,150,113,0.1)]';
                                                                    
                                                                    return (
                                                                        <button key={img.id} onClick={() => handleGallerySwitch(img, category.type)} 
                                                                            className={`text-left feature-card p-3 hover:bg-white/10 transition-all group ${activeGalleryId === img.id ? `${activeClass} bg-white/5` : 'border-white/5'}`}>
                                                                            <div className="flex justify-between items-center">
                                                                                <h4 className={`font-medium transition-colors text-xs lg:text-sm ${activeGalleryId === img.id ? 'text-white' : 'text-gray-300 group-hover:text-gray-200'}`}>
                                                                                    <span className={`${category.type === 'web' ? 'text-zoo-primary/70' : 'text-zoo-secondary/70'} mr-2 text-xs font-mono`}>{img.id}</span>
                                                                                    {img.name}
                                                                                </h4>
                                                                                <i className={`ph ph-caret-right transform transition-all text-xs ${activeGalleryId === img.id ? (category.type === 'web' ? 'text-zoo-primary' : 'text-zoo-secondary') + ' translate-x-0 opacity-100' : 'text-gray-600 -translate-x-2 opacity-0 group-hover:opacity-50'}`}></i>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
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
