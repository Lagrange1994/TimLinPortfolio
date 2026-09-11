import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const PROJECT_PAGES = Array.from({ length: 13 }, (_, i) => `project_${String(i + 1).padStart(2, '0')}.html`);
const ALL_PAGES = ['index.html', ...PROJECT_PAGES];

const robots = fs.readFileSync(path.join(ROOT, 'public/robots.txt'), 'utf8');
const sitemap = fs.readFileSync(path.join(ROOT, 'public/sitemap.xml'), 'utf8');

describe('robots.txt', () => {
  it('does not disallow anything (public portfolio, nothing to gate)', () => {
    expect(robots).not.toMatch(/^Disallow:\s*\/\S/m);
  });

  it('points at the sitemap over https', () => {
    expect(robots).toContain('Sitemap: https://timlin-design.vercel.app/sitemap.xml');
  });

  it('explicitly allows the major AI crawlers, not just User-agent: *', () => {
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
      expect(robots, `${bot} should have its own Allow rule`).toMatch(new RegExp(`User-agent:\\s*${bot}\\b`));
    }
  });
});

describe('sitemap.xml', () => {
  it('is well-formed and lists exactly the homepage + 13 project pages', () => {
    const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toHaveLength(ALL_PAGES.length);

    const urls = new Set(locs);
    expect(urls.has('https://timlin-design.vercel.app/')).toBe(true);
    for (const page of PROJECT_PAGES) {
      expect(urls.has(`https://timlin-design.vercel.app/${page}`), `sitemap missing ${page}`).toBe(true);
    }
  });

  it('every <loc> matches a file that actually exists in the repo root', () => {
    const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    for (const loc of locs) {
      const file = new URL(loc).pathname === '/' ? 'index.html' : new URL(loc).pathname.slice(1);
      expect(fs.existsSync(path.join(ROOT, file)), `${loc} -> ${file} does not exist`).toBe(true);
    }
  });

  it('every canonical URL in the HTML pages is also listed in the sitemap', () => {
    const locs = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]));
    for (const page of PROJECT_PAGES) {
      const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
      const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)![1];
      expect(locs.has(canonical), `${page}'s canonical ${canonical} is missing from sitemap.xml`).toBe(true);
    }
  });
});
