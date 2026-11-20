// Tech Stack's square tiles (desktop, the card's lower-left): one small
// illustration per card, drawn to say what its text says. White line art
// on the card's colour (the tile's background, --sq-c); the accent bits
// use the same colour. No text: the shapes carry it.
//
// html  — "semantic structure": a page wireframe whose header / main /
//          aside / footer light up in turn, as if being read
// js    — "describe the problem → AI → interaction": a request bubble, the
//          AI spark, a cursor pressing a button and a card rising in
// react — "Flexbox / RWD": three tiles in a wide frame reflow into a
//          narrow one's column, and back

export type TechSquareKey = 'html' | 'js' | 'react';

const W = 'rgba(255,255,255,.92)';
const W2 = 'rgba(255,255,255,.38)';
const W3 = 'rgba(255,255,255,.16)';

function HtmlArt() {
  return (
    <>
      <rect x="16" y="14" width="88" height="92" rx="10" fill={W3} stroke={W} strokeWidth="2" />
      {/* header, with the </> mark */}
      <rect className="sq-block sq-b1" x="24" y="23" width="72" height="14" rx="4" fill={W} />
      <path d="M31 27l-3 3 3 3M37 27l3 3-3 3" fill="none" stroke="var(--sq-c)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="46" y="28.5" width="30" height="3" rx="1.5" fill="var(--sq-c)" opacity=".55" />
      {/* main (article) + aside */}
      <rect className="sq-block sq-b2" x="24" y="44" width="44" height="36" rx="4" fill={W2} />
      <rect x="30" y="51" width="26" height="3" rx="1.5" fill={W} />
      <rect x="30" y="58" width="32" height="2.5" rx="1.25" fill={W} opacity=".7" />
      <rect x="30" y="64" width="22" height="2.5" rx="1.25" fill={W} opacity=".7" />
      <rect x="30" y="70" width="28" height="2.5" rx="1.25" fill={W} opacity=".7" />
      <rect className="sq-block sq-b3" x="72" y="44" width="24" height="36" rx="4" fill={W2} />
      <rect x="77" y="51" width="14" height="10" rx="2" fill={W} opacity=".8" />
      <rect x="77" y="65" width="14" height="2.5" rx="1.25" fill={W} opacity=".7" />
      {/* footer */}
      <rect className="sq-block sq-b4" x="24" y="87" width="72" height="11" rx="3.5" fill={W2} />
      {/* the reading outline, one block at a time */}
      <rect className="sq-scan sq-b1" x="21" y="20" width="78" height="20" rx="6" />
      <rect className="sq-scan sq-b2" x="21" y="41" width="50" height="42" rx="6" />
      <rect className="sq-scan sq-b3" x="69" y="41" width="30" height="42" rx="6" />
      <rect className="sq-scan sq-b4" x="21" y="84" width="78" height="17" rx="5.5" />
    </>
  );
}

function JsArt() {
  return (
    <>
      {/* the request, described */}
      <path d="M22 16h44a8 8 0 0 1 8 8v8a8 8 0 0 1-8 8H34l-8 6v-6h-4a8 8 0 0 1-8-8v-8a8 8 0 0 1 8-8z" fill={W} />
      <rect x="22" y="23" width="38" height="3" rx="1.5" fill="var(--sq-c)" />
      <rect x="22" y="30" width="26" height="3" rx="1.5" fill="var(--sq-c)" opacity=".55" />
      {/* → AI */}
      <path className="sq-flow" d="M62 44c6 4 8 8 8 12" fill="none" stroke={W} strokeWidth="2" strokeLinecap="round" strokeDasharray="2 4" />
      <g className="sq-spark">
        <path d="M78 52c1.2 6 3 7.8 9 9-6 1.2-7.8 3-9 9-1.2-6-3-7.8-9-9 6-1.2 7.8-3 9-9z" fill={W} />
      </g>
      <path className="sq-flow" d="M78 74c0 4-2 6-4 8" fill="none" stroke={W} strokeWidth="2" strokeLinecap="round" strokeDasharray="2 4" />
      {/* → the interaction: press the button, the card rises in */}
      <g className="sq-press">
        <rect x="56" y="84" width="44" height="16" rx="8" fill={W} />
        <rect x="66" y="90.5" width="24" height="3" rx="1.5" fill="var(--sq-c)" />
      </g>
      <path className="sq-cursor" d="M92 92l0 14 3.6-3.4 2.6 5.6 2.6-1.2-2.6-5.4 5-.4z" fill={W} stroke="var(--sq-c)" strokeWidth="1.2" strokeLinejoin="round" />
      <g className="sq-rise">
        <rect x="16" y="58" width="32" height="42" rx="6" fill={W2} stroke={W} strokeWidth="1.6" />
        <rect x="21" y="63" width="22" height="14" rx="3" fill={W} opacity=".85" />
        <rect x="21" y="82" width="18" height="3" rx="1.5" fill={W} />
        <rect x="21" y="89" width="12" height="2.5" rx="1.25" fill={W} opacity=".7" />
      </g>
    </>
  );
}

function ReactArt() {
  return (
    <>
      {/* desktop frame ⇄ phone frame */}
      <rect className="sq-frame-wide" x="12" y="30" width="96" height="48" rx="7" fill={W3} stroke={W} strokeWidth="2" />
      <rect className="sq-frame-narrow" x="40" y="12" width="40" height="96" rx="8" fill={W3} stroke={W} strokeWidth="2" />
      {/* the three flex items: a row, then a column */}
      <rect className="sq-tile sq-t1" x="20" y="43" width="24" height="22" rx="4" fill={W} />
      <rect className="sq-tile sq-t2" x="48" y="43" width="24" height="22" rx="4" fill={W} opacity=".75" />
      <rect className="sq-tile sq-t3" x="76" y="43" width="24" height="22" rx="4" fill={W} opacity=".55" />
      {/* the accent dot on each, like the demo's coloured squares */}
      <circle className="sq-tile sq-t1" cx="27" cy="50" r="2.6" fill="var(--sq-c)" />
      <circle className="sq-tile sq-t2" cx="55" cy="50" r="2.6" fill="var(--sq-c)" />
      <circle className="sq-tile sq-t3" cx="83" cy="50" r="2.6" fill="var(--sq-c)" />
    </>
  );
}

const ART = { html: HtmlArt, js: JsArt, react: ReactArt } as const;

export default function TechSquareArt({ k }: { k: TechSquareKey }) {
  const Art = ART[k];
  return (
    <svg className={`tech-square-art tech-square-art--${k}`} viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true" focusable="false">
      <Art />
    </svg>
  );
}
