// save / resume check for every chapter: play with the bot a while, reload the page (real save), compare the state
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [ch, carry, secs] of [[1, 0, 60], [2, 20000, 45], [3, 200000, 45], [4, 500000, 45], [5, 900000, 45]]) {
    const ctx = await browser.newContext({ viewport: { width: 480, height: 320 } });
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    await page.goto(`http://localhost:8765/?nointro&bot&botsave&norender&fresh&ch=${ch}` + (carry ? '&carry=' + carry : ''));
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    const a = await page.evaluate((secs) => {
      window.__hold = true; __step(secs * 30, 1 / 30); GAME.save();
      const prog = SNOW.areas.filter(Boolean).map(x => x.key + ':' + (x.done ? 'D' : SNOW.prog(x).toFixed(2))).join(' ');
      return { ch: CH.id, t: +GAME.time.toFixed(1), coins: Math.round(GAME.coins), tool: PL.tool, done: Object.keys(GAME.done).sort().join(','), prog, x: +PL.x.toFixed(1), z: +PL.z.toFixed(1), extra: CH.save ? JSON.stringify(CH.save()).slice(0, 80) : '' };
    }, secs);
    // reload as a returning player (no fresh, no ch: the save decides)
    await page.goto('http://localhost:8765/?nointro&bot&botsave&norender');
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    const b = await page.evaluate(() => {
      const prog = SNOW.areas.filter(Boolean).map(x => x.key + ':' + (x.done ? 'D' : SNOW.prog(x).toFixed(2))).join(' ');
      return { ch: CH.id, t: +GAME.time.toFixed(1), coins: Math.round(GAME.coins), tool: PL.tool, done: Object.keys(GAME.done).sort().join(','), prog, x: +PL.x.toFixed(1), z: +PL.z.toFixed(1), extra: CH.save ? JSON.stringify(CH.save()).slice(0, 80) : '' };
    });
    const same = ['ch', 'tool', 'done', 'prog'].filter(k => a[k] !== b[k]);
    console.log(`ch${ch}`, same.length ? 'DIFF ' + same.join(',') : 'same', JSON.stringify({ coins: [a.coins, b.coins], t: [a.t, b.t], pos: [[a.x, a.z], [b.x, b.z]], extra: [a.extra, b.extra] }));
    if (same.length) console.log('  before', JSON.stringify(a), '\n  after ', JSON.stringify(b));
    if (errs.length) console.log('  ', errs.slice(0, 4).join('\n   '));
    await ctx.close();
  }
  await browser.close();
})();
