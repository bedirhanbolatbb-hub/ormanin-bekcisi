// ---------- CrazyGames bridge: only active on CrazyGames (everywhere else it quietly does nothing) ----------
const CG = {
  sdk: null, env: 'none', playing: false, mute: false,
  async init() {
    const s = window.CrazyGames && window.CrazyGames.SDK;
    if (!s || /[?&](bot|nosdk)\b/.test(location.search)) return;
    try {
      await Promise.race([Promise.resolve().then(() => s.init()), new Promise((_, no) => setTimeout(() => no(new Error('sdk timeout')), 2500))]);
      this.env = s.environment;
      // local tests and other sites: no SDK calls at all (?useLocalSdk=true&cgtest tries the SDK's local mode)
      if (this.env !== 'crazygames' && !(this.env === 'local' && /[?&]cgtest\b/.test(location.search))) return;
      this.sdk = s;
      try {
        this.mute = !!(s.game.settings && s.game.settings.muteAudio);
        s.game.addSettingsChangeListener(st => { this.mute = !!(st && st.muteAudio); try { AUD.setMuted(AUD._um); } catch (e) { } });
      } catch (e) { }
    } catch (e) { this.sdk = null; }
  },
  call(fn) { try { if (this.sdk) return fn(this.sdk); } catch (e) { } },
  loadingStart() { this.call(s => s.game.loadingStart()); },
  loadingStop() { this.call(s => s.game.loadingStop()); },
  // gameplay on/off (menus, chapter cards, hidden tab = off)
  play(on) { if (on === this.playing) return; this.playing = on; this.call(s => on ? s.game.gameplayStart() : s.game.gameplayStop()); },
  happy() { this.call(s => s.game.happytime()); },
  // progress save goes to the player's CrazyGames account when there is one
  get(k) { let v = null; this.call(s => { v = s.data.getItem(k); }); return v; },
  set(k, v) { this.call(s => s.data.setItem(k, v)); },
};
