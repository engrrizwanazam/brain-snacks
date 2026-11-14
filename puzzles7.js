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

/* ---------- doubling does its biggest work last ---------- */

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
