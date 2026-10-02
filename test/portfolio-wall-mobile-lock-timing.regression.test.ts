import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.resolve(__dirname, '..', 'src/components/PortfolioSection.tsx'), 'utf8');

// On phones the wall used to lock its height/row scale only after the label's
// 'rise-settled' event. The wall's own scroll-in fade fires earlier, so it
// became visible at the CSS pre-lock fallback (85svh, rows unscaled) and then
// jumped (~30px, rows ~19% smaller) when the lock landed. Measured in a
// phone-emulated Chromium: lock now lands at opacity 0, before the fade.
describe('mobile Portfolio wall locks before it becomes visible', () => {
  const lockFn = source.match(/function lockWallGeometry\(\) \{[\s\S]*?\n    \}\n/)?.[0] ?? '';

  it('locks on intersection without waiting for the label to settle', () => {
    expect(source).not.toMatch(/labelSettled/);
    // (the notch effect has its own, unrelated rise-settled listener)
    const geometryEffect = source.slice(source.indexOf('function lockWallGeometry()'));
    expect(geometryEffect).not.toMatch(/addEventListener\('rise-settled'/);
    expect(source).toMatch(/if \(entries\.some\(e => e\.isIntersecting\)\) \{\s*lockWallGeometry\(\);/);
  });

  it('pins the mobile top from the offsetTop chain (immune to the label\'s rise transform) before reading the cap', () => {
    expect(lockFn).toMatch(/frame!\.style\.top = `\$\{offsetTopWithin\(label!\)\}px`;/);
    expect(lockFn.indexOf('offsetTopWithin(label!)')).toBeLessThan(lockFn.indexOf('measureMobileCapPx()'));
  });
});
