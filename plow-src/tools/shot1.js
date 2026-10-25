// node tools/shot1.js out.png [query] [cam]  -> one phone screenshot after boot (held loop)
const { chromium, devices } = require('playwright');
(async () => {
  const out = process.argv[2] || '/tmp/s.png', q = process.argv[3] || 'nointro';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext(process.env.DESK ? { viewport: { width: 1280, height: 720 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text()); });
  await page.goto('http://localhost:8765/?' + q);
  await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 120000 }).catch(() => errs.push('no ready'));
  await page.evaluate((s) => { window.__hold = true; if (s) eval(s); __step(20, 1 / 30); __render(); }, process.env.PRE || '');
  await page.waitForTimeout(300);
  await page.screenshot({ path: out });
  console.log(errs.slice(0, 20).join('\n') || 'no errors');
  await browser.close();
})();
