import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const css = fs.readFileSync(path.resolve(__dirname, '..', 'src/components/AiFlowStepper.css'), 'utf8').replace(/\r\n/g, '\n');

// The Design Workflow card's 5 boxed steps wrapped Delivery onto a second row
// on phones (294px content box at 360px vs ~321px needed with the 4px-basis
// connectors). Measured one row at 320/360/390/412/600/767/900/1024px after:
// nowrap, connectors flex down to a 2px basis, steps trim padding/label when
// the screen is very narrow.
describe('collapsed Design Workflow stepper stays on one row below desktop', () => {
  const block = (query: string) => css.match(new RegExp(`@media \\(${query}\\) \\{[\\s\\S]*?\\n\\}\\n`))?.[0] ?? '';

  it('never wraps and lets connectors shrink to a 2px basis at tablet/phone widths', () => {
    const b = block('max-width: 1024px');
    expect(b).toMatch(/\.ai-card:not\(\.is-open\) \.ai-flow-stepper-boxed \{\s*flex-wrap: nowrap;/);
    expect(b).toMatch(/\.afs-connector \{\s*flex: 1 1 2px;\s*max-width: 16px;\s*margin: 0 2px;/);
  });

  it('trims step padding on narrow phones', () => {
    expect(block('max-width: 380px')).toMatch(/min-width: 0;\s*padding: 8px 5px 7px;/);
  });

  it('also shrinks the label on the narrowest phones', () => {
    const b = block('max-width: 340px');
    expect(b).toMatch(/padding: 8px 3px 7px;/);
    expect(b).toMatch(/\.afs-label \{\s*font-size: 7px;/);
  });

  it('only applies to the collapsed card (expanded pill layout untouched)', () => {
    for (const q of ['max-width: 1024px', 'max-width: 380px', 'max-width: 340px']) {
      expect(block(q)).not.toMatch(/\.is-open \./);
    }
  });
});
