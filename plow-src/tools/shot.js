// usage: node tools/shot.js "<query>" out.png [waitMs] [actions-json]
const { chromium } = require('playwright');
(async () => {
  const q = process.argv[2] || 'nointro&fresh', out = process.argv[3] || 'shot.png', wait = +(process.argv[4] || 1500);
  const acts = process.argv[5] ? JSON.parse(process.argv[5]) : [];
  const vw = +(process.env.VW || 1280), vh = +(process.env.VH || 720);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, hasTouch: !!process.env.TOUCH, isMobile: !!process.env.TOUCH });
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await page.goto('http://localhost:8765/?' + q);
  try { await page.waitForFunction(() => window.__ready, null, { timeout: 60000 }); } catch (e) { logs.push('TIMEOUT waiting ready'); }
  for (const a of acts) {
    if (a.key) { await page.keyboard.down(a.key); await page.waitForTimeout(a.ms || 500); await page.keyboard.up(a.key); }
    else if (a.wait) await page.waitForTimeout(a.wait);
    else if (a.eval) logs.push('EVAL: ' + JSON.stringify(await page.evaluate(a.eval)));
    else if (a.shot) { await page.evaluate(() => { window.__hold = true; }); await page.waitForTimeout(200); await page.evaluate(() => window.__render()); await page.screenshot({ path: a.shot, timeout: 120000 }); await page.evaluate(() => { window.__hold = false; }); }
    else if (a.step) { await page.evaluate(a2 => { window.__hold = true; window.__step(a2.n, a2.dt); }, a.step); }
  }
  await page.waitForTimeout(wait);
  await page.evaluate(() => { window.__hold = true; });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__render());
  await page.screenshot({ path: out, timeout: 120000 });
  console.log(logs.slice(0, 60).join('\n'));
  await browser.close();
})();
