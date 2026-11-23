import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// Tech Stack's three cards are a one-card carousel under tabs at every
// width (ProcessCarousel `single`): the phone switcher, desktop included.
describe('Tech Stack is a one-card tab carousel', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
  const mobileBlock = css.slice(css.indexOf('MOBILE (< 768px)'), css.indexOf('Responsive overrides (must be AFTER'));
  const tsx = fs.readFileSync(path.join(ROOT, 'src/components/SkillsSection.tsx'), 'utf8').replace(/\r\n/g, '\n');
  const tech = tsx.slice(tsx.indexOf('function TechStackSection'), tsx.indexOf('function AiIntakeSection'));

  it('TechStackSection renders its cards through a single-card ProcessCarousel', () => {
    expect(tech).toMatch(/<ProcessCarousel\s+single\s+variant="tech"/);
    expect(tsx).not.toMatch(/mobileOnly/);
    expect(tech.match(/<div key="(html|js|react)" className="tech-item-wrap rise-card">/g)).toHaveLength(3);
  });

  it('desktop: tabs left-aligned, one full-width card, text beside its demo', () => {
    const desk = css.slice(css.indexOf('Tech Stack on desktop: the phone switcher'));
    expect(desk).toMatch(/@media \(min-width: 1025px\) \{/);
    expect(desk).toMatch(/\.process-scroll-wrap--tech \.process-tabs \{[^}]*justify-content: flex-start;/);
    expect(desk).toMatch(/\.process-scroll-wrap--tech \.process-column-grid--inhouse \.process-swipe-slot \{\s*flex: 0 0 100%;/);
    // two columns: tabs + text left, the demo-only card right
    expect(desk).toMatch(/\.process-scroll-wrap--tech \{\s*display: grid;\s*grid-template-columns: minmax\(0, 5fr\) minmax\(0, 7fr\);/);
    expect(desk).toMatch(/\.process-scroll-wrap--tech \.process-tab-aside \{\s*grid-area: 2 \/ 1;\s*display: block;/);
    expect(desk).toMatch(/\.process-scroll-wrap--tech \.tech-item-text \{\s*display: none;/);
    // no slide on desktop: the cards stack in one cell and cross-fade
    expect(desk).toMatch(/\.process-scroll-wrap--tech \.process-column-grid--inhouse \{[^}]*display: grid;[^}]*transform: none !important;/);
    expect(desk).toMatch(/\.process-swipe-slot \{\s*grid-area: 1 \/ 1;/);
    expect(desk).toMatch(/\.process-scroll-wrap--tech \.process-swipe-slot\.is-out \{\s*opacity: 0;/);
    // below desktop the text stays in the card
    expect(css).toMatch(/\n {4}\.process-tab-aside \{\s*display: none;/);
    expect(tech).toMatch(/aside=\{TECH_TEXT\.map/);
    // the subtitle no longer pulls the cards up (the old 3-up stagger)
    expect(css).not.toMatch(/margin-bottom: -32px;/);
  });

  it('leaves room above the cards for the overhanging level badge', () => {
    const track = mobileBlock.match(/\.process-scroll-wrap--tech \.process-column-grid--inhouse \{[^}]*\}/)?.[0];
    expect(track).toMatch(/padding-top:\s*20px;/);
  });

  it('tightens the gap from the Swipe button to the Figma MCP heading', () => {
    // the heading renders inside the showcase's .mcp-scroll track now
    const rule = mobileBlock.match(/\.process-scroll-wrap--tech \+ \.mcp-scroll \{[^}]*\}/)?.[0];
    expect(rule).toMatch(/--mcp-head-gap:\s*56px;/);
  });

  it('stacks title, description and code inside the narrow carousel card', () => {
    const card = mobileBlock.match(/\.process-scroll-wrap--tech \.tech-item,\s*\.process-scroll-wrap--tech \.tech-item\.html-item,\s*\.process-scroll-wrap--tech \.tech-item\.react-item \{[^}]*\}/)?.[0];
    expect(card).toMatch(/grid-template-areas:\s*"header"\s*"desc"\s*"code";/);
  });
});
