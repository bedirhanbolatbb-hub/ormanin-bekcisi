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

function defineLayout() {
  PAVED.length = 0; LOTS.length = 0;
  PAVED.push({ r: rect(-3.5, -50, 3.5, 50), kind: 'asphalt', d: 0.5, key: 'street' });
  PAVED.push({ r: rect(-5.3, -50, -3.5, 50), kind: 'walk', d: 0.38, key: 'walkW' });
  PAVED.push({ r: rect(3.5, -50, 5.3, 50), kind: 'walk', d: 0.38, key: 'walkE' });
  PAVED.push({ r: rect(-10, 50, 10, 59), kind: 'apron', d: 0.12, key: 'apron' });
  PAVED.push({ r: rect(-9.5, -59, 9.5, -50), kind: 'asphalt', d: 0.46, key: 'north' });
  PAVED.push({ r: rect(5.3, -21, 17.5, 1), kind: 'cobble', d: 0.42, key: 'plaza' });
  // lots: side -1 west, +1 east
  const defs = [
    { side: -1, c: 38, model: 'cabin', s: 1.22, who: 'Grandma Rose', key: 'rose', car: null, smoke: [1.40, 4.6, -0.47] },
    { side: 1, c: 38, model: 'cottage_ginger', s: 2.25, who: 'the Millers', key: 'miller', car: 'car_blue', smoke: [0.84, 2.72, -0.1] },
    { side: -1, c: 14, model: 'chalet', s: 1.08, who: 'Mr. Hale', key: 'hale', car: 'car_white', smoke: [0.91, 5.3, -1.01] },
    { side: 1, c: 14, model: 'cottage_red', s: 2.05, who: 'the Parks', key: 'park', car: 'camper', smoke: [0.82, 2.77, -0.1] },
    { side: -1, c: -10, model: 'chalet_blue', s: 1.65, who: 'Lina', key: 'lina', car: 'icecream', smoke: null },
    { side: -1, c: -34, model: 'guesthouse', s: 0.98, who: 'the Ortegas', key: 'ortega', car: 'car_blue', smoke: null },
    { side: 1, c: -34, model: 'chalet_xmas', s: 1.78, who: 'Old Tom', key: 'tom', car: null, smoke: [0.57, 3.12, -0.62] },
  ];
  for (const d of defs) {
    const sx = d.side;
    const drive = rect(sx * 5.3, d.c + 5.0, sx * 14.6, d.c + 9.0);
    const path = rect(sx * 5.3, d.c - 0.65, sx * 11.9, d.c + 0.65);
    PAVED.push({ r: drive, kind: 'pavers', d: 0.36, key: d.key + '_drive' });
    PAVED.push({ r: path, kind: 'flags', d: 0.34, key: d.key + '_path' });
    LOTS.push(Object.assign({ drive, path }, d));
  }
}

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
  TEX.sky = canvasTex(4, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6f9fd6'); gr.addColorStop(0.55, '#b9d3ee'); gr.addColorStop(1, '#e8f0f8');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}

function groundPlane(r, tex, tile, y, rough) {
  const w = r.x1 - r.x0 + 0.2, d = r.z1 - r.z0 + 0.2;
  const geo = new THREE.PlaneGeometry(w, d); geo.rotateX(-Math.PI / 2);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * d / tile);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: rough || 0.85, metalness: 0 }));
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
function decor(key, x, z, rotY, s, y, opts) {
  const o = place(key, x, z, rotY, s, y);
  o.updateMatrixWorld(true);
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

// ---------- the melter (procedural) ----------
function makeMelter(x, z, rot) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot || 0;
  const iron = new THREE.MeshStandardMaterial({ color: 0xc23b2e, roughness: 0.42, metalness: 0.25 });
  const iron2 = new THREE.MeshStandardMaterial({ color: 0x2f3540, roughness: 0.5, metalness: 0.5 });
  const red = new THREE.MeshStandardMaterial({ color: 0x2f3540, roughness: 0.45, metalness: 0.4 });
  const glowM = new THREE.MeshStandardMaterial({ color: 0xff5a10, emissive: 0xff3a00, emissiveIntensity: 1.0, roughness: 0.6 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xffc23d, roughness: 0.3, metalness: 0.7, emissive: 0x7a4a00, emissiveIntensity: 0.4 });
  // base tub
  const tub = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.2, 1.05, 20, 1, true), iron); tub.position.y = 0.55;
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.3, 0.12, 20), iron2); bottom.position.y = 0.06;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.1, 8, 24), red); rim.rotation.x = Math.PI / 2; rim.position.y = 1.08;
  const band = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.05, 6, 24), iron2); band.rotation.x = Math.PI / 2; band.position.y = 0.5;
  // glowing core inside
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.98, 20), glowM); core.rotation.x = -Math.PI / 2; core.position.y = 0.9;
  // grate bars
  const bars = new THREE.Group();
  for (let i = -3; i <= 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 1.9 * Math.sqrt(1 - (i / 3.6) * (i / 3.6))), iron2); b.position.set(i * 0.27, 0.98, 0); bars.add(b); }
  // chimney
  const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.5, 10), iron2); chim.position.set(-0.75, 1.65, -0.55);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.14, 10), red); cap.position.set(-0.75, 2.45, -0.55);
  // coin spout + coin pile
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.5, 10), gold); spout.rotation.z = Math.PI / 2.6; spout.position.set(1.15, 0.85, 0.2);
  const pile = new THREE.Group();
  for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 12), gold); c.position.set(1.4 + rnd(-0.2, 0.2), 0.02 + (i % 5) * 0.03, 0.2 + rnd(-0.25, 0.25)); c.rotation.set(rnd(-0.3, 0.3), 0, rnd(-0.3, 0.3)); pile.add(c); }
  // sign post
  const sign = makeSign('MELTER', '#c8322a'); sign.position.set(x, 2.95, z + 0.2); sign.scale.setScalar(0.95); WORLD.scene.add(sign);
  [tub, bottom, rim, band, core, chim, cap, spout].forEach(m => { m.castShadow = true; m.receiveShadow = true; xray(m.material); g.add(m); });
  g.add(bars, pile);
  // dump zone ring on the ground
  const ringMat = new THREE.MeshBasicMaterial({ map: TEX.ring, transparent: true, depthWrite: false, color: 0xffb01f, opacity: 0.85, fog: false, toneMapped: false });
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ringMat); ring.rotation.x = -Math.PI / 2;
  ring.renderOrder = 2;
  WORLD.scene.add(g); WORLD.scene.add(ring);
  // warm light pool
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24), new THREE.MeshBasicMaterial({ map: TEX.dot, color: 0xff7a20, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(x, 0.03, z); pool.renderOrder = 1; WORLD.scene.add(pool);
  const M = { g, x, z, core: glowM, ring, pool, chimTop: new V3(), spoutPos: new V3(), heat: 0, r: 1.9, zone: new V3(), shake: 0 };
  g.updateMatrixWorld(true);
  cap.getWorldPosition(M.chimTop); M.chimTop.y += 0.2;
  spout.getWorldPosition(M.spoutPos); M.spoutPos.y += 0.2;
  return M;
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
  defineLayout();
  SNOW.init();
  const H = SNOW.H, T = SNOW.T;
  // 1) yards everywhere
  for (let j = 0; j < SNOW.NZ; j++) for (let i = 0; i < SNOW.NX; i++) {
    const x = SNOW.X0 + i * SNOW.C, z = SNOW.Z0 + j * SNOW.C, k = j * SNOW.NX + i;
    H[k] = 0.44 + (fbm(x * 0.18, z * 0.18) - 0.5) * 0.22 + (fbm(x * 0.9 + 50, z * 0.9) - 0.5) * 0.05;
    T[k] = 0;
  }
  // 2) paved areas
  const kindDepth = {};
  for (const p of PAVED) {
    SNOW.paint(p.r.x0, p.r.z0, p.r.x1, p.r.z1, (k, x, z) => {
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
    for (const r of rects) SNOW.paint(r.x0, r.z0, r.x1, r.z1, (k) => { if (T[k] === 1) SNOW.A[k] = a.id; });
    WORLD.areaByKey[key] = a; return a;
  };
  const pav = key => PAVED.find(p => p.key === key).r;
  for (const L of LOTS) mk(L.key, L.who, [L.drive, L.path], { lot: L });
  mk('walkW1', 'West sidewalk', [rect(-5.3, 1, -3.5, 50)]);
  mk('walkE1', 'East sidewalk', [rect(3.5, 1, 5.3, 50)]);
  mk('walkW2', 'North-west sidewalk', [rect(-5.3, -50, -3.5, 1)]);
  mk('walkE2', 'North-east sidewalk', [rect(3.5, -50, 5.3, 1)]);
  mk('street1', 'Maple Lane (south)', [rect(-3.5, 0, 3.5, 50)]);
  mk('street2', 'Maple Lane (north)', [rect(-3.5, -50, 3.5, 0)]);
  mk('north', 'Bakery parking', [pav('north')]);
  mk('plaza', 'Town square', [pav('plaza')]);
  mk('apron', 'Crew yard', [pav('apron')]);

  // 4) ground meshes
  const tile = { asphalt: 4, walk: 1.8, pavers: 2.2, flags: 1.4, cobble: 1.6, apron: 3 };
  const rough = { asphalt: 0.62, walk: 0.85, pavers: 0.8, flags: 0.8, cobble: 0.75, apron: 0.85 };
  const gy = { asphalt: 0, walk: 0.003, apron: 0.003, pavers: 0.006, flags: 0.007, cobble: 0.005 };
  for (const p of PAVED) scene.add(groundPlane(p.r, TEX[p.kind], tile[p.kind], gy[p.kind], rough[p.kind]));
  // safety base under everything
  const base = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0xe9eef5, roughness: 1 }));
  base.rotation.x = -Math.PI / 2; base.position.y = -0.12; scene.add(base);
  // outer snow fields beyond the grid (static)
  const outer = new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.9 });
  for (const [x, w] of [[-24 - 60, 120], [24 + 60, 120]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 300), outer); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.43, 0); m.receiveShadow = true; scene.add(m); }
  for (const z of [-68 - 60, 68 + 60]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(48, 120), outer); m.rotation.x = -Math.PI / 2; m.position.set(0, 0.43, z); m.receiveShadow = true; scene.add(m); }
  // road markings
  const yel = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.6 }), wht = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.6 });
  const marks = [];
  for (let z = -48; z < 48; z += 6) { const g = new THREE.PlaneGeometry(0.16, 3); g.rotateX(-Math.PI / 2); g.translate(0, 0.006, z + 1.5); marks.push(g); }
  const ym = new THREE.Mesh(mergeGeoms(marks), yel); ym.receiveShadow = true; scene.add(ym);
  const wl = [];
  for (const x of [-3.25, 3.25]) { const g = new THREE.PlaneGeometry(0.12, 100); g.rotateX(-Math.PI / 2); g.translate(x, 0.006, 0); wl.push(g); }
  const wm = new THREE.Mesh(mergeGeoms(wl), wht); wm.receiveShadow = true; scene.add(wm);
  // curbs
  const curbM = new THREE.MeshStandardMaterial({ color: 0xc4c7cb, roughness: 0.8 });
  const cg = [];
  for (const x of [-3.5, 3.5]) { const g = new THREE.BoxGeometry(0.16, 0.08, 100); g.translate(x, 0.04, 0); cg.push(g); }
  const curb = new THREE.Mesh(mergeGeoms(cg.map(g => g.toNonIndexed())), curbM); curb.receiveShadow = true; scene.add(curb);

  // 5) houses
  for (const L of LOTS) {
    const s = artScene(L.model); const bb = new THREE.Box3().setFromObject(s);
    const depth = (bb.max.z - bb.min.z) * L.s;
    const front = 12.0;
    // model +Z front: after rotation facing the street, front face sits at x = side*front
    const cx = L.side * (front + bb.max.z * L.s);
    const rot = L.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    const o = place(L.model, cx, L.c, rot, L.s, 0);
    // per-instance window materials
    const wins = [];
    o.traverse(c => {
      if (!c.isMesh) return;
      const m = c.material;
      if (m && m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.1) {
        const nm = m.clone(); nm.userData = {}; xray(nm); nm.userData.lit = { color: m.color.clone(), emissive: m.emissive.clone() };
        nm.color.setRGB(0.16, 0.2, 0.27); nm.emissive.setRGB(0, 0, 0); nm.emissiveIntensity = 0; c.material = nm; wins.push(nm);
      }
    });
    scene.add(o);
    const house = { lot: L, obj: o, wins, lit: 0, litT: 0, door: new V3(L.side * (front - 0.3), 0, L.c), smoke: null, x: cx, z: L.c };
    if (L.smoke) { const v = new V3(L.smoke[0], L.smoke[1], L.smoke[2]).multiplyScalar(L.s); v.applyEuler(new THREE.Euler(0, rot, 0)); house.smoke = v.add(new V3(cx, 0, L.c)); }
    L.house = house; WORLD.houses.push(house);
    // warm window light pool (fades in when lit)
    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24), new THREE.MeshBasicMaterial({ map: TEX.dot, color: 0xff8a2a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(L.side * (front - 1.0), 0.52, L.c); pool.scale.set(1.0, 1.5, 1); pool.renderOrder = 1; scene.add(pool); house.pool = pool;
    // parked car (blocked cells + snow cap)
    if (L.car) {
      const carX = L.side * 12.0, carZ = L.c + 7;
      const car = place(L.car, carX, carZ, L.side < 0 ? Math.PI / 2 : -Math.PI / 2, 1, 0);
      scene.add(car); car.updateMatrixWorld(true);
      const cb = new THREE.Box3().setFromObject(car), ab = new THREE.Box3().setFromObject(artScene(L.car));
      const cw = ab.max.x - ab.min.x, cl = ab.max.z - ab.min.z, chh = Math.min(2.2, ab.max.y);
      const cap = makeSnowCap(cw, cl, chh);
      cap.position.set((cb.min.x + cb.max.x) / 2, 0, (cb.min.z + cb.max.z) / 2); cap.rotation.y = car.rotation.y; scene.add(cap);
      const fx0 = cb.min.x + 0.12, fx1 = cb.max.x - 0.12, fz0 = cb.min.z + 0.12, fz1 = cb.max.z - 0.12;
      SNOW.paint(fx0, fz0, fx1, fz1, (k) => { if (T[k] === 1) { T[k] = 2; H[k] = 0; } });
      WORLD.cars.push({ obj: car, cap, lot: L, x: carX, z: carZ, rot: car.rotation.y, state: 'parked', fx0, fx1, fz0, fz1 });
    }
  }
  // 6) bakery + crew kiosk + plaza
  const bak = place('bakery', 0, -62.2, 0, 2.0, 0); scene.add(bak);
  const bakWins = []; bak.traverse(c => { if (c.isMesh && c.material.emissive && c.material.emissive.r > 0.1) { const nm = c.material.clone(); nm.userData = {}; xray(nm); nm.userData.lit = { color: nm.color.clone(), emissive: nm.emissive.clone() }; nm.color.setRGB(0.16, 0.2, 0.27); nm.emissive.setRGB(0, 0, 0); c.material = nm; bakWins.push(nm); } });
  WORLD.bakery = { obj: bak, wins: bakWins, lit: 0, litT: 0, door: new V3(0, 0, -58.9), smoke: null, x: 0, z: -62.2 };
  const kiosk = place('kiosk', 12.6, 54.6, -Math.PI / 2, 1.2, 0); scene.add(kiosk);
  WORLD.kiosk = kiosk;
  const crewSign = makeSign('SNOW CREW', '#2a6fd6'); crewSign.position.set(12.4, 5.6, 56.6); crewSign.rotation.x = -0.25; crewSign.scale.setScalar(1.5); scene.add(crewSign);
  // plaza
  const tree = place('xmastree', 12.0, -10, 0, 2.6, 0); scene.add(tree);
  const tm = []; tree.traverse(c => { if (c.isMesh && c.material.emissive && (c.material.emissive.r + c.material.emissive.g) > 0.05) { const nm = c.material.clone(); nm.userData = {}; xray(nm); nm.userData.lit = { e: nm.emissive.clone(), i: nm.emissiveIntensity }; nm.emissiveIntensity = 0; c.material = nm; tm.push(nm); } });
  WORLD.tree = { obj: tree, mats: tm, lit: 0 };
  SNOW.paint(10.6, -11.4, 13.4, -8.6, (k) => { if (T[k] === 1) { T[k] = 2; H[k] = 0; } });
  decor('bench_a', 12, -5.2, Math.PI, 1, 0); decor('bench_a', 12, -14.8, 0, 1, 0);
  decor('bench_a', 7.2, -10, Math.PI / 2, 1, 0);
  SNOW.paint(11, -5.6, 13, -4.8, k => { if (T[k] === 1) { T[k] = 2; H[k] = 0; } });
  SNOW.paint(11, -15.2, 13, -14.4, k => { if (T[k] === 1) { T[k] = 2; H[k] = 0; } });
  SNOW.paint(6.8, -11, 7.6, -9, k => { if (T[k] === 1) { T[k] = 2; H[k] = 0; } });
  const cocoa = place('cocoa', 15.8, -18.6, -Math.PI / 4, 1.2, 0); scene.add(cocoa);
  SNOW.paint(13.6, -20.8, 17.5, -16.4, k => { if (T[k] === 1) { T[k] = 2; H[k] = 0; } });
  // 7) melters
  WORLD.melters.push(makeMelter(-4.2, 55.4, 0.4));
  WORLD.melters.push(makeMelter(7.3, -1.6, -Math.PI * 0.5));
  WORLD.melters.push(makeMelter(7.4, -55.6, -Math.PI * 0.6));
  for (const M of WORLD.melters) {
    SNOW.paint(M.x - 1.35, M.z - 1.35, M.x + 1.35, M.z + 1.35, (k, x, z) => { if ((x - M.x) ** 2 + (z - M.z) ** 2 < 1.9 && T[k] === 1) { T[k] = 2; H[k] = 0; } });
    // zone center: offset toward the road
    if (M.z > 50) M.zone.set(M.x + 2.6, 0, M.z - 0.4); else M.zone.set(M.x + (M.x < 0 ? 2.4 : -2.4), 0, M.z);
    M.ring.position.set(M.zone.x, 0.025, M.zone.z); M.ring.scale.setScalar(M.r * 2);
    M.pool.position.set(M.zone.x, 0.03, M.zone.z);
    SNOW.paint(M.zone.x - 2.1, M.zone.z - 2.1, M.zone.x + 2.1, M.zone.z + 2.1, (k, x, z) => { if ((x - M.zone.x) ** 2 + (z - M.zone.z) ** 2 < 4.2 && T[k] === 1) { T[k] = 3; H[k] = 0; SNOW.A[k] = 0; } });
  }
  // 8) decor: fences, lamps, mailboxes, trees, snowmen
  const yardY = (x, z) => SNOW.depth(x, z) - 0.06;
  for (const L of LOTS) {
    const sx = L.side, fx = sx * 5.62;
    const z0 = L.c - 10.8, z1 = L.c + 10.8;
    const gaps = [[L.drive.z0 - 0.2, L.drive.z1 + 0.2], [L.path.z0 - 0.3, L.path.z1 + 0.3]];
    for (let z = z0; z < z1 - 0.5; z += 2.0) {
      const zc = z + 1.0; if (gaps.some(g => zc + 1.0 > g[0] && zc - 1.0 < g[1])) continue;
      decor('picket', fx, zc, Math.PI / 2, 1, yardY(fx + sx * 0.2, zc));
    }
    // mailbox by the driveway
    decor('mailbox', sx * 6.05, L.drive.z0 - 0.55, sx < 0 ? Math.PI / 2 : -Math.PI / 2, 0.78, yardY(sx * 6.1, L.drive.z0 - 0.55));
    // trees between lots and behind
    const r = mulberry(L.c * 7 + sx * 13 + 100);
    const kinds = ['fir_a', 'fir_b', 'fir_c', 'spruce_s', 'fir_a', 'birch'];
    for (let t = 0; t < 6; t++) {
      const tx = sx * (7.5 + r() * 15.5), tz = L.c - (9.4 + r() * 1.3);
      if (Math.abs(tx) < 7) continue;
      const k = kinds[(r() * kinds.length) | 0];
      decor(k, tx, tz, r() * TAU, 0.9 + r() * 0.6, yardY(tx, tz));
    }
    for (let t = 0; t < 3; t++) { const tx = sx * (19.5 + r() * 3.5), tz = L.c - 8 + r() * 16; decor(kinds[(r() * 3) | 0], tx, tz, r() * TAU, 1.1 + r() * 0.7, yardY(tx, tz)); }
  }
  // lamps along sidewalks
  for (let z = -46; z <= 46; z += 15.3) {
    for (const sx of [-1, 1]) {
      const zz = z + (sx > 0 ? 7.6 : 0); if (zz > 49) continue;
      if (LOTS.some(L => L.side === sx && zz > L.drive.z0 - 0.8 && zz < L.drive.z1 + 0.8)) continue;
      if (sx > 0 && zz < 1 && zz > -21) continue;
      const lamp = decor('lamp_a', sx * 6.15, zz, 0, 1.05, yardY(sx * 6.2, zz));
      WORLD.lamps.push(new V3(sx * 6.15, 3.0 + yardY(sx * 6.2, zz), zz));
    }
  }
  // plaza lamps & garlands
  decor('lamp_b', 6.0, -20.2, 0, 1.2, 0); decor('lamp_b', 17.0, 0.4, 0, 1.2, 0); decor('lamp_b', 17.0, -20.2, 0, 1.2, 0);
  decor('garland', 17.2, -10, Math.PI / 2, 1.6, 0.2);
  // apron decor
  decor('saltbin', -9.2, 58.6, 0.2, 1.4, 0.0); decor('shovel_b', 4.2, 59.4, -0.3, 1.1, 0);
  decor('cone', 9.4, 50.6, 0, 1, 0); decor('cone', -9.4, 50.4, 0, 1, 0);
  decor('trailsign', 4.8, 58.8, Math.PI, 1.2, 0);
  // north: barrier to "Pine Street"
  for (let z = -58.5; z <= -50.5; z += 1.4) decor('cone', -9.9, z, 0, 1.1, 0);
  decor('slowsign', -10.6, -54.5, Math.PI / 2, 1.3, yardY(-10.6, -54.5));
  const nextSign = makeSign('PINE ST. SOON', '#5a6b80'); nextSign.position.set(-12.5, 2.4, -54.5); nextSign.rotation.y = Math.PI / 2; nextSign.scale.setScalar(1.6); scene.add(nextSign);
  // yard props (some lots already have a snowman/sled)
  decor('snowman_a', 18.5, 31.0, -1.2, 1.0, yardY(18.5, 31));
  decor('sled', -18.0, 20.2, 0.6, 1.0, yardY(-18, 20.2));
  decor('birdfeeder', -9.0, 32.5, 0.3, 1.0, yardY(-9, 32.5));
  decor('tube', 9.6, 19.0, 0, 1.0, yardY(9.6, 19));
  decor('boulder', -20, -2, 0.4, 1.2, yardY(-20, -2) - 0.3);
  decor('boulder', 21, 2, 1.4, 1.0, yardY(21, 2) - 0.3);
  for (let i = 0; i < 26; i++) { const x = (i % 2 ? 1 : -1) * (13 + (i * 7.3 % 9)), z = -66 + i * 5.1; if (Math.abs(z) < 60 && Math.abs(x) < 17) continue; decor(['fir_a', 'fir_b', 'fir_c'][i % 3], x, z, i, 1.2 + (i % 4) * 0.2, yardY(x, z)); }
  // samples hugging a parked vehicle don't count toward the job (no pixel hunting)
  {
    const N = SNOW.NX, T = SNOW.T, A = SNOW.A, R = 3;
    const near = new Uint8Array(T.length);
    for (const c of WORLD.cars) SNOW.paint(c.fx0 - 0.6, c.fz0 - 0.6, c.fx1 + 0.6, c.fz1 + 0.6, (k) => { if (T[k] === 1) near[k] = 1; });
    for (let k = 0; k < T.length; k++) if (near[k] && A[k] && WORLD.areaByKey && SNOW.areas[A[k]].lot) A[k] = 0;
  }
  flushDecor(scene);
  SNOW.finalizeAreas();
  // 9) snow meshes
  SNOW.buildMeshes(scene);
  // 10) lights
  const hemi = WORLD.hemi = new THREE.HemisphereLight(0x9cc0f0, 0xe0e6f0, 0.6); scene.add(hemi);
  const sun = WORLD.sun = new THREE.DirectionalLight(0xffdcb0, 2.1);
  sun.castShadow = true; const sm = IS_MOBILE ? 1024 : 2048; sun.shadow.mapSize.set(sm, sm);
  const sc = sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 90;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  scene.add(sun); scene.add(sun.target);
  scene.background = TEX.sky;
  scene.fog = new THREE.Fog(0xdce8f4, 42, 120);
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
