// human-mode check: special machine locked -> 2 jobs -> unlock banner -> buy -> hero shot pauses the clock
const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/?nointro&fresh&nosave&ch=' + (process.env.CH || 2) + '&carry=3000000');
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const r = await page.evaluate(() => {
    window.__hold = true; document.getElementById('loading').style.display = 'none';
    const U = CH.unlock, out = { tool: U.tool, need: U.goals };
    out.try1 = GAME.buyTool(U.tool); out.hint1 = document.getElementById('hint').textContent;
    const jobs = GOALS.filter(g => g.a).slice(0, U.goals);
    for (const g of jobs) { GAME.completeArea(WORLD.areaByKey[g.a]); }
    out.locked = !!GAME.toolLocked(U.tool);
    for (let i = 0; i < 30 * 3; i++) { __step(1, 1 / 30); CAM.update(1 / 30); UI.update(1 / 30); }
    out.banner = document.getElementById('banner').textContent; out.card = UI.toolBtn.className + ' | ' + UI.toolBtn.textContent;
    out.try2 = GAME.buyTool(U.tool); const t0 = GAME.time; out.hero = CAM.hero.toFixed(2);
    for (let i = 0; i < 30; i++) { __step(1, 1 / 30); CAM.update(1 / 30); }
    out.timeDuringHero = (GAME.time - t0).toFixed(2);
    for (let i = 0; i < 60; i++) { __step(1, 1 / 30); CAM.update(1 / 30); }
    out.timeAfter = (GAME.time - t0).toFixed(2); out.heroEnd = CAM.hero; out.toolNow = PL.tool;
    return out;
  });
  console.log(JSON.stringify(r, null, 1)); console.log(errs.join('\n') || 'no errors'); await browser.close();
})();
