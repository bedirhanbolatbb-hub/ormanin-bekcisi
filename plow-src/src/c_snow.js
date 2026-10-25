// ---------- deformable snow heightfield ----------
function snowNormalTex() {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  const h = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N; let s = 0;
    // tileable noise: sum of periodic sines + hashed bumps
    s += Math.sin(TAU * (u * 2 + v * 1)) * 0.08 + Math.sin(TAU * (u * 3 - v * 5) + 1.3) * 0.07 + Math.sin(TAU * (u * 11 + v * 7) + 0.4) * 0.03;
    h[y * N + x] = s;
  }
  const rr = mulberry(42);
  for (let k = 0; k < 420; k++) { const cx = rr() * N, cy = rr() * N, r = 1.5 + rr() * 6, a = (rr() - 0.5) * 0.5;
    for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++) { const d = Math.hypot(x, y); if (d > r) continue; const X = ((Math.floor(cx + x) % N) + N) % N, Y = ((Math.floor(cy + y) % N) + N) % N; h[Y * N + X] += a * Math.cos(d / r * Math.PI / 2); } }
  const img = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const l = h[y * N + ((x - 1 + N) % N)], r = h[y * N + ((x + 1) % N)], d = h[((y - 1 + N) % N) * N + x], u = h[((y + 1) % N) * N + x];
    let nx = (l - r) * 1.6, ny = (d - u) * 1.6, nz = 1; const L = Math.hypot(nx, ny, nz); nx /= L; ny /= L; nz /= L;
    const o = (y * N + x) * 4; img.data[o] = (nx * 0.5 + 0.5) * 255; img.data[o + 1] = (ny * 0.5 + 0.5) * 255; img.data[o + 2] = (nz * 0.5 + 0.5) * 255; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1);
  return t;
}
const SNOW = {
  C: 0.2, X0: -24, Z0: -68, NX: 241, NZ: 681, CH: 40,
  THR: 0.05, UNIT: 0.35,
  H: null, T: null, A: null, HL: null,
  areas: [null],
  chunks: [], dirty: null, hlArea: 0,
  mat: null, uni: { uTime: { value: 0 }, uPulse: { value: 0 } },

  init() {
    const n = this.NX * this.NZ;
    this.H = new Float32Array(n); this.T = new Uint8Array(n); this.A = new Uint8Array(n);
    this.dirty = { x0: 1e9, z0: 1e9, x1: -1, z1: -1 };
  },
  ix(x) { return Math.round((x - this.X0) / this.C); },
  iz(z) { return Math.round((z - this.Z0) / this.C); },
  idx(x, z) {
    const i = this.ix(x), j = this.iz(z);
    if (i < 0 || j < 0 || i >= this.NX || j >= this.NZ) return -1;
    return j * this.NX + i;
  },
  type(x, z) { const k = this.idx(x, z); return k < 0 ? 0 : this.T[k]; },
  walk(x, z) { const k = this.idx(x, z); if (k < 0) return false; const t = this.T[k]; return t === 1 || t === 3; },
  depth(x, z) { // bilinear snow depth
    const fx = (x - this.X0) / this.C, fz = (z - this.Z0) / this.C;
    const i = Math.floor(fx), j = Math.floor(fz);
    if (i < 0 || j < 0 || i >= this.NX - 1 || j >= this.NZ - 1) return 0.4;
    const tx = fx - i, tz = fz - j, N = this.NX, H = this.H, k = j * N + i;
    return lerp(lerp(H[k], H[k + 1], tx), lerp(H[k + N], H[k + N + 1], tx), tz);
  },
  surf(x, z) { const d = this.depth(x, z); return d > 0.03 ? d - 0.02 : 0; },

  // fill helpers used by world builder. f(x,z,k) returns {t, h, a}
  paint(x0, z0, x1, z1, fn) {
    const i0 = Math.max(0, Math.ceil((Math.min(x0, x1) - this.X0) / this.C - 1e-6)), i1 = Math.min(this.NX - 1, Math.floor((Math.max(x0, x1) - this.X0) / this.C + 1e-6));
    const j0 = Math.max(0, Math.ceil((Math.min(z0, z1) - this.Z0) / this.C - 1e-6)), j1 = Math.min(this.NZ - 1, Math.floor((Math.max(z0, z1) - this.Z0) / this.C + 1e-6));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(j * this.NX + i, this.X0 + i * this.C, this.Z0 + j * this.C);
  },
  newArea(o) { o.id = this.areas.length; o.total = 0; o.cleared = 0; o.done = false; this.areas.push(o); return o; },
  finalizeAreas() {
    const first = this.areas.some(a => a && a.units0 === undefined);
    for (const a of this.areas) if (a) { a.total = 0; a.cleared = 0; if (first) a._u = 0; }
    const H = this.H, T = this.T, A = this.A, f = this.C * this.C / this.UNIT;
    for (let k = 0; k < H.length; k++) {
      if (A[k] && T[k] === 1) { const a = this.areas[A[k]]; a.total++; if (H[k] < this.THR) a.cleared++; if (first) a._u += H[k] * f; }
    }
    if (first) for (const a of this.areas) if (a && a.units0 === undefined) a.units0 = a._u;
  },
  prog(a) { return a.total ? a.cleared / a.total : 1; },

  // ---- carving: oriented rectangle brush ----
  // returns removed units; capLeft in units (Infinity ok)
  _rm: [],
  carve(cx, cz, fx, fz, hw, hl, capLeft, out) {
    const C = this.C, m = 0.07, H = this.H, T = this.T, A = this.A, N = this.NX, THR = this.THR;
    const rx = fz, rz = -fx;
    const ex = Math.abs(rx) * hw + Math.abs(fx) * hl + m, ez = Math.abs(rz) * hw + Math.abs(fz) * hl + m;
    const i0 = Math.max(1, Math.floor((cx - ex - this.X0) / C)), i1 = Math.min(N - 2, Math.ceil((cx + ex - this.X0) / C));
    const j0 = Math.max(1, Math.floor((cz - ez - this.Z0) / C)), j1 = Math.min(this.NZ - 2, Math.ceil((cz + ez - this.Z0) / C));
    let removed = 0; const capVol = capLeft * this.UNIT; let vol = 0, full = false;
    let px = 0, pz = 0, pw = 0;
    for (let j = j0; j <= j1 && !full; j++) {
      const z = this.Z0 + j * C - cz;
      for (let i = i0; i <= i1; i++) {
        const k = j * N + i; if (T[k] !== 1) continue;
        const h = H[k]; if (h <= 0) continue;
        const x = this.X0 + i * C - cx;
        const u = Math.abs(x * rx + z * rz) - hw, v = Math.abs(x * fx + z * fz) - hl;
        const d = u > v ? u : v; if (d >= m) continue;
        const f = d <= 0 ? 1 : 1 - d / m;
        let nh = f >= 0.999 ? 0 : h * (1 - f); if (nh < 0.055) nh = 0;
        let dh = h - nh; let dv = dh * C * C;
        if (vol + dv > capVol) { dv = Math.max(0, capVol - vol); dh = dv / (C * C); nh = h - dh; full = true; }
        if (dh <= 0) { if (full) break; continue; }
        vol += dv; H[k] = nh;
        if (A[k] && h >= THR && nh < THR) this.areas[A[k]].cleared++;
        px += x * dv; pz += z * dv; pw += dv;
        this._mark(i, j);
        if (full) break;
      }
    }
    // remove isolated spikes left between strokes (forgiving + no ugly 1-sample peaks)
    if (vol > 0 && !full) {
      const a0 = Math.max(1, i0 - 2), a1 = Math.min(N - 2, i1 + 2), b0 = Math.max(1, j0 - 2), b1 = Math.min(this.NZ - 2, j1 + 2);
      for (let j = b0; j <= b1; j++) for (let i = a0; i <= a1; i++) {
        const k = j * N + i; if (T[k] !== 1) continue; const h = H[k]; if (h < 0.014) continue;
        let n = 0;
        if (H[k - 1] > 0.06) n++; if (H[k + 1] > 0.06) n++; if (H[k - N] > 0.06) n++; if (H[k + N] > 0.06) n++;
        if (n > 1) continue;
        if (H[k - N - 1] > 0.06) n++; if (H[k - N + 1] > 0.06) n++; if (H[k + N - 1] > 0.06) n++; if (H[k + N + 1] > 0.06) n++;
        if (n > 2) continue;
        const dv = h * C * C; if (vol + dv > capVol) continue;
        vol += dv; H[k] = 0; if (A[k] && h >= THR) this.areas[A[k]].cleared++;
        this._mark(i, j);
      }
    }
    if (out) { out.full = full; out.cx = pw > 0 ? cx + px / pw : cx; out.cz = pw > 0 ? cz + pz / pw : cz; }
    return vol / this.UNIT;
  },
  // raise snow (storms / spills). amount in meters at center, gaussian radius r
  addSnow(cx, cz, r, amt, onlyPaved) {
    const C = this.C, N = this.NX, H = this.H, T = this.T, A = this.A, THR = this.THR;
    const i0 = Math.max(0, Math.floor((cx - r * 2 - this.X0) / C)), i1 = Math.min(N - 1, Math.ceil((cx + r * 2 - this.X0) / C));
    const j0 = Math.max(0, Math.floor((cz - r * 2 - this.Z0) / C)), j1 = Math.min(this.NZ - 1, Math.ceil((cz + r * 2 - this.Z0) / C));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = j * N + i; if (onlyPaved && T[k] !== 1) continue; if (T[k] === 2) continue;
      const dx = this.X0 + i * C - cx, dz = this.Z0 + j * C - cz;
      const w = Math.exp(-(dx * dx + dz * dz) / (r * r)); if (w < 0.02) continue;
      const h = H[k], nh = Math.min(1.4, h + amt * w);
      H[k] = nh; if (A[k] && T[k] === 1 && h < THR && nh >= THR) this.areas[A[k]].cleared--;
      this._mark(i, j);
    }
  },
  // global snowfall over paved cells
  snowfall(amt) {
    const H = this.H, T = this.T, A = this.A, THR = this.THR;
    for (let k = 0; k < H.length; k++) {
      if (T[k] !== 1) continue;
      const h = H[k], nh = Math.min(1.2, h + amt * (0.85 + 0.3 * ((k * 2654435761 >>> 0) % 1000) / 1000));
      H[k] = nh; if (A[k] && h < THR && nh >= THR) this.areas[A[k]].cleared--;
    }
    this.dirty = { x0: 0, z0: 0, x1: this.NX - 1, z1: this.NZ - 1 };
  },
  // clear every remaining sample of area (auto-finish). returns list of positions (subsampled) for fx
  clearArea(a) {
    const H = this.H, T = this.T, A = this.A, pts = [];
    let n = 0;
    for (let k = 0; k < H.length; k++) {
      if (A[k] !== a.id || T[k] !== 1) continue;
      if (H[k] > 0) {
        if (H[k] >= 0.06 && (n++ % 5 === 0)) { const i = k % this.NX, j = (k / this.NX) | 0; pts.push(this.X0 + i * this.C, this.Z0 + j * this.C, H[k]); }
        H[k] = 0; const i = k % this.NX, j = (k / this.NX) | 0; this._mark(i, j);
      }
    }
    a.cleared = a.total;
    return pts;
  },
  // nearest remaining snow sample (for bot / arrows). area optional
  nearestSnow(x, z, areaId, minH = 0.05, maxR = 80) {
    const C = this.C, N = this.NX, H = this.H, T = this.T, A = this.A;
    const ci = this.ix(x), cj = this.iz(z);
    let best = -1, bd = 1e18;
    const step = 2;
    for (let r = 0; r * C < maxR; r += 6) {
      const i0 = Math.max(0, ci - r - 6), i1 = Math.min(N - 1, ci + r + 6), j0 = Math.max(0, cj - r - 6), j1 = Math.min(this.NZ - 1, cj + r + 6);
      for (let j = j0; j <= j1; j += step) for (let i = i0; i <= i1; i += step) {
        const k = j * N + i; if (T[k] !== 1 || H[k] < minH) continue; if (areaId && A[k] !== areaId) continue;
        const d = (i - ci) * (i - ci) + (j - cj) * (j - cj); if (d < bd) { bd = d; best = k; }
      }
      if (best >= 0 && Math.sqrt(bd) < r) break;
    }
    if (best < 0) return null;
    return { x: this.X0 + (best % N) * C, z: this.Z0 + ((best / N) | 0) * C };
  },
  _mark(i, j) {
    const d = this.dirty;
    if (i < d.x0) d.x0 = i; if (i > d.x1) d.x1 = i; if (j < d.z0) d.z0 = j; if (j > d.z1) d.z1 = j;
  },
  markAll() { this.dirty = { x0: 0, z0: 0, x1: this.NX - 1, z1: this.NZ - 1 }; },
  setHighlight(areaId) {
    if (this.hlArea === areaId) return;
    const old = this.hlArea; this.hlArea = areaId;
    // rebuild hl attribute for affected chunks
    for (const ch of this.chunks) {
      if (!(ch.areas.has(old) || ch.areas.has(areaId))) continue;
      const a = ch.geo.attributes.hl.array; const N = this.NX;
      let o = 0;
      const A = this.A;
      for (let j = ch.j0; j <= ch.j1; j++) for (let i = ch.i0; i <= ch.i1; i++, o++) {
        const k = j * N + i;
        if (!(areaId && A[k] === areaId && this.T[k] === 1)) { a[o] = 0; continue; }
        const e = A[k - 1] !== areaId || A[k + 1] !== areaId || A[k - N] !== areaId || A[k + N] !== areaId || A[k - 2] !== areaId || A[k + 2] !== areaId || A[k - 2 * N] !== areaId || A[k + 2 * N] !== areaId;
        a[o] = e ? 255 : 60;
      }
      ch.geo.attributes.hl.needsUpdate = true;
    }
  },

  // ---- rendering ----
  ry(h) { return h > 0.014 ? h - 0.02 : -0.07; },
  buildMeshes(scene) {
    const CH = this.CH, N = this.NX, S = CH + 1;
    const idx = [];
    for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {
      const a = j * S + i, b = a + 1, c = a + S, d = c + 1;
      if ((i + j) & 1) idx.push(a, c, b, b, c, d); else idx.push(a, c, d, a, d, b);
    }
    const index = new THREE.BufferAttribute(new Uint16Array(idx), 1);
    const mat = this.mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.0, normalMap: snowNormalTex(), normalScale: new THREE.Vector2(0.55, 0.55) });
    const uni = this.uni;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uni.uTime; sh.uniforms.uPulse = uni.uPulse;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float hl;\nvarying float vHl;\nvarying vec3 vWP;\nvarying float vUp;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHl = hl;\nvWP = (modelMatrix * vec4(position,1.0)).xyz;\nvUp = normal.y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uPulse;\nvarying float vHl;\nvarying vec3 vWP;\nvarying float vUp;\nfloat hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}')
        .replace('#include <color_fragment>', '#include <color_fragment>')
        .replace('#include <dithering_fragment>', `#include <dithering_fragment>
          { vec2 c = floor(vWP.xz*34.0); float s = hash12(c);
            float ph = fract(s*71.3 + dot(cameraPosition.xz, vec2(0.23,0.17)) + uTime*0.15);
            float tw = smoothstep(0.988,1.0,s) * smoothstep(0.35,0.5,ph) * smoothstep(0.65,0.5,ph) * smoothstep(0.6,0.95,vUp);
            gl_FragColor.rgb += tw * 0.9;
            float eg = smoothstep(0.45,0.95,vHl); gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0,0.72,0.22), vHl*(0.1+0.1*uPulse) + eg*(0.25+0.25*uPulse)); }`);
    };
    for (let cj = 0; cj * CH < this.NZ - 1; cj++) for (let ci = 0; ci * CH < N - 1; ci++) {
      const i0 = ci * CH, j0 = cj * CH, i1 = Math.min(N - 1, i0 + CH), j1 = Math.min(this.NZ - 1, j0 + CH);
      const nv = S * S;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(nv * 3);
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
        const o = (j * S + i) * 3; pos[o] = this.X0 + Math.min(i0 + i, N - 1) * this.C; pos[o + 2] = this.Z0 + Math.min(j0 + j, this.NZ - 1) * this.C;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const uv = new Float32Array(nv * 2); for (let q = 0; q < nv; q++) { uv[q * 2] = pos[q * 3] / 3.7; uv[q * 2 + 1] = pos[q * 3 + 2] / 3.7; }
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(nv * 3), 3, true));
      geo.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(nv * 3), 3, true));
      geo.setAttribute('hl', new THREE.BufferAttribute(new Uint8Array(nv), 1, true));
      geo.setIndex(index);
      const cx = this.X0 + (i0 + CH / 2) * this.C, cz = this.Z0 + (j0 + CH / 2) * this.C;
      geo.boundingSphere = new THREE.Sphere(new V3(cx, 0.4, cz), CH * this.C * 0.75);
      const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = true; mesh.frustumCulled = true; mesh.matrixAutoUpdate = false;
      scene.add(mesh);
      const areas = new Set();
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) areas.add(this.A[j * N + i]);
      this.chunks.push({ geo, mesh, i0, j0, i1: i0 + CH, j1: j0 + CH, areas });
    }
    this.markAll(); this.flush(true);
  },
  _y: null,
  flush(all) {
    const d = this.dirty; if (d.x1 < 0) return;
    const N = this.NX, NZ = this.NZ, H = this.H, C = this.C, CH = this.CH, S = CH + 1;
    const x0 = Math.max(0, d.x0 - 2), x1 = Math.min(N - 1, d.x1 + 2), z0 = Math.max(0, d.z0 - 2), z1 = Math.min(NZ - 1, d.z1 + 2);
    this.dirty = { x0: 1e9, z0: 1e9, x1: -1, z1: -1 };
    const ry = (i, j) => { i = i < 0 ? 0 : i >= N ? N - 1 : i; j = j < 0 ? 0 : j >= NZ ? NZ - 1 : j; const h = H[j * N + i]; return h > 0.014 ? h - 0.02 : -0.07; };
    const touched = new Set();
    const ci0 = Math.floor(Math.max(0, x0 - 1) / CH), ci1 = Math.floor(Math.min(N - 1, x1) / CH), cj0 = Math.floor(Math.max(0, z0 - 1) / CH), cj1 = Math.floor(Math.min(NZ - 1, z1) / CH);
    const nCX = Math.ceil((N - 1) / CH);
    for (let cj = Math.max(0, cj0 - 1); cj <= cj1; cj++) for (let ci = Math.max(0, ci0 - 1); ci <= ci1; ci++) {
      const ch = this.chunks[cj * nCX + ci]; if (!ch) continue;
      const a0 = Math.max(x0, ch.i0), a1 = Math.min(x1, ch.i1), b0 = Math.max(z0, ch.j0), b1 = Math.min(z1, ch.j1);
      if (a0 > a1 || b0 > b1) continue;
      const pos = ch.geo.attributes.position.array, nor = ch.geo.attributes.normal.array, col = ch.geo.attributes.color.array;
      for (let j = b0; j <= b1; j++) for (let i = a0; i <= a1; i++) {
        const o = (j - ch.j0) * S + (i - ch.i0); const o3 = o * 3;
        const y = ry(i, j); pos[o3 + 1] = y;
        let nx = -(ry(i + 1, j) - ry(i - 1, j)) / (2 * C), nz = -(ry(i, j + 1) - ry(i, j - 1)) / (2 * C);
        const l = 1 / Math.sqrt(nx * nx + 1 + nz * nz);
        nor[o3] = nx * l * 127; nor[o3 + 1] = l * 127; nor[o3 + 2] = nz * l * 127;
        const avg = (ry(i + 2, j) + ry(i - 2, j) + ry(i, j + 2) + ry(i, j - 2)) * 0.25 * 0.6 + (ry(i + 5, j) + ry(i - 5, j) + ry(i, j + 5) + ry(i, j - 5)) * 0.25 * 0.4;
        let ao = 1 - clamp((avg - y) * 1.5, 0, 0.42);
        const lip = clamp((y - avg) * 0.8, 0, 0.06);
        const v = 0.985 + ((i * 73856093 ^ j * 19349663) & 255) / 255 * 0.015;
        col[o3] = clamp((lerp(0.5, 0.9, ao) + lip) * v, 0, 1) * 255;
        col[o3 + 1] = clamp((lerp(0.62, 0.925, ao) + lip) * v, 0, 1) * 255;
        col[o3 + 2] = clamp((lerp(0.84, 0.97, ao) + lip) * v, 0, 1) * 255;
      }
      touched.add(ch);
    }
    for (const ch of touched) { const a = ch.geo.attributes; a.position.needsUpdate = true; a.normal.needsUpdate = true; a.color.needsUpdate = true; }
  },

  // ---- save / load (quantized RLE) ----
  serialize() {
    const H = this.H, T = this.T, out = [];
    let last = -1, run = 0;
    const push = () => { if (run > 0) { out.push(last, run); } };
    for (let k = 0; k < H.length; k++) {
      if (T[k] !== 1) continue;
      const q = Math.min(255, Math.round(H[k] * 200));
      if (q === last && run < 65535) run++; else { push(); last = q; run = 1; }
    }
    push();
    // pack as bytes: value(1) + run(2)
    const b = new Uint8Array(out.length / 2 * 3);
    for (let i = 0, o = 0; i < out.length; i += 2, o += 3) { b[o] = out[i]; b[o + 1] = out[i + 1] & 255; b[o + 2] = out[i + 1] >> 8; }
    let s = ''; for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
    return btoa(s);
  },
  deserialize(str) {
    try {
      const s = atob(str), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
      const H = this.H, T = this.T; let k = 0;
      for (let o = 0; o + 2 < b.length; o += 3) {
        const v = b[o] / 200; let run = b[o + 1] | (b[o + 2] << 8);
        while (run > 0 && k < H.length) { if (T[k] === 1) { H[k] = v; run--; } k++; }
      }
      return true;
    } catch (e) { return false; }
  }
};
