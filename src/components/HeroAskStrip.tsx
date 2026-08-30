import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../context/LangContext';
import { askTim } from '../utils/askTim';
import { pickReplacement } from '../utils/heroAskRotation';

/**
 * Fills the hero frame's bottom-right notch — the cut made for #chat-fab (see
 * #bg-notch-br in portfolio.css) — with the chat's own call to action: one
 * white capsule, button-height, holding the AI mark, the prompt, and three
 * small outlined question pills.
 *
 * The pills roll: every ROTATE_MS one of them flips its label upward and a
 * different suggestion rolls in from below, drawn at random from a pool of six
 * (pickReplacement keeps the same question from landing in two pills at once).
 * Three slots would otherwise advertise three of the six things the chat can
 * answer and hide the rest; rotating shows the whole range without needing
 * more room in the notch.
 *
 * The notch is ~491x76px and its geometry is fixed in px, so the strip has the
 * same room at every desktop width; the layout is sized for that budget and
 * the labels are deliberately shorter than ChatPanel's own quick-question
 * labels, which have a wider panel to sit in.
 *
 * Desktop-only: below 1025px there is no frame and therefore no notch, so the
 * CSS hides it (the base .hero-ask rule) rather than this component
 * duplicating the breakpoint in JS.
 *
 * The buttons ask the same questions as the panel's quick buttons — one set of
 * question strings, two sets of labels — so a click here lands the visitor in
 * the panel with an answer already coming.
 */

const SLOT_COUNT = 3;
const ROTATE_MS = 4200;

interface Suggestion {
  label: string;
  q: string;
}

interface Slot {
  /** What the pill shows now. */
  cur: Suggestion;
  /** What it showed a moment ago, kept only long enough to roll out of frame. */
  out: Suggestion | null;
}

export default function HeroAskStrip() {
  const { t, lang } = useLang();

  const pool = useMemo<Suggestion[]>(() => [
    { label: t.hero_ask_q1_label, q: t.chat_q2 },
    { label: t.hero_ask_q2_label, q: t.chat_q4 },
    { label: t.hero_ask_q3_label, q: t.chat_q6 },
    { label: t.hero_ask_q4_label, q: t.chat_q1 },
    { label: t.hero_ask_q5_label, q: t.chat_q3 },
    { label: t.hero_ask_q6_label, q: t.chat_q5 },
  ], [t]);

  const [slots, setSlots] = useState<Slot[]>(
    () => pool.slice(0, SLOT_COUNT).map(cur => ({ cur, out: null })),
  );

  // Switching language swaps every string at once; roll animations mid-swap
  // would show one pill in each language, so reset to the pool's first three.
  useEffect(() => {
    setSlots(pool.slice(0, SLOT_COUNT).map(cur => ({ cur, out: null })));
  }, [pool]);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    // Advance one pill at a time, left to right: all three flipping together
    // reads as the strip reloading rather than as a marquee.
    let next = 0;
    const id = setInterval(() => {
      const slot = next % SLOT_COUNT;
      next += 1;
      setSlots(prev => {
        const replacement = pickReplacement(pool, prev.map(s => s.cur));
        if (!replacement) return prev;
        return prev.map((s, i) => (
          i === slot ? { cur: replacement, out: s.cur } : { cur: s.cur, out: null }
        ));
      });
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [pool]);

  // Every pill is as wide as the pool's widest label, so a roll changes the
  // text without changing the layout — natural widths would shove the
  // neighbouring pills sideways on every flip. Measured rather than hardcoded
  // because the widest label differs per language, and re-measured once the
  // webfont lands (the fallback face measures differently).
  const measureRef = useRef<HTMLDivElement>(null);
  const [pillWidth, setPillWidth] = useState<number>();
  useLayoutEffect(() => {
    let cancelled = false;
    function measure() {
      const el = measureRef.current;
      if (cancelled || !el) return;
      const widths = Array.from(el.children, c => c.getBoundingClientRect().width);
      if (widths.length) setPillWidth(Math.ceil(Math.max(...widths)));
    }
    measure();
    document.fonts?.ready.then(measure);
    return () => { cancelled = true; };
  }, [pool]);

  return (
    <div className="hero-ask">
      <span className="hero-ask-label">
        <i className="ph-fill ph-sparkle" aria-hidden="true"></i>
        {t.hero_ask_label}
      </span>

      {/* Off-layout copy of every label at its natural width — the source for
          pillWidth above. Not rendered to the user. */}
      <div className="hero-ask-measure" ref={measureRef} aria-hidden="true">
        {pool.map(({ label }) => (
          <span key={label} className="hero-ask-btn">{label}</span>
        ))}
      </div>

      {slots.map(({ cur, out }, i) => (
        <button
          // Keyed by slot, not by content: the pill itself persists across a
          // roll, only the spans inside it change.
          key={`slot-${i}`}
          className="hero-ask-btn"
          style={pillWidth ? { width: pillWidth } : undefined}
          /* The visible label is clipped for width ("Process?"); screen
             readers get the question that will actually be sent. */
          aria-label={cur.q}
          onClick={() => askTim(cur.q)}
        >
          <span key={cur.label} className="hero-ask-roll">{cur.label}</span>
          {out && (
            <span key={`${out.label}-out`} className="hero-ask-roll is-out" aria-hidden="true">
              {out.label}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
