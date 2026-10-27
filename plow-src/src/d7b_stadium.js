// ---------- chapter 7: Big Game Stadium (open the gates and the stands fill up: every fan buys a ticket) ----------
const CH_STADIUM = {
  id: 7, key: 'stadium', name: 'Big Game Stadium', tag: 'Game day!',
  intro: "It's the big game tonight, but the stadium is buried in snow! Open the gates, clear the track and get the pitch ready for kickoff.",
  twist: 'Fans pour in through the open gates: every fan buys a ticket!',
  color: '#2fa06a', icon: 'ball', pack: 'ch7',
  music: () => SONG_STADIUM,
  grid: { X0: -32, Z0: -66, NX: 321, NZ: 651 },
  start: { x: 0, z: 54, h: Math.PI },
  shop: ['groomer', 'sweeper', 'melter'],
  unlock: { tool: 'melter', goals: 2 },
  payMul: 6.0, par: [330, 540], reward: 350000,
  crewYard: [-24, 58], crewJobs: ['walkW', 'walkE'],
  introCam: { from: [0, 58, 84], look: [0, 0, -14] },
  finaleCam: { from: [0, 20, 30], look: [0, 2, -16] },
  finaleDelay: 7,
  env: { sky: ['#1b3a86', '#5b82c6', '#f4c89c'], fog: 0xd9dde8, hemi: [0x96acdc, 0xe8e2dc, 0.56], sun: [0xffcf9a, 2.05], sunOff: [-16, 20, 14], exposure: 0.86, fogNear: 60, fogFar: 200 },
  goals: [
    { a: 'parking', t: 'Clear the stadium parking', ico: 'car' },
    { a: 'plaza', t: 'Open the gates', ico: 'ticket' },
    { a: 'track', t: 'Clear the running track', ico: 'flag' },
    { a: 'pitchS', t: 'Clear the home half', ico: 'ball' },
    { a: 'pitchN', t: 'Clear the away half', ico: 'ball' },
    { end: true, t: 'Kickoff!', ico: 'star' },
  ],
  treasure: { parking: [4, 1], plaza: [3, 1], track: [5, 2], pitchS: [4, 2], pitchN: [4, 2] },
  // ---- bot routing: parking, plaza (with the gate tunnel), the bowl inside the stands ----
  botZone(x, z) { return z > 46 ? 'P' : z > 20 ? 'Z' : 'B'; },
  botMouth(zp, zt, px, pz, tz) {
    return zoneHop({
      P: { Z: () => [0, 41] },
      Z: { P: () => [0, 50], B: () => pz > 31 ? [0, 27.5] : [0, 15.5] },
      B: { Z: () => Math.abs(px) > 2.5 || pz < 13.5 ? [0, 15.5] : [0, 27.5] },
    }, zp, zt, px, pz, tz);
  },
  botOpen(x, z) { const Z = this.botZone(x, z); return Z === 'P' ? [0, 54] : Z === 'Z' ? [0, clamp(z, 33, 42)] : [clamp(x, -12, 12), clamp(z, -40, 8)]; },
  botTarget(p) { return p.z > 20 && p.z < 30 ? { x: clamp(p.x, -1.2, 1.2), z: p.z } : p; },
  truckSpots() {
    const c = [];
    for (let xx = -22; xx <= 22; xx += 4) for (const zz of [50, 54, 58]) c.push([xx, zz]);
    for (let xx = -14; xx <= 14; xx += 4) for (const zz of [34, 38, 42]) c.push([xx, zz]);
    for (const zz of [22, 25, 28]) c.push([0, zz]);
    for (let xx = -20; xx <= 20; xx += 4) for (let zz = -48; zz <= 16; zz += 4) c.push([xx, zz]);
    return c;
  },
  layout() {
    PAVED.push({ r: rect(-28, 46, 28, 62), kind: 'asphalt', d: 0.46, key: 'parking' });
    PAVED.push({ r: rect(-18, 30, 18, 46), kind: 'pavers', d: 0.44, key: 'plaza' });
    PAVED.push({ r: rect(-4, 20, 4, 30), kind: 'apron', d: 0.44, key: 'gate' });
    // the running track round the pitch (four strips) and the pitch inside it
    PAVED.push({ r: rect(-24, 13, 24, 20), kind: 'track', d: 0.48, key: 'trS' });
    PAVED.push({ r: rect(-24, -52, 24, -45), kind: 'track', d: 0.48, key: 'trN' });
    PAVED.push({ r: rect(-24, -45, -17, 13), kind: 'track', d: 0.48, key: 'trW' });
    PAVED.push({ r: rect(17, -45, 24, 13), kind: 'track', d: 0.48, key: 'trE' });
    PAVED.push({ r: rect(-17, -45, 17, 13), kind: 'turf', d: 0.5, key: 'pitch' });
    PAVED.push({ r: rect(-30, 36, -18, 38), kind: 'walk', d: 0.3, key: 'walkW' });
    PAVED.push({ r: rect(18, 36, 30, 38), kind: 'walk', d: 0.3, key: 'walkE' });
  },
  areas(mk, pav) {
    mk('parking', 'Stadium parking', [pav('parking')], { title: 'PARKING CLEAR!', ico: 'car' });
    mk('plaza', 'Gates', [pav('plaza'), pav('gate')], { title: 'GATES OPEN!', ico: 'ticket' });
    mk('track', 'Running track', [pav('trS'), pav('trN'), pav('trW'), pav('trE')], { title: 'TRACK CLEAR!', ico: 'flag' });
    mk('pitchS', 'Home half', [rect(-17, -16, 17, 13)], { title: 'HOME HALF READY!', ico: 'ball' });
    mk('pitchN', 'Away half', [rect(-17, -45, 17, -16)], { title: 'PITCH READY!', ico: 'ball' });
    mk('walkW', 'West walk', [pav('walkW')], { quiet: true });
    mk('walkE', 'East walk', [pav('walkE')], { quiet: true });
  },
  build(scene, H, T) {
    const yardY = (x, z) => SNOW.type(x, z) === 1 ? 0 : SNOW.depth(x, z) - 0.06;
    // ---- lines under the snow: the pitch markings and the lanes of the track ----
    const white = new THREE.MeshStandardMaterial({ color: 0xf6f8fa, roughness: 0.55 }), wg = [];
    const strip = (x0, z0, x1, z1) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0.009, (z0 + z1) / 2); wg.push(g); };
    const ring = (cx, cz, r, a0, a1) => { const g = new THREE.RingGeometry(r - 0.11, r + 0.11, 40, 1, a0 || 0, a1 || TAU); g.rotateX(-Math.PI / 2); g.translate(cx, 0.009, cz); wg.push(g); };
    const x0 = -15.6, x1 = 15.6, zN = -43.6, zS = 11.6, zc = -16;
    strip(x0, zN, x0 + 0.22, zS); strip(x1 - 0.22, zN, x1, zS); strip(x0, zN, x1, zN + 0.22); strip(x0, zS - 0.22, x1, zS); strip(x0, zc - 0.11, x1, zc + 0.11);
    ring(0, zc, 4.6); ring(0, zc, 0.25);
    for (const [zl, d] of [[zS, -1], [zN, 1]]) { const zb = zl + d * 8.5; strip(-10, Math.min(zl, zb), -9.78, Math.max(zl, zb)); strip(9.78, Math.min(zl, zb), 10, Math.max(zl, zb)); strip(-10, zb - 0.11, 10, zb + 0.11);
      const zg = zl + d * 3.2; strip(-4.5, Math.min(zl, zg), -4.28, Math.max(zl, zg)); strip(4.28, Math.min(zl, zg), 4.5, Math.max(zl, zg)); strip(-4.5, zg - 0.11, 4.5, zg + 0.11); }
    for (let i = 1; i <= 3; i++) { const o = i * 1.75; strip(-24 + o, -52 + o, -23.9 + o, 20 - o); strip(24 - o - 0.1, -52 + o, 24 - o, 20 - o); strip(-24 + o, 20 - o - 0.1, 24 - o, 20 - o); strip(-24 + o, -52 + o, 24 - o, -51.9 + o); }
    scene.add(new THREE.Mesh(mergeGeoms(wg), white));
    // ---- the stands all round the track (fans fill them as the gates open) ----
    this.bays = [];
    const bay = (x, z, rot, roof) => { decor('standbay', x, z, rot, 2.0, 0, { solid: 0.05 }); if (roof) decor('standroof', x, z, rot, 2.0, 0); this.bays.push([x, z, rot]); };
    for (let z = -48; z <= 16; z += 8) { bay(-28, z, Math.PI / 2, true); bay(28, z, -Math.PI / 2, true); }
    for (let x = -20; x <= 20; x += 8) bay(x, -56, 0, false);
    for (const x of [-17, -9, 9, 17]) bay(x, 24, Math.PI, false);
    // corner towers, the press box, the big screen over the pitch, the scoreboard
    for (const [x, z] of [[-28, 24], [28, 24], [-28, -56], [28, -56]]) decor('stairtower', x, z, 0, 1.6, 0, { solid: 0.05 });
    decorTall('pressbox', -31.8, -16, Math.PI / 2, 1.3, 0);
    decor('scoreboard2', 0, -60.5, 0, 2.2, 3.5);
    // floodlights at the corners (they come on with the track)
    this.flood = [];
    for (const [x, z] of [[-31, 28], [31, 28], [-31, -60], [31, -60]]) { decor('stadlight', x, z, Math.atan2(-x, -16 - z), 1.25, yardY(x, z), { trunk: 0.35 }); const g = addGlow(x * 0.97, 15.6, z * 0.97 + 0.5, 4.2, 0xfff1d0, 0.5); g.material.opacity = 0; this.flood.push(g); }
    // ---- the way in: an arch over the gate tunnel, turnstiles, ticket booths, snack kiosks ----
    decorTall('gateway2', 0, 30.2, 0, 1.25, 0); solidDisc(-4.75, 30.2, 0.4); solidDisc(4.75, 30.2, 0.4);
    const gs = makeSign('NORTH STARS', '#2fa06a'); gs.position.set(0, 7.0, 30.7); gs.scale.setScalar(2.6); scene.add(gs);
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) decor('turnstile', sx * (7 + i * 2.2), 28.6, 0, 1.4, yardY(sx * (7 + i * 2.2), 28.6));
    for (const sx of [-1, 1]) decor('ticketbooth', sx * 31.2, 37, sx < 0 ? Math.PI / 2 : -Math.PI / 2, 1.3, yardY(sx * 31.2, 37), { solid: 0.05 });
    this.kiosks = [];
    for (const sx of [-1, 1]) { const k = litBuilding('kiosk2', sx * 20.2, 42, sx < 0 ? Math.PI / 2 : -Math.PI / 2, 1.25, new V3(sx * 18.4, 0, 42), 0.05); k.incT = 1; this.kiosks.push(k); }
    // the TV truck and some cars in the parking
    parkedVehicle(decor('tvtruck', 24.5, 57, Math.PI / 2, 1.05, 0, { solid: 0.05, paved: true }));
    for (const [k, x, z] of [['car_blue', -24, 60.6], ['car_white', -19.5, 60.6], ['camper', 19, 60.4]]) parkedVehicle(decor(k, x, z, Math.PI, 1, -0.25, { solid: 0.02, paved: true }));
    for (const [x, z] of [[-29.4, 47], [29.4, 47], [-29.4, 61], [29.4, 61]]) decor('lamp_a', x, z, 0, 1.2, yardY(x, z), { trunk: 0.3 });
    // trees and banks outside
    const rr = mulberry(707), fk = ['fir_a', 'fir_b', 'fir_c', 'spruce_s'];
    for (let i = 0; i < 40; i++) { const x = (rr() < 0.5 ? -1 : 1) * (34 + rr() * 22), z = -66 + rr() * 130; decor(fk[(rr() * 4) | 0], x, z, rr() * TAU, 1 + rr() * 0.9, 0.34); }
    for (let i = 0; i < 18; i++) { const x = -30 + rr() * 60, z = -64 - rr() * 14; decor(fk[(rr() * 4) | 0], x, z, rr() * TAU, 1.1 + rr() * 0.9, 0.34); }
    for (const [x, z] of [[-25, 44], [25, 44], [-24.5, 31.5], [24.5, 31.5]]) decor('snowbank', x, z, rr() * TAU, 1.4, yardY(x, z));
    // ---- the crowd: one instanced mesh of seated fans (bodies), one of heads ----
    const seats = [];
    for (const [bx, bz, rot] of this.bays) {
      const c = Math.cos(rot), s = Math.sin(rot);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 10; i++) {
        const lx = -3.6 + i * 0.8 + (r % 2) * 0.2, lz = 1.55 - r * 1.55, ly = 0.95 + r * 1.3;
        seats.push({ x: bx + lx * c + lz * s, y: ly, z: bz - lx * s + lz * c, h: rot, ph: rr() * TAU, a: Math.atan2(bx, bz + 16) });
      }
    }
    // (random order: the first fans spread all over the stands)
    for (let i = seats.length - 1; i > 0; i--) { const j = (rr() * (i + 1)) | 0; [seats[i], seats[j]] = [seats[j], seats[i]]; }
    this.seats = seats;
    const bodyG = new THREE.BoxGeometry(0.46, 0.62, 0.34); bodyG.translate(0, 0.31, 0);
    const headG = new THREE.SphereGeometry(0.17, 8, 6); headG.translate(0, 0.8, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }); xray(mat);
    this.crowdB = new THREE.InstancedMesh(bodyG, mat, seats.length); this.crowdH = new THREE.InstancedMesh(headG, mat.clone(), seats.length);
    const cols = [0x2fa06a, 0x2fa06a, 0xffd34d, 0x2fa06a, 0xffffff, 0xe5483c, 0x2f7fd6, 0x2fa06a, 0xffc23d], col = new THREE.Color();
    for (let i = 0; i < seats.length; i++) { this.crowdB.setColorAt(i, col.setHex(cols[(rr() * cols.length) | 0])); this.crowdH.setColorAt(i, col.setHex(NPC_COLS.skin[(rr() * NPC_COLS.skin.length) | 0])); }
    this.crowdB.count = this.crowdH.count = 0; this.crowdB.frustumCulled = this.crowdH.frustumCulled = false;
    scene.add(this.crowdB); scene.add(this.crowdH);
    this.fans = 0; this.cap = 0; this.ticketAcc = 0; this.ticketT = 0; this.walkT = 0; this.wave = 0;
    this.teams = []; this.ball = null; this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._p = new V3(); this._s = new V3(1, 1, 1);
  },
  // how full the stands may get: each job lets more fans in
  capFor() { let c = 0; if (GAME.done.plaza) c = 0.35; if (GAME.done.track) c = 0.62; if (GAME.done.pitchS) c = 0.82; if (GAME.done.pitchN) c = 1; return Math.round(c * this.seats.length); },
  onDone(a, silent) {
    if (a.key === 'parking') { if (!silent) { this.walkers(6); UI.toast('Fans are arriving: open the gates!'); } return new V3(0, 0, 54); }
    if (a.key === 'plaza') {
      for (const k of this.kiosks) { k.litT = 1; k.open = true; if (silent) { k.lit = 1; applyLit(k, 1); } }
      if (!silent) { CREW.recruit(2.0); UI.toast('The gates are open: fans pour in!'); } else GAME.crew = Math.max(GAME.crew || 0, 5);
      if (silent) this.fans = this.capFor();
      return new V3(0, 0, 36);
    }
    if (a.key === 'track') { for (const g of this.flood) g.material.opacity = 0.75; if (silent) this.fans = this.capFor(); else UI.toast('Floodlights on! More fans are coming'); return new V3(0, 0, 16); }
    if (a.key === 'pitchS') { this.team(0, silent); if (silent) this.fans = this.capFor(); return new V3(0, 0, -2); }
    if (a.key === 'pitchN') { this.team(1, silent); if (silent) this.fans = this.capFor(); return new V3(0, 0, -30); }
    return null;
  },
  // a few fans walk in from the parking (the stands fill in the meantime)
  walkers(n) {
    for (let i = 0; i < n; i++) {
      const f = NPC.spawn({ x: rnd(-20, 20), z: rnd(50, 58), h: Math.PI, kind: Math.random() < 0.4 ? 'kid' : 'adult', tag: 'fanW', look: Object.assign(NPC.look(Math.random() < 0.4 ? 'kid' : 'adult'), { scarf: 0x2fa06a, hat: Math.random() < 0.5 ? 0x2fa06a : 0xffd34d }) });
      f.P.root.traverse(m => { if (m.isMesh) m.castShadow = false; });
      NPC.go(f, [[rnd(-6, 6), 40], [rnd(-1.5, 1.5), 31.5], [0, 22]], rnd(1.6, 2.2), (q) => NPC.kill(q));
    }
  },
  // the two teams come out to warm up on their half (jogging loops, passing a ball)
  team(t, silent) {
    const col = t ? [0x2f6fd6, 0xffffff] : [0xe5483c, 0xffffff], cz = t ? -30 : -2, list = [];
    for (let i = 0; i < 6; i++) {
      const look = Object.assign(NPC.look('adult'), { jacket: col[0], band: col[1], hatOn: false, hair: [0x3a2418, 0x1c1c1c, 0xe0b060][i % 3], pants: col[1], scale: 1.2 });
      const n = NPC.spawn({ x: rnd(-8, 8), z: cz + rnd(-6, 6), kind: 'adult', look, tag: 'player', pop: !silent });
      n.P.root.traverse(m => { if (m.isMesh) m.castShadow = false; });
      list.push({ n, cx: rnd(-7, 7), cz: cz + rnd(-5, 5), rx: rnd(2, 4), rz: rnd(2, 4), a: rnd(0, TAU), w: rnd(0.6, 0.9) * (i % 2 ? 1 : -1) });
    }
    this.teams.push({ t, list, cz });
    // the goal at their end, corner flags
    const gz = t ? -42.9 : 11.0, g = place('goal', 0, gz, t ? 0 : Math.PI, 1.0, 0); WORLD.scene.add(g);
    SNOW.paint(-3.9, t ? gz - 2.1 : gz - 0.1, 3.9, t ? gz + 0.1 : gz + 2.1, (k) => { if (SNOW.T[k] === 1) { SNOW.T[k] = 2; SNOW.H[k] = 0; } });
    for (const sx of [-1, 1]) { const f = place('cornerflag', sx * 15.5, t ? -43.5 : 11.5, 0, 1.2, 0); WORLD.scene.add(f); }
    if (!this.ball) { const b = place('ball', 0, cz, 0, 1.8, 0); WORLD.scene.add(b); this.ball = { o: b, x: 0, z: cz, vx: 0, vz: 0, cool: 0 }; }
    if (!silent) { PL.ensureFree(); UI.toast(t ? 'The away team is out!' : 'The home team is warming up!'); AUD.cheer(); }
  },
  update(dt) {
    const now = performance.now() / 1000;
    // ---- the stands fill up; every new fan pays a ticket ----
    const cap = this.capFor();
    if (this.fans < cap) {
      const add = Math.min(cap - this.fans, Math.max(1, Math.round(dt * 9 + Math.random() * 0.6)));
      this.fans += add; this.ticketAcc += add;
      this.walkT -= dt; if (this.walkT <= 0) { this.walkT = rnd(1.2, 2.4); this.walkers(1); }
    }
    this.ticketT -= dt;
    if (this.ticketT <= 0 && this.ticketAcc > 0) {
      this.ticketT = 1.2; const v = niceNum(GAME.price() * 1.0 * this.ticketAcc * (GAME.ended ? 0.35 : 1)); this.ticketAcc = 0; GAME.earn(v);
      if (Math.hypot(PL.x, PL.z - 34) < 20) { FX.coinBurst(0, 3.5, 30.5, 4, v, { up: 0.7 }); UI.floatText(new V3(0, 5, 30.5), 'TICKETS +' + fmt(v), '#ffe9a8', 22); } else { UI.pending += v; UI.flyCoin(null, v); }
    }
    // snack kiosks sell while the fans come and go
    let rate = this.fans > 0 ? GAME.price() * 9 * (this.fans < cap ? 1 : 0) : 0;
    for (const K of this.kiosks) {
      if (!K.open || K.lit < 0.5) continue;
      const v = Math.max(5, GAME.price() * 2.2) * (GAME.ended ? 0.35 : 1); rate += v / 2.6; K.incT -= dt;
      if (K.incT <= 0) { K.incT = 2.6; const val = Math.round(v), p = K.door; GAME.earn(val); if (Math.hypot(p.x - PL.x, p.z - PL.z) < 22) { FX.coinBurst(p.x, 2.6, p.z, 2, val, { up: 0.6, spread: 0.4 }); UI.floatText(new V3(p.x, 3.4, p.z), '+' + fmt(val), '#ffe9a8', 20); } else { UI.pending += val; UI.flyCoin(null, val); } }
    }
    UI.income(rate > 0 ? rate : null);
    // ---- seated fans: bob, cheer, and do the wave at the big moments ----
    const n = Math.min(this.fans, this.seats.length); this.crowdB.count = this.crowdH.count = n;
    if (n > 0) {
      if (this.wave > 0) this.wave -= dt;
      const M = this._m, q = this._q, p = this._p, sc = this._s, E = this._e;
      for (let i = 0; i < n; i++) {
        const S = this.seats[i];
        let up = Math.max(0, Math.sin(now * 2.2 + S.ph)) * 0.05;
        if (this.wave > 0) { const w = Math.sin(S.a * 1 - now * 4.2); up += w > 0.6 ? (w - 0.6) * 1.6 : 0; }
        if (this.cheer > 0) up += Math.abs(Math.sin(now * 9 + S.ph)) * 0.18;
        p.set(S.x, S.y + up, S.z); q.setFromEuler(E.set(0, S.h, 0)); M.compose(p, q, sc);
        this.crowdB.setMatrixAt(i, M); this.crowdH.setMatrixAt(i, M);
      }
      this.crowdB.instanceMatrix.needsUpdate = this.crowdH.instanceMatrix.needsUpdate = true;
      if (this.crowdB.instanceColor) this.crowdB.instanceColor.needsUpdate = this.crowdH.instanceColor.needsUpdate = !this._colOk; this._colOk = true;
    }
    if (this.cheer > 0) this.cheer -= dt;
    // ---- the teams jog and pass the ball ----
    for (const T of this.teams) for (const s of T.list) {
      s.a += s.w * dt; let x = s.cx + Math.cos(s.a) * s.rx, z = s.cz + Math.sin(s.a) * s.rz;
      const dx = x - PL.x, dz = z - PL.z, d = Math.hypot(dx, dz), R = PL.kind === 'truck' ? PL.geo.halfW + 3 : 1.4;
      if (d < R) { x += dx / (d || 1) * (R - d); z += dz / (d || 1) * (R - d); }
      const nn = s.n; if (Math.hypot(x - nn.x, z - nn.z) > 0.01) nn.h = dampAng(nn.h, Math.atan2(x - nn.x, z - nn.z), 8, dt); nn.x = x; nn.z = z; nn.moving = 1;
    }
    const B = this.ball;
    if (B) {
      B.cool -= dt; B.x += B.vx * dt; B.z += B.vz * dt; B.vx *= Math.exp(-0.9 * dt); B.vz *= Math.exp(-0.9 * dt);
      B.x = clamp(B.x, -15, 15); B.z = clamp(B.z, -43, 11);
      const all = this.teams.flatMap(T => T.list);
      if (B.cool <= 0 && all.length) { let best = null, bd = 1e9; for (const s of all) { const d = Math.hypot(s.n.x - B.x, s.n.z - B.z); if (d < bd) { bd = d; best = s; } } if (best && bd < 1.2) { const o = all[(Math.random() * all.length) | 0], ax = o.n.x - B.x, az = o.n.z - B.z, al = Math.hypot(ax, az) || 1; B.vx = ax / al * rnd(6, 9); B.vz = az / al * rnd(6, 9); B.cool = 0.7; AUD.thump(); } else if (best && Math.hypot(B.vx, B.vz) < 0.5) { B.vx = (best.n.x - B.x) * 0.8; B.vz = (best.n.z - B.z) * 0.8; } }
      B.o.position.set(B.x, 0, B.z); B.o.rotation.x += Math.hypot(B.vx, B.vz) * dt * 2;
    }
    // the big screen turns slowly
    if (this.cube) this.cube.rotation.y += dt * 0.15;
    if (this.party > 0) { this.party -= dt; if (Math.random() < dt * 3) FX.confetti(rnd(-14, 14), 6, rnd(-40, 10), 22); }
  },
  finale() {
    AUD.bigWin(); this.wave = 8; this.cheer = 2.5;
    later(0.4, () => UI.banner('KICKOFF!', 'The big game is on!', 'ball', 3.0));
    // the referee whistles, the home team kicks off
    const ref = NPC.spawn({ x: 2, z: -16, h: Math.PI, kind: 'adult', look: Object.assign(NPC.look('adult'), { jacket: 0x1c1f24, band: 0xffd34d, hatOn: false, hair: 0x1c1c1c }), tag: 'ref' });
    later(1.0, () => { AUD.tick(true); AUD.tick(true); if (this.ball) { this.ball.x = 0; this.ball.z = -16; this.ball.vx = 0; this.ball.vz = -7; this.ball.cool = 0.4; } NPC.cheer(ref, 2); });
    later(2.2, () => LIFE.fireworks(0, -16, 7));
    this.party = 9;
  },
  save() { return null; },
  load() { },
};
