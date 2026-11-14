/* ==========================================================
   Brain Snacks — Round Up
   A field full of animals, and a picture of one of them at the
   top. How many of THAT one are there?
   The others are in the way, and that is the point: she has to
   keep counting one kind while her eye keeps landing on another.
   Selective attention, and counting that has to be organised
   because the animals are not in a row.
   ========================================================== */
(function () {
  'use strict';
  var A = ART, S = A.S, G = A.G, ink = A.ink;
  var api, score, best, lives, playing, live, count, tLeft, tMax;

  function hud() { api.score(score + '  ' + KIT.hearts(lives)); }

  function plan() {
    return {
      kinds: score >= 5 ? 3 : 2,
      lo: 2 + Math.min(3, Math.floor(score / 4)),
      hi: Math.min(8, 4 + Math.floor(score / 2)),
      total: Math.min(13, 6 + Math.floor(score * 0.7)),
      ms: Math.max(6000, 12000 - score * 300)
    };
  }

  /* n points at least 56 apart. May return fewer; the caller counts what
     was actually placed, never what was asked for. */
  function scatter(n) {
    var pts = [], guard = 0, x, y, ok, i, dx, dy;
    while (pts.length < n && guard++ < 1600) {
      x = 40 + Math.random() * 280; y = 104 + Math.random() * 252; ok = true;
      for (i = 0; i < pts.length; i++) {
        dx = pts[i][0] - x; dy = pts[i][1] - y;
        if (dx * dx + dy * dy < 56 * 56) { ok = false; break; }
      }
      if (ok) { pts.push([x, y]); }
    }
    return pts;
  }

  function round() {
    if (!playing) { return; }
    var p = plan();
    var kinds = KIT.shuffle(KIT.ZOO.slice()).slice(0, p.kinds);
    var want = p.lo + KIT.rnd(p.hi - p.lo + 1);
    var pts = scatter(Math.max(want + 2, p.total)), i, who = [];
    if (pts.length < want + 1) { want = Math.max(1, pts.length - 1); }
    for (i = 0; i < pts.length; i++) { who.push(i < want ? 0 : 1 + KIT.rnd(p.kinds - 1)); }
    count = want;
    /* draw back to front so nearer animals stand in front of further ones */
    var order = [];
    for (i = 0; i < pts.length; i++) { order.push(i); }
    order.sort(function (a, b) { return pts[a][1] - pts[b][1]; });

    A.clear(api.arena);
    A.scene(api.arena, 'meadow', { w: 360, h: 420, groundY: 92, hills: false, tufts: false, vignette: false });
    /* the question is a picture, so nobody has to read "sheep" */
    var bn = G(api.arena, 180, 36);
    bn.setAttribute('data-want', kinds[0].k);
    S('rect', { x: -112, y: -24, width: 224, height: 54, rx: 16, fill: '#C9B48A' }, bn);
    ink(S('rect', { x: -112, y: -28, width: 224, height: 54, rx: 16, fill: '#FFF6E6' }, bn), 3.5);
    A.txt('How many', { x: -34, y: 6, 'font-size': 20, fill: '#241534' }, bn);
    A.animal(bn, { kind: kinds[0].k, x: 46, y: -10, size: 9.5, fill: kinds[0].f, bob: false, blink: false, shadow: false });
    A.txt('?', { x: 84, y: 7, 'font-size': 22, fill: '#241534' }, bn);

    for (i = 0; i < order.length; i++) {
      var q = order[i], K = kinds[who[q]];
      var g = G(api.arena, pts[q][0], pts[q][1]);
      g.setAttribute('data-k', K.k);
      A.animal(g, { kind: K.k, x: 0, y: 0, size: 13, fill: K.f, bob: false });
    }

    var opts = [count], off = [1, -1, 2, -2, 3], v, k, t;
    for (i = 0; i < off.length && opts.length < 4; i++) {
      v = count + off[i];
      if (v >= 1 && opts.indexOf(v) < 0) { opts.push(v); }
    }
    opts.sort(function (a, b) { return a - b; });
    var html = '<div class="picker" style="grid-template-columns:1fr 1fr 1fr 1fr">';
    for (i = 0; i < opts.length; i++) { html += '<button data-v="' + opts[i] + '">' + opts[i] + '</button>'; }
    var foot = api.foot(html + '</div>');
    var btns = foot.querySelectorAll('button');
    for (i = 0; i < btns.length; i++) {
      (function (b) {
        b.addEventListener('click', function () { answer(+b.getAttribute('data-v')); }, false);
      })(btns[i]);
    }
    tMax = p.ms; tLeft = tMax;
    live = true;
    hud();
  }

  function answer(v) {
    if (!playing || !live) { return; }
    live = false;
    if (v === count) {
      score++;
      if (score > best) { best = score; api.save('bs.roundBest', best); }
      api.SFX.good();
      api.toast('Yes, ' + count + '!', '#3FBF7F');
      hud();
      api.later(round, 700);
      return;
    }
    miss('There were ' + count);
  }

  function miss(word) {
    live = false;
    lives--;
    api.SFX.bad();
    api.toast(word, '#F0466F');
    hud();
    if (lives <= 0) { over(); return; }
    api.later(round, 1200);
  }

  function over() {
    playing = false;
    api.SFX.over();
    api.later(function () {
      api.over(
        score >= best && score > 0 ? 'New best!' : 'Good game',
        score === 0
          ? 'Go across the field in rows, like reading. Then nobody gets counted twice.'
          : ('You rounded up ' + score + ' times. Your best is ' + best + '.'),
        'Try again'
      );
    }, 600);
  }

  BS.registerMode('roundup', {
    name: 'Round Up', shelf: 'quick', color: '#A8E08A', shade: '#74AB58',
    keys: ['bs.roundBest'], best: ['bs.roundBest', 'right', 'right'], blurb: 'Only count one kind',
    icon: function (a) {
      A.animal(a, { kind: 'sheep', x: 22, y: 18, size: 7.5, fill: '#FFF6E6', shadow: false, bob: false, blink: false });
      A.animal(a, { kind: 'pig', x: 43, y: 16, size: 7.5, fill: '#FF9FB2', shadow: false, bob: false, blink: false });
      A.animal(a, { kind: 'sheep', x: 64, y: 18, size: 7.5, fill: '#FFF6E6', shadow: false, bob: false, blink: false });
    },
    start: function (a) {
      api = a;
      api.title('Round Up');
      api.showBar(true);
      best = api.load('bs.roundBest', 0);
      score = 0; lives = 3; playing = true; live = false;
      round();
      var last = Date.now();
      A.tick(function () {
        var now = Date.now(), dt = now - last;
        last = now;
        if (!playing || !live) { return; }
        tLeft -= dt;
        api.bar(tLeft / tMax, tLeft < tMax * .3);
        if (tLeft <= 0) { miss('There were ' + count); }
      });
    },
    stop: function () { playing = false; }
  });
})();
