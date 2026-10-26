// chaos player: human-like random driving + random taps (upgrades, machine card) for a while in a chapter.
// watches for: page errors, NaN, machine inside something solid, out of the map, frozen progress, stuck time.
// node tools/chaos.js ch secs [seed] [carry]
const { chromium } = require('playwright');
(async () => {
  const ch = +(process.argv[2] || 1), secs = +(process.argv[3] || 120), seed = +(process.argv[4] || 1), carry = process.argv[5];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text()); });
  await page.goto(`http://localhost:8765/?nointro&fresh&nosave&norender&ch=${ch}` + (carry ? '&carry=' + carry : ''));
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const r = await page.evaluate(([secs, seed]) => {
    window.__hold = true; CAM.intro = 0;
    let s = seed * 7919 + 13; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    let stick = { x: 0, y: 0 }; INPUT.get = () => stick;
    const out = { bad: [], solidT: 0, outT: 0, nan: 0, stuckT: 0, maxStuck: 0, buys: 0, ups: 0, tools: [] };
    let nextStick = 0, nextTap = 0, lastX = PL.x, lastZ = PL.z, still = 0;
    for (let i = 0; i < secs * 30; i++) {
      const t = i / 30;
      if (t >= nextStick) {
        // mostly drive toward the current job (like a player following the arrow), sometimes wander
        nextStick = t + 0.8 + rnd() * 2.5;
        const a = SNOW.areas[SNOW.hlArea], g = a && !a.done ? SNOW.nearestSnow(PL.x, PL.z, a.id, 0.05, 140) : null;
        let ang = rnd() * Math.PI * 2;
        if (g && rnd() < 0.7) ang = Math.atan2(g.x - PL.x, g.z - PL.z) + (rnd() - 0.5) * 0.8;
        stick = rnd() < 0.08 ? { x: 0, y: 0 } : { x: Math.sin(ang), y: -Math.cos(ang) };
      }
      if (t >= nextTap) {
        nextTap = t + 2 + rnd() * 5;
        if (rnd() < 0.5) { const k = (rnd() * 3) | 0; if (GAME.buyUp(k)) { out.ups++; out.lastAct = t; } }
        else { const nt = GAME.nextTool(); if (nt && GAME.buyTool(nt)) { out.buys++; out.lastAct = t; out.tools.push(nt + '@' + GAME.time.toFixed(0)); } }
      }
      CAM.hero = 0; __step(1, 1 / 30);
      if (CHUI.open) { CHUI.close(CHUI.open); }
      if (!isFinite(PL.x) || !isFinite(PL.z) || !isFinite(PL.h)) { out.nan++; break; }
      const B = WORLD.bounds; if (PL.x < B.x0 - 2 || PL.x > B.x1 + 2 || PL.z < B.z0 - 2 || PL.z > B.z1 + 2) out.outT += 1 / 30;
      if (PL.kind === 'truck') { if (PL.poseBad(PL.x, PL.z, PL.h) === Infinity) { out.solidT += 1 / 30; if (out.bad.length < 12) out.bad.push(['solid', +PL.x.toFixed(2), +PL.z.toFixed(2), +PL.h.toFixed(3), PL.tool, (PL._path ? 'P' : '') + (PL.glide ? 'G' : '') + (PL.escape > 0 ? 'E' : ''), +(t - (out.lastAct || -9)).toFixed(2)]); } }
      else if (!PL.kidFree(PL.x, PL.z)) { out.solidT += 1 / 30; if (out.bad.length < 5) out.bad.push(['kid', +PL.x.toFixed(1), +PL.z.toFixed(1), PL.tool]); }
      const mv = Math.hypot(PL.x - lastX, PL.z - lastZ); lastX = PL.x; lastZ = PL.z;
      if ((stick.x || stick.y) && mv < 0.003) { still += 1 / 30; if (still > out.maxStuck) { out.maxStuck = still; out.stuckAt = [+PL.x.toFixed(2), +PL.z.toFixed(2), +PL.h.toFixed(2), PL.tool, +t.toFixed(1)]; } } else still = 0;
      if (GAME.ended) break;
    }
    out.time = +GAME.time.toFixed(0); out.done = Object.keys(GAME.done).length + '/' + SNOW.areas.filter(Boolean).length; out.ended = GAME.ended; out.coins = Math.round(GAME.coins); out.tool = PL.tool;
    out.solidT = +out.solidT.toFixed(1); out.outT = +out.outT.toFixed(1); out.maxStuck = +out.maxStuck.toFixed(1);
    return out;
  }, [secs, seed]);
  console.log(`ch${ch} seed${seed}`, JSON.stringify(r)); console.log(errs.slice(0, 8).join('\n') || 'no errors');
  await browser.close();
})();
