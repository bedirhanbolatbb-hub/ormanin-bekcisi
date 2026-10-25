// ---------- world: layout, ground, buildings, props ----------
const WORLD = {
  scene: null, art: null, houses: [], melters: [], cars: [], decorGroups: [], lamps: [], smokers: [],
  sun: null, hemi: null, plaza: null, tree: null, snowmen: [],
  bounds: { x0: -23.5, x1: 23.5, z0: -67, z1: 67 },
};

// paved rectangles: [x0, z0, x1, z1, kind, depth]
const PAVED = [];
const LOTS = [];
function rect(x0, z0, x1, z1) { return { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1) }; }

// ---------- procedural textures ----------
function canvasTex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4; if (rep) t.repeat.set(rep[0], rep[1]);
  return t;
}
function speckle(g, w, h, n, cols, a0, a1, s0, s1) {
  for (let i = 0; i < n; i++) { g.globalAlpha = rnd(a0, a1); g.fillStyle = cols[(Math.random() * cols.length) | 0]; const s = rnd(s0, s1); g.fillRect(Math.random() * w, Math.random() * h, s, s); }
  g.globalAlpha = 1;
}
const TEX = {};
function makeTextures() {
  TEX.asphalt = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#353a42'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 5000, ['#2a2e35', '#41474f', '#4b5159', '#25292f'], 0.4, 0.9, 1, 2.5);
    speckle(g, w, h, 300, ['#5a6068', '#20242a'], 0.3, 0.6, 2, 4);
  });
  TEX.walk = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#a9adb2'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 3000, ['#9da1a6', '#b6babe', '#8f9398'], 0.3, 0.7, 1, 2);
    g.strokeStyle = 'rgba(70,74,80,0.55)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 1.5); g.lineTo(w, 1.5); g.moveTo(1.5, 0); g.lineTo(1.5, h); g.stroke();
  });
  TEX.pavers = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#7d6a62'; g.fillRect(0, 0, w, h);
    const bw = 64, bh = 32;
    for (let y = 0; y < h; y += bh) for (let x = -bw; x < w; x += bw) {
      const ox = ((y / bh) & 1) ? bw / 2 : 0;
      const c = ['#8a766c', '#76635c', '#93807a', '#6f5e57'][(Math.random() * 4) | 0];
      g.fillStyle = c; g.fillRect(x + ox + 2, y + 2, bw - 4, bh - 4);
    }
    speckle(g, w, h, 1500, ['#5c4d47', '#a08c84'], 0.2, 0.5, 1, 2);
  });
  TEX.flags = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#6f7378'; g.fillRect(0, 0, w, h);
    const r = mulberry(5);
    for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) {
      const c = ['#9a9fa5', '#8d9298', '#a6abb0', '#858a90'][(r() * 4) | 0]; g.fillStyle = c;
      g.beginPath(); g.roundRect ? g.roundRect(x + 4, y + 4, 56, 56, 8) : g.rect(x + 4, y + 4, 56, 56); g.fill();
    }
    speckle(g, w, h, 1200, ['#6a6e73', '#b0b4b8'], 0.2, 0.4, 1, 2);
  });
  TEX.cobble = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5d5a58'; g.fillRect(0, 0, w, h);
    const r = mulberry(9);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) {
      const ox = ((y / 32) & 1) ? 16 : 0;
      g.fillStyle = ['#8b8580', '#7d7772', '#958f89', '#746e69'][(r() * 4) | 0];
      g.beginPath(); g.ellipse(x + ox + 16, y + 16, 13 + r() * 2, 12 + r() * 2, r(), 0, TAU); g.fill();
      if (x + ox + 32 > w) { g.beginPath(); g.ellipse(x + ox + 16 - w, y + 16, 13, 12, 0, 0, TAU); g.fill(); }
    }
  });
  TEX.apron = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#9fa3a8'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 2500, ['#93979c', '#adb1b5'], 0.3, 0.6, 1, 2);
    g.strokeStyle = 'rgba(60,64,70,0.5)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
  });
  TEX.dot = canvasTex(64, 64, (g, w, h) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  TEX.dot.encoding = THREE.LinearEncoding;
  TEX.ring = canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 14; g.setLineDash([26, 16]);
    g.beginPath(); g.arc(128, 128, 108, 0, TAU); g.stroke();
    g.setLineDash([]); g.globalAlpha = 0.18; g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 100, 0, TAU); g.fill();
    // snowflake icon
    g.globalAlpha = 0.9; g.strokeStyle = '#fff'; g.lineWidth = 9; g.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a) * 46, 128 + Math.sin(a) * 46); g.stroke(); }
  });
  TEX.ring.encoding = THREE.LinearEncoding;
  const sk = (CH && CH.env && CH.env.sky) || ['#6f9fd6', '#b9d3ee', '#e8f0f8'];
  TEX.sky = canvasTex(4, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, sk[0]); gr.addColorStop(0.55, sk[1]); gr.addColorStop(1, sk[2]);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  // chapter ground textures
  TEX.ice = canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#5fb0e8'); gr.addColorStop(0.5, '#7cc4f0'); gr.addColorStop(1, '#93d2f6'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = mulberry(21); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) { let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; g.lineTo(x, y); } g.stroke(); }
    speckle(g, w, h, 600, ['#ffffff', '#d8f1ff'], 0.15, 0.45, 1, 3);
  });
  TEX.piste = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c9d8ec'; g.fillRect(0, 0, w, h);
    // groomed corduroy (clearly different from fresh powder)
    for (let x = 0; x < w; x += 8) { g.fillStyle = 'rgba(96,126,176,0.5)'; g.fillRect(x, 0, 3, h); g.fillStyle = 'rgba(244,248,255,0.85)'; g.fillRect(x + 4, 0, 3, h); }
    speckle(g, w, h, 900, ['#ffffff', '#b8cae2'], 0.2, 0.5, 1, 2);
  });
  TEX.school = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#3a3f47'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 4000, ['#30353c', '#454b54', '#2a2e35'], 0.4, 0.9, 1, 2.5);
  });
}

function groundPlane(r, tex, tile, y, rough, glossy) {
  const w = r.x1 - r.x0 + 0.2, d = r.z1 - r.z0 + 0.2;
  const geo = new THREE.PlaneGeometry(w, d); geo.rotateX(-Math.PI / 2);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * d / tile);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: rough || 0.85, metalness: glossy ? 0.15 : 0, envMapIntensity: glossy ? 1.4 : 1 }));
  m.position.set((r.x0 + r.x1) / 2, y || 0, (r.z0 + r.z1) / 2); m.receiveShadow = true;
  m.matrixAutoUpdate = false; m.updateMatrix();
  return m;
}

// ---------- model helpers ----------
function artScene(key) { const s = WORLD.art[key]; if (!s) { console.warn('missing art', key); return new THREE.Group(); } return s; }
function place(key, x, z, rotY, s, y) {
  const o = artScene(key).clone(true);
  o.position.set(x, y || 0, z); o.rotation.y = rotY || 0; o.scale.setScalar(s || 1);
  o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; xray(c.material); } });
  return o;
}
// static decor batching: collects meshes, merges per material
const DECOR = { items: [] };
// mark the ground under an object as solid, so big machines never swing through it
function solidUnder(o, pad, paved) {
  o.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(o), T = SNOW.T, H = SNOW.H;
  SNOW.paint(bb.min.x - pad, bb.min.z - pad, bb.max.x + pad, bb.max.z + pad, (k) => { if (T[k] === 0) T[k] = 2; else if (paved && T[k] === 1) { T[k] = 2; H[k] = 0; } });
}
function solidDisc(x, z, r) { const T = SNOW.T; SNOW.paint(x - r, z - r, x + r, z + r, (k, px, pz) => { if (T[k] === 0 && (px - x) ** 2 + (pz - z) ** 2 <= r * r) T[k] = 2; }); }
function decor(key, x, z, rotY, s, y, opts) {
  const o = place(key, x, z, rotY, s, y);
  o.updateMatrixWorld(true);
  if (opts && opts.solid !== undefined) solidUnder(o, opts.solid, opts.paved);
  if (opts && opts.trunk) solidDisc(x, z, opts.trunk);
  o.traverse(c => { if (c.isMesh) DECOR.items.push({ geo: c.geometry, mat: c.material, m: c.matrixWorld.clone(), cast: !(opts && opts.noShadow) }); });
  return o;
}
function flushDecor(scene) {
  const groups = new Map();
  for (const it of DECOR.items) { const k = it.mat.uuid + (it.cast ? 'c' : 'n'); if (!groups.has(k)) groups.set(k, { mat: it.mat, list: [], cast: it.cast }); groups.get(k).list.push(bakeGeom(it.geo, it.m)); }
  for (const g of groups.values()) {
    const geo = mergeGeoms(g.list);
    const mesh = new THREE.Mesh(geo, g.mat); mesh.castShadow = g.cast; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false;
    scene.add(mesh); WORLD.decorGroups.push(mesh);
  }
  DECOR.items.length = 0;
}

function makeSign(text, color) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = color; g.beginPath(); g.roundRect ? g.roundRect(4, 4, 248, 56, 14) : g.rect(4, 4, 248, 56); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#fff'; g.font = '800 36px "Baloo 2", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 35);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
  return m;
}

// ---------- build ----------
function buildWorld(scene) {
  WORLD.scene = scene;
  makeTextures();
  PAVED.length = 0; LOTS.length = 0;
  Object.assign(SNOW, CH.grid);
  WORLD.bounds = { x0: SNOW.X0 + 0.5, x1: SNOW.X0 + (SNOW.NX - 1) * SNOW.C - 0.5, z0: SNOW.Z0 + 1, z1: SNOW.Z0 + (SNOW.NZ - 1) * SNOW.C - 1 };
  CH.layout();
  SNOW.init();
  const H = SNOW.H, T = SNOW.T;
  // 1) yards everywhere
  const yd = CH.yardDepth || 0.44;
  for (let j = 0; j < SNOW.NZ; j++) for (let i = 0; i < SNOW.NX; i++) {
    const x = SNOW.X0 + i * SNOW.C, z = SNOW.Z0 + j * SNOW.C, k = j * SNOW.NX + i;
    H[k] = yd + (fbm(x * 0.18, z * 0.18) - 0.5) * 0.22 + (fbm(x * 0.9 + 50, z * 0.9) - 0.5) * 0.05;
    T[k] = 0;
  }
  // 2) paved areas
  for (const p of PAVED) {
    if (p.noSnow) continue;
    SNOW.paint(p.r.x0, p.r.z0, p.r.x1, p.r.z1, (k, x, z) => {
      if (p.mask && !p.mask(x, z)) return;
      T[k] = 1;
      let d = p.d + (fbm(x * 0.35 + 9, z * 0.35) - 0.5) * 0.07;
      H[k] = Math.max(0.05, d);
    });
  }
  // drifts: paved samples near yard edges get deeper snow (wind drifts)
  const N = SNOW.NX;
  const Hc = H.slice();
  for (let j = 3; j < SNOW.NZ - 3; j++) for (let i = 3; i < N - 3; i++) {
    const k = j * N + i; if (T[k] !== 1) continue;
    let near = 0;
    for (let r = 1; r <= 3; r++) if (T[k - r] === 0 || T[k + r] === 0 || T[k - r * N] === 0 || T[k + r * N] === 0) { near = (4 - r) / 3; break; }
    if (near > 0) H[k] = Math.max(Hc[k], Hc[k] + 0.06 * near);
  }
  // 3) areas (jobs) – keyed rects
  WORLD.areaByKey = {};
  const mk = (key, name, rects, extra) => {
    const a = SNOW.newArea(Object.assign({ key, name, rects }, extra || {}));
    for (const r of rects) SNOW.paint(r.x0, r.z0, r.x1, r.z1, (k, x, z) => { if (T[k] === 1 && (!a.mask || a.mask(x, z))) SNOW.A[k] = a.id; });
    WORLD.areaByKey[key] = a; return a;
  };
  const pav = key => PAVED.find(p => p.key === key).r;
  CH.areas(mk, pav);
  // 4) ground meshes
  const tile = { asphalt: 4, walk: 1.8, pavers: 2.2, flags: 1.4, cobble: 1.6, apron: 3, ice: 6, piste: 2.6, school: 4 };
  const rough = { asphalt: 0.62, walk: 0.85, pavers: 0.8, flags: 0.8, cobble: 0.75, apron: 0.85, ice: 0.12, piste: 0.95, school: 0.62 };
  const gy = { asphalt: 0, walk: 0.003, apron: 0.003, pavers: 0.006, flags: 0.007, cobble: 0.005, ice: 0.002, piste: 0.004, school: 0.001 };
  for (const p of PAVED) if (!p.noMesh) scene.add(groundPlane(p.r, TEX[p.kind], tile[p.kind], gy[p.kind], rough[p.kind], p.kind === 'ice'));
  // safety base under everything
  const base = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0xe9eef5, roughness: 1 }));
  base.rotation.x = -Math.PI / 2; base.position.y = -0.12; scene.add(base);
  // outer snow fields beyond the grid (static)
  { const gx0 = SNOW.X0, gx1 = SNOW.X0 + (SNOW.NX - 1) * SNOW.C, gz0 = SNOW.Z0, gz1 = SNOW.Z0 + (SNOW.NZ - 1) * SNOW.C, W = gx1 - gx0, D = gz1 - gz0;
    const outer = new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.9 });
    const add = (cx, cz, w, d) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), outer); m.rotation.x = -Math.PI / 2; m.position.set(cx, (CH.yardDepth || 0.44) - 0.01, cz); m.receiveShadow = true; scene.add(m); };
    add(gx0 - 60, (gz0 + gz1) / 2, 120, D + 240); add(gx1 + 60, (gz0 + gz1) / 2, 120, D + 240);
    add((gx0 + gx1) / 2, gz0 - 60, W, 120); add((gx0 + gx1) / 2, gz1 + 60, W, 120); }
  // 5..8) chapter buildings, props, characters
  CH.build(scene, H, T);
  // samples hugging a parked vehicle don't count toward the job (no pixel hunting)
  {
    const T = SNOW.T, A = SNOW.A;
    const near = new Uint8Array(T.length);
    for (const c of WORLD.cars) if (!c.isBus) SNOW.paint(c.fx0 - 0.6, c.fz0 - 0.6, c.fx1 + 0.6, c.fz1 + 0.6, (k) => { if (T[k] === 1) near[k] = 1; });
    for (let k = 0; k < T.length; k++) if (near[k] && A[k]) A[k] = 0;
  }
  flushDecor(scene);
  SNOW.finalizeAreas();
  // 9) snow meshes
  SNOW.buildMeshes(scene);
  // 10) lights
  const E = WORLD.env = Object.assign({ fog: 0xdce8f4, hemi: [0x9cc0f0, 0xe0e6f0, 0.6], sun: [0xffdcb0, 2.1], sunOff: [14, 24, 12], exposure: 0.8, fogNear: 42, fogFar: 120 }, CH.env || {});
  const hemi = WORLD.hemi = new THREE.HemisphereLight(E.hemi[0], E.hemi[1], E.hemi[2]); scene.add(hemi);
  const sun = WORLD.sun = new THREE.DirectionalLight(E.sun[0], E.sun[1]);
  sun.castShadow = true; const sm = IS_MOBILE ? 1024 : 2048; sun.shadow.mapSize.set(sm, sm);
  const sc = sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 90;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  scene.add(sun); scene.add(sun.target);
  scene.background = TEX.sky;
  scene.fog = new THREE.Fog(E.fog, E.fogNear, E.fogFar);
}

function makeSnowCap(w, l, h) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: 0xf6f9fd, roughness: 0.8 }); xray(m);
  const geo = new THREE.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI / 2);
  const top = new THREE.Mesh(geo, m); top.scale.set(w * 0.44, 0.26, l * 0.3); top.position.set(0, h - 0.16, -l * 0.04); top.castShadow = true;
  const hood = new THREE.Mesh(geo, m); hood.scale.set(w * 0.46, 0.16, l * 0.2); hood.position.set(0, h * 0.62, l * 0.3); hood.castShadow = true;
  const mound = new THREE.Mesh(geo, m); mound.scale.set(w * 0.62, 0.42, l * 0.56); mound.position.y = 0; mound.castShadow = true; mound.receiveShadow = true;
  g.add(top, hood, mound); g.userData.parts = [top, hood, mound];
  return g;
}
