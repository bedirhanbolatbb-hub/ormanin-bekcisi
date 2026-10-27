// CrazyGames cloud save lags behind (the SDK sends saves about a second later): moving to the next chapter
// reloads the page right after saving, so the next start must not pick up the old copy and send you back.
// A fake SDK stands in for the real one: its "cloud" copy is written a while after setItem.
// node tools/cloudsave.js [port] [lagMs]
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || 8765, lag = +(process.argv[3] || 2500);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 640, height: 400 } });
  await ctx.route(/sdk\.crazygames\.com/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: '/* fake */' }));
  await ctx.addInitScript((lag) => {
    const cloud = () => { try { return JSON.parse(localStorage.getItem('__fakecloud') || '{}'); } catch (e) { return {}; } };
    const data = cloud(); const pend = {};
    window.CrazyGames = { SDK: {
      environment: 'crazygames',
      init: () => Promise.resolve(),
      game: { settings: { muteAudio: false }, addSettingsChangeListener() {}, loadingStart() {}, loadingStop() {}, gameplayStart() {}, gameplayStop() {}, happytime() {} },
      data: {
        getItem: (k) => (k in data ? data[k] : null),
        setItem: (k, v) => { data[k] = String(v); clearTimeout(pend[k]); pend[k] = setTimeout(() => { const c = cloud(); c[k] = String(v); localStorage.setItem('__fakecloud', JSON.stringify(c)); }, lag); },
        removeItem: (k) => { delete data[k]; },
      },
    } };
  }, lag);
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const st = () => page.evaluate(() => ({ ch: CH.id, env: CG.env, sdk: !!CG.sdk, ended: GAME.ended, cloud: (JSON.parse(localStorage.getItem('__fakecloud') || '{}').plowtown_v4 || '').slice(0, 0) + (JSON.parse((JSON.parse(localStorage.getItem('__fakecloud') || '{}').plowtown_v4) || 'null') || {}).chapter }));
  await page.goto(`http://localhost:${port}/?nointro&norender&nodaily&ch=1&fresh`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  console.log('start  ', JSON.stringify(await st()));
  // play a little, wait for the cloud copy to catch up, then finish the chapter and press "next chapter"
  await page.evaluate(() => { window.__hold = true; __step(30 * 20, 1 / 30); GAME.save(); });
  await page.waitForTimeout(lag + 800);
  await page.evaluate(() => { for (const a of SNOW.areas.filter(Boolean)) if (!a.done) GAME.completeArea(a, true); __step(30 * 3, 1 / 30); });
  console.log('done   ', JSON.stringify(await st()));
  const nav = page.waitForNavigation({ timeout: 30000 });
  await page.evaluate(() => CHUI.go(2));
  await nav;
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  console.log('after  ', JSON.stringify(await st()));
  await page.waitForTimeout(lag + 800);
  console.log('later  ', JSON.stringify(await st()));
  // and once more after a plain reload (the cloud copy has caught up by now)
  await page.reload(); await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  console.log('reload ', JSON.stringify(await st()));
  console.log(errs.slice(0, 5).join('\n') || 'no errors');
  await browser.close();
})();
