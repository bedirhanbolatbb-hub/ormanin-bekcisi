// ---------- particles, coins, clumps, weather ----------
const FX = {
  sys: [], coins: [], clumps: [], uScale: { value: 600 },
  init(scene) {
    this.scene = scene;
    this.norm = this._mkSys(scene, 2600, THREE.NormalBlending);
    this.add = this._mkSys(scene, 1400, THREE.AdditiveBlending);
    // coins
    const cg = new THREE.CylinderGeometry(0.17, 0.17, 0.035, 16); cg.rotateX(Math.PI / 2);
    const cm = new THREE.MeshStandardMaterial({ color: 0xffc83a, metalness: 0.75, roughness: 0.28, emissive: 0x9a5a00, emissiveIntensity: 0.55 });
    this.coinMesh = new THREE.InstancedMesh(cg, cm, 220); this.coinMesh.count = 0; this.coinMesh.frustumCulled = false;
    this.coinMesh.castShadow = false; scene.add(this.coinMesh);
    // clumps
    this.clumpGeo = new THREE.IcosahedronGeometry(1, 0);
    this.clumpMat = new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 0.8, flatShading: true });
    this.clumpPool = [];
    // weather
    this._weather(scene);
  },
  _mkSys(scene, max, blend) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(max * 3), col = new Float32Array(max * 3), size = new Float32Array(max), alpha = new Float32Array(max);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('size', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setDrawRange(0, 0);
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: TEX.dot }, uScale: this.uScale },
      vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying float vA; varying vec3 vC; uniform float uScale;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = clamp(size*uScale/max(0.1,-mv.z), 1.0, 256.0); gl_Position = projectionMatrix*mv; vA=alpha; vC=color; }`,
      fragmentShader: `uniform sampler2D map; varying float vA; varying vec3 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); float a = t.a*vA; if(a<0.01) discard; gl_FragColor = vec4(vC, a); }`,
      transparent: true, depthWrite: false, blending: blend
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 5; scene.add(pts);
    const S = { pts, geo, max, n: 0, p: [] };
    for (let i = 0; i < max; i++) S.p.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, l: 0, ml: 1, s0: 0.1, s1: 0.1, r: 1, g: 1, b: 1, a0: 1, a1: 0, gr: 0, dr: 0, fl: 0, ax: 0, az: 0 });
    this.sys.push(S);
    return S;
  },
  emit(S, o) {
    if (S.n >= S.max) return null;
    const p = S.p[S.n++];
    p.x = o.x; p.y = o.y; p.z = o.z; p.vx = o.vx || 0; p.vy = o.vy || 0; p.vz = o.vz || 0;
    p.l = 0; p.ml = o.life || 1; p.s0 = o.s0 != null ? o.s0 : 0.2; p.s1 = o.s1 != null ? o.s1 : p.s0;
    const c = o.c || [1, 1, 1]; p.r = c[0]; p.g = c[1]; p.b = c[2];
    p.a0 = o.a0 != null ? o.a0 : 1; p.a1 = o.a1 != null ? o.a1 : 0; p.gr = o.gr || 0; p.dr = o.dr || 0; p.fl = o.fl || 0; p.ax = o.ax || 0; p.az = o.az || 0;
    return p;
  },
  update(dt) {
    for (const S of this.sys) {
      const pos = S.geo.attributes.position.array, col = S.geo.attributes.color.array, size = S.geo.attributes.size.array, al = S.geo.attributes.alpha.array;
      let i = 0;
      while (i < S.n) {
        const p = S.p[i];
        p.l += dt;
        if (p.l >= p.ml) { S.n--; const t = S.p[i]; S.p[i] = S.p[S.n]; S.p[S.n] = t; continue; }
        p.vy -= p.gr * dt; p.vx += p.ax * dt; p.vz += p.az * dt; const d = Math.exp(-p.dr * dt); p.vx *= d; p.vy *= d; p.vz *= d;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.gr > 0 && p.y < 0.02) { p.y = 0.02; p.vy *= -0.2; p.vx *= 0.6; p.vz *= 0.6; }
        const t = p.l / p.ml;
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        col[i * 3] = p.r; col[i * 3 + 1] = p.g; col[i * 3 + 2] = p.b;
        size[i] = lerp(p.s0, p.s1, t);
        let a = lerp(p.a0, p.a1, t); if (p.fl) a *= 0.55 + 0.45 * Math.sin(p.l * 40 + i);
        al[i] = a;
        i++;
      }
      S.geo.setDrawRange(0, S.n);
      for (const k of ['position', 'color', 'size', 'alpha']) { const at = S.geo.attributes[k]; at.updateRange.offset = 0; at.updateRange.count = S.n * at.itemSize; at.needsUpdate = true; }
    }
    this._updCoins(dt); this._updClumps(dt); this._updWeather(dt);
  },
  // --- presets ---
  spray(x, y, z, dx, dz, n, sp, sz) {
    for (let i = 0; i < n; i++) {
      const a = rnd(-0.9, 0.9), s = sp * rnd(0.5, 1.2);
      const cx = dx * Math.cos(a) - dz * Math.sin(a), cz = dx * Math.sin(a) + dz * Math.cos(a);
      this.emit(this.norm, { x: x + rnd(-0.1, 0.1), y: y + rnd(0, 0.1), z: z + rnd(-0.1, 0.1), vx: cx * s, vy: rnd(1.2, 3.2) * (sp / 3), vz: cz * s, life: rnd(0.35, 0.75), s0: (sz || 0.12) * rnd(0.6, 1.4), s1: (sz || 0.12) * 0.5, a0: 0.95, a1: 0.2, gr: 9, dr: 1.2, c: [0.97, 0.98, 1] });
    }
  },
  puff(x, y, z, n, sz, c) {
    for (let i = 0; i < n; i++) this.emit(this.norm, { x: x + rnd(-0.3, 0.3) * sz, y: y + rnd(0, 0.2) * sz, z: z + rnd(-0.3, 0.3) * sz, vx: rnd(-0.8, 0.8) * sz, vy: rnd(0.2, 1.0) * sz, vz: rnd(-0.8, 0.8) * sz, life: rnd(0.5, 0.9), s0: 0.35 * sz, s1: 1.0 * sz, a0: 0.75, a1: 0, dr: 2.2, c: c || [0.97, 0.98, 1] });
  },
  steam(x, y, z, n, big) {
    for (let i = 0; i < n; i++) this.emit(this.norm, { x: x + rnd(-0.25, 0.25), y, z: z + rnd(-0.25, 0.25), vx: rnd(-0.3, 0.3) + 0.25, vy: rnd(1.0, 2.0) * (big ? 1.4 : 1), vz: rnd(-0.3, 0.3), life: rnd(1.2, 2.2), s0: 0.35, s1: big ? 2.0 : 1.3, a0: 0.55, a1: 0, dr: 0.6, c: [0.92, 0.94, 0.97] });
  },
  smoke(x, y, z) {
    this.emit(this.norm, { x: x + rnd(-0.1, 0.1), y, z: z + rnd(-0.1, 0.1), vx: 0.35 + rnd(-0.1, 0.1), vy: rnd(0.6, 0.9), vz: rnd(-0.1, 0.1), life: rnd(2.5, 3.5), s0: 0.25, s1: 1.2, a0: 0.38, a1: 0, dr: 0.2, c: [0.78, 0.8, 0.84] });
  },
  sparkle(x, y, z, n, r, c) {
    for (let i = 0; i < n; i++) this.emit(this.add, { x: x + rnd(-r, r), y: y + rnd(0, r), z: z + rnd(-r, r), vx: rnd(-0.5, 0.5), vy: rnd(0.4, 1.6), vz: rnd(-0.5, 0.5), life: rnd(0.5, 1.0), s0: rnd(0.15, 0.3), s1: 0.02, a0: 1, a1: 0, fl: 1, dr: 1.5, c: c || [1, 0.92, 0.6] });
  },
  confetti(x, y, z, n) {
    const cols = [[1, 0.35, 0.35], [1, 0.8, 0.25], [0.35, 0.85, 0.5], [0.35, 0.65, 1], [0.9, 0.45, 1]];
    for (let i = 0; i < n; i++) { const a = rnd(0, TAU), s = rnd(2, 6); this.emit(this.norm, { x, y, z, vx: Math.cos(a) * s * 0.6, vy: rnd(4, 9), vz: Math.sin(a) * s * 0.6, life: rnd(1.4, 2.4), s0: 0.16, s1: 0.12, a0: 1, a1: 0.6, gr: 7, dr: 1.6, fl: 1, c: cols[i % 5] }); }
  },
  firework(x, y, z, c) {
    for (let i = 0; i < 70; i++) {
      const u = rnd(-1, 1), a = rnd(0, TAU), r = Math.sqrt(1 - u * u), s = rnd(5, 8);
      this.emit(this.add, { x, y, z, vx: r * Math.cos(a) * s, vy: u * s, vz: r * Math.sin(a) * s, life: rnd(1.0, 1.6), s0: 0.45, s1: 0.05, a0: 1, a1: 0, gr: 2.5, dr: 1.8, fl: 1, c });
    }
  },
  glow(x, y, z, s, c, life) { this.emit(this.add, { x, y, z, life: life || 0.25, s0: s, s1: s * 1.6, a0: 0.8, a1: 0, c: c || [1, 0.7, 0.3] }); },
  // ---- 3D coins: burst then hand off to UI flyers ----
  coinBurst(x, y, z, n, value, opts) {
    const per = value / n; let acc = 0;
    UI.pending += value;
    for (let i = 0; i < n; i++) {
      if (this.coins.length >= 220) { UI.flyCoin(null, per); continue; }
      const a = rnd(0, TAU), s = rnd(0.6, 2.4) * ((opts && opts.spread) || 1);
      const v = Math.round(acc + per) - Math.round(acc); acc += per;
      this.coins.push({ x, y, z, vx: Math.cos(a) * s, vy: rnd(6.5, 9.5) * ((opts && opts.up) || 1), vz: Math.sin(a) * s, rx: rnd(0, TAU), ry: rnd(0, TAU), sr: rnd(6, 14), t: 0, delay: i * 0.03, fly: rnd(0.75, 1.0), v });
    }
  },
  _m4: new THREE.Matrix4(), _q: new THREE.Quaternion(), _e: new THREE.Euler(), _s: new V3(1, 1, 1), _p: new V3(),
  _updCoins(dt) {
    const M = this.coinMesh; let n = 0;
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      if (c.delay > 0) { c.delay -= dt; continue; }
      c.t += dt; c.vy -= 16 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; c.rx += c.sr * dt; c.ry += c.sr * 0.7 * dt;
      if (c.t > c.fly || (c.vy < 0 && c.y < 0.3)) {
        this._p.set(c.x, c.y, c.z); UI.flyCoin(this._p, c.v);
        this.coins.splice(i, 1); continue;
      }
    }
    for (const c of this.coins) {
      if (c.delay > 0) continue;
      this._e.set(c.rx, c.ry, 0); this._q.setFromEuler(this._e); this._p.set(c.x, c.y, c.z);
      this._m4.compose(this._p, this._q, this._s); M.setMatrixAt(n++, this._m4);
    }
    M.count = n; M.instanceMatrix.needsUpdate = true;
  },
  // ---- snow clumps (ballistic A->B) ----
  clump(ax, ay, az, bx, by, bz, size, T, onLand) {
    let m = this.clumpPool.pop();
    if (!m) { m = new THREE.Mesh(this.clumpGeo, this.clumpMat); m.castShadow = true; }
    this.scene.add(m); m.scale.setScalar(size); m.visible = true;
    const vx = (bx - ax) / T, vz = (bz - az) / T, vy = (by - ay) / T + 0.5 * 14 * T;
    this.clumps.push({ m, x: ax, y: ay, z: az, vx, vy, vz, t: 0, T, onLand, s: size, r: rnd(0, TAU) });
  },
  _updClumps(dt) {
    for (let i = this.clumps.length - 1; i >= 0; i--) {
      const c = this.clumps[i]; c.t += dt; c.vy -= 14 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt;
      c.m.position.set(c.x, c.y, c.z); c.m.rotation.set(c.r + c.t * 6, c.t * 4, 0);
      const sq = 1 + 0.25 * Math.sin(c.t * 20); c.m.scale.set(c.s * sq, c.s / sq, c.s);
      if (Math.random() < 0.5) this.emit(this.norm, { x: c.x, y: c.y, z: c.z, vx: rnd(-0.3, 0.3), vy: rnd(-0.3, 0.3), vz: rnd(-0.3, 0.3), life: 0.3, s0: c.s * 0.9, s1: c.s * 0.3, a0: 0.6, a1: 0, c: [0.97, 0.98, 1] });
      if (c.t >= c.T) {
        this.scene.remove(c.m); this.clumpPool.push(c.m); this.clumps.splice(i, 1);
        if (c.onLand) c.onLand(c.x, c.y, c.z);
      }
    }
  },
  // ---- falling snow ----
  _weather(scene) {
    const n = IS_MOBILE ? 900 : 1700, geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3); this.flk = [];
    for (let i = 0; i < n; i++) { pos[i * 3] = rnd(-22, 22); pos[i * 3 + 1] = rnd(0, 16); pos[i * 3 + 2] = rnd(-30, 14); this.flk.push({ v: rnd(0.7, 1.4), ph: rnd(0, TAU), a: rnd(0.3, 0.9) }); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    const sz = new Float32Array(n); for (let i = 0; i < n; i++) sz[i] = rnd(0.05, 0.13);
    geo.setAttribute('size', new THREE.BufferAttribute(sz, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: TEX.dot }, uScale: this.uScale, uOp: { value: 0.9 } },
      vertexShader: `attribute float size; uniform float uScale; varying float vF; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = clamp(size*uScale/max(0.1,-mv.z), 1.0, 64.0); vF = clamp((-mv.z-2.0)/6.0,0.0,1.0); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform sampler2D map; uniform float uOp; varying float vF; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(1.0,1.0,1.0, t.a*uOp*vF); }`,
      transparent: true, depthWrite: false
    });
    this.snowPts = new THREE.Points(geo, mat); this.snowPts.frustumCulled = false; this.snowPts.renderOrder = 6; scene.add(this.snowPts);
    this.wind = 0.6; this.center = new V3(); this.snowRate = 1;
  },
  _updWeather(dt) {
    const a = this.snowPts.geometry.attributes.position, p = a.array, c = this.center, n = this.flk.length, t = performance.now() / 1000;
    const storm = this.snowRate;
    for (let i = 0; i < n; i++) {
      const f = this.flk[i]; const o = i * 3;
      p[o + 1] -= f.v * dt * (0.9 + storm * 0.5);
      p[o] += (this.wind * (0.6 + storm) + Math.sin(t * 0.8 + f.ph) * 0.35) * dt;
      p[o + 2] += Math.cos(t * 0.6 + f.ph) * 0.25 * dt;
      if (p[o + 1] < 0) { p[o + 1] += 16; }
      const dx = p[o] - c.x, dz = p[o + 2] - c.z;
      if (dx > 22) p[o] -= 44; else if (dx < -22) p[o] += 44;
      if (dz > 14) p[o + 2] -= 44; else if (dz < -30) p[o + 2] += 44;
    }
    a.needsUpdate = true;
    this.snowPts.material.uniforms.uOp.value = 0.55 + storm * 0.35;
  }
};
