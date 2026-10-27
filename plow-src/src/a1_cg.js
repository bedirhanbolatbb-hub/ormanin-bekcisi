// ---------- CrazyGames bridge: only active on CrazyGames (everywhere else it quietly does nothing) ----------
const CG = {
  sdk: null, env: 'none', playing: false, mute: false, hold: false, onLate: null, latePending: false,
  // who is playing: undefined = not known, null = a guest, else the CrazyGames username
  uid: undefined,
  async init() {
    const s = window.CrazyGames && window.CrazyGames.SDK;
    if (!s || /[?&](bot|nosdk)\b/.test(location.search)) return;
    // the SDK fetches the player's saved game before it is ready, which can take a while on a slow line:
    // wait up to 6 s, and if it is ready later, take it then (meanwhile the game runs and saves on this device)
    const ready = Promise.resolve().then(() => s.init()).then(() => this.attach(s), () => { });
    await Promise.race([ready, new Promise(r => setTimeout(r, 6000))]);
    this._raceOver = true;
  },
  async attach(s) {
    this.env = s.environment;
    // local tests and other sites: no SDK calls at all (?useLocalSdk=true&cgtest tries the SDK's local mode)
    if (this.env !== 'crazygames' && !(this.env === 'local' && /[?&]cgtest\b/.test(location.search))) return;
    // late (the game already started from this device): not one write to the account until we know
    // whether it holds a newer game than this start found
    if (this._raceOver) { this.hold = true; this.sdk = s; }
    this.uid = await this.who(s);
    const late = !!this._raceOver;
    if (late) this.hold = true;
    this.sdk = s;
    try {
      this.mute = !!(s.game.settings && s.game.settings.muteAudio);
      s.game.addSettingsChangeListener(st => { this.mute = !!(st && st.muteAudio); try { AUD.setMuted(AUD._um); UI.refreshMute && UI.refreshMute(); } catch (e) { } });
    } catch (e) { }
    try { AUD.setMuted(AUD._um); UI.refreshMute && UI.refreshMute(); } catch (e) { }
    if (late) { if (this.playing) this.call(x => x.game.gameplayStart()); this.latePending = true; this.runLate(); }
  },
  // the late check runs once both the SDK and the game are there (whichever comes last)
  runLate() { if (!this.latePending || !this.onLate) return; this.latePending = false; try { this.onLate(); } catch (e) { this.hold = false; } },
  // the player's CrazyGames name (null for a guest), so this device's own copy of a game only ever goes to the same player
  who(s) {
    return new Promise(res => {
      let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      setTimeout(() => fin(undefined), 1500);
      try {
        const U = s.user;
        if (!U || !U.getUser) return fin(undefined);
        if (U.isUserAccountAvailable === false) return fin(null);
        Promise.resolve(U.getUser()).then(u => fin(u ? String(u.username || u.userId || 'player') : null), () => fin(undefined));
      } catch (e) { fin(undefined); }
    });
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
// from the very first moment (also while loading): arrow keys, space and the mouse wheel play the game, they never
// scroll the CrazyGames page around it (the chapter list still scrolls with the wheel)
addEventListener('keydown', e => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); }, { passive: false });
addEventListener('wheel', e => { if (!(e.target && e.target.closest && e.target.closest('.chlist'))) e.preventDefault(); }, { passive: false });
