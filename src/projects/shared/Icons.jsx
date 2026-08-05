import React from 'react';

// Canonical SVGs for tools that appear as a "tool pill" in more than one
// project page. Keyed by tool name so every page that shows the same tool
// renders the exact same icon. Project-specific solution/feature icons stay
// local to each project file — those differ in meaning per case study, not
// just in styling.
const SharedIcons = {
    Figma: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2H8.5C6.57 2 5 3.57 5 5.5C5 7.43 6.57 9 8.5 9H12V2Z" /><path d="M12 9H8.5C6.57 9 5 10.57 5 12.5C5 14.43 6.57 16 8.5 16H12V9Z" /><path d="M12 16H8.5C6.57 16 5 17.57 5 19.5C5 21.43 6.57 23 8.5 23C10.43 23 12 21.43 12 19.5V16Z" /><path d="M12 2H15.5C17.43 2 19 3.57 19 5.5C19 7.43 17.43 9 15.5 9H12V2Z" /><circle cx="15.5" cy="12.5" r="3.5" /></svg>,
    XD: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M8 8l4 8" /><path d="M12 8l-4 8" /></svg>,
    AI: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l-9 18h18L12 3z" /><circle cx="12" cy="13" r="2" /></svg>,
};

export default SharedIcons;
