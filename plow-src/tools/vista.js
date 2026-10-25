// node tools/vista.js <ch> <prefix> "px,py,pz,lx,ly,lz;..." [done=1]  -> desktop shots from fixed cameras (optionally with every job done)
const { chromium } = require('playwright');
(async () => {
  const ch = process.argv[2], pre = process.argv[3], cams = process.argv[4].split(';'), done = process.argv[5] === '1';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errs.push(m.text()); });
  await page.goto(`http://localhost:8765/?nointro&fresh&ch=${ch}&carry=999999`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await page.evaluate((done) => { window.__hold = true; document.getElementById('loading').style.display = 'none'; document.getElementById('hud').style.display = 'none'; const st = document.createElement('style'); st.textContent = '.chov,#chFade{display:none !important}'; document.head.appendChild(st);
    if (done) { for (const g of GOALS) if (g.a) { const a = WORLD.areaByKey[g.a]; if (a && !a.done) GAME.completeArea(a, false); } }
    for (let i = 0; i < 30 * 6; i++) __step(1, 1 / 30); }, done);
  let i = 0;
  for (const c of cams) {
    const v = c.split(',').map(Number);
    await page.evaluate((v) => { CAM.update(0, true); CAM.cam.position.set(v[0], v[1], v[2]); CAM.cam.lookAt(v[3], v[4], v[5]); CAM.cam.updateMatrixWorld(); SNOW.flush(); renderer.render(scene, CAM.cam); }, v);
    await page.screenshot({ path: pre + (i++) + '.png' });
  }
  console.log(errs.slice(0, 8).join('\n') || 'ok');
  await browser.close();
})();
