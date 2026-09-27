import React from 'react';
import { useTheme } from '../../utils/useTheme';
import dsVars from './dsVars';

// On ds-home pages this renders as the homepage navbar's sliding pill switch
// (label + knob, styled in ds-home.css .ds-switch); elsewhere the label is
// hidden and the knob is just the plain icon inside the round button.
export default function ThemeToggle({ prefix }) {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={dsVars(prefix)}
            className={`ds-chrome-btn ds-switch ds-switch--${theme} pointer-events-auto flex items-center justify-center h-10 w-10 bg-border/10 backdrop-blur-md border border-border/10 rounded-full text-${prefix}-primary hover:text-${prefix}-secondary hover:border-${prefix}-primary/50 hover:bg-${prefix}-dark-lighter transition-all duration-300 shadow-lg`}
        >
            <span className="ds-switch-label hidden" aria-hidden="true">{theme === 'light' ? 'Light' : 'Dark'}</span>
            <span className="ds-switch-knob" aria-hidden="true">
                <i className={`ph ${theme === 'dark' ? 'ph-moon' : 'ph-sun'}`}></i>
            </span>
        </button>
    );
}
