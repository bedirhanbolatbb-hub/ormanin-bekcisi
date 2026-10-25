// ---------- chapter 4: Frozen Lake (slippery ice: drift! skaters, a hockey game, ice fishing) ----------
const CH_LAKE = {
  id: 4, key: 'lake', name: 'Frozen Lake', tag: 'Skate party!',
  intro: 'The lake froze overnight! Clear the ice so everyone can skate. Careful: machines slide on ice!',
  twist: 'Slide sideways on the ice to DRIFT for bonus coins!',
  color: '#3a9be0', icon: 'skate', pack: 'ch4',
  grid: { X0: -30, Z0: -64, NX: 301, NZ: 621 },
  start: { x: 0, z: 49.5, h: Math.PI },
  shop: ['truck', 'dumpplow', 'thrower', 'sleigh', 'zamboni'],
  payMul: 3.2, par: [330, 520], reward: 40000,
  crewYard: [-9.5, 52.5], crewJobs: ['shoreW', 'shoreE'],
  introCam: { from: [0, 42, 90], look: [0, 0.5, 4] },
  finaleCam: { from: [26, 22, 18], look: [0, 1.5, -6] },
  env: { sky: ['#2f7fd8', '#86c0f0', '#e8f5fd'], fog: 0xdcecf8, hemi: [0xa8d0ff, 0xeaf2fa, 0.6], sun: [0xfff0d6, 2.35], sunOff: [12, 26, 14], exposure: 0.84, fogNear: 48, fogFar: 135 },
  lake: { cx: 0, cz: -12, rx: 18.5, rz: 35.5 },
  goals: [
    { a: 'lot', t: 'Clear the lake parking', ico: 'car' },
    { a: 'south', t: 'Clear the ice for skaters', ico: 'skate' },
    { a: 'rink', t: 'Clear the hockey rink', ico: 'skate' },
    { a: 'huts', t: 'Free the ice fishers', ico: 'skate' },
    { a: 'dock', t: 'Clear the boathouse dock', ico: 'skate' },
    { end: true, t: 'Skate party!', ico: 'star' },
  ],
  treasure: { lot: [3, 1], south: [4, 2], rink: [4, 2], huts: [4, 2], dock: [3, 2] },
  onLake(x, z) { const L = this.lake; return ((x - L.cx) / L.rx) ** 2 + ((z - L.cz) / L.rz) ** 2 <= 1; },
  // machines slide on the lake (the ice machine grips much better)
  ice(x, z) { return SNOW.type(x, z) === 1 && this.onLake(x, z); },
  truckSpots() { const c = []; for (let zz = -40; zz <= 30; zz += 2) for (const xx of [-8, -4, 0, 4, 8]) if (this.onLake(xx, zz) || Math.abs(xx) < 4.5) c.push([xx, zz]); for (const xx of [-8, -4, 0, 4, 8]) c.push([xx, 46]); return c; },
  botZone(x, z) { return z > 34 ? 'P' : 'L'; },
  botOpen(x, z) { return z > 34 ? [0, 45] : [clamp(x, -6, 6), clamp(z, -40, 20)]; },
  botMouth(zp, zt, px, pz, tz) { if (zp === 'P') return [0, 31]; if (zt === 'P' && pz < 30) return [0, 37]; return null; },
  layout() {
    const L = this.lake;
    PAVED.push({ r: rect(-12.5, 38, 12.5, 56), kind: 'asphalt', d: 0.44, key: 'lot' });
    PAVED.push({ r: rect(-5, 21, 5, 38), kind: 'flags', d: 0.36, key: 'ramp' });
    PAVED.push({ r: rect(L.cx - L.rx, L.cz - L.rz, L.cx + L.rx, L.cz + L.rz), kind: 'ice', d: 0.32, key: 'lake', mask: (x, z) => this.onLake(x, z) });
    PAVED.push({ r: rect(-21.5, -14, -19.5, 2), kind: 'walk', d: 0.3, key: 'shoreW' });
    PAVED.push({ r: rect(19.5, -30, 21.5, -14), kind: 'walk', d: 0.3, key: 'shoreE' });
  },
  areas(mk, pav) {
    const on = (x, z) => this.onLake(x, z);
    mk('lot', 'Lake parking', [pav('lot')], { title: 'PARKING CLEAR!', ico: 'car' });
    mk('south', 'South ice', [rect(-19, 4, 19, 24), rect(-5, 21, 5, 38)], { title: 'ICE IS OPEN!', ico: 'skate', mask: (x, z) => on(x, z) || (Math.abs(x) <= 5 && z > 20) });
    mk('rink', 'Hockey rink', [rect(-19, -16, 19, 4)], { title: 'GAME ON!', ico: 'skate', mask: on });
    mk('huts', 'Fishing ice', [rect(-19, -32, 19, -16)], { title: 'FISH ARE BITING!', ico: 'skate', mask: on });
    mk('dock', 'Boathouse ice', [rect(-19, -48, 19, -32)], { title: 'DOCK CLEAR!', ico: 'skate', mask: on });
    mk('shoreW', 'West shore', [pav('shoreW')], { quiet: true });
    mk('shoreE', 'East shore', [pav('shoreE')], { quiet: true });
  },
  build(scene, H, T) {
    const yardY = (x, z) => SNOW.depth(x, z) - 0.06, L = this.lake;
    // rink markings frozen into the ice (you uncover them): centre line, blue lines, face-off circles, goal creases
    const red = new THREE.MeshStandardMaterial({ color: 0xe5483c, roughness: 0.3 }), blue = new THREE.MeshStandardMaterial({ color: 0x2f6fe8, roughness: 0.3 });
    const rg = [], bg = [];
    const strip = (L, x0, z0, x1, z1) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0.008, (z0 + z1) / 2); L.push(g); };
    strip(rg, -13, -6.25, 13, -5.75); strip(bg, -13, -1.3, 13, -0.7); strip(bg, -13, -11.3, 13, -10.7);
    for (const [cx, cz] of [[0, -6], [-6, 1.2], [6, 1.2], [-6, -13.2], [6, -13.2]]) { const g = new THREE.RingGeometry(2.0, 2.2, 40); g.rotateX(-Math.PI / 2); g.translate(cx, 0.009, cz); rg.push(g); }
    for (const zc of [2.6, -14.6]) { const g = new THREE.CircleGeometry(1.6, 24, zc > 0 ? Math.PI : 0, Math.PI); g.rotateX(-Math.PI / 2); g.translate(0, 0.009, zc); bg.push(g); }
    scene.add(new THREE.Mesh(mergeGeoms(rg), red)); scene.add(new THREE.Mesh(mergeGeoms(bg), blue));
    // ---- parking + skate rental ----
    const kiosk = litBuilding('kiosk', 11.2, 53.0, -Math.PI / 2, 1.25, new V3(9.6, 0, 53), 0.1); this.kiosk = kiosk;
    const ks = makeSign('SKATE RENTAL', '#2a6fd6'); ks.position.set(9.6, 3.8, 53); ks.rotation.y = -Math.PI / 2; ks.scale.setScalar(2.2); scene.add(ks);
    decor('bench_a', -11.6, 46, Math.PI / 2, 1, 0, { solid: 0.05, paved: true }); decor('saltbin', -11.4, 55.2, 0.3, 1.4, 0, { solid: 0.05, paved: true });
    for (const [x, z] of [[-12.9, 40], [12.9, 40], [-12.9, 55], [12.9, 46]]) decor('lamp_a', x, z, 0, 1.1, yardY(x, z), { trunk: 0.3 });
    const parked = [['car_blue', -8.8, 56.8], ['camper', -4.4, 57.2], ['car_white', 4.6, 56.8]];
    for (const [k, x, z] of parked) { const c = place(k, x, z, Math.PI, 1, yardY(x, z) - 0.25); scene.add(c); }
    // ---- lake shore: boathouse + dock, sauna, bleachers, floodlights, frozen rowboats ----
    const bh = litBuilding('boathouse', 0, -52.4, 0, 2.0, new V3(0, 0, -48.2), 0.1); this.boathouse = bh;
    // wooden dock out onto the ice (planks under the snow)
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a6440, roughness: 0.85 }), pg = [];
    for (let z = -47; z <= -40; z += 0.55) { const g = new THREE.BoxGeometry(3.4, 0.08, 0.46); g.translate(0, 0.05, z); pg.push(g.toNonIndexed()); }
    { const m = new THREE.Mesh(mergeGeoms(pg), wood); m.receiveShadow = true; scene.add(m); }
    const sauna = litBuilding('sauna', 23.6, -22, -Math.PI / 2, 1.1, new V3(21.4, 0, -22), 0.1); sauna.smoke = new V3(23.2, 5.6, -22.6); this.sauna = sauna;
    for (const [z, r] of [[-2.5, Math.PI / 2], [-9.5, Math.PI / 2]]) decor('bleacher', -23.2, z, r, 1.6, yardY(-23.2, z));
    for (const [x, z] of [[-20.6, 6], [-20.6, -18], [20.6, 6], [20.6, -36]]) { decor('floodlight', x, z, 0, 1.0, yardY(x, z), { trunk: 0.3 }); }
    decor('scoreboard', -24.5, -6, Math.PI / 2, 1.2, yardY(-24.5, -6));
    for (const [x, z, r] of [[-15.5, 14, 0.4], [15.2, -38, 2.2], [-12.5, -41, 1.1]]) { const b = place('rowboat', x, z, r, 1.5, 0.02); scene.add(b); solidUnder(b, 0.1, true); }
    decor('snowarch', 24.6, 10, -1.2, 1.6, yardY(24.6, 10));
    // ---- ice fishing huts out on the ice ----
    this.huts = [];
    for (const [x, z, r] of [[-9.5, -24.5, 0.3], [8.5, -21.5, -0.4], [2.0, -29.5, 0.1]]) { const h = litBuilding('hut', x, z, r, 0.9, new V3(x, 0, z + 1.8), 0.15); this.huts.push(h); }
    // trees and banks around the lake
    const rr = mulberry(444), fk = ['fir_a', 'fir_b', 'fir_c', 'spruce_s', 'birch'];
    for (let i = 0; i < 90; i++) {
      const x = -29 + rr() * 58, z = -62 + rr() * 118;
      const dl = ((x - L.cx) / (L.rx + 4)) ** 2 + ((z - L.cz) / (L.rz + 4)) ** 2;
      if (dl < 1) continue; if (z > 34 && Math.abs(x) < 15) continue; if (Math.abs(x) < 7 && z > 18) continue;
      if ((x < -18 && z > -16 && z < 4) || (x > 18 && z > -30 && z < -14)) continue;
      decor(fk[(rr() * fk.length) | 0], x, z, rr() * TAU, 0.9 + rr() * 0.8, yardY(x, z), { trunk: 0.45 });
    }
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, x = L.cx + Math.sin(a) * (L.rx + 1.6), z = L.cz + Math.cos(a) * (L.rz + 1.6); if (z > 18 && Math.abs(x) < 8) continue; decor('snowbank', x, z, a, 1.2 + rr() * 0.6, yardY(x, z)); }
    this.skaters = []; this.hockey = null; this.fishT = 0; this.drift = 0; this.driftT = 0;
  },
  onDone(a, silent) {
    if (a.key === 'lot') { this.kiosk.litT = 1; if (silent) { this.kiosk.lit = 1; applyLit(this.kiosk, 1); } if (!silent) UI.toast('The skate rental is open!'); return new V3(9.6, 0, 53); }
    if (a.key === 'south') { this.addSkaters(7, [0, 13], [12, 7], silent); return new V3(0, 0, 14); }
    if (a.key === 'rink') { this.startHockey(silent); this.addSkaters(2, [0, -6], [14, 8], silent); return new V3(0, 0, -6); }
    if (a.key === 'huts') {
      for (const h of this.huts) { h.litT = 1; if (silent) { h.lit = 1; applyLit(h, 1); } }
      if (!silent) for (const h of this.huts) { const f = NPC.spawn({ x: h.door.x, z: h.door.z, h: 0, kind: 'adult', pose: 'wave', tag: 'fish', look: Object.assign(NPC.look('adult'), { hat: 0x3a4a5a, brim: 0x2a3440, beard: 0x8a6a4a }) }); NPC.say(f, ['Fish are biting!', 'Thanks, friend!', 'Look at this one!'][(Math.random() * 3) | 0], 3); }
      this.fishOn = true; if (!silent) CREW.recruit(2.0);
      return new V3(0, 0, -25);
    }
    if (a.key === 'dock') { this.boathouse.litT = 1; this.sauna.litT = 1; if (silent) { this.boathouse.lit = 1; applyLit(this.boathouse, 1); this.sauna.lit = 1; applyLit(this.sauna, 1); } this.addSkaters(4, [0, -38], [11, 6], silent); return new V3(0, 0, -44); }
    return null;
  },
  // skaters glide in loops on the cleared ice (and swerve around your machine)
  addSkaters(n, c, r, silent) {
    for (let i = 0; i < n; i++) {
      const k = NPC.spawn({ x: c[0], z: c[1], kind: Math.random() < 0.55 ? 'kid' : 'adult', skate: true, pose: 'skate', tag: 'skate', pop: !silent });
      k.P.root.traverse(m => { if (m.isMesh) m.castShadow = false; });
      this.skaters.push({ n: k, cx: c[0] + rnd(-2, 2), cz: c[1] + rnd(-2, 2), rx: r[0] * rnd(0.45, 1), rz: r[1] * rnd(0.45, 1), a: rnd(0, TAU), w: rnd(0.25, 0.45) * (Math.random() < 0.5 ? 1 : -1), off: 0 });
    }
  },
  startHockey(silent) {
    // goals appear, two little teams chase the puck
    const goals = [];
    for (const [z, r] of [[2.4, Math.PI], [-14.4, 0]]) { const g = place('hockeygoal', 0, z, r, 1.5, 0); WORLD.scene.add(g); goals.push(g); SNOW.paint(-1.5, z - 0.8, 1.5, z + 0.8, (k) => { if (SNOW.T[k] === 1) { SNOW.T[k] = 2; SNOW.H[k] = 0; } }); }
    if (!silent) PL.ensureFree();
    const pl = [];
    for (let i = 0; i < 6; i++) {
      const team = i % 2, look = Object.assign(NPC.look('adult'), { jacket: team ? 0x2f6fe8 : 0xe5483c, band: 0xffffff, hat: team ? 0x1d4ea8 : 0xa8241c, brim: 0xffffff, scale: 1.15 });
      const p = NPC.spawn({ x: rnd(-6, 6), z: rnd(-11, -1), kind: 'adult', skate: true, pose: 'skate', tag: 'hockey', look, pop: !silent });
      p.P.root.traverse(m => { if (m.isMesh) m.castShadow = false; });
      pl.push({ n: p, team, vx: 0, vz: 0 });
    }
    const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 14), mcol(0x15181c, 0.4)); puck.position.set(0, 0.06, -6); WORLD.scene.add(puck);
    this.hockey = { pl, puck, px: 0, pz: -6, vx: 0, vz: 0, score: [0, 0], cool: 0 };
    // fans on the shore
    for (let i = 0; i < 6; i++) { const f = NPC.spawn({ x: -21.2 + rnd(-0.4, 0.4), z: -12 + i * 2.1, h: Math.PI / 2, kind: Math.random() < 0.5 ? 'kid' : 'adult', pose: 'wave', tag: 'fan', pop: !silent }); f.P.root.traverse(m => { if (m.isMesh) m.castShadow = false; }); }
    if (!silent) UI.toast('Face-off! The hockey game is on!');
  },
  update(dt) {
    const now = performance.now() / 1000;
    // skaters
    for (const s of this.skaters) {
      const n = s.n; if (n.state === 'out') continue;
      s.a += s.w * dt;
      let x = s.cx + Math.cos(s.a) * s.rx, z = s.cz + Math.sin(s.a) * s.rz;
      // swerve around your machine
      const dx = x - PL.x, dz = z - PL.z, d = Math.hypot(dx, dz), R = (PL.kind === 'truck' ? PL.geo.halfW + 3.2 : 1.5);
      s.off = damp(s.off, d < R + 2 ? (R + 2 - d) : 0, 4, dt);
      if (d > 0.01) { x += dx / d * s.off; z += dz / d * s.off; }
      const mvx = x - n.x, mvz = z - n.z, sp = Math.hypot(mvx, mvz);
      if (sp > 0.001) n.h = dampAng(n.h, Math.atan2(mvx, mvz), 6, dt);
      n.x = x; n.z = z; n.moving = 1;
      if (Math.random() < dt * 1.2) FX.emit(FX.add, { x: n.x, y: 0.05, z: n.z, vx: rnd(-0.2, 0.2), vy: 0.3, vz: rnd(-0.2, 0.2), life: 0.5, s0: 0.12, s1: 0.02, a0: 0.8, a1: 0, c: [0.85, 0.95, 1] });
    }
    // hockey
    const Hk = this.hockey;
    if (Hk) {
      Hk.cool -= dt;
      Hk.px += Hk.vx * dt; Hk.pz += Hk.vz * dt; Hk.vx *= Math.exp(-0.6 * dt); Hk.vz *= Math.exp(-0.6 * dt);
      if (Hk.px < -10 || Hk.px > 10) { Hk.vx *= -0.8; Hk.px = clamp(Hk.px, -10, 10); }
      if (Hk.pz > 1.6 || Hk.pz < -13.6) {
        if (Math.abs(Hk.px) < 1.2 && Hk.cool <= 0) { const t = Hk.pz > 0 ? 1 : 0; Hk.score[t]++; this.goal(t); }
        Hk.vz *= -0.8; Hk.pz = clamp(Hk.pz, -13.6, 1.6);
      }
      Hk.puck.position.set(Hk.px, 0.06, Hk.pz);
      for (const p of Hk.pl) {
        const n = p.n, tx = Hk.px + (p.team ? 0.6 : -0.6), tz = Hk.pz + (p.team ? -0.8 : 0.8), dx = tx - n.x, dz = tz - n.z, d = Math.hypot(dx, dz);
        const want = 3.6 + (p.team ? 0.2 : 0);
        p.vx = damp(p.vx, d > 0.1 ? dx / d * want : 0, 1.6, dt); p.vz = damp(p.vz, d > 0.1 ? dz / d * want : 0, 1.6, dt);
        // keep off your machine
        const ox = n.x - PL.x, oz = n.z - PL.z, od = Math.hypot(ox, oz), R = PL.kind === 'truck' ? PL.geo.halfW + 3 : 1.2;
        if (od < R) { p.vx += ox / (od || 1) * 6 * dt * 10; p.vz += oz / (od || 1) * 6 * dt * 10; }
        n.x = clamp(n.x + p.vx * dt, -11, 11); n.z = clamp(n.z + p.vz * dt, -15, 3); n.moving = Math.min(1, Math.hypot(p.vx, p.vz) / 3);
        if (Math.hypot(p.vx, p.vz) > 0.3) n.h = dampAng(n.h, Math.atan2(p.vx, p.vz), 7, dt);
        if (d < 0.9 && Hk.cool <= 0.6) { const gz = p.team ? -14.4 : 2.4, ax = rnd(-4, 4) - Hk.px, az = gz - Hk.pz, al = Math.hypot(ax, az); Hk.vx = ax / al * rnd(7, 11); Hk.vz = az / al * rnd(7, 11); Hk.cool = 0.5; AUD.thump(); }
      }
    }
    // the fishers sometimes pull up a fish (and coins)
    if (this.fishOn && !GAME.ended) {
      this.fishT -= dt;
      if (this.fishT <= 0) { this.fishT = rnd(3, 6); const h = this.huts[(Math.random() * this.huts.length) | 0], v = niceNum(GAME.price() * 10); GAME.earn(v); FX.coinBurst(h.door.x, 1.6, h.door.z, 5, v, { up: 0.8 }); FX.sparkle(h.door.x, 1.2, h.door.z, 8, 0.6, [0.6, 0.9, 1]); if (Math.hypot(h.door.x - PL.x, h.door.z - PL.z) < 24) UI.floatText(new V3(h.door.x, 2.6, h.door.z), 'FISH! +' + fmt(v), '#9fe8ff', 24); }
    }
    // drift scoring (sliding sideways on the ice)
    if (PL.kind === 'truck' && this.ice(PL.x, PL.z)) {
      const lat = Math.abs(PL.slideLat || 0);
      if (lat > 1.6 && PL.moveAmt > 0.2) {
        this.drift += dt; this.driftAmt = (this.driftAmt || 0) + lat * dt;
        if (Math.random() < 0.6) { const bx = PL.x - Math.sin(PL.h) * PL.geo.rear, bz = PL.z - Math.cos(PL.h) * PL.geo.rear; FX.spray(bx + rnd(-1, 1), 0.2, bz + rnd(-1, 1), rnd(-1, 1), rnd(-1, 1), 2, 2.2, 0.14); FX.emit(FX.add, { x: bx, y: 0.1, z: bz, vx: rnd(-1, 1), vy: rnd(0.5, 1.2), vz: rnd(-1, 1), life: 0.5, s0: 0.2, s1: 0.02, a0: 1, a1: 0, fl: 1, c: [0.8, 0.95, 1] }); }
        if (this.drift > 0.55 && !this.driftShown) { this.driftShown = 1; UI.floatText(new V3(PL.x, 3.6, PL.z), 'DRIFT!', '#9fe8ff', 30); AUD.whoosh(); }
      } else if (this.drift > 0) {
        if (this.drift > 0.55) { const v = niceNum(GAME.price() * (12 + this.driftAmt * 6)); GAME.earn(v); FX.coinBurst(PL.x, 2.4, PL.z, 8, v, { up: 1 }); UI.floatText(new V3(PL.x, 4.0, PL.z), 'DRIFT +' + fmt(v), '#7dffb0', 30); AUD.cash(); }
        this.drift = 0; this.driftAmt = 0; this.driftShown = 0;
      }
    }
    if (this.party > 0) { this.party -= dt; if (Math.random() < dt * 3) FX.confetti(rnd(-10, 10), 5, rnd(-30, 10), 20); }
  },
  goal(team) {
    UI.floatText(new V3(0, 3, team ? 2.4 : -14.4), 'GOAL!', team ? '#7fb2ff' : '#ff8a80', 34);
    AUD.horn(); AUD.cheer();
    for (const f of NPC.byTag('fan')) NPC.cheer(f, 2);
    const v = niceNum(GAME.price() * 8); GAME.earn(v); FX.coinBurst(0, 2, team ? 2.4 : -14.4, 6, v, { up: 1 }); FX.confetti(0, 2, team ? 2.4 : -14.4, 30);
    const Hk = this.hockey; Hk.px = 0; Hk.pz = -6; Hk.vx = Hk.vz = 0; Hk.cool = 1.6;
  },
  finale() {
    LIFE.fireworks(0, -8, 9); AUD.bigWin();
    later(0.6, () => UI.banner('SKATE PARTY!', 'The whole town is on the ice', 'star', 4.0));
    this.addSkaters(10, [0, -6], [14, 22], false);
    for (const s of this.skaters) s.w *= 1.3;
    this.party = 9;
  },
  save() { return { h: this.hockey ? this.hockey.score : null }; },
  load(o) { if (o && o.h && this.hockey) this.hockey.score = o.h; },
};
