// ---------- chapter 6: Snowy Airport (planes land on the runway you clear, taxi to the gates and take off again) ----------
// ground network (plane centre lines): runway x=-23.5 (planes land and take off going south), links z=-50 and z=25,
// taxiway x=-10, three stands at the terminal (planes park nose-in, facing east)
const AP = { RX: -23.5, TX: -10, LN: -50, LS: 25, SX: 9.5, STANDS: [35, 22, 9] };
const CH_AIRPORT = {
  id: 6, key: 'airport', name: 'Snowy Airport', tag: 'Clear for landing!',
  intro: 'A blizzard closed the airport and the planes are circling above! Clear the runway so they can land.',
  twist: 'Every plane that lands pays a landing fee!',
  color: '#2f7fd6', icon: 'plane', pack: 'ch6',
  music: () => SONG_AIRPORT,
  grid: { X0: -32, Z0: -66, NX: 321, NZ: 651 },
  start: { x: 11, z: 53, h: Math.PI },
  shop: ['groomer', 'sweeper'],
  unlock: { tool: 'sweeper', goals: 1 },
  payMul: 5.0, par: [330, 540], reward: 200000,
  crewYard: [-3, 59], crewJobs: ['walkT', 'walkH'],
  introCam: { from: [-44, 46, 58], look: [-12, 2, -14] },
  finaleCam: { from: [6, 13, -22], look: [-23.5, 4, -10] },
  finaleDelay: 9,
  env: { sky: ['#2a72cf', '#8fc0ee', '#eef4fb'], fog: 0xe2ebf5, hemi: [0xa8c8f4, 0xeef0f2, 0.62], sun: [0xfff0d8, 2.3], sunOff: [14, 26, 12], exposure: 0.84, fogNear: 60, fogFar: 200 },
  goals: [
    { a: 'parking', t: 'Clear the terminal parking', ico: 'car' },
    { a: 'apron', t: 'Clear the gates', ico: 'plane' },
    { a: 'taxi', t: 'Clear the taxiway', ico: 'road' },
    { a: 'runway', t: 'Clear the runway', ico: 'plane' },
    { a: 'hangar', t: 'Clear the hangar', ico: 'plane' },
    { a: 'deice', t: 'Clear the de-icing pad', ico: 'plane' },
    { end: true, t: 'Clear for takeoff!', ico: 'star' },
  ],
  treasure: { parking: [3, 1], apron: [4, 1], taxi: [3, 1], runway: [5, 2], hangar: [3, 1], deice: [3, 1] },
  // ---- bot routing between the open zones (parking, gates, taxiway, runway, hangar, de-icing pad) ----
  botZone(x, z) { if (x < -14) return 'R'; if (x < -6) return 'T'; if (z > 44) return 'P'; if (z >= 1) return 'A'; if (z >= -37) return 'H'; return 'D'; },
  botMouth(zp, zt, px, pz, tz) {
    const link = Math.abs(pz - AP.LN) < Math.abs(pz - AP.LS) ? AP.LN : AP.LS;
    return zoneHop({
      P: { A: () => [6, 40] },
      A: { P: () => [6, 48], T: () => [-10, clamp(pz, 4, 32)] },
      T: { A: () => [-1, clamp(pz, 6, 40)], H: () => [-1, clamp(pz, -26, -5)], D: () => [-1, clamp(pz, -55, -43)], R: () => Math.abs(pz - link) > 2.5 ? [-10, link] : [AP.RX, link] },
      H: { T: () => [-10, clamp(pz, -26, -4)] },
      D: { T: () => [-10, clamp(pz, -52, -42)] },
      R: { T: () => Math.abs(pz - link) > 2.5 ? [AP.RX, link] : [-10, link] },
    }, zp, zt, px, pz, tz);
  },
  botOpen(x, z) { const Z = this.botZone(x, z); return Z === 'R' ? [AP.RX, clamp(z, -52, 29)] : Z === 'T' ? [-10, clamp(z, -50, 29)] : Z === 'P' ? [11, 52] : Z === 'A' ? [7, clamp(z, 6, 40)] : Z === 'H' ? [6, clamp(z, -25, -6)] : [5, clamp(z, -55, -43)]; },
  botTarget(p) { return p.x < -6 && p.x > -14 ? { x: clamp(p.x, -11.6, -8.4), z: p.z } : p; },
  truckSpots() {
    const c = [];
    for (let zz = -52; zz <= 29; zz += 3) { c.push([AP.RX, zz]); c.push([-10, clamp(zz, -50, 29)]); }
    for (let zz = -56; zz <= 40; zz += 3) for (const xx of [0, 6, 12]) if (zz > 3 || (zz < -4 && zz > -27) || (zz < -42 && zz > -57)) c.push([xx, zz]);
    for (let xx = 0; xx <= 22; xx += 4) for (const zz of [48, 52, 56]) c.push([xx, zz]);
    return c;
  },
  layout() {
    PAVED.push({ r: rect(-4, 44, 26, 60), kind: 'asphalt', d: 0.46, key: 'parking' });
    PAVED.push({ r: rect(-6, 2, 20, 44), kind: 'apron', d: 0.44, key: 'apron' });
    PAVED.push({ r: rect(-14, -54, -6, 32), kind: 'asphalt', d: 0.48, key: 'taxi' });
    // (the two short links between the taxiway and the runway are kept swept: they are only ways across)
    PAVED.push({ r: rect(-17.5, -54, -14, -46), kind: 'asphalt', d: 0.48, key: 'linkN', noSnow: true });
    PAVED.push({ r: rect(-17.5, 21, -14, 29), kind: 'asphalt', d: 0.48, key: 'linkS', noSnow: true });
    PAVED.push({ r: rect(-29.5, -56, -17.5, 32), kind: 'asphalt', d: 0.5, key: 'runway' });
    PAVED.push({ r: rect(-6, -28, 17, -2), kind: 'apron', d: 0.44, key: 'hangar' });
    PAVED.push({ r: rect(-6, -58, 16, -40), kind: 'apron', d: 0.44, key: 'deice' });
    PAVED.push({ r: rect(20.5, 42, 31, 44), kind: 'walk', d: 0.3, key: 'walkT' });
    PAVED.push({ r: rect(17, -6, 30, -3.6), kind: 'walk', d: 0.3, key: 'walkH' });
  },
  areas(mk, pav) {
    mk('parking', 'Terminal parking', [pav('parking')], { title: 'PARKING CLEAR!', ico: 'car' });
    mk('apron', 'Gates', [pav('apron')], { title: 'GATES OPEN!', ico: 'plane', doneAt: 0.76 });
    mk('taxi', 'Taxiway', [pav('taxi')], { title: 'TAXIWAY CLEAR!', ico: 'road', doneAt: 0.76 });
    mk('runway', 'Runway', [pav('runway')], { title: 'CLEARED TO LAND!', ico: 'plane', doneAt: 0.76 });
    mk('hangar', 'Hangar', [pav('hangar')], { title: 'HANGAR OPEN!', ico: 'plane' });
    mk('deice', 'De-icing pad', [pav('deice')], { title: 'DE-ICING READY!', ico: 'plane' });
    mk('walkT', 'Terminal walk', [pav('walkT')], { quiet: true });
    mk('walkH', 'Hangar walk', [pav('walkH')], { quiet: true });
  },
  build(scene, H, T) {
    const yardY = (x, z) => SNOW.type(x, z) === 1 ? 0 : SNOW.depth(x, z) - 0.06;
    // ---- paint under the snow: runway centre line, threshold bars, edge lines; taxiway and stand lead-in lines ----
    const white = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.5 }), yel = new THREE.MeshStandardMaterial({ color: 0xffc21a, roughness: 0.5 });
    const wg = [], yg = [];
    const strip = (L, x0, z0, x1, z1, y) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y || 0.008, (z0 + z1) / 2); L.push(g); };
    for (let z = -48; z < 26; z += 7) strip(wg, AP.RX - 0.2, z, AP.RX + 0.2, z + 3.6);
    for (const zt of [-54.6, 29.4]) for (let x = -28.2; x <= -19; x += 1.2) strip(wg, x, zt, x + 0.6, zt + 2.2);
    for (const xe of [-29.1, -17.9]) strip(wg, xe - 0.12, -55.6, xe + 0.12, 31.6);
    for (const zz of [-46, -40, 22, 16]) for (const sx of [-1, 1]) strip(wg, AP.RX + sx * 2.5 - 0.5, zz, AP.RX + sx * 2.5 + 0.5, zz + 3);
    strip(yg, AP.TX - 0.13, -53.5, AP.TX + 0.13, 31.5, 0.009);
    for (const zl of [AP.LN, AP.LS]) strip(yg, -17.4, zl - 0.13, -10, zl + 0.13, 0.009);
    for (const zs of AP.STANDS) { strip(yg, -10, zs - 0.13, 16.5, zs + 0.13, 0.009); strip(yg, 16.5, zs - 2, 16.9, zs + 2, 0.009); }
    scene.add(new THREE.Mesh(mergeGeoms(wg), white)); scene.add(new THREE.Mesh(mergeGeoms(yg), yel));
    // ---- the terminal: a long glass hall with three jet bridges ----
    {
      const x0 = 22, x1 = 32, z0 = 2, z1 = 42, hgt = 7.2, g = new THREE.Group();
      // (its own materials: the whole terminal turns see-through when it stands between the camera and you)
      const tall = M => { M = M.clone(); M.userData = { xtall: 1 }; xray(M); return M; };
      const wall = tall(mcol(0xdde4ec, 0.8)), roof = tall(mcol(0xf3f6f9, 0.7)), trim = tall(mcol(0x2f6fd6, 0.5, 0.2)), mull = tall(mcol(0xf7f9fb, 0.5, 0.3));
      this.glass = new THREE.MeshStandardMaterial({ color: 0x2a3b56, roughness: 0.12, metalness: 0.5, emissive: 0x000000 }); this.glass.userData.xtall = 1;
      const box = (w, h, d, m, x, y, z) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
      box(x1 - x0, hgt, z1 - z0, wall, (x0 + x1) / 2, hgt / 2, (z0 + z1) / 2);
      box(x1 - x0 + 1.4, 0.55, z1 - z0 + 1.4, roof, (x0 + x1) / 2, hgt + 0.28, (z0 + z1) / 2);
      box(x1 - x0 + 1.5, 0.3, z1 - z0 + 1.5, trim, (x0 + x1) / 2, hgt - 0.05, (z0 + z1) / 2);
      // a glass wall all along the gates, with white frames
      box(0.2, 4.6, z1 - z0 - 1.6, this.glass, x0 - 0.05, 3.3, (z0 + z1) / 2);
      for (let z = z0 + 1.2; z <= z1 - 1.2; z += 2.6) box(0.3, 4.8, 0.14, mull, x0 - 0.12, 3.3, z);
      box(0.32, 0.18, z1 - z0 - 1.6, mull, x0 - 0.12, 1.0, (z0 + z1) / 2);
      box(x1 - x0 - 2, 3.8, 0.2, this.glass, (x0 + x1) / 2, 2.9, z1 + 0.05);
      for (let x = x0 + 1.4; x <= x1 - 1.2; x += 2.2) box(0.14, 4.0, 0.3, mull, x, 2.9, z1 + 0.12);
      // the entrance canopy over the landside walk
      box(9, 0.28, 2.1, roof, 25.5, 3.7, 43.0); box(9, 0.16, 0.16, trim, 25.5, 3.6, 44.0);
      // the control desk on the roof and the big sign
      box(4, 2.2, 6, wall, 27, hgt + 1.7, 22); box(4.2, 1.0, 6.2, this.glass, 27, hgt + 2.2, 22);
      xray(this.glass); mergeGroup(g); scene.add(g);
      const s = makeSign('SNOWPORT', '#2a6fd6'); s.position.set(27, hgt + 1.6, z1 + 0.7); s.scale.setScalar(4.2); scene.add(s);
      SNOW.paint(x0 - 0.4, z0 - 0.4, x1 + 0.6, z1 + 0.4, (k) => { if (T[k] === 0) T[k] = 2; });
      WORLD.occ.push(new THREE.Box3(new V3(x0, 0, z0), new V3(x1, hgt + 3, z1)));
      // jet bridges from the glass wall out to the stands
      this.bridges = [];
      for (const zs of AP.STANDS) {
        const b = place('jetbridge', 0, 0, 0, 0.34, 0); const piv = new THREE.Group(); piv.position.set(x0 - 0.3, 0, zs + 3.2); piv.add(b);
        b.position.set(0, 0, -3.7); b.rotation.y = Math.PI; scene.add(piv); this.bridges.push({ piv, b, k: 0, want: 0 });
      }
    }
    // ---- hangar, control tower, crew building, fuel and service vehicles ----
    this.hangarB = place('hangar', 26.2, -21, -Math.PI / 2, 0.86, 0); scene.add(this.hangarB); solidUnder(this.hangarB, 0.1);
    decorTall('tower', 26.5, -50, -Math.PI / 2, 0.56, 0, { solid: 0.1 });
    decor('crewbldg', 14, 68, 0, 0.62, 0.34);
    decor('gse', 26.5, -61, Math.PI, 0.6, 0, { solid: 0.1 });
    for (const [x, z] of [[21, 15.5], [21, 28.5], [19, -38], [-5.4, -63]]) decor('apronlight', x, z, -Math.PI / 2, 0.85, yardY(x, z), { trunk: 0.35 });
    decor('windsock', -31.2, 2, Math.PI / 2, 0.85, yardY(-31.2, 2), { trunk: 0.3 });
    decor('abeacon', 30.5, -36, 0, 0.9, yardY(30.5, -36), { trunk: 0.3 });
    for (const [x, z, r] of [[-15.6, 17.5, Math.PI / 2], [-15.6, -57.5, Math.PI / 2], [-4.6, 0, 0]]) decor('twysign', x, z, r, 1.1, yardY(x, z), { trunk: 0.2 });
    decor('blastfence', AP.RX, -58.8, 0, 1.2, yardY(AP.RX, -58.8));
    // the snow islands between the paved parts are solid (the plows use the links and the taxiway, never a lawn)
    const solidStrip = (x0, z0, x1, z1) => SNOW.paint(x0, z0, x1, z1, (k) => { if (T[k] === 0) T[k] = 2; });
    solidStrip(-17.3, -57, -14.1, -54.2); solidStrip(-17.3, -45.8, -14.1, 20.8); solidStrip(-17.3, 29.2, -14.1, 33);
    solidStrip(-5.8, -1.8, 19.8, 1.8); solidStrip(-5.8, -39.8, 17.8, -28.2);
    // blast fences between the gates and the hangar, a row of cones before the de-icing pad
    for (const x of [-1.6, 6.6, 14.8]) decor('blastfence', x, 0, 0, 0.95, yardY(x, 0));
    for (const x of [-3, 4, 11]) decor('cones', x, -36, 0, 1.15, yardY(x, -36));
    // parked service vehicles beside the terminal (between the stands)
    // (parked in the gap along the glass wall, out of the way of the plows)
    for (const [k, x, z, r] of [['bowser', 21.0, 15.8, Math.PI], ['catering', 21.0, 28.6, Math.PI]]) { const v = place(k, x, z, r, 0.72, 0); scene.add(v); solidUnder(v, 0.05); }
    // the de-icing rig waits on its pad, its boom over the taxiway
    // (it stands beside its pad, not on it: the pad is one clean square to plow)
    this.deicer = place('deicer', 20.2, -48, -Math.PI / 2, 0.72, 0); scene.add(this.deicer); solidUnder(this.deicer, 0.05);
    // ---- runway and taxiway lights (dark until their job is done), approach lights out in the snow ----
    this.rwLights = []; this.twLights = [];
    const post = new THREE.CylinderGeometry(0.08, 0.1, 0.45, 6), pm = mcol(0x6a7280, 0.6), pg = [];
    const light = (x, z, col, list, s) => { const g = post.clone(); g.translate(x, 0.22, z); pg.push(g); const m = addGlow(x, 0.55, z, s || 0.7, col, 0); m.material.opacity = 0; list.push(m); };
    for (let z = -55; z <= 31; z += 7) { light(-30.1, z, 0xffd27a, this.rwLights); light(-16.9, z, 0xffd27a, this.rwLights); }
    for (let z = -53; z <= 31; z += 7) { light(-14.5, z, 0x2f7fff, this.twLights, 0.6); light(-5.5, z, 0x2f7fff, this.twLights, 0.6); }
    this.appr = [];
    for (let z = -70; z >= -150; z -= 8) { const g = post.clone(); g.scale(1, 3, 1); g.translate(AP.RX, 0.6, z); pg.push(g); const m = addGlow(AP.RX, 1.4, z, 1.8, 0xffffff, 0); m.material.opacity = 0; this.appr.push(m); }
    scene.add(new THREE.Mesh(mergeGeoms(pg), pm));
    // ---- parked cars at the terminal, trees and snowbanks around the field ----
    for (const [k, x, z] of [['car_blue', -1.5, 62.6], ['car_white', 3.5, 62.6], ['camper', 21.5, 62.8]]) decor(k, x, z, Math.PI, 1, 0.1, { solid: 0.02 });
    const rr = mulberry(606), fk = ['fir_a', 'fir_b', 'fir_c', 'spruce_s'];
    for (let i = 0; i < 46; i++) { const x = 34 + rr() * 26, z = -66 + rr() * 132; decor(fk[(rr() * 4) | 0], x, z, rr() * TAU, 1 + rr() * 0.9, yardY(x, z), { trunk: 0.45 }); }
    for (let i = 0; i < 24; i++) { const x = -6 + rr() * 36, z = 64 + rr() * 16; decor(fk[(rr() * 4) | 0], x, z, rr() * TAU, 1 + rr() * 0.9, yardY(x, z)); }
    for (let z = -54; z <= 28; z += 9) decor('snowbank', -31.2, z + rr() * 3, Math.PI / 2, 1.0 + rr() * 0.4, yardY(-31.2, z));
    for (let z = -42; z <= 16; z += 11) decor('snowbank', -15.7, z + 4, Math.PI / 2, 0.9 + rr() * 0.3, yardY(-15.7, z + 4));
    // ---- planes circling above until the runway is clear ----
    this.planes = []; this.circlers = []; this.arriveT = 3; this.fleet = 0; this.paxT = 0;
    for (let i = 0; i < 2; i++) { const p = this.mkPlane(i ? 'plane_b' : 'plane_a'); p.state = 'circle'; p.a = i * Math.PI; this.circlers.push(p); }
    this.bagTrain = null; this.cars = [];
  },
  // ---------------- planes ----------------
  mkPlane(key, s) {
    const S = s || { plane_a: 0.42, plane_b: 0.5, bizjet: 0.62 }[key] || 0.45;
    const o = place(key, 0, 0, 0, S, 0); o.rotation.order = 'YXZ'; WORLD.scene.add(o);
    const half = { plane_a: 19.7, plane_b: 16.6, bizjet: 7.8 }[key] * S, wing = { plane_a: 17.3, plane_b: 13.2, bizjet: 6.7 }[key] * S;
    const p = { o, key, s: S, half, wing, x: 0, y: 30, z: -200, h: 0, pitch: 0, roll: 0, spd: 0, state: 'new', path: null, pi: 0, t: 0, stand: -1, cells: null, honk: 0 };
    this.planes.push(p); return p;
  },
  dropPlane(p) { this.unparkPlane(p); WORLD.scene.remove(p.o); this.planes.splice(this.planes.indexOf(p), 1); },
  // while parked a plane's body is solid (the machines go round it); its cells come back when it leaves
  parkPlane(p) {
    if (p.cells) return; p.cells = [];
    const fx = Math.sin(p.h), fz = Math.cos(p.h);
    for (let a = -p.half * 0.92; a <= p.half * 0.85; a += 0.4) for (let b = -1.3; b <= 1.3; b += 0.4) SNOW.block(p.cells, SNOW.idx(p.x + fx * a + fz * b, p.z + fz * a - fx * b));
  },
  unparkPlane(p) { if (!p.cells) return; SNOW.unblock(p.cells); p.cells = null; },
  onRunway(x, z, m) { return x < -17 + (m || 0) && x > -31 && z > -58 && z < 34; },
  runwayBusy(skip) { return this.planes.some(p => p !== skip && ['approach', 'roll', 'lineup', 'takeoff'].includes(p.state) && !(p.state === 'approach' && p.z < -150)); },
  playerOnRunway() { return this.onRunway(PL.x, PL.z, PL.kind === 'truck' ? PL.geo.halfW + 1 : 0.5); },
  freeStand() { for (let i = 0; i < AP.STANDS.length; i++) if (!this.planes.some(p => p.stand === i)) return i; return -1; },
  // something in front of a plane on the ground? (your machine, or another plane)
  blocked(p, look) {
    const fx = Math.sin(p.h) * Math.sign(p.spd || 1), fz = Math.cos(p.h) * Math.sign(p.spd || 1);
    const chk = (x, z, r) => { const rx = x - p.x, rz = z - p.z, ahead = rx * fx + rz * fz, side = Math.abs(rx * fz - rz * fx); return ahead > 0 && ahead < p.half + look && side < p.wing * 0.55 + r; };
    if (chk(PL.x, PL.z, PL.kind === 'truck' ? PL.geo.halfW + 0.8 : 0.6)) return 'you';
    for (const h of CREW.list) if (chk(h.x, h.z, 0.6)) return 'crew';
    for (const q of this.planes) if (q !== p && q.state !== 'circle' && q.y < 2 && chk(q.x, q.z, q.half * 0.3)) return 'plane';
    return null;
  },
  // follow a list of ground points, turning like an aircraft (slow at the corners)
  taxi(p, dt, vmax) {
    const P = p.path[p.pi]; if (!P) return true;
    const dx = P[0] - p.x, dz = P[1] - p.z, d = Math.hypot(dx, dz), last = p.pi === p.path.length - 1;
    const want = Math.atan2(dx, dz), turn = Math.abs(angDiff(p.h, want));
    let v = vmax * (turn > 0.5 ? 0.55 : 1); if (last || (P[2] === 'ice' && !p.iced)) v = Math.min(v, d * 0.7 + 0.6);
    const b = this.blocked(p, 9); if (b) { v = 0; if (b === 'you') { p.honk -= dt; if (p.honk <= 0) { p.honk = 3; if (Math.hypot(p.x - PL.x, p.z - PL.z) < 45) AUD.horn(); if (Math.hypot(p.x - PL.x, p.z - PL.z) < 30) UI.floatText(new V3(p.x + Math.sin(p.h) * p.half, 4.2, p.z + Math.cos(p.h) * p.half), 'WAIT!', '#ffe27a', 24); } } }
    p.spd = damp(p.spd, v, v < p.spd ? 3 : 0.9, dt);
    if (d > 0.4) p.h = dampAng(p.h, want, 1.6 * clamp(p.spd / 3, 0.2, 1), dt);
    const st = Math.min(d, p.spd * dt); p.x += Math.sin(p.h) * st; p.z += Math.cos(p.h) * st;
    // (a stop on the way: the de-icing rig)
    if (P[2] === 'ice' && d < 1.0 && !p.iced) { p.spd = 0; return 'ice'; }
    if (d < (last ? 0.5 : 2.2) && P[2] !== 'ice') { p.pi++; if (last) return true; }
    else if (P[2] === 'ice' && p.iced && d < 2.2) p.pi++;
    return false;
  },
  standPath(i) { const zs = AP.STANDS[i]; return [[-16, AP.LS], [AP.TX, AP.LS + (zs > AP.LS ? 4 : -4)], [AP.TX, zs + (zs > AP.LS ? -5 : 5)], [-3, zs], [AP.SX, zs]]; },
  outPath(p) { const zs = AP.STANDS[p.stand], pts = [[AP.TX, zs - 6], [AP.TX, -36]]; if (GAME.done.deice) pts.push([-3, -42], [6, -47.5, 'ice'], [-6, -51.5]); pts.push([AP.TX, AP.LN + 1], [-16, AP.LN], [AP.RX + 1, AP.LN + 3]); return pts; },
  arrive() {
    const i = this.freeStand(); if (i < 0) return false;
    const keys = ['plane_a', 'plane_b', 'plane_a'], p = this.mkPlane(keys[this.fleet++ % 3]);
    p.state = 'approach'; p.stand = i; p.x = AP.RX; p.z = -330; p.y = 48; p.h = 0; p.spd = 34;
    // the two that were circling up there are the first ones down
    const c = this.circlers.shift(); if (c) this.dropPlane(c);
    return true;
  },
  planeUpdate(dt) {
    // waiting planes circle high over the field
    for (const p of this.circlers) { p.a += dt * 0.16; p.x = -12 + Math.sin(p.a) * 70; p.z = -70 + Math.cos(p.a) * 70; p.y = 44; p.h = p.a + Math.PI / 2; p.roll = -0.32; }
    // a new plane comes in when there is a free gate and the runway is open
    if (GAME.done.runway && !GAME.ended) {
      this.arriveT -= dt;
      if (this.arriveT <= 0 && !this.runwayBusy()) {
        if (this.playerOnRunway()) { this.arriveT = 2; this.waitSaid = (this.waitSaid || 0) - 2; if (this.waitSaid <= 0) { this.waitSaid = 20; UI.toast('A plane wants to land: keep off the runway!'); } }
        else this.arriveT = this.arrive() ? rnd(13, 18) : 4;
      }
    }
    for (const p of this.planes.slice()) {
      p.t += dt;
      if (p.state === 'approach') {
        // straight in along the glide path, flare, touch down
        p.z += p.spd * dt; const left = -44 - p.z;
        p.y = Math.max(0, Math.min(48, left * 0.12)); p.pitch = left < 30 ? -0.08 : -0.03;
        if (left < 120 && this.playerOnRunway() && !p.goAround) { p.goAround = 1; UI.toast('Go-around! Keep the runway clear for landing'); }
        if (p.goAround) { p.y += (p.goAround += dt) * 6; p.pitch = -0.16; if (p.z > 80) { this.dropPlane(p); this.arriveT = 6; } continue; }
        if (left <= 0) { p.state = 'roll'; p.y = 0; FX.puff(p.x - 1.6, 0.3, p.z - p.half * 0.2, 6, 1.2); FX.puff(p.x + 1.6, 0.3, p.z - p.half * 0.2, 6, 1.2); AUD.thump(); if (Math.hypot(p.x - PL.x, p.z - PL.z) < 60) CAM.shake = Math.max(CAM.shake, 0.25); }
      } else if (p.state === 'roll') {
        // brake down the runway (harder if your machine is ahead), then turn off at the south link
        const b = this.blocked(p, 30), want = b ? 0 : (p.z < 5 ? 26 - (p.z + 44) * 0.42 : 5); p.spd = damp(p.spd, Math.max(want, b ? 0 : 5), b ? 2.5 : 0.8, dt);
        p.pitch = damp(p.pitch, 0, 3, dt); p.z += p.spd * dt;
        if (p.spd > 12 && Math.random() < 0.5) FX.spray(p.x + rnd(-3, 3), 0.3, p.z - p.half * 0.4, rnd(-1, 1), -1, 2, 3, 0.2);
        if (p.z > AP.LS - 7) { p.state = 'taxiIn'; p.path = this.standPath(p.stand); p.pi = 0; }
      } else if (p.state === 'taxiIn') {
        if (this.taxi(p, dt, 5)) { p.state = 'parked'; p.t = 0; p.spd = 0; this.parkPlane(p); this.bridges[p.stand].want = 1; this.landed(p); }
      } else if (p.state === 'parked') {
        // passengers off, bags off, a bit of fuel... then the next flight
        if (p.t > 24 && !GAME.ended && !this.finaleOn) { this.bridges[p.stand].want = 0; if (p.t > 26.5) { this.unparkPlane(p); p.state = 'push'; p.t = 0; } }
      } else if (p.state === 'push') {
        // pushed back out of the gate, then turned to face the taxiway north
        const zs = AP.STANDS[p.stand]; p.spd = -1.6;
        if (p.x > -1) { if (!this.blocked(p, 4)) p.x -= 1.6 * dt; }
        else { p.h = dampAng(p.h, Math.PI, 1.1, dt); if (Math.abs(angDiff(p.h, Math.PI)) < 0.06) { p.state = 'taxiOut'; p.path = this.outPath(p); p.pi = 0; p.spd = 0; p.stand = -1; } }
        p.z = damp(p.z, zs, 2, dt);
      } else if (p.state === 'taxiOut') {
        const r = this.taxi(p, dt, 5.5);
        if (r === 'ice') { p.iceT = (p.iceT || 0) + dt; this.spray(p, dt); if (p.iceT > 3.5) { p.iced = 1; this.iced(p); } }
        else if (r === true) { p.state = 'lineup'; p.spd = 0; }
      } else if (p.state === 'lineup') {
        p.h = dampAng(p.h, 0, 1.2, dt);
        if (Math.abs(angDiff(p.h, 0)) < 0.05 && !this.playerOnRunway() && !this.planes.some(q => q !== p && ['approach', 'roll', 'takeoff'].includes(q.state) && !(q.state === 'approach' && q.z < -150))) { p.state = 'takeoff'; p.spd = 0; AUD.whoosh(); }
      } else if (p.state === 'takeoff') {
        // full power down the runway, rotate, climb out over the terminal
        const b = p.y < 1 && this.blocked(p, 26); p.spd = b ? damp(p.spd, 0, 2, dt) : Math.min(40, p.spd + dt * 7); p.z += p.spd * dt;
        if (p.z > 8) { p.pitch = damp(p.pitch, -0.2, 2, dt); p.y += Math.max(0, p.spd * 0.22) * dt; }
        if (p.y < 1 && p.spd > 10 && Math.random() < 0.6) FX.spray(p.x + rnd(-3, 3), 0.3, p.z - p.half, rnd(-1, 1), -1, 2, 3.5, 0.22);
        if (!p.paid && p.y > 3) { p.paid = 1; this.tookOff(p); }
        if (p.z > 260) { this.dropPlane(p); continue; }
      }
      // wheels down on the ground, a little bank and pitch in the air
      p.o.position.set(p.x, p.y + (p.y < 0.5 ? 0 : 0), p.z); p.o.rotation.set(p.pitch, p.h, p.roll);
      if (p.state === 'taxiIn' || p.state === 'taxiOut' || p.state === 'roll') { p.roll = 0; }
    }
    // jet bridges reach out to a parked plane
    for (const B of this.bridges) { B.k = damp(B.k, B.want, 1.5, dt); B.piv.rotation.y = 1.34 + (1 - B.k) * 0.35; B.b.scale.z = 0.34 * (0.8 + B.k * 0.2); }
  },
  landed(p) {
    const v = niceNum(GAME.price() * 30 * (GAME.ended ? 0.35 : 1)); GAME.earn(v);
    const d = Math.hypot(p.x - PL.x, p.z - PL.z);
    if (d < 30) { FX.coinBurst(p.x + 4, 3, p.z, 10, v, { up: 1 }); UI.floatText(new V3(p.x + 4, 5, p.z), 'LANDED! +' + fmt(v), '#7dffb0', 30); } else { UI.pending += v; UI.flyCoin(null, v); }
    if (!this.firstLand) { this.firstLand = 1; UI.banner('FIRST LANDING!', 'Landing fee +' + fmt(v), 'plane', 2.6); AUD.bigWin(); }
    AUD.cash(); this.paxOut(p);
  },
  tookOff(p) { const v = niceNum(GAME.price() * 12 * (GAME.ended ? 0.35 : 1)); GAME.earn(v); UI.pending += v; UI.flyCoin(null, v); },
  iced(p) { const v = niceNum(GAME.price() * 8 * (GAME.ended ? 0.35 : 1)); GAME.earn(v); if (Math.hypot(p.x - PL.x, p.z - PL.z) < 30) { FX.coinBurst(p.x, 3, p.z, 5, v, { up: 0.8 }); UI.floatText(new V3(p.x, 5, p.z), 'DE-ICED +' + fmt(v), '#ffb3e6', 24); } else { UI.pending += v; UI.flyCoin(null, v); } },
  // the de-icing rig sprays warm pink fluid over the plane
  spray(p, dt) { if (Math.random() < 0.8) { const x = p.x + rnd(-p.wing * 0.4, p.wing * 0.4), z = p.z + rnd(-p.half * 0.5, p.half * 0.5); FX.emit(FX.norm, { x: 15.2 + rnd(-0.3, 0.3), y: 6.8, z: -48 + rnd(-1, 1), vx: (x - 15.2) * 0.8, vy: rnd(1, 2.5), vz: (z + 48) * 0.8, gr: 6, life: 0.9, s0: 0.15, s1: 0.4, a0: 0.9, a1: 0, dr: 0.5, c: [1, 0.55, 0.8] }); } if (Math.random() < 0.3) FX.steam(p.x + rnd(-3, 3), 3, p.z + rnd(-5, 5), 1, false); },
  // passengers walk off through the terminal (a few of them come out on the landside)
  paxOut(p) { for (let i = 0; i < 3; i++) later(1 + i * 0.7, () => { const n = NPC.spawn({ x: 21, z: 43.2, h: 0, kind: Math.random() < 0.3 ? 'kid' : 'adult', tag: 'pax' }); n.P.root.traverse(m => { if (m.isMesh) m.castShadow = false; }); NPC.go(n, [[rnd(4, 16), 46], [rnd(0, 20), rnd(54, 58)]], rnd(1.4, 1.9), (q) => later(rnd(2, 4), () => NPC.kill(q))); }); },
  // ---- the baggage train loops round the gates once they are open ----
  startBags() {
    if (this.bagTrain) return;
    const tug = place('bagtug', 0, 0, 0, 0.8, 0), c1 = place('bagcart', 0, 0, 0, 0.75, 0), c2 = place('bagcart', 0, 0, 0, 0.75, 0);
    for (const o of [tug, c1, c2]) WORLD.scene.add(o);
    this.bagTrain = { parts: [tug, c1, c2], s: 0, spd: 0, loop: [[-3, 42], [-3, 4], [17, 4], [17, 42]] };
  },
  bagUpdate(dt) {
    const B = this.bagTrain; if (!B) return;
    const L = B.loop, seg = L.map((p, i) => Math.hypot(L[(i + 1) % 4][0] - p[0], L[(i + 1) % 4][1] - p[1])), tot = seg.reduce((a, b) => a + b, 0);
    const at = (s) => { s = ((s % tot) + tot) % tot; for (let i = 0; i < 4; i++) { if (s <= seg[i]) { const a = L[i], b = L[(i + 1) % 4], t = s / seg[i]; return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), Math.atan2(b[0] - a[0], b[1] - a[1])]; } s -= seg[i]; } return [L[0][0], L[0][1], 0]; };
    const [hx, hz, hh] = at(B.s), fx = Math.sin(hh), fz = Math.cos(hh), rx = PL.x - hx, rz = PL.z - hz;
    const meBlock = rx * fx + rz * fz > -1 && rx * fx + rz * fz < 7 && Math.abs(rx * fz - rz * fx) < (PL.kind === 'truck' ? PL.geo.halfW + 1.6 : 1.2);
    const plBlock = this.planes.some(p => p.state !== 'circle' && p.y < 1 && Math.hypot(p.x - hx, p.z - hz) < p.half + 3);
    B.spd = damp(B.spd, meBlock || plBlock ? 0 : 3.2, 3, dt); B.s += B.spd * dt;
    for (let i = 0; i < 3; i++) { const [x, z, h] = at(B.s - i * 3.1); const o = B.parts[i]; o.position.set(x, 0, z); o.rotation.y = dampAng(o.rotation.y, h, 6, dt); }
  },
  // the shuttle bus brings travellers to the terminal once the parking is clear
  shuttle() { const bus = place('apronbus', 2, 76, Math.PI, 0.78, 0); WORLD.scene.add(bus); this.bus = { o: bus, z: 76, state: 'in', t: 0 }; },
  onDone(a, silent) {
    if (a.key === 'parking') {
      this.glass.emissive.setHex(0xffd88a); this.glass.emissiveIntensity = 0.55; this.glass.color.setHex(0x8fb4d8);
      if (!silent) { this.shuttle(); UI.toast('The terminal is open!'); }
      return new V3(11, 0, 52);
    }
    if (a.key === 'apron') { this.startBags(); if (!silent) { CREW.recruit(2.0); UI.toast('The gates are open: the ground crew is out!'); } else GAME.crew = Math.max(GAME.crew || 0, 5); return new V3(7, 0, 22); }
    if (a.key === 'taxi') { for (const m of this.twLights) m.material.opacity = 0.8; return new V3(-10, 0, -10); }
    if (a.key === 'runway') {
      for (const m of this.rwLights) m.material.opacity = 0.85; this.apprOn = true;
      if (silent) { for (let i = 0; i < 2; i++) { const st = this.freeStand(); if (st < 0) break; const p = this.mkPlane(i ? 'plane_b' : 'plane_a'); const zs = AP.STANDS[st]; p.stand = st; p.x = AP.SX; p.z = zs; p.y = 0; p.h = Math.PI / 2; p.state = 'parked'; p.t = i * 10; this.parkPlane(p); this.bridges[st].want = this.bridges[st].k = 1; p.o.position.set(p.x, 0, p.z); p.o.rotation.set(0, p.h, 0); const c = this.circlers.shift(); if (c) this.dropPlane(c); } this.arriveT = 8; this.firstLand = 1; }
      else { this.arriveT = 2.5; UI.toast('Runway open: the first plane is coming in!'); }
      return new V3(AP.RX, 0, -10);
    }
    if (a.key === 'hangar') { this.bizjet(silent); return new V3(6, 0, -16); }
    if (a.key === 'deice') { if (!silent) UI.toast('Planes get de-iced on their way out now!'); return new V3(4, 0, -50); }
    return null;
  },
  // the business jet rolls out of the hangar onto the cleared apron
  bizjet(silent) {
    const p = this.mkPlane('bizjet'); p.state = 'biz'; p.x = 24; p.z = -21; p.y = 0; p.h = -Math.PI / 2; p.spd = 0; this.biz = p;
    if (silent) { p.x = 9; this.parkPlane(p); p.state = 'bizPark'; }
    p.o.position.set(p.x, 0, p.z); p.o.rotation.set(0, p.h, 0);
  },
  update(dt) {
    this.planeUpdate(dt); this.bagUpdate(dt);
    if (this.biz && this.biz.state === 'biz') { const p = this.biz; p.x -= dt * 2.2; p.o.position.set(p.x, 0, p.z); if (p.x <= 9) { p.state = 'bizPark'; this.parkPlane(p); AUD.horn(); } }
    // approach lights race toward the runway once it is open
    if (this.apprOn) { const t = performance.now() / 1000; for (let i = 0; i < this.appr.length; i++) { const ph = (t * 2.2 - (this.appr.length - i) * 0.12) % 1; this.appr[i].material.opacity = ph < 0.12 ? 0.95 : 0.12; } }
    // the shuttle bus
    if (this.bus) {
      const S = this.bus; S.t += dt;
      if (S.state === 'in') { S.z = damp(S.z, 47.5, 1.2, dt); if (S.z < 47.9) { S.state = 'drop'; S.t = 0; AUD.busHorn(); for (let i = 0; i < 5; i++) { const n = NPC.spawn({ x: 2 + rnd(-1, 1), z: 46 + rnd(-1, 1), h: Math.PI, kind: Math.random() < 0.35 ? 'kid' : 'adult', tag: 'pax' }); NPC.go(n, [[rnd(14, 20), 45.5], [rnd(21, 29), 43]], rnd(1.4, 1.9), (q) => NPC.kill(q)); } } }
      else if (S.state === 'drop' && S.t > 3) S.state = 'out';
      else if (S.state === 'out') { S.z += dt * (2 + S.t * 3); if (S.z > 80) { WORLD.scene.remove(S.o); this.bus = null; } }
      if (this.bus) S.o.position.set(2, 0, S.z);
    }
    // the jumbo (finale)
    const J = this.jumbo;
    if (J) {
      J.t += dt;
      if (J.state === 'wait' && (J.t > 4 || !this.runwayBusy(J))) { J.state = 'go'; J.spd = 0; AUD.whoosh(); }
      if (J.state === 'go') {
        J.spd = Math.min(46, J.spd + dt * 9); J.z += J.spd * dt;
        if (J.z > -14) { J.pitch = damp(J.pitch, -0.22, 2, dt); J.y += Math.max(0, J.spd * 0.24) * dt; }
        if (J.y < 1) { if (Math.random() < 0.9) FX.spray(J.x + rnd(-5, 5), 0.4, J.z - J.half, rnd(-1.5, 1.5), -1.5, 3, 4, 0.3); }
        else if (!J.up) { J.up = 1; AUD.bigWin(); LIFE.fireworks(-6, 10, 7); UI.banner('CLEARED FOR TAKEOFF!', 'The skies are open again', 'plane', 3.4); }
        if (CAM.show) { CAM.show.look[0] = J.x; CAM.show.look[1] = Math.max(4, J.y); CAM.show.look[2] = clamp(J.z, -40, 30); }
        if (J.z > 280) { WORLD.scene.remove(J.o); this.jumbo = null; }
      }
      if (this.jumbo) { J.o.position.set(J.x, J.y, J.z); J.o.rotation.set(J.pitch, J.h, 0); }
    }
    if (this.party > 0) { this.party -= dt; if (Math.random() < dt * 3) FX.confetti(rnd(-2, 18), 5, rnd(4, 42), 20); }
  },
  finale() {
    this.finaleOn = true; AUD.bigWin();
    later(0.4, () => UI.banner('CLEAR FOR TAKEOFF!', 'The big jet is ready to go', 'plane', 2.6));
    // the big jet lines up on the cleared runway and goes
    const o = place('plane_a', 0, 0, 0, 0.62, 0); o.rotation.order = 'YXZ'; WORLD.scene.add(o);
    o.traverse(c => { if (c.isMesh && c.material && c.material.color && c.material.name && /shell|paint|body/i.test(c.material.name)) { c.material = c.material.clone(); c.material.color.setHex(0x2f6fd6); } });
    this.jumbo = { o, x: AP.RX, y: 0, z: -54, h: 0, pitch: 0, spd: 0, t: 0, state: 'wait', half: 19.7 * 0.62 };
    this.party = 9;
  },
  save() { return null; },
  load() { },
};
