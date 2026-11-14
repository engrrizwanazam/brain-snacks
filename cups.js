/* ==========================================================
   Brain Snacks — Cups
   The ball goes under a cup, the cups swap over, and she has to
   keep her eye on one thing while other things move.
   Sustained visual attention, and the only game here where the
   answer is decided before she is allowed to look.
   Difficulty adapts: more swaps and faster swaps when she is
   getting them right, fewer when she is not.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;
  var glide = BS.glide;

  var api, score, best, lives, round, level, playing, timers;
  var cups, slotX, ballAt, busy, ball;

  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { var t = setTimeout(function () { if (playing) { fn(); } }, ms); timers.push(t); return t; }

  function hearts() {
    var s = '';
    for (var i = 0; i < 3; i++) { s += (i < lives) ? '♥' : '♡'; }
    return score + '  ' + s;
  }

  /* level decides how many cups, how many swaps, and how fast */
  function plan() {
    var n = level < 4 ? 3 : 4;
    var swaps = Math.min(9, 2 + Math.floor(level * 0.8));
    var ms = Math.max(220, 620 - level * 42);
    return { n: n, swaps: swaps, ms: ms };
  }

  function cupArt(parent, x, y) {
    var g = G(parent, x, y);
    ink(S('path', { d: 'M-34,-40 L34,-40 L26,34 L-26,34 Z', fill: '#F0466F' }, g), 4);
    ink(S('ellipse', { cx: 0, cy: -40, rx: 34, ry: 10, fill: '#FF8FA6' }, g), 4);
    S('path', { d: 'M-22,-32 L-14,-32 L-9,26 L-17,26 Z', fill: '#FFFFFF', opacity: '.26' }, g);
    return g;
  }

  function drawBoard(p) {
    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#3B2757', '#241534') }, api.arena);
    /* a table for the cups to sit on */
    ink(S('rect', { x: 10, y: 250, width: 340, height: 16, rx: 8, fill: '#9A6E48' }, api.arena), 3);
    slotX = [];
    var gap = p.n === 3 ? 104 : 82;
    for (var i = 0; i < p.n; i++) { slotX.push(180 + (i - (p.n - 1) / 2) * gap); }
    /* the ball is drawn first so the cups cover it */
    ball = G(api.arena, slotX[ballAt], 236);
    ink(S('circle', { cx: 0, cy: 0, r: 17, fill: '#FFC93C' }, ball), 3.5);
    S('circle', { cx: -6, cy: -6, r: 5.5, fill: '#FFFFFF', opacity: '.5' }, ball);
    cups = [];
    for (i = 0; i < p.n; i++) { cups.push(cupArt(api.arena, slotX[i], 250)); }
    /* hit layers last, above the cups, and rebuilt with the board each round.
       A listener on the arena itself would stack up one copy per game. */
    for (i = 0; i < p.n; i++) {
      (function (i) {
        var z = G(api.arena, slotX[i], 236);
        S('rect', { x: -42, y: -60, width: 84, height: 120, rx: 12,
          fill: '#FFFFFF', opacity: '0', 'pointer-events': 'all' }, z);
        BS.tap(z, function () { pick(i); });
      })(i);
    }
  }

  /* cups[i] is the cup currently standing in slot i */
  function swapOnce(p, done) {
    var a = Math.floor(Math.random() * p.n), b;
    do { b = Math.floor(Math.random() * p.n); } while (b === a);
    var ca = cups[a], cb = cups[b];
    glide(ca, slotX[b], 250, p.ms);
    glide(cb, slotX[a], 250, p.ms);
    cups[a] = cb; cups[b] = ca;
    if (ballAt === a) { ballAt = b; }
    else if (ballAt === b) { ballAt = a; }
    api.SFX.grab();
    later(done, p.ms + 40);
  }

  function newRound() {
    if (!playing) { return; }
    round++;
    busy = true;
    var p = plan();
    ballAt = Math.floor(Math.random() * p.n);
    drawBoard(p);
    api.bar(1, false);
    /* lift the cups so she sees where it starts */
    var i;
    for (i = 0; i < p.n; i++) { glide(cups[i], slotX[i], 190, 300); }
    api.toast('Watch!', '#FFC93C');
    later(function () {
      for (var j = 0; j < p.n; j++) { glide(cups[j], slotX[j], 250, 300); }
      api.SFX.drop();
      later(function () { shuffle(p, 0); }, 360);
    }, 1000);
  }

  function shuffle(p, n) {
    if (!playing) { return; }
    api.bar(1 - n / p.swaps, false);
    if (n >= p.swaps) {
      busy = false;
      api.bar(0, false);
      api.toast('Which one?', '#6EC6E8');
      return;
    }
    swapOnce(p, function () { shuffle(p, n + 1); });
  }

  function pick(i) {
    if (!playing || busy) { return; }
    busy = true;
    var p = plan();
    /* lift the cup she chose, and the right one if it was not hers */
    glide(cups[i], slotX[i], 190, 260);
    A.place(ball, slotX[ballAt], 236);
    if (i !== ballAt) { glide(cups[ballAt], slotX[ballAt], 190, 260); }
    if (i === ballAt) {
      score++; level++;
      api.SFX.good();
      api.toast('Found it!', '#3FBF7F');
      api.score(hearts());
      later(newRound, 900);
      return;
    }
    api.SFX.bad();
    api.toast('Under here!', '#F0466F');
    lives--; level = Math.max(0, level - 2);
    api.score(hearts());
    if (lives <= 0) { over(); return; }
    later(newRound, 1200);
  }

  function over() {
    playing = false;
    api.SFX.over();
    if (score > best) { best = score; api.save('bs.cupsBest', best); }
    later2(function () {
      api.over(
        score > 0 && score >= best ? 'New best!' : 'Out of hearts',
        score === 0
          ? 'Pick one cup and stare at it. Do not look at the others at all.'
          : ('You followed it ' + score + ' times. Your best is ' + best + '.'),
        'Play again'
      );
    }, 700);
  }
  /* over() runs after playing is false, so it needs a timer that still fires */
  function later2(fn, ms) { timers.push(setTimeout(fn, ms)); }

  BS.registerMode('cups', {
    name: 'Cups', shelf: 'memory', color: '#F58BA0', shade: '#C05F73',
    keys: ['bs.cupsBest'], best: ['bs.cupsBest', 'found', 'found'], blurb: 'Where is the ball?',
    icon: function (a) {
      var i;
    for (i = 0; i < 3; i++) {
      ART.ink(ART.S('path', { d: 'M' + (14 + i * 22) + ',34 L' + (18 + i * 22) + ',12 L' +
        (34 + i * 22) + ',12 L' + (38 + i * 22) + ',34 Z', fill: '#F0466F' }, a), 2.4);
    }
    ART.ink(ART.S('circle', { cx: 42, cy: 8, r: 6, fill: '#FFC93C' }, a), 2.2);
    },
    start: function (a) {
      api = a; timers = [];
      api.title('Cups');
      api.showBar(true);
      api.foot('');
      best = api.load('bs.cupsBest', 0);
      score = 0; lives = 3; round = 0; level = 0; playing = true; busy = true;
      api.score(hearts());
      newRound();
    },
    stop: function () { playing = false; clearTimers(); }
  });
})();
