import { useLayoutEffect, useRef } from 'react';
import { sceneContext, sceneRules, sceneSubtract } from './principleScenes';
import '../styles/principle-art.css';

// The scenes under About's design-principle cards: each principle shown as
// a small situation on a Figma-like canvas (ported from the Claude Design
// canvas "Design Principle Animations", see principleScenes.ts). Each scene
// is a fixed board, scaled to the stage's width.

// The board's own width (its height is in the stage's aspect-ratio).
export const SCENE_W = 582;

// How far a board `base` wide scales to fill a stage this wide; given
// the board's height too (`baseH`), it fits inside the stage both ways.
export function fitScale(width: number, base = SCENE_W, height = 0, baseH = 0): number {
  if (!(width > 0)) return 1;
  const w = width / base;
  return height > 0 && baseH > 0 ? Math.min(w, height / baseH) : w;
}

// A stage and its board, scaled to the stage's width. `variant` marks a
// board of another size (About's intro scenes: pa-stage--intro).
export function ArtStage({ id, html, base = SCENE_W, baseH = 0, variant }: { id: string; html: string; base?: number; baseH?: number; variant?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => el.style.setProperty('--pa-s', String(fitScale(el.clientWidth, base, el.clientHeight, baseH)));
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [base, baseH]);
  const v = variant ? ` pa-stage--${variant}` : '';
  return (
    <div ref={stage} className={`principle-stage pa-stage${v}`} aria-hidden="true">
      <div className={`pa-scene pa-scene--${id}${variant ? ` pa-scene--${variant}` : ''}`} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

// 01 "環境決定視覺": one screen through three settings — sunlight, night, one
// hand (the thumb's reach coloured, with its key).
export function PrincipleArtContext({ modes, reach }: { modes: string[]; reach: string[] }) {
  return <ArtStage id="env" html={sceneContext({ modes, reach })} />;
}

// 02 "先刪減再設計": the non-core parts of a busy screen are selected and
// removed; what stays moves to the phone, one main action.
export function PrincipleArtSubtract() {
  return <ArtStage id="cut" html={sceneSubtract()} />;
}

// 03 "讓規則看得見": after sending, a black box with a "?" — then the same
// flow opened up as steps that light up in turn.
export function PrincipleArtRules({ states, steps }: { states: string[]; steps: string[] }) {
  return <ArtStage id="rule" html={sceneRules({ states, steps })} />;
}
