// ---------- chapter 9: North Pole (the elves carry the gifts to Santa's sleigh along the paths you clear) ----------
// Santa's sleigh waits at the north end of Candy Cane Lane, facing up the runway (the way it takes off)
const NP = { SX: 0, SZ: -6, WD: [-18.6, 6.2], PD: [19, 6.6] };
const CH_POLE = {
  id: 9, key: 'pole', name: 'North Pole', tag: 'Save Christmas!',
  intro: "It's Christmas Eve and Santa's village is snowed in! Clear the paths so the elves can load the sleigh in time.",
  twist: 'Every gift the elves carry to the sleigh pays. More paths, more elves!',
  color: '#e5483c', icon: 'gift', pack: 'ch9',
  music: () => SONG_POLE,
  grid: { X0: -32, Z0: -66, NX: 321, NZ: 651 },
  start: { x: -7, z: 56, h: Math.PI },
  shop: ['melter', 'jet', 'reindeer'],
  unlock: { tool: 'reindeer', goals: 1 },
  payMul: 8.5, par: [330, 540], reward: 1000000,
  crewYard: [9, 58], crewJobs: ['walkA', 'walkB'],
  introCam: { from: [-36, 44, 74], look: [0, 3, -6] },
  finaleCam: { from: [22, 14, -6], look: [NP.SX, 4, NP.SZ - 10] },
  finaleDelay: 9.5,
  env: { sky: ['#14214f', '#3e4f9a', '#c8b6e2'], fog: 0xcfd3e6, hemi: [0x8f9fd8, 0xe6dfe8, 0.6], sun: [0xffe2c0, 1.9], sunOff: [-14, 22, 14], exposure: 0.88, fogNear: 55, fogFar: 190 },
  goals: [
    { a: 'square', t: 'Clear the village square', ico: 'tree' },
    { a: 'workshop', t: 'Clear the toy workshop', ico: 'gift' },
    { a: 'lane', t: 'Clear Candy Cane Lane', ico: 'road' },
    { a: 'post', t: 'Clear the post office', ico: 'letter' },
    { a: 'stables', t: 'Clear the reindeer stables', ico: 'deer' },
    { a: 'runway', t: "Clear Santa's runway", ico: 'reindeer' },
    { end: true, t: 'Merry Christmas!', ico: 'star' },
  ],
  treasure: { square: [3, 2], workshop: [3, 2], lane: [4, 2], post: [3, 2], stables: [3, 2], runway: [4, 2] },
  // ---- bot routing: the square, the long lane up the middle (with the runway), workshop, post office, stables ----
  botZone(x, z) { if (z > 34) return 'Q'; if (x < -8) return z > 0 ? 'W' : 'S'; if (x > 8) return 'P'; return 'L'; },
  botMouth(zp, zt, px, pz, tz) {
    return zoneHop({
      Q: { L: () => [0, 31] },
      L: { Q: () => [0, 39], W: () => [-14, clamp(pz, 9, 27)], P: () => [14, clamp(pz, 11, 25)], S: () => [-14, clamp(pz, -41, -29)] },
      W: { L: () => [0, clamp(pz, 9, 27)] },
      P: { L: () => [0, clamp(pz, 11, 25)] },
      S: { L: () => [0, clamp(pz, -41, -29)] },
    }, zp, zt, px, pz, tz);
  },
  botOpen(x, z) { const Z = this.botZone(x, z); return Z === 'Q' ? [-7, clamp(z, 39, 56)] : Z === 'W' ? [-19, clamp(z, 10, 26)] : Z === 'P' ? [19, clamp(z, 12, 24)] : Z === 'S' ? [-19, clamp(z, -40, -30)] : [0, clamp(z, -60, 30)]; },
  botTarget(p) { return p; },
  truckSpots() {
    const c = [];
    for (let xx = -11; xx <= 11; xx += 4) for (const zz of [40, 44, 52, 56]) if (Math.abs(xx) > 4 || Math.abs(zz - 48) > 5) c.push([xx, zz]);
    for (let zz = -60; zz <= 32; zz += 3) for (const xx of [-4, 0, 4]) c.push([xx, zz]);
    for (let zz = 9; zz <= 27; zz += 3) for (const xx of [-26, -20, -14]) c.push([xx, zz]);
    for (let zz = 11; zz <= 25; zz += 3) for (const xx of [14, 20, 26]) c.push([xx, zz]);
    for (let zz = -41; zz <= -29; zz += 3) for (const xx of [-26, -20, -14]) c.push([xx, zz]);
    return c;
  },
  layout() {
    PAVED.push({ r: rect(-14, 36, 14, 60), kind: 'cobble', d: 0.46, key: 'square' });
    PAVED.push({ r: rect(-8, -20, 8, 36), kind: 'pavers', d: 0.48, key: 'lane' });
    PAVED.push({ r: rect(-8, -64, 8, -20), kind: 'piste', d: 0.5, key: 'runway' });
    PAVED.push({ r: rect(-30, 6, -8, 30), kind: 'flags', d: 0.46, key: 'workshop' });
    PAVED.push({ r: rect(8, 8, 30, 28), kind: 'flags', d: 0.46, key: 'post' });
    PAVED.push({ r: rect(-30, -44, -8, -26), kind: 'walk', d: 0.46, key: 'stables' });
    PAVED.push({ r: rect(14, 36, 16, 54), kind: 'walk', d: 0.3, key: 'walkA' });
    PAVED.push({ r: rect(-16, 36, -14, 54), kind: 'walk', d: 0.3, key: 'walkB' });
  },
  areas(mk, pav) {
    mk('square', 'Village square', [pav('square')], { title: 'SQUARE CLEAR!', ico: 'tree' });
    mk('workshop', 'Toy workshop', [pav('workshop')], { title: 'WORKSHOP OPEN!', ico: 'gift' });
    mk('lane', 'Candy Cane Lane', [pav('lane')], { title: 'LANE CLEAR!', ico: 'road', doneAt: 0.78 });
    mk('post', 'Post office', [pav('post')], { title: 'LETTERS FOR SANTA!', ico: 'letter' });
    mk('stables', 'Reindeer stables', [pav('stables')], { title: 'REINDEER READY!', ico: 'deer' });
    mk('runway', "Santa's runway", [pav('runway')], { title: 'RUNWAY READY!', ico: 'reindeer', doneAt: 0.78 });
    mk('walkA', 'Elf path', [pav('walkA')], { quiet: true });
    mk('walkB', 'Elf path', [pav('walkB')], { quiet: true });
  },
  build(scene, H, T) {
    const yardY = (x, z) => SNOW.type(x, z) === 1 ? 0 : SNOW.depth(x, z) - 0.06;
    // ---- the square: the grand tree in the middle, lamps, market stalls, the North Pole sign ----
    this.tree = place('bigfir', 0, 48, 0, 2.6, 0); scene.add(this.tree); solidDisc(0, 48, 3.0); parkedVehicle(this.tree);
    this.treeWins = litMats(this.tree);
    this.treeLights = [];
    for (let i = 0; i < 18; i++) { const a = i / 18 * TAU * 2.2, y = 1.2 + i * 0.4, r = 2.6 - i * 0.12; const g = addGlow(Math.sin(a) * r, y, 48 + Math.cos(a) * r, 0.7, [0xff5a5a, 0xffd34d, 0x5bc8f5, 0x7dffb0][i % 4], 1); g.material.opacity = 0; this.treeLights.push(g); }
    const star = addGlow(0, 9.6, 48, 2.2, 0xffe27a, 1); star.material.opacity = 0; this.treeLights.push(star);
    for (const [x, z] of [[-14.8, 38], [14.8, 38], [-14.8, 58], [14.8, 58]]) decor('xlamp', x, z, 0, 1.4, yardY(x, z), { trunk: 0.25 });
    decor('polesign', 0, 62, Math.PI, 2.0, yardY(0, 62), { trunk: 0.3 });
    for (const [x, z, r] of [[-17.5, 44, Math.PI / 2], [17.5, 44, -Math.PI / 2]]) decor('giftstall', x, z, r, 1.8, yardY(x, z), { solid: 0.05 });
    for (const [x, z] of [[-17.5, 57.5], [17.5, 57.5]]) decor('nutcracker', x, z, x < 0 ? Math.PI / 2 : -Math.PI / 2, 2.2, yardY(x, z), { solid: 0.05 });
    for (const [k, x, z, r] of [['cottage_red', -24, 52, Math.PI / 2], ['cottage_ginger', 24, 52, -Math.PI / 2], ['chalet_xmas', -24, 40, Math.PI / 2]]) decor(k, x, z, r, 1.0, yardY(x, z), { solid: 0.1 });
    // ---- Candy Cane Lane: candy canes all along both sides, light arches over it ----
    // (not where the lane meets the workshop and the post office yards)
    for (let z = -60; z <= 0; z += 8) { for (const sx of [-1, 1]) decor('candycane', sx * 8.7, z, sx < 0 ? 0 : Math.PI, 2.4, yardY(sx * 8.7, z), { trunk: 0.15 }); }
    for (const z of [33, -2, -14]) { decorTall('lightarch', -8.9, z, Math.PI / 2, 2.2, 0); decorTall('lightarch', 8.9, z, -Math.PI / 2, 2.2, 0); }
    // ---- the toy workshop, the post office, the bakery, the stable ----
    this.wshop = litBuilding('workshop', -18.6, 1.0, 0, 3.0, new V3(NP.WD[0], 0, NP.WD[1]), 0.1);
    this.post = litBuilding('postoffice', 19, 3.0, 0, 3.0, new V3(NP.PD[0], 0, NP.PD[1]), 0.1);
    this.bake = litBuilding('bakery2', 19, -36, Math.PI / 2, 3.0, new V3(15, 0, -36), 0.1);
    this.barn = litBuilding('elfhouse', -19, -50, 0, 3.6, new V3(-19, 0, -45.5), 0.1);
    decor('letterbox', 10.2, 30, 0, 2.0, yardY(10.2, 30), { trunk: 0.2 });
    for (const [x, z] of [[11, -26], [13, -44], [24, -27]]) decor('gbhouse', x, z, rnd(0, TAU), 3.0, yardY(x, z), { solid: 0.05 });
    for (const [x, z] of [[-31, 12], [-31, 24], [31, 12], [31, 22]]) decor('giftstack', x, z, rnd(0, TAU), 2.2, yardY(x, z), { solid: 0.05 });
    // ---- Santa's sleigh at the south end of its runway, waiting for its reindeer ----
    const sl = new THREE.Group(); sl.position.set(NP.SX, 0, NP.SZ); sl.rotation.y = Math.PI; scene.add(sl);
    const sm = place('rsleigh', 0, 0, 0, 2.8, 0); sl.add(sm);
    this.sack = place('giftsack', 0, 1.2, -1.6, 1.0, 0); this.sack.position.set(0, 1.25, -1.5); this.sack.scale.setScalar(0.6); sl.add(this.sack);
    this.sleigh = { o: sl, team: [], y: 0, z: NP.SZ, v: 0, state: 'wait', gifts: 0 };
    SNOW.paint(NP.SX - 2, NP.SZ - 3.4, NP.SX + 2, NP.SZ + 3.4, (k) => { if (T[k] === 1) { T[k] = 2; } }); sl.updateMatrixWorld(true); parkedVehicle(sm);
    // trees round the village, banks, the northern lights
    const rr = mulberry(909), fk = ['fir_a', 'fir_b', 'fir_c', 'spruce_s', 'birch'];
    for (let i = 0; i < 60; i++) { const x = (rr() < 0.5 ? -1 : 1) * (33 + rr() * 22), z = -66 + rr() * 132; decor(fk[(rr() * 5) | 0], x, z, rr() * TAU, 1 + rr() * 0.9, 0.34); }
    for (let i = 0; i < 26; i++) { const x = -30 + rr() * 60, z = -10 + rr() * 16; if (Math.abs(x) < 10) continue; decor(fk[(rr() * 5) | 0], x, z, rr() * TAU, 0.9 + rr() * 0.8, yardY(x, z), { trunk: 0.45 }); }
    for (let i = 0; i < 16; i++) { const x = (rr() < 0.5 ? -1 : 1) * (10 + rr() * 20), z = -64 + rr() * 14; decor(fk[(rr() * 5) | 0], x, z, rr() * TAU, 0.9 + rr() * 0.8, yardY(x, z), { trunk: 0.45 }); }
    for (const [x, z] of [[-31, -30], [-31, -40], [10, -58], [-10, -58], [12, 32]]) decor('snowbank', x, z, rr() * TAU, 1.4, yardY(x, z));
    this.aurora = this.makeAurora(); scene.add(this.aurora);
    this.elves = []; this.santa = null; this.party = 0;
  },
  // northern lights: two soft green-violet curtains far away in the sky, slowly waving
  makeAurora() {
    const c = document.createElement('canvas'); c.width = 4; c.height = 128; const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, 'rgba(160,90,255,0)'); gr.addColorStop(0.35, 'rgba(150,100,255,0.55)'); gr.addColorStop(0.7, 'rgba(80,255,170,0.85)'); gr.addColorStop(1, 'rgba(80,255,170,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 4, 128);
    const tex = new THREE.CanvasTexture(c), g = new THREE.Group();
    for (let k = 0; k < 2; k++) {
      const geo = new THREE.PlaneGeometry(260, 46, 40, 1), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const xx = p.getX(i); p.setZ(i, Math.sin(xx * 0.03 + k) * 18); }
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      m.position.set(k * 30 - 10, 62 + k * 8, -170 - k * 30); m.rotation.x = -0.15; g.add(m); m.userData.p0 = Float32Array.from(p.array);
    }
    return g;
  },
  onDone(a, silent) {
    if (a.key === 'square') {
      this.treeOn = true; for (const m of this.treeWins) { const L = m.userData.lit; if (L) { m.color.copy(L.color); m.emissive.copy(L.emissive); m.emissiveIntensity = 1.4; } }
      if (!silent) { this.carolers(); UI.toast('The big tree is lit!'); }
      return new V3(-7, 0, 52);
    }
    if (a.key === 'workshop') { this.wshop.litT = 1; if (silent) { this.wshop.lit = 1; applyLit(this.wshop, 1); } this.addElves('shop', 4, silent); if (!silent) { CREW.recruit(2.0); UI.toast('The elves are carrying gifts to the sleigh!'); } else GAME.crew = Math.max(GAME.crew || 0, 5); return new V3(-19, 0, 18); }
    if (a.key === 'lane') { this.addElves('shop', 2, silent); return new V3(0, 0, 8); }
    if (a.key === 'post') { this.post.litT = 1; if (silent) { this.post.lit = 1; applyLit(this.post, 1); } this.addElves('post', 3, silent); if (!silent) UI.toast('Letters for Santa! The mail elves are busy'); return new V3(19, 0, 18); }
    if (a.key === 'stables') { this.barn.litT = 1; if (silent) { this.barn.lit = 1; applyLit(this.barn, 1); } this.harness(silent); return new V3(-19, 0, -35); }
    if (a.key === 'runway') { this.bake.litT = 1; if (silent) { this.bake.lit = 1; applyLit(this.bake, 1); } this.addElves('shop', 2, silent); this.santaOut(silent); return new V3(0, 0, -42); }
    return null;
  },
  // elves walk from their door to the sleigh with a present, and back for the next one
  addElves(from, n, silent) {
    const door = from === 'post' ? NP.PD : NP.WD;
    for (let i = 0; i < n; i++) {
      const look = Object.assign(NPC.look('kid'), { jacket: i % 2 ? 0x2fa06a : 0xd8342c, band: 0xffffff, hat: i % 2 ? 0xd8342c : 0x2fa06a, brim: 0xffffff, pom: 0xffd34d, pants: 0x2fa06a, scale: 0.82 });
      const e = NPC.spawn({ x: door[0] + rnd(-1, 1), z: door[1] + rnd(0, 1.5), kind: 'kid', look, tag: 'elf', pack: false, pop: !silent });
      e.P.root.traverse(m => { if (m.isMesh) m.castShadow = false; });
      const box = this.giftBox(from, this.elves.length); box.position.set(0, 0.52, 0.32); box.scale.setScalar(1.25); e.P.root.add(box);
      const E = { n: e, box, from, wait: i * 2.2 + (silent ? rnd(0, 6) : 0.6), going: false };
      this.elves.push(E);
    }
  },
  // a small wrapped present (or a bundle of letters) for an elf to carry: two meshes, shared by every elf
  giftBox(from, i) {
    if (!this._gift) {
      const rib = [new THREE.BoxGeometry(0.36, 0.27, 0.07), new THREE.BoxGeometry(0.07, 0.27, 0.32), new THREE.BoxGeometry(0.15, 0.06, 0.15).translate(0, 0.15, 0)];
      const mat = (c, r) => new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? 0.6 : r });
      this._gift = { box: new THREE.BoxGeometry(0.34, 0.26, 0.3), rib: mergeGeoms(rib), wraps: [0xd8342c, 0x2fa06a, 0x3b7bd8, 0x9b59d0].map(c => mat(c)), gold: mat(0xffd34d, 0.35), paper: mat(0xf4ecd8, 0.8), red: mat(0xc62828) };
    }
    const G = this._gift, g = new THREE.Group(), post = from === 'post';
    g.add(new THREE.Mesh(G.box, post ? G.paper : G.wraps[i % G.wraps.length]), new THREE.Mesh(G.rib, post ? G.red : G.gold));
    return g;
  },
  elfTrip(E) {
    const e = E.n, door = E.from === 'post' ? NP.PD : NP.WD;
    const there = E.from === 'post' ? [[door[0] - 4, door[1] - 1.5], [3.4, 2], [2.2, NP.SZ + 4.4]] : [[door[0] + 5, door[1] + 2], [-3.4, 4], [-2.2, NP.SZ + 4.4]];
    E.going = true; E.box.visible = true;
    NPC.go(e, there, rnd(2.0, 2.6), () => {
      this.delivered(E);
      E.box.visible = false;
      NPC.go(e, there.slice(0, -1).reverse().concat([[door[0] + rnd(-1, 1), door[1] + rnd(0, 1)]]), rnd(2.2, 2.8), () => { E.going = false; E.wait = rnd(0.5, 1.6); });
    });
  },
  delivered(E) {
    const v = niceNum(GAME.price() * (E.from === 'post' ? 3 : 4) * (GAME.ended ? 0.35 : 1)), S = this.sleigh; GAME.earn(v); S.gifts++;
    const p = new V3(NP.SX, 3, NP.SZ + 2);
    if (Math.hypot(p.x - PL.x, p.z - PL.z) < 26) { FX.coinBurst(p.x, 2.4, p.z, 3, v, { up: 0.7 }); UI.floatText(p, (E.from === 'post' ? 'LETTERS +' : 'GIFT +') + fmt(v), '#ffe9a8', 22); FX.sparkle(p.x, 1.8, p.z, 8, 0.6); AUD.jingle(1); } else { UI.pending += v; UI.flyCoin(null, v); }
    // the gift sack on the sleigh fills up
    this.sack.scale.setScalar(Math.min(1.5, 0.6 + S.gifts * 0.03));
  },
  carolers() {
    for (let i = 0; i < 5; i++) { const n = NPC.spawn({ x: -4 + i * 2, z: 41, h: 0, kind: i % 2 ? 'kid' : 'adult', pose: 'wave', tag: 'caroler', look: Object.assign(NPC.look(i % 2 ? 'kid' : 'adult'), { scarf: 0xd8342c, hat: 0xd8342c, brim: 0xffffff }) }); n.P.root.traverse(m => { if (m.isMesh) m.castShadow = false; }); if (i === 2) NPC.say(n, 'Merry Christmas!', 3); }
  },
  // the reindeer trot out of the stable and line up in front of the sleigh
  harness(silent) {
    const S = this.sleigh; if (S.team.length) return;
    for (let i = 0; i < 8; i++) {
      const d = place('reindeer', 0, 0, 0, 1.6, 0), col = i % 2 ? 1 : -1, row = i >> 1;
      const tx = NP.SX + col * 0.95, tz = NP.SZ - 4.6 - row * 2.6;
      const D = { o: d, tx, tz, x: silent ? tx : -19 + rnd(-2, 2), z: silent ? tz : -45 + rnd(-1, 1), ph: rnd(0, TAU), on: silent };
      d.position.set(D.x, 0, D.z); d.rotation.y = Math.PI; WORLD.scene.add(d); S.team.push(D);
    }
    if (!silent) { AUD.jingle(1.5); UI.toast("Santa's reindeer are ready!"); }
  },
  santaOut(silent) {
    const s = place('santa', 0, 0, 0, 1.25, 0); WORLD.scene.add(s);
    this.santa = { o: s, x: silent ? NP.SX + 0.4 : NP.WD[0], z: silent ? NP.SZ + 0.6 : NP.WD[1] + 1, path: silent ? [] : [[-12, 10], [-2.5, 2], [-2.5, NP.SZ + 5], [NP.SX + 0.4, NP.SZ + 0.6]], seated: silent };
    if (!silent) UI.toast('Santa is on his way to the sleigh!');
  },
  update(dt) {
    const now = performance.now() / 1000;
    // tree lights twinkle once the square is clear
    if (this.treeOn) for (let i = 0; i < this.treeLights.length; i++) this.treeLights[i].material.opacity = 0.45 + 0.4 * Math.max(0, Math.sin(now * 2.6 + i * 1.7));
    // elves: the next trip when they are back
    for (const E of this.elves) { if (E.going || E.n.state === 'out') continue; E.wait -= dt; if (E.wait <= 0 && !(this.sleigh.state !== 'wait')) this.elfTrip(E); }
    // reindeer trot to their place in front of the sleigh
    const S = this.sleigh;
    for (const D of S.team) {
      if (!D.on) { const dx = D.tx - D.x, dz = D.tz - D.z, d = Math.hypot(dx, dz); if (d < 0.2) { D.on = true; D.o.rotation.y = Math.PI; } else { const st = Math.min(d, 3.2 * dt); D.x += dx / d * st; D.z += dz / d * st; D.o.rotation.y = Math.atan2(dx, dz); D.o.position.y = Math.abs(Math.sin(now * 9 + D.ph)) * 0.18; } }
      else if (S.state === 'wait') D.o.position.y = Math.abs(Math.sin(now * 1.5 + D.ph)) * 0.03;
      if (S.state === 'wait') D.o.position.set(D.x, D.o.position.y, D.z);
    }
    // Santa walks to his sleigh
    const Sa = this.santa;
    if (Sa && Sa.path.length) { const p = Sa.path[0], dx = p[0] - Sa.x, dz = p[1] - Sa.z, d = Math.hypot(dx, dz); if (d < 0.2) Sa.path.shift(); else { const st = Math.min(d, 2.0 * dt); Sa.x += dx / d * st; Sa.z += dz / d * st; Sa.o.rotation.y = Math.atan2(dx, dz); } Sa.o.position.set(Sa.x, Math.abs(Math.sin(now * 8)) * 0.06, Sa.z); if (!Sa.path.length) { Sa.seated = true; Sa.o.rotation.y = Math.PI; AUD.jingle(1.5); } }
    else if (Sa && Sa.seated && S.state === 'wait') { Sa.o.position.set(NP.SX, 0.95, NP.SZ + 0.4); Sa.o.rotation.y = Math.PI; }
    // the northern lights wave
    if (this.aurora) for (const m of this.aurora.children) { const p = m.geometry.attributes.position, p0 = m.userData.p0; for (let i = 0; i < p.count; i++) p.setZ(i, p0[i * 3 + 2] + Math.sin(now * 0.4 + p0[i * 3] * 0.05) * 6); p.needsUpdate = true; }
    // the sleigh takes off (finale): down the runway, up into the sky, round the village, off to the world
    if (S.state === 'go') {
      S.t += dt; S.v = Math.min(26, S.v + dt * 7); const fly = S.t > 2.2;
      if (!fly) S.z -= S.v * dt;
      else { S.a = (S.a || 0) + dt * 0.55; S.y = Math.min(34, S.y + dt * (6 + S.y * 0.25)); S.z -= S.v * dt * Math.cos(S.a * 0.6); S.x = (S.x || NP.SX) + S.v * dt * Math.sin(S.a * 0.6) * 0.8; }
      const ox = S.x || NP.SX, h = fly ? Math.PI - S.a * 0.6 : Math.PI;
      S.o.position.set(ox, S.y, S.z); S.o.rotation.set(fly ? -0.12 : 0, h, fly ? 0.18 : 0);
      for (const D of S.team) { const lx = D.tx - NP.SX, lz = D.tz - NP.SZ; const c = Math.cos(h - Math.PI), s = Math.sin(h - Math.PI); D.o.position.set(ox + lx * c + lz * s, S.y + Math.abs(Math.sin(now * 7 + D.ph)) * 0.25 + (fly ? 0.4 : 0), S.z - lx * s + lz * c); D.o.rotation.y = h; }
      if (Sa) { Sa.o.position.set(ox, S.y + 0.95, S.z); Sa.o.rotation.y = h; }
      // a trail of golden sparkles
      for (let i = 0; i < 3; i++) FX.emit(FX.add, { x: ox + rnd(-1, 1), y: S.y + rnd(0.2, 1), z: S.z + rnd(-1, 1), vx: rnd(-0.4, 0.4), vy: rnd(-0.5, 0.5), vz: rnd(-0.4, 0.4), life: rnd(1, 1.8), s0: rnd(0.25, 0.45), s1: 0.02, a0: 1, a1: 0, fl: 1, dr: 0.8, c: Math.random() < 0.5 ? [1, 0.85, 0.35] : [1, 0.6, 0.9] });
      if (CAM.show) { CAM.show.look[0] = ox; CAM.show.look[1] = Math.max(4, S.y); CAM.show.look[2] = S.z; }
      if (S.y > 30 && !S.said) { S.said = 1; UI.banner('MERRY CHRISTMAS!', 'You saved Christmas!', 'gift', 3.6); AUD.bigWin(); LIFE.fireworks(0, 10, 7); }
    }
    if (this.party > 0) { this.party -= dt; if (Math.random() < dt * 3) FX.confetti(rnd(-12, 12), 5, rnd(36, 58), 20); if (Math.random() < dt * 2) FX.sparkle(rnd(-8, 8), rnd(2, 6), rnd(-20, 30), 10, 1.5); }
  },
  finale() {
    AUD.bigWin(); this.party = 10;
    later(0.3, () => UI.banner('ALL ABOARD!', 'Santa is ready to fly', 'reindeer', 2.4));
    // (reindeer that were still on their way are in place now; Santa jumps on)
    const S = this.sleigh; if (!S.team.length) this.harness(true);
    for (const D of S.team) { D.x = D.tx; D.z = D.tz; D.on = true; }
    if (!this.santa) this.santaOut(true); else { this.santa.path = []; this.santa.seated = true; }
    for (const E of this.elves) NPC.cheer(E.n, 6);
    later(2.4, () => { S.state = 'go'; S.t = 0; S.v = 0; S.x = NP.SX; AUD.jingle(2); AUD.whoosh(); });
  },
  save() { return null; },
  load() { },
};
