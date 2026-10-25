// ---------- walking paths on the snow grid (crew helpers, townsfolk) ----------
const PATH = {
  CS: 0.5,
  // walkable test for a person (paved or zone ground, a little clearance)
  ok(x, z) { const r = 0.2; return SNOW.walk(x, z) && SNOW.walk(x + r, z) && SNOW.walk(x - r, z) && SNOW.walk(x, z + r) && SNOW.walk(x, z - r); },
  // breadth-first search on a coarse grid; returns waypoints [[x,z],...] ending at the target, or null
  find(x0, z0, x1, z1, ok) {
    ok = ok || ((x, z) => this.ok(x, z));
    const B = WORLD.bounds, CS = this.CS, W = Math.ceil((B.x1 - B.x0) / CS), D = Math.ceil((B.z1 - B.z0) / CS);
    if (!this._d || this._d.length !== W * D) { this._d = new Int32Array(W * D); this._ok = new Int8Array(W * D); }
    const dist = this._d, okc = this._ok; dist.fill(-1); okc.fill(0);
    const ci = x => clamp(Math.floor((x - B.x0) / CS), 0, W - 1), cj = z => clamp(Math.floor((z - B.z0) / CS), 0, D - 1);
    const cx = i => B.x0 + (i + 0.5) * CS, cz = j => B.z0 + (j + 0.5) * CS;
    const si = ci(x0), sj = cj(z0), ti = ci(x1), tj = cj(z1);
    const okAt = (c) => { if (okc[c] === 0) okc[c] = ok(cx(c % W), cz((c / W) | 0)) ? 1 : 2; return okc[c] === 1; };
    // search from the target so we can walk downhill from the start
    const q = [ti + tj * W]; dist[q[0]] = 0;
    let found = false;
    for (let h = 0; h < q.length; h++) {
      const c = q[h], i = c % W, j = (c / W) | 0;
      if (i === si && j === sj) { found = true; break; }
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + a, nj = j + b; if (ni < 0 || nj < 0 || ni >= W || nj >= D) continue;
        const nc = ni + nj * W; if (dist[nc] >= 0) continue;
        const near = Math.abs(ni - si) <= 1 && Math.abs(nj - sj) <= 1;
        if (!near && !okAt(nc)) continue;
        dist[nc] = dist[c] + 1; q.push(nc);
      }
    }
    if (!found) return null;
    // walk downhill, then pull the string (drop points we can see past)
    const pts = []; let i = si, j = sj, guard = 0;
    while ((i !== ti || j !== tj) && guard++ < 4000) {
      let bi = i, bj = j, bv = dist[i + j * W];
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + a, nj = j + b; if (ni < 0 || nj < 0 || ni >= W || nj >= D) continue; const v = dist[ni + nj * W]; if (v >= 0 && v < bv) { bv = v; bi = ni; bj = nj; } }
      if (bi === i && bj === j) break;
      i = bi; j = bj; pts.push([cx(i), cz(j)]);
    }
    pts.push([x1, z1]);
    const out = []; let ax = x0, az = z0, k = 0;
    while (k < pts.length) {
      let far = k;
      for (let m = k + 1; m < pts.length && m < k + 60; m++) if (this.clear(ax, az, pts[m][0], pts[m][1], ok)) far = m;
      out.push(pts[far]); ax = pts[far][0]; az = pts[far][1]; k = far + 1;
    }
    return out;
  },
  clear(ax, az, bx, bz, ok) {
    const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.25);
    for (let s = 1; s <= n; s++) { const t = s / n; if (!ok(lerp(ax, bx, t), lerp(az, bz, t))) return false; }
    return true;
  },
};
