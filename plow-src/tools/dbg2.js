const { chromium } = require('playwright');
(async () => {
  const secs = +(process.argv[2] || 300);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  page.on('pageerror', e => console.log('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8765/?nointro&bot');
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.evaluate(() => { window.__hold = true; });
  await page.evaluate((s) => { __step(Math.round(s * 30), 1 / 30); }, secs);
  const r = await page.evaluate(() => {
    const out = { x: PL.x, z: PL.z, vx: PL.vx, vz: PL.vz, h: PL.h, jit: BOT.jit, stuckT: BOT.stuckT, noPath: BOT.noPath, li: BOT.li, lp: BOT.lp };
    out.inp = BOT.get(1 / 30);
    out.free = []; for (let d = -1; d <= 1; d += 0.25) out.free.push([d, PL.kidFree(PL.x, PL.z + d), SNOW.type(PL.x, PL.z + d)]);
    out.freeX = []; for (let d = -1; d <= 1; d += 0.25) out.freeX.push([d, PL.kidFree(PL.x + d, PL.z)]);
    return out;
  });
  console.log(JSON.stringify(r));
  await browser.close();
})();
