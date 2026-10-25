// control check: drive each truck north, then hold the stick south and time the U-turn (like a person would)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  page.on('pageerror', e => console.log('PAGEERROR ' + e.message));
  await page.goto('http://localhost:8765/?nointro&fresh&nosave');
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  const r = await page.evaluate(() => {
    window.__hold = true;
    for (const t of TIERS) GAME.owned[t.key] = 1;
    const out = [];
    for (const tool of ['truck', 'dumpplow', 'groomer']) {
      for (const lv of [0, 3]) {
        GAME.lv[tool] = [lv, lv, lv];
        for (const x0 of [0, 2.0, -3.0, 3.6]) {
          PL.setTool('shovel', true); PL.setTool(tool, true);
          PL.x = x0; PL.z = 20; PL.h = Math.PI; PL.spd = 0; PL.escape = 0; PL.stuckT = 0; PL.applyTool(); PL.ensureFree();
          const sx = PL.x;
          // drive north 1.5 s
          for (let i = 0; i < 45; i++) PL.update(1 / 30, { x: 0, y: 1 });
          // now hold the stick south (toward the camera) until facing south
          let t = 0, minX = 99, maxX = -99;
          while (t < 12) { PL.update(1 / 30, { x: 0, y: -1 }); t += 1 / 30; minX = Math.min(minX, PL.x); maxX = Math.max(maxX, PL.x); if (Math.cos(PL.h) > 0.95 && PL.spd > 1) break; }
          out.push(`${tool} lv${lv} x0=${x0}(${sx.toFixed(1)}) -> uturn ${t >= 12 ? 'FAILED' : t.toFixed(1) + 's'} at x=${PL.x.toFixed(1)} z=${PL.z.toFixed(1)} sweep x ${minX.toFixed(1)}..${maxX.toFixed(1)}`);
        }
      }
    }
    return out;
  });
  console.log(r.join('\n'));
  await browser.close();
})();
