// record gameplay frames deterministically: the page runs on a virtual clock from the very start (game steps,
// timers and CSS animations all advance exactly 1/30 s per frame, warm-up included), so banners and pops look right.
// Every frame is captured until two captures agree (a capture can now and then show a stale HUD tile).
// node tools/record3.js outDir W H scale frames "<query>" [warmSec] [jsBefore] [jsEachFrame]
const { chromium } = require('playwright');
const fs = require('fs');
const sharp = require('sharp');
(async () => {
  const [dir, W, H, SC, N, q, warm, pre, each] = process.argv.slice(2);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars', '--run-all-compositor-stages-before-draw'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: +(SC || 1), isMobile: !!process.env.MOB, hasTouch: !!process.env.MOB });
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
        for (const a of document.getAnimations()) { if (a._v == null) { a._v = vt; a.pause(); } a.currentTime = Math.max(0, vt - a._v); }
      },
      // animations born during this frame start at the current virtual time (and wait, paused, for the next tick)
      freeze() { for (const a of document.getAnimations()) if (a._v == null) { a._v = vt; a.pause(); a.currentTime = 0; } },
      get t() { return vt; },
    };
  });
  await page.goto('http://localhost:8765/?' + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 180000 });
  await page.evaluate(([warm, pre]) => {
    window.__hold = true; const L = document.getElementById('loading'); if (L) L.style.display = 'none';
    window.__vclock.start();
    if (pre) eval(pre);
    for (let i = 0; i < warm * 30; i++) { window.__vclock.adv(1000 / 30); step(1 / 30); CAM.update(1 / 30); UI.update(1 / 30); window.__vclock.freeze(); }
    CAM.update(0, true);
  }, [+(warm || 0), pre || '']);
  let retries = 0;
  const SW = 480, SH = Math.round(480 * +H / +W);
  const small = (b) => sharp(b).resize(SW, SH).removeAlpha().raw().toBuffer();
  const agree = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - b[i]) > 40 || Math.abs(a[i + 1] - b[i + 1]) > 40 || Math.abs(a[i + 2] - b[i + 2]) > 40) n++; return n < 25; };
  for (let i = 0; i < +N; i++) {
    await page.evaluate((each) => {
      const dt = 1 / 30; window.__vclock.adv(1000 / 30);
      step(dt);
      if (each) eval(each);
      SNOW.flush(); const now = performance.now(); SNOW.uni.uTime.value = now / 1000; SNOW.uni.uPulse.value = 0.5 + 0.5 * Math.sin(now / 260);
      CAM.update(dt);
      if (scene.fog) { const k = Math.max(0, CAM.intro), E = WORLD.env; scene.fog.near = E.fogNear + k * 80; scene.fog.far = E.fogFar + k * 160; }
      GUIDE.update(dt); updXray(); placeSun(); FX.center.set(CAM.x, 0, CAM.z);
      UI.update(dt);
      renderer.render(scene, CAM.cam);
      window.__vclock.freeze();
    }, each || '');
    // the page is frozen now: keep capturing until two captures agree (tiny noise is fine, a stale HUD tile is not)
    const shots = [await page.screenshot({ timeout: 180000 })], smalls = [await small(shots[0])];
    let pick = null;
    for (let k = 0; k < 6 && !pick; k++) {
      const s = await page.screenshot({ timeout: 180000 }), d = await small(s);
      const j = smalls.findIndex(p => agree(p, d));
      if (j >= 0) pick = shots[j]; else { shots.push(s); smalls.push(d); retries++; }
    }
    fs.writeFileSync(`${dir}/f${String(i).padStart(4, '0')}.png`, pick || shots[0]);
    if (process.env.DBG && shots.length > 1) shots.forEach((p, k) => fs.writeFileSync(`${dir}/x${String(i).padStart(4, '0')}_${k}.png`, p));
    if (!pick) console.log('frame', i, 'no two captures agreed');
  }
  console.log('frames', N, 'extra captures', retries);
  if (errs.length) console.log(errs.slice(0, 5).join('\n'));
  await browser.close();
})();
