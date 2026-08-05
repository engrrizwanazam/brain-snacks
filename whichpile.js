/* ==========================================================
   Brain Snacks — Which Pile
   Two piles of stones. Tap the one with MORE stones.
   The catch: often the pile with fewer stones is the one that
   looks bigger, because its stones are fat and spread out. So
   "more stuff" and "more things" pull against each other, and she
   has to answer the second one. That is a Stroop conflict with no
   reading in it at all.
   Difficulty adapts: the two counts get closer together.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var api, score, best, lives, level, playing, timers, answered, rightSide;
  var tLeft, tMax;

  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { var t = setTimeout(function () { if (playing) { fn(); } }, ms); timers.push(t); return t; }
  function later2(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function hearts() {
    var s = '';
    for (var i = 0; i < 3; i++) { s += (i < lives) ? '♥' : '♡'; }
    return score + '  ' + s;
  }

  /* the ratio is what makes this hard, not the size of the numbers */
  function plan() {
    var ratio = Math.max(1.15, 2.2 - level * 0.09);
    return { ratio: ratio, ms: Math.max(1500, 4200 - level * 130),
      conflict: Math.min(0.75, 0.25 + level * 0.05) };
  }

  function scatter(n, cx, cy, w, h, r) {
    var pts = [], guard = 0;
    while (pts.length < n && guard++ < 1400) {
      var x = cx - w / 2 + Math.random() * w, y = cy - h / 2 + Math.random() * h, ok = true;
      for (var i = 0; i < pts.length; i++) {
        var dx = pts[i][0] - x, dy = pts[i][1] - y;
        if (dx * dx + dy * dy < (r * 2.1) * (r * 2.1)) { ok = false; break; }
      }
      if (ok) { pts.push([x, y]); }
    }
    return pts;
  }

  function pile(cx, n, r, fill) {
    var pts = scatter(n, cx, 210, 132, 210, r), i;
    for (i = 0; i < pts.length; i++) {
      var g = G(api.arena, pts[i][0], pts[i][1]);
      ink(S('circle', { cx: 0, cy: 0, r: r, fill: fill }, g), Math.max(2, r * .18));
      S('circle', { cx: -r * .32, cy: -r * .32, r: r * .3, fill: '#FFFFFF', opacity: '.34' }, g);
    }
    return pts.length;
  }

  function newRound() {
    if (!playing) { return; }
    answered = false;
    var p = plan();
    var lo = 4 + Math.floor(Math.random() * 6);
    var hi = Math.max(lo + 1, Math.round(lo * p.ratio));
    if (hi > 17) { hi = 17; lo = Math.max(3, Math.round(hi / p.ratio)); }

    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#4A3A66', '#2B2140') }, api.arena);
    ink(S('line', { x1: 180, y1: 84, x2: 180, y2: 336 }, api.arena), 3)
      .setAttribute('stroke', '#6E6699');

    rightSide = Math.random() < .5 ? 0 : 1;         /* 0 = left has more */
    /* conflict: give the SMALLER pile the fatter stones, so it looks bigger */
    var conflict = Math.random() < p.conflict;
    var rBig, rSmall;
    if (conflict) { rBig = 11; rSmall = 19; } else { rBig = 15; rSmall = 15; }

    var leftN = rightSide === 0 ? hi : lo;
    var rightN = rightSide === 0 ? lo : hi;
    var leftR = rightSide === 0 ? rBig : rSmall;
    var rightR = rightSide === 0 ? rSmall : rBig;
    var drewL = pile(94, leftN, leftR, '#6EC6E8');
    var drewR = pile(266, rightN, rightR, '#FFC93C');
    /* if the scatter could not fit them all, the truth is what was drawn */
    rightSide = drewL > drewR ? 0 : 1;
    if (drewL === drewR) { later(newRound, 10); return; }

    var i;
    for (i = 0; i < 2; i++) {
      (function (i) {
        var z = G(api.arena, 94 + i * 172, 210);
        S('rect', { x: -84, y: -128, width: 168, height: 256, rx: 14,
          fill: '#FFFFFF', opacity: '0', 'pointer-events': 'all' }, z);
        BS.tap(z, function () { answer(i); });
      })(i);
    }
    tMax = p.ms; tLeft = tMax;
    api.foot('');
  }

  function answer(side) {
    if (!playing || answered) { return; }
    answered = true;
    if (side === rightSide) {
      score++; level++;
      api.SFX.good();
      api.toast('More!', '#3FBF7F');
      api.score(hearts());
      later(newRound, 520);
      return;
    }
    api.SFX.bad();
    api.toast('The other one', '#F0466F');
    lives--; level = Math.max(0, level - 2);
    api.score(hearts());
    if (lives <= 0) { over(); return; }
    later(newRound, 850);
  }

  function timeUp() {
    if (!playing || answered) { return; }
    answered = true;
    api.SFX.bad();
    api.toast('Too slow!', '#F0466F');
    lives--; level = Math.max(0, level - 2);
    api.score(hearts());
    if (lives <= 0) { over(); return; }
    later(newRound, 850);
  }

  function over() {
    playing = false;
    api.SFX.over();
    if (score > best) { best = score; api.save('bs.pileBest', best); }
    later2(function () {
      api.over(
        score > 0 && score >= best ? 'New best!' : 'Out of hearts',
        score === 0
          ? 'Big stones are not the same as lots of stones. Count the stones, not the space.'
          : ('You got ' + score + ' right. Your best is ' + best + '.'),
        'Play again'
      );
    }, 700);
  }

  BS.registerMode('pile', {
    start: function (a) {
      api = a; timers = [];
      api.title('Which Pile');
      api.showBar(true);
      api.foot('');
      best = api.load('bs.pileBest', 0);
      score = 0; lives = 3; level = 0; playing = true; answered = false;
      api.score(hearts());
      newRound();
      var last = Date.now();
      A.tick(function () {
        var now = Date.now(), dt = now - last;
        last = now;
        if (!playing || answered) { return; }
        tLeft -= dt;
        api.bar(tLeft / tMax, tLeft < tMax * .3);
        if (tLeft <= 0) { timeUp(); }
      });
    },
    stop: function () { playing = false; clearTimers(); }
  });
})();
