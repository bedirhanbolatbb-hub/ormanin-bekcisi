// ---------- player log (ByteBrew): where players stop, what goes wrong. No names, emails or anything typed. ----------
// Off in tests (bot / nolog / localhost / file), and when the player switches it off (Privacy card, in the chapter map).
const PCLOG = (function () {
  const ID = 'HG2tnhs8A', KEY = 'RfKAdPyMuIAyddUs05TnQW5uBBfGgJweyT66irHFQsM7YzhCNgRJN6PCNhl3dRKE', VER = '__VER__';
  const OFFK = 'pc_nostats', SEENK = 'pc_privseen';
  let ok = false, errs = 0, hid = false, started = false, aliveT = 0, unst = 0, handlers = false;
  const t0 = Date.now();
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (_) { } return null; };
  let userOff = store(OFFK) === '1';
  const force = /[?&]privnote/.test(location.search);
  // (tests and the developer's own machine never send anything; an app that serves the game from its own
  //  "localhost" over https or its own address still counts as a real player)
  function blocked() {
    return !ID || !KEY || location.protocol === 'file:' || (location.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) ||
      /[?&](nolog|bot)(&|=|$)/.test(location.search);
  }
  // where the game is played, as a plain word (a site's own address can carry keys that are none of our business)
  function where() {
    const h = String(location.hostname || '');
    return /crazygames/i.test(h) ? 'crazygames' : /github\.io$/i.test(h) ? 'web' : (h.split('.').slice(-2).join('.') || location.protocol).slice(0, 30);
  }
  function init() {
    if (ok || userOff || blocked()) return;
    try { if (window.ByteBrew) { window.ByteBrew.initializeByteBrew(ID, KEY, VER); ok = true; } } catch (e) { ok = false; }
  }
  function mins() { return Math.round((Date.now() - t0) / 6000) / 10; }
  function base() {
    const o = { min: String(mins()) };
    try { o.ch = String(CH.id); o.t = String(Math.round(GAME.time)); o.tool = String(PL.tool); } catch (_) { }
    return o;
  }
  // (until the log service has answered, events wait in a short line instead of getting lost)
  const waiting = []; let tries = 0, pump = 0;
  const ready = () => { try { return !!window.ByteBrew.isByteBrewInitialized(); } catch (_) { return false; } };
  function send(name, o) { try { window.ByteBrew.newCustomEvent(name, o); } catch (_) { } }
  function ev(name, extra) {
    if (!ok || userOff) return;
    let o; try { o = Object.assign(base(), extra || {}); for (const k in o) o[k] = String(o[k]).replace(/[;:=]/g, ' ').slice(0, 90); } catch (_) { return; }
    if (ready()) { send(name, o); return; }
    if (waiting.length < 30) waiting.push([name, o]);
    if (!pump) pump = setInterval(() => { if (userOff) { clearInterval(pump); pump = 0; waiting.length = 0; } else if (ready()) { clearInterval(pump); pump = 0; while (waiting.length) send(...waiting.shift()); } else if (++tries > 60) { clearInterval(pump); waiting.length = 0; } }, 1000);
  }
  function err(kind, msg, src) {
    if (!ok || userOff || errs >= 6) return; errs++;
    ev('pc_error', { kind, msg: String(msg || '').replace(/[?#]\S*/g, '').slice(0, 90), src: String(src || '').split(/[?#]/)[0].split('/').pop().slice(0, 60) });
  }
  // errors are caught from the very start (a game that never loads must show up too)
  function early() {
    init(); if (!ok || handlers) return; handlers = true;
    addEventListener('error', e => { const er = e.error; err('error', (er && er.message) || e.message, String(e.filename || '').split(/[?#]/)[0] + ':' + (e.lineno || 0)); });
    addEventListener('unhandledrejection', e => { const r = e.reason; err('promise', (r && (r.message || r.name)) || String(r), ''); });
  }
  function bootFail(e) { ev('pc_boot_fail', { msg: String((e && e.message) || e).slice(0, 90) }); }
  // once the game runs: hooks around a few game moments (the game itself is not changed)
  function start(resumed) {
    if (!ok || userOff || started) return; started = true;
    let ret = 'new'; try { ret = GAME.earned > 0 || GAME.chapter > 1 ? 'back' : 'new'; } catch (_) { }
    ev('pc_start', { ret, resumed: resumed ? '1' : '0', dev: IS_TOUCH ? 'touch' : 'mouse', scr: innerWidth + 'x' + innerHeight, host: where() });
    const wrap = (obj, fn, after) => { const f = obj[fn]; if (typeof f !== 'function') return; obj[fn] = function () { const r = f.apply(this, arguments); try { after.apply(this, arguments); } catch (_) { } return r; }; };
    wrap(GAME, 'completeArea', (a, silent) => { if (!silent && a && !a.quiet) ev('pc_job', { job: a.key, jobs: String(Object.keys(GAME.done).length) }); });
    wrap(GAME, 'buyTool', (t) => ev('pc_tool', { buy: t }));
    wrap(GAME, 'finishChapter', () => ev('pc_ch_done', { stars: String(GAME.lastStars || 0) }));
    wrap(GAME, 'goChapter', (id) => { ev('pc_ch_next', { to: String(id) }); hid = true; });   // (moving on to the next chapter is not leaving the game)
    wrap(PL, 'unstick', () => { if (unst++ < 3) ev('pc_unstick', { x: String(Math.round(PL.x)), z: String(Math.round(PL.z)) }); });
    // how smooth it runs on this device (once, after half a minute of play)
    let n = 0, fps0 = 0, fpsT = 0;
    const meter = () => { if (document.hidden) { fps0 = 0; return requestAnimationFrame(meter); } const now = performance.now(); if (!fps0) fps0 = now; n++; if (now - fps0 >= 10000) { if (fpsT++ === 2) { let q = '?'; try { q = String(QUAL.tier); } catch (_) { } ev('pc_fps', { fps: String(Math.round(n * 1000 / (now - fps0))), q }); return; } n = 0; fps0 = now; } requestAnimationFrame(meter); };
    requestAnimationFrame(meter);
    setInterval(() => { if (!document.hidden) { aliveT++; if (aliveT % 120 === 0) ev('pc_alive'); } }, 1000);
    const bye = () => { if (hid) return; hid = true; let ds = '?'; try { ds = DSTORM.st; } catch (_) { } ev('pc_quit', { jobs: String(Object.keys(GAME.done).length), ended: GAME.ended ? '1' : '0', ds }); };
    addEventListener('pagehide', bye);
    document.addEventListener('visibilitychange', () => { if (document.hidden) bye(); else hid = false; });
  }
  // the Privacy card: the player can switch the stats off, and back on (remembered on this device)
  function setOn(on) {
    userOff = !on; store(OFFK, on ? null : '1');
    const B = window.ByteBrew; if (!B || blocked()) return;
    if (!on) { waiting.length = 0; try { B.stopTracking(); } catch (_) { } return; }
    try { B.restartTracking(); } catch (_) { }   // (the library's own switch goes back on; if it ran in this page it starts again by itself)
    if (!ok) { early(); if (window.__ready) start(false); }
  }
  // a short note on the chapter card for players who have not seen it yet
  function noticeDue() {
    if (force) return true;
    if (blocked() || store(SEENK)) return false;
    store(SEENK, '1'); return true;
  }
  return { early, start, ev, err, bootFail, on: () => ok && !userOff, isOn: () => !userOff, setOn, noticeDue, avail: () => force || !blocked() };
})();
PCLOG.early();
