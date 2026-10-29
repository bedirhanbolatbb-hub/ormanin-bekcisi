// chapter 2 without the pressure: the clock never turns red or ticks, running out is quiet, the bus toots now and then
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '/tmp';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('http://localhost:8765/?ch=2&nointro&fresh&nosave&nodaily');
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await page.evaluate(() => {
    window.__hold = true; window.__c = { horn: 0, tick: 0, warn: 0, banners: [] };
    const h = AUD.busHorn.bind(AUD); AUD.busHorn = () => { __c.horn++; h(); };
    const t = AUD.tick.bind(AUD); AUD.tick = (x) => { __c.tick++; t(x); };
    const b = UI.banner.bind(UI); UI.banner = (a, s, i, d) => { __c.banners.push(a); b(a, s, i, d); };
  });
  const snap = () => page.evaluate(() => { const el = document.getElementById('timer'); return { legT: +CH.legT.toFixed(1), txt: document.getElementById('timerTxt').textContent, cls: el.className, sub: document.getElementById('timerSub').textContent, hint: document.getElementById('hint').textContent, bus: CH.bus.state, released: JSON.stringify(CH.released), c: JSON.stringify(__c) }; });
  console.log('start', JSON.stringify(await snap()));
  // stand still and let the first clock run down, watching for the red alarm on the way
  for (let s = 0; s < 62; s += 2) {
    await page.evaluate(() => { __step(60); if (document.getElementById('timer').classList.contains('warn')) __c.warn++; });
    if (s === 46) { await page.evaluate(() => window.__render()); await page.screenshot({ path: out + '/bus1_clock.png' }); }
  }
  console.log('after 62s', JSON.stringify(await snap()));
  await page.evaluate(() => window.__render()); await page.screenshot({ path: out + '/bus2_go.png' });
  await page.evaluate(() => { __step(30 * 40); });
  console.log('after 102s', JSON.stringify(await snap()));
  console.log(errs.slice(0, 8).join('\n') || 'no errors');
  await browser.close();
})();
