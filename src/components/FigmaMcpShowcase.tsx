import { useEffect, useRef } from 'react';

// Two response-native cards (Figma design canvas mockup + VS Code mockup)
// bridged by a centered "Figma MCP" hub — same shell mechanics as the
// .tech-item cards above (a CSS Grid with align-items:stretch makes both
// cards equal height automatically). Content is skeleton/placeholder shapes
// on purpose (see FigmaMcpShowcase's earlier history): no real text, numbers
// or fake screenshots, just structural bars. Text/icons drawn on top of a
// colored button or gradient tile (Share, the "SC" avatar, selection
// badges, the hub label) stay literal white on purpose: their background is
// always the accent color, never the neutral surface, so they never need to
// flip between themes.
const FIGMA_CARD_HTML = `
  <!-- top chrome -->
  <div style="height: 44px; flex: none; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 16px; border-bottom: 1px solid rgba(var(--mcp-fg-rgb),0.07);">
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="display: flex; gap: 6px;">
        <span style="width: 8px; height: 8px; border-radius: 999px; background: #ff5f57;"></span>
        <span style="width: 8px; height: 8px; border-radius: 999px; background: #febc2e;"></span>
        <span style="width: 8px; height: 8px; border-radius: 999px; background: #28c840;"></span>
      </div>
      <div class="mcp-tabbar" style="display: flex; gap: 6px; margin-left: 12px;">
        <span style="padding: 4px 10px; border-radius: 6px; font-size: 11px; color: rgba(var(--mcp-fg-rgb),0.5);">Design System</span>
        <span style="padding: 4px 10px; border-radius: 6px; font-size: 11px; color: rgb(var(--mcp-fg-rgb)); background: rgba(var(--mcp-fg-rgb),0.09);">Card Component</span>
        <span style="padding: 4px 10px; border-radius: 6px; font-size: 11px; color: rgba(var(--mcp-fg-rgb),0.5);">Mobile</span>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="padding: 5px 12px; border-radius: 6px; background: var(--primary); color: #fff; font-size: 10.5px; font-weight: 600;">Share</span>
      <span style="width: 22px; height: 22px; flex: none; border-radius: 999px; background: linear-gradient(135deg, var(--secondary), #38bdf8); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 9px; font-weight: 700;">SC</span>
    </div>
  </div>

  <!-- body: sidebar + canvas -->
  <div style="flex: 1; display: flex; min-height: 0;">

    <!-- pages sidebar -->
    <div class="mcp-pages-sidebar" style="width: 132px; flex: none; padding: 16px 12px; display: flex; flex-direction: column; gap: 10px; border-right: 1px solid rgba(var(--mcp-fg-rgb),0.06);">
      <span style="font-size: 10px; letter-spacing: 0.08em; color: rgba(var(--mcp-fg-rgb),0.4); text-transform: uppercase;">Pages</span>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 8px; padding: 5px 6px; border-radius: 6px;">
          <span style="width: 14px; height: 14px; border-radius: 4px; background: linear-gradient(135deg, var(--primary)55, var(--secondary)55);"></span>
          <span style="font-size: 11.5px; color: rgba(var(--mcp-fg-rgb),0.65);">Cover</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; padding: 5px 6px; border-radius: 6px; background: rgba(var(--mcp-fg-rgb),0.07);">
          <span style="width: 14px; height: 14px; border-radius: 4px; background: linear-gradient(135deg, var(--primary), #38bdf8);"></span>
          <span style="font-size: 11.5px; color: rgb(var(--mcp-fg-rgb)); font-weight: 600;">Components</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; padding: 5px 6px; border-radius: 6px;">
          <span style="width: 14px; height: 14px; border-radius: 4px; background: linear-gradient(135deg, var(--primary)55, var(--secondary)55);"></span>
          <span style="font-size: 11.5px; color: rgba(var(--mcp-fg-rgb),0.65);">Mobile</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; padding: 5px 6px; border-radius: 6px;">
          <span style="width: 14px; height: 14px; border-radius: 4px; background: linear-gradient(135deg, var(--primary)55, var(--secondary)55);"></span>
          <span style="font-size: 11.5px; color: rgba(var(--mcp-fg-rgb),0.65);">Desktop</span>
        </div>
      </div>
    </div>

    <!-- canvas -->
    <div style="flex: 1; min-width: 0; box-sizing: border-box; padding: 22px 20px 20px; display: flex; flex-direction: column; gap: 14px; background-image: radial-gradient(rgba(var(--mcp-fg-rgb),0.08) 1px, transparent 1px); background-size: 18px 18px;">

      <!-- row 1: Desktop Dashboard + Mobile Card -->
      <div style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 14px;">
        <div style="position: relative;">
          <span style="position: absolute; top: -16px; left: 0; font-size: 9px; color: rgba(var(--mcp-fg-rgb),0.5);">Desktop Dashboard</span>
          <div style="box-sizing: border-box; height: 168px; background: var(--mcp-card-bg); border: 1px solid rgba(var(--mcp-fg-rgb),0.09); border-radius: 8px; padding: 8px; display: flex; gap: 6px;">
            <div style="width: 16px; flex: none; display: flex; flex-direction: column; align-items: center; gap: 8px; padding-top: 2px; color: rgba(var(--mcp-fg-rgb),0.32);">
              <span style="color: var(--primary);"><svg width="10" height="10" viewBox="0 0 12 12"><rect x="1" y="1" width="4.5" height="4.5" rx="1" fill="currentColor"></rect><rect x="6.5" y="1" width="4.5" height="4.5" rx="1" fill="currentColor"></rect><rect x="1" y="6.5" width="4.5" height="4.5" rx="1" fill="currentColor"></rect><rect x="6.5" y="6.5" width="4.5" height="4.5" rx="1" fill="currentColor"></rect></svg></span>
              <svg width="10" height="10" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="2.6" rx="1" fill="currentColor"></rect><rect x="1" y="5.2" width="10" height="1.8" rx="0.9" fill="currentColor" fill-opacity="0.7"></rect><rect x="1" y="8.6" width="6" height="1.8" rx="0.9" fill="currentColor" fill-opacity="0.7"></rect></svg>
              <svg width="10" height="10" viewBox="0 0 12 12"><path d="M1 1 H6 L11 6 L6 11 L1 6 Z" fill="none" stroke="currentColor" stroke-width="1.2"></path><circle cx="3.2" cy="3.2" r="0.9" fill="currentColor"></circle></svg>
              <svg width="10" height="10" viewBox="0 0 12 12"><circle cx="6" cy="3.6" r="2.1" fill="currentColor"></circle><path d="M1.6 11 C1.6 7.6 10.4 7.6 10.4 11 Z" fill="currentColor"></path></svg>
              <svg width="10" height="10" viewBox="0 0 12 12"><rect x="1" y="6" width="2.2" height="5" fill="currentColor"></rect><rect x="4.9" y="3" width="2.2" height="8" fill="currentColor"></rect><rect x="8.8" y="1" width="2.2" height="10" fill="currentColor"></rect></svg>
              <svg width="10" height="10" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" stroke-width="1.2"></circle><circle cx="6" cy="6" r="1.2" fill="currentColor"></circle></svg>
            </div>
            <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px;">
                <div style="background: rgba(var(--mcp-fg-rgb),0.045); border: 1px solid rgba(var(--mcp-fg-rgb),0.07); border-radius: 5px; padding: 4px 6px; display: flex; flex-direction: column; gap: 4px;">
                  <span style="width: 55%; height: 4px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.16); display: block;"></span>
                  <span style="width: 75%; height: 7px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.28); display: block;"></span>
                </div>
                <div style="background: rgba(var(--mcp-fg-rgb),0.045); border: 1px solid rgba(var(--mcp-fg-rgb),0.07); border-radius: 5px; padding: 4px 6px; display: flex; flex-direction: column; gap: 4px;">
                  <span style="width: 45%; height: 4px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.16); display: block;"></span>
                  <span style="width: 60%; height: 7px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.28); display: block;"></span>
                </div>
                <div style="background: rgba(var(--mcp-fg-rgb),0.045); border: 1px solid rgba(var(--mcp-fg-rgb),0.07); border-radius: 5px; padding: 4px 6px; display: flex; flex-direction: column; gap: 4px;">
                  <span style="width: 60%; height: 4px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.16); display: block;"></span>
                  <span style="width: 40%; height: 7px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.28); display: block;"></span>
                </div>
                <div style="background: rgba(var(--mcp-fg-rgb),0.045); border: 1px solid rgba(var(--mcp-fg-rgb),0.07); border-radius: 5px; padding: 4px 6px; display: flex; flex-direction: column; gap: 4px;">
                  <span style="width: 50%; height: 4px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.16); display: block;"></span>
                  <span style="width: 65%; height: 7px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.28); display: block;"></span>
                </div>
              </div>
              <div style="display: flex; gap: 5px; flex: 1; min-height: 0;">
                <div style="flex: 1; min-width: 0; background: rgba(var(--mcp-fg-rgb),0.035); border: 1px solid rgba(var(--mcp-fg-rgb),0.06); border-radius: 5px; padding: 5px; display: flex; flex-direction: column; gap: 3px;">
                  <span style="width: 65%; height: 4px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.16); display: block;"></span>
                  <div style="display: flex; align-items: flex-end; gap: 2px; height: 34px;">
                    <span style="flex: 1; height: 40%; border-radius: 1px 1px 0 0; background: rgba(var(--mcp-fg-rgb),0.16);"></span>
                    <span style="flex: 1; height: 60%; border-radius: 1px 1px 0 0; background: rgba(var(--mcp-fg-rgb),0.16);"></span>
                    <span style="flex: 1; height: 45%; border-radius: 1px 1px 0 0; background: rgba(var(--mcp-fg-rgb),0.16);"></span>
                    <span style="flex: 1; height: 85%; border-radius: 1px 1px 0 0; background: rgba(var(--mcp-fg-rgb),0.16);"></span>
                    <span style="flex: 1; height: 55%; border-radius: 1px 1px 0 0; background: rgba(var(--mcp-fg-rgb),0.16);"></span>
                    <span style="flex: 1; height: 100%; border-radius: 1px 1px 0 0; background: rgba(var(--mcp-fg-rgb),0.16);"></span>
                  </div>
                </div>
                <div style="flex: 1; min-width: 0; background: rgba(var(--mcp-fg-rgb),0.035); border: 1px solid rgba(var(--mcp-fg-rgb),0.06); border-radius: 5px; padding: 5px; display: flex; flex-direction: column; gap: 4px;">
                  <span style="width: 70%; height: 4px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.16); display: block;"></span>
                  <div style="display: flex; align-items: center; gap: 5px;">
                    <div style="position: relative; width: 28px; height: 28px; flex: none; border-radius: 999px; background: rgba(var(--mcp-fg-rgb),0.14);">
                      <div style="position: absolute; inset: 7px; border-radius: 999px; background: var(--mcp-card-bg);"></div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                      <span style="width: 32px; height: 4px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.14); display: block;"></span>
                      <span style="width: 26px; height: 4px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.14); display: block;"></span>
                      <span style="width: 30px; height: 4px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.14); display: block;"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style="position: relative;">
          <span style="position: absolute; top: -16px; left: 0; font-size: 9px; color: rgba(var(--mcp-fg-rgb),0.5); white-space: nowrap;">Mobile Card</span>
          <div style="box-sizing: border-box; height: 168px; background: var(--mcp-card-bg); border: 1px solid rgba(var(--mcp-fg-rgb),0.09); border-radius: 14px; padding: 8px; display: flex; flex-direction: column; gap: 6px;">
            <div style="height: 62px; border-radius: 8px; background: rgba(var(--mcp-fg-rgb),0.12); flex: none;"></div>
            <span style="width: 85%; height: 6px; border-radius: 3px; background: rgba(var(--mcp-fg-rgb),0.22); display: block;"></span>
            <span style="width: 45%; height: 4px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.14); display: block;"></span>
            <span style="width: 40%; height: 8px; border-radius: 3px; background: rgba(var(--mcp-fg-rgb),0.22); display: block;"></span>
            <span style="margin-top: auto; height: 17px; border-radius: 5px; background: rgba(var(--mcp-fg-rgb),0.14); display: block;"></span>
          </div>
        </div>
      </div>

      <!-- row 2: Components + Card/Primary (selected) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div style="position: relative;">
          <span style="position: absolute; top: -16px; left: 0; font-size: 9px; color: rgba(var(--mcp-fg-rgb),0.5);">Components</span>
          <span style="position: absolute; top: -8px; right: -8px; width: 18px; height: 18px; border-radius: 999px 999px 999px 2px; background: var(--secondary); color: #fff; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; z-index: 1;">1</span>
          <div style="box-sizing: border-box; height: 128px; background: var(--mcp-card-bg); border: 1px solid rgba(var(--mcp-fg-rgb),0.09); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="width: 40px; height: 15px; border-radius: 6px; background: var(--primary);"></span>
              <span style="width: 46px; height: 15px; border-radius: 6px; border: 1px solid var(--primary);"></span>
              <span style="width: 30px; height: 15px; border-radius: 6px; background: rgba(var(--mcp-fg-rgb),0.08);"></span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="width: 34px; height: 9px; border-radius: 4px; background: #34d39922;"></span>
              <span style="width: 40px; height: 9px; border-radius: 4px; background: #fbbf2422;"></span>
              <span style="width: 44px; height: 9px; border-radius: 4px; background: #f8717122;"></span>
            </div>
            <div style="display: flex; gap: 7px;">
              <span style="width: 15px; height: 15px; border-radius: 999px; background: var(--primary);"></span>
              <span style="width: 15px; height: 15px; border-radius: 999px; background: var(--secondary);"></span>
              <span style="width: 15px; height: 15px; border-radius: 999px; background: #38bdf8;"></span>
            </div>
          </div>
        </div>

        <div style="position: relative;">
          <span style="position: absolute; top: -20px; left: -2px; padding: 2px 7px; border-radius: 4px; background: #38bdf8; color: #0f0f10; font-size: 9px; font-weight: 700;">Card / Primary</span>
          <span style="position: absolute; top: -28px; right: 8px; width: 16px; height: 16px; border-radius: 999px 999px 2px 999px; background: var(--secondary); color: #fff; font-size: 8px; font-weight: 700; display: flex; align-items: center; justify-content: center;">2</span>
          <div style="position: absolute; inset: -3px; border: 2px solid #38bdf8; border-radius: 11px; pointer-events: none;"></div>
          <span style="position: absolute; top: -3px; left: -3px; width: 6px; height: 6px; background: #fff; border: 1.5px solid #38bdf8; transform: translate(-50%, -50%);"></span>
          <span style="position: absolute; top: -3px; right: -3px; width: 6px; height: 6px; background: #fff; border: 1.5px solid #38bdf8; transform: translate(50%, -50%);"></span>
          <span style="position: absolute; bottom: -3px; left: -3px; width: 6px; height: 6px; background: #fff; border: 1.5px solid #38bdf8; transform: translate(-50%, 50%);"></span>
          <span style="position: absolute; bottom: -3px; right: -3px; width: 6px; height: 6px; background: #fff; border: 1.5px solid #38bdf8; transform: translate(50%, 50%);"></span>
          <div style="box-sizing: border-box; height: 128px; background: var(--mcp-card-bg); border: 1px solid rgba(var(--mcp-fg-rgb),0.08); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="height: 46px; border-radius: 6px; background: rgba(var(--mcp-fg-rgb),0.12); flex: none;"></div>
            <span style="width: 80%; height: 6px; border-radius: 3px; background: rgba(var(--mcp-fg-rgb),0.22); display: block;"></span>
            <span style="width: 40%; height: 4px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.14); display: block;"></span>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="width: 32px; height: 8px; border-radius: 2px; background: rgba(var(--mcp-fg-rgb),0.22);"></span>
              <span style="width: 44px; height: 15px; border-radius: 4px; background: var(--primary);"></span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
`;

const CODE_CARD_HTML = `
  <!-- window chrome -->
  <div style="height: 40px; flex: none; display: flex; align-items: center; gap: 8px; padding: 0 16px; border-bottom: 1px solid rgba(var(--mcp-fg-rgb),0.06);">
    <span style="width: 8px; height: 8px; border-radius: 999px; background: #ff5f57;"></span>
    <span style="width: 8px; height: 8px; border-radius: 999px; background: #febc2e;"></span>
    <span style="width: 8px; height: 8px; border-radius: 999px; background: #28c840;"></span>
    <span style="margin-left: 12px; font-size: 10.5px; color: rgba(var(--mcp-fg-rgb),0.35);">card-component — VS Code</span>
  </div>

  <!-- tab bar -->
  <div class="mcp-tabbar" style="height: 32px; flex: none; display: flex; align-items: stretch; border-bottom: 1px solid rgba(var(--mcp-fg-rgb),0.06);">
    <div style="display: flex; align-items: center; gap: 6px; padding: 0 14px; font-size: 11px; color: rgba(var(--mcp-fg-rgb),0.45); border-right: 1px solid rgba(var(--mcp-fg-rgb),0.05);">
      <span style="width: 6px; height: 6px; border-radius: 999px; background: var(--secondary);"></span>tokens.ts
    </div>
    <div style="display: flex; align-items: center; gap: 6px; padding: 0 14px; font-size: 11px; color: rgb(var(--mcp-fg-rgb)); background: var(--mcp-code-tab-bg); border-top: 2px solid var(--primary); border-right: 1px solid rgba(var(--mcp-fg-rgb),0.05);">
      <span style="width: 6px; height: 6px; border-radius: 999px; background: #38bdf8;"></span>Card.tsx
    </div>
  </div>

  <!-- body: file tree + editor -->
  <div style="flex: 1; display: flex; min-height: 0;">
    <div class="mcp-filetree" style="width: 148px; flex: none; padding: 12px; display: flex; flex-direction: column; gap: 4px; border-right: 1px solid rgba(var(--mcp-fg-rgb),0.06); font-size: 11px;">
      <div style="display: flex; align-items: center; gap: 6px; color: rgba(var(--mcp-fg-rgb),0.6); padding: 3px 0;">
        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 3 L5 7 L9 3" stroke="rgba(var(--mcp-fg-rgb),0.5)" stroke-width="1.4" fill="none"></path></svg>
        <svg width="12" height="10" viewBox="0 0 12 10"><path d="M1 1 H5 L6 2 H11 V9 H1 Z" fill="rgba(var(--mcp-fg-rgb),0.35)"></path></svg>
        <span>components</span>
      </div>
      <div style="display: flex; align-items: center; gap: 6px; padding: 4px 6px; margin-left: 14px; border-radius: 4px; background: rgba(var(--mcp-fg-rgb),0.07); color: rgb(var(--mcp-fg-rgb)); font-weight: 600;">
        <span style="width: 6px; height: 6px; border-radius: 999px; background: #38bdf8;"></span>Card.tsx
      </div>
      <div style="display: flex; align-items: center; gap: 6px; padding: 4px 6px; margin-left: 14px; color: rgba(var(--mcp-fg-rgb),0.5);">
        <span style="width: 6px; height: 6px; border-radius: 999px; background: var(--secondary);"></span>tokens.ts
      </div>
    </div>

    <div style="flex: 1; min-width: 0; position: relative; overflow: hidden; background: var(--mcp-code-editor-bg); padding: 16px 0;">
      <div class="mcp-mono" style="font-size: 12.5px; line-height: 1.75; color: rgba(var(--mcp-fg-rgb),0.82);">
        <div style="display: flex; align-items: center;"><span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">1</span><span style="display: flex; align-items: center; gap: 6px;"><span style="display: inline-block; width: 34px; height: 8px; border-radius: 3px; background: var(--secondary); opacity: 0.55;"></span><span style="display: inline-block; width: 28px; height: 8px; border-radius: 3px; background: #38bdf8; opacity: 0.55;"></span><span style="display: inline-block; width: 22px; height: 8px; border-radius: 3px; background: var(--secondary); opacity: 0.55;"></span><span style="display: inline-block; width: 68px; height: 8px; border-radius: 3px; background: var(--mcp-string); opacity: 0.55;"></span></span></div>
        <div style="display: flex;"><span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">2</span></div>
        <div style="display: flex; align-items: center;"><span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">3</span><span style="display: flex; align-items: center; gap: 6px;"><span style="display: inline-block; width: 58px; height: 8px; border-radius: 3px; background: var(--secondary); opacity: 0.55;"></span><span style="display: inline-block; width: 26px; height: 8px; border-radius: 3px; background: #38bdf8; opacity: 0.55;"></span><span style="display: inline-block; width: 18px; height: 8px; border-radius: 3px; background: rgba(var(--mcp-fg-rgb),0.18);"></span></span></div>
        <div style="display: flex; align-items: center;"><span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">4</span><span style="padding-left: 18px; display: flex; align-items: center; gap: 6px;"><span style="display: inline-block; width: 42px; height: 8px; border-radius: 3px; background: var(--secondary); opacity: 0.55;"></span><span style="display: inline-block; width: 10px; height: 8px; border-radius: 3px; background: rgba(var(--mcp-fg-rgb),0.18);"></span></span></div>
        <div style="display: flex; align-items: center;"><span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">5</span><span style="padding-left: 36px; display: flex; align-items: center;"><span style="display: inline-block; width: 26px; height: 8px; border-radius: 3px; background: #38bdf8; opacity: 0.55;"></span></span></div>
        <div style="display: flex; align-items: center;"><span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">6</span><span style="padding-left: 54px; display: flex; align-items: center;"><span style="display: inline-block; width: 48px; height: 8px; border-radius: 3px; background: rgba(var(--mcp-fg-rgb),0.18);"></span></span></div>
        <div style="display: flex; align-items: center; position: relative;">
          <span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">7</span>
          <span style="padding-left: 72px; display: flex; align-items: center; gap: 6px;"><span style="display: inline-block; width: 56px; height: 8px; border-radius: 3px; background: rgba(var(--mcp-fg-rgb),0.18);"></span><span style="display: inline-block; width: 58px; height: 8px; border-radius: 3px; background: var(--mcp-string); opacity: 0.55;"></span></span>
          <svg width="14" height="14" viewBox="0 0 24 24" style="position: absolute; left: 4px; top: 2px; filter: drop-shadow(0 0 4px var(--secondary));">
            <path d="M12 2 L14 9 L21 11 L14 13 L12 20 L10 13 L3 11 L10 9 Z" fill="var(--secondary)"></path>
          </svg>
        </div>
        <div style="display: flex; align-items: center;"><span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">8</span><span style="padding-left: 72px; display: flex; align-items: center; gap: 6px;"><span style="display: inline-block; width: 40px; height: 8px; border-radius: 3px; background: rgba(var(--mcp-fg-rgb),0.18);"></span><span style="display: inline-block; width: 52px; height: 8px; border-radius: 3px; background: var(--mcp-string); opacity: 0.55;"></span></span></div>
        <div style="display: flex; align-items: center;"><span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">9</span><span style="padding-left: 72px; display: flex; align-items: center; gap: 6px;"><span style="display: inline-block; width: 64px; height: 8px; border-radius: 3px; background: rgba(var(--mcp-fg-rgb),0.18);"></span><span style="display: inline-block; width: 30px; height: 8px; border-radius: 3px; background: var(--mcp-string); opacity: 0.55;"></span><span class="mcp-cursor-blink" style="display: inline-block; width: 1.5px; height: 12px; background: rgb(var(--mcp-fg-rgb));"></span></span></div>
        <div style="display: flex; align-items: center;"><span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">10</span><span style="padding-left: 54px; display: flex; align-items: center;"><span style="display: inline-block; width: 16px; height: 8px; border-radius: 3px; background: rgba(var(--mcp-fg-rgb),0.18);"></span></span></div>
        <div style="display: flex; align-items: center;"><span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">11</span><span style="padding-left: 36px; display: flex; align-items: center;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 3px; background: rgba(var(--mcp-fg-rgb),0.18);"></span></span></div>
        <div style="display: flex; align-items: center;"><span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">12</span><span style="padding-left: 54px; display: flex; align-items: center;"><span style="display: inline-block; width: 74px; height: 8px; border-radius: 3px; background: rgba(var(--mcp-fg-rgb),0.14);"></span></span></div>
        <div style="display: flex; align-items: center;"><span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">13</span><span style="padding-left: 36px; display: flex; align-items: center;"><span style="display: inline-block; width: 32px; height: 8px; border-radius: 3px; background: #38bdf8; opacity: 0.55;"></span></span></div>
        <div style="display: flex; align-items: center;"><span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">14</span><span style="padding-left: 18px; display: flex; align-items: center;"><span style="display: inline-block; width: 14px; height: 8px; border-radius: 3px; background: rgba(var(--mcp-fg-rgb),0.18);"></span></span></div>
        <div style="display: flex; align-items: center;"><span style="width: 34px; flex: none; text-align: right; padding-right: 14px; color: rgba(var(--mcp-fg-rgb),0.22);">15</span><span style="display: flex; align-items: center;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 3px; background: rgba(var(--mcp-fg-rgb),0.18);"></span></span></div>
      </div>
    </div>

    <!-- minimap -->
    <div style="width: 34px; flex: none; padding: 16px 6px; display: flex; flex-direction: column; gap: 3px; border-left: 1px solid rgba(var(--mcp-fg-rgb),0.05); background: rgba(var(--mcp-fg-rgb),0.015); position: relative;">
      <div style="position: absolute; top: 16px; left: 3px; right: 3px; height: 46px; background: rgba(var(--mcp-fg-rgb),0.06); border-radius: 2px;"></div>
      <span style="height: 2px; width: 60%; background: var(--secondary); opacity: 0.4; border-radius: 1px;"></span>
      <span style="height: 2px; width: 40%; background: rgba(var(--mcp-fg-rgb),0.3); opacity: 0.3; border-radius: 1px;"></span>
      <span style="height: 2px; width: 70%; background: var(--secondary); opacity: 0.35; border-radius: 1px;"></span>
      <span style="height: 2px; width: 55%; background: #38bdf8; opacity: 0.3; border-radius: 1px;"></span>
      <span style="height: 2px; width: 65%; background: rgba(var(--mcp-fg-rgb),0.3); opacity: 0.3; border-radius: 1px;"></span>
      <span style="height: 2px; width: 45%; background: rgba(var(--mcp-fg-rgb),0.3); opacity: 0.3; border-radius: 1px;"></span>
      <span style="height: 2px; width: 60%; background: rgba(var(--mcp-fg-rgb),0.3); opacity: 0.3; border-radius: 1px;"></span>
      <span style="height: 2px; width: 50%; background: var(--secondary); opacity: 0.4; border-radius: 1px;"></span>
      <span style="height: 2px; width: 68%; background: rgba(var(--mcp-fg-rgb),0.3); opacity: 0.3; border-radius: 1px;"></span>
      <span style="height: 2px; width: 38%; background: rgba(var(--mcp-fg-rgb),0.3); opacity: 0.3; border-radius: 1px;"></span>
      <span style="height: 2px; width: 58%; background: rgba(var(--mcp-fg-rgb),0.3); opacity: 0.3; border-radius: 1px;"></span>
      <span style="height: 2px; width: 30%; background: rgba(var(--mcp-fg-rgb),0.3); opacity: 0.3; border-radius: 1px;"></span>
    </div>
  </div>
`;

// "Design canvas -> MCP -> code editor" showcase for the Figma MCP tech-note.
// Two ordinary responsive cards in a grid — see .mcp-grid/.mcp-card in
// portfolio.css for why this replaced the earlier single fixed-1600px
// illustration scaled via CSS `zoom`: that approach needed every panel
// height hand-calculated in pixels, and any mismatch between the two
// panels' actual content height left a flat, oddly-colored empty patch in
// the shorter one. On desktop, a CSS Grid with align-items:stretch (the
// same mechanism the three .tech-item cards above already use) makes both
// cards equal height automatically. On mobile the cards stack instead of
// sitting in the same grid row, so that stretch no longer applies — a
// ResizeObserver on the Figma card mirrors its live content height onto
// --mcp-figma-h, which the mobile code-card height reads (see the
// `max-width: 720px` block in portfolio.css).
export default function FigmaMcpShowcase() {
  const gridRef = useRef<HTMLDivElement>(null);
  const figmaCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    const figmaCard = figmaCardRef.current;
    if (!grid || !figmaCard) return;
    const sync = () => grid.style.setProperty('--mcp-figma-h', `${figmaCard.offsetHeight}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(figmaCard);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mcp-grid rise-card" aria-hidden="true" ref={gridRef}>
      <div className="mcp-card" ref={figmaCardRef} dangerouslySetInnerHTML={{ __html: FIGMA_CARD_HTML }} />
      <div className="mcp-card code-card" dangerouslySetInnerHTML={{ __html: CODE_CARD_HTML }} />
      <svg className="mcp-trail-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mcp-trailA" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="mcp-trailB" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="var(--secondary)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0" />
          </linearGradient>
          {/* Vertical counterparts of the two gradients above, for the
              stacked mobile layout — same stops, rotated to flow top-to-
              bottom since the curves themselves connect top card to bottom
              card there instead of left card to right card. */}
          <linearGradient id="mcp-trailA-v" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="mcp-trailB-v" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="var(--secondary)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Desktop: cards sit side by side, curves meet at the horizontal
            gap between them. */}
        <path
          d="M 37.5 62.889 C 43.125 62.889, 43.75 51.111, 49.375 50"
          fill="none"
          stroke="url(#mcp-trailA)"
          strokeWidth="2"
          strokeDasharray="6 10"
          vectorEffect="non-scaling-stroke"
          className="mcp-trail-line mcp-trail-desktop"
        />
        <path
          d="M 50.625 50 C 56.25 48.889, 56.875 62.889, 62.5 62.889"
          fill="none"
          stroke="url(#mcp-trailB)"
          strokeWidth="2"
          strokeDasharray="6 10"
          vectorEffect="non-scaling-stroke"
          className="mcp-trail-line mcp-trail-desktop"
        />
        {/* Mobile: cards stack top over bottom, so the same two curves are
            rotated 90° (x/y swapped) to meet at the vertical gap instead. */}
        <path
          d="M 62.889 37.5 C 62.889 43.125, 51.111 43.75, 50 49.375"
          fill="none"
          stroke="url(#mcp-trailA-v)"
          strokeWidth="2"
          strokeDasharray="6 10"
          vectorEffect="non-scaling-stroke"
          className="mcp-trail-line mcp-trail-mobile"
        />
        <path
          d="M 50 50.625 C 48.889 56.25, 62.889 56.875, 62.889 62.5"
          fill="none"
          stroke="url(#mcp-trailB-v)"
          strokeWidth="2"
          strokeDasharray="6 10"
          vectorEffect="non-scaling-stroke"
          className="mcp-trail-line mcp-trail-mobile"
        />
      </svg>
      <div className="mcp-hub">
        <span className="mcp-hub-ring" />
        <div className="mcp-hub-pill">
          <i className="ph-fill ph-sparkle" style={{ color: '#ffffff', fontSize: 15 }} />
          <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 15, letterSpacing: '0.1em', fontFamily: 'var(--mono)' }}>
            Figma MCP
          </span>
        </div>
      </div>
    </div>
  );
}
