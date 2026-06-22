# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast,
trust your instincts, and ship with confidence — without them, vibe coding is
just yolo coding. With tests, it's a superpower.

## Framework

[Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com/react)
(`jsdom` environment). Matches the project's existing Vite tooling, so no
separate build config is needed.

## Running tests

```bash
npm test
```

Config: `vitest.config.js`. Setup file: `test/setup.js`.

## Test layers

- **Unit tests** (`test/*.test.ts`) — pure logic: the chat API's injection/off-topic
  detection, helper functions, data transforms. No network, no DOM.
- **Integration tests** — React components rendered with `@testing-library/react`,
  asserting on user-visible behavior (not implementation details).
- **Smoke tests** (`test/*.smoke.test.ts`) — deploy-time sanity checks, e.g.
  `chat-deploy.smoke.test.ts` pins the ESM/CJS module-loading assumptions that
  only break in the production Vercel build, not in `vite dev` or Vitest's
  own resolver.
- **E2E tests** — covered by `/qa` (gstack browser QA), not by this framework.

## Conventions

- File naming: `<thing-under-test>.test.ts` / `.test.tsx`, colocated under `test/`.
- Assertions: `expect(...).toBe(...)` / `toContain(...)` from Vitest's Jest-compatible API.
- Mock external services (Gemini API, `fs` reads outside the repo) — never make
  real network calls in a test.
- Test behavior, not implementation: assert on `result.status` / `result.body`,
  not on internal regex matches.
