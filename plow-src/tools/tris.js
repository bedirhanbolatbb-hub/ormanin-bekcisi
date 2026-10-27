// draw calls / triangles per chapter at the start view and from a far overview
const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const ch of (process.env.CHS || "1,2,3,4,5").split(",").map(Number)) {
    const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:8765/?nointro&fresh&nosave&ch=${ch}&carry=9000000`);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    const r = await page.evaluate(() => {
      window.__hold = true; __step(10, 1 / 30); __render();
      const a = { calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
      CAM.cam.position.set(0, 60, 70); CAM.cam.lookAt(0, 0, 0); CAM.cam.updateMatrixWorld(); renderer.render(scene, CAM.cam);
      const b = { calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
      let meshes = 0; scene.traverse(o => { if (o.isMesh && o.visible) meshes++; });
      return { play: a, far: b, meshes, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures };
    });
    console.log('ch' + ch, JSON.stringify(r));
    await ctx.close();
  }
  await browser.close();
})();
