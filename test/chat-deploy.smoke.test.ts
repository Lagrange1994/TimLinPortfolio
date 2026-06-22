import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// Regression guard for a production-only bug: Vercel compiles api/*.ts to
// .js while preserving ESM import/export syntax (tsconfig's "module":
// "esnext"). Node only accepts that syntax in a file it resolves as ESM,
// which requires two things this test pins down:
//   1. package.json declares "type": "module" (otherwise Node defaults
//      compiled .js files to CommonJS and throws "Cannot use import
//      statement outside a module" on every invocation).
//   2. Relative imports in the API files carry an explicit .js extension
//      (Node's native ESM resolver, unlike bundlers/Vitest, does not
//      infer extensions from extensionless specifiers).
//
// Vitest can't catch either failure mode on its own: it loads these same
// files through Vite's own resolver, which tolerates both the missing
// "type" field and extensionless specifiers. That's exactly why this broke
// in production while every local/CI test run stayed green — see
// vite.config.js's devChatApi(), which uses server.ssrLoadModule() instead
// of going through Node's native loader at all.

function readRepoFile(relPath: string): string {
  return readFileSync(path.join(process.cwd(), relPath), 'utf8');
}

describe('chat API deploy invariants (production module resolution)', () => {
  it('declares "type": "module" in package.json', () => {
    const pkg = JSON.parse(readRepoFile('package.json'));
    expect(pkg.type).toBe('module');
  });

  it('api/chat.ts imports its sibling with an explicit .js extension', () => {
    const src = readRepoFile('api/chat.ts');
    expect(src).toMatch(/from\s+['"]\.\/_chat-core\.js['"]/);
  });

  it('api/_chat-core.ts imports translations with an explicit .js extension', () => {
    const src = readRepoFile('api/_chat-core.ts');
    expect(src).toMatch(/from\s+['"]\.\.\/data\/translations\.js['"]/);
  });
});
