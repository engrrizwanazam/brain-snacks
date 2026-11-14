// Structure, layout, saves, timers and performance.
require('fs').mkdirSync('shots', { recursive: true });
const L = require('./lib.js'); const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || require('path').resolve(__dirname, '..'); let fails = 0;
const say = (ok, m) => { if (!ok) fails++; console.log((ok ? 'ok   ' : 'FAIL ') + m); };
(async () => {
  let t, p; if (process.argv[3] !== 'notch') {
  // ---- 1. ladder integrity
  t = await L.open(ROOT); p = t.p;
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
  await p.tap('#hero'); const owl = await p.evaluate(() => PUZZLES.findIndex(x => /owl wants to wake/.test(x.ask))); await p.evaluate(i => document.querySelectorAll('.node')[i].click(), owl); await p.waitForTimeout(250);
  await L.drag(p, 'stage', 300, 56, 300, 288, 14); await p.waitForTimeout(60); await p.evaluate(() => { document.getElementById('quit').click(); document.querySelectorAll('.node')[0].click(); }); await p.waitForTimeout(1500);
  const lw = await p.evaluate(() => [document.getElementById('win').className, Object.keys(JSON.parse(localStorage.getItem('bs.doneIds') || '{}')).length]);
  say(lw[0] === 'over' && lw[1] === 0, 'timers: leaving a puzzle 60ms after its winning move does not pop a win on the next puzzle or mark anything solved (' + lw + ')');
  await t.close();
  // ---- 4. old saves
  const asksV12 = JSON.parse(fs.readFileSync(path.join(__dirname, 'asks_v12.json'), 'utf8')); // the 100 questions of v12, in v12 order
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
  const v12ids = asksV12.map(hash);
  t = await L.open(ROOT, 667, { init: `if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.clear(); localStorage.setItem('bs.doneIds', ${JSON.stringify(JSON.stringify(Object.fromEntries(v12ids.map(k => [k, 1]))))}); localStorage.setItem('bs.stats', JSON.stringify({ "0": { o: 3, w: 1, n: 2, h: 0, t: 0, q: 0, ms: 4000 }, "70": { o: 9, w: 0, n: 30, h: 4, t: 1, q: 5, ms: 0 } })); localStorage.setItem('bs.oddBest', '7'); localStorage.setItem('bs.cupsBest', '4'); }` }); p = t.p;
  let m = await p.evaluate(() => ({ sub: document.getElementById('sub-tricks').textContent, n: PUZZLES.length, done: PUZZLES.filter(x => JSON.parse(localStorage.getItem('bs.doneIds'))[BS.pid(x)] === 1).length, log: JSON.parse(localStorage.getItem('bs.log') || 'null'), old: localStorage.getItem('bs.stats'), odd: document.getElementById('sub-odd').textContent, cups: document.getElementById('sub-cups').textContent, ids: PUZZLES.map(x => BS.pid(x)) }));
  const k0 = v12ids[0], k70 = v12ids[70];
  say(m.done === 100 && new RegExp('^100 of ' + m.n).test(m.sub), 'saves: a v12 save with all 100 puzzles solved still shows all 100 solved in the new ladder (' + m.sub + ')');
  say(v12ids.every(k => m.ids.includes(k)), 'saves: every one of the 100 v12 puzzles is still in the ladder under the same save key');
  say(m.log && m.log[k0] && m.log[k0].o === 3 && m.log[k70] && m.log[k70].n === 30 && m.old === null && m.ids.includes(k70), 'saves: a v12 play log (keyed by position) is carried over to the right puzzles (v12 #71 "' + asksV12[70].slice(0, 28) + '..." keeps its 30 wrong taps)');
  say(/Best 7/.test(m.odd) && /4/.test(m.cups), 'saves: game best scores survive (' + m.odd + ' / ' + m.cups + ')');
  await t.close();
  // ---- 5. start over clears everything this version writes
  t = await L.open(ROOT); p = t.p; await p.evaluate(() => { const ks = ['bs.doneIds', 'bs.log']; document.querySelectorAll('.card').forEach(() => {}); localStorage.setItem('bs.doneIds', '{"x":1}'); localStorage.setItem('bs.log', '{"x":{"o":1}}');
    ['bs.oddBest', 'bs.echoBest', 'bs.spotBest', 'bs.slideBest', 'bs.snapBest', 'bs.trailBest', 'bs.wakeBest', 'bs.sortBest', 'bs.mazeBest', 'bs.untangleBest', 'bs.whichBest', 'bs.fillBest', 'bs.pairs.easy', 'bs.pairs.medium', 'bs.pairs.hard', 'bs.pairsBest', 'bs.pairsLevel', 'bs.slide.easy', 'bs.slide.medium', 'bs.slide.hard', 'bs.slideLevel', 'bs.bigBest', 'bs.chompBest', 'bs.leftBest', 'bs.beadBest', 'bs.roboBest', 'bs.mirrorBest', 'bs.cupsBest', 'bs.followBest', 'bs.howmanyBest', 'bs.pileBest', 'bs.colourBest', 'bs.oppBest', 'bs.shadowBest', 'bs.roundBest'].forEach(k => localStorage.setItem(k, '5')); localStorage.setItem('bs.muted', 'true'); });
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
  }
  // ---- 7. notches, home bars and wide screens
  // Chrome has no notch, so the insets are forced to the values real phones report.
  const { chromium } = require('playwright');
  for (const dev of [['iPhone 15 Pro (Dynamic Island)', 393, 852, 59, 34], ['iPhone 13 mini (notch)', 375, 812, 50, 34], ['iPhone 15 Pro Max', 430, 932, 59, 34], ['Android with punch-hole', 360, 780, 32, 16], ['iPhone 6 (no notch)', 375, 667, 20, 0], ['iPad', 820, 1180, 24, 20], ['iPad sideways', 1180, 820, 24, 20], ['small Android', 320, 568, 24, 0]]) {
    const [name, W, H, sat, sab] = dev; t = await L.open(ROOT, 667); p = t.p; await p.setViewportSize({ width: W, height: H });
    const force = () => p.evaluate(([a, b]) => { document.documentElement.style.setProperty('--sat', a + 'px'); document.documentElement.style.setProperty('--sab', b + 'px'); window.dispatchEvent(new Event('resize')); }, [sat, sab]);
    const bad = []; await force(); await p.waitForTimeout(120);
    const chk = async tag => { const r = await p.evaluate(([sat, sab]) => { const scr = document.querySelector('.screen.on'); const out = []; const vh = window.innerHeight, vw = window.innerWidth; let top = 1e9, bot = 0;
        scr.querySelectorAll('button, .top *, #ar-score, #ar-title, #title, .ask, svg, .chip, .card, .node, #home-foot *').forEach(e => { if (e.closest('svg') && e.tagName !== 'svg') return; const st = getComputedStyle(e); if (st.display === 'none' || st.visibility === 'hidden') return; if (e.closest('.over') && !e.closest('.over.on')) return; if (e.closest('#hint') && !e.closest('#hint.on')) return; if (e.closest('#cards,#nodes')) return;
          const b = e.getBoundingClientRect(); if (!b.width && !b.height) return; top = Math.min(top, b.top); bot = Math.max(bot, b.bottom); if (b.left < -0.5 || b.right > vw + 0.5) out.push((e.id || e.className || e.tagName) + ' off the side'); });
        if (top < sat - 0.5) out.push('something starts at ' + Math.round(top) + ', under the ' + sat + 'px status bar'); if (bot > vh - sab + 0.5) out.push('something ends at ' + Math.round(bot) + ', under the home bar (limit ' + (vh - sab) + ')');
        const sv = scr.querySelector('#stage, #arena'); if (sv) { const b = sv.getBoundingClientRect(); if (b.width < 250) out.push('picture only ' + Math.round(b.width) + ' wide'); }
        return out; }, [sat, sab]); if (r.length) bad.push(tag + ': ' + r.join(', ')); const g = await L.geo(p); if (g.length) bad.push(tag + ' geometry'); };
    await chk('home'); await p.tap('#hero'); await p.waitForTimeout(150); await chk('list');
    for (const i of [0, 37, 129]) { await p.evaluate(i => document.querySelectorAll('.node')[i].click(), i); await p.waitForTimeout(300); await chk('puzzle ' + (i + 1));
      if (i === 0) { await p.evaluate(() => document.getElementById('bulb').click()); await p.waitForTimeout(250); const hb = await p.evaluate(() => { const h = document.getElementById('hint'); return h.className.indexOf('on') >= 0 ? h.getBoundingClientRect().bottom : -1; }); if (hb < 0) bad.push('hint did not open'); else if (hb > H - sab + 0.5) bad.push('hint ends at ' + Math.round(hb) + ', under the home bar'); await p.evaluate(() => document.getElementById('hint').click()); await p.waitForTimeout(150);
        await L.tap(p, 'stage', 296, 210); await p.waitForTimeout(1500); const wo = await p.evaluate(() => { const w = document.getElementById('win'); if (w.className !== 'over on') return null; const r = [...w.children].filter(e => getComputedStyle(e).display !== 'none').map(e => e.getBoundingClientRect()); return [Math.min(...r.map(x => x.top)), Math.max(...r.map(x => x.bottom))]; });
        if (!wo) bad.push('win card did not open'); else if (wo[0] < sat - 0.5 || wo[1] > H - sab + 0.5) bad.push('win card spans ' + wo.map(Math.round) + ', outside the safe area'); await p.evaluate(() => document.getElementById('win-menu').click()); await p.waitForTimeout(120); await force(); await chk('list after a win'); }
      else { await p.evaluate(() => document.getElementById('quit').click()); await p.waitForTimeout(120); } }
    await p.evaluate(() => document.getElementById('grid-back').click()); await p.waitForTimeout(100);
    for (const k of ['odd', 'left', 'roundup', 'fill', 'colour']) { await p.evaluate(k => document.querySelector('[data-go="' + k + '"]').click(), k); await p.waitForTimeout(300); await chk(k); await p.evaluate(() => document.getElementById('ar-back').click()); await p.waitForTimeout(100); }
    const hd = await p.evaluate(() => { document.querySelector('[data-go="odd"]').click(); const b = document.getElementById('ar-back').getBoundingClientRect(), s = document.getElementById('ar-score').getBoundingClientRect(); return [Math.round(b.top), Math.round(s.top)]; });
    say(bad.length === 0 && !t.errs.length, name + ' ' + W + 'x' + H + ', status bar ' + sat + 'px, home bar ' + sab + 'px: back button at y=' + hd[0] + ' and score at y=' + hd[1] + ' are below the bar; home, list, 3 puzzles, hint, win card and 5 games stay inside the safe area' + (bad.length ? ' -> ' + [...new Set(bad)].slice(0, 5).join(' | ') : '') + (t.errs.length ? ' JS ' + t.errs.slice(0, 2) : ''));
    if (W === 393) { await p.screenshot({ path: 'shots/notch_game.png', scale: 'css' }); }
    await t.close(); }
  console.log('misc failures', fails);
})();
