import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

// The phone-shaped containers (aspect-[9/19]) fill their panel's height, so on
// phones dragging the resize handle changes their whole size. A fixed rem
// corner radius stayed the same in px while the phone grew, so the corners
// looked progressively squarer (project_04: 24px = 18.6% of the width by
// default, only 7.6% at the largest size). The phone radius is therefore a
// percentage of the box: `X% / Y%` with Y = X * 9/19, so both radii are the
// same length (a circular corner) at ANY size. Desktop (lg:) keeps its rem
// radius; there's no drag handle there.
const PHONE_BOXES: Array<{ file: string; radius: string }> = [
  { file: 'src/projects/shared/PhoneFrame.jsx', radius: '18.57%/8.8%' }, // used by 02 gallery + 04
  { file: 'src/projects/project_06.jsx', radius: '18.57%/8.8%' },
  { file: 'src/projects/project_08.jsx', radius: '15.47%/7.33%' },
  { file: 'src/projects/project_02.jsx', radius: '17.1%/8.1%' }, // comparison slider's phone
];

describe.each(PHONE_BOXES)('$file phone box keeps a constant corner proportion on phones', ({ file, radius }) => {
  const line = fs
    .readFileSync(path.join(ROOT, file), 'utf8')
    .split(/\r?\n/)
    .find((l) => l.includes('aspect-[9/19]'));

  it('has a phone box', () => {
    expect(line).toBeTruthy();
  });

  it(`uses a percentage radius (${radius}) below lg instead of a fixed rem`, () => {
    expect(line).toContain(`max-lg:rounded-[${radius}]`);
    expect(line).not.toMatch(/(^|\s)rounded-\[[\d.]+rem\]/);
  });

  it('keeps the rem radius on desktop', () => {
    expect(line).toContain('lg:rounded-[2.5rem]');
  });

  it('makes the radius circular: vertical % = horizontal % * 9/19', () => {
    const [x, y] = radius.split('/').map((v) => parseFloat(v));
    expect(y).toBeCloseTo((x * 9) / 19, 1);
  });
});
