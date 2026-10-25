const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  const ready = async () => { await page.waitForFunction(() => window.__ready, null, { timeout: 120000 }); await page.waitForTimeout(800); };
  // 1) make a mid-chapter-1 state, export it as an old v3 save
  await page.goto('http://localhost:8765/?fresh&nointro'); await ready();
  const v3mid = await page.evaluate(() => { window.__hold = true; for (const k of ['rose', 'miller']) GAME.completeArea(WORLD.areaByKey[k], true); GAME.coins = 321; GAME.owned.bigshovel = 1; return JSON.stringify({ v: 3, coins: 321, earned: 900, time: 77, owned: GAME.owned, lv: {}, done: GAME.done, tool: 'bigshovel', x: PL.x, z: PL.z, h: PL.h, load: 0, snow: SNOW.serialize(), tr: '', firstUp: true, ended: false, crew: 1, t: Date.now() }); });
  await page.goto('about:blank');
  const page2 = await ctx.newPage(); page2.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.close();
  await ctx.addInitScript((s) => { if (!sessionStorage.getItem('m1')) { sessionStorage.setItem('m1', '1'); localStorage.clear(); localStorage.setItem('plowtown_v3', s); } }, v3mid);
  const pg = page2;
  await pg.goto('http://localhost:8765/?nointro'); await pg.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  console.log('mid:', await pg.evaluate(() => ({ ch: CH.id, coins: GAME.coins, tool: PL.tool, done: Object.keys(GAME.done), crew: CREW.list.length, t: GAME.time })));
  // 2) an old save where Maple Lane was finished -> straight to chapter 2
  await pg.goto('about:blank');
  const ctx2 = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await ctx2.addInitScript(() => { if (!sessionStorage.getItem('m2')) { sessionStorage.setItem('m2', '1'); localStorage.clear(); localStorage.setItem('plowtown_v3', JSON.stringify({ v: 3, coins: 15000, earned: 60000, time: 400, owned: { shovel: 1, bigshovel: 1, blower: 1, megablower: 1, truck: 1, dumpplow: 1 }, lv: { dumpplow: [3, 3, 2] }, done: { rose: 1 }, tool: 'dumpplow', x: 0, z: 0, h: 0, load: 0, snow: '', tr: '', firstUp: true, ended: true, crew: 2 })); } });
  const p3 = await ctx2.newPage(); p3.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p3.goto('http://localhost:8765/'); await p3.waitForFunction(() => window.__ready, null, { timeout: 120000 }); await p3.waitForTimeout(1200);
  console.log('ended:', await p3.evaluate(() => ({ ch: CH.id, coins: GAME.coins, tool: PL.tool, crew: CREW.list.length, chapters: GAME.chapters, intro: CHUI.open })));
  console.log(errs.join('\n') || 'no errors');
  await browser.close();
})();
