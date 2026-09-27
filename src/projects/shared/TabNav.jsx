import React from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { INDICATOR_SPRING } from '../../utils/tabIndicator';
import dsVars from './dsVars';

// On ds-home pages the active tab gets the homepage's Fluid Tabs pill
// (Portfolio filter tabs): a shared-layoutId span mounted only inside the
// active tab, which Motion slides between tabs — see utils/tabIndicator.ts
// for why it's layoutId and not a hand-measured transform. Elsewhere the
// indicator is display:none and the underline style stays as it was.
export default function TabNav({ prefix, tabs, activeTab, onChange, containerRef }) {
    return (
        <LayoutGroup id={`ds-tabs-${prefix}`}>
        <div ref={containerRef} style={dsVars(prefix)} className="ds-tabs flex space-x-6 overflow-x-auto custom-scroll mt-2 lg:mt-4 pb-2 w-full touch-pan-x">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`ds-tab${activeTab === tab.id ? ' is-active' : ''} text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === tab.id ? `text-${prefix}-primary border-b-2 border-${prefix}-primary pb-1` : 'text-text/45 hover:text-text pb-1'}`}
                >
                    {activeTab === tab.id && (
                        <motion.span
                            layoutId="ds-tab-indicator"
                            className="ds-tab-indicator hidden"
                            transition={INDICATOR_SPRING}
                            aria-hidden="true"
                        />
                    )}
                    <span className="ds-tab-label">{tab.label}</span>
                </button>
            ))}
        </div>
        </LayoutGroup>
    );
}
