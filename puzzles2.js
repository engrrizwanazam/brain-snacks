/* ==========================================================
   Brain Snacks — pack 2: tracing, mirror images, rotation,
   transitive reasoning.
   ========================================================== */

BS.addPuzzles((function () {
  'use strict';

  var A = ART;
  var S = A.S, G = A.G, at = A.at, ink = A.ink, txt = A.txt;
  var animal = A.animal, star = A.star, scene = A.scene, critter = A.critter;
  var tap = BS.tap, drag = BS.drag, glide = BS.glide;
  var hit = KIT.hit, pad = KIT.pad;

  return [

/* 25 — follow the pipes */
{
  d: 31,
  ask: 'Water goes in at the top. Which cup fills up?',
  hint: 'Put your finger on the water and follow the pipe. It changes lanes twice.',
  tell: 'It crosses to the middle pipe, then to the right one. The right cup.',
  why: 'You followed one line through all its turns without losing it. That is tracking.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 250, vignette: false });
    var xs = [78, 180, 282], i;
    var PIPE = '#9FB4C7', EDGE = '#7C93A8';
    /* verticals */
    for (i = 0; i < 3; i++) {
      ink(S('rect', { x: xs[i] - 15, y: 40, width: 30, height: 180, rx: 6, fill: PIPE }, st), 4);
      S('rect', { x: xs[i] - 9, y: 46, width: 7, height: 168, rx: 3, fill: '#FFFFFF', opacity: '.3' }, st);
    }
    /* the two crossings */
    function link(a, b, y) {
      ink(S('rect', { x: xs[a] - 6, y: y - 15, width: xs[b] - xs[a] + 12, height: 30, rx: 6, fill: PIPE }, st), 4);
      S('rect', { x: xs[a], y: y - 9, width: xs[b] - xs[a], height: 7, rx: 3, fill: '#FFFFFF', opacity: '.3' }, st);
    }
    link(0, 1, 104);
    link(1, 2, 168);
    /* a decoy below where the water has already left */
    link(0, 1, 210);

    /* the water itself, drawn on top so the route is followable */
    var route = 'M78,44 L78,104 L180,104 L180,168 L282,168 L282,220';
    ink(S('path', { d: route, fill: 'none' }, st), 15).setAttribute('stroke', '#2F86C4');
    ink(S('path', { d: route, fill: 'none' }, st), 8).setAttribute('stroke', '#5FC0E8');
    S('circle', { cx: 78, cy: 40, r: 11, fill: '#5FC0E8' }, st);

    for (i = 0; i < 3; i++) {
      (function (i) {
        var g = G(st, xs[i], 244);
        pad(g, 76, 76);
        ink(S('path', { d: 'M-30,-24 L30,-24 L23,34 L-23,34 Z', fill: '#FFF6E6' }, g));
        S('path', { d: 'M-22,-18 L-14,-18 L-11,28 L-18,28 Z', fill: '#FFFFFF', opacity: '.5' }, g);
        tap(g, function () { if (i === 2) { BS.win(); } else { BS.nope(g); } });
      })(i);
    }
    A.lift(st);
  }
},

/* 26 — mirror image */
{
  d: 43,
  ask: 'Which one is the mirror of the pattern?',
  hint: 'A mirror swaps left and right. The top row stays the top row.',
  tell: 'The middle one. Every square has moved to the opposite side.',
  why: 'A mirror flips left and right but never top and bottom. That is harder than it sounds.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var base = [[1, 0, 0], [1, 1, 0], [0, 1, 1]];
    function mirror(p) {
      var out = [], r, c;
      for (r = 0; r < 3; r++) { out.push([p[r][2], p[r][1], p[r][0]]); }
      return out;
    }
    function flipV(p) { return [p[2].slice(), p[1].slice(), p[0].slice()]; }
    function grid(parent, x, y, p, cell, col) {
      var g = G(parent, x, y), r, c;
      pad(g, cell * 3 + 16, cell * 3 + 16);
      for (r = 0; r < 3; r++) {
        for (c = 0; c < 3; c++) {
          ink(S('rect', {
            x: (c - 1.5) * cell, y: (r - 1.5) * cell, width: cell, height: cell, rx: 4,
            fill: p[r][c] ? col : '#FFF6E6'
          }, g), 2.6);
        }
      }
      return g;
    }
    grid(st, 78, 88, base, 30, '#6EC6E8');
    ink(S('line', { x1: 168, y1: 26, x2: 168, y2: 150 }, st), 4).setAttribute('stroke-dasharray', '9 8');
    txt('mirror', { x: 168, y: 168, 'font-size': 13, fill: '#8A7BA8' }, st);

    var opts = [
      { p: base, ok: false },
      { p: mirror(base), ok: true },
      { p: flipV(base), ok: false }
    ];
    for (var i = 0; i < 3; i++) {
      (function (O, i) {
        var g = grid(st, 258, 62 + i * 84, O.p, 23, '#FF8A3D');
        tap(g, function () { if (O.ok) { BS.win(); } else { BS.nope(g); } });
      })(opts[i], i);
    }
  }
},

/* 27 — rotation */
{
  d: 36,
  ask: 'The arrow keeps turning. What comes next?',
  hint: 'It turns a quarter turn each time, always the same way.',
  tell: 'One more quarter turn — the arrow should point left.',
  why: 'You spotted a rule about turning, not about pictures. That is a big step.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    function arrow(parent, x, y, deg, size, col) {
      var g = G(parent, x, y);
      pad(g, size * 2.4, size * 2.4);
      var inner = S('g', { transform: 'rotate(' + deg + ')' }, g);
      ink(S('circle', { cx: 0, cy: 0, r: size, fill: '#FFF6E6' }, inner), 3.5);
      ink(S('path', { d: 'M0,' + (-size * .62) + ' L' + (size * .44) + ',' + (size * .1) +
        ' L' + (size * .17) + ',' + (size * .1) + ' L' + (size * .17) + ',' + (size * .6) +
        ' L' + (-size * .17) + ',' + (size * .6) + ' L' + (-size * .17) + ',' + (size * .1) +
        ' L' + (-size * .44) + ',' + (size * .1) + ' Z', fill: col }, inner), 3);
      return g;
    }
    for (var i = 0; i < 3; i++) { arrow(st, 56 + i * 78, 88, i * 90, 30, '#6EC6E8'); }
    ink(S('rect', { x: 260, y: 56, width: 64, height: 64, rx: 12, fill: 'none', 'stroke-dasharray': '9 7' }, st), 3);
    txt('?', { x: 292, y: 100, 'font-size': 32, fill: '#8A7BA8' }, st);

    var opts = [{ d: 270, ok: true }, { d: 0, ok: false }, { d: 90, ok: false }];
    for (i = 0; i < 3; i++) {
      (function (O, i) {
        var g = arrow(st, 78 + i * 102, 216, O.d, 34, '#FF8A3D');
        tap(g, function () { if (O.ok) { BS.win(); } else { BS.nope(g); } });
      })(opts[i], i);
    }
  }
},

/* 28 — make ten */
{
  d: 38,
  ask: 'The robot only eats pairs that make 10. Feed it two.',
  hint: 'Try each number and work out what it needs to reach 10.',
  tell: 'The 3 and the 7.',
  why: 'Three and seven make ten. Finding number pairs is the trick behind fast adding.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 246, vignette: false });
    var r = G(st, 180, 92);
    ink(S('rect', { x: -62, y: -46, width: 124, height: 96, rx: 16, fill: '#8FA8F0' }, r));
    S('rect', { x: -50, y: -36, width: 40, height: 16, rx: 7, fill: '#FFFFFF', opacity: '.35' }, r);
    ink(S('circle', { cx: -24, cy: -12, r: 13, fill: '#FFF6E6' }, r), 3);
    ink(S('circle', { cx: 24, cy: -12, r: 13, fill: '#FFF6E6' }, r), 3);
    S('circle', { cx: -22, cy: -10, r: 6, fill: '#241534' }, r);
    S('circle', { cx: 26, cy: -10, r: 6, fill: '#241534' }, r);
    ink(S('rect', { x: -30, y: 18, width: 60, height: 16, rx: 8, fill: '#241534' }, r), 3);
    ink(S('line', { x1: 0, y1: -46, x2: 0, y2: -68 }, r), 4);
    ink(S('circle', { cx: 0, cy: -74, r: 8, fill: '#FFC93C' }, r), 3);

    var nums = [3, 4, 7, 2, 9];
    var xs = [52, 116, 180, 244, 308];
    var picked = [], blocks = [];
    for (var i = 0; i < 5; i++) {
      (function (i) {
        var g = G(st, xs[i], 208);
        pad(g, 60, 60);
        var box = ink(S('rect', { x: -25, y: -25, width: 50, height: 50, rx: 9, fill: '#FFC93C' }, g));
        S('rect', { x: -18, y: -18, width: 36, height: 11, rx: 5, fill: '#FFFFFF', opacity: '.3' }, g);
        txt(String(nums[i]), { x: 0, y: 11, 'font-size': 29, fill: '#241534' }, g);
        blocks.push({ g: g, box: box, v: nums[i] });
        tap(g, function () { choose(i); });
      })(i);
    }
    function choose(i) {
      var b = blocks[i], at2 = picked.indexOf(i);
      if (at2 >= 0) { picked.splice(at2, 1); b.box.setAttribute('fill', '#FFC93C'); BS.SFX.tap(); return; }
      if (picked.length === 2) { return; }
      picked.push(i); b.box.setAttribute('fill', '#3FBF7F'); BS.SFX.tap();
      if (picked.length < 2) { return; }
      var sum = blocks[picked[0]].v + blocks[picked[1]].v;
      BS.later(function () {
        if (sum === 10) { BS.win(); return; }
        BS.nope(blocks[picked[0]].g); BS.wobble(blocks[picked[1]].g);
        blocks[picked[0]].box.setAttribute('fill', '#FFC93C');
        blocks[picked[1]].box.setAttribute('fill', '#FFC93C');
        picked = [];
      }, 380);
    }
  }
},

/* 29 — follow the tangled strings */
{
  d: 22,
  ask: 'Which balloon is the cat holding?',
  hint: 'Start at the cat and follow her string with your finger. The others cross over it.',
  tell: 'The yellow balloon on the left.',
  why: 'Three strings crossed and you kept hold of one. Eyes can follow a line the hands cannot.',
  build: function (st) {
    scene(st, 'meadow', { hills: true, groundY: 250, clouds: true });
    var who = [
      { x: 62, col: '#FFB03A', kind: 'cat',  end: 66,  bcol: '#FFC93C', ok: true },
      { x: 180, col: '#C9BFD6', kind: 'mouse', end: 292, bcol: '#F0466F', ok: false },
      { x: 298, col: '#B07A4C', kind: 'bear', end: 178, bcol: '#6EC6E8', ok: false }
    ];
    var i;
    /* strings first, so nothing crosses a face */
    for (i = 0; i < 3; i++) {
      var w = who[i];
      ink(S('path', { d: 'M' + w.x + ',196 C' + w.x + ',150 ' + w.end + ',134 ' + w.end + ',86', fill: 'none' }, st), 3)
        .setAttribute('stroke', '#5A4470');
    }
    for (i = 0; i < 3; i++) {
      (function (w) {
        animal(st, { kind: w.kind, x: w.x, y: 250 - 2.5 * 18, size: 18, fill: w.col });
        var g = G(st, w.end, 62);
        pad(g, 60, 76);
        ink(S('ellipse', { cx: 0, cy: 0, rx: 23, ry: 27, fill: w.bcol }, g));
        S('ellipse', { cx: -8, cy: -9, rx: 8, ry: 6, fill: '#FFFFFF', opacity: '.45' }, g);
        ink(S('path', { d: 'M-5,26 L5,26 L0,34 Z', fill: w.bcol }, g), 2.5);
        tap(g, function () { if (w.ok) { BS.win(); } else { BS.nope(g); } });
      })(who[i]);
    }
    A.lift(st);
  }
},

/* 30 — which piece fits */
{
  d: 34,
  ask: 'One piece is missing. Which one fits?',
  hint: 'Check the shape of the gap AND what the picture should look like there.',
  tell: 'The middle piece — the one with the round bump and the green.',
  why: 'Two things had to match at once: the shape and the picture. One alone was not enough.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var W = 150, H = 116, px = 116, py = 84;
    ink(S('rect', { x: px - W / 2, y: py - H / 2, width: W, height: H, rx: 10, fill: '#8FD3F0' }, st));
    S('rect', { x: px - W / 2 + 4, y: py + 6, width: W - 8, height: H / 2 - 10, rx: 6, fill: '#69C486' }, st);
    A.star(st, px + 44, py - 30, 13, '#FFC93C');
    /* the gap: a square with a round bump on its right edge */
    var gx = px - 26, gy = py + 14;
    var gapPath = 'M' + (gx - 24) + ',' + (gy - 24) + ' h48 v14 a10,10 0 0 1 0,20 v14 h-48 z';
    ink(S('path', { d: gapPath, fill: '#FFF6E6' }, st), 3.5);

    var opts = [
      { bump: true,  col: '#8FD3F0', ok: false },
      { bump: true,  col: '#69C486', ok: true },
      { bump: false, col: '#69C486', ok: false }
    ];
    for (var i = 0; i < 3; i++) {
      (function (O, i) {
        var g = G(st, 268, 62 + i * 84);
        pad(g, 78, 70);
        var d = O.bump
          ? 'M-24,-24 h48 v14 a10,10 0 0 1 0,20 v14 h-48 z'
          : 'M-24,-24 h48 v48 h-48 z';
        ink(S('path', { d: d, fill: O.col }, g), 3.5);
        if (O.col === '#69C486') { A.star(g, 0, -6, 8, '#FFC93C', 0); }
        tap(g, function () { if (O.ok) { BS.win(); } else { BS.nope(g); } });
      })(opts[i], i);
    }
  }
},

/* 31 — transitive weighing */
{
  d: 47,
  ask: 'Look at both scales. Which one is heaviest?',
  hint: 'The pear beats the apple. The apple beats the plum. So where does the pear sit?',
  tell: 'The pear. It is heavier than the apple, and the apple is heavier than the plum.',
  why: 'Nobody weighed the pear against the plum. You worked it out from the other two.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 252, vignette: false });
    function fruit(parent, x, y, r, col, leaf) {
      var g = G(parent, x, y);
      ink(S('circle', { cx: 0, cy: 0, r: r, fill: col }, g));
      S('ellipse', { cx: -r * .3, cy: -r * .34, rx: r * .32, ry: r * .22, fill: '#FFFFFF', opacity: '.4' }, g);
      ink(S('line', { x1: 0, y1: -r, x2: 2, y2: -r - 7 }, g), 3).setAttribute('stroke', '#6E4A28');
      if (leaf) { ink(S('ellipse', { cx: 8, cy: -r - 7, rx: 7, ry: 4, fill: '#3FBF7F' }, g), 2.4); }
      return g;
    }
    function balance(x, y, tiltDeg, leftDraw, rightDraw) {
      ink(S('path', { d: 'M' + (x - 14) + ',' + (y + 62) + ' L' + (x + 14) + ',' + (y + 62) + ' L' + x + ',' + y + ' Z', fill: '#8A7BA8' }, st));
      var arm = G(st, x, y);
      arm.setAttribute('transform', 'translate(' + x + ',' + y + ') rotate(' + tiltDeg + ')');
      ink(S('rect', { x: -56, y: -5, width: 112, height: 10, rx: 5, fill: '#C9BEE2' }, arm));
      ink(S('path', { d: 'M-70,26 L-22,26 L-30,44 L-62,44 Z', fill: '#C9BEE2' }, arm));
      ink(S('path', { d: 'M70,26 L22,26 L30,44 L62,44 Z', fill: '#C9BEE2' }, arm));
      ink(S('line', { x1: -46, y1: 0, x2: -46, y2: 26 }, arm), 3);
      ink(S('line', { x1: 46, y1: 0, x2: 46, y2: 26 }, arm), 3);
      leftDraw(arm, -46, 8);
      rightDraw(arm, 46, 8);
    }
    balance(96, 76, 9,
      function (p, x, y) { fruit(p, x, y, 20, '#9BD35F', true); },
      function (p, x, y) { fruit(p, x, y, 15, '#E8464C', true); });
    balance(264, 76, 9,
      function (p, x, y) { fruit(p, x, y, 15, '#E8464C', true); },
      function (p, x, y) { fruit(p, x, y, 11, '#A66FD8'); });

    var opts = [
      { col: '#9BD35F', r: 20, ok: true },
      { col: '#E8464C', r: 15, ok: false },
      { col: '#A66FD8', r: 11, ok: false }
    ];
    for (var i = 0; i < 3; i++) {
      (function (O, i) {
        var g = G(st, 76 + i * 104, 224);
        pad(g, 72, 72);
        fruit(g, 0, 0, O.r, O.col, O.col !== '#A66FD8');
        tap(g, function () { if (O.ok) { BS.win(); } else { BS.nope(g); } });
      })(opts[i], i);
    }
  }
},

/* 32 — shadow matching */
{
  d: 6,
  ask: 'Which shadow belongs to the rabbit?',
  hint: 'Look at the ears. Nothing else has ears that long.',
  tell: 'The one on the right, with the two tall ears.',
  why: 'A shadow keeps the shape and throws away everything else. The outline was enough.',
  build: function (st) {
    scene(st, 'dusk', { hills: true, groundY: 246, sun: 'sun' });
    animal(st, { kind: 'bunny', x: 180, y: 84, size: 24, fill: '#F5E2D0' });
    var kinds = [
      { k: 'bear', ok: false, s: 18 },
      { k: 'cat',  ok: false, s: 18 },
      { k: 'bunny', ok: true, s: 18 }
    ];
    for (var i = 0; i < 3; i++) {
      (function (K, i) {
        var g = G(st, 78 + i * 102, 208);
        pad(g, 86, 110, -16);
        var sh = animal(g, { kind: K.k, x: 0, y: -14, size: K.s, fill: '#241534', bob: false, blink: false, shadow: false });
        A.silhouette(sh);
        sh.setAttribute('opacity', '.82');
        tap(g, function () { if (K.ok) { BS.win(); } else { BS.nope(g); } });
      })(kinds[i], i);
    }
    A.lift(st);
  }
}

  ];
})());
