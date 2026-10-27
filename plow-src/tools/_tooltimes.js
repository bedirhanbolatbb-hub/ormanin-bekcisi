// when does the bot get each machine (and other big moments) in a chapter?  node tools/_tooltimes.js ch carry secs
const { chromium } = require('playwright');
(async () => {
  const [ch, carry, secs] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  await page.goto(`http://localhost:8766/?nointro&bot&vid&fresh&nosave&norender&ch=${ch}` + (carry ? '&carry=' + carry : ''));
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const r = await page.evaluate((secs) => {
    window.__hold = true; const ev = []; let tool = PL.tool, hero = 0, bn = '';
    const B0 = UI.banner.bind(UI); UI.banner = (t, s, i, d) => { ev.push([+(GAME.time).toFixed(1), 'banner', t]); return B0(t, s, i, d); };
    for (let i = 0; i < secs * 30; i++) {
      step(1 / 30); CAM.update(1 / 30);
      if (PL.tool !== tool) { tool = PL.tool; ev.push([+(i / 30).toFixed(1), 'tool', tool]); }
      if (CAM.hero > 0 && !hero) ev.push([+(i / 30).toFixed(1), 'hero', PL.tool]); hero = CAM.hero > 0;
      if (STREAK.lv && ev.filter(e => e[1] === 'streak' && e[2] === STREAK.lv).length === 0) ev.push([+(i / 30).toFixed(1), 'streak', STREAK.lv]);
      if (GAME.ended) { ev.push([+(i / 30).toFixed(1), 'END']); break; }
    }
    return ev;
  }, +secs);
  console.log(JSON.stringify(r));
  await browser.close();
})();
