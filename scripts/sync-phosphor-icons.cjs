#!/usr/bin/env node
// Single source of truth for the pinned Phosphor Icons CDN <link> block that
// appears in index.html and all 13 project_XX.html files. Run this after
// bumping PHOSPHOR_VERSION below (and recomputing the SRI hashes) so all 14
// files stay in lockstep instead of a manual 42-line find/replace.
//
//   node scripts/sync-phosphor-icons.cjs           # rewrite all 14 files
//   node scripts/sync-phosphor-icons.cjs --check    # exit 1 if any file is stale
//
// To bump the version: update PHOSPHOR_VERSION, then recompute each hash with
//   curl -s "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@<version>/src/<weight>/style.css" \
//     | openssl dgst -sha384 -binary | openssl base64 -A
// and paste the sha384-... result into INTEGRITY below.

const fs = require('node:fs');
const path = require('node:path');

const PHOSPHOR_VERSION = '2.1.2';
const WEIGHTS = ['regular', 'bold', 'fill'];
const INTEGRITY = {
  regular: 'sha384-6p9AefaqUhEVheRlj1mpAkbngHXy9mbYMrIdcIt4Jlc9lOLIablJq3bBsLOjGwZ7',
  bold: 'sha384-nblAP2mo2pVPyMQZDw9Xy9Cwgs9lowushAYep4w5+Q9kF4Ibf3n0B/gCMVdR+Vqy',
  fill: 'sha384-pPVoXE8ft+zxKtxIDDI7SfTK6y95NHm4qa+hKEg/hs8VkjW5IP+9/dGOPCbDpUPl',
};

function linkLine(weight) {
  const href = `https://cdn.jsdelivr.net/npm/@phosphor-icons/web@${PHOSPHOR_VERSION}/src/${weight}/style.css`;
  return `<link rel="stylesheet" href="${href}" integrity="${INTEGRITY[weight]}" crossorigin="anonymous" />`;
}

const LINKS_RE = /<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/@phosphor-icons\/web@[^"]+\/src\/regular\/style\.css"[^>]*\/>\r?\n(?:[ \t]*)<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/@phosphor-icons\/web@[^"]+\/src\/bold\/style\.css"[^>]*\/>\r?\n(?:[ \t]*)<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/@phosphor-icons\/web@[^"]+\/src\/fill\/style\.css"[^>]*\/>/;

const repoRoot = path.resolve(__dirname, '..');
const files = ['index.html', ...Array.from({ length: 13 }, (_, i) => `project_${String(i + 1).padStart(2, '0')}.html`)];

const checkOnly = process.argv.includes('--check');
let stale = [];

for (const file of files) {
  const filePath = path.join(repoRoot, file);
  const original = fs.readFileSync(filePath, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const indentMatch = original.match(/([ \t]*)<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/@phosphor-icons\/web@[^"]+\/src\/regular/);
  const indent = indentMatch ? indentMatch[1] : '  ';
  const replacement = [linkLine('regular'), linkLine('bold'), linkLine('fill')].join(eol + indent);

  if (!LINKS_RE.test(original)) {
    console.error(`SKIP (no match): ${file}`);
    continue;
  }

  const updated = original.replace(LINKS_RE, replacement);
  if (updated !== original) {
    stale.push(file);
    if (!checkOnly) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`updated: ${file}`);
    }
  }
}

if (checkOnly) {
  if (stale.length) {
    console.error(`Stale Phosphor CDN links in: ${stale.join(', ')}. Run 'node scripts/sync-phosphor-icons.cjs' to fix.`);
    process.exit(1);
  }
  console.log('All 14 files match the pinned Phosphor version/integrity.');
}
