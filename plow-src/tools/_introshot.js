const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [n, vp] of (process.argv[3] ? [['s', { viewport: { width: 740, height: 360 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }]] : [['d', { viewport: { width: 960, height: 540 } }], ['m', { viewport: { width: 390, height: 760 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }]])) {
    const ctx = await browser.newContext(vp); const page = await ctx.newPage();
    await page.goto(`http://localhost:8766/?nosave&nodaily&fresh&ch=1`);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await page.waitForFunction(() => CHUI.introUp, null, { timeout: 20000 });
    await page.evaluate(() => { window.__hold = true; for (let i = 0; i < 40; i++) CAM.update(1 / 30); __render(); });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}_${n}.png` });
    await ctx.close();
  }
  await browser.close();
})();
