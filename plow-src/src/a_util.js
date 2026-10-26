'use strict';
// ---------- small helpers ----------
const V3 = THREE.Vector3;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => (v - a) / (b - a);
const smooth = t => t * t * (3 - 2 * t);
const damp = (a, b, k, dt) => b + (a - b) * Math.exp(-k * dt);
const easeOutBack = t => { const c = 1.70158; t -= 1; return 1 + (c + 1) * t * t * t + c * t * t; };
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const dampAng = (a, b, k, dt) => a + angDiff(a, b) * (1 - Math.exp(-k * dt));
const $ = id => document.getElementById(id);
const QS = new URLSearchParams(location.search);
if (QS.has('bot')) { const _r = (function (a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(+(QS.get('seed') || 7)); Math.random = _r; }
const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const IS_MOBILE = IS_TOUCH && Math.min(screen.width, screen.height) < 820;

// deterministic rng
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let RNG = mulberry(12345);
const rand = (a = 0, b = 1) => a + (b - a) * RNG();
const rnd = (a = 0, b = 1) => a + (b - a) * Math.random();

// value noise 2D (for snow drifts)
const NOISE = (() => {
  const P = new Uint8Array(512), r = mulberry(777);
  for (let i = 0; i < 256; i++) P[i] = i;
  for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; const t = P[i]; P[i] = P[j]; P[j] = t; }
  for (let i = 0; i < 256; i++) P[i + 256] = P[i];
  const g = (ix, iz) => P[(P[ix & 255] + iz) & 255] / 255;
  return (x, z) => {
    const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    const a = g(ix, iz), b = g(ix + 1, iz), c = g(ix, iz + 1), d = g(ix + 1, iz + 1);
    const ux = smooth(fx), uz = smooth(fz);
    return lerp(lerp(a, b, ux), lerp(c, d, ux), uz);
  };
})();
const fbm = (x, z) => NOISE(x, z) * 0.55 + NOISE(x * 2.1 + 13, z * 2.1 + 7) * 0.3 + NOISE(x * 4.3 + 31, z * 4.3 + 17) * 0.15;

function fmt(n) {
  n = Math.floor(n);
  if (n < 10000) return '' + n;
  if (n < 1e6) return (n / 1000).toFixed(n < 1e5 ? 1 : 0).replace(/\.0$/, '') + 'K';
  if (n < 1e9) return (n / 1e6).toFixed(n < 1e7 ? 2 : 1).replace(/\.?0+$/, '') + 'M';
  return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
}

// ---- storage (safe) ----
const STORE = {
  // the CrazyGames account copy wins when there is one; this browser keeps a copy too
  get(k) { const c = CG.get(k); if (c != null) return c; try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { CG.set(k, v); try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { CG.call(s => s.data.removeItem(k)); try { localStorage.removeItem(k); } catch (e) { } }
};

// ---- geometry merge (static decor) ----
function mergeGeoms(list) {
  // list of BufferGeometry (non-indexed or indexed) with position+normal (+color optional)
  let total = 0, hasColor = list.every(g => g.attributes.color);
  for (const g of list) total += g.index ? g.index.count : g.attributes.position.count;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = hasColor ? new Float32Array(total * 3) : null;
  let o = 0;
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, idx = g.index;
    const cnt = idx ? idx.count : p.count;
    for (let i = 0; i < cnt; i++) {
      const k = idx ? idx.getX(i) : i;
      pos[o * 3] = p.getX(k); pos[o * 3 + 1] = p.getY(k); pos[o * 3 + 2] = p.getZ(k);
      if (n) { nor[o * 3] = n.getX(k); nor[o * 3 + 1] = n.getY(k); nor[o * 3 + 2] = n.getZ(k); }
      if (col) { col[o * 3] = c.getX(k); col[o * 3 + 1] = c.getY(k); col[o * 3 + 2] = c.getZ(k); }
      o++;
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (col) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere(); out.computeBoundingBox();
  return out;
}

// convert any (possibly quantized/interleaved) geometry into plain float geometry transformed by matrix
function bakeGeom(geo, mat4) {
  const g = new THREE.BufferGeometry();
  const p = geo.attributes.position, n = geo.attributes.normal;
  const cnt = p.count;
  const pos = new Float32Array(cnt * 3), nor = new Float32Array(cnt * 3);
  const v = new V3(), nm = new THREE.Matrix3().getNormalMatrix(mat4);
  for (let i = 0; i < cnt; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(mat4); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
    if (n) { v.set(n.getX(i), n.getY(i), n.getZ(i)).applyMatrix3(nm).normalize(); nor[i * 3] = v.x; nor[i * 3 + 1] = v.y; nor[i * 3 + 2] = v.z; }
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (geo.index) g.setIndex(geo.index.clone());
  if (!n) g.computeVertexNormals();
  return g;
}

// ---- x-ray: dither away anything between the camera and the player ----
const XRAY = { uP: { value: new THREE.Vector2() }, uD: { value: 0 }, uA: { value: 1 }, uR: { value: 0.16 }, uRes: { value: new THREE.Vector2(1, 1) } };
function xray(mat) {
  if (!mat || mat.userData.xr || !mat.isMeshStandardMaterial) return;
  mat.userData.xr = 1; const tall = !!mat.userData.xtall;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uXP = XRAY.uP; sh.uniforms.uXD = XRAY.uD; sh.uniforms.uXA = XRAY.uA; sh.uniforms.uXR = XRAY.uR; sh.uniforms.uXRes = XRAY.uRes;
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', `uniform vec2 uXP; uniform float uXD; uniform float uXA; uniform float uXR; uniform vec2 uXRes;
void main() {
  { vec2 q = gl_FragCoord.xy / uXRes * 2.0 - 1.0; vec2 dq = (q - uXP) * vec2(uXA, 1.0); float rr = length(dq);
    float b = (mod(floor(gl_FragCoord.x), 2.0) * 2.0 + mod(floor(gl_FragCoord.y), 2.0) + mod(floor(gl_FragCoord.x*0.5)+floor(gl_FragCoord.y*0.5),2.0)*0.5) / 3.5 + 0.08;
    // anything right in front of the lens (a lift tower, a roof corner) fades away too, wherever it is on screen
    float nf = 1.0 - smoothstep(uXD * 0.32, uXD * 0.52, vViewPosition.z);
    if (b < nf * 0.92) discard;
    if (rr < uXR && vViewPosition.z < uXD - 0.8) { float f = 1.0 - smoothstep(uXR * 0.5, uXR, rr);
      if (b < f * 0.92) discard; }${tall ? `
    // huge set pieces (a giant arch, lift towers): see-through whenever they stand between the camera and you
    if (vViewPosition.z < uXD - 1.0 && b < 0.7) discard;` : ''} }`);
  };
  mat.customProgramCacheKey = () => tall ? 'xray2t' : 'xray2';
}
