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

// === 1. 多語言資料庫 ===
        const TRANSLATIONS = {
            zh: {
                loader_step1: "讀取專案中繼資料",
                loader_step2: "載入視覺素材",
                loader_step3: "建構渲染畫布",
                loader_step4: "初始化完成",
                title_main: "新竹縣警察局",
                title_sub: "雲端智慧影像分析系統",
                hero_desc: "將城市之眼轉化為破案大腦，結合 GIS 空間邏輯與 AI 影像辨識，打造直覺化的警用情資指揮中樞。",
                btn_explore: "探索設計旅程",
                tab_context: "01. 背景與痛點",
                tab_process: "02. 流程",
                tab_solution: "03. 方案",
                tab_climax: "04. 成果",
                context_title: "專案背景 Context",
                context_desc: "面對日益增長的城市監控數據，傳統的警用系統面臨「數據孤島」的困境。本專案旨在建立一個整合 GIS 空間邏輯與 AI 影像辨識的指揮中樞，將分散的數千支攝影機轉化為可搜尋、可追蹤、可預警的智慧資產。",
                role_title: "My Role",
                role_name: "UI 設計師",
                pain_title: "痛點與挑戰 The Conflict",
                pain_sub: "當海量影像成為辦案負擔",
                pain_1_title: "數據超載",
                pain_1_desc: "員警需在海量錄影中大海撈針，缺乏有效的過濾機制。",
                pain_2_title: "被動監控",
                pain_2_desc: "系統僅能錄影，無法主動識別嫌疑車輛或異常行為。",
                pain_3_title: "關聯性薄弱",
                pain_3_desc: "設備狀態與監控畫面分離，故障排除與調閱效率低落。",
                process_title: "開發流程 Development Process",
                process_sub: "以使用者為中心的軟體開發生命週期",
                process_1_title: "01. 需求分析與場勘 (Requirement & Field Study)",
                process_1_desc: "深入刑偵單位進行用戶訪談，了解辦案邏輯（如共犯追蹤、電子圍籬）。並實地走訪勤務指揮中心進行現場場勘研究，觀察員警在低光源環境下的操作習慣與多螢幕配置需求。",
                process_2_title: "02. 系統架構與邏輯 (System Architecture & Logic)",
                process_2_desc: "定義複雜的 GIS 空間查詢邏輯（如交集/聯集演算法），規劃 LPR 車牌辨識資料流，確保前端介面能直觀呈現後端龐大的運算結果。",
                process_3_title: "03. 介面設計與原型 (UI Design & Prototyping)",
                process_3_desc: "使用 Figma 建立高保真深色模式 (Dark Mode) 原型，設計高對比度的視覺層級，降低員警長時間監控的視覺疲勞。",
                process_4_title: "04. 開發協作與交付 (Development Handoff)",
                process_4_desc: "與前端工程師密切合作，定義 Mapbox API 串接規範與即時資料 WebSocket 通訊協定，確保設計稿完美落地。",
                solution_title: "解決方案與亮點 The Solution",
                gallery_title: "介面展示 Gallery",
                gallery_desc: "以下分為六大模組展示完整的高保真設計介面。",
                back_home: "Back to Portfolio"
            },
            en: {
                loader_step1: "Reading project metadata",
                loader_step2: "Loading visual assets",
                loader_step3: "Constructing render canvas",
                loader_step4: "Initialization complete",
                title_main: "Hsinchu County Police",
                title_sub: "Cloud Intelligent Video Analysis System",
                hero_desc: "Transforming city surveillance into a crime-fighting brain. Combining GIS spatial logic and AI recognition to create an intuitive police command center.",
                btn_explore: "Explore the Journey",
                tab_context: "01. Context",
                tab_process: "02. Process",
                tab_solution: "03. Solution",
                tab_climax: "04. Gallery",
                context_title: "Context",
                context_desc: "Facing growing surveillance data, traditional police systems suffer from 'data silos'. This project aims to build a command hub integrating GIS logic and AI recognition, turning thousands of cameras into searchable, trackable, and proactive assets.",
                role_title: "My Role",
                role_name: "UI Designer",
                pain_title: "Pain Points & Challenges",
                pain_sub: "When massive footage becomes a burden",
                pain_1_title: "Data Overload",
                pain_1_desc: "Officers search for needles in haystacks without effective filtering mechanisms.",
                pain_2_title: "Passive Monitoring",
                pain_2_desc: "Systems only record, unable to actively identify suspects or abnormal behaviors.",
                pain_3_title: "Weak Correlation",
                pain_3_desc: "Device status is separated from footage, causing low efficiency in troubleshooting and retrieval.",
                process_title: "Development Process",
                process_sub: "User-Centered Software Development Lifecycle",
                process_1_title: "01. Requirement & Field Study",
                process_1_desc: "Conducted user interviews with detectives to understand investigation logic. Visited command centers to observe low-light operation habits and multi-screen setups.",
                process_2_title: "02. System Architecture & Logic",
                process_2_desc: "Defined complex GIS spatial query logic (Intersection/Union algorithms) and LPR data flows to ensure the UI intuitively presents backend computations.",
                process_3_title: "03. UI Design & Prototyping",
                process_3_desc: "Created high-fidelity Dark Mode prototypes in Figma, designing high-contrast visual hierarchies to reduce eye strain during long monitoring sessions.",
                process_4_title: "04. Development Handoff",
                process_4_desc: "Collaborated with engineers to define Mapbox API specs and WebSocket protocols, ensuring the design was implemented perfectly.",
                solution_title: "The Solution & Features",
                gallery_title: "Gallery",
                gallery_desc: "High-fidelity interface designs categorized by 6 key modules.",
                back_home: "Back to Portfolio"
            }
        };

        // Icons
        const Icons = {
            Map: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>,
            Dashboard: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
            Search: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
            Bell: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
            Eye: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
            Water: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
            Server: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
        };

        const getSolutionFeatures = (lang) => {
            const isZh = lang === 'zh';
            return [
                { id: 'sol-01', title: isZh ? '全知視角營運儀表板' : 'Omniscient Dashboard', desc: isZh ? '整合 Server 資源、CAM 連線狀態與即時氣象，提供系統健康度的一站式概覽，從被動報修轉為主動預警。' : 'Integrates server resources, CAM status, and weather to provide a one-stop overview of system health.', icon: 'Dashboard', image: './img/project_01/home_02.jpg', benefit: isZh ? 'Benefit: 讓維運人員一眼掌握系統健康度，主動預警。' : 'Benefit: Allows staff to grasp system health at a glance.' },
                { id: 'sol-02', title: isZh ? 'GIS 空間邏輯查詢' : 'GIS Spatial Logic Query', desc: isZh ? '獨創「交集/聯集」查詢邏輯，能迅速找出同時出現在多個案發現場的嫌疑車輛，大幅縮短刑偵過濾時間。' : 'Unique "Intersection/Union" query logic quickly identifies suspect vehicles appearing at multiple crime scenes.', icon: 'Map', image: './img/project_01/track_04.jpg', benefit: isZh ? 'Benefit: 迅速限縮同時出現在多個犯罪現場的嫌疑車輛。' : 'Benefit: Rapidly narrows down suspect vehicles across locations.' },
                { id: 'sol-03', title: isZh ? '主動式車輛聯防' : 'Active Vehicle Defense', desc: isZh ? '建立動態黑名單（失竊/涉案），結合 LPR 技術實現「車過即知」的自動化警示與簡訊推播。' : 'Dynamic blacklists (stolen/involved) combined with LPR technology for automated alerts and push notifications.', icon: 'Bell', image: './img/project_01/search_03.jpg', benefit: isZh ? 'Benefit: 實現「車過即知」的即時打擊能力。' : 'Benefit: Real-time capability to know when a vehicle passes.' },
                { id: 'sol-04', title: isZh ? '戰情中心級 AI 監控' : 'AI Surveillance Center', desc: isZh ? '地圖與影像雙向連動，結合 AI 物件框選（人/車流），實現直覺化的路口即時調閱與戰情指揮。' : 'Two-way linkage between map and video, combined with AI object bounding (people/traffic) for intuitive command.', icon: 'Eye', image: './img/project_01/cam_01.jpg', benefit: isZh ? 'Benefit: 直覺化的路口即時調閱與戰情指揮。' : 'Benefit: Intuitive real-time intersection monitoring.' },
                { id: 'sol-05', title: isZh ? '智慧防災水情監控' : 'Smart Flood Monitoring', desc: isZh ? '結合 IoT 感測器與監視影像，透過紅/橘/藍分級警示與實景尺標，將抽象水位數據轉化為直觀的決策輔助資訊。' : 'Combines IoT sensors and surveillance. Uses color-coded alerts and visual markers to visualize water level data.', icon: 'Water', image: './img/project_01/flood_02.jpg', benefit: isZh ? 'Benefit: 視覺化的實景對照，協助指揮官快速判斷災情等級。' : 'Benefit: Visual benchmarks help commanders judge disaster levels.' },
                { id: 'sol-06', title: isZh ? '軟硬體全域維運' : 'Full Stack Maintenance', desc: isZh ? '整合前端 GIS 設備地圖與後端 Server 效能監測，從記憶體負載到磁碟 I/O，提供 IT 人員深度的系統健康診斷工具。' : 'Integrates GIS device maps and server performance monitoring, providing IT staff with deep diagnostic tools.', icon: 'Server', image: './img/project_01/performance_02.jpg', benefit: isZh ? 'Benefit: 實現從業務操作層到系統維護層的無縫管理。' : 'Benefit: Seamless management from operations to maintenance.' }
            ];
        };

        const getGalleryCategories = (lang) => {
            const isZh = lang === 'zh';
            return [
                { id: 'cat_home', title: isZh ? '登入與首頁' : 'Login & Home', images: [{ id: '01-01', name: isZh ? '系統登入介面' : 'Login Interface', src: './img/project_01/home_01.jpg' }, { id: '01-02', name: isZh ? '營運儀表板首頁' : 'Dashboard Home', src: './img/project_01/home_02.jpg' }] },
                { id: 'cat_trajectory', title: isZh ? '行車軌跡查詢' : 'Trajectory Query', images: [{ id: '02-01', name: isZh ? '單車軌跡搜尋' : 'Single Vehicle Search', src: './img/project_01/track_01.jpg' }, { id: '02-02', name: isZh ? '多車軌跡比對' : 'Multi-Vehicle Comparison', src: './img/project_01/track_02.jpg' }, { id: '02-03', name: isZh ? '交集邏輯分析' : 'Intersection Logic', src: './img/project_01/track_03.jpg' }, { id: '02-04', name: isZh ? '聯集範圍搜尋' : 'Union Scope Search', src: './img/project_01/track_04.jpg' }] },
                { id: 'cat_alerts', title: isZh ? '尋車通報' : 'Vehicle Alert', images: [{ id: '03-01', name: isZh ? '尋車通報列表' : 'Alert List', src: './img/project_01/search_01.jpg' }, { id: '03-02', name: isZh ? '系統自動比對警示' : 'Auto Match Alert', src: './img/project_01/search_02.jpg' }, { id: '03-03', name: isZh ? '已登記車牌查詢' : 'Registered Plate Query', src: './img/project_01/search_03.jpg' }, { id: '03-04', name: isZh ? '多管道通知設定' : 'Notification Settings', src: './img/project_01/search_04.jpg' }] },
                { id: 'cat_surveillance', title: isZh ? '監視影像' : 'Surveillance', images: [{ id: '04-01', name: isZh ? 'GIS 地圖影像模式' : 'GIS Map Mode', src: './img/project_01/cam_01.jpg' }, { id: '04-02', name: isZh ? '設備狀態(正常)' : 'Device Status (Normal)', src: './img/project_01/cam_02.jpg' }, { id: '04-03', name: isZh ? '設備狀態(異常)' : 'Device Status (Error)', src: './img/project_01/cam_03.jpg' }, { id: '04-04', name: isZh ? '多分割即時調閱' : 'Multi-View Monitor', src: './img/project_01/cam_04.jpg' }, { id: '04-05', name: isZh ? '單一畫面 AI 辨識' : 'Single View AI', src: './img/project_01/cam_05.jpg' }, { id: '04-06', name: isZh ? '影像物件框選' : 'Object Bounding', src: './img/project_01/cam_06.jpg' }] },
                { id: 'cat_flood', title: isZh ? '積淹水管理' : 'Flood Management', images: [{ id: '05-01', name: isZh ? '水情資訊儀表板' : 'Water Dashboard', src: './img/project_01/flood_01.jpg' }, { id: '05-02', name: isZh ? '實景尺標告警設定' : 'Visual Alarm Settings', src: './img/project_01/flood_02.jpg' }] },
                { id: 'cat_performance', title: isZh ? '設備與效能' : 'Performance', images: [{ id: '06-01', name: isZh ? 'GIS 設備地圖管理' : 'GIS Device Map', src: './img/project_01/performance_01.jpg' }, { id: '06-02', name: isZh ? '伺服器效能監測報表' : 'Server Monitor', src: './img/project_01/performance_02.jpg' }] }
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

            const [currentImage, setCurrentImage] = useState('./img/project_01/home_01.jpg');
            const [activeGalleryId, setActiveGalleryId] = useState(null);
            const [activeSolutionId, setActiveSolutionId] = useState('sol-01');
            const [showBackToHero, setShowBackToHero] = useState(false);

            // GSAP Refs
            const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
            const isScrollingRef = useRef(false);
            const mainContainerRef = useRef(null);
            const sectionsRef = useRef([]);
            const heroRef = useRef(null);
            const splitRef = useRef(null);
            const contentScrollRef = useRef(null);
            const tabsContainerRef = useRef(null);
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

            // Helper for Translations
            const t = (key) => TRANSLATIONS[lang][key] || key;

            // === 初始化 ===
            useEffect(() => {
                const savedLang = localStorage.getItem('lang');
                const initialLang = savedLang === 'en' ? 'en' : 'zh';
                setLang(initialLang);
                document.documentElement.lang = initialLang === 'zh' ? 'zh-TW' : 'en';

                const features = getSolutionFeatures(initialLang);
                const galleries = getGalleryCategories(initialLang);
                setSolutionFeatures(features);
                setGalleryCategories(galleries);

                setCurrentImage(galleries[0].images[0].src);
                setActiveGalleryId(galleries[0].images[0].id);
                setActiveSolutionId(features[0].id);

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
                const preload = (src) => new Promise(resolve => {
                    const img = new Image();
                    img.src = src;
                    if (img.complete) resolve();
                    else { img.onload = () => resolve(); img.onerror = () => resolve(); }
                });
                const assetsPromise = Promise.all([
                    preload('./img/project_01/hero_img.webp'),
                    preload('./img/project_01/home_01.webp'),
                ]);
                const forceTimeout = new Promise(resolve => setTimeout(resolve, 4000));
                Promise.race([assetsPromise, forceTimeout]).then(() => { setLoaderDone(true); setLoading(false); });
            }, []);

            useEffect(() => {
                const stepTimer = setInterval(() => setLoaderStep(i => (i + 1) % 3), 500);
                return () => clearInterval(stepTimer);
            }, []);

            useEffect(() => {
                if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
                if (swipeContentRef.current) gsap.set(swipeContentRef.current, { x: 0, opacity: 1 });
                setPeekTab(null);

                const currentGalleries = getGalleryCategories(lang);
                const currentFeatures = getSolutionFeatures(lang);

                switch (activeTab) {
                    case 'context':
                    case 'process':
                        setCurrentImage('./img/project_01/display.jpg');
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

            useEffect(() => {
                sectionsRef.current = [heroRef.current, splitRef.current];
                if (sectionsRef.current[0]) sectionsRef.current[0].classList.add('active-section');
            }, [loading]);

            // === GSAP Logic ===
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
            const handleTouchStart = (e) => touchStartY.current = e.touches[0].clientY;
            const handleTouchEnd = (e) => {
                if (tabsContainerRef.current && tabsContainerRef.current.contains(e.target)) return;

                if (isScrollingRef.current) return;
                const touchEndY = e.changedTouches[0].clientY;
                const diff = touchStartY.current - touchEndY;
                const isSplitView = currentSectionIndex === 1;
                const contentEl = contentScrollRef.current;
                const isInsideContent = contentEl && contentEl.contains(e.target);
                if (Math.abs(diff) > 50 && diff > 0) {
                    if (isSplitView && isInsideContent) {
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
                        <BackButton prefix="police" label={t('back_home')} onClick={goBack} />
                    </nav>

                    <ScrollTopButton prefix="police" visible={showBackToHero} onClick={() => scrollToSection(0)} />

                    <div id="main-scroller" ref={mainContainerRef}>
                        {/* [修改] bg-dark -> bg-police-dark */}
                        <section id="hero" ref={heroRef} className="snap-section active-section flex items-center justify-center bg-police-dark hero-bg-custom">
                            <div className="container max-w-7xl mx-auto px-8 z-20">
                                <div className="max-w-5xl text-left">
                                    <div className={`inline-block px-4 py-1 rounded-full border border-white bg-black/20 text-white text-xs font-bold tracking-widest mb-6 ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.1s' }}>GOV. INTELLIGENCE SYSTEM</div>
                                    <h1 className={`text-5xl lg:text-7xl font-heading font-black mb-8 leading-tight text-white drop-shadow-2xl text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.2s' }}>
                                        {/* [修改] from-primary -> from-police-primary */}
                                        {t('title_main')}<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-police-primary to-accent" dangerouslySetInnerHTML={{ __html: t('title_sub').replace('\n', '<br/>') }}></span>
                                    </h1>
                                    <h2 className={`text-xl md:text-2xl text-gray-300 font-light mb-12 max-w-2xl mr-auto leading-relaxed drop-shadow-md text-left ${loading ? 'opacity-0' : 'fade-in-up'}`} style={{ animationDelay: '0.3s' }}>{t('hero_desc')}</h2>
                                    <HeroCTAButton prefix="police" shadowClass="shadow-[0_10px_30px_rgba(0,212,255,0.4)]" loading={loading} label={t('btn_explore')} onClick={() => scrollToSection(1)} />
                                </div>
                            </div>
                        </section>

                        {/* [修改] bg-dark -> bg-police-dark */}
                        <section id="split-view" ref={splitRef} className="snap-section flex flex-col lg:flex-row bg-police-dark overflow-hidden">
                            <div className="w-full shrink-0 z-20 lg:w-3/5 lg:h-full bg-[#1a1a1a] flex items-center justify-center p-4 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 shadow-2xl">
                                <div className="w-full h-[35vh] lg:h-full flex items-center justify-center">
                                    {/* [修改] bg-dark-light -> bg-police-dark-light */}
                                    <div className="relative w-full max-w-full max-h-full lg:max-h-[90%] bg-police-dark-light rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                                        {(activeTab === 'solution' || activeTab === 'climax') && <BrowserFrame />}
                                        <ImageWithSkeleton src={currentImage} alt="Preview" containerClassName="relative bg-white/5 group h-full w-full" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 w-full relative z-10 lg:w-2/5 lg:h-full flex flex-col h-auto min-h-0">
                                <div className="w-full h-full flex flex-col glass-panel relative min-h-0">
                                    {/* [修改] bg-dark/95 -> bg-police-dark/95 */}
                                    <div className="sticky top-0 bg-police-dark/95 backdrop-blur-xl z-30 border-b border-white/10 shrink-0">
                                        <div className="p-4 lg:p-8 pb-0 lg:pb-0">
                                            <h2 className="text-xl lg:text-3xl font-bold text-white font-heading mb-1 leading-tight">{t('title_main')}<br />{t('title_sub')}</h2>
                                            <p className="text-gray-400 text-xs lg:text-sm mb-2 lg:mb-4">Police street surveillance image recognition and monitoring system</p>

                                            <TabNav
                                                prefix="police"
                                                containerRef={tabsContainerRef}
                                                activeTab={activeTab}
                                                onChange={setActiveTab}
                                                tabs={[{ id: 'context', label: t('tab_context') }, { id: 'process', label: t('tab_process') }, { id: 'solution', label: t('tab_solution') }, { id: 'climax', label: t('tab_climax') }]}
                                            />

                                        </div>
                                    </div>

                                    <div ref={contentScrollRef} onTouchStart={handleTabTouchStart} onTouchEnd={handleTabTouchEnd} className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll scroll-content relative">
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
                                                                <ToolPill prefix="police" color="primary" icon={<SharedIcons.Figma />} label="Figma" />
                                                                <ToolPill prefix="police" color="secondary" icon={<SharedIcons.AI />} label="Illustrator" />
                                                                <ToolPill prefix="police" color="secondary" icon={<Icons.Map />} label="QGIS" />
                                                            </div>
                                                        </InfoCard>
                                                    </InfoGrid>
                                                </div>
                                                <div className="w-full h-px bg-white/10"></div>
                                                <div className="space-y-6">
                                                    <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-police-secondary rounded-full mr-3"></span>{t('pain_title')}</h3>
                                                    <PainPointCard
                                                        prefix="police"
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
                                                    prefix="police"
                                                    glowShadowClass="shadow-[0_0_10px_rgba(0,212,255,0.5)]"
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
                                                                prefix="police"
                                                                active={activeSolutionId === sol.id}
                                                                onClick={() => handleSolutionSwitch(sol)}
                                                                icon={<IconComp />}
                                                                title={sol.title}
                                                                desc={sol.desc}
                                                                benefit={sol.benefit}
                                                                activeShadowClass="shadow-[0_0_15px_rgba(0,212,255,0.1)]"
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
                                                            <h4 className="text-police-primary font-bold text-md flex items-center"><span className="w-2 h-2 rounded-full bg-police-primary mr-2"></span>{category.title}</h4>
                                                            <div className="grid gap-3 pl-4 border-l border-white/10">
                                                                {category.images.map((img) => (
                                                                    <GalleryItemButton
                                                                        key={img.id}
                                                                        prefix="police"
                                                                        active={activeGalleryId === img.id}
                                                                        onClick={() => handleGallerySwitch(img)}
                                                                        id={img.id}
                                                                        name={img.name}
                                                                        activeShadowClass="shadow-[0_0_15px_rgba(0,212,255,0.1)]"
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
                                                                <ToolPill prefix="police" color="primary" icon={<SharedIcons.Figma />} label="Figma" />
                                                                <ToolPill prefix="police" color="secondary" icon={<SharedIcons.AI />} label="Illustrator" />
                                                                <ToolPill prefix="police" color="secondary" icon={<Icons.Map />} label="QGIS" />
                                                            </div>
                                                        </InfoCard>
                                                    </InfoGrid>
                                                </div>
                                                <div className="w-full h-px bg-white/10"></div>
                                                <div className="space-y-6">
                                                    <h3 className="text-lg md:text-2xl font-bold text-white mb-2 lg:mb-4 flex items-center"><span className="w-1 h-6 bg-police-secondary rounded-full mr-3"></span>{t('pain_title')}</h3>
                                                    <PainPointCard
                                                        prefix="police"
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
                                                    prefix="police"
                                                    glowShadowClass="shadow-[0_0_10px_rgba(0,212,255,0.5)]"
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
                                                                prefix="police"
                                                                active={activeSolutionId === sol.id}
                                                                onClick={() => handleSolutionSwitch(sol)}
                                                                icon={<IconComp />}
                                                                title={sol.title}
                                                                desc={sol.desc}
                                                                benefit={sol.benefit}
                                                                activeShadowClass="shadow-[0_0_15px_rgba(0,212,255,0.1)]"
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
                                                            <h4 className="text-police-primary font-bold text-md flex items-center"><span className="w-2 h-2 rounded-full bg-police-primary mr-2"></span>{category.title}</h4>
                                                            <div className="grid gap-3 pl-4 border-l border-white/10">
                                                                {category.images.map((img) => (
                                                                    <GalleryItemButton
                                                                        key={img.id}
                                                                        prefix="police"
                                                                        active={activeGalleryId === img.id}
                                                                        onClick={() => handleGallerySwitch(img)}
                                                                        id={img.id}
                                                                        name={img.name}
                                                                        activeShadowClass="shadow-[0_0_15px_rgba(0,212,255,0.1)]"
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    
                                    </div>
                                    )}
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
