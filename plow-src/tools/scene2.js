const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +(process.argv[3]||1280), height: +(process.argv[4]||720) } });
  page.on('pageerror', e => console.log('PAGEERROR: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error') console.log('ERR', m.text()); });
  await page.goto('http://localhost:8765/?nointro&fresh&nosave');
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.waitForTimeout(1800); await page.evaluate(() => { window.__hold = true; window.hold = (k, n) => { INPUT.keys[k] = 1; __step(n); INPUT.keys[k] = 0; }; });
  const shot = async (name, code) => { if (code) await page.evaluate(code); await page.evaluate(() => window.__render()); await page.screenshot({ path: out + '/' + name + '.png' }); console.log('shot', name); };
  await shot('t1_treasure', () => { const t = TREASURE.list.find(o => o.area === 'rose'); PL.x = t.x + 1.6; PL.z = t.z; PL.h = -Math.PI / 2; PL.sledX = PL.x + 1.3; PL.sledZ = PL.z; hold('KeyA', 16); __step(4); });
  await shot('t2_bigshovel', () => { GAME.coins += 100000; GAME.owned.bigshovel = 1; PL.setTool('bigshovel', true); PL.x = -6.5; PL.z = 44.2; PL.h = -Math.PI / 2; PL.sledX = -5; PL.sledZ = 44.2; hold('KeyA', 30); INPUT.keys.KeyA = 1; __step(3); INPUT.keys.KeyA = 0; });
  await shot('t3_mega', () => { GAME.owned.blower = 1; GAME.owned.megablower = 1; PL.setTool('megablower', true); PL.x = 4.4; PL.z = 30; PL.h = Math.PI; PL.sledX = 4.4; PL.sledZ = 32; UI.refreshTools(); hold('KeyW', 40); INPUT.keys.KeyW = 1; __step(3); INPUT.keys.KeyW = 0; });
  await shot('t4_dump', () => { GAME.owned.truck = 1; GAME.owned.dumpplow = 1; PL.setTool('dumpplow', true); PL.x = -1.75; PL.z = 38; PL.h = Math.PI; UI.refreshTools(); INPUT.keys.KeyW = 1; __step(70); INPUT.keys.KeyW = 0; });
  await shot('t5_groomer', () => { GAME.owned.groomer = 1; PL.setTool('groomer', true); PL.x = 0; PL.z = 0; PL.h = Math.PI; UI.refreshTools(); INPUT.keys.KeyW = 1; __step(70); INPUT.keys.KeyW = 0; });
  await shot('t6_card', () => { GAME.coins = 30; delete GAME.owned.bigshovel; delete GAME.owned.blower; delete GAME.owned.megablower; delete GAME.owned.truck; delete GAME.owned.dumpplow; delete GAME.owned.groomer; PL.setTool('shovel', true); PL.x = -6; PL.z = 46.4; UI.refreshTools(); __step(10); });
  await browser.close();
})();
