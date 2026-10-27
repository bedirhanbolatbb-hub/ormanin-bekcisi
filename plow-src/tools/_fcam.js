const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], cams = JSON.parse(process.argv[3]);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  await page.goto(`http://localhost:8766/?nointro&fresh&nosave&nodaily&ch=5&carry=900000`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  let i = 0;
  for (const c of cams) {
    for (const xr of [1, 0]) {
      await page.evaluate(([c, xr]) => {
        window.__hold = true; CAM.intro = 0; document.getElementById('hud').style.display = 'none';
        CAM.show = { from: c.slice(0, 3), look: c.slice(3, 6), k: 1, a: 0 };
        CAM.update(0.0001); updXray(); if (!xr) XRAY.uD.value = 0;
        SNOW.flush(); placeSun(); renderer.render(scene, CAM.cam);
      }, [c, xr]);
      await page.screenshot({ path: `${out}_${i}_${xr}.png` });
    }
    i++;
  }
  await browser.close();
})();
