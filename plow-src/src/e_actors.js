// ---------- characters, tools, vehicles, player ----------
const MATC = {};
function mcol(hex, r, m, e) {
  const k = hex + ':' + (r || 0.75) + ':' + (m || 0) + ':' + (e || 0);
  if (!MATC[k]) MATC[k] = new THREE.MeshStandardMaterial({ color: hex, roughness: r || 0.75, metalness: m || 0, emissive: e ? hex : 0x000000, emissiveIntensity: e || 0 });
  return MATC[k];
}
const GEO = {};
function geo(k, f) { if (!GEO[k]) GEO[k] = f(); return GEO[k]; }

function ownMats(obj) { obj.traverse(c => { if (c.isMesh) { const m = c.material.clone(); m.userData = {}; m.onBeforeCompile = function () { }; m.customProgramCacheKey = function () { return 'own'; }; c.material = m; } }); return obj; }
function makePerson(o) {
  o = Object.assign({ jacket: 0xe5483c, band: 0xc23a30, pants: 0x2f3c5c, boots: 0x5a3a28, hat: 0xffc53a, brim: 0xf39a2c, pom: 0xffffff, scarf: 0x22b3a4, mitt: 0x45b06a, skin: 0xf6c7a2, scale: 1, hair: null, beard: null, hatOn: true }, o || {});
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const M = (c) => mcol(c, 0.72);
  const leg = geo('leg', () => new THREE.CapsuleGeometry(0.072, 0.12, 4, 10));
  const bootG = geo('boot', () => new THREE.CapsuleGeometry(0.07, 0.07, 4, 10));
  const mk = (g, m, x, y, z) => { const me = new THREE.Mesh(g, m); me.position.set(x, y, z); me.castShadow = true; return me; };
  const legL = new THREE.Group(), legR = new THREE.Group();
  legL.position.set(0.088, 0.3, 0); legR.position.set(-0.088, 0.3, 0);
  for (const L of [legL, legR]) { L.add(mk(leg, M(o.pants), 0, -0.1, 0)); const b = mk(bootG, M(o.boots), 0, -0.235, 0.035); b.rotation.x = Math.PI / 2; L.add(b); body.add(L); }
  const torso = mk(geo('torso', () => new THREE.SphereGeometry(0.22, 18, 14)), M(o.jacket), 0, 0.5, 0); torso.scale.set(1, 1.12, 0.9); body.add(torso);
  const bandG = geo('band', () => new THREE.TorusGeometry(0.205, 0.038, 8, 22));
  for (const y of [0.42, 0.575]) { const b = mk(bandG, M(o.band), 0, y, 0); b.rotation.x = Math.PI / 2; b.scale.set(1, 0.9, 1); body.add(b); }
  const arm = geo('arm', () => new THREE.CapsuleGeometry(0.058, 0.15, 4, 10)), mitt = geo('mitt', () => new THREE.SphereGeometry(0.066, 12, 10));
  const armL = new THREE.Group(), armR = new THREE.Group();
  armL.position.set(0.215, 0.62, 0); armR.position.set(-0.215, 0.62, 0);
  for (const A of [armL, armR]) { A.add(mk(arm, M(o.jacket), 0, -0.1, 0)); A.add(mk(mitt, M(o.mitt), 0, -0.22, 0)); body.add(A); }
  const scarf = mk(geo('scarf', () => new THREE.TorusGeometry(0.13, 0.058, 8, 20)), M(o.scarf), 0, 0.695, 0); scarf.rotation.x = Math.PI / 2; body.add(scarf);
  const tail = new THREE.Group(); tail.position.set(0.09, 0.69, -0.12); body.add(tail);
  tail.add(mk(geo('tail', () => new THREE.BoxGeometry(0.075, 0.22, 0.035)), M(o.scarf), 0, -0.1, 0));
  const head = new THREE.Group(); head.position.set(0, 0.86, 0); body.add(head);
  head.add(mk(geo('head', () => new THREE.SphereGeometry(0.17, 20, 16)), M(o.skin), 0, 0, 0));
  const eye = geo('eye', () => new THREE.SphereGeometry(0.022, 8, 8)), eyeM = mcol(0x1c2230, 0.4);
  head.add(mk(eye, eyeM, 0.06, 0.02, 0.152), mk(eye, eyeM, -0.06, 0.02, 0.152));
  const ch = geo('cheek', () => new THREE.SphereGeometry(0.03, 8, 8)), chM = mcol(0xff8f9c, 0.8);
  const c1 = mk(ch, chM, 0.098, -0.035, 0.13), c2 = mk(ch, chM, -0.098, -0.035, 0.13); c1.scale.z = c2.scale.z = 0.4; head.add(c1, c2);
  head.add(mk(geo('nose', () => new THREE.SphereGeometry(0.026, 8, 8)), mcol(0xf2a080, 0.7), 0, -0.01, 0.17));
  let pom = null;
  if (o.hatOn) {
    const hat = mk(geo('hat', () => new THREE.SphereGeometry(0.178, 18, 10, 0, TAU, 0, Math.PI / 2)), M(o.hat), 0, 0.035, 0); hat.scale.y = 1.05; head.add(hat);
    const brim = mk(geo('brim', () => new THREE.TorusGeometry(0.168, 0.042, 8, 22)), M(o.brim), 0, 0.04, 0); brim.rotation.x = Math.PI / 2; head.add(brim);
    pom = new THREE.Group(); pom.position.set(0, 0.215, 0); head.add(pom);
    pom.add(mk(geo('pom', () => new THREE.SphereGeometry(0.062, 12, 10)), M(o.pom), 0, 0, 0));
  }
  if (o.hair) { const h = mk(geo('bun', () => new THREE.SphereGeometry(0.085, 12, 10)), M(o.hair), 0, 0.13, -0.08); head.add(h); const cap = mk(geo('hcap', () => new THREE.SphereGeometry(0.176, 18, 10, 0, TAU, 0, Math.PI / 2.3)), M(o.hair), 0, 0.01, -0.01); head.add(cap); }
  if (o.beard) { const b = mk(geo('beard', () => new THREE.SphereGeometry(0.12, 12, 10)), M(o.beard), 0, -0.09, 0.07); b.scale.set(1, 0.7, 0.7); head.add(b); }
  if (o._pack) { const bp = mk(geo('backpack', () => new THREE.BoxGeometry(0.26, 0.3, 0.14)), M(o._pack), 0, 0.52, -0.22); body.add(bp); }
  root.scale.setScalar(o.scale);
  return { root, body, legL, legR, armL, armR, head, pom, tail, ph: 0, pomV: new V3(), pomO: new V3(), lastX: 0, lastZ: 0, wave: 0 };
}
function animPerson(P, dt, st) {
  const w = st.walk || 0; P.ph += dt * (3 + 9 * w);
  const s = Math.sin(P.ph);
  P.legL.rotation.x = s * 0.65 * w; P.legR.rotation.x = -s * 0.65 * w;
  P.body.position.y = Math.abs(Math.cos(P.ph)) * 0.04 * w + (st.hop || 0);
  P.body.rotation.x = (st.lean || 0);
  const pose = st.pose || 'idle';
  let aL = 0, aR = 0, zL = -0.12, zR = 0.12;
  if (pose === 'shovel') { aL = -0.95; aR = -0.85; zL = 0.25; zR = -0.25; }
  else if (pose === 'push') { aL = -1.25; aR = -1.25; zL = 0.18; zR = -0.18; }
  else if (pose === 'cheer') { aL = -2.9 + Math.sin(st.t * 14) * 0.15; aR = -2.9 - Math.sin(st.t * 14) * 0.15; zL = -0.35; zR = 0.35; }
  else if (pose === 'wave') { aL = Math.sin(P.ph * 0.5) * 0.1; aR = -2.7; zR = 0.45 + Math.sin(st.t * 11) * 0.45; }
  else { aL = -s * 0.5 * w; aR = s * 0.5 * w; }
  if (st.toss) { const k = Math.sin(clamp(st.toss, 0, 1) * Math.PI); aL += -1.5 * k; aR += -1.5 * k; }
  P.armL.rotation.x = damp(P.armL.rotation.x, aL, 18, dt); P.armR.rotation.x = damp(P.armR.rotation.x, aR, 18, dt);
  P.armL.rotation.z = damp(P.armL.rotation.z, zL, 14, dt); P.armR.rotation.z = damp(P.armR.rotation.z, zR, 14, dt);
  P.head.rotation.x = damp(P.head.rotation.x, pose === 'push' ? 0.12 : 0, 8, dt);
  P.tail.rotation.x = 0.2 + Math.sin(P.ph * 0.5) * 0.15 * (0.3 + w) + w * 0.5;
  // pom-pom spring (follows body motion)
  if (P.pom) {
    const wp = P.root.position, vx = (wp.x - P.lastX) / Math.max(dt, 1e-3), vz = (wp.z - P.lastZ) / Math.max(dt, 1e-3);
    P.lastX = wp.x; P.lastZ = wp.z;
    const k = 120, d = 9;
    P.pomV.x += (-k * P.pomO.x - d * P.pomV.x) * dt - vx * 0.0; P.pomV.y += (-k * P.pomO.y - d * P.pomV.y) * dt - (st.hop ? 0 : 0);
    P.pomO.x += P.pomV.x * dt; P.pomO.y += P.pomV.y * dt;
    P.pom.position.set(P.pomO.x * 0.3, 0.215 + Math.abs(Math.cos(P.ph)) * 0.02 * w, P.pomO.y * 0.3 - 0.02 * w);
  }
}

// ---------- shovel (procedural) ----------
function makeShovel() {
  const g = new THREE.Group();               // pivot at hands
  const blade = new THREE.Group(); g.add(blade);
  const bm = mcol(0xff8a1e, 0.5, 0.1), sm = mcol(0x9aa3ad, 0.35, 0.6), wm = mcol(0xb07a46, 0.7), dm = mcol(0x2c3138, 0.6);
  const bg = new THREE.BoxGeometry(1, 0.3, 0.035, 8, 2, 1);
  const p = bg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getZ(i) + x * x * 0.12); }
  bg.computeVertexNormals();
  const plate = new THREE.Mesh(bg, bm); plate.position.y = 0.15; plate.castShadow = true; blade.add(plate);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(1, 0.03, 0.05), sm); edge.position.set(0, 0.012, 0.01); blade.add(edge);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(1, 0.035, 0.06), bm); lip.position.set(0, 0.3, -0.01); blade.add(lip);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.66, 8), wm); shaft.castShadow = true;
  const grip = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.017, 6, 12), dm);
  g.add(shaft, grip);
  // mini pile on blade
  const pile = new THREE.Mesh(geo('hemi', () => new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2)), mcol(0xf6f9fd, 0.85));
  pile.castShadow = true; blade.add(pile); pile.position.set(0, 0.0, 0.1); pile.scale.set(0.001, 0.001, 0.001);
  return { g, blade, plate, edge, lip, shaft, grip, pile, w: 0.55 };
}
function poseShovel(S, w, toss) {
  // blade on ground ahead of the kid, shaft to hands (hands at local 0,0.44,0.2 in kid frame)
  S.w = w;
  S.blade.scale.x = 1; S.plate.scale.x = w; S.edge.scale.x = w; S.lip.scale.x = w;
  const k = Math.sin(clamp(toss, 0, 1) * Math.PI);
  // toss: lift blade up/back
  const bladeZ = 0.62 - k * 0.25, bladeY = 0 + k * 0.75;
  S.blade.position.set(0, bladeY, bladeZ); S.blade.rotation.x = -k * 1.1;
  const hx = 0, hy = 0.46 + k * 0.22, hz = 0.2 - k * 0.05;
  const bx = 0, by = bladeY + 0.22 + k * 0.1, bz = bladeZ - 0.03;
  const mx = (hx + bx) / 2, my = (hy + by) / 2, mz = (hz + bz) / 2;
  S.shaft.position.set(mx, my, mz);
  const dy = hy - by, dz = hz - bz, len = Math.sqrt(dy * dy + dz * dz);
  S.shaft.scale.y = len / 0.66; S.shaft.rotation.x = Math.atan2(dz, dy);
  S.grip.position.set(hx, hy + 0.04, hz - 0.02); S.grip.rotation.x = -0.4;
}

// ---------- truck shapes (per tier) ----------
const TGEO = {
  pickup: { model: 'pickup', turn: 2.0, off: 0, rear: 2.6, nose: 2.6, halfW: 1.08, bladeZ: 3.25, bladeS: [1.9, 1.7], carve: 3.62, pileZ: 3.75, beacon: [0, 1.95, -0.3], cam: 1 },
  tipper: { model: 'tipper', turn: 1.75, off: 1.97, rear: 3.65, nose: 3.6, halfW: 1.46, bladeZ: 4.62, bladeS: [2.8, 2.0], carve: 5.06, pileZ: 5.2, beacon: [0, 3.25, 3.0], cam: 1.16, tint: 0xf07a12 },
  groomer: { model: 'groomer', turn: 1.5, off: 0.34, rear: 4.45, nose: 4.1, halfW: 2.25, bladeZ: null, carve: 4.5, pileZ: 4.65, beacon: [0, 3.5, 1.9], cam: 1.32, pivot: true },
  // a dump truck with a big rotary blower in front: it throws the snow in a high arc off to the side
  thrower: { model: 'tipper', turn: 1.75, off: 1.97, rear: 3.65, nose: 3.6, halfW: 1.46, bladeZ: null, head: 'rotary', headZ: 4.25, carve: 4.95, pileZ: null, beacon: [0, 3.25, 3.0], cam: 1.2, tint: 0xc8302a },
  // Santa's sleigh with a golden blade (no reindeer needed: it's magic)
  sleigh: { model: 'sleigh', scale: 2.25, turn: 2.35, off: 0, rear: 2.55, nose: 2.5, halfW: 1.3, bladeZ: 2.95, bladeS: [1.7, 1.5], gold: true, carve: 3.4, pileZ: 3.55, beacon: null, cam: 1.15, rider: [0, 1.22, -0.85, 1.2], hover: 1 },
  // ice resurfacer with a spinning sweeper brush in front
  zamboni: { model: 'resurfacer', scale: 1.3, grip: 6.0, turn: 2.0, off: 0.15, rear: 3.25, nose: 2.95, halfW: 1.36, bladeZ: null, head: 'brush', headZ: 3.4, carve: 3.8, pileZ: 3.95, beacon: [0, 3.35, -0.1], cam: 1.18, rider: [0.38, 1.42, 1.05, 1.2] },
};
// ---------- machine attachments (procedural) ----------
function makeRotary() {
  const g = new THREE.Group(), paint = mcol(0xff7a1a, 0.45, 0.25), dark = mcol(0x2c3138, 0.55, 0.3), steel = mcol(0xb4bcc6, 0.3, 0.7), yel = mcol(0xffc23d, 0.5, 0.2);
  const box = (w, h, d, m, x, y, z) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
  // housing (unit width, scaled to the head width): back, roof, sides, cutting lip
  const housing = new THREE.Group(); g.add(housing);
  const hb = (w, h, d, m, x, y, z) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = true; housing.add(me); return me; };
  hb(1, 1.15, 0.12, paint, 0, 0.62, -0.42); hb(1, 0.12, 0.95, paint, 0, 1.2, -0.02); hb(1.02, 0.08, 0.2, steel, 0, 0.05, 0.38);
  const sideL = box(0.1, 1.2, 0.95, paint, 0.5, 0.62, -0.02), sideR = box(0.1, 1.2, 0.95, paint, -0.5, 0.62, -0.02);
  hb(1, 0.1, 0.1, yel, 0, 1.28, 0.42);
  // auger drum with spiral flights
  const drum = new THREE.Group(); drum.position.set(0, 0.55, 0.02); housing.add(drum);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1, 12), dark); core.rotation.z = Math.PI / 2; drum.add(core);
  const fl = new THREE.BoxGeometry(0.05, 0.42, 0.1);
  for (let i = 0; i < 18; i++) { const t = i / 17, a = t * Math.PI * 4; for (const sd of [-1, 1]) { const m = new THREE.Mesh(fl, steel); m.position.set(sd * (0.06 + t * 0.42), Math.cos(a * sd) * 0.24, Math.sin(a * sd) * 0.24); m.rotation.x = a * sd; m.castShadow = true; drum.add(m); } }
  // chute: rises from the roof and bends out to the right side
  const chute = new THREE.Group(); chute.position.set(-0.12, 1.25, -0.25); g.add(chute);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 1.3, 14, 1, true), paint); tube.position.y = 0.6; tube.castShadow = true; chute.add(tube);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.55, 14, 1, true, 0, Math.PI), paint); cap.rotation.z = Math.PI / 2; cap.rotation.y = Math.PI / 2; cap.position.set(-0.18, 1.3, 0); chute.add(cap);
  chute.rotation.z = 0.35;
  const tip = new THREE.Object3D(); tip.position.set(-0.45, 1.35, 0); chute.add(tip);
  return { g, housing, drum, chute, tip, sideL, sideR };
}
function makeBrush() {
  const g = new THREE.Group(), dark = mcol(0x2c3138, 0.6, 0.2), bris = mcol(0xffd34d, 0.85), hood = mcol(0x3a7bd5, 0.45, 0.25), steel = mcol(0xb4bcc6, 0.3, 0.7);
  const housing = new THREE.Group(); g.add(housing);
  const hd = new THREE.Mesh(new THREE.BoxGeometry(1, 0.14, 0.95), hood); hd.position.set(0, 0.98, -0.05); hd.castShadow = true; housing.add(hd);
  const bk = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 0.1), hood); bk.position.set(0, 0.6, -0.48); housing.add(bk);
  const drum = new THREE.Group(); drum.position.set(0, 0.44, 0.02); housing.add(drum);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 12), dark); core.rotation.z = Math.PI / 2; drum.add(core);
  const bg = new THREE.BoxGeometry(1, 0.26, 0.07);
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, m = new THREE.Mesh(bg, i % 2 ? bris : mcol(0xffb020, 0.85)); m.position.set(0, Math.cos(a) * 0.3, Math.sin(a) * 0.3); m.rotation.x = -a; m.castShadow = true; drum.add(m); }
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.95), steel); sideL.position.set(0.5, 0.5, -0.05); g.add(sideL);
  const sideR = sideL.clone(); sideR.position.x = -0.5; g.add(sideR);
  return { g, housing, drum, sideL, sideR };
}
// ---------- player ----------
const PL = {
  x: -6.0, z: 46.4, h: -Math.PI / 2 - 0.15, vx: 0, vz: 0, spd: 0, tool: 'shovel', load: 0,
  scoop: 0, toss: 0, tossCD: 0, full: false, payFlash: 0, fullT: 0, carveRate: 0, moveAmt: 0, blowing: 0,
  sledX: -4.7, sledZ: 46.6, sledH: -Math.PI / 2, sledBump: 0, sledVis: 0, pileVis: 0, celebrate: 0, breathT: 2,
  init(scene) {
    this.scene = scene;
    this.kid = makePerson({});
    scene.add(this.kid.root);
    this.shovel = makeShovel(); this.kid.root.add(this.shovel.g);
    // blower
    this.blowerG = new THREE.Group(); this.kid.root.add(this.blowerG);
    this.blowerM = ownMats(artScene('blower').clone(true)); this.blowerM.traverse(c => { if (c.isMesh) c.castShadow = true; });
    this.blowerG.add(this.blowerM); this.blowerG.position.set(0, 0, 1.18); this.blowerG.visible = false;
    this.blowerRed = []; this.blowerM.traverse(c => { if (c.isMesh && c.material.name === 'red') this.blowerRed.push(c.material); });
    this.shovelMat = new THREE.MeshStandardMaterial({ color: 0xff8a1e, roughness: 0.5, metalness: 0.1 });
    this.shovel.plate.material = this.shovelMat; this.shovel.lip.material = this.shovelMat;
    // sled
    this.sled = new THREE.Group(); scene.add(this.sled);
    this.sledM = ownMats(artScene('sled').clone(true)); this.sledM.traverse(c => { if (c.isMesh) { c.castShadow = true; } });
    this.sled.add(this.sledM); this.sledM.position.z = -0.3;
    const pileMat = new THREE.MeshStandardMaterial({ color: 0xe9eff8, roughness: 0.85, normalMap: SNOW.mat.normalMap, normalScale: new THREE.Vector2(1.2, 1.2) });
    this.mound = new THREE.Mesh(geo('hemi', () => new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2)), pileMat);
    this.mound.castShadow = true; this.sled.add(this.mound); this.mound.position.set(0, 0.33, -0.05);
    const rg = new THREE.BufferGeometry().setFromPoints([new V3(), new V3()]);
    this.rope = new THREE.Line(rg, new THREE.LineBasicMaterial({ color: 0x6b4a2e })); this.rope.frustumCulled = false; scene.add(this.rope);
    // trucks (one model per tier, only the current one visible)
    this.truck = new THREE.Group(); scene.add(this.truck); this.truck.visible = false;
    this.truckMs = {};
    for (const k in TGEO) {
      const G = TGEO[k], m = ownMats(artScene(G.model).clone(true));
      m.traverse(c => { if (c.isMesh) { c.castShadow = true; if (G.tint && c.material.name === 'paint') c.material.color.setHex(G.tint); } });
      if (G.scale) m.scale.setScalar(G.scale);
      if (G.rotY) m.rotation.y = G.rotY;
      m.position.z = G.off; m.visible = false; this.truck.add(m); this.truckMs[k] = m;
    }
    // attachments: rotary blower head, sweeper brush, a driver for open machines
    this.rotary = makeRotary(); this.truck.add(this.rotary.g); this.rotary.g.visible = false;
    this.brush = makeBrush(); this.truck.add(this.brush.g); this.brush.g.visible = false;
    this.rider = makePerson({}); this.truck.add(this.rider.root); this.rider.root.visible = false;
    this.truckM = this.truckMs.pickup;
    this.bladeG = new THREE.Group(); this.truck.add(this.bladeG);
    this.bladeM = ownMats(artScene('blade').clone(true)); this.bladeM.traverse(c => { if (c.isMesh) c.castShadow = true; });
    this.bladeG.add(this.bladeM); this.bladeG.position.set(0, 0.05, 3.25);
    this.bladeMats = []; this.bladeM.traverse(c => { if (c.isMesh) this.bladeMats.push({ m: c.material, c: c.material.color.clone(), r: c.material.roughness, mt: c.material.metalness }); });
    this.pile = new THREE.Mesh(geo('hemi2', () => { const g = new THREE.SphereGeometry(1, 20, 12, 0, TAU, 0, Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = 1 + 0.08 * Math.sin(x * 9 + z * 7) * Math.cos(z * 5 - x * 3) * (y > 0.05 ? 1 : 0); p.setXYZ(i, x * n, y * n, z * n); } g.computeVertexNormals(); return g; }), pileMat);
    this.pile.castShadow = true; this.pile.receiveShadow = true; this.truck.add(this.pile); this.pile.scale.set(0.001, 0.001, 0.001);
    // beacon light on the truck roof
    this.beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffa020 })); this.beacon.position.set(0, 1.95, -0.3); this.truck.add(this.beacon);
    this.applyTool();
  },
  get kind() { return TIER[this.tool].kind; },
  get geo() { return TGEO[TIER[this.tool].geo || 'pickup']; },
  stats() { return GAME.stats(this.tool); },
  applyTool() {
    this._bwF = null; this._path = null;
    const t = this.tool, k = this.kind, st = this.stats();
    const walking = k !== 'truck';
    this.kid.root.visible = walking; this.sled.visible = walking; this.rope.visible = walking;
    this.shovel.g.visible = k === 'shovel'; this.blowerG.visible = k === 'blower';
    this.truck.visible = k === 'truck';
    if (k === 'shovel') { this.shovelMat.color.setHex(t === 'bigshovel' ? 0x2f8cff : 0xff8a1e); }
    if (k === 'blower') {
      const mega = t === 'megablower', sc = mega ? 0.9 : 0.82;
      this.blowerM.scale.set(st.w / 0.8, sc, sc); this.blowerG.position.z = 1.17 * sc + 0.22; this.blowerOff = this.blowerG.position.z + 0.8 * sc + 0.06; this.blowerS = sc;
      for (const m of this.blowerRed) m.color.setHex(mega ? 0x2f6fe8 : 0xd1211c);
    }
    if (k === 'truck') {
      const G = this.geo;
      for (const key in this.truckMs) this.truckMs[key].visible = TGEO[key] === G;
      this.truckM = this.truckMs[Object.keys(TGEO).find(key => TGEO[key] === G)];
      this.bladeG.visible = G.bladeZ !== null;
      if (G.bladeZ !== null) { this.bladeG.position.z = G.bladeZ; this.bladeM.scale.set(st.w / 1.06, G.bladeS[0], G.bladeS[1]); }
      for (const b of this.bladeMats) {
        if (G.gold) { b.m.color.setHex(0xffc83a); b.m.metalness = 0.75; b.m.roughness = 0.28; if (b.m.emissive) { b.m.emissive.setHex(0x7a4a00); b.m.emissiveIntensity = 0.5; } }
        else { b.m.color.copy(b.c); b.m.metalness = b.mt; b.m.roughness = b.r; if (b.m.emissive) b.m.emissive.setHex(0); }
      }
      this.rotary.g.visible = G.head === 'rotary'; this.brush.g.visible = G.head === 'brush';
      const Hd = G.head === 'rotary' ? this.rotary : G.head === 'brush' ? this.brush : null;
      if (Hd) { Hd.g.position.set(0, 0, G.headZ); Hd.housing.scale.x = st.w; Hd.sideL.position.x = st.w / 2; Hd.sideR.position.x = -st.w / 2; }
      this.rider.root.visible = !!G.rider;
      if (G.rider) { this.rider.root.position.set(G.rider[0], G.rider[1], G.rider[2]); this.rider.root.scale.setScalar(G.rider[3] || 1); }
      this.beacon.visible = !!G.beacon;
      if (G.beacon) this.beacon.position.set(G.beacon[0], G.beacon[1], G.beacon[2]);
    }
    const bonus = { shovel: 0, bigshovel: 0.15, blower: 0.3, megablower: 0.5 }[t] || 0;
    const sc = clamp(0.8 + GAME.L(t)[1] * 0.1 + bonus, 0.8, 2.0);
    this.sledScale = walking ? sc : 1; this.sled.scale.setScalar(this.sledScale);
  },
  setTool(t, silent) {
    if (t === this.tool) return;
    if (this.load > 0.3) this.payout(true);
    const was = this.tool, wasK = TIER[was].kind, newK = TIER[t].kind;
    if (newK === 'truck') {
      this.tool = t;
      // find a spot for the truck near the player (on a walkable lane)
      if (wasK !== 'truck' || !this.truckFree(this.x, this.z, this.h)) { const spot = this.findTruckSpot(this.x, this.z); this.x = spot.x; this.z = spot.z; this.h = spot.h; }
      this.spd = 0;
    } else if (wasK === 'truck') {
      // drop the kid beside the truck on a walkable cell
      const sx = Math.cos(this.h), sz = -Math.sin(this.h), hw = this.geo.halfW;
      let ok = null;
      for (const d of [hw + 0.6, -(hw + 0.6), hw + 1.3, -(hw + 1.3), hw + 2.2, -(hw + 2.2)]) { const x = this.x + sx * d, z = this.z + sz * d; if (this.kidFree(x, z)) { ok = { x, z }; break; } }
      if (!ok) ok = { x: this.x, z: this.z };
      this.x = ok.x; this.z = ok.z; this.sledX = this.x - Math.sin(this.h) * 1.4; this.sledZ = this.z - Math.cos(this.h) * 1.4;
    }
    this.tool = t; this.applyTool();
    if (!silent) { FX.puff(this.x, 0.5, this.z, 14, 1.4); AUD.newTool && AUD.click(); }
  },
  findTruckSpot(x, z) {
    // nearest spot on the street (or the two end lots) where the current truck fits
    let h0 = this.h; if (Math.abs(Math.sin(h0)) > 0.7) h0 = z > 0 ? Math.PI : 0;
    let best = null, bd = 1e9;
    let cand = CH.truckSpots ? CH.truckSpots() : null;
    if (!cand) { cand = []; for (let dz = -30; dz <= 30; dz += 1.5) for (let dx = -30; dx <= 30; dx += 1.5) cand.push([x + dx, z + dz]); }
    for (const [xx, zz] of cand) {
      const d = (xx - x) ** 2 + (zz - z) ** 2; if (d >= bd) continue;
      for (const hh of [h0, h0 + Math.PI, Math.PI / 2, -Math.PI / 2]) if (this.truckFree(xx, zz, hh)) { bd = d; best = { x: xx, z: zz, h: hh }; break; }
    }
    return best || { x: 0, z: 30, h: Math.PI };
  },
  kidFree(x, z) {
    const r = 0.24;
    return SNOW.walk(x, z) && SNOW.walk(x + r, z) && SNOW.walk(x - r, z) && SNOW.walk(x, z + r) && SNOW.walk(x, z - r);
  },
  blowerFree(x, z, h) {
    const fx = Math.sin(h), fz = Math.cos(h), rx = fz, rz = -fx, w = this.stats().w * 0.5 - 0.05;
    const px = x + fx * 2.0, pz = z + fz * 2.0;
    return SNOW.walk(px + rx * w, pz + rz * w) && SNOW.walk(px - rx * w, pz - rz * w) && SNOW.walk(x + fx * 1.0, z + fz * 1.0);
  },
  // how a pose sits: Infinity = hits something hard (house, fence, post, car, tree) or leaves the map;
  // otherwise the number of wheel/body points that are off the paved ground (hanging over a snowy lawn)
  poseBad(x, z, h) {
    const G = this.geo, fx = Math.sin(h), fz = Math.cos(h), rx = fz, rz = -fx, hw = G.halfW, T = SNOW.T;
    const bw = this._bwF != null ? this._bwF : (this._bwF = Math.max(hw, this.stats().w * 0.5 - 0.4)), bz = G.carve - 0.12, P = this._pts || (this._pts = []);
    P.length = 0;
    P.push(hw - 0.03, -G.rear, -hw + 0.03, -G.rear, hw, 0, -hw, 0, hw, -G.rear * 0.5, -hw, -G.rear * 0.5, hw, G.nose, -hw, G.nose, 0, G.carve);
    let off = 0;
    for (let i = 0; i < P.length; i += 2) {
      const k = SNOW.idx(x + rx * P[i] + fx * P[i + 1], z + rz * P[i] + fz * P[i + 1]);
      if (k < 0) return Infinity; const t = T[k]; if (t === 2) return Infinity; if (t === 0) off++;
    }
    const B = [bw, -bw, bw * 0.5, -bw * 0.5, hw, -hw];
    for (const a of B) if (SNOW.solid(x + rx * a + fx * bz, z + rz * a + fz * bz)) return Infinity;
    return off;
  },
  // a truck may hang one corner over the snowy lawn (like a real plow cutting a corner); never into anything solid.
  // _tol is raised only while backing out of a spot that has no other way out
  truckFree(x, z, h) { return this.poseBad(x, z, h) <= (this._tol != null ? this._tol : 1); },
  // after an upgrade (wider blade) or a tool change the machine may overlap something: move it to the nearest free spot
  ensureFree() {
    if (this.kind !== 'truck' || this.truckFree(this.x, this.z, this.h)) return;
    if (this._path && this.poseBad(this.x, this.z, this.h) <= (this._path.loose ? 4 : 2)) return;
    for (let r = 0.15; r <= 3.2; r += 0.15) for (const dh of [0, 0.25, -0.25, 0.5, -0.5]) for (let k = 0; k < 16; k++) {
      const ang = k / 16 * TAU, x = this.x + Math.sin(ang) * r, z = this.z + Math.cos(ang) * r;
      if (this.truckFree(x, z, this.h + dh)) { this.x = x; this.z = z; this.h += dh; return; }
    }
    const s = this.findTruckSpot(this.x, this.z); this.x = s.x; this.z = s.z; this.h = s.h;
  },
  // ---- main update ----
  update(dt, inp) {
    this._bwF = null;
    const st = this.stats(); const t = this.kind;
    if (this.h > Math.PI * 4 || this.h < -Math.PI * 4) this.h = Math.atan2(Math.sin(this.h), Math.cos(this.h));
    this.full = false;
    let mvx = inp.x, mvz = -inp.y, mag = Math.min(1, Math.hypot(mvx, mvz));
    if (mag > 0.001) { mvx /= mag; mvz /= mag; }
    if (mag < 0.12) mag = 0;
    let removed = 0;
    if (t !== 'truck') removed = this._walk(dt, st, mvx, mvz, mag);
    else removed = this._drive(dt, st, mvx, mvz, mag);
    this.carveRate = damp(this.carveRate, removed / Math.max(dt, 1e-3), 10, dt);
    // a full sled / blade turns into coins right away (no trips to a melter)
    if (this.load >= st.cap - 0.01) this.payout();
    this._visuals(dt, st);
  },
  _walk(dt, st, mx, mz, mag) {
    const isB = this.kind === 'blower';
    let sp = st.spd;
    const tvx = mx * sp * mag, tvz = mz * sp * mag;
    const acc = mag > 0 ? 20 : 26;
    this.vx = damp(this.vx, tvx, acc * 0.5, dt); this.vz = damp(this.vz, tvz, acc * 0.5, dt);
    const v = Math.hypot(this.vx, this.vz);
    // face the stick direction (works even when blocked, so you can always turn around)
    if (mag > 0) this.h = dampAng(this.h, Math.atan2(mx, mz), isB ? 7.5 : 14, dt);
    else if (v > 0.25) this.h = dampAng(this.h, Math.atan2(this.vx, this.vz), isB ? 7 : 13, dt);
    // move with sliding
    const ok = (x, z) => this.kidFree(x, z);
    // never stand wedged in a lawn corner (it happens right on cell edges): step to the nearest free spot
    if (!ok(this.x, this.z)) {
      outer: for (let r = 0.06; r <= 0.66; r += 0.06) for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, x = this.x + Math.sin(a) * r, z = this.z + Math.cos(a) * r; if (ok(x, z)) { this.x = x; this.z = z; break outer; } }
    }
    const nx = this.x + this.vx * dt, nz = this.z + this.vz * dt;
    if (ok(nx, nz)) { this.x = nx; this.z = nz; }
    else if (ok(nx, this.z)) { this.x = nx; this.vz *= 0.5; }
    else if (ok(this.x, nz)) { this.z = nz; this.vx *= 0.5; }
    else {
      // round the corner: try the move turned a little left / right, like sliding along a wall
      let moved = false;
      if (v > 0.05) for (const da of [0.45, -0.45, 0.9, -0.9, 1.35, -1.35]) {
        const c = Math.cos(da), sn = Math.sin(da), wx = (this.vx * c - this.vz * sn) * dt * 0.85, wz = (this.vx * sn + this.vz * c) * dt * 0.85;
        if (ok(this.x + wx, this.z + wz)) { this.x += wx; this.z += wz; moved = true; break; }
      }
      if (!moved) { this.vx *= 0.3; this.vz *= 0.3; }
    }
    this.moveAmt = clamp(v / st.spd, 0, 1);
    // carve
    let removed = 0;
    const fx = Math.sin(this.h), fz = Math.cos(this.h);
    const off = isB ? (this.blowerOff || 1.9) : 0.66 + (st.w > 0.9 ? 0.06 : 0), hl = isB ? 0.2 : 0.16;
    const cx = this.x + fx * off, cz = this.z + fz * off;
    // (a jump - a new tool, a reload, being moved to a free spot - starts a fresh stroke instead of a line from the old spot)
    if (this._lastCx !== undefined && Math.hypot(cx - this._lastCx, cz - this._lastCz) > 1.5) this._lastCx = this._lastCz = undefined;
    if (!this.full && v > 0.15) {
      const steps = this._lastCx === undefined ? 1 : Math.min(6, Math.ceil(Math.hypot(cx - this._lastCx, cz - this._lastCz) / 0.15));
      for (let s = 1; s <= steps; s++) {
        const px = this._lastCx === undefined ? cx : lerp(this._lastCx, cx, s / steps), pz = this._lastCz === undefined ? cz : lerp(this._lastCz, cz, s / steps);
        const r = SNOW.carve(px, pz, fx, fz, st.w * 0.5 + 0.05, hl, st.cap - this.load, this._co || (this._co = {}));
        if (r > 0) { this.load += r; removed += r; }
      }
    }
    this._lastCx = cx; this._lastCz = cz;
    if (removed > 0) {
      const rx = fz, rz = -fx;
      if (this.kind === 'shovel') {
        this.scoop += removed;
        if (Math.random() < 0.6) FX.spray(cx + rx * st.w * 0.5 * (Math.random() < 0.5 ? 1 : -1), 0.25, cz, fx * 0.5 + rx * rnd(-1, 1), fz * 0.5 + rz * rnd(-1, 1), 2, 2.2, 0.1);
        const tq = 0.55 + st.cap * 0.02;
        if (this.scoop >= tq && this.toss <= 0) { this._doToss(this.scoop); this.scoop = 0; }
      } else {
        this.blowing = 1;
        // stream from chute into the sled
        const n = Math.min(7, 2 + removed * 36);
        const bs = this.blowerS || 0.82; const ch = this.blowerG.localToWorld(this._v1.set(0.05 * st.w, 1.46 * bs, 0.37 * bs));
        // the stream arcs out to the chute side and back into the sled, so it never hides the kid
        const side = 0.55 + st.w * 0.25;
        for (let i = 0; i < n; i++) {
          const T = rnd(0.5, 0.7), tx = this.sledX + rnd(-0.25, 0.25), tz = this.sledZ + rnd(-0.4, 0.4), ty = 0.6;
          const v0 = 4 * side / T, a = -8 * side / (T * T);
          FX.emit(FX.norm, { x: ch.x, y: ch.y, z: ch.z, vx: (tx - ch.x) / T + rx * v0 + rnd(-0.3, 0.3), vy: (ty - ch.y) / T + 0.5 * 9 * T + rnd(-0.3, 0.3), vz: (tz - ch.z) / T + rz * v0 + rnd(-0.3, 0.3), ax: rx * a, az: rz * a, gr: 9, life: T, s0: rnd(0.14, 0.26), s1: 0.3, a0: 1, a1: 0.8, c: [0.96, 0.975, 1] });
        }
        if (Math.random() < 0.5) FX.spray(cx, 0.3, cz, fx, fz, 1, 1.5, 0.12);
      }
    }
    if (removed === 0) this.blowing = damp(this.blowing, 0, 6, dt);
    return removed;
  },
  _v1: new V3(), _v2: new V3(),
  _doToss(amt) {
    this.toss = 1;
    const b = this.shovel.blade.getWorldPosition(this._v1);
    const sx = this.sledX, sz = this.sledZ;
    const size = clamp(0.1 + amt * 0.06, 0.12, 0.3);
    FX.clump(b.x, b.y + 0.3, b.z, sx, 0.45 + this.sledVis * 0.35, sz, size, 0.34, (x, y, z) => { this.sledBump = 1; FX.puff(x, y, z, 4, 0.5); AUD.plop(); });
    AUD.toss();
  },
  // arcade driving: the machine turns toward your finger right away (tight turns, it slows down while turning hard).
  // A turn is tried around several points along the machine (middle, back, front...) so it squeezes through tight
  // spots; if nothing fits it backs up by itself. Nothing ever needs a manual reverse.
  // last resort when the machine is pinned (every small move hits something): glide to a nearby pose that can move again
  unstick() {
    for (let r = 0.3; r <= 3.9; r += 0.3) for (const dh of [0, 0.3, -0.3, 0.6, -0.6, 1.0, -1.0, 1.6, -1.6]) for (let k = 0; k < 12; k++) {
      const a = k / 12 * TAU, x = this.x + Math.sin(a) * r, z = this.z + Math.cos(a) * r, h = this.h + dh;
      if (!this.truckFree(x, z, h)) continue;
      const fx = Math.sin(h) * 0.35, fz = Math.cos(h) * 0.35;
      if (this.truckFree(x + fx, z + fz, h) || this.truckFree(x - fx, z - fz, h)) { this.glide = { x, z, h, t: 0.3 }; return true; }
    }
    return false;
  },
  // ---- tight spots: plan a short maneuver (forward / reverse arcs, turning on the spot) two moves ahead ----
  // this is what turns "stuck in a corner" into a smooth 3-point turn, for every machine size
  _stepPrim(x, z, h, p, dt, G) {
    // the blade tips sweep fast when turning: split big steps so no thin fence can be jumped over
    const R = Math.hypot(G.carve, this._bwF != null ? this._bwF : G.halfW) + 0.5, disp = Math.abs(p.v || 0) * dt + Math.abs(p.w || 0) * dt * R + Math.abs(p.s || 0) * dt;
    if (disp > 0.16) { const n = Math.ceil(disp / 0.16), d = dt / n; let r = { x, z, h }; for (let i = 0; i < n; i++) { r = this._stepOne(r.x, r.z, r.h, p, d, G); if (!r) return null; } return r; }
    return this._stepOne(x, z, h, p, dt, G);
  },
  _stepOne(x, z, h, p, dt, G) {
    if (p.s) { const nx = x + Math.cos(h) * p.s * dt, nz = z - Math.sin(h) * p.s * dt; return this.truckFree(nx, nz, h) ? { x: nx, z: nz, h } : null; }
    const nh = h + p.w * dt;
    if (p.v === 0) {
      const L0 = -G.rear, L1 = G.carve, s0 = Math.sin(h), c0 = Math.cos(h), s1 = Math.sin(nh), c1 = Math.cos(nh);
      const order = p.pf != null ? [p.pf, 0.5, 0.35, 0.65, 0.2, 0.8, 0.05, 0.95] : [0.5, 0.35, 0.65, 0.2, 0.8, 0.05, 0.95];
      for (const f of order) { const m = L0 + (L1 - L0) * f, rx = x + (s0 - s1) * m, rz = z + (c0 - c1) * m; if (this.truckFree(rx, rz, nh)) { p.pf = f; return { x: rx, z: rz, h: nh }; } }
      return null;
    }
    const hm = h + p.w * dt * 0.5, nx = x + Math.sin(hm) * p.v * dt, nz = z + Math.cos(hm) * p.v * dt;
    return this.truckFree(nx, nz, nh) ? { x: nx, z: nz, h: nh } : null;
  },
  // tight spots: search a short sequence of moves (forward / reverse arcs, turning on the spot), like a driver doing a
  // 3-point turn or backing up to steer around a post. mode 'turn' = end up facing the stick with room ahead,
  // mode 'go' = also get a few metres toward it. Cheap (a few ms), done once per spot, then followed.
  _detour(want, sx, sz, st, G, mode) {
    const turn = G.turn || 1.8, vf = Math.min(st.spd * 0.6, 4.6), vr = -Math.min(st.spd * 0.5, 3.2), T = 0.36, SUB = 9, dS = T / SUB;
    // (plus a small sideways shuffle, so a blade wedged next to a post can always wriggle out)
    const P = [{ v: vf, w: turn }, { v: vf, w: 0 }, { v: vf, w: -turn }, { v: vr, w: turn }, { v: vr, w: 0 }, { v: vr, w: -turn }, { v: 0, w: turn }, { v: 0, w: -turn }, { v: 0, w: 0, s: 1.4 }, { v: 0, w: 0, s: -1.4 }];
    const go = mode === 'go', x0 = this.x, z0 = this.z, need = go ? 3.2 : 0, tol = go ? 0.7 : 0.35;
    const key = (x, z, h) => (Math.round(x / 0.6) * 73856093) ^ (Math.round(z / 0.6) * 19349663) ^ ((((Math.round(h / (Math.PI / 10)) % 20) + 20) % 20) * 83492791);
    const prog = (n) => (n.x - x0) * sx + (n.z - z0) * sz;
    const heur = (n) => Math.max(0, need - prog(n)) / vf + Math.max(0, Math.abs(angDiff(n.h, want)) - tol * 0.5) / turn;
    const room = (n) => this.poseBad(n.x, n.z, n.h) <= 1 && this.poseBad(n.x + Math.sin(n.h) * 1.6, n.z + Math.cos(n.h) * 1.6, n.h) <= 1;
    // best-first search on a little binary heap (keeps the worst case a few ms even when there is no way out)
    const H = [], push = (o) => { o.f = o.g + heur(o); H.push(o); let i = H.length - 1; while (i > 0) { const j = (i - 1) >> 1; if (H[j].f <= o.f) break; H[i] = H[j]; i = j; } H[i] = o; };
    const pop = () => { const top = H[0], last = H.pop(); if (H.length) { let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < H.length && H[l].f < (m === i ? last.f : H[m].f)) m = l; if (r < H.length && H[r].f < (m === i ? last.f : H[m].f)) m = r; if (m === i) break; H[i] = H[m]; i = m; } H[i] = last; } return top; };
    push({ x: x0, z: z0, h: this.h, g: 0, p: null, m: null });
    const seen = new Set([key(x0, z0, this.h)]), limit = this._tol ? 260 : 450, t0 = performance.now();
    let n = 0, found = null;
    while (H.length && n < limit) {
      // never hold up a frame for long (slow phones just search a little less)
      if ((n & 15) === 15 && performance.now() - t0 > 7) break;
      const c = pop(); n++;
      if (c.m && prog(c) >= need && Math.abs(angDiff(c.h, want)) < tol && room(c)) { found = c; break; }
      for (const m of P) {
        let x = c.x, z = c.z, h = c.h, ok = true; const q = { v: m.v, w: m.w, s: m.s };
        for (let k = 0; k < SUB; k++) { const r = this._stepPrim(x, z, h, q, dS, G); if (!r) { ok = false; break; } x = r.x; z = r.z; h = r.h; }
        if (!ok) continue;
        const kk = key(x, z, h); if (seen.has(kk)) continue; seen.add(kk);
        const sw = c.m && c.m.v * m.v < 0 ? 0.45 : 0;
        push({ x, z, h, g: c.g + T * (m.s ? 2.2 : m.v < 0 ? 1.5 : m.v === 0 ? 1.15 : 1) + sw, p: c, m: { v: m.v, w: m.w, s: m.s } });
      }
    }
    this._dn = n;
    if (!found) return null;
    const chain = []; for (let c = found; c && c.m; c = c.p) chain.unshift(c);
    const poses = [[x0, z0, this.h, 0]];
    for (const c of chain) {
      let x = c.p.x, z = c.p.z, h = c.p.h; const q = { v: c.m.v, w: c.m.w, s: c.m.s };
      for (let k = 0; k < SUB; k++) { const r = this._stepPrim(x, z, h, q, dS, G); if (!r) break; x = r.x; z = r.z; h = r.h; poses.push([x, z, h, c.m.v]); }
    }
    return { poses, dS, t: 0, loose: false };
  },
  // truly boxed in? (no small move at all is possible: forward, back, turning, shuffling)
  _trapped(G) {
    const t = G.turn || 1.8;
    for (const p of [{ v: 2, w: 0 }, { v: -2, w: 0 }, { v: 0, w: t }, { v: 0, w: -t }, { v: 2, w: t }, { v: 2, w: -t }, { v: -2, w: t }, { v: -2, w: -t }, { s: 1.2 }, { s: -1.2 }]) if (this._stepPrim(this.x, this.z, this.h, p, 0.12, G)) return false;
    return true;
  },
  _findMoves(want, sx, sz, st, G, mode) {
    let p = this._detour(want, sx, sz, st, G, mode);
    if (!p) { this._tol = 3; p = this._detour(want, sx, sz, st, G, mode); this._tol = null; if (p) p.loose = true; }
    return p;
  },
  _followPath(dt, G) {
    const P = this._path, Q = P.poses; P.t += dt;
    const f = P.t / P.dS, i = Math.min(Q.length - 1, Math.floor(f)), j = Math.min(Q.length - 1, i + 1), u = clamp(f - i, 0, 1);
    const A = Q[i], B = Q[j];
    this.x = lerp(A[0], B[0], u); this.z = lerp(A[1], B[1], u); this.h = A[2] + angDiff(A[2], B[2]) * u;
    this.spd = damp(this.spd, B[3], 12, dt);
    if (i >= Q.length - 1) this._path = null;
    return true;
  },
  _drive(dt, st, mx, mz, mag) {
    const G = this.geo;
    if (this.glide) {
      const g = this.glide, k = Math.min(1, dt / g.t); g.t -= dt;
      this.x = lerp(this.x, g.x, k); this.z = lerp(this.z, g.z, k); this.h += angDiff(this.h, g.h) * k; this.spd = 0;
      if (g.t <= 0) { this.x = g.x; this.z = g.z; this.h = g.h; this.glide = null; }
      this.svx = this.svz = 0; this.moveAmt = 0.3;
      return this._bladeCarve(dt, st, G);
    }
    this.ensureFree();
    const x0 = this.x, z0 = this.z, h0 = this.h;
    const want = mag > 0 ? Math.atan2(mx, mz) : this.h;
    const a = angDiff(this.h, want), al = Math.abs(a);
    this._mvx = mx; this._mvz = mz;
    if (this._path) {
      if (mag === 0 || Math.abs(angDiff(this._pathWant, want)) > 0.6) this._path = null;
      else if (this._followPath(dt, G)) return this._afterMove(dt, st, G, x0, z0, h0, mag);
      else this._planCool = 0;
    }
    this._planCool = (this._planCool || 0) - dt;
    // the stick points well away from where the machine faces: plan the turn (a U-turn in the open, a 3-point turn in a tight street)
    // (not on ice: there the old free turning is what makes the lovely drift)
    const onIce = CH.ice && CH.ice(this.x, this.z);
    if (mag > 0 && !(this.escape > 0) && al > 0.75 && this._planCool <= 0 && !onIce) {
      const path = this._findMoves(want, mx, mz, st, G, 'turn');
      if (path) { this._path = path; this._pathWant = want; if (this._followPath(dt, G)) return this._afterMove(dt, st, G, x0, z0, h0, mag); }
      else this._planCool = 0.3;
    }
    const esc = this.escape > 0;
    let target = mag === 0 ? 0 : st.spd * mag * (al < 0.35 ? 1 : al < 1.1 ? 1 - (al - 0.35) * 1.05 : 0.15);
    // (count down to exactly 0: a tiny leftover below zero used to switch the ice slide off for good)
    if (esc) { this.escape = Math.max(0, this.escape - dt); target = -2.6; }
    const acc = target > this.spd ? (this.spd < 0 ? 14 : 7) : 12;
    this.spd += clamp(target - this.spd, -acc * dt, acc * dt);
    const turn = G.turn || 1.8;
    const yaw = mag === 0 ? 0 : clamp(a * 3.4, -turn, turn) * (esc ? 0.7 : 1);
    const nh = this.h + yaw * dt;
    const fx0 = Math.sin(this.h), fz0 = Math.cos(this.h), fx = Math.sin(nh), fz = Math.cos(nh);
    const step = this.spd * dt;
    let moved = false, turned = false;
    const L0 = -G.rear, L1 = G.carve, P = this._piv || (this._piv = [0.5, 0.2, 0.8, 0.35, 0.65, 0.05, 0.95]);
    const pivotPose = (sh, f) => { const m = L0 + (L1 - L0) * f; return [this.x + (fx0 - fx) * m + fz * sh, this.z + (fz0 - fz) * m - fx * sh]; };
    // 1) turn while driving (around whichever point fits); fast sweeps also check the half-way pose (no jumping fences)
    const sweep = Math.abs(yaw * dt) * (Math.hypot(G.carve, this._bwF != null ? this._bwF : G.halfW) + 0.5) + Math.abs(step) > 0.16;
    const halfOK = (rx, rz) => { if (!sweep) return true; const hh = this.h + yaw * dt * 0.5, m = [this.x * 0.5 + (rx + fx * step) * 0.5, this.z * 0.5 + (rz + fz * step) * 0.5]; return this.truckFree(m[0], m[1], hh); };
    if (Math.abs(yaw) > 0.02) {
      outer: for (const sh of [0, 0.12, -0.12]) for (const f of P) {
        const [rx, rz] = pivotPose(sh, f);
        if (this.truckFree(rx + fx * step, rz + fz * step, nh) && halfOK(rx, rz)) { this.x = rx + fx * step; this.z = rz + fz * step; this.h = nh; moved = turned = true; break outer; }
      }
    } else if (this.truckFree(this.x + fx0 * step, this.z + fz0 * step, this.h)) { this.x += fx0 * step; this.z += fz0 * step; moved = true; }
    // 2) roughly the right way but the turn does not fit: keep driving straight / slide along the edge (keeps speed)
    if (!moved && (al < 0.9 || esc || mag === 0)) {
      if (this.truckFree(this.x + fx0 * step, this.z + fz0 * step, this.h)) { this.x += fx0 * step; this.z += fz0 * step; moved = true; }
      // blocked straight ahead (e.g. a wide blade brushing a stall or a post): ease sideways toward the side that opens up
      if (!moved && mag > 0 && !esc && this.spd >= -0.1) {
        const rx = fz0, rz = -fx0, look = Math.max(Math.abs(step), 0.05) * 4;
        let side = 0;
        for (const d of [0.4, 0.8, 1.3, 1.9, 2.6]) {
          if (this.truckFree(this.x + fx0 * look + rx * d, this.z + fz0 * look + rz * d, this.h)) { side = 1; break; }
          if (this.truckFree(this.x + fx0 * look - rx * d, this.z + fz0 * look - rz * d, this.h)) { side = -1; break; }
        }
        if (side) {
          const sh = side * clamp(Math.abs(step), 0.05, 0.14), nx = this.x + rx * sh, nz = this.z + rz * sh;
          if (this.truckFree(nx, nz, this.h)) { this.x = nx; this.z = nz; this.spd = Math.max(this.spd * 0.95, 1.0); moved = true; }
        }
      }
      // slide along an edge (only when that really goes somewhere: no invisible creeping)
      if (moved) { }
      else if (Math.abs(fx0) > 0.3 && this.truckFree(this.x + fx0 * step, this.z, this.h)) { this.x += fx0 * step; this.spd *= 0.9; moved = true; }
      else if (Math.abs(fz0) > 0.3 && this.truckFree(this.x, this.z + fz0 * step, this.h)) { this.z += fz0 * step; this.spd *= 0.9; moved = true; }
    }
    // 3) facing the wrong way (or blocked): turn on the spot, sliding a little sideways toward open space if needed
    if (!moved && Math.abs(yaw) > 0.02) {
      const hh = this.h + yaw * dt * 0.5;
      outer2: for (const sh of [0, 0.12, -0.12, 0.25, -0.25, 0.4, -0.4]) for (const f of P) {
        const [rx, rz] = pivotPose(sh, f);
        if (this.truckFree(rx, rz, nh) && (!sweep || this.truckFree((this.x + rx) * 0.5, (this.z + rz) * 0.5, hh))) { this.x = rx; this.z = rz; this.h = nh; this.spd *= 0.6; turned = true; break outer2; }
      }
    }
    if (!moved && !turned) { if (Math.abs(this.spd) > 2.5) { CAM.shake = 0.2; AUD.thump(); } this.spd = 0; }
    const blocked = mag > 0 && !turned && (al >= 0.9 || !moved);
    // never stuck: when pushing but blocked, wiggle free; if that fails, back up a little so the turn fits
    // stuck = pushing the stick but not getting anywhere along it (measured, so slow creeping counts too)
    const crawl = mag > 0.5 && al < 0.9 && (this._progRate == null ? 1 : this._progRate) < 0.35 && !(CH.ice && CH.ice(this.x, this.z));
    if (mag > 0 && !esc && (blocked || crawl || (Math.abs(this.spd) < 0.25 && al < 0.6))) {
      this.stuckT = (this.stuckT || 0) + dt;
      const D = this._dtry;
      // one search per spot / stick direction (it is cheap, but no need to repeat it every frame)
      if (this.stuckT > 0.2 && (!D || Math.abs(angDiff(D.w, want)) > 0.5 || Math.hypot(D.x - this.x, D.z - this.z) > 1.2)) {
        this._dtry = { w: want, x: this.x, z: this.z };
        const path = this._findMoves(want, mx, mz, st, G, 'go');
        if (path) { this._path = path; this._pathWant = want; this.stuckT = 0; }
      }
      // backing up only helps when a turn is needed (pushing straight into a wall just stops)
      if (this.stuckT > 0.7) { if (al > 0.5) this.escape = 0.6; this.stuckT = 0; }
    } else if (!esc) this.stuckT = 0;
    return this._afterMove(dt, st, G, x0, z0, h0, mag);
  },
  _afterMove(dt, st, G, x0, z0, h0, mag) {
    // ice: the machine keeps sliding the way it was going; grip pulls it back in line (the ice machine grips best)
    const dt1 = Math.max(dt, 1e-3);
    if (CH.ice && CH.ice(x0, z0) && !(this.escape > 0) && !this._path) {
      const gk = 1 - Math.exp(-(G.grip || 2.0) * dt), wx = this.x - x0, wz = this.z - z0;
      const vx = lerp((this.svx || 0) * dt, wx, gk), vz = lerp((this.svz || 0) * dt, wz, gk);
      if (this.truckFree(x0 + vx, z0 + vz, this.h)) { this.x = x0 + vx; this.z = z0 + vz; }
    }
    this.svx = (this.x - x0) / dt1; this.svz = (this.z - z0) / dt1;
    // how fast are we really getting where the stick points (for the stuck check)
    if (mag > 0) { const mv = this._mvx != null ? this.svx * this._mvx + this.svz * this._mvz : 1; this._progRate = damp(this._progRate == null ? 1 : this._progRate, mv, 3, dt); } else this._progRate = null;
    // going nowhere for a while (pushing, but less than a metre of travel in 2 s): last resort, glide to the nearest roomy spot
    if (mag > 0.4 && !this.glide && !this._path) {
      const A = this._anc || (this._anc = { x: this.x, z: this.z, t: 0 });
      if (Math.hypot(this.x - A.x, this.z - A.z) > 1.0) { A.x = this.x; A.z = this.z; A.t = 0; }
      else if ((A.t += dt) > 3.2 && this._dtry && Math.hypot(this._dtry.x - this.x, this._dtry.z - this.z) < 1.2) { A.t = 0; this._dtry = null; if (this._trapped(G)) this.unstick(); }
    } else if (this._anc) this._anc.t = 0;
    // pinned? (pushing the stick but nothing moves for a while)
    if (mag > 0 && Math.abs(this.x - x0) + Math.abs(this.z - z0) < 0.002 && Math.abs(angDiff(h0, this.h)) < 0.002) { this.pinT = (this.pinT || 0) + dt; if (this.pinT > 0.9) { this.pinT = 0; if (this._trapped(G)) this.unstick(); } }
    else this.pinT = 0;
    this.slideLat = this.svx * Math.cos(this.h) - this.svz * Math.sin(this.h);
    this.rev = this.spd < -0.2;
    this.moveAmt = clamp(Math.max(Math.abs(this.spd), Math.hypot(this.svx, this.svz) * 0.8) / st.spd, 0, 1);
    return this._bladeCarve(dt, st, G);
  },
  _bladeCarve(dt, st, G) {
    let removed = 0;
    const hx = Math.sin(this.h), hz = Math.cos(this.h);
    const cx = this.x + hx * G.carve, cz = this.z + hz * G.carve;
    if (this._lastCx !== undefined && Math.hypot(cx - this._lastCx, cz - this._lastCz) > 2.2) this._lastCx = this._lastCz = undefined;
    if (!this.full && (this.spd > 0.2 || (this.svx || 0) * hx + (this.svz || 0) * hz > 0.6)) {
      const steps = this._lastCx === undefined ? 1 : Math.min(8, Math.ceil(Math.hypot(cx - this._lastCx, cz - this._lastCz) / 0.18));
      for (let s = 1; s <= steps; s++) {
        const px = this._lastCx === undefined ? cx : lerp(this._lastCx, cx, s / steps), pz = this._lastCz === undefined ? cz : lerp(this._lastCz, cz, s / steps);
        const r = SNOW.carve(px, pz, hx, hz, st.w * 0.5, 0.24, st.cap - this.load, this._co || (this._co = {}));
        if (r > 0) { this.load += r; removed += r; }
      }
    }
    this._lastCx = cx; this._lastCz = cz;
    if (removed > 0) {
      const rx = hz, rz = -hx;
      if (G.head === 'rotary') this._throwFX(removed, hx, hz, rx, rz);
      else if (G.head === 'brush') {
        // the sweeper flings snow forward and up
        for (let i = 0; i < 3; i++) FX.spray(cx + rx * rnd(-0.5, 0.5) * st.w, 0.5, cz + rz * rnd(-0.5, 0.5) * st.w, hx * 1.2 + rx * rnd(-0.4, 0.4), hz * 1.2 + rz * rnd(-0.4, 0.4), 2, 4.2, 0.2);
        if (Math.random() < 0.3) FX.puff(cx + hx * 0.6, 0.7, cz + hz * 0.6, 2, 0.9);
      } else {
        for (const sd of [-1, 1]) if (Math.random() < 0.7) FX.spray(cx + rx * sd * st.w * 0.5, 0.4, cz + rz * sd * st.w * 0.5, rx * sd * 0.8 + hx * 0.6, rz * sd * 0.8 + hz * 0.6, 3, 3.2, 0.16);
        if (Math.random() < 0.5) FX.spray(cx + hx * 0.5, 0.6 + this.pileVis, cz + hz * 0.5, hx, hz, 2, 2.0, 0.2);
      }
      if (G.gold && Math.random() < 0.5) { const sd = Math.random() < 0.5 ? 1 : -1; FX.sparkle(cx + rx * sd * st.w * 0.5, 0.5, cz + rz * sd * st.w * 0.5, 2, 0.3); }
    }
    return removed;
  },
  // rotary blower: a high, wide arc of snow out of the chute, landing well off to the side
  _throwFX(removed, hx, hz, rx, rz) {
    const tip = this.rotary.tip.getWorldPosition(this._v1), n = Math.min(9, 2 + Math.round(removed * 26)), v = Math.max(0, this.spd);
    for (let i = 0; i < n; i++) {
      const sp = rnd(6.0, 8.0), up = rnd(4.6, 6.2);
      FX.emit(FX.norm, { x: tip.x + rnd(-0.1, 0.1), y: tip.y + rnd(-0.1, 0.1), z: tip.z + rnd(-0.1, 0.1), vx: -rx * sp + hx * (v * 0.6 + rnd(-0.6, 0.6)), vy: up, vz: -rz * sp + hz * (v * 0.6 + rnd(-0.6, 0.6)), gr: 9.5, life: rnd(1.0, 1.4), s0: rnd(0.18, 0.3), s1: rnd(0.45, 0.7), a0: 0.95, a1: 0.35, dr: 0.25, c: [0.96, 0.975, 1] });
    }
    if (Math.random() < 0.06 * n) { const d = rnd(7, 9.5); FX.clump(tip.x, tip.y, tip.z, tip.x - rx * d + hx * v * 0.8, 0.3, tip.z - rz * d + hz * v * 0.8, rnd(0.18, 0.3), rnd(0.9, 1.15), (x, y, z) => FX.puff(x, 0.3, z, 4, 1.1)); }
  },
  payout(quiet) {
    const amt = this.load; this.load = 0;
    if (amt < 0.3) return;
    const val = amt * GAME.price() * STREAK.mul;
    const src = this.kind === 'truck' ? this.pile.getWorldPosition(this._v2) : this.sled.getWorldPosition(this._v2);
    GAME.earn(val);
    const n = clamp(Math.round(4 + Math.log2(val + 1) * 1.4), 5, 18);
    FX.coinBurst(src.x, src.y + 0.5, src.z, n, val, { up: 0.95, spread: 0.8 });
    if (quiet) return;
    const big = this.kind === 'truck';
    FX.puff(src.x, src.y + 0.3, src.z, big ? 14 : 9, big ? 2.0 : 1.1); FX.sparkle(src.x, src.y + 0.5, src.z, big ? 18 : 10, big ? 1.0 : 0.5);
    UI.floatText(this._v1.set(src.x, src.y + (big ? 2.4 : 1.5), src.z), '+' + fmt(val) + (STREAK.mul > 1 ? '  x' + STREAK.mul : ''), STREAK.COL[STREAK.lv], big ? 36 : 30);
    AUD.cash();
    this.sledBump = 1; this.payFlash = 1;
    GAME.payouts++; UI.onPayout();
  },
  _visuals(dt, st) {
    const t = this.kind, walking = t !== 'truck';
    const loadVis = this.load;
    this.bump = Math.max(0, (this.bump || 0) - dt * 3.2);
    const bsc = this.bump > 0 ? 1 + Math.sin((1 - this.bump) * Math.PI) * 0.2 : 1;
    this.kid.root.scale.setScalar(bsc); this.truck.scale.setScalar(bsc);
    if (walking) {
      this.kid.root.position.set(this.x, 0, this.z); this.kid.root.rotation.y = this.h;
      // sled follow
      const ax = this.x - Math.sin(this.h) * 0.3, az = this.z - Math.cos(this.h) * 0.3;
      const L = 1.15 * this.sledScale + (t === 'blower' ? 0.25 : 0);
      let dx = this.sledX - ax, dz = this.sledZ - az, d = Math.hypot(dx, dz);
      if (d > L) { this.sledX = ax + dx / d * L; this.sledZ = az + dz / d * L; }
      if (d > 0.05) this.sledH = dampAng(this.sledH, Math.atan2(ax - this.sledX, az - this.sledZ), 10, dt);
      const sy = SNOW.surf(this.sledX, this.sledZ);
      this.sled.position.set(this.sledX, damp(this.sled.position.y, sy, 12, dt), this.sledZ); this.sled.rotation.y = this.sledH;
      this.sledBump = Math.max(0, this.sledBump - dt * 4);
      const f = clamp(loadVis / st.cap, 0, 1.15);
      this.sledVis = damp(this.sledVis, f, 8, dt);
      const b = 1 + Math.sin(this.sledBump * Math.PI) * 0.15;
      const mv = this.sledVis;
      this.mound.visible = mv > 0.01;
      this.mound.scale.set(0.3 * (0.55 + 0.45 * mv) * b, (0.05 + 0.5 * mv) * b, 0.62 * (0.5 + 0.5 * mv) * b);
      // rope
      const rp = this.rope.geometry.attributes.position;
      rp.setXYZ(0, ax, 0.4, az); const fr = this.sled.localToWorld(this._v1.set(0, 0.25, 0.98)); rp.setXYZ(1, fr.x, fr.y, fr.z); rp.needsUpdate = true;
      // kid anim
      this.toss = Math.max(0, this.toss - dt / 0.3);
      if (t === 'shovel') {
        poseShovel(this.shovel, st.w, this.toss > 0 ? 1 - this.toss : 0);
        const sp = clamp(this.scoop / (0.55 + st.cap * 0.02), 0, 1) * (this.full ? 1 : 1);
        const pr = this.full ? 1 : sp;
        this.shovel.pile.scale.set(st.w * 0.38 * (0.3 + 0.7 * pr) + 0.001, 0.05 + 0.16 * pr, 0.14 + 0.1 * pr);
        this.shovel.pile.visible = pr > 0.03;
      }
      if (this.celebrate > 0) this.celebrate -= dt;
      const pose = this.celebrate > 0 ? 'cheer' : t === 'shovel' ? 'shovel' : 'push';
      animPerson(this.kid, dt, { walk: this.moveAmt, pose, t: performance.now() / 1000, toss: t === 'shovel' && this.toss > 0 ? 1 - this.toss : 0, lean: t === 'shovel' ? 0.12 * this.moveAmt : 0.08, hop: this.celebrate > 0 ? Math.abs(Math.sin(this.celebrate * 9)) * 0.18 : 0 });
      // breath puffs in the cold
      this.breathT -= dt;
      if (this.breathT < 0) { this.breathT = rnd(2.2, 3.5); const hp = this.kid.head.getWorldPosition(this._v1); FX.emit(FX.norm, { x: hp.x + Math.sin(this.h) * 0.2, y: hp.y - 0.04, z: hp.z + Math.cos(this.h) * 0.2, vx: Math.sin(this.h) * 0.4, vy: 0.15, vz: Math.cos(this.h) * 0.4, life: 0.9, s0: 0.06, s1: 0.32, a0: 0.5, a1: 0, dr: 1.5, c: [1, 1, 1] }); }
    } else {
      this.truck.position.set(this.x, 0, this.z); this.truck.rotation.y = this.h;
      const f = clamp(loadVis / st.cap, 0, 1.1);
      this.pileVis = damp(this.pileVis, f, 6, dt);
      const p = this.pileVis, bw = st.w;
      const G = this.geo, ps = 0.8 + G.halfW * 0.18, now = performance.now();
      this.pile.visible = p > 0.01 && G.pileZ !== null;
      if (G.pileZ !== null) { this.pile.scale.set(bw * 0.5 * (0.7 + 0.3 * p), (0.12 + 1.05 * p) * ps, (0.25 + 1.0 * p) * ps); this.pile.position.set(0, 0, G.pileZ + 0.1 * p); }
      this.beacon.material.color.setHSL(0.08, 1, 0.45 + 0.25 * Math.max(0, Math.sin(now / 120)));
      // little bounce (the magic sleigh floats)
      this.truckM.position.y = G.hover ? 0.16 + Math.sin(now / 300) * 0.07 : Math.abs(Math.sin(now / 70)) * 0.015 * this.moveAmt;
      if (G.head) { const Hd = G.head === 'rotary' ? this.rotary : this.brush; Hd.drum.rotation.x -= dt * (5 + this.moveAmt * 16) * (G.head === 'brush' ? 1.5 : 1); if (G.head === 'rotary') this.rotary.chute.rotation.y = Math.sin(now / 900) * 0.12; }
      if (G.rider) {
        this.rider.root.position.y = G.rider[1] + (G.hover ? this.truckM.position.y : 0);
        animPerson(this.rider, dt, { walk: 0, pose: this.celebrate > 0 ? 'cheer' : 'push', t: now / 1000 });
        this.rider.legL.rotation.x = this.rider.legR.rotation.x = -1.35; this.rider.body.position.y = 0.0;
        if (this.celebrate > 0) this.celebrate -= dt;
      }
      if (G.gold && this.moveAmt > 0.1 && Math.random() < 0.7) {
        // a trail of golden sparkles behind the runners
        const bx = this.x - Math.sin(this.h) * G.rear * 0.9, bz = this.z - Math.cos(this.h) * G.rear * 0.9, sx = Math.cos(this.h), sz = -Math.sin(this.h), sd = Math.random() < 0.5 ? 1 : -1;
        FX.emit(FX.add, { x: bx + sx * sd * 0.9 + rnd(-0.2, 0.2), y: rnd(0.15, 0.5), z: bz + sz * sd * 0.9 + rnd(-0.2, 0.2), vx: rnd(-0.3, 0.3), vy: rnd(0.3, 1.0), vz: rnd(-0.3, 0.3), life: rnd(0.6, 1.1), s0: rnd(0.16, 0.3), s1: 0.02, a0: 1, a1: 0, fl: 1, dr: 1.2, c: Math.random() < 0.5 ? [1, 0.85, 0.35] : [1, 0.6, 0.9] });
      }
    }
  }
};
