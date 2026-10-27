const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [n, vp] of [['s', { viewport: { width: 740, height: 360 }, isMobile: true, hasTouch: true }], ['p', { viewport: { width: 390, height: 700 }, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext(vp); const page = await ctx.newPage();
    await page.goto(`http://localhost:8766/?nointro&nosave&nodaily&fresh&ch=2&carry=20000`);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await page.evaluate(() => { window.__hold = true; GAME.lastStars = 3; GAME.lastNew = true; GAME.chapters[2] = { stars: 3, done: 1 }; CHUI.results(); __render(); });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${out}_${n}.png` });
    await ctx.close();
  }
  await browser.close();
})();
