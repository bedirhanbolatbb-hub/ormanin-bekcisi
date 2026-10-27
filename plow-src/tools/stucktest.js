// "stuck in a chapter, it does not go to the next one" (player report, CrazyGames, logged in):
// the account copy lags behind, so a player can land back in a chapter they already finished.
// 1) finish chapter 1, "stay here" -> the goal bar shows NEXT CHAPTER
// 2) come back later (reload) -> still finished, NEXT CHAPTER shows, with a hint
// 3) tap it -> chapter 2, and it stays chapter 2 after the slow account copy and another reload
// node tools/stucktest.js [port] [lagMs] [shotPrefix]
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || 8765, lag = +(process.argv[3] || 2500), pre = process.argv[4] || '';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1134, height: 638 } });
  await ctx.route(/sdk\.crazygames\.com/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: '/* fake */' }));
  await ctx.addInitScript((lag) => {
    const cloud = () => { try { return JSON.parse(localStorage.getItem('__fakecloud') || '{}'); } catch (e) { return {}; } };
    const data = cloud(); const pend = {};
    window.CrazyGames = { SDK: {
      environment: 'crazygames',
      init: () => Promise.resolve(),
      user: { isUserAccountAvailable: true, getUser: () => Promise.resolve({ username: 'tester' }) },
      game: { settings: { muteAudio: false }, addSettingsChangeListener() {}, loadingStart() {}, loadingStop() {}, gameplayStart() { window.__gs = (window.__gs || 0) + 1; }, gameplayStop() {}, happytime() {} },
      data: {
        getItem: (k) => (k in data ? data[k] : null),
        setItem: (k, v) => { data[k] = String(v); clearTimeout(pend[k]); pend[k] = setTimeout(() => { const c = cloud(); c[k] = String(v); localStorage.setItem('__fakecloud', JSON.stringify(c)); }, lag); },
        removeItem: (k) => { delete data[k]; },
      },
    } };
  }, lag);
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errs.push(m.type() + ' ' + m.text()); });
  const ready = () => page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const st = () => page.evaluate(() => ({
    ch: CH.id, ended: GAME.ended, open: CHUI.open, next: document.getElementById('goal').classList.contains('next'),
    btn: getComputedStyle(document.getElementById('goalNext')).display, hint: document.getElementById('hint').classList.contains('on') ? document.getElementById('hint').textContent : '',
    toast: document.getElementById('toast').classList.contains('on') ? document.getElementById('toast').textContent : '',
    cloudCh: (JSON.parse((JSON.parse(localStorage.getItem('__fakecloud') || '{}').plowtown_v4) || 'null') || {}).chapter,
  }));
  const tick = (sec) => page.evaluate((n) => { window.__hold = true; __step(n, 1 / 30); UI._uiT = 0; UI.update(0.016); }, Math.round(sec * 30));
  const shot = async (n) => { if (!pre) return; await page.evaluate(() => { const l = document.getElementById('loading'); if (l) l.style.display = 'none'; __render(); }); await page.waitForTimeout(200); await page.screenshot({ path: pre + n + '.png' }); };
  const cloudCaughtUp = (want) => page.waitForFunction((want) => { const o = JSON.parse((JSON.parse(localStorage.getItem('__fakecloud') || '{}').plowtown_v4) || 'null'); return o && o.chapter === want.ch && !!(o.cs && o.cs.ended) === want.ended; }, want, { timeout: 20000 });
  let ok = true; const check = (name, cond, extra) => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + JSON.stringify(extra) : '')); if (!cond) ok = false; };

  await page.goto(`http://localhost:${port}/?nointro&nodaily&ch=1&fresh`); await ready();
  await page.evaluate(() => { window.__hold = true; for (const a of SNOW.areas.filter(Boolean)) if (!a.done) GAME.completeArea(a, true); });
  await tick(7);
  let s = await st();
  check('results card after the last job', s.open === 'chRes' && s.ended, s);
  check('no NEXT button behind the results card', !s.next, s);
  await page.evaluate(() => document.getElementById('chStay').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await tick(0.3);
  // (the toast waits for the finale banner to finish, in real time)
  await page.waitForFunction(() => document.getElementById('toast').classList.contains('on'), null, { timeout: 8000 }).catch(() => { });
  s = await st();
  check('"stay here" -> NEXT CHAPTER in the goal bar', s.next && s.btn === 'flex' && !s.open, s);
  check('toast points at it', /NEXT CHAPTER/.test(s.toast), s);
  await shot('stay');
  // later: the account copy has caught up with the finished chapter, the player comes back
  await page.evaluate(() => GAME.save()); await cloudCaughtUp({ ch: 1, ended: true });
  await page.goto(`http://localhost:${port}/?nointro&nodaily`); await ready();
  await page.waitForTimeout(1500); await tick(0.2);
  s = await st();
  check('back in the finished chapter: NEXT CHAPTER shows', s.ch === 1 && s.ended && s.next && s.btn === 'flex', s);
  check('hint says how to go on', /NEXT CHAPTER/.test(s.hint), s);
  await shot('back');
  const nav = page.waitForNavigation({ timeout: 30000 });
  await page.evaluate(() => { const b = document.getElementById('goalNext'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
  await nav; await ready(); await tick(0.2);
  s = await st();
  check('tap -> chapter 2, fresh start, no button', s.ch === 2 && !s.ended && !s.next, s);
  await cloudCaughtUp({ ch: 2, ended: false }).catch(() => { });
  await page.reload(); await ready(); await tick(0.2);
  s = await st();
  check('reload after the account copy caught up -> still chapter 2', s.ch === 2 && s.cloudCh === 2, s);
  // the last chapter has no next one: no button there
  await page.goto(`http://localhost:${port}/?nointro&nodaily&ch=9&fresh&carry=5000000`); await ready();
  await page.evaluate(() => { window.__hold = true; for (const a of SNOW.areas.filter(Boolean)) if (!a.done) GAME.completeArea(a, true); });
  await tick(13);
  await page.evaluate(() => { const b = document.getElementById('chStay'); b && b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
  await tick(0.3);
  s = await st();
  check('last chapter finished: no NEXT button', s.ch === 9 && s.ended && !s.next, s);
  // a new day on the way back: the gift banner first, then the hint
  await page.goto(`http://localhost:${port}/?nointro&nodaily&ch=1&fresh`); await ready();
  await page.evaluate(() => { window.__hold = true; for (const a of SNOW.areas.filter(Boolean)) if (!a.done) GAME.completeArea(a, true); });
  await tick(7);
  await page.evaluate(() => { CHUI.close('chRes'); GAME.save(); const d = new Date(); d.setDate(d.getDate() - 1); localStorage.setItem('plowtown_day', d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()); localStorage.setItem('plowtown_dayn', '1'); });
  await cloudCaughtUp({ ch: 1, ended: true });
  await page.evaluate(() => { const c = JSON.parse(localStorage.getItem('__fakecloud') || '{}'); c.plowtown_day = localStorage.getItem('plowtown_day'); c.plowtown_dayn = '1'; localStorage.setItem('__fakecloud', JSON.stringify(c)); });
  await page.goto(`http://localhost:${port}/?nointro`); await ready();
  // order of what shows up (page clock): the gift banner first, then the hint
  const t0 = await page.evaluate(() => { window.__log = []; const h = UI.hint.bind(UI), b = UI.banner.bind(UI); UI.hint = (t, d) => { window.__log.push(['hint', Math.round(performance.now()), t]); return h(t, d); }; UI.banner = (t, s, i, d) => { window.__log.push(['banner', Math.round(performance.now()), t]); return b(t, s, i, d); }; window.__hold = false; return performance.now(); });
  await page.waitForTimeout(8000);
  const lg = await page.evaluate(() => window.__log), bn = await page.evaluate(() => document.getElementById('banner').textContent);
  const hi = lg.find(x => x[0] === 'hint' && /NEXT CHAPTER/.test(x[2]));
  check('daily gift and the hint both show', /DAILY GIFT/.test(bn) && !!hi, { t0: Math.round(t0), lg, bn });
  console.log(errs.slice(0, 5).join('\n') || 'no errors');
  console.log(ok ? 'ALL OK' : 'SOME FAILED');
  await browser.close();
})();
