const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  await page.goto(`http://localhost:8766/?nointro&bot&vid&fresh&nosave&norender&ch=1`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const r = await page.evaluate(() => {
    window.__hold = true; const ev = [];
    const B0 = UI.banner.bind(UI); UI.banner = (t, s, i, d) => { ev.push([+(tt).toFixed(2), 'banner', t, s]); return B0(t, s, i, d); };
    let tt = 0;
    for (let i = 0; i < 60 * 30; i++) { step(1 / 30); CAM.update(1 / 30); }
    ev.push(['tool before', PL.tool, GAME.handDone(), HAND_AREAS.length, Math.round(GAME.coins)]);
    for (const k of HAND_AREAS) { const a = WORLD.areaByKey[k]; if (!a.done) GAME.completeArea(a, true); }
    let tool = PL.tool, hero = false;
    for (let i = 0; i < 8 * 30; i++) {
      tt = i / 30; step(1 / 30); CAM.update(1 / 30);
      if (PL.tool !== tool) { tool = PL.tool; ev.push([+tt.toFixed(2), 'tool', tool]); }
      if (CAM.hero > 0 && !hero) ev.push([+tt.toFixed(2), 'hero start', PL.tool]); if (CAM.hero <= 0 && hero) ev.push([+tt.toFixed(2), 'hero end']); hero = CAM.hero > 0;
    }
    return ev;
  });
  console.log(JSON.stringify(r));
  await browser.close();
})();
