import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { syncPhosphorIcons } = require('../scripts/sync-phosphor-icons.cjs') as {
  syncPhosphorIcons: (options: { repoRoot: string; checkOnly: boolean }) => { stale: string[]; missing: string[] };
};

// Regression: the pinned Phosphor Icons CDN <link> block (version + SRI
// integrity hash, one line per weight) is duplicated across all 13
// project_XX.html files — 39 lines (index.html self-hosts a subset instead:
// scripts/subset-icons.mjs, test/icon-faces.test.ts). There's no templating
// for these static Vite MPA entry HTML files, so nothing stops one file
// drifting out of lockstep with the rest on a manual edit. This asserts all
// 13 agree, and that every link carries an integrity + crossorigin
// attribute (added so a compromised/edge-cached CDN response can't silently
// inject altered CSS into all 13 pages — the old unpkg bootstrap script had
// no such protection either, but these links are easy to pin now that
// they're already being touched).
//
// `npm run sync:phosphor` (scripts/sync-phosphor-icons.cjs) is the fix when
// this test fails after bumping PHOSPHOR_VERSION there.

const WEIGHTS = ['regular', 'bold', 'fill'] as const;

function extractLink(html: string, weight: string) {
  const re = new RegExp(
    `<link rel="stylesheet" href="(https://cdn\\.jsdelivr\\.net/npm/@phosphor-icons/web@([^"/]+)/src/${weight}/style\\.css)" integrity="(sha384-[^"]+)" crossorigin="anonymous" />`
  );
  const m = html.match(re);
  return m ? { href: m[1], version: m[2], integrity: m[3] } : null;
}

describe('Phosphor CDN links stay in lockstep across the 13 project HTML entry files', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const files = [...Array.from({ length: 13 }, (_, i) => `project_${String(i + 1).padStart(2, '0')}.html`)];

  it('every file pins the same version and integrity hash for each weight', () => {
    const byWeight: Record<string, Array<{ file: string; version: string; integrity: string }>> = {
      regular: [],
      bold: [],
      fill: [],
    };

    for (const file of files) {
      const html = fs.readFileSync(path.join(repoRoot, file), 'utf8');
      for (const weight of WEIGHTS) {
        const link = extractLink(html, weight);
        expect(link, `${file} is missing a pinned+integrity ${weight} Phosphor link`).toBeTruthy();
        byWeight[weight].push({ file, version: link!.version, integrity: link!.integrity });
      }
    }

    for (const weight of WEIGHTS) {
      const versions = new Set(byWeight[weight].map(e => e.version));
      const integrities = new Set(byWeight[weight].map(e => e.integrity));
      expect(Array.from(versions), `${weight}: version drift across files`).toHaveLength(1);
      expect(Array.from(integrities), `${weight}: integrity hash drift across files`).toHaveLength(1);
    }
  });

  it('flags a missing entire link block instead of treating it as a passing check', () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'phosphor-sync-'));
    try {
      for (const file of files) {
        fs.copyFileSync(path.join(repoRoot, file), path.join(fixtureRoot, file));
      }
      const target = path.join(fixtureRoot, 'project_01.html');
      const html = fs.readFileSync(target, 'utf8');
      fs.writeFileSync(target, html.replace(/\s*<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/@phosphor-icons\/web[^>]+\/>\r?\n/g, '\n'));

      const result = syncPhosphorIcons({ repoRoot: fixtureRoot, checkOnly: true });
      expect(result.missing).toEqual(['project_01.html']);
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
