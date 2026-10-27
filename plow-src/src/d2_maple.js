// ---------- chapter 1: Maple Lane (snow day: shovel -> crew -> plow truck) ----------
const CH_MAPLE = {
  id: 1, key: 'maple', name: 'Maple Lane', tag: 'Snow day!', intro: 'Help your neighbors dig out, then plow the whole street.',
  color: '#ff8a1e', icon: 'house',
  grid: { X0: -24, Z0: -68, NX: 241, NZ: 681 },
  start: { x: -6.0, z: 46.4, h: -Math.PI / 2 - 0.15, tool: 'shovel' },
  shop: ['shovel', 'bigshovel', 'blower', 'megablower', 'truck', 'dumpplow'],
  giftTruck: true, payMul: 1, par: [330, 540], reward: 2000,
  crewYard: [9.4, 57.2], crewExtra: ['apron'],
  botTarget(p) { return { x: clamp(p.x, -2.2, 2.2), z: p.z }; },
  introCam: { from: [0, 34, 82], look: [0, 0.5, 10] },
  finaleCam: { from: [30, 19, 12], look: [10, 3, -10] },
  goals: [
    { a: 'rose', t: "Clear Grandma Rose's driveway", ico: 'house' },
    { a: 'miller', t: "Dig out the Millers' car", ico: 'car' },
    { a: 'park', t: "Free the Parks' camper", ico: 'car' },
    { a: 'hale', t: "Clear Mr. Hale's driveway", ico: 'house' },
    { a: 'lina', t: "Free Lina's ice cream van", ico: 'car' },
    { a: 'ortega', t: "Help the Ortegas", ico: 'house' },
    { a: 'tom', t: "Clear Old Tom's path", ico: 'house' },
    { a: 'street1', t: 'Plow Maple Lane (south)', ico: 'road' },
    { a: 'street2', t: 'Plow Maple Lane (north)', ico: 'road' },
    { a: 'north', t: 'Open the bakery', ico: 'shop' },
    { a: 'plaza', t: 'Light up the town square', ico: 'tree' },
    { end: true, t: 'Maple Lane is saved!', ico: 'star' },
  ],
  hand: ['rose', 'miller', 'park', 'hale', 'lina', 'ortega', 'tom'],
  treasure: { rose: [3, 0], miller: [2, 1], park: [2, 1], hale: [2, 1], lina: [2, 1], ortega: [2, 1], tom: [2, 1], street1: [10, 3], street2: [10, 3], north: [4, 2], plaza: [5, 2], apron: [2, 0] },
  truckSpots() { const c = []; for (let zz = -46; zz <= 46; zz += 2) for (const xx of [-1.75, 0, 1.75]) c.push([xx, zz]); for (const xx of [-5, -2.5, 0, 2.5, 5]) { c.push([xx, 55.5]); c.push([xx, -55.8]); } return c; },
  // bot routing: the street, the two end lots and the square connect through their mouths
  botZone(x, z) { return z < -50 ? 'N' : z > 50 ? 'S' : (x > 5.3 && z < 2.4 && z > -22.4) ? 'P' : 'R'; },
  botOpen(x, z) { const inPlaza = x > 5.3 && z < 2.4 && z > -22.4; return inPlaza ? [8.2, clamp(z, -20, 0)] : [0, clamp(z, -55.5, 55.5)]; },
  botMouth(zp, zt, px, pz, tz) {
    if (zp === 'N') return [0, -45]; if (zp === 'S') return [0, 45];
    if (zp === 'P') return [1.0, clamp(pz, -16, -4)];
    if (zt === 'P') return (px < 0.5 || Math.abs(pz - clamp(tz, -16, -4)) > 4) ? [1.0, clamp(tz, -16, -4)] : null;
    if (zt === 'N' && pz > -44) return [0, -46]; if (zt === 'S' && pz < 44) return [0, 46];
    return null;
  },
  lines: {
    rose: ['Bless you, dear!', 'My hip thanks you!'], miller: ['Our car is free!', 'You rock!'], hale: ['Splendid work!'], park: ['Road trip time!'],
    lina: ['Free ice cream later!'], ortega: ['¡Gracias!'], tom: ['Back in my day...', 'Good job, kid.'],
  },
  onDone(a, silent) {
    let src = null;
    if (a.lot) {
      const H = a.lot.house; H.litT = 1; if (silent) { H.lit = 1; applyLit(H, 1); }
      src = H.door;
      if (!silent) { const L = this.lines[a.key]; LIFE.resident(a.lot, L ? L[(Math.random() * L.length) | 0] : 'Thank you!'); }
      const car = WORLD.cars.find(c => c.lot === a.lot);
      if (car) LIFE.freeCar(car, silent);
    }
    if (a.key === 'north') { WORLD.bakery.litT = 1; if (silent) { WORLD.bakery.lit = 1; applyLit(WORLD.bakery, 1); } src = WORLD.bakery.door; if (!silent) LIFE.baker(); }
    if (a.key === 'plaza') WORLD.tree.lit = silent ? 1 : 0.001;
    if ((a.key === 'street1' || a.key === 'street2') && GAME.done.street1 && GAME.done.street2) LIFE.streetOpen(silent);
    return src;
  },
  finale() {
    LIFE.fireworks(12.4, -10, 7); AUD.bigWin();
    setTimeout(() => UI.banner('MAPLE LANE IS SAVED!', 'You brought the town back to life', 'star', 4.0), 600);
  },
  layout() {
    PAVED.push({ r: rect(-3.5, -50, 3.5, 50), kind: 'asphalt', d: 0.5, key: 'street' });
    PAVED.push({ r: rect(-5.3, -50, -3.5, 50), kind: 'walk', d: 0.38, key: 'walkW' });
    PAVED.push({ r: rect(3.5, -50, 5.3, 50), kind: 'walk', d: 0.38, key: 'walkE' });
    PAVED.push({ r: rect(-11, 50, 11, 61), kind: 'apron', d: 0.12, key: 'apron' });
    PAVED.push({ r: rect(-11, -61.5, 11, -50), kind: 'asphalt', d: 0.46, key: 'north' });
    PAVED.push({ r: rect(5.3, -22.4, 19.6, 2.4), kind: 'cobble', d: 0.42, key: 'plaza' });
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
  },
  areas(mk, pav) {
    for (const L of LOTS) mk(L.key, L.who, [L.drive, L.path], { lot: L });
    // a street job = the road plus both sidewalks (fence to fence): wide blades clear it in a few long passes
    mk('street1', 'Maple Lane (south)', [rect(-5.3, 0, 5.3, 50)]);
    mk('street2', 'Maple Lane (north)', [rect(-5.3, -50, 5.3, 0)]);
    mk('north', 'Bakery parking', [pav('north')]);
    mk('plaza', 'Town square', [pav('plaza')]);
    mk('apron', 'Crew yard', [pav('apron')], { quiet: true });

  },
  build(scene, H, T) {
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
      scene.add(o); solidUnder(o, 0.15, false);
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
    const bak = place('bakery', 0, -64.8, 0, 2.0, 0); scene.add(bak); solidUnder(bak, 0.15, false);
    const bakWins = []; bak.traverse(c => { if (c.isMesh && c.material.emissive && c.material.emissive.r > 0.1) { const nm = c.material.clone(); nm.userData = {}; xray(nm); nm.userData.lit = { color: nm.color.clone(), emissive: nm.emissive.clone() }; nm.color.setRGB(0.16, 0.2, 0.27); nm.emissive.setRGB(0, 0, 0); c.material = nm; bakWins.push(nm); } });
    WORLD.bakery = { obj: bak, wins: bakWins, lit: 0, litT: 0, door: new V3(0, 0, -61.4), smoke: null, x: 0, z: -64.8 };
    const kiosk = place('kiosk', 13.4, 54.6, -Math.PI / 2, 1.2, 0); scene.add(kiosk); solidUnder(kiosk, 0.1, false);
    WORLD.kiosk = kiosk;
    const crewSign = makeSign('SNOW CREW', '#2a6fd6'); crewSign.position.set(12.4, 5.6, 56.6); crewSign.rotation.x = -0.25; crewSign.scale.setScalar(1.5); scene.add(crewSign);
    // plaza
    // the square is an open ring around the big tree: room for the biggest machines; benches and the cocoa stand sit on its edge
    const tree = place('xmastree', 12.4, -10, 0, 2.6, 0); scene.add(tree);
    const tm = []; tree.traverse(c => { if (c.isMesh && c.material.emissive && (c.material.emissive.r + c.material.emissive.g) > 0.05) { const nm = c.material.clone(); nm.userData = {}; xray(nm); nm.userData.lit = { e: nm.emissive.clone(), i: nm.emissiveIntensity }; nm.emissiveIntensity = 0; c.material = nm; tm.push(nm); } });
    WORLD.tree = { obj: tree, mats: tm, lit: 0 };
    SNOW.paint(11.5, -10.9, 13.3, -9.1, (k) => { if (T[k] === 1) { T[k] = 2; H[k] = 0; } });
    decor('bench_a', 20.4, -5.5, -Math.PI / 2, 1, 0, { solid: 0.05 }); decor('bench_a', 20.4, -14.5, -Math.PI / 2, 1, 0, { solid: 0.05 });
    const cocoa = place('cocoa', 21.2, -19.8, -Math.PI / 2.6, 1.2, 0); scene.add(cocoa); solidUnder(cocoa, 0.1, false);
    // 8) decor: fences, lamps, mailboxes, trees, snowmen
    const yardY = (x, z) => SNOW.type(x, z) === 1 ? 0 : SNOW.depth(x, z) - 0.06;
    for (const L of LOTS) {
      const sx = L.side, fx = sx * 5.95;
      const z0 = L.c - 10.8, z1 = L.c + 10.8;
      const gaps = [[L.drive.z0 - 0.2, L.drive.z1 + 0.2], [L.path.z0 - 0.3, L.path.z1 + 0.3]];
      for (let z = z0; z < z1 - 0.5; z += 2.0) {
        const zc = z + 1.0; if (gaps.some(g => zc + 1.0 > g[0] && zc - 1.0 < g[1])) continue;
        decor('picket', fx, zc, Math.PI / 2, 1, yardY(fx + sx * 0.2, zc), { solid: 0.02 });
      }
      // mailbox by the driveway
      decor('mailbox', sx * 6.45, L.drive.z0 - 0.55, sx < 0 ? Math.PI / 2 : -Math.PI / 2, 0.78, yardY(sx * 6.5, L.drive.z0 - 0.55), { solid: 0.05 });
      // trees between lots and behind
      const r = mulberry(L.c * 7 + sx * 13 + 100);
      const kinds = ['fir_a', 'fir_b', 'fir_c', 'spruce_s', 'fir_a', 'birch'];
      for (let t = 0; t < 6; t++) {
        const tx = sx * (7.5 + r() * 15.5), tz = L.c - (9.4 + r() * 1.3);
        if (Math.abs(tx) < 7) continue;
        const k = kinds[(r() * kinds.length) | 0];
        decor(k, tx, tz, r() * TAU, 0.9 + r() * 0.6, yardY(tx, tz), { trunk: 0.45 });
      }
      for (let t = 0; t < 3; t++) { const tx = sx * (19.5 + r() * 3.5), tz = L.c - 8 + r() * 16; decor(kinds[(r() * 3) | 0], tx, tz, r() * TAU, 1.1 + r() * 0.7, yardY(tx, tz)); }
    }
    // lamps along sidewalks
    for (let z = -46; z <= 46; z += 15.3) {
      for (const sx of [-1, 1]) {
        const zz = z + (sx > 0 ? 7.6 : 0); if (zz > 49) continue;
        if (LOTS.some(L => L.side === sx && zz > L.drive.z0 - 0.8 && zz < L.drive.z1 + 0.8)) continue;
        if (sx > 0 && zz < 3 && zz > -23) continue;
        const lamp = decor('lamp_a', sx * 6.55, zz, 0, 1.05, yardY(sx * 6.6, zz), { trunk: 0.3 });
        WORLD.lamps.push(new V3(sx * 6.55, 3.0 + yardY(sx * 6.6, zz), zz));
      }
    }
    // plaza lamps & garlands
    for (const [lx, lz] of [[5.9, -22.0], [19.3, 2.0], [19.3, -22.0]]) { decor('lamp_b', lx, lz, 0, 1.2, 0); SNOW.paint(lx - 0.25, lz - 0.25, lx + 0.25, lz + 0.25, k => { if (T[k] === 1) { T[k] = 2; H[k] = 0; } else if (T[k] === 0) T[k] = 2; }); }
    decor('garland', 19.9, -10, Math.PI / 2, 1.6, 0.2);
    // apron decor
    decor('saltbin', -10.2, 60.4, 0.2, 1.4, 0.0, { solid: 0.05, paved: true }); decor('shovel_b', 4.2, 61.4, -0.3, 1.1, 0);
    decor('cone', 10.4, 50.6, 0, 1, 0); decor('cone', -10.4, 50.4, 0, 1, 0);
    decor('trailsign', 4.8, 61.6, Math.PI, 1.2, 0);
    // north: barrier to "Pine Street"
    for (let z = -61; z <= -50.5; z += 1.5) decor('cone', -11.4, z, 0, 1.1, 0);
    decor('slowsign', -12.1, -56, Math.PI / 2, 1.3, yardY(-12.1, -56));
    const nextSign = makeSign('PINE ST. SOON', '#5a6b80'); nextSign.position.set(-14, 2.4, -56); nextSign.rotation.y = Math.PI / 2; nextSign.scale.setScalar(1.6); scene.add(nextSign);
    // yard props (some lots already have a snowman/sled)
    decor('snowman_a', 18.5, 31.0, -1.2, 1.0, yardY(18.5, 31));
    decor('sled', -18.0, 20.2, 0.6, 1.0, yardY(-18, 20.2));
    decor('birdfeeder', -9.0, 32.5, 0.3, 1.0, yardY(-9, 32.5));
    decor('tube', 9.6, 19.0, 0, 1.0, yardY(9.6, 19));
    decor('boulder', -20, -2, 0.4, 1.2, yardY(-20, -2) - 0.3);
    decor('boulder', 21, 2, 1.4, 1.0, yardY(21, 2) - 0.3);
    for (let i = 0; i < 26; i++) { const x = (i % 2 ? 1 : -1) * (13 + (i * 7.3 % 9)), z = -66 + i * 5.1; if (Math.abs(z) < 60 && Math.abs(x) < 17) continue; decor(['fir_a', 'fir_b', 'fir_c'][i % 3], x, z, i, 1.2 + (i % 4) * 0.2, yardY(x, z)); }

  },
};
