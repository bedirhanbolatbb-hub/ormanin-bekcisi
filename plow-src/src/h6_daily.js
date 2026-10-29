// ---------- reasons to come back: the daily storm and the turbo gift ----------
// (the icons join the game's icon set at start-up: that set is made further down the script)
const DAILY_ICONS = {
  storm: '<svg viewBox="0 0 40 40"><path d="M10.5 25.5h19a6.2 6.2 0 000-12.4 8.4 8.4 0 00-15.8-2.6 6.6 6.6 0 00-3.2 15z" fill="#fff"/><circle cx="13" cy="31" r="2" fill="#dff0ff"/><circle cx="20" cy="34" r="2" fill="#dff0ff"/><circle cx="27" cy="31" r="2" fill="#dff0ff"/></svg>',
  turbo: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#fff6d2"/><path d="M23 6L11 23h9l-3 11 13-18h-9z" fill="#ff8a1e" stroke="#c8650a" stroke-width="1.8" stroke-linejoin="round"/></svg>',
};
function dailyIcons() { Object.assign(ICONS, DAILY_ICONS); }

// turbo: the daily gift. For a few minutes of plowing every load pays double and the machine is a bit quicker
// (any machine, any chapter). The clock only runs while you drive.
const TURBO = {
  t: 0, _s: 0, _fx: 0,
  load() {
    dailyIcons(); this.t = QS.has('bot') ? 0 : Math.max(0, Math.min(900, +(STORE.get('plowtown_tb') || 0) || 0));
    addEventListener('visibilitychange', () => { if (document.hidden && this.t > 0) this.save(); });
  },
  on() { return this.t > 0; },
  add(sec) { this.t = Math.min(900, this.t + sec); this.save(); this.ui(); },
  save() { STORE.set('plowtown_tb', String(Math.round(this.t))); },
  update(dt) {
    if (this.t <= 0) return;
    // it runs while you play (not under a card, not while the camera shows a new machine, not while you stand still)
    if (CHUI.busy() || CAM.hero > 0.3 || CAM.intro > 0.05 || document.hidden || PL.moveAmt < 0.05) return;
    this.t -= dt; this._s -= dt;
    if (this._s <= 0) { this._s = 10; this.save(); }
    if (this.t <= 0) {
      this.t = 0; this.save();
      UI.toast('Turbo is over. A new gift waits tomorrow!');
    }
    this.ui();
    // a golden trail at the blade while it runs
    if (PL.moveAmt > 0.2) {
      this._fx -= dt;
      if (this._fx <= 0) {
        this._fx = 0.09; const tr = PL.kind === 'truck', p = tr ? PL.truck.position : PL.kid.root.position, d = tr ? PL.geo.carve : 0.7;
        FX.sparkle(p.x + Math.sin(PL.h) * d, 0.4, p.z + Math.cos(PL.h) * d, tr ? 2 : 1, tr ? 1.2 : 0.45, [1, 0.82, 0.3]);
      }
    }
  },
  ui() {
    const el = $('turbo'); if (!el) return;
    if (this.t <= 0) { if (el._on) { el.classList.remove('on'); el._on = 0; } return; }
    if (!el._on) { el.classList.add('on'); el._on = 1; if (!el._ini) { el._ini = 1; el.querySelector('.tb-ico').innerHTML = ICONS.turbo; } }
    const s = Math.ceil(this.t), txt = 'TURBO x2 · ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    if (el._t !== txt) { el.querySelector('b').textContent = txt; el._t = txt; }
  },
};

// the daily storm: once a day, fresh snow falls on the streets you already cleared, and for a minute or so
// every load pays x3 (or x4). Each day brings another kind of storm.
const DSTORM = {
  st: 'off', t: 0, acc: 0, e0: 0, _chk: 0, _hinted: 0, _calm: 0,
  FALL: 6, STEP: 0.5,
  // depth: how much fresh snow falls in all (meters)
  KINDS: [
    { key: 'blizzard', name: 'BLIZZARD', mult: 3, dur: 75, depth: 0.34 },
    { key: 'gold', name: 'GOLDEN SNOW', mult: 4, dur: 70, depth: 0.3 },
    { key: 'mega', name: 'MEGA STORM', mult: 3, dur: 100, depth: 0.42 },
  ],
  kind(off) { const n = DAILY.num(DAILY.day()) + (off || 0); return this.KINDS[((n % 3) + 3) % 3]; },
  init() {
    dailyIcons();
    if (QS.has('bot') || QS.has('nodaily')) { this.st = 'off'; return; }
    this.st = STORE.get('plowtown_ds') === DAILY.day() ? 'done' : 'ready';
    const b = $('btnStorm');
    if (b) b.addEventListener('pointerdown', e => { e.stopPropagation(); AUD.init(); if (this.st === 'ready' && this.can()) { AUD.click(); this.start(); } });
  },
  // the snow it brings lands on cleared streets and squares (not on driveways, and never on a job still to do)
  okArea(a) { return !a.lot; },
  room() {
    const T = SNOW.T, A = SNOW.A, ar = SNOW.areas; let done = 0, all = 0;
    for (let k = 0; k < T.length; k++) { if (T[k] !== 1 || !A[k]) continue; const a = ar[A[k]]; if (!a || a.lot) continue; all++; if (a.done) done++; }
    return { done, all };
  },
  // (chapters whose bus or rocket drive on the cleared road get it only once their story is over)
  can() {
    if (this.st !== 'ready' || PL.kind !== 'truck') return false;
    if (CHUI.busy() || CAM.show || CAM.hero > 0.3 || CAM.intro > 0.05 || GAME.finishT > 0 || CHUI._going) return false;
    if (!GAME.ended && (CH.id === 2 || CH.id === 8)) return false;
    const r = this._room || (this._room = this.room());
    // (enough cleared road to make it worth it: a street or so)
    return r.done >= 5000 && r.done >= r.all * 0.2;
  },
  start() {
    this.st = 'fall'; this.t = 0; this.acc = 0; this.e0 = GAME.earned;
    STORE.set('plowtown_ds', DAILY.day());
    if (GAME.ended && STORM.phase !== 'idle') { STORM.phase = 'idle'; STORM.mult = 1; }
    STORM.next = Math.max(STORM.next, 160);
    const K = this.kind();
    UI.banner(K.name + '!', 'Fresh snow is falling on the streets...', 'storm', 2.6);
    AUD.thump && AUD.thump();
    PCLOG.ev('pc_dstorm', { ph: 'start', k: K.key });
    this.ui();
  },
  update(dt) {
    if (this.st === 'off' || this.st === 'done') {
      // (after the storm: the sky calms down again)
      if (this._calm) { FX.snowRate = damp(FX.snowRate, 1, 0.6, dt); FX.wind = damp(FX.wind, 0.6, 0.6, dt); if (Math.abs(FX.snowRate - 1) < 0.03) this._calm = 0; }
      this.ui(); return;
    }
    if (this.st === 'ready') {
      this._chk -= dt;
      if (this._chk <= 0) {
        this._chk = 0.5; this._room = null;
        const ok = this.can();
        // the first time it shows up: say what it is
        if (ok && !this._hinted && !STORE.get('plowtown_dsh')) { this._hinted = 1; STORE.set('plowtown_dsh', '1'); UI.hint('New: the Daily Storm! Tap it for x' + this.kind().mult + ' coins', 4.5); }
        this._ok = ok; this.ui();
      }
      return;
    }
    if (CHUI.busy() || CAM.hero > 0.3) return;
    const K = this.kind();
    if (this.st === 'fall') {
      this.t += dt; this.acc += dt;
      FX.snowRate = damp(FX.snowRate, 3.6, 1.5, dt); FX.wind = damp(FX.wind, 2.4, 1, dt);
      if (this.acc >= this.STEP) { this.acc -= this.STEP; SNOW.snowfallOn(K.depth * this.STEP / this.FALL, a => this.okArea(a)); }
      if (this.t >= this.FALL) {
        this.st = 'rush'; this.t = K.dur;
        UI.banner('x' + K.mult + ' COINS!', 'Plow the fresh snow before the storm ends', 'storm', 2.6);
        AUD.newTool && AUD.newTool();
      }
    } else if (this.st === 'rush') {
      this.t -= dt;
      FX.snowRate = damp(FX.snowRate, 1.6, 0.8, dt); FX.wind = damp(FX.wind, 1.0, 0.8, dt);
      if (K.key === 'gold' && PL.moveAmt > 0.2 && Math.random() < dt * 6) { const p = PL.kind === 'truck' ? PL.truck.position : PL.kid.root.position; FX.sparkle(p.x, 1.2, p.z, 3, 1.6, [1, 0.85, 0.35]); }
      if (this.t <= 0) this.end();
    }
    this.ui();
  },
  end() {
    this.st = 'done'; this.t = 0; this._calm = 1;
    const got = Math.max(0, Math.round(GAME.earned - this.e0)), N = this.kind(1);
    UI.banner('STORM CLEARED!', '+' + fmt(got) + ' coins · tomorrow: ' + N.name + ' x' + N.mult, 'storm', 3.6);
    AUD.bigWin && AUD.bigWin();
    later(4.2, () => UI.toast('Come back tomorrow: a new storm and a TURBO gift!'));
    PCLOG.ev('pc_dstorm', { ph: 'end', c: String(got) });
    GAME.save(); this.ui();
  },
  // leaving for another chapter while the storm is on: it ends there (what it paid so far still counts in the log)
  cut() {
    if (this.st !== 'fall' && this.st !== 'rush') return;
    const got = Math.max(0, Math.round(GAME.earned - this.e0));
    this.st = 'done'; this.t = 0; this._calm = 1;
    PCLOG.ev('pc_dstorm', { ph: 'cut', c: String(got) });
    this.ui();
  },
  mult() { return this.st === 'rush' ? this.kind().mult : 1; },
  // hours until the next storm (it comes with the new day on this device)
  hoursLeft() { const d = new Date(), m = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); return Math.max(1, Math.ceil((m - d) / 3600000)); },
  ui() {
    const b = $('btnStorm'); if (!b) return;
    const show = (this.st === 'ready' && this._ok) || this.st === 'fall' || this.st === 'rush';
    if (!show) { if (b._on) { b.classList.remove('on', 'ready', 'run'); b._on = 0; } return; }
    if (!b._on) { b.classList.add('on'); b._on = 1; if (!b._ini) { b._ini = 1; b.querySelector('.ds-ico').innerHTML = ICONS.storm; } }
    const K = this.kind(), run = this.st !== 'ready';
    b.classList.toggle('ready', !run); b.classList.toggle('run', run);
    const s = Math.max(0, Math.ceil(this.t));
    const top = run ? (this.st === 'fall' ? 'SNOWING...' : 'x' + K.mult + ' COINS') : 'DAILY STORM';
    const sub = run ? (this.st === 'fall' ? K.name : Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' left') : K.name + ' x' + K.mult;
    if (b._top !== top) { b.querySelector('b').textContent = top; b._top = top; }
    if (b._sub !== sub) { b.querySelector('i').textContent = sub; b._sub = sub; }
  },
};

// ---------- picture quality that fits the device: drops a step when the game runs slowly ----------
const QUAL = {
  tier: 0, t: 0, n: 0, low: 0, high: 0, warm: 4, stepped: false, upOnce: false, off: false,
  // (kept on this device only: a slow phone must not make the same player's computer look worse)
  saved(v) { try { if (v === undefined) return localStorage.getItem('plowtown_q'); localStorage.setItem('plowtown_q', v); } catch (e) { } return null; },
  init() {
    this.off = QS.has('bot') || QS.has('noq');
    const s = this.off ? 0 : Math.min(2, Math.max(0, +(this.saved() || 0) || 0));
    if (s) this.set(s, true);
    this.warm = 4;
  },
  set(t, quiet) {
    this.tier = t; this.warm = 3; this.t = 0; this.n = 0; this.low = 0; this.high = 0;
    const dpr = devicePixelRatio || 1;
    renderer.setPixelRatio(t === 0 ? Math.min(dpr, IS_MOBILE ? 1.6 : 2) : t === 1 ? Math.min(dpr, 1.25) : Math.min(dpr, 1));
    const sun = WORLD.sun;
    if (sun) {
      sun.castShadow = t < 2;
      const sm = t === 0 && !IS_MOBILE ? 2048 : 1024;
      if (sun.shadow && sun.shadow.mapSize.x !== sm) { sun.shadow.mapSize.set(sm, sm); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    }
    onResize();
    this.saved(String(t));
    if (!quiet) PCLOG.ev('pc_q', { q: String(t) });
  },
  // fed with the real time between frames
  tick(ms) {
    if (this.off || document.hidden || CAM.intro > 0.05 || !$('loading').classList.contains('off')) { this.t = 0; this.n = 0; return; }
    const dt = ms / 1000; if (dt <= 0 || dt > 2) return;   // (a longer gap is a pause, like coming back to the tab)
    if (this.warm > 0) { this.warm -= dt; return; }
    this.t += dt; this.n++;
    if (this.t < 5) return;
    const fps = this.n / this.t; this.t = 0; this.n = 0;
    // two slow stretches in a row: one step lighter (and remembered on this device)
    if (fps < 40 && this.tier < 2) { if (++this.low >= 2) { this.stepped = true; this.set(this.tier + 1); } }
    else this.low = 0;
    // a device that was set lighter on an earlier day and now runs smoothly gets one step back (never in a session
    // that had to step down: no going back and forth)
    if (fps >= 57 && this.tier > 0 && !this.stepped && !this.upOnce) { if (++this.high >= 3) { this.upOnce = true; this.set(this.tier - 1); } }
    else if (fps < 57) this.high = 0;
  },
};
