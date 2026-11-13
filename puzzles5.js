/* ==========================================================
   Brain Snacks — pack 5 (v10): eleven puzzles for the last three
   chapters. Planning ahead, working backwards, elimination.

   Where a puzzle has a board, the board lives in `data` so the
   test suite can prove it solvable without reading the picture.
   ========================================================== */

BS.addPuzzles((function () {
  'use strict';

  var A = ART;
  var S = A.S, G = A.G, ink = A.ink, txt = A.txt, place = A.place;
  var animal = A.animal, star = A.star, scene = A.scene, critter = A.critter;
  var tap = BS.tap, glide = BS.glide, later = BS.later;
  var pad = KIT.pad, options = KIT.options, button = KIT.button;

  function note(st, s, x, y, size) {
    return txt(s, { x: x, y: y, 'font-size': size || 12, fill: '#241534', opacity: '.6' }, st);
  }
  var ROT = { U: 0, R: 90, D: 180, L: 270 };
  var DX = { U: 0, D: 0, L: -1, R: 1 }, DY = { U: -1, D: 1, L: 0, R: 0 };
  function arrow(parent, dir, size, col) {
    return ink(S('path', { d: 'M0,-12 L10,2 L4,2 L4,12 L-4,12 L-4,2 L-10,2 Z', fill: col || '#241534',
      transform: 'rotate(' + ROT[dir] + ') scale(' + (size || 1) + ')' }, parent), 1);
  }

  /* fruit for the 3x3 grid */
  function fruit(parent, k, s) {
    var g = S('g', {}, parent);
    if (k === 0) {
      ink(S('circle', { cx: 0, cy: 2, r: s, fill: '#E8464C' }, g), 3);
      ink(S('line', { x1: 0, y1: 2 - s, x2: 2, y2: -s - 5 }, g), 3).setAttribute('stroke', '#6E4A28');
      ink(S('ellipse', { cx: 8, cy: -s - 4, rx: 6, ry: 3.4, fill: '#3FBF7F' }, g), 2.2);
    } else if (k === 1) {
      ink(S('ellipse', { cx: 0, cy: 0, rx: s * 1.2, ry: s * .82, fill: '#FFD84A' }, g), 3);
      ink(S('circle', { cx: s * 1.16, cy: 0, r: 2.6, fill: '#E0B44A' }, g), 2);
    } else {
      ink(S('circle', { cx: -s * .46, cy: -s * .1, r: s * .58, fill: '#A66FD8' }, g), 2.6);
      ink(S('circle', { cx: s * .46, cy: -s * .1, r: s * .58, fill: '#A66FD8' }, g), 2.6);
      ink(S('circle', { cx: 0, cy: s * .56, r: s * .58, fill: '#B98BE6' }, g), 2.6);
      ink(S('line', { x1: 0, y1: -s * .6, x2: 0, y2: -s * 1.1 }, g), 2.6).setAttribute('stroke', '#3FBF7F');
    }
    return g;
  }

  return [

/* ---------- go in order and you never miss one ---------- */
{
  id: 'n-icecream', d: 62,
  ask: 'Make every different ice cream. Each one is one cone and one scoop.',
  hint: 'Stick with one cone and give it each scoop in turn. Then swap cones.',
  tell: 'The pale cone with pink, white and green. Then the dark cone with pink, white and green.',
  why: 'Two cones times three scoops is six. Going in order meant you never missed one.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var CONE = ['#E9B76A', '#8A5F3B'], SCOOP = ['#FF8FA6', '#FFF6E6', '#7FD9A4'];
    var made = {}, count = 0, selC = -1, selS = -1, i, slots = [], rings = { c: [], s: [] };
    function draw(parent, c, s, z) {
      var g = S('g', { transform: 'scale(' + z + ')' }, parent);
      ink(S('path', { d: 'M-13,0 L13,0 L0,34 Z', fill: CONE[c] }, g), 3);
      ink(S('circle', { cx: 0, cy: -9, r: 15, fill: SCOOP[s] }, g), 3);
      S('ellipse', { cx: -5, cy: -15, rx: 5, ry: 3, fill: '#FFFFFF', opacity: '.5' }, g);
      return g;
    }
    for (i = 0; i < 6; i++) {
      var sg = G(st, 46 + i * 53.6, 62);
      ink(S('rect', { x: -23, y: -40, width: 46, height: 84, rx: 10, fill: '#FFF6E6', 'stroke-dasharray': '7 6' }, sg), 3);
      slots.push(sg);
      txt('?', { x: 0, y: 12, 'font-size': 26, fill: '#C9BEE2' }, sg);
    }
    function ring(g, w, h) {
      var r = ink(S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 14, fill: 'none' }, g), 5);
      r.setAttribute('stroke', '#FF8A3D'); r.setAttribute('opacity', '0');
      return r;
    }
    function mark() {
      var k;
      for (k = 0; k < 2; k++) { rings.c[k].setAttribute('opacity', k === selC ? '1' : '0'); }
      for (k = 0; k < 3; k++) { rings.s[k].setAttribute('opacity', k === selS ? '1' : '0'); }
    }
    function tryMake() {
      if (selC < 0 || selS < 0) { return; }
      var key = selC + ':' + selS, c = selC, s = selS;
      selC = -1; selS = -1;
      later(mark, 200);
      if (made[key]) { BS.nope(slots[made[key] - 1]); return; }
      A.clear(slots[count]);
      ink(S('rect', { x: -23, y: -40, width: 46, height: 84, rx: 10, fill: '#FFF6E6' }, slots[count]), 3);
      draw(slots[count], c, s, 1).setAttribute('transform', 'translate(0,2)');
      A.burst(st, 46 + count * 53.6, 60, { n: 6, r: 28 });
      count++; made[key] = count;
      BS.SFX.good();
      if (count === 6) { later(BS.win, 420); }
    }
    note(st, 'cones', 90, 136, 13);
    note(st, 'scoops', 250, 136, 13);
    for (i = 0; i < 2; i++) {
      (function (i) {
        var g = G(st, 56 + i * 68, 204);
        pad(g, 62, 112);
        ink(S('rect', { x: -28, y: -52, width: 56, height: 104, rx: 12, fill: '#FFF6E6' }, g), 3);
        ink(S('path', { d: 'M-17,-22 L17,-22 L0,26 Z', fill: CONE[i] }, g), 3.5);
        rings.c.push(ring(g, 62, 110));
        tap(g, function () { selC = i; BS.SFX.tap(); mark(); tryMake(); });
      })(i);
    }
    for (i = 0; i < 3; i++) {
      (function (i) {
        var g = G(st, 198 + i * 58, 204);
        pad(g, 54, 112);
        ink(S('rect', { x: -25, y: -52, width: 50, height: 104, rx: 12, fill: '#FFF6E6' }, g), 3);
        ink(S('circle', { cx: 0, cy: 0, r: 19, fill: SCOOP[i] }, g), 3.5);
        S('ellipse', { cx: -6, cy: -8, rx: 6, ry: 4, fill: '#FFFFFF', opacity: '.5' }, g);
        rings.s.push(ring(g, 56, 110));
        tap(g, function () { selS = i; BS.SFX.tap(); mark(); tryMake(); });
      })(i);
    }
  }
},

/* ---------- start where there is only one choice ---------- */
{
  id: 'n-fruit3', d: 65,
  ask: 'Every row and every column needs one of each fruit. Tap a square to change it.',
  hint: 'Look for a row or column with only one gap. Only one fruit can go there.',
  tell: 'Top row ends with grapes. Middle row: lemon, grapes, apple. Bottom row: grapes, apple, lemon.',
  why: 'You never had to guess. Each gap had only one fruit that could fit.',
  data: { given: [[0, 1, -1], [-1, -1, 0], [-1, 0, -1]] },
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false });
    var given = this.data.given, cur = [], cells = [], rings = [], u = 78, ox = 180 - u, oy = 62, r, c, done = false;
    for (r = 0; r < 3; r++) {
      cur.push(given[r].slice()); cells.push([]); rings.push([]);
      for (c = 0; c < 3; c++) {
        (function (r, c) {
          var g = G(st, ox + c * u, oy + r * u), fixed = given[r][c] >= 0;
          pad(g, u, u);
          var box = ink(S('rect', { x: -u / 2 + 3, y: -u / 2 + 3, width: u - 6, height: u - 6, rx: 10,
            fill: fixed ? '#EAD9BC' : '#FFF6E6' }, g), 3.5);
          var slot = S('g', {}, g);
          cells[r].push(slot); rings[r].push(box);
          if (fixed) { fruit(slot, given[r][c], 17); return; }
          tap(g, function () {
            if (done) { return; }
            cur[r][c] = cur[r][c] >= 2 ? -1 : cur[r][c] + 1;
            A.clear(slot);
            if (cur[r][c] >= 0) { fruit(slot, cur[r][c], 17); }
            BS.SFX.tap();
            check();
          });
        })(r, c);
      }
    }
    /* clashes are outlined in red as they appear, quietly, with no "wrong" buzz */
    function check() {
      var bad = {}, full = true, i, j, k;
      for (i = 0; i < 3; i++) {
        for (j = 0; j < 3; j++) {
          if (cur[i][j] < 0) { full = false; continue; }
          for (k = 0; k < 3; k++) {
            if (k !== j && cur[i][k] === cur[i][j]) { bad[i + ':' + j] = 1; }
            if (k !== i && cur[k][j] === cur[i][j]) { bad[i + ':' + j] = 1; }
          }
        }
      }
      var any = false;
      for (i = 0; i < 3; i++) {
        for (j = 0; j < 3; j++) {
          rings[i][j].setAttribute('stroke', bad[i + ':' + j] ? '#F0466F' : '#241534');
          if (bad[i + ':' + j]) { any = true; }
        }
      }
      if (full && !any) { done = true; later(BS.win, 320); }
    }
  }
},

/* ---------- look ahead for dead ends ---------- */
{
  id: 'n-bee', d: 68,
  ask: 'Visit every flower, one step at a time. The bee never lands on the same flower twice.',
  hint: 'Before each step, ask: will any flower get cut off if I go this way?',
  tell: 'Down, right, right, up, right, down, down, left, left, left.',
  why: 'You looked ahead for dead ends instead of just taking the nearest flower.',
  data: { cols: 4, rows: 3, rock: [1, 0], start: [0, 0] },
  build: function (st) {
    scene(st, 'meadow', { hills: false, groundY: 30, tufts: false, sun: false });
    var D = this.data, u = 64, ox = 180 - D.cols * u / 2 + u / 2, oy = 66, r, c;
    var seen = {}, at = D.start.slice(), total = D.cols * D.rows - 1, n = 1, busy = false;
    var trail = S('g', {}, st), heads = {};
    function px(p) { return [ox + p[0] * u, oy + p[1] * u]; }
    for (r = 0; r < D.rows; r++) {
      for (c = 0; c < D.cols; c++) {
        var p = px([c, r]), k;
        if (c === D.rock[0] && r === D.rock[1]) {
          ink(S('path', { d: 'M' + (p[0] - 24) + ',' + (p[1] + 16) + ' q-6,-28 14,-32 q22,-10 32,12 q8,18 -10,22 Z', fill: '#B7B2C4' }, st), 4);
          continue;
        }
        var fg = S('g', {}, st);
        for (k = 0; k < 6; k++) {
          ink(S('circle', { cx: p[0] + Math.cos(k * Math.PI / 3) * 13, cy: p[1] + Math.sin(k * Math.PI / 3) * 13, r: 9.5,
            fill: ['#FF8FA6', '#FFF6E6', '#FFC93C'][(c + r) % 3] }, fg), 2.6);
        }
        ink(S('circle', { cx: p[0], cy: p[1], r: 8, fill: '#FF8A3D' }, fg), 2.6);
        heads[c + ':' + r] = fg;
      }
    }
    var s0 = px(at), bee = G(st, s0[0], s0[1] - 4);
    ink(S('ellipse', { cx: -9, cy: -10, rx: 9, ry: 6, fill: '#FFFFFF', opacity: '.85' }, bee), 2);
    ink(S('ellipse', { cx: 7, cy: -11, rx: 9, ry: 6, fill: '#FFFFFF', opacity: '.85' }, bee), 2);
    ink(S('ellipse', { cx: 0, cy: 0, rx: 13, ry: 10, fill: '#FFD84A' }, bee), 3);
    ink(S('path', { d: 'M-3,-9 L-3,9 M4,-9 L4,9', fill: 'none' }, bee), 3);
    S('circle', { cx: 9, cy: -2, r: 1.8, fill: '#241534' }, bee);
    bee.style.pointerEvents = 'none';
    function visit(p) {
      seen[p[0] + ':' + p[1]] = 1;
      heads[p[0] + ':' + p[1]].setAttribute('opacity', '.35');
    }
    function reset() {
      var key;
      for (key in heads) { if (heads.hasOwnProperty(key)) { heads[key].setAttribute('opacity', '1'); } }
      seen = {}; n = 1; at = D.start.slice();
      A.clear(trail);
      var q = px(at);
      glide(bee, q[0], q[1] - 4, 300);
      visit(at);
      busy = false;
    }
    function stuck() {
      var d = [[1, 0], [-1, 0], [0, 1], [0, -1]], i, a, b;
      for (i = 0; i < 4; i++) {
        a = at[0] + d[i][0]; b = at[1] + d[i][1];
        if (a < 0 || b < 0 || a >= D.cols || b >= D.rows) { continue; }
        if (a === D.rock[0] && b === D.rock[1]) { continue; }
        if (!seen[a + ':' + b]) { return false; }
      }
      return true;
    }
    visit(at);
    /* hit layer on top of the flowers and the bee */
    for (r = 0; r < D.rows; r++) {
      for (c = 0; c < D.cols; c++) {
        (function (r, c) {
          if (c === D.rock[0] && r === D.rock[1]) { return; }
          var q = px([c, r]), z = G(st, q[0], q[1]);
          pad(z, u, u);
          tap(z, function () {
            if (busy) { return; }
            var near = Math.abs(c - at[0]) + Math.abs(r - at[1]) === 1;
            if (!near || seen[c + ':' + r]) { BS.nope(z); return; }
            var from = px(at);
            ink(S('line', { x1: from[0], y1: from[1], x2: q[0], y2: q[1] }, trail), 5).setAttribute('stroke', '#FFF6E6');
            at = [c, r]; n++;
            visit(at);
            glide(bee, q[0], q[1] - 4, 170);
            BS.SFX.tap();
            if (n === total) { busy = true; later(BS.win, 320); return; }
            if (stuck()) { busy = true; later(function () { BS.nope(); later(reset, 500); }, 260); }
          });
        })(r, c);
      }
    }
  }
},

/* ---------- one answer unlocks the next ---------- */
{
  id: 'n-symbols', d: 72,
  ask: 'Every cat is worth the same. How much is the dog worth?',
  hint: 'Start with the top line. If two cats make 6, what is one cat?',
  tell: 'One cat is 3. A cat and a dog make 8, so the dog is 5.',
  why: 'You found the cat first, then used it to find the dog. One answer unlocked the next.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false });
    function row(y, a, b, total) {
      var g = G(st, 180, y);
      ink(S('rect', { x: -150, y: -42, width: 300, height: 84, rx: 16, fill: '#FFF6E6' }, g), 3.5);
      function face(x, kind) {
        animal(g, { kind: kind, x: x, y: -8, size: 15, fill: kind === 'cat' ? '#FFB03A' : '#C98B52', bob: false, shadow: false, blink: false });
      }
      face(-104, a);
      txt('+', { x: -50, y: 12, 'font-size': 32, fill: '#241534' }, g);
      face(4, b);
      txt('=', { x: 58, y: 12, 'font-size': 32, fill: '#241534' }, g);
      txt(String(total), { x: 108, y: 16, 'font-size': 42, fill: '#F0466F' }, g);
    }
    row(60, 'cat', 'cat', 6);
    row(160, 'cat', 'dog', 8);
    animal(st, { kind: 'dog', x: 150, y: 232, size: 15, fill: '#C98B52', bob: false, shadow: false });
    txt('=  ?', { x: 216, y: 262, 'font-size': 32, fill: '#241534' }, st);
    BS.chips(['2', '3', '5', '4'], 2);
  }
},

/* ---------- write the whole plan first ---------- */
{
  id: 'n-robot2', d: 75,
  ask: 'Tell the robot how to reach the battery. Tap the arrows, then GO.',
  hint: 'Trace the path with your finger first and count the squares. Then tap in the arrows.',
  tell: 'Up, right, right, right, up. Then GO.',
  why: 'You wrote the whole plan before anything moved. That is exactly what programming is.',
  data: { cols: 4, rows: 3, start: [0, 2], goal: [3, 0], blocks: [[1, 2], [2, 0]], max: 6 },
  build: function (st) {
    scene(st, 'lab', { hills: false, ground: false });
    var D = this.data, u = 44, ox = 180 - D.cols * u / 2, oy = 10, r, c, i;
    var prog = [], busy = false, chipsG = S('g', {}, st);
    function blocked(x, y) {
      if (x < 0 || y < 0 || x >= D.cols || y >= D.rows) { return true; }
      for (var k = 0; k < D.blocks.length; k++) { if (D.blocks[k][0] === x && D.blocks[k][1] === y) { return true; } }
      return false;
    }
    function cxy(p) { return [ox + p[0] * u + u / 2, oy + p[1] * u + u / 2]; }
    ink(S('rect', { x: ox - 6, y: oy - 6, width: D.cols * u + 12, height: D.rows * u + 12, rx: 12, fill: '#7890AC' }, st), 4);
    for (r = 0; r < D.rows; r++) {
      for (c = 0; c < D.cols; c++) {
        var wall = blocked(c, r);
        ink(S('rect', { x: ox + c * u + 2, y: oy + r * u + 2, width: u - 4, height: u - 4, rx: 7,
          fill: wall ? '#4A5578' : '#FFFFFF' }, st), 2.4);
        if (wall) {
          ink(S('path', { d: 'M' + (ox + c * u + 12) + ',' + (oy + r * u + 12) + ' l' + (u - 24) + ',' + (u - 24) + ' m0,' + (24 - u) + ' l' + (24 - u) + ',' + (u - 24), fill: 'none' }, st), 4)
            .setAttribute('stroke', '#2B3350');
        }
      }
    }
    var gp = cxy(D.goal);
    ink(S('rect', { x: gp[0] - 10, y: gp[1] - 13, width: 20, height: 28, rx: 4, fill: '#3FBF7F' }, st), 3);
    ink(S('rect', { x: gp[0] - 5, y: gp[1] - 18, width: 10, height: 6, rx: 2, fill: '#3FBF7F' }, st), 2.4);
    ink(S('path', { d: 'M' + (gp[0] + 2) + ',' + (gp[1] - 8) + ' l-6,9 l5,0 l-3,9 l7,-11 l-5,0 Z', fill: '#FFC93C' }, st), 1.6);
    var s0 = cxy(D.start), bot = A.robot(st, { x: s0[0], y: s0[1] - 1, size: 12 });

    /* the program strip */
    for (i = 0; i < D.max; i++) {
      ink(S('rect', { x: 180 - D.max * 17 + i * 34 + 2, y: 154, width: 30, height: 30, rx: 7, fill: '#FFF6E6', 'stroke-dasharray': '5 5' }, st), 2.4);
    }
    function paint() {
      A.clear(chipsG);
      for (var k = 0; k < prog.length; k++) {
        var g = G(chipsG, 180 - D.max * 17 + k * 34 + 17, 169);
        ink(S('rect', { x: -15, y: -15, width: 30, height: 30, rx: 7, fill: '#FFC93C' }, g), 2.6);
        arrow(g, prog[k], .8);
      }
    }
    function home() { glide(bot, s0[0], s0[1] - 1, 260); busy = false; }
    function run() {
      if (busy) { return; }
      if (!prog.length) { BS.nope(goBtn); return; }
      busy = true;
      var p = D.start.slice(), k = 0;
      function step() {
        if (k >= prog.length) { BS.nope(bot); later(home, 500); return; }
        var nx = p[0] + DX[prog[k]], ny = p[1] + DY[prog[k]];
        if (blocked(nx, ny)) { BS.nope(bot); later(home, 500); return; }
        p = [nx, ny]; k++;
        var q = cxy(p);
        glide(bot, q[0], q[1] - 1, 200);
        BS.SFX.tap();
        if (p[0] === D.goal[0] && p[1] === D.goal[1]) { later(BS.win, 300); return; }
        later(step, 250);
      }
      step();
    }
    var dirs = ['U', 'D', 'L', 'R'];
    for (i = 0; i < 4; i++) {
      (function (d, i) {
        var g = G(st, 44 + i * 54, 218);
        pad(g, 52, 50);
        S('rect', { x: -22, y: -16, width: 44, height: 40, rx: 10, fill: '#5C7096' }, g);
        ink(S('rect', { x: -22, y: -20, width: 44, height: 40, rx: 10, fill: '#8FA8F0' }, g), 3.5);
        arrow(g, d, 1);
        tap(g, function () {
          if (busy) { return; }
          if (prog.length >= D.max) { BS.nope(g); return; }
          prog.push(d); BS.SFX.tap(); paint();
        });
      })(dirs[i], i);
    }
    button(st, 290, 218, 96, 'undo', '#FFF6E6', function () {
      if (busy || !prog.length) { return; }
      prog.pop(); BS.SFX.tap(); paint();
    }, 40);
    var goBtn = button(st, 180, 270, 200, 'GO', '#3FBF7F', run, 38);
  }
},

/* ---------- the forced move goes first ---------- */
{
  id: 'n-cats', d: 78,
  ask: 'Seat a cat in every row. No two cats may share a row or a column, and no cat sits in a puddle.',
  hint: 'One row has only a single dry square that still works. Start there.',
  tell: 'Third row: first square. Bottom row: last square. Second row: second square.',
  why: 'The row with only one free seat had to go first. Start where there is no choice.',
  data: { n: 4, fixed: [2, 0], puddles: [[0, 1], [1, 2], [3, 2], [1, 3]] },
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false });
    var D = this.data, u = 62, ox = 180 - D.n * u / 2 + u / 2, oy = 26 + u / 2, r, c;
    var cats = {}, count = 1, done = false;
    function wet(x, y) {
      for (var k = 0; k < D.puddles.length; k++) { if (D.puddles[k][0] === x && D.puddles[k][1] === y) { return true; } }
      return false;
    }
    function seat(x, y, fixed) {
      var g = animal(st, { kind: 'cat', x: ox + x * u, y: oy + y * u - 9, size: 10.5,
        fill: fixed ? '#8C86A8' : '#FFB03A', bob: false, shadow: false });
      g.style.pointerEvents = 'none';
      return g;
    }
    for (r = 0; r < D.n; r++) {
      for (c = 0; c < D.n; c++) {
        ink(S('rect', { x: ox + c * u - u / 2 + 3, y: oy + r * u - u / 2 + 3, width: u - 6, height: u - 6, rx: 9,
          fill: (r + c) % 2 ? '#F3E3C8' : '#FFF6E6' }, st), 3);
        if (wet(c, r)) {
          ink(S('ellipse', { cx: ox + c * u, cy: oy + r * u + 4, rx: 22, ry: 13, fill: '#6EC6E8' }, st), 3);
          S('ellipse', { cx: ox + c * u - 6, cy: oy + r * u, rx: 8, ry: 3.4, fill: '#FFFFFF', opacity: '.6' }, st);
        }
      }
    }
    cats[D.fixed[0] + ':' + D.fixed[1]] = seat(D.fixed[0], D.fixed[1], true);
    var layer = S('g', {}, st);
    function check() {
      var rows = {}, cols = {}, key, p, ok = true;
      for (key in cats) {
        if (!cats.hasOwnProperty(key) || !cats[key]) { continue; }
        p = key.split(':');
        if (rows[p[1]] || cols[p[0]]) { ok = false; }
        rows[p[1]] = 1; cols[p[0]] = 1;
      }
      if (ok) { done = true; later(BS.win, 320); return; }
      BS.nope();
    }
    for (r = 0; r < D.n; r++) {
      for (c = 0; c < D.n; c++) {
        (function (r, c) {
          var z = G(layer, ox + c * u, oy + r * u), key = c + ':' + r;
          pad(z, u, u);
          tap(z, function () {
            if (done) { return; }
            if (c === D.fixed[0] && r === D.fixed[1]) { BS.nope(cats[key]); return; }
            if (cats[key]) {
              st.removeChild(cats[key]); cats[key] = null; count--;
              BS.SFX.tap();
              return;
            }
            if (wet(c, r) || count >= D.n) { BS.nope(z); return; }
            cats[key] = seat(c, r, false); count++;
            st.appendChild(layer);
            BS.SFX.drop();
            if (count === D.n) { check(); }
          });
        })(r, c);
      }
    }
  }
},

/* ---------- the rule is in the gaps ---------- */
{
  id: 'n-grow', d: 81,
  ask: "The frog's jumps keep growing. Which number does he land on next?",
  hint: 'How big was each jump? From 1 to 2, then 2 to 4, then 4 to 7...',
  tell: 'The jumps are 1, 2, 3, 4, so the next jump is 5. Eleven and five is 16.',
  why: 'The numbers had no simple rule, but the jumps between them did.',
  build: function (st) {
    scene(st, 'water', { hills: false, ground: false });
    var seq = ['1', '2', '4', '7', '11', '?'], i, x;
    for (i = 0; i < 6; i++) {
      x = 36 + i * 57.6;
      if (i < 5) {
        ink(S('path', { d: 'M' + x + ',150 Q' + (x + 28.8) + ',' + (116 - i * 9) + ' ' + (x + 57.6) + ',150', fill: 'none', 'stroke-dasharray': '6 7' }, st), 3.5)
          .setAttribute('stroke', '#FFF6E6');
      }
      ink(S('ellipse', { cx: x, cy: 184, rx: 25, ry: 17, fill: i === 5 ? '#D9F2E2' : '#5FD08A' }, st), 3.5);
      txt(seq[i], { x: x, y: 226, 'font-size': 24, fill: '#241534' }, st);
    }
    animal(st, { kind: 'frog', x: 36 + 4 * 57.6, y: 154, size: 13, fill: '#7FD094', shadow: false });
    BS.chips(['15', '16', '14', '22'], 1);
  }
},

/* ---------- looking down hides the height ---------- */
{
  id: 'n-topview', d: 63.5,
  ask: 'A bird flies straight over the blocks. What does it see?',
  hint: 'From above you cannot tell how tall a pile is. Count the piles, not the blocks.',
  tell: 'Three piles in an L shape. The tall pile still looks like one square from the top.',
  why: 'Four blocks, but only three squares from above. Looking down hides the height.',
  data: { piles: [[0, 0, 2], [1, 0, 1], [0, 1, 1]] },
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var u = 30, cx = 164, cy = 96, P = this.data.piles, i, h;
    function cube(x, y) {
      var g = G(st, x, y);
      ink(S('path', { d: 'M0,' + (-u) + ' L' + u + ',' + (-u / 2) + ' L0,0 L' + (-u) + ',' + (-u / 2) + ' Z', fill: '#FFD98A' }, g), 3);
      ink(S('path', { d: 'M' + (-u) + ',' + (-u / 2) + ' L0,0 L0,' + u + ' L' + (-u) + ',' + (u / 2) + ' Z', fill: '#FF9E4A' }, g), 3);
      ink(S('path', { d: 'M' + u + ',' + (-u / 2) + ' L0,0 L0,' + u + ' L' + u + ',' + (u / 2) + ' Z', fill: '#E0742A' }, g), 3);
    }
    /* back to front, bottom to top */
    var order = P.slice().sort(function (a, b) { return (a[0] + a[1]) - (b[0] + b[1]); });
    for (i = 0; i < order.length; i++) {
      for (h = 0; h < order[i][2]; h++) {
        cube(cx + (order[i][0] - order[i][1]) * u, cy + (order[i][0] + order[i][1]) * u / 2 - h * u);
      }
    }
    animal(st, { kind: 'duck', x: 296, y: 34, size: 11, fill: '#FFE066', shadow: false, flip: true });
    var opts = [
      [[0, 0], [1, 0], [0, 1], [1, 1]],
      [[0, 0], [1, 0], [0, 1]],
      [[0, 0], [0, 1]]
    ];
    options(st, 232, function (g, k) {
      var cells = opts[k], q;
      for (q = 0; q < cells.length; q++) {
        ink(S('rect', { x: -22 + cells[q][0] * 22, y: -22 + cells[q][1] * 22, width: 22, height: 22, rx: 2, fill: '#FFD98A' }, g), 3);
      }
    }, 1, [66, 180, 294], 84);
  }
},

/* ---------- doubling does its biggest work last ---------- */
{
  id: 'n-lily', d: 85,
  ask: 'The lily patch doubles in size every day. On day 6 it covers the whole pond. When was the pond half covered?',
  hint: 'Go backwards from the last day. If it doubled to get there, what was it the day before?',
  tell: 'Doubling a half gives the whole. So it was half covered just one day earlier: day 5.',
  why: 'Half of six is three, and that was the trap. Doubling does its biggest work right at the end.',
  build: function (st) {
    scene(st, 'water', { hills: false, ground: false });
    function pond(x, half, label) {
      ink(S('ellipse', { cx: x, cy: 140, rx: 76, ry: 86, fill: '#4FA8D8' }, st), 4.5);
      var r, c, px, py;
      for (r = 0; r < 6; r++) {
        for (c = 0; c < 5; c++) {
          px = x - 50 + c * 25 + (r % 2) * 6; py = 78 + r * 25;
          if (Math.pow((px - x) / 68, 2) + Math.pow((py - 140) / 78, 2) > 1) { continue; }
          if (half && px > x + 2) { continue; }
          ink(S('circle', { cx: px, cy: py, r: 11, fill: '#5FD08A' }, st), 2.4);
          S('path', { d: 'M' + px + ',' + py + ' l8,-6 l0,10 Z', fill: '#4FA8D8' }, st);
        }
      }
      txt(label, { x: x, y: 262, 'font-size': 20, fill: '#241534' }, st);
    }
    pond(94, true, 'Day ?');
    pond(266, false, 'Day 6');
    BS.chips(['Day 3', 'Day 5', 'Day 4', 'Day 2'], 1);
  }
},

/* ---------- test each idea, throw out the broken ones ---------- */
{
  id: 'n-doors', d: 87,
  ask: 'Only ONE sign tells the truth. Which door hides the treasure?',
  hint: 'Pretend the treasure is behind door 1. How many signs would be true then? Try each door.',
  tell: 'Door 2. Then signs 1 and 2 are both fibs, and only sign 3 is true.',
  why: 'You tested each idea and threw out the ones that broke the rule. Detectives call that elimination.',
  data: { signs: ['here', 'not here', 'not behind 1'] },
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 262 });
    var xs = [66, 180, 294], lines = [['The treasure', 'is here.'], ['It is not', 'in here.'], ['It is not', 'behind door 1.']];
    var cols = ['#F0466F', '#4A9BE8', '#3FBF7F'], done = false;
    for (var i = 0; i < 3; i++) {
      (function (i) {
        var sg = G(st, xs[i], 40);
        ink(S('rect', { x: -54, y: -26, width: 108, height: 52, rx: 9, fill: '#FFF6E6' }, sg), 3.5);
        txt(lines[i][0], { x: 0, y: -4, 'font-size': 14, fill: '#241534' }, sg);
        txt(lines[i][1], { x: 0, y: 14, 'font-size': 14, fill: '#241534' }, sg);
        var g = G(st, xs[i], 170);
        pad(g, 100, 180);
        ink(S('rect', { x: -44, y: -84, width: 88, height: 176, rx: 12, fill: '#6E4A28' }, g), 4);
        var leaf = ink(S('rect', { x: -36, y: -76, width: 72, height: 166, rx: 8, fill: cols[i] }, g), 3.5);
        var hi = S('rect', { x: -28, y: -68, width: 22, height: 150, rx: 6, fill: '#FFFFFF', opacity: '.16' }, g);
        var knob = ink(S('circle', { cx: 22, cy: 8, r: 6, fill: '#FFC93C' }, g), 3);
        var num = txt(String(i + 1), { x: 0, y: -30, 'font-size': 34, fill: '#FFF6E6' }, g);
        tap(g, function () {
          if (done) { return; }
          if (i !== 1) { BS.nope(g); return; }
          done = true;
          leaf.setAttribute('fill', '#2B1B3F');
          hi.setAttribute('opacity', '0'); knob.setAttribute('opacity', '0'); num.setAttribute('opacity', '0');
          ink(S('path', { d: 'M-24,40 L24,40 L24,14 L-24,14 Z', fill: '#C98B52' }, g), 3.5);
          ink(S('path', { d: 'M-24,14 q24,-26 48,0 Z', fill: '#E0A85A' }, g), 3.5);
          ink(S('rect', { x: -5, y: 10, width: 10, height: 12, rx: 2, fill: '#FFC93C' }, g), 2.4);
          star(g, 0, -18, 13, '#FFC93C');
          A.burst(st, xs[i], 160, { n: 10, r: 60 });
          BS.SFX.good();
          later(BS.win, 520);
        });
      })(i);
    }
  }
},

/* ---------- work backwards from the finish ---------- */
{
  id: 'n-nim', d: 88,
  ask: 'Take 1 or 2 berries on your turn. Whoever takes the LAST berry wins. You go first!',
  hint: 'Try to leave the monster with exactly 3 berries. Whatever he takes, you can finish.',
  tell: 'Take 1 first, leaving 6. After that, take whatever makes 3 together with the monster: if he takes 1 you take 2, if he takes 2 you take 1.',
  why: 'You won before the end, by leaving 3. Working backwards from the finish showed you how to start.',
  data: { berries: 7 },
  build: function (st) {
    scene(st, 'forest', { hills: true, groundY: 190 });
    var N = this.data.berries, left = N, busy = false, bs = [], i;
    var mon = critter(st, { x: 300, y: 76, size: 30, fill: '#B58BF0', ears: 'round', horn: true });
    var say = txt('Your turn!', { x: 150, y: 44, 'font-size': 20, fill: '#241534' }, st);
    for (i = 0; i < N; i++) {
      var g = G(st, 42 + i * 46, 150);
      ink(S('circle', { cx: 0, cy: 0, r: 17, fill: A.bodyFill(st, '#E8464C') }, g), 3.5);
      ink(S('path', { d: 'M-2,-16 q-8,-8 -12,-4 M2,-16 q8,-8 12,-4', fill: 'none' }, g), 3).setAttribute('stroke', '#3FBF7F');
      bs.push(g);
    }
    function take(n, mine) {
      for (var k = 0; k < n; k++) {
        var g = bs[N - left];
        left--;
        if (mine) { glide(g, 60 + ((N - left) % 4) * 26, 286, 300); }
        else { glide(g, 300, 96, 300); (function (g) { later(function () { g.setAttribute('opacity', '0'); }, 320); })(g); }
      }
    }
    function reset() {
      left = N;
      for (var k = 0; k < N; k++) { bs[k].setAttribute('opacity', '1'); glide(bs[k], 42 + k * 46, 150, 300); }
      say.textContent = 'Your turn!';
      busy = false;
    }
    function monster() {
      /* he plays perfectly whenever he can: leave a multiple of three */
      var n = left % 3;
      if (n === 0) { n = 1; }
      n = Math.min(n, left);
      take(n, false);
      BS.SFX.drop();
      say.textContent = 'He took ' + n + '.';
      if (left === 0) {
        later(function () { say.textContent = 'He got the last one!'; BS.nope(mon); later(reset, 1100); }, 400);
        return;
      }
      later(function () { say.textContent = 'Your turn!'; busy = false; }, 500);
    }
    function mine(n) {
      if (busy) { return; }
      if (n > left) { BS.nope(); return; }
      busy = true;
      take(n, true);
      BS.SFX.good();
      if (left === 0) { say.textContent = 'You got it!'; later(BS.win, 420); return; }
      say.textContent = '...';
      later(monster, 800);
    }
    button(st, 110, 236, 130, 'Take 1', '#FFC93C', function () { mine(1); }, 40);
    button(st, 250, 236, 130, 'Take 2', '#FFC93C', function () { mine(2); }, 40);
  }
}

  ];
})());
