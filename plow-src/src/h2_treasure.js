// ---------- treasures buried under the snow (instant little rewards while clearing) ----------
const TREASURE = {
  list: [], t: 0,
  init(scene) {
    const gold = new THREE.MeshStandardMaterial({ color: 0xffc83a, metalness: 0.75, roughness: 0.3, emissive: 0x9a5a00, emissiveIntensity: 0.55 });
    const parts = [];
    const cg = new THREE.CylinderGeometry(0.13, 0.13, 0.035, 14);
    const offs = [[0, 0.018, 0], [0.16, 0.018, 0.05], [-0.12, 0.018, 0.12], [0.05, 0.053, 0.03], [-0.06, 0.018, -0.13], [0.02, 0.088, 0.0], [0.13, 0.053, -0.08]];
    for (const [x, y, z] of offs) { const g = cg.clone(); g.rotateZ(rnd(-0.15, 0.15)); g.translate(x, y, z); parts.push(g.toNonIndexed()); }
    const pileGeo = mergeGeoms(parts);
    const r = mulberry(4242);
    // candidate cells: paved, inside a job area, away from blocked/yard edges
    const N = SNOW.NX, T = SNOW.T, A = SNOW.A;
    const okAt = (x, z) => { const k = SNOW.idx(x, z); if (k < 0 || T[k] !== 1 || !A[k]) return false; for (const [dx, dz] of [[0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]]) { const k2 = SNOW.idx(x + dx, z + dz); if (k2 < 0 || T[k2] !== 1) return false; } return true; };
    const want = { rose: [3, 0], miller: [2, 1], park: [2, 1], hale: [2, 1], lina: [2, 1], ortega: [2, 1], tom: [2, 1], street1: [10, 3], street2: [10, 3], north: [4, 2], plaza: [5, 2], apron: [2, 0] };
    for (const key in want) {
      const a = WORLD.areaByKey[key]; if (!a) continue;
      const [nc, ng] = want[key];
      let placed = 0, tries = 0;
      while (placed < nc + ng && tries++ < 400) {
        const R = a.rects[(r() * a.rects.length) | 0];
        const x = lerp(R.x0 + 0.4, R.x1 - 0.4, r()), z = lerp(R.z0 + 0.4, R.z1 - 0.4, r());
        if (!okAt(x, z)) continue;
        if (this.list.some(o => Math.hypot(o.x - x, o.z - z) < 2.2)) continue;
        if (Math.hypot(x - PL.x, z - PL.z) < 1.2) continue;
        const gift = placed >= nc;
        let mesh;
        if (gift) { mesh = place('gift', x, z, r() * TAU, 0.62, 0.0); mesh.traverse(c => { if (c.isMesh) { c.castShadow = false; } }); }
        else { mesh = new THREE.Mesh(pileGeo, gold); mesh.position.set(x, 0.005, z); mesh.rotation.y = r() * TAU; }
        scene.add(mesh);
        this.list.push({ x, z, gift, mesh, found: false, t: 0, area: key });
        placed++;
      }
    }
  },
  _v: new V3(),
  update(dt) {
    this.t += dt;
    for (const o of this.list) {
      if (o.gone) continue;
      if (!o.found) {
        if (SNOW.depth(o.x, o.z) < 0.07) { o.found = true; o.t = 0; this._collect(o); }
        else if (o.gift && Math.random() < dt * 0.35) FX.sparkle(o.x, SNOW.surf(o.x, o.z) + 0.05, o.z, 2, 0.25, [1, 0.85, 0.4]);
        continue;
      }
      o.t += dt;
      const k = clamp(o.t / 0.5, 0, 1);
      o.mesh.position.y = Math.sin(k * Math.PI) * (o.gift ? 1.1 : 0.7);
      o.mesh.rotation.y += dt * 12;
      o.mesh.scale.setScalar((o.gift ? 0.62 : 1) * (1 + 0.4 * Math.sin(k * Math.PI)) * (k > 0.85 ? (1 - k) / 0.15 : 1));
      if (k >= 1) { o.gone = true; o.mesh.visible = false; WORLD.scene.remove(o.mesh); }
    }
  },
  _collect(o) {
    const pay = GAME.price();
    const val = Math.round((o.gift ? 40 : 6) * pay);
    GAME.earn(val);
    FX.coinBurst(o.x, 0.6, o.z, o.gift ? 12 : 5, val, { up: 0.8, spread: 0.6 });
    FX.sparkle(o.x, 0.4, o.z, o.gift ? 22 : 10, 0.5);
    if (o.gift) FX.confetti(o.x, 0.8, o.z, 24);
    UI.floatText(this._v.set(o.x, 1.4, o.z), (o.gift ? 'GIFT! +' : '+') + fmt(val), o.gift ? '#ff9de0' : '#ffd34d', o.gift ? 32 : 26);
    AUD.treasure(o.gift);
  }
};
