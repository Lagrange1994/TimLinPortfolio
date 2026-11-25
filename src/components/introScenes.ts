// The About "What I Do" scenes, ported from the Claude Design canvas
// "What I Do Illustrations": each a fixed 320 x 232 board (scaled to its
// stage by IntroArt), drawn as markup like principleScenes.ts. A selected
// frame, its layer panel and the cursor working down it: one scene per
// line of the card (three layers each), the line's capsule lit in step
// (intro-art.css). Classes: pa-wd- shared by both, pa-sys- / pa-vis- per
// scene, animated by intro-art.css.

export const INTRO_W = 320;
export const INTRO_H = 232;

// one layer row in the panel: its highlight, icon and (translated) name
function layer(h: string, tint: string, icon: string, label: string): string {
  return `<div style="position: relative; height: 32px; display: flex; align-items: center; gap: 8px; padding: 0 9px; border-radius: 7px;"><span class="pa-wd-a pa-wd-${h}" style="position: absolute; inset: 0; border-radius: 7px; background: rgba(${tint}, 0.16); box-shadow: inset 0 0 0 1px rgba(${tint}, 0.5);"></span>${icon}<span style="position: relative; font-size: 12px; font-weight: 700; white-space: nowrap;">${label}</span></div>`;
}

const svgIcon = (stroke: string, d: string) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="position: relative; flex: none;">${d}</svg>`;
const dotIcon = (bg: string) => `<span style="position: relative; flex: none; width: 10px; height: 10px; border-radius: 50%; background: ${bg};"></span>`;
const badgeIcon = (bg: string, fg: string, t: string) =>
  `<span style="position: relative; flex: none; width: 15px; height: 15px; border-radius: 4px; background: ${bg}; font-size: 7.5px; font-weight: 900; line-height: 15px; text-align: center; color: ${fg};">${t}</span>`;

// the panel: three sets of three layers, one set per scene
function panel(rows: string[][]): string {
  return `<div style="position: absolute; left: 184px; top: 52px; width: 122px; height: 108px; border-radius: 10px; background: var(--pa-panel); border: 1px solid var(--pa-line);">${rows.map((set, i) => `<div class="pa-wd-a pa-wd-p${i + 1}" style="position: absolute; inset: 0; display: flex; flex-direction: column; padding: 5px;">${set.join('')}</div>`).join('')}</div>`;
}

// the selection on the frame, the dots under it, the cursor
function chrome(accent: string, glow: string): string {
  const handle = (l: number, t: number) => `<span style="position: absolute; left: ${l}px; top: ${t}px; width: 6px; height: 6px; background: #fff; border: 1.5px solid #38bdf8;"></span>`;
  const dot = (i: number) => `<span style="position: relative; width: 7px; height: 7px; border-radius: 50%; background: var(--pa-line);"><span class="pa-wd-a pa-wd-p${i}" style="position: absolute; inset: 0; border-radius: 50%; background: ${accent}; box-shadow: 0 0 8px ${glow};"></span></span>`;
  return `
  <div style="position: absolute; left: 19px; top: 19px; width: 154px; height: 182px; border: 2px solid #38bdf8; border-radius: 14px; box-sizing: border-box;"></div>
  ${handle(16, 16)}${handle(168, 16)}${handle(16, 196)}${handle(168, 196)}
  <div style="position: absolute; left: 0; right: 0; bottom: 12px; display: flex; justify-content: center; gap: 8px;">${dot(1)}${dot(2)}${dot(3)}</div>
  <div class="pa-wd-cur" style="position: absolute; left: 0; top: 0;"><div class="pa-wd-press"><svg width="14" height="18" viewBox="0 0 14 18" aria-hidden="true"><path d="M1 1 L1 15 L5 11.5 L7.6 17 L10 16 L7.4 10.6 L12.6 10.6 Z" fill="#ff6584" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"></path></svg></div></div>`;
}

// the component's name over the frame, once it ships
const compName = (cls: string, name: string) =>
  `<span class="pa-wd-a ${cls}" style="position: absolute; left: 22px; top: 3px; display: flex; align-items: center; gap: 4px; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 9px; font-weight: 600; color: var(--pa-comp);"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l10 10-10 10L2 12z"></path></svg>${name}</span>`;

const titleBar = `<div style="height: 28px; display: flex; align-items: center; gap: 6px; padding: 0 10px; background: linear-gradient(120deg, #6c63ff, #8a2be2);"><span style="width: 12px; height: 12px; border-radius: 50%; background: rgba(255, 255, 255, 0.9);"></span><span style="width: 50px; height: 5px; border-radius: 3px; background: rgba(255, 255, 255, 0.9);"></span></div>`;

const pin = (l: number, t: number, c: string, ring: string, delay: string) =>
  `<span style="position: absolute; left: ${l}px; top: ${t}px; width: 11px; height: 11px;"><span class="pa-wd-ring" style="position: absolute; inset: 0; border-radius: 50%; background: ${ring}; animation-delay: ${delay};"></span><span style="position: absolute; inset: 0; border-radius: 50%; background: ${c}; border: 2px solid #ffffff; box-sizing: border-box;"></span></span>`;

const VIOLET = '108, 99, 255';
const CYAN = '56, 189, 248';

// Systems Design: research (site, interviews, the front line), delivery
// (map, live data, front end), tools (Figma / XD, React / Vue, the spec
// checked). `layers`: the nine layer names, in that order.
export function sceneSystems(layers: string[]): string {
  const L = layers;
  return `
  <div style="position: absolute; left: 22px; top: 22px; width: 148px; height: 176px; border-radius: 12px; overflow: hidden; background: #f3f6f8; box-shadow: var(--pa-screen-edge);">
    ${titleBar}
    <div class="pa-wd-a pa-wd-p1" style="position: absolute; left: 0; right: 0; top: 28px; bottom: 0;">
      <svg class="pa-wd-a pa-sys-a11" width="148" height="58" viewBox="0 0 148 58" aria-hidden="true" style="position: absolute; left: 0; top: 6px;">
        <path d="M10 52H138" stroke="#c7d0da" stroke-width="2" stroke-linecap="round"></path>
        <path d="M44 52V30l16-10v10l16-10v10l16-10v32" fill="#e3e8ee" stroke="#9aa6b5" stroke-width="1.5" stroke-linejoin="round"></path>
        <path d="M112 30s9-8 9-15a9 9 0 0 0-18 0c0 7 9 15 9 15z" fill="#ff6584"></path>
        <circle cx="112" cy="15" r="3.2" fill="#ffffff"></circle>
      </svg>
      <div class="pa-wd-a pa-sys-a12" style="position: absolute; left: 10px; top: 70px; width: 128px; height: 40px;">
        <span style="position: absolute; left: 4px; top: 12px; width: 18px; height: 18px; border-radius: 50%; background: #e9d8c8;"></span>
        <span style="position: absolute; left: 2px; top: 8px; width: 22px; height: 10px; border-radius: 11px 11px 2px 2px; background: #ffd66b;"></span>
        <span style="position: absolute; left: 32px; top: 2px; width: 70px; height: 16px; border-radius: 8px 8px 8px 2px; background: #ffffff; box-shadow: 0 1px 3px rgba(20, 40, 60, 0.14);"><span style="position: absolute; left: 8px; top: 6px; width: 70%; height: 4px; border-radius: 2px; background: #c7d0da;"></span></span>
        <span style="position: absolute; left: 32px; top: 22px; width: 50px; height: 16px; border-radius: 8px 8px 8px 2px; background: #ffffff; box-shadow: 0 1px 3px rgba(20, 40, 60, 0.14);"><span style="position: absolute; left: 8px; top: 6px; width: 60%; height: 4px; border-radius: 2px; background: #c7d0da;"></span></span>
      </div>
      <div class="pa-wd-a pa-sys-a13" style="position: absolute; left: 10px; top: 116px; display: flex; gap: 6px;">
        <span style="width: 38px; height: 26px; border-radius: 4px; background: #ffd66b; transform: rotate(-3deg); box-shadow: 0 2px 5px rgba(20, 40, 60, 0.2);"></span>
        <span style="width: 38px; height: 26px; border-radius: 4px; background: #c9c5ff; transform: rotate(2deg); box-shadow: 0 2px 5px rgba(20, 40, 60, 0.2);"></span>
        <span style="width: 38px; height: 26px; border-radius: 4px; background: #9be7d3; transform: rotate(-1deg); box-shadow: 0 2px 5px rgba(20, 40, 60, 0.2);"></span>
      </div>
    </div>
    <div class="pa-wd-a pa-wd-p2" style="position: absolute; left: 0; right: 0; top: 28px; bottom: 0;">
      <div style="position: absolute; left: 8px; top: 8px; width: 132px; height: 104px; border-radius: 8px; overflow: hidden; background: #e8edf2;">
        <svg width="132" height="104" viewBox="0 0 132 104" aria-hidden="true" style="position: absolute; inset: 0;">
          <rect x="78" y="8" width="46" height="30" rx="5" fill="#d7eedd"></rect>
          <path d="M0 44H132M60 0V104M0 84L132 66" fill="none" stroke="#ffffff" stroke-width="6"></path>
          <path class="pa-sys-route" d="M22 22V44H60V72L110 64V92" fill="none" stroke="#6c63ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
        ${pin(16, 16, '#ff6584', 'rgba(255, 101, 132, 0.45)', '0s')}
        ${pin(104, 86, '#34c38f', 'rgba(52, 195, 143, 0.45)', '-.8s')}
      </div>
      <div class="pa-wd-a pa-sys-a22" style="position: absolute; left: 8px; top: 118px; width: 132px; height: 24px; box-sizing: border-box; padding: 0 8px; border-radius: 8px; background: #ffffff; box-shadow: 0 1px 3px rgba(20, 40, 60, 0.12); display: flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 8.5px; color: #2b3440;"><span class="pa-wd-blink" style="width: 6px; height: 6px; border-radius: 50%; background: #34c38f;"></span>P-07 · 22.99 · ok</div>
    </div>
    <div class="pa-wd-a pa-wd-p3" style="position: absolute; left: 0; right: 0; top: 28px; bottom: 0;">
      <div style="position: absolute; left: 14px; top: 12px; width: 120px; height: 64px; box-sizing: border-box; padding: 16px; border-radius: 10px; background: #ffffff; box-shadow: 0 1px 3px rgba(20, 40, 60, 0.12); display: flex; flex-direction: column; gap: 6px;">
        <span style="width: 70%; height: 6px; border-radius: 3px; background: #2b3440;"></span>
        <span style="margin-top: auto; width: 44px; height: 12px; border-radius: 6px; background: linear-gradient(120deg, #6c63ff, #ff6584);"></span>
      </div>
      <span class="pa-wd-a pa-sys-a33" style="position: absolute; left: 14px; top: 26px; width: 16px; height: 2px; background: #ff6584;"></span>
      <div class="pa-wd-a pa-sys-a32" style="position: absolute; left: 8px; top: 86px; width: 132px; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; background: #15151b; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 8.5px; line-height: 1.6; color: rgba(244, 242, 255, 0.85);">
        <div><span style="color: #8b84ff;">&lt;</span><span style="color: #9be7d3;">Card</span><span style="color: #8b84ff;"> /&gt;</span></div>
        <div><span style="color: #bdf1ff;">padding</span>: <span class="pa-wd-a pa-sys-hot" style="padding: 0 2px; border-radius: 3px;">16px</span>;</div>
      </div>
      <span class="pa-wd-a pa-sys-a33" style="position: absolute; right: 8px; top: 6px; width: 18px; height: 18px; border-radius: 50%; background: #34c38f; display: flex; align-items: center; justify-content: center;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"></path></svg></span>
    </div>
  </div>
  ${compName('pa-sys-a23', 'PatrolMap')}
  ${panel([
    [
      layer('h11', VIOLET, svgIcon('#ff6584', '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"></path><circle cx="12" cy="10" r="2.5"></circle>'), L[0]),
      layer('h12', VIOLET, svgIcon('#f5b041', '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"></path>'), L[1]),
      layer('h13', VIOLET, svgIcon('#34c38f', '<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>'), L[2]),
    ],
    [
      layer('h21', VIOLET, svgIcon('#8b84ff', '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"></path><path d="M9 4v14M15 6v14"></path>'), L[3]),
      layer('h22', VIOLET, svgIcon('#34c38f', '<path d="M3 12h4l3-8 4 16 3-8h4"></path>'), L[4]),
      layer('h23', VIOLET, svgIcon('#a78bfa', '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"></path>'), L[5]),
    ],
    [
      layer('h31', VIOLET, svgIcon('#ff6fc8', '<path d="M12 19l7-7-7-7-7 7z"></path><circle cx="12" cy="12" r="1.5"></circle>'), L[6]),
      layer('h32', VIOLET, svgIcon('#38bdf8', '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"></path>'), L[7]),
      layer('h33', VIOLET, svgIcon('#34c38f', '<rect x="3" y="3" width="18" height="18" rx="4"></rect><path d="M8 12l3 3 5-6"></path>'), L[8]),
    ],
  ])}
  ${chrome('#8b84ff', 'rgba(139, 132, 255, 0.8)')}`;
}

const cubeFaces = (face: (t: string, i: number) => string) =>
  ['translateZ(30px)', 'rotateY(180deg) translateZ(30px)', 'rotateY(90deg) translateZ(30px)', 'rotateY(-90deg) translateZ(30px)', 'rotateX(90deg) translateZ(30px)', 'rotateX(-90deg) translateZ(30px)'].map(face).join('');
const SOLID = ['#6c63ff', '#6c63ff', '#4a42b8', '#4a42b8', '#38bdf8', '#2e2a6e'];

// Context-Driven Visuals: colour (the machines' signal lights, the finance
// game, Morandi tones), 3D (Blender, Spline, Dora, shipped as React +
// WebGL), print (Photoshop, Illustrator, Lightroom). `layers`: the nine
// layer names, in that order.
export function sceneVisuals(layers: string[]): string {
  const L = layers;
  const row = (w: string) => `<div style="height: 24px; display: flex; align-items: center; padding: 0 8px; border-radius: 6px; background: rgba(${w}, 0.16); border-left: 3px solid rgb(${w});"><span style="width: 60%; height: 5px; border-radius: 3px; background: rgba(255, 255, 255, 0.6);"></span></div>`;
  return `
  <div style="position: absolute; left: 22px; top: 22px; width: 148px; height: 176px; border-radius: 12px; overflow: hidden; background: #f3f6f8; box-shadow: var(--pa-screen-edge);">
    <div class="pa-wd-a pa-wd-p1" style="position: absolute; inset: 0;">
      <div class="pa-wd-a pa-wd-h11" style="position: absolute; inset: 0; display: flex; flex-direction: column; background: #262b33;">
        <div style="height: 28px; display: flex; align-items: center; gap: 6px; padding: 0 10px; background: #1b1f25;">
          <span style="width: 50px; height: 5px; border-radius: 3px; background: rgba(255, 255, 255, 0.7);"></span>
          <span style="margin-left: auto; display: flex; gap: 3px;"><span class="pa-vis-lamp" style="width: 7px; height: 7px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 6px #ef4444;"></span><span class="pa-vis-lamp pa-vis-lb" style="width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 6px #f59e0b;"></span><span class="pa-vis-lamp pa-vis-lc" style="width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 6px #22c55e;"></span></span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 7px; padding: 10px;">${row('239, 68, 68')}${row('245, 158, 11')}${row('34, 197, 94')}</div>
        <span style="margin: auto 10px 12px; height: 24px; border-radius: 12px; background: #22c55e;"></span>
      </div>
      <div class="pa-wd-a pa-vis-game" style="position: absolute; inset: 0; display: flex; flex-direction: column; background: #f4ece6;">
        <div style="height: 28px; display: flex; align-items: center; gap: 6px; padding: 0 10px; background: #c9a9a6;"><span style="width: 12px; height: 12px; border-radius: 50%; background: rgba(255, 255, 255, 0.85);"></span><span style="width: 50px; height: 5px; border-radius: 3px; background: rgba(255, 255, 255, 0.85);"></span></div>
        <div style="display: flex; gap: 8px; padding: 10px;">
          <span style="flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #f3e3c0, #d9bf8a); box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.5);"></span>
          <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 6px;"><span style="height: 18px; border-radius: 7px; background: #e3cfc9;"></span><span style="height: 18px; border-radius: 7px; background: #d3dccf;"></span><span style="height: 18px; border-radius: 7px; background: #cfd9e3;"></span></div>
        </div>
        <div class="pa-wd-a pa-vis-a13" style="display: flex; gap: 5px; padding: 0 10px;"><span style="width: 26px; height: 18px; border-radius: 4px; background: #c9a9a6;"></span><span style="width: 26px; height: 18px; border-radius: 4px; background: #a8b5a2;"></span><span style="width: 26px; height: 18px; border-radius: 4px; background: #9fb1c4;"></span><span style="width: 26px; height: 18px; border-radius: 4px; background: #d9bf8a;"></span></div>
        <span style="margin: auto 10px 12px; height: 24px; border-radius: 12px; background: #a8b5a2;"></span>
      </div>
    </div>
    <div class="pa-wd-a pa-wd-p2" style="position: absolute; inset: 0; background: radial-gradient(70% 55% at 50% 58%, rgba(56, 189, 248, 0.2), transparent 70%), #101018;">
      <div style="height: 28px; display: flex; align-items: center; gap: 4px; padding: 0 10px; background: #1b1b24;"><span style="width: 6px; height: 6px; border-radius: 50%; background: #ef5a5a;"></span><span style="width: 6px; height: 6px; border-radius: 50%; background: #f5b041;"></span><span style="width: 6px; height: 6px; border-radius: 50%; background: #34c38f;"></span><span style="margin-left: 6px; flex-grow: 1; height: 11px; border-radius: 6px; background: rgba(255, 255, 255, 0.08);"></span></div>
      <div style="position: absolute; left: 0; right: 0; top: 28px; bottom: 0; perspective: 520px;">
        <span style="position: absolute; left: 39px; top: 116px; width: 70px; height: 14px; border-radius: 50%; background: rgba(0, 0, 0, 0.7); filter: blur(5px);"></span>
        <div class="pa-wd-a pa-vis-wire" style="position: absolute; left: 44px; top: 34px; width: 60px; height: 60px;"><div class="pa-vis-cube" style="position: absolute; inset: 0;">${cubeFaces(t => `<span style="position: absolute; inset: 0; border: 1.5px solid #38bdf8; transform: ${t};"></span>`)}</div></div>
        <div class="pa-wd-a pa-vis-solid" style="position: absolute; left: 44px; top: 34px; width: 60px; height: 60px;"><div class="pa-vis-cube" style="position: absolute; inset: 0;">${cubeFaces((t, i) => `<span style="position: absolute; inset: 0; border-radius: 6px; background: ${SOLID[i]}; transform: ${t};"></span>`)}</div></div>
      </div>
    </div>
    <div class="pa-wd-a pa-wd-p3" style="position: absolute; inset: 0;">
      ${titleBar}
      <svg class="pa-wd-a pa-vis-lr" width="148" height="148" viewBox="0 0 148 148" aria-hidden="true" style="position: absolute; left: 0; top: 28px;">
        <rect width="148" height="148" fill="#f6c7a6"></rect>
        <circle cx="104" cy="38" r="13" fill="#fff3d6"></circle>
        <path d="M0 96L38 56L64 80L92 46L148 98V148H0Z" fill="#6c63ff"></path>
        <path d="M0 110L48 82L88 104L148 90V148H0Z" fill="#3b347f"></path>
      </svg>
      <span class="pa-wd-a pa-vis-spot" style="position: absolute; left: 50px; top: 66px; width: 7px; height: 7px; border-radius: 50%; background: #8a5a44;"></span>
      <span class="pa-wd-a pa-wd-h31" style="position: absolute; left: 32px; top: 50px; width: 40px; height: 40px;"><span class="pa-wd-a pa-vis-brush" style="display: block; width: 22px; height: 22px; border-radius: 50%; border: 1.5px dashed #ffffff; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);"></span></span>
      <svg class="pa-wd-a pa-vis-a32" width="148" height="148" viewBox="0 0 148 148" aria-hidden="true" style="position: absolute; left: 0; top: 28px;">
        <path class="pa-vis-vec" d="M16 120C26 70 60 60 74 88S120 104 132 56" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"></path>
        <rect x="12" y="116" width="8" height="8" fill="#ffffff" stroke="#38bdf8" stroke-width="1.5"></rect>
        <rect x="70" y="84" width="8" height="8" fill="#38bdf8"></rect>
        <rect x="128" y="52" width="8" height="8" fill="#ffffff" stroke="#38bdf8" stroke-width="1.5"></rect>
        <path d="M58 72L90 104" stroke="#38bdf8" stroke-width="1"></path>
        <circle cx="58" cy="72" r="2.5" fill="#38bdf8"></circle><circle cx="90" cy="104" r="2.5" fill="#38bdf8"></circle>
      </svg>
      <div class="pa-wd-a pa-vis-a33" style="position: absolute; left: 10px; right: 10px; bottom: 10px; height: 22px; box-sizing: border-box; padding: 0 9px; border-radius: 11px; background: rgba(18, 15, 36, 0.82); display: flex; align-items: center;"><div style="position: relative; flex-grow: 1; height: 3px; border-radius: 2px; background: linear-gradient(90deg, #3b347f, #fff3d6);"><span class="pa-wd-a pa-vis-knob" style="position: absolute; left: 20px; top: -4px; width: 11px; height: 11px; border-radius: 50%; background: #ffffff;"></span></div></div>
    </div>
  </div>
  ${compName('pa-vis-a23', 'React + WebGL')}
  ${panel([
    [
      layer('h11', CYAN, svgIcon('#22c55e', '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"></path>'), L[0]),
      layer('h12', CYAN, svgIcon('#d9a94a', '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.5h-3a1.8 1.8 0 0 0 0 3.5h4"></path>'), L[1]),
      layer('h13', CYAN, svgIcon('#c9a9a6', '<path d="M12 3a9 9 0 0 0 0 18c1 0 1.6-.8 1.6-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4.1-4-7.4-9-7.4z"></path><circle cx="7.5" cy="11" r="1"></circle><circle cx="11" cy="7.5" r="1"></circle><circle cx="15.5" cy="8.5" r="1"></circle>'), L[2]),
    ],
    [
      layer('h21', CYAN, dotIcon('#f5792a'), L[3]),
      layer('h22', CYAN, dotIcon('linear-gradient(135deg, #ff6584, #8b84ff)'), L[4]),
      layer('h23', CYAN, dotIcon('#4f7cff'), L[5]),
    ],
    [
      layer('h31', CYAN, badgeIcon('#001e36', '#31a8ff', 'Ps'), L[6]),
      layer('h32', CYAN, badgeIcon('#330000', '#ff9a00', 'Ai'), L[7]),
      layer('h33', CYAN, badgeIcon('#001e36', '#31a8ff', 'Lr'), L[8]),
    ],
  ])}
  ${chrome('#38bdf8', 'rgba(56, 189, 248, 0.8)')}`;
}
