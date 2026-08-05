import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import gsap from 'gsap';
import ScrollToPlugin from 'gsap/ScrollToPlugin';
import {
    SharedIcons, BackButton, ScrollTopButton, HeroCTAButton, TabNav,
    ToolPill, InfoGrid, InfoCard, PainPointCard, FeatureCard,
    GalleryItemButton, BrowserFrame, ImageWithSkeleton, ResizeHandle,
} from './shared/index.js';

gsap.registerPlugin(ScrollToPlugin);

// --- COMPONENTS ---

        const WebFrame = ({ src }) => (
            <div className="w-full h-full flex items-center justify-center pointer-events-none p-4 lg:p-12">
                <div className="relative z-10 w-full h-auto max-w-full max-h-[90vh] bg-zoo-dark-light rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 pointer-events-auto">
                    <BrowserFrame />
                    <div className="w-full h-full bg-white/5 flex items-center justify-center overflow-hidden relative group">
                        <ImageWithSkeleton src={src} alt="Web View" className="w-full h-full object-contain" />
                    </div>
                </div>
            </div>
        );

        const SimpleRoundedFrame = ({ src }) => (
            <div className="w-full h-full flex items-center justify-center pointer-events-none p-4 lg:p-12">
                <div className="relative z-10 w-full h-auto max-w-full max-h-[90vh] bg-zoo-dark-light rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 pointer-events-auto">
                    <div className="w-full h-full bg-white/5 flex items-center justify-center overflow-hidden relative group">
                        <ImageWithSkeleton src={src} alt="Context View" className="w-full h-full object-contain" />
                    </div>
                </div>
            </div>
        );

        const AppRawFrame = ({ src }) => (
            <div className="flex items-center justify-center w-full h-full p-4 lg:p-8 pointer-events-none">
                <div className="relative h-full w-auto max-w-full bg-transparent animate-fadeIn shrink-0 pointer-events-auto flex justify-center">
                    <ImageWithSkeleton src={src} alt="App View" className="w-full h-full object-contain" />
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
            const tabsContainerRef = useRef(null);
            const touchStartY = useRef(0);
            const overscrollAccumulator = useRef(0);

            const [mobileVisualHeight, setMobileVisualHeight] = useState(35);
            const [isResizing, setIsResizing] = useState(false);

            const t = (key) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) ? TRANSLATIONS[lang][key] : key;

            // Initialize
            useEffect(() => {
                const savedLang = localStorage.getItem('lang');
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
                if (swipeContentRef.current) gsap.set(swipeContentRef.current, { x: 0, opacity: 1 });

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
                        <BackButton prefix="zoo" label={t('back_home')} onClick={goBack} />
                    </nav>

                    <ScrollTopButton prefix="zoo" visible={showBackToHero} onClick={() => scrollToSection(0)} />

                    <div id="main-scroller" ref={mainContainerRef}>
                        <section ref={heroRef} className="snap-section active-section flex items-center justify-center bg-zoo-dark relative hero-bg-custom">
                            <div className="container max-w-7xl mx-auto px-8 z-20">
                                <div className="max-w-5xl text-left">
                                    <div className={`inline-block px-4 py-1 rounded-full border border-zoo-accent/50 bg-zoo-accent/20 text-zoo-accent text-xs font-bold tracking-widest mb-6 ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.1s' }}>SMART ZOO MANAGEMENT</div>
                                    <h1 className={`text-5xl lg:text-7xl font-heading font-black mb-8 leading-tight text-white drop-shadow-2xl text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.2s' }}>{t('title_main')}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-zoo-primary to-zoo-secondary font-heading" dangerouslySetInnerHTML={{ __html: t('title_sub').replace('\n', '<br/>') }}></span></h1>
                                    <h2 className={`text-xl md:text-2xl text-gray-300 font-light mb-12 max-w-2xl mr-auto leading-relaxed drop-shadow-md text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.3s' }}>{t('hero_desc')}</h2>
                                    <HeroCTAButton prefix="zoo" shadowClass="shadow-[0_10px_30px_rgba(134,194,50,0.4)]" loading={loading} label={t('btn_explore')} onClick={() => scrollToSection(1)} />
                                </div>
                            </div>
                        </section>

                        <section ref={splitRef} className="snap-section flex flex-col lg:flex-row bg-zoo-dark h-screen overflow-hidden relative">
                            <div ref={imageScrollRef} className="w-full shrink-0 z-20 lg:w-3/5 lg:h-full bg-black flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 shadow-2xl relative" style={{ height: window.innerWidth < 1024 ? `${mobileVisualHeight}vh` : '100%', transition: isResizing ? 'none' : 'height 0.3s ease' }}>
                                {renderPreview()}
                                <ResizeHandle prefix="zoo" onMouseDown={handleResizeStart} onTouchStart={handleResizeStart} />
                            </div>

                            <div className="flex-1 w-full relative z-10 lg:w-2/5 lg:h-full flex flex-col h-auto min-h-0">
                                <div className="w-full h-full flex flex-col glass-panel relative min-h-0">
                                    <div className="sticky top-0 bg-zoo-dark/95 backdrop-blur-xl z-30 border-b border-white/10 shrink-0">
                                        <div className="p-4 lg:p-8 pb-0 lg:pb-0">
                                            <h2 className="text-xl lg:text-3xl font-bold text-white font-heading mb-1 leading-tight">{t('title_main')}<br />{t('title_sub')}</h2>
                                            <p className="text-gray-400 text-xs lg:text-sm mb-2 lg:mb-4">Internal Management & Mobile Response</p>
                                            <TabNav
                                                prefix="zoo"
                                                containerRef={tabsContainerRef}
                                                activeTab={activeTab}
                                                onChange={setActiveTab}
                                                tabs={[{ id: 'context', label: t('tab_context') }, { id: 'process', label: t('tab_web') }, { id: 'solution', label: t('tab_app') }, { id: 'climax', label: t('tab_climax') }]}
                                            />
                                        </div>
                                    </div>

                                    <div ref={contentScrollRef} onTouchStart={handleTabTouchStart} onTouchEnd={handleTabTouchEnd} className="flex-1 overflow-y-auto custom-scroll scroll-content overflow-x-hidden relative">
                                    <div ref={swipeContentRef} className="p-4 lg:p-8 pb-24">
                                        {activeTab === 'context' && (
                                            <div className="space-y-8 lg:space-y-12 animate-fadeIn">
                                                <div className="space-y-4 lg:space-y-6"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('context_title')}</h3><p className="text-gray-300 text-sm leading-relaxed mb-4">{t('context_desc')}</p><InfoGrid><InfoCard><div className="text-xs text-gray-500 uppercase mb-1">{t('role_title')}</div><div className="font-bold text-white">{t('role_name')}</div></InfoCard><InfoCard><div className="text-xs text-gray-500 uppercase mb-2">Tools</div><div className="flex flex-wrap gap-2"><ToolPill prefix="zoo" color="primary" icon={<SharedIcons.Figma />} label="Figma" /><ToolPill prefix="zoo" color="secondary" icon={<SharedIcons.AI />} label="Illustrator" /></div></InfoCard></InfoGrid></div>
                                                <div className="w-full h-px bg-white/10"></div>
                                                <div className="space-y-6"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-zoo-secondary rounded-full mr-3"></span>{t('pain_title')}</h3><PainPointCard prefix="zoo" subtitle={t('pain_sub')} items={[{ title: t('pain_1_title'), desc: t('pain_1_desc') }, { title: t('pain_2_title'), desc: t('pain_2_desc') }, { title: t('pain_3_title'), desc: t('pain_3_desc') }]} /></div>
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
                                                    return (
                                                        <FeatureCard
                                                            key={feat.id}
                                                            prefix="zoo"
                                                            active={activeFeatureId === feat.id}
                                                            onClick={() => handleFeatureClick(feat.image, feat.id, 'web')}
                                                            icon={<IconComp />}
                                                            title={feat.title}
                                                            desc={feat.desc}
                                                            activeShadowClass="shadow-[0_0_15px_rgba(134,194,50,0.1)]"
                                                        />
                                                    );
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
                                                    return (
                                                        <FeatureCard
                                                            key={feat.id}
                                                            prefix="zoo"
                                                            active={activeFeatureId === feat.id}
                                                            onClick={() => handleFeatureClick(feat.image, feat.id, 'app')}
                                                            icon={<IconComp />}
                                                            title={feat.title}
                                                            desc={feat.desc}
                                                            activeShadowClass="shadow-[0_0_15px_rgba(134,194,50,0.1)]"
                                                        />
                                                    );
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
                                                                {category.images.map(img => (
                                                                    <GalleryItemButton
                                                                        key={img.id}
                                                                        prefix="zoo"
                                                                        active={activeGalleryId === img.id}
                                                                        onClick={() => handleGallerySwitch(img, category.type)}
                                                                        id={img.id}
                                                                        name={img.name}
                                                                        activeShadowClass="shadow-[0_0_15px_rgba(134,194,50,0.1)]"
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="h-8"></div>
                                    
                                    </div>
                                    {peekTab && (
                                    <div ref={peekContentRef} style={{ transform: `translateX(${dragDirRef.current * 100}%)` }} className="absolute inset-0 p-4 lg:p-8 pb-24 overflow-y-auto">
                                        {peekTab === 'context' && (
                                            <div className="space-y-8 lg:space-y-12 animate-fadeIn">
                                                <div className="space-y-4 lg:space-y-6"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('context_title')}</h3><p className="text-gray-300 text-sm leading-relaxed mb-4">{t('context_desc')}</p><InfoGrid><InfoCard><div className="text-xs text-gray-500 uppercase mb-1">{t('role_title')}</div><div className="font-bold text-white">{t('role_name')}</div></InfoCard><InfoCard><div className="text-xs text-gray-500 uppercase mb-2">Tools</div><div className="flex flex-wrap gap-2"><ToolPill prefix="zoo" color="primary" icon={<SharedIcons.Figma />} label="Figma" /><ToolPill prefix="zoo" color="secondary" icon={<SharedIcons.AI />} label="Illustrator" /></div></InfoCard></InfoGrid></div>
                                                <div className="w-full h-px bg-white/10"></div>
                                                <div className="space-y-6"><h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-zoo-secondary rounded-full mr-3"></span>{t('pain_title')}</h3><PainPointCard prefix="zoo" subtitle={t('pain_sub')} items={[{ title: t('pain_1_title'), desc: t('pain_1_desc') }, { title: t('pain_2_title'), desc: t('pain_2_desc') }, { title: t('pain_3_title'), desc: t('pain_3_desc') }]} /></div>
                                            </div>
                                        )}
                                        {peekTab === 'process' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-6">{t('web_title')}</h3>
                                                <div className="feature-card feature-card-primary p-5 mb-8"><h4 className="text-zoo-primary font-bold text-lg mb-3 flex items-center"><span className="text-2xl mr-2">♜</span> {t('web_summary')}</h4><ul className="space-y-3"><li className="flex items-start text-sm text-gray-300"><span className="text-zoo-primary mr-2">•</span><span>{t('web_p1')}</span></li><li className="flex items-start text-sm text-gray-300"><span className="text-zoo-primary mr-2">•</span><span>{t('web_p2')}</span></li><li className="flex items-start text-sm text-gray-300"><span className="text-zoo-primary mr-2">•</span><span>{t('web_p3')}</span></li></ul></div>
                                                <div className="w-full h-px bg-white/10 mb-8"></div>
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-zoo-primary rounded-full mr-3"></span>{t('web_core')}</h3>
                                                <div className="space-y-4">{webFeatures.map(feat => {
                                                    const IconComp = Icons[feat.icon];
                                                    return (
                                                        <FeatureCard
                                                            key={feat.id}
                                                            prefix="zoo"
                                                            active={activeFeatureId === feat.id}
                                                            onClick={() => handleFeatureClick(feat.image, feat.id, 'web')}
                                                            icon={<IconComp />}
                                                            title={feat.title}
                                                            desc={feat.desc}
                                                            activeShadowClass="shadow-[0_0_15px_rgba(134,194,50,0.1)]"
                                                        />
                                                    );
                                                })}</div>
                                            </div>
                                        )}
                                        {peekTab === 'solution' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-6">{t('app_title')}</h3>
                                                <div className="feature-card feature-card-secondary p-5 mb-8"><h4 className="text-zoo-secondary font-bold text-lg mb-3 flex items-center"><span className="text-2xl mr-2">⚡</span> {t('app_summary')}</h4><ul className="space-y-3"><li className="flex items-start text-sm text-gray-300"><span className="text-zoo-secondary mr-2">•</span><span>{t('app_p1')}</span></li><li className="flex items-start text-sm text-gray-300"><span className="text-zoo-secondary mr-2">•</span><span>{t('app_p2')}</span></li><li className="flex items-start text-sm text-gray-300"><span className="text-zoo-secondary mr-2">•</span><span>{t('app_p3')}</span></li></ul></div>
                                                <div className="w-full h-px bg-white/10 mb-8"></div>
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-zoo-secondary rounded-full mr-3"></span>{t('app_core')}</h3>
                                                <div className="space-y-4">{appFeatures.map(feat => {
                                                    const IconComp = Icons[feat.icon];
                                                    return (
                                                        <FeatureCard
                                                            key={feat.id}
                                                            prefix="zoo"
                                                            active={activeFeatureId === feat.id}
                                                            onClick={() => handleFeatureClick(feat.image, feat.id, 'app')}
                                                            icon={<IconComp />}
                                                            title={feat.title}
                                                            desc={feat.desc}
                                                            activeShadowClass="shadow-[0_0_15px_rgba(134,194,50,0.1)]"
                                                        />
                                                    );
                                                })}</div>
                                            </div>
                                        )}
                                        {peekTab === 'climax' && (
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
                                                                {category.images.map(img => (
                                                                    <GalleryItemButton
                                                                        key={img.id}
                                                                        prefix="zoo"
                                                                        active={activeGalleryId === img.id}
                                                                        onClick={() => handleGallerySwitch(img, category.type)}
                                                                        id={img.id}
                                                                        name={img.name}
                                                                        activeShadowClass="shadow-[0_0_15px_rgba(134,194,50,0.1)]"
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
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
