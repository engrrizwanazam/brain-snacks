/* ==========================================================
   Brain Snacks — Big One
   Two animals, drawn at the wrong sizes. Tap the one that is
   bigger in real life. What you know has to beat what you see.
   Endless, gets faster, grows to three animals.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G;

  /* r is real-life size. Pairs are only ever dealt at least 3 apart, so
     there is never an argument about a cat and a fox. */
  var ZOO = [
    { k: 'mouse', r: 1, f: '#C9BFD6', leg: 1.9 }, { k: 'frog', r: 2, f: '#5FD08A', leg: 1.7 },
    { k: 'duck', r: 4, f: '#FFE066', leg: 1.9 }, { k: 'bunny', r: 5, f: '#F5E2D0', leg: 2.0 },
    { k: 'cat', r: 7, f: '#FFB03A', leg: 2.15 }, { k: 'fox', r: 8, f: '#E8722F', leg: 2.2 },
    { k: 'dog', r: 10, f: '#C98B52', leg: 2.2 }, { k: 'pig', r: 12, f: '#FF9FB2', leg: 2.2 },
    { k: 'lion', r: 15, f: '#E8A63A', leg: 2.2 }, { k: 'bear', r: 16, f: '#B07A4C', leg: 2.2 },
    { k: 'elephant', r: 20, f: '#A9A6C4', leg: 2.3 }
  ];
  var MINGAP = 3;

  var api, score, best, lives, playing, tLeft, tMax, right, shown;

  function hud() { api.score(score + '  ' + KIT.hearts(lives)); }

  function deal(n) {
    var tries, picks, i, j, ok, top, second;
    for (tries = 0; tries < 400; tries++) {
      picks = KIT.shuffle(ZOO.slice()).slice(0, n);
      picks.sort(function (a, b) { return b.r - a.r; });
      ok = true;
      for (i = 0; i < n && ok; i++) {
        for (j = i + 1; j < n; j++) { if (picks[i].r - picks[j].r < MINGAP) { ok = false; break; } }
      }
      if (ok) { return picks; }
    }
    return [ZOO[10], ZOO[4], ZOO[0]].slice(0, n);
  }

  function round() {
    if (!playing) { return; }
    shown++;
    var n = score >= 10 ? 3 : 2;
    var picks = deal(n);                        /* biggest first */
    var sizes = n === 2 ? [31, 13] : [30, 20, 12];
    /* the first two rounds are honest; after that the drawing usually lies */
    var lie = shown > 2 && Math.random() < 0.72;
    if (lie) { sizes.reverse(); }
    else if (shown > 2 && n === 3) { sizes = [20, 30, 12]; }
    var xs = n === 2 ? [96, 264] : [66, 180, 294];
    var order = KIT.shuffle(n === 2 ? [0, 1] : [0, 1, 2]);

    A.clear(api.arena);
    A.scene(api.arena, 'meadow', { w: 360, h: 420, groundY: 322, sun: 'sun', clouds: true, flowers: true });
    A.lift(api.arena);
    KIT.banner(api.arena, 'Who is bigger in real life?', 30);

    for (var i = 0; i < n; i++) {
      (function (i) {
        var P = picks[i], s = sizes[i], x = xs[order[i]];
        var g = G(api.arena, x, 318 - P.leg * s);
        g.setAttribute('data-rank', P.r);
        g.setAttribute('data-size', s);
        KIT.pad(g, n === 2 ? 150 : 104, 250, 205 - (318 - P.leg * s));
        var a = A.animal(g, { kind: P.k, x: 0, y: 0, size: s, fill: P.f, bob: false });
        BS.tap(g, function () { answer(i === 0, g, a); });
      })(i);
    }
    tMax = Math.max(2400, 5200 - score * 90);
    tLeft = tMax;
    right = true;
    hud();
  }

  function answer(ok, g, a) {
    if (!playing || !right) { return; }
    right = false;
    if (ok) {
      score++;
      if (score > best) { best = score; api.save('bs.bigBest', best); }
      api.SFX.good();
      A.hop(a, 12, 380);
      api.toast(score === 10 ? 'Now three!' : 'Yes!', '#3FBF7F');
      hud();
      api.later(round, 520);
    } else { miss(g, 'Look again!'); }
  }

  function miss(g, word) {
    right = false;
    lives--;
    api.SFX.bad();
    if (g) { BS.wobble(g); }
    api.toast(word, '#F0466F');
    hud();
    if (lives <= 0) { over(); return; }
    api.later(round, 900);
  }

  function over() {
    playing = false;
    api.SFX.over();
    api.later(function () {
      api.over(
        score >= best && score > 0 ? 'New best!' : 'Good game',
        score === 0
          ? 'The drawing is trying to trick you. Think about the real animal, not the picture.'
          : ('You got ' + score + ' right. Your best is ' + best + '.'),
        'Try again'
      );
    }, 600);
  }

  BS.registerMode('big', {
    name: 'Big One', shelf: 'quick', color: '#9FE0A8', shade: '#6BAA76',
    keys: ['bs.bigBest'], best: ['bs.bigBest', 'right', 'right'], blurb: 'Bigger in real life',
    icon: function (a) {
      A.animal(a, { kind: 'mouse', x: 26, y: 15, size: 9.5, fill: '#C9BFD6', shadow: false, bob: false, blink: false });
      A.animal(a, { kind: 'elephant', x: 62, y: 24, size: 5, fill: '#A9A6C4', shadow: false, bob: false, blink: false });
    },
    start: function (a) {
      api = a;
      api.title('Big One');
      api.showBar(true);
      best = api.load('bs.bigBest', 0);
      score = 0; lives = 3; shown = 0; playing = true;
      round();
      var last = Date.now();
      A.tick(function () {
        var now = Date.now(), dt = now - last;
        last = now;
        if (!playing || !right) { return; }
        tLeft -= dt;
        api.bar(tLeft / tMax, tLeft < tMax * 0.3);
        if (tLeft <= 0) { miss(null, 'Too slow!'); }
      });
    },
    stop: function () { playing = false; }
  });
})();
