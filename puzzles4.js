/* ==========================================================
   Brain Snacks — puzzles 62-73.
   Twelve new ones, and the rule from v9 still holds: new pictures,
   not easier versions of old ones. Nothing in here shares artwork or
   a mechanic with anything already in the app.

     62 shunting yard    drag two trains past each other with one siding
     63 caterpillar      eat every leaf, never cross your own trail
     64 the bee          queue up arrows, then run them
     65 the tilted jars  which water line is the real one
     66 the low sun      drag the shadow where it belongs
     67 off the table    where a rolling ball actually lands
     68 sorting bins     the rule is hidden behind colour and shape
     69 the machine      work out what it does to a number
     70 the sock drawer  how many to be sure (pigeonhole)
     71 from above       what a block tower looks like looking down
     72 make the square  pick the two pieces that fit
     73 turned around    a rotation, with the mirror sitting next to it

   Safari 12 throughout: no arrow functions, no template literals,
   SVG transforms as attributes.
   ========================================================== */

BS.addPuzzles((function () {
  'use strict';

  var A = ART;
  var S = A.S, G = A.G, ink = A.ink, txt = A.txt, place = A.place;
  var animal = A.animal, star = A.star, scene = A.scene, critter = A.critter;
  var tap = BS.tap, drag = BS.drag, glide = BS.glide;

  /* invisible hit area — always added LAST, above the artwork */
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

  /* Draw a little shape set from a list of [col,row] cells, centred on the
     group. Used by the three shape puzzles at the end. */
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

  /* Clip a polygon to the half-plane nx*x + ny*y <= d (Sutherland-Hodgman).
     The tilted jars need a real water surface at a real angle, and clipping
     it exactly beats a clipPath, which this WebKit renders unreliably. */
  function clipHalf(poly, nx, ny, d) {
    var out = [], i, a, b, da, db, t;
    for (i = 0; i < poly.length; i++) {
      a = poly[i]; b = poly[(i + 1) % poly.length];
      da = nx * a[0] + ny * a[1] - d;
      db = nx * b[0] + ny * b[1] - d;
      if (da <= 0) { out.push(a); }
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
        t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }
  function polyPath(poly) {
    var d = '', i;
    for (i = 0; i < poly.length; i++) {
      d += (i ? ' L' : 'M') + Math.round(poly[i][0] * 100) / 100 + ',' + Math.round(poly[i][1] * 100) / 100;
    }
    return d + ' Z';
  }

  /* a side-on locomotive, drawn about its own centre */
  function loco(parent, x, y, fill, flip) {
    var g = G(parent, x, y);
    var b = S('g', {}, g);
    if (flip) { b.setAttribute('transform', 'scale(-1,1)'); }
    ink(S('circle', { cx: -17, cy: 17, r: 9, fill: '#4A3A66' }, b), 3);
    ink(S('circle', { cx: 13, cy: 17, r: 9, fill: '#4A3A66' }, b), 3);
    S('circle', { cx: -17, cy: 17, r: 3.4, fill: '#FFF6E6' }, b);
    S('circle', { cx: 13, cy: 17, r: 3.4, fill: '#FFF6E6' }, b);
    ink(S('rect', { x: -31, y: -13, width: 62, height: 28, rx: 6, fill: fill }, b), 3.5);
    ink(S('rect', { x: 4, y: -31, width: 26, height: 20, rx: 5, fill: fill }, b), 3.5);
    S('rect', { x: 10, y: -26, width: 14, height: 11, rx: 3, fill: '#FFF6E6' }, b);
    ink(S('rect', { x: -25, y: -27, width: 13, height: 16, rx: 3, fill: fill }, b), 3);
    S('ellipse', { cx: -18.5, cy: -30, rx: 9, ry: 5, fill: '#FFFFFF', opacity: '.55' }, b);
    return g;
  }

  /* a fat caterpillar, head to the right */
  function grub(parent, x, y) {
    var g = G(parent, x, y), i;
    for (i = 3; i >= 1; i--) {
      ink(S('circle', { cx: -i * 11, cy: 0, r: 9.5 - i * .6, fill: '#8FD46A' }, g), 3);
    }
    ink(S('circle', { cx: 0, cy: -1, r: 12, fill: '#5FB84A' }, g), 3.5);
    ink(S('line', { x1: -4, y1: -11, x2: -7, y2: -20 }, g), 2.4);
    ink(S('line', { x1: 4, y1: -11, x2: 7, y2: -20 }, g), 2.4);
    S('circle', { cx: -7, cy: -20, r: 2.6, fill: '#241534' }, g);
    S('circle', { cx: 7, cy: -20, r: 2.6, fill: '#241534' }, g);
    ink(S('circle', { cx: -3.6, cy: -2, r: 3.2, fill: '#FFFFFF' }, g), 1.6);
    ink(S('circle', { cx: 4.8, cy: -2, r: 3.2, fill: '#FFFFFF' }, g), 1.6);
    S('circle', { cx: -3, cy: -1.4, r: 1.6, fill: '#241534' }, g);
    S('circle', { cx: 5.4, cy: -1.4, r: 1.6, fill: '#241534' }, g);
    ink(S('path', { d: 'M-3,5 q4,4 8,0', fill: 'none' }, g), 2);
    return g;
  }

  /* a bee, facing right */
  function beeArt(parent, x, y) {
    var g = G(parent, x, y);
    S('ellipse', { cx: -2, cy: -9, rx: 11, ry: 7, fill: '#FFFFFF', opacity: '.72' }, g);
    S('ellipse', { cx: 9, cy: -9, rx: 9, ry: 6, fill: '#FFFFFF', opacity: '.72' }, g);
    ink(S('ellipse', { cx: 0, cy: 0, rx: 15, ry: 11, fill: '#FFC93C' }, g), 3);
    S('path', { d: 'M-4,-10.4 L-4,10.4 L1,10.2 L1,-10.2 Z', fill: '#3B2B1E' }, g);
    S('path', { d: 'M6,-9.2 L6,9.2 L10,7.8 L10,-7.8 Z', fill: '#3B2B1E' }, g);
    ink(S('line', { x1: -9, y1: -9, x2: -13, y2: -17 }, g), 2.2);
    S('circle', { cx: -13, cy: -17, r: 2.4, fill: '#241534' }, g);
    S('circle', { cx: -11, cy: -1, r: 2.3, fill: '#241534' }, g);
    return g;
  }

  function flowerArt(parent, x, y) {
    var g = G(parent, x, y), i, a;
    for (i = 0; i < 6; i++) {
      a = i * Math.PI / 3;
      ink(S('ellipse', { cx: Math.cos(a) * 12, cy: Math.sin(a) * 12, rx: 8, ry: 6,
        fill: '#FF6F92', transform: 'rotate(' + Math.round(i * 60) + ' ' +
        Math.round(Math.cos(a) * 12) + ' ' + Math.round(Math.sin(a) * 12) + ')' }, g), 2.4);
    }
    ink(S('circle', { cx: 0, cy: 0, r: 8, fill: '#FFE07A' }, g), 2.6);
    return g;
  }

  /* one isometric block, x/y is the centre of its top face */
  function block(parent, x, y, top, left, right) {
    var g = G(parent, x, y);
    ink(S('path', { d: 'M0,-15 L26,0 L0,15 L-26,0 Z', fill: top }, g), 2.6);
    ink(S('path', { d: 'M-26,0 L0,15 L0,41 L-26,26 Z', fill: left }, g), 2.6);
    ink(S('path', { d: 'M26,0 L0,15 L0,41 L26,26 Z', fill: right }, g), 2.6);
    return g;
  }

  return [

/* 62 — the shunting yard.
   Two trains on one track cannot pass. The siding is not on the way to
   anywhere: the red train has to leave the main line, sit still while the
   blue one goes by, and only then carry on. Backing into a dead end on
   purpose is the same idea as the river crossing wearing a different coat. */
{
  d: 72.5,
  ask: 'Swap the two trains over. Only one train fits on the short side track.',
  hint: 'The trains cannot squeeze past each other on the main line. Is there somewhere one could wait?',
  tell: 'Red to the middle, red up onto the side track, blue across to the left, then red back down and along.',
  why: 'You parked a train somewhere it did not want to go, so the other one could get past.',
  build: function (st) {
    scene(st, 'day', { hills: true, ground: '#8FCB77', groundY: 236, tufts: false, vignette: false });
    /* rails */
    function rail(x0, x1, y) {
      var i;
      for (i = x0 + 8; i < x1 - 4; i += 17) {
        ink(S('rect', { x: i - 5, y: y + 5, width: 12, height: 15, rx: 2, fill: '#9A6E48' }, st), 0);
      }
      ink(S('rect', { x: x0, y: y, width: x1 - x0, height: 6, rx: 3, fill: '#7C6A8E' }, st), 2);
    }
    rail(22, 338, 214);
    rail(126, 236, 140);
    ink(S('path', { d: 'M236,146 q34,4 44,68', fill: 'none' }, st), 5).setAttribute('stroke', '#7C6A8E');

    var SLOT = { A: [72, 196], B: [180, 196], C: [288, 196], S: [181, 122] };
    var NEXT = { A: ['B'], B: ['A', 'C', 'S'], C: ['B'], S: ['B'] };
    var where = { red: 'A', blue: 'C' };

    /* the side track needs to look like somewhere you could stop */
    ink(S('rect', { x: 126, y: 96, width: 6, height: 24, rx: 3, fill: '#F0466F' }, st), 2);

    function taken(k) {
      return where.red === k ? 'red' : (where.blue === k ? 'blue' : null);
    }
    function settle(name, art) {
      var s = SLOT[where[name]];
      glide(art, s[0], s[1], 240);
    }
    var art = {};
    art.red = loco(st, SLOT.A[0], SLOT.A[1], '#F0466F', false);
    art.blue = loco(st, SLOT.C[0], SLOT.C[1], '#6EC6E8', true);

    function wire(name) {
      drag(art[name], {
        clamp: [46, 108, 314, 210],
        onDrop: function (x, y, back) {
          var from = where[name], best = null, bd = 1e9, k;
          for (k in SLOT) {
            if (!SLOT.hasOwnProperty(k)) { continue; }
            var d = Math.abs(SLOT[k][0] - x) + Math.abs(SLOT[k][1] - y);
            if (d < bd) { bd = d; best = k; }
          }
          var ok = best && best !== from && bd < 96 &&
                   !taken(best) && NEXT[from].indexOf(best) >= 0;
          if (!ok) { BS.nope(art[name]); glide(art[name], back.x, back.y, 240); return; }
          where[name] = best;
          settle(name, art[name]);
          BS.SFX.drop();
          BS.later(function () {
            if (where.red === 'C' && where.blue === 'A') { BS.win(); }
          }, 300);
        }
      });
    }
    wire('red'); wire('blue');
    A.lift(st);
  }
},

/* 63 — every leaf, once.
   A Hamiltonian path on eight leaves. The wrong routes do not lose, they
   strand her: the caterpillar ends up somewhere with nothing left to reach,
   which is a far better teacher than a buzzer. */
{
  d: 67.5,
  ask: 'The caterpillar is hungry. Eat every leaf. She will not crawl over a leaf she has already eaten.',
  hint: 'Look for the leaves that only have one way in. Leave those for last and you will get stuck.',
  tell: 'Go right, down, right, down, left, left, up. Sweep round the outside, then finish in the corner.',
  why: 'You planned a route that never painted itself into a corner. That is the whole trick.',
  build: function (st) {
    scene(st, 'meadow', { sun: 'sun', clouds: true, hills: false, ground: false, vignette: false });
    /* three by three with the top-right leaf missing */
    var GRID = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]];
    function cx(c) { return 92 + c * 88; }
    function cy(r) { return 74 + r * 76; }
    function idx(c, r) {
      for (var i = 0; i < GRID.length; i++) { if (GRID[i][0] === c && GRID[i][1] === r) { return i; } }
      return -1;
    }
    var leafArt = [], eaten = [], at = 0, busy = false, i;
    for (i = 0; i < GRID.length; i++) {
      (function (i) {
        var g = G(st, cx(GRID[i][0]), cy(GRID[i][1]));
        var body = S('g', {}, g);
        ink(S('ellipse', { cx: 0, cy: 0, rx: 31, ry: 25, fill: '#5FD08A' }, body), 3.4);
        ink(S('path', { d: 'M-24,6 Q0,-8 24,-6', fill: 'none' }, body), 2.4)
          .setAttribute('stroke', '#3C9E62');
        leafArt.push({ g: g, body: body });
        eaten.push(false);
      })(i);
    }
    var bug = grub(st, cx(0), cy(0));

    function reset() {
      for (var k = 0; k < GRID.length; k++) {
        eaten[k] = false;
        leafArt[k].body.setAttribute('opacity', '1');
      }
      eaten[0] = true;
      leafArt[0].body.setAttribute('opacity', '.28');
      at = 0;
      place(bug, cx(0), cy(0));
    }
    function movesFrom(k) {
      var c = GRID[k][0], r = GRID[k][1], n = 0, D = [[1, 0], [-1, 0], [0, 1], [0, -1]], j, t;
      for (j = 0; j < 4; j++) {
        t = idx(c + D[j][0], r + D[j][1]);
        if (t >= 0 && !eaten[t]) { n++; }
      }
      return n;
    }
    for (i = 0; i < GRID.length; i++) {
      (function (i) {
        var z = G(st, cx(GRID[i][0]), cy(GRID[i][1]));
        pad(z, 76, 66);
        tap(z, function () {
          if (busy) { return; }
          var dc = Math.abs(GRID[i][0] - GRID[at][0]), dr = Math.abs(GRID[i][1] - GRID[at][1]);
          if (eaten[i] || dc + dr !== 1) { BS.nope(bug); return; }
          busy = true;
          at = i; eaten[i] = true;
          leafArt[i].body.setAttribute('opacity', '.28');
          glide(bug, cx(GRID[i][0]), cy(GRID[i][1]), 250);
          BS.SFX.grab();
          BS.later(function () {
            busy = false;
            var left = 0, k;
            for (k = 0; k < GRID.length; k++) { if (!eaten[k]) { left++; } }
            if (left === 0) { BS.win(); return; }
            /* stranded: nothing reachable, so put her back and let her retry */
            if (movesFrom(at) === 0) {
              BS.nope(bug);
              busy = true;
              BS.later(function () { reset(); busy = false; }, 520);
            }
          }, 300);
        });
      })(i);
    }
    reset();
    A.lift(st);
  }
},

/* 64 — tell the bee where to go.
   She writes the whole plan down before anything moves, which is the part
   that makes it different from every other tap-and-see puzzle in here.
   Only one order of the five arrows gets through. */
{
  d: 75,
  ask: 'Plan the bee’s trip to the flower first, then send her. She cannot fly over a rock.',
  hint: 'Trace the route with your finger before you tap anything. Which way does she have to start?',
  tell: 'Up, up, then right, right, right.',
  why: 'You wrote the whole journey down before she moved. Working it out first is called planning.',
  build: function (st) {
    scene(st, 'meadow', { clouds: true, hills: false, ground: false, vignette: false });
    var COLS = 4, ROWS = 3;
    function gx(c) { return 78 + c * 54; }
    function gy(r) { return 48 + r * 54; }
    var ROCK = [[1, 1], [2, 2]];
    function isRock(c, r) {
      for (var i = 0; i < ROCK.length; i++) { if (ROCK[i][0] === c && ROCK[i][1] === r) { return true; } }
      return false;
    }
    var c, r;
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        ink(S('rect', { x: gx(c) - 24, y: gy(r) - 24, width: 48, height: 48, rx: 8,
          fill: (c + r) % 2 ? '#CFEBD2' : '#E2F4E4' }, st), 2);
      }
    }
    for (r = 0; r < ROCK.length; r++) {
      var rg = G(st, gx(ROCK[r][0]), gy(ROCK[r][1]));
      ink(S('path', { d: 'M-19,14 q-6,-16 6,-22 q14,-8 21,4 q6,12 -4,18 Z', fill: '#9C93B0' }, rg), 3);
      S('path', { d: 'M-9,-2 q7,-6 14,0', fill: 'none', stroke: '#7A7192', 'stroke-width': 2.4 }, rg);
    }
    flowerArt(st, gx(3), gy(0));
    var bee = beeArt(st, gx(0), gy(2));

    var QN = 5, queue = [], slots = [], running = false;
    function slotX(i) { return 120 + i * 32; }
    for (c = 0; c < QN; c++) {
      (function (i) {
        var g = G(st, slotX(i), 222);
        ink(S('rect', { x: -14, y: -14, width: 28, height: 28, rx: 6, fill: '#FFF6E6', opacity: '.8' }, g), 2.4)
          .setAttribute('stroke-dasharray', '5 4');
        slots.push(S('g', {}, g));
      })(c);
    }
    function arrow(parent, up) {
      if (up) { ink(S('path', { d: 'M0,-9 L8,3 L3,3 L3,9 L-3,9 L-3,3 L-8,3 Z', fill: '#F5A623' }, parent), 2.2); }
      else { ink(S('path', { d: 'M9,0 L-3,8 L-3,3 L-9,3 L-9,-3 L-3,-3 L-3,-8 Z', fill: '#F5A623' }, parent), 2.2); }
    }
    function paint() {
      var i;
      for (i = 0; i < QN; i++) {
        A.clear(slots[i]);
        if (i < queue.length) { arrow(slots[i], queue[i] === 'u'); }
      }
    }
    function button(x, up) {
      var g = G(st, x, 222);
      ink(S('rect', { x: -19, y: -19, width: 38, height: 38, rx: 9, fill: '#FFE7A8' }, g), 3);
      var ag = G(g, 0, 0);
      ag.setAttribute('transform', 'translate(0,0) scale(1.25)');
      arrow(ag, up);
      pad(g, 46, 46);
      tap(g, function () {
        if (running || queue.length >= QN) { BS.nope(g); return; }
        queue.push(up ? 'u' : 'r'); paint(); BS.SFX.tap();
      });
    }
    button(50, true); button(310, false);

    var go = G(st, 180, 270);
    ink(S('rect', { x: -52, y: -19, width: 104, height: 38, rx: 10, fill: '#3FBF7F' }, go), 3.5);
    txt('Go!', { x: 0, y: 7, 'font-size': 20, fill: '#FFF6E6' }, go);
    pad(go, 118, 46);

    var clr = G(st, 180, 222);
    pad(clr, 190, 34);
    tap(clr, function () {
      if (running || !queue.length) { return; }
      queue = []; paint(); BS.SFX.tap();
    });

    tap(go, function () {
      if (running) { return; }
      if (!queue.length) { BS.nope(go); return; }
      running = true;
      var pc = 0, pos = [0, 2];
      function step() {
        if (pc >= queue.length) { finish(); return; }
        var nc = pos[0] + (queue[pc] === 'r' ? 1 : 0);
        var nr = pos[1] - (queue[pc] === 'u' ? 1 : 0);
        if (nc >= COLS || nr < 0 || isRock(nc, nr)) { finish(true); return; }
        pos = [nc, nr]; pc++;
        glide(bee, gx(nc), gy(nr), 250);
        BS.SFX.grab();
        BS.later(step, 290);
      }
      function finish(bumped) {
        if (!bumped && pos[0] === 3 && pos[1] === 0) { BS.win(); return; }
        BS.nope(bee);
        BS.later(function () {
          place(bee, gx(0), gy(2));
          queue = []; paint(); running = false;
        }, 560);
      }
      step();
    });
    paint();
    A.lift(st);
  }
},

/* 65 — the tilted jars.
   Children draw the water parallel to the bottom of the jar, every time.
   Both wrong jars are that mistake: one keeps the water square to the jar,
   the other over-corrects and tips it the other way. */
{
  d: 42.5,
  ask: 'All three jars are tipped the same way. Which one shows the water as it really would be?',
  hint: 'Forget the jar for a moment. Think about the top of the water in a puddle, or in the bath.',
  tell: 'The middle one. Water always lies flat, however you hold the jar.',
  why: 'Water does not care which way the jar is turned. Its top stays flat, and that surprises nearly everybody.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 250, vignette: false });
    var TILT = 24;
    /* local angle of the water surface inside each jar:
       0 = square to the jar (the classic mistake)
       -TILT = truly flat once the jar is tilted (the real one)
       -2*TILT = tipped too far the other way */
    var LOCAL = [0, -TILT, -TILT * 2];
    var W = 62, HH = 96;
    for (var i = 0; i < 3; i++) {
      (function (i) {
        var cxp = 74 + i * 106, cyp = 146;
        var g = G(st, cxp, cyp);
        g.setAttribute('transform', 'translate(' + cxp + ',' + cyp + ') rotate(' + TILT + ')');
        /* glass */
        ink(S('rect', { x: -W / 2, y: -HH / 2, width: W, height: HH, rx: 7, fill: '#F3FAFF', opacity: '.92' }, g), 3.5);
        /* water: the jar rect clipped by a half-plane at the given angle */
        var a = LOCAL[i] * Math.PI / 180;
        var nx = -Math.sin(a), ny = Math.cos(a);
        var surfaceAt = HH * .10;                 /* how full, along the normal */
        var poly = [[-W / 2, -HH / 2], [W / 2, -HH / 2], [W / 2, HH / 2], [-W / 2, HH / 2]];
        poly = clipHalf(poly, -nx, -ny, -surfaceAt);
        if (poly.length > 2) {
          S('path', { d: polyPath(poly), fill: '#6EC6E8' }, g);
          ink(S('path', { d: polyPath(poly), fill: 'none' }, g), 2.6).setAttribute('stroke', '#2E7FA8');
        }
        /* re-draw the glass outline over the water, then the rim */
        var gl = S('rect', { x: -W / 2, y: -HH / 2, width: W, height: HH, rx: 7, fill: 'none' }, g);
        ink(gl, 3.5);
        ink(S('line', { x1: -W / 2 + 3, y1: -HH / 2, x2: W / 2 - 3, y2: -HH / 2 }, g), 5)
          .setAttribute('stroke', '#8A7BA8');
        S('rect', { x: -W / 2 + 8, y: -HH / 2 + 10, width: 8, height: HH * .5, rx: 4, fill: '#FFFFFF', opacity: '.5' }, g);
        pad(g, W + 26, HH + 26);
        tap(g, function () { if (i === 1) { BS.win(); } else { BS.nope(g); } });
      })(i);
    }
    A.lift(st);
  }
},

/* 66 — the low sun.
   Two separate ideas have to agree: shadows fall away from the light, and a
   low sun makes a long one. Each wrong answer gets exactly one of them right. */
{
  d: 66.5,
  ask: 'It is nearly evening and the sun is low. Drag the tree’s shadow to the right place.',
  hint: 'Stand between a lamp and a wall. Which side of you does your shadow go?',
  tell: 'The long one on the right, opposite the sun.',
  why: 'A shadow falls away from the light, and the lower the sun the longer it stretches.',
  build: function (st) {
    scene(st, 'dusk', { sun: false, hills: true, ground: '#C79A5E', groundY: 196, tufts: false, vignette: false });
    /* a low sun, on the left and close to the ground */
    S('circle', { cx: 44, cy: 150, r: 52, fill: A.glow(st, '#FFD86B', .5) }, st);
    ink(S('circle', { cx: 44, cy: 150, r: 25, fill: '#FFB03A' }, st), 4);

    /* the tree */
    var tg = G(st, 186, 150);
    ink(S('rect', { x: -9, y: 6, width: 18, height: 44, rx: 4, fill: '#9A6E48' }, tg), 3.5);
    ink(S('circle', { cx: 0, cy: -8, r: 34, fill: '#4FAF6D' }, tg), 4);
    ink(S('circle', { cx: -22, cy: 8, r: 21, fill: '#5FC47D' }, tg), 3.5);
    ink(S('circle', { cx: 23, cy: 6, r: 20, fill: '#5FC47D' }, tg), 3.5);

    var ZONE = [
      { x: 78, y: 226, rx: 46, ok: false },     /* long, but the wrong side */
      { x: 186, y: 232, rx: 20, ok: false },    /* right side of nothing: midday */
      { x: 290, y: 226, rx: 46, ok: true }      /* long, away from the sun */
    ];
    var i;
    for (i = 0; i < ZONE.length; i++) {
      var z = S('ellipse', { cx: ZONE[i].x, cy: ZONE[i].y, rx: ZONE[i].rx, ry: 13,
        fill: '#FFFFFF', opacity: '.22' }, st);
      ink(z, 2.6).setAttribute('stroke-dasharray', '7 6');
    }
    ink(S('rect', { x: 16, y: 264, width: 328, height: 30, rx: 12, fill: '#FFF6E6', opacity: '.35' }, st), 0);

    var sh = G(st, 180, 279);
    S('ellipse', { cx: 0, cy: 0, rx: 46, ry: 12, fill: '#3A2A50', opacity: '.6' }, sh);
    pad(sh, 108, 34);
    drag(sh, {
      clamp: [56, 214, 304, 284],
      onDrop: function (x, y, back) {
        var best = -1, bd = 1e9, k;
        for (k = 0; k < ZONE.length; k++) {
          var d = Math.abs(ZONE[k].x - x) + Math.abs(ZONE[k].y - y);
          if (d < bd) { bd = d; best = k; }
        }
        if (bd > 78) { glide(sh, back.x, back.y, 240); return; }
        if (ZONE[best].ok) { glide(sh, ZONE[best].x, ZONE[best].y, 240); BS.win(); return; }
        BS.nope(sh); glide(sh, back.x, back.y, 260);
      }
    });
    A.lift(st);
  }
},

/* 67 — off the edge.
   "It drops straight down" is the answer almost every child gives, so that is
   the first wrong path. The second is the cartoon one, where it hangs in the
   air for a while first. */
{
  d: 48.5,
  ask: 'The ball rolls off the table. Which line shows where it really goes?',
  hint: 'It does not stop moving sideways just because the table ran out.',
  tell: 'The middle one — it keeps going forwards while it falls, so the line curves.',
  why: 'It kept its forward push and started falling at the same time. Both happen at once, so the path bends.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 244, vignette: false });
    /* table */
    ink(S('rect', { x: 22, y: 130, width: 152, height: 13, rx: 5, fill: '#B07A4C' }, st), 3.5);
    ink(S('rect', { x: 36, y: 143, width: 14, height: 100, rx: 4, fill: '#9A6E48' }, st), 3);
    ink(S('rect', { x: 146, y: 143, width: 14, height: 100, rx: 4, fill: '#9A6E48' }, st), 3);
    /* the ball, at the lip, with speed lines behind it */
    var i;
    for (i = 0; i < 3; i++) {
      ink(S('line', { x1: 96 - i * 17, y1: 112 + i * 5, x2: 122 - i * 17, y2: 112 + i * 5 }, st), 3)
        .setAttribute('stroke', '#8A7BA8');
    }
    ink(S('circle', { cx: 166, cy: 116, r: 14, fill: '#F0466F' }, st), 3.5);
    S('circle', { cx: 161, cy: 111, r: 4.6, fill: '#FFFFFF', opacity: '.5' }, st);

    var PATH = [
      'M170,132 L170,236',                                  /* straight down */
      'M170,132 Q206,150 250,236',                           /* the real one */
      'M170,130 L316,130 L316,236'                           /* cartoon: hangs, then drops */
    ];
    var LAND = [170, 250, 316];
    for (i = 0; i < 3; i++) {
      (function (i) {
        var p = S('path', { d: PATH[i], fill: 'none', stroke: '#4A3A66', 'stroke-width': 3,
          'stroke-dasharray': '6 7', 'stroke-linecap': 'round' }, st);
        p.setAttribute('opacity', '.75');
        var g = G(st, LAND[i], 258);
        ink(S('circle', { cx: 0, cy: 0, r: 17, fill: '#FFF6E6' }, g), 3);
        S('circle', { cx: 0, cy: 0, r: 7, fill: ['#8A7BA8', '#8A7BA8', '#8A7BA8'][i] }, g);
        pad(g, 44, 44);
        tap(g, function () { if (i === 1) { BS.win(); } else { BS.nope(g); } });
      })(i);
    }
    A.lift(st);
  }
},

/* 68 — the two bins.
   Every colour in the left bin appears in the right bin, and every shape too.
   The only thing that separates them is the dot, and the piece she is given
   is a shape that appears in neither bin, so matching cannot rescue her. */
{
  d: 62.5,
  ask: 'These two bins were filled by a rule, and nobody will tell you what it is. Drop the last piece in the right bin.',
  hint: 'The colours are in both bins. So are the shapes. Look for something smaller.',
  tell: 'The left bin. Every piece in it has a dot in the middle.',
  why: 'Colour and shape were in both bins, so neither could be the rule. You found the one thing that was not.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false, vignette: false });
    var LEFT = [
      { k: 'square', c: '#F0466F' }, { k: 'triangle', c: '#6EC6E8' }, { k: 'circle', c: '#FFC93C' }
    ];
    var RIGHT = [
      { k: 'square', c: '#6EC6E8' }, { k: 'triangle', c: '#FFC93C' }, { k: 'circle', c: '#F0466F' }
    ];
    function shape(parent, kind, size, fill, dot) {
      var e;
      if (kind === 'circle') { e = S('circle', { cx: 0, cy: 0, r: size, fill: fill }, parent); }
      else if (kind === 'square') { e = S('rect', { x: -size, y: -size, width: size * 2, height: size * 2, rx: size * .2, fill: fill }, parent); }
      else if (kind === 'diamond') { e = S('path', { d: 'M0,' + (-size * 1.14) + ' L' + size + ',0 L0,' + (size * 1.14) + ' L' + (-size) + ',0 Z', fill: fill }, parent); }
      else { e = S('path', { d: 'M0,' + (-size * 1.08) + ' L' + size + ',' + (size * .78) + ' L' + (-size) + ',' + (size * .78) + ' Z', fill: fill }, parent); }
      ink(e, 3);
      if (dot) { S('circle', { cx: 0, cy: kind === 'triangle' ? size * .24 : 0, r: size * .28, fill: '#241534' }, parent); }
      return e;
    }
    function bin(x, rim, list, dots) {
      var g = G(st, x, 106);
      ink(S('rect', { x: -74, y: -54, width: 148, height: 108, rx: 14, fill: '#FFF6E6' }, g), 4)
        .setAttribute('stroke', rim);
      ink(S('rect', { x: -74, y: -54, width: 148, height: 18, rx: 8, fill: rim }, g), 0);
      for (var i = 0; i < list.length; i++) {
        var sg = G(g, -46 + i * 46, 12);
        shape(sg, list[i].k, 17, list[i].c, dots);
      }
      return g;
    }
    var bl = bin(94, '#3F7FBF', LEFT, true);
    var br = bin(266, '#E8722F', RIGHT, false);

    var piece = G(st, 180, 234);
    shape(piece, 'diamond', 21, '#3FBF7F', true);
    pad(piece, 62, 62);
    drag(piece, {
      clamp: [40, 84, 320, 254],
      onDrop: function (x, y, back) {
        var inL = Math.abs(x - 94) < 84 && Math.abs(y - 106) < 68;
        var inR = Math.abs(x - 266) < 84 && Math.abs(y - 106) < 68;
        if (inL) { glide(piece, 94, 82, 220); BS.win(); return; }
        if (inR) { BS.nope(piece); glide(piece, back.x, back.y, 260); return; }
        glide(piece, back.x, back.y, 240);
      }
    });
    A.lift(st);
  }
},

/* 69 — the machine.
   Three worked examples, then one to do. Every wrong chip is a real mistake:
   7 copies the answer above, 9 grabs the last example's answer instead of
   working it out, 10 doubles the input. */
{
  d: 51.5,
  ask: 'The machine changes every number the same way. What will come out?',
  hint: 'Look at 2 and 5. Now check 4 and 7. Is the machine adding, or doubling?',
  tell: 'It adds 3 every time, so 5 comes out as 8.',
  why: 'You found the rule from three examples and then trusted it on a number you had never seen.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false, vignette: false });
    /* the machine */
    ink(S('path', { d: 'M132,16 L228,16 L212,44 L148,44 Z', fill: '#8A7BA8' }, st), 3.5);
    ink(S('rect', { x: 106, y: 44, width: 148, height: 74, rx: 12, fill: '#B6A9CE' }, st), 4);
    var k;
    for (k = 0; k < 3; k++) {
      ink(S('circle', { cx: 134 + k * 46, cy: 72, r: 12, fill: '#FFE7A8' }, st), 3);
      ink(S('line', { x1: 134 + k * 46, y1: 72, x2: 134 + k * 46 + (k === 1 ? 0 : (k ? 8 : -8)), y2: 72 - (k === 1 ? 10 : 6) }, st), 3);
    }
    ink(S('rect', { x: 142, y: 118, width: 76, height: 16, rx: 6, fill: '#8A7BA8' }, st), 3);
    txt('+ ?', { x: 180, y: 108, 'font-size': 15, fill: '#4A3A66', opacity: '.8' }, st);

    var EX = [[2, 5], [4, 7], [6, 9]];
    for (k = 0; k < 3; k++) {
      (function (k) {
        var g = G(st, 68 + k * 112, 174);
        ink(S('rect', { x: -50, y: -23, width: 100, height: 46, rx: 10, fill: '#FFF6E6' }, g), 3);
        txt(EX[k][0] + '  →  ' + EX[k][1], { x: 0, y: 7, 'font-size': 19, fill: '#241534' }, g);
      })(k);
    }
    var q = G(st, 180, 240);
    ink(S('rect', { x: -78, y: -27, width: 156, height: 54, rx: 12, fill: '#FFE7A8' }, q), 3.5);
    txt('5  →  ?', { x: 0, y: 9, 'font-size': 25, fill: '#241534' }, q);
    BS.chips(['7', '8', '9', '10'], 1);
  }
},

/* 70 — the sock drawer.
   Pigeonhole. Two is the answer nearly everyone gives first, which is why it
   is sitting there as the first chip. */
{
  /* Kept short on purpose: at 375x553 this banner is the tallest in the app,
     and a fourth wrapped line eats most of the column's headroom. */
  d: 78.5,
  ask: 'Only red socks and blue socks are in here, and the light is off. How many must you grab to be sure two match?',
  hint: 'Imagine the unluckiest possible grab. What is the worst that could come out first?',
  tell: 'Three. The first two might not match, but a third has to match one of them.',
  why: 'You did not count the socks — you counted the colours. With only two colours, three socks cannot all be different.',
  build: function (st) {
    scene(st, 'night', { sun: 'moon', hills: false, ground: false, vignette: false });
    /* the two colours that exist, shown lit, off to the side */
    function sock(parent, x, y, fill, dim) {
      var g = G(parent, x, y);
      ink(S('path', { d: 'M-11,-22 L11,-22 L11,8 q0,10 12,12 l8,3 q6,3 3,9 q-3,6 -10,4 l-22,-7 q-13,-5 -13,-19 Z',
        fill: fill }, g), 3);
      if (!dim) { S('rect', { x: -11, y: -22, width: 22, height: 8, rx: 3, fill: '#FFF6E6', opacity: '.6' }, g); }
      return g;
    }
    ink(S('rect', { x: 20, y: 22, width: 118, height: 76, rx: 12, fill: '#2A2360' }, st), 3);
    sock(st, 56, 62, '#F0466F', false);
    sock(st, 104, 62, '#6EC6E8', false);

    /* the drawer, in the dark: every sock the same grey */
    ink(S('rect', { x: 66, y: 132, width: 228, height: 116, rx: 14, fill: '#4A4278' }, st), 4);
    ink(S('rect', { x: 66, y: 132, width: 228, height: 20, rx: 8, fill: '#5D5490' }, st), 3);
    ink(S('rect', { x: 160, y: 236, width: 40, height: 11, rx: 5, fill: '#8A7BA8' }, st), 3);
    var i, P = [[104, 190], [148, 178], [192, 192], [236, 176], [126, 218], [214, 220]];
    for (i = 0; i < P.length; i++) {
      var s = sock(st, P[i][0], P[i][1], '#6E6699', true);
      s.setAttribute('transform', 'translate(' + P[i][0] + ',' + P[i][1] + ') rotate(' + (i % 2 ? 14 : -12) + ')');
      txt('?', { x: 0, y: 2, 'font-size': 15, fill: '#B9B2D6' }, s);
    }
    BS.chips(['2', '3', '4', '6'], 1);
  }
},

/* 71 — looking down on it.
   The wrong answers are the two ways a child mis-reads a 3D drawing: counting
   only the front row, and getting the count right but the corner wrong. */
{
  d: 63.5,
  ask: 'Look down on these blocks from straight above. Which shape do you see?',
  hint: 'Forget how tall they are. Just ask which squares on the floor are covered.',
  tell: 'The middle one. Three in a row, with the fourth block behind the middle one.',
  why: 'You flattened a solid thing in your head and drew it from a view nobody showed you.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false, vignette: false });
    /* plan: (col,row) = (0,1) (1,1) (2,1) and (1,0) behind the middle */
    var PLAN = [[1, 0], [0, 1], [1, 1], [2, 1]];
    var TOP = '#7FD0EE', LT = '#3F9FC8', RT = '#5FB6DE';
    var ox = 176, oy = 62, i, p;
    /* back to front, or the near blocks get buried */
    var order = PLAN.slice().sort(function (a, b) { return (a[0] + a[1]) - (b[0] + b[1]); });
    for (i = 0; i < order.length; i++) {
      p = order[i];
      block(st, ox + (p[0] - p[1]) * 26, oy + (p[0] + p[1]) * 15, TOP, LT, RT);
    }
    var SHAPES = [
      [[0, 0], [1, 0], [2, 0]],                  /* only the front row */
      [[0, 1], [1, 1], [2, 1], [1, 0]],          /* the real plan */
      [[0, 1], [1, 1], [2, 1], [2, 0]]           /* right count, wrong corner */
    ];
    options(st, 238, function (gg, i) {
      cells(gg, SHAPES[i], 19, '#6EC6E8');
    }, 1);
  }
},

/* 72 — two pieces, one square.
   Counting the squares is not enough: two of the pieces add up to four and
   only one pair actually fits. The interaction is new too — she has to hold
   two choices in mind at once and commit to both. */
{
  d: 57.5,
  ask: 'Exactly two of these pieces fit together to make the square. Tap both of them.',
  hint: 'Count the little squares first. Now check whether that pair would really fit, or leave a gap.',
  tell: 'The corner piece and the single square.',
  why: 'The right number of pieces is not the same as the right shape. You had to check the fit, not just the count.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false, vignette: false });
    /* the target */
    var t = G(st, 180, 62);
    ink(S('rect', { x: -34, y: -34, width: 68, height: 68, rx: 8, fill: '#FFF6E6', opacity: '.75' }, t), 3.5)
      .setAttribute('stroke-dasharray', '9 7');
    ink(S('line', { x1: 0, y1: -34, x2: 0, y2: 34 }, t), 2).setAttribute('opacity', '.35');
    ink(S('line', { x1: -34, y1: 0, x2: 34, y2: 0 }, t), 2).setAttribute('opacity', '.35');

    /* L-tromino + single square = the 2x2. A 1x3 bar plus the single does not. */
    var PIECES = [
      { c: [[0, 0], [0, 1], [1, 1]], fill: '#F0466F' },      /* 0  the corner */
      { c: [[0, 0], [1, 0], [2, 0]], fill: '#6EC6E8' },      /* 1  a bar of three */
      { c: [[0, 0]], fill: '#FFC93C' },                       /* 2  one square */
      { c: [[0, 0], [0, 1]], fill: '#3FBF7F' }                /* 3  a domino */
    ];
    var RIGHT = [0, 2];
    var picked = [], boxes = [];
    var XS = [60, 140, 220, 300];
    var i;
    for (i = 0; i < 4; i++) {
      (function (i) {
        var g = G(st, XS[i], 176);
        var frame = ink(S('rect', { x: -36, y: -44, width: 72, height: 88, rx: 11, fill: '#FFF6E6' }, g), 3);
        cells(g, PIECES[i].c, 25, PIECES[i].fill);
        boxes.push(frame);
        pad(g, 80, 96);
        tap(g, function () {
          var at = picked.indexOf(i);
          if (at >= 0) {
            picked.splice(at, 1);
            frame.setAttribute('stroke', '#241534');
            frame.setAttribute('stroke-width', 3);
            BS.SFX.tap();
            return;
          }
          if (picked.length >= 2) { BS.nope(g); return; }
          picked.push(i);
          frame.setAttribute('stroke', '#F5A623');
          frame.setAttribute('stroke-width', 6);
          BS.SFX.tap();
          if (picked.length === 2) {
            var a = picked.slice().sort(function (p, q) { return p - q; });
            if (a[0] === RIGHT[0] && a[1] === RIGHT[1]) {
              BS.later(function () { BS.win(); }, 180);
            } else {
              BS.nope(g);
              (function (snapshot) {
                BS.later(function () {
                  for (var k = 0; k < snapshot.length; k++) {
                    boxes[snapshot[k]].setAttribute('stroke', '#241534');
                    boxes[snapshot[k]].setAttribute('stroke-width', 3);
                  }
                }, 520);
              })(picked.slice());
              picked = [];
            }
          }
        });
      })(i);
    }
    txt('tap two', { x: 180, y: 250, 'font-size': 13, fill: '#241534', opacity: '.5' }, st);
    A.lift(st);
  }
},

/* 73 — turned, not flipped.
   The mirror image sits right next to the rotation, and it is the answer
   almost every child picks. Telling them apart is the whole puzzle. */
{
  d: 58,
  ask: 'Which one is this same shape, just turned around?',
  hint: 'You may turn the shape on the page, but you may not lift it up and flip it over.',
  tell: 'The last one. The middle one looks right, but it is the shape back to front.',
  why: 'Turning and flipping are not the same thing, and a flipped shape can never be turned back.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false, vignette: false });
    var BASE = [[0, 0], [0, 1], [0, 2], [1, 2]];
    var g = G(st, 180, 92);
    ink(S('rect', { x: -50, y: -60, width: 100, height: 120, rx: 12, fill: '#FFF6E6' }, g), 3);
    cells(g, BASE, 30, '#8A6FD0');
    /* [0] is a T, a genuinely different shape. [1] is the mirror, which is the
       answer almost everyone gives. [2] is the real 90-degree turn.
       Checked in code: [2] is a rotation of BASE, [1] is a reflection and NOT
       a rotation, [0] is neither. */
    var OPTS = [
      [[0, 0], [1, 0], [2, 0], [1, 1]],           /* a T — not this shape at all */
      [[1, 0], [1, 1], [1, 2], [0, 2]],           /* the mirror — the trap */
      [[0, 0], [0, 1], [1, 0], [2, 0]]            /* the true 90-degree turn */
    ];
    options(st, 226, function (gg, i) {
      cells(gg, OPTS[i], 21, '#8A6FD0');
    }, 2);
  }
}

  ];
})());
