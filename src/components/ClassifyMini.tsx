import { GEMINI_BEAM_STOPS } from './GoogleGeminiEffect';

// The "AI 會自動歸類需求" chart as a thumbnail icon, drawn for its size:
// problems >> solution. Left, the requests as they come in — pills at odd
// angles over a tangled line; middle, the AI mark at work; right, the same
// requests sorted — tidy category chips, each in its beam's colour with a
// check.
// Shapes only, no words (see useClassifyZoom).

const W = 230;
const H = 100;
// the AI mark between the two sides
export const AI_X = 117;

// [x, y, width, rotation] of the incoming requests
export const PROBLEM_PILLS: [number, number, number, number][] = [
  [14, 20, 30, -14], [48, 16, 22, 10], [20, 46, 24, 8],
  [52, 40, 30, -8], [12, 70, 28, 12], [46, 74, 22, -16],
];

// the sorted side: one chip per category (the chart's first four beams)
export const SOLUTION_CHIPS = GEMINI_BEAM_STOPS.slice(0, 4).map(s => s.color);

export default function ClassifyMini() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {/* problems: a tangle behind scattered, tilted pills */}
      <path
        className="mini-tangle"
        d="M10 52 C 24 24, 44 82, 56 50 S 84 22, 70 60 S 30 88, 44 34 S 86 76, 92 46"
        fill="none"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {PROBLEM_PILLS.map(([x, y, w, r], i) => (
        <rect
          key={i}
          className="mini-pill"
          x={x}
          y={y - 4}
          width={w}
          height="8"
          rx="4"
          transform={`rotate(${r} ${x + w / 2} ${y})`}
        />
      ))}

      {/* AI at work: requests flow in, through the spinning AI mark, and
          out sorted (CSS: the dashes flow, the ring turns, the spark pulses) */}
      <path className="mini-flow" d={`M96 ${H / 2} H${AI_X - 19}`} fill="none" strokeWidth="1.6" strokeLinecap="round" />
      <path className="mini-flow" d={`M${AI_X + 19} ${H / 2} H138`} fill="none" strokeWidth="1.6" strokeLinecap="round" />
      <g className="mini-ai" transform={`translate(${AI_X} ${H / 2})`}>
        <circle className="mini-ai-ring" r="17" fill="none" strokeWidth="1.6" strokeLinecap="round" />
        <circle className="mini-ai-core" r="12.5" />
        <path
          className="mini-ai-spark"
          d="M0 -7.5 C 1 -2.5, 2.5 -1, 7.5 0 C 2.5 1, 1 2.5, 0 7.5 C -1 2.5, -2.5 1, -7.5 0 C -2.5 -1, -1 -2.5, 0 -7.5 Z"
        />
      </g>

      {/* solution: the same requests, sorted into tidy chips */}
      {SOLUTION_CHIPS.map((color, i) => {
        const y = 22 + i * 19;
        return (
          <g key={color} className="mini-sol">
            <rect className="mini-chip" x="142" y={y - 7} width="76" height="14" rx="7" />
            <circle cx="151" cy={y} r="3" fill={color} />
            <rect className="mini-bar" x="159" y={y - 2} width={30 - (i % 2) * 8} height="4" rx="2" />
            <path d={`M203 ${y} l3 3 l6 -6`} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
    </svg>
  );
}
