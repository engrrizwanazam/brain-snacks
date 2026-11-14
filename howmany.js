/* ==========================================================
   Brain Snacks — How Many
   A handful of berries appears and is gone again before there is
   time to count them one by one. Up to about four she will just
   see the number; past that she has to group them, and grouping
   is the thing this is quietly teaching.
   Difficulty adapts: more berries, less time to look.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var api, score, best, lives, level, playing, timers, answered, count;

  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { var t = setTimeout(function () { if (playing) { fn(); } }, ms); timers.push(t); return t; }
  function later2(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function hearts() {
    var s = '';
    for (var i = 0; i < 3; i++) { s += (i < lives) ? '♥' : '♡'; }
    return score + '  ' + s;
  }

  function plan() {
    var lo = 2 + Math.floor(level / 3);
    var hi = Math.min(12, 4 + Math.floor(level * 0.9));
    if (hi < lo + 1) { hi = lo + 1; }
    return { lo: lo, hi: hi, flash: Math.max(320, 1300 - level * 70) };
  }

  /* scatter without overlapping, so counting is possible in principle */
  function scatter(n) {
    var pts = [], guard = 0;
    while (pts.length < n && guard++ < 900) {
      var x = 60 + Math.random() * 240, y = 96 + Math.random() * 200, ok = true;
      for (var i = 0; i < pts.length; i++) {
        var dx = pts[i][0] - x, dy = pts[i][1] - y;
        if (dx * dx + dy * dy < 46 * 46) { ok = false; break; }
      }
      if (ok) { pts.push([x, y]); }
    }
    return pts;
  }

  function newRound() {
    if (!playing) { return; }
    answered = false;
    var p = plan();
    count = p.lo + Math.floor(Math.random() * (p.hi - p.lo + 1));
    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#3E5B3A', '#26381F') }, api.arena);
    var pts = scatter(count), i;
    var berries = G(api.arena, 0, 0);
    for (i = 0; i < pts.length; i++) {
      var b = G(berries, pts[i][0], pts[i][1]);
      ink(S('circle', { cx: 0, cy: 0, r: 17, fill: '#F0466F' }, b), 3);
      S('circle', { cx: -6, cy: -6, r: 5, fill: '#FFFFFF', opacity: '.45' }, b);
      ink(S('line', { x1: 0, y1: -16, x2: 4, y2: -26 }, b), 2.4).setAttribute('stroke', '#4FAF6D');
    }
    api.foot('');
    api.bar(1, false);
    api.toast('Look!', '#FFC93C');
    api.SFX.flip();
    later(function () {
      berries.setAttribute('opacity', '0');
      /* a leaf pile covers where they were, so she cannot re-count from an afterimage */
      ink(S('ellipse', { cx: 180, cy: 200, rx: 130, ry: 84, fill: '#3E7A3A' }, api.arena), 4);
      txt('how many berries?', { x: 180, y: 206, 'font-size': 17, fill: '#EAF6E2' }, api.arena);
      api.bar(0, false);
      askChips();
    }, p.flash);
  }

  function askChips() {
    /* four options: the truth, and near misses children actually give */
    var opts = [count], off = [1, -1, 2, -2, 3];
    for (var i = 0; i < off.length && opts.length < 4; i++) {
      var v = count + off[i];
      if (v >= 1 && opts.indexOf(v) < 0) { opts.push(v); }
    }
    for (i = opts.length - 1; i > 0; i--) {
      var k = Math.floor(Math.random() * (i + 1));
      var t = opts[i]; opts[i] = opts[k]; opts[k] = t;
    }
    var html = '<div class="picker" style="grid-template-columns:1fr 1fr 1fr 1fr">';
    for (i = 0; i < opts.length; i++) { html += '<button data-v="' + opts[i] + '">' + opts[i] + '</button>'; }
    var foot = api.foot(html + '</div>');
    var btns = foot.querySelectorAll('button');
    for (i = 0; i < btns.length; i++) {
      (function (b) {
        b.addEventListener('click', function () { answer(+b.getAttribute('data-v')); }, false);
      })(btns[i]);
    }
  }

  function answer(v) {
    if (!playing || answered) { return; }
    answered = true;
    if (v === count) {
      score++; level++;
      api.SFX.good();
      api.toast('Yes, ' + count + '!', '#3FBF7F');
      api.score(hearts());
      later(newRound, 800);
      return;
    }
    api.SFX.bad();
    api.toast('There were ' + count, '#F0466F');
    lives--; level = Math.max(0, level - 2);
    api.score(hearts());
    if (lives <= 0) { over(); return; }
    later(newRound, 1100);
  }

  function over() {
    playing = false;
    api.SFX.over();
    if (score > best) { best = score; api.save('bs.howmanyBest', best); }
    later2(function () {
      api.over(
        score > 0 && score >= best ? 'New best!' : 'Out of hearts',
        score === 0
          ? 'Do not count them one at a time. Try seeing them in little groups of two and three.'
          : ('You got ' + score + ' right. Your best is ' + best + '.'),
        'Play again'
      );
    }, 700);
  }

  BS.registerMode('howmany', {
    name: 'How Many', shelf: 'quick', color: '#8FD98F', shade: '#61A661',
    keys: ['bs.howmanyBest'], best: ['bs.howmanyBest', 'right', 'right'], blurb: 'A quick look',
    icon: function (a) {
      var i;
    var hm = [[16, 12], [32, 9], [48, 14], [24, 28], [42, 30], [60, 24]];
    for (i = 0; i < hm.length; i++) {
      ART.ink(ART.S('circle', { cx: hm[i][0], cy: hm[i][1], r: 6, fill: '#F0466F' }, a), 2.2);
    }
    ART.txt('?', { x: 72, y: 30, 'font-size': 22, fill: '#241534', opacity: '.5' }, a);
    },
    start: function (a) {
      api = a; timers = [];
      api.title('How Many');
      api.showBar(true);
      best = api.load('bs.howmanyBest', 0);
      score = 0; lives = 3; level = 0; playing = true;
      api.score(hearts());
      newRound();
    },
    stop: function () { playing = false; clearTimers(); }
  });
})();
