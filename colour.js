/* ==========================================================
   Brain Snacks — Say the Colour
   The word says one thing and the ink says another. Tap the ink.
   Reading is automatic once you can do it at all, which is exactly
   why this is hard: she has to stop herself doing something she is
   not choosing to do. That is different from Which Way, where the
   distraction is beside the target rather than inside it.
   Difficulty adapts: more conflicting words, less time.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var NAMES = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
  var HEX = ['#F0466F', '#6EC6E8', '#3FBF7F', '#FFC93C'];

  var api, score, best, lives, level, playing, timers, answered, inkIdx;
  var tLeft, tMax;

  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { var t = setTimeout(function () { if (playing) { fn(); } }, ms); timers.push(t); return t; }
  function later2(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function hearts() {
    var s = '';
    for (var i = 0; i < 3; i++) { s += (i < lives) ? '♥' : '♡'; }
    return score + '  ' + s;
  }

  function newRound() {
    if (!playing) { return; }
    answered = false;
    /* early rounds mostly agree, so she learns the job before it fights back */
    var conflictChance = Math.min(0.8, 0.2 + level * 0.06);
    var wordIdx = Math.floor(Math.random() * 4);
    inkIdx = wordIdx;
    if (Math.random() < conflictChance) {
      do { inkIdx = Math.floor(Math.random() * 4); } while (inkIdx === wordIdx);
    }
    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#2B2140', '#191129') }, api.arena);
    ink(S('rect', { x: 26, y: 130, width: 308, height: 132, rx: 20, fill: '#FFF6E6' }, api.arena), 4);
    txt(NAMES[wordIdx], { x: 180, y: 214, 'font-size': 52, fill: HEX[inkIdx] }, api.arena);
    txt('tap the colour it is written in', { x: 180, y: 302, 'font-size': 14,
      fill: '#EADFF6', opacity: '.75' }, api.arena);
    tMax = Math.max(1200, 3800 - level * 130);
    tLeft = tMax;
  }

  function answer(i) {
    if (!playing || answered) { return; }
    answered = true;
    if (i === inkIdx) {
      score++; level++;
      api.SFX.good();
      api.toast('Yes!', '#3FBF7F');
      api.score(hearts());
      later(newRound, 380);
      return;
    }
    api.SFX.bad();
    api.toast('Read the ink!', '#F0466F');
    lives--; level = Math.max(0, level - 2);
    api.score(hearts());
    if (lives <= 0) { over(); return; }
    later(newRound, 700);
  }

  function timeUp() {
    if (!playing || answered) { return; }
    answered = true;
    api.SFX.bad();
    api.toast('Too slow!', '#F0466F');
    lives--; level = Math.max(0, level - 2);
    api.score(hearts());
    if (lives <= 0) { over(); return; }
    later(newRound, 700);
  }

  function over() {
    playing = false;
    api.SFX.over();
    if (score > best) { best = score; api.save('bs.colourBest', best); }
    later2(function () {
      api.over(
        score > 0 && score >= best ? 'New best!' : 'Out of hearts',
        score === 0
          ? 'Try squinting so the word goes blurry. The colour is still there when the letters are not.'
          : ('You got ' + score + ' right. Your best is ' + best + '.'),
        'Play again'
      );
    }, 700);
  }

  BS.registerMode('colour', {
    start: function (a) {
      api = a; timers = [];
      api.title('Say the Colour');
      api.showBar(true);
      /* swatches, not words -- the footer must never become a second Stroop */
      var html = '<div class="picker" style="grid-template-columns:1fr 1fr 1fr 1fr">';
      for (var i = 0; i < 4; i++) {
        html += '<button data-i="' + i + '" style="background:' + HEX[i] +
          ';box-shadow:0 4px 0 rgba(36,21,52,.45)">&nbsp;</button>';
      }
      var foot = api.foot(html + '</div>');
      var btns = foot.querySelectorAll('button');
      for (i = 0; i < btns.length; i++) {
        (function (b) {
          b.addEventListener('click', function () { answer(+b.getAttribute('data-i')); }, false);
        })(btns[i]);
      }
      best = api.load('bs.colourBest', 0);
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
