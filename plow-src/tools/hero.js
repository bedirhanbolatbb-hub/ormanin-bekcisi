const { chromium, devices } = require('playwright');
(async () => {
  const pre = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext(process.env.DESK ? { viewport: { width: 960, height: 540 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(([t, k]) => { window.__T = t; window.__K = k; }, [process.env.TOOL || 'thrower', +process.env.K || 12]);
  await page.goto('http://localhost:8765/?nointro&fresh&ch=' + (process.env.CH || 2) + '&carry=' + (process.env.CARRY || 40000));
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await page.evaluate(() => { window.__hold = true; document.getElementById('loading').style.display = 'none'; CAM.intro = 0; GAME.buyTool(window.__T || 'thrower'); });
  for (let i = 0; i < (+process.env.N || 4); i++) { await page.evaluate(() => { for (let k = 0; k < (window.__K || 12); k++) { __step(1, 1 / 30); CAM.update(1 / 30); } SNOW.flush(); placeSun(); renderer.render(scene, CAM.cam); }); await page.screenshot({ path: pre + i + '.png' }); }
  console.log(errs.join('\n') || 'ok'); await browser.close();
})();
