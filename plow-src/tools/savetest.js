// save/load check: play a bit with the bot logic off, force crew + progress, save, reload, compare
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 600, height: 800 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/?nointro');
  await page.waitForFunction(() => window.__ready, null, { timeout: 90000 });
  const a = await page.evaluate(() => {
    window.__hold = true;
    for (const k of ['rose', 'miller', 'park']) GAME.completeArea(WORLD.areaByKey[k], false);
    for (let i = 0; i < 200; i++) __step(1, 1 / 30);
    GAME.coins = 1234; GAME.owned.bigshovel = 1; GAME.owned.blower = 1; PL.setTool('blower', true);
    GAME.save();
    return { crew: CREW.list.length, gcrew: GAME.crew, done: Object.keys(GAME.done).join(','), tool: PL.tool };
  });
  await page.reload();
  await page.waitForFunction(() => window.__ready, null, { timeout: 90000 });
  const b = await page.evaluate(() => ({ crew: CREW.list.length, gcrew: GAME.crew, done: Object.keys(GAME.done).join(','), tool: PL.tool, coins: Math.round(GAME.coins) }));
  console.log('before', JSON.stringify(a)); console.log('after ', JSON.stringify(b)); console.log(errs.join('\n') || 'no errors');
  await browser.close();
})();
