// ---------- townsfolk: kids, shoppers, skaters... simple people that walk paths, cheer, wave and talk ----------
const NPC_COLS = {
  jacket: [0xe5483c, 0x2f7fd6, 0x2fa06a, 0xffb020, 0x9a5bd6, 0xff6fa8, 0x18a8b8, 0xf07b2c, 0x3a4a8a, 0xd8342c],
  hat: [0xffc53a, 0x3ccf7a, 0xff6fa8, 0x5bc8f5, 0xffffff, 0xe5483c, 0x9a5bd6, 0xff8a1e],
  scarf: [0x22b3a4, 0xffd34d, 0xe8576b, 0x5bc8f5, 0xffffff, 0x2fa06a, 0xff8a1e],
  pants: [0x2f3c5c, 0x3a3f47, 0x5a3a28, 0x2a4a6a, 0x46305a],
  skin: [0xf6c7a2, 0xe9b08a, 0xc68a62, 0x9c6644, 0xf3d6bd],
  pack: [0xe5483c, 0x2f7fd6, 0xffc23d, 0x2fb36a, 0x9a5bd6, 0xff8a1e],
};
// a person built from a few merged, vertex-coloured meshes (one per moving part) so crowds stay cheap to draw
const PERSON_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72 });
function makePersonLite(o) {
  const P = makePerson(o);
  const col = new THREE.Color();
  const bake = (grp, cast) => {
    // merge every mesh directly inside this group (keeping child groups as they are)
    const geos = [], kill = [];
    grp.updateMatrix();
    for (const c of grp.children) {
      if (!c.isMesh) continue;
      c.updateMatrix();
      const g = bakeGeom(c.geometry, c.matrix); const n = g.attributes.position.count, ca = new Float32Array(n * 3);
      col.copy(c.material.color); for (let i = 0; i < n; i++) { ca[i * 3] = col.r; ca[i * 3 + 1] = col.g; ca[i * 3 + 2] = col.b; }
      g.setAttribute('color', new THREE.BufferAttribute(ca, 3)); geos.push(g); kill.push(c);
    }
    if (!geos.length) return;
    for (const c of kill) grp.remove(c);
    const m = new THREE.Mesh(mergeGeoms(geos), PERSON_MAT); m.castShadow = !!cast; grp.add(m);
  };
  for (const g of [P.legL, P.legR, P.armL, P.armR]) bake(g, false);
  bake(P.head, true); bake(P.body, true);
  if (P.pom) bake(P.pom, false);
  if (P.tail) bake(P.tail, false);
  return P;
}
const NPC = {
  list: [], _v: new V3(), _up: new V3(0, 0.5, 0),
  look(kind, r) {
    r = r || Math.random; const p = a => a[(r() * a.length) | 0];
    const j = p(NPC_COLS.jacket), o = { jacket: j, band: new THREE.Color(j).multiplyScalar(0.8).getHex(), hat: p(NPC_COLS.hat), scarf: p(NPC_COLS.scarf), pants: p(NPC_COLS.pants), skin: p(NPC_COLS.skin), mitt: p(NPC_COLS.hat), pom: 0xffffff };
    o.brim = new THREE.Color(o.hat).multiplyScalar(0.85).getHex();
    if (kind === 'adult') { o.scale = 1.28 + r() * 0.16; if (r() < 0.35) o.beard = p([0x7a4a2a, 0x2a1c12, 0xcfcfcf]); if (r() < 0.3) { o.hatOn = false; o.hair = p([0x3a2418, 0x7a4a2a, 0xe0b060, 0x1c1c1c, 0xdedede]); } }
    else o.scale = 0.86 + r() * 0.16;
    return o;
  },
  // o: { x, z, h, look, kind: 'kid'|'adult', pack: true, pose, quiet }
  spawn(o) {
    const L = o.look || this.look(o.kind || 'kid');
    if (o.pack !== false && (o.kind || 'kid') === 'kid') L._pack = o.packCol || NPC_COLS.pack[(Math.random() * NPC_COLS.pack.length) | 0];
    const P = makePersonLite(L);
    WORLD.scene.add(P.root);
    const n = { P, x: o.x, z: o.z, h: o.h || 0, sc: L.scale || 1, k: o.pop === false ? 1 : 0.001, t: 0, state: 'live', path: null, spd: 2, cb: null, pose: o.pose || 'idle', hop: 0, bub: null, bubT: 0, moving: 0, skate: !!o.skate, tag: o.tag || null, y: o.y || 0 };
    P.root.position.set(n.x, n.y, n.z); P.root.rotation.y = n.h; P.root.scale.setScalar(n.sc * n.k);
    this.list.push(n);
    return n;
  },
  go(n, pts, spd, cb) { n.path = pts.map(p => [p[0], p[1]]); n.spd = spd || 2.2; n.cb = cb || null; return n; },
  say(n, text, dur) { if (!n.bub) n.bub = UI.bubble(text); else { n.bub.textContent = text; n.bub._w = 0; } n.bubT = dur || 3; },
  kill(n, puff) { if (n.state === 'out') return; n.state = 'out'; n.t = 0; if (puff) FX.puff(n.x, 0.6, n.z, 6, 0.8); },
  cheer(n, dur) { n.cheerT = dur || 2; },
  update(dt) {
    const now = performance.now() / 1000;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const n = this.list[i]; n.t += dt;
      // pop in / shrink out
      if (n.state === 'out') { n.k = Math.max(0, n.k - dt / 0.3); if (n.k <= 0) { WORLD.scene.remove(n.P.root); if (n.bub) n.bub.remove(); this.list.splice(i, 1); continue; } }
      else if (n.k < 1) n.k = Math.min(1, n.k + dt / 0.35);
      // walk the path
      let mv = 0;
      if (n.path && n.path.length) {
        const p = n.path[0], dx = p[0] - n.x, dz = p[1] - n.z, d = Math.hypot(dx, dz);
        if (d < 0.15) { n.path.shift(); if (!n.path.length) { n.path = null; const cb = n.cb; n.cb = null; if (cb) cb(n); } }
        else { const st = Math.min(d, n.spd * dt); n.x += dx / d * st; n.z += dz / d * st; mv = 1; n.h = dampAng(n.h, Math.atan2(dx, dz), n.skate ? 4 : 10, dt); }
      }
      n.moving = damp(n.moving, mv, 8, dt);
      if (n.cheerT > 0) n.cheerT -= dt;
      const pose = n.cheerT > 0 ? 'cheer' : n.moving > 0.3 && !n.skate ? 'walk' : n.pose;
      const st = { walk: n.skate ? n.moving * 0.35 : n.moving, pose: pose === 'shiver' || pose === 'walk' ? 'idle' : pose === 'skate' ? 'idle' : pose, t: now + i, hop: n.cheerT > 0 ? Math.abs(Math.sin(n.t * 9)) * 0.12 : 0, lean: n.skate ? 0.25 * n.moving : 0 };
      animPerson(n.P, dt, st);
      if (pose === 'shiver') { n.P.body.position.x = Math.sin(now * 40 + i) * 0.012; n.P.armL.rotation.z = 0.55; n.P.armR.rotation.z = -0.55; n.P.armL.rotation.x = n.P.armR.rotation.x = -0.9; }
      else n.P.body.position.x = 0;
      if (n.skate) { const sw = Math.sin(n.t * 3.2 + i); n.P.body.rotation.z = sw * 0.12 * n.moving; n.P.armL.rotation.z = -0.6 - sw * 0.3; n.P.armR.rotation.z = 0.6 - sw * 0.3; }
      n.P.root.position.set(n.x, n.y, n.z); n.P.root.rotation.y = n.h; n.P.root.scale.setScalar(n.sc * (n.k < 1 && n.state !== 'out' ? easeOutBack(n.k) : n.k));
      if (n.bub) {
        n.bubT -= dt;
        UI.placeBubble(n.bub, n.P.head.getWorldPosition(this._v).add(this._up), n.bubT > 0 && n.k > 0.6);
        if (n.bubT < -0.5) { n.bub.remove(); n.bub = null; }
      }
    }
  },
  byTag(tag) { return this.list.filter(n => n.tag === tag && n.state !== 'out'); },
};
