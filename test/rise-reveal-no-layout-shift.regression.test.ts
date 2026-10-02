import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// .rise-soft text used to animate line-height (a layout property): blocks
// sat at 60% height until revealed, then grew while the user scrolled,
// pushing everything below them — visible as the page nudging itself.
describe('useRiseReveal never animates layout properties', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/utils/useRiseReveal.ts'), 'utf8');

  it('does not touch lineHeight or contain', () => {
    expect(src).not.toMatch(/lineHeight:/);
    expect(src).not.toMatch(/style\.contain/);
  });

  it('squashes text with a scaleY transform from its top edge and springs it back', () => {
    expect(src).toMatch(/gsap\.set\(el, \{ scaleY: 0\.82, transformOrigin: 'center top' \}\);/);
    expect(src).toMatch(/tl\.to\(el, \{ scaleY: 1, duration: DUR \* 1\.15, ease: STRETCH_EASE \}, 0\);/);
  });
});
