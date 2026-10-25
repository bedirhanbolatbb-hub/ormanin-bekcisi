const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack||'').split('\n').slice(0,4).join('\n')));
  page.on('console', m => { errs.push('CON[' + m.type() + '] ' + m.text()); });
  page.on('requestfailed', r => errs.push('REQFAIL ' + r.url()));
  await page.goto(process.argv[2] || 'http://localhost:8765/');
  const t0 = Date.now();
  try { await page.waitForFunction(() => window.__ready, null, { timeout: 90000 }); } catch (e) { console.log('no ready'); }
  console.log('ready after', Date.now() - t0);
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(1000);
    const r = await Promise.race([page.evaluate(() => ({ t: performance.now() | 0, fr: window.__frames || 0, intro: CAM.intro, open: CHUI.open, ch: CH && CH.id })), new Promise(r => setTimeout(() => r('EVAL TIMEOUT'), 5000))]);
    console.log(JSON.stringify(r));
  }
  console.log(errs.slice(0, 40).join('\n') || 'no errors');
  await browser.close();
})();
