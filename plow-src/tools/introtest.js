// chapter card at the start: never blocks, goes away by itself, on the first key or drag, or on its button;
// the chapter clock (and the school bus clock) wait while it is up.  node tools/introtest.js [port]
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || 8765;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  const st = (page) => page.evaluate(() => ({ up: CHUI.introUp, cls: document.getElementById('chIntro').className, open: CHUI.open, t: +GAME.time.toFixed(2), intro: +CAM.intro.toFixed(2), x: +PL.x.toFixed(2), z: +PL.z.toFixed(2), hint: document.getElementById('hint').classList.contains('on') ? document.getElementById('hint').textContent : '', leg: (CH.legT != null ? +CH.legT.toFixed(2) : null) }));
  const open = async (q, mobile) => {
    const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 700 }, isMobile: true, hasTouch: true } : { viewport: { width: 900, height: 560 } });
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(q + ': ' + e.message));
    await page.goto(`http://localhost:${port}/?norender&nosave&nodaily&fresh&${q}`);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    return { ctx, page };
  };
  // 1) nobody touches anything
  { const { ctx, page } = await open('ch=1');
    await page.waitForTimeout(1500); const a = await st(page);
    await page.waitForTimeout(5200); const b = await st(page);
    await page.waitForTimeout(1200); const c = await st(page);
    console.log('wait   ', JSON.stringify(a), '\n        ', JSON.stringify(b), '\n        ', JSON.stringify(c)); await ctx.close(); }
  // 2) a key during the card
  { const { ctx, page } = await open('ch=1');
    await page.waitForTimeout(1500); const a = await st(page);
    await page.keyboard.down('KeyS'); await page.waitForTimeout(900); const b = await st(page); await page.keyboard.up('KeyS');
    await page.waitForTimeout(1200); const c = await st(page);
    console.log('key    ', JSON.stringify(a), '\n        ', JSON.stringify(b), '\n        ', JSON.stringify(c)); await ctx.close(); }
  // 3) a drag on a phone
  { const { ctx, page } = await open('ch=1', true);
    await page.waitForTimeout(1500); const a = await st(page);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 500 }] });
    for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 500 + i * 8 }] }); await page.waitForTimeout(60); }
    await page.waitForTimeout(700); const b = await st(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    console.log('drag   ', JSON.stringify(a), '\n        ', JSON.stringify(b)); await ctx.close(); }
  // 4) the button
  { const { ctx, page } = await open('ch=1');
    await page.waitForFunction(() => CHUI.introUp, null, { timeout: 20000 });
    const bb = await page.evaluate(() => { const r = document.getElementById('chGo').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    await page.mouse.click(bb[0], bb[1]); await page.waitForTimeout(500); const b = await st(page);
    await page.waitForTimeout(1500); const c = await st(page);
    console.log('button ', JSON.stringify(b), '\n        ', JSON.stringify(c)); await ctx.close(); }
  // 5) the school bus clock waits for the card
  { const { ctx, page } = await open('ch=2&carry=20000');
    await page.waitForTimeout(3500); const a = await st(page);
    await page.waitForTimeout(4500); const b = await st(page);
    console.log('school ', JSON.stringify(a), '\n        ', JSON.stringify(b)); await ctx.close(); }
  console.log(errs.slice(0, 6).join('\n') || 'no errors');
  await browser.close();
})();
