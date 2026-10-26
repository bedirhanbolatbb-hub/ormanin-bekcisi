// ---------- chapter 5: Snowcap Resort (race day! chairlift, an avalanche, a ski race) ----------
const CH_RESORT = {
  id: 5, key: 'resort', name: 'Snowcap Resort', tag: 'Race day!',
  intro: 'The big ski race is today! Open the resort, start the chairlift and groom the race course with the Snow Groomer.',
  twist: 'Watch the mountain... fresh powder means DOUBLE coins!',
  color: '#2f6fe8', icon: 'lift', pack: 'ch5',
  music: () => SONG_RESORT,
  grid: { X0: -32, Z0: -66, NX: 321, NZ: 631 },
  start: { x: 0, z: 51, h: Math.PI },
  shop: ['truck', 'dumpplow', 'thrower', 'sleigh', 'zamboni', 'groomer'],
  unlock: { tool: 'groomer', goals: 3 },
  payMul: 4.0, par: [360, 560], reward: 100000,
  crewYard: [-10, 54.5], crewJobs: ['walkV', 'walkL'],
  introCam: { from: [-10, 46, 92], look: [0, 4, -20] },
  finaleCam: { from: [0, 11, 34], look: [0, 3, -16] },
  env: { sky: ['#1f5fc8', '#7fb6ee', '#f4e8d8'], fog: 0xdfe8f2, hemi: [0x9ec4f4, 0xf2ece4, 0.6], sun: [0xffd9a8, 2.25], sunOff: [18, 22, 10], exposure: 0.84, fogNear: 60, fogFar: 230 },
  goals: [
    { a: 'parking', t: 'Clear the resort parking', ico: 'car' },
    { a: 'village', t: 'Open the ski village', ico: 'shop' },
    { a: 'lift', t: 'Start the chairlift', ico: 'lift' },
    { a: 'finish', t: 'Groom the finish area', ico: 'flag' },
    { a: 'pisteS', t: 'Groom the race course', ico: 'flag' },
    { a: 'pisteN', t: 'Groom the top of the course', ico: 'flag' },
    { end: true, t: 'Race day!', ico: 'star' },
  ],
  treasure: { parking: [3, 1], village: [3, 1], lift: [2, 1], finish: [4, 2], pisteS: [5, 2], pisteN: [5, 2] },
  gates: [[-3.5, -12], [3.5, -21], [-3.5, -30], [3.5, -39], [-3.5, -48], [3.5, -56]],
  truckSpots() { const c = []; for (let zz = 18; zz <= 40; zz += 2) for (const xx of [-2, 0, 2]) c.push([xx, zz]); for (let zz = -58; zz <= 14; zz += 3) for (const xx of [-8, -4, 0, 4, 8]) c.push([xx, zz]); for (const xx of [-8, -4, 0, 4, 8]) c.push([xx, 48]); return c; },
  botZone(x, z) { return z > 42 ? 'P' : z > 16 ? 'V' : 'S'; },
  botOpen(x, z) { return z > 42 ? [0, 49] : z > 16 ? [0, clamp(z, 19, 39)] : [clamp(x, -8, 8), clamp(z, -56, 12)]; },
  botMouth(zp, zt, px, pz, tz) {
    if (zp === 'P') return [0, 39]; if (zp === 'S' && zt !== 'S') return [0, 19];
    if (zp === 'V') { if (zt === 'P' && pz < 39) return [0, 45]; if (zt === 'S' && pz > 19) return [0, 13]; }
    return null;
  },
  botTarget(p) { return p.z > 16 && p.z < 42 ? { x: clamp(p.x, -2.5, 2.5), z: p.z } : p; },
  layout() {
    PAVED.push({ r: rect(-14, 42, 14, 58), kind: 'asphalt', d: 0.44, key: 'parking' });
    PAVED.push({ r: rect(-6, 16, 6, 42), kind: 'pavers', d: 0.46, key: 'village' });
    PAVED.push({ r: rect(-16, 4, 16, 16), kind: 'piste', d: 0.5, key: 'finish' });
    PAVED.push({ r: rect(-12, -62, 12, 4), kind: 'piste', d: 0.52, key: 'piste' });
    PAVED.push({ r: rect(12, -24, 28, -6), kind: 'piste', d: 0.46, key: 'lift' });
    PAVED.push({ r: rect(6, 22, 8, 40), kind: 'walk', d: 0.3, key: 'walkV' });
    PAVED.push({ r: rect(28.2, -22, 30.2, -8), kind: 'walk', d: 0.3, key: 'walkL' });
  },
  areas(mk, pav) {
    mk('parking', 'Resort parking', [pav('parking')], { title: 'PARKING CLEAR!', ico: 'car' });
    mk('village', 'Ski village', [pav('village')], { title: 'VILLAGE OPEN!', ico: 'shop' });
    mk('lift', 'Chairlift', [pav('lift')], { title: 'LIFT IS RUNNING!', ico: 'lift' });
    mk('finish', 'Finish area', [pav('finish')], { title: 'FINISH READY!', ico: 'flag' });
    mk('pisteS', 'Race course', [rect(-12, -29, 12, 4)], { title: 'COURSE GROOMED!', ico: 'flag' });
    mk('pisteN', 'Course top', [rect(-12, -62, 12, -29)], { title: 'COURSE READY!', ico: 'flag' });
    mk('walkV', 'Village path', [pav('walkV')], { quiet: true });
    mk('walkL', 'Lift path', [pav('walkL')], { quiet: true });
  },
  // the mountain behind the course (static backdrop); height in metres at a point
  mountH(x, z) {
    if (z > -64) return 0;
    const d = -64 - z, base = Math.pow(Math.min(1, d / 120), 1.4) * 78;
    const ridge = Math.sin(x * 0.045 + 1.3) * 10 + Math.sin(x * 0.11 - z * 0.03) * 5 + (fbm(x * 0.03, z * 0.03) - 0.5) * 18;
    return Math.max(0, base + ridge * Math.min(1, d / 40));
  },
  build(scene, H, T) {
    const yardY = (x, z) => SNOW.depth(x, z) - 0.06;
    // ---- mountains ----
    { const W = 340, D = 190, nx = 96, nz = 60, g = new THREE.PlaneGeometry(W, D, nx, nz); g.rotateX(-Math.PI / 2); g.translate(0, 0, -64 - D / 2 + 2);
      const p = g.attributes.position, col = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i), y = this.mountH(x, z) - 0.3; p.setY(i, y);
        // rock shows on steep, high faces; snow everywhere else, a touch bluer in the shade
        const sx = this.mountH(x + 2, z) - this.mountH(x - 2, z), sz = this.mountH(x, z - 2) - this.mountH(x, z + 2), steep = Math.hypot(sx, sz) / 4;
        const rock = clamp((steep - 0.55) * 2.2 + (fbm(x * 0.12, z * 0.12) - 0.5) * 1.2, 0, 1) * clamp((y - 14) / 10, 0, 1);
        const shade = clamp(0.5 - sx * 0.08, 0, 1);
        const sr = lerp(0.97, 0.82, shade), sg = lerp(0.98, 0.87, shade), sb = 1.0;
        col[i * 3] = lerp(sr, 0.46, rock); col[i * 3 + 1] = lerp(sg, 0.48, rock); col[i * 3 + 2] = lerp(sb, 0.55, rock);
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 })); m.receiveShadow = true; scene.add(m);
      const fg = new THREE.PlaneGeometry(700, 120, 70, 12); fg.rotateX(-Math.PI / 2); fg.translate(0, 0, -300);
      const fp = fg.attributes.position;
      for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), z = fp.getZ(i), d = clamp((-250 - z) / 110, 0, 1); fp.setY(i, (60 + Math.sin(x * 0.02 + 0.7) * 30 + Math.sin(x * 0.051) * 18 + (fbm(x * 0.01, 3) - 0.5) * 40) * Math.sin(d * Math.PI) * 1.6); }
      fg.computeVertexNormals();
      scene.add(new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ color: 0xc8d8ee, roughness: 1 })));
      const fk = ['fir_a', 'fir_b', 'fir_c'], r = mulberry(555);
      for (let i = 0; i < 70; i++) { const x = -120 + r() * 240, z = -70 - r() * 60, y = this.mountH(x, z); if (Math.abs(x) < 16 && z > -80) continue; if (y > 35) continue; const t = place(fk[(r() * 3) | 0], x, z, r() * TAU, 1.4 + r() * 1.2, y - 0.2); t.traverse(c => { if (c.isMesh) c.castShadow = false; }); scene.add(t); }
    }
    // ---- village: ticket office, rental shop, lodge, restaurant ----
    this.shops = [];
    const shop = (key, x, z, rot, s, door) => { const B = litBuilding(key, x, z, rot, s, door, 0.1); this.shops.push(B); return B; };
    shop('ticket', 9.4, 33, -Math.PI / 2, 1.3, new V3(6.5, 0, 33));
    shop('rental', 11.6, 24.5, -Math.PI / 2, 1.05, new V3(6.5, 0, 24.5));
    shop('lodge', -13.0, 32, Math.PI / 2, 0.95, new V3(-6.5, 0, 32));
    shop('lodgewing', -11.2, 21, Math.PI / 2, 1.0, new V3(-6.5, 0, 21));
    const rs = makeSign('SNOWCAP RESORT', '#2a6fd6'); rs.position.set(0, 4.6, 42.4); rs.rotation.y = Math.PI; rs.scale.setScalar(3.0); scene.add(rs);
    for (const [x, z] of [[-6.6, 40], [6.6, 40], [-6.6, 18], [6.6, 18]]) decor('lamp_b', x, z, 0, 1.2, yardY(x, z), { trunk: 0.25 });
    decor('skirack', 7.4, 29.5, -Math.PI / 2, 1.3, yardY(7.4, 29.5)); decor('skirack', -7.4, 27, Math.PI / 2, 1.3, yardY(-7.4, 27));
    decor('deckchair', -8, 38, 0.6, 1.4, yardY(-8, 38)); decor('deckchair', -9.2, 37.4, 0.3, 1.4, yardY(-9.2, 37.4));
    decor('canopy', -20, 50, Math.PI / 2, 1.0, yardY(-20, 50));
    for (const [k, x, z] of [['car_blue', 18.5, 47], ['car_white', 18.6, 52], ['camper', -18.8, 56]]) { const c = place(k, x, z, Math.PI / 2, 1, yardY(x, z) - 0.25); scene.add(c); }
    // ---- finish area: arch, bleachers, scoreboard, gates on the course (under the snow until groomed) ----
    // a giant finish arch spanning the whole course (its posts stand just outside it)
    decorTall('finisharch', 0, 4.4, 0, 3.0, 0);
    for (const sx of [-1, 1]) SNOW.paint(sx * 12.35, 3.7, sx * 13.6, 5.1, (k) => { if (T[k] === 1) { T[k] = 2; H[k] = 0; } else if (T[k] === 0) T[k] = 2; });
    for (const [x, z] of [[-21.6, 10], [21.6, 10]]) decor('bleacher', x, z, x < 0 ? Math.PI / 2 : -Math.PI / 2, 1.7, yardY(x, z));
    decor('scoreboard', -21.5, 1.5, Math.PI / 2, 1.3, yardY(-21.5, 1.5));
    for (const [x, z] of [[-12.6, -2], [12.6, -40], [-12.6, -52], [12.6, -14]]) decor('snowgun', x, z, x < 0 ? Math.PI / 2 : -Math.PI / 2, 1.3, yardY(x, z), { trunk: 0.5 });
    this.guns = [[-12.6, -2], [12.6, -40], [-12.6, -52], [12.6, -14]];
    for (let z = -60; z <= 2; z += 6) for (const sx of [-1, 1]) decor('pistepole', sx * 12.9, z, 0, 1.2, yardY(sx * 12.9, z));
    for (let z = -58; z <= -4; z += 8) decor('windfence', -14.5, z, Math.PI / 2, 1.1, yardY(-14.5, z));
    this.gateObjs = [];
    for (let i = 0; i < this.gates.length; i++) { const [x, z] = this.gates[i], g = place(i % 2 ? 'gateblue' : 'gatered', x, z, 0, 1.3, 0); g.visible = false; scene.add(g); this.gateObjs.push(g); }
    // ---- chairlift: bottom station by the course, towers up the mountain, chairs that run once you clear the station ----
    const bot = place('liftbottom', 20.0, -30.6, Math.PI, 1.0, 0); scene.add(bot); solidUnder(bot, 0.05, true); this.liftBot = bot;
    this.liftWins = litMats(bot);
    const A = new V3(20.0, 6.2, -34.5), top = new V3(52, this.mountH(52, -170) + 7, -170);
    const tp = place('lifttop', top.x, top.z, Math.PI, 1.2, top.y - 7); scene.add(tp);
    this.cable = { A, B: top };
    const tw = [], n = 7;
    for (let i = 1; i < n; i++) { const t = i / n, x = lerp(A.x, top.x, t), z = lerp(A.z, top.z, t), y = this.mountH(x, z); const o = place('lifttower', x, z, Math.atan2(top.x - A.x, top.z - A.z), 1.1, y); scene.add(o); tw.push(o); }
    const cm = new THREE.LineBasicMaterial({ color: 0x2c3138 });
    for (const off of [-1.6, 1.6]) { const dir = new V3().subVectors(top, A).normalize(), side = new V3(dir.z, 0, -dir.x).normalize().multiplyScalar(off); const g = new THREE.BufferGeometry().setFromPoints([A.clone().add(side), top.clone().add(side)]); const l = new THREE.Line(g, cm); l.frustumCulled = false; scene.add(l); }
    this.chairs = [];
    for (let i = 0; i < 18; i++) { const c = place('chair', 0, 0, 0, 1.0, 0); scene.add(c); this.chairs.push({ o: c, s: i / 18, riders: [] }); }
    this.lift = { run: false, spd: 0 }; this.placeChairs(0);
    // trees around
    const r2 = mulberry(556), fk2 = ['fir_a', 'fir_b', 'fir_c', 'spruce_s'];
    for (let i = 0; i < 70; i++) {
      const x = -31 + r2() * 62, z = -64 + r2() * 122;
      if (Math.abs(x) < 14.5 && z < 6) continue; if (Math.abs(x) < 20 && z > 2 && z < 18) continue; if (Math.abs(x) < 16 && z > 16) continue; if (x > 10 && x < 30 && z > -30 && z < -4) continue;
      decor(fk2[(r2() * 4) | 0], x, z, r2() * TAU, 0.9 + r2() * 0.8, yardY(x, z), { trunk: 0.45 });
    }
    this.skiers = []; this.avalanche = null; this.powderT = 0;
  },
  placeChairs(ds) {
    const { A, B } = this.cable, dir = new V3().subVectors(B, A), L = dir.length(); dir.normalize();
    const side = new V3(dir.z, 0, -dir.x).normalize(), yaw = Math.atan2(dir.x, dir.z);
    for (const c of this.chairs) {
      c.s = (c.s + ds + 1) % 1;
      const up = c.s < 0.5, t = up ? c.s * 2 : (1 - c.s) * 2, sd = up ? 1.6 : -1.6;
      c.o.position.copy(A).addScaledVector(dir, t * L).addScaledVector(side, sd); c.o.position.y -= 2.6;
      c.o.rotation.y = yaw + (up ? 0 : Math.PI);
    }
  },
  startLift(silent) {
    if (this.lift.run) return; this.lift.run = true;
    this.liftWins.forEach(m => { const L = m.userData.lit; if (L) { m.color.copy(L.color); m.emissive.copy(L.emissive); m.emissiveIntensity = 1.6; } });
    for (const c of this.chairs) if (Math.random() < 0.7) for (const sx of [-0.55, 0.55]) { const P = makePersonLite(NPC.look(Math.random() < 0.5 ? 'kid' : 'adult')); P.root.scale.setScalar(0.95); P.root.position.set(sx, 0.62, 0.1); P.legL.rotation.x = P.legR.rotation.x = -1.3; c.o.add(P.root); c.riders.push(P); }
    if (!silent) { AUD.bigWin(); UI.toast('The chairlift is running!'); }
  },
  onDone(a, silent) {
    if (a.key === 'parking') { if (!silent) this.shuttle(); return new V3(0, 0, 50); }
    if (a.key === 'village') { for (const B of this.shops) { B.litT = 1; if (silent) { B.lit = 1; applyLit(B, 1); } } if (!silent) { this.walkers(6); CREW.recruit(2.0); } return new V3(0, 0, 30); }
    if (a.key === 'lift') { this.startLift(silent); if (!silent) later(4.5, () => this.startAvalanche()); return new V3(20, 0, -20); }
    if (a.key === 'finish') { for (let i = 0; i < 10; i++) { const x = i < 5 ? -20.3 : 20.3, f = NPC.spawn({ x, z: 7 + (i % 5) * 1.4, h: x < 0 ? Math.PI / 2 : -Math.PI / 2, kind: Math.random() < 0.5 ? 'kid' : 'adult', pose: 'wave', tag: 'fan', pop: !silent }); f.P.root.traverse(m => { if (m.isMesh) m.castShadow = false; }); } return new V3(0, 0, 10); }
    if (a.key === 'pisteS') { for (let i = 0; i < 3; i++) this.gateObjs[i].visible = true; if (!silent) { this.skiSchool(); } this.skiOn = true; return new V3(0, 0, -12); }
    if (a.key === 'pisteN') { for (const g of this.gateObjs) g.visible = true; return new V3(0, 0, -45); }
    return null;
  },
  shuttle() {
    const bus = place('shuttle', 4, 70, Math.PI, 1.1, 0); WORLD.scene.add(bus);
    this.bus = { o: bus, z: 70, state: 'in', t: 0 };
  },
  walkers(n) {
    for (let i = 0; i < n; i++) {
      const s = NPC.spawn({ x: rnd(-3, 3), z: rnd(44, 50), h: Math.PI, kind: Math.random() < 0.5 ? 'kid' : 'adult', tag: 'walker' });
      s.P.root.traverse(m => { if (m.isMesh) m.castShadow = false; });
      const shopB = this.shops[(Math.random() * this.shops.length) | 0];
      NPC.go(s, [[rnd(-2, 2), 38], [shopB.door.x * 0.8, shopB.door.z]], rnd(1.3, 1.9), (q) => { q.pose = 'wave'; later(rnd(4, 8), () => NPC.kill(q)); });
    }
  },
  // skiers come down the groomed course in long S-curves, then walk to the lift
  spawnSkier(kind) {
    const look = NPC.look(kind || (Math.random() < 0.4 ? 'kid' : 'adult'));
    const n = NPC.spawn({ x: rnd(-6, 6), z: -61, h: 0, kind: kind || 'adult', look, skate: true, pose: 'skate', tag: 'ski' });
    n.P.root.traverse(m => { if (m.isMesh) m.castShadow = false; });
    const sk = new THREE.Mesh(geo('skis', () => { const g = new THREE.BoxGeometry(0.34, 0.04, 1.5); g.translate(0, 0.02, 0.15); return g; }), mcol(0xe5483c, 0.5)); n.P.root.add(sk);
    this.skiers.push({ n, ph: rnd(0, TAU), amp: rnd(3, 6), spd: rnd(5.5, 8), wob: rnd(0.12, 0.2), x0: n.x });
  },
  skiSchool() {
    const look = Object.assign(NPC.look('adult'), { jacket: 0xe5483c, hat: 0xe5483c, brim: 0xffffff });
    const lead = { n: NPC.spawn({ x: -4, z: -28, h: 0, kind: 'adult', look, skate: true, pose: 'skate', tag: 'school' }), kids: [] };
    for (let i = 0; i < 6; i++) { const k = NPC.spawn({ x: -4, z: -30 - i * 1.4, h: 0, kind: 'kid', skate: true, pose: 'skate', tag: 'school' }); k.P.root.traverse(m => { if (m.isMesh) m.castShadow = false; }); lead.kids.push(k); }
    lead.t = 0; this.school = lead;
    NPC.say(lead.n, 'Follow me, kids!', 3);
  },
  startAvalanche() {
    if (this.avalanche || GAME.done.pisteN) return;
    // a wall of powder rolls down off the mountain onto the course: deeper snow = DOUBLE coins for a while
    this.avalanche = { z: -64, t: 0 };
    UI.banner('AVALANCHE!', 'Fresh powder: DOUBLE COINS!', 'star', 2.8); CAM.shake = 1.4; AUD.thump(); AUD.whoosh();
  },
  update(dt) {
    // chairlift
    if (this.lift.run) { this.lift.spd = damp(this.lift.spd, 0.012, 1, dt); this.placeChairs(this.lift.spd * dt); for (const c of this.chairs) for (const P of c.riders) animPerson(P, dt, { walk: 0, pose: 'idle', t: 0 }); }
    // the avalanche front sweeps down the course, dropping powder
    const Av = this.avalanche;
    if (Av && Av.z < 6) {
      Av.t += dt; const z0 = Av.z; Av.z += dt * 22;
      for (let i = 0; i < 26; i++) { const x = rnd(-13, 13); FX.emit(FX.norm, { x, y: rnd(0.5, 4), z: Av.z + rnd(-1, 1), vx: rnd(-1, 1), vy: rnd(1, 4), vz: rnd(4, 9), gr: 3, life: rnd(0.8, 1.4), s0: rnd(0.6, 1.2), s1: rnd(1.8, 3), a0: 0.85, a1: 0, dr: 0.8, c: [0.96, 0.97, 1] }); }
      if (Math.floor(z0 / 2) !== Math.floor(Av.z / 2)) {
        // powder on the parts of the course that are not groomed yet
        for (let x = -11; x <= 11; x += 2.2) { const k = SNOW.idx(x, Av.z), a = k >= 0 ? SNOW.areas[SNOW.A[k]] : null; if (a && !a.done && a.key.startsWith('piste')) SNOW.addSnow(x + rnd(-0.5, 0.5), Av.z, 2.2, 0.16, true); }
        CAM.shake = Math.max(CAM.shake, 0.25);
      }
      if (Av.z >= 6) { this.powderT = 30; STORM.mult = 2; UI.toast('Powder day! Double coins for 30 seconds'); }
    }
    if (this.powderT > 0) { this.powderT -= dt; UI.timer(this.powderT, 'star', '2x coins', 'good'); if (this.powderT <= 0) { if (STORM.phase !== 'bonus') STORM.mult = 1; UI.timer(null); } }
    // snow guns puff fresh snow over the course edges
    for (const [x, z] of this.guns) if (Math.random() < dt * 9) { const d = x < 0 ? 1 : -1; FX.emit(FX.norm, { x: x + d * 0.8, y: 2.6, z, vx: d * rnd(3, 5), vy: rnd(1.5, 3), vz: rnd(-1, 1), gr: 2.2, life: rnd(1, 1.8), s0: 0.2, s1: 0.8, a0: 0.8, a1: 0, dr: 0.6, c: [0.97, 0.98, 1] }); }
    // shuttle bus
    if (this.bus) {
      const S = this.bus; S.t += dt;
      if (S.state === 'in') { S.z = damp(S.z, 50, 1.2, dt); if (S.z < 50.4) { S.state = 'drop'; S.t = 0; AUD.horn(); this.walkers(5); } }
      else if (S.state === 'drop' && S.t > 3) S.state = 'out';
      else if (S.state === 'out') { S.z += dt * (2 + S.t * 3); if (S.z > 75) { WORLD.scene.remove(S.o); this.bus = null; } }
      if (this.bus) S.o.position.set(4, 0, S.z);
    }
    // skiers on the groomed course
    if (this.skiOn && !GAME.ended) { this.skiT = (this.skiT || 0) - dt; if (this.skiT <= 0 && this.skiers.length < 8) { this.skiT = rnd(2, 4); this.spawnSkier(); } }
    for (let i = this.skiers.length - 1; i >= 0; i--) {
      const S = this.skiers[i], n = S.n;
      if (n.state === 'out') { this.skiers.splice(i, 1); continue; }
      const topZ = GAME.done.pisteN ? -61 : -29;
      if (n.z < topZ) n.z = topZ;
      S.ph += dt * S.spd * S.wob;
      let nx = S.x0 + Math.sin(S.ph) * S.amp, nz = n.z + S.spd * dt;
      const dx = nx - PL.x, dz = nz - PL.z, d = Math.hypot(dx, dz), R = PL.kind === 'truck' ? PL.geo.halfW + 3 : 1.5;
      if (d < R) { nx += dx / (d || 1) * (R - d); }
      n.h = Math.atan2(nx - n.x, nz - n.z); n.x = nx; n.z = nz; n.moving = 1; n.P.body.rotation.z = Math.cos(S.ph) * 0.25;
      if (Math.random() < 0.4) FX.emit(FX.norm, { x: n.x, y: 0.1, z: n.z, vx: rnd(-1, 1), vy: rnd(0.5, 1.5), vz: rnd(-0.5, 0.5), gr: 4, life: 0.5, s0: 0.12, s1: 0.3, a0: 0.8, a1: 0, c: [0.97, 0.98, 1] });
      if (n.z > 10) { n.skate = false; NPC.go(n, [[17, -8], [20, -22]], 1.6, (q) => NPC.kill(q)); this.skiers.splice(i, 1); const v = niceNum(GAME.price() * 5); GAME.earn(v); if (Math.hypot(n.x - PL.x, n.z - PL.z) < 22) { FX.coinBurst(n.x, 1.5, n.z, 3, v, { up: 0.6 }); UI.floatText(new V3(n.x, 2.4, n.z), '+' + fmt(v), '#ffe9a8', 20); } else { UI.pending += v; UI.flyCoin(null, v); } }
    }
    // ski school: a little line of kids snaking down behind the instructor
    const Sc = this.school;
    if (Sc) {
      Sc.t += dt; const L = Sc.n, z = -28 + ((Sc.t * 2.2) % 30), x = -5 + Math.sin(Sc.t * 0.9) * 4;
      L.h = Math.atan2(x - L.x, z - L.z); L.x = x; L.z = z; L.moving = 1;
      let px = L.x, pz = L.z;
      for (const k of Sc.kids) { const dx = px - k.x, dz = pz - k.z, d = Math.hypot(dx, dz); if (d > 1.3) { k.x += dx / d * (d - 1.3); k.z += dz / d * (d - 1.3); k.h = Math.atan2(dx, dz); } k.moving = 1; px = k.x; pz = k.z; }
    }
    // the race (finale)
    const R = this.race;
    if (R) {
      R.t += dt;
      for (const r of R.list) {
        if (r.done) continue;
        const g = this.gates[r.gi], tx = g ? g[0] + (r.gi % 2 ? 1.6 : -1.6) : r.lane, tz = g ? g[1] : 12;
        const dx = tx - r.n.x, dz = tz - r.n.z, d = Math.hypot(dx, dz);
        const sp = r.spd * (R.t < 1.2 ? R.t / 1.2 : 1);
        r.n.x += dx / d * sp * dt; r.n.z += dz / d * sp * dt; r.n.h = dampAng(r.n.h, Math.atan2(dx, dz), 8, dt); r.n.moving = 1;
        r.n.P.body.rotation.z = clamp(dx * 0.1, -0.35, 0.35);
        if (Math.random() < 0.6) FX.spray(r.n.x, 0.15, r.n.z, -dx / d, -dz / d, 1, 2.2, 0.14);
        if (d < 1.2) { r.gi++; if (r.gi > this.gates.length) { r.done = true; R.place++; if (R.place === 1) { UI.floatText(new V3(r.n.x, 3, r.n.z), 'WINNER!', '#ffd34d', 36); FX.confetti(r.n.x, 2.5, r.n.z, 60); AUD.cheer(); for (const f of NPC.byTag('fan')) NPC.cheer(f, 3); } r.n.skate = false; r.n.pose = 'wave'; NPC.cheer(r.n, 3); } }
      }
    }
    if (this.party > 0) { this.party -= dt; if (Math.random() < dt * 3) FX.confetti(rnd(-12, 12), 5, rnd(0, 14), 20); }
  },
  finale() {
    AUD.bigWin();
    later(0.4, () => UI.banner('RACE DAY!', '3... 2... 1... GO!', 'flag', 3.0));
    // four racers set off from the top of the course
    const cols = [0xe5483c, 0x2f6fe8, 0x2fb36a, 0xffb020], list = [];
    for (let i = 0; i < 4; i++) {
      const look = Object.assign(NPC.look('adult'), { jacket: cols[i], hat: cols[i], brim: 0xffffff, scale: 1.2 });
      const n = NPC.spawn({ x: -4.5 + i * 3, z: -60, h: 0, kind: 'adult', look, skate: true, pose: 'skate', tag: 'race' });
      const sk = new THREE.Mesh(geo('skis'), mcol(0x2b3a55, 0.5)); n.P.root.add(sk);
      list.push({ n, gi: 0, spd: rnd(12, 14.5), lane: -4.5 + i * 3 });
    }
    this.race = { list, t: 0, place: 0 };
    later(4.5, () => LIFE.fireworks(0, 6, 7));
    this.party = 9;
  },
  save() { return {}; },
  load(o) { },
};
