// which saved game wins, per CrazyGames player (fake SDK with a per-player account copy):
// - this device's copy got further than the account's (the last save never went up) -> it wins, for the same player
// - another player's copy on a shared computer is never used
// - a guest's copy is used when the account has nothing yet
// - a slow SDK finds the account further than the device copy -> the game carries on from the account's
// - the same game in two tabs: the tab that fell behind loads the newer game instead of overwriting it
// node tools/accounttest.js [port]
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || 8765;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 640, height: 400 } });
  await ctx.route(/sdk\.crazygames\.com/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: '/* fake */' }));
  await ctx.addInitScript(() => {
    const q = location.search, mode = (q.match(/__sdk=(\w+)/) || [])[1] || 'fast', user = (q.match(/__user=(\w+)/) || [])[1] || 'bob';
    const key = '__fakecloud_' + user, cloud = () => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { return {}; } };
    const data = cloud();
    window.CrazyGames = { SDK: {
      environment: 'crazygames',
      init: () => mode === 'late' ? new Promise(r => setTimeout(r, +((q.match(/__late=(\d+)/) || [])[1] || 7500))) : Promise.resolve(),
      user: { isUserAccountAvailable: true, getUser: () => Promise.resolve(user === 'guest' ? null : { username: user }) },
      game: { settings: { muteAudio: false }, addSettingsChangeListener() {}, loadingStart() {}, loadingStop() {}, gameplayStart() {}, gameplayStop() {}, happytime() {} },
      data: {
        getItem: (k) => (k in data ? data[k] : null),
        setItem: (k, v) => { data[k] = String(v); const c = cloud(); c[k] = String(v); localStorage.setItem(key, JSON.stringify(c)); },
        removeItem: (k) => { delete data[k]; },
      },
    } };
  });
  const errs = [];
  const mk = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); return p; };
  let page = await mk();
  const ready = (p) => (p || page).waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const open = async (q, p) => { await (p || page).goto(`http://localhost:${port}/?nointro&nodaily&norender${q}`); await ready(p); };
  const st = async (p) => { for (let i = 0; i < 20; i++) { try { const r = await (p || page).evaluate(() => window.__ready && CH ? ({ earned: Math.round(GAME.earned), ch: CH.id, uid: CG.uid }) : null); if (r) return r; } catch (e) { } await (p || page).waitForTimeout(1000); } return null; };
  const cloudOf = (user) => page.evaluate((u) => { try { const o = JSON.parse(JSON.parse(localStorage.getItem('__fakecloud_' + u) || '{}').plowtown_v4 || 'null'); return o ? Math.round(o.earned) : null; } catch (e) { return 'bad'; } }, user);
  const away = () => page.goto(`http://localhost:${port}/robots.txt`).catch(() => { });
  const setLocal = (o) => page.evaluate((o) => { const c = JSON.parse(localStorage.getItem('plowtown_v4')); Object.assign(c, o); localStorage.setItem('plowtown_v4', JSON.stringify(c)); }, o);
  const setCloud = (user, o) => page.evaluate(([u, o]) => { const k = '__fakecloud_' + u, cl = JSON.parse(localStorage.getItem(k) || '{}'), c = JSON.parse(cl.plowtown_v4 || localStorage.getItem('plowtown_v4')); Object.assign(c, o); cl.plowtown_v4 = JSON.stringify(c); localStorage.setItem(k, JSON.stringify(cl)); }, [user, o]);
  let ok = true; const check = (name, cond, extra) => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); if (!cond) ok = false; };

  await page.goto(`http://localhost:${port}/robots.txt`).catch(() => { });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  // bob plays a bit: 1000 earned, on the account
  await open('&fresh&__user=bob');
  await page.evaluate(() => { window.__hold = true; GAME.earn(1000); GAME.save(); });
  check('bob: saved to his account', (await cloudOf('bob')) === 1000, await cloudOf('bob'));
  // bob's last save on this device never went up (the tab closed within a second): the device copy is further
  await away(); await setLocal({ earned: 2000, coins: 2000, t: Date.now() });
  await open('&__user=bob');
  let s = await st();
  check('bob: device copy further -> it wins, and goes up', s.earned === 2000 && (await cloudOf('bob')) === 2000, { s, cloud: await cloudOf('bob') });
  // eve logs in on the same computer, nothing on her account: she must not get bob's game
  await open('&__user=eve');
  s = await st();
  check("eve: never gets bob's game", s.earned === 0 && s.uid === 'eve', s);
  await page.evaluate(() => { window.__hold = true; GAME.save(); });
  check("eve: bob's account untouched", (await cloudOf('bob')) === 2000, await cloudOf('bob'));
  // a guest plays here (device copy tagged as a guest's), later an empty account picks that up
  await open('&fresh&__user=guest');
  await page.evaluate(() => { window.__hold = true; GAME.earn(300); GAME.save(); });
  await away(); await page.evaluate(() => { localStorage.removeItem('__fakecloud_guest'); });
  await open('&__user=guest');
  s = await st();
  check('guest: own device copy used when the account is empty', s.earned === 300, s);
  // a slow SDK: the game starts from this device (bob, behind), the account is further -> carry on from the account
  await open('&fresh&__user=bob');
  await page.evaluate(() => { window.__hold = true; GAME.earn(100); GAME.save(); });
  await away(); await setCloud('bob', { earned: 5000, coins: 5000, chapter: 3, cs: null, t: Date.now() + 1000, u: 'bob' });
  await page.evaluate(() => { const c = JSON.parse(localStorage.getItem('plowtown_v4')); c.earned = 100; localStorage.setItem('plowtown_v4', JSON.stringify(c)); });
  const nav = page.waitForNavigation({ timeout: 60000 }).catch(() => null);
  await page.goto(`http://localhost:${port}/?nointro&nodaily&norender&__user=bob&__sdk=late&__late=14000`); await ready();
  const s0 = await st();
  await nav;   // the late SDK finds the further game and the page starts again with it
  await ready(); await page.waitForTimeout(16000);
  s = await st();
  check('slow SDK: carries on from the further account game', s0.earned === 100 && s.earned === 5000 && s.ch === 3, { s0, s });
  // two tabs of the same game: the one that falls behind loads the newer game
  await open('&__user=bob');
  const p2 = await mk(); await open('&__user=bob', p2);
  await p2.evaluate(() => { window.__hold = true; GAME.earn(2500); GAME.save(); });
  const nav2 = page.waitForNavigation({ timeout: 20000 }).catch(() => null);
  await page.evaluate(() => { window.__hold = true; GAME.save(); });
  await nav2; await ready();
  s = await st();
  check('two tabs: the tab behind loads the newer game', s.earned === 7500, s);
  console.log(errs.slice(0, 5).join('\n') || 'no errors');
  console.log(ok ? 'ALL OK' : 'SOME FAILED');
  await browser.close();
})();
