// Puzzle battery: wrong path then win path for every puzzle, driven by real touch input.
const L = require('./lib.js');
const ROOT = process.argv[2] || require('path').resolve(__dirname, '..');
const ONLY = process.argv[3] || '';
const sleep = ms => new Promise(r => setTimeout(r, ms));
function bfs(start, key, moves, goal) { // generic BFS returning list of move labels
  const seen = new Set([key(start)]); const q = [[start, []]];
  while (q.length) { const [s, path] = q.shift(); if (goal(s)) return path;
    for (const [lab, nx] of moves(s)) { const k = key(nx); if (!seen.has(k)) { seen.add(k); q.push([nx, path.concat([lab])]); } } }
  return null;
}
const T = [];
const add = (k, wrong, win, o) => T.push(Object.assign({ k, wrong, win }, o || {}));
const opt3 = (y, right, wrongI, xs) => { xs = xs || [72, 180, 288]; return [async h => h.tap(xs[wrongI], y), async h => h.tap(xs[right], y)]; };
const chips = (right, wrong) => [async h => h.chip(wrong), async h => h.chip(right)];
const order = (y, a, b) => [async h => { await h.tap(a[0], y); await h.wait(120); await h.tap(a[1], y); },
  async h => { await h.tap(a[0], y); await h.wait(120); await h.tap(a[1], y); await h.wait(900); await h.tap(b[0], y); await h.wait(120); await h.tap(b[1], y); }];

// ---------------- pack 1
add('really the biggest', h => h.tap(80, 168), h => h.tap(296, 210));
add('not like the others', h => h.tap(72, 56), h => h.tap(288, 144));
add('ducks are on the pond', h => h.chip(0), async h => { const a = await h.tfAt(96, 215); await h.drag(96, 215, 96, 110); const b = await h.tfAt(96, 105);
  h.ok(a && b && Math.abs(b[1] - a[1] + 105) < 6, 'bush did not move with the drag ' + JSON.stringify([a, b])); await h.chip(3); });
add('more juice', h => h.tap(108, 150), h => h.tap(252, 170));
add('owl wants to wake', h => h.tap(258, 116), h => h.drag(300, 56, 300, 288, 14));
add('Which one is heavier', h => h.tap(78, 92), h => h.tap(282, 130));
add('Block the hole', async h => { await h.drag(238, 64, 104, 128); await h.wait(500); const t = await h.tfAt(238, 64); h.ok(t && Math.abs(t[0] - 238) < 3, 'wrong lid did not return to its place'); },
  h => h.drag(302, 156, 104, 128));
add('comes next on the belt', h => h.drag(66, 246, 304, 120), h => h.drag(180, 246, 304, 120));
add('legs are there altogether', ...chips(1, 0));
add('Turn on the lamp', h => h.tap(300, 94), async h => { await h.drag(76, 266, 262, 212); await h.wait(400); await h.tap(300, 94); });
add('Put the story in order', ...order(152, [66, 180], [180, 294]));
add('flower is very thirsty', h => h.path([[180, 60], [230, 60], [180, 60]]), async h => { const pts = [[180, 60]]; for (let r = 0; r < 4; r++) { for (let x = 180; x <= 290; x += 22) pts.push([x, 60]); for (let x = 290; x >= 70; x -= 22) pts.push([x, 60]); for (let x = 70; x <= 180; x += 22) pts.push([x, 60]); } await h.path(pts); }, { nb: 0, t: 3000 });
add('monster needs one cookie', async h => { await h.drag(96, 118, 70, 200); await h.wait(300); await h.drag(160, 118, 180, 200); },
  async h => { await h.drag(96, 118, 70, 200); await h.wait(300); await h.drag(160, 118, 180, 200); await h.wait(300); await h.drag(300, 70, 290, 200); }, { nb: 0 });
add('Catch the mouse', async h => { await h.multi([[56, 196]], 500); }, async h => { await h.multi([[56, 196], [304, 196]], 700); }, { nb: 0 });
add('Where is the ball', async h => { await h.tap(180, 150); await h.wait(300); h.ok(await h.bad() === 0, 'a tap during the shuffle was accepted'); await h.wait(5600);
    const b = await h.ev(() => { const c = [...document.querySelectorAll('#stage circle')].find(e => e.getAttribute('fill') === '#F0466F' && e.getAttribute('r') === '13'); return c.parentNode.__x; });
    h.note('ball under cup at x=' + b); await h.tap(b === 180 ? 280 : 180, 150); },
  async h => { await h.wait(5900); const b = await h.ev(() => { const c = [...document.querySelectorAll('#stage circle')].find(e => e.getAttribute('fill') === '#F0466F' && e.getAttribute('r') === '13'); return c.parentNode.__x; }); await h.tap(b, 150); }, { t: 2500 });
add('Turn off all the lights', async h => { await h.tap(86, 66); await h.wait(200); const lit = await h.ev(() => [...document.querySelectorAll('#stage circle')].filter(e => e.getAttribute('fill') === '#FFC93C').length); h.ok(lit > 0, 'no bulbs lit after a wrong tap'); },
  async h => { await h.tap(180, 66); await h.wait(350); await h.tap(180, 230); }, { nb: 0 });
add('Three stars are hiding', async h => { await h.tap(200, 120); await h.tap(96, 56); await h.wait(300); await h.tap(284, 186); },
  async h => { await h.tap(96, 56); await h.wait(300); await h.tap(284, 186); await h.wait(300); await h.tap(150, 262); }, { nb: 0 });
add('cat is stuck up the tree', h => h.tap(262, 66), async h => { await h.drag(62, 176, 226, 172); await h.wait(1300); const c = await h.ev(() => { const g = document.querySelector('#stage').__chars[0]; return [g.__x, g.__y]; }); h.ok(Math.abs(c[0] - 226) < 4 && c[1] > 190, 'cat did not come down the ladder: ' + c); }, { t: 2600 });
add('Make the seesaw balance', h => h.drag(294, 268, 236, 128), async h => { await h.drag(66, 268, 236, 128); await h.wait(450); await h.drag(180, 268, 300, 128); }, { nb: 0 });
add('How many triangles', ...chips(1, 0));
add('basket has more apples', h => h.tap(94, 208), h => h.tap(266, 208));
add('Put out the campfire', h => h.drag(84, 62, 262, 62), h => h.drag(84, 62, 180, 62), { nb: 0, t: 2500 });
add('Line them up: smallest', ...order(158, [66, 294], [180, 294]));
add('Which key opens the lock', h => h.drag(76, 226, 180, 122), h => h.drag(180, 226, 180, 122));
// ---------------- pack 2
add('Which cup fills up', h => h.tap(78, 244), h => h.tap(282, 244));
add('mirror of the pattern', h => h.tap(258, 62), h => h.tap(258, 146));
add('arrow keeps turning', h => h.tap(180, 216), h => h.tap(78, 216));
add('pairs that make 10', async h => { await h.tap(52, 208); await h.tap(116, 208); await h.wait(500); }, async h => { await h.tap(52, 208); await h.tap(180, 208); });
add('balloon is the cat holding', h => h.tap(292, 62), h => h.tap(66, 62));
add('One piece is missing', h => h.tap(268, 62), h => h.tap(268, 146));
add('Look at both scales', h => h.tap(180, 224), h => h.tap(76, 224));
add('shadow belongs to the rabbit', h => h.tap(78, 208), h => h.tap(282, 208));
// ---------------- pack 3
add('What belongs in the empty square', ...opt3(258, 1, 0));
add('Each brick is the two under', ...chips(2, 1));
add('Move the whole stack', async h => { // medium onto small must be refused, and the disc must stay put
    const P = [70, 180, 290]; await h.tap(P[0], 160); await h.tap(P[1], 160); await h.wait(350); await h.tap(P[0], 160); await h.tap(P[1], 160); await h.wait(500);
    const x = await h.ev(() => [...document.querySelectorAll('#stage rect')].find(e => e.getAttribute('fill') === '#FFC93C' && e.getAttribute('rx') === '12').parentNode.__x);
    h.ok(x === 70, 'medium disc moved onto the small one (x=' + x + ')'); },
  async h => { const P = [70, 180, 290];
    const sol = bfs([[3, 2, 1], [], []], s => JSON.stringify(s), s => { const out = []; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { if (a === b || !s[a].length) continue; const d = s[a][s[a].length - 1]; if (s[b].length && s[b][s[b].length - 1] < d) continue; const n = s.map(x => x.slice()); n[a].pop(); n[b].push(d); out.push([[a, b], n]); } return out; }, s => s[2].length === 3);
    h.note('BFS: ' + sol.length + ' moves'); h.ok(sol.length === 7, 'hanoi shortest should be 7');
    for (const [a, b] of sol) { await h.tap(P[a], 160); await h.tap(P[b], 160); await h.wait(330); }
    const xs = await h.ev(() => [...document.querySelectorAll('#stage rect')].filter(e => e.getAttribute('rx') === '12' && e.getAttribute('height') === '28').map(e => e.parentNode.__x));
    h.ok(xs.length === 3 && xs.every(x => x === 290), 'discs not all drawn on the last peg: ' + xs); });
// ferry helpers: read where a character is drawn
const chX = (h, i) => h.ev(i => { const g = document.querySelector('#stage').__chars[i]; return Math.round(g.__x); }, i);
const cross = async (h, loads, boatX) => { for (const [x, y] of loads) { await h.tap(x, y); await h.wait(330); } await h.tap(boatX, 240); await h.wait(1350); };
add('The boat holds two', async h => { await cross(h, [[46, 66]], 136); await h.wait(900); h.ok(await chX(h, 0) === 46, 'fox was not sent back after an unsafe crossing'); },
  async h => { await cross(h, [[46, 66], [46, 232]], 136); h.ok(await chX(h, 0) === 314, 'fox not drawn on far bank'); await cross(h, [], 224); await cross(h, [[46, 150]], 136); }, { t: 2500 });
add('Only Dad can row', async h => { await h.tap(136, 240); await h.wait(300); await h.tap(46, 120); await h.wait(330); await h.tap(136, 240); await h.wait(900);
    h.ok(await chX(h, 1) !== 314, 'a child crossed without Dad'); h.ok(await h.bad() >= 2, 'boat without a rower was not refused twice'); },
  async h => { for (const y of [120, 182, 244]) { await cross(h, [[46, 52], [46, y]], 136); if (y !== 244) { await cross(h, [[314, 52]], 224); } } }, { t: 2500 });
add('The boat holds one', async h => { await cross(h, [[46, 66]], 136); await h.wait(900); h.ok(await chX(h, 0) === 46, 'no reset after unsafe crossing'); },
  async h => { // BFS the real river puzzle, then play the answer
    const unsafe = (s, boat) => { const away = ['f', 'h', 'c'].filter(k => s[k] !== boat); return away.includes('h') && (away.includes('f') || away.includes('c')); };
    const sol = bfs({ f: 0, h: 0, c: 0, b: 0 }, s => JSON.stringify(s), s => { const out = []; for (const k of [null, 'f', 'h', 'c']) { if (k && s[k] !== s.b) continue; const n = Object.assign({}, s); n.b = 1 - s.b; if (k) n[k] = n.b; if (unsafe(n, n.b)) continue; out.push([k, n]); } return out; }, s => s.f && s.h && s.c);
    h.note('BFS: ' + sol.length + ' crossings: ' + sol.map(x => x || '-').join(' ')); h.ok(sol.length === 7, 'river should take 7');
    const Y = { f: 66, h: 150, c: 232 }; let b = 0; const side = { f: 0, h: 0, c: 0 };
    for (const k of sol) { await cross(h, k ? [[side[k] ? 314 : 46, Y[k]]] : [], b ? 224 : 136); b = 1 - b; if (k) side[k] = b; } }, { t: 2500 });
const JB = { F5: [50, 244], E5: [136, 244], F3: [224, 244], E3: [310, 244], P53: [180, 96], P35: [180, 152] };
const jug = target => [async h => { await h.tap(...(target === 3 ? JB.F5 : JB.F3)); await h.wait(300); await h.tap(...JB.E3); },
  async h => { const sol = bfs([0, 0], s => s.join(), s => { const [a, b] = s; const o = [['F5', [5, b]], ['E5', [0, b]], ['F3', [a, 3]], ['E3', [a, 0]]]; let c = Math.min(a, 3 - b); o.push(['P53', [a - c, b + c]]); c = Math.min(b, 5 - a); o.push(['P35', [a + c, b - c]]); return o; }, s => s[0] === target || s[1] === target);
    h.note('BFS: ' + sol.join(' ')); let st = [0, 0];
    for (const m of sol) { await h.tap(...JB[m]); await h.wait(320); }
    const lab = await h.ev(() => [...document.querySelectorAll('#stage text')].filter(t => t.getAttribute('font-size') === '21').map(t => t.textContent));
    h.ok(lab.includes(String(target)), 'jug labels on screen ' + lab + ' do not show ' + target); }];
add('Measure exactly 2 cups', ...jug(2), { nb: 0 });
add('Measure exactly 1 cup', ...jug(1), { nb: 0 });
add('Measure exactly 4 cups', ...jug(4), { nb: 0 });
add('folds up into this box', h => h.tap(68, 200), h => h.tap(180, 200));
add('blocks are in this stack', ...chips(1, 0));
add('first gear turns this way', ...opt3(236, 1, 0));
add('needs all four shapes', async h => { await h.tap(206, 34); await h.wait(300); await h.tap(258, 138); await h.wait(300); await h.tap(154, 86); await h.wait(300); await h.tap(102, 190); },
  async h => { await h.tap(220, 266); await h.wait(300); await h.tap(206, 34); await h.wait(300); await h.tap(258, 138); await h.wait(300); await h.tap(300, 266); await h.wait(300); await h.tap(154, 86); await h.wait(300); await h.tap(102, 190); });
const SYM = [[0, 4], [1, 6], [1, 5], [2, 5], [3, 7], [3, 4], [4, 6]], sxy = (r, c) => [61 + c * 34, 70 + r * 34];
add('Make both halves match', async h => { await h.tap(...sxy(0, 7)); await h.wait(300); for (const [r, c] of SYM) { await h.tap(...sxy(r, c)); await h.wait(120); } },
  async h => { await h.tap(...sxy(0, 7)); await h.wait(300); for (const [r, c] of SYM) { await h.tap(...sxy(r, c)); await h.wait(120); } await h.wait(600); h.ok(!(await h.won()), 'won with an extra square painted'); await h.tap(...sxy(0, 7)); });
add('Who owns the cat', h => h.tap(72, 214), h => h.tap(288, 214));
add('Big circle is to small circle', ...opt3(216, 1, 0));
add('What are the next two', ...chips(0, 1));
add('shortest road', async h => { await h.tap(180, 240); await h.wait(350); await h.tap(180, 150); }, h => h.tap(180, 62));
add('How heavy is one star', ...chips(1, 3));
add('paper is folded', ...opt3(224, 1, 2));
add('One ball is heavier', ...chips(0, 1));
add('add up to 15', ...chips(0, 1));
add('Three of these follow', h => h.tap(96, 84), h => h.tap(264, 84));
add('orange block out', async h => { // the orange block must not pass through the tall blocks
    await h.drag(102, 180, 280, 180, 10); await h.wait(700); },
  async h => { // BFS a model of the board with proper sliding (no jumping), then play it
    const B0 = [[0, 2, 2, 1, 'h'], [2, 1, 1, 2, 'v'], [3, 2, 1, 2, 'v'], [2, 0, 2, 1, 'h']];
    const occ = (s, skip) => { const m = new Set(); s.forEach((b, i) => { if (i === skip) return; for (let x = 0; x < B0[i][2]; x++) for (let y = 0; y < B0[i][3]; y++) m.add((b[0] + x) + ':' + (b[1] + y)); }); return m; };
    const free = (s, i, nx, ny) => { const m = occ(s, i); for (let x = 0; x < B0[i][2]; x++) for (let y = 0; y < B0[i][3]; y++) { if (nx + x < 0 || ny + y < 0 || nx + x > 3 || ny + y > 3 || m.has((nx + x) + ':' + (ny + y))) return false; } return true; };
    const sol = bfs(B0.map(b => [b[0], b[1]]), s => JSON.stringify(s), s => { const out = []; s.forEach((b, i) => { for (const d of [-1, 1]) { let x = b[0], y = b[1]; for (;;) { if (B0[i][4] === 'h') x += d; else y += d; if (!free(s, i, x, y)) break; const n = s.map(q => q.slice()); n[i] = [x, y]; out.push([[i, x, y], n]); } } }); return out; },
      s => s[0][0] === 2 && free(s, 0, 2, 2));
    h.note('BFS: ' + (sol ? sol.length + ' slides + exit' : 'UNSOLVABLE')); h.ok(!!sol, 'sliding block unsolvable');
    const cur = B0.map(b => [b[0], b[1]]), cen = i => [46 + cur[i][0] * 56 + B0[i][2] * 28, 40 + cur[i][1] * 56 + B0[i][3] * 28];
    for (const [i, x, y] of sol) { const a = cen(i); cur[i] = [x, y]; const b = cen(i); await h.drag(a[0], a[1], b[0], b[1], 8); await h.wait(350); }
    const a = cen(0); await h.drag(a[0], a[1], a[0] + 120, a[1], 8); }, { t: 2500 });
add('big hand be in 45', ...opt3(242, 1, 0));
add('cat looks in the mirror', h => h.tap(288, 244), h => h.tap(180, 244));
add('Swap the frogs', async h => { const X = i => 48 + i * 66; await h.tap(X(1), 158); await h.wait(450); await h.tap(X(2), 158); await h.wait(450);
    const xs = await h.ev(() => document.querySelector('#stage').__chars.map(g => Math.round(g.__x))); h.ok(xs.includes(180), 'frog hopped backwards: ' + xs);
    await h.tap(X(0), 158); await h.wait(1700); const ys = await h.ev(() => document.querySelector('#stage').__chars.map(g => Math.round(g.__x))); h.ok(ys.join() === '48,114,246,312', 'jammed pond was not reset: ' + ys); },
  async h => { const X = i => 48 + i * 66;
    const sol = bfs(['g', 'g', null, 'b', 'b'], s => s.join(), s => { const out = []; const e = s.indexOf(null); s.forEach((f, i) => { if (!f) return; const dir = f === 'g' ? 1 : -1, d = e - i; if (d !== dir && d !== 2 * dir) return; const n = s.slice(); n[e] = f; n[i] = null; out.push([i, n]); }); return out; }, s => s.join() === 'b,b,,g,g');
    h.note('BFS: ' + sol.length + ' hops'); h.ok(sol && sol.length === 8, 'frog swap should take 8');
    for (const i of sol) { await h.tap(X(i), 158); await h.wait(420); } });
add('Only one piece completes', ...opt3(252, 1, 0));
// ---------------- pack 4
add('Which number is the biggest', h => h.tap(86, 150), h => h.tap(314, 88));
add('One egg is about to hatch', async h => { // the clue must actually be visible: only the right egg may move
    const seen = await h.ev(() => new Promise(res => { const eggs = [...document.querySelectorAll('#stage ellipse')].filter(e => e.getAttribute('rx') === '27').map(e => e.parentNode); const hits = [0, 0, 0]; const t0 = Date.now();
      (function f() { eggs.forEach((g, i) => { const t = g.getAttribute('transform'); if (t && !/rotate\(0 /.test(t)) hits[i]++; }); if (Date.now() - t0 < 2600) requestAnimationFrame(f); else res(hits); })(); }));
    h.note('frames each egg was tilted: ' + seen); h.ok(seen[2] > 5 && seen[0] === 0 && seen[1] === 0, 'egg wobble not as designed: ' + seen); await h.tap(76, 198); },
  h => h.tap(284, 198));
add('How many moons', ...chips(1, 0));
add('How many eyes are open', ...chips(1, 3));
add('lost his colour', async h => { await h.drag(180, 252, 180, 124); await h.wait(450); await h.drag(70, 252, 180, 124); await h.wait(450); const t = await h.tfAt(70, 252); h.ok(t && Math.abs(t[0] - 70) < 3, 'blue paint did not go back'); },
  async h => { await h.drag(70, 252, 290, 252); await h.wait(350); const f = await h.ev(() => [...document.querySelectorAll('#stage path')].filter(e => e.getAttribute('fill') === '#3FBF7F').length); h.ok(f >= 1, 'no green paint appeared after mixing'); await h.drag(290, 252, 180, 124); });
add('really the tallest', h => h.tap(70, 130), h => h.tap(292, 215));
add('Cut the pizza', h => h.tap(128, 40), h => h.tap(270, 66));
add('One bead is in the wrong place', h => h.tap(28, 128), h => h.tap(294, 141));
add('Which line is longer', h => h.chip(0), async h => { await h.drag(180, 96, 180, 196); const t = await h.tfAt(180, 196); h.ok(!!t, 'line did not move'); await h.chip(2); });
add('Share the carrots', async h => { await h.drag(36, 224, 180, 224); await h.wait(500); }, async h => { await h.drag(36, 224, 180, 224); await h.wait(450); await h.drag(96, 168, 294, 200); }, { nb: 0 });
add('hops the same distance', async h => { await h.tap(240, 204); await h.wait(300); await h.tap(288, 204); }, h => h.tap(264, 204));
add('red ball belong', async h => { await h.drag(180, 262, 90, 128); await h.wait(500); }, h => h.drag(180, 262, 180, 128));
add('Make the biggest number', ...order(150, [66, 294], [180, 294]));
add('Where does it stop', h => h.tap(180, 165), async h => { await h.tap(226, 211); await h.wait(2900); const r = await h.ev(() => { const g = document.querySelector('#stage').__chars[0]; return [g.__x, g.__y]; }); h.ok(Math.abs(r[0] - 226) < 2 && Math.abs(r[1] - 210) < 2, 'robot not drawn on the answer square: ' + r); }, { t: 3000 });
add('How many squares', ...chips(1, 0));
add('Who came first', ...order(172, [66, 180], [180, 294]));
add('number chart', ...chips(1, 0));
add('sun is hiding behind', h => h.tap(302, 60), h => h.tap(58, 60));
add('just turned around', ...opt3(222, 1, 0, [66, 180, 294]));
// ---------------- pack 5
const IC = (c, s) => async h => { await h.tap(56 + c * 68, 204); await h.wait(60); await h.tap(198 + s * 58, 204); await h.wait(330); };
add('every different ice cream', async h => { await IC(0, 0)(h); await IC(0, 0)(h); await h.wait(300); const q = await h.ev(() => [...document.querySelectorAll('#stage text')].filter(t => t.textContent === '?').length); h.ok(q === 5, 'a repeated ice cream filled a second slot (empty slots: ' + q + ')'); },
  async h => { for (let c = 0; c < 2; c++) for (let s = 0; s < 3; s++) await IC(c, s)(h); });
add('one of each fruit', async h => { await h.tap(258, 62); await h.wait(350); const red = await h.ev(() => [...document.querySelectorAll('#stage rect')].filter(e => e.getAttribute('stroke') === '#F0466F').length); h.ok(red >= 2, 'clash not outlined (red boxes: ' + red + ')'); },
  async h => { const given = [[0, 1, -1], [-1, -1, 0], [-1, 0, -1]]; const sols = [];
    (function rec(g, i) { if (i === 9) { sols.push(g.map(r => r.slice())); return; } const r = Math.floor(i / 3), c = i % 3; if (given[r][c] >= 0) return rec(g, i + 1);
      for (let v = 0; v < 3; v++) { let ok = true; for (let k = 0; k < 3; k++) { if (g[r][k] === v || g[k][c] === v) ok = false; } if (ok) { g[r][c] = v; rec(g, i + 1); g[r][c] = -1; } } })(given.map(r => r.slice()), 0);
    h.note('exhaustive search: ' + sols.length + ' solution(s)'); h.ok(sols.length === 1, 'fruit grid should have exactly one solution');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { if (given[r][c] >= 0) continue; for (let k = 0; k <= sols[0][r][c]; k++) { await h.tap(102 + c * 78, 62 + r * 78); await h.wait(310); } } }, { nb: 0, t: 2500 });
const BEE = (c, r) => [84 + c * 64, 66 + r * 64];
add('Visit every flower', async h => { await h.tap(...BEE(3, 2)); await h.wait(300); for (const q of [[0, 1], [1, 1], [1, 2], [0, 2]]) { await h.tap(...BEE(...q)); await h.wait(330); } await h.wait(1300);
    const b = await h.ev(() => { const e = [...document.querySelectorAll('#stage ellipse')].find(e => e.getAttribute('fill') === '#FFD84A' && e.getAttribute('rx') === '13'); return [e.parentNode.__x, e.parentNode.__y]; });
    h.ok(Math.abs(b[0] - 84) < 2 && Math.abs(b[1] - 62) < 2, 'bee did not go back to the start after a dead end: ' + b); },
  async h => { let n = 0, first = null; const seen = new Set(['0:0']);
    (function dfs(x, y, path) { if (path.length === 10) { n++; if (!first) first = path.slice(); return; } for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, b = y + dy; if (a < 0 || b < 0 || a > 3 || b > 2 || (a === 1 && b === 0) || seen.has(a + ':' + b)) continue; seen.add(a + ':' + b); path.push([a, b]); dfs(a, b, path); path.pop(); seen.delete(a + ':' + b); } })(0, 0, []);
    h.note('exhaustive search: ' + n + ' complete routes'); h.ok(n > 0, 'bee puzzle unsolvable');
    for (const q of first) { await h.tap(...BEE(...q)); await h.wait(330); } }, { t: 2500 });
add('How much is the dog worth', ...chips(2, 1));
const RB = { U: 44, D: 98, L: 152, R: 206 };
add('how to reach the battery', async h => { await h.tap(RB.R, 218); await h.wait(300); await h.tap(180, 270); await h.wait(1200); const r = await h.ev(() => { const g = document.querySelector('#stage').__chars[0]; return [g.__x, g.__y]; }); h.ok(Math.abs(r[0] - 114) < 2, 'robot went through a wall or did not return: ' + r); },
  async h => { const blk = (x, y) => x < 0 || y < 0 || x > 3 || y > 2 || (x === 1 && y === 2) || (x === 2 && y === 0); const DX = { U: 0, D: 0, L: -1, R: 1 }, DY = { U: -1, D: 1, L: 0, R: 0 };
    const sol = bfs([0, 2], s => s.join(), s => 'UDLR'.split('').filter(d => !blk(s[0] + DX[d], s[1] + DY[d])).map(d => [d, [s[0] + DX[d], s[1] + DY[d]]]), s => s[0] === 3 && s[1] === 0);
    h.note('BFS: ' + sol.join('')); h.ok(sol.length <= 6, 'route longer than the program strip');
    for (const d of sol) { await h.tap(RB[d], 218); await h.wait(300); } await h.tap(180, 270); await h.wait(2700);
    const r = await h.ev(() => { const g = document.querySelector('#stage').__chars[0]; return [g.__x, g.__y]; }); h.ok(Math.abs(r[0] - 246) < 2 && Math.abs(r[1] - 31) < 2, 'robot not drawn on the battery: ' + r); }, { t: 3000 });
const CAT = (c, r) => [87 + c * 62, 57 + r * 62];
add('Seat a cat in every row', async h => { await h.tap(...CAT(0, 1)); await h.wait(300); for (const q of [[0, 2], [3, 3], [3, 1]]) { await h.tap(...CAT(...q)); await h.wait(300); } },
  async h => { const wet = new Set(['0:1', '1:2', '3:2', '1:3']); const sols = [];
    (function rec(r, cols, acc) { if (r === 4) { sols.push(acc.slice()); return; } for (let c = 0; c < 4; c++) { if (r === 0 && c !== 2) continue; if (cols.has(c) || wet.has(c + ':' + r)) continue; cols.add(c); acc.push(c); rec(r + 1, cols, acc); acc.pop(); cols.delete(c); } })(0, new Set(), []);
    h.note('exhaustive search: ' + sols.length + ' solution(s) ' + JSON.stringify(sols)); h.ok(sols.length === 1, 'cat seating should have exactly one solution');
    for (let r = 1; r < 4; r++) { await h.tap(...CAT(sols[0][r], r)); await h.wait(300); } });
add('jumps keep growing', ...chips(1, 0));
add('flies straight over the blocks', ...opt3(232, 1, 0, [66, 180, 294]));
add('lily patch doubles', ...chips(1, 0));
add('Only ONE sign tells the truth', h => h.tap(66, 170), h => h.tap(180, 170));
const NIM = n => async h => { await h.tap(n === 1 ? 110 : 250, 236); await h.wait(1750); };
add('LAST berry wins', async h => { await NIM(2)(h); await NIM(1)(h); await h.wait(1800); const s = await h.ev(() => [...document.querySelectorAll('#stage text')].map(t => t.textContent).join('|')); h.ok(/Your turn!/.test(s), 'game did not reset after the monster won: ' + s); },
  async h => { // minimax over the monster's actual rule: he leaves a multiple of three when he can
    const mon = left => { let n = left % 3; if (n === 0) n = 1; return Math.min(n, left); };
    const winFrom = left => { for (const t of [1, 2]) { if (t > left) continue; const l2 = left - t; if (l2 === 0) return [t]; const l3 = l2 - mon(l2); if (l3 === 0) continue; const r = winFrom(l3); if (r) return [t].concat(r); } return null; };
    const plan = winFrom(7); h.note('winning line for the child: ' + plan); h.ok(!!plan, 'nim cannot be won by the child');
    for (const t of plan) await NIM(t)(h); }, { t: 2500 });

(async () => {
  const t = await L.open(ROOT, 667, { init: () => { window.__bad = 0; window.addEventListener('load', () => { const o = BS.SFX.bad; BS.SFX.bad = function () { window.__bad++; return o.apply(this, arguments); }; }); } });
  const p = t.p; const res = []; let fails = 0; const seenK = new Set();
  const asks = await p.evaluate(() => PUZZLES.map(x => x.ask));
  for (const spec of T) {
    if (ONLY && spec.k.indexOf(ONLY) < 0) continue;
    const hits = asks.map((a, i) => a.indexOf(spec.k) >= 0 ? i : -1).filter(i => i >= 0);
    if (hits.length !== 1) { console.log('KEY PROBLEM', spec.k, hits); fails++; continue; }
    const idx = hits[0]; seenK.add(idx);
    const notes = [], errs = [];
    const h = {
      tap: async (x, y) => { await L.tap(p, 'stage', x, y); await p.waitForTimeout(40); },
      drag: (x1, y1, x2, y2, st) => L.drag(p, 'stage', x1, y1, x2, y2, st || 8),
      path: pts => L.path(p, 'stage', pts, 14),
      multi: async (pts, hold) => { const cdp = p._cdp || (p._cdp = await p.context().newCDPSession(p)); const tp = []; for (let i = 0; i < pts.length; i++) { const c = await L.pt(p, 'stage', pts[i][0], pts[i][1]); tp.push({ x: c[0], y: c[1], id: i + 1 }); }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp }); await p.waitForTimeout(hold); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); },
      chip: async i => { const r = await p.evaluate(i => { const b = document.querySelectorAll('#tray .chip')[i].getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, i); await p.touchscreen.tap(r[0], r[1]); },
      wait: ms => p.waitForTimeout(ms), ev: (f, a) => p.evaluate(f, a),
      won: () => p.evaluate(() => document.getElementById('win').className === 'over on'),
      bad: () => p.evaluate(() => window.__bad),
      // translate of the top-most positioned group whose drawn box contains stage point (x,y)
      tfAt: (x, y) => p.evaluate(([x, y]) => { const s = document.getElementById('stage'); const gs = [...s.children].filter(e => e.tagName === 'g' && e.__x !== undefined); for (let i = gs.length - 1; i >= 0; i--) { if (Math.abs(gs[i].__x - x) < 14 && Math.abs(gs[i].__y - y) < 14) return [gs[i].__x, gs[i].__y]; } return null; }, [x, y]),
      ok: (c, m) => { if (!c) errs.push(m); }, note: m => notes.push(m)
    };
    const open = async () => { await p.reload(); await p.waitForTimeout(120); await p.evaluate(() => { window.__bad = 0; }); await p.tap('#hero'); await p.waitForTimeout(80);
      await p.evaluate(i => document.querySelectorAll('.node')[i].click(), idx); await p.waitForTimeout(260); };
    let wrongOK = true, winOK = false, geo = [];
    try {
      await open(); geo = await L.geo(p);
      await spec.wrong(h); await p.waitForTimeout(1000);
      if (await h.won()) { wrongOK = false; errs.push('WRONG MOVE WON THE PUZZLE'); }
      const nb = await h.bad(); if ((spec.nb === undefined ? 1 : spec.nb) > nb) { errs.push('wrong move drew no "nope" (' + nb + ')'); }
      geo = geo.concat(await L.geo(p));
      await open(); await spec.win(h);
      const t0 = Date.now(); while (Date.now() - t0 < (spec.t || 2000)) { if (await h.won()) { winOK = true; break; } await sleep(100); }
      if (!winOK) errs.push('WIN PATH DID NOT WIN');
      const done = await p.evaluate(i => { const m = JSON.parse(localStorage.getItem('bs.doneIds') || '{}'); return m[BS.pid(PUZZLES[i])] === 1; }, idx);
      if (winOK && !done) errs.push('won but not saved as solved');
      geo = geo.concat(await L.geo(p));
    } catch (e) { errs.push('EXCEPTION ' + String(e).slice(0, 200)); }
    if (geo.length) errs.push('bad geometry: ' + geo.slice(0, 3).join('; '));
    if (t.errs.length) { errs.push('JS: ' + t.errs.splice(0).join(' | ')); }
    if (errs.length) fails++;
    console.log((errs.length ? 'FAIL ' : 'ok   ') + String(idx + 1).padStart(2) + ' ' + spec.k + (notes.length ? '  [' + notes.join('; ') + ']' : '') + (errs.length ? '\n       -> ' + errs.join('\n       -> ') : ''));
  }
  if (!ONLY) { const miss = asks.map((a, i) => seenK.has(i) ? null : (i + 1) + ' ' + a).filter(Boolean); console.log('untested puzzles:', miss.length ? miss : 'none');
    await p.reload(); await p.waitForTimeout(200); console.log('home says:', await p.evaluate(() => document.getElementById('sub-tricks').textContent)); }
  console.log('specs', T.length, 'failures', fails);
  await t.close();
})();
