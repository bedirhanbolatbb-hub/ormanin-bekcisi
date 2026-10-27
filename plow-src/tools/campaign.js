// full campaign with the bot: chapter 1 -> 9 through the real save (coins, machines and upgrades carry over)
// node tools/campaign.js [firstCh] [lastCh]   (firstCh 1 starts fresh)
const { chromium } = require('playwright');
(async () => {
  const a = +(process.argv[2] || 1), b = +(process.argv[3] || 9);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 480, height: 320 } });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  for (let ch = a; ch <= b; ch++) {
    await page.goto('http://localhost:' + (process.env.PORT || 8765) + '/?nointro&bot&botsave&norender' + (ch === 1 && a === 1 ? '&fresh' : '') + '&ch=' + ch + (process.env.CQ || ''));
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    const r = await page.evaluate((maxT) => {
      window.__hold = true; const buys = []; let last = PL.tool; const lvT = [0, 0, 0, 0];
      const start = { coins: Math.round(GAME.coins), tool: PL.tool, lv: JSON.stringify(GAME.lv[PL.tool] || []) };
      let t = 0;
      while (!GAME.ended && t < maxT) { __step(30, 1 / 30); t++; lvT[STREAK.lv]++; if (PL.tool !== last) { buys.push(PL.tool + '@' + GAME.time.toFixed(0)); last = PL.tool; } }
      const end = { time: +GAME.time.toFixed(0), coins: Math.round(GAME.coins), earned: Math.round(GAME.earned), ended: GAME.ended, lv: JSON.stringify(GAME.lv[PL.tool] || []), stars: GAME.lastStars };
      let rt = 0; for (; rt < 30 * 40 && CHUI.open !== 'chRes'; rt++) __step(1, 1 / 30);
      return { ch: CH.id, start, end, buys, lvT, res: CHUI.open, resT: +(rt / 30).toFixed(1) };
    }, +(process.env.MAXT || 420));
    await page.waitForTimeout(3000);
    r.after = await page.evaluate(() => { GAME.save(); return Math.round(GAME.coins); });
    console.log(JSON.stringify(r));
  }
  console.log(errs.slice(0, 10).join('\n') || 'no errors');
  await browser.close();
})();
