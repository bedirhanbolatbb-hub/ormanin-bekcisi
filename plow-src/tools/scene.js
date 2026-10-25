// scripted visual checks: node tools/scene.js outdir
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +(process.env.VW || 1280), height: +(process.env.VH || 720) } });
  page.on('pageerror', e => console.log('PAGEERROR: ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error') console.log('ERR', m.text()); });
  await page.goto('http://localhost:8765/?nointro&fresh&nosave');
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.evaluate(() => { window.__hold = true; window.hold = (k, n) => { INPUT.keys[k] = 1; __step(n); INPUT.keys[k] = 0; }; });
  const shot = async (name, code) => { if (code) await page.evaluate(code); await page.evaluate(() => window.__render()); await page.screenshot({ path: out + '/' + name + '.png' }); console.log('shot', name); };
  // 1: shoveling into Rose's driveway, mid-toss
  await shot('a_shovel', () => { PL.x = -5.6; PL.z = 45.6; PL.h = -Math.PI / 2; PL.sledX = -4.2; PL.sledZ = 45.6; hold('KeyA', 40); hold('KeyS', 3); hold('KeyD', 18); INPUT.keys.KeyD = 1; __step(4); INPUT.keys.KeyD = 0; });
  // 2: full -> arrow + beam
  await shot('b_full', () => { PL.loads.sled = PL.stats().cap; __step(10); });
  // 3: dumping at melter
  await shot('c_dump', () => { const M = WORLD.melters[0]; PL.x = M.zone.x; PL.z = M.zone.z + 0.5; PL.h = Math.PI; __step(14); });
  await shot('c_dump2', () => { __step(10); });
  // 4: complete Rose
  await shot('d_done', () => { const a = WORLD.areaByKey.rose; GAME.completeArea(a, false); PL.x = -8; PL.z = 44.5; __step(40); });
  // 5: blower
  await shot('e_blower', () => { GAME.owned.blower = 1; GAME.coins += 500; PL.setTool('blower'); PL.x = -4.4; PL.z = 30; PL.h = Math.PI; PL.sledX = -4.4; PL.sledZ = 32; UI.refreshTools(); hold('KeyW', 50); INPUT.keys.KeyW = 1; __step(3); INPUT.keys.KeyW = 0; });
  // 6: truck
  await shot('f_truck', () => { GAME.owned.truck = 1; PL.setTool('truck'); PL.x = -1.75; PL.z = 40; PL.h = Math.PI; UI.refreshTools(); INPUT.keys.KeyW = 1; __step(90); INPUT.keys.KeyW = 0; });
  // 7: overview of houses lit at dusk-ish
  await shot('g_houses', () => { for (const k of ['miller', 'hale', 'park']) GAME.completeArea(WORLD.areaByKey[k], false); __step(60); });
  await browser.close();
})();
