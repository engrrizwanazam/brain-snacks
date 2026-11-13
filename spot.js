/* ==========================================================
   Brain Snacks — Spot the Difference
   Two panels built from the same random cast, then a few
   things quietly changed in the lower one. Endless.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var COLS = ['#FF8A3D', '#6EC6E8', '#3FBF7F', '#F0466F', '#FFD84A', '#B07A4C', '#A9E05F', '#B58BF0'];
  var EARS = ['round', 'cat', 'long'];
  var MOODS = ['happy', 'wow', 'flat'];
  /* how many critters, and how many differences, per round */
  var PLAN = [
    [4, 2], [4, 2], [6, 2], [6, 3], [6, 3], [8, 3], [8, 3], [8, 4], [10, 4], [10, 4]
  ];

  var api, round, streak, best, found, need, tLeft, tMax, playing, warned, marks;

  var timers = [];
  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function rnd(n) { return Math.floor(Math.random() * n); }

  function build() {
    var plan = PLAN[Math.min(round, PLAN.length - 1)];
    var n = plan[0]; need = plan[1]; found = 0;
    var cols = n <= 4 ? 2 : (n <= 6 ? 3 : (n <= 8 ? 4 : 5));
    var rows = Math.ceil(n / cols);

    /* the cast */
    var top = [], i;
    for (i = 0; i < n; i++) {
      top.push({ fill: pick(COLS), ears: pick(EARS), mood: 'happy', ears2: true, gone: false, size: 1 });
    }
    var bot = [];
    for (i = 0; i < n; i++) { bot.push({ fill: top[i].fill, ears: top[i].ears, mood: top[i].mood, ears2: true, gone: false, size: 1 }); }

    /* choose which ones differ */
    var idx = [], diffs = [];
    for (i = 0; i < n; i++) { idx.push(i); }
    for (i = idx.length - 1; i > 0; i--) { var j = rnd(i + 1), t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    var kinds = ['colour', 'ear', 'mood'];
    if (round >= 3) { kinds.push('shade'); }
    if (round >= 5) { kinds.push('size'); }
    for (i = 0; i < need; i++) {
      var k = idx[i], kind = pick(kinds), b = bot[k];
      if (kind === 'colour') { do { b.fill = pick(COLS); } while (b.fill === top[k].fill); }
      else if (kind === 'shade') { b.fill = A.tint(top[k].fill, round >= 8 ? -22 : -34); }
      else if (kind === 'ear') { b.ears2 = false; }
      else if (kind === 'mood') { do { b.mood = pick(MOODS); } while (b.mood === top[k].mood); }
      else { b.size = 0.76; }
      diffs.push(k);
    }

    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#3B2757', '#2B1B3F') }, api.arena);
    marks = [];

    function panel(y0, h, spec, tag) {
      ink(S('rect', { x: 8, y: y0, width: 344, height: h, rx: 16, fill: '#FFF6E6' }, api.arena), 4);
      var cw = 344 / cols, ch = h / rows, size = Math.min(cw, ch) * 0.29;
      for (var i2 = 0; i2 < n; i2++) {
        (function (i2) {
          var cx = 8 + cw * (i2 % cols) + cw / 2;
          var cy = y0 + ch * Math.floor(i2 / cols) + ch / 2;
          var sp = spec[i2];
          A.critter(api.arena, {
            x: cx, y: cy, size: size * sp.size, fill: sp.fill, ears: sp.ears,
            ears2: sp.ears2, mood: sp.mood, bob: false, shadow: false
          });
          var padR = Math.min(cw, ch) * 0.45;
          var hitEl = S('rect', {
            x: cx - padR, y: cy - padR, width: padR * 2, height: padR * 2,
            fill: '#FFFFFF', opacity: '0', 'pointer-events': 'all'
          }, api.arena);
          BS.tap(hitEl, function () { poke(i2, cx, cy, padR); });
        })(i2);
      }
    }
    panel(10, 196, top, 'a');
    panel(214, 196, bot, 'b');

    function poke(i2, cx, cy, r) {
      if (!playing) { return; }
      if (diffs.indexOf(i2) === -1) {
        api.SFX.bad(); tLeft -= 1500; api.toast('Nope!', '#F0466F'); return;
      }
      if (marks.indexOf(i2) >= 0) { return; }
      marks.push(i2);
      api.SFX.good();
      /* ring both panels, so she sees the pair */
      var ys = [10 + (196 / rows) * Math.floor(i2 / cols) + (196 / rows) / 2,
                214 + (196 / rows) * Math.floor(i2 / cols) + (196 / rows) / 2];
      var cwl = 344 / cols, cxl = 8 + cwl * (i2 % cols) + cwl / 2;
      for (var q = 0; q < 2; q++) {
        ink(S('circle', { cx: cxl, cy: ys[q], r: r * 0.86, fill: 'none' }, api.arena), 5)
          .setAttribute('stroke', '#3FBF7F');
      }
      found++;
      api.score(found + ' / ' + need);
      if (found >= need) { clearRound(); }
    }
  }

  function clearRound() {
    playing = false;
    streak++; round++;
    api.toast('All found!', '#3FBF7F');
    api.SFX.win();
    if (streak > best) { best = streak; api.save('bs.spotBest', best); }
    later(next, 900);
  }

  function next() {
    tMax = Math.max(9000, 20000 - round * 900);
    tLeft = tMax; warned = false;
    build();
    api.score('0 / ' + need);
    playing = true;
  }

  function gameOver() {
    playing = false;
    api.SFX.over();
    later(function () {
      api.over(
        streak >= best && streak > 0 ? 'New best!' : "Time's up",
        streak === 0
          ? 'Compare one pair at a time — top-left against bottom-left — instead of scanning the whole picture.'
          : ('You cleared ' + streak + (streak === 1 ? ' picture' : ' pictures') + '. Your best is ' + best + '.'),
        'Try again'
      );
    }, 600);
  }

  BS.registerMode('spot', {
    name: 'Spot It', shelf: 'quick', color: '#FF6F92', shade: '#C74C6B',
    keys: ['bs.spotBest'], best: ['bs.spotBest', 'picture', 'pictures'], blurb: 'Find the changes',
    icon: function (a) {
      ART.ink(ART.S('rect', { x: 8, y: 4, width: 30, height: 38, rx: 6, fill: '#FFF6E6' }, a), 3);
      ART.ink(ART.S('rect', { x: 46, y: 4, width: 30, height: 38, rx: 6, fill: '#FFF6E6' }, a), 3);
      ART.critter(a, { x: 23, y: 21, size: 10, fill: '#6EC6E8', ears: 'cat', shadow: false, bob: false, blink: false });
      ART.critter(a, { x: 61, y: 21, size: 10, fill: '#FFC93C', ears: 'cat', shadow: false, bob: false, blink: false });
    },
    start: function (a) {
      api = a;
      clearTimers();
      api.title('Spot It');
      api.showBar(true);
      api.foot('');
      best = api.load('bs.spotBest', 0);
      round = 0; streak = 0;
      next();
      var last = Date.now();
      A.tick(function () {
        var now = Date.now(), dt = now - last;
        last = now;
        if (!playing) { return; }
        tLeft -= dt;
        api.bar(tLeft / tMax, tLeft < tMax * 0.28);
        if (tLeft < tMax * 0.28 && !warned) { warned = true; api.SFX.tickTock(); }
        if (tLeft <= 0) { gameOver(); }
      });
    },
    stop: function () { playing = false; clearTimers(); }
  });
})();
