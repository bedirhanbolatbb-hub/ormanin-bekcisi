// node tools/finshot.js <query> <prefix> -> run the bot to the chapter end, then screenshots of the finale camera
const { chromium } = require('playwright');
(async () => {
  const q = process.argv[2], pre = process.argv[3];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +(process.env.VW || 390), height: +(process.env.VH || 844) }, isMobile: true, hasTouch: true });
  const logs = [];
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8765/?' + q + '&fcam');
  await page.waitForFunction(() => window.__ready, null, { timeout: 90000 });
  await page.evaluate(() => { window.__hold = true; const l = document.getElementById('loading'); if (l) l.style.display = 'none'; });
  await page.evaluate(() => { let n = 0; while (!GAME.ended && n++ < 30 * 400) __step(1, 1 / 30); });
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => { for (let k = 0; k < 40; k++) { __step(1, 1 / 30); CAM.update(1 / 30); } __render(); });
    await page.screenshot({ path: pre + i + '.png' });
  }
  console.log(logs.join('\n') || 'ok');
  await browser.close();
})();
