import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ── Constants (matches the original <Beams /> usage example) ────────────────
const BEAM_WIDTH = 2.6;
const BEAM_HEIGHT = 15;
const BEAM_NUMBER = 14;
const LIGHT_COLOR = '#4A00E0';
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
  // The decorative background Spline scene (desktop/tablet — see
  // useStaticBg below) gets fully unmounted (not just faded to opacity 0)
  // once scrolled past the hero — see updateBg() below. Running it
  // continuously for the rest of the page, on top of this canvas's Three.js
  // renderer, was sustained concurrent WebGL load that correlated with
  // intermittent tab crashes; the hero's own Spline figure stays
  // desktop-only (see HeroSection) to keep mobile down to just this
  // background scene plus the beams canvas — two contexts instead of three.
  const [splineBgMounted, setSplineBgMounted] = useState(true);
  const splineBgMountedRef = useRef(splineBgMounted);
  splineBgMountedRef.current = splineBgMounted;

  // Below HeroSection's own Spline breakpoint (see HERO_FIGURE_BREAKPOINT in
  // Loader.tsx), swap this WebGL background scene for a plain jpg AND skip
  // the beams canvas's own Three.js renderer entirely (see the early return
  // below) — that drops mobile to zero WebGL contexts instead of one or two,
  // removing this scene's share of the crash risk noted above entirely
  // there instead of merely reducing it. Checked once on mount, matching the
  // same one-shot (no resize listener) convention HeroSection uses for its
  // own figure.
  const [useStaticBg] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    // Mobile: jpg-only background, no beams canvas — nothing here to set up.
    if (useStaticBg) return;

    let cancelled = false;
    let cleanupFn: (() => void) | null = null;

    function scheduleInit(cb: () => void) {
      if ('requestIdleCallback' in window) (window as any).requestIdleCallback(cb, { timeout: 2500 });
      else window.addEventListener('load', () => setTimeout(cb, 800), { once: true });
    }

    scheduleInit(() => {
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
      let beamsActive = false;
      let raf = 0;

      (function animate() {
        raf = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (cancelled || !beamsActive) return;
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
        canvas.style.opacity = p.toFixed(3);
        beamsActive = p > 0.02;

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

      cleanupFn = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('scroll', onScroll);
        renderer.dispose();
        beamMaterial.dispose();
        beamMesh.geometry.dispose();
      };
    });

    return () => {
      cancelled = true;
      if (cleanupFn) cleanupFn();
    };
  }, [useStaticBg]);

  return (
    <>
      {!useStaticBg && (
        <canvas
          ref={canvasRef}
          id="beams-bg"
          aria-hidden="true"
          role="presentation"
          style={{ position: 'fixed', inset: 0, width: '100%', height: '100dvh', zIndex: -1, opacity: 0, pointerEvents: 'none' }}
        />
      )}
      {splineBgMounted && (
        useStaticBg
          ? (
            <picture>
              <source srcSet="./img/bg.webp" type="image/webp" />
              <img id="spline-bg" src="./img/bg.jpg" alt="" aria-hidden="true" />
            </picture>
          )
          : <spline-viewer id="spline-bg" url="./models/bg_scene.splinecode" />
      )}
    </>
  );
}
