// ---------- procedural audio (no files) ----------
const AUD = {
  ctx: null, ok: false, muted: false, musicOn: true,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      const ctx = this.ctx = new C();
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4;
      comp.connect(ctx.destination);
      this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(comp);
      this.sfx = ctx.createGain(); this.sfx.gain.value = 1; this.sfx.connect(this.master);
      this.mus = ctx.createGain(); this.mus.gain.value = 0.0; this.mus.connect(this.master);
      // noise buffer
      const len = ctx.sampleRate * 2, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = b;
      // pink-ish noise for wind
      const b2 = ctx.createBuffer(1, len, ctx.sampleRate), d2 = b2.getChannelData(0); let l = 0;
      for (let i = 0; i < len; i++) { l = l * 0.97 + (Math.random() * 2 - 1) * 0.03; d2[i] = l * 6; }
      this.brown = b2;
      // continuous scrape layer
      this.scr = this._loopNoise(this.noise, 'bandpass', 1100, 0.9);
      // engine layer (blower / truck)
      const eo = ctx.createOscillator(); eo.type = 'sawtooth'; eo.frequency.value = 60;
      const eo2 = ctx.createOscillator(); eo2.type = 'square'; eo2.frequency.value = 30.5;
      const ef = ctx.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 420; ef.Q.value = 2;
      const eg = ctx.createGain(); eg.gain.value = 0;
      const eg2 = ctx.createGain(); eg2.gain.value = 0.35;
      eo.connect(ef); eo2.connect(eg2); eg2.connect(ef); ef.connect(eg); eg.connect(this.sfx);
      eo.start(); eo2.start();
      this.eng = { o: eo, o2: eo2, f: ef, g: eg, rpm: 0, kind: 0 };
      this.blowN = this._loopNoise(this.noise, 'bandpass', 2400, 0.6);
      // wind
      this.wind = this._loopNoise(this.brown, 'lowpass', 520, 0.5); this.wind.g.gain.value = 0.05;
      this.ok = true;
      this._musT = ctx.currentTime + 0.3; this._musStep = 0;
    } catch (e) { console.warn('audio', e); }
  },
  _loopNoise(buf, type, f, q) {
    const ctx = this.ctx, s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = ctx.createGain(); g.gain.value = 0;
    s.connect(fl); fl.connect(g); g.connect(this.sfx); s.start(0, Math.random());
    return { s, f: fl, g };
  },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05); },
  // ------- continuous: called every frame -------
  _grainAcc: 0,
  update(dt, st) {
    if (!this.ok || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    // st: {scrape:0..1, tool:'shovel'|'blower'|'truck', move:0..1, blowing:0..1}
    const sc = st.scrape || 0;
    const tool = st.tool;
    const sg = tool === 'truck' ? 0.22 : tool === 'blower' ? 0.07 : 0.16;
    this.scr.g.gain.setTargetAtTime(sc * sg, t, 0.06);
    this.scr.f.frequency.setTargetAtTime(tool === 'truck' ? 650 : 1150 + sc * 400, t, 0.1);
    // crunch grains
    const rate = sc * (tool === 'truck' ? 34 : tool === 'blower' ? 10 : 26);
    this._grainAcc += rate * dt;
    let n = 0;
    while (this._grainAcc > 1 && n < 4) { this._grainAcc -= 1; n++; this._grain(sc, tool); }
    if (this._grainAcc > 3) this._grainAcc = 0;
    // engine
    const e = this.eng;
    const want = tool === 'blower' ? 1 : tool === 'truck' ? 2 : 0;
    const mv = st.move || 0;
    if (want === 1) {
      e.o.frequency.setTargetAtTime(92 + mv * 38 + sc * 10, t, 0.08); e.o2.frequency.setTargetAtTime(46.3 + mv * 19, t, 0.08);
      e.f.frequency.setTargetAtTime(900 + mv * 600, t, 0.1); e.g.gain.setTargetAtTime(0.06 + mv * 0.05, t, 0.1);
      this.blowN.g.gain.setTargetAtTime((st.blowing || 0) * 0.09, t, 0.08);
    } else if (want === 2) {
      e.o.frequency.setTargetAtTime(44 + mv * 26 + sc * 6, t, 0.15); e.o2.frequency.setTargetAtTime(22.2 + mv * 13, t, 0.15);
      e.f.frequency.setTargetAtTime(300 + mv * 380, t, 0.15); e.g.gain.setTargetAtTime(0.11 + mv * 0.07, t, 0.12);
      this.blowN.g.gain.setTargetAtTime(0, t, 0.1);
    } else { e.g.gain.setTargetAtTime(0, t, 0.08); this.blowN.g.gain.setTargetAtTime(0, t, 0.08); }
    this.wind.g.gain.setTargetAtTime(0.035 + 0.025 * Math.sin(t * 0.21) * Math.sin(t * 0.13), t, 0.5);
    this._music();
  },
  _grain(sc, tool) {
    const ctx = this.ctx, t = ctx.currentTime + Math.random() * 0.02;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass';
    f.frequency.value = tool === 'truck' ? 300 + Math.random() * 700 : 700 + Math.random() * 2200; f.Q.value = 1.5 + Math.random() * 2;
    const g = ctx.createGain(); const a = (tool === 'truck' ? 0.5 : 0.34) * (0.4 + sc * 0.6) * (0.5 + Math.random() * 0.5);
    const d = 0.025 + Math.random() * 0.05;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.003); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    s.connect(f); f.connect(g); g.connect(this.sfx); s.start(t, Math.random() * 1.5, d + 0.02);
  },
  // ------- one shots -------
  _tone(type, f0, f1, dur, vol, when = 0, dest) {
    if (!this.ok) return; const ctx = this.ctx, t = ctx.currentTime + when;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + 0.05);
  },
  _nz(type, f0, f1, dur, vol, when = 0, q = 1) {
    if (!this.ok) return; const ctx = this.ctx, t = ctx.currentTime + when;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfx); s.start(t, Math.random() * 1.5, dur + 0.05);
  },
  _bell(freq, vol, when = 0, dur = 0.5) {
    this._tone('sine', freq, freq, dur, vol, when); this._tone('sine', freq * 2.01, freq * 2.01, dur * 0.5, vol * 0.35, when); this._tone('triangle', freq * 3.0, freq * 3.0, dur * 0.25, vol * 0.12, when);
  },
  toss() { if (!this.ok || this.muted) return; this._nz('lowpass', 1400, 260, 0.16, 0.26, 0, 0.7); this._tone('sine', 180, 90, 0.1, 0.12); },
  plop() { if (!this.ok || this.muted) return; this._nz('lowpass', 700, 160, 0.12, 0.2, 0, 0.8); },
  _coinN: 0, _coinT: 0,
  coin() {
    if (!this.ok || this.muted) return;
    const now = this.ctx.currentTime; if (now - this._coinT < 0.028) return;
    if (now - this._coinT > 0.5) this._coinN = 0; this._coinT = now; this._coinN++;
    const step = Math.min(this._coinN, 14), base = 1046.5 * Math.pow(2, (step % 8) * 2 / 12) * (step >= 8 ? 1.5 : 1);
    this._bell(base * (1 + Math.random() * 0.01), 0.075, 0, 0.22);
  },
  dump() {
    if (!this.ok || this.muted) return;
    this._nz('highpass', 3500, 1800, 1.1, 0.12, 0.05, 0.4); this._nz('bandpass', 600, 200, 0.5, 0.18, 0, 0.7);
    this._tone('sine', 120, 60, 0.25, 0.22);
  },
  star(i) {
    if (!this.ok || this.muted) return;
    const f = [784, 988, 1319][i] || 1319;
    this._bell(f, 0.09, 0, 0.7); this._bell(f * 1.5, 0.05, 0.06, 0.6); this._nz('highpass', 6000, 3000, 0.25, 0.05, 0, 0.5);
  },
  chapterIn() {
    if (!this.ok || this.muted) return;
    [0, 4, 7, 12].forEach((s, i) => this._bell(523.25 * Math.pow(2, s / 12), 0.07, i * 0.09, 0.6));
  },
  cash() {
    if (!this.ok || this.muted) return;
    this._nz('bandpass', 2600, 1300, 0.16, 0.12, 0, 1.4);
    this._bell(1568, 0.07, 0.03, 0.35); this._bell(2093, 0.065, 0.1, 0.5);
    this._nz('highpass', 4800, 2600, 0.28, 0.045, 0.06, 0.5);
  },
  sizzle() { if (!this.ok || this.muted) return; this._nz('highpass', 5000, 2500, 0.35, 0.06, 0, 0.5); },
  full() { if (!this.ok || this.muted) return; this._tone('triangle', 520, 500, 0.12, 0.13); this._tone('triangle', 390, 370, 0.18, 0.13, 0.13); },
  buy() {
    if (!this.ok || this.muted) return;
    this._nz('bandpass', 2000, 600, 0.12, 0.15, 0, 1.2); this._tone('sine', 420, 880, 0.12, 0.12);
    [0, 4, 7, 12].forEach((s, i) => this._bell(784 * Math.pow(2, s / 12), 0.06, 0.05 + i * 0.05, 0.35));
  },
  deny() { if (!this.ok || this.muted) return; this._tone('square', 180, 150, 0.12, 0.05); },
  click() { if (!this.ok || this.muted) return; this._tone('sine', 900, 700, 0.05, 0.08); },
  complete() {
    if (!this.ok || this.muted) return;
    const n = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    n.forEach((f, i) => this._bell(f, 0.09, i * 0.085, 0.7));
    this._bell(1567.98, 0.07, 0.5, 1.2); this._bell(2093, 0.05, 0.62, 1.2);
    for (let i = 0; i < 10; i++) this._tone('sine', 2500 + Math.random() * 2500, 2500 + Math.random() * 2500, 0.15, 0.02, 0.4 + i * 0.05);
  },
  bigWin() {
    if (!this.ok || this.muted) return;
    const ch = [[523.25, 659.25, 783.99], [587.33, 739.99, 880], [659.25, 830.61, 987.77], [783.99, 987.77, 1174.66, 1567.98]];
    ch.forEach((c, i) => c.forEach(f => this._bell(f, 0.06, i * 0.22, 1.2)));
  },
  newTool() {
    if (!this.ok || this.muted) return;
    this._nz('bandpass', 400, 3000, 0.5, 0.1, 0, 0.8);
    [0, 5, 9, 12, 16, 19].forEach((s, i) => this._bell(523.25 * Math.pow(2, s / 12), 0.07, 0.1 + i * 0.07, 0.6));
  },
  treasure(gift) {
    if (!this.ok || this.muted) return;
    const n = gift ? [784, 988, 1175, 1568, 1976] : [1319, 1568, 2093];
    n.forEach((f, i) => this._bell(f, gift ? 0.07 : 0.06, i * (gift ? 0.06 : 0.045), gift ? 0.6 : 0.35));
    if (gift) this._nz('bandpass', 3000, 6000, 0.4, 0.05, 0.05, 2);
  },
  horn() { if (!this.ok || this.muted) return; this._tone('sawtooth', 330, 330, 0.28, 0.05); this._tone('sawtooth', 415, 415, 0.28, 0.04); },
  busHorn() { if (!this.ok || this.muted) return; for (const w of [0, 0.34]) { this._tone('sawtooth', 247, 247, 0.26, 0.06, w); this._tone('sawtooth', 311, 311, 0.26, 0.05, w); this._tone('square', 196, 196, 0.26, 0.02, w); } },
  tick(hi) { if (!this.ok || this.muted) return; this._tone('square', hi ? 1320 : 990, hi ? 1320 : 990, 0.045, 0.05); this._nz('highpass', 6000, 4000, 0.04, 0.04, 0, 0.8); },
  bell() { if (!this.ok || this.muted) return; for (let i = 0; i < 8; i++) { this._bell(1046.5, 0.08, i * 0.12, 0.5); this._bell(1318.5, 0.04, i * 0.12 + 0.01, 0.35); } },
  jingle(v) { if (!this.ok || this.muted) return; const t = this.ctx.currentTime; if (t - (this._jT || 0) < 0.11) return; this._jT = t; this._bell(2093 * (1 + Math.random() * 0.06), 0.03 * (v || 1), 0, 0.18); this._bell(2637 * (1 + Math.random() * 0.06), 0.022 * (v || 1), 0.03, 0.15); },
  cheer() { if (!this.ok || this.muted) return; for (let i = 0; i < 6; i++) this._nz('bandpass', 900 + Math.random() * 900, 1500 + Math.random() * 800, 0.5 + Math.random() * 0.4, 0.05, i * 0.05, 3); [0, 4, 7].forEach((s, i) => this._bell(784 * Math.pow(2, s / 12), 0.05, 0.1 + i * 0.07, 0.4)); },
  streak(lv) { if (!this.ok || this.muted) return; const b = [0, 784, 988, 1175][lv] || 1175; [0, 4, 7, 12].forEach((st, i) => { this._bell(b * Math.pow(2, st / 12), 0.075, i * 0.055, 0.4); this._tone('triangle', b * Math.pow(2, st / 12) / 2, b * Math.pow(2, st / 12) / 2, 0.09, 0.05, i * 0.055); }); this._nz('bandpass', 1500, 5200, 0.35, 0.05, 0, 1.2); },
  whoosh() { if (!this.ok || this.muted) return; this._nz('bandpass', 400, 2400, 0.45, 0.12, 0, 1.5); },
  firework() { if (!this.ok || this.muted) return; this._nz('lowpass', 2500, 200, 0.6, 0.2, 0, 0.6); this._tone('sine', 90, 40, 0.4, 0.2); },
  thump() { if (!this.ok || this.muted) return; this._tone('sine', 140, 50, 0.18, 0.2); this._nz('lowpass', 500, 100, 0.15, 0.12); },
  // ------- music: gentle music-box loop (original) -------
  // chapter songs (original): a little data format the loop below plays
  song: null,
  _music() {
    const ctx = this.ctx; if (!ctx) return;
    const target = this.musicOn && !this.muted ? 0.16 : 0;
    this.mus.gain.setTargetAtTime(target, ctx.currentTime, 0.8);
    if (!this.musicOn) return;
    const S = this.song || SONG_MAPLE, step = 60 / S.bpm / (S.div || 2), spb = S.spb || 8, cpb = S.cpb || 1;
    const mf = m => 440 * Math.pow(2, (m - 69) / 12);
    while (this._musT < ctx.currentTime + 0.4) {
      const st = this._musStep, t = this._musT;
      const bar = Math.floor(st / spb), chord = S.prog[Math.floor(bar / cpb) % S.prog.length], inBar = st % spb;
      if (S.bass !== 'waltz' && st % (spb * cpb) === 0) {
        chord.forEach(m => this._pad(mf(m), t, step * spb * cpb, 0.045 * (S.padV || 1)));
        this._pad(mf(chord[0] - 12), t, step * spb * cpb, 0.06 * (S.padV || 1));
      }
      if (S.bass === 'pulse' && inBar % 2 === 0) this._pluck(mf(chord[0] - 12), t, 0.09, 380);
      if (S.bass === 'drive') this._pluck(mf(chord[0] - (inBar % 2 ? 0 : 12)), t, 0.075, 520);
      if (S.bass === 'waltz') { if (inBar === 0) this._pluck(mf(chord[0] - 12), t, 0.12, 360); else chord.forEach(m => this._pluck(mf(m), t, 0.035, 1400)); }
      if (S.shaker) this._tick(t, inBar % 2 ? 0.012 : 0.02, 7000);
      if (S.hat && inBar % 2 === 1) this._tick(t, 0.03, 8000);
      const m = S.mel[st % S.mel.length];
      if (m > 0 && (S.gap === undefined || (st % (S.mel.length)) < S.mel.length - S.gap)) this['_' + (S.inst || 'box')](mf(m), t, S.melV || 0.16);
      this._musT += step; this._musStep++;
    }
  },
  _pluck(f, t, v, cut) {
    const ctx = this.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = f; o2.type = 'square'; o2.frequency.value = f * 1.002; fl.type = 'lowpass'; fl.frequency.value = cut || 2400;
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.32);
    o.connect(fl); o2.connect(g2); g2.connect(fl); fl.connect(g); g.connect(this.mus); o.start(t); o2.start(t); o.stop(t + 0.36); o2.stop(t + 0.36);
  },
  _bellI(f, t, v) {
    const ctx = this.ctx;
    for (const [m, a, d] of [[1, 1, 0.9], [2.76, 0.35, 0.35], [5.4, 0.12, 0.15]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * m;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * a, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0004, t + d);
      o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + d + 0.05);
    }
  },
  _tick(t, v, f) {
    const ctx = this.ctx, s = ctx.createBufferSource(); s.buffer = this.noise;
    const fl = ctx.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = f || 6000;
    const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0003, t + 0.05);
    s.connect(fl); fl.connect(g); g.connect(this.mus); s.start(t, Math.random() * 1.5, 0.07);
  },
  _box(f, t, v) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 4.0;
    const g = ctx.createGain(), g2 = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0005, t + 1.1);
    g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(v * 0.18, t + 0.002); g2.gain.exponentialRampToValueAtTime(0.0003, t + 0.25);
    o.connect(g); o2.connect(g2); g.connect(this.mus); g2.connect(this.mus);
    o.start(t); o2.start(t); o.stop(t + 1.2); o2.stop(t + 0.3);
  },
  _pad(f, t, d, v) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 900;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.4); g.gain.setValueAtTime(v, t + d - 0.5); g.gain.linearRampToValueAtTime(0, t + d + 0.3);
    o.connect(fl); fl.connect(g); g.connect(this.mus); o.start(t); o.stop(t + d + 0.4);
  }
};

// ---------- chapter songs (original melodies) ----------
const SONG_MAPLE = { bpm: 84, spb: 8, cpb: 2, inst: 'box', gap: 4,
  prog: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50], [48, 52, 55], [40, 43, 47], [41, 45, 48], [43, 47, 50]],
  mel: [76, 79, 81, 79, 76, 74, 72, 74, 76, 76, 74, 72, 69, 72, 74, -1, 72, 74, 76, 74, 72, 69, 67, 69, 72, 72, 74, 76, 79, 76, 74, -1,
    77, 76, 74, 72, 74, 76, 79, 81, 79, 76, 74, 76, 72, 74, 72, -1, 69, 72, 74, 76, 74, 72, 74, 79, 76, 74, 72, 74, 72, -1, -1, -1] };
// school morning: bouncy D major
const SONG_SCHOOL = { bpm: 108, spb: 8, inst: 'pluck', bass: 'pulse', melV: 0.12, padV: 0.7,
  prog: [[50, 54, 57], [45, 49, 52], [47, 50, 54], [43, 47, 50], [50, 54, 57], [45, 49, 52], [43, 47, 50], [45, 49, 52]],
  mel: [74, -1, 78, -1, 81, 78, 74, -1, 73, -1, 76, -1, 81, 76, 73, -1, 71, 74, 78, 74, 71, 74, 78, 81, 79, -1, 78, -1, 76, -1, 74, -1,
    74, 78, 81, 86, 81, 78, 74, 78, 76, 73, 69, 73, 76, 81, 76, 73, 71, 74, 79, 74, 71, 74, 79, 83, 81, -1, 79, -1, 76, -1, 73, -1] };
// market evening: bells in a gentle six
const SONG_MARKET = { bpm: 92, spb: 6, inst: 'bellI', shaker: true, melV: 0.13,
  prog: [[41, 45, 48], [38, 41, 45], [46, 50, 53], [48, 52, 55], [41, 45, 48], [38, 41, 45], [43, 46, 50], [48, 52, 55]],
  mel: [77, -1, 81, 84, -1, 81, 81, 79, 77, 74, -1, 77, 82, -1, 81, 79, -1, 77, 79, -1, 76, 72, -1, -1,
    77, 81, 84, 86, 84, 81, 81, 77, 74, 77, 81, 77, 79, 82, 79, 77, 76, 74, 72, -1, -1, 76, 79, -1] };
// frozen lake: a skating waltz
const SONG_LAKE = { bpm: 150, div: 1, spb: 3, cpb: 2, inst: 'box', bass: 'waltz', melV: 0.15,
  prog: [[43, 47, 50], [40, 43, 47], [48, 52, 55], [50, 54, 57], [43, 47, 50], [40, 43, 47], [48, 52, 55], [50, 54, 57]],
  mel: [83, -1, -1, 86, 83, 81, 79, -1, 76, 79, 83, 86, 84, -1, -1, 88, 84, 81, 81, -1, 78, 74, -1, -1,
    79, 83, 86, 91, -1, 86, 83, -1, 79, 76, 79, 83, 84, 88, 91, 88, -1, 84, 86, -1, 81, 78, -1, -1] };
// race day: driving A minor
const SONG_RESORT = { bpm: 124, spb: 8, inst: 'pluck', bass: 'drive', hat: true, melV: 0.11, padV: 0.6,
  prog: [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 44, 47]],
  mel: [76, -1, 81, -1, 84, 83, 81, 79, 77, -1, 81, -1, 84, -1, 86, 84, 84, -1, 79, -1, 76, 79, 84, 86, 83, -1, 79, -1, 74, -1, 79, 83,
    81, 84, 88, 84, 81, 84, 88, 91, 89, 88, 86, 84, 86, 84, 81, 77, 79, 83, 86, 83, 79, 83, 86, 88, 88, -1, 83, -1, 80, -1, 76, -1] };
