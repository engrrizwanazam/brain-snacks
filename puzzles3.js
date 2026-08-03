/* ==========================================================
   Brain Snacks — puzzles 33-56. A serious step up.
   Multi-step state puzzles (Hanoi, river crossing, water jugs),
   abstract reasoning (matrices, analogies), and real deduction.
   ========================================================== */

var PUZZLES_EXPERT = (function () {
  'use strict';

  var A = ART;
  var S = A.S, G = A.G, ink = A.ink, txt = A.txt, place = A.place;
  var animal = A.animal, star = A.star, scene = A.scene, critter = A.critter;
  var tap = BS.tap, drag = BS.drag, glide = BS.glide;

  function pad(g, w, h, dy) {
    return S('rect', { x: -w / 2, y: -h / 2 + (dy || 0), width: w, height: h, rx: 10,
      fill: '#FFFFFF', opacity: '0', 'pointer-events': 'all' }, g);
  }
  /* A corn cob: fat yellow ellipse, rows of kernels, two husk leaves.
     The old one was a plain yellow blob with a leaf and read as a mango. */
  function cob(parent, x, y) {
    var g = G(parent, x, y), r, k;
    ink(S('path', { d: 'M-9,16 q-14,-6 -13,-22 q0,-9 4,-14 q10,10 12,26 Z', fill: '#4FBF7A' }, g), 3);
    ink(S('path', { d: 'M9,16 q14,-6 13,-22 q0,-9 -4,-14 q-10,10 -12,26 Z', fill: '#5FD08A' }, g), 3);
    ink(S('path', { d: 'M0,-22 q11,0 11,13 q0,17 -11,27 q-11,-10 -11,-27 q0,-13 11,-13 Z', fill: '#FFD84A' }, g), 3.5);
    for (r = 0; r < 5; r++) {
      for (k = 0; k < 3; k++) {
        S('circle', { cx: -5 + k * 5 + (r % 2 ? 2.5 : 0), cy: -13 + r * 6,
          r: 2, fill: '#E8A317', opacity: '.8' }, g);
      }
    }
    return g;
  }


  /* ---------- shared ferry engine ----------
     Used by the two ramp puzzles AND the real river crossing, so all three
     feel identical to operate and only the rules change underneath.
     cfg: { rows:[{key,y,make}], seats, rower, unsafe(farBankKeys) } */
  function ferry(st, cfg) {
    scene(st, 'water', { hills: false, ground: false, vignette: false });
    S('rect', { x: 0, y: 0, width: 120, height: 300, fill: '#7FC98F' }, st);
    S('rect', { x: 240, y: 0, width: 120, height: 300, fill: '#7FC98F' }, st);
    S('rect', { x: 120, y: 0, width: 120, height: 300, fill: '#5FB6DE' }, st);
    var i;
    for (i = 0; i < 5; i++) {
      ink(S('path', { d: 'M128,' + (40 + i * 56) + ' q14,-9 28,0 t28,0 t28,0', fill: 'none' }, st), 3)
        .setAttribute('stroke', '#8FD3EF');
    }
    var rows = cfg.rows, seats = cfg.seats || 1;
    var side = {}, art = {}, ly = {}, cargo = [], boat = 0, busy = false;
    for (i = 0; i < rows.length; i++) {
      side[rows[i].key] = 0;
      ly[rows[i].key] = rows[i].y;
      art[rows[i].key] = rows[i].make(st);
    }
    var boatG = G(st, 136, 236);
    ink(S('path', { d: 'M-40,-8 L40,-8 L28,20 L-28,20 Z', fill: '#B07A4C' }, boatG), 4);
    ink(S('line', { x1: 0, y1: -8, x2: 0, y2: -40 }, boatG), 4);
    ink(S('path', { d: 'M2,-40 L30,-24 L2,-14 Z', fill: '#FFF6E6' }, boatG), 3.5);

    function inCargo(k) {
      for (var j = 0; j < cargo.length; j++) { if (cargo[j] === k) { return j; } }
      return -1;
    }
    function positions(anim) {
      for (var j = 0; j < rows.length; j++) {
        var k = rows[j].key, ci = inCargo(k), tx, ty;
        if (ci >= 0) { tx = boatG.__x + (seats > 1 ? (ci * 32 - 16) : 0); ty = 224; }
        else { tx = side[k] ? 314 : 46; ty = ly[k]; }
        if (anim) { glide(art[k], tx, ty, 260); } else { place(art[k], tx, ty); }
      }
    }
    function farBank() {
      var out = [], j, away = 1 - boat;
      for (j = 0; j < rows.length; j++) {
        if (side[rows[j].key] === away && inCargo(rows[j].key) < 0) { out.push(rows[j].key); }
      }
      return out;
    }
    function loadTap(k) {
      if (busy) { return; }
      var ci = inCargo(k);
      if (ci >= 0) { cargo.splice(ci, 1); positions(true); BS.SFX.tap(); return; }
      if (side[k] !== boat || cargo.length >= seats) { BS.nope(art[k]); return; }
      cargo.push(k); positions(true); BS.SFX.grab();
    }
    for (i = 0; i < rows.length; i++) {
      (function (k) { tap(art[k], function () { loadTap(k); }); })(rows[i].key);
    }
    tap(boatG, function () {
      if (busy) { return; }
      /* somebody has to row -- this rejection IS the lesson in the ramp puzzle */
      if (cfg.rower && inCargo(cfg.rower) < 0) { BS.nope(boatG); return; }
      busy = true;
      var to = 1 - boat, j;
      for (j = 0; j < cargo.length; j++) { side[cargo[j]] = to; }
      boat = to;
      glide(boatG, to ? 224 : 136, 236, 420);
      setTimeout(function () {
        cargo = [];
        positions(true);
        setTimeout(function () {
          busy = false;
          if (cfg.unsafe && cfg.unsafe(farBank())) {
            BS.nope();
            setTimeout(function () {
              for (var q = 0; q < rows.length; q++) { side[rows[q].key] = 0; }
              boat = 0; cargo = [];
              glide(boatG, 136, 236, 300);
              positions(true);
            }, 500);
            return;
          }
          for (var q = 0; q < rows.length; q++) { if (side[rows[q].key] !== 1) { return; } }
          BS.win();
        }, 300);
      }, 430);
    });
    positions(false);
  }
  function onBank(list, k) {
    for (var i = 0; i < list.length; i++) { if (list[i] === k) { return true; } }
    return false;
  }

  /* ---------- shared jug engine ----------
     Same board for all three jug puzzles; only the target changes, so the
     easy ones teach the controls that the hard one assumes you know. */
  function jugGame(st, big, small, target) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 252, vignette: false });
    var cap = [big, small], vol = [0, 0];
    var jx = [92, 268], jw = [58, 46], jh = [132, 94], jy = 130;
    var fills = [], labels = [], i;
    for (i = 0; i < 2; i++) {
      (function (i) {
        var g = G(st, jx[i], jy);
        ink(S('rect', { x: -jw[i] / 2, y: -jh[i] / 2, width: jw[i], height: jh[i], rx: 9,
          fill: '#EAF6FA', opacity: '.92' }, g), 4);
        var f = S('rect', { x: -jw[i] / 2 + 4, y: jh[i] / 2 - 4, width: jw[i] - 8, height: 0, fill: '#4FA8D8' }, g);
        fills.push(f);
        labels.push(txt('0', { x: 0, y: -jh[i] / 2 - 12, 'font-size': 21, fill: '#241534' }, g));
        txt(cap[i] + '-cup jug', { x: 0, y: jh[i] / 2 + 22, 'font-size': 12, fill: '#241534', opacity: '.6' }, g);
      })(i);
    }
    function paint() {
      for (var k = 0; k < 2; k++) {
        var h = (jh[k] - 8) * (vol[k] / cap[k]);
        fills[k].setAttribute('height', h);
        fills[k].setAttribute('y', jh[k] / 2 - 4 - h);
        labels[k].textContent = String(vol[k]);
      }
      if (vol[0] === target || vol[1] === target) { setTimeout(BS.win, 400); }
    }
    function button(x, y, w, label, col, fn) {
      var g = G(st, x, y);
      pad(g, w + 12, 44);
      ink(S('rect', { x: -w / 2, y: -17, width: w, height: 34, rx: 9, fill: col }, g), 3.5);
      txt(label, { x: 0, y: 6, 'font-size': 14, fill: '#241534' }, g);
      tap(g, function () { fn(); BS.SFX.drop(); paint(); });
    }
    /* one Fill and one Empty for EACH jug, or the puzzle cannot be solved */
    button(50, 244, 78, 'Fill ' + big, '#FFC93C', function () { vol[0] = big; });
    button(136, 244, 84, 'Empty ' + big, '#F0466F', function () { vol[0] = 0; });
    button(224, 244, 78, 'Fill ' + small, '#FFC93C', function () { vol[1] = small; });
    button(310, 244, 84, 'Empty ' + small, '#F0466F', function () { vol[1] = 0; });
    button(180, 96, 80, big + ' \u2192 ' + small, '#6EC6E8', function () {
      var can = Math.min(vol[0], cap[1] - vol[1]); vol[0] -= can; vol[1] += can;
    });
    button(180, 152, 80, small + ' \u2192 ' + big, '#6EC6E8', function () {
      var can = Math.min(vol[1], cap[0] - vol[0]); vol[1] -= can; vol[0] += can;
    });
    paint();
  }


  /* the cast of the river puzzles, shared so the ramp looks like the real one */
  var RIVER_ROWS = [
    { key: 'fox', y: 66, make: function (st) { return animal(st, { kind: 'fox', x: 46, y: 66, size: 14, fill: '#E8722F', bob: false }); } },
    { key: 'hen', y: 150, make: function (st) { return animal(st, { kind: 'duck', x: 46, y: 150, size: 15, fill: '#FFF0C0', bob: false }); } },
    { key: 'corn', y: 232, make: function (st) { return cob(st, 46, 232); } }
  ];
  function RIVER_UNSAFE(away) {
    if (!onBank(away, 'hen')) { return false; }
    return onBank(away, 'fox') || onBank(away, 'corn');
  }

  function hit(x, y, tx, ty, r) { return Math.abs(x - tx) < (r || 44) && Math.abs(y - ty) < (r || 44); }

  /* a shape in one call — used constantly by the reasoning puzzles */
  function glyph(parent, kind, size, fill, stroke) {
    var e;
    if (kind === 'circle') { e = S('circle', { cx: 0, cy: 0, r: size, fill: fill }, parent); }
    else if (kind === 'square') { e = S('rect', { x: -size, y: -size, width: size * 2, height: size * 2, rx: size * .2, fill: fill }, parent); }
    else if (kind === 'triangle') { e = S('path', { d: 'M0,' + (-size * 1.1) + ' L' + size + ',' + (size * .8) + ' L' + (-size) + ',' + (size * .8) + ' Z', fill: fill }, parent); }
    else if (kind === 'diamond') { e = S('path', { d: 'M0,' + (-size * 1.15) + ' L' + size + ',0 L0,' + (size * 1.15) + ' L' + (-size) + ',0 Z', fill: fill }, parent); }
    else if (kind === 'star') { return star(parent, 0, 0, size * 1.15, fill, stroke === 0 ? 0 : 3); }
    else { e = S('ellipse', { cx: 0, cy: 0, rx: size * 1.15, ry: size * .72, fill: fill }, parent); }
    if (stroke !== 0) { ink(e, stroke || 3); }
    return e;
  }

  /* a framed cell for matrix puzzles */
  function frame(parent, x, y, w, h, fill) {
    var g = G(parent, x, y);
    ink(S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 9, fill: fill || '#FFF6E6' }, g), 3);
    return g;
  }

  /* three tappable options along the bottom */
  function options(st, y, draw, rightIndex, xs) {
    xs = xs || [72, 180, 288];
    for (var i = 0; i < xs.length; i++) {
      (function (i) {
        var g = G(st, xs[i], y);
        pad(g, 92, 92);
        ink(S('rect', { x: -40, y: -40, width: 80, height: 80, rx: 12, fill: '#FFF6E6' }, g), 3);
        draw(g, i);
        tap(g, function () { if (i === rightIndex) { BS.win(); } else { BS.nope(g); } });
      })(i);
    }
  }

  return [

/* 33 — Raven-style matrix: two rules at once */
{
  ask: 'What belongs in the empty square?',
  hint: 'Read across: what changes? Now read down: what changes?',
  tell: 'Going across the shape changes, going down the colour changes. It needs a green star.',
  why: 'Two rules were running at once — one across, one down. You had to hold both.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var shapes = ['circle', 'square', 'star'];
    var cols = ['#F0466F', '#6EC6E8', '#3FBF7F'];
    var r, c, g;
    for (r = 0; r < 3; r++) {
      for (c = 0; c < 3; c++) {
        g = frame(st, 74 + c * 84, 46 + r * 66, 72, 58);
        if (r === 2 && c === 2) {
          txt('?', { x: 0, y: 12, 'font-size': 30, fill: '#8A7BA8' }, g);
        } else {
          glyph(g, shapes[c], 17, cols[r]);
        }
      }
    }
    options(st, 258, function (g, i) {
      var opt = [
        { s: 'star', c: '#6EC6E8' },
        { s: 'star', c: '#3FBF7F' },
        { s: 'square', c: '#3FBF7F' }
      ][i];
      glyph(g, opt.s, 22, opt.c);
    }, 1);
  }
},

/* 34 — number pyramid */
{
  ask: 'Each brick is the two under it added together.',
  hint: 'The brick above 4 and 5 is 9. Work out the missing one the same way.',
  tell: 'It sits above 5 and 3, so it is 8.',
  why: 'You worked upward through a chain, using each answer to get the next.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 250, vignette: false });
    var rows = [[4, 5, 3], [9, null], [null]];
    rows[1][1] = 8; rows[2][0] = 17;
    function brick(x, y, label, quiz) {
      var g = G(st, x, y);
      ink(S('rect', { x: -34, y: -23, width: 68, height: 46, rx: 8,
        fill: quiz ? '#FFF6E6' : '#FFC93C' }, g), 4);
      S('rect', { x: -26, y: -16, width: 30, height: 9, rx: 4, fill: '#FFFFFF', opacity: '.3' }, g);
      txt(quiz ? '?' : String(label), { x: 0, y: 11, 'font-size': 26, fill: '#241534' }, g);
    }
    brick(180, 54, 17, false);
    brick(140, 116, 9, false);
    brick(220, 116, 0, true);
    brick(100, 178, 4, false);
    brick(180, 178, 5, false);
    brick(260, 178, 3, false);
    BS.chips(['6', '7', '8', '9'], 2);
  }
},

/* 35 — Tower of Hanoi, three discs */
{
  ask: 'Move the whole stack to the last peg. Never put a big disc on a small one.',
  hint: 'Start by moving the smallest disc to the far peg, not the middle one.',
  tell: 'Small to peg 3, medium to peg 2, small onto medium, big to peg 3, then rebuild.',
  why: 'Seven moves, and every one had to be right. You planned instead of guessing.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 236, vignette: false });
    var px = [70, 180, 290];
    var pegs = [[3, 2, 1], [], []];   /* biggest first */
    var discs = {}, sel = -1, i;
    for (i = 0; i < 3; i++) {
      ink(S('rect', { x: px[i] - 5, y: 96, width: 10, height: 142, rx: 5, fill: '#8A5F3B' }, st), 4);
      ink(S('rect', { x: px[i] - 52, y: 226, width: 104, height: 14, rx: 6, fill: '#6E4A28' }, st), 4);
    }
    var COL = { 1: '#F0466F', 2: '#FFC93C', 3: '#6EC6E8' };
    var WID = { 1: 30, 2: 40, 3: 50 };
    function yFor(slot) { return 210 - slot * 30; }
    function draw(size) {
      var g = G(st, 0, 0);
      pad(g, WID[size] * 2 + 14, 40);
      ink(S('rect', { x: -WID[size], y: -14, width: WID[size] * 2, height: 28, rx: 12, fill: COL[size] }, g), 4);
      S('rect', { x: -WID[size] + 8, y: -9, width: WID[size], height: 8, rx: 4, fill: '#FFFFFF', opacity: '.3' }, g);
      discs[size] = g;
      return g;
    }
    draw(3); draw(2); draw(1);
    function layout(anim) {
      for (var p = 0; p < 3; p++) {
        for (var s = 0; s < pegs[p].length; s++) {
          var d = discs[pegs[p][s]];
          if (anim) { glide(d, px[p], yFor(s), 190); } else { place(d, px[p], yFor(s)); }
        }
      }
    }
    layout(false);
    var marks = [];
    for (i = 0; i < 3; i++) {
      (function (i) {
        var z = G(st, px[i], 160);
        pad(z, 108, 170);
        var ring = ink(S('rect', { x: -54, y: -86, width: 108, height: 172, rx: 12, fill: 'none' }, z), 4);
        ring.setAttribute('stroke', '#FF8A3D');
        ring.setAttribute('opacity', '0');
        marks.push(ring);
        tap(z, function () { poke(i); });
      })(i);
    }
    function poke(p) {
      if (sel === -1) {
        if (!pegs[p].length) { BS.nope(); return; }
        sel = p; marks[p].setAttribute('opacity', '1'); BS.SFX.tap();
        return;
      }
      marks[sel].setAttribute('opacity', '0');
      if (sel === p) { sel = -1; return; }
      var from = pegs[sel], to = pegs[p];
      var d = from[from.length - 1];
      if (to.length && to[to.length - 1] < d) { BS.nope(discs[d]); sel = -1; return; }
      from.pop(); to.push(d);
      sel = -1;
      BS.SFX.drop();
      layout(true);
      if (pegs[2].length === 3) { setTimeout(BS.win, 420); }
    }
  }
},

/* 36 — coins: reach an exact total, and take one back when you overshoot */
{
  ask: 'Pay exactly 8. Tap a coin to drop it in the purse. Tap it again to take it back.',
  hint: 'Start with the biggest coin, then work out how much more you still need.',
  tell: 'Drop in the 5, then a 2, then a 1. That makes exactly 8.',
  why: 'There was only one way to make 8, and you had to take coins back out to find it.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 272, vignette: false });
    var vals = [5, 5, 2, 2, 1, 1], up = [], coins = [], i;
    var homeX = [40, 96, 152, 208, 264, 320];   /* r=21, so 19..341 inside a 360 stage */
    var HOME_Y = 236, PURSE_Y = 150;
    ink(S('path', { d: 'M84,104 L276,104 L262,192 L98,192 Z', fill: '#B58BF0' }, st), 4);
    var tot = txt('0', { x: 180, y: 82, 'font-size': 30, fill: '#241534' }, st);

    function sum() {
      var t = 0, j;
      for (j = 0; j < 6; j++) { if (up[j]) { t += vals[j]; } }
      return t;
    }
    function refresh() {
      var t = sum();
      tot.textContent = String(t);
      if (t === 8) { setTimeout(BS.win, 380); }
    }
    for (i = 0; i < 6; i++) {
      (function (i) {
        var g = G(st, homeX[i], HOME_Y);
        ink(S('circle', { cx: 0, cy: 0, r: 21, fill: '#FFC93C' }, g), 3.5);
        S('circle', { cx: 0, cy: 0, r: 15, fill: '#FFDE7A' }, g);
        txt(String(vals[i]), { x: 0, y: 7, 'font-size': 19, fill: '#241534' }, g);
        pad(g, 50, 50);
        up[i] = false; coins[i] = g;
        tap(g, function () {
          up[i] = !up[i];
          glide(g, up[i] ? 112 + i * 27 : homeX[i], up[i] ? PURSE_Y : HOME_Y, 220);
          BS.SFX.tap();
          refresh();
        });
      })(i);
    }
    refresh();
  }
},

/* 37 — lamps: one tap changes three lights, so moves interfere */
{
  ask: 'Turn every lamp on. Tapping a lamp also changes the ones either side of it.',
  hint: 'Tapping the middle of three dark lamps lights all three at once.',
  tell: 'Tap the first lamp, then the third, then the fifth \u2014 the dark ones.',
  why: 'Each tap changed three lamps at once, so you had to think about what a move breaks as well as what it fixes.',
  build: function (st) {
    scene(st, 'night', { hills: false, vignette: false });
    var on = [false, true, false, true, false];
    var bulbs = [], glows = [], i;
    function paint() {
      var lit = 0, j;
      for (j = 0; j < 5; j++) {
        bulbs[j].setAttribute('fill', on[j] ? '#FFDE7A' : '#4A3D75');
        glows[j].setAttribute('opacity', on[j] ? '.30' : '0');
        if (on[j]) { lit++; }
      }
      if (lit === 5) { setTimeout(BS.win, 400); }
    }
    for (i = 0; i < 5; i++) {
      (function (i) {
        var x = 48 + i * 66, g = G(st, x, 150);
        ink(S('line', { x1: 0, y1: -104, x2: 0, y2: -34 }, g), 3).setAttribute('stroke', '#6E5EA8');
        glows[i] = S('circle', { cx: 0, cy: 0, r: 40, fill: '#FFDE7A', opacity: '0' }, g);
        bulbs[i] = ink(S('circle', { cx: 0, cy: 0, r: 22, fill: '#4A3D75' }, g), 3.5);
        ink(S('rect', { x: -9, y: -38, width: 18, height: 12, rx: 3, fill: '#C0B4E0' }, g), 3);
        pad(g, 62, 62);
        tap(g, function () {
          var j;
          for (j = i - 1; j <= i + 1; j++) { if (j >= 0 && j < 5) { on[j] = !on[j]; } }
          BS.SFX.tap(); paint();
        });
      })(i);
    }
    paint();
  }
},

/* 38 — stepping stones: hop one or two, never further */
{
  ask: 'Hop the frog to the last stone. It can jump to the next stone, or over one \u2014 never further.',
  hint: 'Some stones are too far apart to reach. Look at the gaps before you jump.',
  tell: 'Hop to the 2nd stone, then over the gap, then next, then over the gap, then the last.',
  why: 'You worked out the whole route before the first hop, because a wrong jump has nowhere to land.',
  build: function (st) {
    scene(st, 'water', { hills: false, ground: false, vignette: false });
    S('rect', { x: 0, y: 96, width: 360, height: 128, fill: '#5FB6DE' }, st);
    var i;
    for (i = 0; i < 4; i++) {
      ink(S('path', { d: 'M20,' + (116 + i * 30) + ' q16,-9 32,0 t32,0 t32,0 t32,0 t32,0 t32,0 t32,0 t32,0 t32,0', fill: 'none' }, st), 3)
        .setAttribute('stroke', '#8FD3EF');
    }
    var HAS = [0, 1, 3, 4, 6, 7], at = 0, busy = false;
    function px(i) { return 30 + i * 43; }
    function py(i) { return 160 + (i % 2 ? 16 : -16); }
    var pads = {};
    for (i = 0; i < HAS.length; i++) {
      (function (k) {
        var g = G(st, px(k), py(k));
        ink(S('ellipse', { cx: 0, cy: 0, rx: 22, ry: 15, fill: '#9E8A7A' }, g), 3.5);
        S('ellipse', { cx: -4, cy: -4, rx: 11, ry: 6, fill: '#BCA895', opacity: '.7' }, g);
        pad(g, 54, 46);
        pads[k] = g;
        tap(g, function () {
          if (busy) { return; }
          var step = k - at;
          if (step !== 1 && step !== 2) { BS.nope(g); return; }
          busy = true; at = k;
          glide(frog, px(k), py(k) - 20, 240);
          BS.SFX.grab();
          setTimeout(function () {
            busy = false;
            if (at === 7) { BS.win(); }
          }, 280);
        });
      })(HAS[i]);
    }
    var frog = animal(st, { kind: 'bunny', x: px(0), y: py(0) - 20, size: 13, fill: '#3FBF7F', bob: false });
    A.lift(st);
  }
},

/* 39 — seat them by two rules at once */
{
  ask: 'Sit all three on the bench. The cat sits in the middle, and the mouse wants the seat by the window.',
  hint: 'Only one seat is left once the cat and the mouse have theirs.',
  tell: 'Dog on the left, cat in the middle, mouse on the right by the window.',
  why: 'Two rules together left exactly one arrangement. You checked both at once instead of guessing.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 276, vignette: false });
    ink(S('rect', { x: 268, y: 26, width: 74, height: 74, rx: 8, fill: '#8FD3EF' }, st), 4);
    ink(S('line', { x1: 305, y1: 26, x2: 305, y2: 100 }, st), 3);
    var SX = [92, 180, 268], SY = 150, TY = 244;
    var i;
    for (i = 0; i < 3; i++) {
      ink(S('rect', { x: SX[i] - 38, y: SY + 22, width: 76, height: 14, rx: 5, fill: '#C08D57' }, st), 3.5);
    }
    var who = ['dog', 'cat', 'mouse'];
    var col = { dog: '#E8A33D', cat: '#FF8A3D', mouse: '#C9BFD6' };
    var seat = [null, null, null], art = {}, home = {}, busy = false;
    for (i = 0; i < 3; i++) {
      (function (i) {
        var k = who[i];
        home[k] = SX[i];
        art[k] = animal(st, { kind: k, x: SX[i], y: TY, size: 13, fill: col[k], bob: false });
      })(i);
    }
    function seatOf(k) {
      var j;
      for (j = 0; j < 3; j++) { if (seat[j] === k) { return j; } }
      return -1;
    }
    function check() {
      if (seat[0] === 'dog' && seat[1] === 'cat' && seat[2] === 'mouse') { setTimeout(BS.win, 300); }
    }
    for (i = 0; i < 3; i++) {
      (function (k) {
        tap(art[k], function () {
          if (busy) { return; }
          var cur = seatOf(k), j;
          if (cur >= 0) {                       /* already sitting: get up */
            seat[cur] = null;
            glide(art[k], home[k], TY, 240); BS.SFX.tap(); return;
          }
          for (j = 0; j < 3; j++) { if (!seat[j]) { break; } }
          if (j > 2) { BS.nope(art[k]); return; }
          seat[j] = k;
          glide(art[k], SX[j], SY, 240); BS.SFX.grab();
          setTimeout(check, 260);
        });
      })(who[i]);
    }
    for (i = 0; i < 3; i++) {
      (function (j) {
        var g = G(st, SX[j], SY);
        pad(g, 72, 74);
        tap(g, function () {
          if (busy || seat[j]) { return; }
          var k = null, m;
          for (m = 0; m < 3; m++) { if (seatOf(who[m]) < 0) { k = who[m]; break; } }
          if (!k) { return; }
          seat[j] = k;
          glide(art[k], SX[j], SY, 240); BS.SFX.grab();
          setTimeout(check, 260);
        });
      })(i);
    }
    A.lift(st);
  }
},

/* 40 — the lift: the only way up is to go down twice */
{
  ask: 'Ride the lift to floor 6. It only goes up 3 floors or down 2.',
  hint: 'Floor 6 is not three above any floor you can reach going straight up. Try going down.',
  tell: 'Up to 4, down to 2, up to 5, down to 3, then up to 6.',
  why: 'You went downwards twice on purpose to get higher. Going the wrong way was the only way.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 280, vignette: false });
    var FY = [0, 246, 206, 166, 126, 86, 46], at = 1, busy = false;
    var i;
    for (i = 1; i <= 6; i++) {
      ink(S('line', { x1: 96, y1: FY[i] + 20, x2: 264, y2: FY[i] + 20 }, st), 3)
        .setAttribute('stroke', '#C08D57');
      txt(String(i), { x: 76, y: FY[i] + 12, 'font-size': 16, fill: '#241534', opacity: '.65' }, st);
    }
    ink(S('rect', { x: 264, y: 30, width: 4, height: 236, fill: '#C08D57' }, st), 0);
    var car = G(st, 180, FY[1]);
    ink(S('rect', { x: -34, y: -22, width: 68, height: 42, rx: 6, fill: '#6EC6E8' }, car), 4);
    ink(S('line', { x1: 0, y1: -22, x2: 0, y2: 20 }, car), 3);
    function button(x, label, col, d) {
      var g = G(st, x, 270);
      pad(g, 130, 44);
      ink(S('rect', { x: -60, y: -18, width: 120, height: 36, rx: 9, fill: col }, g), 3.5);
      txt(label, { x: 0, y: 6, 'font-size': 15, fill: '#241534' }, g);
      tap(g, function () {
        if (busy) { return; }
        var n = at + d;
        if (n < 1 || n > 6) { BS.nope(g); return; }
        busy = true; at = n;
        glide(car, 180, FY[n], 340); BS.SFX.drop();
        setTimeout(function () {
          busy = false;
          if (at === 6) { BS.win(); }
        }, 380);
      });
    }
    button(96, 'Up 3', '#3FBF7F', 3);
    button(258, 'Down 2', '#F0466F', -2);
    A.lift(st);
  }
},

/* 41 — river crossing: the real one */
{
  ask: 'Get all three across. The boat holds one. Alone, the fox eats the hen and the hen eats the corn.',
  hint: 'The hen is the problem. She cannot be left with either of the others.',
  tell: 'Take the hen over, come back, take the fox, bring the hen BACK, take the corn, then fetch the hen.',
  why: 'You had to undo your own progress on purpose. Sometimes going backwards is the way forward.',
  build: function (st) {
    ferry(st, {
      seats: 1,
      rows: RIVER_ROWS,
      unsafe: RIVER_UNSAFE
    });
  }
},

/* 42 — water jugs: the real one */
{
  ask: 'Measure exactly 4 cups. You only have a 5-cup jug and a 3-cup jug.',
  hint: 'Fill the big one, then use the small one to take exactly 3 away.',
  tell: 'Fill 5. Pour into 3, leaving 2. Empty the 3. Move the 2 across. Fill 5 again and top up the 3 \u2014 that takes 1, leaving 4.',
  why: 'No jug is marked. You measured by what was left over, which is a whole way of thinking.',
  build: function (st) { jugGame(st, 5, 3, 4); }
},

/* 38 — which net folds into the cube */
{
  ask: 'Which one folds up into this box?',
  hint: 'A box has six faces. Count the squares first, then check they are not stacked in a line of five.',
  tell: 'The middle one — six squares in a cross shape.',
  why: 'You imagined flat paper turning into a solid box. That is proper 3D thinking.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var box = G(st, 180, 62);
    ink(S('path', { d: 'M-34,-14 L0,-34 L34,-14 L34,26 L0,46 L-34,26 Z', fill: '#FFC93C' }, box), 4);
    ink(S('path', { d: 'M-34,-14 L0,6 L34,-14 M0,6 L0,46', fill: 'none' }, box), 4);
    S('path', { d: 'M-34,-14 L0,-34 L0,6 Z', fill: '#FFFFFF', opacity: '.25' }, box);

    var nets = [
      [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
      [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]],
      [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [0, 3]]
    ];
    for (var i = 0; i < 3; i++) {
      (function (i) {
        var g = G(st, 68 + i * 112, 200);
        pad(g, 104, 150);
        var cells = nets[i], k, u = 17;
        for (k = 0; k < cells.length; k++) {
          ink(S('rect', {
            x: (cells[k][0] - 1.5) * u, y: (cells[k][1] - 1.5) * u,
            width: u, height: u, fill: '#6EC6E8'
          }, g), 2.6);
        }
        tap(g, function () { if (i === 1) { BS.win(); } else { BS.nope(g); } });
      })(i);
    }
  }
},

/* 39 — count the cubes, including hidden ones */
{
  ask: 'How many blocks are in this stack?',
  hint: 'Some blocks are holding up the ones on top. You cannot see them, but they must be there.',
  tell: 'Six you can see, and one hidden underneath. Seven.',
  why: 'You counted something you could not see, because it had to be there.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var u = 30;
    function cube(x, y, top, left, right) {
      var g = G(st, x, y);
      ink(S('path', { d: 'M0,' + (-u) + ' L' + u + ',' + (-u / 2) + ' L0,0 L' + (-u) + ',' + (-u / 2) + ' Z', fill: top }, g), 3);
      ink(S('path', { d: 'M' + (-u) + ',' + (-u / 2) + ' L0,0 L0,' + u + ' L' + (-u) + ',' + (u / 2) + ' Z', fill: left }, g), 3);
      ink(S('path', { d: 'M' + u + ',' + (-u / 2) + ' L0,0 L0,' + u + ' L' + u + ',' + (u / 2) + ' Z', fill: right }, g), 3);
    }
    var T = '#8FD3F0', L = '#4A9BE8', R = '#2F7FC4';
    /* bottom row of three, one hidden behind; two on the next level; one on top */
    cube(120, 216, T, L, R);
    cube(180, 246, T, L, R);
    cube(240, 216, T, L, R);
    cube(150, 172, T, L, R);
    cube(210, 172, T, L, R);
    cube(180, 128, T, L, R);
    txt('one block is hidden behind', { x: 180, y: 288, 'font-size': 12, fill: '#241534', opacity: '.5' }, st);
    BS.chips(['6', '7', '8', '9'], 1);
  }
},

/* 40 — gear direction */
{
  ask: 'The first gear turns this way. Which way does the last one turn?',
  hint: 'Gears that touch always turn opposite ways. Count along the chain.',
  tell: 'There are four gears, so the last one turns the opposite way — anticlockwise.',
  why: 'Every gear flips the direction. With four of them, the answer flips three times.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false, vignette: false });
    var xs = [64, 146, 228, 306], rs = [34, 30, 34, 28];
    for (var i = 0; i < 4; i++) {
      var g = G(st, xs[i], 128);
      var teeth = 10, k, ang;
      for (k = 0; k < teeth; k++) {
        ang = k * Math.PI * 2 / teeth;
        ink(S('rect', {
          x: -5, y: -rs[i] - 8, width: 10, height: 12, rx: 2,
          fill: i === 3 ? '#F0466F' : '#8A7BA8',
          transform: 'rotate(' + (k * 360 / teeth) + ')'
        }, g), 2.4);
      }
      ink(S('circle', { cx: 0, cy: 0, r: rs[i], fill: i === 3 ? '#FF8FA6' : '#B6A9CE' }, g), 4);
      ink(S('circle', { cx: 0, cy: 0, r: rs[i] * .3, fill: '#FFF6E6' }, g), 3);
    }
    /* the arrow on gear 1 */
    ink(S('path', { d: 'M64,72 a34,34 0 0 1 30,18', fill: 'none' }, st), 5).setAttribute('stroke', '#3FBF7F');
    ink(S('path', { d: 'M92,84 L98,94 L86,95 Z', fill: '#3FBF7F' }, st), 2);

    options(st, 236, function (g, i) {
      var cw = (i === 0);
      if (i === 2) {
        txt('?', { x: 0, y: 12, 'font-size': 34, fill: '#8A7BA8' }, g);
        return;
      }
      ink(S('circle', { cx: 0, cy: 0, r: 24, fill: 'none' }, g), 5).setAttribute('stroke', '#3FBF7F');
      var d = cw ? 'M22,-8 L28,4 L15,4 Z' : 'M-22,-8 L-28,4 L-15,4 Z';
      ink(S('path', { d: d, fill: '#3FBF7F' }, g), 2);
      txt(cw ? 'this way' : 'that way', { x: 0, y: 40, 'font-size': 11, fill: '#241534', opacity: '.6' }, g);
    }, 1);
  }
},

/* 41 — four-by-four sudoku with shapes */
{
  ask: 'Every row and every column needs all four shapes, once each.',
  hint: 'Find a row that only has one empty square. That one is forced.',
  tell: 'Work out the forced squares first, then the rest follow.',
  why: 'You used what could NOT go somewhere to work out what had to. That is real deduction.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var SH = ['circle', 'square', 'triangle', 'star'];
    var COL = ['#F0466F', '#6EC6E8', '#3FBF7F', '#FFC93C'];
    /* a valid grid, then blanks */
    var sol = [[0, 1, 2, 3], [2, 3, 0, 1], [1, 0, 3, 2], [3, 2, 1, 0]];
    var given = [[1, 1, 0, 1], [1, 0, 1, 1], [1, 1, 1, 0], [0, 1, 1, 1]];
    var cur = [], cells = [], r, c;
    for (r = 0; r < 4; r++) {
      cur.push([]);
      for (c = 0; c < 4; c++) { cur[r].push(given[r][c] ? sol[r][c] : -1); }
    }
    var selShape = 0;
    var u = 52, ox = 180 - u * 2 + u / 2, oy = 34;
    for (r = 0; r < 4; r++) {
      cells.push([]);
      for (c = 0; c < 4; c++) {
        (function (r, c) {
          var g = G(st, ox + c * u, oy + r * u);
          pad(g, u, u);
          ink(S('rect', { x: -u / 2 + 2, y: -u / 2 + 2, width: u - 4, height: u - 4, rx: 7,
            fill: given[r][c] ? '#EDE2CE' : '#FFF6E6' }, g), 2.6);
          var slot = S('g', {}, g);
          cells[r].push(slot);
          if (given[r][c]) { glyph(slot, SH[sol[r][c]], 14, COL[sol[r][c]]); }
          else { tap(g, function () { drop(r, c); }); }
        })(r, c);
      }
    }
    /* shape palette */
    var marks = [];
    for (var i = 0; i < 4; i++) {
      (function (i) {
        var g = G(st, 60 + i * 80, 266);
        pad(g, 66, 66);
        var box = ink(S('rect', { x: -28, y: -28, width: 56, height: 56, rx: 10, fill: '#513673' }, g), 3);
        glyph(g, SH[i], 16, COL[i]);
        marks.push(box);
        tap(g, function () {
          selShape = i;
          for (var k = 0; k < 4; k++) { marks[k].setAttribute('fill', k === i ? '#FFC93C' : '#513673'); }
          BS.SFX.tap();
        });
      })(i);
    }
    marks[0].setAttribute('fill', '#FFC93C');
    function drop(r, c) {
      cur[r][c] = selShape;
      A.clear(cells[r][c]);
      glyph(cells[r][c], SH[selShape], 14, COL[selShape]);
      BS.SFX.drop();
      check();
    }
    function check() {
      var r2, c2, seen, k;
      for (r2 = 0; r2 < 4; r2++) {
        for (c2 = 0; c2 < 4; c2++) { if (cur[r2][c2] < 0) { return; } }
      }
      for (r2 = 0; r2 < 4; r2++) {
        seen = {};
        for (c2 = 0; c2 < 4; c2++) { seen[cur[r2][c2]] = 1; }
        k = 0; for (var q in seen) { if (seen.hasOwnProperty(q)) { k++; } }
        if (k !== 4) { BS.nope(); return; }
      }
      for (c2 = 0; c2 < 4; c2++) {
        seen = {};
        for (r2 = 0; r2 < 4; r2++) { seen[cur[r2][c2]] = 1; }
        k = 0; for (var q2 in seen) { if (seen.hasOwnProperty(q2)) { k++; } }
        if (k !== 4) { BS.nope(); return; }
      }
      BS.win();
    }
  }
},

/* 42 — finish the symmetry */
{
  ask: 'Make both halves match, like a mirror.',
  hint: 'The square nearest the line on the left needs a partner nearest the line on the right.',
  tell: 'Fill in the three squares that mirror the left-hand side.',
  why: 'A mirror does not copy — it flips. Your hand had to work backwards from your eye.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var u = 34, cols = 8, rows = 5;
    var ox = 180 - u * cols / 2 + u / 2, oy = 70;
    var left = [[0, 3], [1, 1], [1, 2], [2, 2], [3, 0], [3, 3], [4, 1]];
    var want = {}, i, cells = {}, filled = {};
    for (i = 0; i < left.length; i++) { want[left[i][0] + ':' + (cols - 1 - left[i][1])] = 1; }
    var need = left.length;
    var have = 0;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        (function (r, c) {
          var g = G(st, ox + c * u, oy + r * u);
          pad(g, u, u);
          var isLeft = c < cols / 2;
          var on = false;
          for (i = 0; i < left.length; i++) { if (left[i][0] === r && left[i][1] === c) { on = true; } }
          var box = ink(S('rect', { x: -u / 2 + 2, y: -u / 2 + 2, width: u - 4, height: u - 4, rx: 6,
            fill: on ? '#6EC6E8' : '#FFF6E6' }, g), 2.4);
          cells[r + ':' + c] = box;
          if (!isLeft) {
            tap(g, function () {
              var key = r + ':' + c;
              if (filled[key]) {
                filled[key] = 0; box.setAttribute('fill', '#FFF6E6');
                if (want[key]) { have--; }
                BS.SFX.tap();
                return;
              }
              filled[key] = 1; box.setAttribute('fill', '#FF8A3D');
              BS.SFX.drop();
              if (want[key]) {
                have++;
                if (have === need) {
                  /* nothing extra painted? */
                  var extra = 0, k2;
                  for (k2 in filled) { if (filled.hasOwnProperty(k2) && filled[k2] && !want[k2]) { extra++; } }
                  if (!extra) { setTimeout(BS.win, 320); }
                }
              } else { BS.nope(g); }
            });
          }
        })(r, c);
      }
    }
    ink(S('line', { x1: 180, y1: 46, x2: 180, y2: 250 }, st), 4).setAttribute('stroke-dasharray', '8 7');
  }
},

/* 43 — logic deduction */
{
  ask: 'Who owns the cat?',
  hint: 'Start with what you know for sure: Ali has the dog. So the cat is Sara or Bilal.',
  tell: 'Sara does not have the cat, and Ali has the dog. So it is Bilal.',
  why: 'Nobody told you the answer. You crossed out everything else until only one was left.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false, vignette: false });
    var lines = ['Ali has the dog.', 'Sara does not have the cat.', 'One of them has the fish.'];
    for (var i = 0; i < 3; i++) {
      var g = G(st, 180, 40 + i * 44);
      ink(S('rect', { x: -158, y: -18, width: 316, height: 36, rx: 10, fill: '#FFF6E6' }, g), 3);
      txt(lines[i], { x: 0, y: 6, 'font-size': 16, fill: '#241534' }, g);
    }
    var who = ['Ali', 'Sara', 'Bilal'];
    var cols = ['#6EC6E8', '#FF8FA6', '#3FBF7F'];
    for (i = 0; i < 3; i++) {
      (function (i) {
        var g = G(st, 72 + i * 108, 214);
        pad(g, 96, 132);
        critter(g, { x: 0, y: -14, size: 26, fill: cols[i], ears: 'round', bob: false, shadow: false });
        txt(who[i], { x: 0, y: 46, 'font-size': 17, fill: '#241534' }, g);
        tap(g, function () { if (i === 2) { BS.win(); } else { BS.nope(g); } });
      })(i);
    }
  }
},

/* 44 — analogy */
{
  ask: 'Big circle is to small circle as big star is to...?',
  hint: 'What changed between the first two? Do exactly that to the star.',
  tell: 'A small star, in the same colour.',
  why: 'You spotted the relationship, then applied it to something else entirely.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var a = frame(st, 58, 60, 74, 74); glyph(a, 'circle', 26, '#6EC6E8');
    txt('\u2192', { x: 116, y: 70, 'font-size': 26, fill: '#8A7BA8' }, st);
    var b = frame(st, 174, 60, 74, 74); glyph(b, 'circle', 12, '#6EC6E8');
    txt('as', { x: 232, y: 66, 'font-size': 15, fill: '#8A7BA8' }, st);
    var c = frame(st, 300, 60, 74, 74); glyph(c, 'star', 24, '#FFC93C');
    txt('\u2192  ?', { x: 180, y: 132, 'font-size': 26, fill: '#8A7BA8' }, st);
    options(st, 216, function (g, i) {
      if (i === 0) { glyph(g, 'star', 26, '#FFC93C'); }
      else if (i === 1) { glyph(g, 'star', 12, '#FFC93C'); }
      else { glyph(g, 'circle', 12, '#FFC93C'); }
    }, 1);
  }
},

/* 45 — two interleaved sequences */
{
  ask: 'What are the next two?',
  hint: 'Try reading every OTHER one. There are two patterns taking turns.',
  tell: 'One pattern counts 1, 2, 3, 4 and the other counts 9, 8, 7. Next is 4 then 7.',
  why: 'Two patterns were braided together. Splitting them apart was the whole trick.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var seq = ['1', '9', '2', '8', '3', '?', '?'];
    for (var i = 0; i < 7; i++) {
      var g = G(st, 40 + (i % 4) * 88, 70 + Math.floor(i / 4) * 92);
      var q = seq[i] === '?';
      ink(S('circle', { cx: 0, cy: 0, r: 32, fill: q ? '#EDE2CE' : (i % 2 ? '#FF8FA6' : '#6EC6E8') }, g), 4);
      txt(seq[i], { x: 0, y: 12, 'font-size': 30, fill: '#241534' }, g);
    }
    BS.chips(['4 then 7', '4 then 4', '6 then 7', '7 then 4'], 0);
  }
},

/* 46 — shortest path with costs */
{
  ask: 'Take the shortest road from home to school.',
  hint: 'Add up the numbers along each whole route before you choose.',
  tell: 'Through the middle: 3 + 4 = 7, which beats 5 + 5 and 9.',
  why: 'The straight road looked shortest but cost the most. You added before you trusted your eyes.',
  build: function (st) {
    scene(st, 'meadow', { hills: false, ground: false, vignette: false });
    var home = [50, 150], school = [310, 150], mid = [180, 62], low = [180, 240];
    function road(a, b, n, key) {
      var g = G(st, 0, 0);
      ink(S('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, g), 13).setAttribute('stroke', '#C9BEE2');
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      ink(S('circle', { cx: mx, cy: my, r: 15, fill: '#FFF6E6' }, g), 3);
      txt(String(n), { x: mx, y: my + 7, 'font-size': 17, fill: '#241534' }, g);
      return g;
    }
    /* straight road, cost 9 */
    var straight = G(st, 0, 0);
    ink(S('line', { x1: home[0], y1: home[1], x2: school[0], y2: school[1] }, straight), 13).setAttribute('stroke', '#C9BEE2');
    ink(S('circle', { cx: 180, cy: 150, r: 15, fill: '#FFF6E6' }, straight), 3);
    txt('9', { x: 180, y: 157, 'font-size': 17, fill: '#241534' }, straight);
    road(home, mid, 3); road(mid, school, 4);
    road(home, low, 5); road(low, school, 5);

    function node(p, label, col) {
      var g = G(st, p[0], p[1]);
      ink(S('circle', { cx: 0, cy: 0, r: 24, fill: col }, g), 4);
      txt(label, { x: 0, y: 42, 'font-size': 13, fill: '#241534' }, g);
      return g;
    }
    node(home, 'home', '#FF8A3D');
    node(school, 'school', '#3FBF7F');
    var m = node(mid, '', '#FFC93C'), l = node(low, '', '#FFC93C');
    var s = G(st, 180, 150); pad(s, 60, 60);
    tap(m, function () { BS.win(); });
    tap(l, function () { BS.nope(l); });
    tap(s, function () { BS.nope(s); });
    txt('tap the road you would take', { x: 180, y: 290, 'font-size': 12, fill: '#241534', opacity: '.55' }, st);
  }
},

/* 47 — balance algebra */
{
  ask: 'The scales balance. How heavy is one star?',
  hint: 'Two stars weigh the same as six blocks. So one star is half of six.',
  tell: 'Two stars balance six blocks, so one star weighs 3 blocks.',
  why: 'You worked out something you were never told, by halving what you could see.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 250, vignette: false });
    ink(S('path', { d: 'M166,232 L194,232 L180,150 Z', fill: '#8A7BA8' }, st));
    ink(S('rect', { x: 48, y: 142, width: 264, height: 11, rx: 5, fill: '#C9BEE2' }, st), 4);
    ink(S('path', { d: 'M40,164 L128,164 L114,196 L54,196 Z', fill: '#C9BEE2' }, st), 4);
    ink(S('path', { d: 'M232,164 L320,164 L306,196 L246,196 Z', fill: '#C9BEE2' }, st), 4);
    ink(S('line', { x1: 84, y1: 152, x2: 84, y2: 164 }, st), 3);
    ink(S('line', { x1: 276, y1: 152, x2: 276, y2: 164 }, st), 3);
    star(st, 62, 122, 20, '#FFC93C');
    star(st, 106, 122, 20, '#FFC93C');
    var i;
    for (i = 0; i < 6; i++) {
      ink(S('rect', { x: 238 + (i % 3) * 26, y: 104 + Math.floor(i / 3) * 26, width: 22, height: 22, rx: 4, fill: '#6EC6E8' }, st), 2.6);
    }
    txt('= how many blocks is ONE star?', { x: 180, y: 236, 'font-size': 14, fill: '#241534', opacity: '.65' }, st);
    BS.chips(['2', '3', '4', '6'], 1);
  }
},

/* 48 — folded paper and a punch */
{
  ask: 'The paper is folded, then a hole is punched. What does it look like unfolded?',
  hint: 'The fold is down the middle, so every hole gets a twin on the other side.',
  tell: 'Two holes, mirrored across the fold line.',
  why: 'You unfolded paper in your head, and the hole came back doubled.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var f = G(st, 108, 76);
    ink(S('rect', { x: -40, y: -50, width: 80, height: 100, rx: 6, fill: '#FFF6E6' }, f), 3.5);
    ink(S('circle', { cx: -14, cy: -14, r: 11, fill: '#513673' }, f), 2.6);
    ink(S('line', { x1: 40, y1: -50, x2: 40, y2: 50 }, f), 3).setAttribute('stroke-dasharray', '7 6');
    txt('folded', { x: 108, y: 144, 'font-size': 13, fill: '#241534', opacity: '.6' }, st);
    txt('\u2192', { x: 196, y: 82, 'font-size': 28, fill: '#8A7BA8' }, st);
    txt('?', { x: 272, y: 92, 'font-size': 40, fill: '#8A7BA8' }, st);

    options(st, 224, function (g, i) {
      ink(S('rect', { x: -34, y: -26, width: 68, height: 52, rx: 5, fill: '#FFF6E6' }, g), 2.6);
      ink(S('line', { x1: 0, y1: -26, x2: 0, y2: 26 }, g), 2).setAttribute('stroke-dasharray', '5 4');
      if (i === 0) { ink(S('circle', { cx: -14, cy: -6, r: 8, fill: '#513673' }, g), 2.2); }
      else if (i === 1) {
        ink(S('circle', { cx: -14, cy: -6, r: 8, fill: '#513673' }, g), 2.2);
        ink(S('circle', { cx: 14, cy: -6, r: 8, fill: '#513673' }, g), 2.2);
      } else {
        ink(S('circle', { cx: -14, cy: -6, r: 8, fill: '#513673' }, g), 2.2);
        ink(S('circle', { cx: -14, cy: 12, r: 8, fill: '#513673' }, g), 2.2);
      }
    }, 1);
  }
},

/* 49 — the heavy ball in two weighings */
{
  ask: 'One ball is heavier. The scales tipped like this. Which ball is it?',
  hint: 'The first weighing rules out three balls. The second one narrows it to one.',
  tell: 'The heavy one is in the left group of the first weighing, and it tipped left again. It is ball 1.',
  why: 'Two weighings, nine balls. You threw away most of the possibilities each time.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false, vignette: false });
    function scale(y, leftLabels, rightLabels, tip) {
      ink(S('rect', { x: 40, y: y, width: 280, height: 9, rx: 4, fill: '#C9BEE2',
        transform: 'rotate(' + tip + ' 180 ' + (y + 4) + ')' }, st), 3);
      var i;
      for (i = 0; i < leftLabels.length; i++) {
        var lx = 70 + i * 34, ly = y - 20 + (tip < 0 ? -12 : 12);
        ink(S('circle', { cx: lx, cy: ly, r: 14, fill: '#FFC93C' }, st), 3);
        txt(String(leftLabels[i]), { x: lx, y: ly + 6, 'font-size': 14, fill: '#241534' }, st);
      }
      for (i = 0; i < rightLabels.length; i++) {
        var rx2 = 224 + i * 34, ry = y - 20 + (tip < 0 ? 12 : -12);
        ink(S('circle', { cx: rx2, cy: ry, r: 14, fill: '#FFC93C' }, st), 3);
        txt(String(rightLabels[i]), { x: rx2, y: ry + 6, 'font-size': 14, fill: '#241534' }, st);
      }
    }
    scale(78, [1, 2, 3], [4, 5, 6], -7);
    txt('left side went down', { x: 180, y: 116, 'font-size': 12, fill: '#241534', opacity: '.55' }, st);
    scale(190, [1], [2], -7);
    txt('left side went down again', { x: 180, y: 228, 'font-size': 12, fill: '#241534', opacity: '.55' }, st);
    BS.chips(['1', '2', '3', '7'], 0);
  }
},

/* 50 — magic square */
{
  ask: 'Every row and column must add up to 15.',
  hint: 'Find the row or column that only has one number missing.',
  tell: 'The middle of the bottom row is 9, and the last one is 2.',
  why: 'Each square you filled gave you the next one for free. That is how a chain of logic works.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var grid = [[8, 1, 6], [3, 5, 7], [4, null, null]];
    var u = 62, ox = 180 - u, oy = 62;
    var blanks = [], chosen = {};
    var r, c;
    for (r = 0; r < 3; r++) {
      for (c = 0; c < 3; c++) {
        (function (r, c) {
          var g = G(st, ox + c * u, oy + r * u);
          var v = grid[r][c];
          ink(S('rect', { x: -u / 2 + 3, y: -u / 2 + 3, width: u - 6, height: u - 6, rx: 8,
            fill: v === null ? '#FFF6E6' : '#FFC93C' }, g), 3);
          if (v !== null) { txt(String(v), { x: 0, y: 11, 'font-size': 27, fill: '#241534' }, g); }
          else {
            var t = txt('?', { x: 0, y: 11, 'font-size': 27, fill: '#8A7BA8' }, g);
            pad(g, u, u);
            blanks.push({ r: r, c: c, t: t, g: g });
          }
        })(r, c);
      }
    }
    txt('every row and column makes 15', { x: 180, y: 264, 'font-size': 13, fill: '#241534', opacity: '.6' }, st);
    var pick = 0;
    /* two blanks: bottom-middle (9) and bottom-right (2) */
    BS.chips(['9 then 2', '2 then 9', '9 then 6', '5 then 6'], 0);
  }
},

/* 51 — the odd one out, by rule not by looks */
{
  ask: 'Three of these follow the same rule. Which one breaks it?',
  hint: 'Count the sides of each shape and compare it with the number of dots.',
  tell: 'The square has four sides but three dots. The others match.',
  why: 'They looked completely different. The rule connecting them was hiding underneath.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var items = [
      { sh: 'triangle', dots: 3, ok: true },
      { sh: 'square', dots: 3, ok: false },
      { sh: 'star', dots: 5, ok: true },
      { sh: 'diamond', dots: 4, ok: true }
    ];
    for (var i = 0; i < 4; i++) {
      (function (it, i) {
        var g = G(st, 96 + (i % 2) * 168, 84 + Math.floor(i / 2) * 128);
        pad(g, 140, 118);
        ink(S('rect', { x: -66, y: -56, width: 132, height: 112, rx: 12, fill: '#FFF6E6' }, g), 3);
        glyph(g, it.sh, 26, ['#F0466F', '#6EC6E8', '#FFC93C', '#3FBF7F'][i]);
        for (var d = 0; d < it.dots; d++) {
          S('circle', { cx: -((it.dots - 1) * 9) + d * 18, cy: 40, r: 5.5, fill: '#241534' }, g);
        }
        tap(g, function () { if (!it.ok) { BS.win(); } else { BS.nope(g); } });
      })(items[i], i);
    }
  }
},

/* 52 — sliding block escape (Klotski-lite) */
{
  ask: 'Get the orange block out through the gap on the right.',
  hint: 'The orange block only slides sideways. Clear the top row first, then lift the two tall blocks out of its way.',
  tell: 'Slide the pink bar left, then both tall blocks up, then the orange one straight out.',
  why: 'You had to move things out of the way before you could move the thing you wanted.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false, vignette: false });
    var u = 56, ox = 46, oy = 40, W = 4, H = 4;
    ink(S('rect', { x: ox - 8, y: oy - 8, width: u * W + 16, height: u * H + 16, rx: 12, fill: '#4A3372' }, st), 4);
    /* the exit */
    S('rect', { x: ox + u * W - 2, y: oy + u * 2 + 4, width: 16, height: u - 8, fill: '#3FBF7F' }, st);

    /* Solvable in four moves: slide the pink bar left, both tall blocks up,
       then the orange one straight out. Nothing may span the exit row
       permanently, or the puzzle would be impossible. */
    var blocks = [
      { x: 0, y: 2, w: 2, h: 1, col: '#FF8A3D', hero: true, dir: 'h' },
      { x: 2, y: 1, w: 1, h: 2, col: '#6EC6E8', dir: 'v' },
      { x: 3, y: 2, w: 1, h: 2, col: '#B58BF0', dir: 'v' },
      { x: 2, y: 0, w: 2, h: 1, col: '#F0466F', dir: 'h' }
    ];
    var done = false;
    function occupied(skip) {
      var m = {}, i, bx, by;
      for (i = 0; i < blocks.length; i++) {
        if (i === skip) { continue; }
        for (bx = 0; bx < blocks[i].w; bx++) {
          for (by = 0; by < blocks[i].h; by++) { m[(blocks[i].x + bx) + ':' + (blocks[i].y + by)] = 1; }
        }
      }
      return m;
    }
    for (var i = 0; i < blocks.length; i++) {
      (function (B, i) {
        var g = G(st, ox + B.x * u + B.w * u / 2, oy + B.y * u + B.h * u / 2);
        ink(S('rect', { x: -B.w * u / 2 + 4, y: -B.h * u / 2 + 4, width: B.w * u - 8, height: B.h * u - 8, rx: 10, fill: B.col }, g), 4);
        S('rect', { x: -B.w * u / 2 + 12, y: -B.h * u / 2 + 12, width: B.w * u * .4, height: 9, rx: 4, fill: '#FFFFFF', opacity: '.3' }, g);
        B.g = g;
        drag(g, {
          onDrop: function (x, y, back) {
            if (done) { return; }
            var nx = B.x, ny = B.y;
            if (B.dir === 'h') { nx = Math.round((x - ox - B.w * u / 2) / u); }
            else { ny = Math.round((y - oy - B.h * u / 2) / u); }
            /* the hero may slide out through the gap */
            if (B.hero && nx >= W - B.w + 1) {
              done = true;
              glide(g, ox + (W + 1) * u, y, 420);
              setTimeout(BS.win, 460);
              return;
            }
            nx = Math.max(0, Math.min(W - B.w, nx));
            ny = Math.max(0, Math.min(H - B.h, ny));
            var m = occupied(i), bx, by, clash = false;
            for (bx = 0; bx < B.w; bx++) {
              for (by = 0; by < B.h; by++) { if (m[(nx + bx) + ':' + (ny + by)]) { clash = true; } }
            }
            if (clash) { BS.nope(g); glide(g, back.x, back.y); return; }
            B.x = nx; B.y = ny;
            glide(g, ox + nx * u + B.w * u / 2, oy + ny * u + B.h * u / 2, 170);
          }
        });
      })(blocks[i], i);
    }
  }
},

/* 53 — clock reasoning */
{
  ask: 'The clock says 3 o\u2019clock. Where will the big hand be in 45 minutes?',
  hint: 'The big hand goes all the way round in an hour. Forty-five minutes is three quarters.',
  tell: 'Three quarters round from the top, which points at the 9.',
  why: 'You moved time forward in your head and landed on the right quarter.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false, vignette: false });
    var g = G(st, 180, 118);
    ink(S('circle', { cx: 0, cy: 0, r: 86, fill: '#FFF6E6' }, g), 5);
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6 - Math.PI / 2;
      txt(String(i === 0 ? 12 : i), {
        x: Math.cos(a) * 66, y: Math.sin(a) * 66 + 8, 'font-size': 17, fill: '#241534'
      }, g);
    }
    ink(S('line', { x1: 0, y1: 0, x2: 0, y2: -54 }, g), 6).setAttribute('stroke', '#F0466F');
    ink(S('line', { x1: 0, y1: 0, x2: 34, y2: 0 }, g), 6);
    ink(S('circle', { cx: 0, cy: 0, r: 7, fill: '#241534' }, g), 2);
    options(st, 242, function (gg, i) {
      var n = [6, 9, 3][i];
      ink(S('circle', { cx: 0, cy: 0, r: 30, fill: '#FFF6E6' }, gg), 3);
      var ang = (n / 12) * Math.PI * 2 - Math.PI / 2;
      ink(S('line', { x1: 0, y1: 0, x2: Math.cos(ang) * 22, y2: Math.sin(ang) * 22 }, gg), 5)
        .setAttribute('stroke', '#F0466F');
      txt('the ' + n, { x: 0, y: 46, 'font-size': 12, fill: '#241534', opacity: '.6' }, gg);
    }, 1);
  }
},

/* 54 — which reflection is right */
{
  ask: 'The cat looks in the mirror. Which reflection is correct?',
  hint: 'A mirror swaps left and right, but it never turns you upside down.',
  tell: 'The middle one — same way up, facing back the other way.',
  why: 'Mirrors only flip one way. The upside-down one was a trap.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false, vignette: false });
    animal(st, { kind: 'cat', x: 76, y: 78, size: 22, fill: '#FFB03A', bob: false });
    ink(S('line', { x1: 148, y1: 24, x2: 148, y2: 172 }, st), 5).setAttribute('stroke-dasharray', '9 8');
    txt('mirror', { x: 148, y: 190, 'font-size': 12, fill: '#241534', opacity: '.55' }, st);
    for (var i = 0; i < 3; i++) {
      (function (i) {
        var g = G(st, 72 + i * 108, 244);
        pad(g, 96, 118);
        ink(S('rect', { x: -46, y: -58, width: 92, height: 116, rx: 10, fill: '#FFF6E6' }, g), 3);
        var inner = S('g', {}, g);
        if (i === 0) { inner.setAttribute('transform', 'translate(0,-6)'); }
        else if (i === 1) { inner.setAttribute('transform', 'translate(0,-6) scale(-1,1)'); }
        else { inner.setAttribute('transform', 'translate(0,6) scale(1,-1)'); }
        animal(inner, { kind: 'cat', x: 0, y: -14, size: 15, fill: '#FFB03A', bob: false, shadow: false });
        tap(g, function () { if (i === 1) { BS.win(); } else { BS.nope(g); } });
      })(i);
    }
  }
},

/* 55 — the frogs crossing */
{
  ask: 'Swap the frogs. They only hop forward, onto the next lily or over exactly one frog.',
  hint: 'Never let two frogs of the same colour end up nose to nose. Alternate the colours you move.',
  tell: 'Green, blue-jump, blue, green-jump, green-jump, green, blue-jump, blue.',
  why: 'One wrong hop and the whole thing jams. You had to see several moves ahead.',
  build: function (st) {
    scene(st, 'water', { hills: false, ground: false, vignette: false });
    ink(S('rect', { x: 0, y: 130, width: 360, height: 80, fill: '#5FB6DE' }, st), 0);
    var N = 5, xs = [], i;
    for (i = 0; i < N; i++) { xs.push(48 + i * 66); }
    /* 0,1 = green ; 2 = empty ; 3,4 = blue */
    var slots = ['g', 'g', null, 'b', 'b'];
    var frogs = {}, sel = -1;
    for (i = 0; i < N; i++) {
      var pl = G(st, xs[i], 170);
      ink(S('ellipse', { cx: 0, cy: 0, rx: 28, ry: 18, fill: '#5FD08A' }, pl), 3.5);
      ink(S('path', { d: 'M0,0 L-9,-15', fill: 'none' }, pl), 2.5);
    }
    function mk(kind, at2) {
      var g = animal(st, { kind: 'duck', x: xs[at2], y: 148,
        fill: kind === 'g' ? '#7FD094' : '#6EC6E8', size: 14, bob: false });
      return g;
    }
    frogs.g0 = mk('g', 0); frogs.g1 = mk('g', 1);
    frogs.b0 = mk('b', 3); frogs.b1 = mk('b', 4);
    var owner = [frogs.g0, frogs.g1, null, frogs.b0, frogs.b1];

    /* hit targets go on last, above the frogs, or the taps land on the
       artwork instead of the slot underneath */
    for (i = 0; i < N; i++) {
      (function (i) {
        var z = G(st, xs[i], 158);
        pad(z, 64, 96);
        tap(z, function () { poke(i); });
      })(i);
    }

    function poke(i) {
      var empty = slots.indexOf(null);
      if (slots[i] === null) { return; }
      var dir = slots[i] === 'g' ? 1 : -1;
      var d = empty - i;
      if (d !== dir && d !== dir * 2) { BS.nope(owner[i]); return; }
      if (d === dir * 2 && slots[i + dir] === null) { BS.nope(owner[i]); return; }
      slots[empty] = slots[i]; slots[i] = null;
      owner[empty] = owner[i]; owner[i] = null;
      glide(owner[empty], xs[empty], 148, 230);
      BS.SFX.drop();
      setTimeout(function () {
        if (slots[0] === 'b' && slots[1] === 'b' && slots[3] === 'g' && slots[4] === 'g') { BS.win(); }
      }, 280);
    }
  }
},

/* 56 — the whole picture */
{
  ask: 'Only one piece completes the pattern. Which?',
  hint: 'The row tells you the colour. The column tells you how many dots.',
  tell: 'Its row is blue, and its column has two dots. So: blue, with two dots.',
  why: 'Two clues had to agree before you could be sure. One on its own would have fooled you.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var cols2 = ['#F0466F', '#6EC6E8', '#3FBF7F'];
    var r, c, g;
    for (r = 0; r < 3; r++) {
      for (c = 0; c < 3; c++) {
        g = frame(st, 74 + c * 84, 46 + r * 62, 74, 54, cols2[r]);
        if (r === 1 && c === 1) {
          A.clear(g);
          ink(S('rect', { x: -37, y: -27, width: 74, height: 54, rx: 9, fill: '#EDE2CE', 'stroke-dasharray': '8 6' }, g), 3);
          txt('?', { x: 0, y: 11, 'font-size': 26, fill: '#8A7BA8' }, g);
          continue;
        }
        var n = c + 1, d;
        for (d = 0; d < n; d++) {
          S('circle', { cx: -((n - 1) * 11) + d * 22, cy: 0, r: 7, fill: '#FFF6E6' }, g);
        }
      }
    }
    options(st, 252, function (gg, i) {
      var spec = [
        { bg: '#6EC6E8', n: 3 },
        { bg: '#6EC6E8', n: 2 },
        { bg: '#3FBF7F', n: 2 }
      ][i];
      ink(S('rect', { x: -36, y: -26, width: 72, height: 52, rx: 8, fill: spec.bg }, gg), 3);
      for (var d = 0; d < spec.n; d++) {
        S('circle', { cx: -((spec.n - 1) * 11) + d * 22, cy: 0, r: 7, fill: '#FFF6E6' }, gg);
      }
    }, 1);
  }
}

  ];
})();

(function () {
  for (var i = 0; i < PUZZLES_EXPERT.length; i++) { PUZZLES.push(PUZZLES_EXPERT[i]); }
})();
