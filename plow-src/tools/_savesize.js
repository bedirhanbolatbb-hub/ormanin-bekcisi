// how big is the save in each chapter (CrazyGames cloud save allows at most 1 MB for all keys together)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [ch, carry] of [[1, 0], [2, 20000], [3, 200000], [4, 500000], [5, 900000]]) {
    const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
    await page.goto(`http://localhost:8765/?nointro&bot&botsave&norender&fresh&ch=${ch}` + (carry ? '&carry=' + carry : ''));
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    const r = await page.evaluate(() => {
      window.__hold = true; __step(40 * 30, 1 / 30); GAME.save();
      const keys = Object.keys(localStorage).filter(k => k.startsWith('plowtown'));
      const sizes = keys.map(k => [k, localStorage.getItem(k).length]);
      const o = JSON.parse(localStorage.getItem('plowtown_v4'));
      const snow = o.cs && o.cs.snow ? JSON.stringify(o.cs.snow).length : 0;
      return { ch: CH.id, total: sizes.reduce((a, b) => a + b[1], 0), main: localStorage.getItem('plowtown_v4').length, snow, keys: sizes.map(s => s.join('=')).join(' ') };
    });
    console.log(JSON.stringify(r));
    await page.close();
  }
  await browser.close();
})();
