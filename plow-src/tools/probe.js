const { chromium } = require('playwright');
(async () => {
  const q = process.argv[2] || 'nointro&fresh';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.goto('http://localhost:8765/?' + q);
  const t0 = Date.now();
  try { await page.waitForFunction(() => window.__ready, null, { timeout: 60000 }); } catch (e) { logs.push('TIMEOUT waiting ready'); }
  logs.push('ready after ' + (Date.now() - t0) + 'ms');
  await page.waitForTimeout(3000);
  const info = await page.evaluate(() => ({ frames: typeof frameN !== 'undefined' ? frameN : -1, calls: renderer && renderer.info.render.calls, tris: renderer && renderer.info.render.triangles, gl: renderer && renderer.getContext().getParameter(renderer.getContext().VERSION) }));
  logs.push(JSON.stringify(info));
  console.log(logs.join('\n'));
  await browser.close();
})();
