// ---------- your snow crew: friends join and clear the next driveways for you (you earn their coins) ----------
const CREW_DEFS = [
  { name: 'Max', tool: 'shovel', w: 0.78, spd: 2.8, need: 1, sub: 'Free help with driveways!', look: { jacket: 0x2f7fd6, band: 0x2466ad, hat: 0x3ccf7a, brim: 0x2aa862, scarf: 0xffd34d, mitt: 0xff8a1e } },
  { name: 'Lily', tool: 'blower', w: 1.25, spd: 3.0, need: 3, sub: 'Your crew is growing!', look: { jacket: 0x9a5bd6, band: 0x7d45b5, hat: 0xff6fa8, brim: 0xe0558c, scarf: 0x5bc8f5, mitt: 0xffffff } },
];
const CREW = {
  list: [], joinT: 0, _v: new V3(),
  init(scene) { this.scene = scene; },
  join(i, silent) {
    if (this.list.some(h => h.i === i)) return;
    const D = CREW_DEFS[i], P = makePerson(D.look);
    P.root.scale.setScalar(0.92); this.scene.add(P.root);
    let tool;
    if (D.tool === 'shovel') { tool = makeShovel(); P.root.add(tool.g); }
    else {
      const g = new THREE.Group(), m = ownMats(artScene('blower').clone(true));
      m.traverse(c => { if (c.isMesh) { c.castShadow = true; if (c.material.name === 'red') c.material.color.setHex(0xff6fa8); } });
      m.scale.set(D.w / 0.8, 0.7, 0.7); g.add(m); g.position.set(0, 0, 1.0); P.root.add(g); tool = { g, m };
    }
    // walk in from next to you
    const sx = PL.kind === 'truck' ? 0 : PL.x, sz = PL.kind === 'truck' ? 50.6 : PL.z;
    let x = sx + 1.3, z = sz + 0.6; if (!SNOW.walk(x, z)) { x = sx; z = sz; }
    const h = { i, D, P, tool, x, z, h: Math.PI, job: null, wps: [], wi: 0, load: 0, scoop: 0, toss: 0, moving: 0, lcx: undefined, lcz: undefined, cheer: silent ? 0 : 1.6, co: {} };
    this.list.push(h); GAME.crew = Math.max(GAME.crew || 0, this.list.length);
    P.root.position.set(x, 0, z);
    if (!silent) {
      FX.confetti(x, 1.4, z, 40); FX.sparkle(x, 0.8, z, 20, 1.0); AUD.newTool();
      UI.banner(D.name.toUpperCase() + ' JOINED!', D.sub, 'house', 2.6);
      UI.floatText(this._v.set(x, 2.0, z), 'NEW HELPER!', '#7dffb0', 30);
      GAME.save();
    }
  },
  // which job: the next unfinished driveway that nobody else is on (not the one you are doing); later the crew yard
  pickJob(h) {
    const taken = new Set(this.list.filter(o => o !== h && o.job).map(o => o.job.key));
    const cur = GOALS[GAME.goalIdx()].a;
    let cands = HAND_AREAS.map(k => WORLD.areaByKey[k]).filter(a => !a.done && !taken.has(a.key));
    if (GAME.ended) cands = HAND_AREAS.map(k => WORLD.areaByKey[k]).filter(a => !taken.has(a.key) && SNOW.nearestSnow(a.lot.drive.x0 * 0.5 + a.lot.drive.x1 * 0.5, (a.lot.drive.z0 + a.lot.drive.z1) / 2, a.id, 0.08, 12));
    let a = cands.find(o => o.key !== cur) || cands[0] || null;
    if (!a) { const ap = WORLD.areaByKey.apron; if (!ap.done && !taken.has('apron')) a = ap; }
    return a;
  },
  // route: out to the sidewalk, along it, into the driveway, then back-and-forth lanes over the driveway and the path
  plan(h, a) {
    const W = [], lane = Math.max(0.45, h.D.w * 0.85), sideOf = x => (x < 0 ? -1 : 1);
    const go = (x, z, work) => W.push([x, z, !!work]);
    if (Math.abs(h.x) > 5.3) go(sideOf(h.x) * 4.6, clamp(h.z, -49, 49));
    if (a.lot) {
      const L = a.lot, s = L.side, dz = (L.drive.z0 + L.drive.z1) / 2;
      go(s * 4.6, dz);
      // driveway lanes (the car blocks the far end: stop where the ground is blocked)
      let flip = false;
      for (let zz = L.drive.z0 + 0.35; zz <= L.drive.z1 - 0.3; zz += lane) {
        let far = s * 5.6; for (let xx = 5.6; xx <= 14.3; xx += 0.3) { if (!SNOW.walk(s * xx, zz)) break; far = s * xx; }
        const near = s * 5.5;
        if (flip) { go(far, zz, 1); go(near, zz, 1); } else { go(near, zz, 1); go(far, zz, 1); }
        flip = !flip;
      }
      // the front path
      const pz = (L.path.z0 + L.path.z1) / 2;
      go(s * 4.6, pz); go(s * 5.5, pz, 1); go(s * 11.6, pz, 1); go(s * 5.5, pz); go(s * 4.6, pz);
    } else {
      const r = a.rects[0];
      go(clamp(h.x, r.x0 + 0.5, r.x1 - 0.5), r.z0 + 0.4);
      let flip = false;
      for (let zz = r.z0 + 0.4; zz <= r.z1 - 0.3; zz += lane) { if (flip) { go(r.x1 - 0.4, zz, 1); go(r.x0 + 0.4, zz, 1); } else { go(r.x0 + 0.4, zz, 1); go(r.x1 - 0.4, zz, 1); } flip = !flip; }
    }
    h.wps = W; h.wi = 0; h.job = a;
  },
  update(dt) {
    // friends join as your business grows (after 1 and 3 cleared driveways)
    const n = GAME.handDone();
    if (this.joinT > 0) { this.joinT -= dt; if (this.joinT <= 0) this.join(this.list.length); }
    else if (this.list.length < CREW_DEFS.length && n >= CREW_DEFS[this.list.length].need) this.joinT = 2.6;
    for (const h of this.list) this._step(h, dt);
  },
  _step(h, dt) {
    const D = h.D;
    if (h.job && (h.wi >= h.wps.length || (h.job.done && !GAME.ended))) h.job = null;
    if (!h.job) { const a = this.pickJob(h); if (a) this.plan(h, a); }
    let mvx = 0, mvz = 0, work = false;
    if (!h.job) { // nothing to do: wait at the crew yard by the kiosk
      const ix = 9.4 - h.i * 1.4, iz = 57.2, dx = ix - h.x, dz = iz - h.z, d = Math.hypot(dx, dz);
      if (d > 0.3) { const sp = h.D.spd * 1.2; mvx = dx / d * sp; mvz = dz / d * sp; }
      else h.h = dampAng(h.h, 0, 4, dt);
    }
    if (h.job && h.wi < h.wps.length) {
      const wp = h.wps[h.wi], dx = wp[0] - h.x, dz = wp[1] - h.z, d = Math.hypot(dx, dz);
      if (d < 0.22) h.wi++;
      else { const sp = D.spd * (wp[2] ? 0.85 : 1.25); mvx = dx / d * sp; mvz = dz / d * sp; work = wp[2] || (h.wi > 0 && h.wps[h.wi - 1][2]); }
    }
    // stay out of the way of your truck
    if (PL.kind === 'truck') {
      const dx = h.x - PL.x, dz = h.z - PL.z, d = Math.hypot(dx, dz), R = PL.geo.halfW + 2.6;
      if (d < R) { const k = (R - d) / R * 4; mvx += dx / (d || 1) * k; mvz += dz / (d || 1) * k; }
    }
    const nx = h.x + mvx * dt, nz = h.z + mvz * dt;
    if (SNOW.walk(nx, nz) || !SNOW.walk(h.x, h.z)) { h.x = nx; h.z = nz; }
    const v = Math.hypot(mvx, mvz); h.moving = damp(h.moving, clamp(v / D.spd, 0, 1), 10, dt);
    if (v > 0.2) h.h = dampAng(h.h, Math.atan2(mvx, mvz), 9, dt);
    // clear snow in front of the tool
    const fx = Math.sin(h.h), fz = Math.cos(h.h), off = D.tool === 'shovel' ? 0.62 : 1.5;
    const cx = h.x + fx * off, cz = h.z + fz * off;
    if (work && v > 0.2) {
      const steps = h.lcx === undefined ? 1 : Math.min(5, Math.ceil(Math.hypot(cx - h.lcx, cz - h.lcz) / 0.15));
      for (let s = 1; s <= steps; s++) {
        const px = h.lcx === undefined ? cx : lerp(h.lcx, cx, s / steps), pz = h.lcz === undefined ? cz : lerp(h.lcz, cz, s / steps);
        const r = SNOW.carve(px, pz, fx, fz, D.w * 0.5 + 0.05, D.tool === 'shovel' ? 0.16 : 0.2, 1e6, h.co);
        if (r > 0) { h.load += r; h.scoop += r; }
      }
    }
    h.lcx = cx; h.lcz = cz;
    if (h.scoop > 0.7 && D.tool === 'shovel' && h.toss <= 0) {
      h.scoop = 0; h.toss = 1;
      const rx = fz, rz = -fx, b = h.tool.blade.getWorldPosition(this._v);
      FX.clump(b.x, b.y + 0.3, b.z, h.x + rx * 1.4 + rnd(-0.2, 0.2), 0.35, h.z + rz * 1.4 + rnd(-0.2, 0.2), 0.16, 0.32, (x, y, z) => FX.puff(x, y, z, 3, 0.4));
    }
    if (D.tool === 'blower' && work && v > 0.2 && Math.random() < 0.6) { const rx = fz, rz = -fx; FX.spray(cx, 0.6, cz, rx * 1.2 + fx * 0.2, rz * 1.2 + fz * 0.2, 2, 3.2, 0.16); }
    h.toss = Math.max(0, h.toss - dt / 0.3);
    // their coins are yours
    if (h.load >= 7) this._pay(h);
    // visuals
    h.P.root.position.set(h.x, 0, h.z); h.P.root.rotation.y = h.h;
    if (D.tool === 'shovel') poseShovel(h.tool, D.w, h.toss > 0 ? 1 - h.toss : 0);
    if (h.cheer > 0) h.cheer -= dt;
    animPerson(h.P, dt, { walk: h.moving, pose: h.cheer > 0 ? 'cheer' : !h.job ? 'wave' : D.tool === 'shovel' ? 'shovel' : 'push', t: performance.now() / 1000, toss: h.toss > 0 ? 1 - h.toss : 0, lean: 0.1 * h.moving, hop: h.cheer > 0 ? Math.abs(Math.sin(h.cheer * 9)) * 0.15 : 0 });
  },
  _pay(h) {
    const pay = GAME.stats(GAME.best('hand')).pay * STORM.mult, val = h.load * pay; h.load = 0;
    GAME.earn(val);
    FX.coinBurst(h.x, 1.1, h.z, clamp(Math.round(2 + Math.log2(val + 1)), 3, 8), val, { up: 0.7, spread: 0.5 });
    UI.floatText(this._v.set(h.x, 1.9, h.z), '+' + fmt(val), '#ffe9a8', 22);
  }
};
