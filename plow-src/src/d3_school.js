// ---------- chapter 2: Pine Street School (beat the bus!) ----------
// The yellow school bus follows the road you plow. Every stretch has a countdown: clear it before the bus gets there.
const CH_SCHOOL = {
  id: 2, key: 'school', name: 'Pine Street School', tag: 'Beat the bus!',
  intro: 'The school bus leaves at 7:30! Plow the road ahead of it and get every kid to school on time.',
  twist: 'Every stretch has a countdown. Beat it for a big bonus!',
  color: '#ffc21a', icon: 'bus', pack: 'ch2',
  music: () => SONG_SCHOOL,
  grid: { X0: -24, Z0: -78, NX: 241, NZ: 701 },
  start: { x: -2.6, z: 53.6, h: Math.PI },
  shop: ['truck', 'dumpplow', 'thrower'],
  unlock: { tool: 'thrower', goals: 2 },
  payMul: 1.6, par: [300, 480], reward: 6000,
  crewYard: [-4.5, 59.6], crewJobs: ['padA', 'padB', 'padC', 'frontwalk'],
  introCam: { from: [6, 30, 88], look: [0, 0.5, 22] },
  finaleCam: { from: [-2, 15, -36], look: [-14, 1.5, -58] },
  env: { sky: ['#7b82d2', '#f3a9b8', '#ffe2b8'], fog: 0xf4dccf, hemi: [0xc4b4ec, 0xf6e2d8, 0.62], sun: [0xffb47c, 2.05], sunOff: [20, 17, 9], exposure: 0.82 },
  goals: [
    { a: 'leg1', t: 'Plow ahead of the bus!', ico: 'bus', leg: 1 },
    { a: 'leg2', t: 'Clear the road to Stop 2', ico: 'bus', leg: 2 },
    { a: 'leg3', t: 'Clear the road to Stop 3', ico: 'bus', leg: 3 },
    { a: 'leg4', t: 'Clear the road to school', ico: 'bus', leg: 4 },
    { a: 'bay', t: 'Clear the school drop-off', ico: 'school', leg: 5 },
    { a: 'lot', t: "Dig out the teachers' cars", ico: 'car' },
    { a: 'yard', t: 'Clear the playground', ico: 'kids' },
    { end: true, t: 'Pine Street School is open!', ico: 'star' },
  ],
  legTime: [0, 44, 36, 36, 36, 34],
  treasure: { leg1: [3, 1], leg2: [3, 1], leg3: [3, 1], leg4: [3, 1], bay: [3, 1], lot: [3, 1], yard: [3, 2] },
  stops: [{ id: 'A', z: 34, n: 3, leg: 1 }, { id: 'B', z: 9, n: 4, leg: 2 }, { id: 'C', z: -17, n: 3, leg: 3 }],
  truckSpots() { const c = []; for (let zz = -46; zz <= 46; zz += 2) for (const xx of [-2.2, 0, 2.2]) c.push([xx, zz]); for (const xx of [-4, -2, 0, 2, 4]) { c.push([xx, 55.5]); c.push([xx, -53]); } for (const xx of [-16, -14, 15, 14]) c.push([xx, -52]); return c; },
  // bot routing: depot / road / campus connect through the two road ends
  botZone(x, z) { return z > 50 ? 'D' : z < -50 ? 'N' : 'R'; },
  botOpen(x, z) { return z > 50 ? [-1, 55.5] : z < -50 ? [clamp(x, -14, 14), -53.5] : [0, clamp(z, -47, 47)]; },
  botMouth(zp, zt, px, pz, tz) {
    if (zp === 'D') return [-1, 46]; if (zp === 'N') return [0, -46];
    if (zt === 'D' && pz < 44) return [-1, 46.5]; if (zt === 'N' && pz > -44) return [0, -46.5];
    return null;
  },
  botTarget(p) { return Math.abs(p.z) < 50 ? { x: clamp(p.x, -2.4, 2.4), z: p.z } : p; },
  layout() {
    PAVED.push({ r: rect(-4.5, -50, 4.5, 50), kind: 'asphalt', d: 0.5, key: 'street' });
    PAVED.push({ r: rect(-6.3, -50, -4.5, 50), kind: 'walk', d: 0.38, key: 'walkW' });
    PAVED.push({ r: rect(4.5, -50, 6.3, 50), kind: 'walk', d: 0.38, key: 'walkE' });
    PAVED.push({ r: rect(-12, 50, 12, 61), kind: 'apron', d: 0.42, key: 'depot', noSnow: true });
    PAVED.push({ r: rect(-11, -62, 11, -50), kind: 'asphalt', d: 0.46, key: 'bay' });
    PAVED.push({ r: rect(11, -66, 23, -46), kind: 'asphalt', d: 0.44, key: 'lot' });
    PAVED.push({ r: rect(-23.5, -66, -11, -46), kind: 'school', d: 0.42, key: 'yard' });
    PAVED.push({ r: rect(-9.5, -63.8, 9.5, -62), kind: 'flags', d: 0.32, key: 'frontwalk' });
    for (const S of this.stops) PAVED.push({ r: rect(6.3, S.z - 2.6, 9.4, S.z + 2.6), kind: 'walk', d: 0.34, key: 'pad' + S.id });
  },
  areas(mk, pav) {
    mk('leg1', 'Pine Street (1)', [rect(-6.3, 25, 6.3, 50)], { title: 'ROAD CLEAR!' });
    mk('leg2', 'Pine Street (2)', [rect(-6.3, 0, 6.3, 25)], { title: 'ROAD CLEAR!' });
    mk('leg3', 'Pine Street (3)', [rect(-6.3, -25, 6.3, 0)], { title: 'ROAD CLEAR!' });
    mk('leg4', 'Pine Street (4)', [rect(-6.3, -50, 6.3, -25)], { title: 'ROAD CLEAR!' });
    mk('bay', 'School drop-off', [pav('bay')], { title: 'DROP-OFF CLEAR!', ico: 'school' });
    mk('lot', 'Teachers parking', [pav('lot')], { title: 'CARS DUG OUT!', ico: 'car' });
    mk('yard', 'Playground', [pav('yard')], { title: 'PLAYGROUND OPEN!', ico: 'kids' });
    mk('frontwalk', 'School path', [pav('frontwalk')], { quiet: true });
    for (const S of this.stops) mk('pad' + S.id, 'Bus stop ' + S.id, [pav('pad' + S.id)], { quiet: true });
  },
  // ---------------- building the street ----------------
  build(scene, H, T) {
    const block = (x0, z0, x1, z1) => SNOW.paint(x0, z0, x1, z1, (k) => { if (T[k] === 1) { T[k] = 2; H[k] = 0; } else if (T[k] === 0) T[k] = 2; });
    // markings: centre line, lane edges, zebra crossings (all under the snow until you plow)
    const yel = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.6 }), wht = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.6 });
    const ym = [], wm = [];
    for (let z = -48; z < 48; z += 6) { if (Math.abs(z - 8.5) < 4 || z > 43 || z < -46) continue; const g = new THREE.PlaneGeometry(0.16, 3); g.rotateX(-Math.PI / 2); g.translate(0, 0.006, z + 1.5); ym.push(g); }
    for (const x of [-4.25, 4.25]) { const g = new THREE.PlaneGeometry(0.12, 100); g.rotateX(-Math.PI / 2); g.translate(x, 0.006, 0); wm.push(g); }
    for (const zc of [46.5, 9, -47.5]) for (let x = -3.9; x <= 3.9; x += 1.0) { const g = new THREE.PlaneGeometry(0.5, 2.6); g.rotateX(-Math.PI / 2); g.translate(x, 0.007, zc); wm.push(g); }
    // school zone letters / bus bay box
    for (const [x0, z0, x1, z1] of [[-9.8, -60.8, 7.6, -60.6], [-9.8, -57.4, 7.6, -57.2], [-9.8, -60.8, -9.6, -57.2], [7.4, -60.8, 7.6, -57.2]]) { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0.007, (z0 + z1) / 2); ym.push(g); }
    for (const L of [[ym, yel], [wm, wht]]) { const m = new THREE.Mesh(mergeGeoms(L[0]), L[1]); m.receiveShadow = true; scene.add(m); }
    const curbM = new THREE.MeshStandardMaterial({ color: 0xc4c7cb, roughness: 0.8 }), cg = [];
    for (const x of [-4.5, 4.5]) { const g = new THREE.BoxGeometry(0.16, 0.08, 100); g.translate(x, 0.04, 0); cg.push(g.toNonIndexed()); }
    const curb = new THREE.Mesh(mergeGeoms(cg), curbM); curb.receiveShadow = true; scene.add(curb);
    const yardY = (x, z) => SNOW.depth(x, z) - 0.06;
    // ---- the school ----
    const sch = litBuilding('school', -1.55, -69.55, 0, 1.35, new V3(-1.2, 0, -63.4), 0.1);
    this.school = sch;
    const sign = makeSign('PINE ST. SCHOOL', '#c23a30'); sign.position.set(-1.4, 6.2, -63.0); sign.scale.setScalar(3.2); scene.add(sign);
    decor('flagpost', 8.4, -63.0, 0, 1.0, 0, { trunk: 0.25 });
    // ---- the school bus (warming up at the depot) + a spare bus under the canopy ----
    const busTint = (o) => { o.traverse(c => { if (c.isMesh) { const n = c.material.name; if (n === 'crimson') { c.material = c.material.clone(); c.material.color.setHex(0xffb81c); } else if (n === 'canary') { c.material = c.material.clone(); c.material.color.setHex(0x2b2f36); } } }); return o; };
    const bus = busTint(place('bus', 3.4, 56.2, Math.PI, 1, 0)); scene.add(bus); bus.updateMatrixWorld(true);
    const B = this.bus = { obj: bus, x: 3.4, z: 56.2, h: Math.PI, spd: 0, si: 0, pi: 0, state: 'ready', dwell: 0, honkT: 0, kidsIn: 0, lights: [] };
    // solid while it waits in the depot
    B.park = [2.0, 50.3, 4.8, 61.9]; SNOW.paint(...B.park, (k) => { if (T[k] === 1) T[k] = 2; });
    // stop lights on the bus roof (blink while the bus is stopped)
    const lm = new THREE.MeshBasicMaterial({ color: 0xff3020, toneMapped: false });
    for (const [lx, lz] of [[1.05, 5.7], [-1.05, 5.7], [1.05, -5.8], [-1.05, -5.8]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), lm.clone()); m.position.set(lx, 2.95, lz); bus.add(m); B.lights.push(m); }
    const spare = busTint(place('bus', -8.8, 55.6, Math.PI, 1, 0)); scene.add(spare); solidUnder(spare, 0.1, true);
    decor('canopy', -8.8, 55.2, Math.PI / 2, 1.05, 0, { solid: 0.1, paved: true });
    const depSign = makeSign('BUS DEPOT', '#2a6fd6'); depSign.position.set(0, 4.4, 61.8); depSign.rotation.y = Math.PI; depSign.scale.setScalar(2.2); scene.add(depSign);
    decor('saltbin', 4.2, 60.4, 0.2, 1.4, 0, { solid: 0.05, paved: true });
    decor('cone', 11.2, 50.6, 0, 1, 0); decor('cone', -11.3, 50.6, 0, 1, 0);
    // ---- bus stops with kids waiting ----
    this.stopKids = {};
    for (const S of this.stops) {
      decor('shelter', 8.75, S.z, -Math.PI / 2, 1, 0, { solid: 0.05, paved: true });
      decor('stoppole', 6.9, S.z + 2.3, -Math.PI / 2, 1, 0, { trunk: 0.2 });
      const lab = makeSign('STOP ' + S.id, '#ffb81c'); lab.position.set(8.0, 3.2, S.z); lab.rotation.y = -Math.PI / 2; lab.scale.setScalar(1.3); scene.add(lab);
    }
    // ---- teachers' parking (cars snowed in, nose-in along the north edge; the rest of the lot is wide open) ----
    const carKeys = ['car_blue', 'car_white', 'camper', 'car_white', 'car_blue'];
    for (let i = 0; i < 5; i++) {
      const cx = 12.2 + i * 2.45, cz = -63.6, key = carKeys[i];
      const car = place(key, cx, cz, Math.PI, 1, 0); scene.add(car); car.updateMatrixWorld(true);
      const cb = new THREE.Box3().setFromObject(car), ab = new THREE.Box3().setFromObject(artScene(key));
      const ccap = makeSnowCap(ab.max.x - ab.min.x, ab.max.z - ab.min.z, Math.min(2.2, ab.max.y)); ccap.position.set((cb.min.x + cb.max.x) / 2, 0, (cb.min.z + cb.max.z) / 2); ccap.rotation.y = car.rotation.y; scene.add(ccap);
      const fx0 = cb.min.x + 0.12, fx1 = cb.max.x - 0.12, fz0 = cb.min.z + 0.12, fz1 = cb.max.z - 0.12;
      SNOW.paint(fx0, fz0, fx1, fz1, (k) => { if (T[k] === 1) { T[k] = 2; H[k] = 0; } });
      WORLD.cars.push({ obj: car, cap: ccap, lot: 'teachers', x: cx, z: cz, rot: car.rotation.y, state: 'parked', fx0, fx1, fz0, fz1 });
    }
    // ---- playground: swings and slide stand on the field just past the yard (the yard itself is wide open) ----
    const outY = (CH.yardDepth || 0.44) - 0.02;
    decor('swings', -26.6, -61.5, Math.PI / 2, 1.05, outY);
    decor('slide', -26.4, -53.2, Math.PI / 2, 1.15, outY);
    decor('bench_a', -25.4, -48.2, Math.PI / 2, 1, outY);
    decor('snowman_b', -25.8, -65.0, 1.2, 1.0, outY);
    const ys = makeSign('PLAYGROUND', '#2fb36a'); ys.position.set(-17, 3.0, -45.6); ys.scale.setScalar(1.8); scene.add(ys);
    // school zone signs, traffic lights at the school crossing
    decor('trafficlight', 6.9, -47.5, -Math.PI / 2, 1, 0, { trunk: 0.2 }); decor('trafficlight', -6.9, -47.5, Math.PI / 2, 1, 0, { trunk: 0.2 });
    for (const [lx, lz] of [[-10.6, -62.4], [10.6, -62.4]]) decor('lamp_b', lx, lz, 0, 1.2, 0, { trunk: 0.25 });
    // ---- the street: houses, cafe, library, a pine park ----
    const lot = (key, side, zc, s, rot, label, col) => {
      const o = artScene(key), bx = new THREE.Box3().setFromObject(o);
      const depth = (bx.max.z - bx.min.z) * s, front = 9.0;
      const cx = side * (front + bx.max.z * s), r = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      const Hh = litBuilding(key, cx, zc, rot !== undefined ? rot : r, s, new V3(side * (front - 0.3), 0, zc), 0.15);
      if (label) { const sg = makeSign(label, col || '#2a6fd6'); sg.position.set(side * (front - 0.2), 3.4, zc); sg.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; sg.scale.setScalar(2.0); scene.add(sg); }
      return Hh;
    };
    this.homes = [];
    this.homes.push(lot('guesthouse', 1, 21.5, 0.95));
    this.homes.push(lot('bakery', 1, -4.2, 1.7, undefined, 'PINE CAFE', '#c23a30'));
    this.homes.push(lot('lodge', 1, -33.5, 0.95, undefined, 'LIBRARY', '#2a6fd6'));
    this.homes.push(lot('cottage_red', -1, 40, 2.05));
    this.homes.push(lot('chalet', -1, 14.5, 1.05));
    this.homes.push(lot('chalet_blue', -1, -11.5, 1.6));
    this.homes.push(lot('cabin', -1, -36, 1.2));
    // fences along the sidewalks (gaps at bus stops and the depot/school ends)
    for (const sx of [-1, 1]) {
      const fx = sx * 6.95;
      for (let z = -44; z < 46; z += 2.0) {
        const zc = z + 1.0;
        if (sx > 0 && this.stops.some(S => Math.abs(zc - S.z) < 3.6)) continue;
        decor('picket', fx, zc, Math.PI / 2, 1, yardY(fx + sx * 0.2, zc), { solid: 0.02 });
      }
    }
    // lamps
    for (let z = -42; z <= 44; z += 14.5) for (const sx of [-1, 1]) {
      const zz = z + (sx > 0 ? 7 : 0); if (sx > 0 && this.stops.some(S => Math.abs(zz - S.z) < 4)) continue;
      decor('lamp_a', sx * 7.5, zz, 0, 1.05, yardY(sx * 7.5, zz), { trunk: 0.3 });
      WORLD.lamps.push(new V3(sx * 7.5, 3.0, zz));
    }
    // pine park + trees behind everything
    const kinds = ['fir_a', 'fir_b', 'fir_c', 'spruce_s'], r = mulberry(222);
    for (let i = 0; i < 70; i++) {
      const sx = i % 2 ? 1 : -1, x = sx * (9.5 + r() * 13.5), z = -46 + r() * 94;
      if (this.homes.some(h => Math.abs(h.z - z) < 7.5 && Math.sign(h.x) === sx)) continue;
      if (sx > 0 && this.stops.some(S => Math.abs(z - S.z) < 3.5) && x < 12) continue;
      decor(kinds[(r() * 4) | 0], x, z, r() * TAU, 0.95 + r() * 0.7, yardY(x, z), { trunk: 0.45 });
    }
    for (let i = 0; i < 22; i++) { const x = (i % 2 ? 1 : -1) * (13 + r() * 10), z = 50 + r() * 11; if (Math.abs(x) < 13) continue; decor(kinds[(r() * 3) | 0], x, z, r() * TAU, 1.1 + r() * 0.6, yardY(x, z)); }
    decor('snowman_a', -12.5, 28, 1.0, 1.0, yardY(-12.5, 28)); decor('sled', 14, 3, 0.4, 1.0, yardY(14, 3)); decor('bench_a', -8.2, 3.2, Math.PI / 2, 1, yardY(-8.2, 3.2));
    decor('snowbank', 12.6, 47.6, 0.3, 1.6, yardY(12.6, 47.6)); decor('snowbank', -13.5, 47.8, -0.2, 1.8, yardY(-13.5, 47.8));
  },
  // ---------------- the chapter's life ----------------
  begin() {
    this.legT = 0; this.curLeg = 0; this.released = {}; this.onTime = 0; this.flashT = 0; this.kidsLeft = 0; this.party = 0;
    this.spawnStopKids();
  },
  spawnStopKids() {
    for (const S of this.stops) {
      if (this.stopKids[S.id]) continue;
      const list = [];
      for (let i = 0; i < S.n; i++) {
        const n = NPC.spawn({ x: 7.0 + (i % 2) * 0.55, z: S.z - 1.4 + i * 1.0, h: -Math.PI / 2 + rnd(-0.3, 0.3), kind: 'kid', pose: 'idle', pop: false, tag: 'stop' + S.id });
        list.push(n);
      }
      this.stopKids[S.id] = list;
    }
  },
  kidsTotal() { return this.stops.reduce((s, S) => s + S.n, 0); },
  route: [
    { pts: [[3.4, 38.2]], stop: 'A', leg: 1 },
    { pts: [[3.4, 13.2]], stop: 'B', leg: 2 },
    { pts: [[3.4, -12.8]], stop: 'C', leg: 3 },
    { pts: [[3.4, -45.5]], stop: 'G', leg: 4 },
    { pts: [[3.0, -52.5], [0.6, -57.2], [-3.6, -59.1]], stop: 'S', leg: 5 },
    // after the drop-off the bus heads back to the depot (the campus stays open for you)
    { pts: [[-7.5, -57.5], [-6.2, -52.5], [-3.4, -46.5], [-3.4, 40], [-3.4, 54.5]], stop: 'H', leg: 5 },
  ],
  onDone(a, silent) {
    const g = GOALS.find(g => g.a === a.key);
    if (g && g.leg) {
      if (!this.released) this.released = {};  // (a resumed game restores the chapter before begin() ran)
      if (!silent && this.curLeg === g.leg && this.legT > 0 && !this.released[g.leg]) {
        // beat the bus: bonus for the seconds left on the clock
        const bonus = niceNum(Math.max(30, this.legT * GAME.price() * 7));
        GAME.earn(bonus); this.onTime++;
        const p = PL.truck.position; FX.coinBurst(p.x, 2.2, p.z, 16, bonus, { up: 1.2 }); FX.confetti(p.x, 2.5, p.z, 50);
        UI.floatText(new V3(p.x, 3.6, p.z), 'ON TIME! +' + fmt(bonus), '#7dffb0', 34);
        this.flashT = 1.6; this.flashTxt = 'ON TIME!'; AUD.cheer();
        a.title = Math.ceil(this.legT) + ' SECONDS EARLY!';
      }
      this.released[g.leg] = 1;
    }
    if (a.key === 'lot') { for (const c of WORLD.cars) if (c.lot === 'teachers') LIFE.freeCar(c, silent); if (!silent) this.teachers(); }
    return null;
  },
  update(dt) {
    const g = GOALS[GAME.goalIdx()];
    // countdown for the stretch you are on
    // the clock waits while the chapter card is up
    if (g.leg && this.curLeg !== g.leg) { this.curLeg = g.leg; this.legT = this.legTime[g.leg]; this.warned = false; }
    if (g.leg && !GAME.ended && this.bus.state !== 'parked' && !CHUI.open && CAM.intro <= 0.05) {
      if (!this.released[g.leg]) {
        this.legT -= dt;
        if (this.legT <= 0) { this.released[g.leg] = 1; UI.banner('HURRY!', 'The bus is coming!', 'bus', 1.8); AUD.busHorn(); this.shiver(g.leg); }
      }
    }
    const kids = this.bus.kidsIn + '/' + this.kidsTotal() + ' kids';
    if (this.flashT > 0) { this.flashT -= dt; UI.timer(this.flashTxt, 'bus', kids, 'good'); }
    else if (g.leg && this.bus.state !== 'parked' && !GAME.ended && !CHUI.open) UI.timer(this.released[g.leg] && !GAME.done[g.a] ? 'LATE' : this.legT, 'bus', kids, this.released[g.leg] ? 'late' : '');
    else UI.timer(null);
    // kids at the stops cheer you on as you plow past
    this.chatT = (this.chatT || 0) - dt;
    if (this.chatT <= 0) for (const S of this.stops) {
      const kids = this.stopKids[S.id] || []; if (!kids.length) continue;
      if (Math.abs(PL.z - S.z) < 9 && PL.x > -3) { const k = kids[(Math.random() * kids.length) | 0]; NPC.say(k, ['Go go go!', 'Hurry, the bus is coming!', 'Wow, look at it throw!', 'Snow day? No way!', 'Clear the road!'][(Math.random() * 5) | 0], 2.4); NPC.cheer(k, 1.2); k.h = Math.atan2(PL.x - k.x, PL.z - k.z); this.chatT = 5; break; }
    }
    // route bar: bus (yellow) and you (red), from the depot to the school
    if (g.leg && !GAME.ended) { const f = z => clamp((52 - z) / 112, 0, 1); UI.timerRoute(f(this.bus.z), f(PL.z)); } else UI.timerRoute(null);
    this.busUpdate(dt);
    // finale: kids out to play, snowball fight
    if (this.party > 0) {
      this.party -= dt; this.ballT = (this.ballT || 0) - dt;
      const kidsOut = NPC.byTag('play');
      if (this.ballT <= 0 && kidsOut.length > 1) {
        this.ballT = rnd(0.12, 0.3);
        const a = kidsOut[(Math.random() * kidsOut.length) | 0], b = kidsOut[(Math.random() * kidsOut.length) | 0];
        if (a !== b) { a.h = Math.atan2(b.x - a.x, b.z - a.z); NPC.cheer(a, 0.4); FX.clump(a.x, 1.1, a.z, b.x, 0.9, b.z, 0.13, rnd(0.55, 0.8), (x, y, z) => { FX.puff(x, y, z, 4, 0.6); if (Math.random() < 0.4) NPC.cheer(b, 0.8); }); }
      }
      if (Math.random() < dt * 2.5) FX.confetti(-17 + rnd(-4, 4), 4, -56 + rnd(-6, 6), 22);
    }
  },
  shiver(leg) { const S = this.stops.find(S => S.leg === leg); if (!S) return; for (const n of this.stopKids[S.id] || []) { n.pose = 'shiver'; } const k = (this.stopKids[S.id] || [])[0]; if (k) NPC.say(k, ['Brrr! So cold!', "Where's the bus?", 'We will be late!'][(Math.random() * 3) | 0], 3.5); },
  // the bus drives the cleared road, stopping at each stop for the kids
  busUpdate(dt) {
    const B = this.bus, o = B.obj;
    for (const L of B.lights) L.material.color.setHex(B.state === 'stop' && (performance.now() / 300 | 0) % 2 ? 0xff3020 : 0x5a1010);
    if (B.state === 'parked' || B.state === 'done') return;
    if (B.state === 'ready') { if (this.released[1]) { B.state = 'go'; AUD.busHorn(); if (B.park) { SNOW.paint(...B.park, (k) => { if (SNOW.T[k] === 2) SNOW.T[k] = 1; }); B.park = null; } } else { if (Math.random() < dt * 3) FX.smoke(B.x - Math.sin(B.h) * 6.3, 0.4, B.z - Math.cos(B.h) * 6.3); return; } }
    if (B.state === 'stop') {
      B.dwell -= dt;
      if (B.dwell <= 0 && B.boarding <= 0) {
        const seg = this.route[B.si];
        if (seg.stop === 'H') { B.state = 'done'; return; }
        B.si++; B.pi = 0; B.state = 'go';
        if (B.si >= this.route.length) { B.state = 'done'; return; }
      }
      return;
    }
    // go: only into a stretch that is clear (or whose time ran out)
    const seg = this.route[B.si];
    if (!this.released[seg.leg]) { B.spd = damp(B.spd, 0, 6, dt); return; }
    const p = seg.pts[B.pi], dx = p[0] - B.x, dz = p[1] - B.z, d = Math.hypot(dx, dz);
    const last = B.pi === seg.pts.length - 1;
    const fx = Math.sin(B.h), fz = Math.cos(B.h);
    // snow ahead? (deep snow stops the bus) / your machine in the way?
    let blocked = false;
    // only the road and the drop-off count (not the paths and lots beside them)
    if (!this._roadIds) this._roadIds = new Set(['leg1', 'leg2', 'leg3', 'leg4', 'bay'].map(k => WORLD.areaByKey[k].id));
    for (let s = 6.2; s <= 9.5 && !blocked; s += 0.8) for (const sd of [-0.9, 0, 0.9]) { const x = B.x + fx * s + fz * sd, z = B.z + fz * s - fx * sd, k = SNOW.idx(x, z); if (k >= 0 && SNOW.T[k] === 1 && this._roadIds.has(SNOW.A[k]) && SNOW.H[k] > 0.2) { blocked = true; break; } }
    const rx = PL.x - B.x, rz = PL.z - B.z, ahead = rx * fx + rz * fz, side = Math.abs(rx * fz - rz * fx);
    const meBlock = ahead > 0 && ahead < 13 && side < 2.6 + (PL.kind === 'truck' ? PL.geo.halfW : 0.3);
    const want = blocked || meBlock ? 0 : last ? Math.min(7.5, d * 0.9 + 0.8) : 7.5;
    B.spd = damp(B.spd, want, want < B.spd ? 4 : 1.6, dt);
    if ((blocked || meBlock) && B.spd < 0.5) {
      B.honkT -= dt;
      if (B.honkT <= 0) { B.honkT = 2.8; AUD.busHorn(); UI.floatText(new V3(B.x + fx * 5, 3.6, B.z + fz * 5), 'BEEP BEEP!', '#ffe27a', 26); if (blocked && !this.stuckSaid) { this.stuckSaid = 1; UI.hint('The bus is stuck in the snow! Plow ahead of it!', 3); } }
    } else B.honkT = Math.min(B.honkT, 0.6);
    if (d > 0.3) { B.h = dampAng(B.h, Math.atan2(dx, dz), 2.2, dt); const st = Math.min(d, B.spd * dt); B.x += Math.sin(B.h) * st; B.z += Math.cos(B.h) * st; }
    if (d < (last ? 0.35 : 1.6)) {
      if (!last) B.pi++;
      else { B.state = 'stop'; B.spd = 0; B.dwell = 1.2; this.stuckSaid = 0; this.atStop(seg.stop); }
    }
    o.position.set(B.x, 0, B.z); o.rotation.y = B.h;
    if (B.spd > 0.5 && Math.random() < 0.4) FX.smoke(B.x - Math.sin(B.h) * 6.3 + Math.cos(B.h) * 0.8, 0.35, B.z - Math.cos(B.h) * 6.3 - Math.sin(B.h) * 0.8);
  },
  door() { const B = this.bus, fx = Math.sin(B.h), fz = Math.cos(B.h); return [B.x + fx * 3.6 - fz * 1.5, B.z + fz * 3.6 + fx * 1.5]; },
  atStop(id) {
    const B = this.bus; B.boarding = 0;
    if (id === 'G' || id === 'H') { B.dwell = 0.3; return; }
    if (id === 'S') { this.arriveSchool(); return; }
    const kids = this.stopKids[id] || [], [dx, dz] = this.door();
    AUD.busHorn();
    kids.forEach((n, i) => {
      B.boarding++; n.pose = 'idle'; NPC.cheer(n, 0.9);
      later((250 + i * 420) / 1000, () => NPC.go(n, [[dx + 0.6, dz], [dx, dz]], 2.6, (k) => {
        NPC.kill(k, true); B.kidsIn++; B.boarding--; AUD.coin();
        const v = niceNum(GAME.price() * 30); GAME.earn(v); FX.coinBurst(dx, 1.6, dz, 4, v, { up: 0.7 });
        UI.floatText(new V3(dx, 2.6, dz), '+1 KID', '#ffe27a', 26);
        if (B.boarding <= 0) { B.dwell = 0.6; if (id === 'A' && CREW.recruit(1.2)) { } }
      }));
    });
    this.stopKids[id] = [];
    if (!kids.length) B.dwell = 0.5;
  },
  arriveSchool() {
    const B = this.bus, [dx, dz] = this.door();
    // the kids hop out and run into school
    const n = B.kidsIn || this.kidsTotal(); this.kidsLeft = n; B.dwell = 1.2 + n * 0.33;
    for (let i = 0; i < n; i++) later((300 + i * 330) / 1000, () => {
      const k = NPC.spawn({ x: dx, z: dz, h: Math.PI, kind: 'kid', tag: 'school' });
      NPC.cheer(k, 0.6);
      NPC.go(k, [[dx + rnd(-0.5, 0.5), dz - 1.2], [-1.2 + rnd(-0.8, 0.8), -63.2]], 2.8, (q) => NPC.kill(q, true));
    });
    UI.banner('ALL KIDS AT SCHOOL!', this.onTime + ' of 5 stretches on time', 'school', 2.8);
    AUD.cheer(); AUD.bell();
    const t = NPC.spawn({ x: -3.2, z: -63.6, h: 0, kind: 'adult', pose: 'wave', look: Object.assign(NPC.look('adult'), { jacket: 0x8e5bb5, hatOn: false, hair: 0x7a4a2a, beard: null }) });
    NPC.say(t, 'Good morning, everyone!', 4);
    later((9000) / 1000, () => NPC.kill(t));
  },
  teachers() {
    for (let i = 0; i < 3; i++) later((i * 600) / 1000, () => {
      const t = NPC.spawn({ x: 6 + i, z: -63.2, h: Math.PI / 2, kind: 'adult', pose: 'wave' });
      NPC.say(t, ['Thank you!', 'Our cars are free!', 'You saved the day!'][i], 3);
      later(5, () => NPC.kill(t));
    });
  },
  finale() {
    AUD.bell(); AUD.bigWin();
    later((600) / 1000, () => UI.banner('SCHOOL IS OPEN!', 'Every kid made it to school', 'star', 4.0));
    // everybody out to play
    for (let i = 0; i < 16; i++) later((i * 160) / 1000, () => {
      const k = NPC.spawn({ x: -8 + rnd(-1, 1), z: -63.0, h: Math.PI, kind: 'kid', tag: 'play' });
      NPC.go(k, [[-12.5, -57 + rnd(-3, 3)], [rnd(-18.5, -12), rnd(-64, -48)]], 3.2, (q) => { q.pose = Math.random() < 0.5 ? 'wave' : 'idle'; NPC.cheer(q, 1.5); });
    });
    this.party = 9;
  },
  save() { const B = this.bus; return { b: [B.si, B.pi, +B.x.toFixed(2), +B.z.toFixed(2), +B.h.toFixed(3), B.state, B.kidsIn], r: this.released, ot: this.onTime, lg: [this.curLeg, +(this.legT || 0).toFixed(1)], sk: Object.fromEntries(this.stops.map(S => [S.id, (this.stopKids[S.id] || []).length])) }; },
  load(o) {
    const B = this.bus; this.begin();
    this.released = o.r || {}; this.onTime = o.ot || 0; if (o.lg) { this.curLeg = o.lg[0]; this.legT = Math.max(8, o.lg[1]); }
    if (o.b) { [B.si, B.pi, B.x, B.z, B.h, B.state, B.kidsIn] = o.b; if (B.state !== 'ready' && B.park) { SNOW.paint(...B.park, (k) => { if (SNOW.T[k] === 2) SNOW.T[k] = 1; }); B.park = null; } if (B.state === 'stop') { B.state = 'go'; B.pi = 0; B.si = Math.min(B.si + 1, this.route.length - 1); } B.obj.position.set(B.x, 0, B.z); B.obj.rotation.y = B.h; }
    if (B.state === 'done' || GAME.done.bay) { B.state = 'done'; const [sx, sz] = [B.x, B.z]; B.obj.position.set(sx, 0, sz); }
    for (const S of this.stops) if (o.sk && o.sk[S.id] === 0) { for (const n of this.stopKids[S.id] || []) NPC.kill(n); this.stopKids[S.id] = []; }
  },
};
