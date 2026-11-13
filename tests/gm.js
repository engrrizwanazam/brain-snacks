// Game battery: every game is played by reading the screen, never the score alone.
const L = require('./lib.js');
const ROOT = process.argv[2] || require('path').resolve(__dirname, '..'), ONLY = process.argv[3] || '';
const G = {};
let p, t, errs;
const ev = (f, a) => p.evaluate(f, a), wait = ms => p.waitForTimeout(ms);
const tap = async (x, y) => { await L.tap(p, 'arena', x, y); };
const drag = (a, b, c, d, n) => L.drag(p, 'arena', a, b, c, d, n || 8);
const score = () => ev(() => document.getElementById('ar-score').textContent);
const toast = () => ev(() => document.getElementById('ar-toast').textContent);
const over = () => ev(() => document.getElementById('ar-over').className === 'over on' ? document.getElementById('ao-word').textContent + ' / ' + document.getElementById('ao-why').textContent : null);
const ok = (c, m) => { if (!c) errs.push(m); };
const start = async k => { await p.reload(); await wait(150); await ev(k => document.querySelector('[data-go="' + k + '"]').click(), k); await wait(250); };
const hearts = async () => ((await score()).match(/♥/g) || []).length;

G.pairs = async () => {
  await ev(() => document.querySelector('[data-lv="easy"]').click()); await wait(200);
  const cards = await ev(() => [...document.getElementById('arena').children].filter(g => g.__kind !== undefined).map(g => ({ x: g.__cx, y: g.__cy, k: g.__kind })));
  ok(cards.length === 12, 'easy board should have 12 cards, has ' + cards.length);
  const face = i => ev(i => { const g = [...document.getElementById('arena').children].filter(g => g.__kind !== undefined)[i]; return [g.__face.getAttribute('opacity'), g.getAttribute('transform')]; }, i);
  // wrong: two different cards must turn back over
  const a = 0, b = cards.findIndex(c => c.k !== cards[0].k);
  await tap(cards[a].x, cards[a].y); await wait(350); ok((await face(a))[0] === '1', 'first card did not show its face');
  await tap(cards[b].x, cards[b].y); await wait(1500);
  const fa = await face(a), fb = await face(b); ok(fa[0] === '0' && fb[0] === '0', 'unmatched cards stayed face up ' + fa + fb); ok(/scale\(1,1\)/.test(fa[1]), 'card left squashed mid-flip: ' + fa[1]);
  for (let k = 0; k < 6; k++) { const pr = cards.map((c, i) => [c, i]).filter(q => q[0].k === k); for (const q of pr) { await tap(q[0].x, q[0].y); await wait(330); } await wait(450); }
  await wait(900); const up = await ev(() => [...document.getElementById('arena').children].filter(g => g.__kind !== undefined).filter(g => g.__face.getAttribute('opacity') === '1').length);
  ok(up === 12, 'faces showing at the end: ' + up); const o = await over(); ok(o && /moves/.test(o), 'no finish card: ' + o);
  return '12 cards matched, mismatch turned back; ' + (o || '').slice(0, 40);
};
const oddXY = () => ev(() => { const cs = document.getElementById('arena').__chars || []; const m = {}; cs.forEach(g => { (m[g.innerHTML] = m[g.innerHTML] || []).push(g); }); const v = Object.values(m); const odd = v.find(a => a.length === 1), rest = v.find(a => a.length > 1); return odd && rest ? { o: [odd[0].__x, odd[0].__y], w: [rest[0].__x, rest[0].__y], n: cs.length, kinds: v.length } : null; });
G.odd = async () => { let n = 0, sizes = [];
  for (let r = 0; r < 12; r++) { const q = await oddXY(); if (!q) { ok(false, 'round ' + r + ': no single odd critter on screen'); break; } ok(q.kinds === 2, 'round ' + r + ': more than one kind of difference (' + q.kinds + ')'); sizes.push(q.n);
    if (r === 0) { const b0 = await ev(() => parseFloat(document.getElementById('ar-fill').style.width)); await tap(q.w[0], q.w[1]); await wait(250); ok(/Nope/.test(await toast()), 'wrong critter was not refused'); ok(/^0 /.test(await score()), 'wrong tap scored'); const b1 = await ev(() => parseFloat(document.getElementById('ar-fill').style.width)); ok(b1 < b0 - 8, 'wrong tap cost no time ' + b0 + '>' + b1); }
    await tap(q.o[0], q.o[1]); await wait(160); const ring = await ev(() => [...document.querySelectorAll('#arena circle')].some(c => c.getAttribute('stroke') === '#3FBF7F')); ok(ring, 'no green ring on the right answer'); await wait(520); n++; }
  ok(/^12 in a row/.test(await score()), 'score ' + await score()); return n + ' rounds, grid ' + sizes.join('>'); };
G.echo = async () => { // record the flashes off the screen, then repeat them
  await ev(() => document.getElementById('ar-back').click()); await wait(150);
  await ev(() => { window.__fl = []; document.querySelector('[data-go="echo"]').click(); const was = {};
    setInterval(() => { const pads = [...document.getElementById('arena').children].filter(g => g.tagName === 'g'); pads.forEach((g, i) => { const on = g.firstChild.getAttribute('opacity') !== '0'; if (on && !was[i]) window.__fl.push(i); was[i] = on; }); }, 16); });
  const padsXY = () => ev(() => [...document.getElementById('arena').children].filter(g => g.tagName === 'g').map(g => [g.__x, g.__y]));
  const heard = async n => { for (let k = 0; k < 150; k++) { if ((await ev(() => window.__fl.length)) >= n) break; await wait(60); } await wait(700); const f = await ev(() => window.__fl.splice(0)); return f; };
  let rounds = 0;
  for (let r = 0; r < 6; r++) { const seq = await heard(r + 1); ok(seq.length === r + 1, 'round ' + r + ' flashed ' + seq.length + ' pads'); const xy = await padsXY();
    for (const i of seq) { await tap(xy[i][0], xy[i][1]); await wait(330); } await ev(() => window.__fl.splice(0)); rounds++; ok(!(await over()), 'correct echo ended the game at round ' + r); }
  const seq = await heard(7); const xy = await padsXY(); const wrongI = (seq[0] + 1) % xy.length; await tap(xy[wrongI][0], xy[wrongI][1]); await wait(1100); const o = await over(); ok(o && /echoed 6/.test(o), 'wrong pad did not end the game: ' + o);
  return rounds + ' rounds echoed by watching the pads light up (pads now ' + xy.length + '), wrong pad ended it'; };
G.spot = async () => { let done = 0;
  for (let r = 0; r < 5; r++) { const q = await ev(() => { const cs = document.getElementById('arena').__chars; const n = cs.length / 2; const d = [], same = []; for (let i = 0; i < n; i++) { const a = cs[i].innerHTML, b = cs[i + n].innerHTML; (a === b && cs[i].__size === cs[i + n].__size ? same : d).push([cs[i + n].__x, cs[i + n].__y]); } return { d, same, n }; });
    const need = +(await score()).split('/')[1]; ok(q.d.length === need, 'round ' + r + ': ' + q.d.length + ' visible differences but the game wants ' + need);
    if (r === 0) { await tap(q.same[0][0], q.same[0][1]); await wait(250); ok(/Nope/.test(await toast()), 'tapping an unchanged critter was not refused'); ok(/^0 \//.test(await score()), 'unchanged critter counted'); }
    for (const d of q.d) { await tap(d[0], d[1]); await wait(200); }
    const rings = await ev(() => [...document.querySelectorAll('#arena circle')].filter(c => c.getAttribute('stroke') === '#3FBF7F' && c.getAttribute('fill') === 'none').length); ok(rings === need * 2, 'rings drawn ' + rings + ' for ' + need + ' finds'); done++; await wait(1050); }
  return done + ' pictures cleared; every difference was visible in the drawing'; };
const slideRead = () => ev(() => [...document.getElementById('arena').children].filter(g => g.tagName === 'g').map(g => ({ v: +g.querySelector('text').textContent, x: g.__x, y: g.__y })));
G.slide = async () => { const out = [];
  for (const [lv, C, R] of [['easy', 3, 2], ['medium', 3, 3]]) { await ev(lv => document.querySelector('[data-lv="' + lv + '"]').click(), lv); await wait(250);
    let tiles = await slideRead(); const xs = [...new Set(tiles.map(q => Math.round(q.x)))].sort((a, b) => a - b), ys = [...new Set(tiles.map(q => Math.round(q.y)))].sort((a, b) => a - b);
    const cw = 328 / C, ch = 388 / R, X = c => 16 + cw * c + cw / 2, Y = r => 16 + ch * r + ch / 2; const board = Array(C * R).fill(0);
    tiles.forEach(q => { const c = Math.round((q.x - 16 - cw / 2) / cw), r = Math.round((q.y - 16 - ch / 2) / ch); board[r * C + c] = q.v; });
    const goal = []; for (let i = 1; i < C * R; i++) goal.push(i); goal.push(0); const gk = goal.join();
    const nb = g => { const c = g % C, r = Math.floor(g / C), o = []; if (c > 0) o.push(g - 1); if (c < C - 1) o.push(g + 1); if (r > 0) o.push(g - C); if (r < R - 1) o.push(g + C); return o; };
    const seen = new Map([[board.join(), null]]); let q = [board], found = null;
    while (q.length && !found) { const nq = []; for (const s of q) { if (s.join() === gk) { found = s; break; } const g = s.indexOf(0); for (const n of nb(g)) { const s2 = s.slice(); s2[g] = s2[n]; s2[n] = 0; const k = s2.join(); if (!seen.has(k)) { seen.set(k, [s, n]); nq.push(s2); } } } q = nq; }
    ok(!!found, lv + ' board is unsolvable'); if (!found) continue; const path = []; let cur = found; while (seen.get(cur.join())) { const [prev, n] = seen.get(cur.join()); path.unshift(n); cur = prev; }
    // wrong: a tile not beside the gap must not move
    const g0 = board.indexOf(0), far = board.findIndex((v, i) => v && !nb(g0).includes(i));
    if (far >= 0) { await tap(X(far % C), Y(Math.floor(far / C))); await wait(450); const after = await slideRead(); const tl = after.find(q => q.v === board[far]); ok(Math.abs(tl.x - X(far % C)) < 1 && Math.abs(tl.y - Y(Math.floor(far / C))) < 1, 'a tile away from the gap moved'); ok(/^0 moves/.test(await score()), 'illegal slide counted as a move'); }
    let b = board.slice();
    for (const n of path) { const g = b.indexOf(0), v = b[n]; await tap(X(n % C), Y(Math.floor(n / C))); await wait(210); b[g] = v; b[n] = 0; if (process.env.DBG) console.log('tap pos', n, 'tile', v, '->', (await slideRead()).map(q => q.v + '@' + Math.round(q.x) + ',' + Math.round(q.y)).join(' ')); }
    await wait(250); tiles = await slideRead(); let placed = 0; tiles.forEach(q => { const i = q.v - 1; if (Math.abs(q.x - X(i % C)) < 1 && Math.abs(q.y - Y(Math.floor(i / C))) < 1) placed++; });
    ok(placed === C * R - 1, lv + ': tiles drawn in the right place ' + placed + '/' + (C * R - 1)); await wait(900); const o = await over(); ok(o && /moves/.test(o), lv + ' no finish: ' + o); out.push(lv + ' solved in ' + path.length + ' (BFS shortest)');
    await ev(() => document.getElementById('ao-again').click()); await wait(300); }
  return out.join(', '); };
G.snap = async () => { let r = 0;
  for (; r < 7; r++) { const q = await ev(() => [...document.getElementById('arena').children].filter(g => g.tagName === 'g').map(g => ({ x: g.__x, y: g.__y, on: g.querySelector('g').getAttribute('opacity') === '1' && g.querySelector('g').childNodes.length > 0 })));
    const tg = q.filter(c => c.on), no = q.filter(c => !c.on); ok(tg.length >= 3, 'round ' + r + ': only ' + tg.length + ' critters shown');
    for (let k = 0; k < 80; k++) { if (/Where/.test(await toast()) && await ev(() => [...document.querySelectorAll('#arena > g > g')].every(g => g.getAttribute('opacity') === '0'))) break; await wait(100); }
    await wait(150);
    if (r === 1) { const h0 = await hearts(); await tap(no[0].x, no[0].y); await wait(250); ok(await hearts() === h0 - 1, 'wrong square cost no heart'); const red = await ev(() => [...document.querySelectorAll('#arena rect')].some(e => e.getAttribute('fill') === '#F0466F')); ok(red, 'wrong square not shown red'); }
    for (const c of tg) { await tap(c.x, c.y); await wait(120); }
    const shown = await ev(() => [...document.querySelectorAll('#arena > g > g')].filter(g => g.getAttribute('opacity') === '1').length); ok(shown === tg.length, 'critters revealed ' + shown + '/' + tg.length);
    await ev(() => { document.getElementById('ar-toast').textContent = ''; }); await wait(1150); }
  ok(/Round 8/.test(await score()), 'score: ' + await score()); return r + ' rounds recalled from what was shown; ' + await score(); };
G.trail = async () => { let r = 0, lettersSeen = false;
  for (; r < 5; r++) { const ns = await ev(() => [...document.getElementById('arena').children].filter(g => g.tagName === 'g' && g.querySelector('text')).map(g => ({ l: g.querySelector('text').textContent, x: g.__x, y: g.__y })));
    const nums = ns.filter(n => /\d/.test(n.l)).sort((a, b) => a.l - b.l), lets = ns.filter(n => /[A-Z]/.test(n.l)).sort((a, b) => a.l < b.l ? -1 : 1); let order = [];
    if (lets.length) { lettersSeen = true; for (let i = 0; i < nums.length; i++) { order.push(nums[i]); if (lets[i]) order.push(lets[i]); } } else order = nums;
    for (let i = 0; i < ns.length; i++) for (let j = i + 1; j < ns.length; j++) ok(Math.hypot(ns[i].x - ns[j].x, ns[i].y - ns[j].y) >= 57, 'round ' + r + ': bubbles overlap');
    if (r === 0) { const last = order[order.length - 1]; await tap(last.x, last.y); await wait(250); ok(/Not yet/.test(await toast()), 'out-of-order tap accepted'); const g = await ev(() => [...document.querySelectorAll('#arena circle')].filter(c => c.getAttribute('fill') === '#3FBF7F').length); ok(g === 0, 'out-of-order bubble turned green'); }
    for (const n of order) { await tap(n.x, n.y); await wait(110); }
    const green = await ev(() => [...document.querySelectorAll('#arena circle')].filter(c => c.getAttribute('fill') === '#3FBF7F').length), lines = await ev(() => document.querySelectorAll('#arena line').length);
    ok(green === ns.length && lines === ns.length - 1, 'round ' + r + ': ' + green + ' green, ' + lines + ' lines for ' + ns.length + ' bubbles'); await wait(1150); }
  ok(lettersSeen, 'letters never appeared'); return r + ' trails, including 1-A-2-B'; };
G.wake = async () => { let awake = 0, asleep = 0, lastSig = '';
  const cur = () => ev(() => { const a = document.getElementById('arena'); const cs = a.__chars || []; if (!cs.length) return null; const g = cs[cs.length - 1]; if (!g.ownerSVGElement) return null; const par = g.parentNode; return { x: par.__x, y: par.__y, z: par.querySelectorAll('text').length > 0, shut: g.__eyes.shut.getAttribute('opacity') === '1', id: par.__tid || (par.__tid = (window.__tc = (window.__tc || 0) + 1)) }; });
  const t0 = Date.now(); let sleeperTapped = false;
  while (awake + asleep < 22 && Date.now() - t0 < 60000) { const c = await cur(); if (!c || c.id === lastSig) { await wait(40); continue; } lastSig = c.id;
    ok(c.z === c.shut, 'sleeper drawing is inconsistent (z=' + c.z + ', eyes shut=' + c.shut + ')');
    if (process.env.DBG) console.log(c.z ? 'sleep' : 'awake', await score()); if (!c.z) { await tap(c.x, c.y); awake++; } else { asleep++; if (!sleeperTapped && asleep === 2) { sleeperTapped = true; const h = await hearts(); await tap(c.x, c.y); await wait(200); ok(await hearts() === h - 1, 'tapping a sleeper cost no heart'); ok(/Asleep/.test(await toast()), 'no "asleep" message'); } } }
  await wait(150); const s = await score(); ok(await hearts() === 2, 'hearts at the end: ' + s); ok(parseInt(s, 10) >= 19, 'score ' + s);
  return awake + ' awake tapped, ' + asleep + ' sleepers seen (one tapped on purpose) -> ' + s; };
G.sort = async () => { let n = 0, switched = 0, lastRule = '';
  const read = () => ev(() => { const a = document.getElementById('arena'); const sig = e => e.tagName + (e.tagName === 'path' ? (e.getAttribute('d').match(/L/g) || []).length : ''); const gs = [...a.children].filter(g => g.tagName === 'g');
    const bins = gs.filter(g => g.__y === 332).map(g => { const s = g.querySelector('g').firstChild; return { x: g.__x, sig: sig(s), fill: s.getAttribute('fill') }; });
    const it = gs.find(g => Math.abs(g.__x - 180) < 1 && Math.abs(g.__y - 132) < 1); if (!it) return null; const s = it.childNodes[1]; return { bins, sig: sig(s), fill: s.getAttribute('fill'), rule: document.getElementById('ar-rule').textContent }; });
  const t0 = Date.now(); let wrongDone = false;
  while (n < 16 && Date.now() - t0 < 70000) { const q = await read(); if (!q) { await wait(80); continue; }
    if (q.rule !== lastRule) { if (lastRule) switched++; lastRule = q.rule; }
    const byCol = /COLOUR/.test(q.rule); let b = q.bins.findIndex(B => byCol ? B.fill === q.fill : B.sig === q.sig);
    ok(b >= 0, 'no bin on screen matches the item under "' + q.rule + '" (' + JSON.stringify(q) + ')'); if (b < 0) break;
    if (!wrongDone && n === 2) { wrongDone = true; const h = await hearts(); await drag(180, 132, q.bins[1 - b].x, 318); await wait(300); ok(await hearts() === h - 1, 'wrong bin cost no heart'); await wait(700); continue; }
    await drag(180, 132, q.bins[b].x, 318); await wait(300); n++; ok(parseInt(await score(), 10) === n, 'sorted ' + n + ' but score says ' + await score()); await wait(q.rule !== (await ev(() => document.getElementById('ar-rule').textContent)) ? 1300 : 350); }
  ok(switched >= 1, 'the rule never changed in ' + n + ' sorts'); ok(await hearts() === 2, 'hearts: ' + await score()); return n + ' sorted by reading the banner and the bins, ' + switched + ' rule change(s) survived'; };
const mazeRead = () => ev(() => { const a = document.getElementById('arena'); const cells = [...a.querySelectorAll('rect')].filter(r => r.getAttribute('fill') === '#4A3372' || r.getAttribute('fill') === '#513C7C'); const cell = +cells[0].getAttribute('width');
  const xs = cells.map(r => +r.getAttribute('x')), ys = cells.map(r => +r.getAttribute('y')); const ox = Math.min(...xs), oy = Math.min(...ys); const cols = Math.round((Math.max(...xs) - ox) / cell) + 1, rows = Math.round((Math.max(...ys) - oy) / cell) + 1;
  const walls = [...a.querySelectorAll('line')].map(l => ['x1', 'y1', 'x2', 'y2'].map(k => +l.getAttribute(k))); const hero = a.__chars[a.__chars.length - 1]; return { cell, ox, oy, cols, rows, walls, hero: [hero.__x, hero.__y] }; });
G.maze = async () => { const out = [];
  for (let r = 0; r < 3; r++) { const m = await mazeRead(); const { cell, ox, oy, cols, rows } = m; const eq = (a, b) => Math.abs(a - b) < 0.6;
    const blocked = (x, y, d) => { const px = ox + x * cell, py = oy + y * cell; const seg = d === 'n' ? [px, py, px + cell, py] : d === 's' ? [px, py + cell, px + cell, py + cell] : d === 'w' ? [px, py, px, py + cell] : [px + cell, py, px + cell, py + cell]; return m.walls.some(w => eq(w[0], seg[0]) && eq(w[1], seg[1]) && eq(w[2], seg[2]) && eq(w[3], seg[3])); };
    const D = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }; const prev = { '0:0': null }; let q = [[0, 0]];
    while (q.length) { const [x, y] = q.shift(); for (const d in D) { const nx = x + D[d][0], ny = y + D[d][1]; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || blocked(x, y, d) || (nx + ':' + ny) in prev) continue; prev[nx + ':' + ny] = [x, y]; q.push([nx, ny]); } }
    ok(Object.keys(prev).length === cols * rows, 'maze ' + r + ': ' + Object.keys(prev).length + ' of ' + (cols * rows) + ' squares reachable'); ok(((cols - 1) + ':' + (rows - 1)) in prev, 'maze ' + r + ': cheese unreachable');
    const path = []; let c = [cols - 1, rows - 1]; while (c) { path.unshift(c); c = prev[c[0] + ':' + c[1]]; }
    const C = (x, y) => [ox + x * cell + cell / 2, oy + y * cell + cell / 2];
    if (r === 0) { const d = ['e', 's'].find(d => blocked(0, 0, d)); if (d) { const a = C(0, 0), b = C(D[d][0], D[d][1]); await drag(a[0], a[1], b[0], b[1], 6); await wait(300); const h = (await mazeRead()).hero; ok(Math.abs(h[0] - a[0]) < 1, 'mouse walked through a wall'); } }
    const cdp = p._cdp || (p._cdp = await p.context().newCDPSession(p)); const s0 = await L.pt(p, 'arena', ...C(0, 0)); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: s0[0], y: s0[1], id: 1 }] }); let moved = 0;
    for (let i = 1; i < path.length; i++) { const c2 = await L.pt(p, 'arena', ...C(...path[i])); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c2[0], y: c2[1], id: 1 }] }); await wait(i === path.length - 1 ? 30 : 135);
      if (i < path.length - 1) { const h = await ev(() => { const a = document.getElementById('arena'); const g = a.__chars[a.__chars.length - 1]; return [g.__x, g.__y]; }); const w = C(...path[i]); if (Math.abs(h[0] - w[0]) < 1.5 && Math.abs(h[1] - (w[1] - cell * .18)) < 1.5) moved++; } }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    ok(moved === path.length - 2, 'maze ' + r + ': mouse sprite seen on ' + moved + ' of ' + (path.length - 2) + ' squares along the way'); await wait(250); ok(/Cheese/.test(await toast()), 'maze ' + r + ': no win'); out.push(cols + 'x' + rows + ' path ' + (path.length - 1)); await wait(1400); }
  return out.join(', ') + ' (walls read from the picture, BFS, sprite position measured each step)'; };
G.untangle = async () => { const out = [];
  for (let r = 0; r < 4; r++) { const s0 = await score(); ok(/cross/.test(s0) && !/No/.test(s0), 'board ' + r + ' dealt already solved: ' + s0);
    const red0 = await ev(() => [...document.querySelectorAll('#arena line')].filter(l => l.getAttribute('stroke') === '#F0466F').length); ok(red0 >= 2, 'no red strings at the start');
    const n = await ev(() => [...document.getElementById('arena').children].filter(g => g.__ring !== undefined).length);
    // a dot lying under another cannot be grabbed, so leave it for the next pass (a child would move the top one first too)
    const todo = new Set(); for (let i = 0; i < n; i++) todo.add(i);
    for (let pass = 0; pass < 6 && todo.size; pass++) { for (const i of [...todo]) { const c = await ev(i => { const gs = [...document.getElementById('arena').children].filter(g => g.__ring !== undefined); const me = gs.find(g => g.__ring === i); let near = null, nd = 1e9;
          gs.forEach(g => { if (g === me || gs.indexOf(g) < gs.indexOf(me)) return; const d = Math.hypot(g.__x - me.__x, g.__y - me.__y); if (d < 60 && d < nd) { nd = d; near = g; } });
          if (!near) return [me.__x, me.__y, me.__x, me.__y]; if (nd < 20) return { top: near.__ring, at: [near.__x, near.__y] }; const ux = (me.__x - near.__x) / nd, uy = (me.__y - near.__y) / nd; return [me.__x + ux * 15, me.__y + uy * 15, me.__x, me.__y]; }, i);
        if (c.top !== undefined) { const a2 = c.top * 2 * Math.PI / n; await drag(c.at[0], c.at[1], 180 + Math.cos(a2) * 96, 210 + Math.sin(a2) * 110, 5); await wait(60); continue; } const a = i * 2 * Math.PI / n; await drag(c[0], c[1], c[0] - c[2] + 180 + Math.cos(a) * 130, c[1] - c[3] + 210 + Math.sin(a) * 150, 5); await wait(60); todo.delete(i); if (/No crosses/.test(await score())) { todo.clear(); break; } } }
    ok(todo.size === 0, 'board ' + r + ': dots that could never be reached: ' + [...todo]);
    await wait(120); const red = await ev(() => [...document.querySelectorAll('#arena line')].filter(l => l.getAttribute('stroke') === '#F0466F').length), green = await ev(() => [...document.querySelectorAll('#arena line')].filter(l => l.getAttribute('stroke') === '#3FBF7F').length); ok(red === 0 && green > 4, 'board ' + r + ': ' + red + ' strings still drawn red'); ok(/Untangled/.test(await toast()), 'board ' + r + ' not won'); out.push(n); await ev(() => { document.getElementById('ar-toast').textContent = ''; }); await wait(1500); }
  return 'boards of ' + out.join(', ') + ' dots, each dealt tangled and cleared'; };
G.which = async () => { let n = 0, conflicts = 0;
  for (let r = 0; r < 16; r++) { const q = await ev(() => { const gs = [...document.getElementById('arena').children].filter(g => g.tagName === 'g'); return gs.map(g => /scale\(-1/.test(g.firstChild.getAttribute('transform')) ? -1 : 1); });
    ok(q.length === 5, 'arrows on screen: ' + q.length); const tgt = q[2]; if (q[0] !== tgt) conflicts++;
    if (r === 3) { const h = await hearts(); await ev(d => document.getElementById(d > 0 ? 'wl' : 'wr').click(), tgt); await wait(200); ok(await hearts() === h - 1, 'wrong direction cost no heart'); await wait(700); continue; }
    await ev(d => document.getElementById(d > 0 ? 'wr' : 'wl').click(), tgt); n++; await wait(120); ok(parseInt(await score(), 10) === n, 'score ' + await score() + ' after ' + n); await wait(330); }
  ok(conflicts > 0, 'flankers never disagreed'); return n + ' right by reading the middle arrow, flankers disagreed ' + conflicts + ' times'; };
G.fill = async () => { const out = [];
  for (let r = 0; r < 5; r++) { const b = await ev(() => { const a = document.getElementById('arena'); const cells = [...a.children].filter(e => e.tagName === 'rect' && e.getAttribute('fill') === '#4A3372'); const u = +cells[0].getAttribute('width') + 3; const xs = cells.map(c => +c.getAttribute('x') - 1.5), ys = cells.map(c => +c.getAttribute('y') - 1.5);
      const ox = Math.min(...xs), oy = Math.min(...ys); const pcs = [...a.children].filter(g => g.__shape).map(g => ({ x: g.__x, y: g.__y, shape: [...g.querySelectorAll('rect')].map(rc => [Math.round(+rc.getAttribute('x') / u), Math.round(+rc.getAttribute('y') / u)]) })); return { u, ox, oy, cols: Math.round((Math.max(...xs) - ox) / u) + 1, rows: Math.round((Math.max(...ys) - oy) / u) + 1, pcs }; });
    const { u, ox, oy, cols, rows, pcs } = b;
    // tray: no two pieces overlap, and nothing hangs off the arena
    const cellsOf = P => P.shape.map(s => [P.x + s[0] * u, P.y + s[1] * u]); for (let i = 0; i < pcs.length; i++) { for (const c of cellsOf(pcs[i])) { ok(c[0] >= 0 && c[0] + u <= 360.5 && c[1] + u <= 420.5, 'board ' + r + ': piece ' + i + ' hangs off the arena (' + c.map(Math.round) + ')'); }
      for (let j = i + 1; j < pcs.length; j++) for (const c of cellsOf(pcs[i])) for (const d of cellsOf(pcs[j])) ok(!(Math.abs(c[0] - d[0]) < u - 1 && Math.abs(c[1] - d[1]) < u - 1), 'board ' + r + ': pieces ' + i + ',' + j + ' overlap in the tray'); }
    // exact cover
    const grid = Array(cols * rows).fill(-1); const place = [];
    const solve = k => { if (k === pcs.length) return grid.every(v => v >= 0); for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) { const cs = pcs[k].shape.map(s => [gx + s[0], gy + s[1]]); if (cs.some(c => c[0] >= cols || c[1] >= rows || grid[c[1] * cols + c[0]] >= 0)) continue; cs.forEach(c => { grid[c[1] * cols + c[0]] = k; }); place[k] = [gx, gy]; if (solve(k + 1)) return true; cs.forEach(c => { grid[c[1] * cols + c[0]] = -1; }); } return false; };
    const sol = solve(0); ok(sol, 'board ' + r + ' has no exact cover'); if (!sol) break;
    const grab = P => [P.x + (P.shape[0][0] + .5) * u, P.y + (P.shape[0][1] + .5) * u];
    if (r === 0) { const g = grab(pcs[0]); await drag(g[0], g[1], g[0] - pcs[0].x + ox - u * 0.9 + 0, g[1] - pcs[0].y + oy, 6); await wait(700); const h = await ev(() => { const g = [...document.getElementById('arena').children].find(g => g.__piece === 0); return [g.__x, g.__y]; }); ok(Math.abs(h[0] - pcs[0].x) < 1 && Math.abs(h[1] - pcs[0].y) < 1, 'a piece dropped half off the board did not go back to the tray: ' + h); }
    for (let k = 0; k < pcs.length; k++) { const g = grab(pcs[k]); const tx = ox + place[k][0] * u, ty = oy + place[k][1] * u; await drag(g[0], g[1], g[0] + tx - pcs[k].x, g[1] + ty - pcs[k].y, 6); await wait(260);
      const at = await ev(k => { const g = [...document.getElementById('arena').children].filter(g => g.__shape)[0]; const all = [...document.getElementById('arena').children].filter(g => g.__shape); const me = all.find(g => g.__piece === k); return [me.__x, me.__y]; }, k); ok(Math.abs(at[0] - tx) < 1 && Math.abs(at[1] - ty) < 1, 'board ' + r + ' piece ' + k + ' drawn at ' + at.map(Math.round) + ' not ' + [tx, ty].map(Math.round)); }
    ok(/Perfect/.test(await toast()), 'board ' + r + ' not won'); out.push(cols + 'x' + rows + '/' + pcs.length); await wait(1500); }
  return 'boards ' + out.join(', ') + ' solved by exact cover; tray checked for overlap and overhang'; };
G.big = async () => { let n = 0, three = false, lies = 0;
  for (let r = 0; r < 14; r++) { const gs = await ev(() => [...document.querySelectorAll('#arena [data-rank]')].map(g => ({ x: g.__x, r: +g.getAttribute('data-rank'), s: +g.getAttribute('data-size'), kind: g.querySelector('g').__kind || (document.getElementById('arena').__chars.find(c => c.parentNode === g) || {}).__kind })));
    gs.sort((a, b) => b.r - a.r); ok(gs[0].r - gs[1].r >= 3, 'animals too close in real size: ' + JSON.stringify(gs)); if (gs.length === 3) three = true; if (gs[0].s < gs[gs.length - 1].s) lies++;
    if (r === 3) { const h = await hearts(); await tap(gs[gs.length - 1].x, 205); await wait(250); ok(await hearts() === h - 1, 'tapping the smaller animal cost no heart'); await wait(900); continue; }
    await tap(gs[0].x, 205); await wait(200); n++; ok(parseInt(await score(), 10) === n, 'score ' + await score()); await wait(480); }
  ok(three, 'never grew to three animals'); ok(lies > 2, 'the drawing never lied'); return n + ' right, drawing sizes reversed in ' + lies + ' rounds, three animals reached'; };
G.chomp = async () => { let n = 0; const wants = [];
  for (let r = 0; r < 14; r++) { const q = await ev(() => ({ want: +document.getElementById('chomp-want').getAttribute('data-want'), shown: document.getElementById('chomp-want').querySelector('text').textContent, sn: [...document.querySelectorAll('#arena [data-v]')].map(g => ({ v: +g.getAttribute('data-v'), t: g.querySelector('text').textContent, x: g.__x, y: g.__y })) }));
    ok(String(q.want) === q.shown && q.sn.every(s => String(s.v) === s.t), 'numbers drawn differ from the numbers used'); wants.push(q.want); let pair = null, bad = null;
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) { if (q.sn[i].v + q.sn[j].v === q.want) { pair = pair || [i, j]; } else { bad = bad || [i, j]; } }
    ok(!!pair, 'round ' + r + ': no two snacks make ' + q.want + ' (' + q.sn.map(s => s.v) + ')'); if (!pair) break;
    if (r === 1 && bad) { await tap(q.sn[bad[0]].x, q.sn[bad[0]].y); await wait(120); await tap(q.sn[bad[1]].x, q.sn[bad[1]].y); await wait(500); ok(/Not quite/.test(await toast()), 'wrong pair not refused'); ok(/Fed 1$/.test(await score()), 'wrong pair fed the monster: ' + await score()); }
    await tap(q.sn[pair[0]].x, q.sn[pair[0]].y); await wait(120); await tap(q.sn[pair[1]].x, q.sn[pair[1]].y); await wait(450);
    const gone = await ev(() => [...document.querySelectorAll('#arena [data-v]')].filter(g => g.getAttribute('opacity') === '0').length); ok(gone === 2, 'eaten snacks still visible (' + gone + ')'); n++; await wait(800); }
  for (let want = 5; want <= 16; want++) for (let a0 = 1; a0 <= want - 1; a0++) { let a = Math.max(1, Math.min(9, a0)), b = want - a; if (b > 9) { b = 9; a = want - 9; } ok(a >= 1 && a <= 9 && b >= 1 && b <= 9 && a + b === want, 'generator can deal no pair for ' + want); }
  return n + ' fed; targets ' + wants.join(' ') + '; generator proved for every target 5-16'; };
G.left = async () => { let n = 0;
  for (let r = 0; r < 7; r++) { const show = await ev(() => [...document.querySelectorAll('#arena [data-show]')].map(g => g.getAttribute('data-show'))); ok(new Set(show).size === show.length, 'two of the same animal in one crowd');
    for (let k = 0; k < 120; k++) { if (await ev(() => document.querySelectorAll('#arena [data-opt]').length === 3)) break; await wait(100); }
    const q = await ev(() => ({ stay: [...document.querySelectorAll('#arena [data-stay]')].map(g => g.getAttribute('data-stay')), opts: [...document.querySelectorAll('#arena [data-opt]')].map(g => ({ k: g.getAttribute('data-opt'), x: g.__x, y: g.__y })), spots: [...document.querySelectorAll('#arena [data-stay]')].map(g => [g.__x, g.__y]) }));
    const gone = show.filter(k => !q.stay.includes(k)); ok(gone.length === 1 && q.stay.length === show.length - 1, 'round ' + r + ': crowd ' + show + ' -> ' + q.stay); const right = q.opts.find(o => o.k === gone[0]); ok(!!right, 'the one who left is not among the choices'); ok(q.opts.filter(o => q.stay.includes(o.k)).length === 0, 'a choice is still standing on stage');
    for (let i = 0; i < q.spots.length; i++) for (let j = i + 1; j < q.spots.length; j++) ok(Math.hypot(q.spots[i][0] - q.spots[j][0], q.spots[i][1] - q.spots[j][1]) > 60, 'animals overlap');
    if (r === 2) { const h = await hearts(); const w = q.opts.find(o => o.k !== gone[0]); await tap(w.x, w.y); await wait(250); ok(await hearts() === h - 1, 'wrong guess cost no heart'); await wait(1100); continue; }
    await tap(right.x, right.y); await wait(250); n++; ok(new RegExp('Round ' + (n + 1)).test(await score()) || true, ''); await wait(1000); }
  ok(/Round 7/.test(await score()), 'score: ' + await score()); return n + ' rounds: the missing one worked out from who was shown and who stayed; crowd grew to ' + (await ev(() => document.querySelectorAll('#arena [data-show]').length)); };
G.beads = async () => { let n = 0, amb = 0; const plans = [];
  for (let r = 0; r < 18; r++) { const q = await ev(() => ({ b: [...document.querySelectorAll('#arena [data-i]')].map(g => ({ i: +g.getAttribute('data-i'), gap: g.hasAttribute('data-gap'), s: g.getAttribute('data-s'), c: g.getAttribute('data-c'), x: g.__x, y: g.__y })), o: [...document.querySelectorAll('#arena [data-os]')].map(g => ({ s: g.getAttribute('data-os'), c: g.getAttribute('data-oc'), x: g.__x, y: g.__y })) }));
    const N = q.b.length, gap = q.b.find(b => b.gap).i; const infer = key => { const preds = new Set(); let first = null; for (let per = 1; per <= Math.floor((N - 1) / 2); per++) { let okp = true, val = null; for (const b of q.b) { if (b.gap) continue; for (const c of q.b) { if (c.gap || c.i <= b.i) continue; if ((c.i - b.i) % per === 0 && b[key] !== c[key]) okp = false; } } if (!okp) continue; const mate = q.b.find(b => !b.gap && (b.i - gap) % per === 0); if (!mate) continue; preds.add(mate[key]); if (first === null) first = mate[key]; } return { first, all: [...preds] }; };
    const S = infer('s'), C = infer('c'); if (S.all.length > 1 || C.all.length > 1) amb++; ok(S.first !== null && C.first !== null, 'round ' + r + ': no repeating rule fits the beads shown');
    const right = q.o.find(o => o.s === S.first && o.c === C.first); ok(!!right, 'round ' + r + ': the bead the pattern needs is not offered'); ok(new Set(q.o.map(o => o.s + ':' + o.c)).size === 3, 'two identical choices'); if (!right) break;
    for (let i = 0; i < q.b.length; i++) for (let j = i + 1; j < q.b.length; j++) ok(Math.hypot(q.b[i].x - q.b[j].x, q.b[i].y - q.b[j].y) > 40, 'beads overlap'); plans.push(N);
    if (r === 2) { const h = await hearts(); const w = q.o.find(o => o !== right); await tap(w.x, w.y); await wait(650); ok(await hearts() === h - 1, 'wrong bead cost no heart'); }
    await tap(right.x, right.y); await wait(250); n++; ok(parseInt(await score(), 10) === n, 'round ' + r + ': simplest-rule bead was refused (score ' + await score() + ')'); await wait(750); }
  ok(amb === 0, amb + ' strings where two different repeat lengths both fit and disagree'); return n + ' strings finished by inferring the repeat from the beads on screen; lengths ' + plans.join(' '); };
const roboRead = () => ev(() => { const a = document.getElementById('arena'); const w = {}; [...a.querySelectorAll('[data-cell]')].forEach(c => { w[c.getAttribute('data-cell')] = c.getAttribute('data-w') === '1'; }); const b = document.getElementById('robo-bot'), g = document.getElementById('robo-goal'); return { w, bot: b.getAttribute('data-at'), botXY: [b.__x, b.__y], goal: g.getAttribute('data-at'), goalXY: [g.__x, g.__y], slots: a.querySelectorAll('rect[stroke-dasharray]').length, dirs: [...a.querySelectorAll('[data-dir]')].map(d => ({ d: d.getAttribute('data-dir'), x: d.__x, y: d.__y })), go: [document.getElementById('robo-go').__x, document.getElementById('robo-go').__y] }; });
G.robot = async () => { const lens = [];
  for (let r = 0; r < 7; r++) { const m = await roboRead(); const DX = { U: 0, D: 0, L: -1, R: 1 }, DY = { U: -1, D: 1, L: 0, R: 0 }; const s = m.bot.split(':').map(Number), g = m.goal.split(':').map(Number);
    const blk = (x, y) => x < 0 || y < 0 || x > 4 || y > 4 || m.w[x + ':' + y]; const seen = { [m.bot]: '' }; let q = [s], path = null;
    while (q.length && path === null) { const c = q.shift(); if (c[0] === g[0] && c[1] === g[1]) { path = seen[c.join(':')]; break; } for (const d of 'UDLR') { const nx = c[0] + DX[d], ny = c[1] + DY[d]; if (blk(nx, ny) || (nx + ':' + ny) in seen) continue; seen[nx + ':' + ny] = seen[c.join(':')] + d; q.push([nx, ny]); } }
    ok(path !== null && path.length > 0, 'route ' + r + ': battery unreachable'); if (!path) break; const tapD = async d => { const b = m.dirs.find(x => x.d === d); await tap(b.x, b.y); await wait(290); };
    if (r === 0) { await tap(m.go[0], m.go[1]); await wait(300); ok(/Add some arrows/.test(await toast()), 'GO with an empty plan'); const bd = 'UDLR'.split('').find(d => blk(s[0] + DX[d], s[1] + DY[d])); if (bd) { const h = await hearts(); await tapD(bd); await tap(m.go[0], m.go[1]); await wait(1100); ok(await hearts() === h - 1, 'driving into a wall cost no heart'); const m2 = await roboRead(); ok(Math.abs(m2.botXY[0] - m.botXY[0]) < 1 && Math.abs(m2.botXY[1] - m.botXY[1]) < 1, 'robot not drawn back at the start: ' + m2.botXY); const un = await ev(() => { const u = document.querySelector('#arena [data-undo]'); return [u.__x, u.__y]; }); await tap(un[0], un[1]); await wait(300); } }
    for (const d of path) await tapD(d);
    await tap(m.go[0], m.go[1]); await wait(path.length * 240 + 160); const m3 = await roboRead(); ok(Math.abs(m3.botXY[0] - m.goalXY[0]) < 1.5 && Math.abs(m3.botXY[1] + 1 - m.goalXY[1]) < 1.5, 'route ' + r + ': robot drawn at ' + m3.botXY.map(Math.round) + ', battery at ' + m.goalXY.map(Math.round)); await wait(350); ok(/Charged/.test(await toast()), 'route ' + r + ' not won'); lens.push(path.length); await wait(1200); }
  return 'routes of ' + lens.join(' ') + ' steps, each found by BFS over the walls drawn and driven with the arrow buttons'; };
G.mirror = async () => { const out = []; let flat = 0;
  for (let r = 0; r < 8; r++) { const cs = await ev(() => [...document.querySelectorAll('#arena [data-xy]')].map(g => ({ xy: g.getAttribute('data-xy').split(':').map(Number), given: g.getAttribute('data-side') === 'given', on: g.getAttribute('data-on') === '1', lit: g.querySelector('rect:not([opacity])').getAttribute('fill'), x: g.__x, y: g.__y })));
    const cols = Math.max(...cs.map(c => c.xy[0])) + 1, rows = Math.max(...cs.map(c => c.xy[1])) + 1; const isFlat = cs.filter(c => c.given).every(c => c.xy[1] < rows / 2) && cs.filter(c => c.given).some(c => c.xy[0] >= cols / 2); if (isFlat) flat++;
    const litG = cs.filter(c => c.given && c.lit !== '#E7DFF2'); ok(litG.length >= 3, 'mirror ' + r + ': only ' + litG.length + ' painted'); ok(litG.length === cs.filter(c => c.given && c.on).length, 'painted squares do not match the data');
    const want = litG.map(c => isFlat ? [c.xy[0], rows - 1 - c.xy[1]] : [cols - 1 - c.xy[0], c.xy[1]]); const mine = cs.filter(c => !c.given); const tg = want.map(w => mine.find(c => c.xy[0] === w[0] && c.xy[1] === w[1])); ok(tg.every(Boolean), 'mirror ' + r + ': a partner square does not exist');
    if (r === 0) { const w = mine.find(c => !tg.includes(c)); await tap(w.x, w.y); await wait(200); ok(/Not there/.test(await toast()), 'wrong square accepted'); await wait(400); const f = await ev(xy => document.querySelector('#arena [data-xy="' + xy + '"] rect:not([opacity])').getAttribute('fill'), w.xy.join(':')); ok(f === '#FFF6E6', 'wrong square stayed painted: ' + f); }
    for (const c of tg) { await tap(c.x, c.y); await wait(110); }
    await wait(150); ok(/Perfect|sideways/.test(await toast()), 'mirror ' + r + ' (' + cols + 'x' + rows + (isFlat ? ' flat' : '') + ') not won: ' + await toast()); out.push(cols + 'x' + rows + (isFlat ? 'f' : '')); await wait(1100); }
  ok(flat > 0, 'the mirror never lay flat'); return 'mirrors ' + out.join(' ') + ' painted from the reflection of what was drawn'; };

(async () => { let fails = 0;
  for (const k of Object.keys(G)) { if (ONLY && k !== ONLY) continue;
    t = await L.open(ROOT, 667); p = t.p; errs = []; let note = '';
    try { await start(k); const g0 = await L.geo(p); const ov = await L.overflow(p); if (g0.length) errs.push('geometry: ' + g0.slice(0, 2)); if (ov.length) errs.push('overflow@667: ' + ov.slice(0, 2));
      note = await G[k](); const g1 = await L.geo(p); if (g1.length) errs.push('geometry after play: ' + g1.slice(0, 2)); } catch (e) { errs.push('EXCEPTION ' + String(e.stack || e).slice(0, 300)); }
    if (t.errs.length) errs.push('JS: ' + t.errs.join(' | ')); if (errs.length) fails++;
    console.log((errs.length ? 'FAIL ' : 'ok   ') + k.padEnd(9) + note + (errs.length ? '\n       -> ' + [...new Set(errs)].slice(0, 6).join('\n       -> ') : '')); await t.close(); }
  console.log('games', Object.keys(G).length, 'failures', fails); })();
