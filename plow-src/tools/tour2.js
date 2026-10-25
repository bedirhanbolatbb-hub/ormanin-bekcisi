// node tools/tour2.js <prefix> <query> "x,z,h;x,z,h;..."  -> phone screenshots with the player placed at each spot
const { chromium, devices } = require('playwright');
(async () => {
  const pre = process.argv[2], q = process.argv[3], spots = process.argv[4].split(';').map(s => s.split(',').map(Number));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext(process.env.DESK ? { viewport: { width: 960, height: 540 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text()); });
  await page.goto('http://localhost:8765/?' + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 }).catch(() => errs.push('no ready'));
  await page.waitForTimeout(1200);
  await page.evaluate((s) => { window.__hold = true; const l = document.getElementById('loading'); if (l) l.style.display = 'none'; if (s) eval(s); }, process.env.PRE || '');
  let i = 0;
  for (const [x, z, h, cam] of spots) {
    await page.evaluate(([x, z, h, cam]) => { PL.x = x; PL.z = z; PL.h = h; if (PL.kind === 'truck') PL.ensureFree(); __step(4, 1 / 30); if (cam) { CAM.d *= cam; } __render(); }, [x, z, h, cam || 0]);
    await page.waitForTimeout(150);
    await page.screenshot({ path: pre + (i++) + '.png' });
  }
  console.log(errs.slice(0, 20).join('\n') || 'no errors');
  await browser.close();
})();
