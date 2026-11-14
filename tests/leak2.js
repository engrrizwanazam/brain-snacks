// Ticker jobs while every game runs unattended (rounds time out, game over, try again).
const L = require('./lib.js');
(async () => { const t = await L.open(process.argv[2] || require('path').resolve(__dirname, '..')); const p = t.p; let bad = 0;
  const keys = await p.evaluate(() => [...document.querySelectorAll('.card')].map(c => c.getAttribute('data-go')));
  const home0 = await p.evaluate(() => ART.jobCount());
  for (const k of keys) { await p.evaluate(k => document.querySelector('[data-go="' + k + '"]').click(), k); const s = [];
    for (let i = 0; i < 12; i++) { await p.waitForTimeout(1000); s.push(await p.evaluate(() => { const n = ART.jobCount(); const o = document.getElementById('ar-over'); if (o.className === 'over on') { const b = o.querySelector('button'); if (b) b.click(); } return n; })); }
    await p.evaluate(() => document.getElementById('ar-back').click()); await p.waitForTimeout(400); const home = await p.evaluate(() => ART.jobCount());
    const mx = Math.max(...s); const flag = mx > 90 || home > home0 + 2; if (flag) bad++;
    console.log((flag ? 'FAIL ' : 'ok   ') + k.padEnd(9) + 'jobs each second: ' + s.join(' ') + ' | back on home: ' + home); }
  console.log('home at start', home0, 'problems', bad, t.errs.slice(0, 3)); await t.close(); })();
