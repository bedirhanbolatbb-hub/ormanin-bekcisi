// daily gift: first visit only remembers the day; a visit the next day gives coins + banner; same day again gives nothing
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 800, height: 450 } });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  const visit = async (q, before) => {
    if (before) await page.evaluate(before);
    await page.goto('http://localhost:8765/?norender&' + q);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await page.waitForTimeout(4500);
    return page.evaluate(() => ({ coins: Math.round(GAME.coins), day: localStorage.getItem('plowtown_day'), n: localStorage.getItem('plowtown_dayn'), banner: document.getElementById('banner').textContent.slice(0, 60), ch: CH.id, introOpen: !!(CHUI && CHUI.open) }));
  };
  console.log('first  ', JSON.stringify(await visit('nointro&fresh')));
  console.log('same   ', JSON.stringify(await visit('nointro')));
  const y = await page.evaluate(() => DAILY.day(1));
  console.log('nextday', JSON.stringify(await visit('nointro', `localStorage.setItem('plowtown_day', '${y}'); localStorage.setItem('plowtown_dayn', '2');`)));
  // with the chapter intro card: the gift waits for the Go button
  console.log('intro  ', JSON.stringify(await visit('', `localStorage.setItem('plowtown_day', '2001-1-1');`)));
  const r = await page.evaluate(() => ({ pending: CH.dailyGift, open: CHUI.open }));
  console.log('  pending gift while intro open:', JSON.stringify(r));
  if (r.open) {
    await page.evaluate(() => { const b = document.getElementById('chGo'); b && b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
    await page.waitForTimeout(3500);
    console.log('  after Go:', JSON.stringify(await page.evaluate(() => ({ coins: Math.round(GAME.coins), banner: document.getElementById('banner').textContent.slice(0, 60), pending: CH.dailyGift }))));
  }
  console.log(errs.slice(0, 5).join('\n') || 'no errors');
  await browser.close();
})();
