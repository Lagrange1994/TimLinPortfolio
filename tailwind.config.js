/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}"], 
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // === 1. Index ===
        primary: '#6C63FF',
        secondary: '#FF6584',
        dark: '#121212',
        'dark-light': '#1E1E1E',
        'dark-lighter': '#2D2D2D',

        // === 2. Project 01 ===
        'police-primary': '#00D4FF',
        'police-dark': '#0F172A',
        'police-dark-light': '#1E293B',
        'police-dark-lighter': '#334155',
        
        // === 3. Project 02 ===
        'app-primary': '#ff4a00',
        'app-secondary': '#FFD700',
        'app-dark': '#080201',
        'app-dark-light': '#140502',
        'app-dark-lighter': '#240a05',
        'app-accent': '#F5F5DC',
        'app-soft-bg': '#F0F2F5',

        // === 4. Project 03 ===
        'kh-primary': '#00A8E8',
        'kh-secondary': '#FF9F1C',
        'kh-dark': '#0F172A', 
        'kh-dark-light': '#1E293B',
        'kh-dark-lighter': '#334155',
        'kh-accent': '#2EC4B6',

        // === 5. Project 04 ===
        'tn-primary': '#2dd4bf', 
        'tn-secondary': '#f87171',
        'tn-dark': '#0F1115',
        'tn-dark-light': '#1A1D24',
        'tn-dark-lighter': '#252932',
        'tn-accent': '#38bdf8',

        // === 6. Project 05 ===
        'zoo-primary': '#86c232',
        'zoo-secondary': '#FF9671',
        'zoo-dark': '#0F1115',
        'zoo-dark-light': '#1A1D24',
        'zoo-accent': '#FFC75F',

        // === 7. Project 06 ===
        'tym-primary': '#7F3F98',
        'tym-secondary': '#00A0E9',
        'tym-dark': '#121212',
        'tym-dark-light': '#1E1E1E',
        'tym-accent': '#F59E0B',

        // === 8. Project 07 ===
        'sm-primary': '#00A0E9',
        'sm-secondary': '#FFB800',
        'sm-dark': '#0F172A',
        'sm-dark-light': '#1E1E1E', 
        'sm-dark-lighter': '#334155',
        'sm-accent': '#22D3EE',

        // === 9. Project 08 ===
        'lv-primary': '#00D2A0',
        'lv-secondary': '#FFB800',
        'lv-dark': '#0F1115',
        'lv-dark-light': '#1A1D24',
        'lv-dark-lighter': '#252932',
        'lv-accent': '#FF4757',

        // === 10. Project 09 ===
        'epb-primary': '#0071b8',
        'epb-secondary': '#FF6584',
        'epb-dark': '#121212',
        'epb-dark-light': '#1E1E1E',
        'epb-dark-lighter': '#2D2D2D',
        'epb-accent': '#00D4FF',

        // === 11. Project 10 ===
        'hc-primary': '#00D4FF',
        'hc-secondary': '#0072CE',
        'hc-dark': '#121212',
        'hc-dark-light': '#1E1E1E',
        'hc-dark-lighter': '#2D2D2D',
        'hc-accent': '#FF6584',

        // === 12. Project 11 ===
        'tmu-primary': '#2B6CB0',
        'tmu-secondary': '#C53030',
        'tmu-dark': '#121212',
        'tmu-dark-light': '#1E1E1E',
        'tmu-dark-lighter': '#2D2D2D',
        'tmu-accent': '#ED8936',

        // === 13. Project 12 (中央存保) [新增] ===
        'gh-primary': '#EAC435',   // 金幣黃
        'gh-secondary': '#FF6584', // 危機紅
        'gh-dark': '#121212',      // 背景
        'gh-dark-light': '#1E1E1E',
        'gh-dark-lighter': '#2D2D2D',
        'gh-accent': '#00D4FF',    // 防護藍

        // 通用
        accent: '#6C63FF', 
      },
      fontFamily: {
        sans: ['Quicksand', '"Noto Sans TC"', 'sans-serif'],
        heading: ['"Momo Trust Display"', '"Noto Sans TC"', 'sans-serif'],
      },
      maxWidth: {
        '8xl': '96rem'
      }
    }
  },
  plugins: [],
}