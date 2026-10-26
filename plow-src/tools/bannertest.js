// floating texts vs the big banner: banner up + a burst of texts over the machine, screenshot a few moments
// node tools/bannertest.js port outPrefix [W H]
const { chromium } = require('playwright');
(async () => {
  const [port, out, W, H] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--run-all-compositor-stages-before-draw'] });
  const page = await browser.newPage({ viewport: { width: +(W || 960), height: +(H || 540) } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${port}/?nointro&fresh&nosave&ch=1&carry=5000`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 180000 });
  await page.evaluate(() => {
    window.__hold = true; CAM.intro = 0; const L = document.getElementById('loading'); if (L) L.style.display = 'none';
    for (let i = 0; i < 60; i++) { CAM.hero = 0; __step(1, 1 / 30); CAM.update(1 / 30); }
    UI.banner('CAR DUG OUT!', '+81 tip', 'house');
    const P = new V3(PL.x, 2.2, PL.z);
    ['+24', 'GIFT! +162', 'MORE COINS!', 'WIDER!', 'FASTER!'].forEach((t, i) => setTimeout(() => UI.floatText(P, t, i === 1 ? '#ff9de0' : '#7dffb0', 30), i * 120));
  });
  for (const [i, wait] of [[0, 700], [1, 600]]) {
    await page.waitForTimeout(wait);
    await page.evaluate(() => { for (let i = 0; i < 8; i++) { UI.tick(1 / 30); UI.update(1 / 30); } __render(); });
    await page.screenshot({ path: `${out}_${i}.png` });
  }
  console.log(errs.join('\n') || 'no errors');
  await browser.close();
})();
