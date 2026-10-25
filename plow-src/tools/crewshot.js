const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('PAGEERROR ' + e.message));
  await page.goto('http://localhost:8765/?nointro&bot');
  await page.waitForFunction(() => window.__ready, null, { timeout: 90000 });
  await page.waitForTimeout(1200);
  for (const [T, who] of [[34, 0], [62, 1], [75, 0]]) {
    const info = await page.evaluate(([T, who]) => {
      window.__hold = true; while (GAME.time < T) { __step(3, 1 / 30); UI.update(0.1); }
      const h = CREW.list[who]; if (!h) return 'no helper ' + who;
      const sx = PL.x, sz = PL.z, sh = PL.h, kv = PL.kid.root.visible;
      PL.x = h.x; PL.z = h.z + 0.01; PL.kid.root.visible = false; PL.sled.visible = false;
      window.__render();
      PL.x = sx; PL.z = sz; PL.h = sh; PL.kid.root.visible = kv; PL.sled.visible = kv;
      return h.D.name + ' job=' + (h.job ? h.job.key : '-') + ' at ' + h.x.toFixed(1) + ',' + h.z.toFixed(1);
    }, [T, who]);
    console.log(T, info);
    await page.screenshot({ path: `${out}/crew_${T}.png` });
  }
  await browser.close();
})();
