import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// project_13.jsx is the one project entry that doesn't import shared/index.js
// (see CLAUDE.md — it's a fully separate style/loader system from
// project_01–12), so it's easy for an image added there to reach straight
// for a raw <img> instead of ImageWithSkeleton, leaving that one spot with
// no shimmer placeholder while every other project has it. This test guards
// against that regression.
describe('project_13 image loading uses ImageWithSkeleton', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/projects/project_13.jsx'), 'utf8');

  it('imports the shared ImageWithSkeleton component', () => {
    expect(source).toMatch(/import\s+ImageWithSkeleton\s+from\s+['"]\.\/shared\/ImageWithSkeleton['"]/);
  });

  it('never renders a raw <img> tag — every image goes through ImageWithSkeleton', () => {
    expect(source).not.toMatch(/<img\b/);
  });

  it('uses ImageWithSkeleton for both the card thumbnail and the showcase image', () => {
    const uses = source.match(/<ImageWithSkeleton\b/g) || [];
    expect(uses.length).toBeGreaterThanOrEqual(2);
  });
});

// ImageWithSkeleton.jsx's skeleton <div> relies on a global `.skeleton` class
// + `shimmer` keyframes. project_13 imports its own project13-tailwind.css
// (not projects-tailwind.css, which is where every other project's .skeleton
// rule lives), so without its own copy the shimmer placeholder would render
// invisibly (no background, no animation) even though the component mounts.
describe('project13-tailwind.css defines its own .skeleton rule', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/styles/project13-tailwind.css'), 'utf8');

  it('defines .skeleton with a shimmer animation', () => {
    expect(css).toMatch(/\.skeleton\s*\{[^}]*animation:\s*shimmer/);
  });

  it('defines the shimmer @keyframes', () => {
    expect(css).toMatch(/@keyframes\s+shimmer\s*\{/);
  });
});
