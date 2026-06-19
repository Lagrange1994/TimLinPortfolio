import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import ReactDOM from 'react-dom/client';
import gsap from 'gsap';
import ScrollToPlugin from 'gsap/ScrollToPlugin';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

const SIMULATOR_URL = "https://cnc-simulator-sable.vercel.app/";

        const CONTENT = {
            zh: {
                hero_title: "SUPER HIGH TECH",
                hero_sub: "CNC 3D SIMULATOR v4.2",
                hero_desc: "Tech Coordinate — 定義未來的精密加工體驗。結合六邊形結構美學與數位孿生技術，打造工程師最可靠的虛擬指揮中心。",
                btn_launch: "INITIALIZE SIMULATION",
                btn_launch_sub: "啟動即時模擬系統",
                section_features: "核心模組 SYSTEM MODULES",
                section_lang: "設計語言 DESIGN LANGUAGE",
                back_home: "Back to Portfolio",
                features_intro: "五個操作步驟構成完整工作流——從機台校準到執行監控，每個模組解決工程師在特定階段的核心痛點。",
                stages: [
                    { step: "01", label: "準備環境 PREPARE" },
                    { step: "02", label: "編寫程序 PROGRAM" },
                    { step: "03", label: "虛擬驗證 VERIFY"  },
                    { step: "04", label: "即時監控 EXECUTE" },
                ],
                foundation_label: "設計基礎 DESIGN FOUNDATION",
                features: [
                    { title: "BIOS Config",    desc: "加工前設定機台物理極限：主軸轉速上限、進給速度、行程邊界——確保後續每一步都在安全參數內執行。", stage: "01", img_3d: "bios_config",    img_bg: "screen_bios",   carbon: "Form · Toggle · Slider" },
                    { title: "Titanium Vault", desc: "全螢幕檔案管理中樞，快速切換專案、載入 NC 程式，沉浸式操作不中斷工作情境。",                       stage: "01", img_3d: "titanium_vault", img_bg: "screen_vault",  carbon: "DataTable · FileUploader" },
                    { title: "Smart G-Code",   desc: "語法高亮、斷點除錯、即時錯誤提示——將枯燥的 G-Code 編輯轉化為有反饋的直觀互動。",                   stage: "02", img_3d: "smart_code",    img_bg: "screen_code",   carbon: "CodeSnippet · Tag" },
                    { title: "Digital Twin",   desc: "六邊形網格舞台上即時渲染切削路徑（Ghosting），讓工程師在真正執行前先在虛擬環境排除碰撞與過切問題。", stage: "03", img_3d: "digital_twin",  img_bg: "screen_twin",   carbon: "Layer · Grid" },
                    { title: "Live DRO",       desc: "駕駛艙級儀表板即時監控主軸轉速、進給負載與座標位置，異常發生時在毫秒內給出警示。",                   stage: "04", img_3d: "live_dro",      img_bg: "screen_dro",    carbon: "Meter · Notification" },
                    { title: "Fluid Layout",   desc: "三欄式黃金動線：左側程序樹、中央 3D 視口、右側 DRO 儀表板，符合工程師自然操作視線流動。",             stage: "fd", img_3d: "fluid_layout",  img_bg: "screen_layout", carbon: "FlexGrid · Column" },
                    { title: "Titanium Dark",  desc: "專為工廠低光源環境設計的 g100 暗色主題，長時間操作下降低視覺疲勞，不犧牲資訊密度。",                 stage: "fd", img_3d: "dark_mode",     img_bg: "screen_dark",   carbon: "g100 Theme" },
                ],
                dl: {
                    philosophy: "設計語言源自 CNC 機台本身——切削倒角、指揮面板、工廠燈號——每個視覺決策都在真實機台上找得到對應物件。",
                    carbon_desc: "採用 IBM Carbon Design System 作為設計基礎，繼承其嚴謹的 Grid System、Spacing Scale 與 g100 暗色主題，再以工業切角語言覆寫視覺層，打造出工廠語境下的精密 UI。",
                    pillars: [
                        { code: "01 // CHAMFER_GEOMETRY", title: "切角幾何系統",
                          desc: "CNC 機台在金屬零件邊緣切削出倒角（Chamfer），防止毛刺、強化結構。UI 所有元件同樣採用 clip-path 切角，讓介面與機台說同一種幾何語言。",
                          font1_label: null, font2_label: null },
                        { code: "02 // INDUSTRIAL_PALETTE", title: "工廠色彩語意",
                          desc: "顏色在工廠是安全語言——藍燈代表系統運行、青色是切削弧光、紅色是緊急停機。介面色彩直接映射廠房燈號系統，操作員無需學習新的色彩意義。",
                          font1_label: null, font2_label: null },
                        { code: "03 // ENGINEERING_TYPE", title: "工程字體配對",
                          desc: "兩種字體，兩種職責：Orbitron 對應機台指揮面板的顯示字形；JetBrains Mono 是工程師母語——G-Code 本身就是程式碼。",
                          font1_label: "Orbitron — 指揮面板標題字", font2_label: "JetBrains Mono — G-Code 程序指令" },
                        { code: "04 // SIGNAL_MOTION", title: "訊號動態語言",
                          desc: "每種燈號都有對應的機台狀態語意：藍燈代表系統運行中，綠燈是待機心跳，紅燈是緊急警示——操作員不需要看文字，燈號本身就在說話。",
                          font1_label: null, font2_label: null },
                    ],
                    palette_meanings: ["系統運作 · 主操作", "切削弧光 · 強調提示", "緊急停機 · 警示", "機台內腔 · 底色", "加工鋁材 · 內文"],
                    motion_descs: ["老式 CNC 控制器 CRT 掃描殘影", "訊號干擾 · 懸停觸發", "系統待機呼吸燈", "ScrollTrigger 精密入場"],
                }
            },
            en: {
                hero_title: "SUPER HIGH TECH",
                hero_sub: "CNC 3D SIMULATOR v4.2",
                hero_desc: "Tech Coordinate — Defining the future of precision machining. Combining hexagonal structural aesthetics with digital twin technology to build the most reliable virtual command center for engineers.",
                btn_launch: "INITIALIZE SIMULATION",
                btn_launch_sub: "Launch Real-Time Simulation",
                section_features: "SYSTEM MODULES",
                section_lang: "DESIGN LANGUAGE",
                back_home: "Back to Portfolio",
                features_intro: "Five workflow steps form a complete CNC machining pipeline — from machine calibration to live monitoring, each module solves a specific engineering pain point at the right moment.",
                stages: [
                    { step: "01", label: "PREPARE" },
                    { step: "02", label: "PROGRAM" },
                    { step: "03", label: "VERIFY"  },
                    { step: "04", label: "EXECUTE" },
                ],
                foundation_label: "DESIGN FOUNDATION",
                features: [
                    { title: "BIOS Config",    desc: "Set machine physical limits before cutting — spindle speed cap, feed rate, travel boundary — so every downstream step runs within safe parameters.",          stage: "01", img_3d: "bios_config",    img_bg: "screen_bios",   carbon: "Form · Toggle · Slider" },
                    { title: "Titanium Vault", desc: "Fullscreen file management hub for fast project switching and NC program loading — immersive enough that engineers never lose their workflow context.",         stage: "01", img_3d: "titanium_vault", img_bg: "screen_vault",  carbon: "DataTable · FileUploader" },
                    { title: "Smart G-Code",   desc: "Syntax highlighting, breakpoint debugging, and real-time error hints — turning dry G-Code editing into an interactive, feedback-rich experience.",            stage: "02", img_3d: "smart_code",    img_bg: "screen_code",   carbon: "CodeSnippet · Tag" },
                    { title: "Digital Twin",   desc: "Real-time cutting path rendering (Ghosting) on a hexagonal grid stage — engineers catch collisions and overcuts in the virtual environment before execution.", stage: "03", img_3d: "digital_twin",  img_bg: "screen_twin",   carbon: "Layer · Grid" },
                    { title: "Live DRO",       desc: "Cockpit-grade dashboard monitoring spindle speed, feed load, and coordinate position in real time — with millisecond alerts on anomaly detection.",          stage: "04", img_3d: "live_dro",      img_bg: "screen_dro",    carbon: "Meter · Notification" },
                    { title: "Fluid Layout",   desc: "Three-column golden path: program tree on the left, 3D viewport in the center, DRO panel on the right — aligned with engineers' natural eye flow.",          stage: "fd", img_3d: "fluid_layout",  img_bg: "screen_layout", carbon: "FlexGrid · Column" },
                    { title: "Titanium Dark",  desc: "A g100 dark theme engineered for low-light factory floors — reduces visual fatigue over long shifts without sacrificing information density.",                 stage: "fd", img_3d: "dark_mode",     img_bg: "screen_dark",   carbon: "g100 Theme" },
                ],
                dl: {
                    philosophy: "The design language is derived from the CNC machine itself — chamfered edges, control panels, factory indicator lights — every visual decision has a counterpart on the real machine.",
                    carbon_desc: "Built on IBM Carbon Design System as the design foundation, inheriting its rigorous Grid System, Spacing Scale, and g100 dark theme, then overriding the visual layer with an industrial chamfer language to craft a precision UI for the factory context.",
                    pillars: [
                        { code: "01 // CHAMFER_GEOMETRY", title: "Chamfer Geometry System",
                          desc: "CNC machines chamfer metal part edges to eliminate burrs and reinforce structure. Every UI element uses the same clip-path chamfer, so the interface and the machine speak the same geometric language.",
                          font1_label: null, font2_label: null },
                        { code: "02 // INDUSTRIAL_PALETTE", title: "Industrial Color Semantics",
                          desc: "Color is a safety language in factories — blue signals system running, teal is plasma arc cutting light, red is emergency stop. Interface colors directly map to factory indicator systems, so operators need no relearning.",
                          font1_label: null, font2_label: null },
                        { code: "03 // ENGINEERING_TYPE", title: "Engineering Type Pairing",
                          desc: "Two typefaces, two roles: Orbitron mirrors machine control panel displays; JetBrains Mono is the engineer's native language — G-Code is literally code.",
                          font1_label: "Orbitron — Control Panel Headline", font2_label: "JetBrains Mono — G-Code Instructions" },
                        { code: "04 // SIGNAL_MOTION", title: "Signal Motion Language",
                          desc: "Every indicator light carries a machine-state semantic: blue means system running, green is the standby heartbeat, red is emergency alert — operators don't need to read text, the lights speak for themselves.",
                          font1_label: null, font2_label: null },
                    ],
                    palette_meanings: ["System running · Primary action", "Plasma arc · Highlight", "Emergency stop · Alert", "Machine cavity · Background", "Machined aluminum · Body text"],
                    motion_descs: ["CRT afterimage of legacy CNC controllers", "Signal interference · Hover-triggered", "System standby heartbeat", "ScrollTrigger precision entrance"],
                }
            }
        };

        const lang = localStorage.getItem('lang') || 'zh';
        const t = CONTENT[lang] || CONTENT.zh;

        const Navbar = () => (
            <nav className="fixed top-0 left-0 w-full z-40 px-6 py-4 flex justify-between items-center bg-tech-dark/80 backdrop-blur-md border-b border-white/5">
                <a href="javascript:history.length>1?history.back():void(location.href='/')" className="flex items-center group">
                    {/* Double Layer Button for Border Visibility */}
                    <div className="w-8 h-8 chamfer-btn p-[1px] bg-tech-primary mr-3 group-hover:bg-white transition-colors">
                        <div className="w-full h-full chamfer-btn bg-tech-dark flex items-center justify-center group-hover:bg-tech-primary transition-colors">
                            <i className="ph ph-arrow-left text-tech-primary group-hover:text-white text-xs"></i>
                        </div>
                    </div>
                    <span className="font-mono text-xs text-tech-grey tracking-widest group-hover:text-white transition-colors">{t.back_home}</span>
                </a>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1.5 chamfer-btn px-2 py-1 border border-tech-primary/20 bg-tech-primary/5">
                        <span className="font-mono text-[8px] text-tech-primary/50 tracking-widest">IBM</span>
                        <span className="font-mono text-[8px] text-tech-primary/70 tracking-widest">CARBON_DS</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-mono text-[10px] text-tech-primary tracking-widest">SYSTEM ONLINE</span>
                    </div>
                </div>
            </nav>
        );

        const SimulatorModal = ({ isOpen, onClose }) => {
            if (!isOpen) return null;
            return (
                <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fadeIn">
                    <div className="h-10 bg-tech-panel border-b border-white/10 flex justify-between items-center px-4 shrink-0">
                        <div className="flex items-center space-x-4">
                            <span className="font-display text-tech-primary font-bold tracking-widest text-sm">SIMULATOR_LIVE</span>
                            <span className="font-mono text-[10px] text-gray-500">1920x1080 NATIVE RES</span>
                        </div>
                        <button onClick={onClose} className="bg-red-500/20 hover:bg-red-500 border border-red-500/50 text-red-500 hover:text-white px-4 py-1 text-xs font-mono font-bold tracking-widest chamfer-btn transition-all flex items-center">
                            <i className="ph ph-power mr-2"></i> DISCONNECT
                        </button>
                    </div>
                    <div className="flex-1 relative w-full h-full bg-black overflow-hidden">
                        <iframe src={SIMULATOR_URL} className="w-full h-full border-0" allowFullScreen title="CNC Simulator"></iframe>
                    </div>
                </div>
            );
        };

        const Hero = ({ onLaunch }) => {
            const containerRef = useRef(null);
            useEffect(() => {
                gsap.fromTo(containerRef.current.children,
                    { y: 50, opacity: 0 },
                    { y: 0, opacity: 1, stagger: 0.2, duration: 1, ease: "power3.out" }
                );
            }, []);

            return (
                <header
                    className="relative min-h-screen flex items-center justify-center bg-fixed bg-cover bg-center overflow-hidden"
                    style={{ backgroundImage: "url('./img/project_13/CNC.webp')" }}
                >
                    <div className="scanline"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-tech-dark/80 via-tech-dark/70 to-tech-dark z-0 pointer-events-none"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none z-0">
                        <div className="w-[800px] h-[800px] border border-tech-primary/30 rounded-full animate-spin-slow" style={{ animationDuration: '60s' }}></div>
                        <div className="absolute w-[600px] h-[600px] border border-white/10 rounded-full animate-spin-slow" style={{ animationDuration: '40s', animationDirection: 'reverse' }}></div>
                    </div>

                    <div ref={containerRef} className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
                        <div className="inline-block px-4 py-1 mb-6 border border-tech-primary/50 bg-tech-primary/10 text-tech-primary text-xs font-mono tracking-[0.2em] chamfer-btn backdrop-blur-sm">
                            {t.hero_sub}
                        </div>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-white mb-8 tracking-tighter leading-tight drop-shadow-2xl">{t.hero_title}</h1>
                        <p className="text-tech-grey text-lg md:text-xl font-light mb-12 max-w-2xl leading-relaxed drop-shadow-md">{t.hero_desc}</p>

                        {/* Double Layer Launch Button */}
                        <button onClick={onLaunch} className="group relative inline-block p-[2px] bg-tech-primary chamfer-btn hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(24,144,255,0.3)]">
                            <div className="w-full h-full chamfer-btn bg-tech-primary group-hover:bg-white px-8 py-4 md:px-12 md:py-6 flex flex-col items-center justify-center transition-colors">
                                <span className="font-display font-bold text-base md:text-xl tracking-widest mb-1 flex items-center text-white group-hover:text-tech-dark transition-colors">
                                    <i className="ph ph-play-circle mr-2 md:mr-3"></i>{t.btn_launch}
                                </span>
                                <span className="font-mono text-[10px] md:text-xs opacity-70 tracking-widest text-white group-hover:text-tech-dark transition-colors">{t.btn_launch_sub}</span>
                            </div>
                        </button>

                        <div className="mt-16 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-mono text-gray-400 tracking-widest drop-shadow-sm">
                            <span>CHAMFER GEOMETRY</span><span className="opacity-40">•</span><span>INDUSTRIAL PALETTE</span><span className="opacity-40">•</span><span>CARBON DS</span><span className="opacity-40">•</span><span>SIGNAL MOTION</span>
                        </div>
                    </div>
                </header>
            );
        };

        // 4. Feature Grid Section (Double Layer Border for Cards & Icons)
        const FeatureCard = ({ item, large = false }) => (
            <div className={`feat-card group relative chamfer-card p-[1px] bg-white/10 hover:bg-tech-primary/50 transition-colors duration-500 ${large ? 'aspect-[16/9]' : 'aspect-[3/2]'}`}>
                <div className="chamfer-card w-full h-full bg-tech-panel flex flex-col justify-end items-start p-6 relative overflow-hidden">
                    <div className="absolute inset-0 z-0 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="glitch-container">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="glitch__img" style={{ backgroundImage: `url(./img/project_13/${item.img_bg}.jpg)` }}></div>
                            ))}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-tech-dark/95 via-tech-dark/50 to-transparent z-10 pointer-events-none"></div>
                        <div className="absolute inset-0 bg-tech-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay z-10 pointer-events-none"></div>
                    </div>
                    <div className="relative z-10 flex flex-row items-center w-full">
                        <div className="flex-shrink-0 mr-6">
                            <div className="relative flex items-center justify-center bg-gradient-to-br from-tech-primary to-tech-dark p-[2px] shadow-[0_0_30px_rgba(24,144,255,0.3)] group-hover:shadow-[0_0_50px_rgba(24,144,255,0.6)] transition-shadow duration-500"
                                style={{ width: large ? '100px' : '80px', height: large ? '100px' : '80px', clipPath: 'polygon(20% 0%, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}>
                                <div className="w-full h-full bg-tech-dark/80 backdrop-blur-md flex items-center justify-center overflow-hidden relative"
                                    style={{ clipPath: 'polygon(20% 0%, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}>
                                    <img src={`./img/project_13/${item.img_3d}.png`} alt={item.title}
                                        className="relative z-10 w-full h-full object-cover transform scale-110 transition-transform duration-700"
                                        onError={(e) => e.target.style.display = 'none'} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-tech-dark/40 to-transparent z-20 pointer-events-none"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className={`font-display font-bold text-white tracking-wide group-hover:text-tech-accent transition-colors mb-2 ${large ? 'text-2xl' : 'text-lg'}`}>{item.title}</h3>
                            <p className={`text-gray-300 leading-relaxed font-light group-hover:text-gray-100 transition-colors duration-300 drop-shadow-md ${large ? 'text-sm' : 'text-xs'}`}>{item.desc}</p>
                        </div>
                    </div>
                    {item.carbon && (
                        <div className="absolute bottom-3 right-4 z-20 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="font-mono text-[8px] text-tech-primary/60 tracking-widest">BX</span>
                            <span className="font-mono text-[8px] text-tech-primary tracking-widest">{item.carbon}</span>
                        </div>
                    )}
                </div>
            </div>
        );

        const Features = () => {
            const sectionRef = useRef(null);
            const labelRef  = useRef(null);

            useEffect(() => {
                gsap.fromTo(labelRef.current, { color: "#4B5563" }, {
                    color: "#1890FF", duration: 0.5,
                    scrollTrigger: { trigger: sectionRef.current, start: "top 80%", toggleActions: "play none none reverse" }
                });
                const groups = sectionRef.current.querySelectorAll('.stage-group');
                groups.forEach(group => {
                    gsap.fromTo(group.querySelectorAll('.feat-card'),
                        { y: 50, opacity: 0 },
                        { y: 0, opacity: 1, stagger: 0.12, duration: 0.8, scrollTrigger: { trigger: group, start: "top 82%" } }
                    );
                });
            }, []);

            const workflowGroups = t.stages.map(s => ({
                ...s, features: t.features.filter(f => f.stage === s.step)
            }));
            const foundationFeatures = t.features.filter(f => f.stage === 'fd');

            return (
                <section className="py-24 px-6 bg-tech-dark relative border-t border-white/5" ref={sectionRef}>
                    <div className="max-w-7xl mx-auto">

                        {/* Header */}
                        <div className="mb-6 flex items-end justify-between border-b border-white/10 pb-4">
                            <h2 className="text-3xl font-display font-bold text-white flex items-center">
                                <span className="w-2 h-8 bg-tech-primary mr-4 block"></span>
                                {t.section_features}
                            </h2>
                            <span ref={labelRef} className="font-mono text-gray-600 text-xs hidden md:block tracking-widest transition-colors duration-300">01 // CORE_MODULES</span>
                        </div>

                        {/* Intro */}
                        <p className="text-gray-400 text-base leading-relaxed font-light mb-12 max-w-2xl">{t.features_intro}</p>

                        {/* Flow Bar */}
                        <div className="flex items-center mb-16 overflow-x-auto pb-2">
                            {t.stages.map((stage, i) => (
                                <React.Fragment key={stage.step}>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        <div className="chamfer-btn p-[1px] bg-tech-primary/40">
                                            <div className="chamfer-btn bg-tech-dark px-2.5 py-1">
                                                <span className="font-mono text-[10px] text-tech-primary font-bold">{stage.step}</span>
                                            </div>
                                        </div>
                                        <span className="font-mono text-[10px] text-gray-400 tracking-widest whitespace-nowrap">{stage.label}</span>
                                    </div>
                                    {i < t.stages.length - 1 && (
                                        <div className="flex-1 mx-4 min-w-4 flex items-center">
                                            <div className="w-full h-px bg-tech-primary/20"></div>
                                            <div className="w-1.5 h-1.5 border-r border-t border-tech-primary/30 rotate-45 -ml-1 flex-shrink-0"></div>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Workflow Stages */}
                        <div className="space-y-14">
                            {workflowGroups.map((stage, si) => (
                                <div key={stage.step} className="stage-group">
                                    <div className="flex items-center space-x-3 mb-5">
                                        <div className="chamfer-btn p-[1px] bg-tech-primary">
                                            <div className="chamfer-btn bg-tech-dark px-3 py-1.5">
                                                <span className="font-mono text-xs text-tech-primary font-bold">{stage.step}</span>
                                            </div>
                                        </div>
                                        <span className="font-display text-white text-sm tracking-widest">{stage.label}</span>
                                        <div className="flex-1 h-px bg-white/10"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {stage.features.map((item, idx) => (
                                            <FeatureCard key={idx} item={item} />
                                        ))}
                                    </div>
                                    {si < workflowGroups.length - 1 && (
                                        <div className="flex flex-col items-center mt-8">
                                            <div className="w-px h-6 bg-tech-primary/20"></div>
                                            <div className="w-2 h-2 border-r-2 border-b-2 border-tech-primary/30 rotate-45 -mt-1.5"></div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Design Foundation */}
                            <div className="stage-group pt-10 border-t border-white/5">
                                <div className="flex items-center space-x-3 mb-5">
                                    <div className="chamfer-btn px-3 py-1.5 border border-[#66FCF1]/30 bg-[#66FCF1]/10">
                                        <span className="font-mono text-xs text-[#66FCF1] font-bold">FD</span>
                                    </div>
                                    <span className="font-display text-gray-400 text-sm tracking-widest">{t.foundation_label}</span>
                                    <div className="flex-1 h-px bg-white/5"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {foundationFeatures.map((item, idx) => (
                                        <FeatureCard key={idx} item={item} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            );
        };
        const DesignLanguage = () => {
            const sectionRef = useRef(null);
            const labelRef = useRef(null);

            useEffect(() => {
                gsap.fromTo(labelRef.current,
                    { color: "#6B7280" },
                    { color: "#66FCF1", duration: 0.5, scrollTrigger: { trigger: sectionRef.current, start: "top 80%", toggleActions: "play none none reverse" } }
                );
                const cards = sectionRef.current.querySelectorAll('.lang-card');
                gsap.fromTo(cards,
                    { y: 40, opacity: 0 },
                    { y: 0, opacity: 1, stagger: 0.15, duration: 0.8, scrollTrigger: { trigger: sectionRef.current, start: "top 70%" } }
                );
                const mockup = sectionRef.current.querySelector('.lang-mockup');
                gsap.fromTo(mockup,
                    { y: 30, opacity: 0 },
                    { y: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: mockup, start: "top 80%" } }
                );
            }, []);

            const paletteBase = [
                { color: '#1890FF', name: 'Signal Blue', hex: '#1890FF', glow: 'rgba(24,144,255,0.35)' },
                { color: '#66FCF1', name: 'Plasma Teal', hex: '#66FCF1', glow: 'rgba(102,252,241,0.3)' },
                { color: '#FF4D4F', name: 'E-Stop Red',  hex: '#FF4D4F', glow: 'rgba(255,77,79,0.3)'   },
                { color: '#0B0C10', name: 'Void Black',  hex: '#0B0C10', border: true },
                { color: '#C5C6C7', name: 'Steel Grey',  hex: '#C5C6C7' },
            ];
            const palette = paletteBase.map((c, i) => ({ ...c, meaning: t.dl.palette_meanings[i] }));

            const motionBase = [
                { dot: 'bg-tech-primary', label: 'SCANLINE'     },
                { dot: 'bg-[#66FCF1]',    label: 'GLITCH HOVER' },
                { dot: 'bg-green-500',    label: 'PULSE'        },
                { dot: 'bg-yellow-400',   label: 'GSAP REVEAL'  },
            ];
            const motions = motionBase.map((m, i) => ({ ...m, desc: t.dl.motion_descs[i] }));

            return (
                <section className="py-24 px-6 bg-[#0F1014] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#1f2833 1px, transparent 1px), linear-gradient(90deg, #1f2833 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                    <div className="max-w-7xl mx-auto relative z-10" ref={sectionRef}>

                        {/* Header */}
                        <div className="mb-6 flex items-end justify-between border-b border-white/10 pb-4">
                            <h2 className="text-3xl font-display font-bold text-white flex items-center">
                                <span className="w-2 h-8 bg-[#66FCF1] mr-4 block"></span>
                                {t.section_lang}
                            </h2>
                            <span ref={labelRef} className="font-mono text-gray-500 text-xs hidden md:block tracking-widest transition-colors duration-300">02 // VISUAL_SYSTEM</span>
                        </div>

                        {/* Philosophy */}
                        <p className="text-gray-400 text-base leading-relaxed font-light mb-12 max-w-2xl">
                            {t.dl.philosophy}
                        </p>

                        {/* Carbon DS Banner */}
                        <div className="mb-16 chamfer-card p-[1px] bg-gradient-to-r from-tech-primary/40 via-white/5 to-transparent">
                            <div className="chamfer-card bg-tech-dark/90 backdrop-blur-sm px-8 py-7 flex flex-col md:flex-row md:items-center gap-6">
                                <div className="flex items-center space-x-4 flex-shrink-0">
                                    <div className="chamfer-btn p-[1.5px] bg-tech-primary">
                                        <div className="chamfer-btn bg-tech-dark px-4 py-3">
                                            <span className="font-display font-black text-tech-primary text-xl tracking-widest leading-none">IBM</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-display font-bold text-white text-lg tracking-wider leading-tight">Carbon Design System</div>
                                        <div className="font-mono text-[10px] text-tech-primary tracking-widest mt-0.5">DESIGN_FOUNDATION</div>
                                    </div>
                                </div>
                                <div className="hidden md:block w-px h-12 bg-white/10 flex-shrink-0"></div>
                                <p className="text-gray-400 text-sm leading-relaxed flex-1">{t.dl.carbon_desc}</p>
                                <div className="flex flex-wrap gap-2 flex-shrink-0">
                                    {['Grid System','g100 Theme','BX Components','8px Scale'].map(tag => (
                                        <span key={tag} className="chamfer-btn px-3 py-1 border border-tech-primary/30 bg-tech-primary/10 font-mono text-[9px] text-tech-primary tracking-widest">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 2×2 Pillar Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">

                            {/* 01 Chamfer Geometry */}
                            <div className="lang-card chamfer-card p-[1px] bg-white/10 hover:bg-tech-primary/20 transition-colors duration-500">
                                <div className="chamfer-card bg-tech-panel p-8 h-full flex flex-col">
                                    <div className="font-mono text-[10px] text-tech-primary tracking-widest mb-3">{t.dl.pillars[0].code}</div>
                                    <h3 className="font-display font-bold text-white text-xl mb-3 tracking-wide">{t.dl.pillars[0].title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1">{t.dl.pillars[0].desc}</p>
                                    <div className="flex items-end space-x-6">
                                        <div className="flex flex-col items-center space-y-2">
                                            <div className="w-20 h-10 chamfer-btn bg-tech-primary flex items-center justify-center shadow-[0_0_16px_rgba(24,144,255,0.4)]">
                                                <span className="font-mono text-[9px] text-white tracking-widest">BTN</span>
                                            </div>
                                            <span className="font-mono text-[9px] text-gray-600">10px cut</span>
                                        </div>
                                        <div className="flex flex-col items-center space-y-2">
                                            <div className="chamfer-card bg-tech-panel border border-white/10 flex items-center justify-center" style={{width:'96px',height:'60px'}}>
                                                <span className="font-mono text-[9px] text-gray-500 tracking-widest">CARD</span>
                                            </div>
                                            <span className="font-mono text-[9px] text-gray-600">20px cut</span>
                                        </div>
                                        <div className="flex-1">
                                            <pre className="font-mono text-[9px] text-gray-600 leading-relaxed">
                                                <span className="text-tech-primary/50">{"/* btn */"}</span>{"\n"}
                                                {"clip-path: polygon(\n  10px 0, 100% 0,\n  100% calc(100%-10px),\n  ...0 10px\n);"}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 02 Industrial Palette */}
                            <div className="lang-card chamfer-card p-[1px] bg-white/10 hover:bg-tech-primary/20 transition-colors duration-500">
                                <div className="chamfer-card bg-tech-panel p-8 h-full flex flex-col">
                                    <div className="font-mono text-[10px] text-tech-primary tracking-widest mb-3">{t.dl.pillars[1].code}</div>
                                    <h3 className="font-display font-bold text-white text-xl mb-3 tracking-wide">{t.dl.pillars[1].title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1">{t.dl.pillars[1].desc}</p>
                                    <div className="space-y-3">
                                        {palette.map((c, i) => (
                                            <div key={i} className="flex items-center space-x-3 group">
                                                <div
                                                    className="w-7 h-7 chamfer-btn flex-shrink-0 transition-transform group-hover:scale-110"
                                                    style={{
                                                        background: c.color,
                                                        border: c.border ? '1px solid rgba(255,255,255,0.12)' : 'none',
                                                        boxShadow: c.glow ? `0 0 10px ${c.glow}` : 'none'
                                                    }}
                                                ></div>
                                                <span className="font-mono text-[10px] w-16 flex-shrink-0" style={{color: c.border ? '#555' : c.color}}>{c.hex}</span>
                                                <span className="font-mono text-[10px] text-gray-500 w-24 flex-shrink-0">{c.name}</span>
                                                <span className="font-mono text-[10px] text-gray-600">{c.meaning}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 03 Engineering Typography */}
                            <div className="lang-card chamfer-card p-[1px] bg-white/10 hover:bg-tech-primary/20 transition-colors duration-500">
                                <div className="chamfer-card bg-tech-panel p-8 h-full flex flex-col">
                                    <div className="font-mono text-[10px] text-tech-primary tracking-widest mb-3">{t.dl.pillars[2].code}</div>
                                    <h3 className="font-display font-bold text-white text-xl mb-3 tracking-wide">{t.dl.pillars[2].title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1">{t.dl.pillars[2].desc}</p>
                                    <div className="space-y-4">
                                        <div className="p-4 border-l-2 border-tech-primary bg-black/40">
                                            <div className="font-mono text-[9px] text-gray-600 mb-2 tracking-widest">{t.dl.pillars[2].font1_label}</div>
                                            <div className="font-display text-2xl font-bold text-white tracking-widest leading-none">SPINDLE ON</div>
                                        </div>
                                        <div className="p-4 border-l-2 border-[#66FCF1] bg-black/40">
                                            <div className="font-mono text-[9px] text-gray-600 mb-2 tracking-widest">{t.dl.pillars[2].font2_label}</div>
                                            <div className="font-mono text-sm leading-relaxed">
                                                <span className="text-yellow-400">N01</span>{' '}
                                                <span className="text-tech-primary">G01</span>{' '}
                                                <span className="text-gray-300">X20.5 Y-15.0</span>{' '}
                                                <span className="text-green-400">F1200</span>
                                                <span className="text-gray-600">;</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 04 Signal Motion */}
                            <div className="lang-card chamfer-card p-[1px] bg-white/10 hover:bg-tech-primary/20 transition-colors duration-500">
                                <div className="chamfer-card bg-tech-panel p-8 h-full flex flex-col">
                                    <div className="font-mono text-[10px] text-tech-primary tracking-widest mb-3">{t.dl.pillars[3].code}</div>
                                    <h3 className="font-display font-bold text-white text-xl mb-3 tracking-wide">{t.dl.pillars[3].title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1">{t.dl.pillars[3].desc}</p>
                                    <div className="space-y-5">
                                        {motions.map((m, i) => (
                                            <div key={i} className="flex items-start space-x-4">
                                                <div className={`w-2 h-2 rounded-full ${m.dot} animate-pulse mt-1 flex-shrink-0`}></div>
                                                <div>
                                                    <div className="font-mono text-[10px] text-white tracking-widest mb-0.5">{m.label}</div>
                                                    <div className="font-mono text-[10px] text-gray-500">{m.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Half-width mockup */}
                        <div className="lang-mockup grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <div className="font-mono text-[10px] text-gray-600 tracking-widest mb-4">{"// DESIGN_LANGUAGE IN ACTION"}</div>
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-tech-primary/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                                <img
                                    src="/img/project_13/display.webp"
                                    alt="Design Language in Action"
                                    className="w-full shadow-2xl relative z-10"
                                    style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)', border: '1px solid rgba(255,255,255,0.06)' }}
                                />
                                <div className="absolute bottom-4 right-4 z-20 bg-tech-panel/90 border border-tech-primary/30 p-3 backdrop-blur-md chamfer-btn">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="font-mono text-[9px] text-gray-400 tracking-widest">ALL_SYSTEMS_NOMINAL</span>
                                    </div>
                                    <div className="font-display font-bold text-white text-sm tracking-wider">DESIGN LANGUAGE v1.0</div>
                                </div>
                            </div>
                        </div>
                        </div>

                    </div>
                </section>
            );
        };

        const Footer = () => (
            <footer className="py-12 bg-black border-t border-white/10 text-center">
                <p className="text-tech-grey text-xs font-mono tracking-widest mb-3">DESIGNED BY TIM LIN</p>
                <div className="text-[10px] text-gray-700 font-mono mb-4">SUPER HIGH TECH © 2025 <br /> ALL SYSTEMS OPERATIONAL</div>
                <div className="flex items-center justify-center space-x-2 opacity-30">
                    <div className="w-px h-3 bg-gray-700"></div>
                    <span className="font-mono text-[9px] text-gray-600 tracking-widest">BUILT ON IBM CARBON DESIGN SYSTEM</span>
                    <div className="w-px h-3 bg-gray-700"></div>
                </div>
            </footer>
        );

        const App = () => {
            const [isLoading, setIsLoading] = useState(true);
            const [isSimOpen, setIsSimOpen] = useState(false);
            useEffect(() => { setTimeout(() => setIsLoading(false), 1500); }, []);
            return (
                <React.Fragment>
                    <div className={`loader-overlay ${!isLoading ? 'loader-hidden' : ''}`}>
                        <div className="flex flex-col items-center"><div className="w-16 h-16 border-4 border-tech-primary border-t-transparent rounded-full animate-spin mb-4"></div><div className="font-mono text-tech-primary text-xs tracking-[0.3em] animate-pulse">INITIALIZING...</div></div>
                    </div>
                    <Navbar />
                    <main><Hero onLaunch={() => setIsSimOpen(true)} /><Features /><DesignLanguage /></main>
                    <Footer />
                    <SimulatorModal isOpen={isSimOpen} onClose={() => setIsSimOpen(false)} />
                </React.Fragment>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
