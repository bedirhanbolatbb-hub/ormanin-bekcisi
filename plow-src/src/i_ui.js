// ---------- HUD ----------
const ICONS = {
  coin: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#f5a623"/><circle cx="20" cy="20" r="15" fill="#ffd34d"/><circle cx="20" cy="20" r="11" fill="none" stroke="#f5a623" stroke-width="2.5"/><path d="M20 12v16M13 16l14 8M27 16l-14 8" stroke="#e08a00" stroke-width="2.6" stroke-linecap="round"/></svg>',
  w: '<svg viewBox="0 0 40 40"><rect x="7" y="20" width="26" height="9" rx="3" fill="#ff8a1e"/><path d="M4 14h32M4 14l5-4M4 14l5 4M36 14l-5-4M36 14l-5 4" stroke="#2b3a55" stroke-width="3" stroke-linecap="round" fill="none"/></svg>',
  cap: '<svg viewBox="0 0 40 40"><path d="M6 27h26q4 0 4-4" stroke="#7a4a2e" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="7" y="22" width="24" height="5" rx="2" fill="#c8323c"/><path d="M9 22q4-12 11-11t10 11z" fill="#fff" stroke="#b9cde6" stroke-width="2"/></svg>',
  spd: '<svg viewBox="0 0 40 40"><path d="M23 4L9 23h10l-3 13 15-20H21z" fill="#ffc23d" stroke="#e08a00" stroke-width="2" stroke-linejoin="round"/></svg>',
  shovel: '<svg viewBox="0 0 40 40"><path d="M27 6l-9 17" stroke="#b07a46" stroke-width="3.5" stroke-linecap="round"/><path d="M8 24l12 4 3-6-12-4z" fill="#ff8a1e" stroke="#c8650a" stroke-width="2" stroke-linejoin="round"/><circle cx="28" cy="5" r="3" fill="none" stroke="#2c3138" stroke-width="2.5"/></svg>',
  blower: '<svg viewBox="0 0 40 40"><rect x="6" y="18" width="20" height="13" rx="3" fill="#d6302a"/><path d="M21 18V8l6-3" stroke="#d6302a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="12" cy="32" r="4" fill="#2c3138"/><path d="M26 22l9-9" stroke="#8a95a3" stroke-width="3" stroke-linecap="round"/></svg>',
  truck: '<svg viewBox="0 0 40 40"><rect x="10" y="14" width="16" height="12" rx="2" fill="#f2f2ee" stroke="#9aa3ad" stroke-width="1.5"/><rect x="18" y="16" width="7" height="5" fill="#5a6b80"/><rect x="2" y="20" width="9" height="9" rx="1.5" fill="#ffcf3a" stroke="#d69a00" stroke-width="1.5"/><circle cx="15" cy="28" r="3.6" fill="#2c3138"/><circle cx="25" cy="28" r="3.6" fill="#2c3138"/><circle cx="20" cy="12" r="2" fill="#ff9a1a"/><rect x="26" y="20" width="10" height="6" fill="#f2f2ee" stroke="#9aa3ad" stroke-width="1.5"/></svg>',
  house: '<svg viewBox="0 0 40 40"><path d="M6 19L20 7l14 12" fill="#fff" stroke="#c8323c" stroke-width="3" stroke-linejoin="round"/><rect x="10" y="18" width="20" height="15" fill="#e7b27a"/><rect x="17" y="24" width="6" height="9" fill="#c8323c"/><rect x="12" y="21" width="4" height="4" fill="#ffd34d"/></svg>',
  car: '<svg viewBox="0 0 40 40"><path d="M6 25l3-8q1-3 4-3h14q3 0 4 3l3 8v5H6z" fill="#2f7fd6"/><rect x="12" y="16" width="16" height="6" rx="1.5" fill="#bfe1f5"/><circle cx="12" cy="30" r="3.5" fill="#2c3138"/><circle cx="28" cy="30" r="3.5" fill="#2c3138"/><path d="M9 14q11-7 22 0" stroke="#fff" stroke-width="3" fill="none"/></svg>',
  walk: '<svg viewBox="0 0 40 40"><rect x="8" y="5" width="12" height="30" fill="#b9bdc2"/><path d="M8 15h12M8 25h12" stroke="#8a8f95"/><rect x="21" y="5" width="11" height="30" fill="#4a5059"/><path d="M26.5 8v6M26.5 20v6" stroke="#ffd34d" stroke-width="2"/></svg>',
  road: '<svg viewBox="0 0 40 40"><path d="M13 5L5 35h30L27 5z" fill="#4a5059"/><path d="M20 8v5M20 17v6M20 27v6" stroke="#ffd34d" stroke-width="2.5"/></svg>',
  shop: '<svg viewBox="0 0 40 40"><rect x="7" y="16" width="26" height="18" fill="#c8323c"/><path d="M5 16h30l-3-8H8z" fill="#fff" stroke="#c8323c" stroke-width="2"/><rect x="13" y="21" width="14" height="8" fill="#ffd34d"/></svg>',
  tree: '<svg viewBox="0 0 40 40"><path d="M20 4l8 11h-4l7 9h-5l6 8H8l6-8H9l7-9h-4z" fill="#2fa06a"/><circle cx="16" cy="22" r="2" fill="#ffd34d"/><circle cx="24" cy="27" r="2" fill="#ff5a5a"/><circle cx="21" cy="15" r="1.8" fill="#5bc8f5"/><rect x="18" y="32" width="4" height="5" fill="#7a4a2e"/></svg>',
  star: '<svg viewBox="0 0 40 40"><path d="M20 4l4.7 10 10.8 1.2-8 7.3 2.2 10.6L20 27.7l-9.7 5.4 2.2-10.6-8-7.3L15.3 14z" fill="#ffc23d" stroke="#e08a00" stroke-width="2" stroke-linejoin="round"/></svg>',
  snd: '<svg viewBox="0 0 40 40"><path d="M8 16h6l8-7v22l-8-7H8z" fill="#2b3a55"/><path d="M27 14q4 6 0 12M31 10q7 10 0 20" stroke="#2b3a55" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 40 40"><path d="M8 16h6l8-7v22l-8-7H8z" fill="#2b3a55"/><path d="M27 15l9 10M36 15l-9 10" stroke="#c8323c" stroke-width="3" stroke-linecap="round"/></svg>',
  arrow: '<svg viewBox="0 0 40 40"><path d="M20 4l12 14h-7v16h-10V18H8z" fill="#fff" stroke="#2b3a55" stroke-width="2.5" stroke-linejoin="round"/></svg>',
};
const UI = {
  flyers: [], pending: 0, joy: null,
  init() {
    this.cv = $('fx2d'); this.g = this.cv.getContext('2d');
    $('coinIco').innerHTML = ICONS.coin;
    $('btnMute').innerHTML = AUD.muted ? ICONS.mute : ICONS.snd;
    $('btnMute').onclick = (e) => { e.stopPropagation(); AUD.init(); AUD.setMuted(!AUD.muted); $('btnMute').innerHTML = AUD.muted ? ICONS.mute : ICONS.snd; STORE.set('plowtown_mute', AUD.muted ? '1' : '0'); };
    const ups = $('ups');
    ups.innerHTML = '';
    this.upBtns = [];
    for (let i = 0; i < 3; i++) {
      const b = document.createElement('button'); b.className = 'up'; b.innerHTML = `<div class="ui-ico">${[ICONS.w, ICONS.cap, ICONS.spd][i]}</div><div class="ui-lbl"></div><div class="ui-dots"></div><div class="ui-cost"><span class="ci">${ICONS.coin}</span><b></b></div>`;
      b.addEventListener('pointerdown', e => { e.stopPropagation(); AUD.init(); GAME.buyUp(i); });
      ups.appendChild(b); this.upBtns.push(b);
    }
    const tb = document.createElement('button'); tb.className = 'up toolcard'; tb.innerHTML = `<div class="ui-ico"></div><div class="ui-lbl"></div><div class="tc-bar"><i></i></div><div class="ui-cost"><span class="ci">${ICONS.coin}</span><b></b></div>`;
    tb.addEventListener('pointerdown', e => { e.stopPropagation(); AUD.init(); const t = GAME.nextTool(); if (t) GAME.buyTool(t); });
    ups.appendChild(tb); this.toolBtn = tb;
    this.refreshTools();
    window.addEventListener('resize', () => this.resize()); this.resize();
  },
  resize() { const d = Math.min(2, devicePixelRatio || 1); this.dpr = d; this.cv.width = innerWidth * d; this.cv.height = innerHeight * d; this._coinRect = null; },
  shownCoins() { return GAME.coins - this.pending; },
  pulseTool(t) {
    const box = $('tools'); const i = TOOL_ORDER.filter(x => GAME.owned[x]).indexOf(t); const b = box.children[i];
    if (b) { b.classList.add('pulse'); setTimeout(() => b.classList.remove('pulse'), 6000); }
  },
  refreshTools() {
    const box = $('tools'); box.innerHTML = '';
    const owned = TOOL_ORDER.filter(t => GAME.owned[t]);
    box.style.display = owned.length > 1 ? 'flex' : 'none';
    for (const t of owned) {
      const b = document.createElement('button'); b.className = 'tool' + (PL.tool === t ? ' on' : ''); b.innerHTML = ICONS[t];
      b.addEventListener('pointerdown', e => { e.stopPropagation(); AUD.init(); if (PL.tool !== t) { PL.setTool(t); this.refreshTools(); GAME.save(); } });
      box.appendChild(b);
    }
  },
  _lastGoal: -1, _lastCoinTxt: '', _hintT: 0, _uiT: 0,
  update(dt) {
    // coins
    const shown = Math.floor(this.shownCoins() + 1e-6);
    const txt = fmt(shown);
    if (txt !== this._lastCoinTxt) { $('coinTxt').textContent = txt; this._lastCoinTxt = txt; }
    this._uiT -= dt;
    if (this._uiT <= 0) { this._uiT = 0.1; this._updButtons(shown); this._updGoal(shown); }
    this._updLoadTag();
    this._draw(dt);
    if (this._hintT > 0) { this._hintT -= dt; if (this._hintT <= 0) $('hint').classList.remove('on'); }
    if (this._toastT > 0) { this._toastT -= dt; if (this._toastT <= 0) $('toast').classList.remove('on'); }
  },
  _updButtons(shown) {
    const t = PL.tool, T = TOOLS[t];
    for (let i = 0; i < 3; i++) {
      const b = this.upBtns[i], c = GAME.upCost(t, i), L = GAME.lv[t][i];
      const can = isFinite(c) && shown >= c;
      b.classList.toggle('can', can); b.classList.toggle('max', !isFinite(c));
      const lbl = T.labels[i]; if (b._lbl !== lbl) { b.querySelector('.ui-lbl').textContent = lbl; b._lbl = lbl; }
      const ct = isFinite(c) ? fmt(c) : 'MAX'; if (b._ct !== ct) { b.querySelector('.ui-cost b').textContent = ct; b._ct = ct; }
      const dots = '●'.repeat(L) + '○'.repeat(Math.max(0, T.max - L)); if (b._d !== dots) { b.querySelector('.ui-dots').textContent = dots; b._d = dots; }
    }
    const nt = GAME.nextTool(), tb = this.toolBtn;
    if (!nt) { tb.style.display = 'none'; }
    else {
      const c = TOOLS[nt].cost, f = clamp(shown / c, 0, 1);
      const vis = f >= 0.35 || GOALS[GAME.goalIdx()].tool === nt;
      tb.style.display = vis ? '' : 'none';
      if (tb._t !== nt) { tb.querySelector('.ui-ico').innerHTML = ICONS[nt]; tb.querySelector('.ui-lbl').textContent = TOOLS[nt].name; tb._t = nt; }
      tb.querySelector('.ui-cost b').textContent = fmt(c);
      tb.querySelector('.tc-bar i').style.width = (f * 100).toFixed(1) + '%';
      tb.classList.toggle('can', f >= 1);
      if (f >= 1 && !this._toolHinted) { this._toolHinted = 1; this.hint('New tool ready! Tap ' + TOOLS[nt].name, 4); }
      if (f < 1) this._toolHinted = 0;
    }
    if (!GAME.firstUp && this.upBtns.some(b => b.classList.contains('can')) && !this._upHint) { this._upHint = 1; this.hint('Tap an upgrade below!', 4); $('ups').classList.add('nudge'); }
    if (GAME.firstUp) $('ups').classList.remove('nudge');
  },
  _updGoal(shown) {
    const gi = GAME.goalIdx(), g = GOALS[gi];
    if (gi !== this._lastGoal) {
      this._lastGoal = gi;
      $('goalIco').innerHTML = ICONS[g.ico] || ICONS.star; $('goalTxt').textContent = g.t;
      const el = $('goal'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    }
    let f = 1, lab = '';
    if (g.a) { const a = WORLD.areaByKey[g.a]; f = SNOW.prog(a); lab = Math.floor(f * 100) + '%'; }
    else if (g.tool) { const c = TOOLS[g.tool].cost; f = clamp(shown / c, 0, 1); lab = fmt(Math.min(shown, c)) + '/' + fmt(c); }
    else if (STORM.phase === 'bonus') { f = STORM.multT / 90; lab = 'x2 ' + Math.ceil(STORM.multT) + 's'; }
    else if (STORM.phase === 'storm') { f = STORM.t / 12; lab = 'storm'; }
    else { lab = '★'; }
    $('goalBar').firstChild.style.width = (f * 100).toFixed(1) + '%';
    $('goalPct').textContent = lab;
  },
  _v: new V3(),
  _updLoadTag() {
    const el = $('loadTag');
    const st = PL.stats(), f = PL.load / st.cap;
    if (f <= 0.02 && !PL.dumping) { if (el._on) { el.classList.remove('on'); el._on = 0; } return; }
    if (!el._on) { el.classList.add('on'); el._on = 1; }
    const p = PL.tool === 'truck' ? this._v.set(PL.x, 3.4, PL.z) : this._v.set(PL.x, 1.75, PL.z);
    p.project(CAM.cam);
    el.style.transform = `translate(${((p.x + 1) / 2 * innerWidth).toFixed(1)}px, ${((1 - p.y) / 2 * innerHeight).toFixed(1)}px) translate(-50%,-100%)`;
    const full = f >= 0.999;
    el.classList.toggle('full', full);
    el.querySelector('i').style.width = (clamp(f, 0, 1) * 100).toFixed(1) + '%';
    el.querySelector('b').textContent = full ? 'FULL!' : Math.floor(PL.load) + '/' + Math.floor(st.cap);
  },
  onFull() {
    if (!GAME.firstFull) { GAME.firstFull = true; this.hint(PL.tool === 'truck' ? 'Blade is full! Push it into a MELTER' : 'Sled is full! Empty it at the MELTER', 5); }
  },
  onDump() { if (GAME.dumps === 0) this.hint('Snow melts into coins!', 3); },
  onUpgrade(i) { const b = this.upBtns[i]; b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); },
  hint(t, dur) { const el = $('hint'); el.textContent = t; el.classList.add('on'); this._hintT = dur || 3; },
  toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('on'); this._toastT = 4; },
  banner(title, sub, ico, dur) {
    const el = $('banner'); el.innerHTML = `<div class="bn-ico">${ICONS[ico] || ICONS.star}</div><div class="bn-t">${title}</div><div class="bn-s">${sub || ''}</div>`;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(this._bnT); this._bnT = setTimeout(() => el.classList.remove('on'), (dur || 2.2) * 1000);
  },
  endCard() {
    const el = $('endcard'); el.classList.add('on');
    $('endStats').textContent = `Coins earned: ${fmt(GAME.earned)}  ·  Time: ${Math.floor(GAME.time / 60)}m ${Math.floor(GAME.time % 60)}s`;
  },
  bubble(text) { const d = document.createElement('div'); d.className = 'bubble'; d.textContent = text; $('bubbles').appendChild(d); return d; },
  placeBubble(d, wp, vis) {
    const p = this._v.copy(wp).project(CAM.cam);
    d.style.transform = `translate(${((p.x + 1) / 2 * innerWidth).toFixed(1)}px, ${((1 - p.y) / 2 * innerHeight).toFixed(1)}px) translate(-50%,-100%)`;
    d.style.opacity = vis && p.z < 1 ? 1 : 0;
  },
  // ---- 2D coins flying to the counter ----
  flyCoin(wp, v) {
    let x, y;
    if (wp) { const p = this._v.copy(wp).project(CAM.cam); x = (p.x + 1) / 2 * innerWidth; y = (1 - p.y) / 2 * innerHeight; }
    else { x = innerWidth / 2; y = innerHeight / 2; }
    const r = this._coinRect || (this._coinRect = $('coinIco').getBoundingClientRect());
    this.flyers.push({ x0: x, y0: y, x1: r.left + r.width / 2, y1: r.top + r.height / 2, t: 0, d: rnd(0.45, 0.7), v, cx: x + rnd(-80, 80), cy: y - rnd(60, 160), s: rnd(0.8, 1.1) });
  },
  _draw(dt) {
    const g = this.g, d = this.dpr;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cv.width, this.cv.height);
    g.setTransform(d, 0, 0, d, 0, 0);
    // joystick
    const J = INPUT.joy;
    if (J.active && J.show) {
      g.globalAlpha = 0.35; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(J.ox, J.oy, 52, 0, TAU); g.fill();
      g.globalAlpha = 0.6; g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.arc(J.ox, J.oy, 52, 0, TAU); g.stroke();
      g.globalAlpha = 0.9; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(J.ox + J.dx * 52, J.oy + J.dy * 52, 22, 0, TAU); g.fill();
      g.globalAlpha = 1;
    }
    // flyers
    for (let i = this.flyers.length - 1; i >= 0; i--) {
      const f = this.flyers[i];
      const k = clamp(f.t / f.d, 0, 1), e = k * k * (3 - 2 * k);
      const x = (1 - e) * (1 - e) * f.x0 + 2 * (1 - e) * e * f.cx + e * e * f.x1, y = (1 - e) * (1 - e) * f.y0 + 2 * (1 - e) * e * f.cy + e * e * f.y1;
      const s = 11 * f.s * (1 - 0.35 * e);
      g.fillStyle = '#f5a623'; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
      g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(x, y, s * 0.78, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(x - s * 0.3, y - s * 0.3, s * 0.25, 0, TAU); g.fill();
    }
  },
  tick(dt) {
    for (let i = this.flyers.length - 1; i >= 0; i--) {
      const f = this.flyers[i]; f.t += dt;
      if (f.t >= f.d) {
        this.flyers.splice(i, 1); this.pending -= f.v; if (this.pending < 0.001) this.pending = 0;
        AUD.coin();
        const ci = $('coinBox'); if (!this._bumpT || performance.now() - this._bumpT > 90) { this._bumpT = performance.now(); ci.classList.remove('bump'); void ci.offsetWidth; ci.classList.add('bump'); }
      }
    }
  }
};
