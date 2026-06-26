import { useEffect, useRef, useState } from 'react';

export type CodeToken = { text: string; cls?: string };
export type CodeVersion = CodeToken[][];

export type FlatChar = { ch: string; cls?: string };

export function flatten(version: CodeVersion): FlatChar[] {
  const out: FlatChar[] = [];
  version.forEach((line, li) => {
    line.forEach(tok => {
      for (const ch of tok.text) out.push({ ch, cls: tok.cls });
    });
    if (li < version.length - 1) out.push({ ch: '\n' });
  });
  return out;
}

export function commonPrefixLen(a: FlatChar[], b: FlatChar[]) {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i].ch === b[i].ch) i++;
  return i;
}

export function toRuns(flat: FlatChar[], count: number) {
  const runs: { text: string; cls?: string }[] = [];
  for (let i = 0; i < count; i++) {
    const { ch, cls } = flat[i];
    const last = runs[runs.length - 1];
    if (last && last.cls === cls) last.text += ch;
    else runs.push({ text: ch, cls });
  }
  return runs;
}

const TYPE_MS = 32;
const DELETE_MS = 16;
const HOLD_MS = 1700;

type Phase = 'type' | 'delete' | 'hold';

// Cycles through `versions` forever: types the first version in from blank,
// then repeatedly backspaces to the point where the next version's text
// diverges and types the rest forward — i.e. it looks like someone editing
// the snippet, not just a one-shot typewriter intro.
export default function TypingCode({ versions, className = 'tcp-code' }: { versions: CodeVersion[]; className?: string }) {
  // Computed once from the initial `versions` prop and never reassigned —
  // a lazy initial state (rather than a ref) so render can read it directly
  // without tripping the "no ref access during render" rule.
  const [flats] = useState<FlatChar[][]>(() => versions.map(flatten));
  const [state, setState] = useState({ idx: 0, count: 0 });
  const [reduced, setReduced] = useState(true);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (reduced || versions.length < 2) return;
    const el = preRef.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout>;
    let idx = 0;
    let count = 0;
    let phase: Phase = 'type';

    function run() {
      if (phase === 'type') {
        const target = flats[idx];
        if (count < target.length) count += 1;
        else phase = 'hold';
      } else if (phase === 'hold') {
        phase = 'delete';
      } else {
        const nextIdx = (idx + 1) % flats.length;
        const common = commonPrefixLen(flats[idx], flats[nextIdx]);
        if (count > common) {
          count -= 1;
        } else {
          idx = nextIdx;
          phase = 'type';
        }
      }
      setState({ idx, count });
      timer = setTimeout(run, phase === 'type' ? TYPE_MS : phase === 'delete' ? DELETE_MS : HOLD_MS);
    }

    // Only start once the card has actually scrolled into view.
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      timer = setTimeout(run, TYPE_MS);
    }, { threshold: 0.15 });
    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [reduced, versions.length, flats]);

  const flat = flats[reduced ? 0 : state.idx];
  const count = reduced ? flat.length : state.count;
  const runs = toRuns(flat, count);
  // Pin the box to its tallest version so typing/deleting lines doesn't
  // resize the card around it — only the text inside grows and shrinks.
  const maxLines = Math.max(...versions.map(v => v.length));

  return (
    <pre ref={preRef} className={className} style={{ minHeight: `calc(${maxLines} * 1.65em + 28px)` }}>
      {runs.map((r, i) => r.cls ? <span key={i} className={r.cls}>{r.text}</span> : <span key={i}>{r.text}</span>)}
      {!reduced && <span className="tcp-cursor" aria-hidden="true" />}
    </pre>
  );
}
