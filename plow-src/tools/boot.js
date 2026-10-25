const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('ERR ' + m.text()); });
  page.on('requestfailed', r => errs.push('REQFAIL ' + r.url()));
  await page.goto(process.argv[2] || 'http://localhost:8765/');
  await page.waitForFunction(() => window.__ready, null, { timeout: 90000 });
  await page.waitForTimeout(6000);
  // drag to move for a few seconds
  const vp = page.viewportSize();
  await page.touchscreen.tap(vp.width / 2, vp.height / 2);
  await page.mouse.move(vp.width / 2, vp.height * 0.6); await page.mouse.down(); await page.mouse.move(vp.width / 2 - 60, vp.height * 0.6 - 40, { steps: 5 }); await page.waitForTimeout(3000); await page.mouse.up();
  await page.screenshot({ path: process.argv[3] || '/tmp/boot.png' });
  const info = await page.evaluate(() => ({ tool: PL.tool, coins: GAME.coins, ver: document.title, glb: performance.getEntriesByType('resource').filter(e => e.name.includes('town.glb')).map(e => e.name.split('/').pop()) }));
  console.log(JSON.stringify(info)); console.log(errs.join('\n') || 'no errors');
  await browser.close();
})();
