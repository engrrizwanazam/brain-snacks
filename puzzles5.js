/* ==========================================================
   Brain Snacks — puzzles 74-100. Takes the Tricks count to 100.

   Same rule as v9 and v10: new pictures, not easier versions. Where a
   mechanic had to repeat, the picture and the reasoning do not.

     74-79  planning      roads, dominoes, pancakes, ice, scales, seeds
     80-85  the world     pulleys, levers, tracks, gravity, candles, wind
     86-92  deduction     mislabelled boxes, warmer/colder, codes, growth
     93-100 spatial       string, overlays, occlusion, symmetry, cuts,
                          shadows, opposite faces, reflections in water

   Safari 12 throughout: no arrow functions, no template literals, no ?.,
   SVG transforms as attributes, movement through place()/glide() only.
   ========================================================== */

var PUZZLES_HUNDRED = (function () {
  'use strict';

  var A = ART;
  var S = A.S, G = A.G, ink = A.ink, txt = A.txt, place = A.place;
  var animal = A.animal, star = A.star, scene = A.scene, critter = A.critter;
  var tap = BS.tap, drag = BS.drag, glide = BS.glide;

  function pad(g, w, h, dy) {
    return S('rect', { x: -w / 2, y: -h / 2 + (dy || 0), width: w, height: h, rx: 10,
      fill: '#FFFFFF', opacity: '0', 'pointer-events': 'all' }, g);
  }

  /* three tappable cards along the bottom */
  function options(st, y, draw, rightIndex, xs) {
    xs = xs || [72, 180, 288];
    for (var i = 0; i < xs.length; i++) {
      (function (i) {
        var g = G(st, xs[i], y);
        ink(S('rect', { x: -40, y: -40, width: 80, height: 80, rx: 12, fill: '#FFF6E6' }, g), 3);
        draw(g, i);
        pad(g, 92, 92);
        tap(g, function () { if (i === rightIndex) { BS.win(); } else { BS.nope(g); } });
      })(i);
    }
  }

  function cell(parent, x, y, s, fill) {
    return ink(S('rect', { x: x - s / 2, y: y - s / 2, width: s, height: s, rx: s * .18, fill: fill }, parent), s * .12);
  }
  function cells(parent, list, s, fill) {
    var i, minc = 99, maxc = -99, minr = 99, maxr = -99;
    for (i = 0; i < list.length; i++) {
      minc = Math.min(minc, list[i][0]); maxc = Math.max(maxc, list[i][0]);
      minr = Math.min(minr, list[i][1]); maxr = Math.max(maxr, list[i][1]);
    }
    var ox = (minc + maxc) / 2, oy = (minr + maxr) / 2;
    for (i = 0; i < list.length; i++) {
      cell(parent, (list[i][0] - ox) * s, (list[i][1] - oy) * s, s * .94, fill);
    }
  }
  /* a plain house, used by the postman */
  function house(parent, x, y, fill) {
    var g = G(parent, x, y);
    ink(S('rect', { x: -17, y: -4, width: 34, height: 26, rx: 3, fill: fill }, g), 3);
    ink(S('path', { d: 'M-21,-4 L0,-21 L21,-4 Z', fill: '#C4553F' }, g), 3);
    ink(S('rect', { x: -6, y: 6, width: 12, height: 16, rx: 2, fill: '#8A5F3B' }, g), 2.4);
    return g;
  }
  function seedPile(parent, n, fill) {
    var i, cols = 4;
    for (i = 0; i < n; i++) {
      S('circle', { cx: -16 + (i % cols) * 11, cy: 10 - Math.floor(i / cols) * 11,
        r: 4.4, fill: fill, stroke: '#241534', 'stroke-width': 1.6 }, parent);
    }
  }

  return [

/* 74 — the postman.
   Every ROAD once, not every house. She will walk into a house with no
   unused road left long before she has done them all, and that is the
   lesson: the two junctions with an odd number of roads are the only
   places a round like this can begin or end. */
{
  ask: 'Deliver to the whole village. Walk down every road exactly once — tap a road to walk it.',
  hint: 'Some junctions have three roads and some have four. Count them before you set off.',
  tell: 'Start at the bottom right, and save the two crossing roads for the middle of your round.',
  why: 'A road you have already walked is gone. You had to spend them in an order that never left one stranded.',
  build: function (st) {
    scene(st, 'meadow', { clouds: true, hills: false, ground: '#8FCB77', groundY: 262, tufts: false, vignette: false });
    var N = {
      A: [72, 110], B: [288, 110], C: [288, 214], D: [72, 214], E: [180, 46]
    };
    /* the classic envelope: C and D have three roads, everything else four
       or two, so a round exists and must run between C and D */
    var ROADS = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A', 'C'], ['B', 'D'], ['A', 'E'], ['B', 'E']];
    var used = [], at = 'C', lines = [], i;
    for (i = 0; i < ROADS.length; i++) { used.push(false); }

    for (i = 0; i < ROADS.length; i++) {
      (function (i) {
        var p = N[ROADS[i][0]], q = N[ROADS[i][1]];
        var l = ink(S('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1] }, st), 9);
        l.setAttribute('stroke', '#C9BEA8');
        lines.push(l);
      })(i);
    }
    var pins = {};
    for (var k in N) {
      if (!N.hasOwnProperty(k)) { continue; }
      pins[k] = house(st, N[k][0], N[k][1], k === 'C' ? '#FFD86B' : '#F3E4C6');
    }
    var post = critter(st, { x: N.C[0], y: N.C[1] - 34, size: 13, fill: '#6EC6E8',
      ears: 'round', bob: false, shadow: false });

    function reset() {
      for (var j = 0; j < ROADS.length; j++) {
        used[j] = false;
        lines[j].setAttribute('stroke', '#C9BEA8');
      }
      at = 'C';
      place(post, N.C[0], N.C[1] - 34);
    }
    function openFrom(node) {
      var n = 0, j;
      for (j = 0; j < ROADS.length; j++) {
        if (!used[j] && (ROADS[j][0] === node || ROADS[j][1] === node)) { n++; }
      }
      return n;
    }
    /* hit layers last, above the roads and the houses */
    for (i = 0; i < ROADS.length; i++) {
      (function (i) {
        var p = N[ROADS[i][0]], q = N[ROADS[i][1]];
        var g = G(st, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
        var dx = q[0] - p[0], dy = q[1] - p[1];
        var len = Math.sqrt(dx * dx + dy * dy);
        var ang = Math.atan2(dy, dx) * 180 / Math.PI;
        g.setAttribute('transform', 'translate(' + Math.round((p[0] + q[0]) / 2) + ',' +
          Math.round((p[1] + q[1]) / 2) + ') rotate(' + Math.round(ang) + ')');
        /* kept narrow: the two crossing roads share a patch of screen, and a
           fat hit strip would hand every tap near the middle to whichever was
           drawn last */
        S('rect', { x: -len / 2 + 22, y: -11, width: Math.max(10, len - 44), height: 22,
          fill: '#FFFFFF', opacity: '0', 'pointer-events': 'all' }, g);
        tap(g, function () {
          var ends = ROADS[i];
          if (used[i] || (ends[0] !== at && ends[1] !== at)) { BS.nope(pins[at]); return; }
          used[i] = true;
          lines[i].setAttribute('stroke', '#3FBF7F');
          at = ends[0] === at ? ends[1] : ends[0];
          glide(post, N[at][0], N[at][1] - 34, 260);
          BS.SFX.grab();
          setTimeout(function () {
            var left = 0, j;
            for (j = 0; j < ROADS.length; j++) { if (!used[j]) { left++; } }
            if (left === 0) { BS.win(); return; }
            if (openFrom(at) === 0) {
              BS.nope(post);
              setTimeout(reset, 540);
            }
          }, 300);
        });
      })(i);
    }
    reset();
    A.lift(st);
  }
},

/* 75 — the domino chain.
   Ends must match. Two of the four can be laid first without anything going
   wrong, and only one of those two leads anywhere. */
{
  ask: 'Lay all four dominoes in a line. Touching ends must have the same number of spots.',
  hint: 'Look at the number on the free end of the row. Which domino has that number on it?',
  tell: 'The 2-3 goes on first, then the 3-5, then the 5-4.',
  why: 'Each domino you lay decides which one can come next. You had to look further than the piece in front of you.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false, vignette: false });
    /* chain: [1|2] [2|3] [3|5] [5|4]  -- the row starts open on 1 */
    var TILES = [[3, 5], [1, 2], [5, 4], [2, 3]];
    var laid = [], leftEnd = null, rightEnd = null, placedIdx = [];
    function pips(parent, n, cx) {
      var P = {
        1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]],
        4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
        5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]
      }[n] || [];
      for (var i = 0; i < P.length; i++) {
        S('circle', { cx: cx + P[i][0] * 7, cy: P[i][1] * 8, r: 3.1, fill: '#241534' }, parent);
      }
    }
    function domino(parent, a, b, s) {
      var g = G(parent, 0, 0);
      ink(S('rect', { x: -27 * s, y: -16 * s, width: 54 * s, height: 32 * s, rx: 5, fill: '#FFF6E6' }, g), 2.8);
      ink(S('line', { x1: 0, y1: -13 * s, x2: 0, y2: 13 * s }, g), 2);
      var inner = S('g', {}, g);
      if (s !== 1) { inner.setAttribute('transform', 'scale(' + s + ')'); }
      pips(inner, a, -13); pips(inner, b, 13);
      return g;
    }
    /* the row already has one domino down, so there is a number to match */
    var rowY = 96;
    function repaint() {
      A.clear(row);
      for (var i = 0; i < laid.length; i++) {
        var d = domino(row, laid[i][0], laid[i][1], 1);
        d.setAttribute('transform', 'translate(' + (-165 + 60 + i * 58) + ',0)');
      }
    }
    var row = G(st, 180, rowY);
    ink(S('rect', { x: 16, y: rowY - 28, width: 328, height: 56, rx: 12, fill: '#FFF6E6', opacity: '.3' }, st), 2.4)
      .setAttribute('stroke-dasharray', '8 7');
    st.appendChild(row);
    laid.push([1, 2]); leftEnd = 1; rightEnd = 2;
    repaint();

    var XS = [64, 168, 272], tray = [0, 2, 3];   /* [3|5] [5|4] [2|3] */
    var slots = [];
    for (var i = 0; i < 3; i++) {
      (function (i) {
        var ti = tray[i];
        var g = G(st, XS[i], 216);
        var d = domino(g, TILES[ti][0], TILES[ti][1], 1);
        slots.push({ g: g, ti: ti, gone: false });
        pad(g, 66, 46);
        tap(g, function () {
          var me = slots[i];
          if (me.gone) { return; }
          var a = TILES[me.ti][0], b = TILES[me.ti][1];
          if (b === leftEnd) { laid.unshift([a, b]); leftEnd = a; }
          else if (a === leftEnd) { laid.unshift([b, a]); leftEnd = b; }
          else if (a === rightEnd) { laid.push([a, b]); rightEnd = b; }
          else if (b === rightEnd) { laid.push([b, a]); rightEnd = a; }
          else { BS.nope(g); return; }
          me.gone = true;
          g.setAttribute('opacity', '0');
          repaint();
          BS.SFX.drop();
          if (laid.length === 4) { setTimeout(function () { BS.win(); }, 260); }
        });
      })(i);
    }
    txt('the row', { x: 180, y: 148, 'font-size': 12, fill: '#241534', opacity: '.5' }, st);
    txt('your dominoes', { x: 180, y: 262, 'font-size': 12, fill: '#241534', opacity: '.5' }, st);
    A.lift(st);
  }
},

/* 76 — the pancakes.
   Tapping a pancake turns over everything from the top down to it, all in one
   go. There is no way to move a single pancake, so she cannot nudge it into
   place; she has to use the flip itself. */
{
  ask: 'Sort the pancakes, biggest at the bottom. Tapping one turns over the whole pile above it.',
  hint: 'You cannot move just one. Think about which pancake you want to send to the bottom first.',
  tell: 'Turn over the top two, then turn over all three.',
  why: 'Every move disturbed pancakes you had already placed. You had to plan around your own tools.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 250, vignette: false });
    ink(S('ellipse', { cx: 180, cy: 236, rx: 108, ry: 17, fill: '#E8E0CE' }, st), 4);
    /* 1 = smallest. Top of the pile is index 0. */
    var order = [2, 3, 1], busy = false;
    var RW = { 1: 42, 2: 62, 3: 84 };
    var COL = { 1: '#FFD86B', 2: '#F5A623', 3: '#D2792B' };
    var arts = [];
    /* index 0 is the TOP of the pile, so it must be drawn highest on screen */
    function pileY(i) { return 208 - (order.length - 1 - i) * 26; }
    function layout() {
      for (var i = 0; i < order.length; i++) {
        arts[i].setAttribute('transform', 'translate(180,' + pileY(i) + ')');
      }
    }
    function repaint() {
      for (var i = 0; i < arts.length; i++) { if (arts[i].parentNode) { arts[i].parentNode.removeChild(arts[i]); } }
      arts = [];
      for (i = 0; i < order.length; i++) {
        (function (i) {
          var n = order[i], g = G(st, 180, 0);
          ink(S('ellipse', { cx: 0, cy: 0, rx: RW[n], ry: 13, fill: COL[n] }, g), 3.4);
          S('ellipse', { cx: -RW[n] * .3, cy: -4, rx: RW[n] * .3, ry: 4, fill: '#FFFFFF', opacity: '.34' }, g);
          arts.push(g);
        })(i);
      }
      /* hit layers on top of every pancake */
      for (i = 0; i < order.length; i++) {
        (function (i) {
          var z = G(st, 180, pileY(i));
          S('rect', { x: -RW[order[i]], y: -13, width: RW[order[i]] * 2, height: 26,
            fill: '#FFFFFF', opacity: '0', 'pointer-events': 'all' }, z);
          tap(z, function () {
            if (busy) { return; }
            busy = true;
            var head = order.slice(0, i + 1).reverse();
            order = head.concat(order.slice(i + 1));
            BS.SFX.drop();
            repaint();
            setTimeout(function () {
              busy = false;
              if (order[0] === 1 && order[1] === 2 && order[2] === 3) { BS.win(); }
            }, 240);
          });
        })(i);
      }
      layout();
    }
    repaint();
    A.lift(st);
  }
},

/* 77 — the frozen lake.
   She picks a direction, not a square. The penguin slides until something
   stops him, so the rocks are not obstacles to avoid, they are the only
   brakes he has. */
{
  ask: 'Slide the penguin onto the fish. On ice he cannot stop — he slides until something blocks him.',
  hint: 'He only stops when he hits a rock or the edge. Which rock could you use to stop him in the right place?',
  tell: 'Left, then down, then left again.',
  why: 'You used the rocks as brakes instead of dodging them. The thing in the way was the thing you needed.',
  build: function (st) {
    scene(st, 'day', { hills: false, ground: false, vignette: false });
    var C = 6, R = 4;
    function gx(c) { return 58 + c * 42; }
    function gy(r) { return 38 + r * 42; }
    /* (1,0) stops the first slide, (2,3) the second, (0,2) the third.
       (5,2) and (3,3) are decoys -- and (3,3) is load-bearing: with the decoy
       at (4,3) instead, sliding straight down then left solved it in two, and
       a two-move version of this is not a puzzle. Verified by BFS. */
    var ROCK = { '1,0': 1, '2,3': 1, '0,2': 1, '5,2': 1, '3,3': 1 };
    var start = [4, 0], goal = [1, 2];
    var at = start.slice(), busy = false, c, r;
    for (r = 0; r < R; r++) {
      for (c = 0; c < C; c++) {
        ink(S('rect', { x: gx(c) - 20, y: gy(r) - 20, width: 40, height: 40, rx: 6,
          fill: (c + r) % 2 ? '#DCF1FB' : '#EDF8FD' }, st), 1.6)
          .setAttribute('stroke', '#B7DCEE');
      }
    }
    for (var k in ROCK) {
      if (!ROCK.hasOwnProperty(k)) { continue; }
      var p = k.split(',');
      var rg = G(st, gx(+p[0]), gy(+p[1]));
      ink(S('path', { d: 'M-16,13 q-5,-14 5,-19 q12,-7 18,3 q5,11 -4,16 Z', fill: '#8F98A8' }, rg), 3);
      S('path', { d: 'M-7,-2 q6,-5 12,0', fill: 'none', stroke: '#727C8C', 'stroke-width': 2.2 }, rg);
    }
    var fishG = animal(st, { kind: 'fish', x: gx(goal[0]), y: gy(goal[1]), size: 14, fill: '#F0466F', bob: false });
    var peng = animal(st, { kind: 'penguin', x: gx(start[0]), y: gy(start[1]) - 6, size: 11, fill: '#3E4657', bob: false });

    var DIRS = [[0, -1, 'up'], [1, 0, 'right'], [0, 1, 'down'], [-1, 0, 'left']];
    function slide(dc, dr) {
      var c2 = at[0], r2 = at[1];
      while (true) {
        var nc = c2 + dc, nr = r2 + dr;
        if (nc < 0 || nc >= C || nr < 0 || nr >= R || ROCK[nc + ',' + nr]) { break; }
        c2 = nc; r2 = nr;
      }
      return [c2, r2];
    }
    /* the pad sits below the ice, clear of every grid hit area -- the two
       overlapping when the grid was six by five was the first thing that
       broke here */
    function button(x, y, dc, dr, d) {
      var g = G(st, x, y);
      ink(S('circle', { cx: 0, cy: 0, r: 17, fill: '#FFE7A8' }, g), 3);
      var a = S('path', { d: 'M0,-9 L8,3 L3,3 L3,9 L-3,9 L-3,3 L-8,3 Z', fill: '#F5A623' }, g);
      ink(a, 2.2);
      a.setAttribute('transform', 'rotate(' + d + ')');
      pad(g, 40, 40);
      tap(g, function () {
        if (busy) { return; }
        var to = slide(dc, dr);
        if (to[0] === at[0] && to[1] === at[1]) { BS.nope(g); return; }
        busy = true; at = to;
        glide(peng, gx(at[0]), gy(at[1]) - 6, 300);
        BS.SFX.grab();
        setTimeout(function () {
          busy = false;
          if (at[0] === goal[0] && at[1] === goal[1]) { BS.win(); }
        }, 340);
      });
    }
    button(180, 212, 0, -1, 0);      /* up    */
    button(144, 246, -1, 0, 270);    /* left  */
    button(216, 246, 1, 0, 90);      /* right */
    button(180, 280, 0, 1, 180);     /* down  */
    A.lift(st);
  }
},

/* 78 — weights on both pans.
   Everything else in the app puts weights on one side. Here the 1 can go in
   WITH the apples, which is the only way to reach 2 from a 1 and a 3. */
{
  ask: 'Weigh out exactly 2 apples’ worth. You have a 1 weight and a 3 weight, and either pan will take them.',
  hint: 'You cannot make 2 from 1 and 3 by adding. What if a weight sat next to the apples?',
  tell: 'Put the 3 on the empty pan, and the 1 on the pan with the apples.',
  why: 'A weight on the same side as the apples takes away instead of adding. Three take away one is two.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 254, vignette: false });
    ink(S('path', { d: 'M166,238 L194,238 L180,142 Z', fill: '#8A7BA8' }, st));
    var beam = G(st, 180, 136);
    ink(S('rect', { x: -128, y: -5, width: 256, height: 10, rx: 5, fill: '#C9BEE2' }, beam), 3.5);
    ink(S('path', { d: 'M-116,10 L-40,10 L-52,40 L-104,40 Z', fill: '#C9BEE2' }, beam), 3.5);
    ink(S('path', { d: 'M116,10 L40,10 L52,40 L104,40 Z', fill: '#C9BEE2' }, beam), 3.5);
    /* the apples live on the left pan and never move */
    var ag = G(beam, -92, -4);
    var i;
    for (i = 0; i < 2; i++) {
      ink(S('circle', { cx: -12 + i * 24, cy: 0, r: 12, fill: '#F0466F' }, ag), 3);
      ink(S('line', { x1: -12 + i * 24, y1: -12, x2: -10 + i * 24, y2: -19 }, ag), 2.4)
        .setAttribute('stroke', '#4FAF6D');
    }
    var side = { w1: null, w3: null };
    function weight(n, hx, hy, col) {
      var g = G(st, hx, hy);
      ink(S('path', { d: 'M-17,14 L-12,-12 L12,-12 L17,14 Z', fill: col }, g), 3);
      ink(S('path', { d: 'M-7,-12 q7,-9 14,0', fill: 'none' }, g), 3);
      txt(String(n), { x: 0, y: 9, 'font-size': 15, fill: '#241534' }, g);
      pad(g, 46, 46);
      return g;
    }
    var w1 = weight(1, 74, 250, '#6EC6E8');
    var w3 = weight(3, 286, 250, '#FFC93C');
    /* the two places a weight can sit, plus its home */
    var PAN = { L: [118, 152], R: [258, 152] };
    function tilt() {
      var l = 2 + (side.w1 === 'L' ? 1 : 0) + (side.w3 === 'L' ? 3 : 0);
      var r = (side.w1 === 'R' ? 1 : 0) + (side.w3 === 'R' ? 3 : 0);
      var d = Math.max(-9, Math.min(9, (l - r) * 3));
      beam.setAttribute('transform', 'translate(180,136) rotate(' + d + ')');
      return l === r;
    }
    function wire(el, key, home) {
      drag(el, {
        clamp: [56, 104, 306, 262],
        onDrop: function (x, y, back) {
          var k, best = null, bd = 1e9;
          for (k in PAN) {
            if (!PAN.hasOwnProperty(k)) { continue; }
            var d = Math.abs(PAN[k][0] - x) + Math.abs(PAN[k][1] - y);
            if (d < bd) { bd = d; best = k; }
          }
          if (bd > 78) { side[key] = null; glide(el, home[0], home[1], 240); tilt(); return; }
          side[key] = best;
          glide(el, PAN[best][0], PAN[best][1], 240);
          BS.SFX.drop();
          setTimeout(function () {
            if (tilt() && side.w1 && side.w3) { BS.win(); }
            else if (side.w1 && side.w3) { BS.nope(el); }
          }, 280);
        }
      });
    }
    wire(w1, 'w1', [74, 250]);
    wire(w3, 'w3', [286, 250]);
    txt('apples', { x: 102, y: 196, 'font-size': 12, fill: '#241534', opacity: '.55' }, st);
    tilt();
    A.lift(st);
  }
},

/* 79 — the doubling feeders.
   You cannot pour a chosen amount. Pouring always doubles whatever is in the
   feeder you pour into, so the size of the move is decided by the board and
   not by her. Four moves, and the search proves there is no shorter one. */
{
  ask: 'Make all three feeders equal. Tap one feeder then another, and it pours over just enough to double it.',
  hint: 'Twelve seeds shared three ways is four each. Which feeder can you get to four first?',
  tell: 'Left into middle, left into middle again, then left into right, twice.',
  why: 'You never chose how much to pour — the board did. All you could choose was the order.',
  build: function (st) {
    scene(st, 'meadow', { clouds: true, hills: false, ground: '#8FCB77', groundY: 256, tufts: false, vignette: false });
    /* [7,2,3] was the first start tried and BFS solved it in two pours.
       Every three-way split of twelve was searched; [10,1,1] is the only
       family that needs four, so that is the one shipped. */
    var have = [10, 1, 1], sel = -1, busy = false;
    var XS = [72, 180, 288], boxes = [], counts = [];
    var i;
    for (i = 0; i < 3; i++) {
      (function (i) {
        var g = G(st, XS[i], 150);
        var bowl = ink(S('path', { d: 'M-42,-30 L42,-30 L32,42 L-32,42 Z', fill: '#F3E4C6' }, g), 3.5);
        ink(S('line', { x1: -46, y1: -30, x2: 46, y2: -30 }, g), 4);
        var seeds = S('g', {}, g);
        var lab = txt('', { x: 0, y: 68, 'font-size': 18, fill: '#241534' }, g);
        boxes.push({ g: g, bowl: bowl, seeds: seeds, lab: lab });
        counts.push(lab);
        pad(g, 100, 118, 8);
        tap(g, function () {
          if (busy) { return; }
          if (sel < 0) {
            if (have[i] === 0) { BS.nope(g); return; }
            sel = i; paint(); BS.SFX.tap(); return;
          }
          if (sel === i) { sel = -1; paint(); return; }
          var need = have[i];
          if (need === 0 || have[sel] < need) { BS.nope(g); sel = -1; paint(); return; }
          busy = true;
          have[sel] -= need; have[i] += need;
          sel = -1; paint(); BS.SFX.drop();
          setTimeout(function () {
            busy = false;
            if (have[0] === 4 && have[1] === 4 && have[2] === 4) { BS.win(); }
          }, 280);
        });
      })(i);
    }
    function paint() {
      for (var j = 0; j < 3; j++) {
        A.clear(boxes[j].seeds);
        seedPile(boxes[j].seeds, have[j], '#C98A3B');
        boxes[j].lab.textContent = String(have[j]);
        boxes[j].bowl.setAttribute('fill', sel === j ? '#FFD86B' : '#F3E4C6');
      }
    }
    paint();
    A.lift(st);
  }
},

/* ==========================================================
   80-85 — how the world behaves. Every wrong answer here is a real
   thing children believe, not a random alternative.
   ========================================================== */

/* 80 — the pulley. Down on one side is up on the other. */
{
  ask: 'The mouse pulls her end of the rope downwards. Which way does the basket go?',
  hint: 'The rope cannot get longer. If more of it is on her side, what happened to the other side?',
  tell: 'Upwards. The rope goes over the wheel, so pulling down on one end lifts the other.',
  why: 'The rope is one length. Whatever one end takes, the other end has to give.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 258, vignette: false });
    ink(S('rect', { x: 44, y: 22, width: 272, height: 12, rx: 5, fill: '#8A5F3B' }, st), 3);
    ink(S('circle', { cx: 132, cy: 54, r: 20, fill: '#C9BEE2' }, st), 4);
    ink(S('circle', { cx: 132, cy: 54, r: 6, fill: '#8A7BA8' }, st), 2.6);
    ink(S('path', { d: 'M132,34 L128,22', fill: 'none' }, st), 3);
    /* rope over the wheel: mouse on the left, basket on the right */
    ink(S('line', { x1: 112, y1: 54, x2: 112, y2: 150 }, st), 4).setAttribute('stroke', '#B08A5A');
    ink(S('line', { x1: 152, y1: 54, x2: 152, y2: 128 }, st), 4).setAttribute('stroke', '#B08A5A');
    ink(S('path', { d: 'M136,128 L168,128 L162,160 L142,160 Z', fill: '#C9955C' }, st), 3.5);
    ink(S('circle', { cx: 152, cy: 144, r: 7, fill: '#F0466F' }, st), 2.4);
    animal(st, { kind: 'mouse', x: 96, y: 176, size: 15, fill: '#C9BFD6', bob: false });
    /* the mouse's tug, drawn as a downward arrow she cannot miss */
    ink(S('path', { d: 'M112,150 L112,196', fill: 'none' }, st), 5).setAttribute('stroke', '#3FBF7F');
    ink(S('path', { d: 'M104,190 L112,204 L120,190 Z', fill: '#3FBF7F' }, st), 2.4);

    options(st, 238, function (gg, i) {
      ink(S('circle', { cx: 0, cy: 0, r: 27, fill: '#FFE7A8' }, gg), 3);
      if (i === 2) {
        ink(S('line', { x1: 0, y1: 14, x2: 0, y2: -8 }, gg), 5).setAttribute('stroke', '#F0466F');
        ink(S('path', { d: 'M-9,-4 L0,-18 L9,-4 Z', fill: '#F0466F' }, gg), 2.4);
      } else if (i === 0) {
        ink(S('line', { x1: 0, y1: -14, x2: 0, y2: 8 }, gg), 5).setAttribute('stroke', '#8A7BA8');
        ink(S('path', { d: 'M-9,4 L0,18 L9,4 Z', fill: '#8A7BA8' }, gg), 2.4);
      } else {
        ink(S('line', { x1: -13, y1: 0, x2: 13, y2: 0 }, gg), 5).setAttribute('stroke', '#8A7BA8');
      }
    }, 2);
  }
},

/* 81 — the lever. Not who is heavier, but where they sit. */
{
  ask: 'The bear is much heavier than the mouse, but the plank is level. How can that be?',
  hint: 'Look how far each one is sitting from the middle, not how big they are.',
  tell: 'The mouse is sitting right out at the end, and the bear is squashed up near the middle.',
  why: 'Sitting further out counts for more. A small animal a long way from the middle beats a big one close in.',
  build: function (st) {
    scene(st, 'meadow', { clouds: true, hills: false, ground: '#8FCB77', groundY: 234, tufts: false, vignette: false });
    ink(S('path', { d: 'M164,232 L196,232 L180,178 Z', fill: '#9C7A54' }, st), 3.5);
    ink(S('rect', { x: 30, y: 168, width: 300, height: 12, rx: 6, fill: '#C9955C' }, st), 3.5);
    var i;
    for (i = 0; i < 9; i++) {
      ink(S('line', { x1: 46 + i * 36, y1: 168, x2: 46 + i * 36, y2: 162 }, st), 2)
        .setAttribute('stroke', '#8A5F3B');
    }
    /* bear close in, mouse far out -- and it balances */
    animal(st, { kind: 'bear', x: 224, y: 128, size: 20, fill: '#B58756', bob: false });
    animal(st, { kind: 'mouse', x: 52, y: 140, size: 13, fill: '#C9BFD6', bob: false });
    options(st, 244, function (gg, i) {
      var lines = [
        ['the mouse', 'is heavier'],
        ['the mouse', 'sits further', 'from the middle'],
        ['the plank', 'is broken']
      ][i];
      for (var k = 0; k < lines.length; k++) {
        txt(lines[k], { x: 0, y: -8 + k * 15, 'font-size': 11, fill: '#241534' }, gg);
      }
    }, 1);
  }
},

/* 82 — the tracks. The tread points backwards from the way you went. */
{
  ask: 'The bike rode across the mud and away. Which way did it go?',
  hint: 'Squeeze some mud between your fingers. It squirts out behind, not in front.',
  tell: 'To the right. The mud is flicked backwards, so the little tails point the way it came from.',
  why: 'The mud is thrown out behind the wheel, so the mess points backwards and the bike went the other way.',
  build: function (st) {
    scene(st, 'meadow', { clouds: true, hills: false, ground: '#A98454', groundY: 132, tufts: false, vignette: false });
    ink(S('rect', { x: 0, y: 132, width: 360, height: 168, fill: '#8A6A44' }, st), 0);
    /* a tyre track: chevrons, plus mud flicked back to the LEFT */
    var i;
    for (i = 0; i < 8; i++) {
      var x = 34 + i * 42;
      ink(S('path', { d: 'M' + x + ',170 L' + (x + 15) + ',186 L' + x + ',202', fill: 'none' }, st), 5)
        .setAttribute('stroke', '#5E4830');
      /* the splatter trails backwards, to the left of each chevron */
      ink(S('path', { d: 'M' + (x - 4) + ',166 q-11,-5 -19,-2', fill: 'none' }, st), 3)
        .setAttribute('stroke', '#6E5638');
      ink(S('path', { d: 'M' + (x - 4) + ',206 q-11,5 -19,2', fill: 'none' }, st), 3)
        .setAttribute('stroke', '#6E5638');
    }
    txt('the mud is flicked this way', { x: 180, y: 240, 'font-size': 12, fill: '#F3E4C6', opacity: '.85' }, st);
    ink(S('path', { d: 'M232,254 L120,254', fill: 'none' }, st), 4).setAttribute('stroke', '#F3E4C6');
    ink(S('path', { d: 'M128,246 L112,254 L128,262 Z', fill: '#F3E4C6' }, st), 2);
    var L = G(st, 62, 96); pad(L, 88, 62);
    ink(S('rect', { x: -40, y: -26, width: 80, height: 52, rx: 11, fill: '#FFF6E6' }, L), 3);
    ink(S('path', { d: 'M18,0 L-14,-16 L-14,16 Z', fill: '#8A7BA8' }, L), 2.6)
      .setAttribute('transform', 'rotate(180)');
    var R = G(st, 298, 96); pad(R, 88, 62);
    ink(S('rect', { x: -40, y: -26, width: 80, height: 52, rx: 11, fill: '#FFF6E6' }, R), 3);
    ink(S('path', { d: 'M18,0 L-14,-16 L-14,16 Z', fill: '#3FBF7F' }, R), 2.6);
    tap(L, function () { BS.nope(L); });
    tap(R, function () { BS.win(); });
    A.lift(st);
  }
},

/* 83 — two stones, one big one small.
   "The heavy one lands first" is what nearly everybody says, and it is what
   people believed for two thousand years. */
{
  ask: 'A big heavy stone and a small light one are dropped together. Which hits the ground first?',
  hint: 'Try it with a book and a pencil, held out at the same height. Watch carefully.',
  tell: 'Neither. They land together.',
  why: 'Heavy things are pulled harder, but they are also harder to get moving. The two cancel out exactly.',
  build: function (st) {
    scene(st, 'day', { clouds: true, hills: true, ground: '#8FCB77', groundY: 214, tufts: false, vignette: false });
    ink(S('rect', { x: 74, y: 44, width: 26, height: 172, rx: 4, fill: '#B6A9CE' }, st), 3);
    ink(S('rect', { x: 260, y: 44, width: 26, height: 172, rx: 4, fill: '#B6A9CE' }, st), 3);
    ink(S('circle', { cx: 87, cy: 74, r: 22, fill: '#8A7BA8' }, st), 3.5);
    ink(S('circle', { cx: 273, cy: 74, r: 10, fill: '#8A7BA8' }, st), 3);
    var i;
    for (i = 0; i < 3; i++) {
      ink(S('line', { x1: 87, y1: 104 + i * 16, x2: 87, y2: 112 + i * 16 }, st), 2.4)
        .setAttribute('stroke', '#6E6699');
      ink(S('line', { x1: 273, y1: 92 + i * 16, x2: 273, y2: 100 + i * 16 }, st), 2.4)
        .setAttribute('stroke', '#6E6699');
    }
    txt('heavy', { x: 87, y: 178, 'font-size': 13, fill: '#241534', opacity: '.7' }, st);
    txt('light', { x: 273, y: 178, 'font-size': 13, fill: '#241534', opacity: '.7' }, st);
    BS.chips(['the heavy one', 'the light one', 'they land together'], 2);
  }
},

/* 84 — the candles. The short one has been burning longest. */
{
  ask: 'These three candles were all the same size this morning. Which one was lit first?',
  hint: 'Burning makes a candle shorter, not taller.',
  tell: 'The shortest one. It has had the longest to melt away.',
  why: 'You read the past out of the present. How much is gone tells you how long it has been going.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 246, vignette: false });
    var Hh = [58, 118, 88], XS = [88, 180, 272];
    var i;
    for (i = 0; i < 3; i++) {
      (function (i) {
        var base = 244, top = base - Hh[i];
        var g = G(st, XS[i], 0);
        ink(S('rect', { x: -20, y: top, width: 40, height: Hh[i], rx: 5, fill: '#FFF1D0' }, g), 3.5);
        S('rect', { x: -13, y: top + 6, width: 8, height: Hh[i] - 14, rx: 4, fill: '#FFFFFF', opacity: '.5' }, g);
        ink(S('line', { x1: 0, y1: top, x2: 0, y2: top - 9 }, g), 2.4);
        ink(S('path', { d: 'M0,' + (top - 30) + ' q13,16 0,22 q-13,-6 0,-22 Z', fill: '#FFC93C' }, g), 2.6);
        S('path', { d: 'M0,' + (top - 20) + ' q6,8 0,12 q-6,-4 0,-12 Z', fill: '#FFF6E6', opacity: '.8' }, g);
        ink(S('ellipse', { cx: 0, cy: base, rx: 27, ry: 8, fill: '#B6A9CE' }, g), 3);
        var z = G(st, XS[i], base - Hh[i] / 2);
        pad(z, 62, Hh[i] + 44);
        tap(z, function () { if (i === 0) { BS.win(); } else { BS.nope(g); } });
      })(i);
    }
    A.lift(st);
  }
},

/* 85 — the windsock. Everything loose points the same way. */
{
  ask: 'Which flag is drawn wrong?',
  hint: 'The wind cannot blow two ways at once. Look at the smoke and the kite as well.',
  tell: 'The middle one. Everything else is streaming to the right, so it should be too.',
  why: 'One wind, one direction. When a picture disagrees with itself, something in it must be wrong.',
  build: function (st) {
    scene(st, 'day', { clouds: true, hills: true, ground: '#8FCB77', groundY: 236, tufts: false, vignette: false });
    /* smoke from a chimney, streaming right */
    ink(S('rect', { x: 22, y: 172, width: 56, height: 64, rx: 4, fill: '#C4553F' }, st), 3);
    ink(S('rect', { x: 34, y: 148, width: 18, height: 28, rx: 3, fill: '#9C4433' }, st), 2.6);
    var i;
    for (i = 0; i < 4; i++) {
      S('circle', { cx: 46 + i * 21, cy: 140 - i * 9, r: 8 + i * 2, fill: '#FFFFFF', opacity: '.62' }, st);
    }
    /* a kite with its tail streaming right */
    ink(S('path', { d: 'M282,54 L306,84 L282,114 L258,84 Z', fill: '#F0466F' }, st), 3);
    ink(S('path', { d: 'M282,114 q16,12 32,6 q-14,14 -30,10', fill: 'none' }, st), 3);
    /* three flags. the middle one blows the wrong way. */
    var FX = [96, 190, 288], DIR = [1, -1, 1];
    for (i = 0; i < 3; i++) {
      (function (i) {
        var g = G(st, FX[i], 0);
        ink(S('line', { x1: 0, y1: 234, x2: 0, y2: 150 }, g), 4).setAttribute('stroke', '#8A5F3B');
        var d = DIR[i];
        ink(S('path', { d: 'M0,152 q' + (26 * d) + ',-8 ' + (48 * d) + ',6 q' + (-22 * d) + ',14 ' + (-48 * d) + ',10 Z',
          fill: i === 1 ? '#6EC6E8' : '#FFC93C' }, g), 3);
        var z = G(st, FX[i] + 20 * d, 176);
        pad(z, 68, 62);
        tap(z, function () { if (i === 1) { BS.win(); } else { BS.nope(g); } });
      })(i);
    }
    A.lift(st);
  }
},

/* ==========================================================
   86-92 — deduction, where the rule is never stated.
   ========================================================== */

/* 86 — the mislabelled boxes.
   Every label is wrong, and that is not a nuisance, it is the whole
   information. One look into the right box settles all three. */
{
  ask: 'Every label is on the wrong box. Which box should you look in to work out all three?',
  hint: 'A wrong label still tells you something: it tells you what is NOT inside.',
  tell: 'The one labelled "both". It cannot be both, so whatever you pull out tells you the lot.',
  why: 'You picked the box that could not lie to you twice. Being wrong on purpose is still information.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false, vignette: false });
    txt('every label is WRONG', { x: 180, y: 40, 'font-size': 15, fill: '#241534', opacity: '.7' }, st);
    var LAB = ['apples', 'pears', 'both'];
    var XS = [72, 180, 288];
    for (var i = 0; i < 3; i++) {
      (function (i) {
        var g = G(st, XS[i], 148);
        ink(S('path', { d: 'M-44,-34 L44,-34 L38,44 L-38,44 Z', fill: '#C9955C' }, g), 3.5);
        ink(S('rect', { x: -48, y: -42, width: 96, height: 14, rx: 5, fill: '#B07A4C' }, g), 3);
        ink(S('rect', { x: -34, y: -6, width: 68, height: 26, rx: 6, fill: '#FFF6E6' }, g), 2.6);
        txt(LAB[i], { x: 0, y: 12, 'font-size': 14, fill: '#241534' }, g);
        pad(g, 104, 104);
        tap(g, function () { if (i === 2) { BS.win(); } else { BS.nope(g); } });
      })(i);
    }
    txt('tap the box you would look in', { x: 180, y: 234, 'font-size': 12, fill: '#241534', opacity: '.55' }, st);
    A.lift(st);
  }
},

/* 87 — warmer, colder.
   Real deduction with feedback: she has to shrink a range, not guess. The
   number is 63, and honest hot-and-cold makes it findable in six taps. */
{
  ask: 'I am thinking of a number. Tap one and I will tell you if mine is higher or lower.',
  hint: 'Guess right in the middle. Whatever I say, you have thrown half the numbers away.',
  tell: 'Halve it every time: 50, then 75, then 62, and close in.',
  why: 'Guessing in the middle throws away half the numbers every single time. That is why it is so fast.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false, vignette: false });
    var SECRET = 63, lo = 1, hi = 100, guesses = 0;
    var bar = G(st, 180, 96);
    ink(S('rect', { x: -150, y: -20, width: 300, height: 40, rx: 12, fill: '#FFF6E6' }, bar), 3);
    var range = txt('somewhere from 1 to 100', { x: 0, y: 6, 'font-size': 16, fill: '#241534' }, bar);
    var says = txt('', { x: 180, y: 150, 'font-size': 17, fill: '#241534' }, st);
    var pick = txt('', { x: 180, y: 186, 'font-size': 26, fill: '#8A6FD0' }, st);
    var cur = 50;
    function paint() {
      range.textContent = 'somewhere from ' + lo + ' to ' + hi;
      pick.textContent = String(cur);
    }
    function step(d) {
      cur = Math.max(lo, Math.min(hi, cur + d));
      paint(); BS.SFX.tap();
    }
    function button(x, label, d) {
      var g = G(st, x, 238);
      ink(S('rect', { x: -34, y: -21, width: 68, height: 42, rx: 10, fill: '#FFE7A8' }, g), 3);
      txt(label, { x: 0, y: 7, 'font-size': 17, fill: '#241534' }, g);
      pad(g, 76, 50);
      tap(g, function () { step(d); });
    }
    button(48, '-10', -10); button(122, '-1', -1);
    button(238, '+1', 1); button(312, '+10', 10);
    var go = G(st, 180, 238);
    ink(S('rect', { x: -42, y: -21, width: 84, height: 42, rx: 10, fill: '#3FBF7F' }, go), 3);
    txt('Guess', { x: 0, y: 7, 'font-size': 17, fill: '#FFF6E6' }, go);
    pad(go, 92, 50);
    tap(go, function () {
      guesses++;
      if (cur === SECRET) { says.textContent = 'That is it!'; BS.win(); return; }
      if (cur < SECRET) { lo = Math.max(lo, cur + 1); says.textContent = 'Higher than ' + cur; }
      else { hi = Math.min(hi, cur - 1); says.textContent = 'Lower than ' + cur; }
      BS.SFX.bad();
      paint();
    });
    paint();
    A.lift(st);
  }
},

/* 88 — the colour code.
   Two rows already guessed, with how many are in exactly the right place.
   Only one arrangement of the three colours fits both scores. */
{
  ask: 'Put the three colours in the right order. The two tries below show how many were in the correct place.',
  hint: 'Both tries got none right. So no colour belongs where either try put it.',
  tell: 'Green, red, blue.',
  why: 'Two guesses that scored nothing told you six things at once — and six was enough to leave only one answer.',
  build: function (st) {
    scene(st, 'night', { hills: false, ground: false, vignette: false });
    var COL = ['#F0466F', '#3FBF7F', '#6EC6E8'];
    var NAME = ['red', 'green', 'blue'];
    var ANSWER = [1, 0, 2];                    /* green, red, blue */
    /* The first pair tried here scored 1 and 1, and SIX codes fitted those two
       scores -- the puzzle could not be reasoned out, only guessed. Searching
       all 27 codes against all pairs of guesses, only six setups pin exactly
       one answer without a guess scoring 3, and every one of them has both
       guesses scoring ZERO. So that is what these are: two tries, nothing
       right, and between them they rule out everything else. */
    var TRIES = [[0, 2, 1], [2, 1, 0]];        /* red-blue-green, blue-green-red */
    function score(g) {
      var n = 0;
      for (var i = 0; i < 3; i++) { if (g[i] === ANSWER[i]) { n++; } }
      return n;
    }
    var i, k;
    for (i = 0; i < TRIES.length; i++) {
      (function (i) {
        var y = 66 + i * 62;
        for (k = 0; k < 3; k++) {
          ink(S('circle', { cx: 96 + k * 46, cy: y, r: 19, fill: COL[TRIES[i][k]] }, st), 3);
        }
        ink(S('rect', { x: 232, y: y - 19, width: 74, height: 38, rx: 10, fill: '#FFF6E6' }, st), 2.6);
        txt(score(TRIES[i]) + ' right', { x: 269, y: y + 6, 'font-size': 14, fill: '#241534' }, st);
      })(i);
    }
    /* her row: tap a slot to cycle its colour */
    var mine = [0, 0, 0], discs = [];
    for (i = 0; i < 3; i++) {
      (function (i) {
        var g = G(st, 96 + i * 46, 206);
        var c = ink(S('circle', { cx: 0, cy: 0, r: 21, fill: COL[0] }, g), 3.5);
        discs.push(c);
        pad(g, 50, 50);
        tap(g, function () {
          mine[i] = (mine[i] + 1) % 3;
          c.setAttribute('fill', COL[mine[i]]);
          BS.SFX.tap();
        });
      })(i);
    }
    var go = G(st, 278, 206);
    ink(S('rect', { x: -40, y: -21, width: 80, height: 42, rx: 10, fill: '#3FBF7F' }, go), 3);
    txt('Try', { x: 0, y: 7, 'font-size': 17, fill: '#FFF6E6' }, go);
    pad(go, 90, 50);
    tap(go, function () {
      if (mine[0] === ANSWER[0] && mine[1] === ANSWER[1] && mine[2] === ANSWER[2]) { BS.win(); }
      else { BS.nope(go); }
    });
    txt('your try', { x: 96, y: 252, 'font-size': 12, fill: '#F3E4C6', opacity: '.7' }, st);
    A.lift(st);
  }
},

/* 89 — the lily pond.
   Doubling runs away from you. Half full is not halfway through.
   The wrong answers are 'half of 10' and 'one less than half'. */
{
  ask: 'The lily patch doubles in size every day. It covers the whole pond on day 10. Which day was it half covered?',
  hint: 'Run it backwards. If it doubled to become full, what was it the day before?',
  tell: 'Day 9. It doubled once more and filled the pond.',
  why: 'Doubling does most of its work right at the end. Half the pond was only one day from all of it.',
  build: function (st) {
    scene(st, 'water', { hills: false, ground: false, vignette: false });
    ink(S('ellipse', { cx: 180, cy: 130, rx: 148, ry: 84, fill: '#5FB6DE' }, st), 4);
    var i, a;
    /* a pond half covered in lilies */
    for (i = 0; i < 9; i++) {
      a = i * 0.7;
      var lx = 116 + (i % 3) * 44, ly = 92 + Math.floor(i / 3) * 38;
      ink(S('ellipse', { cx: lx, cy: ly, rx: 21, ry: 15, fill: '#5FD08A' }, st), 3);
      ink(S('path', { d: 'M' + lx + ',' + ly + ' L' + (lx - 7) + ',' + (ly - 12), fill: 'none' }, st), 2.2);
    }
    txt('day 10: the whole pond', { x: 180, y: 236, 'font-size': 13, fill: '#241534', opacity: '.65' }, st);
    BS.chips(['day 5', 'day 8', 'day 9', 'day 1'], 2);
  }
},

/* 90 — the handshakes. Everyone shakes everyone once, and the pairs are
   what she counts, not the people. Four is the count for four friends. */
{
  ask: 'Four friends meet, and every one of them shakes hands with every other one, once. How many handshakes?',
  hint: 'Count from the first friend, then the second, but do not count the same shake twice.',
  tell: 'Six. Three, then two more, then one more.',
  why: 'You counted the pairs, not the people. Once you have shaken a hand, that shake is already counted.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false, vignette: false });
    var P = [[96, 78], [264, 78], [96, 194], [264, 194]];
    var COL = ['#F0466F', '#6EC6E8', '#FFC93C', '#3FBF7F'];
    var i, j;
    for (i = 0; i < 4; i++) {
      for (j = i + 1; j < 4; j++) {
        ink(S('line', { x1: P[i][0], y1: P[i][1], x2: P[j][0], y2: P[j][1] }, st), 2.4)
          .setAttribute('stroke', '#B6A9CE');
      }
    }
    for (i = 0; i < 4; i++) {
      critter(st, { x: P[i][0], y: P[i][1], size: 21, fill: COL[i], ears: 'round', bob: false, shadow: false });
    }
    BS.chips(['3', '4', '6', '8'], 2);
  }
},

/* 91 — days of the week. Sevens land you back where you started, so the
   remainder is the only part that matters. */
{
  ask: 'Today is Tuesday. What day will it be in 10 days?',
  hint: 'Seven days from now is Tuesday again. How many are left over after that?',
  tell: 'Friday. Seven days takes you back to Tuesday, and three more makes Friday.',
  why: 'Every seven days brings the same day back round, so only the leftovers move you along.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false, vignette: false });
    var D = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var i;
    for (i = 0; i < 7; i++) {
      var g = G(st, 34 + i * 49, 92);
      ink(S('rect', { x: -22, y: -30, width: 44, height: 60, rx: 8,
        fill: i === 1 ? '#FFD86B' : '#FFF6E6' }, g), 3);
      txt(D[i], { x: 0, y: -6, 'font-size': 13, fill: '#241534' }, g);
      if (i === 1) { txt('today', { x: 0, y: 16, 'font-size': 10, fill: '#241534', opacity: '.65' }, g); }
    }
    ink(S('path', { d: 'M40,150 q140,44 280,0', fill: 'none' }, st), 4)
      .setAttribute('stroke', '#8A7BA8');
    ink(S('path', { d: 'M308,148 L324,156 L306,164 Z', fill: '#8A7BA8' }, st), 2);
    txt('10 days later', { x: 180, y: 196, 'font-size': 16, fill: '#241534', opacity: '.75' }, st);
    BS.chips(['Thursday', 'Friday', 'Saturday', 'Tuesday'], 1);
  }
},

/* 92 — the rule behind the door.
   Three got in and three did not. Nothing about colour or size explains it;
   the ones that got in all have a hole through them. */
{
  ask: 'Three of these got through the door and three did not. Which of the two at the bottom gets through?',
  hint: 'It is nothing to do with colour, and nothing to do with size. Look right through them.',
  tell: 'The ring. Everything that got in has a hole through the middle.',
  why: 'You worked out a rule nobody told you, from six examples and no explanation at all.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false, vignette: false });
    function holed(parent, kind, size, fill, hole) {
      var g = G(parent, 0, 0);
      if (kind === 'circle') { ink(S('circle', { cx: 0, cy: 0, r: size, fill: fill }, g), 3); }
      else if (kind === 'square') { ink(S('rect', { x: -size, y: -size, width: size * 2, height: size * 2, rx: 4, fill: fill }, g), 3); }
      else { ink(S('path', { d: 'M0,' + (-size * 1.08) + ' L' + size + ',' + (size * .78) + ' L' + (-size) + ',' + (size * .78) + ' Z', fill: fill }, g), 3); }
      if (hole) { ink(S('circle', { cx: 0, cy: kind === 'triangle' ? size * .2 : 0, r: size * .38, fill: '#EDE2CE' }, g), 2.4); }
      return g;
    }
    /* got in: a ring, a holed square, a holed triangle -- three colours */
    var IN = [['circle', '#F0466F'], ['square', '#6EC6E8'], ['triangle', '#FFC93C']];
    var OUT = [['circle', '#6EC6E8'], ['square', '#FFC93C'], ['triangle', '#F0466F']];
    var i;
    ink(S('rect', { x: 16, y: 30, width: 156, height: 96, rx: 12, fill: '#DCEFD8' }, st), 3)
      .setAttribute('stroke', '#3FBF7F');
    ink(S('rect', { x: 188, y: 30, width: 156, height: 96, rx: 12, fill: '#F7DDDD' }, st), 3)
      .setAttribute('stroke', '#F0466F');
    txt('got in', { x: 94, y: 50, 'font-size': 13, fill: '#241534', opacity: '.7' }, st);
    txt('turned away', { x: 266, y: 50, 'font-size': 13, fill: '#241534', opacity: '.7' }, st);
    for (i = 0; i < 3; i++) {
      var a = G(st, 46 + i * 48, 92); holed(a, IN[i][0], 17, IN[i][1], true);
      var b = G(st, 218 + i * 48, 92); holed(b, OUT[i][0], 17, OUT[i][1], false);
    }
    /* two candidates, same colour as each other so colour cannot decide it */
    var CAND = [['circle', '#8A6FD0', true], ['square', '#8A6FD0', false]];
    for (i = 0; i < 2; i++) {
      (function (i) {
        var g = G(st, 118 + i * 124, 214);
        ink(S('rect', { x: -46, y: -46, width: 92, height: 92, rx: 12, fill: '#FFF6E6' }, g), 3);
        holed(g, CAND[i][0], 24, CAND[i][1], CAND[i][2]);
        pad(g, 100, 100);
        tap(g, function () { if (i === 0) { BS.win(); } else { BS.nope(g); } });
      })(i);
    }
    A.lift(st);
  }
},

/* ==========================================================
   93-100 — spatial. Things seen from angles nobody drew.
   ========================================================== */

/* 93 — which string is longest.
   Curled up, the longest one looks the shortest. Measured properly the
   answer is the one that wanders most. */
{
  ask: 'Which piece of string is the longest?',
  hint: 'Do not judge by how far it reaches. Follow it along with your finger, round every bend.',
  tell: 'The wiggly one in the middle, even though it does not stretch as far.',
  why: 'How far something reaches and how long it is are two different things. The bends hide the extra.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false, vignette: false });
    /* lengths measured along the path: A about 200, B about 300, C about 240 */
    var PATHS = [
      'M40,72 q54,-26 108,0 q54,26 108,0',
      'M40,150 q26,-34 52,0 q26,34 52,0 q26,-34 52,0 q26,34 52,0 q26,-34 52,0 q26,34 52,0',
      'M40,232 q80,-42 160,0 q60,32 120,-8'
    ];
    var COL = ['#F0466F', '#3FBF7F', '#FFC93C'];
    var i;
    for (i = 0; i < 3; i++) {
      (function (i) {
        var p = ink(S('path', { d: PATHS[i], fill: 'none' }, st), 7);
        p.setAttribute('stroke', COL[i]);
        p.setAttribute('stroke-linecap', 'round');
        /* thin art needs a real hit area, and the three must not overlap */
        var z = G(st, 180, 72 + i * 80);
        pad(z, 320, 62);
        tap(z, function () { if (i === 1) { BS.win(); } else { BS.nope(p); } });
      })(i);
    }
    A.lift(st);
  }
},

/* 94 — two sheets, one on top of the other. */
{
  ask: 'The two see-through sheets are laid one on top of the other. What do you see?',
  hint: 'A square is only dark where BOTH sheets have a square in the same place.',
  tell: 'Only the squares that appear on both sheets stay dark.',
  why: 'You held one picture in your head and laid the other over it, without moving a thing.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false, vignette: false });
    var A1 = [[0, 0], [1, 0], [0, 1], [2, 2]];
    var B1 = [[0, 0], [2, 0], [0, 1], [1, 1], [2, 2]];
    /* the overlap: cells in both */
    var both = [];
    for (var i = 0; i < A1.length; i++) {
      for (var j = 0; j < B1.length; j++) {
        if (A1[i][0] === B1[j][0] && A1[i][1] === B1[j][1]) { both.push(A1[i]); }
      }
    }
    function sheet(x, y, list, fill) {
      var g = G(st, x, y);
      ink(S('rect', { x: -44, y: -44, width: 88, height: 88, rx: 8, fill: '#FFFFFF', opacity: '.55' }, g), 2.6);
      for (var k = 0; k < 3; k++) {
        for (var m = 0; m < 3; m++) {
          var on = false, q;
          for (q = 0; q < list.length; q++) { if (list[q][0] === k && list[q][1] === m) { on = true; } }
          if (on) { cell(g, -28 + k * 28, -28 + m * 28, 26, fill); }
        }
      }
      return g;
    }
    sheet(72, 76, A1, '#8A6FD0');
    txt('+', { x: 160, y: 84, 'font-size': 26, fill: '#241534', opacity: '.6' }, st);
    sheet(248, 76, B1, '#8A6FD0');
    options(st, 218, function (gg, i) {
      var sets = [A1, both, B1];
      cells(gg, sets[i], 20, '#8A6FD0');
    }, 1);
  }
},

/* 95 — behind the wall.
   Only a sliver shows. Two of the three could not possibly poke out like
   that; the third is the only shape that fits what is visible. */
{
  ask: 'Most of the shape is behind the wall. Which shape is it?',
  hint: 'Look at the bit you CAN see. Does it have a corner, or is it curved?',
  tell: 'The star. Those are two of its points sticking out past the wall.',
  why: 'A small piece of something can rule out almost everything else, if you read it carefully.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false, vignette: false });
    /* a star, mostly hidden: only two points show to the right of the wall */
    var hidden = star(st, 118, 96, 56, '#FFC93C', 3);
    ink(S('rect', { x: 0, y: 20, width: 132, height: 156, rx: 6, fill: '#B07A4C' }, st), 4);
    var i;
    for (i = 0; i < 4; i++) {
      ink(S('line', { x1: 0, y1: 58 + i * 30, x2: 132, y2: 58 + i * 30 }, st), 2)
        .setAttribute('stroke', '#9A6E48');
    }
    txt('the wall', { x: 66, y: 196, 'font-size': 12, fill: '#241534', opacity: '.6' }, st);
    options(st, 244, function (gg, i) {
      if (i === 1) { star(gg, 0, 0, 27, '#FFC93C', 3); }
      else if (i === 0) { ink(S('circle', { cx: 0, cy: 0, r: 25, fill: '#6EC6E8' }, gg), 3); }
      else { ink(S('rect', { x: -24, y: -24, width: 48, height: 48, rx: 5, fill: '#3FBF7F' }, gg), 3); }
    }, 1);
  }
},

/* 96 — folding lines.
   A rectangle has two, not four: the diagonals do not work, which is the
   thing almost everyone gets wrong. */
{
  ask: 'How many ways can this rectangle be folded so both halves land exactly on top of each other?',
  hint: 'Try folding it corner to corner in your head. Do the edges really line up?',
  tell: 'Two — across the middle one way, and across the middle the other way.',
  why: 'A rectangle is not a square. Folding it corner to corner leaves the edges sticking out.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false, vignette: false });
    ink(S('rect', { x: 76, y: 66, width: 208, height: 128, rx: 6, fill: '#FFF6E6' }, st), 4);
    ink(S('line', { x1: 180, y1: 66, x2: 180, y2: 194 }, st), 2.6)
      .setAttribute('stroke-dasharray', '8 6');
    ink(S('line', { x1: 76, y1: 130, x2: 284, y2: 130 }, st), 2.6)
      .setAttribute('stroke-dasharray', '8 6');
    ink(S('line', { x1: 76, y1: 66, x2: 284, y2: 194 }, st), 2.6)
      .setAttribute('stroke', '#F0466F');
    ink(S('line', { x1: 284, y1: 66, x2: 76, y2: 194 }, st), 2.6)
      .setAttribute('stroke', '#F0466F');
    txt('the red ones are worth checking', { x: 180, y: 224, 'font-size': 12, fill: '#241534', opacity: '.55' }, st);
    BS.chips(['1', '2', '4', '0'], 1);
  }
},

/* 97 — three straight cuts.
   Six is the answer if the cuts all cross each other, and children reliably
   say four because they picture two cuts and stop. */
{
  ask: 'Three straight cuts across the pancake. What is the most pieces you can end up with?',
  hint: 'Do not cut through the middle every time. Make each new cut cross both of the others.',
  tell: 'Six, if every cut crosses both of the others somewhere different.',
  why: 'Where the cuts cross is what makes the extra pieces. Cuts through one point waste each other.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false, vignette: false });
    ink(S('circle', { cx: 180, cy: 128, r: 84, fill: '#F5C97A' }, st), 4);
    S('circle', { cx: 152, cy: 100, r: 26, fill: '#FFFFFF', opacity: '.24' }, st);
    ink(S('line', { x1: 106, y1: 92, x2: 262, y2: 132 }, st), 3.5).setAttribute('stroke', '#B0763A');
    ink(S('line', { x1: 124, y1: 190, x2: 240, y2: 68 }, st), 3.5).setAttribute('stroke', '#B0763A');
    ink(S('line', { x1: 104, y1: 158, x2: 254, y2: 174 }, st), 3.5).setAttribute('stroke', '#B0763A');
    BS.chips(['4', '5', '6', '8'], 2);
  }
},

/* 98 — one solid, three shadows.
   A cylinder throws a circle from one side and a rectangle from another. The
   triangle is the one it can never make. */
{
  ask: 'A tin can be held up to a light. Which shadow can it NEVER make?',
  hint: 'Stand it up, then lay it on its side, then look at it end-on. What shapes come out?',
  tell: 'The triangle. A tin has no corners anywhere on it.',
  why: 'The same object throws different shadows depending which way you turn it — but never one with corners it does not have.',
  build: function (st) {
    scene(st, 'night', { hills: false, ground: false, vignette: false });
    var can = G(st, 180, 82);
    ink(S('path', { d: 'M-34,-34 L34,-34 L34,34 L-34,34 Z', fill: '#B6C4D6' }, can), 3.5);
    ink(S('ellipse', { cx: 0, cy: -34, rx: 34, ry: 12, fill: '#DCE6F2' }, can), 3.5);
    ink(S('path', { d: 'M-34,34 a34,12 0 0 0 68,0', fill: 'none' }, can), 3.5);
    S('rect', { x: -24, y: -22, width: 11, height: 48, rx: 5, fill: '#FFFFFF', opacity: '.35' }, can);
    options(st, 224, function (gg, i) {
      if (i === 0) { ink(S('circle', { cx: 0, cy: 0, r: 26, fill: '#4A3A66' }, gg), 3); }
      else if (i === 1) { ink(S('rect', { x: -22, y: -27, width: 44, height: 54, rx: 3, fill: '#4A3A66' }, gg), 3); }
      else { ink(S('path', { d: 'M0,-28 L27,22 L-27,22 Z', fill: '#4A3A66' }, gg), 3); }
    }, 2);
  }
},

/* 99 — opposite faces.
   Three views of one die. The star is next to 4, 2 and 3, so the only number
   left for the far side is the one it is never pictured with. */
{
  ask: 'Three photos of the same block. Which shape is on the face opposite the star?',
  hint: 'Anything you can see NEXT to the star cannot be behind it. Cross those off.',
  tell: 'The moon. The star is pictured beside the heart, the drop and the leaf, so only the moon is left.',
  why: 'You never saw the answer. You found it by crossing off everything it could not be.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false, vignette: false });
    function mark(parent, kind, x, y, s, fill) {
      var g = G(parent, x, y);
      if (kind === 'star') { star(g, 0, 0, s, fill, 2); }
      else if (kind === 'heart') { ink(S('path', { d: 'M0,' + (s * .7) + ' C' + (-s * 1.3) + ',' + (-s * .2) + ' ' + (-s * .5) + ',' + (-s * 1.1) + ' 0,' + (-s * .35) + ' C' + (s * .5) + ',' + (-s * 1.1) + ' ' + (s * 1.3) + ',' + (-s * .2) + ' 0,' + (s * .7) + ' Z', fill: fill }, g), 2); }
      else if (kind === 'drop') { ink(S('path', { d: 'M0,' + (-s) + ' q' + (s * .8) + ',' + (s * .9) + ' 0,' + (s * 1.5) + ' q' + (-s * .8) + ',' + (-s * .6) + ' 0,' + (-s * 1.5) + ' Z', fill: fill }, g), 2); }
      else if (kind === 'leaf') { ink(S('path', { d: 'M' + (-s * .8) + ',' + (s * .6) + ' q0,' + (-s * 1.4) + ' ' + (s * 1.6) + ',' + (-s * 1.4) + ' q0,' + (s * 1.4) + ' ' + (-s * 1.6) + ',' + (s * 1.4) + ' Z', fill: fill }, g), 2); }
      else { ink(S('path', { d: 'M' + (s * .5) + ',' + (-s * .9) + ' a' + s + ',' + s + ' 0 1 0 ' + (s * .1) + ',' + (s * 1.8) + ' a' + (s * .8) + ',' + (s * .8) + ' 0 1 1 ' + (-s * .1) + ',' + (-s * 1.8) + ' Z', fill: fill }, g), 2); }
      return g;
    }
    /* three views: star beside heart+drop, star beside drop+leaf, star beside leaf+heart.
       moon never appears next to the star, so moon is opposite it. */
    var VIEWS = [['star', 'heart', 'drop'], ['star', 'drop', 'leaf'], ['star', 'leaf', 'heart']];
    var COLS = { star: '#FFC93C', heart: '#F0466F', drop: '#6EC6E8', leaf: '#3FBF7F', moon: '#B6A9CE' };
    for (var v = 0; v < 3; v++) {
      (function (v) {
        var g = G(st, 72 + v * 108, 92);
        /* a simple isometric die: top, left, right */
        ink(S('path', { d: 'M0,-40 L36,-20 L0,0 L-36,-20 Z', fill: '#FFF6E6' }, g), 3);
        ink(S('path', { d: 'M-36,-20 L0,0 L0,40 L-36,20 Z', fill: '#EFE0C6' }, g), 3);
        ink(S('path', { d: 'M36,-20 L0,0 L0,40 L36,20 Z', fill: '#E3D2B4' }, g), 3);
        mark(g, VIEWS[v][0], 0, -21, 9, COLS[VIEWS[v][0]]);
        mark(g, VIEWS[v][1], -18, 12, 9, COLS[VIEWS[v][1]]);
        mark(g, VIEWS[v][2], 18, 12, 9, COLS[VIEWS[v][2]]);
      })(v);
    }
    options(st, 222, function (gg, i) {
      var k = ['heart', 'moon', 'leaf'][i];
      mark(gg, k, 0, 0, 20, COLS[k]);
    }, 1);
  }
},

/* 100 — the reflection in the water.
   A water reflection flips top for bottom, not left for right. The mirror
   answer is sitting right beside it, and it is the one that gets picked. */
{
  ask: 'The duck is looking at herself in the pond. Which reflection is right?',
  hint: 'Water is underneath her, not beside her. So which way round does it turn her?',
  tell: 'The last one — upside down, but still facing the same way.',
  why: 'Water flips top and bottom because it lies below you. A mirror on a wall flips the other way entirely.',
  build: function (st) {
    scene(st, 'water', { clouds: true, hills: false, ground: false, vignette: false });
    ink(S('rect', { x: 0, y: 128, width: 360, height: 42, fill: '#5FB6DE' }, st), 0);
    animal(st, { kind: 'duck', x: 92, y: 92, size: 19, fill: '#FFD86B', bob: false, shadow: false });
    var i;
    for (i = 0; i < 3; i++) {
      ink(S('path', { d: 'M20,' + (140 + i * 11) + ' q16,-7 32,0 t32,0 t32,0', fill: 'none' }, st), 2.6)
        .setAttribute('stroke', '#8FD3EF');
    }
    options(st, 230, function (gg, i) {
      var inner = S('g', {}, gg);
      /* 0 same way up (no flip at all), 1 mirrored left-right, 2 upside down */
      if (i === 0) { inner.setAttribute('transform', 'translate(0,4)'); }
      else if (i === 1) { inner.setAttribute('transform', 'translate(0,4) scale(-1,1)'); }
      else { inner.setAttribute('transform', 'translate(0,-4) scale(1,-1)'); }
      animal(inner, { kind: 'duck', x: 0, y: -8, size: 13, fill: '#FFD86B', bob: false, shadow: false });
    }, 2);
  }
}

  ];
})();

(function () {
  for (var i = 0; i < PUZZLES_HUNDRED.length; i++) { PUZZLES.push(PUZZLES_HUNDRED[i]); }
})();
