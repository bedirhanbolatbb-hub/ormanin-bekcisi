// turbo gift: a new day gives coins + TURBO minutes; turbo doubles the pay, runs only while you drive, is remembered, ends with a toast
const { chromium, devices } = require('playwright');
(async () => {
  const out = process.argv[2] || '/tmp';
  const phone = process.argv[3] === 'phone';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = phone ? await browser.newContext({ ...devices['iPhone 13'] }) : await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  const visit = async (q, before) => {
    if (before) await page.evaluate(before);
    await page.goto('http://localhost:8765/?' + q);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await page.evaluate(() => { window.__hold = true; });   // (the software renderer is far too slow for real time here)
  };
  const info = () => page.evaluate(() => ({ t: +TURBO.t.toFixed(1), chip: document.getElementById('turbo').className + ' ' + document.getElementById('turbo').textContent, pay: GAME.stats(PL.tool).pay, spd: +GAME.stats(PL.tool).spd.toFixed(2), tb: localStorage.getItem('plowtown_tb'), banner: document.getElementById('banner').textContent, hint: document.getElementById('hint').textContent, coins: Math.round(GAME.coins) }));
  await visit('nointro&fresh&nosave');
  await page.evaluate(() => { localStorage.removeItem('plowtown_day'); localStorage.removeItem('plowtown_dayn'); localStorage.removeItem('plowtown_tb'); });
  await visit('nointro&fresh&nosave');
  console.log('first visit', JSON.stringify(await info()));
  const y = await page.evaluate(() => DAILY.day(1));
  await visit('nointro&fresh&nosave', `localStorage.setItem('plowtown_day', '${y}'); localStorage.setItem('plowtown_dayn', '1');`);
  await page.waitForTimeout(2600);
  await page.evaluate(() => { __step(10); window.__render(); });
  console.log('next day', JSON.stringify(await info()));
  await page.screenshot({ path: out + '/tb1_gift' + (phone ? '_phone' : '') + '.png' });
  await page.waitForTimeout(3600);
  await page.evaluate(() => { __step(10); window.__render(); });
  console.log('hint', JSON.stringify(await page.evaluate(() => document.getElementById('hint').textContent)));
  await page.screenshot({ path: out + '/tb2_chip' + (phone ? '_phone' : '') + '.png' });
  // runs only while driving
  await page.evaluate(() => { window.__hold = true; });
  const a = await page.evaluate(() => { const t0 = TURBO.t; __step(90); const t1 = TURBO.t; INPUT.keys.KeyA = 1; __step(90); INPUT.keys.KeyA = 0; const t2 = TURBO.t; return { still: +(t0 - t1).toFixed(2), moving: +(t1 - t2).toFixed(2) }; });
  console.log('standing 3s / moving 3s used', JSON.stringify(a));
  // paid double: same load, with and without turbo
  const p = await page.evaluate(() => { const on = GAME.price(); const t = TURBO.t; TURBO.t = 0; const off = GAME.price(); TURBO.t = t; return { on, off }; });
  console.log('price on/off', JSON.stringify(p));
  // remembered on the next visit (same day: no new gift)
  await page.evaluate(() => TURBO.save());
  await visit('nointro&nosave');
  console.log('same day again', JSON.stringify(await info()));
  // the end of turbo
  await page.evaluate(() => { window.__hold = true; TURBO.t = 0.5; INPUT.keys.KeyA = 1; __step(60); INPUT.keys.KeyA = 0; });
  await page.waitForTimeout(500);
  console.log('ended', JSON.stringify(await page.evaluate(() => ({ t: TURBO.t, chip: document.getElementById('turbo').className, toast: document.getElementById('toast').textContent, tb: localStorage.getItem('plowtown_tb'), pay: GAME.stats(PL.tool).pay }))));
  console.log(errs.slice(0, 8).join('\n') || 'no errors');
  await browser.close();
})();
