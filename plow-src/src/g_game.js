// ---------- economy, jobs, save ----------
const TOOLS = {
  shovel: { name: 'Shovel', cost: 0, max: 4, base: [0.62, 12, 3.7], inc: [0.1, 1.36, 0.24], uc: [[12, 1.6], [8, 1.55], [15, 1.6]], labels: ['Wider shovel', 'Bigger sled', 'Faster'] },
  blower: { name: 'Snow Blower', cost: 100, max: 5, base: [1.05, 40, 4.1], inc: [0.13, 1.35, 0.27], uc: [[40, 1.5], [30, 1.45], [50, 1.5]], labels: ['Wider blower', 'Bigger sled', 'Faster'] },
  truck: { name: 'Plow Truck', cost: 300, max: 6, base: [2.6, 140, 6.8], inc: [0.22, 1.35, 0.45], uc: [[150, 1.5], [110, 1.45], [170, 1.5]], labels: ['Wider blade', 'Bigger load', 'More power'] },
};
const TOOL_ORDER = ['shovel', 'blower', 'truck'];
const MAXLV = 6;
// tips per area
const TIPS = { rose: 30, miller: 45, hale: 70, park: 90, lina: 110, ortega: 130, tom: 150, walkW1: 40, walkE1: 45, walkW2: 50, walkE2: 55, street1: 200, street2: 250, north: 300, plaza: 500, apron: 10 };
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
  { a: 'ortega', t: "Help the Ortegas", ico: 'house', tool: null, hand: true },
  { a: 'tom', t: "Clear Old Tom's path", ico: 'house', hand: true },
  { a: 'north', t: 'Open the bakery', ico: 'shop' },
  { a: 'plaza', t: 'Light up the town square', ico: 'tree' },
  { end: true, t: 'Maple Lane is saved!', ico: 'star' },
];
const DONE_LINES = {
  rose: ['Bless you, dear!', 'My hip thanks you!'], miller: ['Our car is free!', 'You rock!'], hale: ['Splendid work!'], park: ['Road trip time!'],
  lina: ['Free ice cream later!'], ortega: ['¡Gracias!'], tom: ['Back in my day...', 'Good job, kid.'],
};

const GAME = {
  coins: 0, earned: 0, time: 0, owned: { shovel: 1 }, lv: { shovel: [0, 0, 0], blower: [0, 0, 0], truck: [0, 0, 0] },
  done: {}, dumps: 0, firstFull: false, firstUp: false, started: false, ended: false, saveT: 0, checkT: 0, ver: 1,
  stats(t) {
    const T = TOOLS[t], L = this.lv[t];
    return { w: T.base[0] + T.inc[0] * L[0], cap: T.base[1] * Math.pow(T.inc[1], L[1]), spd: T.base[2] + T.inc[2] * L[2] };
  },
  upCost(t, i) { const L = this.lv[t][i]; if (L >= TOOLS[t].max) return Infinity; const [b, m] = TOOLS[t].uc[i]; return niceNum(b * Math.pow(m, L)); },
  price() { return STORM.mult; },
  earn(v) { this.coins += v; this.earned += v; },
  spend(v) { if (this.coins + 1e-6 < v) return false; this.coins -= v; return true; },
  nextTool() { for (const t of TOOL_ORDER) if (!this.owned[t]) return t; return null; },
  buyUp(i) {
    const t = PL.tool, c = this.upCost(t, i);
    if (!isFinite(c) || UI.shownCoins() + 1e-6 < c || !this.spend(c)) { AUD.deny(); return false; }
    this.lv[t][i]++; PL.applyTool();
    AUD.buy(); this.firstUp = true;
    UI.onUpgrade(i);
    const p = t === 'truck' ? PL.truck.position : PL.kid.root.position;
    FX.sparkle(p.x, 0.6, p.z, 18, 0.8); FX.puff(p.x, 0.3, p.z, 6, 1);
    this.save();
    return true;
  },
  buyTool(t) {
    const c = TOOLS[t].cost;
    if (UI.shownCoins() + 1e-6 < c || !this.spend(c)) { AUD.deny(); return false; }
    this.owned[t] = 1; AUD.newTool();
    PL.setTool(t, true); PL.celebrate = 1.0;
    const p = t === 'truck' ? PL.truck.position : PL.kid.root.position;
    FX.confetti(p.x, 1.5, p.z, 60); FX.sparkle(p.x, 0.8, p.z, 30, 1.5); FX.puff(p.x, 0.4, p.z, 16, 1.6);
    UI.banner(TOOLS[t].name.toUpperCase() + '!', t === 'truck' ? 'Plow the whole street!' : 'Clears 2x faster', 'tool');
    if (t === 'truck') AUD.horn();
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
      const area = g.a ? WORLD.areaByKey[g.a] : null;
      SNOW.setHighlight(area && !area.done ? area.id : 0);
      // tool advice (once per goal)
      if (area && !area.done && this._advised !== gi) {
        let adv = null, want = null;
        if (area.lot && PL.tool === 'truck') { want = this.owned.blower ? 'blower' : 'shovel'; adv = 'Driveways need the ' + TOOLS[want].name + '! Tap it on the left'; }
        else if (!area.lot && this.owned.truck && PL.tool !== 'truck' && area.total > 1500) { want = 'truck'; adv = 'The Plow Truck is much faster here!'; }
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
    const tip = TIPS[a.key] || 10;
    if (!silent) {
      let n = 0;
      for (let i = 0; i < pts.length && n < 40; i += 3, n++) { FX.puff(pts[i], pts[i + 2] * 0.6, pts[i + 1], 2, 0.8); if (n % 2 === 0) FX.sparkle(pts[i], 0.2, pts[i + 1], 2, 0.3); }
      if (a.key !== 'apron') { AUD.complete(); PL.celebrate = 1.3; const p = PL.tool === 'truck' ? PL.truck.position : PL.kid.root.position; FX.confetti(p.x, 1.6, p.z, 40); }
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
      const pos = src || (PL.tool === 'truck' ? PL.truck.position : PL.kid.root.position);
      this.earn(tip);
      FX.coinBurst(pos.x, 1.5, pos.z, Math.min(30, 6 + Math.round(tip / 6)), tip, { up: 1.1 });
      if (a.key !== 'apron') UI.banner(doneTitle(a), '+' + fmt(tip) + ' tip', a.lot ? 'house' : 'road');
      this.save();
    }
  },
  onDump(amt) { this.dumps++; },
  // ---- save ----
  save() {
    if (QS.has('nosave') || QS.has('bot')) return;
    const o = { v: this.ver, coins: this.coins, earned: this.earned, time: this.time, owned: this.owned, lv: this.lv, done: this.done, tool: PL.tool, x: PL.x, z: PL.z, h: PL.h, loads: PL.loads, snow: SNOW.serialize(), firstUp: this.firstUp, ended: this.ended, t: Date.now() };
    STORE.set('plowtown_v1', JSON.stringify(o));
  },
  load() {
    if (QS.has('fresh') || QS.has('bot')) return false;
    const s = STORE.get('plowtown_v1'); if (!s) return false;
    try {
      const o = JSON.parse(s); if (o.v !== this.ver) return false;
      this.coins = o.coins || 0; this.earned = o.earned || 0; this.time = o.time || 0; this.owned = o.owned || { shovel: 1 };
      for (const t of TOOL_ORDER) if (o.lv && o.lv[t]) this.lv[t] = o.lv[t];
      this.done = o.done || {}; this.firstUp = !!o.firstUp; this.ended = !!o.ended;
      if (o.snow) { SNOW.deserialize(o.snow); SNOW.finalizeAreas(); SNOW.markAll(); }
      for (const a of SNOW.areas) if (a && this.done[a.key]) this.completeArea(a, true);
      PL.loads = o.loads || { sled: 0, truck: 0 };
      PL.x = o.x; PL.z = o.z; PL.h = o.h || Math.PI;
      if (o.tool && this.owned[o.tool]) { PL.tool = o.tool; }
      if (PL.tool === 'truck') { if (!PL.truckFree(PL.x, PL.z, PL.h)) { const s2 = PL.findTruckSpot(PL.x, PL.z); PL.x = s2.x; PL.z = s2.z; PL.h = s2.h; } }
      else if (!PL.kidFree(PL.x, PL.z)) { PL.x = -2.6; PL.z = 47.8; }
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
      if (this.t >= 12) { this.phase = 'bonus'; this.mult = 2; this.multT = 90; UI.banner('DOUBLE COINS!', 'Plow the fresh snow for 2x coins', 'truck', 2.6); }
    } else if (this.phase === 'bonus') {
      FX.snowRate = damp(FX.snowRate, 1, 0.8, dt); FX.wind = damp(FX.wind, 0.6, 0.8, dt);
      this.multT -= dt;
      if (this.multT <= 0) { this.mult = 1; this.phase = 'idle'; this.next = 100; UI.toast('Next storm is on its way...'); }
    }
  }
};
