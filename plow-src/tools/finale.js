const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('PAGEERROR: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log(m.type(), m.text()); });
  await page.goto('http://localhost:8765/?nointro&fresh&nosave');
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.evaluate(() => { window.__hold = true; });
  await page.evaluate(() => {
    GAME.owned.blower = 1; GAME.owned.truck = 1; PL.setTool('truck'); UI.refreshTools();
    for (const a of SNOW.areas) if (a && a.key !== 'plaza') GAME.completeArea(a, false);
    __step(60);
    PL.x = 1.5; PL.z = -12; PL.h = Math.PI;
    GAME.completeArea(WORLD.areaByKey.plaza, false);
    __step(75);
  });
  await page.evaluate(() => window.__render()); await page.screenshot({ path: out + '/fin1.png' });
  await page.evaluate(() => { __step(120); });
  await page.waitForTimeout(5500);
  await page.evaluate(() => window.__render()); await page.screenshot({ path: out + '/fin2.png' });
  const r = await page.evaluate(() => ({ ended: GAME.ended, cars: WORLD.cars.map(c => c.state), movers: LIFE.movers.length, goal: GAME.goalIdx() }));
  console.log(JSON.stringify(r));
  await browser.close();
})();
