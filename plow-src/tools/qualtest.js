// picture quality: a slow device steps down (sharpness, then shadows), remembers it, and ?noq keeps full quality
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '/tmp';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: +(process.argv[3] || 1) });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  const info = () => page.evaluate(() => ({ tier: QUAL.tier, pr: renderer.getPixelRatio(), shadow: WORLD.sun.castShadow, map: WORLD.sun.shadow.mapSize.x, saved: localStorage.getItem('plowtown_q'), low: QUAL.low, warm: +QUAL.warm.toFixed(1), canvas: document.getElementById('c').width + 'x' + document.getElementById('c').height }));
  await page.goto('http://localhost:8765/?nointro&fresh&nosave');
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await page.evaluate(() => localStorage.removeItem('plowtown_q'));
  await page.goto('http://localhost:8765/?nointro&fresh&nosave');
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  console.log('start', JSON.stringify(await info()));
  // keep driving so the town moves (real time)
  await page.keyboard.down('KeyA');
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(5000); console.log((i + 1) * 5 + 's', JSON.stringify(await info())); }
  await page.keyboard.up('KeyA');
  // (no screenshot: far too slow in the software renderer at 2x)
  // next start: the lighter picture right away
  await page.goto('http://localhost:8765/?nointro&nosave');
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  console.log('reload', JSON.stringify(await info()));
  await page.goto('http://localhost:8765/?nointro&nosave&noq');
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await page.waitForTimeout(15000);
  console.log('noq', JSON.stringify(await info()));
  console.log(errs.slice(0, 8).join('\n') || 'no errors');
  await browser.close();
})();
