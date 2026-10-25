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
  horn() { if (!this.ok || this.muted) return; this._tone('sawtooth', 330, 330, 0.28, 0.05); this._tone('sawtooth', 415, 415, 0.28, 0.04); },
  firework() { if (!this.ok || this.muted) return; this._nz('lowpass', 2500, 200, 0.6, 0.2, 0, 0.6); this._tone('sine', 90, 40, 0.4, 0.2); },
  thump() { if (!this.ok || this.muted) return; this._tone('sine', 140, 50, 0.18, 0.2); this._nz('lowpass', 500, 100, 0.15, 0.12); },
  // ------- music: gentle music-box loop (original) -------
  _music() {
    const ctx = this.ctx; if (!ctx) return;
    const target = this.musicOn && !this.muted ? 0.16 : 0;
    this.mus.gain.setTargetAtTime(target, ctx.currentTime, 0.8);
    if (!this.musicOn) return;
    const bpm = 84, s8 = 60 / bpm / 2;
    // chords per bar (2 bars each) : C  Am  F  G  C  Em  F G
    const prog = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50], [48, 52, 55], [40, 43, 47], [41, 45, 48], [43, 47, 50]];
    const mel = [76, 79, 81, 79, 76, 74, 72, 74, 76, 76, 74, 72, 69, 72, 74, -1,
      72, 74, 76, 74, 72, 69, 67, 69, 72, 72, 74, 76, 79, 76, 74, -1,
      77, 76, 74, 72, 74, 76, 79, 81, 79, 76, 74, 76, 72, 74, 72, -1,
      69, 72, 74, 76, 74, 72, 74, 79, 76, 74, 72, 74, 72, -1, -1, -1];
    while (this._musT < ctx.currentTime + 0.4) {
      const st = this._musStep, t = this._musT;
      const bar = Math.floor(st / 8) % 16, chord = prog[Math.floor(bar / 2) % 8];
      if (st % 8 === 0) {
        chord.forEach((m, i) => { const f = 440 * Math.pow(2, (m - 69) / 12); this._pad(f, t, s8 * 8, 0.05); });
        this._pad(440 * Math.pow(2, (chord[0] - 12 - 69) / 12), t, s8 * 8, 0.07);
      }
      const m = mel[st % mel.length];
      if (m > 0 && (st % 64) < 60) {
        const f = 440 * Math.pow(2, (m - 69) / 12);
        this._box(f, t, 0.16);
      }
      this._musT += s8; this._musStep++;
    }
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
