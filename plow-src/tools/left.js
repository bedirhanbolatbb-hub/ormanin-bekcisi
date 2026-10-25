// run the bot to time T, then print where the current goal area still has snow (clusters)
// node tools/left.js <T> [query]
const { chromium } = require('playwright');
(async () => {
  const T = +(process.argv[2] || 190), q = process.argv[3] || 'nointro&bot';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', e => console.log('PAGEERROR ' + e.message));
  await page.goto('http://localhost:8765/?' + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  const r = await page.evaluate((T) => {
    window.__hold = true; while (GAME.time < T) __step(30, 1 / 30);
    const a = SNOW.areas[SNOW.hlArea]; if (!a) return { none: true };
    const N = SNOW.NX, cl = {};
    let left = 0;
    for (let k = 0; k < SNOW.H.length; k++) {
      if (SNOW.A[k] !== a.id || SNOW.T[k] !== 1 || SNOW.H[k] < SNOW.THR) continue;
      left++;
      const x = SNOW.X0 + (k % N) * SNOW.C, z = SNOW.Z0 + ((k / N) | 0) * SNOW.C;
      const key = Math.round(x) + ',' + Math.round(z / 2) * 2;
      cl[key] = (cl[key] || 0) + 1;
    }
    const top = Object.entries(cl).sort((p, q) => q[1] - p[1]).slice(0, 25);
    return { area: a.key, total: a.total, cleared: a.cleared, left, prog: SNOW.prog(a), top, pl: [PL.x.toFixed(1), PL.z.toFixed(1)], w: PL.stats().w };
  }, T);
  console.log(JSON.stringify(r));
  await browser.close();
})();
