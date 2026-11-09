// The About design-principle scenes, ported from the Claude Design canvas
// "Design Principle Animations": each a fixed 582 × 296 board (scaled to its
// stage by PrincipleArt), drawn as markup like FigmaMcpShowcase's cards.
// Ported from the canvas's artboards, then the words and the 01 panel
// enlarged for the site's small stage (it scales the board to about half).
// Classes are prefixed per scene (pa-env- / pa-cut- / pa-rule-) and
// animated by principle-art.css.

export function sceneContext(l: { modes: string[]; reach: string[] }): string {
  return `
  <!-- the settings, painted across the canvas: sunlight, then a night sky -->
  <div class="pa-env-env" style="position: absolute; inset: 0; background: radial-gradient(120% 95% at 92% 4%, rgba(255, 196, 77, 0.42), rgba(255, 140, 60, 0.12) 45%, transparent 75%);">
    <svg width="60" height="60" viewBox="0 0 64 64" aria-hidden="true" style="position: absolute; top: 14px; right: 18px; filter: drop-shadow(0 0 14px rgba(255, 185, 56, 0.85));">
      <g class="pa-env-sun" fill="none" stroke="#ffb938" stroke-width="3.5" stroke-linecap="round">
        <circle cx="32" cy="32" r="11" fill="#ffc94d" stroke="none"></circle>
        <path d="M32 6v7M32 51v7M6 32h7M51 32h7M13.6 13.6l5 5M45.4 45.4l5 5M13.6 50.4l5-5M45.4 18.6l5-5"></path>
      </g>
    </svg>
  </div>
  <div class="pa-env-env pa-env-e2" style="position: absolute; inset: 0; background: radial-gradient(60% 60% at 88% 12%, rgba(160, 150, 255, 0.22), transparent 70%), linear-gradient(160deg, #1d1a4a, #0c0a20);">
    <svg width="120" height="80" viewBox="0 0 120 80" aria-hidden="true" style="position: absolute; top: 12px; right: 12px;">
      <path d="M88 14a22 22 0 1 0 18 34 18 18 0 1 1-18-34z" fill="#dcd9ff" style="filter: drop-shadow(0 0 10px rgba(200, 195, 255, 0.6));"></path>
      <circle class="pa-env-star" cx="22" cy="22" r="2" fill="#fff"></circle>
      <circle class="pa-env-star pa-env-b" cx="48" cy="10" r="1.5" fill="#fff"></circle>
      <circle class="pa-env-star pa-env-c" cx="40" cy="44" r="1.8" fill="#fff"></circle>
    </svg>
    <svg width="140" height="60" viewBox="0 0 140 60" aria-hidden="true" style="position: absolute; left: 260px; bottom: 14px;">
      <circle class="pa-env-star pa-env-c" cx="12" cy="40" r="1.6" fill="#fff"></circle>
      <circle class="pa-env-star" cx="70" cy="20" r="1.4" fill="#fff"></circle>
      <circle class="pa-env-star pa-env-b" cx="124" cy="46" r="1.8" fill="#fff"></circle>
    </svg>
  </div>
  <div style="position: absolute; left: 93px; top: 38px; width: 124px; height: 220px; border-radius: 18px; overflow: hidden;">
    <!-- sunlight: solid deep blue, black type, heavy borders -->
    <div class="pa-env-env" style="position: absolute; inset: 0; display: flex; flex-direction: column; background: #ffffff;">
      <div style="height: 40px; display: flex; align-items: center; gap: 6px; padding: 0 10px; background: #2e25a8;">
        <span style="width: 16px; height: 16px; border-radius: 50%; background: #ffffff;"></span>
        <span style="width: 54px; height: 7px; border-radius: 3px; background: #ffffff;"></span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px; padding: 10px;">
        <div style="display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 7px; border-radius: 8px; border: 2px solid #111827;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #0a8f5b;"></span><span style="width: 58%; height: 6px; border-radius: 3px; background: #111827;"></span></div>
        <div style="display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 7px; border-radius: 8px; border: 2px solid #111827;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #b45309;"></span><span style="width: 48%; height: 6px; border-radius: 3px; background: #111827;"></span></div>
        <div style="display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 7px; border-radius: 8px; border: 2px solid #111827;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #b91c1c;"></span><span style="width: 64%; height: 6px; border-radius: 3px; background: #111827;"></span></div>
      </div>
      <span style="margin: auto 10px 12px; height: 26px; border-radius: 13px; background: #2e25a8;"></span>
    </div>
    <!-- night: dark navy, dim type, soft cyan action -->
    <div class="pa-env-env pa-env-e2" style="position: absolute; inset: 0; display: flex; flex-direction: column; background: #120f24;">
      <div style="height: 40px; display: flex; align-items: center; gap: 6px; padding: 0 10px; background: #1d1840;">
        <span style="width: 16px; height: 16px; border-radius: 50%; background: rgba(196, 191, 255, 0.5);"></span>
        <span style="width: 54px; height: 6px; border-radius: 3px; background: rgba(196, 191, 255, 0.5);"></span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px; padding: 10px;">
        <div style="display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 7px; border-radius: 8px; background: rgba(196, 191, 255, 0.08);"><span style="width: 7px; height: 7px; border-radius: 50%; background: rgba(52, 195, 143, 0.7);"></span><span style="width: 58%; height: 5px; border-radius: 3px; background: rgba(196, 191, 255, 0.35);"></span></div>
        <div style="display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 7px; border-radius: 8px; background: rgba(196, 191, 255, 0.08);"><span style="width: 7px; height: 7px; border-radius: 50%; background: rgba(245, 176, 65, 0.7);"></span><span style="width: 48%; height: 5px; border-radius: 3px; background: rgba(196, 191, 255, 0.35);"></span></div>
        <div style="display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 7px; border-radius: 8px; background: rgba(196, 191, 255, 0.08);"><span style="width: 7px; height: 7px; border-radius: 50%; background: rgba(239, 90, 90, 0.7);"></span><span style="width: 64%; height: 5px; border-radius: 3px; background: rgba(196, 191, 255, 0.35);"></span></div>
      </div>
      <span style="margin: auto 10px 12px; height: 24px; border-radius: 12px; background: #4a42b8;"></span>
    </div>
    <!-- one hand: the standard light skin, the action in the thumb's reach -->
    <div class="pa-env-env pa-env-e3" style="position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--pa-screen); box-shadow: var(--pa-screen-edge);">
      <div style="height: 40px; display: flex; align-items: center; gap: 6px; padding: 0 10px; background: linear-gradient(120deg, #6c63ff, #8a2be2);">
        <span style="width: 16px; height: 16px; border-radius: 50%; background: rgba(255, 255, 255, 0.9);"></span>
        <span style="width: 54px; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.9);"></span>
      </div>
      <!-- the thumb's reach, from the bottom-right corner: within easy reach (inner), a stretch (outer) -->
      <span style="position: absolute; inset: 0; background: rgba(239, 90, 90, 0.14);"></span>
      <span style="position: absolute; right: -170px; bottom: -170px; width: 340px; height: 340px; border-radius: 50%; background: #fdf3df; border: 1.5px dashed #f5b041; box-sizing: border-box;"></span>
      <span style="position: absolute; right: -112px; bottom: -112px; width: 224px; height: 224px; border-radius: 50%; background: #def5ea; border: 1.5px dashed #34c38f; box-sizing: border-box;"></span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f7a55" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="position: absolute; right: 8px; top: 120px;"><path d="M9 11V5a2 2 0 0 1 4 0v5M13 9a2 2 0 0 1 4 0v3M17 11a2 2 0 0 1 4 0v4a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.4L4 15a2 2 0 0 1 3.4-2L9 15"></path></svg>
      <div style="position: relative; display: flex; flex-direction: column; gap: 6px; padding: 28px 10px 0;">
        <div style="display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 7px; border-radius: 8px; background: #ffffff; box-shadow: 0 1px 3px rgba(20, 40, 60, 0.12);"><span style="width: 7px; height: 7px; border-radius: 50%; background: #34c38f;"></span><span style="width: 58%; height: 5px; border-radius: 3px; background: #c7d0da;"></span></div>
        <div style="display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 7px; border-radius: 8px; background: #ffffff; box-shadow: 0 1px 3px rgba(20, 40, 60, 0.12);"><span style="width: 7px; height: 7px; border-radius: 50%; background: #f5b041;"></span><span style="width: 48%; height: 5px; border-radius: 3px; background: #c7d0da;"></span></div>
      </div>
      <span style="position: relative; margin: auto 8px 12px; height: 32px; border-radius: 16px; background: linear-gradient(120deg, #6c63ff, #ff6584);"></span>
      <span class="pa-env-thumb" style="position: absolute; right: 24px; bottom: 16px; width: 24px; height: 24px; border-radius: 50%; background: rgba(255, 255, 255, 0.35); border: 1.5px solid #ffffff;"></span>
    </div>
  </div>
  <!-- the reach colours, in the one-hand setting -->
  <div class="pa-env-env pa-env-e3" style="position: absolute; left: 14px; top: 170px; display: flex; flex-direction: column; gap: 10px;">
    <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 16px; height: 16px; border-radius: 4px; background: #34c38f;"></span><span style="font-size: 18px; font-weight: 500; color: var(--pa-muted);">${l.reach[0]}</span></div>
    <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 16px; height: 16px; border-radius: 4px; background: #f5b041;"></span><span style="font-size: 18px; font-weight: 500; color: var(--pa-muted);">${l.reach[1]}</span></div>
    <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 16px; height: 16px; border-radius: 4px; background: #ef5a5a;"></span><span style="font-size: 18px; font-weight: 500; color: var(--pa-muted);">${l.reach[2]}</span></div>
  </div>
  <!-- selection on the frame -->
  <div style="position: absolute; left: 90px; top: 35px; width: 128px; height: 224px; border: 2px solid #38bdf8; border-radius: 20px;"></div>
  <span style="position: absolute; left: 87px; top: 32px; width: 6px; height: 6px; background: #fff; border: 1.5px solid #38bdf8;"></span>
  <span style="position: absolute; left: 214px; top: 32px; width: 6px; height: 6px; background: #fff; border: 1.5px solid #38bdf8;"></span>
  <span style="position: absolute; left: 87px; top: 255px; width: 6px; height: 6px; background: #fff; border: 1.5px solid #38bdf8;"></span>
  <span style="position: absolute; left: 214px; top: 255px; width: 6px; height: 6px; background: #fff; border: 1.5px solid #38bdf8;"></span>

  <!-- the settings, one at a time -->
  <div style="position: absolute; left: 263px; top: 76px; width: 240px; display: flex; flex-direction: column; border-radius: 10px; background: var(--pa-panel); border: 1px solid var(--pa-line); overflow: hidden;">
    <div style="display: flex; flex-direction: column; padding: 6px;">
      <div style="position: relative; height: 44px; display: flex; align-items: center; gap: 12px; padding: 0 12px; border-radius: 9px;">
        <span class="pa-env-env" style="position: absolute; inset: 0; border-radius: 7px; background: rgba(108, 99, 255, 0.16); box-shadow: inset 0 0 0 1px rgba(108, 99, 255, 0.5);"></span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5b041" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" style="position: relative;"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>
        <span style="position: relative; font-size: 20px; font-weight: 700;">${l.modes[0]}</span>
      </div>
      <div style="position: relative; height: 44px; display: flex; align-items: center; gap: 12px; padding: 0 12px; border-radius: 9px;">
        <span class="pa-env-env pa-env-e2" style="position: absolute; inset: 0; border-radius: 7px; background: rgba(108, 99, 255, 0.16); box-shadow: inset 0 0 0 1px rgba(108, 99, 255, 0.5);"></span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c4bfff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="position: relative;"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"></path></svg>
        <span style="position: relative; font-size: 20px; font-weight: 700;">${l.modes[1]}</span>
      </div>
      <div style="position: relative; height: 44px; display: flex; align-items: center; gap: 12px; padding: 0 12px; border-radius: 9px;">
        <span class="pa-env-env pa-env-e3" style="position: absolute; inset: 0; border-radius: 7px; background: rgba(108, 99, 255, 0.16); box-shadow: inset 0 0 0 1px rgba(108, 99, 255, 0.5);"></span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b84ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="position: relative;"><path d="M9 11V5a2 2 0 0 1 4 0v5M13 9a2 2 0 0 1 4 0v3M17 11a2 2 0 0 1 4 0v4a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.4L4 15a2 2 0 0 1 3.4-2L9 15"></path></svg>
        <span style="position: relative; font-size: 20px; font-weight: 700;">${l.modes[2]}</span>
      </div>
    </div>
  </div>

  <!-- the cursor, picking each mode -->
  <div class="pa-env-cur" style="position: absolute; left: 453px; top: 102px;">
    <div class="pa-env-press" style="display: flex; align-items: flex-start; gap: 2px;">
      <svg width="14" height="18" viewBox="0 0 14 18" aria-hidden="true"><path d="M1 1 L1 15 L5 11.5 L7.6 17 L10 16 L7.4 10.6 L12.6 10.6 Z" fill="#ff6584" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"></path></svg>
    </div>
  </div>
`;
}

export function sceneSubtract(): string {
  return `
  <!-- before: the back-office dashboard, everything at once -->
  <div style="position: absolute; left: 33px; top: 46px; width: 300px; height: 204px; border-radius: 8px; overflow: hidden; background: var(--pa-screen); box-shadow: var(--pa-screen-edge);">
    <div style="height: 22px; display: flex; align-items: center; gap: 6px; padding: 0 10px; background: linear-gradient(120deg, #6c63ff, #8a2be2);">
      <span style="width: 10px; height: 10px; border-radius: 50%; background: rgba(255, 255, 255, 0.9);"></span>
      <span style="width: 60px; height: 5px; border-radius: 3px; background: rgba(255, 255, 255, 0.9);"></span>
    </div>
    <!-- side menu -->
    <div style="position: absolute; left: 0; top: 22px; bottom: 0; width: 44px; display: flex; flex-direction: column; gap: 8px; padding: 10px 8px; box-sizing: border-box; background: #ffffff; border-right: 1px solid #e3e8ee;">
      <span style="height: 5px; border-radius: 3px; background: #6c63ff;"></span>
      <span style="height: 5px; border-radius: 3px; background: #d5dde6;"></span>
      <span style="height: 5px; border-radius: 3px; background: #d5dde6;"></span>
      <span style="height: 5px; border-radius: 3px; background: #d5dde6;"></span>
      <span style="height: 5px; border-radius: 3px; background: #d5dde6;"></span>
    </div>
    <!-- stat rings: not core -->
    <div class="pa-cut-a pa-cut-cut" style="position: absolute; left: 54px; top: 32px; width: 236px; height: 46px; display: flex; gap: 6px;">
      <div style="flex: 1; display: flex; align-items: center; gap: 6px; padding: 0 8px; border-radius: 8px; background: #ffffff; box-shadow: 0 1px 3px rgba(20, 40, 60, 0.1);"><span style="width: 20px; height: 20px; border-radius: 50%; border: 3px solid #34c38f; border-right-color: #e3e8ee; box-sizing: border-box;"></span><span style="width: 26px; height: 5px; border-radius: 3px; background: #c7d0da;"></span></div>
      <div style="flex: 1; display: flex; align-items: center; gap: 6px; padding: 0 8px; border-radius: 8px; background: #ffffff; box-shadow: 0 1px 3px rgba(20, 40, 60, 0.1);"><span style="width: 20px; height: 20px; border-radius: 50%; border: 3px solid #f5b041; border-bottom-color: #e3e8ee; box-sizing: border-box;"></span><span style="width: 26px; height: 5px; border-radius: 3px; background: #c7d0da;"></span></div>
      <div style="flex: 1; display: flex; align-items: center; gap: 6px; padding: 0 8px; border-radius: 8px; background: #ffffff; box-shadow: 0 1px 3px rgba(20, 40, 60, 0.1);"><span style="width: 20px; height: 20px; border-radius: 50%; border: 3px solid #6c63ff; border-left-color: #e3e8ee; box-sizing: border-box;"></span><span style="width: 26px; height: 5px; border-radius: 3px; background: #c7d0da;"></span></div>
    </div>
    <!-- the task table: core -->
    <div style="position: absolute; left: 54px; top: 88px; width: 128px; height: 104px; box-sizing: border-box; display: flex; flex-direction: column; gap: 7px; padding: 9px; border-radius: 8px; background: #ffffff; box-shadow: 0 1px 3px rgba(20, 40, 60, 0.1);">
      <span style="width: 60%; height: 6px; border-radius: 3px; background: #2b3440;"></span>
      <div style="display: flex; align-items: center; gap: 5px;"><span style="width: 6px; height: 6px; border-radius: 50%; background: #34c38f;"></span><span style="width: 70%; height: 4px; border-radius: 2px; background: #c7d0da;"></span></div>
      <div style="display: flex; align-items: center; gap: 5px;"><span style="width: 6px; height: 6px; border-radius: 50%; background: #f5b041;"></span><span style="width: 60%; height: 4px; border-radius: 2px; background: #c7d0da;"></span></div>
      <div style="display: flex; align-items: center; gap: 5px;"><span style="width: 6px; height: 6px; border-radius: 50%; background: #ef5a5a;"></span><span style="width: 66%; height: 4px; border-radius: 2px; background: #c7d0da;"></span></div>
      <span style="margin-top: auto; width: 54px; height: 14px; border-radius: 7px; background: linear-gradient(120deg, #6c63ff, #ff6584);"></span>
    </div>
    <!-- the bar chart: not core -->
    <div class="pa-cut-a pa-cut-cut" style="position: absolute; left: 190px; top: 88px; width: 100px; height: 104px; box-sizing: border-box; display: flex; align-items: flex-end; gap: 5px; padding: 12px 10px; border-radius: 8px; background: #ffffff; box-shadow: 0 1px 3px rgba(20, 40, 60, 0.1);">
      <span style="flex: 1; height: 40%; border-radius: 2px 2px 0 0; background: #c9c5ff;"></span>
      <span style="flex: 1; height: 65%; border-radius: 2px 2px 0 0; background: #6c63ff;"></span>
      <span style="flex: 1; height: 45%; border-radius: 2px 2px 0 0; background: #c9c5ff;"></span>
      <span style="flex: 1; height: 90%; border-radius: 2px 2px 0 0; background: #6c63ff;"></span>
      <span style="flex: 1; height: 60%; border-radius: 2px 2px 0 0; background: #c9c5ff;"></span>
    </div>
    <!-- the non-core layers, selected, then deleted -->
    <div class="pa-cut-a pa-cut-sel" style="position: absolute; left: 51px; top: 29px; width: 242px; height: 52px; border: 2px solid #38bdf8; border-radius: 10px; box-sizing: border-box;"></div>
    <div class="pa-cut-a pa-cut-sel" style="position: absolute; left: 187px; top: 85px; width: 106px; height: 110px; border: 2px solid #38bdf8; border-radius: 10px; box-sizing: border-box;"></div>
  </div>

  <!-- what stays flows across -->
  <svg class="pa-cut-a pa-cut-trail" width="64" height="20" viewBox="0 0 64 20" aria-hidden="true" style="position: absolute; left: 345px; top: 138px;">
    <path class="pa-cut-dash" d="M2 10H54" fill="none" stroke="#8b84ff" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 6"></path>
    <path d="M51 4l7 6-7 6" fill="none" stroke="#8b84ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>

  <!-- after: the phone, one main action -->
  <div style="position: absolute; left: 421px; top: 32px; width: 128px; height: 232px; border-radius: 18px; overflow: hidden; background: var(--pa-screen); box-shadow: var(--pa-screen-edge);">
    <div style="height: 40px; display: flex; align-items: center; gap: 6px; padding: 0 10px; background: linear-gradient(120deg, #6c63ff, #8a2be2);">
      <span style="width: 16px; height: 16px; border-radius: 50%; background: rgba(255, 255, 255, 0.9);"></span>
      <span style="width: 54px; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.9);"></span>
    </div>
    <div class="pa-cut-a pa-cut-land" style="display: flex; flex-direction: column; gap: 6px; padding: 10px;">
      <div style="display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 8px; border-radius: 8px; background: #ffffff; box-shadow: 0 1px 3px rgba(20, 40, 60, 0.12);"><span style="width: 7px; height: 7px; border-radius: 50%; background: #34c38f;"></span><span style="width: 62%; height: 5px; border-radius: 3px; background: #c7d0da;"></span></div>
      <div style="display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 8px; border-radius: 8px; background: #ffffff; box-shadow: 0 1px 3px rgba(20, 40, 60, 0.12);"><span style="width: 7px; height: 7px; border-radius: 50%; background: #f5b041;"></span><span style="width: 52%; height: 5px; border-radius: 3px; background: #c7d0da;"></span></div>
      <div style="display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 8px; border-radius: 8px; background: #ffffff; box-shadow: 0 1px 3px rgba(20, 40, 60, 0.12);"><span style="width: 7px; height: 7px; border-radius: 50%; background: #ef5a5a;"></span><span style="width: 58%; height: 5px; border-radius: 3px; background: #c7d0da;"></span></div>
    </div>
    <span style="position: absolute; left: 12px; right: 12px; bottom: 14px; height: 30px; border-radius: 15px; background: linear-gradient(120deg, #6c63ff, #ff6584);"></span>
  </div>
  <!-- the one main action, picked out -->
  <div class="pa-cut-a pa-cut-pick" style="position: absolute; left: 430px; top: 217px; width: 110px; height: 36px; border: 2px solid #38bdf8; border-radius: 18px; box-sizing: border-box;"></div>

  <!-- the cursor -->
  <div class="pa-cut-cur" style="position: absolute; left: 0; top: 0;">
    <div style="display: flex; align-items: flex-start; gap: 2px;">
      <svg width="14" height="18" viewBox="0 0 14 18" aria-hidden="true"><path d="M1 1 L1 15 L5 11.5 L7.6 17 L10 16 L7.4 10.6 L12.6 10.6 Z" fill="#ff6584" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"></path></svg>
    </div>
  </div>
`;
}

export function sceneRules(l: { states: string[]; steps: string[] }): string {
  return `
  <!-- the situation, named -->
  <div class="pa-rule-a pa-rule-hidden" style="position: absolute; left: 26px; top: 22px; display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 15px 0 12px; border-radius: 18px; background: var(--pa-chip); color: var(--pa-muted); font-size: 20px; font-weight: 700;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"></path></svg>${l.states[0]}
  </div>
  <div class="pa-rule-a pa-rule-shown" style="position: absolute; left: 26px; top: 22px; display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 15px 0 12px; border-radius: 18px; background: rgba(108, 99, 255, 0.24); color: var(--pa-text); font-size: 20px; font-weight: 700;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b5b0ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>${l.states[1]}
  </div>

  <!-- the form the user fills in -->
  <div style="position: absolute; left: 26px; top: 71px; width: 156px; height: 196px; border-radius: 12px; overflow: hidden; background: var(--pa-screen); box-shadow: var(--pa-screen-edge); display: flex; flex-direction: column;">
    <div style="height: 30px; display: flex; align-items: center; gap: 6px; padding: 0 12px; background: linear-gradient(120deg, #6c63ff, #8a2be2);">
      <span style="width: 12px; height: 12px; border-radius: 50%; background: rgba(255, 255, 255, 0.9);"></span>
      <span style="width: 54px; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.9);"></span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 9px; padding: 14px 12px;">
      <span style="width: 34px; height: 5px; border-radius: 3px; background: #c7d0da;"></span>
      <span style="height: 24px; border-radius: 6px; background: #ffffff; border: 1px solid #d5dde6;"></span>
      <span style="width: 34px; height: 5px; border-radius: 3px; background: #c7d0da;"></span>
      <span style="height: 24px; border-radius: 6px; background: #ffffff; border: 1px solid #d5dde6;"></span>
    </div>
    <span style="margin: auto 12px 14px; height: 28px; border-radius: 14px; background: linear-gradient(120deg, #6c63ff, #ff6584);"></span>
  </div>

  <!-- what happens after: hidden, then shown -->
  <svg width="44" height="20" viewBox="0 0 44 20" aria-hidden="true" style="position: absolute; left: 188px; top: 159px;">
    <path class="pa-rule-dash" d="M2 10H34" fill="none" stroke="#8b84ff" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 6"></path>
    <path d="M30 4l7 6-7 6" fill="none" stroke="#8b84ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
  </svg>

  <!-- hidden: a black box, nobody knows what happens inside -->
  <div class="pa-rule-a pa-rule-hidden" style="position: absolute; left: 236px; top: 71px; width: 318px; height: 196px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border-radius: 14px; background: #1b1a24; border: 1.5px dashed rgba(255, 255, 255, 0.22);">
    <span class="pa-rule-q" style="font-family: 'Noto Sans TC', sans-serif; font-size: 84px; font-weight: 900; line-height: 1; color: #ffffff;">?</span>
  </div>

  <!-- shown: the same flow, its steps laid out -->
  <div class="pa-rule-a pa-rule-shown" style="position: absolute; left: 236px; top: 71px; width: 318px; height: 196px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: 26px; padding: 0 28px; border-radius: 14px; background: var(--pa-screen); box-shadow: var(--pa-screen-edge); color: #2b3440;">
    <div style="position: relative; display: flex; justify-content: space-between;">
      <!-- the line between the steps -->
      <span style="position: absolute; left: 22px; right: 22px; top: 21px; height: 3px; border-radius: 2px; background: #d5dde6;"></span>
      <span class="pa-rule-a pa-rule-bar" style="position: absolute; left: 22px; right: 22px; top: 21px; height: 3px; border-radius: 2px; background: linear-gradient(90deg, #34c38f, #6c63ff);"></span>

      <div style="position: relative; width: 44px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <div style="position: relative; width: 44px; height: 44px;">
          <span style="position: absolute; inset: 0; border-radius: 50%; background: #ffffff; border: 2.5px solid #d5dde6; box-sizing: border-box;"></span>
          <span class="pa-rule-a pa-rule-on1" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #34c38f;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span>
        </div>
        <span style="font-size: 20px; font-weight: 700; white-space: nowrap;">${l.steps[0]}</span>
      </div>

      <div style="position: relative; width: 44px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <div style="position: relative; width: 44px; height: 44px;">
          <span style="position: absolute; inset: 0; border-radius: 50%; background: #ffffff; border: 2.5px solid #d5dde6; box-sizing: border-box;"></span>
          <span class="pa-rule-a pa-rule-on2" style="position: absolute; inset: 0; border-radius: 50%; background: #fff6e5;"><span class="pa-rule-a pa-rule-off2" style="position: absolute; inset: 0;"><span class="pa-rule-ring" style="position: absolute; inset: 7px; border-radius: 50%; border: 3px solid rgba(245, 176, 65, 0.3); border-top-color: #f5b041;"></span></span></span>
          <span class="pa-rule-a pa-rule-on3" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #34c38f;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span>
        </div>
        <span style="font-size: 20px; font-weight: 700; white-space: nowrap;">${l.steps[1]}</span>
      </div>

      <div style="position: relative; width: 44px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <div style="position: relative; width: 44px; height: 44px;">
          <span style="position: absolute; inset: 0; border-radius: 50%; background: #ffffff; border: 2.5px solid #d5dde6; box-sizing: border-box;"></span>
          <span class="pa-rule-a pa-rule-on3" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #6c63ff;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span>
        </div>
        <span style="font-size: 20px; font-weight: 700; white-space: nowrap;">${l.steps[2]}</span>
      </div>
    </div>
  </div>

  <!-- the cursor, pressing send -->
  <div style="position: absolute; left: 120px; top: 238px;">
    <div class="pa-rule-press">
      <svg width="14" height="18" viewBox="0 0 14 18" aria-hidden="true"><path d="M1 1 L1 15 L5 11.5 L7.6 17 L10 16 L7.4 10.6 L12.6 10.6 Z" fill="#ff6584" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"></path></svg>
    </div>
  </div>
`;
}
