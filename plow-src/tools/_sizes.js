const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [n, w, h, mob] of [['c', 960, 540, 0], ['d', 1216, 684, 0]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: !!mob, hasTouch: !!mob });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:8765/?nointro&nosave&nodaily&fresh&ch=2&carry=20000`);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await page.evaluate(() => { window.__hold = true; CAM.intro = 0; document.getElementById('loading').style.display = 'none'; for (let i = 0; i < 90; i++) { CAM.hero = 0; __step(1, 1 / 30); } UI.banner('ROAD PLOWED!', '+120 tip', 'road'); __render(); document.getAnimations().forEach(a => { a.pause(); a.currentTime = 600; }); });
    await page.waitForTimeout(100);
    await page.evaluate(() => __render());
    await page.screenshot({ path: `${out}_${n}.png` });
    await ctx.close();
  }
  await browser.close();
})();
