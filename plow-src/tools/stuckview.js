// draw the ground grid around a pose (paved / lawn / solid) with the machine's footprint, as a PNG via python
// node tools/stuckview.js ch tool x z h d2 out.png [simulate seconds]
const { chromium } = require('playwright');
const fs = require('fs'), { execSync } = require('child_process');
(async () => {
  const [ch, tool, x, z, h, d2, out, sim] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  await page.goto(`http://localhost:8765/?nointro&fresh&nosave&norender&ch=${ch}&carry=9000000`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const r = await page.evaluate(([tool, x, z, h, d2, sim]) => {
    window.__hold = true; CAM.intro = 0;
    GAME.owned[tool] = 1; GAME.lv[tool] = [0, 1, 2].map(i => upMax(tool, i)); PL.setTool(tool, true); PL.applyTool();
    PL.x = x; PL.z = z; PL.h = h; PL.spd = 0; PL.glide = null;
    const path = [];
    if (sim > 0) { INPUT.get = () => ({ x: Math.sin(d2), y: -Math.cos(d2) }); for (let i = 0; i < sim * 30; i++) { CAM.hero = 0; __step(1, 1 / 30); if (i % 3 === 0) path.push([PL.x, PL.z, PL.h, PL.spd, PL.escape > 0 ? 1 : 0]); } }
    const R = 16, C = SNOW.C, cells = [];
    for (let j = -R / C; j <= R / C; j++) { const row = []; for (let i = -R / C; i <= R / C; i++) { const k = SNOW.idx(x + i * C, z + j * C); row.push(k < 0 ? 9 : SNOW.T[k]); } cells.push(row); }
    // footprint sample points (same as poseBad)
    const G = PL.geo, st = PL.stats(), hw = G.halfW, bw = Math.max(hw, st.w * 0.5 - 0.4), bz = G.carve - 0.12;
    const pts = (px, pz, hh) => { const fx = Math.sin(hh), fz = Math.cos(hh), rx = fz, rz = -fx, P = [hw - 0.03, -G.rear, -hw + 0.03, -G.rear, hw, 0, -hw, 0, hw, -G.rear * 0.5, -hw, -G.rear * 0.5, hw, G.nose, -hw, G.nose, 0, G.carve]; const o = []; for (let i = 0; i < P.length; i += 2) o.push([px + rx * P[i] + fx * P[i + 1], pz + rz * P[i] + fz * P[i + 1]]); for (const a of [bw, -bw, bw * 0.5, -bw * 0.5, hw, -hw]) o.push([px + rx * a + fx * bz, pz + rz * a + fz * bz]); return o; };
    return { cells, C, R, start: pts(x, z, h), end: pts(PL.x, PL.z, PL.h), endPose: [PL.x, PL.z, PL.h], path, geo: { hw, bw, rear: G.rear, nose: G.nose, carve: G.carve, w: st.w, turn: G.turn } };
  }, [tool, +x, +z, +h, +d2, +(sim || 0)]);
  fs.writeFileSync('/tmp/sv.json', JSON.stringify({ ...r, x: +x, z: +z, d2: +d2 }));
  execSync(`python3 /home/claude/plow/tools/stuckview.py /tmp/sv.json ${out}`);
  console.log(JSON.stringify({ end: r.endPose.map(v => +v.toFixed(2)), geo: r.geo, n: r.path.length, esc: r.path.filter(p => p[4]).length }));
  await browser.close();
})();
