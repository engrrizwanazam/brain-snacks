/* ==========================================================
   Brain Snacks — Who Left?
   A few friends stand together. The curtain drops, one slips
   away. Who was it? Kim's game: memory for what, not where.
   Endless; the crowd grows, and later they also swap places.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var ZOO = [
    { k: 'mouse', f: '#C9BFD6' }, { k: 'frog', f: '#5FD08A' }, { k: 'duck', f: '#FFE066' },
    { k: 'hen', f: '#FFF0C0' }, { k: 'bunny', f: '#F5E2D0' }, { k: 'cat', f: '#FFB03A' },
    { k: 'fox', f: '#E8722F' }, { k: 'dog', f: '#C98B52' }, { k: 'pig', f: '#FF9FB2' },
    { k: 'lion', f: '#E8A63A' }, { k: 'bear', f: '#B07A4C' }, { k: 'elephant', f: '#A9A6C4' },
    { k: 'owl', f: '#C58B4F' }, { k: 'penguin', f: '#4A5578' }
  ];

  var api, round, best, lives, playing, phase;

  function count(r) { return Math.min(7, 3 + Math.floor(r / 2)); }
  function hud() { api.score('Round ' + (round + 1) + '  ' + KIT.hearts(lives)); }

  function spots(n) {
    var out = [], cols = n <= 4 ? 2 : 3, rows = Math.ceil(n / cols), i;
    if (n === 3) { cols = 3; rows = 1; }
    for (i = 0; i < n; i++) {
      var c = i % cols, r = Math.floor(i / cols);
      var inRow = (r === rows - 1) ? (n - r * cols) : cols;
      out.push([180 + (c - (inRow - 1) / 2) * 104, 96 + r * 76 + (rows === 1 ? 50 : (rows === 2 ? 22 : 0))]);
    }
    return out;
  }

  function stand(list, pts, tag) {
    for (var i = 0; i < list.length; i++) {
      var g = G(api.arena, pts[i][0], pts[i][1]);
      g.setAttribute(tag, list[i].k);
      A.animal(g, { kind: list[i].k, x: 0, y: 0, size: 15, fill: list[i].f, shadow: false });
    }
  }
  function backdrop() {
    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#5A3F86', '#2B1B3F') }, api.arena);
    S('ellipse', { cx: 180, cy: 268, rx: 170, ry: 22, fill: '#241534', opacity: '.35' }, api.arena);
    ink(S('rect', { x: 8, y: 4, width: 344, height: 14, rx: 6, fill: '#8A5F3B' }, api.arena), 3.5);
  }
  function curtain(k) {
    /* two red drapes that close toward the middle; k is 0..1 */
    var g = S('g', {}, api.arena), w = 172 * k, i;
    if (k <= 0) { return g; }
    for (i = 0; i < 2; i++) {
      ink(S('rect', { x: i ? 352 - w : 8, y: 14, width: w, height: 262, rx: 6, fill: '#D83A5E' }, g), 4);
    }
    return g;
  }

  function build() {
    if (!playing) { return; }
    var n = count(round);
    var pool = KIT.shuffle(ZOO.slice());
    var crowd = pool.slice(0, n), others = pool.slice(n, n + 2);
    var gone = KIT.rnd(n), pts = spots(n);

    backdrop();
    stand(crowd, pts, 'data-show');
    KIT.banner(api.arena, 'Look who is here...', 316);
    phase = 'look';
    hud();
    api.bar(1);

    var showMs = 1500 + n * 700;
    var t0 = Date.now();
    A.tick(function () {
      if (phase !== 'look') { return true; }
      api.bar(Math.max(0, 1 - (Date.now() - t0) / showMs));
      return false;
    });

    api.later(function () {
      if (!playing) { return; }
      phase = 'hide';
      api.SFX.flip();
      var t1 = Date.now(), cur = null;
      A.tick(function () {
        var k = Math.min(1, (Date.now() - t1) / 320);
        if (cur && cur.parentNode) { cur.parentNode.removeChild(cur); }
        cur = curtain(k);
        return k >= 1;
      });
      api.later(function () { ask(crowd, others, gone, pts); }, 700);
    }, showMs);
  }

  function ask(crowd, others, gone, pts) {
    if (!playing) { return; }
    var stay = [], i, where = pts.slice();
    for (i = 0; i < crowd.length; i++) { if (i !== gone) { stay.push(crowd[i]); } }
    /* from round 4 the ones who stayed also shuffle about */
    if (round >= 4) { KIT.shuffle(stay); }
    where.splice(round >= 4 ? where.length - 1 : gone, 1);

    backdrop();
    stand(stay, where, 'data-stay');
    KIT.banner(api.arena, 'Who left?', 304);
    var opts = KIT.shuffle([crowd[gone], others[0], others[1]]);
    for (i = 0; i < 3; i++) {
      (function (i) {
        var g = G(api.arena, 68 + i * 112, 372);
        g.setAttribute('data-opt', opts[i].k);
        KIT.pad(g, 104, 84);
        S('rect', { x: -48, y: -34, width: 96, height: 76, rx: 14, fill: '#C9B58E' }, g);
        ink(S('rect', { x: -48, y: -38, width: 96, height: 76, rx: 14, fill: '#FFF6E6' }, g), 3.5);
        A.animal(g, { kind: opts[i].k, x: 0, y: -16, size: 13, fill: opts[i].f, shadow: false, bob: false });
        BS.tap(g, function () { answer(opts[i] === crowd[gone], g); });
      })(i);
    }
    phase = 'ask';
    api.bar(1);
  }

  function answer(ok, g) {
    if (!playing || phase !== 'ask') { return; }
    phase = 'done';
    if (ok) {
      round++;
      if (round > best) { best = round; api.save('bs.leftBest', best); }
      api.SFX.good(); api.confetti();
      A.burst(api.arena, g.__x, g.__y - 10, { n: 8, r: 44 });
      api.toast('That one!', '#3FBF7F');
      api.later(build, 950);
      return;
    }
    lives--;
    api.SFX.bad(); BS.wobble(g);
    api.toast('Not them!', '#F0466F');
    hud();
    if (lives <= 0) { over(); return; }
    api.later(build, 1000);
  }

  function over() {
    playing = false;
    api.SFX.over();
    api.later(function () {
      api.over(
        round >= best && round > 0 ? 'New best!' : 'Good game',
        round === 0
          ? 'Say their names in your head while you look: cat, duck, bear. A list is easier to keep than a picture.'
          : ('You spotted ' + round + ' sneaky ' + (round === 1 ? 'friend' : 'friends') + '. Your best is ' + best + '.'),
        'Try again'
      );
    }, 600);
  }

  BS.registerMode('left', {
    name: 'Who Left?', shelf: 'memory', color: '#FFA6B8', shade: '#C7768A',
    keys: ['bs.leftBest'], best: ['bs.leftBest', 'round', 'rounds'], blurb: 'Someone slipped away',
    icon: function (a) {
      A.animal(a, { kind: 'cat', x: 20, y: 17, size: 8, fill: '#FFB03A', shadow: false, bob: false, blink: false });
      A.ink(A.S('circle', { cx: 42, cy: 20, r: 11, fill: 'none', 'stroke-dasharray': '4 4' }, a), 2.6);
      A.txt('?', { x: 42, y: 25, 'font-size': 14, fill: '#241534' }, a);
      A.animal(a, { kind: 'duck', x: 63, y: 18, size: 8, fill: '#FFE066', shadow: false, bob: false, blink: false });
    },
    start: function (a) {
      api = a;
      api.title('Who Left?');
      api.showBar(true);
      best = api.load('bs.leftBest', 0);
      round = 0; lives = 3; playing = true;
      build();
    },
    stop: function () { playing = false; phase = 'done'; }
  });
})();
