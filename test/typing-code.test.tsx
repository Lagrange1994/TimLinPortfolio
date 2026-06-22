import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import TypingCode, { flatten, commonPrefixLen, toRuns, type CodeVersion } from '../src/components/TypingCode';

const VERSION_A: CodeVersion = [
  [{ text: 'const', cls: 'tok-kw' }, { text: ' x = ' }, { text: '1', cls: 'tok-num' }],
  [{ text: '}' }],
];
const VERSION_B: CodeVersion = [
  [{ text: 'const', cls: 'tok-kw' }, { text: ' x = ' }, { text: '2', cls: 'tok-num' }],
  [{ text: '}' }],
];

describe('flatten', () => {
  it('expands tokens into one char per entry, joining lines with a newline char', () => {
    const flat = flatten(VERSION_A);
    expect(flat.map(f => f.ch).join('')).toBe('const x = 1\n}');
  });

  it('tags each char with its token class', () => {
    const flat = flatten(VERSION_A);
    expect(flat[0]).toEqual({ ch: 'c', cls: 'tok-kw' });
    expect(flat[6]).toEqual({ ch: 'x', cls: undefined });
  });
});

describe('commonPrefixLen', () => {
  it('returns the full length when two versions are identical', () => {
    const a = flatten(VERSION_A);
    expect(commonPrefixLen(a, a)).toBe(a.length);
  });

  it('stops at the first differing character', () => {
    const a = flatten(VERSION_A);
    const b = flatten(VERSION_B);
    // "const x = " is shared; the digit right after it differs (1 vs 2).
    expect(commonPrefixLen(a, b)).toBe('const x = '.length);
  });
});

describe('toRuns', () => {
  it('merges consecutive characters that share a token class into one run', () => {
    const flat = flatten(VERSION_A);
    const runs = toRuns(flat, flat.length);
    expect(runs[0]).toEqual({ text: 'const', cls: 'tok-kw' });
    expect(runs[1]).toEqual({ text: ' x = ', cls: undefined });
    expect(runs[2]).toEqual({ text: '1', cls: 'tok-num' });
  });

  it('truncates to the requested character count, mid-token if needed', () => {
    const flat = flatten(VERSION_A);
    const runs = toRuns(flat, 3);
    expect(runs).toEqual([{ text: 'con', cls: 'tok-kw' }]);
  });
});

// Regression guard: TypingCode must render the final version statically (no
// cursor, no timers) when prefers-reduced-motion is on, instead of looping
// the type/delete animation indefinitely.
describe('TypingCode reduced-motion fallback', () => {
  it('renders the first version fully typed with no blinking cursor', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));

    const { container } = render(<TypingCode versions={[VERSION_A, VERSION_B]} />);

    expect(container.textContent).toBe('const x = 1\n}');
    expect(container.querySelector('.tcp-cursor')).toBeNull();
  });
});
