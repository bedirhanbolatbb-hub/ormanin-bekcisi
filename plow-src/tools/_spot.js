// can the machine leave this spot? put it there and push the stick in 8 directions for 2 s each
const { chromium } = require('playwright');
(async () => {
  const [ch, tool, x, z, h, carry] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  await page.goto(`http://localhost:8765/?nointro&fresh&nosave&norender&ch=${ch}&carry=${carry || 9000000}`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const r = await page.evaluate(([tool, x, z, h]) => {
    window.__hold = true; CAM.intro = 0;
    GAME.owned[tool] = 1; PL.setTool(tool, true); PL.applyTool();
    let stick = { x: 0, y: 0 }; INPUT.get = () => stick;
    const out = [];
    for (let k = 0; k < 8; k++) {
      PL.x = x; PL.z = z; PL.h = h; PL.spd = 0; PL._path = null; PL.escape = 0; PL.glide = null;
      if (PL.kind === 'truck') PL.ensureFree();
      const x0 = PL.x, z0 = PL.z, a = k * Math.PI / 4; stick = { x: Math.sin(a), y: -Math.cos(a) };
      for (let i = 0; i < 60; i++) { CAM.hero = 0; __step(1, 1 / 30); }
      out.push([k * 45, +Math.hypot(PL.x - x0, PL.z - z0).toFixed(2), +((PL.x - x0) * Math.sin(a) + (PL.z - z0) * Math.cos(a)).toFixed(2)]);
    }
    const free = PL.kind === 'truck' ? PL.poseBad(x, z, h) : PL.kidFree(x, z);
    return { kind: PL.kind, start: free, out };
  }, [tool, +x, +z, +h]);
  console.log(JSON.stringify(r));
  await browser.close();
})();
