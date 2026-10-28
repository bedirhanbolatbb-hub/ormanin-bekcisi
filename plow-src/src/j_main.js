// ---------- input ----------
const INPUT = {
  keys: {}, joy: { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0, show: false },
  init(el) {
    addEventListener('keydown', e => { this.keys[e.code] = 1; AUD.init(); GAME.started = true; if (CHUI.introUp) CHUI.introGo(true); if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); });
    addEventListener('keyup', e => { this.keys[e.code] = 0; });
    addEventListener('blur', () => { this.keys = {}; this.joy.active = false; });
    const J = this.joy, R = 52;
    // a touch starts the stick (also when it lands on the chapter card's button: then you can drive straight away)
    this.start = (e) => {
      // only the main button drives (a right-click must not grab the stick)
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      AUD.init(); GAME.started = true; if (CHUI.introUp) CHUI.introGo(true);
      if (J.active) return;
      J.active = true; J.id = e.pointerId; J.ox = e.clientX; J.oy = e.clientY; J.dx = 0; J.dy = 0; J.show = e.pointerType !== 'mouse' || true;
      try { el.setPointerCapture(e.pointerId); } catch (_) { }
    };
    el.addEventListener('pointerdown', this.start);
    el.addEventListener('pointermove', e => {
      if (!J.active || e.pointerId !== J.id) return;
      let dx = (e.clientX - J.ox) / R, dy = (e.clientY - J.oy) / R; const l = Math.hypot(dx, dy);
      if (l > 1) { J.ox += (dx / l) * (l - 1) * R; J.oy += (dy / l) * (l - 1) * R; dx /= l; dy /= l; }
      J.dx = dx; J.dy = dy;
    });
    const up = e => { if (e.pointerId === J.id) { J.active = false; J.dx = J.dy = 0; } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
    el.addEventListener('contextmenu', e => e.preventDefault());
  },
  block: false,
  get() {
    if (this.block) { this.joy.active = false; return { x: 0, y: 0 }; }
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
  // pick a clear spot in front of the machine (nothing tall in the way or right next to the lens) and fly there for a moment
  heroShot(T) {
    const tr = PL.kind === 'truck', gk = tr ? PL.geo.cam : 1, ly = tr ? 1.5 * gk : 0.75, port = innerWidth / innerHeight < 0.9;
    const D = tr ? (port ? 15 : 11) * gk : (port ? 6.5 : 4.8), dir = new V3(), hit = new V3(), ray = new THREE.Ray(), cp = new V3();
    // everything tall: static decor plus buildings, buses, stalls... (whatever stands in the scene right now)
    const occ = WORLD.occ.slice(), skip = new Set([PL.truck, PL.kid && PL.kid.root, PL.sled, PL.rope, GUIDE.arrow, GUIDE.beam, ...WORLD.decorGroups]);
    for (const c of WORLD.scene.children) {
      if (skip.has(c) || c.isLight || c.isPoints || c.isLine || !c.visible) continue;
      const bb = new THREE.Box3().setFromObject(c), lim = c.isGroup ? 70 : 25;
      if (!bb.isEmpty() && bb.max.y > 2.0 && bb.max.x - bb.min.x < lim && bb.max.z - bb.min.z < lim) occ.push(bb);
    }
    // the machine and a little space around it must be in plain view
    const sx = Math.cos(PL.h), sz = -Math.sin(PL.h), fx = Math.sin(PL.h), fz = Math.cos(PL.h), r = tr ? 2.4 * gk : 0.9;
    const tg = [[0, 0, ly], [r, 0, ly * 0.6], [-r, 0, ly * 0.6], [0, r * 1.2, ly * 0.6], [0, -r, ly * 0.6]].map(([s, f, y]) => new V3(PL.x + sx * s + fx * f, y, PL.z + sz * s + fz * f));
    const clear = (a, D, y) => {
      const ang = PL.h + a, cx = PL.x + Math.sin(ang) * D, cz = PL.z + Math.cos(ang) * D, B = WORLD.bounds;
      if (cx < B.x0 - 14 || cx > B.x1 + 14 || cz < B.z0 - 14 || cz > B.z1 + 14) return false;
      cp.set(cx, y, cz);
      for (const b of occ) if (b.distanceToPoint(cp) < (tr ? 3.2 : 1.6)) return false;
      for (const o of tg) {
        dir.subVectors(cp, o); const len = dir.length(); dir.divideScalar(len); ray.set(o, dir);
        for (const b of occ) { if (b.containsPoint(o)) continue; if (ray.intersectBox(b, hit) && hit.distanceTo(o) < len) return false; }
      }
      return true;
    };
    for (const y of tr ? [(port ? 5.2 : 4.2) * gk, 7.5 * gk, 11 * gk] : [port ? 2.6 : 2.1, 3.8, 6]) for (const a of [0.5, -0.5, 0.8, -0.8, 0.22, -0.22, 1.15, -1.15, 1.6, -1.6, 2.3, -2.3])
      for (const d of [D, D * 0.75]) if (clear(a, d, y)) { this.heroS = { a, D: d, y, ly, h: PL.h, T: T || 2.2 }; this.hero = this.heroS.T; return true; }
    return false;
  },
  update(dt, snap) {
    // (a frame that is 0 px wide for a moment must not leave the camera at NaN for good)
    const t = PL.kind, asp = innerWidth > 0 && innerHeight > 0 ? innerWidth / innerHeight : 1.6, gk = t === 'truck' ? PL.geo.cam : 1;
    const port = asp < 0.9;
    const base = port ? (t === 'truck' ? 15 : t === 'blower' ? 11.5 : 10.5) : (t === 'truck' ? 18 : t === 'blower' ? 13 : 11.8);
    const wantW = port ? (t === 'truck' ? 13 : t === 'blower' ? 9.5 : 8.2) : (t === 'truck' ? 20 : t === 'blower' ? 13 : 11.5);
    const hf = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(this.cam.fov) / 2) * asp);
    const d = Math.max(base * gk, (wantW * gk / 2) / Math.tan(hf / 2) * 0.82);
    this.d = snap || !Number.isFinite(this.d) ? d : damp(this.d, d, 2.2, dt);
    if (!Number.isFinite(this.x) || !Number.isFinite(this.z)) { this.x = PL.x; this.z = PL.z; }
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
      const ic = CH.introCam || { from: [0, 34, 82], look: [0, 0.5, 10] };
      px = lerp(px, ic.from[0], k); py = lerp(py, ic.from[1], k); pz = lerp(pz, ic.from[2], k); lx = lerp(lx, ic.look[0], k); lz = lerp(lz, ic.look[2], k);
      this.intro -= dt / 2.6;
    }
    // new machine: a quick hero shot from the front (slowly circling), then back behind it
    if (this.hero > 0) {
      this.hero = Math.max(0, this.hero - dt);
      const H = this.heroS, u = 1 - this.hero / H.T, k = smooth(clamp(Math.min(u, 1 - u) / 0.3, 0, 1));
      const tr = PL.kind === 'truck', f = tr ? 1.2 * PL.geo.cam : 0.3;
      // swing around the machine (not through it): blend angle, distance and height around it
      const angN = Math.atan2(px - PL.x, pz - PL.z), dN = Math.hypot(px - PL.x, pz - PL.z);
      let da = H.h + H.a + (u - 0.5) * 0.35 * Math.sign(H.a || 1) - angN; da = Math.atan2(Math.sin(da), Math.cos(da));
      const ang = angN + da * k, dd = lerp(dN, H.D, k);
      px = PL.x + Math.sin(ang) * dd; pz = PL.z + Math.cos(ang) * dd; py = lerp(py, H.y, k);
      lx = lerp(lx, PL.x + Math.sin(H.h) * f, k); ly = lerp(ly, H.ly, k); lz = lerp(lz, PL.z + Math.cos(H.h) * f, k);
    }
    // finale: the camera pulls away to show the big moment, slowly circling it
    if (this.show) {
      const S = this.show; S.k = clamp((S.k || 0) + (S.out ? -dt / 1.1 : dt / 1.5), 0, 1); S.a = (S.a || 0) + dt * 0.1;
      if (S.out && S.k <= 0) this.show = null;
      else {
        const k = smooth(S.k), dx = S.from[0] - S.look[0], dz = S.from[2] - S.look[2], ca = Math.cos(S.a), sa = Math.sin(S.a);
        px = lerp(px, S.look[0] + dx * ca - dz * sa, k); py = lerp(py, S.from[1], k); pz = lerp(pz, S.look[2] + dx * sa + dz * ca, k);
        lx = lerp(lx, S.look[0], k); ly = lerp(ly, S.look[1], k); lz = lerp(lz, S.look[2], k);
      }
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
  if (WORLD.bakery) lit(WORLD.bakery);
  if (WORLD.glows) for (const G of WORLD.glows) { if (G.f) G.m.scale.setScalar(G.s * (1 + Math.sin(t * 7 + G.ph) * 0.06 * G.f + Math.sin(t * 13.1 + G.ph * 2) * 0.04 * G.f)); }
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
    if (nt && !TIER[nt].gift && !GAME.toolLocked(nt) && (GAME.owned[nt] || UI.shownCoins() >= TIER[nt].cost)) { GAME.buyTool(nt); this.mark('tool_' + nt); return; }
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
          if (a.mask) {
            // shaped area (e.g. an oval lake): keep only the part of the pass that lies inside it
            let lo2 = null, hi2 = null; const N = 60;
            for (let k = 0; k <= N; k++) { const x = lerp(A[0], B[0], k / N), z = lerp(A[1], B[1], k / N), kk = SNOW.idx(x, z); if (kk >= 0 && SNOW.A[kk] === a.id) { if (lo2 === null) lo2 = k; hi2 = k; } }
            if (lo2 === null) continue;
            const A2 = [lerp(A[0], B[0], lo2 / N), lerp(A[1], B[1], lo2 / N)], B2 = [lerp(A[0], B[0], hi2 / N), lerp(A[1], B[1], hi2 / N)]; A = A2; B = B2;
            if (Math.hypot(B[0] - A[0], B[1] - A[1]) < 1) continue;
          }
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
  // human-paced test player: when the nearest snow does not come off for a while (a spot the machine cannot reach),
  // look elsewhere in the job for a bit, like a person would
  humanPick(a, p) {
    const prog = a.cleared;
    if (this._hp === undefined || prog > this._hp || this._ha !== a.id) { this._hp = prog; this._hs = 0; this._ha = a.id; } else this._hs += 0.35;
    if (this._hs > 4) { this._hav = { x: p.x, z: p.z, t: 14 }; this._hs = 0; this._hr = null; }
    if (this._hav && (this._hav.t -= 0.35) <= 0) this._hav = null;
    if (!this._hav || Math.hypot(p.x - this._hav.x, p.z - this._hav.z) > 2.5) return p;
    if (this._hr && (this._hr.t -= 0.35) > 0 && SNOW.depth(this._hr.x, this._hr.z) > 0.06) return this._hr;
    const rs = a.lot ? [a.lot.drive, a.lot.path] : a.rects;
    for (let n = 0; n < 300; n++) {
      const r = rs[(Math.random() * rs.length) | 0], x = rnd(r.x0, r.x1), z = rnd(r.z0, r.z1), k = SNOW.idx(x, z);
      if (k >= 0 && SNOW.A[k] === a.id && SNOW.T[k] === 1 && SNOW.H[k] > 0.08 && Math.hypot(x - this._hav.x, z - this._hav.z) > 2.5) { this._hr = { x, z, t: 3 }; return this._hr; }
    }
    return p;
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
      // (driving back and forth on one spot without clearing anything counts as stuck too)
      { const A = this._anc || (this._anc = { x: PL.x, z: PL.z, t: 0 }); if (PL.carveRate > 0.05 || Math.hypot(PL.x - A.x, PL.z - A.z) > 3) { A.x = PL.x; A.z = PL.z; A.t = 0; } else if ((A.t += dt) > 6) { A.t = 0; this.stuckT = 3; } }
      if (this.stuckT > 2.5) { this.stuckT = 0; this.jit = truck ? 2.0 : 1.2; this.tgt = null; this.rt = 0; if (truck) this.li++; }
      if (this.jit > 0) {
        this.jit -= dt;
        if (truck && CH.botOpen) { // back into open space (middle of the street / lot / square), then try again
          const [ox, oz] = CH.botOpen(PL.x, PL.z);
          const dx = ox - PL.x, dz = oz - PL.z, l = Math.hypot(dx, dz);
          if (l > 0.8) return { x: dx / l, y: -dz / l };
        }
        const a = GAME.time * 1.7; return { x: Math.cos(a), y: Math.sin(a) };
      }
      // lane sweeping on the goal area (efficient, human-like)
      const a0 = SNOW.areas[SNOW.hlArea] || null;
      if (a0 && !a0.done && !this.human) {
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
      if ((this.rt <= 0 || !this.tgt) && (!a0 || this.human || this.li >= (this.laneList || []).length)) {
        this.rt = 0.35;
        let a = SNOW.areas[SNOW.hlArea] || null;
        let p = a && !a.done ? SNOW.nearestSnow(PL.x + Math.sin(PL.h) * (truck ? 4 : 1), PL.z + Math.cos(PL.h) * (truck ? 4 : 1), a.id, 0.04, 150) : null;
        if (p && truck && !this.okCell(...this.cell(p.x, p.z), true) && CH.botTarget) p = CH.botTarget(p);
        // (snow that does not come off for a while, e.g. a spot the machine cannot reach: look elsewhere in the job for a bit)
        if (a && p) p = this.humanPick(a, p);
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
    if (truck) {
      // route between the open zones (street, end lots, square) through their mouths
      if (CH.botZone) {
        const zp = CH.botZone(PL.x, PL.z), zt = CH.botZone(tx, tz);
        const m = zp !== zt ? CH.botMouth(zp, zt, PL.x, PL.z, tz) : null;
        if (m && Math.hypot(m[0] - PL.x, m[1] - PL.z) > 2) { dx = m[0] - PL.x; dz = m[1] - PL.z; const l = Math.hypot(dx, dz) || 1; return { x: dx / l, y: -dz / l }; }
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

// test only (?bot&human): a rougher, human-paced player, to see how long a normal player needs.
// no tidy lanes (it heads for the nearest snow it sees), slow and shaky steering, short pauses, buys a few seconds late
const HUMAN = {
  out: { x: 0, y: 0 }, acc: 0, idle: 0, nextIdle: 35, wait: -1,
  init() {
    BOT.human = true;
    const get = BOT.get.bind(BOT), buy = BOT.buy.bind(BOT);
    BOT.buy = () => {
      const c0 = UI.shownCoins(), nt = GAME.nextTool(), t = PL.tool;
      const can = (nt && !TIER[nt].gift && !GAME.toolLocked(nt) && (GAME.owned[nt] || c0 >= TIER[nt].cost)) || [0, 1, 2].some(i => c0 >= GAME.upCost(t, i));
      if (!can) { this.wait = -1; return; }
      if (this.wait < 0) this.wait = rnd(2, 8);
      if ((this.wait -= this._dt || 0) <= 0) { this.wait = -1; buy(); }
    };
    BOT.get = (dt) => {
      this._dt = dt; this.acc += dt;
      if (this.idle > 0) { this.idle -= dt; BOT.buy(); return { x: 0, y: 0 }; }
      if ((this.nextIdle -= dt) <= 0) { this.nextIdle = rnd(25, 45); this.idle = rnd(1, 2.5); }
      if (this.acc >= 0.3) {
        const o = get(this.acc); this.acc = 0;
        const n = (Math.random() + Math.random() + Math.random() - 1.5) * 0.42, c = Math.cos(n), s = Math.sin(n);
        this.out = { x: o.x * c - o.y * s, y: o.x * s + o.y * c };
      } else BOT.buy();
      return this.out;
    };
  }
};

// ---------- boot ----------
let renderer, scene;
async function loadArt(name) {
  name = name || 'town';
  let buf = null;
  try {
    if ('DecompressionStream' in window) {
      const r = await fetch('assets/' + name + '.glb.gz?v=__VER__'); if (!r.ok) throw new Error('gz ' + r.status);
      const ab = await r.arrayBuffer(); const u = new Uint8Array(ab);
      if (u[0] === 0x1f && u[1] === 0x8b) { const ds = new Blob([ab]).stream().pipeThrough(new DecompressionStream('gzip')); buf = await new Response(ds).arrayBuffer(); }
      else if (u[0] === 0x67 && u[1] === 0x6c) buf = ab; // already decoded by server
    }
  } catch (e) { console.warn('gz path failed', e); buf = null; }
  if (!buf) { const r = await fetch('assets/' + name + '.glb?v=__VER__'); buf = await r.arrayBuffer(); }
  return new Promise((res, rej) => { const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder); L.parse(buf, '', res, rej); });
}
async function boot() {
  const lb = $('loadbar');
  const t0 = performance.now();
  // the town art downloads while the CrazyGames SDK starts up
  const townP = loadArt(); townP.catch(() => { });
  await CG.init(); CG.loadingStart();
  renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: !IS_MOBILE, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, IS_MOBILE ? 1.6 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.8;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  CAM.init();
  // which chapter (and your coins, machines and crew) before anything is built
  pickChapter(GAME.loadMeta());
  const lm = $('loadmsg'); if (lm) lm.textContent = 'Chapter ' + CH.id + ': ' + CH.name;
  lb.style.width = '25%';
  // scenes are keyed by their name in the file (three.js renames scenes that clash with node names)
  const addArt = g => g.scenes.forEach((s, i) => { WORLD.art[(g.parser.json.scenes[i] || {}).name || s.name] = s; });
  WORLD.art = {};
  const packs = await Promise.all([townP, CH.pack ? loadArt(CH.pack) : null]);
  for (const g of packs) if (g) addArt(g);
  lb.style.width = '70%';
  buildWorld(scene);
  renderer.toneMappingExposure = WORLD.env.exposure;
  AUD.song = CH.music ? CH.music() : null;
  FX.init(scene);
  PL.init(scene);
  GUIDE.init(scene);
  TREASURE.init(scene);
  CREW.init(scene);
  if (STORE.get('plowtown_mute') === '1') AUD.muted = true;
  const resumed = GAME.loadChapter();
  SNOW.flush(true);
  // the CrazyGames SDK turned up late: send our progress up, unless the account already holds a newer game
  // (played on another device) - then this session leaves the account alone and the next start picks that one up
  CG.onLate = () => {
    let c = null; try { c = JSON.parse(CG.get('plowtown_v4') || 'null'); } catch (e) { c = null; }
    const mine = GAME.baseU == null || CG.uid === undefined || GAME.baseU === CG.uid;
    // the account has a game that got further than the one this start found on the device (a new phone, cleared data,
    // a slow line) - or this start began from another player's game on a shared computer: carry on from the account's
    if (c && c.v === GAME.ver && (!mine || GAME.better(c, { earned: GAME.earned, t: GAME.loadedT }))) { GAME.adopt(c); return; }
    if (!c && !mine) { GAME.adopt(null); return; }
    CG.hold = false; GAME.save();
  };
  CG.runLate();
  for (let i = 0; i < Math.min(GAME.crew || 0, CREW_DEFS.length); i++) CREW.join(i, true);
  // test shortcut: ?skip=truck|dumpplow|groomer jumps to that stage (driveways done, tools owned)
  if (QS.has('skip') && CH.id === 1) {
    const to = QS.get('skip') || 'truck';
    for (const k of HAND_AREAS) { const a = WORLD.areaByKey[k]; if (!a.done) GAME.completeArea(a, true); }
    for (const t of TIERS) { GAME.owned[t.key] = 1; if (t.key === to) break; }
    if (to === 'groomer') { for (const k of ['street1', 'street2']) GAME.completeArea(WORLD.areaByKey[k], true); }
    PL.x = 0; PL.z = 30; PL.h = Math.PI; PL.setTool(to, true); PL.ensureFree();
  }
  UI.init();
  CHUI.init();
  INPUT.init($('c'));
  if (QS.has('bot')) { BOT.init(); if (QS.has('human')) HUMAN.init(); window.__hold = !QS.has('vid'); }
  lb.style.width = '100%';
  CAM.update(0, true);
  if (!resumed && !QS.has('bot') && !QS.has('nointro')) { CAM.intro = 1; setTimeout(() => CHUI.intro(), 700); }
  onResize(); addEventListener('resize', onResize);
  // a hidden tab gets no frames, so tell CrazyGames right here that play stopped (frames turn it back on)
  document.addEventListener('visibilitychange', () => { if (document.hidden) { GAME.save(); CG.play(false); } if (AUD.ctx) { if (document.hidden) AUD.ctx.suspend(); else AUD.ctx.resume(); } });
  // warm up shaders
  renderer.compile(scene, CAM.cam);
  setTimeout(() => { $('loading').classList.add('off'); CG.loadingStop(); }, 150);
  // iOS wants a touchend / click to wake the sound up again
  for (const ev of ['touchend', 'click']) addEventListener(ev, () => AUD.init(), { passive: true });
  // a new day: the daily gift (after the chapter card when there is one)
  const run = DAILY.check(); if (run) DAILY.pay(run);
  if (!resumed) CH.firstHint = IS_TOUCH ? 'Drag anywhere to move' : 'Move with WASD / arrows or drag';
  else if (GAME.ended && chapterById(CH.id + 1)) {
    // back in a chapter you already finished: point at the way on (after the daily gift banner, if there is one)
    const say = () => { if (GAME.ended && !CHUI.open) UI.hint('Chapter done! Tap NEXT CHAPTER to go on', 5); };
    setTimeout(say, run ? 5000 : 1200);
  }
  else UI.hint('Welcome back!', 2.5);
  if (run) { if (resumed || QS.has('nointro')) setTimeout(() => DAILY.give(run), 1800); else CH.dailyGift = run; }
  console.log('boot ms', Math.round(performance.now() - t0));
  window.__ready = true;
  PCLOG.start(resumed);
  window.__render = () => { SNOW.flush(true); CAM.update(0, true); updXray(); placeSun(); FX.update(0.001); GUIDE.update(0.016); UI._uiT = 0; UI.update(0.016); renderer.render(scene, CAM.cam); };
  window.__step = (n, dt) => { for (let i = 0; i < n; i++) step(dt || 1 / 30); };
  last = performance.now();
  requestAnimationFrame(frame);
}
// x-ray uniforms (player screen pos & depth)
function updXray() {
  const v = XRAY._v || (XRAY._v = new V3()); v.set(PL.x, PL.kind === 'truck' ? 1.2 : 0.6, PL.z).project(CAM.cam); XRAY.uP.value.set(v.x, v.y);
  const w = XRAY._w || (XRAY._w = new V3()); w.set(PL.x, 0.6, PL.z).applyMatrix4(CAM.cam.matrixWorldInverse);
  // the see-through is for finding your machine; in the finale shot the camera shows the big moment, so it fades out
  XRAY.uD.value = -w.z * (CAM.show ? 1 - smooth(clamp(CAM.show.k || 0, 0, 1)) : 1);
  XRAY.uA.value = innerWidth / innerHeight; XRAY.uR.value = PL.kind === 'truck' ? 0.2 + PL.geo.halfW * 0.05 : 0.15; renderer.getDrawingBufferSize(XRAY.uRes.value);
}
function placeSun() { const s = WORLD.sun, so = WORLD.env.sunOff; s.position.set(CAM.x + so[0], so[1], CAM.z + so[2]); s.target.position.set(CAM.x, 0, CAM.z - 4); s.target.updateMatrixWorld(); }
function onResize() {
  renderer.setSize(innerWidth, innerHeight); CAM.cam.aspect = innerWidth / innerHeight; CAM.cam.updateProjectionMatrix();
  FX.uScale.value = innerHeight * renderer.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(CAM.cam.fov) / 2));
}
let last = 0, frameN = 0;
const FAST = QS.has('fast') ? Math.max(1, +QS.get('fast')) : 1;
function step(dt) {
  const bot = QS.has('bot'), raw = bot ? null : INPUT.get();
  // the first touch / key ends the fly-in and the chapter card: you are playing right away
  const wants = bot ? false : Math.abs(raw.x) + Math.abs(raw.y) > 0 || INPUT.joy.active;
  if (wants && CHUI.introUp) CHUI.introGo(true);
  const inp = bot ? (CAM.hero > 0.35 ? { x: 0, y: 0 } : BOT.get(dt)) : (CAM.intro > 0.05 || CAM.hero > 0.35 ? { x: 0, y: 0 } : raw);
  if (CAM.intro > 0 && (wants || (bot && Math.abs(inp.x) + Math.abs(inp.y) > 0))) CAM.intro = Math.min(CAM.intro, 0.05);
  PL.update(dt, inp);
  GAME.update(dt);
  LIFE.update(dt);
  TREASURE.update(dt);
  CREW.update(dt);
  NPC.update(dt);
  updateWorld(dt);
  FX.update(dt);
  UI.tick(dt);
}
function frame(now) {
  requestAnimationFrame(frame);
  // you can play the moment the town shows (the chapter card and the fly-in never block): that is gameplay for CrazyGames
  CG.play(!CHUI.open && !CHUI._going && !document.hidden && $('loading').classList.contains('off'));
  if (window.__hold) { last = now; return; }
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (dt <= 0) return;
  for (let i = 0; i < FAST; i++) step(FAST > 1 ? 1 / 30 : dt);
  SNOW.flush();
  SNOW.uni.uTime.value = now / 1000; SNOW.uni.uPulse.value = 0.5 + 0.5 * Math.sin(now / 260);
  CAM.update(dt);
  if (scene.fog) { const k = Math.max(0, CAM.intro), E = WORLD.env; scene.fog.near = E.fogNear + k * 80; scene.fog.far = E.fogFar + k * 160; }
  GUIDE.update(dt);
  updXray();
  placeSun();
  FX.center.set(CAM.x, 0, CAM.z);
  AUD.update(dt, { scrape: clamp(PL.carveRate / (PL.kind === 'truck' ? 9 : PL.kind === 'blower' ? 3 : 1.6), 0, 1), tool: PL.kind, move: PL.moveAmt, blowing: PL.blowing });
  UI.update(dt);
  frameN++;
  if (!QS.has('norender') || frameN % 30 === 0) renderer.render(scene, CAM.cam);
}
boot().catch(e => { console.error(e); PCLOG.bootFail(e); $('loadmsg').textContent = 'Could not start: ' + (e && e.message || e); });
