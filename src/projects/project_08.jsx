import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import gsap from 'gsap';
import ScrollToPlugin from 'gsap/ScrollToPlugin';
import {
    SharedIcons, BackButton, ScrollTopButton, HeroCTAButton, TabNav, ToolPill,
    InfoGrid, InfoCard, ProcessTimeline, FeatureCard, GalleryItemButton,
    ImageWithSkeleton, ResizeHandle,
} from './shared/index.js';

gsap.registerPlugin(ScrollToPlugin);

// --- COMPONENTS ---
        const Icons = {
            Code: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>,
            Mobile: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>,
            Game: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            Social: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
            Rank: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            Star: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
        };

        // --- TRANSLATIONS ---
        const TRANSLATIONS = {
            zh: {
                loader_step1: "讀取專案中繼資料",
                loader_step2: "載入視覺素材",
                loader_step3: "建構渲染畫布",
                loader_step4: "初始化完成",
                title_main: "Love Two live app", title_sub: "遊戲化留存設計",
                hero_desc: "透過「青綠色」科技感視覺與深度的遊戲化任務設計，解決用戶留存痛點，打造全時段的社交直播生態。",
                btn_explore: "探索設計旅程", back_home: "Back to Portfolio",
                tab_context: "01. 視覺策略", tab_process: "02. 設計策略", tab_solution: "03. 主要功能", tab_climax: "04. 生態系成果",

                context_title: "視覺策略與市場區隔",
                context_desc: "在充斥著「紅色」與「粉色」的直播應用市場中，本專案的核心目標是透過強烈的色彩區隔來重塑品牌認知。我們大膽捨棄了業界慣用的暖色系，轉而採用冷色調的「青綠色 (Teal)」作為主視覺，旨在打造一個更具科技感、更年輕，且能降低用戶視覺焦慮的沈浸式社交空間。",
                role_title: "My Role", role_name: "UI 設計師", tools: "Tools",
                visual_strat_title: "核心視覺策略 Core Visual Strategy",
                visual_p1_title: "對抗視覺疲勞", visual_p1_desc: "競品常見的大紅色容易引發焦慮與緊迫感，導致用戶無法長時間停留。青綠色則傳遞放鬆、成長的心理暗示，有效延長觀看時長。",
                visual_p2_title: "遊戲化氛圍", visual_p2_desc: "配合深色模式 (Dark Mode)，螢光綠能營造出類似電競或科幻電影的沈浸感，讓「解任務」與「送禮物」更像是在玩遊戲，而非單純的消費。",
                visual_p3_title: "品牌年輕化", visual_p3_desc: "跳脫傳統直播「俗氣」、「秀場」的刻板印象，透過清新的視覺語言吸引更注重質感與社群互動的 Z 世代用戶。",

                process_title: "設計策略 The Process", process_sub: "從視覺到機制，全方位的留存設計",
                proc_1_title: "01. 視覺風格重塑 (Visual Identity)", proc_1_desc: "採用深色模式搭配高飽和度「青綠色 (Teal)」，營造清新、科技且耐看的品牌形象，區隔市場競品。",
                proc_2_title: "02. 遊戲化驅動 (Gamification)", proc_2_desc: "設計具象化的「兔子進度條」與每日任務，將觀看行為轉化為「解任務」的遊戲體驗，強制拉長停留時間。",
                proc_3_title: "03. 社交閉環 (Social Loop)", proc_3_desc: "整合「圖文動態牆 (Moments)」與直播流，填補主播下線後的內容空窗期，打造像 Instagram 般隨時可滑的社交體驗。",
                proc_4_title: "04. 雙軌經濟 (Dual Economy)", proc_4_desc: "為觀眾與主播分別設計「貢獻勳章」與「職涯等級」，滿足大戶的虛榮心與新手的成長指引。",

                sol_title: "主要功能與特色 Key Features",
                feat_1_title: "遊戲化任務系統 (Gamified Tasks)", feat_1_desc: "透過「兔子進度條」與「倒數紅包」將觀看時間轉化為積分獎勵。利用 Zeigarnik 效應，讓用戶為了完成任務而主動停留，大幅提升平台黏著度。",
                feat_2_title: "社群動態牆 (Social Moments)", feat_2_desc: "整合「即時直播流」與「圖文動態」，填補主播下線後的內容空窗期。用戶可隨時按讚、互動，打造全天候活躍的社交閉環。",
                feat_3_title: "雙軌等級體系 (Dual-Track Ranking)", feat_3_desc: "區分「主播等級」與「貢獻等級」，透過顯性的徽章與排行榜展示社交資本。滿足大戶的虛榮心，同時給予新手主播明確的成長指引。",

                climax_title: "生態系成果 Ecosystem Gallery", climax_desc: "從直播到社交，打造完整的沈浸式娛樂生態系。",

                // Categories
                cat_tasks: "首頁與任務", cat_live: "直播間互動", cat_social: "社交動態牆", cat_profile: "個人成長體系",
                img_home: "直播首頁", img_daily_task: "每日任務清單", img_daily_board: "即時排行榜",
                img_gift: "虛擬禮物面板", img_store: "代幣儲值商店", img_share: "直播分享引導", img_end_live: "直播結束結算",
                img_follow: "追蹤動態首頁", img_moment: "動態詳情頁", img_moment_2: "用戶互動選單",
                img_profile: "個人主頁", img_self: "個人資訊彈窗", img_rank_con: "貢獻等級說明", img_rank_broad: "主播等級說明"
            },
            en: {
                loader_step1: "Reading project metadata",
                loader_step2: "Loading visual assets",
                loader_step3: "Constructing render canvas",
                loader_step4: "Initialization complete",
                title_main: "Love Two live app", title_sub: "Gamified Retention Design",
                hero_desc: "Utilizing 'Teal' sci-fi visuals and deep gamification strategies to solve retention pain points, creating a 24/7 social live streaming ecosystem.",
                btn_explore: "Explore the Journey", back_home: "Back to Portfolio",
                tab_context: "01. Visual Strategy", tab_process: "02. Design Strategy", tab_solution: "03. Key Features", tab_climax: "04. Ecosystem",

                context_title: "Visual Strategy & Market Segmentation",
                context_desc: "In a market dominated by 'Red' and 'Pink' apps, our goal was to reshape brand perception through strong color differentiation. We boldly adopted a cool 'Teal' tone to create a tech-savvy, youthful, and immersive social space that reduces visual fatigue.",
                role_title: "My Role", role_name: "UI Designer", tools: "Tools",
                visual_strat_title: "Core Visual Strategy",
                visual_p1_title: "Anti-Fatigue", visual_p1_desc: "Common red tones in competitors can trigger anxiety. Teal conveys relaxation and growth, effectively extending viewing time.",
                visual_p2_title: "Gaming Vibe", visual_p2_desc: "Combined with Dark Mode, neon green creates an immersive esports or sci-fi vibe, making 'tasks' and 'gifting' feel like a game rather than just spending.",
                visual_p3_title: "Gen Z Identity", visual_p3_desc: "Breaking away from the 'tacky' stereotype of traditional streaming, attracting Gen Z users who value aesthetics and community interaction through a fresh visual language.",

                process_title: "Design Strategy", process_sub: "Comprehensive retention design from visuals to mechanics",
                proc_1_title: "01. Visual Identity", proc_1_desc: "Using Dark Mode with high-saturation 'Teal' to build a fresh, tech-savvy brand image.",
                proc_2_title: "02. Gamification", proc_2_desc: "Designing concrete 'Rabbit Progress Bars' and daily tasks to turn viewing into a 'questing' experience.",
                proc_3_title: "03. Social Loop", proc_3_desc: "Integrating 'Moments' with live streams to fill content gaps when streamers are offline.",
                proc_4_title: "04. Dual Economy", proc_4_desc: "Designing 'Contribution Badges' and 'Career Levels' for viewers and streamers respectively.",

                sol_title: "Key Features",
                feat_1_title: "Gamified Tasks", feat_1_desc: "Turning watch time into rewards via progress bars and countdown red envelopes. Leveraging the Zeigarnik effect to keep users engaged.",
                feat_2_title: "Social Moments", feat_2_desc: "Integrating live streams with photo/text feeds. Users can like and interact anytime, creating a 24/7 active social loop.",
                feat_3_title: "Dual-Track Ranking", feat_3_desc: "Differentiating 'Streamer Level' and 'Contribution Level' to display social capital via badges and leaderboards.",

                climax_title: "Ecosystem Gallery", climax_desc: "Building a complete immersive entertainment ecosystem from streaming to socializing.",

                // Categories
                cat_tasks: "Home & Tasks", cat_live: "Live Interaction", cat_social: "Social Wall", cat_profile: "Growth System",
                img_home: "Live Home", img_daily_task: "Daily Task List", img_daily_board: "Real-time Leaderboard",
                img_gift: "Virtual Gift Panel", img_store: "Token Store", img_share: "Share Prompt", img_end_live: "Stream Summary",
                img_follow: "Following Feed", img_moment: "Moment Detail", img_moment_2: "Interaction Menu",
                img_profile: "My Profile", img_self: "Profile Popup", img_rank_con: "Contributor Level", img_rank_broad: "Streamer Level"
            }
        };

        const MAIN_IMAGE = './img/project_08/work10.jpg';

        const getGalleryImages = (lang) => {
            const isZh = lang === 'zh';
            return [
                { id: '01', name: isZh ? '遊戲化任務' : 'Gamified Tasks', src: './img/project_08/Home Page daily task.jpg' },
                { id: '02', name: isZh ? '雙軌等級系統' : 'Dual-Track System', src: './img/project_08/My Profile.jpg' },
                { id: '03', name: isZh ? '社群動態牆' : 'Social Moments', src: './img/project_08/follow moment.jpg' },
                { id: '04', name: isZh ? '直播結算' : 'Stream Summary', src: './img/project_08/end live.jpg' }
            ];
        };

        const getEcosystemCategories = (t) => [
            {
                id: 'cat_tasks', title: t('cat_tasks'), images: [
                    { id: '01-01', name: t('img_home'), src: './img/project_08/Home Page.jpg' },
                    { id: '01-02', name: t('img_daily_task'), src: './img/project_08/Home Page daily task.jpg' },
                    { id: '01-03', name: t('img_daily_board'), src: './img/project_08/Home Page daily board.jpg' }
                ]
            },
            {
                id: 'cat_live', title: t('cat_live'), images: [
                    { id: '02-01', name: t('img_gift'), src: './img/project_08/Home Page gift.jpg' },
                    { id: '02-02', name: t('img_store'), src: './img/project_08/Home Page store.jpg' },
                    { id: '02-03', name: t('img_share'), src: './img/project_08/Home Page share.jpg' },
                    { id: '02-04', name: t('img_end_live'), src: './img/project_08/end live.jpg' }
                ]
            },
            {
                id: 'cat_social', title: t('cat_social'), images: [
                    { id: '03-01', name: t('img_follow'), src: './img/project_08/follow.jpg' },
                    { id: '03-02', name: t('img_moment'), src: './img/project_08/follow moment.jpg' },
                    { id: '03-03', name: t('img_moment_2'), src: './img/project_08/follow moment 2.jpg' }
                ]
            },
            {
                id: 'cat_profile', title: t('cat_profile'), images: [
                    { id: '04-01', name: t('img_profile'), src: './img/project_08/My Profile.jpg' },
                    { id: '04-02', name: t('img_self'), src: './img/project_08/self.jpg' },
                    { id: '04-03', name: t('img_rank_con'), src: './img/project_08/My rank Contributor.jpg' },
                    { id: '04-04', name: t('img_rank_broad'), src: './img/project_08/My rank Broadcast.jpg' }
                ]
            }
        ];

        // --- PHONE FRAME ---
        // Kept local (not swapped to shared PhoneFrame): this wrapper's padding,
        // corner radius, and pointer-events treatment differ from the shared
        // version, and the task's replace list only calls out the image-loading
        // primitive, not this outer frame markup.
        const PhoneFrame = ({ src, alt }) => {
            return (
                <div className="w-full h-full flex items-center justify-center pointer-events-none">
                    <div className="relative h-full w-auto max-w-full aspect-[9/19] shadow-2xl overflow-hidden transition-all duration-300 bg-black border-[6px] md:border-[8px] border-[#2d2d2d] rounded-[1.25rem] lg:rounded-[2.5rem]">
                        <ImageWithSkeleton src={src} alt={alt} className="w-full h-full object-cover block" containerClassName="w-full h-full bg-[#1a1a1a]" />
                    </div>
                </div>
            );
        };

        // --- SIMPLE FRAME ---
        const SimpleFrame = ({ src, alt }) => (
            <div className="w-full h-full flex items-center justify-center pointer-events-none ">
                <div className="relative w-full max-w-full h-auto max-h-full flex flex-col items-center justify-center pointer-events-auto">
                    <ImageWithSkeleton src={src} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt={alt} />
                </div>
            </div>
        );

        const App = () => {
            const [lang, setLang] = useState('zh');
            const [loading, setLoading] = useState(true);
            const [loaderStep, setLoaderStep] = useState(0);
            const [loaderDone, setLoaderDone] = useState(false);
            const [activeTab, setActiveTab] = useState('context');
            const [currentImage, setCurrentImage] = useState(MAIN_IMAGE);
            const [activeGalleryId, setActiveGalleryId] = useState('01');
            const [showBackToHero, setShowBackToHero] = useState(false);

            // GSAP State
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
            const touchStartY = useRef(0);
            const [isResizing, setIsResizing] = useState(false);
            const [mobileVisualHeight, setMobileVisualHeight] = useState(35);
            const tabsContainerRef = useRef(null); // Ref for Tabs

            const t = (key) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) ? TRANSLATIONS[lang][key] : key;

            // Direct Data Access (No State)
            const galleryImages = getGalleryImages(lang);
            const ecosystemCategories = getEcosystemCategories((k) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][k]) ? TRANSLATIONS[lang][k] : k);

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
                    preload('./img/project_08/hero_img.webp'),
                    preload(MAIN_IMAGE),
                ]);
                const forceTimeout = new Promise(resolve => setTimeout(resolve, 4000));
                Promise.race([assetsPromise, forceTimeout]).then(() => { setLoaderDone(true); setLoading(false); });

                const setResponsiveFontSize = () => {
                    if (window.innerWidth >= 1024) document.documentElement.style.fontSize = (window.innerWidth / 1920) * 16 + "px";
                    else document.documentElement.style.fontSize = '';
                };
                window.addEventListener('resize', setResponsiveFontSize);
                setResponsiveFontSize();

                return () => window.removeEventListener('resize', setResponsiveFontSize);
            }, []);

            useEffect(() => {
                const stepTimer = setInterval(() => setLoaderStep(i => (i + 1) % 3), 500);
                return () => clearInterval(stepTimer);
            }, []);

            // Mobile Resize Logic
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

            // Tab / Lang Update
            useEffect(() => {
                if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
                if (swipeContentRef.current) gsap.set(swipeContentRef.current, { x: 0, opacity: 1 });

                // Get fresh data refs
                const newGallery = getGalleryImages(lang);
                const newEco = getEcosystemCategories((k) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][k]) ? TRANSLATIONS[lang][k] : k);

                switch (activeTab) {
                    case 'context':
                    case 'process':
                        setCurrentImage(MAIN_IMAGE);
                        setActiveGalleryId(null);
                        break;
                    case 'solution':
                        setCurrentImage(newGallery[0].src);
                        setActiveGalleryId('01');
                        break;
                    case 'climax':
                        setCurrentImage(newEco[0].images[0].src);
                        setActiveGalleryId(newEco[0].images[0].id);
                        break;
                    default:
                        setCurrentImage(MAIN_IMAGE);
                        setActiveGalleryId(null);
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

                // STOP scroll if inside tabs
                if (tabsContainerRef.current && tabsContainerRef.current.contains(e.target)) return;

                const isSplitView = currentSectionIndex === 1;
                const contentEl = contentScrollRef.current;
                if (isSplitView && contentEl) {
                    const { scrollTop, scrollHeight, clientHeight } = contentEl;
                    if (scrollHeight > clientHeight) {
                        if (e.deltaY < 0 && scrollTop <= 0) {
                            // already at top, scrolling up further — let the page scroll
                        } else {
                            if (e.deltaY > 0 && scrollTop + clientHeight < scrollHeight) return;
                            if (e.deltaY < 0 && scrollTop > 0) return;
                        }
                    }
                }
                if (e.deltaY > 0 && currentSectionIndex < sectionsRef.current.length - 1) scrollToSection(currentSectionIndex + 1);
            };

            const handleTouchEnd = (e) => {
                if (isScrollingRef.current || isResizing) return;

                // STOP swipe if inside tabs
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
            const handleGallerySwitch = (imgObj) => { setCurrentImage(imgObj.src); setActiveGalleryId(imgObj.id); };

            const renderVisual = () => {
                if (activeTab === 'solution' || activeTab === 'climax') return <PhoneFrame src={currentImage} alt="Preview" />;
                return <SimpleFrame src={currentImage} alt="Overview" />;
            };

            return (
                <React.Fragment>
                    <div className={`loader ${loading ? '' : 'hidden'}`}><div className="loader-animation"></div><p className="loader-text">{loaderDone ? t('loader_step4') : t(`loader_step${loaderStep + 1}`)}</p></div>

                    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center pointer-events-none">
                        <BackButton prefix="lv" label={t('back_home')} onClick={goBack} />
                    </nav>

                    <ScrollTopButton prefix="lv" visible={showBackToHero} onClick={() => scrollToSection(0)} />

                    <div id="main-scroller" ref={mainContainerRef}>
                        <section ref={heroRef} className="snap-section active-section flex items-center justify-center bg-lv-dark relative hero-bg-custom">
                            <div className="container max-w-7xl mx-auto px-8 z-20">
                                <div className="max-w-5xl text-left">
                                    <div className={`inline-block px-4 py-1 rounded-full border border-lv-primary/50 bg-lv-primary/20 text-lv-primary text-xs font-bold tracking-widest mb-6 ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.1s' }}>SOCIAL LIVE STREAMING APP</div>
                                    <h1 className={`text-5xl lg:text-7xl font-black mb-8 leading-tight text-white drop-shadow-2xl text-left font-heading ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.2s' }}>{t('title_main')}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-lv-primary to-lv-secondary font-heading" dangerouslySetInnerHTML={{ __html: t('title_sub').replace('\n', '<br/>') }}></span></h1>
                                    <h2 className={`text-xl md:text-2xl text-gray-300 font-light mb-12 max-w-2xl mr-auto leading-relaxed drop-shadow-md text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.3s' }}>{t('hero_desc')}</h2>
                                    <HeroCTAButton prefix="lv" shadowClass="shadow-[0_10px_30px_rgba(0,210,160,0.4)]" loading={loading} label={t('btn_explore')} onClick={() => scrollToSection(1)} />
                                </div>
                            </div>
                        </section>

                        <section ref={splitRef} className="snap-section flex flex-col lg:flex-row bg-lv-dark overflow-hidden">
                            <div ref={imageScrollRef} className="w-full shrink-0 z-20 lg:w-3/5 lg:h-full bg-[#1a1a1a] flex flex-col items-center justify-center p-4 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 shadow-2xl relative" style={{ height: window.innerWidth < 1024 ? `${mobileVisualHeight}vh` : '100%', transition: isResizing ? 'none' : 'height 0.3s ease' }}>
                                <div className="absolute top-10 left-10 w-32 h-32 bg-lv-primary/20 blur-[60px] rounded-full"></div>
                                <div className="absolute bottom-10 right-10 w-40 h-40 bg-lv-secondary/20 blur-[60px] rounded-full"></div>
                                <div className="w-full h-full max-w-full flex flex-col items-center justify-center relative">
                                    <div className="relative z-10 transform transition-all duration-500 flex items-center justify-center flex-1 min-h-0 w-full">
                                        <div className="transition-all duration-500 overflow-hidden flex items-center justify-center w-full h-full">
                                            <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
                                                {renderVisual()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ResizeHandle prefix="lv" onMouseDown={handleResizeStart} onTouchStart={handleResizeStart} />
                            </div>

                            <div className="flex-1 w-full relative z-10 lg:w-2/5 lg:h-full flex flex-col h-auto min-h-0">
                                <div className="w-full h-full flex flex-col glass-panel relative min-h-0">
                                    <div className="sticky top-0 bg-lv-dark/95 backdrop-blur-xl z-30 border-b border-white/10 shrink-0">
                                        <div className="p-4 lg:p-8 pb-0 lg:pb-0">
                                            <h2 className="text-xl lg:text-3xl font-bold text-white font-heading mb-1 leading-tight">{t('title_main')}<br />{t('title_sub')}</h2>
                                            <p className="text-gray-400 text-xs lg:text-sm mb-2 lg:mb-4 font-sans">Gamified Social Live Streaming Platform</p>
                                            <TabNav
                                                prefix="lv"
                                                containerRef={tabsContainerRef}
                                                activeTab={activeTab}
                                                onChange={setActiveTab}
                                                tabs={[{ id: 'context', label: t('tab_context') }, { id: 'process', label: t('tab_process') }, { id: 'solution', label: t('tab_solution') }, { id: 'climax', label: t('tab_climax') }]}
                                            />
                                        </div>
                                    </div>

                                    <div ref={contentScrollRef} onTouchStart={handleTabTouchStart} onTouchEnd={handleTabTouchEnd} className="flex-1 overflow-y-auto custom-scroll scroll-content overflow-x-hidden relative">
                                    <div ref={swipeContentRef} className="p-4 lg:p-8 pb-24">
                                        {activeTab === 'context' && (
                                            <div className="space-y-8 lg:space-y-12 animate-fadeIn">
                                                <div className="space-y-4 lg:space-y-6">
                                                    <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('context_title')}</h3>
                                                    <p className="text-gray-300 text-sm leading-relaxed mb-4">{t('context_desc')}</p>
                                                    <InfoGrid>
                                                        <InfoCard><div className="text-xs text-gray-500 uppercase mb-1">{t('role_title')}</div><div className="font-bold text-white">{t('role_name')}</div></InfoCard>
                                                        <InfoCard>
                                                            <div className="text-xs text-gray-500 uppercase mb-2">{t('tools')}</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <ToolPill prefix="lv" color="primary" icon={<SharedIcons.XD />} label="Adobe XD" />
                                                                <ToolPill prefix="lv" color="secondary" icon={<SharedIcons.AI />} label="Illustrator" />
                                                            </div>
                                                        </InfoCard>
                                                    </InfoGrid>
                                                </div>
                                                <div className="w-full h-px bg-white/10"></div>
                                                <div className="space-y-6">
                                                    <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-lv-secondary rounded-full mr-3"></span>{t('visual_strat_title')}</h3>
                                                    <div className="feature-card p-5"><ul className="space-y-4 text-gray-300"><li className="flex items-start text-sm text-gray-400"><span className="text-lv-primary mr-3 mt-1"><i className="ph ph-palette"></i></span><div><strong className="text-gray-200 block text-sm">{t('visual_p1_title')}</strong>{t('visual_p1_desc')}</div></li><li className="flex items-start text-sm text-gray-400"><span className="text-lv-primary mr-3 mt-1"><i className="ph ph-game-controller"></i></span><div><strong className="text-gray-200 block text-sm">{t('visual_p2_title')}</strong>{t('visual_p2_desc')}</div></li><li className="flex items-start text-sm text-gray-400"><span className="text-lv-primary mr-3 mt-1"><i className="ph ph-fingerprint"></i></span><div><strong className="text-gray-200 block text-sm">{t('visual_p3_title')}</strong>{t('visual_p3_desc')}</div></li></ul></div>
                                                </div>
                                            </div>
                                        )}
                                        {activeTab === 'process' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2">{t('process_title')}</h3>
                                                <p className="text-xs text-gray-400 mb-6">{t('process_sub')}</p>
                                                <ProcessTimeline
                                                    prefix="lv"
                                                    glowShadowClass="shadow-[0_0_10px_rgba(0,210,160,0.5)]"
                                                    steps={[
                                                        { title: t('proc_1_title'), desc: t('proc_1_desc') },
                                                        { title: t('proc_2_title'), desc: t('proc_2_desc') },
                                                        { title: t('proc_3_title'), desc: t('proc_3_desc') },
                                                        { title: t('proc_4_title'), desc: t('proc_4_desc') },
                                                    ]}
                                                />
                                            </div>
                                        )}
                                        {activeTab === 'solution' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-6">{t('sol_title')}</h3>
                                                <div className="space-y-4">
                                                    <FeatureCard prefix="lv" active={activeGalleryId === '01'} onClick={() => handleGallerySwitch(galleryImages[0])} icon={<Icons.Game />} title={t('feat_1_title')} desc={t('feat_1_desc')} activeShadowClass="shadow-[0_0_15px_rgba(0,210,160,0.1)]" />
                                                    <FeatureCard prefix="lv" active={activeGalleryId === '03'} onClick={() => handleGallerySwitch(galleryImages[2])} icon={<Icons.Social />} title={t('feat_2_title')} desc={t('feat_2_desc')} activeShadowClass="shadow-[0_0_15px_rgba(0,210,160,0.1)]" />
                                                    <FeatureCard prefix="lv" active={activeGalleryId === '02'} onClick={() => handleGallerySwitch(galleryImages[1])} icon={<Icons.Rank />} title={t('feat_3_title')} desc={t('feat_3_desc')} activeShadowClass="shadow-[0_0_15px_rgba(0,210,160,0.1)]" />
                                                </div>
                                            </div>
                                        )}
                                        {activeTab === 'climax' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn pb-12">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('climax_title')}</h3>
                                                <p className="text-gray-400 mb-8 text-sm">{t('climax_desc')}</p>
                                                <div className="space-y-6">
                                                    {ecosystemCategories.map((category) => (
                                                        <div key={category.id} className="space-y-3">
                                                            <h4 className="text-lv-primary font-bold text-md flex items-center"><span className="w-2 h-2 rounded-full bg-lv-primary mr-2"></span>{category.title}</h4>
                                                            <div className="grid gap-3 pl-4 border-l border-white/10">
                                                                {category.images.map((img) => (
                                                                    <GalleryItemButton
                                                                        key={img.id}
                                                                        prefix="lv"
                                                                        active={activeGalleryId === img.id}
                                                                        onClick={() => handleGallerySwitch(img)}
                                                                        id={img.id}
                                                                        name={img.name}
                                                                        activeShadowClass="shadow-[0_0_15px_rgba(0,210,160,0.1)]"
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
                                                <div className="space-y-4 lg:space-y-6">
                                                    <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('context_title')}</h3>
                                                    <p className="text-gray-300 text-sm leading-relaxed mb-4">{t('context_desc')}</p>
                                                    <InfoGrid>
                                                        <InfoCard><div className="text-xs text-gray-500 uppercase mb-1">{t('role_title')}</div><div className="font-bold text-white">{t('role_name')}</div></InfoCard>
                                                        <InfoCard>
                                                            <div className="text-xs text-gray-500 uppercase mb-2">{t('tools')}</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <ToolPill prefix="lv" color="primary" icon={<SharedIcons.XD />} label="Adobe XD" />
                                                                <ToolPill prefix="lv" color="secondary" icon={<SharedIcons.AI />} label="Illustrator" />
                                                            </div>
                                                        </InfoCard>
                                                    </InfoGrid>
                                                </div>
                                                <div className="w-full h-px bg-white/10"></div>
                                                <div className="space-y-6">
                                                    <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-lv-secondary rounded-full mr-3"></span>{t('visual_strat_title')}</h3>
                                                    <div className="feature-card p-5"><ul className="space-y-4 text-gray-300"><li className="flex items-start text-sm text-gray-400"><span className="text-lv-primary mr-3 mt-1"><i className="ph ph-palette"></i></span><div><strong className="text-gray-200 block text-sm">{t('visual_p1_title')}</strong>{t('visual_p1_desc')}</div></li><li className="flex items-start text-sm text-gray-400"><span className="text-lv-primary mr-3 mt-1"><i className="ph ph-game-controller"></i></span><div><strong className="text-gray-200 block text-sm">{t('visual_p2_title')}</strong>{t('visual_p2_desc')}</div></li><li className="flex items-start text-sm text-gray-400"><span className="text-lv-primary mr-3 mt-1"><i className="ph ph-fingerprint"></i></span><div><strong className="text-gray-200 block text-sm">{t('visual_p3_title')}</strong>{t('visual_p3_desc')}</div></li></ul></div>
                                                </div>
                                            </div>
                                        )}
                                        {peekTab === 'process' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2">{t('process_title')}</h3>
                                                <p className="text-xs text-gray-400 mb-6">{t('process_sub')}</p>
                                                <ProcessTimeline
                                                    prefix="lv"
                                                    glowShadowClass="shadow-[0_0_10px_rgba(0,210,160,0.5)]"
                                                    steps={[
                                                        { title: t('proc_1_title'), desc: t('proc_1_desc') },
                                                        { title: t('proc_2_title'), desc: t('proc_2_desc') },
                                                        { title: t('proc_3_title'), desc: t('proc_3_desc') },
                                                        { title: t('proc_4_title'), desc: t('proc_4_desc') },
                                                    ]}
                                                />
                                            </div>
                                        )}
                                        {peekTab === 'solution' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-6">{t('sol_title')}</h3>
                                                <div className="space-y-4">
                                                    <FeatureCard prefix="lv" active={activeGalleryId === '01'} onClick={() => handleGallerySwitch(galleryImages[0])} icon={<Icons.Game />} title={t('feat_1_title')} desc={t('feat_1_desc')} activeShadowClass="shadow-[0_0_15px_rgba(0,210,160,0.1)]" />
                                                    <FeatureCard prefix="lv" active={activeGalleryId === '03'} onClick={() => handleGallerySwitch(galleryImages[2])} icon={<Icons.Social />} title={t('feat_2_title')} desc={t('feat_2_desc')} activeShadowClass="shadow-[0_0_15px_rgba(0,210,160,0.1)]" />
                                                    <FeatureCard prefix="lv" active={activeGalleryId === '02'} onClick={() => handleGallerySwitch(galleryImages[1])} icon={<Icons.Rank />} title={t('feat_3_title')} desc={t('feat_3_desc')} activeShadowClass="shadow-[0_0_15px_rgba(0,210,160,0.1)]" />
                                                </div>
                                            </div>
                                        )}
                                        {peekTab === 'climax' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn pb-12">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('climax_title')}</h3>
                                                <p className="text-gray-400 mb-8 text-sm">{t('climax_desc')}</p>
                                                <div className="space-y-6">
                                                    {ecosystemCategories.map((category) => (
                                                        <div key={category.id} className="space-y-3">
                                                            <h4 className="text-lv-primary font-bold text-md flex items-center"><span className="w-2 h-2 rounded-full bg-lv-primary mr-2"></span>{category.title}</h4>
                                                            <div className="grid gap-3 pl-4 border-l border-white/10">
                                                                {category.images.map((img) => (
                                                                    <GalleryItemButton
                                                                        key={img.id}
                                                                        prefix="lv"
                                                                        active={activeGalleryId === img.id}
                                                                        onClick={() => handleGallerySwitch(img)}
                                                                        id={img.id}
                                                                        name={img.name}
                                                                        activeShadowClass="shadow-[0_0_15px_rgba(0,210,160,0.1)]"
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
