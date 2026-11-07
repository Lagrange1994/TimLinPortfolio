import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Contact's LINE banner and open-for-work strip put their button in a notch
// cut out of the bottom-right corner (the shared NotchCard, mirrored from
// About's bottom-left notch).
const root = resolve(__dirname, '..');
const tsx = readFileSync(resolve(root, 'src/components/ContactSection.tsx'), 'utf8');
const notch = readFileSync(resolve(root, 'src/components/NotchCard.tsx'), 'utf8');
const css = readFileSync(resolve(root, 'src/styles/portfolio.css'), 'utf8');

describe('Contact notched cards', () => {
  it('the LINE button and Send Email sit in a right-hand notch', () => {
    expect(tsx).toContain("import NotchCard from './NotchCard';");
    expect(tsx).toMatch(/<NotchCard\s+area="contact-line-notch"\s+side="right"\s+shadow=\{false\}\s+className="line-banner rise-card sc-card"\s+notch=\{\s*<a\s+className="line-btn"/);
    expect(tsx).toMatch(/<NotchCard\s+area="contact-cta-notch"\s+side="right"\s+shadow=\{false\}\s+className="cta-strip sc-card rise-card"\s+notch=\{\s*<button\s+ref=\{sendEmailRef\}/);
    // the account ID moved up under the copy; the old CTA column is gone
    expect(tsx).toMatch(/<div className="line-desc">\{t\.line_desc\}<\/div>\s*<div className="line-id">/);
    expect(tsx).not.toContain('line-cta');
    expect(css).not.toContain('.line-cta');
  });

  it('NotchCard mirrors its notch for side="right"', () => {
    expect(notch).toContain(`side === 'right' ? ' notch-right' : ''`);
    expect(notch).toContain('data-rise-with={`.${area} > .has-notch`}');
    expect(notch).toContain('notchPath(cw, ch, {');
    // no two-layer mask anywhere on a notched card: the cursor ring is the
    // outline's second path, not .sc-card::after
    expect(css).toContain('.about-notch > .has-notch::after { display: none; }');
    expect(notch).toMatch(/<path ref=\{ring\} className="notch-ring" fill="none" stroke=\{`url\(#\$\{glowId\}\)`\} \/>/);
    expect(notch).toMatch(/\}, \[side\]\);/);
    expect(css).toContain('.about-notch.notch-right > .about-notch-tags { justify-self: end; }');
  });

  it('the cards keep clear of the notch; the LINE button is a capsule', () => {
    expect(css).toMatch(/\.line-banner\.has-notch \{[^}]*padding-right: calc\(var\(--nw\) \+ 16px\);/);
    expect(css).toContain('.cta-strip.has-notch { padding-right: calc(var(--nw) + 12px); }');
    expect(css).toMatch(/\.line-btn \{[^}]*border-radius: 9999px;/);
    // its green rim is drawn by the notch outline (the ::before rim can't
    // follow the notch)
    expect(css).toMatch(/\.line-banner\.has-notch \{\s*--notch-stroke: var\(--line\);\s*--notch-stroke-w: 1\.5px;/);
    expect(css).toContain('.line-banner.has-notch::before { display: none; }');
    // the clip cuts the banner's own glow, so the wrapper casts it
    expect(css).toMatch(/\.contact-line-notch \{[^}]*filter: drop-shadow/);
  });

  it('nothing eats the outline stroke', () => {
    // .sc-card's overflow:hidden clips to the padding box, i.e. inside the
    // border where the stroke sits; the clip-path contains the card instead
    expect(css).toMatch(/\.about-notch > \.has-notch \{[^}]*clip-path: var\(--notch-clip, none\);[^}]*overflow: visible;/);
    // the path uses the exact fractional border box, not rounded offsets
    expect(notch).toContain('const cw = parseFloat(cs.width) || c.offsetWidth, ch = parseFloat(cs.height) || c.offsetHeight;');
  });

  it('notched cards cast no rectangular hover shadow under the notch', () => {
    // the box-shadow twins can't follow the notch; the wrapper's centred
    // drop-shadow does
    expect(css).toContain('.about-notch > .bento-shadow,\r\n    .card-shadow-wrap:has(> .about-notch)::after { display: none; }'.replace(/\r\n/g, css.includes('\r\n') ? '\r\n' : '\n'));
    expect(css).toMatch(/\.about-notch:not\(\.contact-line-notch\):has\(> \.has-notch:hover\) \{\s*filter: drop-shadow\(0 0 /);
    expect(css).not.toMatch(/\.contact-line-notch \{[^}]*drop-shadow\(10px 24px/);
  });
});
