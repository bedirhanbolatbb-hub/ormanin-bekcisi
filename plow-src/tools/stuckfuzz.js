// stuck fuzzer: drive a big machine into random edges/corners, then try to drive out toward open space.
// node tools/stuckfuzz.js [ch] [tool] [trials] [seed]   -> failure rate + where it got stuck
const { chromium } = require('playwright');
(async () => {
  const ch = +(process.argv[2] || 1), tool = process.argv[3] || 'dumpplow', N = +(process.argv[4] || 40), seed = +(process.argv[5] || 1);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:8765/?nointro&fresh&nosave&norender&ch=${ch}&carry=9000000`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const r = await page.evaluate(([tool, N, seed]) => {
    window.__hold = true; CAM.intro = 0;
    let s = seed * 9301 + 49297; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    GAME.owned[tool] = 1; GAME.lv[tool] = [0, 1, 2].map(i => upMax(tool, i)); PL.setTool(tool, true); PL.applyTool();
    window.__stick = { x: 0, y: 0 }; INPUT.get = () => window.__stick;
    const D0 = PL._detour.bind(PL); let tMax = 0, tSum = 0, nS = 0; PL._detour = function (...a) { const t0 = performance.now(); const r = D0(...a); const dt = performance.now() - t0; tMax = Math.max(tMax, dt); tSum += dt; nS++; return r; };
    const stickTo = (a) => { window.__stick = { x: Math.sin(a), y: -Math.cos(a) }; };
    const run = (sec) => { for (let i = 0; i < sec * 30; i++) { CAM.hero = 0; __step(1, 1 / 30); } };
    const B = WORLD.bounds, T = SNOW.T;
    const paved = (x, z) => { const k = SNOW.idx(x, z); return k >= 0 && (T[k] === 1 || T[k] === 3); };
    const out = { trials: 0, fail: 0, slow: 0, times: [], fails: [] };
    for (let tr = 0; tr < N; tr++) {
      // 1) a random free start pose
      let ok = false;
      for (let i = 0; i < 400 && !ok; i++) { const x = B.x0 + rnd() * (B.x1 - B.x0), z = B.z0 + rnd() * (B.z1 - B.z0), h = rnd() * Math.PI * 2; if (paved(x, z) && PL.truckFree(x, z, h)) { PL.x = x; PL.z = z; PL.h = h; PL.spd = 0; PL.glide = null; PL.escape = 0; ok = true; } }
      if (!ok) continue;
      // 2) drive toward a random direction until it bumps into something
      const s1 = [+PL.x.toFixed(3), +PL.z.toFixed(3), +PL.h.toFixed(4)], d1 = +(rnd() * Math.PI * 2).toFixed(4); PL.x = s1[0]; PL.z = s1[1]; PL.h = s1[2];
      stickTo(d1); run(3);
      // 3) pick a direction with real open road ~7 m away and try to get there
      const x0 = PL.x, z0 = PL.z, h0 = PL.h; let d2 = null;
      for (let i = 0; i < 48 && d2 === null; i++) {
        const a = rnd() * Math.PI * 2, tx = x0 + Math.sin(a) * 7, tz = z0 + Math.cos(a) * 7;
        let line = true; for (let d = 1; d <= 7; d += 0.5) if (!paved(x0 + Math.sin(a) * d, z0 + Math.cos(a) * d)) { line = false; break; }
        if (!line) continue;
        let fits = false; for (let k = 0; k < 8 && !fits; k++) if (PL.truckFree(tx, tz, a + (k - 4) * 0.39)) fits = true;
        if (fits) d2 = a;
      }
      if (d2 === null) continue;
      out.trials++;
      stickTo(d2); let t = 0, got = -1;
      for (; t < 6; t += 1 / 30) { CAM.hero = 0; __step(1, 1 / 30); const p = (PL.x - x0) * Math.sin(d2) + (PL.z - z0) * Math.cos(d2); if (p >= 3) { got = t; break; } }
      if (got < 0) { out.fail++; out.fails.push({ s1, d1, s: [+x0.toFixed(2), +z0.toFixed(2), +h0.toFixed(3)], d: +d2.toFixed(4), e: [+PL.x.toFixed(2), +PL.z.toFixed(2), +PL.h.toFixed(2)] }); }
      else { out.times.push(+got.toFixed(2)); if (got > 2.5) out.slow++; }
    }
    window.__stick = { x: 0, y: 0 };
    out.mean = out.times.length ? +(out.times.reduce((a, b) => a + b, 0) / out.times.length).toFixed(2) : null;
    out.times.sort((a, b) => a - b); out.p90 = out.times[Math.floor(out.times.length * 0.9)] || null;
    delete out.times; out.searchMs = { max: +tMax.toFixed(1), mean: +(tSum / Math.max(1, nS)).toFixed(2), n: nS };
    return out;
  }, [tool, N, seed]);
  console.log(`ch${ch} ${tool}`, JSON.stringify(r), errs.length ? errs.slice(0, 3).join(' | ') : '');
  await browser.close();
})();
