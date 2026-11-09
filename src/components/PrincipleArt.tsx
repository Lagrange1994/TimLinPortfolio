import { useLayoutEffect, useRef } from 'react';
import { sceneContext, sceneRules, sceneSubtract } from './principleScenes';
import '../styles/principle-art.css';

// The scenes under About's design-principle cards: each principle shown as
// a small situation on a Figma-like canvas (ported from the Claude Design
// canvas "Design Principle Animations", see principleScenes.ts). Each scene
// is a fixed board, scaled to the stage's width.

// The board's own width (its height is in the stage's aspect-ratio).
export const SCENE_W = 582;

// How far the board scales to fill a stage this wide.
export function fitScale(width: number): number {
  return width > 0 ? width / SCENE_W : 1;
}

function Scene({ id, html }: { id: string; html: string }) {
  const stage = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => el.style.setProperty('--pa-s', String(fitScale(el.clientWidth)));
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={stage} className="principle-stage pa-stage" aria-hidden="true">
      <div className={`pa-scene pa-scene--${id}`} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

// 01 "環境決定視覺": one screen through three settings — sunlight, night, one
// hand (the thumb's reach coloured, with its key).
export function PrincipleArtContext({ modes, reach }: { modes: string[]; reach: string[] }) {
  return <Scene id="env" html={sceneContext({ modes, reach })} />;
}

// 02 "先刪減再設計": the non-core parts of a busy screen are selected and
// removed; what stays moves to the phone, one main action.
export function PrincipleArtSubtract() {
  return <Scene id="cut" html={sceneSubtract()} />;
}

// 03 "讓規則看得見": after sending, a black box with a "?" — then the same
// flow opened up as steps that light up in turn.
export function PrincipleArtRules({ states, steps }: { states: string[]; steps: string[] }) {
  return <Scene id="rule" html={sceneRules({ states, steps })} />;
}
