export type Lang = 'zh' | 'en';

export interface Translations {
  hero_desc: string;
  about_role: string;
  about_p1: string;
  about_p2: string;
  about_p3: string;
  skill_html: string;
  skill_css: string;
  skill_js: string;
  ai_gemini_1: string;
  ai_gemini_2: string;
  ai_rodin_1: string;
  ai_rodin_2: string;
  contact_sub: string;
  p1_title: string;  p1_desc: string;
  p2_title: string;  p2_desc: string;
  p3_title: string;  p3_desc: string;
  p4_title: string;  p4_desc: string;
  p5_title: string;  p5_desc: string;
  p6_title: string;  p6_desc: string;
  p7_title: string;  p7_desc: string;
  p8_title: string;  p8_desc: string;
  p9_title: string;  p9_desc: string;
  p10_title: string; p10_desc: string;
  p11_title: string; p11_desc: string;
  p12_title: string; p12_desc: string;
  p13_title: string; p13_desc: string;
}

export const translations: Record<Lang, Translations> = {
  zh: {
    hero_desc: '致力於打造兼具美學與功能的數位體驗<br />協助企業推動業務成長並深化用戶互動',
    about_role: '讓複雜系統變得可被掌控的產品設計師，兼具 3D 互動開發與 AI 工作流整合能力',
    about_p1: "我的設計核心是<strong class='text-white'>讓高複雜度的系統變得可以被人掌控</strong>。過去五年，我為政府與企業客戶主導後台系統設計，交付成果橫跨 <span class='text-white font-bold border-b border-white/30 pb-0.5'>警政雲端智慧影像分析系統</span>、<span class='text-white font-bold border-b border-white/30 pb-0.5'>環保局數據管理平台</span> 與 <span class='text-white font-bold border-b border-white/30 pb-0.5'>醫院醫療管理後台</span>。面對龐雜的業務邏輯，我慣用 <span class='text-p-primary font-bold'>Figma</span> 與 <span class='text-p-primary font-bold'>Adobe XD</span> 從零梳理資訊架構，最終轉化為直觀、精準的數位工作環境。",
    about_p2: "除了嚴謹的系統思維，我擅長將<strong class='text-white'>沉浸式視覺</strong>注入介面設計。熟練運用 <span class='text-p-secondary font-bold'>Blender</span> 與 <span class='text-p-secondary font-bold'>Spline</span> 打造 3D 互動網頁體驗，也具備多媒體娛樂產業與商業專案的完整執行經驗——這讓我的設計能在邏輯嚴密的同時，保有視覺上的驚喜感。",
    about_p3: "我將 <strong class='text-white'>AI 工具</strong>深度整合進設計流程，而非只是輔助使用。運用 <span class='text-purple-400 font-bold'>Gemini</span> 進行邏輯發想與快速原型驗證，搭配 <span class='text-purple-400 font-bold'>Stitch</span> 生成多元視覺提案，以及 <span class='text-purple-400 font-bold'>Rodin</span> 快速轉化 3D 資產——這套流程讓我的設計交付速度明顯快於傳統方式。技術層面，我具備 <span class='text-white font-bold'>React</span> 與 <span class='text-white font-bold'>Vue.js</span> 基礎，能直接與開發者溝通實作細節，減少反覆來回。",
    skill_html: '熟悉網頁基礎標籤結構與語意化寫法，能獨立閱讀、修改程式碼，有效銜接設計稿與開發實作。',
    skill_css: '具備 Flexbox 與 Tailwind 排版實作能力，能獨立處理 RWD 樣式調整，並理解設計決策對前端渲染的影響。',
    skill_js: '能讀懂程式邏輯並精準描述問題情境，搭配 AI 工具實現互動功能、動畫效果與資料串接——這個作品集網站的互動邏輯即為實際成果。',
    ai_gemini_1: "<strong class='text-white'>邏輯生成與轉譯：</strong> 將設計需求轉化為精準的 Prompt，讓 AI 產出初始程式碼架構。",
    ai_gemini_2: "<strong class='text-white'>智慧除錯：</strong> 遇到程式錯誤時，擅長描述情境引導 AI 快速定位問題。",
    ai_rodin_1: "<strong class='text-white'>快速 3D 原型：</strong> 使用 Rodin 將文字概念直接轉化為 3D 模型，數分鐘內完成建模。",
    ai_rodin_2: "<strong class='text-white'>快速製作UI設計：</strong> 運用 Stitch 快速生成多種UI設計，低成本進行視覺提案。",
    contact_sub: '有專案合作需求？歡迎隨時與我聯繫',
    p1_title: '新竹縣警察局雲端智慧影像分析系統', p1_desc: '警用街頭監視器影像辨識與監測系統介面設計',
    p2_title: '新竹縣警察局雲端智慧影像分析系統app', p2_desc: '以手機為主精簡過的警用街頭監視器影像辨識與監測系統介面設計',
    p3_title: '高雄市警察局新世代智慧科技辦案系統', p3_desc: '警用街頭監視器影像辨識與監測系統介面設計',
    p4_title: '台南市政府警察局智慧簽巡系統', p4_desc: '巡邏員警專用簽到與巡邏紀錄app介面設計',
    p5_title: '新竹市立動物園管理後台', p5_desc: '人流分析與網站管理介面',
    p6_title: '桃園捷運APP', p6_desc: '桃園捷運APP最新消息欄位的介面修改',
    p7_title: '石門水庫網站', p7_desc: '石門水庫網站新增頁面與介面修改',
    p8_title: 'Love-Two live app UI', p8_desc: '直播app提案與設計',
    p9_title: '新竹縣環保局網站後台', p9_desc: '環保局網站後台新增頁面與改版',
    p10_title: '恆春航空站', p10_desc: '航空站網站改版提案',
    p11_title: '台北醫學大學臨床醫學教學系統', p11_desc: '醫學院學生用學習歷程資訊管理系統改版與介面設計',
    p12_title: '中央存保Golden House – 購得好房', p12_desc: '中央存保房貸理財宣傳活動網頁小遊戲',
    p13_title: 'Super High Tech CNC 模擬器', p13_desc: '結合 React 與 WebGL 的 3D 工具機模擬系統介面',
  },
  en: {
    hero_desc: 'Dedicated to creating digital experiences that combine aesthetics and function.<br />Helping businesses drive growth and deepen user engagement.',
    about_role: 'Product designer who tames complex systems — with 3D interactive development and AI workflow integration built in',
    about_p1: "My design focus is <strong class='text-white'>making high-complexity systems feel in control</strong>. Over the past five years, I've led backend system design for government and enterprise clients — delivering across <span class='text-white font-bold border-b border-white/30 pb-0.5'>Police Cloud Video Analysis Systems</span>, <span class='text-white font-bold border-b border-white/30 pb-0.5'>Environmental Bureau Data Platforms</span>, and <span class='text-white font-bold border-b border-white/30 pb-0.5'>Hospital Management Dashboards</span>. Faced with dense business logic, I use <span class='text-p-primary font-bold'>Figma</span> and <span class='text-p-primary font-bold'>Adobe XD</span> to untangle information architecture from the ground up — turning it into intuitive, precise digital workspaces.",
    about_p2: "Beyond systems thinking, I bring <strong class='text-white'>immersive visuals</strong> into interface design. Proficient in <span class='text-p-secondary font-bold'>Blender</span> and <span class='text-p-secondary font-bold'>Spline</span> for building 3D interactive web experiences, with a solid background in multimedia entertainment and commercial projects.",
    about_p3: "I treat <strong class='text-white'>AI tools</strong> as a core part of my design process, not just an add-on. I use <span class='text-purple-400 font-bold'>Gemini</span> for logic generation and rapid prototyping, <span class='text-purple-400 font-bold'>Stitch</span> for visual exploration, and <span class='text-purple-400 font-bold'>Rodin</span> to accelerate 3D asset creation. On the technical side, foundational knowledge of <span class='text-white font-bold'>React</span> and <span class='text-white font-bold'>Vue.js</span> lets me communicate directly with developers.",
    skill_html: 'Comfortable reading and editing HTML structure; able to bridge design specs and development implementation without relying on a handoff middleman.',
    skill_css: 'Able to implement responsive layouts with Flexbox and Tailwind, adjust styles independently, and understand how design decisions translate to rendered output.',
    skill_js: 'Able to read logic, precisely describe problems, and implement interactions and animations with AI assistance — the interactive logic of this portfolio site is a live example.',
    ai_gemini_1: "<strong class='text-white'>Logic & Code Generation:</strong> Translating design requirements into precise prompts to generate initial code structures.",
    ai_gemini_2: "<strong class='text-white'>Intelligent Debugging:</strong> Guiding AI with specific scenarios to quickly identify and fix code issues.",
    ai_rodin_1: "<strong class='text-white'>Rapid 3D Prototyping:</strong> Utilizing Rodin to transform text-to-3D models in minutes.",
    ai_rodin_2: "<strong class='text-white'>Rapid UI Iteration:</strong> Using Stitch to generate multiple design variations for efficient visual proposals.",
    contact_sub: 'Have a project in mind? Feel free to contact me.',
    p1_title: 'Hsinchu County Police Cloud Video Analysis System', p1_desc: 'UI design for police street surveillance image recognition and monitoring system',
    p2_title: 'Hsinchu County Police Video Analysis App', p2_desc: 'Mobile-optimized UI design for police surveillance monitoring system',
    p3_title: 'Kaohsiung Police Smart Investigation System', p3_desc: 'Next-gen smart technology investigation system interface design',
    p4_title: 'Tainan Police Smart Patrol System', p4_desc: "App interface design for patrol officers' check-ins and records",
    p5_title: 'Hsinchu Zoo Management Dashboard', p5_desc: 'Visitor flow analysis and website management interface',
    p6_title: 'Taoyuan Metro App', p6_desc: "UI modification for the 'Latest News' section of the MRT App",
    p7_title: 'Shihmen Reservoir Website', p7_desc: 'New page creation and interface modification for the reservoir website',
    p8_title: 'Love-Two Live Streaming App UI', p8_desc: 'Proposal and design for a live streaming application',
    p9_title: 'Hsinchu Environmental Bureau Backend', p9_desc: "New page additions and redesign for the bureau's backend system",
    p10_title: 'Hengchun Airport Website', p10_desc: 'Website redesign proposal for the airport',
    p11_title: 'TMU Clinical Teaching System', p11_desc: 'Redesign of the learning portfolio management system for medical students',
    p12_title: 'CDIC Golden House – Good Home Purchase', p12_desc: "Web mini-game for Central Deposit Insurance Corp's mortgage education campaign",
    p13_title: 'Super High Tech CNC Simulator', p13_desc: '3D machine tool simulation interface using React & WebGL',
  },
};
