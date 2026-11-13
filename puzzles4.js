/* ==========================================================
   Brain Snacks — pack 4 (v10): nineteen puzzles for the first
   six chapters. They fill the gaps in the early ladder, so the
   climb to the state puzzles is a slope and not a wall.

   Each has an `id`, so its question can be reworded later without
   losing a solve. `d` is its place on the ladder.
   ========================================================== */

BS.addPuzzles((function () {
  'use strict';

  var A = ART;
  var S = A.S, G = A.G, ink = A.ink, txt = A.txt, place = A.place;
  var animal = A.animal, star = A.star, scene = A.scene;
  var tap = BS.tap, drag = BS.drag, glide = BS.glide, later = BS.later;
  var hit = KIT.hit, pad = KIT.pad, orderGame = KIT.orderGame, options = KIT.options;

  function note(st, s, x, y, size) {
    return txt(s, { x: x, y: y, 'font-size': size || 12, fill: '#241534', opacity: '.6' }, st);
  }
  function cloud(st, x, y, z, col) {
    var g = G(st, x, y);
    z = z || 1; col = col || '#FFFFFF';
    ink(S('circle', { cx: -26 * z, cy: 6 * z, r: 22 * z, fill: col }, g));
    ink(S('circle', { cx: 25 * z, cy: 8 * z, r: 19 * z, fill: col }, g));
    ink(S('circle', { cx: 0, cy: -9 * z, r: 28 * z, fill: col }, g));
    S('circle', { cx: 0, cy: 4 * z, r: 22 * z, fill: col }, g);
    return g;
  }

  return [

/* ---------- writing size is not number size ---------- */
{
  id: 'n-bignum', d: 8,
  ask: 'Which number is the biggest?',
  hint: 'Big writing is not a big number. Read each one.',
  tell: 'Tap the tiny 9. Nine is more than eight, five or three.',
  why: 'A number is as big as what it counts, not as big as someone wrote it.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var nums = [
      { n: '3', x: 86, y: 204, fs: 150, c: '#F0466F', w: 96, h: 124, ok: false },
      { n: '8', x: 198, y: 150, fs: 76, c: '#6EC6E8', w: 62, h: 72, ok: false },
      { n: '5', x: 264, y: 244, fs: 46, c: '#3FBF7F', w: 50, h: 54, ok: false },
      { n: '9', x: 314, y: 96, fs: 23, c: '#FF8A3D', w: 46, h: 46, ok: true }
    ];
    for (var i = 0; i < nums.length; i++) {
      (function (N) {
        var g = G(st, N.x, N.y);
        pad(g, N.w, N.h, -N.fs * .36);
        txt(N.n, { x: 0, y: 0, 'font-size': N.fs, fill: N.c, stroke: '#241534',
          'stroke-width': Math.max(3, N.fs * .06), 'paint-order': 'stroke', 'stroke-linejoin': 'round' }, g);
        tap(g, function () { if (N.ok) { BS.win(); } else { BS.nope(g); } });
      })(nums[i]);
    }
  }
},

/* ---------- the clue is a movement ---------- */
{
  id: 'n-egg', d: 14,
  ask: 'One egg is about to hatch. Which one?',
  hint: 'Do not tap yet. Just watch them for a little while.',
  tell: 'The egg on the right keeps wobbling. Tap it.',
  why: 'You watched before you touched. The clue was a movement, not a picture.',
  build: function (st) {
    scene(st, 'meadow', { sun: 'sun', flowers: false, groundY: 214 });
    var xs = [76, 180, 284], hot = 2, done = false, eggs = [], i;
    for (i = 0; i < 3; i++) {
      (function (i) {
        ink(S('ellipse', { cx: xs[i], cy: 236, rx: 50, ry: 17, fill: '#9C6B3F' }, st), 4);
        var g = G(st, xs[i], 204);
        pad(g, 86, 98, -6);
        var inner = S('g', {}, g);
        ink(S('ellipse', { cx: 0, cy: -8, rx: 27, ry: 35, fill: '#FFF6E6' }, inner), 4);
        S('ellipse', { cx: -9, cy: -22, rx: 8, ry: 11, fill: '#FFFFFF', opacity: '.8' }, inner);
        S('circle', { cx: 8, cy: 2, r: 3.4, fill: '#E9D9BC' }, inner);
        S('circle', { cx: -6, cy: 10, r: 2.6, fill: '#E9D9BC' }, inner);
        S('circle', { cx: 12, cy: -16, r: 2.4, fill: '#E9D9BC' }, inner);
        eggs.push(inner);
        var rim = ink(S('path', { d: 'M' + (xs[i] - 50) + ',236 q50,26 100,0 q-10,22 -50,22 q-40,0 -50,-22 Z', fill: '#B07A4C' }, st), 4);
        rim.style.pointerEvents = 'none';
        tap(g, function () {
          if (done) { return; }
          if (i !== hot) { BS.nope(g); return; }
          done = true;
          inner.setAttribute('opacity', '0');
          ink(S('path', { d: 'M-27,2 l9,-9 l9,9 l9,-9 l9,9 l9,-9 l9,9 q-2,26 -27,26 q-25,0 -27,-26 Z', fill: '#FFF6E6' }, g), 4);
          animal(st, { kind: 'duck', x: xs[i], y: 178, size: 12, fill: '#FFE066', mood: 'wow', shadow: false });
          st.appendChild(g); st.appendChild(rim);
          A.burst(st, xs[i], 180, { n: 8, r: 46 });
          BS.SFX.pop();
          later(BS.win, 520);
        });
      })(i);
    }
    /* a short shiver every couple of seconds, in whole degrees */
    var t0 = Date.now(), last = 0;
    A.tick(function (t) {
      if (done) { return true; }
      var ph = (t - t0) % 2300;
      var a = ph < 440 ? Math.round(Math.sin(ph / 440 * Math.PI * 4) * 7) : 0;
      if (a !== last) { last = a; eggs[hot].setAttribute('transform', 'rotate(' + a + ' 0 26)'); }
      return false;
    });
  }
},

/* ---------- a reflection is not another one ---------- */
{
  id: 'n-moon', d: 17,
  ask: 'How many moons are there?',
  hint: 'One of them is wobbly, and one is on a pole. Are those really moons?',
  tell: 'Only the one in the sky. The one in the water is its reflection, and the other is a lamp. One.',
  why: 'A reflection is a picture of the thing, not another one of it.',
  build: function (st) {
    scene(st, 'night', { sun: 'moon', hills: true, groundY: 206, ground: '#3E3372' });
    ink(S('ellipse', { cx: 196, cy: 252, rx: 132, ry: 36, fill: '#2F5F9E' }, st), 4);
    S('circle', { cx: 232, cy: 250, r: 19, fill: '#EFE3C0', opacity: '.85' }, st);
    var i;
    for (i = 0; i < 3; i++) {
      ink(S('path', { d: 'M' + (204 + i * 4) + ',' + (242 + i * 8) + ' q14,-5 28,0 t28,0', fill: 'none' }, st), 3)
        .setAttribute('stroke', '#2F5F9E');
    }
    ink(S('line', { x1: 56, y1: 214, x2: 56, y2: 128 }, st), 6).setAttribute('stroke', '#241534');
    S('circle', { cx: 56, cy: 112, r: 34, fill: A.glow(st, '#FFE58A', .6) }, st);
    ink(S('circle', { cx: 56, cy: 112, r: 17, fill: '#F4E4B0' }, st), 4);
    BS.chips(['2', '1', '3', '0'], 1);
  }
},

/* ---------- answer the question that was asked ---------- */
{
  id: 'n-eyes', d: 21,
  ask: 'How many eyes are open?',
  hint: 'Look at each owl in turn. One of them is doing something cheeky.',
  tell: 'The first owl has two open, the sleepy one has none, and the winking one has one. Three.',
  why: 'Six eyes, but only three were open. The question asked about the open ones.',
  build: function (st) {
    scene(st, 'night', { hills: false, ground: false });
    ink(S('path', { d: 'M-6,206 Q180,186 366,204', fill: 'none' }, st), 14).setAttribute('stroke', '#241534');
    ink(S('path', { d: 'M-6,206 Q180,186 366,204', fill: 'none' }, st), 8).setAttribute('stroke', '#8A5F3B');
    animal(st, { kind: 'owl', x: 74, y: 152, size: 24, fill: '#C58B4F', shadow: false, blink: false });
    var sl = animal(st, { kind: 'owl', x: 180, y: 148, size: 24, fill: '#B07A4C', mood: 'sleep', shadow: false, blink: false });
    txt('z', { x: 30, y: -30, 'font-size': 15, fill: '#FFF6E6' }, sl.__body);
    txt('z', { x: 44, y: -44, 'font-size': 20, fill: '#FFF6E6' }, sl.__body);
    var w = animal(st, { kind: 'owl', x: 286, y: 152, size: 24, fill: '#D9A06A', shadow: false, blink: false });
    var op = w.__eyes.open.childNodes, i;
    for (i = 0; i < 4; i++) { op[i].setAttribute('opacity', '0'); }
    w.__eyes.shut.setAttribute('opacity', '1');
    w.__eyes.shut.childNodes[1].setAttribute('opacity', '0');
    BS.chips(['2', '3', '4', '6'], 1);
  }
},

/* ---------- make the thing you do not have ---------- */
{
  id: 'n-green', d: 23,
  ask: 'The frog has lost his colour! Make him green again.',
  hint: 'There is no green paint. But two of these make green together.',
  tell: 'Drag the blue onto the yellow to mix green. Then drag the green onto the frog.',
  why: 'Blue and yellow make green. Two things you had made the one thing you needed.',
  build: function (st) {
    scene(st, 'water', { hills: false, ground: '#8ED6A0', groundY: 196, tufts: false });
    ink(S('ellipse', { cx: 180, cy: 164, rx: 96, ry: 20, fill: '#5FD08A' }, st), 4);
    var pale = animal(st, { kind: 'frog', x: 180, y: 112, size: 28, fill: '#E4E0EE', mood: 'sad', bob: false, shadow: false });
    var green = animal(st, { kind: 'frog', x: 180, y: 112, size: 28, fill: '#5FD08A', bob: false, shadow: false });
    green.setAttribute('opacity', '0');
    green.style.pointerEvents = 'none';
    var COL = { b: '#4A9BE8', y: '#FFD84A', r: '#F0466F', g: '#3FBF7F' };
    var pots = [{ c: 'b', x: 70 }, { c: 'r', x: 180 }, { c: 'y', x: 290 }], done = false, i;
    for (i = 0; i < 3; i++) {
      ink(S('ellipse', { cx: pots[i].x, cy: 268, rx: 34, ry: 9, fill: '#FFF6E6' }, st), 3.5);
    }
    for (i = 0; i < 3; i++) {
      (function (P) {
        var g = G(st, P.x, 252);
        P.g = g;
        P.blob = ink(S('path', { d: 'M-24,2 q-4,-22 14,-24 q10,-8 20,2 q16,2 14,18 q0,16 -22,16 q-24,2 -26,-12 Z', fill: COL[P.c] }, g), 4);
        S('ellipse', { cx: -6, cy: -10, rx: 9, ry: 5, fill: '#FFFFFF', opacity: '.4' }, g);
        drag(g, { onDrop: function (x, y, back) {
          if (done) { return; }
          var k, Q;
          if (hit(x, y, 180, 124, 62)) {
            if (P.c !== 'g') { BS.nope(g); glide(g, back.x, back.y); return; }
            done = true;
            g.setAttribute('opacity', '0');
            pale.setAttribute('opacity', '0'); green.setAttribute('opacity', '1');
            A.burst(st, 180, 110, { n: 10, r: 60, cols: ['#5FD08A', '#FFF6E6', '#FFD84A'] });
            BS.SFX.good();
            later(BS.win, 420);
            return;
          }
          for (k = 0; k < 3; k++) {
            Q = pots[k];
            if (Q === P || Q.gone || !hit(x, y, Q.x, 252, 36)) { continue; }
            if ((P.c === 'b' && Q.c === 'y') || (P.c === 'y' && Q.c === 'b')) {
              P.gone = true;
              g.setAttribute('opacity', '0'); g.style.pointerEvents = 'none';
              Q.c = 'g'; Q.blob.setAttribute('fill', COL.g);
              A.burst(st, Q.x, 246, { n: 8, r: 40, cols: ['#3FBF7F', '#FFD84A', '#4A9BE8'] });
              BS.SFX.good();
              return;
            }
            BS.nope(g); glide(g, back.x, back.y);
            return;
          }
          glide(g, back.x, back.y);
        } });
      })(pots[i]);
    }
  }
},

/* ---------- measure from your own feet ---------- */
{
  id: 'n-tall', d: 25,
  ask: 'Who is really the tallest?',
  hint: 'Imagine they all stepped down onto the grass.',
  tell: 'The bear. Take away the boxes and he is far taller than the other two.',
  why: 'Height is measured from your own feet. The boxes were cheating.',
  build: function (st) {
    scene(st, 'meadow', { hills: true, groundY: 250, clouds: true });
    function crate(x, h) {
      ink(S('rect', { x: x - 34, y: 250 - h, width: 68, height: h, rx: 5, fill: '#C98B52' }, st), 4);
      ink(S('line', { x1: x - 34, y1: 250 - h + 12, x2: x + 34, y2: 250 - h + 12 }, st), 3).setAttribute('stroke', '#8A5F3B');
      S('rect', { x: x - 28, y: 250 - h + 18, width: 10, height: Math.max(0, h - 26), rx: 4, fill: '#FFFFFF', opacity: '.18' }, st);
    }
    crate(70, 104); crate(182, 56);
    var who = [
      { k: 'mouse', x: 70, feet: 146, s: 11, f: '#C9BFD6', leg: 1.84, ok: false },
      { k: 'cat', x: 182, feet: 194, s: 14, f: '#FFB03A', leg: 2.14, ok: false },
      { k: 'bear', x: 292, feet: 250, s: 21, f: '#B07A4C', leg: 2.16, ok: true }
    ];
    for (var i = 0; i < 3; i++) {
      (function (W) {
        var g = G(st, W.x, W.feet - W.s * W.leg);
        pad(g, 78, W.s * 4.2, W.s * .5);
        animal(g, { kind: W.k, x: 0, y: 0, size: W.s, fill: W.f, shadow: false, bob: false });
        tap(g, function () { if (W.ok) { BS.win(); } else { BS.nope(g); } });
      })(who[i]);
    }
  }
},

/* ---------- fair means through the middle ---------- */
{
  id: 'n-pizza', d: 29,
  ask: 'Cut the pizza so two friends get the same amount.',
  hint: 'A fair cut goes right through the very middle. It does not have to be straight up and down.',
  tell: 'The slanted cut. It is the only one that passes through the middle.',
  why: 'Any cut through the middle makes two equal halves, even a wonky one.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false });
    var cx = 172, cy = 158, i;
    A.shadow(st, cx, cy + 84, 96, 14);
    ink(S('circle', { cx: cx, cy: cy, r: 90, fill: '#E0A85A' }, st), 5);
    ink(S('circle', { cx: cx, cy: cy, r: 76, fill: '#FFC93C' }, st), 3);
    var tops = [[-38, -30], [30, -44], [44, 22], [-20, 40], [-50, 14], [8, -8], [14, 50], [-6, -54]];
    for (i = 0; i < tops.length; i++) {
      ink(S('circle', { cx: cx + tops[i][0], cy: cy + tops[i][1], r: 10, fill: '#E8464C' }, st), 2.6);
    }
    var cuts = [
      { x1: cx - 44, y1: cy - 96, x2: cx - 44, y2: cy + 96, hx: cx - 44, hy: 40, ok: false },
      { x1: cx - 98, y1: cy + 38, x2: cx + 98, y2: cy + 38, hx: 314, hy: cy + 38, ok: false },
      { x1: cx - 70, y1: cy + 66, x2: cx + 70, y2: cy - 66, hx: cx + 98, hy: cy - 92, ok: true }
    ];
    for (i = 0; i < 3; i++) {
      (function (C) {
        var ln = ink(S('line', { x1: C.x1, y1: C.y1, x2: C.x2, y2: C.y2, 'stroke-dasharray': '9 8' }, st), 4);
        ln.style.pointerEvents = 'none';
        var g = G(st, C.hx, C.hy);
        pad(g, 54, 54);
        ink(S('circle', { cx: 0, cy: 0, r: 20, fill: '#FFF6E6' }, g), 4);
        var dx = C.x2 - C.x1, dy = C.y2 - C.y1, len = Math.sqrt(dx * dx + dy * dy);
        ink(S('line', { x1: -dx / len * 11, y1: -dy / len * 11, x2: dx / len * 11, y2: dy / len * 11 }, g), 5)
          .setAttribute('stroke', '#F0466F');
        tap(g, function () {
          if (!C.ok) { BS.nope(g); return; }
          ln.removeAttribute('stroke-dasharray');
          ln.setAttribute('stroke', '#FFF6E6'); ln.setAttribute('stroke-width', '7');
          BS.SFX.good();
          later(BS.win, 320);
        });
      })(cuts[i]);
    }
  }
},

/* ---------- find the one that breaks the rule ---------- */
{
  id: 'n-bead', d: 33,
  ask: 'One bead is in the wrong place. Tap it.',
  hint: 'Say it out loud from the left: red, blue, blue... where does it trip?',
  tell: 'The eighth bead. It is red, but it should be blue.',
  why: 'Red, blue, blue, over and over. Once you know the rule, the mistake sticks out.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var seq = [0, 1, 1, 0, 1, 1, 0, 0, 1], bad = 7, i;
    ink(S('path', { d: 'M8,120 Q180,196 352,120', fill: 'none' }, st), 4).setAttribute('stroke', '#8A7BA8');
    for (i = 0; i < 9; i++) {
      (function (i) {
        var x = 28 + i * 38, u = (x - 180) / 172, y = 158 - u * u * 38;
        var g = G(st, x, y);
        pad(g, 36, 70);
        var e;
        function paint(k) {
          if (e && e.parentNode) { e.parentNode.removeChild(e); }
          e = k === 0 ? ink(S('circle', { cx: 0, cy: 0, r: 15.5, fill: A.bodyFill(st, '#F0466F') }, g), 3.5)
                      : ink(S('rect', { x: -14, y: -14, width: 28, height: 28, rx: 6, fill: A.bodyFill(st, '#4A9BE8') }, g), 3.5);
        }
        paint(seq[i]);
        tap(g, function () {
          if (i !== bad) { BS.nope(g); return; }
          paint(1);
          A.burst(st, x, y, { n: 6, r: 30 });
          BS.SFX.good();
          later(BS.win, 360);
        });
      })(i);
    }
  }
},

/* ---------- measure, do not trust your eyes ---------- */
{
  id: 'n-lines', d: 35,
  ask: 'Which line is longer?',
  hint: 'Your eyes can be tricked. You are allowed to move the lines.',
  tell: 'Drag one line on top of the other. They are exactly the same.',
  why: 'The little arrows fooled your eyes. Measuring beat looking.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    function line(y, inward, col) {
      var g = G(st, 180, y), k = inward ? 1 : -1, e;
      pad(g, 200, 58);
      ink(S('line', { x1: -78, y1: 0, x2: 78, y2: 0 }, g), 7).setAttribute('stroke', col);
      for (e = -1; e <= 1; e += 2) {
        ink(S('path', { d: 'M' + (e * 78 - e * k * 20) + ',-17 L' + (e * 78) + ',0 L' + (e * 78 - e * k * 20) + ',17', fill: 'none' }, g), 6)
          .setAttribute('stroke', col);
      }
      drag(g);
      return g;
    }
    line(96, false, '#F0466F');
    line(196, true, '#4A9BE8');
    BS.chips(['Top', 'Bottom', 'Same'], 2);
  }
},

/* ---------- sharing ---------- */
{
  id: 'n-share', d: 37,
  ask: 'Share the carrots so it is fair for every bunny.',
  hint: 'Count all the carrots first. Then think how many each bunny should end up with.',
  tell: 'Six carrots and three bunnies means two each. Move two carrots off the full plate.',
  why: 'Six shared between three is two each. Fair means the same, not just "some".',
  data: { start: [4, 1, 1] },
  build: function (st) {
    scene(st, 'meadow', { hills: false, groundY: 100, tufts: false, sun: false });
    var px = [66, 180, 294], plates = [[], [], []], done = false, i, k;
    var fills = ['#F5E2D0', '#E9D6F2', '#D6ECF5'];
    for (i = 0; i < 3; i++) {
      animal(st, { kind: 'bunny', x: px[i], y: 58, size: 14, fill: fills[i], shadow: false });
      ink(S('rect', { x: px[i] - 50, y: 134, width: 100, height: 124, rx: 18, fill: '#FFF6E6' }, st), 4);
    }
    function slot(p, n) { return [px[p] - 30 + (n % 3) * 30, 168 + Math.floor(n / 3) * 56]; }
    function layout(anim) {
      for (var p = 0; p < 3; p++) {
        for (var n = 0; n < plates[p].length; n++) {
          var s = slot(p, n);
          if (anim) { glide(plates[p][n], s[0], s[1], 200); } else { place(plates[p][n], s[0], s[1]); }
        }
      }
    }
    function carrot(p) {
      var g = G(st, 0, 0);
      pad(g, 28, 54);
      ink(S('path', { d: 'M-2,-12 q-10,-10 -6,-16 M0,-12 q0,-12 2,-16 M2,-12 q10,-8 8,-14', fill: 'none' }, g), 3.5).setAttribute('stroke', '#3FBF7F');
      ink(S('path', { d: 'M-9,-12 q9,-6 18,0 q-2,26 -9,36 q-7,-10 -9,-36 Z', fill: '#FF8A3D' }, g), 3.5);
      g.__p = p;
      plates[p].push(g);
      drag(g, { onDrop: function (x) {
        if (done) { return; }
        var to = x < 123 ? 0 : (x < 237 ? 1 : 2), from = g.__p, at = plates[from].indexOf(g);
        if (at >= 0) { plates[from].splice(at, 1); }
        plates[to].push(g); g.__p = to;
        layout(true);
        if (plates[0].length === 2 && plates[1].length === 2 && plates[2].length === 2) {
          done = true; later(BS.win, 380);
        }
      } });
    }
    var start = this.data.start;
    for (i = 0; i < 3; i++) { for (k = 0; k < start[i]; k++) { carrot(i); } }
    layout(false);
  }
},

/* ---------- find the jump ---------- */
{
  id: 'n-hops', d: 39,
  ask: 'She hops the same distance every time. Which stone is next?',
  hint: 'Count how many stones she moves along on each hop.',
  tell: 'She lands on 2, 5 and 8, so she moves 3 each time. Next is 11.',
  why: 'Every hop was three stones. Find the size of the jump and you know the whole path.',
  build: function (st) {
    scene(st, 'water', { hills: false, ground: false });
    var landed = { 2: 1, 5: 1, 8: 1 }, n, done = false;
    function sx(n) { return 24 + (n - 1) * 24; }
    ink(S('path', { d: 'M' + sx(2) + ',178 Q' + ((sx(2) + sx(5)) / 2) + ',112 ' + sx(5) + ',178', fill: 'none', 'stroke-dasharray': '6 7' }, st), 3.5)
      .setAttribute('stroke', '#FFF6E6');
    ink(S('path', { d: 'M' + sx(5) + ',178 Q' + ((sx(5) + sx(8)) / 2) + ',112 ' + sx(8) + ',178', fill: 'none', 'stroke-dasharray': '6 7' }, st), 3.5)
      .setAttribute('stroke', '#FFF6E6');
    var bun = animal(st, { kind: 'bunny', x: sx(8), y: 170, size: 11, fill: '#F5E2D0', shadow: false, bob: false });
    for (n = 1; n <= 14; n++) {
      (function (n) {
        var g = G(st, sx(n), 204);
        pad(g, 24, 64, 4);
        ink(S('ellipse', { cx: 0, cy: 0, rx: 11, ry: 9, fill: landed[n] ? '#5FD08A' : '#D9D2E6' }, g), 2.6);
        txt(String(n), { x: 0, y: 26, 'font-size': 12, fill: '#241534' }, g);
        tap(g, function () {
          if (done) { return; }
          if (n !== 11) { BS.nope(g); return; }
          done = true;
          BS.SFX.hop();
          glide(bun, sx(11), 170, 380);
          later(BS.win, 520);
        });
      })(n);
    }
  }
},

/* ---------- two groups at once ---------- */
{
  id: 'n-hoops', d: 42,
  ask: 'Where does the red ball belong?',
  hint: 'It is red AND it is round. Is there a place that is inside both hoops?',
  tell: 'Drop it in the middle, where the two hoops cross over.',
  why: 'Some things belong to two groups at once. The overlap is where they live.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var L = [128, 128], R = [232, 128], rad = 84;
    S('circle', { cx: L[0], cy: L[1], r: rad, fill: '#F0466F', opacity: '.14' }, st);
    S('circle', { cx: R[0], cy: R[1], r: rad, fill: '#4A9BE8', opacity: '.14' }, st);
    ink(S('circle', { cx: L[0], cy: L[1], r: rad, fill: 'none' }, st), 5).setAttribute('stroke', '#F0466F');
    ink(S('circle', { cx: R[0], cy: R[1], r: rad, fill: 'none' }, st), 5).setAttribute('stroke', '#4A9BE8');
    note(st, 'red things', 84, 34, 13);
    note(st, 'round things', 276, 34, 13);
    ink(S('rect', { x: 62, y: 92, width: 30, height: 30, rx: 4, fill: '#F0466F' }, st), 3.5);
    ink(S('path', { d: 'M86,170 L106,138 L126,170 Z', fill: '#F0466F' }, st), 3.5);
    ink(S('circle', { cx: 284, cy: 104, r: 16, fill: '#4A9BE8' }, st), 3.5);
    ink(S('circle', { cx: 268, cy: 158, r: 16, fill: '#3FBF7F' }, st), 3.5);
    var ball = G(st, 180, 262), done = false;
    pad(ball, 56, 56);
    ink(S('circle', { cx: 0, cy: 0, r: 19, fill: A.bodyFill(st, '#F0466F') }, ball), 4);
    drag(ball, { onDrop: function (x, y, back) {
      if (done) { return; }
      var inL = Math.sqrt(Math.pow(x - L[0], 2) + Math.pow(y - L[1], 2)) < rad - 6;
      var inR = Math.sqrt(Math.pow(x - R[0], 2) + Math.pow(y - R[1], 2)) < rad - 6;
      if (inL && inR) { done = true; glide(ball, 180, 128); BS.SFX.good(); later(BS.win, 360); return; }
      if (inL || inR) { BS.nope(ball); }
      glide(ball, back.x, back.y);
    } });
  }
},

/* ---------- place value ---------- */
{
  id: 'n-digits', d: 44,
  ask: 'Make the biggest number you can. Tap two cards to swap them.',
  hint: 'The first place is worth the most. Which card deserves it?',
  tell: '7 first, then 5, then 2. That makes 752.',
  why: 'The same three cards can make 257 or 752. The seat at the front matters most.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var D = ['7', '5', '2'], C = ['#FFC93C', '#6EC6E8', '#FF8FA6'];
    orderGame(st, 150, function (g, k) {
      ink(S('rect', { x: -46, y: -58, width: 92, height: 116, rx: 14, fill: C[k] }, g), 4);
      S('rect', { x: -38, y: -50, width: 40, height: 12, rx: 6, fill: '#FFFFFF', opacity: '.35' }, g);
      txt(D[k], { x: 0, y: 28, 'font-size': 76, fill: '#241534' }, g);
    }, [1, 2, 0]);
  }
},

/* ---------- follow instructions in order ---------- */
{
  id: 'n-robot1', d: 46,
  ask: 'The robot follows the arrows, one at a time. Where does it stop?',
  hint: 'Put your finger on the robot and do one arrow at a time.',
  tell: 'Up two, right two, down one, right one. Fourth square along, third row down.',
  why: 'Six little steps, done in order, with nothing skipped. That is how every program runs.',
  data: { cols: 5, rows: 4, start: [0, 3], moves: 'UURRDR' },
  build: function (st) {
    scene(st, 'lab', { hills: false, ground: false });
    var D = this.data, u = 46, ox = 180 - D.cols * u / 2, oy = 96, i, r, c;
    var DX = { U: 0, D: 0, L: -1, R: 1 }, DY = { U: -1, D: 1, L: 0, R: 0 }, ROT = { U: 0, R: 90, D: 180, L: 270 };
    for (i = 0; i < D.moves.length; i++) {
      var ag = G(st, 180 - (D.moves.length - 1) * 23 + i * 46, 46);
      ink(S('rect', { x: -19, y: -19, width: 38, height: 38, rx: 9, fill: '#FFC93C' }, ag), 3.5);
      ink(S('path', { d: 'M0,-12 L10,2 L4,2 L4,12 L-4,12 L-4,2 L-10,2 Z', fill: '#241534',
        transform: 'rotate(' + ROT[D.moves.charAt(i)] + ')' }, ag), 1);
    }
    var end = D.start.slice(), path = [];
    for (i = 0; i < D.moves.length; i++) {
      end = [end[0] + DX[D.moves.charAt(i)], end[1] + DY[D.moves.charAt(i)]];
      path.push(end);
    }
    function cxy(p) { return [ox + p[0] * u + u / 2, oy + p[1] * u + u / 2]; }
    var cells = [];
    for (r = 0; r < D.rows; r++) {
      for (c = 0; c < D.cols; c++) {
        ink(S('rect', { x: ox + c * u + 2, y: oy + r * u + 2, width: u - 4, height: u - 4, rx: 8,
          fill: (r + c) % 2 ? '#EEF4FA' : '#FFFFFF' }, st), 2.6);
      }
    }
    var s0 = cxy(D.start), bot = A.robot(st, { x: s0[0], y: s0[1] - 1, size: 13 }), done = false;
    bot.style.pointerEvents = 'none';
    /* hit layer last, above the robot, or a tap on its square lands on the art */
    for (r = 0; r < D.rows; r++) {
      for (c = 0; c < D.cols; c++) {
        (function (r, c) {
          var z = G(st, ox + c * u + u / 2, oy + r * u + u / 2);
          pad(z, u, u);
          cells.push(z);
          tap(z, function () {
            if (done) { return; }
            if (c !== end[0] || r !== end[1]) { BS.nope(z); return; }
            done = true;
            BS.lock(true);
            for (var k = 0; k < path.length; k++) {
              (function (k) {
                later(function () { var p = cxy(path[k]); glide(bot, p[0], p[1] - 1, 190); BS.SFX.tap(); }, k * 230);
              })(k);
            }
            later(function () { BS.lock(false); BS.win(); }, path.length * 230 + 220);
          });
        })(r, c);
      }
    }
  }
},

/* ---------- shapes hide inside shapes, again ---------- */
{
  id: 'n-squares', d: 48,
  ask: 'How many squares can you see?',
  hint: 'Four small ones. Is there a bigger one hiding around them?',
  tell: 'Four small squares, plus the big one they make together. Five.',
  why: 'The big square was built from the small ones. You counted the same lines twice, on purpose.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var g = G(st, 180, 150), cols = ['#6EC6E8', '#FFC93C', '#FF8FA6', '#3FBF7F'], i;
    for (i = 0; i < 4; i++) {
      S('rect', { x: -96 + (i % 2) * 96, y: -96 + Math.floor(i / 2) * 96, width: 96, height: 96, fill: cols[i] }, g);
    }
    ink(S('rect', { x: -96, y: -96, width: 192, height: 192, rx: 4, fill: 'none' }, g), 6);
    ink(S('path', { d: 'M0,-96 L0,96 M-96,0 L96,0', fill: 'none' }, g), 6);
    BS.chips(['4', '5', '6', '8'], 1);
  }
},

/* ---------- join two clues ---------- */
{
  id: 'n-race', d: 52,
  ask: 'Who came first, second and third? Tap two to swap them.',
  hint: 'Find the one that nobody finished in front of. That one is first.',
  tell: 'Bunny, then Cat, then Bear.',
  why: 'Nobody said Bunny beat Bear. You joined two clues together to know it.',
  build: function (st) {
    scene(st, 'meadow', { hills: false, ground: false });
    var clues = ['Cat finished before Bear.', 'Bunny finished before Cat.'], i, g;
    for (i = 0; i < 2; i++) {
      g = G(st, 180, 26 + i * 40);
      ink(S('rect', { x: -150, y: -16, width: 300, height: 32, rx: 10, fill: '#FFF6E6' }, g), 3);
      txt(clues[i], { x: 0, y: 6, 'font-size': 16, fill: '#241534' }, g);
    }
    var xs = [66, 180, 294], lab = ['1st', '2nd', '3rd'], hs = [34, 24, 16];
    for (i = 0; i < 3; i++) {
      ink(S('rect', { x: xs[i] - 50, y: 296 - hs[i] - 14, width: 100, height: hs[i] + 20, rx: 6, fill: ['#FFC93C', '#D9D2E6', '#E0A85A'][i] }, st), 3.5);
      txt(lab[i], { x: xs[i], y: 294, 'font-size': 15, fill: '#241534' }, st);
    }
    var spec = [{ k: 'bunny', f: '#F5E2D0', s: 15, dy: -4 }, { k: 'cat', f: '#FFB03A', s: 15, dy: -10 }, { k: 'bear', f: '#B07A4C', s: 16, dy: -12 }];
    orderGame(st, 172, function (card, k) {
      ink(S('rect', { x: -44, y: -48, width: 88, height: 96, rx: 12, fill: '#FFF6E6' }, card), 3.5);
      animal(card, { kind: spec[k].k, x: 0, y: spec[k].dy, size: spec[k].s, fill: spec[k].f, bob: false, shadow: false });
    }, [2, 0, 1], null, 96, 104);
  }
},

/* ---------- ones across, tens down ---------- */
{
  id: 'n-hundred', d: 54,
  ask: 'This piece broke off a number chart. Which number is missing?',
  hint: 'Look at the numbers on its left and right. What sits between them?',
  tell: '43, then the missing one, then 45. It is 44. Going down, the tens go up by one: 34, 44, 54.',
  why: 'Across goes up in ones, down goes up in tens. The chart has two patterns woven together.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: false });
    var u = 66, cx = 180, cy = 150;
    var cells = [[0, -1, '34'], [-1, 0, '43'], [0, 0, '?'], [1, 0, '45'], [0, 1, '54']], i;
    for (i = 0; i < cells.length; i++) {
      var q = cells[i][2] === '?';
      var g = G(st, cx + cells[i][0] * u, cy + cells[i][1] * u);
      ink(S('rect', { x: -u / 2 + 2, y: -u / 2 + 2, width: u - 4, height: u - 4, rx: 8, fill: q ? '#FFF6E6' : '#FFC93C' }, g), 4);
      if (!q) { S('rect', { x: -u / 2 + 9, y: -u / 2 + 9, width: 26, height: 8, rx: 4, fill: '#FFFFFF', opacity: '.35' }, g); }
      txt(cells[i][2], { x: 0, y: 11, 'font-size': 30, fill: q ? '#8A7BA8' : '#241534' }, g);
    }
    BS.chips(['35', '44', '46', '53'], 1);
  }
},

/* ---------- a shadow points away from the light ---------- */
{
  id: 'n-shadow', d: 56,
  ask: 'The sun is hiding behind a cloud. Which one?',
  hint: "Look at the tree's shadow. Which way is it pointing?",
  tell: 'The shadow falls to the right, so the light comes from the left. Tap the left cloud.',
  why: 'A shadow always points away from the light. The ground told you where to look.',
  build: function (st) {
    scene(st, 'day', { hills: true, groundY: 224 });
    var sun = G(st, 58, 60);
    S('circle', { cx: 0, cy: 0, r: 46, fill: A.glow(st, '#FFD86B', .6) }, sun);
    ink(S('circle', { cx: 0, cy: 0, r: 22, fill: '#FFC93C' }, sun), 4);
    S('path', { d: 'M176,236 L196,236 L332,262 L250,272 Z', fill: '#241534', opacity: '.3' }, st);
    S('ellipse', { cx: 296, cy: 264, rx: 46, ry: 13, fill: '#241534', opacity: '.3' }, st);
    ink(S('rect', { x: 172, y: 150, width: 26, height: 90, rx: 6, fill: '#8A5F3B' }, st), 4);
    ink(S('circle', { cx: 150, cy: 144, r: 32, fill: '#57B96A' }, st));
    ink(S('circle', { cx: 218, cy: 148, r: 30, fill: '#57B96A' }, st));
    ink(S('circle', { cx: 184, cy: 116, r: 42, fill: '#4CA85E' }, st));
    var xs = [58, 180, 302], ys = [60, 44, 60], done = false;
    for (var i = 0; i < 3; i++) {
      (function (i) {
        var g = cloud(st, xs[i], ys[i], 1.04);
        pad(g, 110, 78);
        tap(g, function () {
          if (done) { return; }
          if (i !== 0) { BS.nope(g); return; }
          done = true;
          glide(g, 150, 74, 500);
          BS.SFX.good();
          later(BS.win, 620);
        });
      })(i);
    }
  }
},

/* ---------- turned is not flipped ---------- */
{
  id: 'n-turned', d: 58,
  ask: 'Which one is the blue shape, just turned around?',
  hint: 'Turn the blue shape in your head, like turning a key. Flipping it over is not allowed.',
  tell: 'The middle one. The first is flipped like a mirror, and the last is a different shape.',
  why: 'Turning keeps a shape the same. Flipping makes its mirror twin, which is a different thing.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    function shape(parent, cells, u, col) {
      var mx = 0, my = 0, k;
      for (k = 0; k < cells.length; k++) { mx = Math.max(mx, cells[k][0] + 1); my = Math.max(my, cells[k][1] + 1); }
      for (k = 0; k < cells.length; k++) {
        ink(S('rect', { x: (cells[k][0] - mx / 2) * u, y: (cells[k][1] - my / 2) * u, width: u, height: u, rx: 3, fill: col }, parent), 3);
      }
    }
    var ref = G(st, 180, 78);
    shape(ref, [[0, 0], [0, 1], [0, 2], [1, 2]], 30, '#4A9BE8');
    var opts = [
      [[0, 1], [1, 1], [2, 1], [0, 0]],
      [[0, 0], [1, 0], [2, 0], [0, 1]],
      [[0, 0], [1, 0], [2, 0], [1, 1]]
    ];
    options(st, 222, function (g, i) { shape(g, opts[i], 22, '#FF8A3D'); }, 1, [66, 180, 294], 92);
  }
}

  ];
})());
