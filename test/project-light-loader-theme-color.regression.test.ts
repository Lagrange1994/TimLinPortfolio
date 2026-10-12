import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Regression: in light mode the project pages' loading ring and text were the
// neutral --color-text gray. They must use each project's own theme color
// (the same prefix as the loader's tinted --color-<prefix>-dark background).
const ids = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

describe.each(ids)('project_%s light-mode loader', id => {
  const html = readFileSync(resolve(__dirname, '..', `project_${id}.html`), 'utf8');
  const prefix = html.match(
    /:root\[data-theme="light"\] \.loader \{\s*background: var\(--color-([a-z]+)-dark\);/,
  )?.[1];

  it('has a themed light loader background', () => {
    expect(prefix).toBeTruthy();
  });

  it('text uses the project primary', () => {
    expect(html).toMatch(
      new RegExp(
        `:root\\[data-theme="light"\\] \\.loader-text \\{\\s*color: var\\(--color-${prefix}-primary\\);`,
      ),
    );
  });

  it('ring uses the project primary', () => {
    expect(html).toMatch(
      new RegExp(
        `\\.loader-animation:after \\{\\s*box-shadow: 0 0 0 3px inset var\\(--color-${prefix}-primary\\);`,
      ),
    );
  });
});
