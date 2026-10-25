// run the bot to time T0, then log the player state every few seconds (and take shots)
// node tools/stall.js <T0> <T1> <everySec> <outDir> [query]
const { chromium } = require('playwright');
(async () => {
  const T0 = +(process.argv[2] || 120), T1 = +(process.argv[3] || 160), every = +(process.argv[4] || 4), out = process.argv[5] || '/tmp', q = process.argv[6] || 'nointro&bot';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', e => console.log('PAGEERROR ' + e.message));
  await page.goto('http://localhost:8765/?' + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.evaluate((T0) => { window.__hold = true; while (GAME.time < T0) __step(30, 1 / 30); }, T0);
  let n = 0;
  for (let t = T0; t <= T1; t += every) {
    const r = await page.evaluate((every) => {
      __step(Math.round(every * 30), 1 / 30);
      const a = SNOW.areas[SNOW.hlArea];
      return { t: GAME.time.toFixed(0), x: PL.x.toFixed(1), z: PL.z.toFixed(1), h: PL.h.toFixed(2), spd: (PL.spd || 0).toFixed(2), tool: PL.tool, area: a ? a.key : '-', prog: a ? (SNOW.prog(a) * 100).toFixed(1) : '-', tgt: BOT.tgt ? BOT.tgt.x.toFixed(1) + ',' + BOT.tgt.z.toFixed(1) : '-', li: BOT.li + '/' + (BOT.laneList || []).length, rev: !!PL.rev, coins: Math.round(GAME.coins) };
    }, every);
    console.log(JSON.stringify(r));
    if (n++ % 2 === 0) { await page.evaluate(() => window.__render()); await page.screenshot({ path: `${out}/st_${r.t}.png` }); }
  }
  await browser.close();
})();
