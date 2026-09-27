// Inline custom properties that feed src/styles/ds-home.css (the homepage
// design language, opt-in per page via <html class="ds-home">). Resolved
// from the project's prefix tokens, so light mode's re-tuned accent/surface
// values apply automatically. Harmless on pages that haven't opted in —
// nothing reads these variables there.
export default function dsVars(prefix) {
    return {
        '--ds-accent': `var(--color-${prefix}-primary)`,
        '--ds-on-accent': `var(--color-${prefix}-dark)`,
        '--ds-surface': `var(--color-${prefix}-dark)`,
    };
}
