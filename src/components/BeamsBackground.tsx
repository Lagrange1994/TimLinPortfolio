import { useEffect, useRef } from 'react';

// ── Constants ──────────────────────────────────────────────────────────────
const BEAM_WIDTH   = 2.6;
const BEAM_HEIGHT  = 15;
const BEAM_NUMBER  = 14;
const LIGHT_COLOR  = [0.29, 0.0, 0.88] as const;  // #4A00E0
const SPEED        = 2.0;
const NOISE_INT    = 1.35;
const SCALE        = 0.18;
const ROTATION_DEG = 150;

// ── Pure-WebGL2 implementation (no Three.js, no conflicts) ─────────────────
const VERT_SRC = /* glsl */`#version 300 es
precision highp float;
in vec3 a_position;
in vec2 a_uv;

uniform mat4 u_mvp;
uniform float u_time;
uniform float u_speed;
uniform float u_scale;

out vec2 v_uv;
out vec3 v_normal;
out vec3 v_pos;

${/* Perlin noise ported from GLSL helper */`
vec4 permute4(vec4 x){return mod(((x*34.)+1.)*x,289.);}
vec4 taylorInvSqrt4(vec4 r){return 1.79284291400159-0.85373472095314*r;}
vec3 fade3(vec3 t){return t*t*t*(t*(t*6.-15.)+10.);}
float cnoise(vec3 P){
  vec3 Pi0=floor(P),Pi1=Pi0+vec3(1.);
  Pi0=mod(Pi0,289.);Pi1=mod(Pi1,289.);
  vec3 Pf0=fract(P),Pf1=Pf0-vec3(1.);
  vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x),iy=vec4(Pi0.yy,Pi1.yy);
  vec4 iz0=Pi0.zzzz,iz1=Pi1.zzzz;
  vec4 ixy=permute4(permute4(ix)+iy);
  vec4 ixy0=permute4(ixy+iz0),ixy1=permute4(ixy+iz1);
  vec4 gx0=ixy0/7.,gy0=fract(floor(gx0)/7.)-.5;gx0=fract(gx0);
  vec4 gz0=vec4(.5)-abs(gx0)-abs(gy0),sz0=step(gz0,vec4(0.));
  gx0-=sz0*(step(0.,gx0)-.5);gy0-=sz0*(step(0.,gy0)-.5);
  vec4 gx1=ixy1/7.,gy1=fract(floor(gx1)/7.)-.5;gx1=fract(gx1);
  vec4 gz1=vec4(.5)-abs(gx1)-abs(gy1),sz1=step(gz1,vec4(0.));
  gx1-=sz1*(step(0.,gx1)-.5);gy1-=sz1*(step(0.,gy1)-.5);
  vec3 g000=vec3(gx0.x,gy0.x,gz0.x),g100=vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010=vec3(gx0.z,gy0.z,gz0.z),g110=vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001=vec3(gx1.x,gy1.x,gz1.x),g101=vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011=vec3(gx1.z,gy1.z,gz1.z),g111=vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0=taylorInvSqrt4(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
  g000*=norm0.x;g010*=norm0.y;g100*=norm0.z;g110*=norm0.w;
  vec4 norm1=taylorInvSqrt4(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
  g001*=norm1.x;g011*=norm1.y;g101*=norm1.z;g111*=norm1.w;
  float n000=dot(g000,Pf0),n100=dot(g100,vec3(Pf1.x,Pf0.yz));
  float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)),n110=dot(g110,vec3(Pf1.xy,Pf0.z));
  float n001=dot(g001,vec3(Pf0.xy,Pf1.z)),n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
  float n011=dot(g011,vec3(Pf0.x,Pf1.yz)),n111=dot(g111,Pf1);
  vec3 fade_xyz=fade3(Pf0);
  vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
  vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);
  return 2.2*mix(n_yz.x,n_yz.y,fade_xyz.x);
}
float getDisplace(vec3 pos){
  return cnoise(vec3(pos.x*0.,pos.y-a_uv.y, pos.z+u_time*u_speed*3.)*u_scale);
}`}

void main(){
  vec3 pos = a_position;
  pos.z += getDisplace(pos);

  // Approximate normal via finite difference
  float eps = 0.01;
  vec3 dx = a_position + vec3(eps,0.,0.);
  dx.z += getDisplace(dx);
  vec3 dy = a_position + vec3(0.,-eps,0.);
  dy.z += getDisplace(dy);
  v_normal = normalize(cross(dx - pos, dy - pos));

  v_uv  = a_uv;
  v_pos = pos;
  gl_Position = u_mvp * vec4(pos, 1.0);
}`;

const FRAG_SRC = /* glsl */`#version 300 es
precision highp float;
in vec2 v_uv;
in vec3 v_normal;
in vec3 v_pos;

uniform vec3  u_lightColor;
uniform vec3  u_lightDir;
uniform float u_noiseInt;

out vec4 fragColor;

float random2(vec2 st){ return fract(sin(dot(st,vec2(12.9898,78.233)))*43758.5453); }

void main(){
  // Normal-based shading using the noise-displaced normals
  vec3 N = normalize(v_normal);
  // The normal in model space ~ (0,0,±1) for flat plane, tilted by noise
  // Use dot with viewer direction (0,0,1) as brightness proxy
  float ndotv = abs(dot(N, vec3(0.0, 0.0, 1.0)));
  float brightness = ndotv * 1.4 + 0.35;  // ambient 0.35, always some light

  // Film-grain dithering
  float grain = random2(gl_FragCoord.xy) / 10.0 * u_noiseInt;
  brightness = max(0.0, brightness - grain);

  vec3 color = u_lightColor * brightness;
  fragColor = vec4(color, 1.0);
}`;

// ── Math helpers (column-major, WebGL standard) ──────────────────────────────
// mat[col*4 + row]
function mat4Multiply(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++)
    for (let row = 0; row < 4; row++)
      out[col*4+row] =
        a[0*4+row]*b[col*4+0] + a[1*4+row]*b[col*4+1] +
        a[2*4+row]*b[col*4+2] + a[3*4+row]*b[col*4+3];
  return out;
}

function perspective(fovY: number, aspect: number, near: number, far: number) {
  const f  = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  // column-major: [col0, col1, col2, col3]
  return new Float32Array([
    f/aspect, 0,  0,                    0,   // col 0
    0,        f,  0,                    0,   // col 1
    0,        0,  (far+near)*nf,       -1,   // col 2
    0,        0,  2*far*near*nf,        0,   // col 3
  ]);
}

function rotateZ(angle: number) {
  const c = Math.cos(angle), s = Math.sin(angle);
  // column-major rotation around Z
  return new Float32Array([c,s,0,0,  -s,c,0,0,  0,0,1,0,  0,0,0,1]);
}

function translate(x: number, y: number, z: number) {
  return new Float32Array([1,0,0,0,  0,1,0,0,  0,0,1,0,  x,y,z,1]);
}

function buildBeamGeometry(n: number, width: number, height: number, segs: number) {
  const totalW = n * width;
  const xBase  = -totalW / 2;
  const nVerts = n * (segs + 1) * 2;
  const nIdx   = n * segs * 6;
  const pos = new Float32Array(nVerts * 3);
  const uvs = new Float32Array(nVerts * 2);
  const idx = new Uint32Array(nIdx);
  let vi = 0, ui = 0, ii = 0;

  for (let i = 0; i < n; i++) {
    const xOff   = xBase + i * width;
    const uvXBase = i / n;
    const uvXEnd  = (i + 1) / n;
    for (let j = 0; j <= segs; j++) {
      const y  = height * (j / segs - 0.5);
      const uv = j / segs;
      pos.set([xOff, y, 0,  xOff + width, y, 0], vi * 3);
      uvs.set([uvXBase, uv, uvXEnd, uv], ui);
      if (j < segs) {
        const a = vi, b = vi+1, c = vi+2, d = vi+3;
        idx.set([a,b,c, c,b,d], ii);
        ii += 6;
      }
      vi += 2; ui += 4;
    }
  }
  return { pos, uvs, idx };
}

function compileShader(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error('Shader error: ' + gl.getShaderInfoLog(s));
  return s;
}

function buildProgram(gl: WebGL2RenderingContext) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error('Link error: ' + gl.getProgramInfoLog(prog));
  return prog;
}

// ── React component ─────────────────────────────────────────────────────────
export default function BeamsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;

    function init() {
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;

      const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
      if (!gl) return;

      let prog: WebGLProgram;
      try { prog = buildProgram(gl); }
      catch (e) { console.warn('BeamsBackground shader failed:', e); return; }

      const { pos, uvs, idx } = buildBeamGeometry(BEAM_NUMBER, BEAM_WIDTH, BEAM_HEIGHT, 100);

      const vao = gl.createVertexArray()!;
      gl.bindVertexArray(vao);

      const posLoc = gl.getAttribLocation(prog, 'a_position');
      const uvLoc  = gl.getAttribLocation(prog, 'a_uv');

      const posBuf = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

      const uvBuf = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
      gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(uvLoc);
      gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

      const idxBuf = gl.createBuffer()!;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

      gl.bindVertexArray(null);

      // Uniform locations
      const uMvp       = gl.getUniformLocation(prog, 'u_mvp');
      const uTime      = gl.getUniformLocation(prog, 'u_time');
      const uSpeed     = gl.getUniformLocation(prog, 'u_speed');
      const uScale     = gl.getUniformLocation(prog, 'u_scale');
      const uLightColor = gl.getUniformLocation(prog, 'u_lightColor');
      const uLightDir  = gl.getUniformLocation(prog, 'u_lightDir');
      const uNoiseInt  = gl.getUniformLocation(prog, 'u_noiseInt');

      // Build MVP once (camera at z=20, FOV 30°)
      function buildMVP() {
        const w = canvas.width, h = canvas.height;
        const proj  = perspective(30 * Math.PI / 180, w / h, 0.1, 1000);
        const view  = translate(0, 0, -20);
        const rot   = rotateZ(ROTATION_DEG * Math.PI / 180);
        return mat4Multiply(mat4Multiply(proj, view), rot);
      }

      let mvp = buildMVP();
      let t   = 0;
      let active = false;

      function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        mvp = buildMVP();
      }
      resize();

      function frame(_ts: number) {
        if (cancelled) return;
        raf = requestAnimationFrame(frame);
        updateBg();
        if (!active) return;
        t += 0.016 * SPEED * 0.1;

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        gl.useProgram(prog);
        gl.uniformMatrix4fv(uMvp, false, mvp);
        gl.uniform1f(uTime, t);
        gl.uniform1f(uSpeed, SPEED);
        gl.uniform1f(uScale, SCALE);
        gl.uniform3fv(uLightColor, LIGHT_COLOR);
        gl.uniform3f(uLightDir, 0, 0.6, 1);
        gl.uniform1f(uNoiseInt, NOISE_INT);

        gl.bindVertexArray(vao);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);
      }

      raf = requestAnimationFrame(frame);

      // Scroll crossfade
      const splineEl = document.getElementById('spline-bg');
      function updateBg() {
        const heroEl = document.getElementById('home');
        if (!heroEl) return;
        const heroH    = heroEl.offsetHeight || window.innerHeight;
        const fadeStart = heroH * 0.45;
        const fadeEnd   = heroH * 0.85;
        const p = Math.max(0, Math.min(1, (window.scrollY - fadeStart) / (fadeEnd - fadeStart)));
        if (splineEl) (splineEl as HTMLElement).style.opacity = (1 - p).toFixed(3);
        canvas.style.opacity = p.toFixed(3);
        active = p > 0.02;
      }

      let ticking = false;
      const onScroll = () => {
        if (!ticking) { requestAnimationFrame(() => { updateBg(); ticking = false; }); ticking = true; }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', resize, { passive: true });
      updateBg();

      (canvas as any).__cleanup = () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', resize);
        gl.deleteProgram(prog);
      };
    }

    // Defer so Spline initialises first
    const tid = setTimeout(init, 500);

    return () => {
      cancelled = true;
      clearTimeout(tid);
      cancelAnimationFrame(raf);
      const c = canvasRef.current;
      if (c && (c as any).__cleanup) (c as any).__cleanup();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        id="beams-bg"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100dvh', zIndex: -1, opacity: 0, pointerEvents: 'none' }}
      />
      <spline-viewer id="spline-bg" url="./models/bg_scene.splinecode" />
    </>
  );
}
