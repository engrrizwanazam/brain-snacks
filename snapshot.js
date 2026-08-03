/* ==========================================================
   Brain Snacks — Snapshot
   Critters appear for a moment, then hide. Tap where they were.
   Visuospatial working memory. Endless; the count grows.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var COLS = ['#FF8A3D', '#6EC6E8', '#3FBF7F', '#F0466F', '#FFC93C', '#B58BF0'];

  var api, round, best, lives, cells, target, got, phase, timers;

  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function plan(r) {
    if (r < 3)  { return { c: 3, r: 3, n: 3 }; }
    if (r < 6)  { return { c: 4, r: 4, n: 4 }; }
    if (r < 9)  { return { c: 4, r: 4, n: 5 }; }
    if (r < 12) { return { c: 4, r: 5, n: 6 }; }
    return { c: 5, r: 5, n: Math.min(8, 6 + Math.floor((r - 12) / 3)) };
  }

  function hearts() {
    var s = '';
    for (var i = 0; i < 3; i++) { s += (i < lives) ? '\u2665' : '\u2661'; }
    return 'Round ' + (round + 1) + '  ' + s;
  }

  function build() {
    var p = plan(round), i, k;
    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#3B2757', '#2B1B3F') }, api.arena);

    /* choose the cells to remember */
    var all = [];
    for (i = 0; i < p.c * p.r; i++) { all.push(i); }
    for (i = all.length - 1; i > 0; i--) { k = Math.floor(Math.random() * (i + 1)); var t = all[i]; all[i] = all[k]; all[k] = t; }
    target = all.slice(0, p.n);
    got = [];

    var padX = 14, padY = 14;
    var cw = (360 - padX * 2) / p.c, ch = (420 - padY * 2) / p.r;
    var w = Math.min(cw, ch) - 10;
    var offX = padX + (360 - padX * 2 - cw * p.c) / 2;
    var offY = padY + (420 - padY * 2 - ch * p.r) / 2;

    cells = [];
    for (i = 0; i < p.c * p.r; i++) {
      (function (i) {
        var cx = offX + cw * (i % p.c) + cw / 2;
        var cy = offY + ch * Math.floor(i / p.c) + ch / 2;
        var g = G(api.arena, cx, cy);
        var tile = ink(S('rect', { x: -w / 2, y: -w / 2, width: w, height: w, rx: 14, fill: '#4A3372' }, g), 4);
        var who = S('g', { opacity: '0' }, g);
        var isT = target.indexOf(i) >= 0;
        if (isT) {
          A.critter(who, { x: 0, y: 0, size: w * .28, fill: COLS[i % COLS.length],
            ears: 'round', bob: false, blink: false, shadow: false });
        }
        cells.push({ g: g, tile: tile, who: who, i: i, cx: cx, cy: cy, w: w, done: false });
        BS.tap(g, function () { poke(i); });
      })(i);
    }

    /* reveal, then hide */
    phase = 'show';
    api.score(hearts());
    var showMs = 1200 + p.n * 340;
    api.bar(1);
    var t0 = Date.now();
    A.tick(function () {
      if (phase !== 'show') { return true; }
      api.bar(1 - (Date.now() - t0) / showMs);
      return false;
    });
    for (i = 0; i < cells.length; i++) {
      if (target.indexOf(cells[i].i) >= 0) {
        cells[i].who.setAttribute('opacity', '1');
        cells[i].tile.setAttribute('fill', '#FFF6E6');
      }
    }
    api.SFX.flip();
    later(function () {
      for (var j = 0; j < cells.length; j++) {
        cells[j].who.setAttribute('opacity', '0');
        cells[j].tile.setAttribute('fill', '#4A3372');
      }
      phase = 'recall';
      api.bar(0);
      api.toast('Where were they?', '#FFC93C');
    }, showMs);
  }

  function poke(i) {
    if (phase !== 'recall') { return; }
    var c = cells[i];
    if (c.done) { return; }
    c.done = true;
    if (target.indexOf(i) >= 0) {
      got.push(i);
      c.tile.setAttribute('fill', '#3FBF7F');
      c.who.setAttribute('opacity', '1');
      api.SFX.good();
      api.bar(got.length / target.length);
      if (got.length === target.length) { cleared(); }
      return;
    }
    c.tile.setAttribute('fill', '#F0466F');
    api.SFX.bad();
    BS.wobble(c.g);
    lives--;
    api.score(hearts());
    if (lives <= 0) { over(); }
  }

  function cleared() {
    phase = 'done';
    round++;
    if (round > best) { best = round; api.save('bs.snapBest', best); }
    api.SFX.win();
    api.toast('All of them!', '#3FBF7F');
    later(build, 1000);
  }

  function over() {
    phase = 'done';
    api.SFX.over();
    later(function () {
      api.over(
        round >= best && round > 0 ? 'New best!' : 'Out of hearts',
        round === 0
          ? 'Try saying the places out loud while you look — "top left, middle, bottom right".'
          : ('You remembered ' + round + (round === 1 ? ' picture' : ' pictures') + '. Your best is ' + best + '.'),
        'Try again'
      );
    }, 700);
  }

  BS.registerMode('snap', {
    start: function (a) {
      api = a; timers = [];
      api.title('Snapshot');
      api.showBar(true);
      api.foot('');
      best = api.load('bs.snapBest', 0);
      round = 0; lives = 3;
      build();
    },
    stop: function () { phase = 'done'; clearTimers(); }
  });
})();
