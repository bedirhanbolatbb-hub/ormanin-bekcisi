// look at a chapter: finish some jobs, let time run, then shoot from fixed cameras (and print a probe)
// node tools/chview.js <ch> <prefix> <jobs: a,b,c | all | -> <seconds> "px,py,pz,lx,ly,lz;..." [probe js] [play]
//   play: also one shot from the game camera (HUD on)
const { chromium } = require('playwright');
(async () => {
  const [ch, pre, jobs, secs, camsArg, probe, play] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +(process.env.VW || 960), height: +(process.env.VH || 540) } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && !/TUNNEL|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await page.goto(`http://localhost:${process.env.PORT || 8765}/?nointro&fresh&nosave&nodaily&ch=${ch}&carry=${process.env.CARRY || 3000000}${process.env.Q || ''}`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const r = await page.evaluate(([jobs, secs, probe]) => {
    window.__hold = true; document.getElementById('loading').style.display = 'none';
    const list = jobs === 'all' ? GOALS.filter(g => g.a).map(g => g.a) : jobs && jobs !== '-' ? jobs.split(',') : [];
    for (const k of list) { const a = WORLD.areaByKey[k]; if (a && !a.done) GAME.completeArea(a, false); }
    const n = Math.round(+secs * 30); for (let i = 0; i < n; i++) { __step(1, 1 / 30); CAM.update(1 / 30); }
    SNOW.flush(true);
    let out = null; try { out = probe ? eval(probe) : null; } catch (e) { out = 'probe error ' + e.message; }
    return { done: Object.keys(GAME.done), ended: GAME.ended, coins: Math.round(GAME.coins), out };
  }, [jobs, secs, probe || '']);
  console.log(JSON.stringify(r));
  if (play) { await page.evaluate(() => { CAM.update(0, true); __render(); }); await page.screenshot({ path: pre + 'play.png' }); }
  await page.evaluate(() => { document.getElementById('hud').style.display = 'none'; for (const id of ['chRes', 'chMap', 'chIntro']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } });
  let i = 0;
  for (const c of (camsArg || '').split(';').filter(Boolean)) {
    const v = c.split(',').map(Number);
    await page.evaluate((v) => { CAM.show = null; CAM.update(0, true); CAM.cam.position.set(v[0], v[1], v[2]); CAM.cam.lookAt(v[3], v[4], v[5]); CAM.cam.updateMatrixWorld(); SNOW.flush(true); scene.fog.near = 400; scene.fog.far = 900; renderer.render(scene, CAM.cam); }, v);
    await page.screenshot({ path: pre + (i++) + '.png' });
  }
  console.log(errs.slice(0, 10).join('\n') || 'no errors');
  await browser.close();
})();
