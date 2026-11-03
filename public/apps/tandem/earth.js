import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { init as initTopdown, update as updateTopdown, T as TD, CLIMB, climbAlt, serviceStops } from './topdown.js';
import { initClouds, updateClouds, CURTAIN } from './clouds.js';

// Standalone planet: Earth rising from the bottom centre of the screen and spinning.

const canvas = document.getElementById('earth');
const loaderEl = document.getElementById('loader');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let ready = false;

const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- renderer

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 200);

// Sky: black at the top, easing into a faint deep blue behind the planet.
{
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(512, 1024, 0, 512, 1024, 1100);
  grad.addColorStop(0, '#0a1a38');
  grad.addColorStop(0.4, '#030812');
  grad.addColorStop(0.75, '#000');
  g.fillStyle = grad; g.fillRect(0, 0, 1024, 1024);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  scene.background = t;
}

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.55, 1.0);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// The sun sits off to the left and slightly in front, so the day side faces us
// and the terminator (with city lights beyond it) runs across the right.
const sunDir = new THREE.Vector3(-1.0, 0.42, 0.38).normalize();

// ---------------------------------------------------------------- textures

const big = renderer.capabilities.maxTextureSize >= 8192 && Math.min(screen.width, screen.height) > 700;
const manager = new THREE.LoadingManager();
manager.onProgress = (_, loaded, total) => loaderEl.style.setProperty('--p', loaded / total);
manager.onLoad = () => { loaderEl.classList.add('done'); ready = true; };

const loader = new THREE.TextureLoader(manager);
const maxAniso = renderer.capabilities.getMaxAnisotropy();
function tex(name, srgb) {
  const t = loader.load(`assets/earth/${name}`);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = maxAniso;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}
const maps = {
  day: tex(big ? 'day.jpg' : 'day-4k.jpg', true),
  night: tex(big ? 'night.jpg' : 'night-4k.jpg', true),
  normal: tex(big ? 'normal.jpg' : 'normal-4k.jpg', false),
  spec: tex('specular-4k.jpg', false),
  clouds: tex('clouds-4k.jpg', false),
};

// ---------------------------------------------------------------- shaders

// Shared GLSL: uv from object-space position (matches SphereGeometry's mapping),
// with gradients picked from whichever side of the date line is continuous so
// there's no mip seam down the Pacific.
// shared by every fragment shader: one bad pixel (NaN or inf) would otherwise be smeared
// by the bloom pass into a flickering black square
const safe = /* glsl */`
  float sq(float x) { return x * x; }
  vec3 finite(vec3 c) {
    bool ok = c.r == c.r && c.g == c.g && c.b == c.b && all(lessThan(abs(c), vec3(1e4)));
    return ok ? max(c, 0.0) : vec3(0.0);
  }
`;

const common = /* glsl */`
  ${safe}
  #define PI 3.141592653589793
  vec2 sphUv(vec3 p) {
    p = normalize(p);
    return vec2(fract(atan(p.z, -p.x) / (2.0 * PI)), 1.0 - acos(clamp(p.y, -1.0, 1.0)) / PI);
  }
  void seamGrad(vec2 uv, out vec2 dx, out vec2 dy) {
    dx = dFdx(uv); dy = dFdy(uv);
    vec2 uv2 = vec2(fract(uv.x + 0.5), uv.y);
    vec2 dx2 = dFdx(uv2), dy2 = dFdy(uv2);
    if (dot(dx, dx) + dot(dy, dy) > dot(dx2, dx2) + dot(dy2, dy2)) { dx = dx2; dy = dy2; }
  }
  vec3 rotYInv(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
  }
`;

const sphereVert = /* glsl */`
  varying vec3 vObj;
  varying vec3 vWPos;
  varying vec3 vWNormal;
  varying vec3 vWTangent;
  void main() {
    vObj = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWPos = wp.xyz;
    vWNormal = normalize(mat3(modelMatrix) * normal);
    // east-pointing tangent, used to orient the terrain normal map
    vec3 east = cross(vec3(0.0, 1.0, 0.0), normalize(position));
    vWTangent = mat3(modelMatrix) * (length(east) > 1e-4 ? normalize(east) : vec3(1.0, 0.0, 0.0));
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const earthMat = new THREE.ShaderMaterial({
  uniforms: {
    dayMap: { value: maps.day },
    nightMap: { value: maps.night },
    normalMap: { value: maps.normal },
    specMap: { value: maps.spec },
    cloudMap: { value: maps.clouds },
    sunDir: { value: sunDir },
    cloudRot: { value: 0 },
    normalScale: { value: 0.9 },
    lightsScale: { value: 1 },
    dusk: { value: 0 },
    glintScale: { value: 1 },
  },
  vertexShader: sphereVert,
  fragmentShader: /* glsl */`
    ${common}
    uniform sampler2D dayMap, nightMap, normalMap, specMap, cloudMap;
    uniform vec3 sunDir;
    uniform float cloudRot, normalScale, lightsScale, dusk, glintScale;
    varying vec3 vObj, vWPos, vWNormal, vWTangent;

    void main() {
      vec3 n0 = normalize(vWNormal);
      vec3 V = normalize(cameraPosition - vWPos);
      vec2 uv = sphUv(vObj); vec2 dx, dy; seamGrad(uv, dx, dy);

      vec3 day = textureGrad(dayMap, uv, dx, dy).rgb;
      vec3 night = textureGrad(nightMap, uv, dx, dy).rgb;
      float water = textureGrad(specMap, uv, dx, dy).r;
      vec3 nm = textureGrad(normalMap, uv, dx, dy).xyz * 2.0 - 1.0;

      vec3 T = normalize(vWTangent);
      vec3 B = cross(n0, T);
      vec3 N = normalize(T * nm.x * normalScale + B * nm.y * normalScale + n0 * nm.z);

      vec2 cuv = sphUv(rotYInv(vObj, cloudRot)); vec2 cdx, cdy; seamGrad(cuv, cdx, cdy);
      float cloud = smoothstep(0.1, 0.9, textureGrad(cloudMap, cuv, cdx, cdy).r);

      float cosGeo = dot(n0, sunDir);
      float cosN = dot(N, sunDir);
      float dayAmt = smoothstep(-0.10, 0.20, cosGeo);
      float shadow = 1.0 - 0.45 * cloud;

      // sunlight on land and sea
      vec3 col = day * clamp(cosN, 0.0, 1.0) * shadow * 1.9;
      // warm band along the terminator
      col += day * vec3(1.0, 0.42, 0.16) * exp(-sq(cosGeo / 0.09)) * 0.35 * (1.0 - 0.85 * dusk);

      // city lights, dimmed where clouds cover them
      float lightsAmt = pow(1.0 - dayAmt, 1.6) * (1.0 - 0.65 * cloud);
      col += night * vec3(1.0, 0.86, 0.66) * lightsAmt * 2.2 * lightsScale;

      // sun glint on open water
      vec3 H = (sunDir + V) / max(length(sunDir + V), 1e-5);
      float nh = max(dot(n0, H), 0.0);
      float glint = (pow(nh, 300.0) * 1.4 + pow(nh, 45.0) * 0.1) * glintScale;
      col += water * glint * vec3(1.0, 0.93, 0.8) * smoothstep(0.0, 0.12, cosGeo) * shadow;

      // at dusk, close to the ground, the land falls into shadow like the road clip
      col *= mix(1.0, 0.3, dusk);

      // atmosphere: blue haze over the lit disc, thickening toward the limb
      vec3 atmo = mix(vec3(0.30, 0.56, 1.0), vec3(1.0, 0.5, 0.22) * 0.6, dusk);
      float fres = pow(1.0 - max(dot(n0, V), 0.0), 2.4);
      float lit = smoothstep(-0.25, 0.55, cosGeo);
      col += atmo * 0.045 * lit;
      col = mix(col, atmo * 0.9 * lit + vec3(1.0, 0.4, 0.15) * 0.15 * exp(-sq(cosGeo / 0.15)), fres * 0.8 * (1.0 - 0.5 * dusk));

      // a whisper of noise so the deep-ocean gradients don't band
      col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
      gl_FragColor = vec4(finite(col), 1.0);
    }
  `,
});

const cloudMat = new THREE.ShaderMaterial({
  uniforms: {
    cloudMap: { value: maps.clouds },
    sunDir: { value: sunDir },
    opacity: { value: 1 },
  },
  vertexShader: sphereVert,
  fragmentShader: /* glsl */`
    ${common}
    uniform sampler2D cloudMap;
    uniform vec3 sunDir;
    uniform float opacity;
    varying vec3 vObj, vWPos, vWNormal, vWTangent;
    void main() {
      vec3 n0 = normalize(vWNormal);
      vec3 V = normalize(cameraPosition - vWPos);
      vec2 uv = sphUv(vObj); vec2 dx, dy; seamGrad(uv, dx, dy);
      float c = smoothstep(0.08, 0.95, textureGrad(cloudMap, uv, dx, dy).r);
      float cosGeo = dot(n0, sunDir);
      float lit = clamp(cosGeo * 1.15 + 0.05, 0.0, 1.0);
      vec3 col = mix(vec3(0.012, 0.015, 0.022), vec3(1.0, 0.985, 0.96) * 0.95, lit);
      col += vec3(1.0, 0.45, 0.18) * exp(-sq(cosGeo / 0.1)) * 0.3;
      float fres = pow(1.0 - max(dot(n0, V), 0.0), 2.4);
      col = mix(col, vec3(0.42, 0.65, 1.0) * lit, fres * 0.55);
      gl_FragColor = vec4(finite(col), c * opacity);
    }
  `,
  transparent: true,
  depthWrite: false,
});

const ATMO_R = 1.035;
const atmoMat = new THREE.ShaderMaterial({
  uniforms: {
    sunDir: { value: sunDir },
    center: { value: new THREE.Vector3() },
    atmoR: { value: ATMO_R },
    dusk: { value: 0 },
  },
  vertexShader: sphereVert,
  fragmentShader: /* glsl */`
    ${safe}
    uniform vec3 sunDir, center;
    uniform float atmoR, dusk;
    varying vec3 vWPos;
    void main() {
      // How close does this view ray pass to the planet? Glow is densest right at the surface.
      vec3 rd = normalize(vWPos - cameraPosition);
      vec3 closest = cameraPosition + rd * dot(center - cameraPosition, rd);
      float h = length(closest - center);
      float t = clamp((h - 1.0) / (atmoR - 1.0), 0.0, 1.0);
      float glow = pow(1.0 - t, 2.2) * (1.0 - t);
      float s = dot(closest - center, sunDir) / max(h, 1e-5);
      float sunAmt = smoothstep(-0.38, 0.4, s);
      vec3 col = mix(vec3(1.0, 0.42, 0.14), vec3(0.32, 0.6, 1.0), smoothstep(-0.05, 0.35, s));
      col = mix(col, vec3(1.0, 0.45, 0.16), dusk * 0.85);
      gl_FragColor = vec4(finite(col * glow * sunAmt * mix(2.4, 1.3, dusk)), 1.0);
    }
  `,
  side: THREE.BackSide,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

// ---------------------------------------------------------------- planet

const earth = new THREE.Group();
earth.rotation.order = 'ZXY'; // spin about the axis, lean toward camera, then axial tilt
scene.add(earth);

const sphereGeo = new THREE.SphereGeometry(1, 256, 128);
earth.add(new THREE.Mesh(sphereGeo, earthMat));
const clouds = new THREE.Mesh(sphereGeo, cloudMat);
clouds.scale.setScalar(1.006);
clouds.renderOrder = 2;
earth.add(clouds);
const atmo = new THREE.Mesh(sphereGeo, atmoMat);
atmo.scale.setScalar(ATMO_R);
atmo.renderOrder = 3;
scene.add(atmo);

// ---------------------------------------------------------------- stars

// A sparse scatter laid out across the screen itself (not the 3D sky), so the
// count stays exactly as calm as we want. Drawn at the far plane, so the planet covers them.
const STARS = 170;
const starMat = new THREE.ShaderMaterial({
  uniforms: { dpr: { value: renderer.getPixelRatio() }, time: { value: 0 }, fade: { value: 0 } },
  vertexShader: /* glsl */`
    attribute float size; attribute float phase; attribute vec3 tint;
    uniform float dpr, time; varying vec3 vTint; varying float vB;
    void main() {
      vTint = tint;
      float tw = 0.72 + 0.28 * sin(time * (0.4 + phase * 0.9) + phase * 40.0);
      vB = (0.18 + size * 0.28) * tw;
      gl_Position = vec4(position.xy, 0.99999, 1.0);
      gl_PointSize = size * dpr;
    }`,
  fragmentShader: /* glsl */`
    uniform float fade; varying vec3 vTint; varying float vB;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      gl_FragColor = vec4(vTint * smoothstep(0.5, 0.0, d) * vB * fade, 1.0);
    }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
{
  const pos = new Float32Array(STARS * 3), size = new Float32Array(STARS), phase = new Float32Array(STARS), tint = new Float32Array(STARS * 3);
  for (let i = 0; i < STARS; i++) {
    pos.set([Math.random() * 2 - 1, Math.random() * 2 - 1, 0], i * 3);
    const bright = Math.random() < 0.06; // a handful stand out
    size[i] = bright ? 2.4 + Math.random() * 0.8 : 0.8 + Math.pow(Math.random(), 2) * 1.2;
    phase[i] = Math.random();
    const warm = Math.random();
    tint.set(warm < 0.15 ? [1, 0.86, 0.72] : warm > 0.8 ? [0.78, 0.86, 1] : [1, 1, 1], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('size', new THREE.BufferAttribute(size, 1));
  g.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
  g.setAttribute('tint', new THREE.BufferAttribute(tint, 3));
  const stars = new THREE.Points(g, starMat);
  stars.frustumCulled = false;
  stars.renderOrder = -1;
  scene.add(stars);
}

// ---------------------------------------------------------------- aurora

// Northern lights seen from orbit: a green ribbon hugging the horizon with rays
// rising into violet. Drawn on a full-screen layer just in front of the stars,
// so the planet hides anything that falls behind it. It comes and goes.
const auroraMat = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 }, dpr: { value: renderer.getPixelRatio() },
    center: { value: new THREE.Vector2() }, radius: { value: 1 },
    activity: { value: 0 }, focus: { value: 0 }, spread: { value: 0.5 },
  },
  vertexShader: /* glsl */`void main() { gl_Position = vec4(position.xy, 0.99998, 1.0); }`,
  fragmentShader: /* glsl */`
    ${safe}
    uniform float time, dpr, radius, activity, focus, spread;
    uniform vec2 center;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

    void main() {
      if (activity < 0.001) discard;
      vec2 d = gl_FragCoord.xy / dpr - center;
      float h = (length(d) - radius) / radius;          // height above the horizon, in planet radii
      if (h < -0.004 || h > 0.2) discard;
      float ang = atan(d.x, d.y);                        // 0 at the crest
      float arc = ang * 6.0;

      // where along the horizon it's glowing, drifting slowly sideways
      float region = exp(-sq((ang - focus) / spread));
      region *= smoothstep(0.12, 0.55, fbm(vec2(arc * 0.35 - time * 0.03, 3.1)));

      // the ribbon's lower edge wanders up and down like a hanging curtain
      float base = 0.016 + 0.026 * fbm(vec2(arc * 0.9 + time * 0.025, time * 0.04));
      float y = h - base;
      float edge = y < 0.0 ? exp(-sq(y / 0.0035)) : exp(-y / 0.055);

      // fine vertical rays that shimmer
      float rays = fbm(vec2(arc * 14.0 + time * 0.15, time * 0.35));
      rays = 0.35 + 1.3 * pow(rays, 2.2);
      float fold = 0.55 + 0.45 * sin(arc * 3.0 + fbm(vec2(arc * 2.0, time * 0.1)) * 6.0 - time * 0.2);

      vec3 green = vec3(0.22, 1.0, 0.55);
      vec3 violet = vec3(0.62, 0.28, 1.0);
      vec3 col = mix(green, violet, smoothstep(0.012, 0.075, y));
      col = mix(col, vec3(0.75, 1.0, 0.85), exp(-sq(y / 0.004)) * 0.5); // bright lower hem

      float a = edge * rays * fold * region * activity * smoothstep(0.2, 0.09, h);
      gl_FragColor = vec4(finite(col * a * 1.35), 1.0);
    }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
{
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), auroraMat);
  quad.frustumCulled = false;
  quad.renderOrder = 0;
  scene.add(quad);
}

// Displays: the first arrives shortly after the planet settles, then one every 20–45s.
const aurora = { next: 6, start: -1, len: 0 };
function updateAurora(t) {
  if (aurora.start < 0 && t >= aurora.next) {
    aurora.start = t;
    aurora.len = 14 + Math.random() * 10;
    auroraMat.uniforms.focus.value = (Math.random() * 2 - 1) * 0.45;
    auroraMat.uniforms.spread.value = 0.35 + Math.random() * 0.3;
  }
  let act = 0;
  if (aurora.start >= 0) {
    const k = (t - aurora.start) / aurora.len;
    act = Math.sin(Math.PI * Math.min(Math.max(k, 0), 1)) ** 1.5;
    auroraMat.uniforms.focus.value += 0.0006; // slow drift along the horizon
    if (k >= 1) { aurora.start = -1; aurora.next = t + 20 + Math.random() * 25; }
  }
  auroraMat.uniforms.activity.value = act;
}

// ---------------------------------------------------------------- layout

// The camera is a rig around a planet at the origin, described by three things:
// how far away it is, its lens, and where on screen the horizon (the planet's
// top edge) should sit. Pitch is solved from those, so the horizon lands
// exactly where we ask, from the orbit view all the way down to the road.
const video = document.getElementById('road');
const VIDEO_HORIZON = 0.545;   // horizon height in the road clip, as a fraction of its frame
const ORBIT_FOV = 20, ROAD_FOV = 38;
let W = 1, H = 1, orbitAlt = 4, crest = 0.62, roadHorizon = 0.55;

function resize() {
  W = innerWidth; H = innerHeight;
  renderer.setSize(W, H, false);
  composer.setSize(W, H);
  bloom.resolution.set(W, H);
  camera.aspect = W / H;

  // orbit view: a dome a little wider than the screen, crest just past the middle
  const radiusPx = Math.max(W * 0.62, H * 0.5);
  crest = W < 900 ? 0.64 : 0.62;
  document.documentElement.style.setProperty('--crest', crest * H + 'px');
  const k = (H / 2) / (Math.tan(ORBIT_FOV / 2 * DEG) * radiusPx);
  orbitAlt = Math.sqrt(1 + k * k) - 1;

  // where the clip's horizon lands once it's scaled to cover the screen
  const vw = video.videoWidth || 16, vh = video.videoHeight || 9;
  const dispH = vh * Math.max(W / vw, H / vh);
  roadHorizon = (H / 2 + (VIDEO_HORIZON - 0.5) * dispH) / H;
}
addEventListener('resize', resize);
video.addEventListener('loadedmetadata', resize);
resize();

function rig(alt, fov, horizonFrac) {
  const D = 1 + alt;
  const halfV = fov / 2 * DEG;
  const pitch = Math.asin(1 / D) + Math.atan((horizonFrac - 0.5) * 2 * Math.tan(halfV));
  camera.fov = fov;
  camera.position.set(0, 0, D);
  camera.up.set(0, 1, 0);
  camera.lookAt(0, Math.sin(pitch), D - Math.cos(pitch));
  camera.updateProjectionMatrix();
  return D;
}

// ---------------------------------------------------------------- scroll

const track = document.querySelector('.scroll-track');
const hero = document.querySelector('.hero');
const cue = document.querySelector('.cue');
const finale = document.querySelector('.finale');
const endCta = document.querySelector('.end-cta');
const END_LINE = 0.5;   // where the closing line's top sits on screen when the planet settles
const shade = document.querySelector('.shade');
// Always start the story from the top: a reload shouldn't drop you mid-scene.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);
addEventListener('pageshow', () => scrollTo(0, 0));

// Scroll is measured in screen-heights (S). The opening act (orbit → road → truck)
// was laid out as a 0–1 progress over its first 5.4 screens; P keeps those timings.
const OPENING = 5.4;
let scrollS = 0, S = 0;
// Each time we scroll down into the metrics, hold the page there while they play, then let go.
// It re-arms only once we're back up at the Earth, so a small flick while scrolling back up can't catch the page.
const HOLD = { at: 4.72, rest: 4.85, ms: 2700 };
// Scroll is read against 100vh, not innerHeight: on iPhones the toolbar sliding back in shrinks
// innerHeight mid-scroll, which made scrolling up look like scrolling down and set off the hold.
const vhProbe = document.createElement('div');
vhProbe.style.cssText = 'position:absolute;top:0;left:0;width:0;height:100vh;visibility:hidden;pointer-events:none';
document.body.appendChild(vhProbe);
let VH = vhProbe.offsetHeight || innerHeight;
addEventListener('resize', () => { VH = vhProbe.offsetHeight || innerHeight; });
let holding = false, held = false;
const stopScroll = e => e.preventDefault();
const stopKeys = e => { if ([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) e.preventDefault(); };
function hold() {
  holding = held = true;
  document.documentElement.style.overflow = 'hidden';
  scrollTo({ top: HOLD.rest * VH, behavior: 'instant' });
  addEventListener('wheel', stopScroll, { passive: false });
  addEventListener('touchmove', stopScroll, { passive: false });
  addEventListener('keydown', stopKeys);
  setTimeout(() => {
    holding = false;
    document.documentElement.style.overflow = '';
    removeEventListener('wheel', stopScroll);
    removeEventListener('touchmove', stopScroll);
    removeEventListener('keydown', stopKeys);
  }, HOLD.ms);
}

// Friction at each service: as a card arrives beside the truck the scene slows right down
// while you keep scrolling, lets the card land, then picks back up. The page is made a little
// taller to pay for the slow stretches, so everything after them lands where it did before.
const FRICTION = { depth: 0.68, width: 0.17, step: 0.002 };
let remapTable = null;
function buildRemap() {
  const stops = serviceStops();
  const table = [0];
  let eff = 0;
  while (eff < 26) {
    let v = 1;
    for (const c of stops) { const u = (eff - c) / FRICTION.width; v -= FRICTION.depth * Math.exp(-u * u); }
    eff += Math.max(v, 0.05) * FRICTION.step;
    table.push(eff);
  }
  remapTable = table;
  // end the track so the closing line is sitting just under the planet the moment the pull-back
  // settles (the footer's 50vh top padding puts it END_LINE screens down from the top)
  let i = 0; while (table[i] < CLIMB.s1) i++;
  track.style.height = (i * FRICTION.step - (0.5 - END_LINE)) * 100 + 'vh';
}
function remap(raw) {
  if (!remapTable) return raw;
  const f = raw / FRICTION.step, i = Math.floor(f), n = remapTable.length - 1;
  if (i >= n) return remapTable[n] + (raw - n * FRICTION.step);
  return remapTable[i] + (remapTable[i + 1] - remapTable[i]) * (f - i);
}

let rawS = 0, lastY = 0;
function readScroll() {
  const prev = rawS, down = scrollY > lastY;   // direction from pixels, so a resize can't fake it
  lastY = scrollY;
  rawS = Math.max(0, scrollY) / VH;   // iPhones bounce past the top (scrollY < 0); a negative read broke the scene for good
  scrollS = remap(rawS);
  if (holding) {
    // pin it: nothing gets past while the numbers play
    if (Math.abs(scrollY - HOLD.rest * VH) > 2) scrollTo({ top: HOLD.rest * VH, behavior: 'instant' });
    scrollS = HOLD.rest;
    return;
  }
  if (rawS < 1.5) held = false;
  if (!held && down && prev < HOLD.at && rawS >= HOLD.at && rawS < HOLD.at + 3) hold();
}
addEventListener('scroll', readScroll, { passive: true });
readScroll();
S = scrollS;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// the clips are scrubbed, never played
const pass = document.getElementById('pass');
video.pause(); pass.pause();
// iPhones only paint a video's frames once it has played, and may skip loading it at all, so prime each
// clip with a silent play-and-pause (again on the first touch, in case Low Power Mode blocked it)
const prime = v => { v.load(); const p = v.play(); if (p) p.then(() => v.pause()).catch(() => {}); };
[video, pass].forEach(prime);
addEventListener('touchstart', () => [video, pass].forEach(v => { if (v.readyState < 2) prime(v); }), { once: true, passive: true });
function scrub(v, k) {
  if (!v.duration) return;
  const t = k * (v.duration - 0.05);
  if (Math.abs(v.currentTime - t) > 0.015 && !v.seeking) v.currentTime = t;
}
initTopdown();
buildRemap();
readScroll();
S = scrollS;
addEventListener('resize', buildRemap);
document.fonts.ready.then(buildRemap);
initClouds(document.getElementById('cloudpass'));

// the closing shot: pull up from the Pacific until the planet hangs from the top of the screen
const PAC_Y = 0.66, PAC_X = 0.49;
const END_HORIZON = 0.42;      // the planet's lower edge, as a fraction from the top
function rigHanging(alt, fov, pitchK) {
  const D = 1 + alt;
  const halfV = fov / 2 * DEG;
  const frac = 1 - END_HORIZON;  // the view is flipped, so measure from the other edge
  const pitch = (Math.asin(1 / D) + Math.atan((frac - 0.5) * 2 * Math.tan(halfV))) * pitchK;
  camera.fov = fov;
  camera.position.set(0, 0, D);
  camera.up.set(0, -1, 0);
  camera.lookAt(0, Math.sin(pitch), D - Math.cos(pitch));
  camera.updateProjectionMatrix();
  return D;
}
let endSpin = 0;
const SNAP_ALT = 0.55;   // where the camera is when the clouds part (Earth radii)
// scroll position where the climb reaches the handoff altitude (the clouds centre on it)

// sunlight swings from the orbit angle to a sunset straight down the road
const SUN_ORBIT = new THREE.Vector3(-1.0, 0.42, 0.38).normalize();
const SUN_ROAD = new THREE.Vector3(0.1, 1.0, -0.12).normalize();

// land over the American Southwest, facing north up the highway
const LAND_Y = 0.38, LAND_X = 0.61;

let finaleOn = false;
function countUp() {
  finale.querySelectorAll('[data-to]').forEach((el, i) => {
    const to = +el.dataset.to, dec = +(el.dataset.dec || 0), unit = el.dataset.unit || '';
    const t0 = performance.now() + 550 + i * 90;
    const step = now => {
      const k = clamp((now - t0) / 1600, 0, 1), e = 1 - Math.pow(1 - k, 4);
      const n = (to * e).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      el.innerHTML = n + (unit ? `<small>${unit}</small>` : '');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// ---------------------------------------------------------------- loop

const clock = new THREE.Clock();
let spin = 0.6, riseStart = null, landY = LAND_Y;
const RISE = 3.2; // seconds
const easeOut = t => 1 - Math.pow(1 - t, 4);
const tmpV = new THREE.Vector3();

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (ready && riseStart === null) { riseStart = clock.elapsedTime; document.documentElement.classList.add('ready'); }
  const rise = riseStart === null ? 0 : reduceMotion ? 1 : easeOut(clamp((clock.elapsedTime - riseStart) / RISE, 0, 1));

  S += (scrollS - S) * (reduceMotion || window.__snap ? 1 : 0.1);
  if (!Number.isFinite(S)) S = scrollS;
  const p = clamp(S / OPENING, 0, 1);
  // the climb: one altitude drives the shrinking boat and the 3D camera alike
  const aEnd = orbitAlt * 1.15;
  const climbing = S > CLIMB.s0;
  const altC = climbing ? climbAlt(S, aEnd) : CLIMB.a0;
  const ending = S >= CURTAIN.snap ? 1 : 0;   // under full cloud cover the scene snaps to the planet
  const dive = smooth(0.03, 0.56, p);                // orbit → road
  const fadeIn = smooth(0.52, 0.6, p);               // 3D → clip

  // camera: rise into place, then descend toward the horizon
  const alt = orbitAlt * Math.pow(0.016 / orbitAlt, dive);
  const fov = mix(ORBIT_FOV, ROAD_FOV, smooth(0.15, 1, dive));
  const horizon = mix(mix(1.1, crest, rise), roadHorizon, dive);
  const D = rig(alt, fov, horizon);
  const atmoR = 1 + Math.min(0.035, alt * 0.75);   // keep the glow shell below the camera
  atmo.scale.setScalar(atmoR);
  atmoMat.uniforms.atmoR.value = atmoR;
  const dusk = smooth(0.35, 0.95, dive);
  atmoMat.uniforms.dusk.value = dusk;
  earthMat.uniforms.dusk.value = dusk;
  earthMat.uniforms.lightsScale.value = 1 - 0.95 * smooth(0.3, 0.8, dive);

  // the planet: spinning freely in orbit, easing to a stop over the desert as we fall
  spin += dt * (reduceMotion ? 0 : mix(0.35, 0.06, rise)) * (1 - dive);
  if (dive < 0.001) landY = LAND_Y + Math.PI * 2 * Math.round((spin - LAND_Y) / (Math.PI * 2));
  const settle = smooth(0, 0.85, dive);
  earth.rotation.y = mix(spin, landY, settle);
  earth.rotation.x = mix(-0.6, LAND_X, settle);
  earth.rotation.z = mix(23.4 * DEG, 0, settle);
  clouds.rotation.y = clock.elapsedTime * 0.008;
  earthMat.uniforms.cloudRot.value = clouds.rotation.y;
  cloudMat.uniforms.opacity.value = mix(1, 0.08, smooth(0.2, 0.9, dive));
  sunDir.copy(SUN_ORBIT).lerp(SUN_ROAD, smooth(0.2, 0.9, dive)).normalize();

  // aurora layer follows the planet's outline on screen, and bows out as we descend
  tmpV.set(0, 0, 0).project(camera);
  auroraMat.uniforms.center.value.set((tmpV.x * 0.5 + 0.5) * W, (tmpV.y * 0.5 + 0.5) * H);
  auroraMat.uniforms.radius.value = (H / 2) / Math.tan(camera.fov / 2 * DEG) / Math.sqrt(D * D - 1);
  auroraMat.uniforms.time.value = clock.elapsedTime;
  if (riseStart !== null) updateAurora(clock.elapsedTime - riseStart);
  auroraMat.uniforms.activity.value *= 1 - smooth(0, 0.3, dive);

  if (ending > 0) {
    // rising from the sea: straight down at first, then tipping until the planet hangs overhead
    // already high enough to look crisp when the clouds part, then settling into the closing shot
    const k = smooth(CURTAIN.snap, CLIMB.s1, S);
    const endAlt = SNAP_ALT * Math.pow(aEnd / SNAP_ALT, k);
    const Dend = rigHanging(endAlt, mix(30, ORBIT_FOV, k), smooth(0.25, 1, k));
    const endR = 1 + Math.min(0.035, endAlt * 0.75);
    atmo.scale.setScalar(endR);
    atmoMat.uniforms.atmoR.value = endR;
    atmoMat.uniforms.dusk.value = earthMat.uniforms.dusk.value = 0;
    earthMat.uniforms.lightsScale.value = 1;
    earthMat.uniforms.glintScale.value = 0.25;   // the closing view looks almost into the sun's reflection
    cloudMat.uniforms.opacity.value = mix(0.45, 1, smooth(0, 0.6, k));
    sunDir.copy(SUN_ORBIT);
    endSpin += dt * 0.02 * k;
    earth.rotation.set(PAC_X, PAC_Y + endSpin, Math.PI);   // the view is flipped; keep north up
    auroraMat.uniforms.activity.value = 0;
  } else {
    camera.up.set(0, 1, 0);
    earthMat.uniforms.glintScale.value = 1;
  }

  starMat.uniforms.time.value = clock.elapsedTime;
  starMat.uniforms.fade.value = Math.min(1, starMat.uniforms.fade.value + dt * 0.5);

  // copy and clip
  const heroOut = smooth(0.0, 0.07, p);
  hero.style.opacity = 1 - heroOut;
  hero.style.transform = `translateY(${-heroOut * 40}px)`;
  hero.style.visibility = heroOut > 0.99 ? 'hidden' : '';
  cue.style.opacity = (1 - smooth(0, 0.03, p)) * rise;
  video.style.opacity = fadeIn * (S < 5.5 ? 1 : 0);
  scrub(video, smooth(0.58, 0.86, p));
  // the truck roars past, then we dip to the overhead view
  pass.style.opacity = S >= 5.5 && S < TD.in[1] + 0.2 ? 1 : 0;
  pass.style.filter = `brightness(${1 - smooth(6.3, 6.6, S)})`;
  scrub(pass, smooth(5.55, 6.45, S));
  const overhead = updateTopdown(S, { z: CLIMB.a0 / altC, gone: ending });
  updateClouds(S);
  // the closing line rises in beneath the planet as it settles into place
  const endIn = smooth(CLIMB.s1 - 0.9, CLIMB.s1 - 0.05, S);
  endCta.style.opacity = endIn;
  endCta.style.transform = `translateY(${(1 - endIn) * 60}px)`;

  // finale: once the truck arrives, the pitch and numbers come in on their own timing
  if (!finaleOn && p > 0.87 && S < 5.45) { finaleOn = true; finale.classList.add('on'); shade.classList.add('on-shade'); countUp(); }
  else if (finaleOn && (p < 0.83 || S >= 5.45)) { finaleOn = false; finale.classList.remove('on'); shade.classList.remove('on-shade'); }

  // the clips and the overhead scene cover the planet in between; only draw it when it shows
  if (fadeIn < 0.999 || (ending > 0 && overhead < 0.999)) composer.render();
}
tick();
