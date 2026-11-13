/* ==========================================================
   Brain Snacks — Wake Up
   Tap the awake critters. Do NOT tap the sleeping ones.
   Go / no-go: the hard part is stopping yourself, not reacting.
   Endless, gets faster.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var COLS = ['#FF8A3D', '#6EC6E8', '#3FBF7F', '#F0466F', '#FFC93C', '#B58BF0'];
  var EARS = ['round', 'cat', 'long'];

  var api, score, best, lives, shown, live, awake, tLeft, tMax, playing, timers;

  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function hearts() {
    var s = '';
    for (var i = 0; i < 3; i++) { s += (i < lives) ? '\u2665' : '\u2661'; }
    return score + '  ' + s;
  }

  function bg() {
    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#3B2757', '#2B1B3F') }, api.arena);
    var i;
    for (i = 0; i < 7; i++) {
      A.star(api.arena, 24 + i * 52, 26 + (i % 3) * 22, 4 + (i % 2) * 2, '#FFF6E6', 0)
        .setAttribute('opacity', '.35');
    }
  }

  function spawn() {
    if (!playing) { return; }
    bg();
    shown++;
    /* about a third are sleepers, and they get commoner as you go */
    var sleepChance = Math.min(0.42, 0.24 + shown * 0.008);
    awake = Math.random() > sleepChance;

    var size = 46;
    var x = 70 + Math.random() * 220;
    var y = 110 + Math.random() * 220;
    var g = G(api.arena, x, y);
    live = { g: g, tapped: false };

    A.critter(g, {
      x: 0, y: 0, size: size,
      fill: awake ? COLS[Math.floor(Math.random() * COLS.length)] : '#8C86A8',
      ears: EARS[Math.floor(Math.random() * EARS.length)],
      mood: awake ? 'happy' : 'sleep',
      bob: awake, blink: awake, shadow: false
    });
    if (!awake) {
      var z = G(g, size * .95, -size * .75);
      txt('z', { x: 0, y: 0, 'font-size': 15, fill: '#FFF6E6' }, z);
      txt('z', { x: 12, y: -14, 'font-size': 20, fill: '#FFF6E6' }, z);
    }
    var pad = S('rect', {
      x: -size * 1.5, y: -size * 1.5, width: size * 3, height: size * 3,
      fill: '#FFFFFF', opacity: '0', 'pointer-events': 'all'
    }, api.arena);
    A.at(pad, 0, 0);
    pad.setAttribute('x', x - size * 1.5);
    pad.setAttribute('y', y - size * 1.5);
    BS.tap(pad, function () { poke(); });

    tMax = Math.max(700, 1900 - shown * 34);
    tLeft = tMax;
  }

  function poke() {
    if (!playing || !live || live.tapped) { return; }
    live.tapped = true;
    if (awake) {
      score++;
      api.SFX.good();
      api.toast('Yes!', '#3FBF7F');
      ink(S('circle', { cx: live.g.__x, cy: live.g.__y, r: 62, fill: 'none' }, api.arena), 5)
        .setAttribute('stroke', '#3FBF7F');
    } else {
      miss('Shh! Asleep!');
      return;
    }
    api.score(hearts());
    later(spawn, 340);
  }

  /* the critter's moment passed */
  function expire() {
    if (!playing || !live) { return; }
    if (live.tapped) { return; }
    live.tapped = true;
    if (awake) { miss('Too slow!'); return; }
    /* correctly left a sleeper alone */
    score++;
    api.SFX.tap();
    api.score(hearts());
    later(spawn, 260);
  }

  function miss(word) {
    api.SFX.bad();
    api.toast(word, '#F0466F');
    if (live) { BS.wobble(live.g); }
    lives--;
    api.score(hearts());
    if (lives <= 0) { over(); return; }
    later(spawn, 620);
  }

  function over() {
    playing = false;
    api.SFX.over();
    if (score > best) { best = score; api.save('bs.wakeBest', best); }
    later(function () {
      api.over(
        score >= best && score > 0 ? 'New best!' : 'Out of hearts',
        score === 0
          ? 'Look before you tap. The sleeping ones are grey and have their eyes shut.'
          : ('You got ' + score + ' right. Your best is ' + best + '.'),
        'Try again'
      );
    }, 700);
  }

  BS.registerMode('wake', {
    name: 'Wake Up', shelf: 'quick', color: '#8FA8F0', shade: '#6579BC',
    keys: ['bs.wakeBest'], best: ['bs.wakeBest', 'right', 'right'], blurb: "Don't tap sleepers",
    icon: function (a) {
      ART.critter(a, { x: 30, y: 22, size: 12, fill: '#FFC93C', ears: 'round', shadow: false, bob: false, blink: false });
      ART.critter(a, { x: 58, y: 22, size: 12, fill: '#8C86A8', ears: 'round', mood: 'sleep', shadow: false, bob: false, blink: false });
      ART.txt('z', { x: 73, y: 12, 'font-size': 11, fill: '#241534', opacity: '.6' }, a);
    },
    start: function (a) {
      api = a; timers = [];
      api.title('Wake Up');
      api.showBar(true);
      api.foot('');
      best = api.load('bs.wakeBest', 0);
      score = 0; lives = 3; shown = 0; playing = true;
      api.score(hearts());
      api.toast('Tap the awake ones', '#FFC93C');
      later(spawn, 800);
      var last = Date.now();
      A.tick(function () {
        var now = Date.now(), dt = now - last;
        last = now;
        if (!playing || !live || live.tapped) { api.bar(0); return; }
        tLeft -= dt;
        api.bar(tLeft / tMax, tLeft < tMax * 0.35);
        if (tLeft <= 0) { expire(); }
      });
    },
    stop: function () { playing = false; live = null; clearTimers(); }
  });
})();
