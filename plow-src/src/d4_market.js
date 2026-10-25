// ---------- chapter 3: the Winter Market (every stall you clear opens and earns coins for you) ----------
const CH_MARKET = {
  id: 3, key: 'market', name: 'Winter Market', tag: 'Open the market!',
  intro: 'The Christmas market opens tonight! Clear the lanes: every stall you open starts selling and pays you coins.',
  twist: 'Open stalls earn coins for you, even while you plow!',
  color: '#e5483c', icon: 'stall', pack: 'ch3',
  music: () => SONG_MARKET,
  grid: { X0: -30, Z0: -74, NX: 301, NZ: 671 },
  start: { x: 0, z: 52.5, h: Math.PI },
  shop: ['truck', 'dumpplow', 'thrower', 'sleigh'],
  unlock: { tool: 'sleigh', goals: 2 },
  payMul: 2.4, par: [330, 520], reward: 15000,
  crewYard: [-8.5, 55.5], crewJobs: ['walkN', 'walkE', 'walkW'],
  introCam: { from: [0, 34, 92], look: [0, 0.5, 14] },
  finaleCam: { from: [17, 15, -24], look: [0, 4.5, -47] },
  env: { sky: ['#0b1238', '#2c3570', '#c9788a'], fog: 0x323866, hemi: [0x6a7ad0, 0x232a58, 0.62], sun: [0xffa070, 0.62], sunOff: [-20, 14, 12], exposure: 0.74, fogNear: 40, fogFar: 112 },
  goals: [
    { a: 'gate', t: 'Open the market gate', ico: 'stall' },
    { a: 'lane1', t: 'Open the toy stalls', ico: 'stall' },
    { a: 'lane2', t: 'Open the cocoa stalls', ico: 'stall' },
    { a: 'lane3', t: 'Open the gift stalls', ico: 'stall' },
    { a: 'plazaS', t: 'Clear the Christmas square', ico: 'tree' },
    { a: 'plazaN', t: 'Light up the Grand Tree', ico: 'tree' },
    { end: true, t: 'The Winter Market is open!', ico: 'star' },
  ],
  treasure: { gate: [3, 1], lane1: [3, 1], lane2: [3, 1], lane3: [3, 1], plazaS: [5, 2], plazaN: [5, 2] },
  tree: [0, -47], trackR: 10.5,
  truckSpots() { const c = []; for (let zz = -26; zz <= 42; zz += 2) for (const xx of [-1.5, 0, 1.5]) c.push([xx, zz]); for (const xx of [-6, -3, 0, 3, 6]) { c.push([xx, 51]); c.push([xx, -34]); c.push([xx, -60]); } for (const xx of [-13, 13]) { c.push([xx, -40]); c.push([xx, -55]); } return c; },
  botZone(x, z) { return z > 44 ? 'G' : z < -30 ? 'P' : 'L'; },
  botOpen(x, z) { return z > 44 ? [0, 51] : z < -30 ? [clamp(x, -12, 12), clamp(z, -60, -34)] : [0, clamp(z, -26, 41)]; },
  botMouth(zp, zt, px, pz, tz) {
    if (zp === 'G') return [0, 41]; if (zp === 'P') return [0, -27.5];
    if (zt === 'G' && pz < 40) return [0, 45]; if (zt === 'P' && pz > -27) return [0, -31];
    return null;
  },
  botTarget(p) { return p.z > -30 && p.z < 44 ? { x: clamp(p.x, -1.6, 1.6), z: p.z } : p; },
  layout() {
    PAVED.push({ r: rect(-11, 44, 11, 59), kind: 'cobble', d: 0.42, key: 'gate' });
    PAVED.push({ r: rect(-5, -30, 5, 44), kind: 'cobble', d: 0.44, key: 'lane' });
    PAVED.push({ r: rect(-17, -64, 17, -30), kind: 'cobble', d: 0.46, key: 'plaza' });
    PAVED.push({ r: rect(-17, -67.5, 17, -64), kind: 'flags', d: 0.3, key: 'walkN' });
    PAVED.push({ r: rect(17, -60, 19.5, -34), kind: 'flags', d: 0.3, key: 'walkE' });
    PAVED.push({ r: rect(-19.5, -60, -17, -34), kind: 'flags', d: 0.3, key: 'walkW' });
  },
  areas(mk, pav) {
    mk('gate', 'Market gate', [pav('gate')], { title: 'GATE OPEN!', ico: 'stall' });
    mk('lane1', 'Toy lane', [rect(-5, 20, 5, 44)], { title: 'STALLS OPEN!', ico: 'stall' });
    mk('lane2', 'Cocoa lane', [rect(-5, -5, 5, 20)], { title: 'STALLS OPEN!', ico: 'stall' });
    mk('lane3', 'Gift lane', [rect(-5, -30, 5, -5)], { title: 'STALLS OPEN!', ico: 'stall' });
    mk('plazaS', 'Christmas square', [rect(-17, -47, 17, -30)], { title: 'SQUARE CLEAR!', ico: 'tree' });
    mk('plazaN', 'Grand tree', [rect(-17, -64, 17, -47)], { title: 'THE TREE IS LIT!', ico: 'tree' });
    mk('walkN', 'North walk', [pav('walkN')], { quiet: true });
    mk('walkE', 'East walk', [pav('walkE')], { quiet: true });
    mk('walkW', 'West walk', [pav('walkW')], { quiet: true });
  },
  build(scene, H, T) {
    const yardY = (x, z) => SNOW.depth(x, z) - 0.06;
    // ---- stalls along the market lane (dark until you clear their lane) ----
    this.stalls = [];
    const kinds = ['toystall', 'cocoastall', 'cocoastall', 'toystall'];
    const lanes = [['lane1', 38, 26], ['lane2', 13, 1], ['lane3', -12, -24]];
    let n = 0;
    for (const [lane, z1, z2] of lanes) for (const zc of [z1, z2]) for (const sx of [-1, 1]) {
      const key = kinds[n++ % kinds.length], s = 1.75;
      const B = litBuilding(key, sx * 7.15, zc, sx < 0 ? Math.PI / 2 : -Math.PI / 2, s, new V3(sx * 4.4, 0, zc), 0.1);
      B.lane = lane; B.side = sx; B.open = false; B.incT = rnd(0, 2.4);
      this.stalls.push(B);
    }
    // lantern posts between the stalls, string lights across the lane (all glowing at dusk)
    glowUp('lantern2', 3.0); glowUp('festoon', 3.5); glowUp('gateway', 2.0); glowUp('clocktower', 1.6);
    for (let z = 44; z >= -30; z -= 6.2) for (const sx of [-1, 1]) { if (this.stalls.some(B => B.side === sx && Math.abs(B.z - z) < 2.8)) continue; const y = yardY(sx * 5.7, z); decor('lantern2', sx * 5.7, z, 0, 1.6, y, { trunk: 0.25 }); for (const d of [-0.9, 0.9]) addGlow(sx * 5.7 + d, y + 3.55, z, 2.6, 0xffb860, 1); }
    for (const z of [32, 7, -18]) { const f = place('festoon', 0, z, 0, 3.45, 4.6); scene.add(f); }
    for (const [x, z] of [[-6.4, 20], [6.4, -5], [-6.4, -30], [6.4, 20]]) decor('brazier', x, z, 0, 1.4, yardY(x, z), { trunk: 0.4 });
    // ---- the gate ----
    const gw = place('gateway', 0, 44.0, 0, 3.0, 0); scene.add(gw); this.gateway = { obj: gw, wins: litMats(gw), lit: 0, litT: 0, x: 0, z: 44, door: new V3(0, 0, 44) }; WORLD.houses.push(this.gateway);
    solidDisc(-5.65, 44, 0.32); solidDisc(5.65, 44, 0.32);
    SNOW.paint(-5.97, 43.7, -5.33, 44.3, k => { if (T[k] === 1) { T[k] = 2; H[k] = 0; } }); SNOW.paint(5.33, 43.7, 5.97, 44.3, k => { if (T[k] === 1) { T[k] = 2; H[k] = 0; } });
    const gs = makeSign('WINTER MARKET', '#c23a30'); gs.position.set(0, 11.4, 44.2); gs.rotation.y = Math.PI; gs.scale.setScalar(3.4); scene.add(gs);
    decor('sleighstop', -9.0, 57.0, 0.5, 1.6, 0, { solid: 0.1, paved: true });
    { const bell = place('bell', 0, 44.0, 0, 2.6, 7.4); scene.add(bell); this.bell = bell; }
    decor('xmastree', 9.2, 57.6, 0, 1.6, 0, { solid: 0.1, paved: true });
    // ---- the square: grand tree, hidden train track, bandstand, clock tower, market hall ----
    const [tx, tz] = this.tree;
    const tree = place('bigtree', tx, tz, 0, 3.0, 0); scene.add(tree);
    const tm = []; tree.traverse(c => { if (c.isMesh && c.material.emissive && (c.material.emissive.r + c.material.emissive.g) > 0.05) { const nm = c.material.clone(); nm.userData = {}; xray(nm); nm.userData.lit = { e: nm.emissive.clone(), i: nm.emissiveIntensity }; nm.emissiveIntensity = 0; c.material = nm; tm.push(nm); } });
    WORLD.tree = { obj: tree, mats: tm, lit: 0 };
    SNOW.paint(tx - 4.2, tz - 4.2, tx + 4.2, tz + 4.2, (k, x, z) => { if ((x - tx) ** 2 + (z - tz) ** 2 < 3.9 * 3.9) { if (T[k] === 1) { T[k] = 2; H[k] = 0; } else if (T[k] === 0) T[k] = 2; } });
    // train track ring (under the snow until you plow the square)
    const R = this.trackR, rail = new THREE.MeshStandardMaterial({ color: 0x8a919c, roughness: 0.35, metalness: 0.7 }), wood = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.85 });
    const rg = [];
    for (const r of [R - 0.55, R + 0.55]) { const g = new THREE.RingGeometry(r - 0.06, r + 0.06, 96); g.rotateX(-Math.PI / 2); g.translate(tx, 0.012, tz); rg.push(g); }
    const sg = [];
    for (let i = 0; i < 72; i++) { const a = i / 72 * TAU, g = new THREE.BoxGeometry(0.28, 0.02, 1.6); g.rotateY(-a); g.translate(tx + Math.sin(a) * R, 0.006, tz + Math.cos(a) * R); sg.push(g.toNonIndexed()); }
    scene.add(new THREE.Mesh(mergeGeoms(rg), rail)); { const m = new THREE.Mesh(mergeGeoms(sg), wood); m.receiveShadow = true; scene.add(m); }
    this.buildTrain(scene);
    const bs = place('bandstand', 23.2, -47, -Math.PI / 2, 1.65, yardY(23.2, -47)); scene.add(bs); solidUnder(bs, 0.1, false); this.bandstand = bs;
    const ct = place('clocktower', 0, -70.2, 0, 2.6, 0); scene.add(ct); solidUnder(ct, 0.1, false); this.clock = { obj: ct, wins: litMats(ct), lit: 0, litT: 0, x: 0, z: -70, door: new V3(0, 0, -67) }; WORLD.houses.push(this.clock);
    const hall = litBuilding('market', -23.6, -47, Math.PI / 2, 1.7, new V3(-19.8, 0, -47), 0.1); this.hall = hall;
    for (const [lx, lz] of [[-17.4, -30.5], [17.4, -30.5], [-17.4, -63.5], [17.4, -63.5]]) { decor('lantern2', lx, lz, 0, 1.7, 0, { trunk: 0.25 }); for (const d of [-0.95, 0.95]) addGlow(lx + d, 3.8, lz, 2.8, 0xffb860, 1); }
    for (const [bx, bz] of [[-6.4, 20], [6.4, -5], [-6.4, -30], [6.4, 20]]) addGlow(bx, 1.6, bz, 2.4, 0xff7a30, 2.5);
    for (const [bx, bz, r] of [[-12, -66.5, 0], [12, -66.5, 0]]) decor('bench_a', bx, bz, r, 1, 0);
    // trees & snowbanks around the edges
    const r = mulberry(333), fk = ['fir_a', 'fir_b', 'fir_c', 'spruce_s'];
    for (let i = 0; i < 64; i++) {
      const sx = i % 2 ? 1 : -1, x = sx * (11 + r() * 18), z = -70 + r() * 128;
      if (Math.abs(x) < 20.5 && z < -28 && z > -68) continue;
      if (Math.abs(x) < 12.5 && z > 42) continue;
      if (this.stalls.some(B => Math.abs(B.z - z) < 3.4 && Math.abs(B.x - x) < 4.2)) continue;
      decor(fk[(r() * 4) | 0], x, z, r() * TAU, 0.9 + r() * 0.7, yardY(x, z), { trunk: 0.45 });
    }
    for (let i = 0; i < 10; i++) { const sx = i % 2 ? 1 : -1, x = sx * (11.5 + r() * 3), z = 22 - i * 5.5; decor('snowbank', x, z, r() * 3, 1.3 + r() * 0.6, yardY(x, z)); }
  },
  // the little Christmas train: an engine and three wagons that ride round the tree after the square is clear
  buildTrain(scene) {
    const g = new THREE.Group(); scene.add(g); g.visible = false;
    const cars = [], [tx, tz] = this.tree;
    const eng = place('train', 0, 0, 0, 3.1, 0); g.add(eng); cars.push({ o: eng, off: 0 });
    const cols = [0xe5483c, 0x2fa06a, 0x2f7fd6];
    for (let i = 0; i < 3; i++) {
      const w = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 2.4), mcol(cols[i], 0.55)); base.position.y = 0.85; base.castShadow = true; w.add(base);
      const rim = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 2.5), mcol(0xffc23d, 0.4, 0.4)); rim.position.y = 1.32; w.add(rim);
      for (const [x, z] of [[0.95, 0.75], [-0.95, 0.75], [0.95, -0.75], [-0.95, -0.75]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.16, 12), mcol(0x2c3138, 0.6)); wh.rotation.z = Math.PI / 2; wh.position.set(x, 0.34, z); w.add(wh); }
      w.userData.kids = [];
      g.add(w); cars.push({ o: w, off: (i + 1) * 3.1 });
    }
    this.train = { g, cars, s: 0, spd: 0, run: false, tootT: 0 };
    this.placeTrain(0);
  },
  placeTrain(s) {
    const T = this.train, [tx, tz] = this.tree, R = this.trackR;
    for (const c of T.cars) { const a = (s - c.off) / R; c.o.position.set(tx + Math.sin(a) * R, 0, tz + Math.cos(a) * R); c.o.rotation.y = a + Math.PI / 2; }
  },
  startTrain(silent) {
    const T = this.train; if (T.run) return; T.run = true; T.g.visible = true;
    // kids ride the wagons
    for (let i = 1; i < T.cars.length; i++) for (const sx of [-0.45, 0.45]) {
      const P = makePersonLite(Object.assign(NPC.look('kid'), { _pack: null })); P.root.scale.setScalar(0.85); P.root.position.set(sx, 0.95, 0); P.legL.rotation.x = P.legR.rotation.x = -1.3; T.cars[i].o.add(P.root); T.cars[i].o.userData.kids.push(P);
    }
    if (!silent) { AUD.cheer(); UI.toast('All aboard the Christmas train!'); }
  },
  onDone(a, silent) {
    if (a.key === 'gate') { this.gateway.litT = 1; if (silent) { this.gateway.lit = 1; applyLit(this.gateway, 1); } this.gateOpen = true; if (!silent) { AUD.bell(); this.spawnShoppers(4); } return new V3(0, 0, 50); }
    if (a.key.startsWith('lane')) {
      let pos = null, k = 0;
      for (const B of this.stalls) if (B.lane === a.key && !B.open) { this.openStall(B, silent, k++ * 0.35); pos = pos || B.door; }
      if (a.key === 'lane1' && !silent) CREW.recruit(2.0);
      return pos;
    }
    if (a.key === 'plazaS') { if (!silent) { UI.toast('The band starts to play!'); this.band(); } this.bandOn = true; return new V3(10, 0, -40); }
    if (a.key === 'plazaN') {
      WORLD.tree.lit = silent ? 1 : 0.001; this.clock.litT = 1; this.hall.litT = 1;
      if (silent) { this.clock.lit = 1; applyLit(this.clock, 1); this.hall.lit = 1; applyLit(this.hall, 1); }
      this.startTrain(silent);
      return new V3(this.tree[0], 0, this.tree[1] + 5);
    }
    return null;
  },
  openStall(B, silent, delay) {
    B.open = true; B.litT = 1;
    if (silent) { B.lit = 1; applyLit(B, 1); this.vendor(B); return; }
    later(delay || 0, () => {
      const p = B.door; FX.sparkle(p.x, 1.6, p.z, 26, 1.4); FX.confetti(p.x, 2.2, p.z, 26); AUD.treasure(true);
      UI.floatText(new V3(p.x, 3.4, p.z), 'OPEN!', '#7dffb0', 30);
      this.vendor(B); this.spawnShoppers(2);
    });
  },
  vendor(B) {
    const sx = B.side, v = NPC.spawn({ x: sx * 6.6, z: B.z, h: sx < 0 ? Math.PI / 2 : -Math.PI / 2, kind: 'adult', pose: 'wave', tag: 'vendor' });
    v.P.root.traverse(c => { if (c.isMesh) c.castShadow = false; });
    B.vendorN = v; later(2.5, () => { if (v.state !== 'out') v.pose = 'idle'; });
  },
  // shoppers wander from the gate to open stalls (and the tree once it is lit)
  spawnShoppers(n) {
    for (let i = 0; i < n; i++) {
      if (NPC.byTag('shop').length >= this.maxShop()) return;
      const s = NPC.spawn({ x: rnd(-3, 3), z: rnd(55, 58), h: Math.PI, kind: Math.random() < 0.6 ? 'adult' : 'kid', tag: 'shop' });
      s.P.root.traverse(c => { if (c.isMesh) c.castShadow = false; });
      this.nextVisit(s);
    }
  },
  maxShop() { return Math.min(22, 4 + this.stalls.filter(B => B.open).length * 1.5 + (this.bandOn ? 4 : 0)); },
  nextVisit(s) {
    const open = this.stalls.filter(B => B.open), spots = open.map(B => [B.door.x + rnd(-0.6, 0.6), B.z + rnd(-1.4, 1.4), 'stall']);
    if (WORLD.tree.lit > 0) for (let i = 0; i < 3; i++) { const a = rnd(0, TAU); spots.push([this.tree[0] + Math.sin(a) * 5.6, this.tree[1] + Math.cos(a) * 5.6, 'tree']); }
    if (!spots.length || s.visits > 3) { this.go(s, s.x, s.z, rnd(-3, 3), 57.5, () => NPC.kill(s)); return; }
    const t = spots[(Math.random() * spots.length) | 0];
    this.go(s, s.x, s.z, t[0], t[1], () => {
      s.visits = (s.visits || 0) + 1;
      s.h = t[2] === 'tree' ? Math.atan2(this.tree[0] - s.x, this.tree[1] - s.z) : (s.x < 0 ? -Math.PI / 2 : Math.PI / 2);
      s.pose = Math.random() < 0.3 ? 'wave' : 'idle';
      if (Math.random() < 0.35) NPC.say(s, t[2] === 'tree' ? ['So pretty!', 'Look at the lights!', 'Merry Christmas!'][(Math.random() * 3) | 0] : ['Mmm, hot cocoa!', 'I love this stall!', 'Two please!', 'Look at the toys!', 'What a market!'][(Math.random() * 5) | 0], 2.6);
      later(rnd(4, 9), () => { if (s.state !== 'out') { s.pose = 'idle'; this.nextVisit(s); } });
    });
  },
  // walk along the lane centre (not through the stalls)
  go(s, x0, z0, x1, z1, cb) {
    const pts = [], lx = clamp(x0, -3.2, 3.2);
    if (z0 > -30 && z0 < 44 && Math.abs(x0) > 3.2) pts.push([lx, z0]);
    if (z1 > -30 && z1 < 44) { pts.push([clamp(x1, -3.2, 3.2) * 0.6, z1]); pts.push([x1, z1]); }
    else if (z1 <= -30) { pts.push([clamp(x1, -3, 3), -29]); pts.push([x1, z1]); }
    else pts.push([x1, z1]);
    NPC.go(s, pts, rnd(1.4, 2.0), cb);
  },
  band() {
    // three musicians on the bandstand
    const bx = 23.2, bz = -47, y = 0.9;
    for (let i = 0; i < 3; i++) { const m = NPC.spawn({ x: bx - 0.6, z: bz - 1.2 + i * 1.2, h: -Math.PI / 2, kind: 'adult', pose: 'wave', tag: 'band', look: Object.assign(NPC.look('adult'), { jacket: 0xc23a30, hat: 0x2b3a55, brim: 0xffc23d }), y }); m.P.root.traverse(c => { if (c.isMesh) c.castShadow = false; }); }
    AUD.bigWin();
  },
  update(dt) {
    // market income: every open stall sells and pays you
    let rate = 0; const near = 22;
    for (const B of this.stalls) {
      if (!B.open || B.lit < 0.5) continue;
      const v = Math.max(5, GAME.price() * 1.6) * (GAME.ended ? 0.35 : 1); rate += v / 2.4;
      B.incT -= dt;
      if (B.incT <= 0) {
        B.incT = 2.4;
        const p = B.door, d = Math.hypot(p.x - PL.x, p.z - PL.z), val = Math.round(v);
        if (d < near) { FX.coinBurst(p.x, 2.4, p.z, 2, val, { up: 0.6, spread: 0.4 }); UI.floatText(new V3(p.x, 3.2, p.z), '+' + fmt(val), '#ffe9a8', 20); }
        else { UI.pending += val; UI.flyCoin(null, val); }
        GAME.earn(val);
      }
    }
    UI.income(rate > 0 ? rate : null);
    // keep the crowd coming
    if (this.gateOpen) { this.shopT = (this.shopT || 0) - dt; if (this.shopT <= 0) { this.shopT = rnd(1.4, 2.6); this.spawnShoppers(1); } }
    // the train
    const T = this.train;
    if (T.run) {
      const [tx, tz] = this.tree, a = T.s / this.trackR, hx = tx + Math.sin(a) * this.trackR, hz = tz + Math.cos(a) * this.trackR;
      const fx = Math.cos(a), fz = -Math.sin(a), rx = PL.x - hx, rz = PL.z - hz, ahead = rx * fx + rz * fz, side = Math.abs(rx * fz - rz * fx);
      const blocked = ahead > -1 && ahead < 6 && side < 1.6 + (PL.kind === 'truck' ? PL.geo.halfW : 0.4);
      T.spd = damp(T.spd, blocked ? 0 : 4.2, blocked ? 6 : 1.5, dt);
      T.s += T.spd * dt; this.placeTrain(T.s);
      T.tootT -= dt; if (T.tootT <= 0) { T.tootT = blocked ? 2.2 : rnd(6, 10); AUD.horn(); const e = T.cars[0].o.position; FX.steam(e.x, 3.6, e.z, 6); }
      if (Math.random() < dt * 4) { const e = T.cars[0].o.position; FX.smoke(e.x, 3.4, e.z); }
      for (let i = 1; i < T.cars.length; i++) for (const P of T.cars[i].o.userData.kids) animPerson(P, dt, { walk: 0, pose: 'cheer', t: performance.now() / 1000 + i });
    }
    if (this.party > 0) { this.party -= dt; if (Math.random() < dt * 3) FX.confetti(this.tree[0] + rnd(-8, 8), 6, this.tree[1] + rnd(-8, 8), 20); }
  },
  finale() {
    LIFE.fireworks(this.tree[0], this.tree[1], 9); AUD.bigWin(); AUD.bell();
    later(0.6, () => UI.banner('THE MARKET IS OPEN!', 'Merry Christmas, everyone!', 'star', 4.0));
    for (const s of NPC.byTag('shop')) NPC.cheer(s, 3);
    this.party = 8; this.spawnShoppers(8);
  },
  save() { return { s: this.stalls.map(B => B.open ? 1 : 0).join('') }; },
  load(o) { },
};
