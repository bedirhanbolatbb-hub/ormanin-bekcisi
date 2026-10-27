// checks for the bug-hunt fixes (v4.10):
//  ice   - after an automatic back-up the machine still slides on the ice
//  snow  - a saved game comes back with the same snow after the town changed (streets opened, rink goals, huts)
//  crew  - helpers never stand still "walking in place" for long
//  mem   - townsfolk that leave free their meshes (long market sessions stay flat)
//  map   - a tap on another chapter asks first while you are in the middle of one
// node tools/fixtests.js [port] [only]
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || 8765, only = process.argv[3] || '';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let ok = true; const check = (name, cond, extra) => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); if (!cond) ok = false; };
  const newPage = async (w, h) => { const ctx = await browser.newContext({ viewport: { width: w || 480, height: h || 320 } }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); return p; };
  const open = async (p, q) => { await p.goto(`http://localhost:${port}/?nointro&nodaily${q}`); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 }); };

  if (!only || only === 'ice') {
    const p = await newPage();
    await open(p, '&fresh&nosave&norender&ch=4&carry=9000000');
    const r = await p.evaluate(() => {
      window.__hold = true; CAM.intro = 0; const tool = 'sleigh';
      GAME.owned[tool] = 1; GAME.lv[tool] = [0, 1, 2].map(i => upMax(tool, i)); PL.setTool(tool, true); PL.applyTool();
      const run = () => {
        PL.x = 0; PL.z = 20; PL.h = Math.PI; PL.spd = 0; PL.svx = PL.svz = 0; PL._path = null;
        let st = { x: 0, y: 1 }; INPUT.get = () => st;
        for (let i = 0; i < 40; i++) { CAM.hero = 0; __step(1, 1 / 30); }
        st = { x: 1, y: 0.25 }; let maxLat = 0;
        for (let i = 0; i < 50; i++) { CAM.hero = 0; __step(1, 1 / 30); maxLat = Math.max(maxLat, Math.abs(PL.slideLat || 0)); }
        st = { x: 0, y: 0 }; for (let i = 0; i < 20; i++) { CAM.hero = 0; __step(1, 1 / 30); }
        return +maxLat.toFixed(2);
      };
      const before = run();
      // an automatic back-up (what happens after pushing into the shore), counted down at an uneven frame rate
      PL.escape = 0.6; INPUT.get = () => ({ x: 0, y: 0 });
      for (let i = 0; i < 30; i++) { CAM.hero = 0; __step(1, 1 / 23); }
      const esc = PL.escape, after = run();
      return { before, after, esc };
    });
    check('ice: still slides after an automatic back-up', r.esc === 0 && r.after > 0.6 * r.before && r.before > 0.3, r);
  }

  if (!only || only === 'snow') {
    for (const ch of [1, 4]) {
      const p = await newPage();
      await open(p, `&fresh&norender&ch=${ch}` + (ch > 1 ? '&carry=900000' : ''));
      const a = await p.evaluate((ch) => {
        window.__hold = true;
        const done = ch === 1 ? ['rose', 'miller', 'park', 'hale', 'lina', 'ortega', 'tom', 'street1', 'street2'] : ['lot', 'south', 'rink'];
        for (const k of done) GAME.completeArea(WORLD.areaByKey[k], true);
        // half of the next job by hand: carve some strokes over it
        const a = WORLD.areaByKey[ch === 1 ? 'plaza' : 'huts'], r = a.rects[0];
        for (let z = r.z0 + 0.5; z < (r.z0 + r.z1) / 2; z += 0.8) for (let x = r.x0 + 0.3; x < r.x1 - 0.3; x += 0.2) SNOW.carve(x, z, 0, 1, 0.5, 0.2, 1e9);
        GAME.save();
        const prog = {}; for (const ar of SNOW.areas) if (ar) prog[ar.key] = +SNOW.prog(ar).toFixed(4);
        let n1 = 0; for (let k = 0; k < SNOW.T.length; k++) if (SNOW.T[k] === 1) n1++;
        return { prog, n1 };
      }, ch);
      await p.goto(`http://localhost:${port}/?nointro&nodaily&norender`); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
      const b = await p.evaluate(() => { const prog = {}; for (const ar of SNOW.areas) if (ar) prog[ar.key] = +SNOW.prog(ar).toFixed(4); let n1 = 0; for (let k = 0; k < SNOW.T.length; k++) if (SNOW.T[k] === 1) n1++; return { prog, n1, ch: CH.id }; });
      const diff = Object.keys(a.prog).filter(k => Math.abs(a.prog[k] - b.prog[k]) > 0.002).map(k => k + ' ' + a.prog[k] + '->' + b.prog[k]);
      check(`snow: chapter ${ch} comes back the same after the town changed`, b.ch === ch && !diff.length && a.n1 === b.n1, { diff, n1: [a.n1, b.n1], errs: p.errs.slice(0, 2) });
    }
  }

  if (!only || only === 'crew') {
    for (const [ch, carry] of (process.env.CREWCH ? JSON.parse(process.env.CREWCH) : [[1, 0], [2, 20000], [3, 200000], [4, 500000]])) {
      const p = await newPage();
      await open(p, `&bot&norender&fresh&ch=${ch}` + (carry ? '&carry=' + carry : ''));
      const r = await p.evaluate(() => {
        window.__hold = true; let worst = 0, who = '', poofs = 0;
        const last = new Map();
        const P = FX.puff.bind(FX); FX.puff = (...a) => { if (a[3] === 8) poofs++; return P(...a); };
        for (let s = 0; s < 240; s++) {
          __step(30, 1 / 30);
          for (const h of CREW.list) {
            const L = last.get(h) || { x: h.x, z: h.z, t: 0 };
            const Y = CREW.yardSpot(h), atYard = !h.job && Math.hypot(h.x - Y[0], h.z - Y[1]) < 1.5;
            if (Math.hypot(h.x - L.x, h.z - L.z) > 0.3 || atYard) { L.x = h.x; L.z = h.z; L.t = 0; } else L.t++;
            if (L.t > worst) { worst = L.t; who = h.D.name + ' ' + (h.job ? h.job.key : 'idle') + ' @' + h.x.toFixed(1) + ',' + h.z.toFixed(1); }
            last.set(h, L);
          }
        }
        return { crew: CREW.list.length, worst, who, poofs, ended: GAME.ended };
      });
      check(`crew: chapter ${ch} helpers keep moving (longest still: ${r.worst} s)`, r.worst <= 8, r);
    }
  }

  if (!only || only === 'mem') {
    const p = await newPage();
    await open(p, '&fresh&norender&nosave&ch=3&carry=900000');
    const r = await p.evaluate(() => {
      window.__hold = true;
      for (const a of SNOW.areas) if (a && !a.done) GAME.completeArea(a, true);
      let freed = 0, disposed = 0; const F = NPC.free.bind(NPC);
      NPC.free = (n) => { freed++; n.P.root.traverse(o => { if (o.isMesh && o.userData.own) { const d = o.geometry.dispose.bind(o.geometry); o.geometry.dispose = () => { disposed++; d(); }; } }); return F(n); };
      __step(30 * 150, 1 / 30);
      return { freed, disposed, npcs: NPC.list.length };
    });
    check('mem: townsfolk who leave free their meshes', r.freed >= 2 && r.disposed >= r.freed * 4, r);
  }

  if (!only || only === 'map') {
    const p = await newPage(800, 500);
    await open(p, '&fresh&ch=2&carry=20000');
    const r = await p.evaluate(async () => {
      window.__hold = true; GAME.time = 60; GAME.chapters[1] = { stars: 2, best: 300, done: 1 };
      CHUI.map(); const row = [...document.querySelectorAll('#chMap .chrow[data-id]')].find(x => x.dataset.id === '1');
      const pd = new PointerEvent('pointerdown', { bubbles: true }); row.dispatchEvent(pd);
      const afterDown = !!CHUI._going;
      row.click(); const afterFirst = { going: !!CHUI._going, sure: row.classList.contains('sure'), warn: document.querySelector('#chMap .chwarn').textContent };
      return { afterDown, afterFirst };
    });
    const nav = p.waitForNavigation({ timeout: 15000 }).then(() => true).catch(() => false);
    await p.evaluate(() => [...document.querySelectorAll('#chMap .chrow[data-id]')].find(x => x.dataset.id === '1').click());
    const went = await nav;
    check('map: touching a row does nothing, a tap asks first, a second tap goes', !r.afterDown && !r.afterFirst.going && r.afterFirst.sure && /starts over/.test(r.afterFirst.warn) && went, r);
  }
  console.log(ok ? 'ALL OK' : 'SOME FAILED');
  await browser.close();
})();
