const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('requestfailed', r => { if (!/crazygames/.test(r.url())) errs.push('FAILED ' + r.url()); });
  const t0 = Date.now();
  await page.goto('http://localhost:8765/?norender&nosave&nodaily');
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const r = await page.evaluate(() => ({ ch: CH.id, tool: PL.tool, areas: SNOW.areas.filter(Boolean).length, card: CHUI.introUp }));
  console.log('boot ok in', ((Date.now() - t0) / 1000).toFixed(1), 's', JSON.stringify(r), errs.join(' | ') || 'no errors');
  await browser.close();
})();
