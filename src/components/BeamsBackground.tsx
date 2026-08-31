import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { heroFramePath, notchPatchPath, FRAME_INSET, FRAME_RADIUS, NOTCH_FLAT, NOTCH_RADIUS } from '../utils/heroFramePath';

// Fixed gap between a notch's content and its reference point on the S-bend
// (NOTCH_CURVE_CLEARANCE below) — same 26px used for .navbar-brand's own
// left/top in portfolio.css, so all three sides read as one consistent gap
// instead of three unrelated numbers.
const NOTCH_CONTENT_GAP = 26;

// The right-side S-bend is two quarter-circle fillets back to back — see
// NOTCH_RADIUS's own comment in heroFramePath.ts. NOTCH_RADIUS (not
// 2*NOTCH_RADIUS) reaches only the seam where those two fillets meet, not
// all the way to the flat-depth plateau past the second one — a shallower,
// visually tighter reference point than the plateau, at the cost of the
// row's tallest content (the "TimLin" wordmark) having less curve depth to
// spare than it would against the plateau. The ask-strip's own shorter
// content (well under the wordmark's height) clears it with more room.
const NOTCH_CURVE_CLEARANCE = NOTCH_RADIUS;

// ── Constants (matches the original <Beams /> usage example) ────────────────
const BEAM_WIDTH = 2.6;
const BEAM_HEIGHT = 15;
const BEAM_NUMBER = 14;
const LIGHT_COLOR = '#6C63FF'; // --primary in portfolio.css
const SPEED = 2;
const NOISE_INTENSITY = 1.35;
const SCALE = 0.18;
const ROTATION = 150;

function hexToRGB01(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [parseInt(c.slice(0, 2), 16) / 255, parseInt(c.slice(2, 4), 16) / 255, parseInt(c.slice(4, 6), 16) / 255];
}

// ── GLSL noise (Classic Perlin 3D + value noise 2D) — identical to original ──
const NOISE_GLSL = `
float random(in vec2 st){return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);}
float noise(in vec2 st){
  vec2 i=floor(st),f=fract(st);
  float a=random(i),b=random(i+vec2(1.,0.)),c=random(i+vec2(0.,1.)),d=random(i+vec2(1.,1.));
  vec2 u=f*f*(3.-2.*f);
  return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
}
vec4 permute(vec4 x){return mod(((x*34.)+1.)*x,289.);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
vec3 fade(vec3 t){return t*t*t*(t*(t*6.-15.)+10.);}
float cnoise(vec3 P){
  vec3 Pi0=floor(P),Pi1=Pi0+vec3(1.);
  Pi0=mod(Pi0,289.);Pi1=mod(Pi1,289.);
  vec3 Pf0=fract(P),Pf1=Pf0-vec3(1.);
  vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x),iy=vec4(Pi0.yy,Pi1.yy);
  vec4 iz0=Pi0.zzzz,iz1=Pi1.zzzz;
  vec4 ixy=permute(permute(ix)+iy);
  vec4 ixy0=permute(ixy+iz0),ixy1=permute(ixy+iz1);
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
  vec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
  g000*=norm0.x;g010*=norm0.y;g100*=norm0.z;g110*=norm0.w;
  vec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
  g001*=norm1.x;g011*=norm1.y;g101*=norm1.z;g111*=norm1.w;
  float n000=dot(g000,Pf0),n100=dot(g100,vec3(Pf1.x,Pf0.yz));
  float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)),n110=dot(g110,vec3(Pf1.xy,Pf0.z));
  float n001=dot(g001,vec3(Pf0.xy,Pf1.z)),n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
  float n011=dot(g011,vec3(Pf0.x,Pf1.yz)),n111=dot(g111,Pf1);
  vec3 fade_xyz=fade(Pf0);
  vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
  vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);
  return 2.2*mix(n_yz.x,n_yz.y,fade_xyz.x);
}`;


export default function BeamsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [splineBgMounted, setSplineBgMounted] = useState(true);
  const splineBgMountedRef = useRef(splineBgMounted);
  splineBgMountedRef.current = splineBgMounted;
  // Written by updateBg() (runs from mount) and read by the animate loop
  // inside doHeavyInit (only exists once the deferred WebGL setup below has
  // run) — a ref instead of a local var so the two can share it despite
  // starting at different times.
  const beamsActiveRef = useRef(false);

  // The decorative background Spline scene (desktop/tablet — see isMobile
  // below) gets fully unmounted (not just faded to opacity 0) once scrolled
  // past the hero — see updateBg() below.

  // Below HeroSection's own Spline breakpoint (see HERO_FIGURE_BREAKPOINT in
  // Loader.tsx), skip the beams canvas's own Three.js renderer entirely (see
  // the early return below) too — that drops mobile to zero WebGL contexts.
  // Checked once on mount, matching the same one-shot (no resize listener)
  // convention HeroSection uses for its own figure.
  const [isMobile] = useState(() => window.innerWidth < 768);

  // The desktop hero-frame pieces (spline scene + notches) are portaled into
  // #home (see the return statement below) instead of rendered where this
  // component sits in the tree, so their position:absolute geometry resolves
  // against #home's own real box (border-radius/inset/etc.) rather than a
  // viewport-height stand-in. #home doesn't exist yet on this component's
  // first render (BeamsBackground mounts before HeroSection in App.tsx), so
  // this is populated a tick later once it does.
  const [heroEl, setHeroEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setHeroEl(document.getElementById('home'));
  }, []);

  // One shared `d` (see heroFramePath.ts) drives all three: the visible 1px
  // border stroke, the wide blurred stroke that stands in for the inner rim
  // light, and the <clipPath> that keeps that wide stroke's outer half off
  // the gradient. Same pattern as the portfolio wall's outline — the shape is
  // computed once from the live box and drawn as a stroke, so the border and
  // its glow trace the panel's actual edge (notches included) instead of
  // approximating it with a rounded-rect box-shadow.
  const framePathRefs = [
    useRef<SVGPathElement>(null),
    useRef<SVGPathElement>(null),
    useRef<SVGPathElement>(null),
  ];
  const notchTLRef = useRef<HTMLDivElement>(null);
  const notchBRRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isMobile || !heroEl) return;
    // Queried once per effect run (not per sync() call) — .navbar-brand and
    // #home .hero-ask are siblings mounted in the same initial commit as
    // #home itself, so they already exist by the time heroEl is set.
    const navbarBrandEl = document.querySelector<HTMLElement>('.navbar-brand');
    const heroAskEl = document.querySelector<HTMLElement>('#home .hero-ask');

    const sync = () => {
      // The gradient #home paints as its background, and the two notch
      // patches that re-paint slices of it, have to be sized off the SAME
      // rectangle or the patches sample the wrong part of it. That used to
      // be `100vw 100vh` on all three, which is subtly wrong: 100vw includes
      // the scrollbar (measured live at 1030 against #home's own 1026), and
      // #bg-notch-br anchors its copy to `100% 100%` — its right edge — so
      // the 4px difference pushed its gradient 4px sideways from #home's,
      // leaving a visible vertical seam down the notch's straight edge.
      // #home's real box has no such ambiguity.
      heroEl.style.setProperty('--hero-bg-w', `${heroEl.clientWidth}px`);
      heroEl.style.setProperty('--hero-bg-h', `${heroEl.clientHeight}px`);

      const w = heroEl.clientWidth - FRAME_INSET * 2;
      const h = heroEl.clientHeight - FRAME_INSET * 2;
      if (w <= 0 || h <= 0) return;

      // Each notch's flat width = the distance from the panel's own corner
      // to its content's far edge, plus NOTCH_CURVE_CLEARANCE (the S-bend's
      // own run — without it the content's far edge lands mid-curve, not on
      // open floor) plus a further 24px gap past that — the notch
      // shrink-wraps to whatever's actually sitting in it (the navbar
      // tagline, the ask-strip capsule) instead of content being sized to
      // fit a fixed notch. Falls back to the old fixed NOTCH_FLAT if a
      // notch's content isn't in the DOM for some reason.
      const heroRect = heroEl.getBoundingClientRect();
      const panelLeft = heroRect.left + FRAME_INSET;
      const panelRight = heroRect.right - FRAME_INSET;
      const flatTL = navbarBrandEl
        ? navbarBrandEl.getBoundingClientRect().right - panelLeft + NOTCH_CURVE_CLEARANCE + NOTCH_CONTENT_GAP
        : NOTCH_FLAT;
      const flatBR = heroAskEl
        ? panelRight - heroAskEl.getBoundingClientRect().left + NOTCH_CURVE_CLEARANCE + NOTCH_CONTENT_GAP
        : NOTCH_FLAT;

      const d = heroFramePath(w, h, FRAME_RADIUS, flatTL, flatBR);
      for (const ref of framePathRefs) ref.current?.setAttribute('d', d);
      // viewBox matches the element's own pixel box 1:1, so path units are
      // CSS px and the stroke width isn't scaled by the viewport.
      document.getElementById('bg-frame-outline')?.setAttribute('viewBox', `0 0 ${w} ${h}`);

      // The two notch patches share the exact same flat-width math the
      // outline above just used — see notchPatchPath's own comment for why
      // patch-space and panel-space have to trace the identical curve.
      const tl = notchTLRef.current;
      if (tl) {
        tl.style.width = `${flatTL + FRAME_INSET}px`;
        tl.style.clipPath = `path("${notchPatchPath(flatTL, 'tl')}")`;
      }
      // .navbar-menu (Navbar.tsx, not a descendant of #home) reads this to
      // sit right after the tl notch's flap instead of at a fixed offset —
      // set on :root, same pattern as --nav-h, since a custom property only
      // inherits down the DOM tree and #main-header is #home's sibling, not
      // its descendant.
      document.documentElement.style.setProperty('--notch-tl-flat', `${flatTL}px`);
      const br = notchBRRef.current;
      if (br) {
        br.style.width = `${flatBR + FRAME_INSET}px`;
        br.style.clipPath = `path("${notchPatchPath(flatBR, 'br')}")`;
      }
    };
    sync();
    // Deliberately the ONLY trigger for re-measuring .navbar-brand/.hero-ask:
    // each notch's flat width locks in at whatever it measured on this first
    // sync() and stays there — through scrolling, webfont swaps, the ask-
    // strip's pill rotation, anything — and only moves again when the
    // viewport itself is resized (heroEl's own box changing size). Earlier
    // versions also re-synced on ResizeObserver-for-content, fonts.ready, and
    // #main-header's `.scrolled` class (to chase the notch to content that
    // could change size after mount), but each of those was its own source
    // of a mismeasurement mid-transition/mid-load that then froze in as a
    // visibly wrong notch — see this file's git history for the specific
    // failures. A width fixed at first paint, touched only by real resize,
    // has no such window to get caught in.
    const ro = new ResizeObserver(sync);
    ro.observe(heroEl);
    return () => { ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, heroEl]);

  useEffect(() => {
    // Mobile: jpg-only background, no beams canvas — nothing here to set up.
    if (isMobile) return;

    let cancelled = false;
    let cleanupFn: (() => void) | null = null;

    // Scroll-driven spline→beams crossfade starts tracking from mount —
    // independent of doHeavyInit below (which only creates the WebGL
    // renderer). The gradient frame/notches are now #home's own background
    // plus small patches nested inside it (see portfolio.css), so they need
    // no JS opacity fade any more — they simply exist exactly where #home's
    // box does, same as its text/buttons. Only the spline→beams handoff
    // (this component's own canvas fading in as the hero's spline scene
    // fades out) and #bg-scene's unclip (the beams canvas's box, still
    // fixed, going full-bleed once scrolled) still need JS.
    let ticking = false;

    function updateBg() {
      const heroEl = document.getElementById('home');
      if (!heroEl) return;
      const heroH = heroEl.offsetHeight || window.innerHeight;
      const fadeStart = heroH * 0.45;
      const fadeEnd = heroH * 0.85;
      const p = Math.max(0, Math.min(1, (window.scrollY - fadeStart) / (fadeEnd - fadeStart)));
      // Looked up fresh each call (rather than cached once) since the
      // element gets unmounted/remounted by the splineBgMounted toggle below.
      const splineEl = document.getElementById('spline-bg');
      if (splineEl) (splineEl as HTMLElement).style.opacity = (1 - p).toFixed(3);
      const canvas = canvasRef.current;
      if (canvas) canvas.style.opacity = p.toFixed(3);
      beamsActiveRef.current = p > 0.02;

      // #bg-scene (the fixed beams canvas box) can't wait for the p curve
      // above to finish unclipping: #home's gradient/spline/notches are
      // ordinary content now, confined to #home's own box, so they
      // physically end exactly where #home ends. #bg-scene has to go
      // full-bleed at the same moment #home starts scrolling away — not
      // stay boxed into its small inset/rounded shape — or there's a gap
      // between #home's real bottom edge and wherever #bg-scene's still-
      // clipped backdrop happens to be. Tied to window.scrollY (not p) for
      // that reason: unclipping is about whether we've started scrolling at
      // all, not how far through the spline→beams crossfade we are.
      // Overriding inset/borderRadius/overflow inline (not clip-path — see
      // the overflow:hidden comment in portfolio.css for why) beats the
      // desktop media query's own values; clearing the inline values (empty
      // string) falls back to those CSS values again.
      const sceneEl = document.getElementById('bg-scene');
      if (sceneEl) {
        const scrolled = window.scrollY > 0;
        sceneEl.style.inset = scrolled ? '0' : '';
        sceneEl.style.borderRadius = scrolled ? '0' : '';
        sceneEl.style.overflow = scrolled ? 'visible' : '';
      }

      const shouldMount = p < 1;
      if (shouldMount !== splineBgMountedRef.current) {
        splineBgMountedRef.current = shouldMount;
        setSplineBgMounted(shouldMount);
      }
    }

    const onScroll = () => {
      if (!ticking) { requestAnimationFrame(() => { updateBg(); ticking = false; }); ticking = true; }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    requestAnimationFrame(updateBg);

    function scheduleInit(cb: () => void) {
      if ('requestIdleCallback' in window) (window as any).requestIdleCallback(cb, { timeout: 2500 });
      else window.addEventListener('load', () => setTimeout(cb, 800), { once: true });
    }

    function doHeavyInit() {
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      function extendMaterial(BaseMaterial: any, cfg: any) {
        const physical = THREE.ShaderLib.physical;
        const uniforms = THREE.UniformsUtils.clone(physical.uniforms);
        const defaults = new BaseMaterial(cfg.material || {});
        if (defaults.color) uniforms.diffuse.value = defaults.color.clone();
        if ('roughness' in defaults) uniforms.roughness.value = defaults.roughness;
        if ('metalness' in defaults) uniforms.metalness.value = defaults.metalness;
        if ('envMapIntensity' in defaults) uniforms.envMapIntensity.value = defaults.envMapIntensity;
        Object.entries(cfg.uniforms ?? {}).forEach(([k, u]: [string, any]) => {
          uniforms[k] = (u !== null && typeof u === 'object' && 'value' in u) ? u : { value: u };
        });
        let vert = `${cfg.header}\n${cfg.vertexHeader ?? ''}\n${physical.vertexShader}`;
        let frag = `${cfg.header}\n${cfg.fragmentHeader ?? ''}\n${physical.fragmentShader}`;
        for (const [inc, code] of Object.entries(cfg.vertex ?? {})) vert = vert.replace(inc as string, `${inc}\n${code}`);
        for (const [inc, code] of Object.entries(cfg.fragment ?? {})) frag = frag.replace(inc as string, `${inc}\n${code}`);
        return new THREE.ShaderMaterial({
          defines: { ...(physical.defines ?? {}) },
          uniforms, vertexShader: vert, fragmentShader: frag,
          lights: true, fog: !!cfg.material?.fog,
        });
      }

      function createBeamGeometry(n: number, width: number, height: number, heightSegments: number) {
        const geo = new THREE.BufferGeometry();
        const spacing = 0;
        const nV = n * (heightSegments + 1) * 2;
        const nF = n * heightSegments * 2;
        const pos = new Float32Array(nV * 3);
        const idx = new Uint32Array(nF * 3);
        const uvs = new Float32Array(nV * 2);
        let vi = 0, ii = 0, ui = 0;
        const totalW = n * width + (n - 1) * spacing;
        const xBase = -totalW / 2;
        for (let i = 0; i < n; i++) {
          const xOff = xBase + i * (width + spacing);
          const uvXOff = Math.random() * 300;
          const uvYOff = Math.random() * 300;
          for (let j = 0; j <= heightSegments; j++) {
            const y = height * (j / heightSegments - 0.5);
            pos.set([xOff, y, 0, xOff + width, y, 0], vi * 3);
            const uvY = j / heightSegments;
            uvs.set([uvXOff, uvY + uvYOff, uvXOff + 1, uvY + uvYOff], ui);
            if (j < heightSegments) {
              const a = vi, b = vi + 1, c = vi + 2, d = vi + 3;
              idx.set([a, b, c, c, b, d], ii); ii += 6;
            }
            vi += 2; ui += 4;
          }
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geo.setIndex(new THREE.BufferAttribute(idx, 1));
        geo.computeVertexNormals();
        return geo;
      }

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#000000');

      const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 0, 20);

      const beamMaterial = extendMaterial(THREE.MeshStandardMaterial, {
        header: `
varying vec3  vEye;
varying float vNoise;
varying vec2  vUv;
varying vec3  vPosition;
uniform float time;
uniform float uSpeed;
uniform float uNoiseIntensity;
uniform float uScale;
${NOISE_GLSL}`,
        vertexHeader: `
float getPos(vec3 pos) {
  vec3 noisePos = vec3(pos.x * 0., pos.y - uv.y, pos.z + time * uSpeed * 3.) * uScale;
  return cnoise(noisePos);
}
vec3 getCurrentPos(vec3 pos) { vec3 np = pos; np.z += getPos(pos); return np; }
vec3 getNormal(vec3 pos) {
  vec3 curpos   = getCurrentPos(pos);
  vec3 nextposX = getCurrentPos(pos + vec3(0.01, 0.0,  0.0));
  vec3 nextposZ = getCurrentPos(pos + vec3(0.0,  -0.01, 0.0));
  vec3 tangentX = normalize(nextposX - curpos);
  vec3 tangentZ = normalize(nextposZ - curpos);
  return normalize(cross(tangentZ, tangentX));
}`,
        fragmentHeader: '',
        vertex: {
          '#include <begin_vertex>': `transformed.z += getPos(transformed.xyz);`,
          '#include <beginnormal_vertex>': `objectNormal = getNormal(position.xyz);`,
        },
        fragment: {
          '#include <dithering_fragment>': `
float randomNoise = noise(gl_FragCoord.xy);
gl_FragColor.rgb -= randomNoise / 15. * uNoiseIntensity;`,
        },
        material: { fog: false },
        uniforms: {
          diffuse: { value: new THREE.Color(...hexToRGB01('#000000')) },
          time: { value: 0 },
          roughness: { value: 0.3 },
          metalness: { value: 0.3 },
          uSpeed: { value: SPEED },
          envMapIntensity: { value: 10 },
          uNoiseIntensity: { value: NOISE_INTENSITY },
          uScale: { value: SCALE },
        },
      });

      const beamMesh = new THREE.Mesh(createBeamGeometry(BEAM_NUMBER, BEAM_WIDTH, BEAM_HEIGHT, 100), beamMaterial);

      const group = new THREE.Group();
      group.rotation.z = THREE.MathUtils.degToRad(ROTATION);
      group.add(beamMesh);

      const dirLight = new THREE.DirectionalLight(LIGHT_COLOR, 1);
      dirLight.position.set(0, 3, 10);
      dirLight.castShadow = true;
      dirLight.shadow.camera.top = 24;
      dirLight.shadow.camera.bottom = -24;
      dirLight.shadow.camera.left = -24;
      dirLight.shadow.camera.right = 24;
      dirLight.shadow.camera.far = 64;
      dirLight.shadow.bias = -0.004;
      group.add(dirLight);

      scene.add(group);
      scene.add(new THREE.AmbientLight(0xffffff, 1));

      const clock = new THREE.Clock();
      let raf = 0;

      (function animate() {
        raf = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (cancelled || !beamsActiveRef.current) return;
        beamMaterial.uniforms.time.value += 0.1 * delta;
        renderer.render(scene, camera);
      })();

      const onResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (!w || !h) return; // guard against a transient zero-size viewport during resize
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize, { passive: true });

      cleanupFn = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        beamMaterial.dispose();
        beamMesh.geometry.dispose();
      };
    }

    // Creating the WebGLRenderer here (not on mount) matters: the hero
    // figure's own Spline scene is already a live WebGL context for as long
    // as a visitor sits reading the hero, so spinning up a second, idle one
    // immediately on mount doubled the concurrent GPU context count for
    // that (most common, longest) idle window — reproduced live against
    // production 2026-08-21: sitting untouched at scrollY 0 alone triggered
    // repeated Spline context-loss/rebuild cycles, ending in a runaway
    // "Framebuffer incomplete: zero size" error storm (1000+ messages) that
    // pegs the renderer and reads as the page being frozen/unable to
    // scroll. Deferring init to first scroll keeps only one context alive
    // during that window — see homepage-webgl-stability memory.
    let initStarted = false;
    function initBeams() {
      if (initStarted) return;
      initStarted = true;
      scheduleInit(doHeavyInit);
    }

    if (window.scrollY > 0) {
      initBeams();
    } else {
      window.addEventListener('scroll', initBeams, { passive: true, once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', initBeams);
      if (cleanupFn) cleanupFn();
    };
  }, [isMobile]);

  // Desktop-only hero-frame pieces (spline scene + its two notches) — see
  // the heroEl comment above for why these are portaled into #home rather
  // than rendered in place: #home is now the gradient (its own CSS
  // background — see portfolio.css) and these need to sit inside that same
  // box for their inset/position math to resolve against #home's real size.
  // Mobile has no notch/frame look at all (gated by isMobile here, not a
  // CSS media query, since the DOM structure itself differs — mobile's
  // #bg-spline-scene, rendered further down, stays a plain top-level fixed
  // full-bleed layer with an <img> fallback, unrelated to #home).
  const heroFrame = !isMobile && heroEl && createPortal(
    <>
      <div id="bg-spline-scene" aria-hidden="true" role="presentation">
        {splineBgMounted && <spline-viewer id="spline-bg" url="./models/bg_scene.splinecode" />}
      </div>
      {/* The notch cut into the frame for the logo (top-left) and its
          180°-symmetric twin (bottom-right, over the chat FAB) — see the
          #bg-notch-tl/#bg-notch-br comment in portfolio.css for where
          these exact numbers come from. Pure fill: they re-paint #home's
          gradient over the panel's two corners, and nothing else. The
          border/glow along the seam they create belongs to the outline
          below, which is why these must come first in DOM order — same
          z-index, so the outline paints over them. */}
      <div id="bg-notch-tl" ref={notchTLRef} aria-hidden="true" role="presentation" />
      <div id="bg-notch-br" ref={notchBRRef} aria-hidden="true" role="presentation" />
      {/* The panel's border + glow, as a stroke along its real outline —
          see heroFramePath.ts. All three paths share one `d`, written by
          the ResizeObserver effect above. */}
      <svg id="bg-frame-outline" aria-hidden="true" role="presentation">
        <defs>
          <clipPath id="bg-frame-clip">
            <path ref={framePathRefs[2]} />
          </clipPath>
        </defs>
        {/* Stands in for #chat-fab's `inset 0 0 15px rgba(255,255,255,.1)`:
            a stroke straddles the edge, so clipping it to the panel keeps
            only the inner half — an inward-facing rim light. */}
        <g clipPath="url(#bg-frame-clip)">
          <path ref={framePathRefs[1]} className="bg-frame-rim" fill="none" />
        </g>
        <path ref={framePathRefs[0]} className="bg-frame-stroke" fill="none" />
      </svg>
    </>,
    heroEl,
  );

  return (
    <>
      <div id="bg-scene" aria-hidden="true" role="presentation">
        {!isMobile && (
          <canvas
            ref={canvasRef}
            id="beams-bg"
            aria-hidden="true"
            role="presentation"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100dvh', zIndex: -1, opacity: 0, pointerEvents: 'none' }}
          />
        )}
      </div>
      {isMobile && (
        <div id="bg-spline-scene" aria-hidden="true" role="presentation">
          {splineBgMounted && (
            <picture>
              <source srcSet="./img/bg.webp" type="image/webp" />
              <img id="spline-bg" src="./img/bg.jpg" alt="" aria-hidden="true" />
            </picture>
          )}
        </div>
      )}
      {heroFrame}
    </>
  );
}
