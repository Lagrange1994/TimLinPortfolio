import { ArtStage } from './PrincipleArt';
import { INTRO_H, INTRO_W, sceneSystems, sceneVisuals } from './introScenes';
import '../styles/intro-art.css';

// The scenes beside About's two "What I Do" cards (ported from the Claude
// Design canvas "What I Do Illustrations", see introScenes.ts): one scene
// per line of the card, on the principle stages' Figma canvas. `layers`:
// the nine layer names the panel shows (translated, "|"-separated in the
// strings).

export function IntroArtSystems({ layers }: { layers: string[] }) {
  return <ArtStage id="sys" html={sceneSystems(layers)} base={INTRO_W} baseH={INTRO_H} variant="intro" />;
}

export function IntroArtVisuals({ layers }: { layers: string[] }) {
  return <ArtStage id="vis" html={sceneVisuals(layers)} base={INTRO_W} baseH={INTRO_H} variant="intro" />;
}
