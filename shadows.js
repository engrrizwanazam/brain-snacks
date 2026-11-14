/* ==========================================================
   Brain Snacks — Shadows
   One animal stands in the dark. Which of the animals below is it?
   The colour, the face and the markings are all gone, so the only
   thing left to go on is the outline: ears, tail, how it stands.
   Later the shadow is turned to face the other way.
   Shape recognition from outline alone.
   ========================================================== */
(function () {
  'use strict';
  var A = ART, S = A.S, G = A.G, ink = A.ink;
  var api, score, best, lives, playing, live, tLeft, tMax;

  /* pairs whose outlines are the same animal in different paint */
  var TWINS = { bear: 'panda', panda: 'bear', cat: 'tiger', tiger: 'cat' };

  function hud() { api.score(score + '  ' + KIT.hearts(lives)); }

  function deal(n) {
    var pool = KIT.shuffle(KIT.ZOO.slice()), out = [], i, j, ok;
    for (i = 0; i < pool.length && out.length < n; i++) {
      ok = true;
      for (j = 0; j < out.length; j++) { if (TWINS[out[j].k] === pool[i].k) { ok = false; } }
      if (ok) { out.push(pool[i]); }
    }
    return out;
  }

  function round() {
    if (!playing) { return; }
    var n = score >= 6 ? 4 : 3;
    var picks = deal(n), want = KIT.rnd(n);
    var flip = score >= 4 && Math.random() < 0.5;
    var xs = n === 3 ? [66, 180, 294] : [51, 137, 223, 309], cw = n === 3 ? 100 : 80;

    A.clear(api.arena);
    KIT.backdrop(api.arena, '#2E2A5E', '#191436');
    KIT.banner(api.arena, 'Whose shadow is this?', 30);
    /* a pool of light for the shadow to stand in */
    S('ellipse', { cx: 180, cy: 132, rx: 112, ry: 92, fill: A.glow(api.arena, '#FFF3C4', .9) }, api.arena);
    S('ellipse', { cx: 180, cy: 196, rx: 84, ry: 15, fill: '#FFF3C4', opacity: '.5' }, api.arena);

    var sg = G(api.arena, 180, 118);
    sg.setAttribute('data-want', picks[want].k);
    sg.setAttribute('data-flip', flip ? '1' : '0');
    A.silhouette(A.animal(sg, { kind: picks[want].k, x: 0, y: 0, size: 30, fill: '#241534',
      flip: flip, bob: false, blink: false, shadow: false, blush: false }));

    for (var i = 0; i < n; i++) {
      (function (i) {
        var g = G(api.arena, xs[i], 322);
        g.setAttribute('data-opt', picks[i].k);
        S('rect', { x: -cw / 2 + 2, y: -52, width: cw - 4, height: 112, rx: 14, fill: '#C9B48A' }, g);
        ink(S('rect', { x: -cw / 2 + 2, y: -56, width: cw - 4, height: 112, rx: 14, fill: '#FFF6E6' }, g), 3.5);
        var a = A.animal(g, { kind: picks[i].k, x: 0, y: -22, size: n === 3 ? 17 : 14, fill: picks[i].f,
          bob: false, shadow: false });
        KIT.pad(g, cw, 120);
        BS.tap(g, function () { answer(i === want, g, a); });
      })(i);
    }
    tMax = Math.max(2600, 6500 - score * 130);
    tLeft = tMax;
    live = true;
    hud();
  }

  function answer(ok, g, a) {
    if (!playing || !live) { return; }
    live = false;
    if (ok) {
      score++;
      if (score > best) { best = score; api.save('bs.shadowBest', best); }
      api.SFX.good();
      A.hop(a, 10, 360);
      api.toast(score === 6 ? 'Now four!' : 'Yes!', '#3FBF7F');
      hud();
      api.later(round, 560);
    } else { miss(g, 'Look at the ears!'); }
  }

  function miss(g, word) {
    live = false;
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
          ? 'A shadow keeps the shape and loses everything else. Look at the ears and the tail.'
          : ('You named ' + score + ' shadows. Your best is ' + best + '.'),
        'Try again'
      );
    }, 600);
  }

  BS.registerMode('shadow', {
    name: 'Shadows', shelf: 'quick', color: '#B9A8F0', shade: '#8676BC',
    keys: ['bs.shadowBest'], best: ['bs.shadowBest', 'shadow', 'shadows'], blurb: 'Who is in the dark?',
    icon: function (a) {
      A.silhouette(A.animal(a, { kind: 'bunny', x: 28, y: 20, size: 8.5, fill: '#241534', shadow: false, bob: false, blink: false, blush: false }));
      A.animal(a, { kind: 'bunny', x: 58, y: 20, size: 8.5, fill: '#F5E2D0', shadow: false, bob: false, blink: false });
    },
    start: function (a) {
      api = a;
      api.title('Shadows');
      api.showBar(true);
      api.foot('');
      best = api.load('bs.shadowBest', 0);
      score = 0; lives = 3; playing = true; live = false;
      round();
      var last = Date.now();
      A.tick(function () {
        var now = Date.now(), dt = now - last;
        last = now;
        if (!playing || !live) { return; }
        tLeft -= dt;
        api.bar(tLeft / tMax, tLeft < tMax * .3);
        if (tLeft <= 0) { miss(null, 'Too slow!'); }
      });
    },
    stop: function () { playing = false; }
  });
})();
