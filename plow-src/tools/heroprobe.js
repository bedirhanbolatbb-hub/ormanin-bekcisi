const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext(process.env.DESK ? { viewport: { width: 960, height: 540 } } : { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/?nointro&fresh&ch=' + (process.env.CH || 2) + '&carry=' + (process.env.CARRY || 40000));
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const r = await page.evaluate((tool) => {
    window.__hold = true; CAM.intro = 0; const ok = GAME.buyTool(tool);
    for (let k = 0; k < 33; k++) { __step(1, 1 / 30); CAM.update(1 / 30); }
    const c = CAM.cam.position, out = { ok, heroS: CAM.heroS, cam: [c.x, c.y, c.z].map(v => +v.toFixed(2)), pl: [PL.x, PL.z, PL.h].map(v => +v.toFixed(2)), near: [] };
    // which scene things are close to the camera?
    for (const ch of WORLD.scene.children) {
      const bb = new THREE.Box3().setFromObject(ch); if (bb.isEmpty()) continue;
      const d = bb.distanceToPoint(c); if (d < 9 && bb.max.y > 0.8) { let nm = ch.name || ch.type; ch.traverse(m => { if (m.isMesh && !nm.includes(':')) nm += ':' + (m.material && m.material.name); }); out.near.push([nm.slice(0, 60), +d.toFixed(2), bb.min.toArray().map(v => +v.toFixed(1)), bb.max.toArray().map(v => +v.toFixed(1))]); }
    }
    out.occN = WORLD.occ.length;
    return out;
  }, process.env.TOOL || 'thrower');
  console.log(JSON.stringify({ ...r, near: undefined })); for (const n of r.near) console.log(JSON.stringify(n)); console.log(errs.join('\n') || 'ok'); await browser.close();
})();
