// ---------- economy, jobs, save ----------
// tool ladder: every new tool is a big visible jump; upgrades are cheap and frequent
const TIERS = [
  { key: 'shovel', name: 'Shovel', kind: 'shovel', cost: 0, up: 45, pay: 1, base: [0.8, 14, 3.9] },
  { key: 'bigshovel', name: 'Big Shovel', kind: 'shovel', cost: 45, up: 220, pay: 2, base: [1.15, 22, 4.1] },
  { key: 'blower', name: 'Snow Blower', kind: 'blower', cost: 220, up: 700, pay: 3, base: [1.45, 36, 4.4] },
  { key: 'megablower', name: 'Mega Blower', kind: 'blower', cost: 700, up: 1400, pay: 5, base: [2.0, 60, 4.7] },
  { key: 'truck', name: 'Plow Truck', kind: 'truck', cost: 0, gift: true, up: 12000, pay: 8, base: [2.7, 150, 7.0], geo: 'pickup' },
  { key: 'dumpplow', name: 'Dump Plow', kind: 'truck', cost: 12000, up: 20000, pay: 12, base: [3.7, 300, 7.4], geo: 'tipper' },
  { key: 'thrower', name: 'Snow Thrower', kind: 'truck', cost: 30000, up: 50000, pay: 18, base: [4.1, 420, 7.8], geo: 'thrower', max: [3, 5, 5], labels: ['Wider blower', 'More power', 'More coins'] },
  { key: 'sleigh', name: 'Magic Sleigh', kind: 'truck', cost: 150000, up: 150000, pay: 24, base: [4.5, 520, 8.8], geo: 'sleigh', max: [3, 5, 5], labels: ['Wider blade', 'More magic', 'More coins'] },
  { key: 'zamboni', name: 'Ice Machine', kind: 'truck', cost: 450000, up: 250000, pay: 30, base: [4.3, 600, 8.0], geo: 'zamboni', max: [3, 5, 5], labels: ['Wider brush', 'More power', 'More coins'] },
  { key: 'groomer', name: 'Snow Groomer', kind: 'truck', cost: 700000, up: 400000, pay: 38, base: [5.0, 800, 7.8], geo: 'groomer', max: [3, 5, 5], labels: ['Wider tiller', 'More power', 'More coins'] },
  // chapters 6-9: each town brings one bigger machine
  { key: 'sweeper', name: 'Runway Sweeper', kind: 'truck', cost: 1500000, up: 700000, pay: 46, base: [5.4, 950, 8.2], geo: 'sweeper', max: [3, 5, 5], labels: ['Wider broom', 'More power', 'More coins'] },
  { key: 'melter', name: 'Snow Melter', kind: 'truck', cost: 4000000, up: 1600000, pay: 56, base: [5.8, 1100, 8.3], geo: 'melter', max: [3, 5, 5], labels: ['Wider intake', 'More heat', 'More coins'] },
  { key: 'jet', name: 'Jet Blower', kind: 'truck', cost: 7000000, up: 2600000, pay: 68, base: [6.2, 1300, 8.6], geo: 'jet', max: [3, 5, 5], labels: ['Wider blast', 'More thrust', 'More coins'] },
  { key: 'reindeer', name: 'Reindeer Express', kind: 'truck', cost: 8000000, up: 3000000, pay: 82, base: [6.6, 1500, 9.0], geo: 'reindeer', max: [3, 5, 5], labels: ['Wider blade', 'More magic', 'More coins'] },
];
const TIER = {}; TIERS.forEach((t, i) => { t.i = i; TIER[t.key] = t; });
// upgrades: 0 wider, 1 faster, 2 more coins
// later machines go further: 3 width levels, up to 5 power / coin levels
const UPMAX = 3, UPK = [0.06, 0.1, 0.16, 0.25, 0.36], UPM = [1.0, 0.8, 1.2];
const upMax = (key, i) => (TIER[key].max || [3, 3, 3])[i];
const UPLABELS = { shovel: ['Wider shovel', 'Faster', 'More coins'], blower: ['Wider intake', 'Faster', 'More coins'], truck: ['Wider blade', 'More power', 'More coins'] };
const UPSAY = ['WIDER!', 'FASTER!', 'MORE COINS!'];
const DONE_AT = 0.85;   // an area finishes itself at 85% (80% for the big truck jobs) -> nobody hunts for the last bits
const doneAt = a => a.doneAt || (a.lot ? DONE_AT : 0.8);   // (a very big job may finish a little sooner)
// tips per area
const TIPMIN = { rose: 25, miller: 40, apron: 10 };
const GAME = {
  coins: 0, earned: 0, time: 0, owned: { shovel: 1 }, lv: {},
  done: {}, payouts: 0, crew: 0, firstUp: false, started: false, ended: false, saveT: 0, checkT: 0, ver: 4, giftT: 0,
  chapter: 1, chapters: {}, totalTime: 0, finishT: 0, _cs: null,
  L(key) { return this.lv[key] || (this.lv[key] = [0, 0, 0]); },
  stats(key) {
    const T = TIER[key], L = this.L(key), tb = TURBO.t > 0;   // (the daily TURBO gift: double coins, a bit quicker)
    return { w: T.base[0] * (1 + 0.14 * L[0]), cap: T.base[1], spd: T.base[2] * (1 + 0.08 * L[1]) * (tb ? 1.15 : 1), pay: T.pay * (1 + 0.35 * L[2]) * (tb ? 2 : 1), kind: T.kind };
  },
  upCost(key, i) {
    const T = TIER[key], L = this.L(key)[i]; if (L >= upMax(key, i)) return Infinity;
    return Math.max(3, niceNum(T.up * UPK[L] * UPM[i]));
  },
  price() { return this.stats(PL.tool).pay * STORM.mult * DSTORM.mult() * (CH.payMul || 1) * (this.boost || 1); },
  earn(v) { this.coins += v; this.earned += v; },
  spend(v) { if (this.coins + 1e-6 < v) return false; this.coins -= v; return true; },
  // the next machine after the one you use (machines you already own come back for free, e.g. when you replay a chapter)
  nextTool() { const s = CH.shop, i = s.indexOf(PL.tool); return i >= 0 && i + 1 < s.length ? s[i + 1] : (i < 0 ? s.find(k => !this.owned[k]) || null : null); },
  // the machine this town gives you (chapter 1: the plow truck), while you do not have it yet
  giftTool() { return CH.giftTruck ? CH.shop.find(k => TIER[k].gift && !this.owned[k]) || null : null; },
  handDone() { let n = 0; for (const k of HAND_AREAS) if (this.done[k]) n++; return n; },
  // each town's own special machine arrives part-way through the chapter (so buying it is a mid-chapter highlight)
  jobsDone() { let n = 0; for (const g of GOALS) if (g.a && this.done[g.a]) n++; return n; },
  toolLocked(t) { const U = CH.unlock; if (!U || U.tool !== t || this.owned[t]) return null; const n = this.jobsDone(); return n >= U.goals ? null : { n, N: U.goals }; },
  best(kind) { let b = null; for (const t of TIERS) if (this.owned[t.key] && (kind === 'hand' ? t.kind !== 'truck' : t.kind === 'truck')) b = t.key; return b; },
  buyUp(i) {
    const t = PL.tool, c = this.upCost(t, i);
    if (!isFinite(c) || UI.shownCoins() + 1e-6 < c || !this.spend(c)) { AUD.deny(); return false; }
    this.L(t)[i]++; PL.applyTool(); PL.ensureFree(); PL.bump = 1; STREAK.heat = 1;
    AUD.buy(); this.firstUp = true;
    UI.onUpgrade(i);
    const p = PL.kind === 'truck' ? PL.truck.position : PL.kid.root.position;
    FX.sparkle(p.x, 0.6, p.z, 18, 0.8); FX.puff(p.x, 0.3, p.z, 6, 1);
    UI.floatText(this._v.set(p.x, PL.kind === 'truck' ? 3.8 : 2.2, p.z), UPSAY[i], i === 2 ? '#ffd34d' : '#7dffb0', 30, 'up');
    this.save();
    return true;
  },
  _v: new V3(),
  buyTool(t, free) {
    const T = TIER[t], had = !!this.owned[t], c = free || had ? 0 : T.cost;
    const lk = !free && this.toolLocked(t);
    if (lk) { AUD.deny(); UI.hint(T.name + ' arrives after ' + lk.N + ' jobs in this town (' + lk.n + '/' + lk.N + ')', 3); return false; }
    if (!free && !had && (T.gift || UI.shownCoins() + 1e-6 < c || !this.spend(c))) { AUD.deny(); return false; }
    this.owned[t] = 1; AUD.newTool(); AUD.buzz([30, 60, 30, 60, 70]); STREAK.heat = 1;
    PL.setTool(t, true); PL.celebrate = 1.0; PL.bump = 1;
    const p = T.kind === 'truck' ? PL.truck.position : PL.kid.root.position;
    FX.confetti(p.x, 1.5, p.z, 70); FX.sparkle(p.x, 0.8, p.z, 34, 1.5); FX.puff(p.x, 0.4, p.z, 16, 1.6);
    const sub = had ? 'Your machine is back!' : T.gift ? 'A gift from the town!' : 'x' + T.pay + ' coins!';
    UI.banner(T.name.toUpperCase() + '!', sub, t, T.gift ? 3.2 : 2.2);
    if (T.kind === 'truck') AUD.horn();
    if (!had && (!QS.has('bot') || QS.has('vid'))) CAM.heroShot(2.2);
    UI.unhint('New tool ready'); UI.refreshTools(); this.save();
    return true;
  },
  goalIdx() {
    for (let i = 0; i < GOALS.length; i++) {
      const g = GOALS[i];
      if (g.end) return i;
      if (g.tool) { if (!this.owned[g.tool]) return i; continue; }
      if (g.count) { if (g.count() < g.n) return i; continue; }
      if (g.wait) { if (!g.wait()) return i; continue; }
      if (!this.done[g.a]) return i;
    }
    return GOALS.length - 1;
  },
  update(dt) {
    // a new machine's hero shot is a little cinematic pause: the clock and the chapter wait for it
    if (CAM.hero > 0.3) return;
    if (!this.ended && !CHUI.busy()) this.time += dt;
    this.totalTime += dt;
    this.checkT -= dt;
    if (this.checkT <= 0) {
      this.checkT = 0.2;
      for (const a of SNOW.areas) {
        if (!a || a.done) continue;
        if (SNOW.prog(a) >= doneAt(a)) this.completeArea(a, false);
      }
      const g = GOALS[this.goalIdx()];
      const area = g.a ? WORLD.areaByKey[g.a] : null;
      SNOW.setHighlight(area && !area.done ? area.id : 0);
      // all driveways done -> the town hands over its plow truck
      // (also when you never bought the last hand tool: the town does not wait for that)
      if (!this.ended && this.giftTool() && this.handDone() >= HAND_AREAS.length && this.giftT <= 0) this.giftT = 2.4;
      // every job done -> the chapter's big finish, then the results
      if (!this.ended && GOALS[this.goalIdx()].end) this.finishChapter();
    }
    for (let i = LATER.length - 1; i >= 0; i--) { const L = LATER[i]; L.t -= dt; if (L.t <= 0) { LATER.splice(i, 1); try { L.fn(); } catch (e) { console.warn(e); } } }
    // a chapter's own extras must never hold up the chapter itself (the results, the next chapter)
    if (CH.update) { try { CH.update(dt); } catch (e) { if (!this._chErr) { this._chErr = 1; console.warn('chapter', e); } } }
    if (this.finishT > 0) { this.finishT -= dt; if (this.finishT <= 0) CHUI.results(); }
    if (this.giftT > 0) { this.giftT -= dt; const gt = this.giftTool(); if (this.giftT <= 0 && gt && !this.ended) { this.giftT = 0; this.buyTool(gt, true); } }
    this.saveT -= dt; if (this.saveT <= 0) { this.saveT = 8; this.save(); }
    STORM.update(dt);
    STREAK.update(dt);
    DSTORM.update(dt);
    TURBO.update(dt);
  },
  completeArea(a, silent) {
    a.done = true; this.done[a.key] = 1;
    const pts = SNOW.clearArea(a);
    if (a.lot) SNOW.paint(a.lot.drive.x0, a.lot.drive.z0, a.lot.drive.x1, a.lot.drive.z1, (k, x, z) => { if (SNOW.T[k] === 1 && SNOW.H[k] > 0) { if (!silent && SNOW.H[k] > 0.1 && Math.random() < 0.08) pts.push(x, z, SNOW.H[k]); SNOW.H[k] = 0; SNOW._mark(k % SNOW.NX, (k / SNOW.NX) | 0); } });
    const tip = niceNum(Math.max(TIPMIN[a.key] || 15, (a.units0 || 20) * this.price() * 0.5 + 10));
    if (!silent) {
      let n = 0;
      for (let i = 0; i < pts.length && n < 40; i += 3, n++) { FX.puff(pts[i], pts[i + 2] * 0.6, pts[i + 1], 2, 0.8); if (n % 2 === 0) FX.sparkle(pts[i], 0.2, pts[i + 1], 2, 0.3); }
      if (!a.quiet) { AUD.complete(); AUD.buzz([20, 50, 30]); PL.celebrate = 1.3; const p = PL.kind === 'truck' ? PL.truck.position : PL.kid.root.position; FX.confetti(p.x, 1.6, p.z, 40); }
    }
    const src = CH.onDone ? CH.onDone(a, silent) : null;
    if (!silent) {
      const pos = src || (PL.kind === 'truck' ? PL.truck.position : PL.kid.root.position);
      this.earn(tip);
      FX.coinBurst(pos.x, 1.5, pos.z, Math.min(30, 8 + Math.round(Math.log2(tip + 1) * 2)), tip, { up: 1.1 });
      UI.floatText(this._v.set(pos.x, 2.6, pos.z), '+' + fmt(tip), '#ffd34d', 34);
      if (!a.quiet) UI.banner(a.title || doneTitle(a), '+' + fmt(tip) + ' tip', a.lot ? 'house' : (a.ico || 'road'));
      // this job brought the town's special machine: announce it right after the job banner
      const U = CH.unlock;
      if (U && !this.owned[U.tool] && GOALS.some(g => g.a === a.key) && this.jobsDone() === U.goals) later(a.quiet ? 0.2 : 2.3, () => {
        const T = TIER[U.tool]; UI.banner('NEW MACHINE!', T.name + ' is here! Tap it below', T.key, 2.8); AUD.newTool(); UI.toolArrived();
      });
      this.save();
    }
  },
  // ---- chapter flow ----
  finishChapter() {
    this.ended = true; STREAK.reset(); AUD.hype = 0; CG.happy();
    const st = this.time <= CH.par[0] ? 3 : this.time <= CH.par[1] ? 2 : 1;
    const rec = this.chapters[CH.id] || (this.chapters[CH.id] = { stars: 0, best: 0 });
    this.lastStars = st; this.lastNew = st > rec.stars;
    rec.stars = Math.max(rec.stars, st); rec.best = rec.best ? Math.min(rec.best, this.time) : this.time; rec.done = 1;
    // the chapter bonus is paid (and saved) right here; the results screen only shows it flying into your counter
    const bonus = niceNum((CH.reward || 2000) * st); this.lastBonus = bonus; this.earn(bonus); UI.pending += bonus;
    DSTORM.e0 += bonus;   // (a daily storm still on counts only what its snow paid, not the chapter bonus)
    if (CH.finale) { try { CH.finale(); } catch (e) { console.warn('finale', e); } }
    if (CH.finaleCam && (!QS.has('bot') || QS.has('fcam') || QS.has('vid'))) CAM.show = { from: CH.finaleCam.from, look: CH.finaleCam.look };
    this.finishT = CH.finaleDelay || 5.5;
    this.save();
  },
  goChapter(id) {
    this.chapter = id; this._cs = null; this.done = {}; this.time = 0; this.ended = false;
    this.handoff(this.save(true));
  },
  // ---- save ----
  sid: Math.random().toString(36).slice(2, 10),
  // which of two saved games got further: coins earned only ever go up (a tie goes to the newer one)
  better(a, b) { const ea = a.earned || 0, eb = b.earned || 0; return ea > eb + 0.5 || (Math.abs(ea - eb) <= 0.5 && (a.t || 0) > (b.t || 0)); },
  save(fresh) {
    if (QS.has('nosave') || (QS.has('bot') && !QS.has('botsave'))) return;
    if (this.adopting || this.otherTabAhead()) return;
    const cs = fresh ? null : { id: CH.id, time: this.time, done: this.done, tool: PL.tool, x: PL.x, z: PL.z, h: PL.h, load: PL.load, snow: SNOW.serialize(), tr: TREASURE.list.map(o => o.found ? 1 : 0).join(''), ended: this.ended, extra: CH.save ? CH.save() : null };
    const o = { v: this.ver, coins: this.coins, earned: this.earned, total: this.totalTime, owned: this.owned, lv: this.lv, firstUp: this.firstUp, crew: this.crew || 0, chapter: this.chapter, chapters: this.chapters, cs, t: Date.now(), nc: CG.syncState(), sid: this.sid, u: CG.uid };
    const j = JSON.stringify(o);
    this._localOk = STORE.set('plowtown_v4', j);
    return j;
  },
  // moving on to another chapter reloads the page a moment after saving. On CrazyGames the account copy is sent
  // a second or more later, so the new start could still read the old copy and send the player back to the chapter
  // they just finished. The fresh save rides along in this tab and wins if it is newer.
  handoff(j) { if (!j) return; try { sessionStorage.setItem('plowtown_handoff', j); } catch (e) { if (!this._localOk) this.noStore = true; } },
  takeHandoff(o) {
    let h = null;
    try { h = JSON.parse(sessionStorage.getItem('plowtown_handoff') || 'null'); sessionStorage.removeItem('plowtown_handoff'); } catch (e) { h = null; }
    // (not one saved while the account was being held back, and never another player's)
    if (!h || h.v !== this.ver || h.nc === 2 || !(Date.now() - (h.t || 0) < 10 * 60 * 1000)) return o;
    if (h.u !== undefined && CG.uid !== undefined && h.u !== CG.uid) return o;
    if (o && !this.better(h, o)) return o;
    STORE.set('plowtown_v4', JSON.stringify(h));   // and put it back where it belongs
    return h;
  },
  // the same game open in another tab got further: this tab must not overwrite it, it loads that one instead
  otherTabAhead() {
    let cur = null; try { cur = JSON.parse(localStorage.getItem('plowtown_v4') || 'null'); } catch (e) { return false; }
    if (!cur || !cur.sid || cur.sid === this.sid || cur.v !== this.ver || cur.u !== CG.uid) return false;
    // (it must have been written after this start: what was there when we started is not another tab moving on)
    if ((cur.sid + ':' + (cur.t || 0)) === this._loc0) return false;
    if (!((cur.earned || 0) > (this.earned || 0) + 1)) return false;
    this.adopt(cur, 'tab'); return true;
  },
  // carry on from another (further) saved game: put it on this device and start again with it
  adopt(c, why) {
    if (this.adopting) return; this.adopting = true;
    try { if (c) localStorage.setItem('plowtown_v4', JSON.stringify(Object.assign({}, c, { u: CG.uid, nc: 0 }))); else localStorage.removeItem('plowtown_v4'); sessionStorage.removeItem('plowtown_handoff'); } catch (e) { }
    const f = $('chFade'); if (f) { f.innerHTML = `<div class="chname sm">${why === 'tab' ? 'Your game moved on in another tab' : 'Your saved game is here'}</div><div class="chname">Loading...</div>`; f.classList.add('on'); }
    CG.play(false);
    setTimeout(() => location.reload(), why === 'tab' ? 1600 : 900);
  },
  // before the world is built: coins, machines, crew and which chapter to play
  loadMeta() {
    let o = null;
    try { const l = JSON.parse(localStorage.getItem('plowtown_v4') || 'null'); this._loc0 = l ? (l.sid || '') + ':' + (l.t || 0) : ''; } catch (e) { this._loc0 = ''; }
    if (!QS.has('fresh') && (!QS.has('bot') || QS.has('botsave'))) {
      let loc = null; try { loc = JSON.parse(localStorage.getItem('plowtown_v4') || 'null'); } catch (e) { loc = null; }
      if (!CG.sdk) o = loc;
      else {
        let acc = null, bad = false; const v = CG.get('plowtown_v4');
        if (v != null) { try { acc = JSON.parse(v); } catch (e) { bad = true; } }
        const fits = !!loc && loc.v === this.ver;
        // nothing on the account yet: this device's game (a guest's, or this player's own) - never another player's
        if (!acc && !bad) o = fits && (loc.u == null || loc.u === CG.uid) ? loc : null;
        else {
          o = acc;
          // this device's copy got further than the account's (the last save never went up before the game closed,
          // or it was made while the SDK was missing): it wins - only ever for the same player
          const mine = fits && (bad || loc.nc === 1 || (CG.uid !== undefined && loc.u === CG.uid));
          if (mine && (!o || o.v !== this.ver || this.better(loc, o))) o = loc;
        }
        if (o && o === loc) { o.nc = 0; o.u = CG.uid; STORE.set('plowtown_v4', JSON.stringify(o)); }
      }
      o = this.takeHandoff(o);
    }
    this.loadedT = o ? (o.t || 0) : 0; this.baseU = o ? o.u : undefined;
    // coming from the old single-street version: keep everything; if Maple Lane was already saved, go straight on to chapter 2
    if (!o && !QS.has('fresh') && !QS.has('bot')) {
      try {
        const v3 = JSON.parse(STORE.get('plowtown_v3') || 'null');
        if (v3 && v3.v === 3) {
          const t = v3.time || 0, st = t <= 330 ? 3 : t <= 540 ? 2 : 1;
          o = { v: this.ver, coins: v3.coins, earned: v3.earned, total: t, owned: v3.owned, lv: v3.lv, firstUp: v3.firstUp, crew: v3.crew, chapter: v3.ended ? 2 : 1,
            chapters: v3.ended ? { 1: { stars: st, best: t, done: 1 } } : {},
            cs: v3.ended ? null : { id: 1, time: t, done: v3.done, tool: v3.tool, x: v3.x, z: v3.z, h: v3.h, load: v3.load, snow: v3.snow, tr: v3.tr, ended: false } };
          this._migrated = !!v3.ended;
        }
      } catch (e) { o = null; }
    }
    if (o && o.v === this.ver) {
      this.coins = o.coins || 0; this.earned = o.earned || 0; this.totalTime = o.total || 0; this.owned = o.owned || { shovel: 1 };
      this.lv = o.lv || {}; this.firstUp = !!o.firstUp; this.crew = o.crew || 0;
      this.chapter = o.chapter || 1; this.chapters = o.chapters || {}; this._cs = o.cs || null;
    }
    if (QS.has('ch')) { this.chapter = +QS.get('ch') || 1; if (!this._cs || this._cs.id !== this.chapter) this._cs = null; }
    // test: arrive with what you would have after the earlier chapters (machines maxed, some coins, the crew)
    if (QS.has('carry')) {
      this.coins = +QS.get('carry') || 20000; this.crew = 2; this.firstUp = true;
      for (const C of CHAPTERS) { if (C.id >= this.chapter) break; for (const k of C.shop) { this.owned[k] = 1; this.lv[k] = [0, 1, 2].map(i => upMax(k, i)); } this.chapters[C.id] = { stars: 2, best: 300, done: 1 }; }
    }
    return this.chapter;
  },
  // after the world is built: put the chapter back the way you left it (or start it fresh)
  loadChapter() {
    const o = this._cs; this._cs = null;
    if (!o || o.id !== CH.id) { this.startChapter(); return false; }
    try {
      this.time = o.time || 0; this.done = o.done || {}; this.ended = !!o.ended;
      if (o.tr) TREASURE.list.forEach((t, i) => { if (o.tr[i] === '1') { t.found = t.gone = true; t.mesh.visible = false; } });
      // first put back what the finished jobs changed in the town (open street, cars gone, the bus left its spot...),
      // so the ground is the same as when the game was saved; then the snow on top of it
      // (one chapter hook failing must not throw the whole saved game away)
      for (const a of SNOW.areas) if (a && this.done[a.key]) { try { this.completeArea(a, true); } catch (e) { console.warn('restore', a.key, e); } }
      if (CH.load && o.extra) CH.load(o.extra);
      if (o.snow) { if (!SNOW.deserialize(o.snow)) console.warn('snow save does not fit this town, fresh snow'); SNOW.finalizeAreas(); SNOW.markAll(); }
      PL.load = o.load || 0;
      PL.x = Number.isFinite(o.x) ? o.x : CH.start.x; PL.z = Number.isFinite(o.z) ? o.z : CH.start.z; PL.h = Number.isFinite(o.h) ? o.h : Math.PI;
      if (o.tool && this.owned[o.tool] && TIER[o.tool]) { PL.tool = o.tool; }
      if (PL.kind === 'truck') { if (!PL.truckFree(PL.x, PL.z, PL.h)) { const s2 = PL.findTruckSpot(PL.x, PL.z); PL.x = s2.x; PL.z = s2.z; PL.h = s2.h; } }
      else if (!PL.kidFree(PL.x, PL.z)) { PL.x = CH.start.x; PL.z = CH.start.z; }
      PL.sledX = PL.x - Math.sin(PL.h) * 1.4; PL.sledZ = PL.z - Math.cos(PL.h) * 1.4;
      PL.applyTool();
      return true;
    } catch (e) {
      // something did not fit: start the chapter over, but keep the books straight with the jobs already marked done
      console.warn('load', e); this.startChapter(); for (const a of SNOW.areas) if (a && a.done) this.done[a.key] = 1; return false;
    }
  },
  startChapter() {
    this.time = 0; this.done = {}; this.ended = false;
    const S = CH.start;
    // a chapter starts with its own first tool, or the best machine you own from this chapter's shop
    let tool = S.tool || null;
    if (!tool) { for (const k of CH.shop) if (this.owned[k]) tool = k; if (!tool) tool = CH.shop[0]; }
    if (!this.owned[tool]) this.owned[tool] = 1;
    PL.tool = tool; PL.load = 0;
    PL.x = S.x; PL.z = S.z; PL.h = S.h;
    PL.sledX = PL.x - Math.sin(PL.h) * 1.4; PL.sledZ = PL.z - Math.cos(PL.h) * 1.4;
    PL.applyTool();
    if (PL.kind === 'truck') PL.ensureFree();
    if (CH.begin) CH.begin();
  }
};
// game-time timers (pause with the game, run at the sim's speed in tests)
const LATER = [];
function later(sec, fn) { LATER.push({ t: sec, fn }); }
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

// ---------- snow streak: keep plowing without a break and every full load pays x2, x3, x4 ----------
const STREAK = {
  t: 0, heat: 0, lv: 0, mul: 1, LV: [0, 5, 14, 28], MUL: [1, 2, 3, 4], COL: ['#ffd34d', '#ffa21e', '#ff5a3c', '#d75cff'], _fx: 0, _v: new V3(),
  reset() { this.t = 0; this.heat = 0; this.lv = 0; this.mul = 1; },
  update(dt) {
    AUD.hype = this.lv;
    if (CAM.hero > 0 || CAM.intro > 0.05 || CAM.show || QS.has('nostreak')) return;
    const st = PL.stats(), on = PL.carveRate > st.w * st.spd * 0.06;
    if (on) { this.t += dt; this.heat = 1; }
    else if (this.t > 0) {
      this.heat -= dt / (this.lv ? 3.0 : 1.4);
      if (this.heat <= 0) { if (this.lv >= 2 && !STORE.get('plowtown_sl')) { STORE.set('plowtown_sl', '1'); UI.hint('Streak lost! Keep plowing to build it again', 3.5); } this.reset(); }
    }
    let lv = 0; for (let i = 1; i < this.LV.length; i++) if (this.t >= this.LV[i]) lv = i;
    const tr = PL.kind === 'truck', p = tr ? PL.truck.position : PL.kid.root.position;
    if (lv > this.lv) {
      this.lv = lv; this.mul = this.MUL[lv];
      UI.floatText(this._v.set(p.x, tr ? 4.4 : 2.5, p.z), 'STREAK x' + this.mul + '!', this.COL[lv], 40);
      const sc = lv >= 3 ? [0.9, 0.5, 1] : lv >= 2 ? [1, 0.6, 0.3] : [1, 0.85, 0.4];
      FX.sparkle(p.x, tr ? 1.6 : 0.9, p.z, 14 + lv * 8, tr ? 1.8 : 1.0, sc); FX.ring(p.x, 0.5, p.z, tr ? 2.6 : 1.3, 26 + lv * 6, sc);
      AUD.streak(lv); AUD.buzz(18 + lv * 6); UI.streakPop();
      if (lv === 1 && !STORE.get('plowtown_sh')) { STORE.set('plowtown_sh', '1'); UI.hint('Keep plowing without stopping for x2, x3, x4 coins!', 4); }
    }
    // a sparkly trail at the blade while the streak is hot
    if (this.lv >= 2 && on) {
      this._fx -= dt;
      if (this._fx <= 0) {
        this._fx = 0.06; const fx = Math.sin(PL.h), fz = Math.cos(PL.h), d = tr ? PL.geo.carve : 0.7;
        FX.sparkle(p.x + fx * d, 0.35, p.z + fz * d, tr ? 2 : 1, tr ? 1.1 : 0.4, this.lv >= 3 ? [0.92, 0.55, 1] : [1, 0.78, 0.35]);
      }
    }
  }
};
// ---------- daily gift: come back tomorrow for coins (bigger on a run of days) ----------
const DAILY = {
  day(off) { const d = new Date(); d.setDate(d.getDate() - (off || 0)); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); },
  check() {
    if (QS.has('bot') || QS.has('nodaily')) return 0;
    const t = this.day(), last = STORE.get('plowtown_day'), n = +(STORE.get('plowtown_dayn') || 0);
    if (last === t) return 0;
    // the device clock was set back: no gift (and the day stays) until the real date passes that day again
    if (last && this.num(last) > this.num(t)) return 0;
    const run = last === this.day(1) ? Math.min(n + 1, 7) : 1;
    STORE.set('plowtown_day', t); STORE.set('plowtown_dayn', String(run));
    return last ? run : 0;      // the very first visit only remembers the day
  },
  num(s) { const m = /^(\d+)-(\d+)-(\d+)$/.exec(s || ''); return m ? Math.round(new Date(+m[1], +m[2] - 1, +m[3]).getTime() / 86400000) : -1; },
  // the gift is paid (and saved) the moment the day is counted; it flies into your counter a little later
  // (and a few minutes of TURBO: 3 minutes, one more for every day in a row, up to 8)
  pay(run) {
    const v = niceNum((CH.reward || 2000) * (0.15 + 0.1 * run)); this.v = (this.v || 0) + v; GAME.earn(v); UI.pending += v;
    this.tb = 60 * Math.min(8, 2 + run); TURBO.add(this.tb);
    GAME.save(); PCLOG.ev('pc_daily', { run: String(run) });
  },
  give(run) {
    const v = this.v || 0; if (!v) return; this.v = 0;
    for (let i = 0; i < 18; i++) setTimeout(() => UI.flyCoin(null, v / 18), 300 + i * 45);
    UI.banner('DAILY GIFT!', '+' + fmt(v) + ' coins + TURBO ' + Math.round((this.tb || 180) / 60) + ' min', 'turbo', 3.2);
    AUD.bigWin && AUD.bigWin(); GAME.save();
    setTimeout(() => UI.hint(run > 1 ? 'Day ' + run + ' in a row! TURBO: double coins while you plow' : 'TURBO: double coins while you plow!', 4.5), 3400);
  },
};
// ---------- snowstorms (endless loop after the street is saved) ----------
const STORM = {
  phase: 'idle', t: 0, next: 45, mult: 1, multT: 0, acc: 0,
  update(dt) {
    if (!GAME.ended) return;
    if (DSTORM.st === 'fall' || DSTORM.st === 'rush') return;   // (the daily storm has the sky now)
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
