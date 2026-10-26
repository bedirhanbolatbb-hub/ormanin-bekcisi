// record gameplay to PNG frames with virtual time (the page thinks it runs at a steady 30 fps; CSS animations match)
// node tools/record.js outDir W H scale frames "<query>" [warmSec] [jsBefore]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [dir, W, H, SC, N, q, warm, pre] = process.argv.slice(2);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: +(SC || 1), isMobile: !!process.env.MOB, hasTouch: !!process.env.MOB });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/?' + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 180000 });
  // fast-forward with the held stepper (no rendering) to an interesting moment
  await page.evaluate(([warm, pre]) => {
    window.__hold = true; const L = document.getElementById('loading'); if (L) L.style.display = 'none';
    for (let i = 0; i < warm * 30; i++) step(1 / 30);
    if (pre) eval(pre);
  }, [+(warm || 0), pre || '']);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await page.evaluate(() => { window.__hold = false; });
  for (let i = 0; i < +N; i++) {
    await new Promise(res => { cdp.once('Emulation.virtualTimeBudgetExpired', res); cdp.send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: 1000 / 30 }); });
    await page.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}.png` });
  }
  if (errs.length) console.log(errs.slice(0, 5).join('\n'));
  await browser.close();
})();
