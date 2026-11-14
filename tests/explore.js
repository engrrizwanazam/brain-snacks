// For puzzles with no hand-written spec: tap every tappable thing on a fresh copy and see what happens.
const L = require('./lib.js'); const fs = require('fs');
const ROOT = process.argv[2] || require('path').resolve(__dirname, '..');
(async () => { const src = fs.readFileSync('pz.js', 'utf8'); const keys = [...src.matchAll(/^add\('((?:[^'\\]|\\.)*)'/gm)].map(m => m[1]);
  const t = await L.open(ROOT, 667, { init: () => { window.__bad = 0; window.addEventListener('load', () => { const o = BS.SFX.bad; BS.SFX.bad = function () { window.__bad++; return o.apply(this, arguments); }; }); } }); const p = t.p;
  const asks = await p.evaluate(() => PUZZLES.map(x => x.ask)); const todo = asks.map((a, i) => keys.some(k => a.indexOf(k) >= 0) ? -1 : i).filter(i => i >= 0);
  const only = process.argv[3]; const out = {};
  const open = async i => { await p.reload(); await p.waitForTimeout(100); await p.evaluate(() => { window.__bad = 0; }); await p.tap('#hero'); await p.waitForTimeout(60); await p.evaluate(i => document.querySelectorAll('.node')[i].click(), i); await p.waitForTimeout(280); };
  for (const i of todo) { if (only && asks[i].indexOf(only) < 0) continue; await open(i);
    const cands = await p.evaluate(() => { const o = []; document.querySelectorAll('#stage *').forEach(e => { if (e.style && e.style.cursor === 'pointer') { const r = e.getBoundingClientRect(); o.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, k: 'tap' }); } });
      const drags = [...document.querySelectorAll('#stage *')].filter(e => e.style && e.style.cursor === 'move').length; document.querySelectorAll('#tray .chip').forEach(b => { const r = b.getBoundingClientRect(); o.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, k: 'chip', t: b.textContent }); }); return { o, drags }; });
    const geo = await L.geo(p); const res = { n: cands.o.length, drags: cands.drags, win: [], nope: [], none: [], geo: geo.length };
    for (let c = 0; c < cands.o.length && c < 14; c++) { await open(i); await p.touchscreen.tap(cands.o[c].x, cands.o[c].y); await p.waitForTimeout(1300);
      const r = await p.evaluate(() => [document.getElementById('win').className === 'over on', window.__bad]); (r[0] ? res.win : r[1] ? res.nope : res.none).push(cands.o[c].k === 'chip' ? 'chip ' + cands.o[c].t : c); }
    out[asks[i]] = res; const kind = res.win.length && res.nope.length ? 'ONE-TAP ok ' : res.win.length ? 'WINS, NO REJECT' : 'multi-step ';
    console.log(kind, String(i + 1).padStart(3), asks[i].slice(0, 52).padEnd(52), '| targets', res.n, 'drag', res.drags, '| win', JSON.stringify(res.win), 'nope', res.nope.length, 'nothing', res.none.length, geo.length ? 'GEO ' + geo[0] : '', t.errs.length ? 'JS ' + t.errs.splice(0) : ''); }
  fs.writeFileSync('explore.json', JSON.stringify(out, null, 1)); await t.close(); })();
