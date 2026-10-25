// chapter flow: finish ch1 quickly -> results -> next chapter -> ch2 intro -> play a bit -> reload (resume) -> map
const { chromium, devices } = require('playwright');
(async () => {
  const pre = process.argv[2] || '/tmp/flow_';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text()); });
  const ready = async () => { await page.waitForFunction(() => window.__ready, null, { timeout: 120000 }); await page.waitForTimeout(1500); await page.evaluate(() => { const l = document.getElementById('loading'); if (l) l.style.display = 'none'; }); };
  const shot = async (n) => { await page.evaluate(() => { window.__hold = true; __render(); }); await page.waitForTimeout(250); await page.screenshot({ path: pre + n + '.png' }); await page.evaluate(() => { window.__hold = false; }); };
  await page.goto('http://localhost:8765/?fresh');
  await ready();
  console.log('intro open:', await page.evaluate(() => CHUI.open));
  await page.evaluate(() => { document.getElementById('chGo').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
  // cheat: finish every job of chapter 1
  await page.evaluate(() => { window.__hold = true; GAME.owned.truck = 1; PL.setTool('truck', true); for (const a of SNOW.areas) if (a && !a.done) GAME.completeArea(a, true); for (let i = 0; i < 30 * 8; i++) __step(1, 1 / 30); window.__hold = false; });
  await page.waitForTimeout(3500);
  console.log('after finish:', await page.evaluate(() => ({ open: CHUI.open, ended: GAME.ended, stars: GAME.lastStars, ch: CH.id, saved: JSON.parse(localStorage.getItem('plowtown_v4')).chapters })));
  await shot('1res');
  await page.evaluate(() => { const b = document.getElementById('chNext'); b && b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
  await page.waitForTimeout(1500);
  await ready();
  console.log('ch2 boot:', await page.evaluate(() => ({ ch: CH.id, open: CHUI.open, tool: PL.tool, coins: Math.round(GAME.coins), crew: CREW.list.length })));
  await shot('2intro');
  await page.evaluate(() => { document.getElementById('chGo').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
  // play ch2 a little with the bot brain, then save + reload
  await page.evaluate(() => { window.__hold = true; BOT.init(); for (let i = 0; i < 30 * 25; i++) { const inp = BOT.get(1 / 30); PL.update(1 / 30, inp); GAME.update(1 / 30); LIFE.update(1 / 30); CREW.update(1 / 30); NPC.update(1 / 30); FX.update(1 / 30); UI.tick(1 / 30); } GAME.save(); window.__hold = false; });
  console.log('ch2 mid:', await page.evaluate(() => ({ t: GAME.time.toFixed(1), done: Object.keys(GAME.done), bus: CH.bus.state, kids: CH.bus.kidsIn })));
  await shot('3mid');
  await page.reload(); await ready();
  console.log('ch2 resumed:', await page.evaluate(() => ({ ch: CH.id, t: GAME.time.toFixed(1), done: Object.keys(GAME.done), bus: [CH.bus.state, CH.bus.x.toFixed(1), CH.bus.z.toFixed(1)], open: CHUI.open, x: PL.x.toFixed(1), z: PL.z.toFixed(1) })));
  await shot('4resume');
  await page.evaluate(() => { CHUI.map(); });
  await page.waitForTimeout(500);
  await shot('5map');
  console.log(errs.slice(0, 20).join('\n') || 'no errors');
  await browser.close();
})();
