// the chapter ends during the daily storm: it waits under the results card, carries on if you stay,
// and is closed (and logged) if you go on to the next chapter
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  const setup = async () => {
    await page.goto('http://localhost:8765/?nointro&fresh&nosave&skip=truck');
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    return page.evaluate(() => {
      window.__hold = true; localStorage.removeItem('plowtown_ds'); DSTORM.init();
      window.__evs = []; const ev = PCLOG.ev; PCLOG.ev = (n, o) => { __evs.push(n + ' ' + JSON.stringify(o || {})); return ev(n, o); };
      GAME.completeArea(WORLD.areaByKey.street1, true); __step(20);
      DSTORM.start(); __step(30 * 7);
      for (const a of SNOW.areas) if (a && !a.done) GAME.completeArea(a, true);
      let n = 0; while (CHUI.open !== 'chRes' && n++ < 30 * 30) __step(1);
      const t0 = DSTORM.t; __step(30 * 5);
      return { st: DSTORM.st, open: CHUI.open, tUnderCard: +(t0 - DSTORM.t).toFixed(2), line: (document.querySelector('.chback') || {}).textContent };
    });
  };
  console.log('chapter ends in the storm', JSON.stringify(await setup()));
  // stay: the storm goes on and ends with its banner
  console.log('stay', JSON.stringify(await page.evaluate(() => {
    document.getElementById('chStay').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    const t0 = DSTORM.t; __step(30 * 3); const t1 = DSTORM.t; __step(30 * 120);
    return { open: CHUI.open, ran: +(t0 - t1).toFixed(2), st: DSTORM.st, banner: document.getElementById('banner').textContent, evs: __evs.filter(e => e.startsWith('pc_dstorm')) };
  })));
  // go on: the storm is closed and logged before the next chapter loads
  await setup();
  console.log('next', JSON.stringify(await page.evaluate(() => {
    document.getElementById('chNext').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    return { st: DSTORM.st, evs: __evs.filter(e => e.startsWith('pc_dstorm')) };
  })));
  console.log(errs.slice(0, 8).join('\n') || 'no errors');
  await browser.close();
})();
