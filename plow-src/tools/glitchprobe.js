// probe the stale-HUD duplicate seen in recorded frames: same virtual-clock stepping as record2.js,
// but at chosen frames take several screenshots and dump layout / animation state.
// node tools/glitchprobe.js outDir W H scale frames "<query>" warmSec "<pre>" "f1,f2,.."
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [dir, W, H, SC, N, q, warm, pre, list] = process.argv.slice(2);
  const want = new Set((list || '').split(',').map(Number));
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars'].concat((process.env.XARGS || '').split(' ').filter(Boolean)) });
  const page = await browser.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: +(SC || 1) });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => {
    let vt = 0, on = false; const pn = performance.now.bind(performance); let base = 0;
    const timers = []; let tid = 1e7; const st = window.setTimeout.bind(window), ct = window.clearTimeout.bind(window), si = window.setInterval.bind(window), ci = window.clearInterval.bind(window);
    performance.now = () => on ? base + vt : pn();
    window.setTimeout = (fn, ms, ...a) => { if (!on) return st(fn, ms, ...a); const id = ++tid; timers.push({ id, at: vt + (+ms || 0), fn, a }); return id; };
    window.clearTimeout = (id) => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); else ct(id); };
    window.setInterval = (fn, ms, ...a) => { if (!on) return si(fn, ms, ...a); const id = ++tid; timers.push({ id, at: vt + (+ms || 16), fn, a, rep: +ms || 16 }); return id; };
    window.clearInterval = (id) => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); else ci(id); };
    window.__vclock = {
      start() { base = pn(); vt = 0; on = true; },
      adv(ms) {
        const end = vt + ms;
        for (;;) { timers.sort((p, q) => p.at - q.at); const t = timers[0]; if (!t || t.at > end) break; vt = Math.max(vt, t.at); if (t.rep) t.at += t.rep; else timers.shift(); try { typeof t.fn === 'function' ? t.fn(...t.a) : 0; } catch (e) { console.error(e); } }
        vt = end;
        for (const a of document.getAnimations()) { if (a._v == null) { a._v = vt - (a.currentTime || 0); a.pause(); } a.currentTime = Math.max(0, vt - a._v); }
      },
      get t() { return vt; },
    };
  });
  await page.goto('http://localhost:8765/?' + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 180000 });
  await page.evaluate(([warm, pre]) => {
    window.__hold = true; const L = document.getElementById('loading'); if (L) L.style.display = 'none';
    for (let i = 0; i < warm * 30; i++) { step(1 / 30); CAM.update(1 / 30); }
    if (pre) eval(pre);
    window.__vclock.start();
    CAM.update(0, true);
  }, [+(warm || 0), pre || '']);
  const info = [];
  for (let i = 0; i < +N; i++) {
    await page.evaluate(() => {
      const dt = 1 / 30; window.__vclock.adv(1000 / 30);
      step(dt);
      SNOW.flush(); const now = performance.now(); SNOW.uni.uTime.value = now / 1000; SNOW.uni.uPulse.value = 0.5 + 0.5 * Math.sin(now / 260);
      CAM.update(dt);
      if (scene.fog) { const k = Math.max(0, CAM.intro), E = WORLD.env; scene.fog.near = E.fogNear + k * 80; scene.fog.far = E.fogFar + k * 160; }
      GUIDE.update(dt); updXray(); placeSun(); FX.center.set(CAM.x, 0, CAM.z);
      UI.update(dt);
      renderer.render(scene, CAM.cam);
    });
    if (!want.has(i)) { await page.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}.png` }); continue; }
    const d = await page.evaluate(() => {
      const r = (id) => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height), cs.transform, cs.display, cs.opacity, e.className]; };
      const anims = document.getAnimations().map(a => { const t = a.effect && a.effect.target; return [t ? (t.id || t.className || t.tagName) : '?', a.animationName || (a.constructor && a.constructor.name), a.playState, Math.round(a.currentTime || 0)]; });
      return {
        scroll: [window.scrollX, window.scrollY, document.documentElement.scrollTop, document.body.scrollTop, visualViewport.offsetTop, visualViewport.pageTop, visualViewport.height, innerHeight],
        hud: ['coinBox', 'goal', 'btnMute', 'btnMap', 'timer', 'ups', 'tools', 'streak', 'income', 'loadTag', 'banner', 'toast', 'hint', 'bubbles', 'fx2d', 'c'].map(id => [id, r(id)]),
        bodyH: [document.body.scrollHeight, document.documentElement.scrollHeight, document.body.clientHeight],
        nHud: document.getElementById('hud').querySelectorAll('*').length,
        anims,
        float: [...document.querySelectorAll('.ftext,.float,.fly')].length,
        coin: document.getElementById('coinTxt').textContent,
      };
    });
    info.push({ i, ...d });
    await page.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}.png` });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}_b.png` });
    // CDP direct capture as a third opinion
    const cdp = await page.context().newCDPSession(page);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${dir}/f${String(i).padStart(4, '0')}_c.png`, Buffer.from(shot.data, 'base64'));
    await cdp.detach();
  }
  fs.writeFileSync(`${dir}/info.json`, JSON.stringify(info, null, 1));
  if (errs.length) console.log(errs.slice(0, 5).join('\n'));
  await browser.close();
})();
