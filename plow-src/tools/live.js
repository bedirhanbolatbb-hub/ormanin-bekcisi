// real game loop for a few seconds per chapter, holding W, to catch runtime errors outside the test harness
const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [ch, carry] of [[1, 0], [2, 15000], [3, 120000], [4, 380000], [5, 420000], [6, 2500000], [7, 5000000], [8, 8000000], [9, 5000000]]) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text()); });
    await page.goto(`http://localhost:8765/?ch=${ch}&fresh${carry ? '&carry=' + carry : ''}`);
    await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = document.getElementById('chGo'); if (b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
    await page.keyboard.down('KeyW'); await page.waitForTimeout(6000); await page.keyboard.up('KeyW');
    await page.keyboard.down('KeyA'); await page.waitForTimeout(2500); await page.keyboard.up('KeyA');
    const st = await page.evaluate(() => ({ t: GAME.time.toFixed(1), x: PL.x.toFixed(1), z: PL.z.toFixed(1), coins: Math.round(GAME.coins), tool: PL.tool }));
    console.log('ch' + ch, JSON.stringify(st), errs.slice(0, 5).join(' | ') || 'no errors');
    await ctx.close();
  }
  await browser.close();
})();
