// ---------- chapter 8: Rocket Base (the crawler carries the rocket to the pad on the road you clear; liftoff!) ----------
// the crawler drives up the west lane of the crawler road (x = RK.CX), so the east lane stays free for your machine
const RK = { CX: -2.8, Z0: 57, ZP: -49 };
const CH_ROCKET = {
  id: 8, key: 'rocket', name: 'Rocket Base', tag: 'Launch day!',
  intro: 'Launch day at the rocket base! Clear the crawler road so the giant crawler can carry the rocket to the launch pad.',
  twist: 'The crawler only rolls on cleared road, and every meter it rolls pays!',
  color: '#e5483c', icon: 'rocket', pack: 'ch8',
  music: () => SONG_ROCKET,
  grid: { X0: -32, Z0: -66, NX: 321, NZ: 651 },
  start: { x: 21, z: 52, h: Math.PI },
  shop: ['sweeper', 'melter', 'jet'],
  unlock: { tool: 'jet', goals: 1 },
  payMul: 7.2, par: [330, 540], reward: 600000,
  crewYard: [27.5, 58], crewJobs: ['walkV', 'walkC'],
  introCam: { from: [38, 50, 70], look: [0, 6, -14] },
  finaleCam: { from: [26, 16, -14], look: [RK.CX, 10, RK.ZP] },
  // (when the crawler is still on its way at the end, it hurries to the pad first)
  get finaleDelay() { const C = this.crawler; return 11 + (C && C.state !== 'parked' ? Math.max(0, C.z - RK.ZP) / 9 + 1.5 : 0); },
  env: { sky: ['#1f63c4', '#86b8ea', '#f2f5f8'], fog: 0xe1e8f1, hemi: [0xa6c4ee, 0xeef0f2, 0.62], sun: [0xfff2dc, 2.3], sunOff: [16, 26, 10], exposure: 0.85, fogNear: 60, fogFar: 210 },
  goals: [
    { a: 'visitors', t: 'Clear the visitor area', ico: 'car' },
    { a: 'roadS', t: 'Clear the crawler road', ico: 'road' },
    { a: 'control', t: 'Clear mission control', ico: 'dish' },
    { a: 'roadN', t: 'Clear the road to the pad', ico: 'road' },
    { a: 'fuel', t: 'Clear the fuel farm', ico: 'fuel' },
    { a: 'pad', t: 'Clear the launch pad', ico: 'rocket' },
    { end: true, t: 'Liftoff!', ico: 'star' },
  ],
  treasure: { visitors: [3, 1], roadS: [4, 1], control: [3, 1], roadN: [4, 1], fuel: [3, 1], pad: [4, 2] },
  // ---- bot routing: visitor area, the crawler road, mission control, the fuel farm, the pad ----
  botZone(x, z) { if (z < -36) return 'L'; if (x > 12) return z > 0 ? 'V' : 'F'; if (x < -8) return 'C'; return 'R'; },
  botMouth(zp, zt, px, pz, tz) {
    return zoneHop({
      V: { R: () => Math.abs(pz - 36) > 2.5 ? [20, 36] : [4, 36] },
      R: { V: () => Math.abs(pz - 36) > 2.5 ? [4, 36] : [20, 36], C: () => Math.abs(pz - 20) > 2.5 ? [-4, 20] : [-20, 20], F: () => Math.abs(pz + 22) > 2.5 ? [4, -22] : [18, -22], L: () => [clamp(px, -6, 6), -42] },
      C: { R: () => Math.abs(pz - 20) > 2.5 ? [-20, 20] : [-4, 20] },
      F: { R: () => Math.abs(pz + 22) > 2.5 ? [18, -22] : [4, -22] },
      L: { R: () => [clamp(px, -6, 6), -31] },
    }, zp, zt, px, pz, tz);
  },
  botOpen(x, z) { const Z = this.botZone(x, z); return Z === 'V' ? [21, clamp(z, 34, 56)] : Z === 'F' ? [19, clamp(z, -30, -12)] : Z === 'C' ? [-21, clamp(z, 14, 30)] : Z === 'L' ? [clamp(x, -10, 10), clamp(z, -60, -40)] : [3, clamp(z, -32, 42)]; },
  botTarget(p) { return p; },
  truckSpots() {
    const c = [];
    for (let zz = -32; zz <= 44; zz += 3) for (const xx of [-4, 0, 4]) c.push([xx, zz]);
    for (let zz = 34; zz <= 56; zz += 3) for (const xx of [16, 21, 26]) c.push([xx, zz]);
    for (let zz = 14; zz <= 30; zz += 3) for (const xx of [-26, -21, -16]) c.push([xx, zz]);
    for (let zz = -30; zz <= -12; zz += 3) for (const xx of [16, 20]) c.push([xx, zz]);
    for (let zz = -60; zz <= -40; zz += 3) for (const xx of [-10, -4, 4, 10]) c.push([xx, zz]);
    return c;
  },
  layout() {
    PAVED.push({ r: rect(-8, 6, 8, 46), kind: 'asphalt', d: 0.48, key: 'roadS' });
    PAVED.push({ r: rect(-8, -36, 8, 6), kind: 'asphalt', d: 0.48, key: 'roadN' });
    PAVED.push({ r: rect(-16, -64, 16, -36), kind: 'apron', d: 0.46, key: 'pad' });
    PAVED.push({ r: rect(12, 30, 30, 60), kind: 'asphalt', d: 0.46, key: 'visitors' });
    PAVED.push({ r: rect(8, 32, 12, 40), kind: 'asphalt', d: 0.46, key: 'linkV' });
    PAVED.push({ r: rect(-30, 10, -12, 32), kind: 'apron', d: 0.44, key: 'control' });
    PAVED.push({ r: rect(-12, 16, -8, 24), kind: 'apron', d: 0.44, key: 'linkC' });
    PAVED.push({ r: rect(12, -34, 26, -8), kind: 'apron', d: 0.44, key: 'fuel' });
    PAVED.push({ r: rect(8, -26, 12, -18), kind: 'apron', d: 0.44, key: 'linkF' });
    PAVED.push({ r: rect(13, 28, 29, 30), kind: 'walk', d: 0.3, key: 'walkV' });
    PAVED.push({ r: rect(-30, 32, -27.5, 44), kind: 'walk', d: 0.3, key: 'walkC' });
  },
  areas(mk, pav) {
    mk('visitors', 'Visitor area', [pav('visitors'), pav('linkV')], { title: 'VISITORS WELCOME!', ico: 'car' });
    mk('roadS', 'Crawler road', [pav('roadS')], { title: 'ROAD CLEAR!', ico: 'road' });
    mk('control', 'Mission control', [pav('control'), pav('linkC')], { title: 'CONTROL ONLINE!', ico: 'dish' });
    mk('roadN', 'Road to the pad', [pav('roadN')], { title: 'ROAD TO THE PAD!', ico: 'road' });
    mk('fuel', 'Fuel farm', [pav('fuel'), pav('linkF')], { title: 'FUELING!', ico: 'fuel' });
    mk('pad', 'Launch pad', [pav('pad')], { title: 'PAD READY!', ico: 'rocket', doneAt: 0.78 });
    mk('walkV', 'Visitor walk', [pav('walkV')], { quiet: true });
    mk('walkC', 'Control walk', [pav('walkC')], { quiet: true });
  },
  build(scene, H, T) {
    const yardY = (x, z) => SNOW.type(x, z) === 1 ? 0 : SNOW.depth(x, z) - 0.06;
    // ---- road paint: yellow lane edges and the crawler's lane ----
    const yel = new THREE.MeshStandardMaterial({ color: 0xffc21a, roughness: 0.5 }), wht = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.5 }), yg = [], wg = [];
    const strip = (L, x0, z0, x1, z1) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0.009, (z0 + z1) / 2); L.push(g); };
    for (const x of [-7.6, 7.4]) strip(yg, x, -36, x + 0.2, 46);
    for (let z = -34; z < 44; z += 6) strip(wg, 1.4, z, 1.6, z + 3);
    // the pad: a big circle and the crawler's stop line
    { const g = new THREE.RingGeometry(9.6, 10, 48); g.rotateX(-Math.PI / 2); g.translate(RK.CX, 0.009, RK.ZP); yg.push(g); }
    strip(wg, RK.CX - 5, RK.ZP - 5.4, RK.CX + 5, RK.ZP - 5.1);
    scene.add(new THREE.Mesh(mergeGeoms(yg), yel)); scene.add(new THREE.Mesh(mergeGeoms(wg), wht));
    // ---- the Vehicle Assembly Building: a huge hall at the south end, its tall door opens for the crawler ----
    {
      // (its own materials: the hall turns see-through when it stands between the camera and you, e.g. right in front of its door)
      const tall = M => { M = M.clone(); M.userData = { xtall: 1 }; xray(M); return M; };
      const g = new THREE.Group(), wall = tall(mcol(0xe6e9ee, 0.85)), stripe = tall(mcol(0xc9cfd8, 0.85)), dark = tall(mcol(0x2c3138, 0.7)), blue = tall(mcol(0x2f6fd6, 0.5, 0.2)), red = tall(mcol(0xd8342c, 0.5, 0.2));
      const box = (w, h, d, m, x, y, z) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
      const x0 = -16, x1 = 16, z0 = 48, z1 = 70, hgt = 33;
      box(x1 - x0, hgt, z1 - z0, wall, 0, hgt / 2, (z0 + z1) / 2);
      for (let x = x0 + 2; x < x1; x += 4) box(0.6, hgt - 1, 0.2, stripe, x, hgt / 2, z0 - 0.08);
      box(x1 - x0 + 0.6, 1.2, z1 - z0 + 0.6, stripe, 0, hgt + 0.6, (z0 + z1) / 2);
      // the door slot (dark inside) and the door panel that slides up
      box(9, 30, 0.3, dark, RK.CX, 15, z0 - 0.05);
      this.vabDoor = box(9.2, 30, 0.4, tall(mcol(0xd5dae2, 0.8)), RK.CX, 15, z0 - 0.35);
      // a flag stripe and the base logo
      box(7, 4.6, 0.3, blue, 9.5, 26, z0 - 0.2); for (let i = 0; i < 5; i++) box(7, 0.55, 0.32, i % 2 ? wall : red, 9.5, 23.6 - i * 1.1, z0 - 0.21);
      // (the door slides on its own; everything else bakes into a few meshes)
      g.remove(this.vabDoor); mergeGroup(g); g.add(this.vabDoor); scene.add(g);
      const sg = makeSign('SNOWCAP SPACE', '#d8342c'); sg.position.set(9.5, 14, z0 - 0.4); sg.rotation.y = Math.PI; sg.scale.setScalar(5); scene.add(sg);
      SNOW.paint(x0 - 0.3, z0 - 0.5, x1 + 0.3, z1, (k) => { if (T[k] === 0) T[k] = 2; });
      WORLD.occ.push(new THREE.Box3(new V3(x0, 0, z0), new V3(x1, hgt, z1)));
    }
    // ---- the crawler with the rocket standing on it (inside the hall at first) ----
    {
      const cr = new THREE.Group(), deck = place('crawler', 0, 0, 0, 0.46, 0); deck.rotation.y = Math.PI / 2; cr.add(mergeGroup(new THREE.Group().add(deck)));
      const R = new THREE.Group(); R.position.y = 2.35; cr.add(R); this.rocket = R;
      let y = 0; const stack = (key, h) => { const o = place(key, 0, 0, 0, 0.5, y); R.add(o); y += h * 0.5; return o; };
      stack('engines', 3.35); stack('stage1', 24.0); stack('interstage', 3.6); stack('stage2', 12.3); stack('fairing', 7.4);
      this.rocketH = y; mergeGroup(R);
      cr.position.set(RK.CX, 0, RK.Z0); scene.add(cr);
      this.crawler = { o: cr, x: RK.CX, z: RK.Z0, spd: 0, state: 'inside', cells: null, payAcc: 0, payT: 0, honk: 0, said: 0, done0: 0 };
    }
    // ---- the launch pad: gantry tower with its crew arm, lightning masts, water tower, floodlights ----
    const gx = RK.CX + 8.2, gz = RK.ZP;
    parkedVehicle(decor('gantrybase', gx, gz, Math.PI / 2, 0.8, 0, { solid: 0.05, paved: true }));
    for (let i = 0; i < 3; i++) decor('gantry', gx, gz, Math.PI / 2, 0.8, 6.0 + i * 5.7, {});
    decor('gantrytop', gx, gz, Math.PI / 2, 0.8, 23.1, {});
    this.arm = place('crewarm', gx - 1.2, gz, 0, 0.8, 18.5); this.arm.rotation.y = Math.PI / 2; scene.add(this.arm);
    for (const [x, z] of [[-19.5, -60], [19.5, -60], [-19.5, -40], [19.5, -40]]) decor('lmast', x, z, 0, 0.42, yardY(x, z), { trunk: 0.6 });
    decorTall('watertower', -25, -54, 0, 0.62, yardY(-25, -54), { solid: 0.1 });
    for (const [x, z] of [[17.6, -50], [-17.6, -46]]) decor('padlight', x, z, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0.85, yardY(x, z), { trunk: 0.3 });
    decor('camtower', 18, -62, 0, 0.7, yardY(18, -62), { trunk: 0.4 });
    for (const x of [-12, -4, 4, 12]) decor('blastpanel', x, -65.2, 0, 1.0, yardY(x, -65.2));
    // ---- mission control: the control building, a big dish, the countdown sign ----
    this.ctrl = litBuilding('office', -21, 4.6, 0, 1.5, new V3(-21, 0, 10.2), 0.1);
    this.dish = this.makeDish(); this.dish.position.set(-30.2, 0, 3.5); scene.add(this.dish); solidDisc(-30.2, 3.5, 1.6);
    decor('camtower', -31, 22, 0, 0.6, yardY(-31, 22), { trunk: 0.4 });
    // ---- the fuel farm: round tanks along the east edge, the vent stack ----
    for (const [k, x, z, s, r] of [['sphere', 29.6, -29, 0.62, 0], ['sphere', 29.6, -14, 0.62, 0], ['cyltank', 29.0, -21.5, 0.6, Math.PI / 2]]) decor(k, x, z, r, s, yardY(x, z), { solid: 0.1 });
    this.vent = [27.8, 11.5, -36.6]; decor('vent', 27.8, -37.6, 0, 0.78, yardY(27.8, -37.6), { solid: 0.1 });
    // ---- the visitor area: bleachers facing the pad, the visitor centre, cars ----
    for (const z of [24, 16, 8]) decor('bleacher', 21, z, Math.PI, 2.1, yardY(21, z), { solid: 0.05 });
    this.bleachers = [[21, 25.2], [21, 17.2], [21, 9.2]];
    decor('office', 24, 63.5, 0, 1.3, 0.34);
    for (const [k, x, z, r] of [['car_blue', 13.6, 57.6, 0], ['car_white', 13.6, 53, 0], ['crewvan', 27.8, 33.5, Math.PI / 2]]) parkedVehicle(decor(k, x, z, r, k === 'crewvan' ? 0.72 : 1, k === 'crewvan' ? 0 : -0.25, { solid: 0.02, paved: true }));
    for (const [x, z] of [[11.2, 44], [11.2, 58], [30.8, 44], [30.8, 58]]) decor('lamp_a', x, z, 0, 1.2, yardY(x, z), { trunk: 0.3 });
    for (const [x, z] of [[9.5, 4], [9.5, -30], [-9.5, -10], [-9.5, 40]]) decor('warnsign', x, z, x > 0 ? -Math.PI / 2 : Math.PI / 2, 1.1, yardY(x, z));
    // trees and snowbanks
    const rr = mulberry(808), fk = ['fir_a', 'fir_b', 'fir_c', 'spruce_s'];
    for (let i = 0; i < 44; i++) { const x = (rr() < 0.5 ? -1 : 1) * (34 + rr() * 24), z = -66 + rr() * 132; decor(fk[(rr() * 4) | 0], x, z, rr() * TAU, 1 + rr() * 0.9, 0.34); }
    for (let i = 0; i < 26; i++) { const x = -30 + rr() * 16, z = -32 + rr() * 38; if (x > -12.5) continue; decor(fk[(rr() * 4) | 0], x, z, rr() * TAU, 0.9 + rr() * 0.8, yardY(x, z), { trunk: 0.45 }); }
    for (let i = 0; i < 12; i++) { const x = 13 + rr() * 16, z = -4 + rr() * 16; decor(fk[(rr() * 4) | 0], x, z, rr() * TAU, 0.9 + rr() * 0.8, yardY(x, z), { trunk: 0.45 }); }
    for (const [x, z] of [[-10, 0], [10, 12], [-10, -30], [10, 2]]) decor('snowbank', x, z, Math.PI / 2, 1.3, yardY(x, z));
    this.fans = []; this.fueling = false; this.launch = null;
  },
  // a satellite dish (built here: a white bowl on a turning stand)
  makeDish() {
    const own = M => { M = M.clone(); M.userData = {}; xray(M); return M; }, g = new THREE.Group(), w = own(mcol(0xf2f4f7, 0.6, 0.1)), d = own(mcol(0x8a95a3, 0.6, 0.4));
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 4, 10), d); post.position.y = 2; post.castShadow = true; g.add(post);
    const head = new THREE.Group(); head.position.y = 4.2; g.add(head);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(2.6, 20, 10, 0, TAU, 0, 1.0), w); bowl.rotation.x = -Math.PI / 2 - 0.6; bowl.position.z = 0.3; bowl.castShadow = true; bowl.material.side = THREE.DoubleSide; head.add(bowl);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), d); arm.rotation.x = 0.95; arm.position.set(0, 1.0, 1.0); head.add(arm);
    this.dishHead = head; return g;
  },
  // ---- the crawler: rolls up its lane while the road ahead is clear (and you are not in front of it) ----
  roadIds() { return this._ids || (this._ids = new Set(['roadS', 'roadN', 'pad'].map(k => WORLD.areaByKey[k].id))); },
  snowAhead(C) {
    const A = SNOW.A, Hh = SNOW.H, ids = this.roadIds();
    for (let s = 5.0; s <= 8.5; s += 0.7) for (const dx of [-3.2, -1.6, 0, 1.6, 3.2]) { const k = SNOW.idx(C.x + dx, C.z - s); if (k >= 0 && SNOW.T[k] === 1 && ids.has(A[k]) && Hh[k] > 0.15) return true; }
    return false;
  },
  meAhead(C) { const hw = PL.kind === 'truck' ? PL.geo.halfW : 0.4; return PL.z < C.z - 3 && PL.z > C.z - 14 && Math.abs(PL.x - C.x) < 3.3 + hw; },
  setSolid(C, on) {
    if (on && !C.cells) { C.cells = []; SNOW.paint(C.x - 3.2, C.z - 4.5, C.x + 3.2, C.z + 4.5, (k) => SNOW.block(C.cells, k)); if (PL.kind === 'truck') PL.ensureFree(); }
    if (!on && C.cells) { SNOW.unblock(C.cells); C.cells = null; }
  },
  crawlerUpdate(dt) {
    const C = this.crawler; if (!C) return;
    if (C.state === 'inside') { if (!GAME.done.roadS) return; C.state = 'roll'; AUD.horn(); if (!this.silentStart) UI.toast('The crawler is rolling out with the rocket!'); }
    if (C.state === 'parked') return;
    // where it may go: to the end of the cleared road, onto the pad only once the pad is done
    const stopZ = GAME.done.pad ? RK.ZP : GAME.done.roadN ? -33 : 9;
    const atEnd = C.z <= stopZ + 0.05, snow = this.snowAhead(C), me = this.meAhead(C);
    const want = atEnd ? 0 : (snow || me ? 0 : (this.rush ? 9 : 1.7));
    C.spd = damp(C.spd, want, want < C.spd ? 4 : 1.2, dt);
    if (C.spd < 0.05) {
      this.setSolid(C, true);
      if (!atEnd && (snow || me)) { C.honk -= dt; if (C.honk <= 0) { C.honk = 3.2; if (Math.hypot(C.x - PL.x, C.z - PL.z) < 45) AUD.horn(); if (Math.hypot(C.x - PL.x, C.z - PL.z) < 30) UI.floatText(new V3(C.x, 7, C.z - 4), me ? 'MOVE OVER!' : 'SNOW AHEAD!', '#ffe27a', 26); if (snow && C.said <= 0) { C.said = 25; UI.hint('The crawler is waiting: clear the road ahead!', 3); } } }
      if (atEnd && C.z <= RK.ZP + 0.05) { C.state = 'parked'; C.spd = 0; this.atPad(); }
    } else {
      this.setSolid(C, false);
      const st = Math.min(C.spd * dt, C.z - stopZ); C.z -= st; C.payAcc += st;
    }
    C.said -= dt;
    // every meter it rolls pays (paid out in little bundles)
    C.payT -= dt;
    if (C.payT <= 0 && C.payAcc > 1) { C.payT = 2; const v = niceNum(GAME.price() * 2.2 * C.payAcc * (GAME.ended ? 0.35 : 1)); C.payAcc = 0; GAME.earn(v); if (Math.hypot(C.x - PL.x, C.z - PL.z) < 30) UI.floatText(new V3(C.x, 6.5, C.z), '+' + fmt(v), '#7dffb0', 24); else { UI.pending += v; UI.flyCoin(null, v); } }
    C.o.position.set(C.x, 0, C.z);
    if (C.spd > 0.3 && Math.random() < 0.3) FX.smoke(C.x + rnd(-3, 3), 1.5, C.z + 3);
    // its progress on the road (and where you are) in the clock at the top
    if (!GAME.ended && C.state !== 'parked') { const f = z => clamp((RK.Z0 - z) / (RK.Z0 - RK.ZP), 0, 1); UI.timer('ROCKET', 'rocket', 'to the pad', 'good'); UI.timerRoute(f(C.z), f(PL.z)); }
    else { UI.timerRoute(null); UI.timer(null); }
  },
  atPad() {
    UI.timerRoute(null); UI.timer(null);
    // the crew arm swings in, the rocket stands ready
    this.armIn = 1; if (!this.silentPad) { AUD.bigWin(); UI.toast('The rocket is on the pad!'); }
  },
  onDone(a, silent) {
    if (a.key === 'visitors') { if (!silent) { this.visitors(8); UI.toast('Visitors are here to watch the launch!'); } else this.visitors(8, true); return new V3(21, 0, 46); }
    if (a.key === 'roadS') { this.doorUp = 1; if (silent) { this.vabDoor.scale.y = 0.04; this.vabDoor.position.y = 29.4; this.silentStart = true; } return new V3(3, 0, 26); }
    if (a.key === 'control') { this.ctrl.litT = 1; if (silent) { this.ctrl.lit = 1; applyLit(this.ctrl, 1); } this.dishOn = true; if (!silent) { CREW.recruit(2.0); UI.toast('Mission control is online!'); } else GAME.crew = Math.max(GAME.crew || 0, 5); return new V3(-21, 0, 22); }
    if (a.key === 'roadN') return new V3(3, 0, -14);
    if (a.key === 'fuel') { this.fueling = true; if (!silent) UI.toast('Fueling the rocket!'); return new V3(19, 0, -21); }
    if (a.key === 'pad') { if (silent) this.silentPad = true; return new V3(0, 0, -50); }
    return null;
  },
  // visitors walk to the bleachers and sit there for the launch
  visitors(n, silent) {
    for (let i = 0; i < n; i++) {
      const [bx, bz] = this.bleachers[i % 3], seat = [bx + rnd(-3.6, 3.6), bz + rnd(-0.4, 0.4)];
      const v = NPC.spawn({ x: silent ? seat[0] : rnd(14, 28), z: silent ? seat[1] : rnd(46, 56), h: Math.PI, kind: Math.random() < 0.45 ? 'kid' : 'adult', tag: 'fan', pop: !silent });
      v.P.root.traverse(m => { if (m.isMesh) m.castShadow = false; });
      v.y = 0.9; if (!silent) { v.y = 0; NPC.go(v, [[rnd(15, 27), 31], [seat[0], 29], seat], rnd(1.4, 2), (q) => { q.h = Math.PI; q.pose = 'wave'; q.y = 0.9; }); }
      this.fans.push(v);
    }
  },
  update(dt) {
    const now = performance.now() / 1000;
    this.crawlerUpdate(dt);
    // the hall door slides up
    if (this.doorUp && this.vabDoor.scale.y > 0.04) { this.vabDoor.scale.y = Math.max(0.04, this.vabDoor.scale.y - dt * 0.22); this.vabDoor.position.y = 30 - 15 * this.vabDoor.scale.y; }
    // the crew arm swings to the rocket once it is on the pad
    if (this.armIn) this.arm.rotation.y = damp(this.arm.rotation.y, Math.PI * 0.5 + Math.PI / 2, 1.2, dt);
    if (this.dishOn && this.dishHead) this.dishHead.rotation.y = Math.sin(now * 0.2) * 0.8;
    // fueling: the vent stack and the rocket breathe white clouds
    if (this.fueling && !this.launch) {
      if (Math.random() < dt * 4) FX.steam(this.vent[0] + rnd(-0.3, 0.3), this.vent[1], this.vent[2], 1, true);
      const C = this.crawler; if (C && C.state === 'parked' && Math.random() < dt * 3) FX.steam(C.x + rnd(-1.5, 1.5), 2.35 + this.rocketH * rnd(0.2, 0.7), C.z + rnd(-1.5, 1.5), 1, false);
    }
    // the launch (finale)
    const L = this.launch;
    if (L) {
      L.t += dt;
      const C = this.crawler;
      if (C.state !== 'parked') { this.rush = true; L.t0 = L.t + 0.8; return; }
      if (!L.n) L.n = 0;
      const n = Math.floor(L.t - L.t0);
      if (n >= L.n && L.n <= 5) { const left = 5 - L.n; L.n++; if (left > 0) { UI.banner(String(left), 'T-minus ' + left, 'rocket', 0.9); AUD.tick(left <= 3); } else { UI.banner('LIFTOFF!', 'To the stars!', 'rocket', 3.0); AUD.bigWin(); AUD.thump(); CAM.shake = 1.6; L.go = true; L.v = 0; const wp = new V3(); this.rocket.getWorldPosition(wp); C.o.remove(this.rocket); this.rocket.position.copy(wp); WORLD.scene.add(this.rocket); for (const f of this.fans) NPC.cheer(f, 4); } }
      if (L.t - L.t0 > 4.2 && !L.go) { for (let i = 0; i < 3; i++) FX.steam(C.x + rnd(-3, 3), 0.8, C.z + rnd(-3, 3), 1, true); }
      if (L.go) {
        const R = this.rocket; L.v = Math.min(40, L.v + dt * (4 + L.v * 0.5)); R.position.y += L.v * dt;
        // fire and smoke under it
        for (let i = 0; i < 6; i++) FX.emit(FX.add, { x: R.position.x + rnd(-0.8, 0.8), y: R.position.y + 0.2, z: R.position.z + rnd(-0.8, 0.8), vx: rnd(-2, 2), vy: -rnd(8, 16), vz: rnd(-2, 2), life: rnd(0.3, 0.6), s0: rnd(0.8, 1.4), s1: 0.2, a0: 1, a1: 0, fl: 1, c: Math.random() < 0.5 ? [1, 0.75, 0.3] : [1, 0.5, 0.15] });
        if (R.position.y < 12) for (let i = 0; i < 4; i++) FX.emit(FX.norm, { x: C.x + rnd(-3, 3), y: rnd(0.5, 2), z: C.z + rnd(-3, 3), vx: rnd(-7, 7), vy: rnd(0.5, 2.5), vz: rnd(-7, 7), life: rnd(1.6, 2.6), s0: 1.2, s1: 3.6, a0: 0.8, a1: 0, dr: 0.8, c: [0.92, 0.93, 0.95] });
        else if (Math.random() < 0.8) FX.emit(FX.norm, { x: R.position.x + rnd(-0.5, 0.5), y: R.position.y - 1, z: R.position.z + rnd(-0.5, 0.5), vx: rnd(-0.6, 0.6), vy: rnd(-1, 0), vz: rnd(-0.6, 0.6), life: rnd(2.5, 4), s0: 1.0, s1: 3.2, a0: 0.7, a1: 0, dr: 0.3, c: [0.95, 0.95, 0.97] });
        if (CAM.show) CAM.show.look[1] = Math.max(10, Math.min(R.position.y + 8, 70));
        if (R.position.y > 260) { WORLD.scene.remove(R); this.launch = null; }
      }
    }
    if (this.party > 0) { this.party -= dt; if (Math.random() < dt * 2) FX.confetti(21 + rnd(-6, 6), 4, rnd(8, 28), 18); }
  },
  finale() {
    AUD.bigWin(); this.launch = { t: 0, t0: 1.0 };
    later(0.3, () => UI.banner('LAUNCH DAY!', 'Countdown...', 'rocket', 1.0));
    later(8.5, () => LIFE.fireworks(21, 18, 6));
    this.party = 10;
  },
  save() { const C = this.crawler; return C ? { cz: +C.z.toFixed(1), cs: C.state } : null; },
  load(o) {
    const C = this.crawler; if (!o || !C) return;
    if (o.cs && o.cs !== 'inside') { C.z = clamp(+o.cz || C.z, RK.ZP, RK.Z0); C.state = o.cs === 'parked' ? 'parked' : 'roll'; C.o.position.set(C.x, 0, C.z); if (C.state === 'parked') { this.armIn = 1; this.arm.rotation.y = Math.PI; } else this.setSolid(C, true); }
  },
};
