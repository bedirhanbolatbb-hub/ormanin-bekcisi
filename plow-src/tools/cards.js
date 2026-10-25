// node tools/cards.js <outprefix> [query]  -> screenshots of chapter intro / results / map cards (phone)
const { chromium, devices } = require('playwright');
(async () => {
  const pre = process.argv[2] || '/tmp/card', q = process.argv[3] || 'nointro';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', m => { if (m.type() === 'error') errs.push('ERR ' + m.text()); });
  await page.goto('http://localhost:8765/?' + q);
  await page.waitForFunction(() => window.__ready, null, { timeout: 90000 });
  await page.evaluate(() => { window.__hold = true; CAM.intro = 0.6; __step(10, 1 / 30); __render(); CHUI.intro(); });
  await page.waitForTimeout(900);
  await page.screenshot({ path: pre + 'intro.png' });
  await page.evaluate(() => { CHUI.close('chIntro'); CAM.intro = 0; __step(30, 1 / 30); GAME.lastStars = 2; GAME.lastNew = true; GAME.chapters[CH.id] = { stars: 2, best: 245, done: true }; GAME.time = 245; __render(); CHUI.results(); });
  await page.waitForTimeout(3600);
  await page.screenshot({ path: pre + 'res.png' });
  await page.evaluate(() => { CHUI.close('chRes'); CHUI.map(); });
  await page.waitForTimeout(600);
  await page.screenshot({ path: pre + 'map.png' });
  console.log(errs.join('\n') || 'no errors');
  await browser.close();
})();
