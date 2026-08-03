/* ==========================================================
   Brain Snacks — Which Way
   Tap the way the MIDDLE arrow points. The ones beside it often
   point the other way, and that is the whole difficulty.
   A flanker task: focusing on one thing while ignoring noise.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var api, score, best, lives, shown, target, answered, tLeft, tMax, playing, timers;

  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function hearts() {
    var s = '';
    for (var i = 0; i < 3; i++) { s += (i < lives) ? '\u2665' : '\u2661'; }
    return score + '  ' + s;
  }

  function arrow(parent, x, y, size, dir, col) {
    var g = G(parent, x, y);
    var f = dir > 0 ? 1 : -1;
    ink(S('path', {
      d: 'M' + (-size) + ',' + (-size * .28) + ' L' + (size * .18) + ',' + (-size * .28) +
         ' L' + (size * .18) + ',' + (-size * .62) + ' L' + size + ',0' +
         ' L' + (size * .18) + ',' + (size * .62) + ' L' + (size * .18) + ',' + (size * .28) +
         ' L' + (-size) + ',' + (size * .28) + ' Z',
      fill: col, transform: 'scale(' + f + ',1)'
    }, g), 4);
    return g;
  }

  function round() {
    if (!playing) { return; }
    shown++;
    answered = false;
    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#3B2757', '#2B1B3F') }, api.arena);

    target = Math.random() < .5 ? -1 : 1;
    /* start easy (all pointing the same way), then mostly conflicting */
    var conflictChance = Math.min(.72, .25 + shown * .04);
    var flank = Math.random() < conflictChance ? -target : target;

    var n = 5, size = 26, gap = 62;
    for (var i = 0; i < n; i++) {
      var isMid = (i === 2);
      arrow(api.arena, 180 + (i - 2) * gap, 190, size,
        isMid ? target : flank,
        isMid ? '#FFC93C' : '#8A7BA8');
    }
    ink(S('circle', { cx: 180, cy: 190, r: 46, fill: 'none' }, api.arena), 3)
      .setAttribute('stroke', '#FFC93C');
    txt('this one', { x: 180, y: 258, 'font-size': 13, fill: '#FFC93C', opacity: '.8' }, api.arena);

    tMax = Math.max(900, 2600 - shown * 60);
    tLeft = tMax;
  }

  function answer(dir) {
    if (!playing || answered) { return; }
    answered = true;
    if (dir === target) {
      score++;
      api.SFX.good();
      api.toast('Yes!', '#3FBF7F');
      api.score(hearts());
      later(round, 320);
      return;
    }
    api.SFX.bad();
    api.toast('Other way!', '#F0466F');
    lives--;
    api.score(hearts());
    if (lives <= 0) { over(); return; }
    later(round, 620);
  }

  function timeUp() {
    if (!playing || answered) { return; }
    answered = true;
    api.SFX.bad();
    api.toast('Too slow!', '#F0466F');
    lives--;
    api.score(hearts());
    if (lives <= 0) { over(); return; }
    later(round, 620);
  }

  function over() {
    playing = false;
    api.SFX.over();
    if (score > best) { best = score; api.save('bs.whichBest', best); }
    later(function () {
      api.over(
        score >= best && score > 0 ? 'New best!' : 'Out of hearts',
        score === 0
          ? 'Only the middle arrow counts. Try looking straight at the yellow circle and nothing else.'
          : ('You got ' + score + ' right. Your best is ' + best + '.'),
        'Try again'
      );
    }, 700);
  }

  BS.registerMode('which', {
    start: function (a) {
      api = a; timers = [];
      api.title('Which Way');
      api.showBar(true);
      var foot = api.foot('<div class="picker" style="grid-template-columns:1fr 1fr">' +
        '<button id="wl">\u2190 Left</button><button id="wr">Right \u2192</button></div>');
      foot.querySelector('#wl').addEventListener('click', function () { answer(-1); }, false);
      foot.querySelector('#wr').addEventListener('click', function () { answer(1); }, false);
      best = api.load('bs.whichBest', 0);
      score = 0; lives = 3; shown = 0; playing = true;
      api.score(hearts());
      round();
      var last = Date.now();
      A.tick(function () {
        var now = Date.now(), dt = now - last;
        last = now;
        if (!playing || answered) { return; }
        tLeft -= dt;
        api.bar(tLeft / tMax, tLeft < tMax * .35);
        if (tLeft <= 0) { timeUp(); }
      });
    },
    stop: function () { playing = false; clearTimers(); }
  });
})();
