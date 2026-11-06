import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Apple product page rhythm: generous room between sections, no divider
// lines, and every other section on a full-width --band tone.
const read = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');
const css = read('src/styles/portfolio.css');
const rule = (sel: RegExp) => css.match(sel)?.[0] ?? '';

describe('section rhythm', () => {
  it('sections have no divider line and roomy vertical padding', () => {
    const section = rule(/\n {4}\.section \{[\s\S]*?\n {4}\}/);
    expect(section).not.toMatch(/border-bottom/);
    expect(section).toMatch(/padding: clamp\(112px, calc\(14svh \/ var\(--z, 1\)\), 168px\) 48px;/);
  });

  it('the sticky Portfolio wall keeps its own 80px padding', () => {
    expect(rule(/\n {4}#portfolio\.section \{[\s\S]*?\n {4}\}/)).toMatch(/padding-top: 80px;[\s\S]*padding-bottom: 80px;/);
  });

  it('bands are full-bleed paint only, with a token in both themes', () => {
    expect(rule(/\.section-band \{[\s\S]*?\}/)).toMatch(/border-image: linear-gradient\(var\(--band\), var\(--band\)\) fill 0 \/ \/ 0 100vmax;/);
    expect(css.match(/--band: #/g)?.length).toBe(2);
  });

  it('alternate sections carry the band: process, my-skills, contact', () => {
    const skills = read('src/components/SkillsSection.tsx');
    expect(skills).toContain('<section className="section section-band" ref={sectionRef}>');
    expect(skills).toContain('<section id="my-skills" className="section section-band">');
    expect(read('src/components/ContactSection.tsx')).toContain('<section id="contact" className="section section-band"');
    expect(read('src/components/AboutSection.tsx')).not.toContain('section-band');
  });

  it('In-house and Freelance are split by room, not a line', () => {
    expect(rule(/\n {4}\.process-column \+ \.process-column \{[\s\S]*?\n {4}\}/)).not.toMatch(/border-top/);
  });
});
