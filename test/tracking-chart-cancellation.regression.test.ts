import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// The tracking chart is loaded asynchronously. Closing its card after the
// timer starts but before import() resolves used to let the continuation make
// a chart after the effect's cleanup had already run, leaving that instance
// undisposed. Keep the cancellation guard adjacent to both cleanup and the
// post-import creation path.
describe('tracking chart async cleanup', () => {
  it('cancels an in-flight chart import before creating an instance', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../src/components/SkillsSection.tsx'),
      'utf8'
    );

    expect(source).toMatch(/let cancelled = false;/);
    expect(source).toMatch(/if \(cancelled \|\| !el\) return;/);
    expect(source).toMatch(/cancelled = true;\s*clearTimeout\(timer\);/);
  });
});
