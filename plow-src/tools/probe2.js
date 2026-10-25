const { chromium } = require('playwright');
(async () => {
  const q = process.argv[2], T = +process.argv[3], code = process.argv[4];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  page.on('pageerror', e => console.log('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8765/?' + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 90000 });
  const r = await page.evaluate(([T, code]) => { window.__hold = true; let n = 0; while (GAME.time < T && n++ < 30 * 600) { __step(1, 1 / 30); if (GAME.ended && (window.__e = (window.__e || 0) + 1) > 30 * 4) break; } return eval(code); }, [T, code]);
  console.log(JSON.stringify(r, null, 0));
  await browser.close();
})();
