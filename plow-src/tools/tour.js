// play the game with the bot and take phone-sized screenshots at given times
// node tools/tour.js <outDir> <t1,t2,...> [query] [w] [h]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], times = (process.argv[3] || '3,8,18').split(',').map(Number), q = process.argv[4] || 'nointro&bot';
  const W = +(process.argv[5] || 390), H = +(process.argv[6] || 844);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('ERR ' + m.text()); });
  await page.goto('http://localhost:8765/?' + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 90000 });
  await page.waitForTimeout(1200);
  for (const T of times) {
    // step in small chunks and keep the 2D layer / UI timers ticking like a real frame loop
    await page.evaluate((T) => { window.__hold = true; while (GAME.time < T) { __step(3, 1 / 30); UI.update(0.1); } }, T);
    await page.evaluate(() => window.__render());
    await page.screenshot({ path: `${out}/tour_${String(T).padStart(3, '0')}.png` });
    const info = await page.evaluate(() => ({ t: GAME.time.toFixed(1), coins: Math.round(GAME.coins), tool: PL.tool, goal: GOALS[GAME.goalIdx()].t }));
    console.log(JSON.stringify(info));
  }
  console.log(errs.join('\n') || 'no errors');
  await browser.close();
})();
