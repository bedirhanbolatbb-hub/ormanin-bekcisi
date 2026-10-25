// ---------- economy, jobs, save ----------
// tool ladder: every new tool is a big visible jump; upgrades are cheap and frequent
const TIERS = [
  { key: 'shovel', name: 'Shovel', kind: 'shovel', cost: 0, pay: 1, base: [0.72, 20, 3.8] },
  { key: 'bigshovel', name: 'Big Shovel', kind: 'shovel', cost: 45, pay: 2, base: [1.1, 34, 4.0] },
  { key: 'blower', name: 'Snow Blower', kind: 'blower', cost: 220, pay: 3, base: [1.3, 60, 4.3] },
  { key: 'megablower', name: 'Mega Blower', kind: 'blower', cost: 700, pay: 5, base: [1.9, 110, 4.6] },
  { key: 'truck', name: 'Plow Truck', kind: 'truck', cost: 1400, pay: 8, base: [2.7, 260, 7.0], geo: 'pickup' },
  { key: 'dumpplow', name: 'Dump Plow', kind: 'truck', cost: 7000, pay: 12, base: [3.7, 560, 7.4], geo: 'tipper' },
  { key: 'groomer', name: 'Snow Groomer', kind: 'truck', cost: 14000, pay: 20, base: [4.6, 1400, 7.0], geo: 'groomer' },
];
const TIER = {}; TIERS.forEach((t, i) => { t.i = i; TIER[t.key] = t; });
const UPMAX = 3, UPK = [0.06, 0.1, 0.16], UPM = [1.0, 0.8, 1.2];
const UPLABELS = { shovel: ['Wider shovel', 'Bigger sled', 'Faster'], blower: ['Wider intake', 'Bigger sled', 'Faster'], truck: ['Wider blade', 'Bigger load', 'More power'] };
const UPSAY = ['WIDER!', 'BIGGER!', 'FASTER!'];
// tips per area
const TIPMIN = { rose: 25, miller: 40, apron: 10 };
const GOALS = [
  { a: 'rose', t: "Clear Grandma Rose's driveway", ico: 'house' },
  { a: 'miller', t: "Dig out the Millers' car", ico: 'car' },
  { tool: 'blower', t: 'Get the Snow Blower', ico: 'blower' },
  { a: 'walkW1', t: 'Clear the west sidewalk', ico: 'walk' },
  { a: 'hale', t: "Clear Mr. Hale's driveway", ico: 'house' },
  { a: 'walkE1', t: 'Clear the east sidewalk', ico: 'walk' },
  { a: 'park', t: "Free the Parks' camper", ico: 'car' },
  { a: 'lina', t: "Free Lina's ice cream van", ico: 'car' },
  { tool: 'truck', t: 'Get the Plow Truck', ico: 'truck' },
  { a: 'street1', t: 'Plow Maple Lane (south)', ico: 'road' },
  { a: 'walkW2', t: 'Clear the north-west sidewalk', ico: 'walk' },
  { a: 'walkE2', t: 'Clear the north-east sidewalk', ico: 'walk' },
  { a: 'street2', t: 'Plow Maple Lane (north)', ico: 'road' },
  { a: 'ortega', t: "Help the Ortegas", ico: 'house' },
  { a: 'tom', t: "Clear Old Tom's path", ico: 'house' },
  { a: 'north', t: 'Open the bakery', ico: 'shop' },
  { a: 'plaza', t: 'Light up the town square', ico: 'tree' },
  { end: true, t: 'Maple Lane is saved!', ico: 'star' },
];
const DONE_LINES = {
  rose: ['Bless you, dear!', 'My hip thanks you!'], miller: ['Our car is free!', 'You rock!'], hale: ['Splendid work!'], park: ['Road trip time!'],
  lina: ['Free ice cream later!'], ortega: ['¡Gracias!'], tom: ['Back in my day...', 'Good job, kid.'],
};

const GAME = {
  coins: 0, earned: 0, time: 0, owned: { shovel: 1 }, lv: {},
  done: {}, dumps: 0, firstFull: false, firstUp: false, started: false, ended: false, saveT: 0, checkT: 0, ver: 2,
  L(key) { return this.lv[key] || (this.lv[key] = [0, 0, 0]); },
  stats(key) {
    const T = TIER[key], L = this.L(key);
    return { w: T.base[0] * (1 + 0.14 * L[0]), cap: T.base[1] * Math.pow(1.45, L[1]), spd: T.base[2] * (1 + 0.08 * L[2]), pay: T.pay, kind: T.kind };
  },
  upCost(key, i) {
    const T = TIER[key], L = this.L(key)[i]; if (L >= UPMAX) return Infinity;
    const nx = TIERS[T.i + 1], ref = nx ? nx.cost : T.cost * 2.5;
    return Math.max(3, niceNum(ref * UPK[L] * UPM[i]));
  },
  price() { return TIER[PL.tool].pay * STORM.mult; },
  earn(v) { this.coins += v; this.earned += v; },
  spend(v) { if (this.coins + 1e-6 < v) return false; this.coins -= v; return true; },
  nextTool() { for (const t of TIERS) if (!this.owned[t.key]) return t.key; return null; },
  best(kind) { let b = null; for (const t of TIERS) if (this.owned[t.key] && (kind === 'hand' ? t.kind !== 'truck' : t.kind === 'truck')) b = t.key; return b; },
  buyUp(i) {
    const t = PL.tool, c = this.upCost(t, i);
    if (!isFinite(c) || UI.shownCoins() + 1e-6 < c || !this.spend(c)) { AUD.deny(); return false; }
    this.L(t)[i]++; PL.applyTool(); PL.bump = 1;
    AUD.buy(); this.firstUp = true;
    UI.onUpgrade(i);
    const p = PL.kind === 'truck' ? PL.truck.position : PL.kid.root.position;
    FX.sparkle(p.x, 0.6, p.z, 18, 0.8); FX.puff(p.x, 0.3, p.z, 6, 1);
    UI.floatText(this._v.set(p.x, PL.kind === 'truck' ? 3.8 : 2.2, p.z), UPSAY[i], '#7dffb0', 30);
    this.save();
    return true;
  },
  _v: new V3(),
  buyTool(t) {
    const T = TIER[t], c = T.cost;
    if (UI.shownCoins() + 1e-6 < c || !this.spend(c)) { AUD.deny(); return false; }
    this.owned[t] = 1; AUD.newTool();
    PL.setTool(t, true); PL.celebrate = 1.0; PL.bump = 1;
    const p = T.kind === 'truck' ? PL.truck.position : PL.kid.root.position;
    FX.confetti(p.x, 1.5, p.z, 70); FX.sparkle(p.x, 0.8, p.z, 34, 1.5); FX.puff(p.x, 0.4, p.z, 16, 1.6);
    const prev = TIERS[T.i - 1];
    const sub = T.kind === 'truck' && (!prev || prev.kind !== 'truck') ? 'Plow the whole street!' : 'x' + T.pay + ' coins per load!';
    UI.banner(T.name.toUpperCase() + '!', sub, t);
    if (T.kind === 'truck') AUD.horn();
    UI.refreshTools(); this.save();
    return true;
  },
  goalIdx() {
    for (let i = 0; i < GOALS.length; i++) {
      const g = GOALS[i];
      if (g.end) return i;
      if (g.tool) { if (!this.owned[g.tool]) return i; continue; }
      if (!this.done[g.a]) return i;
    }
    return GOALS.length - 1;
  },
  update(dt) {
    this.time += dt;
    this.checkT -= dt;
    if (this.checkT <= 0) {
      this.checkT = 0.2;
      for (const a of SNOW.areas) {
        if (!a || a.done) continue;
        if (SNOW.prog(a) >= 0.95) this.completeArea(a, false);
      }
      const gi = this.goalIdx(); const g = GOALS[gi];
      let area = g.a ? WORLD.areaByKey[g.a] : null;
      if (g.tool) for (let j = gi + 1; j < GOALS.length && !area; j++) if (GOALS[j].a && !this.done[GOALS[j].a]) area = WORLD.areaByKey[GOALS[j].a];
      SNOW.setHighlight(area && !area.done ? area.id : 0);
      // tool advice (once per goal)
      if (area && !area.done && this._advised !== gi) {
        let adv = null, want = null;
        if (area.lot && PL.kind === 'truck') { want = this.best('hand'); adv = 'Driveways need the ' + TIER[want].name + '! Tap it on the left'; }
        else if (!area.lot && this.best('truck') && PL.kind !== 'truck' && area.total > 1500) { want = this.best('truck'); adv = 'The ' + TIER[want].name + ' is much faster here!'; }
        if (adv) { this._advised = gi; UI.hint(adv, 5); UI.pulseTool(want); }
      }
    }
    this.saveT -= dt; if (this.saveT <= 0) { this.saveT = 8; this.save(); }
    STORM.update(dt);
  },
  completeArea(a, silent) {
    a.done = true; this.done[a.key] = 1;
    const pts = SNOW.clearArea(a);
    if (a.lot) SNOW.paint(a.lot.drive.x0, a.lot.drive.z0, a.lot.drive.x1, a.lot.drive.z1, (k, x, z) => { if (SNOW.T[k] === 1 && SNOW.H[k] > 0) { if (!silent && SNOW.H[k] > 0.1 && Math.random() < 0.08) pts.push(x, z, SNOW.H[k]); SNOW.H[k] = 0; SNOW._mark(k % SNOW.NX, (k / SNOW.NX) | 0); } });
    const tip = niceNum(Math.max(TIPMIN[a.key] || 15, (a.units0 || 20) * this.price() * 0.5 + 10));
    if (!silent) {
      let n = 0;
      for (let i = 0; i < pts.length && n < 40; i += 3, n++) { FX.puff(pts[i], pts[i + 2] * 0.6, pts[i + 1], 2, 0.8); if (n % 2 === 0) FX.sparkle(pts[i], 0.2, pts[i + 1], 2, 0.3); }
      if (a.key !== 'apron') { AUD.complete(); PL.celebrate = 1.3; const p = PL.kind === 'truck' ? PL.truck.position : PL.kid.root.position; FX.confetti(p.x, 1.6, p.z, 40); }
    }
    let src = null;
    if (a.lot) {
      const H = a.lot.house; H.litT = 1; if (silent) { H.lit = 1; applyLit(H, 1); }
      src = H.door;
      if (!silent) LIFE.resident(a.lot, DONE_LINES[a.key] ? DONE_LINES[a.key][(Math.random() * DONE_LINES[a.key].length) | 0] : 'Thank you!');
      const car = WORLD.cars.find(c => c.lot === a.lot);
      if (car) LIFE.freeCar(car, silent);
    }
    if (a.key === 'north') { WORLD.bakery.litT = 1; if (silent) { WORLD.bakery.lit = 1; applyLit(WORLD.bakery, 1); } src = WORLD.bakery.door; if (!silent) LIFE.baker(); }
    if (a.key === 'plaza') { WORLD.tree.lit = silent ? 1 : 0.001; if (!silent) LIFE.finale(); }
    if ((a.key === 'street1' || a.key === 'street2') && this.done.street1 && this.done.street2) LIFE.streetOpen(silent);
    if (!silent) {
      const pos = src || (PL.kind === 'truck' ? PL.truck.position : PL.kid.root.position);
      this.earn(tip);
      FX.coinBurst(pos.x, 1.5, pos.z, Math.min(30, 8 + Math.round(Math.log2(tip + 1) * 2)), tip, { up: 1.1 });
      UI.floatText(this._v.set(pos.x, 2.6, pos.z), '+' + fmt(tip), '#ffd34d', 34);
      if (a.key !== 'apron') UI.banner(doneTitle(a), '+' + fmt(tip) + ' tip', a.lot ? 'house' : 'road');
      this.save();
    }
  },
  onDump(amt) { this.dumps++; },
  // ---- save ----
  save() {
    if (QS.has('nosave') || QS.has('bot')) return;
    const o = { v: this.ver, coins: this.coins, earned: this.earned, time: this.time, owned: this.owned, lv: this.lv, done: this.done, tool: PL.tool, x: PL.x, z: PL.z, h: PL.h, loads: PL.loads, snow: SNOW.serialize(), tr: TREASURE.list.map(o => o.found ? 1 : 0).join(''), firstUp: this.firstUp, ended: this.ended, t: Date.now() };
    STORE.set('plowtown_v2', JSON.stringify(o));
  },
  load() {
    if (QS.has('fresh') || QS.has('bot')) return false;
    const s = STORE.get('plowtown_v2'); if (!s) return false;
    try {
      const o = JSON.parse(s); if (o.v !== this.ver) return false;
      this.coins = o.coins || 0; this.earned = o.earned || 0; this.time = o.time || 0; this.owned = o.owned || { shovel: 1 };
      this.lv = o.lv || {};
      this.done = o.done || {}; this.firstUp = !!o.firstUp; this.ended = !!o.ended;
      if (o.snow) { SNOW.deserialize(o.snow); SNOW.finalizeAreas(); SNOW.markAll(); }
      if (o.tr) TREASURE.list.forEach((t, i) => { if (o.tr[i] === '1') { t.found = t.gone = true; t.mesh.visible = false; } });
      for (const a of SNOW.areas) if (a && this.done[a.key]) this.completeArea(a, true);
      PL.loads = o.loads || { sled: 0, truck: 0 };
      PL.x = o.x; PL.z = o.z; PL.h = o.h || Math.PI;
      if (o.tool && this.owned[o.tool] && TIER[o.tool]) { PL.tool = o.tool; }
      if (PL.kind === 'truck') { if (!PL.truckFree(PL.x, PL.z, PL.h)) { const s2 = PL.findTruckSpot(PL.x, PL.z); PL.x = s2.x; PL.z = s2.z; PL.h = s2.h; } }
      else if (!PL.kidFree(PL.x, PL.z)) { PL.x = -6.0; PL.z = 46.4; }
      PL.sledX = PL.x - Math.sin(PL.h) * 1.4; PL.sledZ = PL.z - Math.cos(PL.h) * 1.4;
      PL.applyTool();
      return true;
    } catch (e) { console.warn('load', e); return false; }
  }
};
function niceNum(v) { if (v < 100) return Math.round(v); if (v < 1000) return Math.round(v / 5) * 5; if (v < 10000) return Math.round(v / 50) * 50; return Math.round(v / 500) * 500; }
function doneTitle(a) {
  if (a.lot) return a.lot.car ? 'CAR DUG OUT!' : 'DRIVEWAY CLEAR!';
  if (a.key.startsWith('walk')) return 'SIDEWALK CLEAR!';
  if (a.key.startsWith('street')) return 'ROAD PLOWED!';
  if (a.key === 'north') return 'BAKERY OPEN!';
  if (a.key === 'plaza') return 'TOWN SQUARE!';
  return 'CLEAR!';
}
function applyLit(H, k) {
  for (const m of H.wins) {
    const L = m.userData.lit; if (!L) continue;
    m.color.setRGB(lerp(0.16, L.color.r, k), lerp(0.2, L.color.g, k), lerp(0.27, L.color.b, k));
    m.emissive.copy(L.emissive); m.emissiveIntensity = 1.6 * k;
  }
  if (H.pool) H.pool.material.opacity = 0;
}

// ---------- snowstorms (endless loop after the street is saved) ----------
const STORM = {
  phase: 'idle', t: 0, next: 45, mult: 1, multT: 0, acc: 0,
  update(dt) {
    if (!GAME.ended) return;
    if (this.phase === 'idle') {
      this.next -= dt;
      if (this.next <= 0) { this.phase = 'storm'; this.t = 0; this.acc = 0; UI.banner('SNOWSTORM!', 'Fresh snow is falling...', 'star', 2.6); AUD.firework && AUD.thump(); }
    } else if (this.phase === 'storm') {
      this.t += dt; this.acc += dt;
      FX.snowRate = damp(FX.snowRate, 3.2, 1.5, dt); FX.wind = damp(FX.wind, 2.2, 1, dt);
      if (this.acc >= 1.5) { this.acc = 0; SNOW.snowfall(0.034); }
      if (this.t >= 12) { this.phase = 'bonus'; this.mult = 2; this.multT = 90; UI.banner('DOUBLE COINS!', 'Plow the fresh snow for 2x coins', 'star', 2.6); }
    } else if (this.phase === 'bonus') {
      FX.snowRate = damp(FX.snowRate, 1, 0.8, dt); FX.wind = damp(FX.wind, 0.6, 0.8, dt);
      this.multT -= dt;
      if (this.multT <= 0) { this.mult = 1; this.phase = 'idle'; this.next = 100; UI.toast('Next storm is on its way...'); }
    }
  }
};
