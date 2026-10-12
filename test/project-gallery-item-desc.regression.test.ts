import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Regression: the Interface Gallery buttons in most project pages showed only a
// title (project_02 had the intended title + one-line description). Every
// project that renders GalleryItemButton must pass a per-item `desc`, and the
// old generic "click to preview" placeholders must not come back.
const dir = resolve(__dirname, '..', 'src/projects');
const files = readdirSync(dir).filter(f => /^project_\d+\.jsx$/.test(f));
const read = (f: string) => readFileSync(resolve(dir, f), 'utf8');

describe('project gallery buttons carry a description', () => {
  const withGallery = files.filter(f => read(f).includes('<GalleryItemButton'));

  it('finds the gallery projects', () => {
    expect(withGallery.length).toBeGreaterThanOrEqual(11);
  });

  it.each(withGallery)('%s passes desc to every GalleryItemButton', f => {
    const src = read(f);
    const usages = src.match(/<GalleryItemButton[\s\S]*?\/>/g) ?? [];
    expect(usages.length).toBeGreaterThan(0);
    for (const u of usages) expect(u).toMatch(/\bdesc=\{/);
  });

  it.each(files)('%s has no generic placeholder hint left', f => {
    const src = read(f);
    expect(src).not.toMatch(/gallery_hint|gallery_item_hint/);
  });

  it.each(['project_01.jsx', 'project_03.jsx', 'project_05.jsx'])(
    '%s gives every gallery image a bilingual desc',
    f => {
      const src = read(f);
      const images = src.match(/\{ id: '[^']+', name: [^}]*?src: '\.\/img\/[^']+'[^}]*\}/g) ?? [];
      expect(images.length).toBeGreaterThan(5);
      for (const img of images) expect(img).toMatch(/desc: isZh \? '[^']+' : '/);
    },
  );

  it.each([
    ['project_08.jsx', 14],
    ['project_09.jsx', 4],
    ['project_12.jsx', 5],
  ])('%s has a zh and en *_desc translation for each of its %i items', (f, n) => {
    const src = read(f);
    const keys = src.match(/\bimg_[a-z0-9_]+_desc:/g) ?? [];
    expect(keys.length).toBe(n * 2);
  });
});
