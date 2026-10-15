// Icon classes the homepage uses — shared by scripts/subset-icons.mjs and
// test/icon-faces.test.ts. Homepage = index.html + src/, minus the project
// pages' own sources and stylesheets (those still load the CDN icon CSS).
import fs from 'node:fs';
import path from 'node:path';

const STYLE_CLASSES = new Set(['fa-solid', 'fa-brands', 'fa-regular', 'fa-classic', 'fa-sharp', 'ph-bold', 'ph-fill', 'ph-light', 'ph-thin', 'ph-duotone']);
const EXCLUDE = [/[\\/]src[\\/]projects[\\/]/, /projects-tailwind\.css$/, /project13-tailwind\.css$/, /icon-faces\.css$/];

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.(tsx?|jsx?|css|html)$/.test(e.name)) files.push(p);
  }
  return files;
}

export function homepageSources(root) {
  return [path.join(root, 'index.html'), ...walk(path.join(root, 'src'))].filter(f => !EXCLUDE.some(re => re.test(f)));
}

export function usedIconClasses(root) {
  const fa = new Set();
  const ph = new Set();
  for (const file of homepageSources(root)) {
    for (const [name] of fs.readFileSync(file, 'utf8').matchAll(/\b(?:fa|ph)-[a-z0-9]+(?:-[a-z0-9]+)*/g)) {
      if (STYLE_CLASSES.has(name)) continue;
      (name.startsWith('fa-') ? fa : ph).add(name);
    }
  }
  return { fa, ph };
}
