// Closing shot of the Figma MCP showcase: after the full grid, the camera
// zooms in on the VS Code card. Two helpers for FigmaMcpShowcase:
//   - fitCodeCard() works out how far .mcp-zoom can scale so the whole card
//     fits the pinned frame (below the heading's spot, nothing cut off) and
//     the translate that centres it there,
//   - jumpToCoding() moves the 20s live-edit loop to the part where Claude
//     writes Card.tsx, so the close-up shows the coding.

export interface Box { x: number; y: number; w: number; h: number }
export interface CodeFit { scale: number; x: number; y: number }

// .mcp-zoom's transform-origin (portfolio.css): 24.4% across, top edge.
export const ZOOM_ORIGIN_X = 0.244;
export const FIT_MAX = 2;      // never closer than the opening Figma shot
export const FIT_SIDE = 48;    // px kept clear left and right
export const FIT_BOTTOM = 40;  // px kept clear below

// zoom and card are untransformed boxes in the frame's coordinates; top is
// where the free area starts (the heading fades out during the zoom, so it
// is the heading's own top, clear of the navbar).
export function fitCodeCard(frame: { w: number; h: number }, zoom: Box, card: Box, top: number): CodeFit {
  const availW = frame.w - FIT_SIDE * 2;
  const availH = frame.h - top - FIT_BOTTOM;
  const scale = Math.max(1, Math.min(FIT_MAX, availW / card.w, availH / card.h));
  const ox = zoom.x + zoom.w * ZOOM_ORIGIN_X;
  const oy = zoom.y;
  const cx = card.x + card.w / 2;
  const cy = card.y + card.h / 2;
  const targetX = frame.w / 2;
  const targetY = top + availH / 2;
  return {
    scale,
    x: targetX - ox - scale * (cx - ox),
    y: targetY - oy - scale * (cy - oy),
  };
}

// The loop (portfolio.css, "Live edits"): 18–48% is VS Code — Tim's prompt,
// get_design_context, Card.tsx written line by line. Starting just before it
// lets the prompt land first.
export const LOOP_MS = 20000;
export const CODING_START = 0.175;
export const CODING_END = 0.45;

interface LoopAnim { currentTime: CSSNumberish | null; effect: AnimationEffect | null }

// Only the 20s loops: the scroll-driven zoom animations and the .8s spinner
// are left alone. Every loop moves forward by the same amount, so the
// per-line staggers stay in step. Returns whether it moved anything.
export function jumpToCoding(anims: LoopAnim[]): boolean {
  const loops = anims.filter(a => a.effect?.getTiming().duration === LOOP_MS && typeof a.currentTime === 'number');
  const ref = loops.find(a => !a.effect?.getTiming().delay) ?? loops[0];
  if (!ref) return false;
  const at = (ref.currentTime as number) % LOOP_MS;
  if (at >= CODING_START * LOOP_MS && at < CODING_END * LOOP_MS) return false;
  const shift = (((CODING_START * LOOP_MS - at) % LOOP_MS) + LOOP_MS) % LOOP_MS;
  for (const a of loops) a.currentTime = (a.currentTime as number) + shift;
  return true;
}
