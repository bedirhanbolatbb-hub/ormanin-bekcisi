const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.goto(process.argv[2] || 'http://localhost:8765/');
  await page.waitForFunction(() => window.__ready, null, { timeout: 90000 });
  await page.waitForTimeout(2000); console.log("evaluating");
  const r = await page.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); function f() { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res({ fps: n / 3, calls: RENDER && RENDER.info ? RENDER.info.render.calls : -1 }); } requestAnimationFrame(f); }));
  console.log(JSON.stringify(r));
  const r2 = await page.evaluate(() => { const ren = (typeof renderer !== 'undefined' && renderer) || null; return { tris: ren ? ren.info.render.triangles : -1, calls: ren ? ren.info.render.calls : -1, geos: ren ? ren.info.memory.geometries : -1, px: ren ? ren.getPixelRatio() : -1 }; });
  console.log(JSON.stringify(r2));
  console.log(errs.join('\n') || 'no errors');
  await browser.close();
})();
