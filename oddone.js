/* ==========================================================
   Brain Snacks — Odd One (speed spotting)
   Endless. The grid grows and the difference gets subtler.
   ========================================================== */

(function () {
  'use strict';

  var A = ART;
  var S = A.S, G = A.G, ink = A.ink, critter = A.critter;

  var COLS = ['#FF8A3D', '#6EC6E8', '#3FBF7F', '#F0466F', '#FFD84A', '#B07A4C', '#A9E05F', '#FF6F92'];
  var EARS = ['round', 'cat', 'long'];
  var GRID = [
    [2, 2], [2, 2], [3, 2], [3, 2], [3, 3], [3, 3],
    [3, 4], [3, 4], [4, 4], [4, 4], [4, 5]
  ];

  var api, round, streak, best, tLeft, tMax, playing, warned;

  var timers = [];
  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  /* nudge a hex colour toward or away from white */
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r + amt)));
    g = Math.max(0, Math.min(255, Math.round(g + amt)));
    b = Math.max(0, Math.min(255, Math.round(b + amt)));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function build() {
    var g = GRID[Math.min(round, GRID.length - 1)];
    var cols = g[0], rows = g[1], n = cols * rows;

    /* what makes the odd one odd — gets harder as the streak grows */
    var kinds = ['colour'];
    if (round >= 2) { kinds.push('ear'); }
    if (round >= 4) { kinds.push('mouth'); }
    if (round >= 6) { kinds.push('shade'); }
    if (round >= 8) { kinds.push('look'); }
    var kind = pick(kinds);

    var baseCol = pick(COLS), baseEar = pick(EARS);
    var oddIndex = Math.floor(Math.random() * n);
    var oddCol = baseCol, oddEar = baseEar, oddMood = 'happy', oddLook = 0, ears2 = true;

    if (kind === 'colour') {
      do { oddCol = pick(COLS); } while (oddCol === baseCol);
    } else if (kind === 'shade') {
      oddCol = shade(baseCol, round >= 12 ? -16 : -26);
    } else if (kind === 'ear') {
      ears2 = false;
    } else if (kind === 'mouth') {
      oddMood = 'flat';
    } else {
      oddLook = 1;
    }

    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#3B2757', '#2B1B3F') }, api.arena);

    var cw = 360 / cols, ch = 420 / rows;
    var size = Math.min(cw, ch) * 0.31;

    for (var i = 0; i < n; i++) {
      (function (i) {
        var isOdd = (i === oddIndex);
        var cx = cw * (i % cols) + cw / 2;
        var cy = ch * Math.floor(i / cols) + ch / 2;
        var c = critter(api.arena, {
          x: cx, y: cy, size: size,
          fill: isOdd ? oddCol : baseCol,
          ears: isOdd ? oddEar : baseEar,
          ears2: isOdd ? ears2 : true,
          mood: isOdd ? oddMood : 'happy',
          look: isOdd ? oddLook : 0,
          bob: false, shadow: false
        });
        /* a generous invisible pad, so small fingers still land it */
        var padSize = Math.min(cw, ch) * 0.46;
        var padEl = S('rect', {
          x: cx - padSize, y: cy - padSize, width: padSize * 2, height: padSize * 2,
          fill: '#FFFFFF', opacity: '0', 'pointer-events': 'all'
        }, api.arena);
        BS.tap(padEl, function () {
          if (!playing) { return; }
          if (isOdd) { right(c); } else { wrong(c); }
        });
      })(i);
    }
  }

  function right(c) {
    playing = false;
    api.SFX.good();
    ink(S('circle', { cx: c.__home.x, cy: c.__home.y, r: c.__size * 1.35, fill: 'none' }, api.arena), 5)
      .setAttribute('stroke', '#3FBF7F');
    streak++; round++;
    api.score(streak + ' in a row');
    api.toast('Yes!', '#3FBF7F');
    later(next, 480);
  }

  function wrong(c) {
    if (!playing) { return; }
    api.SFX.bad();
    BS.wobble(c);
    tLeft -= 1200;
    api.toast('Nope!', '#F0466F');
  }

  function next() {
    tMax = Math.max(3400, 8000 - round * 260);
    tLeft = tMax;
    warned = false;
    build();
    playing = true;
  }

  function gameOver() {
    playing = false;
    api.SFX.over();
    if (streak > best) { best = streak; api.save('bs.oddBest', best); }
    api.bar(0, true);
    later(function () {
      api.over(
        streak >= best && streak > 0 ? 'New best!' : "Time's up",
        streak === 0
          ? 'No matches that time. The odd one is always there — take one extra second to scan.'
          : ('You spotted ' + streak + (streak === 1 ? ' odd one' : ' odd ones') + ' in a row. Your best is ' + best + '.'),
        'Try again'
      );
    }, 600);
  }

  BS.registerMode('odd', {
    start: function (a) {
      api = a;
      clearTimers();
      api.title('Odd One');
      api.showBar(true);
      api.foot('');
      best = api.load('bs.oddBest', 0);
      round = 0; streak = 0;
      api.score('0 in a row');
      next();
      var last = Date.now();
      A.tick(function () {
        var now = Date.now(), dt = now - last;
        last = now;
        if (!playing) { return; }
        tLeft -= dt;
        api.bar(tLeft / tMax, tLeft < tMax * 0.3);
        if (tLeft < tMax * 0.3 && !warned) { warned = true; api.SFX.tickTock(); }
        if (tLeft <= 0) { gameOver(); }
      });
    },
    stop: function () { playing = false; clearTimers(); }
  });
})();
