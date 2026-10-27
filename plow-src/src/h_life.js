// ---------- town life: residents, cars, finale ----------
const LOOKS = {
  rose: { jacket: 0x8e5bb5, band: 0x744597, hat: 0xd8d2e8, brim: 0xbdb5d6, pom: 0xffffff, scarf: 0xe8576b, hair: 0xdedede, hatOn: false, scale: 1.25, skin: 0xf3cfb3 },
  miller: { jacket: 0x2f7fd6, band: 0x2466ad, hat: 0x26364d, brim: 0x1f2d40, scarf: 0xf2b134, beard: 0x7a4a2a, scale: 1.4 },
  hale: { jacket: 0x55606e, band: 0x434c57, hat: 0x7a2e2e, brim: 0x5e2222, scarf: 0xd9c9a3, beard: 0xcfcfcf, scale: 1.4 },
  park: { jacket: 0x2fa06a, band: 0x24835a, hat: 0xf4f4f4, brim: 0xdfe6ea, scarf: 0xff7a59, scale: 1.32 },
  lina: { jacket: 0xff8fb3, band: 0xe67399, hat: 0x5bc8f5, brim: 0x3aa9d6, scarf: 0xffe066, scale: 1.3 },
  ortega: { jacket: 0xf07b2c, band: 0xcf6620, hat: 0x2a2a2a, brim: 0x1e1e1e, scarf: 0x3b5bdb, beard: 0x2a1c12, scale: 1.42 },
  tom: { jacket: 0x6b4e3d, band: 0x573f31, hat: 0x3d5a40, brim: 0x2f4632, scarf: 0xb03a2e, beard: 0xe8e8e8, scale: 1.35 },
  baker: { jacket: 0xf8f8f8, band: 0xe8e8e8, hat: 0xffffff, brim: 0xf0f0f0, scarf: 0xd94b4b, scale: 1.38 },
};
const LIFE = {
  people: [], movers: [], fw: 0, fwT: 0, treeT: 0, traffic: false, trafT: 3,
  resident(lot, line) {
    const look = LOOKS[lot.key] || {};
    const P = makePerson(look); WORLD.scene.add(P.root);
    const d = lot.house.door; P.root.position.set(d.x - lot.side * 0.6, 0, d.z + 0.6);
    P.root.rotation.y = lot.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    P.root.scale.setScalar(0.001);
    this.people.push({ P, t: 0, life: 6.5, sc: look.scale || 1.3, line, bub: UI.bubble(line), mode: 'wave' });
  },
  baker() {
    const P = makePerson(LOOKS.baker); WORLD.scene.add(P.root);
    const d = WORLD.bakery.door; P.root.position.set(d.x + 1.2, 0, d.z + 0.5); P.root.rotation.y = 0; P.root.scale.setScalar(0.001);
    this.people.push({ P, t: 0, life: 7, sc: 1.38, line: 'Fresh bread for everyone!', bub: UI.bubble('Fresh bread for everyone!'), mode: 'wave' });
    WORLD.bakery.smoke = new V3(1.0, 6.2, -65.2);
  },
  freeCar(car, silent) {
    car.state = 'free';
    // the street is already open: this car drives off too (and its spot opens up, the same way on every load)
    if (this.traffic) this.streetOpen(true);
    if (silent) { car.cap.visible = false; return; }
    car.capT = 0.001; AUD.horn();
    FX.puff(car.x, 1.2, car.z, 20, 1.8); FX.sparkle(car.x, 1.2, car.z, 14, 1.4);
  },
  streetOpen(silent) {
    this.traffic = true;
    for (const c of WORLD.cars) {
      if (c.state !== 'free') continue;
      c.state = 'leave'; c.wait = silent ? 0 : rnd(0.5, 3.5);
      const L = c.lot, lane = L.side < 0 ? -1.75 : 1.75;
      // drive out to the lane, then north (west lane goes north, east lane goes south then loops)
      const dir = L.side < 0 ? -1 : 1;
      c.path = [[L.side * 6.5, L.c + 7], [lane, L.c + 7 + dir * -2.0], [lane, dir < 0 ? -48 : 48], [lane * 0.2, dir < 0 ? -56 : 56]];
      c.pi = 0; c.spd = 0;
      // unblock its cells
      SNOW.paint(c.fx0, c.fz0, c.fx1, c.fz1, (k) => { if (SNOW.T[k] === 2) { SNOW.T[k] = 1; SNOW.H[k] = 0; } });
    }
    if (!silent) UI.toast('The street is open! Cars are back on the road.');
  },
  fwX: 12, fwZ: -10,
  fireworks(x, z, dur) { this.fw = dur || 7; this.fwT = 0; this.fwX = x; this.fwZ = z; },
  update(dt) {
    for (let i = this.people.length - 1; i >= 0; i--) {
      const o = this.people[i]; o.t += dt;
      const k = o.t < 0.45 ? easeOutBack(o.t / 0.45) : o.t > o.life - 0.4 ? Math.max(0.001, (o.life - o.t) / 0.4) : 1;
      o.P.root.scale.setScalar(o.sc * k);
      animPerson(o.P, dt, { walk: 0, pose: o.t > 0.5 && o.t < o.life - 1 ? 'wave' : 'idle', t: o.t, hop: o.t < 2 ? Math.abs(Math.sin(o.t * 7)) * 0.06 : 0 });
      if (o.bub) UI.placeBubble(o.bub, o.P.head.getWorldPosition(this._v).add(this._up), o.t > 0.4 && o.t < o.life - 0.6);
      if (o.t >= o.life) { WORLD.scene.remove(o.P.root); if (o.bub) o.bub.remove(); this.people.splice(i, 1); }
    }
    // car snow caps
    for (const c of WORLD.cars) {
      if (c.capT > 0) {
        c.capT += dt; const k = clamp(1 - c.capT / 0.6, 0, 1);
        for (const p of c.cap.userData.parts) p.scale.y = Math.max(0.001, p.userData.sy0 === undefined ? (p.userData.sy0 = p.scale.y) * k : p.userData.sy0 * k);
        if (Math.random() < 0.5) FX.puff(c.x + rnd(-1, 1), 0.8, c.z + rnd(-1.5, 1.5), 1, 1);
        if (k <= 0) { c.cap.visible = false; c.capT = 0; }
      }
      if (c.state === 'leave') this._drive(c, dt);
    }
    // ambient traffic after street open
    if (this.traffic) {
      this.trafT -= dt;
      if (this.trafT <= 0) { this.trafT = rnd(7, 13); this._spawnTraffic(); }
      for (let i = this.movers.length - 1; i >= 0; i--) {
        const m = this.movers[i]; m.t += dt;
        // keep a gap to the car in front (cars queue up behind a plow instead of driving into each other)
        const o = m.obj, fx = Math.sin(o.rotation.y), fz = Math.cos(o.rotation.y);
        m.carAhead = this.movers.some(q => { if (q === m) return false; const rx = q.obj.position.x - o.position.x, rz = q.obj.position.z - o.position.z, a = rx * fx + rz * fz; return a > 0 && a < 7.5 && Math.abs(rx * fz - rz * fx) < 1.6; });
        this._drive(m, dt); if (m.state === 'gone') { WORLD.scene.remove(m.obj); this.movers.splice(i, 1); }
      }
    }
    // tree lights + fireworks
    if (WORLD.tree && WORLD.tree.lit > 0 && WORLD.tree.lit < 1) { WORLD.tree.lit = Math.min(1, WORLD.tree.lit + dt * 0.5); }
    if (WORLD.tree && WORLD.tree.mats.length) for (const m of WORLD.tree.mats) { m.emissive.copy(m.userData.lit.e); m.emissiveIntensity = (m.userData.lit.i || 1) * 2.2 * WORLD.tree.lit * (0.85 + 0.15 * Math.sin(performance.now() / 300 + m.id)); }
    if (this.fw > 0) {
      this.fw -= dt; this.fwT -= dt;
      if (this.fwT <= 0) {
        this.fwT = rnd(0.35, 0.8);
        const cols = [[1, 0.4, 0.4], [1, 0.85, 0.3], [0.4, 1, 0.6], [0.5, 0.7, 1], [1, 0.5, 1]];
        FX.firework(this.fwX + rnd(-6, 6), rnd(11, 16), this.fwZ + rnd(-8, 8), cols[(Math.random() * 5) | 0]); AUD.firework();
      }
    }
  },
  _v: new V3(), _up: new V3(0, 0.55, 0),
  _spawnTraffic() {
    // a few cars at a time; none while the last one is still waiting at the end of the street
    if (this.movers.length >= 4 || this.movers.some(m => m.pi === 0 && m.spd < 0.5 && m.t > 2)) return;
    const keys = ['car_blue', 'car_white', 'camper', 'icecream'];
    const k = keys[(Math.random() * keys.length) | 0];
    const north = Math.random() < 0.5;
    const lane = north ? -1.75 : 1.75;
    const obj = place(k, lane, north ? 58 : -58, north ? Math.PI : 0, 1, 0); WORLD.scene.add(obj);
    const m = { obj, state: 'leave', wait: 0, t: 0, path: north ? [[lane, 47], [lane, -47], [lane * 0.3, -60]] : [[lane, -47], [lane, 47], [lane * 0.3, 60]], pi: 0, spd: 0, x: obj.position.x, z: obj.position.z, rot: obj.rotation.y };
    this.movers.push(m);
  },
  _drive(c, dt) {
    if (c.wait > 0) { c.wait -= dt; return; }
    const o = c.obj; const p = c.path[c.pi];
    if (!p) { c.state = 'gone'; o.visible = false; return; }
    const dx = p[0] - o.position.x, dz = p[1] - o.position.z, d = Math.hypot(dx, dz);
    // stop for the player
    const px = PL.x, pz = PL.z; const fx = Math.sin(o.rotation.y), fz = Math.cos(o.rotation.y);
    const rx = px - o.position.x, rz = pz - o.position.z, ahead = rx * fx + rz * fz, side = Math.abs(rx * fz - rz * fx);
    const blocked = ahead > 0 && ahead < 6.5 && side < 2.6, stop = blocked || c.carAhead;
    const want = stop ? 0 : Math.min(6, d * 1.5 + 1.5);
    c.spd = damp(c.spd, want, stop ? 6 : 2, dt);
    if (blocked && !c.honked) { c.honked = 1; AUD.horn(); setTimeout(() => c.honked = 0, 3000); }
    const th = Math.atan2(dx, dz);
    o.rotation.y = dampAng(o.rotation.y, th, 3.5, dt);
    o.position.x += Math.sin(o.rotation.y) * c.spd * dt; o.position.z += Math.cos(o.rotation.y) * c.spd * dt;
    if (d < 1.2) c.pi++;
  }
};
