// Structure, layout, saves, timers and performance.
const L = require('./lib.js'); const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || require('path').resolve(__dirname, '..'); let fails = 0;
const say = (ok, m) => { if (!ok) fails++; console.log((ok ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  // ---- 1. ladder integrity
  let t = await L.open(ROOT), p = t.p;
  const lad = await p.evaluate(() => PUZZLES.map(x => ({ d: x.d, id: BS.pid(x), ask: x.ask, hint: !!x.hint, tell: !!x.tell, why: !!x.why })));
  say(lad.every((x, i) => i === 0 || x.d > lad[i - 1].d), 'ladder: ' + lad.length + ' puzzles, every d strictly increasing (no ties to be broken by file order)');
  say(new Set(lad.map(x => x.id)).size === lad.length, 'ladder: every puzzle id is unique');
  say(lad.every(x => x.hint && x.tell && x.why), 'ladder: every puzzle has a nudge, an answer and a payoff line');
  const banned = /\b(maths?|practice|quiz|lesson|homework|level \d|skill)\b/i;
  const ui = await p.evaluate(() => { const out = []; out.push(document.body.innerText); PUZZLES.forEach(x => out.push(x.ask)); return out.join('\n'); });
  const hit = ui.split('\n').filter(l => banned.test(l));
  say(hit.length === 0, 'hidden learning: no "maths / practice / quiz / level N" wording in the home screen or any question' + (hit.length ? ' -> ' + hit.slice(0, 3) : ''));
  // ---- 2. home + list + overlays at both heights
  await t.close();
  for (const H of [667, 553]) { t = await L.open(ROOT, H); p = t.p; const bad = [];
    const chk = async tag => { const o = await L.overflow(p), g = await L.geo(p); if (o.length) bad.push(tag + ': ' + o.slice(0, 2)); if (g.length) bad.push(tag + ' geometry: ' + g.slice(0, 2)); };
    await chk('home'); const cardsN = await p.evaluate(() => document.querySelectorAll('.card').length);
    const sc = await p.evaluate(() => { const c = document.getElementById('cards'); c.scrollTop = 99999; const f = document.getElementById('home-foot').getBoundingClientRect(); return [c.scrollHeight > c.clientHeight, f.bottom <= window.innerHeight + 1]; });
    if (!sc[0] || !sc[1]) bad.push('home list does not scroll to its last row ' + sc);
    const clip = await p.evaluate(() => [...document.querySelectorAll('.card .cnm, .card .csb, .hero-nm, #sub-tricks, #tag')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent));
    if (clip.length) bad.push('home labels clipped: ' + clip.slice(0, 3));
    await p.tap('#hero'); await p.waitForTimeout(150); await chk('list');
    await p.evaluate(() => document.querySelectorAll('.node')[0].click()); await p.waitForTimeout(300); await L.tap(p, 'stage', 296, 210); await p.waitForTimeout(1500); await chk('win overlay');
    const wo = await p.evaluate(() => { const w = document.getElementById('win'); const kids = [...w.children].filter(e => getComputedStyle(e).display !== 'none'); const r = kids.map(e => e.getBoundingClientRect()); return [Math.min(...r.map(x => x.top)), Math.max(...r.map(x => x.bottom)), window.innerHeight]; });
    if (wo[0] < 0 || wo[1] > wo[2]) bad.push('win overlay content ' + wo.map(Math.round));
    await p.evaluate(() => document.getElementById('win-menu').click()); await p.waitForTimeout(100);
    // every game: opening screen, and its game-over card
    const keys = await p.evaluate(() => [...document.querySelectorAll('.card')].map(c => c.getAttribute('data-go')));
    for (const k of keys) { await p.reload(); await p.waitForTimeout(80); await p.evaluate(k => document.querySelector('[data-go="' + k + '"]').click(), k); await p.waitForTimeout(260); await chk(k);
      const col = await p.evaluate(() => { const c = document.querySelector('#s-arcade .col'); return c.scrollHeight - c.clientHeight; }); if (col > 0) bad.push(k + ' column taller than the screen by ' + col + 'px'); }
    // play log sheet
    await p.reload(); await p.waitForTimeout(80); await p.evaluate(() => { const l = document.getElementById('logo'); l.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); }); await p.waitForTimeout(3200);
    const sheet = await p.evaluate(() => document.getElementById('stats').className); if (sheet !== 'sheet on') bad.push('play log did not open on a 3s hold: ' + sheet);
    say(bad.length === 0 && t.errs.length === 0, '375x' + H + ': home, puzzle list, win overlay, ' + keys.length + ' game screens and the play log all fit' + (bad.length ? ' -> ' + bad.join(' | ') : '') + (t.errs.length ? ' JS ' + t.errs : ''));
    if (H === 667) { await p.evaluate(() => document.getElementById('stats-close').click()); await p.screenshot({ path: 'home_final.png' }); }
    await t.close(); }
  // ---- 3. a game left mid-timer must not paint over the next screen
  t = await L.open(ROOT); p = t.p; const keys = await p.evaluate(() => [...document.querySelectorAll('.card')].map(c => c.getAttribute('data-go'))); const leaks = [];
  for (const k of keys) { for (const dly of [120, 900]) { await p.evaluate(k => document.querySelector('[data-go="' + k + '"]').click(), k); await p.waitForTimeout(dly);
      await p.evaluate(() => { document.getElementById('ar-back').click(); document.getElementById('hero').click(); document.querySelectorAll('.node')[1].click(); });
      const sig = () => p.evaluate(() => [document.getElementById('arena').childNodes.length, document.getElementById('stage').childNodes.length, document.querySelector('.screen.on').id, document.getElementById('ar-over').className, document.getElementById('win').className].join('/'));
      const a = await sig(); await p.waitForTimeout(2600); const b = await sig(); if (a !== b) leaks.push(k + '@' + dly + ': ' + a + ' -> ' + b);
      await p.evaluate(() => { document.getElementById('quit').click(); document.getElementById('grid-back').click(); }); } }
  say(leaks.length === 0 && !t.errs.length, 'timers: each of ' + keys.length + ' games left after 0.1s and 0.9s, nothing repainted for the next 2.6s' + (leaks.length ? ' -> ' + leaks.join(' | ') : '') + (t.errs.length ? ' JS ' + t.errs : ''));
  // puzzles that finish on a timer: leave inside the window, the win must not pop on the next screen
  await p.reload(); await p.waitForTimeout(100); await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(100);
  await p.tap('#hero'); const jug = await p.evaluate(() => PUZZLES.findIndex(x => /exactly 2 cups/.test(x.ask))); await p.evaluate(i => document.querySelectorAll('.node')[i].click(), jug); await p.waitForTimeout(250);
  await L.tap(p, 'stage', 50, 244); await p.waitForTimeout(320); await L.tap(p, 'stage', 180, 96); await p.waitForTimeout(60); await p.evaluate(() => { document.getElementById('quit').click(); document.querySelectorAll('.node')[0].click(); }); await p.waitForTimeout(1500);
  const lw = await p.evaluate(() => [document.getElementById('win').className, Object.keys(JSON.parse(localStorage.getItem('bs.doneIds') || '{}')).length]);
  say(lw[0] === 'over' && lw[1] === 0, 'timers: leaving a puzzle 60ms after its winning move does not pop a win on the next puzzle or mark anything solved (' + lw + ')');
  await t.close();
  // ---- 4. old saves
  const idsV9 = JSON.parse(fs.readFileSync(path.join(__dirname, 'asks_v9.json'), 'utf8')); // the 60 questions of v9, in v9 order
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
  const v9ids = idsV9.map(hash);
  t = await L.open(ROOT, 667, { init: `if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.clear(); localStorage.setItem('bs.doneIds', ${JSON.stringify(JSON.stringify(Object.fromEntries(v9ids.map(k => [k, 1]))))}); localStorage.setItem('bs.stats', JSON.stringify({ "0": { o: 3, w: 1, n: 2, h: 0, t: 0, q: 0, ms: 4000 }, "40": { o: 9, w: 0, n: 30, h: 4, t: 1, q: 5, ms: 0 } })); localStorage.setItem('bs.oddBest', '7'); }` }); p = t.p;
  let m = await p.evaluate(() => ({ sub: document.getElementById('sub-tricks').textContent, done: PUZZLES.filter(x => JSON.parse(localStorage.getItem('bs.doneIds'))[BS.pid(x)] === 1).length, log: JSON.parse(localStorage.getItem('bs.log') || 'null'), old: localStorage.getItem('bs.stats'), odd: document.getElementById('sub-odd').textContent }));
  const k0 = v9ids[0], k40 = v9ids[40];
  say(m.done === 60 && /^60 of 90/.test(m.sub), 'saves: a v9 save with all 60 puzzles solved still shows all 60 solved after the re-order (' + m.sub + ')');
  say(m.log && m.log[k0] && m.log[k0].o === 3 && m.log[k40] && m.log[k40].n === 30 && m.old === null, 'saves: the v9 play log (keyed by position) is carried over to the right puzzles (v9 #41 "' + idsV9[40].slice(0, 28) + '..." keeps its 30 wrong taps)');
  say(/Best 7/.test(m.odd), 'saves: game best scores survive (' + m.odd + ')');
  await t.close();
  for (const [name, seed, expect] of [['v7 index map {0,1,35,36,55}', `localStorage.setItem('bs.done', JSON.stringify({ "0": 1, "1": 1, "35": 1, "36": 1, "55": 1 }))`, [0, 1, 37, 40, 59]], ['v6 high-water 3', `localStorage.setItem('bs.solved', '3')`, [0, 1, 2]]]) {
    t = await L.open(ROOT, 667, { init: `if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.clear(); ${seed}; }` }); p = t.p;
    const got = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('bs.doneIds')))); const want = expect.map(i => v9ids[i]);
    say(got.length === want.length && want.every(k => got.includes(k)), 'saves: ' + name + ' migrates to the right ' + want.length + ' puzzles'); await t.close(); }
  // ---- 5. start over clears everything this version writes
  t = await L.open(ROOT); p = t.p; await p.evaluate(() => { const ks = ['bs.doneIds', 'bs.log']; document.querySelectorAll('.card').forEach(() => {}); localStorage.setItem('bs.doneIds', '{"x":1}'); localStorage.setItem('bs.log', '{"x":{"o":1}}');
    ['bs.oddBest', 'bs.echoBest', 'bs.spotBest', 'bs.slideBest', 'bs.snapBest', 'bs.trailBest', 'bs.wakeBest', 'bs.sortBest', 'bs.mazeBest', 'bs.untangleBest', 'bs.whichBest', 'bs.fillBest', 'bs.pairs.easy', 'bs.pairs.medium', 'bs.pairs.hard', 'bs.pairsBest', 'bs.pairsLevel', 'bs.slide.easy', 'bs.slide.medium', 'bs.slide.hard', 'bs.slideLevel', 'bs.bigBest', 'bs.chompBest', 'bs.leftBest', 'bs.beadBest', 'bs.roboBest', 'bs.mirrorBest'].forEach(k => localStorage.setItem(k, '5')); localStorage.setItem('bs.muted', 'true'); });
  await p.evaluate(() => document.getElementById('wipe').click()); await p.waitForTimeout(700);
  const left = await p.evaluate(() => Object.keys(localStorage).filter(k => k.indexOf('bs.') === 0)); say(left.length === 1 && left[0] === 'bs.muted', '"Start over" removes every progress key and keeps only the sound setting (left: ' + left + ')'); await t.close();
  // ---- 6. static checks
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'), html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const cached = [...sw.matchAll(/'\.\/([^']+)'/g)].map(x => x[1]), scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(x => x[1]);
  say(scripts.every(s => cached.includes(s)) && cached.every(f => fs.existsSync(path.join(ROOT, f))), 'offline: all ' + scripts.length + ' scripts are in the service worker list, and every listed file exists (' + (sw.match(/brain-snacks-[^']+/) || [''])[0] + ')');
  const css = html.slice(html.indexOf('<style>'), html.indexOf('</style>')).replace(/\/\*[\s\S]*?\*\//g, ''); const cssBad = [];
  css.split('}').forEach(rule => { if (/display:(-webkit-)?flex/.test(rule) && /[^-]gap:/.test(rule)) cssBad.push('flex gap'); if (/[^-]gap:/.test(rule) && !/grid-gap:/.test(rule)) cssBad.push('gap without grid-gap: ' + rule.slice(0, 40)); });
  ['aspect-ratio', ':is(', 'inset:', 'clamp(', 'min(', 'max(', ':where(', 'backdrop-filter', ':focus-visible'].forEach(k => { if (css.indexOf(k) >= 0) cssBad.push(k); });
  say(cssBad.length === 0, 'Safari 12 CSS: no flex gap, aspect-ratio, :is(), inset, clamp/min/max' + (cssBad.length ? ' -> ' + cssBad : ''));
  console.log('misc failures', fails);
})();
