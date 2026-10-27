// a slow or missing CrazyGames SDK must not lose progress:
// 1) session with an SDK that never gets ready -> progress is kept on this device (marked "not sent up")
// 2) next session with a working SDK whose account copy is older -> this device's newer copy wins and is sent up
// 3) session where the SDK gets ready late -> our progress is sent up once it is there
// node tools/latesdk.js [port]
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || 8765;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 640, height: 400 } });
  await ctx.route(/sdk\.crazygames\.com/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: '/* fake */' }));
  // the fake SDK reads its mode from the address: __sdk=never (init never ends), late (ready after 9 s), fast
  await ctx.addInitScript(() => {
    const mode = (location.search.match(/__sdk=(\w+)/) || [])[1] || 'fast';
    const cloud = () => { try { return JSON.parse(localStorage.getItem('__fakecloud') || '{}'); } catch (e) { return {}; } };
    const data = cloud();
    window.CrazyGames = { SDK: {
      environment: 'crazygames',
      init: () => mode === 'never' ? new Promise(() => { }) : mode === 'late' ? new Promise(r => setTimeout(r, 9000)) : Promise.resolve(),
      game: { settings: { muteAudio: false }, addSettingsChangeListener() {}, loadingStart() {}, loadingStop() {}, gameplayStart() { window.__gs = (window.__gs || 0) + 1; }, gameplayStop() {}, happytime() {} },
      data: {
        getItem: (k) => (k in data ? data[k] : null),
        setItem: (k, v) => { data[k] = String(v); const c = cloud(); c[k] = String(v); localStorage.setItem('__fakecloud', JSON.stringify(c)); },
        removeItem: (k) => { delete data[k]; },
      },
    } };
  });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const cloudOf = () => page.evaluate(() => { try { const o = JSON.parse(JSON.parse(localStorage.getItem('__fakecloud') || '{}').plowtown_v4 || 'null'); return o ? { coins: Math.round(o.coins), t: o.t, nc: o.nc } : null; } catch (e) { return 'bad'; } });
  const localOf = () => page.evaluate(() => { try { const o = JSON.parse(localStorage.getItem('plowtown_v4') || 'null'); return o ? { coins: Math.round(o.coins), t: o.t, nc: o.nc } : null; } catch (e) { return 'bad'; } });
  const open = async (mode, q) => {
    await page.goto(`http://localhost:${port}/?nointro&norender&nodaily&__sdk=${mode}` + (q || ''));
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  };
  // a cloud copy from an earlier day: 500 coins
  await page.goto(`http://localhost:${port}/robots.txt`).catch(() => {});
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await open('fast', '&fresh');
  await page.evaluate(() => { window.__hold = true; GAME.coins = 500; GAME.save(); });
  console.log('day1 fast  cloud', JSON.stringify(await cloudOf()), 'local', JSON.stringify(await localOf()));
  // session with a broken SDK: earn more, it stays on this device
  await open('never');
  await page.evaluate(() => { window.__hold = true; GAME.coins = 4000; GAME.save(); });
  console.log('day2 never cloud', JSON.stringify(await cloudOf()), 'local', JSON.stringify(await localOf()), 'sdk', await page.evaluate(() => !!CG.sdk));
  // next session, SDK fine: we must start with 4000, and send it up
  await open('fast');
  console.log('day3 fast  coins', await page.evaluate(() => Math.round(GAME.coins)), 'cloud', JSON.stringify(await cloudOf()));
  // a late SDK: game starts from this device, then sends its progress up when the SDK turns up
  await page.evaluate(() => { const c = JSON.parse(localStorage.getItem('__fakecloud')); localStorage.setItem('__fakecloud', JSON.stringify(c)); });
  await open('late');
  await page.evaluate(() => { window.__hold = true; GAME.coins = 7000; GAME.save(); });
  const before = await cloudOf();
  await page.waitForTimeout(11000);
  console.log('day4 late  coins', await page.evaluate(() => Math.round(GAME.coins)), 'cloud before', JSON.stringify(before), 'after', JSON.stringify(await cloudOf()), 'sdk', await page.evaluate(() => !!CG.sdk), 'hold', await page.evaluate(() => CG.hold), 'gs', await page.evaluate(() => window.__gs || 0));
  console.log(errs.slice(0, 5).join('\n') || 'no errors');
  await browser.close();
})();
