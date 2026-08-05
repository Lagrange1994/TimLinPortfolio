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

// --- 1. 多語言資料庫 ---
        const TRANSLATIONS = {
            zh: {
                loader_step1: "讀取專案中繼資料",
                loader_step2: "載入視覺素材",
                loader_step3: "建構渲染畫布",
                loader_step4: "初始化完成",
                title_main: "高雄市警察局",
                title_sub: "新世代智慧科技辦案系統",
                hero_desc: "如果說 AI 是大腦，這套系統就是免疫系統。從「環境感知」轉向「系統維運」，打造確保辦案工具隨時可用的後勤中樞。",
                btn_explore: "探索設計旅程",
                tab_context: "01. 背景與痛點",
                tab_process: "02. 流程",
                tab_solution: "03. 方案",
                tab_climax: "04. 成果",
                context_title: "專案背景 Context",
                context_desc: "本專案與前期的差異在於「核心目標的轉移」。我們移除了非警務核心的淹水監測功能，將 UX 重點轉向「設備妥善率管理」。在數位辦案時代，如果攝影機故障或伺服器崩潰，再強大的 AI 都無用武之地。因此，我們不僅設計監控介面，更打造了一套透明化的後勤維運系統。",
                role_title: "My Role",
                role_name: "UI 設計師",
                pain_title: "痛點與挑戰 The Conflict",
                pain_sub: "當設備故障成為辦案阻礙",
                pain_1_title: "維修黑箱作業",
                pain_1_desc: "傳統報修進度不明，員警無法得知設備何時修復。",
                pain_2_title: "系統健康度未知",
                pain_2_desc: "調閱關鍵畫面時才發現攝影機已斷線或畫面遮擋。",
                pain_3_title: "行政流程內耗",
                pain_3_desc: "缺乏標準化表單，來回溝通成本極高。",
                process_title: "設計流程 Design Process",
                process_sub: "從使用者訪談到行政流程優化",
                process_1_title: "01. 需求收斂 (Scope Definition)",
                process_1_desc: "與業主確認移除「淹水監測」等非核心功能，將資源集中於「設備妥善率」與「刑偵輔助」，確立了由「戰情室風格」轉向「清爽管理後台」的視覺策略。",
                process_2_title: "02. 流程邏輯設計 (Workflow Logic)",
                process_2_desc: "繪製維修通報的狀態流程圖 (State Flow)，定義「表單送出 > 廠商接單 > 維修中 > 完修」的五大節點與時間戳記邏輯，確保行政責任歸屬明確。",
                process_3_title: "03. 介面設計 (UI Design)",
                process_3_desc: "採用高亮度的淺色卡片設計 (Light Dashboard)，搭配紅綠燈號概念，讓管理者能一眼掃視上百台伺服器與攝影機的健康狀態，減輕長時間監控的視覺負擔。",
                process_4_title: "04. 標準化交付 (Standardization)",
                process_4_desc: "建立標準化的報修表單規範，包含設備編號自動帶入、故障類型下拉選單等，降低人為輸入錯誤。",
                solution_title: "解決方案 The Solution",
                gallery_title: "介面展示 Gallery",
                gallery_desc: "重點展示：系統監控儀表板、GIS 地圖與維修流程。",
                back_home: "Back to Portfolio"
            },
            en: {
                loader_step1: "Reading project metadata",
                loader_step2: "Loading visual assets",
                loader_step3: "Constructing render canvas",
                loader_step4: "Initialization complete",
                title_main: "Kaohsiung City Police",
                title_sub: "Next-Gen Smart Investigation System",
                hero_desc: "If AI is the brain, this system is the immune system. Shifting focus from 'Environmental Sensing' to 'System Maintenance', creating a logistics hub ensuring investigation tools are always ready.",
                btn_explore: "Explore the Journey",
                tab_context: "01. Context",
                tab_process: "02. Process",
                tab_solution: "03. Solution",
                tab_climax: "04. Gallery",
                context_title: "Context",
                context_desc: "The core goal shifted for this project. We removed non-core flood monitoring to focus UX on 'Device Reliability Management'. In the digital era, if cameras fail, even the best AI is useless. We designed not just a monitoring interface, but a transparent logistics maintenance system.",
                role_title: "My Role",
                role_name: "UI Designer",
                pain_title: "Pain Points & Challenges",
                pain_sub: "When device failure hinders investigation",
                pain_1_title: "Opaque Maintenance",
                pain_1_desc: "Traditional reporting is unclear; officers don't know when devices will be fixed.",
                pain_2_title: "Unknown Health",
                pain_2_desc: "Discovering camera disconnection or occlusion only when footage is needed.",
                pain_3_title: "Admin Inefficiency",
                pain_3_desc: "Lack of standardized forms leads to extremely high communication costs.",
                process_title: "Design Process",
                process_sub: "From User Interviews to Workflow Optimization",
                process_1_title: "01. Scope Definition",
                process_1_desc: "Confirmed removal of non-core features to focus resources on 'Reliability' and 'Investigation Support', establishing a visual strategy shift from 'War Room' to 'Clean Management Dashboard'.",
                process_2_title: "02. Workflow Logic",
                process_2_desc: "Mapped the maintenance reporting state flow, defining 5 key nodes (Submitted > Accepted > Repairing > Completed) and timestamps to ensure clear administrative accountability.",
                process_3_title: "03. UI Design",
                process_3_desc: "Adopted a high-brightness Light Dashboard design with traffic light color coding, allowing managers to scan the status of hundreds of servers and cameras at a glance.",
                process_4_title: "04. Standardization",
                process_4_desc: "Established standardized reporting forms, including auto-filled device IDs and dropdown fault types, reducing human input errors.",
                solution_title: "The Solution",
                gallery_title: "Gallery",
                gallery_desc: "Highlights: System Monitoring Dashboard, GIS Map, and Maintenance Workflow.",
                back_home: "Back to Portfolio"
            }
        };

        // Icons
        const Icons = {
            Tools: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>,
            Server: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>,
            Timeline: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            List: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
            Camera: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        };

        const getSolutionFeatures = (lang) => {
            const isZh = lang === 'zh';
            return [
                { id: 'sol-01', title: isZh ? '硬體健康度監控看板' : 'Hardware Health Monitor', desc: isZh ? '將 CPU/GPU 負載與 IoT 設備的 Ping 值連線狀態可視化。管理者在調閱畫面失敗前，即可先一步發現異常。' : 'Visualizes CPU/GPU load and IoT device Ping status. Managers can detect anomalies before footage retrieval fails.', icon: 'Server', image: './img/project_03/工作區域 1@2x.jpg', benefit: isZh ? 'Benefit: 確保 AI 運算資源與前端攝影機的戰備狀態。' : 'Benefit: Ensures readiness of AI resources and cameras.' },
                { id: 'sol-02', title: isZh ? '全透明維修履歷' : 'Transparent Repair Log', desc: isZh ? '將傳統電話叫修轉化為「可視化進度條」。清楚記錄表單送出、廠商接單、維修中到結案的每一個時間節點。' : 'Transforms phone calls into a "visual progress bar". Logs every node from submission, acceptance, repair to closure.', icon: 'Timeline', image: './img/project_03/工作區域 4@2x.jpg', benefit: isZh ? 'Benefit: 釐清行政責任，大幅減少內部溝通內耗。' : 'Benefit: Clarifies accountability, reducing internal friction.' },
                { id: 'sol-03', title: isZh ? '標準化報修流程' : 'Standardized Reporting', desc: isZh ? '結構化的通報表單設計，引導第一線員警準確填寫設備編號與故障類型，降低誤報率。' : 'Structured form design guides officers to accurately enter device IDs and fault types, reducing false reports.', icon: 'List', image: './img/project_03/工作區域 12@2x.jpg', benefit: isZh ? 'Benefit: 提升報修資訊準確度，加速廠商處理效率。' : 'Benefit: Increases accuracy and vendor processing speed.' },
                { id: 'sol-04', title: isZh ? '路口設備整合調閱' : 'Integrated Intersection View', desc: isZh ? '在地圖上點擊路口，即顯示該節點所有向度的攝影機狀態與畫面，實現直覺化的 GIS 空間管理。' : 'Clicking an intersection on the map shows status and footage of all cameras at that node for intuitive GIS management.', icon: 'Camera', image: './img/project_03/工作區域 8@2x.jpg', benefit: isZh ? 'Benefit: 直覺化的路口即時調閱與狀態檢視。' : 'Benefit: Intuitive real-time monitoring and status check.' }
            ];
        };

        const getGalleryCategories = (lang) => {
            const isZh = lang === 'zh';
            return [
                { id: 'cat_health', title: isZh ? '系統健康度與維運' : 'System Health & Ops', images: [{ id: '01-01', name: isZh ? '營運監控 Dashboard' : 'Ops Dashboard', src: './img/project_03/工作區域 1@2x.jpg' }, { id: '01-02', name: isZh ? '維修通報流程追蹤' : 'Repair Tracking', src: './img/project_03/工作區域 4@2x.jpg' }, { id: '01-03', name: isZh ? '通報列表管理' : 'Report List', src: './img/project_03/工作區域 6@2x.jpg' }, { id: '01-04', name: isZh ? '已登記尋車列表' : 'Registered Search List', src: './img/project_03/工作區域 5@2x.jpg' }] },
                { id: 'cat_surveillance', title: isZh ? 'GIS 與影像監控' : 'GIS & Surveillance', images: [{ id: '02-01', name: isZh ? '路口設備狀態整合' : 'Device Integration', src: './img/project_03/工作區域 8@2x.jpg' }, { id: '02-02', name: isZh ? '全區域地圖監控' : 'Area Map Monitor', src: './img/project_03/工作區域 7@2x.jpg' }, { id: '02-03', name: isZh ? 'AI 影像辨識畫面' : 'AI Recognition View', src: './img/project_03/工作區域 11@2x.jpg' }] },
                { id: 'cat_search', title: isZh ? '車牌辨識與查詢' : 'LPR & Query', images: [{ id: '03-01', name: isZh ? '車牌模糊搜尋' : 'Fuzzy Plate Search', src: './img/project_03/工作區域 2@2x.jpg' }, { id: '03-02', name: '辨識結果彈窗', name: isZh ? 'Recognition Result' : 'Recognition Result', src: './img/project_03/工作區域 3@2x.jpg' }] }
            ];
        };

        const App = () => {
            const [lang, setLang] = useState('zh');
            const [solutionFeatures, setSolutionFeatures] = useState([]);
            const [galleryCategories, setGalleryCategories] = useState([]);

            const [loading, setLoading] = useState(true);
            const [loaderStep, setLoaderStep] = useState(0);
            const [loaderDone, setLoaderDone] = useState(false);
            const [activeTab, setActiveTab] = useState('context');

            const [currentImage, setCurrentImage] = useState('./img/project_03/display.jpg');
            const [activeGalleryId, setActiveGalleryId] = useState(null);
            const [activeSolutionId, setActiveSolutionId] = useState(null);
            const [showBackToHero, setShowBackToHero] = useState(false);

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
            const heroRef = useRef(null);
            const splitRef = useRef(null);
            const tabsContainerRef = useRef(null);

            const t = (key) => TRANSLATIONS[lang][key] || key;

            useEffect(() => {
                const savedLang = localStorage.getItem('lang');
                const initialLang = savedLang === 'en' ? 'en' : 'zh';
                setLang(initialLang);
                document.documentElement.lang = initialLang === 'zh' ? 'zh-TW' : 'en';

                const features = getSolutionFeatures(initialLang);
                const galleries = getGalleryCategories(initialLang);
                setSolutionFeatures(features);
                setGalleryCategories(galleries);

                const setResponsiveFontSize = () => {
                    const minDesktopWidth = 1024;
                    const currentWidth = window.innerWidth;
                    if (currentWidth >= minDesktopWidth) {
                        const baseWidth = 1920;
                        const baseFontSize = 16;
                        const newFontSize = (currentWidth / baseWidth) * baseFontSize;
                        document.documentElement.style.fontSize = newFontSize + "px";
                    } else {
                        document.documentElement.style.fontSize = '';
                    }
                };

                window.addEventListener('resize', setResponsiveFontSize);
                setResponsiveFontSize();

                return () => window.removeEventListener('resize', setResponsiveFontSize);
            }, []);

            useEffect(() => {
                const preload = (src) => new Promise((resolve) => {
                    const img = new Image();
                    img.src = src;
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                });
                const assetsPromise = Promise.all([
                    preload('./img/project_03/hero_img.webp'),
                    preload('./img/project_03/display.webp'),
                ]);
                const forceTimeout = new Promise(resolve => setTimeout(resolve, 4000));
                Promise.race([assetsPromise, forceTimeout]).then(() => { setLoaderDone(true); setLoading(false); });
            }, []);

            useEffect(() => {
                const stepTimer = setInterval(() => setLoaderStep(i => (i + 1) % 3), 500);
                return () => clearInterval(stepTimer);
            }, []);

            useEffect(() => {
                sectionsRef.current = [heroRef.current, splitRef.current];
                if (sectionsRef.current[0]) sectionsRef.current[0].classList.add('active-section');
            }, [loading]);

            useEffect(() => {
                if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
                if (swipeContentRef.current) gsap.set(swipeContentRef.current, { x: 0, opacity: 1 });

                const currentFeatures = getSolutionFeatures(lang);
                const currentGalleries = getGalleryCategories(lang);

                setSolutionFeatures(currentFeatures);
                setGalleryCategories(currentGalleries);

                switch (activeTab) {
                    case 'context':
                    case 'process':
                        setCurrentImage('./img/project_03/display.jpg');
                        setActiveGalleryId(null);
                        setActiveSolutionId(null);
                        break;
                    case 'solution':
                        setCurrentImage(currentFeatures[0].image);
                        setActiveSolutionId(currentFeatures[0].id);
                        setActiveGalleryId(null);
                        break;
                    case 'climax': {
                        const firstImg = currentGalleries[0].images[0];
                        setCurrentImage(firstImg.src);
                        setActiveGalleryId(firstImg.id);
                        setActiveSolutionId(null);
                        break;
                    }
                }
            }, [activeTab, lang]);

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
                        if (currentSection !== targetSection) { currentSection.classList.remove('active-section'); }
                        targetSection.classList.add('active-section');
                    }
                });

                if (currentSectionIndex !== index) {
                    tl.to(currentSection, { opacity: 0, duration: 0.8, ease: "power2.out" });
                }

                tl.to(mainContainerRef.current, { scrollTo: { y: targetSection.offsetTop, autoKill: false }, duration: 1.2, ease: "power2.inOut" }, "<");
                tl.to(targetSection, {
                    opacity: 1, duration: 1, onStart: () => {
                        targetSection.classList.add('active-section'); targetSection.style.visibility = 'visible';
                    }
                }, "-=0.8");
            };

            const handleWheel = (e) => {
                if (tabsContainerRef.current && tabsContainerRef.current.contains(e.target)) return;
                const isSplitView = currentSectionIndex === 1;
                const contentEl = contentScrollRef.current;
                if (isSplitView && contentEl) {
                    const { scrollTop, scrollHeight, clientHeight } = contentEl;
                    if (e.deltaY < 0 && scrollTop <= 0) return;
                    if (scrollHeight > clientHeight && e.deltaY > 0 && scrollTop + clientHeight < scrollHeight) return;
                }
                if (isScrollingRef.current) return;
                if (e.deltaY > 0 && currentSectionIndex < sectionsRef.current.length - 1) scrollToSection(currentSectionIndex + 1);
            };

            const touchStartY = useRef(0);
            const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
            const handleTouchEnd = (e) => {
                if (isScrollingRef.current) return;
                if (tabsContainerRef.current && tabsContainerRef.current.contains(e.target)) return;
                const touchEndY = e.changedTouches[0].clientY;
                const diff = touchStartY.current - touchEndY;
                const isSplitView = currentSectionIndex === 1;
                const contentEl = contentScrollRef.current;
                const isInsideContent = contentEl && contentEl.contains(e.target);
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        if (isSplitView && isInsideContent) {
                            const { scrollTop, scrollHeight, clientHeight } = contentEl;
                            if (scrollHeight > clientHeight && scrollTop + clientHeight < scrollHeight - 5) return;
                        }
                        if (currentSectionIndex < sectionsRef.current.length - 1) scrollToSection(currentSectionIndex + 1);
                    }
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

            const handleGallerySwitch = (imgObj) => { setCurrentImage(imgObj.src); setActiveGalleryId(imgObj.id); };
            const handleSolutionSwitch = (solObj) => { setCurrentImage(solObj.image); setActiveSolutionId(solObj.id); };
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
                        <BackButton prefix="kh" label={t('back_home')} onClick={goBack} />
                    </nav>

                    <ScrollTopButton prefix="kh" visible={showBackToHero} onClick={() => scrollToSection(0)} />

                    <div id="main-scroller" ref={mainContainerRef}>
                        {/* [修改] bg-dark -> bg-kh-dark */}
                        <section id="hero" ref={heroRef} className="snap-section active-section flex items-center justify-center bg-kh-dark hero-bg-custom">
                            <div className="container max-w-7xl mx-auto px-8 z-20">
                                <div className="max-w-5xl text-left">
                                    <div className={`inline-block px-4 py-1 rounded-full border border-white bg-black/20 text-white text-xs font-bold tracking-widest mb-6 ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.1s' }}>System Reliability & Logistics</div>
                                    <h1 className={`text-5xl lg:text-7xl font-heading font-black mb-8 leading-tight text-white drop-shadow-2xl text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.2s' }}>
                                        {/* [修改] from-primary -> from-kh-primary */}
                                        {t('title_main')}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-kh-primary to-accent" dangerouslySetInnerHTML={{ __html: t('title_sub').replace('\n', '<br/>') }}></span>
                                    </h1>
                                    <h2 className={`text-xl md:text-2xl text-gray-300 font-light mb-12 max-w-2xl mr-auto leading-relaxed drop-shadow-md text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.3s' }}>{t('hero_desc')}</h2>
                                    <HeroCTAButton prefix="kh" shadowClass="shadow-[0_10px_30px_rgba(0,168,232,0.4)]" loading={loading} label={t('btn_explore')} onClick={() => scrollToSection(1)} />
                                </div>
                            </div>
                        </section>

                        {/* [修改] bg-dark -> bg-kh-dark */}
                        <section id="split-view" ref={splitRef} className="snap-section flex flex-col lg:flex-row bg-kh-dark overflow-hidden">
                            <div className="w-full shrink-0 z-20 lg:w-3/5 lg:h-full bg-[#1a1a1a] flex items-center justify-center p-4 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 shadow-2xl">
                                <div className="w-full h-[35vh] lg:h-full flex items-center justify-center">
                                    {/* [修改] bg-dark-light -> bg-kh-dark-light */}
                                    <div className="relative w-full max-w-full max-h-full lg:max-h-[90%] bg-kh-dark-light rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                                        {(activeTab === 'solution' || activeTab === 'climax') && <BrowserFrame />}
                                        <ImageWithSkeleton src={currentImage} alt="Preview" containerClassName="relative bg-white/5 group h-full w-full" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 w-full relative z-10 lg:w-2/5 lg:h-full flex flex-col h-auto min-h-0">
                                <div className="w-full h-full flex flex-col glass-panel relative min-h-0">
                                    {/* [修改] bg-dark/95 -> bg-kh-dark/95 */}
                                    <div className="sticky top-0 bg-kh-dark/95 backdrop-blur-xl z-30 border-b border-white/10 shrink-0">
                                        <div className="p-4 lg:p-8 pb-0 lg:pb-0">
                                            <h2 className="text-xl lg:text-3xl font-bold text-white font-heading mb-1 leading-tight">{t('title_main')}<br />{t('title_sub')}</h2>
                                            <p className="text-gray-400 text-xs lg:text-sm mb-2 lg:mb-4">New Generation Smart Technology Investigation System</p>

                                            <TabNav
                                                prefix="kh"
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
                                                            <div className="text-xs text-gray-500 uppercase mb-2">Tools</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <ToolPill prefix="kh" color="primary" icon={<SharedIcons.Figma />} label="Figma" />
                                                                <ToolPill prefix="kh" color="secondary" icon={<SharedIcons.AI />} label="Illustrator" />
                                                            </div>
                                                        </InfoCard>
                                                    </InfoGrid>
                                                </div>
                                                <div className="w-full h-px bg-white/10"></div>
                                                <div className="space-y-6">
                                                    <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-kh-secondary rounded-full mr-3"></span>{t('pain_title')}</h3>
                                                    <PainPointCard
                                                        prefix="kh"
                                                        subtitle={t('pain_sub')}
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
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('process_title')}</h3>
                                                <p className="text-xs text-gray-400 mb-6">{t('process_sub')}</p>
                                                <ProcessTimeline
                                                    prefix="kh"
                                                    glowShadowClass="shadow-[0_0_10px_rgba(0,168,232,0.5)]"
                                                    steps={[
                                                        { title: t('process_1_title'), desc: t('process_1_desc') },
                                                        { title: t('process_2_title'), desc: t('process_2_desc') },
                                                        { title: t('process_3_title'), desc: t('process_3_desc') },
                                                        { title: t('process_4_title'), desc: t('process_4_desc') },
                                                    ]}
                                                />
                                            </div>
                                        )}

                                        {activeTab === 'solution' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('solution_title')}</h3>
                                                <div className="space-y-4">
                                                    {solutionFeatures.map((sol) => {
                                                        const IconComp = Icons[sol.icon];
                                                        return (
                                                            <FeatureCard
                                                                key={sol.id}
                                                                prefix="kh"
                                                                active={activeSolutionId === sol.id}
                                                                onClick={() => handleSolutionSwitch(sol)}
                                                                icon={<IconComp />}
                                                                title={sol.title}
                                                                desc={sol.desc}
                                                                benefit={sol.benefit}
                                                                activeShadowClass="shadow-[0_0_15px_rgba(0,168,232,0.1)]"
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'climax' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn pb-12">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('gallery_title')}</h3>
                                                <p className="text-gray-400 mb-8 text-sm">{t('gallery_desc')}</p>
                                                <div className="space-y-6">
                                                    {galleryCategories.map((category) => (
                                                        <div key={category.id} className="space-y-3">
                                                            <h4 className="text-kh-primary font-bold text-md flex items-center"><span className="w-2 h-2 rounded-full bg-kh-primary mr-2"></span>{category.title}</h4>
                                                            <div className="grid gap-3 pl-4 border-l border-white/10">
                                                                {category.images.map((img) => (
                                                                    <GalleryItemButton
                                                                        key={img.id}
                                                                        prefix="kh"
                                                                        active={activeGalleryId === img.id}
                                                                        onClick={() => handleGallerySwitch(img)}
                                                                        id={img.id}
                                                                        name={img.name}
                                                                        activeShadowClass="shadow-[0_0_15px_rgba(0,168,232,0.1)]"
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    
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
                                                            <div className="text-xs text-gray-500 uppercase mb-2">Tools</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <ToolPill prefix="kh" color="primary" icon={<SharedIcons.Figma />} label="Figma" />
                                                                <ToolPill prefix="kh" color="secondary" icon={<SharedIcons.AI />} label="Illustrator" />
                                                            </div>
                                                        </InfoCard>
                                                    </InfoGrid>
                                                </div>
                                                <div className="w-full h-px bg-white/10"></div>
                                                <div className="space-y-6">
                                                    <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-kh-secondary rounded-full mr-3"></span>{t('pain_title')}</h3>
                                                    <PainPointCard
                                                        prefix="kh"
                                                        subtitle={t('pain_sub')}
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
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('process_title')}</h3>
                                                <p className="text-xs text-gray-400 mb-6">{t('process_sub')}</p>
                                                <ProcessTimeline
                                                    prefix="kh"
                                                    glowShadowClass="shadow-[0_0_10px_rgba(0,168,232,0.5)]"
                                                    steps={[
                                                        { title: t('process_1_title'), desc: t('process_1_desc') },
                                                        { title: t('process_2_title'), desc: t('process_2_desc') },
                                                        { title: t('process_3_title'), desc: t('process_3_desc') },
                                                        { title: t('process_4_title'), desc: t('process_4_desc') },
                                                    ]}
                                                />
                                            </div>
                                        )}

                                        {peekTab === 'solution' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('solution_title')}</h3>
                                                <div className="space-y-4">
                                                    {solutionFeatures.map((sol) => {
                                                        const IconComp = Icons[sol.icon];
                                                        return (
                                                            <FeatureCard
                                                                key={sol.id}
                                                                prefix="kh"
                                                                active={activeSolutionId === sol.id}
                                                                onClick={() => handleSolutionSwitch(sol)}
                                                                icon={<IconComp />}
                                                                title={sol.title}
                                                                desc={sol.desc}
                                                                benefit={sol.benefit}
                                                                activeShadowClass="shadow-[0_0_15px_rgba(0,168,232,0.1)]"
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {peekTab === 'climax' && (
                                            <div className="space-y-6 lg:space-y-8 animate-fadeIn pb-12">
                                                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4">{t('gallery_title')}</h3>
                                                <p className="text-gray-400 mb-8 text-sm">{t('gallery_desc')}</p>
                                                <div className="space-y-6">
                                                    {galleryCategories.map((category) => (
                                                        <div key={category.id} className="space-y-3">
                                                            <h4 className="text-kh-primary font-bold text-md flex items-center"><span className="w-2 h-2 rounded-full bg-kh-primary mr-2"></span>{category.title}</h4>
                                                            <div className="grid gap-3 pl-4 border-l border-white/10">
                                                                {category.images.map((img) => (
                                                                    <GalleryItemButton
                                                                        key={img.id}
                                                                        prefix="kh"
                                                                        active={activeGalleryId === img.id}
                                                                        onClick={() => handleGallerySwitch(img)}
                                                                        id={img.id}
                                                                        name={img.name}
                                                                        activeShadowClass="shadow-[0_0_15px_rgba(0,168,232,0.1)]"
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    
                                    
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
