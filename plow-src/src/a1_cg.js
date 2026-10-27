// ---------- CrazyGames bridge: only active on CrazyGames (everywhere else it quietly does nothing) ----------
const CG = {
  sdk: null, env: 'none', playing: false, mute: false, hold: false, onLate: null,
  async init() {
    const s = window.CrazyGames && window.CrazyGames.SDK;
    if (!s || /[?&](bot|nosdk)\b/.test(location.search)) return;
    // the SDK fetches the player's saved game before it is ready, which can take a while on a slow line:
    // wait up to 6 s, and if it is ready later, take it then (meanwhile the game runs and saves on this device)
    let late = false;
    const ready = Promise.resolve().then(() => s.init()).then(() => this.attach(s, late), () => { });
    await Promise.race([ready, new Promise(r => setTimeout(r, 6000))]);
    late = true;
  },
  attach(s, late) {
    this.env = s.environment;
    // local tests and other sites: no SDK calls at all (?useLocalSdk=true&cgtest tries the SDK's local mode)
    if (this.env !== 'crazygames' && !(this.env === 'local' && /[?&]cgtest\b/.test(location.search))) return;
    this.sdk = s;
    try {
      this.mute = !!(s.game.settings && s.game.settings.muteAudio);
      s.game.addSettingsChangeListener(st => { this.mute = !!(st && st.muteAudio); try { AUD.setMuted(AUD._um); } catch (e) { } });
    } catch (e) { }
    if (late) { if (this.playing) this.call(x => x.game.gameplayStart()); try { if (this.onLate) this.onLate(); } catch (e) { } }
  },
  call(fn) { try { if (this.sdk) return fn(this.sdk); } catch (e) { } },
  loadingStart() { this.call(s => s.game.loadingStart()); },
  loadingStop() { this.call(s => s.game.loadingStop()); },
  // gameplay on/off (menus, chapter cards, hidden tab = off)
  play(on) { if (on === this.playing) return; this.playing = on; this.call(s => on ? s.game.gameplayStart() : s.game.gameplayStop()); },
  happy() { this.call(s => s.game.happytime()); },
  // progress save goes to the player's CrazyGames account when there is one
  get(k) { let v = null; this.call(s => { v = s.data.getItem(k); }); return v; },
  set(k, v) { if (!this.hold) this.call(s => s.data.setItem(k, v)); },
  // is what gets saved right now going up to the account? (0 yes, 1 no SDK here, 2 held back on purpose)
  syncState() { return this.sdk ? (this.hold ? 2 : 0) : 1; },
};
