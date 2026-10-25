const { chromium } = require('playwright');
(async () => {
  const secs = +(process.argv[2] || 430), out = process.argv[3];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', e => console.log('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8765/?nointro&bot');
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.evaluate(() => { window.__hold = true; });
  await page.evaluate((s) => { __step(Math.round(s * 30), 1 / 30); }, secs);
  const r = await page.evaluate(() => {
    const g = GOALS[GAME.goalIdx()]; const a = WORLD.areaByKey[g.a] || WORLD.areaByKey.lina;
    const ns = SNOW.nearestSnow(PL.x, PL.z, a.id, 0.05, 150);
    const [ci, cj] = BOT.cell(PL.x, PL.z);
    return { goal: g.t, spd: PL.spd, rev: PL.rev, pl: [PL.x.toFixed(2), PL.z.toFixed(2), PL.h.toFixed(2)], prog: SNOW.prog(a), total: a.total, cleared: a.cleared, ns, li: BOT.li, lanes: (BOT.laneList || []).length, lp: BOT.lp, tgt: BOT.tgt, dist: BOT.dist[ci + cj * BOT.W], kidFree: PL.kidFree(PL.x, PL.z), goingDump: BOT.goingDump, load: PL.load, tool: PL.tool, rects: a.rects };
  });
  console.log(JSON.stringify(r, null, 1));
  if (out) { await page.evaluate(() => window.__render()); await page.screenshot({ path: out }); }
  await browser.close();
})();
