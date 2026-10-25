// node tools/simshot.js <query> <t1,t2,...> <prefix>   -> run the bot, screenshot (top-down-ish) at the given game times
const { chromium } = require('playwright');
(async () => {
  const q = process.argv[2], times = process.argv[3].split(',').map(Number), pre = process.argv[4];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +(process.env.VW || 900), height: +(process.env.VH || 700) }, isMobile: !!process.env.MOB, hasTouch: !!process.env.MOB });
  const logs = [];
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  await page.goto('http://localhost:8765/?' + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 90000 });
  await page.evaluate(() => { window.__hold = true; const l = document.getElementById('loading'); if (l) l.style.display = 'none'; });
  let i = 0;
  for (const T of times) {
    const r = await page.evaluate((T) => { while (GAME.time < T - 0.01 && !(GAME.ended && GAME.time >= T - 1)) { __step(1, 1 / 30); if (GAME.ended) { window.__et = (window.__et || 0) + 1; if (window.__et > 30 * 3) break; } } __render(); return { t: GAME.time.toFixed(1), x: PL.x.toFixed(1), z: PL.z.toFixed(1), h: PL.h.toFixed(2), tool: PL.tool, goal: GAME.goalIdx(), tgt: BOT.tgt && [BOT.tgt.x.toFixed(1), BOT.tgt.z.toFixed(1)], li: BOT.li + '/' + (BOT.laneList || []).length, bus: CH.bus && [CH.bus.state, CH.bus.x.toFixed(1), CH.bus.z.toFixed(1), CH.bus.si], prog: SNOW.hlArea && SNOW.prog(SNOW.areas[SNOW.hlArea]).toFixed(2) }; }, T);
    console.log(JSON.stringify(r));
    await page.screenshot({ path: pre + (i++) + '.png' });
  }
  console.log(logs.slice(0, 20).join('\n'));
  await browser.close();
})();
