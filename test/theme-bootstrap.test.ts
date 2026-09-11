import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
// project_13 has no light/dark theme at all (fixed industrial UI), so it
// carries no bootstrap script — only these 13 pages do.
const PAGES = ['index.html', ...Array.from({ length: 12 }, (_, i) => `project_${String(i + 1).padStart(2, '0')}.html`)];

function extractBootstrapScript(html: string): string {
  const match = html.match(/<script>\s*\(function \(\) \{\s*try \{\s*var t = localStorage\.getItem\('theme'\);[\s\S]*?\}\)\(\);\s*<\/script>/);
  if (!match) throw new Error('theme bootstrap <script> block not found');
  return match[0].replace(/^<script>/, '').replace(/<\/script>$/, '');
}

// Runs the exact inline script shipped in the HTML file (not a reimplementation)
// against a fake document/localStorage/matchMedia, and reports what attribute
// it set. This is what actually executes in the browser before React mounts.
function runBootstrap(script: string, { stored, prefersLight }: { stored: string | null; prefersLight: boolean }) {
  let dataTheme: string | null = null;
  const fakeWindow = {
    matchMedia: (query: string) => ({ matches: query.includes('light') ? prefersLight : false }),
  };
  const fakeDocument = {
    documentElement: {
      setAttribute: (name: string, value: string) => { if (name === 'data-theme') dataTheme = value; },
    },
  };
  const fakeLocalStorage = { getItem: (key: string) => (key === 'theme' ? stored : null) };

  const fn = new Function('window', 'document', 'localStorage', script);
  fn(fakeWindow, fakeDocument, fakeLocalStorage);
  return dataTheme;
}

describe.each(PAGES)('%s theme bootstrap script', (page) => {
  const script = extractBootstrapScript(fs.readFileSync(path.join(ROOT, page), 'utf8'));

  it('follows the OS/browser preference when nothing is stored', () => {
    expect(runBootstrap(script, { stored: null, prefersLight: true })).toBe('light');
    expect(runBootstrap(script, { stored: null, prefersLight: false })).toBe(null); // no attr = dark default
  });

  it('falls back to dark when nothing is stored and there is no OS preference either', () => {
    expect(runBootstrap(script, { stored: null, prefersLight: false })).toBe(null);
  });

  it('an explicit stored choice always wins over the OS preference', () => {
    expect(runBootstrap(script, { stored: 'dark', prefersLight: true })).toBe(null);
    expect(runBootstrap(script, { stored: 'light', prefersLight: false })).toBe('light');
  });
});

describe('theme bootstrap consistency', () => {
  it('ships byte-identical script logic on every page (index + all 12 project pages)', () => {
    const scripts = PAGES.map((page) => extractBootstrapScript(fs.readFileSync(path.join(ROOT, page), 'utf8')));
    for (const script of scripts) expect(script).toBe(scripts[0]);
  });
});
