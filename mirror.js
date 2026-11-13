/* ==========================================================
   Brain Snacks — Mirror
   One half of a pattern is painted. Paint the other half so it
   is a mirror image. Symmetry and spatial working memory.
   Endless: the grid grows, and later the mirror lies flat.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var COLS = ['#6EC6E8', '#FF8FA6', '#FFC93C', '#7FD9A4', '#C9B4F5'];

  var api, round, best, playing, tLeft, tMax, warned, want, have, need, flat;

  /* [half width, height, painted squares] */
  function plan(r) {
    if (r < 2) { return [2, 3, 3]; }
    if (r < 4) { return [3, 3, 4]; }
    if (r < 7) { return [3, 4, 6]; }
    if (r < 10) { return [3, 5, 7]; }
    return [4, 5, 9];
  }

  function build() {
    var P = plan(round), hw = P[0], h = P[1], k = P[2], x, y, i;
    flat = round >= 5 && round % 2 === 1;           /* the mirror lies on its side */
    var cols = flat ? h : hw * 2, rows = flat ? hw * 2 : h;
    var u = Math.min(52, Math.floor(Math.min(316 / cols, 300 / rows)));
    var ox = 180 - cols * u / 2, oy = 232 - rows * u / 2;
    var col = COLS[round % COLS.length];

    /* choose the painted squares in the given half, in half-coordinates */
    var cells = [], on = {};
    for (y = 0; y < h; y++) { for (x = 0; x < hw; x++) { cells.push([x, y]); } }
    KIT.shuffle(cells);
    for (i = 0; i < k; i++) { on[cells[i][0] + ':' + cells[i][1]] = 1; }

    KIT.backdrop(api.arena, '#3A2A6B', '#2B1B3F');
    KIT.banner(api.arena, 'Paint the other side to match', 32);
    want = {}; have = 0; need = k;

    for (y = 0; y < rows; y++) {
      for (x = 0; x < cols; x++) {
        (function (x, y) {
          /* map this square back to (distance from the mirror, position along it) */
          var given, d, a;
          if (!flat) { given = x < hw; d = given ? (hw - 1 - x) : (x - hw); a = y; }
          else { given = y < hw; d = given ? (hw - 1 - y) : (y - hw); a = x; }
          var lit = on[(hw - 1 - d) + ':' + a] === 1;
          var g = G(api.arena, ox + x * u + u / 2, oy + y * u + u / 2);
          KIT.pad(g, u, u);
          var box = ink(S('rect', { x: -u / 2 + 2.5, y: -u / 2 + 2.5, width: u - 5, height: u - 5, rx: 8,
            fill: given ? (lit ? col : '#E7DFF2') : '#FFF6E6' }, g), 3);
          g.setAttribute('data-side', given ? 'given' : 'mine');
          g.setAttribute('data-on', given && lit ? '1' : '0');
          g.setAttribute('data-xy', x + ':' + y);
          if (given) { return; }
          if (lit) { want[x + ':' + y] = 1; }
          var done = false;
          BS.tap(g, function () {
            if (!playing || done) { return; }
            if (!want[x + ':' + y]) {
              api.SFX.bad(); BS.wobble(g);
              box.setAttribute('fill', '#F0466F');
              api.later(function () { box.setAttribute('fill', '#FFF6E6'); }, 320);
              tLeft -= 1600;
              api.toast('Not there!', '#F0466F');
              return;
            }
            done = true;
            box.setAttribute('fill', col);
            g.setAttribute('data-on', '1');
            A.pop(g, g.__x, g.__y, .16);
            api.SFX.drop();
            have++;
            if (have === need) { cleared(); }
          });
        })(x, y);
      }
    }
    /* the mirror itself */
    var m = flat
      ? S('line', { x1: ox - 10, y1: oy + hw * u, x2: ox + cols * u + 10, y2: oy + hw * u, 'stroke-dasharray': '10 8' }, api.arena)
      : S('line', { x1: ox + hw * u, y1: oy - 10, x2: ox + hw * u, y2: oy + rows * u + 10, 'stroke-dasharray': '10 8' }, api.arena);
    ink(m, 5).setAttribute('stroke', '#FFF6E6');
    m.style.pointerEvents = 'none';
    api.score('Mirror ' + (round + 1));
  }

  function cleared() {
    playing = false;
    round++;
    if (round > best) { best = round; api.save('bs.mirrorBest', best); }
    api.SFX.win(); api.confetti();
    api.toast(round === 5 ? 'Now sideways!' : 'Perfect!', '#3FBF7F');
    api.later(next, 1000);
  }

  function next() {
    tMax = Math.max(11000, 21000 - round * 600);
    tLeft = tMax; warned = false;
    build();
    playing = true;
  }

  function over() {
    playing = false;
    api.SFX.over();
    api.later(function () {
      api.over(
        round >= best && round > 0 ? 'New best!' : "Time's up",
        round === 0
          ? 'Start with the squares touching the dotted line. Their partners touch it too, just on the other side.'
          : ('You finished ' + round + (round === 1 ? ' mirror' : ' mirrors') + '. Your best is ' + best + '.'),
        'Try again'
      );
    }, 600);
  }

  BS.registerMode('mirror', {
    name: 'Mirror', shelf: 'think', color: '#F5C4E8', shade: '#BE8FB2',
    keys: ['bs.mirrorBest'], best: ['bs.mirrorBest', 'mirror', 'mirrors'], blurb: 'Paint the other side',
    icon: function (a) {
      var on = [[0, 0], [1, 1], [0, 2]], i, x, y;
      for (y = 0; y < 3; y++) {
        for (x = 0; x < 4; x++) {
          var lit = false, mx = x < 2 ? x : 3 - x;
          for (i = 0; i < on.length; i++) { if (on[i][0] === mx && on[i][1] === y) { lit = true; } }
          A.ink(A.S('rect', { x: 18 + x * 12 + (x > 1 ? 2 : 0), y: 4 + y * 12, width: 11, height: 11, rx: 2.5,
            fill: lit ? (x < 2 ? '#6EC6E8' : '#FF8A3D') : '#FFF6E6' }, a), 2);
        }
      }
      A.ink(A.S('line', { x1: 43, y1: 1, x2: 43, y2: 41, 'stroke-dasharray': '4 3' }, a), 2);
    },
    start: function (a) {
      api = a;
      api.title('Mirror');
      api.showBar(true);
      best = api.load('bs.mirrorBest', 0);
      round = 0;
      next();
      var last = Date.now();
      A.tick(function () {
        var now = Date.now(), dt = now - last;
        last = now;
        if (!playing) { return; }
        tLeft -= dt;
        api.bar(tLeft / tMax, tLeft < tMax * 0.28);
        if (tLeft < tMax * 0.28 && !warned) { warned = true; api.SFX.tickTock(); }
        if (tLeft <= 0) { over(); }
      });
    },
    stop: function () { playing = false; }
  });
})();
