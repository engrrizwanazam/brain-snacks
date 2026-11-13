const L = require('./lib.js');
(async () => { for (const root of process.argv.slice(2).length ? process.argv.slice(2) : [require('path').resolve(__dirname, '..')]) { const t = await L.open(root); const p = t.p;
  const count = ms => p.evaluate(ms => new Promise(res => { let n = 0; const mo = new MutationObserver(l => { n += l.length; }); mo.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['transform', 'opacity', 'fill', 'd'] }); setTimeout(() => { mo.disconnect(); res(n); }, ms); }), ms);
  const home = await count(3000);
  await p.evaluate(() => (document.getElementById('hero') || document.querySelector('[data-go="tricks"]')).click()); await p.waitForTimeout(150); await p.evaluate(() => document.querySelectorAll('.node')[0].click()); await p.waitForTimeout(300);
  const pz = await count(3000);
  await p.reload(); await p.waitForTimeout(150); await p.evaluate(() => document.querySelector('[data-go="odd"]').click()); await p.waitForTimeout(300);
  for (let r = 0; r < 12; r++) { const xy = await p.evaluate(() => { const gs = [...document.getElementById('arena').children].filter(g => g.tagName === 'g'); const m = {}; gs.forEach(g => { (m[g.innerHTML] = m[g.innerHTML] || []).push(g); }); const odd = Object.values(m).find(a => a.length === 1); return odd ? [odd[0].__x, odd[0].__y] : null; }); if (!xy) break; await L.tap(p, 'arena', xy[0], xy[1]); await p.waitForTimeout(650); }
  const sc = await p.evaluate(() => document.getElementById('ar-score').textContent);
  // cost of one pass of the shared ticker, measured by timing requestAnimationFrame callbacks
  const frame = await p.evaluate(() => new Promise(res => { const ts = []; let last = performance.now(); (function f() { const n = performance.now(); ts.push(n - last); last = n; if (ts.length < 120) requestAnimationFrame(f); else { ts.sort((a, b) => a - b); res([ts[60].toFixed(1), ts[114].toFixed(1)]); } })(); }));
  const jobs = await p.evaluate(() => (window.ART && ART.jobCount) ? ART.jobCount() : 'n/a');
  console.log(root.split('/').pop().padEnd(3), '| SVG attribute writes in 3s: home', home, '| puzzle 1', pz, '| Odd One after', sc, '-> ticker jobs', jobs, '| frame ms median/p95', frame.join('/'), t.errs.length ? t.errs : '');
  await t.close(); } })();
