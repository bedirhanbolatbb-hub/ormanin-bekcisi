// store cover shots: a staged moment rendered with a cinematic camera (HUD hidden), optional title overlay
// node tools/cover.js out.png W H scale "<json setup>"
// setup: { ch, tool, x, z, h, drive, cam:[x,y,z], look:[x,y,z], fov, kids:[[x,z,h],...], title:true, tsize, ty, streak, coins }
const { chromium } = require('playwright');
(async () => {
  const [out, W, H, SC, js] = process.argv.slice(2); const S = JSON.parse(js || '{}');
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: +(SC || 1) });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:8765/?nointro&fresh&nosave&ch=${S.ch || 1}&carry=9000000`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 180000 });
  await page.evaluate((S) => {
    window.__hold = true;
    for (const id of ['loading', 'hud', 'chIntro']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
    const fx2 = document.getElementById('fx2d'); if (fx2) fx2.style.display = 'none';
    if (S.tool) { GAME.owned[S.tool] = 1; GAME.lv[S.tool] = [0, 1, 2].map(i => upMax(S.tool, i)); PL.setTool(S.tool, true); PL.applyTool(); }
    PL.x = S.x; PL.z = S.z; PL.h = S.h; PL.spd = 0;
    if (S.snow) SNOW.addSnow(S.x + Math.sin(S.h) * 8, S.z + Math.cos(S.h) * 8, S.snow[0], S.snow[1], true);
    INPUT.get = () => ({ x: Math.sin(S.h) * (S.drive ? 1 : 0), y: -Math.cos(S.h) * (S.drive ? 1 : 0) });
    // the crew cheering at the roadside
    for (const k of S.kids || []) { const n = NPC.spawn({ x: k[0], z: k[1], h: k[2], kind: k[3] || 'kid', pose: 'wave', pop: false }); NPC.cheer(n, 99); }
    for (let i = 0; i < (S.steps || 45); i++) { CAM.hero = 0; __step(1, 1 / 30); }
    if (S.streak) { STREAK.t = 40; STREAK.lv = 0; }
    window.__coverCam = S;
  }, S);
  // a few more frames so particles are in full flight, then the cinematic camera
  await page.evaluate((S) => {
    for (let i = 0; i < (S.more || 8); i++) { CAM.hero = 0; __step(1, 1 / 30); }
    SNOW.flush(); FX.update(0.001); placeSun();
    const c = CAM.cam; if (S.fov) { c.fov = S.fov; c.updateProjectionMatrix(); }
    // camera given relative to the machine: [right, up, forward] (so it frames the truck wherever the drive ended)
    const rel = (v) => { const fx = Math.sin(PL.h), fz = Math.cos(PL.h), rx = Math.cos(PL.h), rz = -Math.sin(PL.h); return [PL.x + rx * v[0] + fx * v[2], v[1], PL.z + rz * v[0] + fz * v[2]]; };
    if (S.camRel) { S.cam = rel(S.camRel); S.look = rel(S.lookRel); }
    c.position.set(...S.cam); c.lookAt(...S.look); c.updateMatrixWorld();
    XRAY.uD.value = 0;  // no see-through dither in a still
    for (const k of S.kidsRel || []) { const p = rel([k[0], 0, k[1]]); const h = Math.atan2(S.cam[0] - p[0], S.cam[2] - p[2]) + (k[2] || 0); const n = NPC.spawn({ x: p[0], z: p[2], h, kind: k[3] || 'kid', pose: 'wave', pop: false }); NPC.cheer(n, 99); n.t = k[4] || 0; }
    if (S.kidsRel) for (let i = 0; i < 40; i++) NPC.update(1 / 30);
    if (S.spray) {
      // a big wave of snow off both blade ends (in a still it has to be generous)
      const G = PL.geo, w = PL.stats().w, hx = Math.sin(PL.h), hz = Math.cos(PL.h), rx = Math.cos(PL.h), rz = -Math.sin(PL.h);
      for (let k = 0; k < S.spray; k++) for (const sd of [-1, 1]) { const bx = PL.x + hx * G.carve + rx * sd * w * 0.5, bz = PL.z + hz * G.carve + rz * sd * w * 0.5; FX.spray(bx, 0.5, bz, rx * sd * 1.1 + hx * 0.5, rz * sd * 1.1 + hz * 0.5, 4, 4.6, 0.26); }
      for (let i = 0; i < 6; i++) FX.puff(PL.x + hx * (G.carve + 0.8) + rx * (Math.random() - 0.5) * w, 0.6, PL.z + hz * (G.carve + 0.8) + rz * (Math.random() - 0.5) * w, 3, 1.4);
      for (let i = 0; i < (S.sprayT || 9); i++) FX.update(1 / 30);
    }
    if (S.coins) { const p = rel([0, 0, 1]); FX.coinBurst(p[0], 3.2, p[2], S.coins, 999, { up: 1.3, spread: 1.2 }); for (let i = 0; i < 10; i++) FX.update(1 / 30); }
    // sun follows the shot
    const s = WORLD.sun, so = WORLD.env.sunOff; s.position.set(S.look[0] + so[0], so[1], S.look[2] + so[2]); s.target.position.set(S.look[0], 0, S.look[2]); s.target.updateMatrixWorld();
    if (scene.fog) { scene.fog.near = WORLD.env.fogNear * (S.fogK || 1.4); scene.fog.far = WORLD.env.fogFar * (S.fogK || 1.4); }
    renderer.render(scene, c);
    if (S.title) {
      const d = document.createElement('div'); d.id = 'coverTitle';
      d.innerHTML = `<span>${S.title}</span>`;
      d.style.cssText = `position:fixed;left:0;right:0;top:${S.ty || 6}%;text-align:center;pointer-events:none;z-index:99;`;
      const sp = d.firstChild; sp.style.cssText = `display:inline-block;font-family:'Baloo 2',sans-serif;font-weight:800;font-size:${S.tsize || 120}px;line-height:1;color:#fff;letter-spacing:2px;` +
        `-webkit-text-stroke:${Math.round((S.tsize || 120) * 0.075)}px #1d3a6b;paint-order:stroke fill;text-shadow:0 ${Math.round((S.tsize || 120) * 0.07)}px 0 #1d3a6b, 0 ${Math.round((S.tsize || 120) * 0.12)}px ${Math.round((S.tsize || 120) * 0.2)}px rgba(10,30,70,.45);transform:rotate(-2deg);`;
      document.body.appendChild(d);
    }
  }, S);
  await page.waitForTimeout(400);
  await page.screenshot({ path: out });
  if (errs.length) console.log(errs.join('\n'));
  await browser.close();
})();
