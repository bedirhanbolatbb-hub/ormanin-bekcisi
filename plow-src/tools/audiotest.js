const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.goto('http://localhost:8765/?nointro&fresh&ch=1');
  await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  const r = await page.evaluate(async () => {
    AUD.init(); await AUD.ctx.resume();
    const an = AUD.ctx.createAnalyser(); an.fftSize = 2048; AUD.mus.connect(an);
    const out = {};
    for (const [k, S] of [['maple', SONG_MAPLE], ['school', SONG_SCHOOL], ['market', SONG_MARKET], ['lake', SONG_LAKE], ['resort', SONG_RESORT]]) {
      AUD.song = S; AUD._musT = AUD.ctx.currentTime + 0.05; AUD._musStep = 0;
      let peak = 0, sum = 0, n = 0; const buf = new Float32Array(2048);
      const t0 = performance.now();
      while (performance.now() - t0 < 2500) { AUD._music(); await new Promise(r => setTimeout(r, 50)); an.getFloatTimeDomainData(buf); for (const v of buf) { peak = Math.max(peak, Math.abs(v)); sum += v * v; n++; } }
      out[k] = { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / n).toFixed(4), state: AUD.ctx.state };
    }
    return out;
  });
  console.log(JSON.stringify(r)); console.log(errs.join('\n') || 'no errors');
  await browser.close();
})();
