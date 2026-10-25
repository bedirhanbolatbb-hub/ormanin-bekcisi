// ---------- your snow crew: friends join and clear the next driveways for you (you earn their coins) ----------
const CREW_DEFS = [
  { name: 'Max', tool: 'shovel', w: 0.78, spd: 2.8, need: 1, sub: 'Free help with driveways!', look: { jacket: 0x2f7fd6, band: 0x2466ad, hat: 0x3ccf7a, brim: 0x2aa862, scarf: 0xffd34d, mitt: 0xff8a1e } },
  { name: 'Lily', tool: 'blower', w: 1.25, spd: 3.0, need: 3, sub: 'Your crew is growing!', look: { jacket: 0x9a5bd6, band: 0x7d45b5, hat: 0xff6fa8, brim: 0xe0558c, scarf: 0x5bc8f5, mitt: 0xffffff } },
  { name: 'Sam', tool: 'blower', w: 1.4, spd: 3.3, need: 99, sub: 'The fastest kid on Pine Street!', look: { jacket: 0xff8a1e, band: 0xd8701a, hat: 0x2f7fd6, brim: 0x2466ad, scarf: 0xffffff, mitt: 0x2fa06a } },
  { name: 'Zoe', tool: 'blower', w: 1.5, spd: 3.3, need: 99, sub: 'Zoe brought her mega blower!', look: { jacket: 0x18a8b8, band: 0x12808c, hat: 0xffc53a, brim: 0xf39a2c, scarf: 0xe8576b, mitt: 0xffc53a } },
  { name: 'Leo', tool: 'blower', w: 1.6, spd: 3.4, need: 99, sub: 'Leo joins the crew!', look: { jacket: 0x3a4a8a, band: 0x2c3a70, hat: 0xe5483c, brim: 0xc23a30, scarf: 0xffd34d, mitt: 0xe5483c } },
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
    // walk in from next to you (or from the crew yard when you drive a machine)
    const Y = CH.crewYard || [0, 0], sx = PL.kind === 'truck' ? Y[0] - i * 1.4 : PL.x, sz = PL.kind === 'truck' ? Y[1] : PL.z;
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
    if (h.noJobT > 0) return null;
    const taken = new Set(this.list.filter(o => o !== h && o.job).map(o => o.job.key));
    const cur = GOALS[GAME.goalIdx()].a;
    const keys = (CH.crewJobs || HAND_AREAS).filter(k => WORLD.areaByKey[k]);
    const mid = a => { const r = a.lot ? a.lot.drive : a.rects[0]; return [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, Math.max(r.x1 - r.x0, r.z1 - r.z0)]; };
    let cands = keys.map(k => WORLD.areaByKey[k]).filter(a => !a.done && !taken.has(a.key));
    if (GAME.ended) cands = keys.map(k => WORLD.areaByKey[k]).filter(a => { if (taken.has(a.key)) return false; const m = mid(a); return SNOW.nearestSnow(m[0], m[1], a.id, 0.08, m[2] * 0.6 + 2); });
    // nearest first (but not the job you are doing yourself)
    cands.sort((p, q) => { const a = mid(p), b = mid(q); return Math.hypot(a[0] - h.x, a[1] - h.z) - Math.hypot(b[0] - h.x, b[1] - h.z); });
    let a = cands.find(o => o.key !== cur) || cands[0] || null;
    if (!a) for (const k of (CH.crewExtra || [])) { const ap = WORLD.areaByKey[k]; if (ap && !ap.done && !taken.has(k)) { a = ap; break; } }
    return a;
  },
  // route: out to the sidewalk, along it, into the driveway, then back-and-forth lanes over the driveway and the path
  plan(h, a) {
    const W = [], lane = Math.max(0.45, h.D.w * 0.85);
    const go = (x, z, work) => W.push([x, z, !!work]);
    // walk there on cleared/paved ground (finds the way around yards and buildings)
    const walkTo = (x, z) => { const p = PATH.find(h.x, h.z, x, z); if (p) for (const q of p) go(q[0], q[1]); else go(x, z); };
    if (a.lot) {
      const L = a.lot, s = L.side, dz = (L.drive.z0 + L.drive.z1) / 2;
      walkTo(s * 4.6, dz);
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
      // long back-and-forth passes along the longer side of each strip
      let first = true;
      for (const r of a.rects) {
        const alongZ = (r.z1 - r.z0) >= (r.x1 - r.x0), m = 0.4;
        const lo = (alongZ ? r.x0 : r.z0) + m, hi = (alongZ ? r.x1 : r.z1) - m, n = Math.max(1, Math.ceil((hi - lo) / lane) + 1);
        let flip = false;
        for (let q = 0; q < n; q++) {
          const c = n > 1 ? lo + (hi - lo) * q / (n - 1) : (lo + hi) / 2;
          let A = alongZ ? [c, r.z0 + m] : [r.x0 + m, c], B = alongZ ? [c, r.z1 - m] : [r.x1 - m, c];
          if (first) { const dA = Math.hypot(A[0] - h.x, A[1] - h.z), dB = Math.hypot(B[0] - h.x, B[1] - h.z); if (dB < dA) flip = true; walkTo(...(flip ? B : A)); first = false; }
          if (flip) { go(B[0], B[1], q > 0); go(A[0], A[1], 1); } else { go(A[0], A[1], q > 0); go(B[0], B[1], 1); }
          flip = !flip;
        }
      }
    }
    h.wps = W; h.wi = 0; h.job = a;
    if (!W.length) h.noJobT = 3;
  },
  // a new friend joins (chapter story beats); returns false when everyone is already on the crew
  recruit(delay) { if (this.list.length >= CREW_DEFS.length || this.joinT > 0) return false; this.joinT = delay || 1.5; return true; },
  update(dt) {
    // friends join as your business grows (after 1 and 3 cleared driveways)
    const n = GAME.handDone();
    if (this.joinT > 0) { this.joinT -= dt; if (this.joinT <= 0) this.join(this.list.length); }
    else if (CH.id === 1 && this.list.length < 2 && n >= CREW_DEFS[this.list.length].need) this.joinT = 2.6;
    for (const h of this.list) this._step(h, dt);
  },
  _step(h, dt) {
    const D = h.D;
    if (h.noJobT > 0) h.noJobT -= dt;
    if (h.job && (h.wi >= h.wps.length || (h.job.done && !GAME.ended))) h.job = null;
    if (!h.job) { const a = this.pickJob(h); if (a) this.plan(h, a); }
    let mvx = 0, mvz = 0, work = false;
    if (!h.job) { // nothing to do: wait at the crew yard by the kiosk
      const Y = CH.crewYard || [0, 0], ix = Y[0] - h.i * 1.4, iz = Y[1], dx = ix - h.x, dz = iz - h.z, d = Math.hypot(dx, dz);
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
    const pay = GAME.stats(GAME.best('hand') || 'shovel').pay * STORM.mult * (CH.payMul || 1), val = h.load * pay; h.load = 0;
    GAME.earn(val);
    FX.coinBurst(h.x, 1.1, h.z, clamp(Math.round(2 + Math.log2(val + 1)), 3, 8), val, { up: 0.7, spread: 0.5 });
    UI.floatText(this._v.set(h.x, 1.9, h.z), '+' + fmt(val), '#ffe9a8', 22);
  }
};
