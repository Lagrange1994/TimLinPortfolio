import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// Phones get Tech Stack's three cards as the same one-card peek carousel
// as Design Process (ProcessCarousel, mobileOnly). Desktop/tablet keep the
// plain .tech-items grid, so its nth-child stagger still applies.
describe('Tech Stack is a swipe carousel on phones only', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/portfolio.css'), 'utf8').replace(/\r\n/g, '\n');
  const mobileBlock = css.slice(css.indexOf('MOBILE (< 768px)'), css.indexOf('Responsive overrides (must be AFTER'));
  const tsx = fs.readFileSync(path.join(ROOT, 'src/components/SkillsSection.tsx'), 'utf8').replace(/\r\n/g, '\n');
  const tech = tsx.slice(tsx.indexOf('function TechStackSection'), tsx.indexOf('function AiIntakeSection'));

  it('TechStackSection renders its cards through a mobile-only ProcessCarousel', () => {
    expect(tech).toMatch(/<ProcessCarousel\s+mobileOnly\s+className="tech-items"\s+variant="tech"/);
    expect(tech.match(/<div key="(html|js|react)" className="tech-item-wrap rise-card">/g)).toHaveLength(3);
  });

  it('above the phone breakpoint the carousel renders the plain grid wrapper', () => {
    expect(tsx).toContain('if (mobileOnly && !isMobile) return <div className={className}>{cards}</div>;');
  });

  it('leaves room above the cards for the overhanging level badge', () => {
    const track = mobileBlock.match(/\.process-scroll-wrap--tech \.process-column-grid--inhouse \{[^}]*\}/)?.[0];
    expect(track).toMatch(/padding-top:\s*20px;/);
  });

  it('tightens the gap from the Swipe button to the Figma MCP heading', () => {
    const rule = mobileBlock.match(/\.process-scroll-wrap--tech \+ \.figma-mcp-header \{[^}]*\}/)?.[0];
    expect(rule).toMatch(/margin-top:\s*56px;/);
  });

  it('stacks title, description and code inside the narrow carousel card', () => {
    const card = mobileBlock.match(/\.process-scroll-wrap--tech \.tech-item,\s*\.process-scroll-wrap--tech \.tech-item\.html-item,\s*\.process-scroll-wrap--tech \.tech-item\.react-item \{[^}]*\}/)?.[0];
    expect(card).toMatch(/grid-template-areas:\s*"header"\s*"desc"\s*"code";/);
  });
});
