/* ==========================================================
   Brain Snacks — Opposite Day
   A rabbit pops out of one burrow. Tap the OTHER one.
   Looking at the thing that moved is a reflex, and tapping what
   you are looking at is the next reflex. Both have to be stopped.
   That is a different job from Which Way, where nothing has to be
   reversed, and from Wake Up, where the answer is sometimes to do
   nothing at all.
   Difficulty adapts: the rabbit gets quicker, and now and then it
   pops out of BOTH, which means sit still.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var api, score, best, lives, level, playing, timers, answered;
  var side, bothTrap, tLeft, tMax;

  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { var t = setTimeout(function () { if (playing) { fn(); } }, ms); timers.push(t); return t; }
  function later2(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function hearts() {
    var s = '';
    for (var i = 0; i < 3; i++) { s += (i < lives) ? '♥' : '♡'; }
    return score + '  ' + s;
  }

  function burrow(cx) {
    var g = G(api.arena, cx, 300);
    ink(S('ellipse', { cx: 0, cy: 0, rx: 62, ry: 22, fill: '#5E4830' }, g), 4);
    ink(S('ellipse', { cx: 0, cy: -3, rx: 50, ry: 16, fill: '#2A1D12' }, g), 3);
    return g;
  }

  function newRound() {
    if (!playing) { return; }
    answered = false;
    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#8FD3F0', '#DFF4FC') }, api.arena);
    S('rect', { x: 0, y: 268, width: 360, height: 152, fill: '#7FCB86' }, api.arena);
    ink(S('line', { x1: 0, y1: 268, x2: 360, y2: 268 }, api.arena), 4);
    burrow(96); burrow(264);

    /* now and then nobody is out, or both are, and the answer is to wait */
    bothTrap = level >= 5 && Math.random() < 0.16;
    side = Math.random() < .5 ? 0 : 1;
    var xs = [96, 264], i;
    if (bothTrap) {
      for (i = 0; i < 2; i++) {
        A.animal(api.arena, { kind: 'bunny', x: xs[i], y: 244, size: 17, fill: '#F3E4C6', bob: false, shadow: false });
      }
      txt('both out — do not tap!', { x: 180, y: 368, 'font-size': 15, fill: '#241534', opacity: '.7' }, api.arena);
    } else {
      A.animal(api.arena, { kind: 'bunny', x: xs[side], y: 244, size: 17, fill: '#F3E4C6', bob: false, shadow: false });
      txt('tap the OTHER burrow', { x: 180, y: 368, 'font-size': 15, fill: '#241534', opacity: '.7' }, api.arena);
    }
    /* hit layers last */
    for (i = 0; i < 2; i++) {
      (function (i) {
        var z = G(api.arena, xs[i], 296);
        S('rect', { x: -78, y: -96, width: 156, height: 156, rx: 16,
          fill: '#FFFFFF', opacity: '0', 'pointer-events': 'all' }, z);
        BS.tap(z, function () { answer(i); });
      })(i);
    }
    tMax = bothTrap ? 1600 : Math.max(1100, 3400 - level * 120);
    tLeft = tMax;
  }

  function good(msg) {
    score++; level++;
    api.SFX.good();
    api.toast(msg, '#3FBF7F');
    api.score(hearts());
    later(newRound, 420);
  }
  function bad(msg) {
    api.SFX.bad();
    api.toast(msg, '#F0466F');
    lives--; level = Math.max(0, level - 2);
    api.score(hearts());
    if (lives <= 0) { over(); return; }
    later(newRound, 760);
  }

  function answer(i) {
    if (!playing || answered) { return; }
    answered = true;
    if (bothTrap) { bad('Sit still!'); return; }
    if (i !== side) { good('Yes!'); } else { bad('The other one!'); }
  }

  function timeUp() {
    if (!playing || answered) { return; }
    answered = true;
    /* waiting out a both-out round is the right answer, not a miss */
    if (bothTrap) { good('Well waited!'); return; }
    bad('Too slow!');
  }

  function over() {
    playing = false;
    api.SFX.over();
    if (score > best) { best = score; api.save('bs.oppBest', best); }
    later2(function () {
      api.over(
        score > 0 && score >= best ? 'New best!' : 'Out of hearts',
        score === 0
          ? 'Look at the rabbit, then move your finger the other way. Say "other" in your head first.'
          : ('You got ' + score + ' right. Your best is ' + best + '.'),
        'Play again'
      );
    }, 700);
  }

  BS.registerMode('opp', {
    start: function (a) {
      api = a; timers = [];
      api.title('Opposite Day');
      api.showBar(true);
      api.foot('');
      best = api.load('bs.oppBest', 0);
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
