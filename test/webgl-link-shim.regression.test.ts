import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Regression: the loading animation froze 15–20 times on a first visit (4–5s
// of a ~9s loading screen). Every freeze was three.js asking for a program's
// LINK_STATUS right after linking it: the browser's GPU thread — which also
// presents every frame — then sat waiting for the shader compile. The inline
// shim in index.html waits by polling COMPLETION_STATUS_KHR instead, which
// leaves the GPU thread free.
const html = readFileSync(resolve(__dirname, '..', 'index.html'), 'utf8');
const shim = html.match(/<script>\s*\/\* tl-link-shim \*\/([\s\S]*?)<\/script>/)?.[1] ?? '';

const COMPLETION_STATUS_KHR = 0x91B1;
const LINK_STATUS = 0x8B82;

type Opts = { chromium?: boolean; ext?: boolean; completeAfterPolls?: number; completion?: () => unknown };

function setup({ chromium = true, ext = true, completeAfterPolls = 3, completion }: Opts = {}) {
  const calls: string[] = [];
  let polls = 0;
  class FakeGL {
    getExtension(name: string) { calls.push(`getExtension:${name}`); return ext ? {} : null; }
    linkProgram() { calls.push('linkProgram'); }
    getProgramParameter(_program: unknown, pname: number) {
      if (pname === COMPLETION_STATUS_KHR) {
        polls++;
        return completion ? completion() : polls > completeAfterPolls;
      }
      calls.push(`getProgramParameter:${pname}`);
      return true;
    }
    getUniformLocation() { calls.push('getUniformLocation'); return {}; }
    useProgram() { calls.push('useProgram'); }
  }
  // Each read moves the clock on, so the shim's wait loops always terminate.
  let now = 0;
  const performance = { now: () => (now += 0.25) };
  const window = { WebGLRenderingContext: FakeGL, WebGL2RenderingContext: undefined };
  const navigator = chromium ? { userAgentData: {} } : {};
  new Function('window', 'navigator', 'performance', shim)(window, navigator, performance);
  return { gl: new FakeGL(), calls, polls: () => polls, elapsed: () => now, FakeGL };
}

describe('WebGL link shim (index.html)', () => {
  it('is inline and runs before the Spline viewer script', () => {
    expect(shim.length).toBeGreaterThan(0);
    expect(html.indexOf('/* tl-link-shim */')).toBeLessThan(html.indexOf('spline-viewer.js'));
  });

  it('turns on parallel compile at link time, once per context', () => {
    const { gl, calls } = setup();
    gl.linkProgram({});
    gl.linkProgram({});
    expect(calls).toEqual(['getExtension:KHR_parallel_shader_compile', 'linkProgram', 'linkProgram']);
  });

  it('polls for completion before the first query that needs the linked program', () => {
    const { gl, calls, polls } = setup({ completeAfterPolls: 3 });
    const program = {};
    gl.linkProgram(program);
    expect(polls()).toBe(0); // linking itself never waits
    expect(gl.getProgramParameter(program, LINK_STATUS)).toBe(true);
    expect(polls()).toBe(4); // three "not yet", then "done"
    expect(calls.at(-1)).toBe(`getProgramParameter:${LINK_STATUS}`);
  });

  it('waits only once per link — later calls go straight through', () => {
    const { gl, polls } = setup({ completeAfterPolls: 2 });
    const program = {};
    gl.linkProgram(program);
    gl.getUniformLocation(program, 'u');
    const after = polls();
    gl.useProgram(program);
    gl.getProgramParameter(program, LINK_STATUS);
    expect(polls()).toBe(after);
  });

  it('waits again after a re-link', () => {
    const { gl, polls } = setup({ completeAfterPolls: 0 });
    const program = {};
    gl.linkProgram(program);
    gl.useProgram(program);
    expect(polls()).toBe(1);
    gl.linkProgram(program);
    gl.useProgram(program);
    expect(polls()).toBe(2);
  });

  it('covers other link-dependent calls, and ignores ones without a pending program', () => {
    const { gl, polls } = setup({ completeAfterPolls: 1 });
    gl.useProgram(null);
    gl.getUniformLocation({}, 'never linked through the shim');
    expect(polls()).toBe(0);
    const program = {};
    gl.linkProgram(program);
    gl.useProgram(program);
    expect(polls()).toBe(2);
  });

  it("a page's own COMPLETION_STATUS_KHR query is passed through, not waited on", () => {
    const { gl, polls } = setup({ completeAfterPolls: 5 });
    const program = {};
    gl.linkProgram(program);
    expect(gl.getProgramParameter(program, COMPLETION_STATUS_KHR)).toBe(false);
    expect(polls()).toBe(1);
  });

  it('does not spin on an invalid program or a lost context (null / true answers)', () => {
    for (const answer of [null, true]) {
      const { gl, polls } = setup({ completion: () => answer });
      const program = {};
      gl.linkProgram(program);
      gl.getProgramParameter(program, LINK_STATUS);
      expect(polls()).toBe(1);
    }
  });

  it('gives up after 3s, falls back to the blocking call, and switches itself off', () => {
    const { gl, calls, polls, elapsed } = setup({ completion: () => false });
    const a = {};
    gl.linkProgram(a);
    expect(gl.getProgramParameter(a, LINK_STATUS)).toBe(true); // still answered
    expect(elapsed()).toBeGreaterThan(3000);
    expect(elapsed()).toBeLessThan(3100);
    expect(calls.at(-1)).toBe(`getProgramParameter:${LINK_STATUS}`);

    const pollsAfterGivingUp = polls();
    const b = {};
    gl.linkProgram(b);
    gl.getProgramParameter(b, LINK_STATUS);
    expect(polls()).toBe(pollsAfterGivingUp); // off: no more polling
  });

  it('does nothing when the extension is missing', () => {
    const { gl, polls } = setup({ ext: false });
    const program = {};
    gl.linkProgram(program);
    gl.getProgramParameter(program, LINK_STATUS);
    expect(polls()).toBe(0);
  });

  it('is not installed outside Chromium', () => {
    const { FakeGL } = setup({ chromium: false });
    expect((FakeGL.prototype as any).__tlLinkShim).toBeUndefined();
    const spy = vi.spyOn(FakeGL.prototype, 'getExtension');
    new FakeGL().linkProgram();
    expect(spy).not.toHaveBeenCalled();
  });
});
