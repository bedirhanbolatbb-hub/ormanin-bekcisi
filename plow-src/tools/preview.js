const { chromium } = require('playwright');
(async () => {
  const ids = process.argv[2], out = process.argv[3];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1320, height: 900 } });
  page.on('pageerror', e => console.log('PAGEERROR ' + e.message));
  await page.goto('http://localhost:8766/index.html#' + ids);
  await page.waitForFunction(() => window.__done, null, { timeout: 120000 });
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
})();
