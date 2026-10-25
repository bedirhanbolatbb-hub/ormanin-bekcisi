// endgame check: finish everything, let a storm come, keep plowing; crew should re-clear driveways
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('http://localhost:8765/?nointro&fresh&nosave');
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  const r = await page.evaluate(() => {
    window.__hold = true;
    for (const t of TIERS) { if (t.key === 'groomer') break; GAME.owned[t.key] = 1; }
    PL.setTool('dumpplow', true); PL.x = 0; PL.z = 30; PL.h = Math.PI; PL.ensureFree();
    for (const a of SNOW.areas) if (a && a.key !== 'plaza') GAME.completeArea(a, true);
    for (let i = 0; i < 30; i++) __step(1, 1 / 30);
    GAME.completeArea(WORLD.areaByKey.plaza, false);   // the finale
    const e0 = GAME.earned;
    STORM.next = 2;
    for (let i = 0; i < 30 * 20; i++) __step(1, 1 / 30);   // storm falls
    const ph = STORM.phase;
    for (let i = 0; i < 30 * 25; i++) PL.update(1 / 30, { x: 0, y: i % 400 < 200 ? 1 : -1 }) || __step(1, 1 / 30);
    return { ended: GAME.ended, phase: ph, phase2: STORM.phase, mult: STORM.mult, earnedDuring: Math.round(GAME.earned - e0), crew: CREW.list.map(h => h.D.name + ':' + (h.job ? h.job.key : 'idle')).join(' '), goal: GOALS[GAME.goalIdx()].t };
  });
  await page.evaluate(() => window.__render()); await page.screenshot({ path: out + '/storm_end.png' });
  console.log(JSON.stringify(r)); console.log(errs.join('\n') || 'no errors');
  await browser.close();
})();
