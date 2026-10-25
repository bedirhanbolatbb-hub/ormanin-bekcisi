// node tools/sim.js <minutes> [shotEverySec] [prefix] [query]
const { chromium } = require('playwright');
(async () => {
  const mins = +(process.argv[2] || 3), shotEvery = +(process.argv[3] || 0), prefix = process.argv[4] || '', q = process.argv[5] || 'nointro&bot';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +(process.env.VW || 960), height: +(process.env.VH || 540) } });
  const logs = [];
  page.on('console', m => { const t = m.text(); if (t.startsWith('[BOT]') || m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + t); });
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  await page.goto('http://localhost:8765/?' + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  await page.evaluate(() => { window.__hold = true; });
  const total = mins * 60; let t = 0, nextShot = shotEvery || 1e9, shotN = 0;
  const snap = [];
  while (t < total) {
    const chunk = 10;
    const r = await page.evaluate((n) => {
      __step(n * 30, 1 / 30);
      const a = WORLD.areaByKey;
      return { t: GAME.time, c: Math.round(GAME.coins), e: Math.round(GAME.earned), tool: PL.tool, lv: JSON.stringify(GAME.lv[PL.tool]), g: GAME.goalIdx(), load: Math.round(PL.load), cap: Math.round(PL.stats().cap), done: Object.keys(GAME.done).join(',') };
    }, chunk);
    t += chunk;
    snap.push(`${r.t.toFixed(0).padStart(4)}s coins=${r.c} earned=${r.e} tool=${r.tool} lv=${r.lv} goal=${r.g} load=${r.load}/${r.cap} done=[${r.done}]`);
    if (t >= nextShot) { nextShot += shotEvery; await page.evaluate(() => window.__render()); await page.screenshot({ path: prefix + (shotN++) + '.png' }); }
  }
  const bl = await page.evaluate(() => BOT.log);
  console.log(snap.join('\n')); console.log('BOT:', bl.join(' ')); console.log(logs.slice(0, 30).join('\n'));
  await browser.close();
})();
