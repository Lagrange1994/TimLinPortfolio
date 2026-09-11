import React from 'react';
import { useTheme } from '../../utils/useTheme';

export default function ThemeToggle({ prefix }) {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`pointer-events-auto flex items-center justify-center h-10 w-10 bg-border/10 backdrop-blur-md border border-border/10 rounded-full text-${prefix}-primary hover:text-${prefix}-secondary hover:border-${prefix}-primary/50 hover:bg-${prefix}-dark-lighter transition-all duration-300 shadow-lg`}
        >
            <i className={`ph ${theme === 'dark' ? 'ph-moon' : 'ph-sun'}`}></i>
        </button>
    );
}
