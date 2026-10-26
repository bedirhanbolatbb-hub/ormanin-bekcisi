// ice drift check: full speed on the lake, then swing the stick sideways; how much does it slide, does DRIFT pay?
const { chromium } = require('playwright');
(async () => {
  const tool = process.argv[2] || 'sleigh';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  await page.goto('http://localhost:8765/?nointro&fresh&nosave&norender&ch=4&carry=9000000');
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const r = await page.evaluate((tool) => {
    window.__hold = true; CAM.intro = 0;
    GAME.owned[tool] = 1; GAME.lv[tool] = [0, 1, 2].map(i => upMax(tool, i)); PL.setTool(tool, true); PL.applyTool();
    const res = [];
    for (const [x, z, h, side] of [[0, 20, Math.PI, 1], [0, 20, Math.PI, -1], [-8, 10, Math.PI, 1], [6, -2, Math.PI, -1]]) {
      PL.x = x; PL.z = z; PL.h = h; PL.spd = 0; PL.svx = PL.svz = 0; PL._path = null; CH.drift = 0; CH.driftAmt = 0;
      let st = { x: 0, y: 1 }; INPUT.get = () => st; // forward (toward -z)
      const c0 = GAME.earned;
      for (let i = 0; i < 40; i++) { CAM.hero = 0; __step(1, 1 / 30); }
      st = { x: side, y: 0.25 };
      let maxLat = 0, paths = 0;
      for (let i = 0; i < 50; i++) { CAM.hero = 0; __step(1, 1 / 30); maxLat = Math.max(maxLat, Math.abs(PL.slideLat || 0)); if (PL._path) paths++; }
      st = { x: 0, y: 0 }; for (let i = 0; i < 20; i++) { CAM.hero = 0; __step(1, 1 / 30); }
      res.push({ start: [x, z], maxLat: +maxLat.toFixed(2), drift: +(CH.drift || 0).toFixed(2), pathFrames: paths, earned: Math.round(GAME.earned - c0) });
    }
    return res;
  }, tool);
  console.log(tool, JSON.stringify(r)); await browser.close();
})();
