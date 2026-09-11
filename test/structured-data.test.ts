import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const PERSON_ID = 'https://timlin-design.vercel.app/#tim-lin';
const PROJECT_PAGES = Array.from({ length: 13 }, (_, i) => `project_${String(i + 1).padStart(2, '0')}.html`);

const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');

function parseGraph(file: string): Record<string, any>[] {
  const html = read(file);
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  expect(blocks, `${file} should carry exactly one JSON-LD block`).toHaveLength(1);
  return JSON.parse(blocks[0][1])['@graph'];
}

const nodeOfType = (graph: Record<string, any>[], type: string) => graph.find((n) => n['@type'] === type);

describe('homepage structured data', () => {
  const graph = parseGraph('index.html');

  it('describes the author as a Person with contact and skill data', () => {
    const person = nodeOfType(graph, 'Person')!;
    expect(person['@id']).toBe(PERSON_ID);
    expect(person.name).toBe('Tim Lin');
    expect(person.jobTitle).toBeTruthy();
    expect(person.email).toContain('@');
    expect(person.knowsAbout.length).toBeGreaterThan(5);
  });

  it('lists every case study, and each listed page exists on disk', () => {
    const list = nodeOfType(graph, 'ItemList')!;
    expect(list.itemListElement).toHaveLength(PROJECT_PAGES.length);

    for (const entry of list.itemListElement) {
      const file = entry.url.split('/').pop();
      expect(PROJECT_PAGES, `${entry.url} is listed but is not a known project page`).toContain(file);
      expect(fs.existsSync(path.join(ROOT, file))).toBe(true);
      expect(entry.name).toBeTruthy();
    }
  });
});

describe('crawlable fallback content', () => {
  // #root is empty in the served HTML until React mounts, so without the
  // <noscript> mirror a non-JS crawler finds no link to any case study.
  it('links to every case study from the homepage without running JS', () => {
    const noscript = read('index.html').match(/<noscript>([\s\S]*?)<\/noscript>/)![1];

    for (const page of PROJECT_PAGES) {
      expect(noscript, `homepage noscript should link to ${page}`).toContain(`href="/${page}"`);
    }
  });

  it('gives each case study page a heading and a description', () => {
    for (const page of PROJECT_PAGES) {
      const noscript = read(page).match(/<noscript>([\s\S]*?)<\/noscript>/);
      expect(noscript, `${page} should have a noscript summary`).not.toBeNull();
      expect(noscript![1]).toMatch(/<h1>.+<\/h1>/);
      expect(noscript![1]).toContain('href="/"');
    }
  });
});

describe('case study structured data', () => {
  it.each(PROJECT_PAGES)('%s describes itself as a CreativeWork by the site author', (page) => {
    const graph = parseGraph(page);
    const work = nodeOfType(graph, 'CreativeWork')!;
    const canonical = read(page).match(/<link rel="canonical" href="([^"]*)"/)![1];

    expect(work.url).toBe(canonical);
    expect(work.name).toBeTruthy();
    expect(work.description).toBeTruthy();
    expect(work.image).toMatch(/^https:\/\//);
    // @id reference, not a copy — it has to resolve against index.html's Person.
    expect(work.author['@id']).toBe(PERSON_ID);
    expect(nodeOfType(graph, 'Person')!['@id']).toBe(PERSON_ID);
  });

  it.each(PROJECT_PAGES)('%s breadcrumbs back to the portfolio home', (page) => {
    const crumbs = nodeOfType(parseGraph(page), 'BreadcrumbList')!.itemListElement;
    expect(crumbs[0].item).toBe('https://timlin-design.vercel.app/');
    expect(crumbs[1].item).toContain(page);
  });
});
