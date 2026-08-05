/* ==========================================================
   Brain Snacks — Follow
   A few critters wave, then everybody looks identical and wanders
   about. She has to hold several moving things in mind at once,
   which is a different job from Cups: there the target hides, here
   it is in plain sight and there are simply too many of them.
   Multiple object tracking. Difficulty adapts on how many to hold.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var api, score, best, lives, level, playing, timers, phase;
  var dots, targets, picked, moveUntil;

  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { var t = setTimeout(function () { if (playing) { fn(); } }, ms); timers.push(t); return t; }
  function later2(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function hearts() {
    var s = '';
    for (var i = 0; i < 3; i++) { s += (i < lives) ? '♥' : '♡'; }
    return score + '  ' + s;
  }

  function plan() {
    return {
      total: Math.min(9, 5 + Math.floor(level / 3)),
      keep: Math.min(4, 2 + Math.floor(level / 4)),
      speed: Math.min(52, 22 + level * 3),
      ms: Math.min(5200, 2600 + level * 180)
    };
  }

  function newRound() {
    if (!playing) { return; }
    var p = plan();
    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#2E4A63', '#1E3044') }, api.arena);
    dots = []; picked = []; targets = [];
    var i, k;
    for (i = 0; i < p.total; i++) {
      var g = G(api.arena, 0, 0);
      var d = {
        g: g,
        x: 48 + Math.random() * 264,
        y: 60 + Math.random() * 300,
        vx: (Math.random() * 2 - 1) * p.speed,
        vy: (Math.random() * 2 - 1) * p.speed,
        on: false, done: false
      };
      A.critter(g, { x: 0, y: 0, size: 19, fill: '#8FA8C4', ears: 'round', bob: false, shadow: false });
      A.at(g, d.x, d.y);
      dots.push(d);
    }
    /* choose the ones she must keep hold of */
    var idx = [];
    for (i = 0; i < p.total; i++) { idx.push(i); }
    for (i = idx.length - 1; i > 0; i--) {
      k = Math.floor(Math.random() * (i + 1));
      var t = idx[i]; idx[i] = idx[k]; idx[k] = t;
    }
    for (i = 0; i < p.keep; i++) { targets.push(idx[i]); dots[idx[i]].on = true; }

    /* show them */
    phase = 'show';
    for (i = 0; i < dots.length; i++) { paint(dots[i], dots[i].on ? '#FFC93C' : '#8FA8C4'); }
    api.toast('Remember these ' + p.keep, '#FFC93C');
    api.bar(1, false);
    later(function () {
      for (var j = 0; j < dots.length; j++) { paint(dots[j], '#8FA8C4'); }
      phase = 'move';
      moveUntil = Date.now() + p.ms;
      api.SFX.flip();
    }, 1500);
  }

  function paint(d, fill) {
    A.clear(d.g);
    A.critter(d.g, { x: 0, y: 0, size: 19, fill: fill, ears: 'round', bob: false, shadow: false });
    A.at(d.g, d.x, d.y);
  }

  function armTaps() {
    phase = 'pick';
    api.toast('Tap the ' + plan().keep + '!', '#6EC6E8');
    api.bar(0, false);
    for (var i = 0; i < dots.length; i++) {
      (function (i) {
        var z = G(api.arena, dots[i].x, dots[i].y);
        S('circle', { cx: 0, cy: 8, r: 30, fill: '#FFFFFF', opacity: '0', 'pointer-events': 'all' }, z);
        BS.tap(z, function () { choose(i); });
      })(i);
    }
  }

  function choose(i) {
    if (!playing || phase !== 'pick' || dots[i].done) { return; }
    dots[i].done = true;
    var right = targets.indexOf(i) >= 0;
    paint(dots[i], right ? '#3FBF7F' : '#F0466F');
    if (!right) {
      api.SFX.bad();
      api.toast('Not that one', '#F0466F');
      lives--; level = Math.max(0, level - 2);
      api.score(hearts());
      phase = 'done';
      /* show what she should have kept */
      for (var k = 0; k < targets.length; k++) {
        if (!dots[targets[k]].done) { paint(dots[targets[k]], '#FFC93C'); }
      }
      if (lives <= 0) { over(); return; }
      later(newRound, 1400);
      return;
    }
    api.SFX.good();
    picked.push(i);
    if (picked.length === targets.length) {
      score++; level++;
      api.toast('All of them!', '#3FBF7F');
      api.score(hearts());
      phase = 'done';
      later(newRound, 900);
    }
  }

  function over() {
    playing = false;
    api.SFX.over();
    if (score > best) { best = score; api.save('bs.followBest', best); }
    later2(function () {
      api.over(
        score > 0 && score >= best ? 'New best!' : 'Out of hearts',
        score === 0
          ? 'Do not try to watch all of them. Watch only the ones that waved.'
          : ('You kept track ' + score + ' times. Your best is ' + best + '.'),
        'Play again'
      );
    }, 700);
  }

  BS.registerMode('follow', {
    start: function (a) {
      api = a; timers = [];
      api.title('Follow');
      api.showBar(true);
      api.foot('');
      best = api.load('bs.followBest', 0);
      score = 0; lives = 3; level = 0; playing = true; phase = 'show';
      api.score(hearts());
      newRound();
      var last = Date.now();
      A.tick(function () {
        var now = Date.now(), dt = Math.min(60, now - last) / 1000;
        last = now;
        if (!playing || phase !== 'move' || !dots) { return; }
        for (var i = 0; i < dots.length; i++) {
          var d = dots[i];
          d.x += d.vx * dt; d.y += d.vy * dt;
          if (d.x < 34) { d.x = 34; d.vx = -d.vx; }
          if (d.x > 326) { d.x = 326; d.vx = -d.vx; }
          if (d.y < 46) { d.y = 46; d.vy = -d.vy; }
          if (d.y > 372) { d.y = 372; d.vy = -d.vy; }
          A.at(d.g, d.x, d.y);
        }
        var leftMs = moveUntil - now;
        api.bar(Math.max(0, leftMs / plan().ms), false);
        if (leftMs <= 0) { armTaps(); }
      });
    },
    stop: function () { playing = false; phase = 'done'; clearTimers(); }
  });
})();
