// daily storm: shows up once there is cleared road, snows on finished streets only, pays xN, ends, and is gone until tomorrow
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '/tmp';
  const vw = +(process.argv[3] || 1280), vh = +(process.argv[4] || 720);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh } });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error') errs.push('ERR ' + m.text()); });
  await page.goto('http://localhost:8765/?nointro&fresh&nosave&skip=truck');
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await page.evaluate(() => { localStorage.removeItem('plowtown_ds'); localStorage.removeItem('plowtown_dsh'); });
  const st = () => page.evaluate(() => { const r = DSTORM.room(); return { st: DSTORM.st, ok: DSTORM._ok, can: DSTORM.can(), done: r.done, all: r.all, btn: document.getElementById('btnStorm').className, txt: document.getElementById('btnStorm').textContent, tool: PL.tool, hint: document.getElementById('hint').textContent }; });
  await page.evaluate(() => { window.__hold = true; DSTORM.init(); __step(20); });
  console.log('areas', JSON.stringify(await page.evaluate(() => SNOW.areas.filter(a => a && !a.lot).map(a => a.key + ':' + a.total))));
  console.log('start', JSON.stringify(await st()));
  for (const k of ['street1', 'street2', 'north']) {
    await page.evaluate((k) => { GAME.completeArea(WORLD.areaByKey[k], true); __step(20); }, k);
    console.log('done ' + k, JSON.stringify(await st()));
  }
  await page.evaluate(() => { PL.x = -1.75; PL.z = 30; PL.h = Math.PI; PL.ensureFree(); __step(10); window.__render(); });
  await page.screenshot({ path: out + '/ds1_ready.png' });
  const a1 = await page.evaluate(() => { const a = WORLD.areaByKey.street1; let s = 0; for (let k = 0; k < SNOW.H.length; k++) if (SNOW.A[k] === a.id) s += SNOW.H[k]; return { cleared: a.cleared, total: a.total, depth: +(s / a.total).toFixed(3) }; });
  console.log('street1 before', JSON.stringify(a1));
  // tap the button
  await page.evaluate(() => { document.getElementById('btnStorm').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
  console.log('tapped', JSON.stringify(await st()), await page.evaluate(() => document.getElementById('banner').textContent));
  await page.evaluate(() => { __step(30 * 3); window.__render(); });
  await page.screenshot({ path: out + '/ds2_fall.png' });
  await page.evaluate(() => { __step(30 * 3 + 5); window.__render(); });
  const a2 = await page.evaluate(() => { const a = WORLD.areaByKey.street1; let s = 0; for (let k = 0; k < SNOW.H.length; k++) if (SNOW.A[k] === a.id) s += SNOW.H[k]; const lot = SNOW.areas.find(x => x && x.lot); let l = 0; for (let k = 0; k < SNOW.H.length; k++) if (SNOW.A[k] === lot.id && SNOW.T[k] === 1) l += SNOW.H[k]; const p1 = WORLD.areaByKey.plaza; return { st: DSTORM.st, t: +DSTORM.t.toFixed(1), cleared: a.cleared, depth: +(s / a.total).toFixed(3), lotDepth: +(l / lot.total).toFixed(3), plazaDone: p1.done, plazaProg: +SNOW.prog(p1).toFixed(3), price: +GAME.price().toFixed(2), mult: DSTORM.mult(), storm: STORM.phase }; });
  console.log('after fall', JSON.stringify(a2));
  console.log('goal bar', await page.evaluate(() => document.getElementById('goalPct').textContent));
  // drive along the street for a while
  const c0 = await page.evaluate(() => GAME.earned);
  await page.evaluate(() => { INPUT.keys.KeyW = 1; __step(30 * 12); INPUT.keys.KeyW = 0; window.__render(); });
  await page.screenshot({ path: out + '/ds3_rush.png' });
  const c1 = await page.evaluate(() => ({ earned: GAME.earned, st: DSTORM.st, t: +DSTORM.t.toFixed(1), btn: document.getElementById('btnStorm').textContent, payouts: GAME.payouts }));
  console.log('rush drive', JSON.stringify(c1), 'coins +', Math.round(c1.earned - c0));
  // to the end
  await page.evaluate(() => { __step(30 * 110); window.__render(); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: out + '/ds4_end.png' });
  console.log('end', JSON.stringify(await page.evaluate(() => ({ st: DSTORM.st, banner: document.getElementById('banner').textContent, ds: localStorage.getItem('plowtown_ds'), today: DAILY.day(), btn: document.getElementById('btnStorm').className, price: +GAME.price().toFixed(2), storm: STORM.phase, snowRate: +FX.snowRate.toFixed(2) }))));
  await page.evaluate(() => { __step(30 * 6); });
  console.log('toast', await page.evaluate(() => document.getElementById('toast').textContent), '| snowRate', await page.evaluate(() => +FX.snowRate.toFixed(2)));
  // the map shows when the next one comes
  await page.evaluate(() => { CHUI.map(); });
  console.log('map line', await page.evaluate(() => (document.querySelector('.chdaily') || {}).textContent));
  await page.evaluate(() => window.__render());
  await page.screenshot({ path: out + '/ds5_map.png' });
  await page.evaluate(() => CHUI.close('chMap'));
  // a new visit the same day: no storm button
  await page.goto('http://localhost:8765/?nointro&nosave&skip=truck');
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await page.evaluate(() => { window.__hold = true; for (const k of ['street1', 'street2', 'north']) GAME.completeArea(WORLD.areaByKey[k], true); __step(30); });
  console.log('same day again', JSON.stringify(await st()));
  console.log(errs.slice(0, 8).join('\n') || 'no errors');
  await browser.close();
})();
