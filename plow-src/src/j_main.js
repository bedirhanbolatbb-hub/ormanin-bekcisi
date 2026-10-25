// ---------- input ----------
const INPUT = {
  keys: {}, joy: { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0, show: false },
  init(el) {
    addEventListener('keydown', e => { this.keys[e.code] = 1; AUD.init(); GAME.started = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); });
    addEventListener('keyup', e => { this.keys[e.code] = 0; });
    addEventListener('blur', () => { this.keys = {}; this.joy.active = false; });
    const J = this.joy, R = 52;
    el.addEventListener('pointerdown', e => {
      AUD.init(); GAME.started = true;
      if (J.active) return;
      J.active = true; J.id = e.pointerId; J.ox = e.clientX; J.oy = e.clientY; J.dx = 0; J.dy = 0; J.show = e.pointerType !== 'mouse' || true;
      try { el.setPointerCapture(e.pointerId); } catch (_) { }
    });
    el.addEventListener('pointermove', e => {
      if (!J.active || e.pointerId !== J.id) return;
      let dx = (e.clientX - J.ox) / R, dy = (e.clientY - J.oy) / R; const l = Math.hypot(dx, dy);
      if (l > 1) { J.ox += (dx / l) * (l - 1) * R; J.oy += (dy / l) * (l - 1) * R; dx /= l; dy /= l; }
      J.dx = dx; J.dy = dy;
    });
    const up = e => { if (e.pointerId === J.id) { J.active = false; J.dx = J.dy = 0; } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  },
  get() {
    const k = this.keys;
    let x = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    let y = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    if (x || y) { const l = Math.hypot(x, y); return { x: x / l, y: y / l }; }
    const J = this.joy;
    if (J.active) { const l = Math.hypot(J.dx, J.dy); const m = l < 0.18 ? 0 : Math.min(1, (l - 0.18) / 0.62 + 0.25); return l > 0 ? { x: J.dx / l * m, y: -J.dy / l * m } : { x: 0, y: 0 }; }
    return { x: 0, y: 0 };
  }
};

// ---------- camera ----------
const CAM = {
  cam: null, x: 0, z: 50, d: 13, shake: 0, intro: 0, lx: 0, lz: 0,
  init() { this.cam = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.3, 260); },
  update(dt, snap) {
    const t = PL.kind, asp = innerWidth / innerHeight, gk = t === 'truck' ? PL.geo.cam : 1;
    const port = asp < 0.9;
    const base = port ? (t === 'truck' ? 15 : t === 'blower' ? 11.5 : 10.5) : (t === 'truck' ? 18 : t === 'blower' ? 13 : 11.8);
    const wantW = port ? (t === 'truck' ? 13 : t === 'blower' ? 9.5 : 8.2) : (t === 'truck' ? 20 : t === 'blower' ? 13 : 11.5);
    const hf = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(this.cam.fov) / 2) * asp);
    const d = Math.max(base * gk, (wantW * gk / 2) / Math.tan(hf / 2) * 0.82);
    this.d = snap ? d : damp(this.d, d, 2.2, dt);
    const fx = Math.sin(PL.h), fz = Math.cos(PL.h);
    const ahead = t === 'truck' ? 1.0 + Math.max(0, PL.spd) * 0.15 : 0.45 + PL.moveAmt * 0.8;
    const tx = PL.x + fx * ahead, tz = PL.z + fz * ahead - (t === 'truck' ? 0.6 : 0.5);
    this.x = snap ? tx : damp(this.x, tx, 4.5, dt); this.z = snap ? tz : damp(this.z, tz, 4.5, dt);
    // bigger machines -> camera climbs higher (you can feel yourself growing, and the blade in front stays in view)
    const pitch = 0.74 + (gk - 1) * 0.55;
    let px = this.x, py = Math.sin(pitch) * this.d, pz = this.z + Math.cos(pitch) * this.d;
    let lx = this.x, ly = 0.5, lz = this.z;
    if (this.intro > 0) {
      const k = smooth(clamp(this.intro, 0, 1));
      px = lerp(px, 0, k); py = lerp(py, 34, k); pz = lerp(pz, 82, k); lz = lerp(lz, 10, k);
      this.intro -= dt / 2.6;
    }
    if (this.shake > 0) { this.shake = Math.max(0, this.shake - dt); const s = this.shake * 0.5; px += rnd(-s, s); py += rnd(-s, s) * 0.5; }
    if (QS.has('cam')) { const c = QS.get('cam').split(',').map(Number); px = c[0]; py = c[1]; pz = c[2]; lx = c[3]; ly = c[4]; lz = c[5]; }
    this.cam.position.set(px, py, pz); this.cam.lookAt(lx, ly, lz); this.cam.updateMatrixWorld();
  }
};

// ---------- guide arrow & melter beacons ----------
const GUIDE = {
  init(scene) {
    const sh = new THREE.Shape(); sh.moveTo(0, 0.55); sh.lineTo(0.42, 0.05); sh.lineTo(0.17, 0.05); sh.lineTo(0.17, -0.5); sh.lineTo(-0.17, -0.5); sh.lineTo(-0.17, 0.05); sh.lineTo(-0.42, 0.05); sh.closePath();
    const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2);
    this.arrow = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffc21a, transparent: true, opacity: 0.95, depthTest: false, fog: false, toneMapped: false }));
    this.arrow.renderOrder = 9; scene.add(this.arrow); this.arrow.visible = false;
    const bg = new THREE.CylinderGeometry(0.9, 1.3, 14, 18, 1, true); bg.translate(0, 7, 0);
    const bc = document.createElement('canvas'); bc.width = 4; bc.height = 128; const x = bc.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.9)'); x.fillStyle = gr; x.fillRect(0, 0, 4, 128);
    const bt = new THREE.CanvasTexture(bc);
    this.beam = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ map: bt, color: 0xffa21a, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false }));
    scene.add(this.beam); this.t = 0;
  },
  update(dt) {
    this.t += dt;
    let tx = null, tz = null, beam = null;
    if (!GAME.ended) {
      const a = SNOW.areas[SNOW.hlArea];
      if (a) {
        this._rt = (this._rt || 0) - dt;
        if (this._rt <= 0 || !this._tgt) { this._rt = 0.5; this._tgt = a && !a.done ? SNOW.nearestSnow(PL.x, PL.z, a.id, 0.05, 140) : null; }
        if (this._tgt && Math.hypot(this._tgt.x - PL.x, this._tgt.z - PL.z) > 7) { tx = this._tgt.x; tz = this._tgt.z; }
      }
    }
    const A = this.arrow;
    if (tx !== null) {
      const ang = Math.atan2(tx - PL.x, tz - PL.z), r = PL.kind === 'truck' ? PL.geo.carve + 1.2 : 1.6 + Math.sin(this.t * 6) * 0.15;
      A.visible = true; A.position.set(PL.x + Math.sin(ang) * r, 0.12, PL.z + Math.cos(ang) * r);
      A.rotation.y = ang + Math.PI; A.scale.setScalar(PL.kind === 'truck' ? 2.2 * PL.geo.cam : 1.1);
      A.material.opacity = 0.75 + 0.25 * Math.sin(this.t * 6);
    } else A.visible = false;
    const B = this.beam;
    if (beam) { B.position.set(beam.zone.x, 0, beam.zone.z); B.material.opacity = damp(B.material.opacity, 0.55 + 0.15 * Math.sin(this.t * 4), 6, dt); }
    else B.material.opacity = damp(B.material.opacity, 0, 6, dt);
    B.visible = B.material.opacity > 0.01;
  }
};

// ---------- world animation ----------
function updateWorld(dt) {
  const t = performance.now() / 1000;
  for (const M of WORLD.melters) {
    M.heat = Math.max(0, M.heat - dt * 0.8);
    M.core.emissiveIntensity = 0.55 + M.heat * 0.9 + Math.sin(t * 9 + M.x) * 0.08;
    M.shake = Math.max(0, M.shake - dt);
    M.g.position.x = M.x + (M.shake > 0 ? rnd(-0.04, 0.04) : 0);
    M.g.scale.y = 1 + M.shake * 0.4;
    M._st = (M._st || 0) - dt; if (M._st <= 0) { M._st = rnd(0.35, 0.7); FX.smoke(M.chimTop.x, M.chimTop.y, M.chimTop.z); if (M.heat > 0.2) FX.steam(M.chimTop.x, M.chimTop.y, M.chimTop.z, 2); }
    const near = Math.hypot(PL.x - M.zone.x, PL.z - M.zone.z) < 12;
    M.ring.material.opacity = (near ? 0.85 : 0.55) * (0.75 + 0.25 * Math.sin(t * 3.5));
    M.ring.rotation.z = t * 0.4;
    M.pool.material.opacity = 0.25 + M.heat * 0.2;
  }
  const lit = (H) => {
    if (H.litT > H.lit) { H.lit = Math.min(H.litT, H.lit + dt * 0.9); applyLit(H, H.lit); }
    if (H.lit > 0.5 && H.smoke) { H._sm = (H._sm || 0) - dt; if (H._sm <= 0) { H._sm = rnd(0.25, 0.45); FX.smoke(H.smoke.x, H.smoke.y + 0.2, H.smoke.z); } }
  };
  for (const H of WORLD.houses) lit(H);
  lit(WORLD.bakery);
}

// ---------- bot (for pacing tests) ----------
const BOT = {
  grid: null, dist: null, W: 0, D: 0, tgtKey: '', rt: 0, log: [], last: {},
  CS: 0.5,
  init() {
    this.W = Math.ceil((WORLD.bounds.x1 - WORLD.bounds.x0) / this.CS); this.D = Math.ceil((WORLD.bounds.z1 - WORLD.bounds.z0) / this.CS);
    this.dist = new Int16Array(this.W * this.D);
  },
  cell(x, z) { return [Math.floor((x - WORLD.bounds.x0) / this.CS), Math.floor((z - WORLD.bounds.z0) / this.CS)]; },
  okCell(i, j, truck) {
    const x = WORLD.bounds.x0 + (i + 0.5) * this.CS, z = WORLD.bounds.z0 + (j + 0.5) * this.CS;
    if (!truck) return PL.kidFree(x, z);
    const r = PL.geo.halfW + 0.1;
    for (const [a, b] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) if (!SNOW.walk(x + a, z + b)) return false;
    return true;
  },
  field(tx, tz, truck) {
    const W = this.W, D = this.D, dist = this.dist; dist.fill(-1);
    const [ti, tj] = this.cell(tx, tz); if (ti < 0 || tj < 0 || ti >= W || tj >= D) return;
    const q = [ti + tj * W]; dist[ti + tj * W] = 0;
    for (let h = 0; h < q.length; h++) {
      const c = q[h], i = c % W, j = (c / W) | 0, dv = dist[c];
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + a, nj = j + b; if (ni < 0 || nj < 0 || ni >= W || nj >= D) continue;
        const nc = ni + nj * W; if (dist[nc] >= 0) continue;
        if (!this.okCell(ni, nj, truck) && !(Math.abs(ni - ti) <= 1 && Math.abs(nj - tj) <= 1)) continue;
        dist[nc] = dv + 1; q.push(nc);
      }
    }
  },
  buy() {
    const nt = GAME.nextTool();
    if (nt && !TIER[nt].gift && UI.shownCoins() >= TIER[nt].cost) { GAME.buyTool(nt); this.mark('tool_' + nt); return; }
    for (const k of TIERS) if (GAME.owned[k.key]) this.mark('tool_' + k.key);
    const t = PL.tool, order = [1, 0, 2];
    let best = -1, bc = 1e18;
    for (const i of order) { const c = GAME.upCost(t, i); if (c < bc) { bc = c; best = i; } }
    if (best >= 0 && UI.shownCoins() >= bc) GAME.buyUp(best);
  },
  lanes(a, w, truck) {
    // each lane: [startWaypoint, endWaypoint, swathStart, swathEnd, heading]
    const pts = [];
    for (const r of a.rects) {
      const wx = r.x1 - r.x0, wz = r.z1 - r.z0;
      if (truck) {
        // long passes; the truck starts behind the strip so its blade (far in front) covers the ends too
        const G = PL.geo, o = Math.max(G.halfW + 0.08, w * 0.5 - 0.15), alongZ = wz >= wx;
        const lo = (alongZ ? r.x0 : r.z0) + o, hi = (alongZ ? r.x1 : r.z1) - o;
        const n = hi <= lo ? 1 : Math.ceil((hi - lo) / (w * 0.85)) + 1;
        let flip = false;
        for (let q = 0; q < n; q++) {
          const c = n > 1 ? lo + (hi - lo) * q / (n - 1) : (lo + hi) / 2;
          let A = alongZ ? [c, r.z0 + 0.3] : [r.x0 + 0.3, c], B = alongZ ? [c, r.z1 - 0.3] : [r.x1 - 0.3, c];
          if (flip) [A, B] = [B, A]; flip = !flip;
          const dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, h = Math.atan2(ux, uz);
          let wa = [A[0] - ux * (G.carve + 0.3), A[1] - uz * (G.carve + 0.3)], moved = 0;
          for (let t = 0; t < 16 && !PL.truckFree(wa[0], wa[1], h); t++) { wa = [wa[0] + ux * 0.5, wa[1] + uz * 0.5]; moved += 0.5; }
          let wb = [B[0] - ux * (G.carve - 0.6), B[1] - uz * (G.carve - 0.6)];
          for (let t = 0; t < 16 && !PL.truckFree(wb[0], wb[1], h); t++) wb = [wb[0] - ux * 0.5, wb[1] - uz * 0.5];
          pts.push([wa, wb, A, B, h]);
          // closed end (a wall behind the start): the blade could not reach the start, so drive this lane back the other way too
          if (moved > 1) { const h2 = h + Math.PI; let wc = [B[0] + ux * (G.carve + 0.3), B[1] + uz * (G.carve + 0.3)]; for (let t = 0; t < 16 && !PL.truckFree(wc[0], wc[1], h2); t++) wc = [wc[0] - ux * 0.5, wc[1] - uz * 0.5];
            let wd = [A[0] + ux * (G.carve - 0.6), A[1] + uz * (G.carve - 0.6)]; for (let t = 0; t < 16 && !PL.truckFree(wd[0], wd[1], h2); t++) wd = [wd[0] + ux * 0.5, wd[1] + uz * 0.5];
            pts.push([wc, wd, B, A, h2]); }
        }
        continue;
      }
      const sp = Math.max(0.5, w * 0.8), m = Math.min(w * 0.45, 0.6);
      const across = wx >= wz ? wz : wx, n = Math.max(1, Math.ceil((across - 2 * m) / sp) + 1), stp = n > 1 ? (across - 2 * m) / (n - 1) : 0;
      let flip = false;
      for (let q = 0; q < n; q++) {
        const o = (n > 1 ? m + q * stp : across / 2);
        const a0 = wx >= wz ? [r.x0 + 0.4, r.z0 + o] : [r.x0 + o, r.z0 + 0.4], a1 = wx >= wz ? [r.x1 - 0.4, r.z0 + o] : [r.x0 + o, r.z1 - 0.4];
        pts.push(flip ? [a1, a0, a1, a0] : [a0, a1, a0, a1]); flip = !flip;
      }
    }
    return pts;
  },
  laneHasSnow(L) { const A = L[2] || L[0], B = L[3] || L[1]; for (let k = 0; k <= 10; k++) { const x = lerp(A[0], B[0], k / 10), z = lerp(A[1], B[1], k / 10); if (SNOW.depth(x, z) > 0.06 && SNOW.type(x, z) === 1) return true; } return false; },
  mark(k) { if (!this.last[k]) { this.last[k] = GAME.time; this.log.push(k + '@' + GAME.time.toFixed(1)); console.log('[BOT]', k, GAME.time.toFixed(1)); } },
  get(dt) {
    this.buy();
    const truck = PL.kind === 'truck';
    let tx, tz, key;
    const st = PL.stats();
    {
      this.rt -= dt;
      this.stuckT = (this.stuckT || 0) + dt;
      if (PL.carveRate > 0.05 || Math.hypot(PL.x - (this.px || 0), PL.z - (this.pz || 0)) > 0.8) { this.stuckT = 0; this.px = PL.x; this.pz = PL.z; }
      if (this.stuckT > 2.5) { this.stuckT = 0; this.jit = truck ? 2.0 : 1.2; this.tgt = null; this.rt = 0; if (truck) this.li++; }
      if (this.jit > 0) {
        this.jit -= dt;
        if (truck) { // back into open space (middle of the street / lot / square), then try again
          const inPlaza = PL.x > 5.3 && PL.z < 2.4 && PL.z > -22.4, ox = inPlaza ? 8.2 : 0, oz = inPlaza ? clamp(PL.z, -20, 0) : clamp(PL.z, -55.5, 55.5);
          const dx = ox - PL.x, dz = oz - PL.z, l = Math.hypot(dx, dz);
          if (l > 0.8) return { x: dx / l, y: -dz / l };
        }
        const a = GAME.time * 1.7; return { x: Math.cos(a), y: Math.sin(a) };
      }
      // lane sweeping on the goal area (efficient, human-like)
      const a0 = SNOW.areas[SNOW.hlArea] || null;
      if (a0 && !a0.done) {
        if (this.laneArea !== a0.id + PL.tool) { this.laneArea = a0.id + PL.tool; this.laneList = this.lanes(a0, PL.stats().w, truck); this.li = 0; this.lp = 0; }
        while (this.li < this.laneList.length && this.lp === 0 && !this.laneHasSnow(this.laneList[this.li])) this.li++;
        if (this.li < this.laneList.length) {
          const L = this.laneList[this.li], wp = L[this.lp];
          const lh = L[4] !== undefined ? L[4] : PL.h, unreachable = truck ? !PL.truckFree(wp[0], wp[1], lh) && !PL.truckFree(wp[0], wp[1], lh + Math.PI) && !PL.truckFree(wp[0], wp[1], PL.h) : !PL.kidFree(wp[0], wp[1]);
          const dwp = Math.hypot(wp[0] - PL.x, wp[1] - PL.z);
          this.nearT = dwp < (truck ? 3.5 : 1.2) ? (this.nearT || 0) + dt : 0;   // circling around a waypoint counts as reached
          if (unreachable || this.noPath > 1.5 || this.nearT > 1.2 || dwp < (truck ? (this.lp ? 1.0 : 2.2) : 0.6)) { this.nearT = 0; this.noPath = 0; this.lp++; if (this.lp > 1) { this.lp = 0; this.li++; } }
          if (this.li < this.laneList.length) { const w2 = this.laneList[this.li][this.lp]; this.tgt = { x: w2[0], z: w2[1] }; this.rt = 0.35; }
        }
      }
      if ((this.rt <= 0 || !this.tgt) && (!a0 || this.li >= (this.laneList || []).length)) {
        this.rt = 0.35;
        let a = SNOW.areas[SNOW.hlArea] || null;
        let p = a && !a.done ? SNOW.nearestSnow(PL.x + Math.sin(PL.h) * (truck ? 4 : 1), PL.z + Math.cos(PL.h) * (truck ? 4 : 1), a.id, 0.04, 150) : null;
        if (p && truck && !this.okCell(...this.cell(p.x, p.z), true)) { const c = this.cell(p.x, p.z); p = { x: clamp(p.x, -2.2, 2.2), z: p.z }; }
        if (!p) p = SNOW.nearestSnow(PL.x, PL.z, 0, 0.05, 150);
        this.tgt = p;
      }
      if (!this.tgt) return { x: 0, y: 0 };
      tx = this.tgt.x; tz = this.tgt.z; key = 's' + Math.round(tx * 2) + ',' + Math.round(tz * 2);
    }
    if (key !== this.tgtKey || this.fT <= 0) { this.tgtKey = key; this.field(tx, tz, truck); this.fT = 1.0; }
    this.fT -= dt;
    // steer: next cell downhill
    const [ci, cj] = this.cell(PL.x, PL.z), W = this.W, dist = this.dist;
    let dx = tx - PL.x, dz = tz - PL.z;
    const here = dist[ci + cj * W];
    if (here < 0) this.noPath = (this.noPath || 0) + dt; else this.noPath = 0;
    const open = (x, z) => (Math.abs(x) < 3.6 && Math.abs(z) < 50) || Math.abs(z) > 50.5;
    if (truck) {
      // route between the open zones (street, end lots, square) through their mouths
      const zone = (x, z) => z < -50 ? 'N' : z > 50 ? 'S' : (x > 5.3 && z < 2.4 && z > -22.4) ? 'P' : 'R';
      const zp = zone(PL.x, PL.z), zt = zone(tx, tz);
      if (zp !== zt) {
        let wx = null, wz = null;
        if (zp === 'N') { wx = 0; wz = -45; } else if (zp === 'S') { wx = 0; wz = 45; }
        else if (zp === 'P') { wx = 1.0; wz = clamp(PL.z, -16, -4); }
        else if (zt === 'P') { if (PL.x < 0.5 || Math.abs(PL.z - clamp(tz, -16, -4)) > 4) { wx = 1.0; wz = clamp(tz, -16, -4); } }
        else if (zt === 'N' && PL.z > -44) { wx = 0; wz = -46; } else if (zt === 'S' && PL.z < 44) { wx = 0; wz = 46; }
        if (wx !== null && Math.hypot(wx - PL.x, wz - PL.z) > 2) { dx = wx - PL.x; dz = wz - PL.z; const l = Math.hypot(dx, dz) || 1; return { x: dx / l, y: -dz / l }; }
      }
      // trucks: straight at the waypoint when the way is clear, otherwise follow the path field a few cells ahead
      const r = PL.geo.halfW + 0.15, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
      let clear = true;
      for (let d = 1; d < L && clear; d += 0.6) { const x = PL.x + ux * d, z = PL.z + uz * d; if (!SNOW.walk(x, z) || !SNOW.walk(x + uz * r, z - ux * r) || !SNOW.walk(x - uz * r, z + ux * r)) clear = false; }
      if (!clear && here > 2) {
        let ci2 = ci, cj2 = cj, v = here;
        for (let s = 0; s < 6; s++) {
          let bi = ci2, bj = cj2, bv = v;
          for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const ni = ci2 + a, nj = cj2 + b; if (ni < 0 || nj < 0 || ni >= W || nj >= this.D) continue; const w = dist[ni + nj * W]; if (w >= 0 && w < bv) { bv = w; bi = ni; bj = nj; } }
          if (bv >= v) break; ci2 = bi; cj2 = bj; v = bv;
        }
        dx = WORLD.bounds.x0 + (ci2 + 0.5) * this.CS - PL.x; dz = WORLD.bounds.z0 + (cj2 + 0.5) * this.CS - PL.z;
      }
      const l = Math.hypot(dx, dz) || 1; return { x: dx / l, y: -dz / l };
    }
    if (here > 1) {
      let bi = ci, bj = cj, bv = here;
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const ni = ci + a, nj = cj + b; if (ni < 0 || nj < 0 || ni >= W || nj >= this.D) continue;
        const v = dist[ni + nj * W]; if (v >= 0 && v < bv) { bv = v; bi = ni; bj = nj; }
      }
      dx = WORLD.bounds.x0 + (bi + 0.5) * this.CS - PL.x; dz = WORLD.bounds.z0 + (bj + 0.5) * this.CS - PL.z;
    }
    const l = Math.hypot(dx, dz) || 1;
    return { x: dx / l, y: -dz / l };
  }
};

// ---------- boot ----------
let renderer, scene;
async function loadArt() {
  let buf = null;
  try {
    if ('DecompressionStream' in window) {
      const r = await fetch('assets/town.glb.gz?v=__VER__'); if (!r.ok) throw new Error('gz ' + r.status);
      const ab = await r.arrayBuffer(); const u = new Uint8Array(ab);
      if (u[0] === 0x1f && u[1] === 0x8b) { const ds = new Blob([ab]).stream().pipeThrough(new DecompressionStream('gzip')); buf = await new Response(ds).arrayBuffer(); }
      else if (u[0] === 0x67 && u[1] === 0x6c) buf = ab; // already decoded by server
    }
  } catch (e) { console.warn('gz path failed', e); buf = null; }
  if (!buf) { const r = await fetch('assets/town.glb?v=__VER__'); buf = await r.arrayBuffer(); }
  return new Promise((res, rej) => { const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder); L.parse(buf, '', res, rej); });
}
async function boot() {
  const lb = $('loadbar');
  const t0 = performance.now();
  renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: !IS_MOBILE, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, IS_MOBILE ? 1.6 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.8;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  CAM.init();
  lb.style.width = '25%';
  const gltf = await loadArt();
  lb.style.width = '70%';
  WORLD.art = {}; for (const s of gltf.scenes) WORLD.art[s.name] = s;
  buildWorld(scene);
  FX.init(scene);
  PL.init(scene);
  GUIDE.init(scene);
  TREASURE.init(scene);
  CREW.init(scene);
  if (STORE.get('plowtown_mute') === '1') AUD.muted = true;
  const resumed = GAME.load();
  for (let i = 0; i < Math.min(GAME.crew || 0, CREW_DEFS.length); i++) CREW.join(i, true);
  // test shortcut: ?skip=truck|dumpplow|groomer jumps to that stage (driveways done, tools owned)
  if (QS.has('skip')) {
    const to = QS.get('skip') || 'truck';
    for (const k of HAND_AREAS) { const a = WORLD.areaByKey[k]; if (!a.done) GAME.completeArea(a, true); }
    for (const t of TIERS) { GAME.owned[t.key] = 1; if (t.key === to) break; }
    if (to === 'groomer') { for (const k of ['street1', 'street2']) GAME.completeArea(WORLD.areaByKey[k], true); }
    PL.x = 0; PL.z = 30; PL.h = Math.PI; PL.setTool(to, true); PL.ensureFree();
  }
  UI.init();
  INPUT.init($('c'));
  if (QS.has('bot')) { BOT.init(); window.__hold = true; }
  lb.style.width = '100%';
  CAM.update(0, true);
  if (!resumed && !QS.has('bot') && !QS.has('nointro')) CAM.intro = 1;
  onResize(); addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', () => { if (document.hidden) GAME.save(); if (AUD.ctx) { if (document.hidden) AUD.ctx.suspend(); else AUD.ctx.resume(); } });
  // warm up shaders
  renderer.compile(scene, CAM.cam);
  setTimeout(() => { $('loading').classList.add('off'); }, 150);
  if (!resumed) setTimeout(() => UI.hint(IS_TOUCH ? 'Drag anywhere to move' : 'Move with WASD / arrows or drag', 5), 1500);
  else UI.hint('Welcome back!', 2.5);
  console.log('boot ms', Math.round(performance.now() - t0));
  window.__ready = true;
  window.__render = () => { SNOW.flush(); CAM.update(0, true); GUIDE.update(0.016); UI._uiT = 0; UI.update(0.016); renderer.render(scene, CAM.cam); };
  window.__step = (n, dt) => { for (let i = 0; i < n; i++) step(dt || 1 / 30); };
  last = performance.now();
  requestAnimationFrame(frame);
}
function onResize() {
  renderer.setSize(innerWidth, innerHeight); CAM.cam.aspect = innerWidth / innerHeight; CAM.cam.updateProjectionMatrix();
  FX.uScale.value = innerHeight * renderer.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(CAM.cam.fov) / 2));
}
let last = 0, frameN = 0;
const FAST = QS.has('fast') ? Math.max(1, +QS.get('fast')) : 1;
function step(dt) {
  const inp = QS.has('bot') ? BOT.get(dt) : (CAM.intro > 0.05 ? { x: 0, y: 0 } : INPUT.get());
  if (CAM.intro > 0 && (Math.abs(inp.x) + Math.abs(inp.y) > 0 || INPUT.joy.active)) CAM.intro = Math.min(CAM.intro, 0.05);
  PL.update(dt, inp);
  GAME.update(dt);
  LIFE.update(dt);
  TREASURE.update(dt);
  CREW.update(dt);
  updateWorld(dt);
  FX.update(dt);
  UI.tick(dt);
}
function frame(now) {
  requestAnimationFrame(frame);
  if (window.__hold) { last = now; return; }
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (dt <= 0) return;
  for (let i = 0; i < FAST; i++) step(FAST > 1 ? 1 / 30 : dt);
  SNOW.flush();
  SNOW.uni.uTime.value = now / 1000; SNOW.uni.uPulse.value = 0.5 + 0.5 * Math.sin(now / 260);
  CAM.update(dt);
  if (scene.fog) { const k = Math.max(0, CAM.intro); scene.fog.near = 42 + k * 80; scene.fog.far = 120 + k * 160; }
  GUIDE.update(dt);
  // x-ray uniforms (player screen pos & depth)
  { const v = XRAY._v || (XRAY._v = new V3()); v.set(PL.x, PL.kind === 'truck' ? 1.2 : 0.6, PL.z).project(CAM.cam); XRAY.uP.value.set(v.x, v.y);
    const w = XRAY._w || (XRAY._w = new V3()); w.set(PL.x, 0.6, PL.z).applyMatrix4(CAM.cam.matrixWorldInverse); XRAY.uD.value = -w.z;
    XRAY.uA.value = innerWidth / innerHeight; XRAY.uR.value = PL.kind === 'truck' ? 0.2 + PL.geo.halfW * 0.05 : 0.15; renderer.getDrawingBufferSize(XRAY.uRes.value); }
  const s = WORLD.sun; s.position.set(CAM.x + 14, 24, CAM.z + 12); s.target.position.set(CAM.x, 0, CAM.z - 4); s.target.updateMatrixWorld();
  FX.center.set(CAM.x, 0, CAM.z);
  AUD.update(dt, { scrape: clamp(PL.carveRate / (PL.kind === 'truck' ? 9 : PL.kind === 'blower' ? 3 : 1.6), 0, 1), tool: PL.kind, move: PL.moveAmt, blowing: PL.blowing });
  UI.update(dt);
  frameN++;
  if (!QS.has('norender') || frameN % 30 === 0) renderer.render(scene, CAM.cam);
}
boot().catch(e => { console.error(e); $('loadmsg').textContent = 'Could not start: ' + (e && e.message || e); });
