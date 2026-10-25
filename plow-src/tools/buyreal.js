// real-time (not held) check: buy a machine, wait, screenshot the HUD
const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/?nointro&fresh&ch=' + (process.env.CH || 2) + '&carry=40000');
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => ({ coins: GAME.coins, shop: CH.shop, next: GAME.nextTool && GAME.nextTool() }));
  await page.evaluate((t) => GAME.buyTool(t), process.env.TOOL || 'thrower');
  await page.waitForTimeout(+process.env.WAIT || 6000);
  const after = await page.evaluate(() => ({ coins: GAME.coins, owned: GAME.owned, next: GAME.nextTool && GAME.nextTool(), hero: CAM.hero }));
  await page.screenshot({ path: process.argv[2] });
  console.log(JSON.stringify({ before, after })); console.log(errs.join('\n') || 'ok'); await browser.close();
})();
