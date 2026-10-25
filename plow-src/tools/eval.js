const { chromium } = require('playwright');
(async () => {
  const q = process.argv[2], code = process.argv[3];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.goto('http://localhost:8765/?' + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.evaluate(() => { window.__hold = true; });
  const r = await page.evaluate(code);
  console.log(logs.join('\n')); console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 1));
  await browser.close();
})();
