const L = require('./lib.js'); const fs = require('fs');
require('fs').mkdirSync('shots', { recursive: true });
(async () => {
  const out = {}; fs.mkdirSync('shots', { recursive: true });
  for (const H of [667, 553]) {
    const { chromium } = require('playwright');
    const t = await L.open(process.argv[2] || require('path').resolve(__dirname, '..'), H); const p = t.p; let bad = [];
    const n = await p.evaluate(() => PUZZLES.length);
    for (let i = 0; i < n; i++) {
      await p.reload(); await p.waitForTimeout(80); await p.tap('#hero'); await p.waitForTimeout(60);
      await p.evaluate(i => document.querySelectorAll('.node')[i].click(), i); await p.waitForTimeout(350);
      const ov = await L.overflow(p), geo = await L.geo(p);
      const fit = await p.evaluate(() => { const a = document.getElementById('ask'); const c = document.querySelector('#s-play .col'); return [a.scrollHeight > a.clientHeight + 1, c.scrollHeight - c.clientHeight, a.offsetHeight]; });
      if (ov.length || geo.length || fit[0] || fit[1] > 0) bad.push([i + 1, ov.slice(0, 3), geo.slice(0, 2), fit]);
      if (H === 667) await p.screenshot({ path: 'shots/p' + String(i + 1).padStart(2, '0') + '.png', scale: 'css' });
      // hint sheet + win overlay layout on the tightest viewport
      if (H === 553 && i % 9 === 0) { await p.tap('#bulb'); await p.waitForTimeout(350); const o2 = await L.overflow(p); if (o2.length) bad.push([i + 1, 'hint', o2.slice(0, 3)]); }
    }
    console.log('H=' + H, 'puzzles', n, 'layout/geometry problems:', JSON.stringify(bad), 'js errors', t.errs);
    await t.close();
  }
})();
