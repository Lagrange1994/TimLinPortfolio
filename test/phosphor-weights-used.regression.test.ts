import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Regression tripwire: index.html/project_XX.html only load the regular,
// bold and fill Phosphor Icons weight stylesheets (see index.html's "Icons"
// comment) — thin/light/duotone were confirmed unused and dropped to save
// ~49KB + 3 requests per page. If a future icon is added with one of the
// dropped weights (e.g. `ph-light`), it renders with no icon glyph at all —
// no build error, just a missing icon. This greps the whole src tree for
// that so the next such addition fails loudly instead of silently.

function listFiles(dir: string, exts: string[], acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(full, exts, acc);
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      acc.push(full);
    }
  }
  return acc;
}

describe('Phosphor icon weights actually used match what index.html pins', () => {
  it('never uses ph-thin, ph-light, or ph-duotone anywhere in src/', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const files = listFiles(srcDir, ['.tsx', '.jsx', '.ts', '.js']);
    expect(files.length).toBeGreaterThan(0);

    const offenders: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(/\bph-(thin|light|duotone)\b/g);
      if (matches) offenders.push(`${file}: ${matches.join(', ')}`);
    }

    expect(offenders).toEqual([]);
  });
});
