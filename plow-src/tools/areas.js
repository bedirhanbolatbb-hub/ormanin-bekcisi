const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.goto('http://localhost:8765/?nointro&fresh&nosave');
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  const r = await page.evaluate(() => {
    window.__hold = true;
    const out = [];
    for (const a of SNOW.areas) { if (!a) continue; out.push({ key: a.key, name: a.name, total: a.total, units0: a.units0 && +a.units0.toFixed(1), cells: a.total, m2: +(a.total * 0.04).toFixed(1) }); }
    const tiers = TIERS.map(t => { const s = GAME.stats(t.key); return { key: t.key, w: +s.w.toFixed(2), cap: Math.round(s.cap), spd: +s.spd.toFixed(2), pay: s.pay }; });
    return { out, tiers, goals: GOALS.map(g => g.a || ('tool:' + g.tool)).join(' > ') };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
