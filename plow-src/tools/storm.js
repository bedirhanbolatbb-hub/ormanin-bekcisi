const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('PAGEERROR: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('http://localhost:8765/?nointro&fresh&nosave');
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.evaluate(() => { window.__hold = true; GAME.owned.blower = 1; GAME.owned.truck = 1; PL.setTool('truck'); for (const a of SNOW.areas) if (a) GAME.completeArea(a, true); GAME.ended = true; STORM.next = 1; PL.x = -1.75; PL.z = 30; PL.h = Math.PI; __step(30 * 8); });
  await page.evaluate(() => window.__render()); await page.screenshot({ path: out + '/storm1.png' });
  await page.evaluate(() => { __step(30 * 8); INPUT.keys.KeyW = 1; __step(60); INPUT.keys.KeyW = 0; });
  await page.evaluate(() => window.__render()); await page.screenshot({ path: out + '/storm2.png' });
  console.log(JSON.stringify(await page.evaluate(() => ({ phase: STORM.phase, mult: STORM.mult, load: PL.load }))));
  await browser.close();
})();
