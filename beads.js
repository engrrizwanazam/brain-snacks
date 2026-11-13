/* ==========================================================
   Brain Snacks — Beads
   A string of beads with one missing. Work out the rule and
   pick the bead that finishes it. Pattern induction.
   Endless: the repeat gets longer, the gap moves into the
   middle, and later shape and colour each follow their own rule.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'];
  var COLS = ['#F0466F', '#4A9BE8', '#FFC93C', '#3FBF7F', '#B58BF0'];

  var api, score, best, lives, playing, busy;

  function hud() { api.score(score + '  ' + KIT.hearts(lives)); }

  /* [shape period, colour period, beads, gap anywhere?] */
  function plan(r) {
    if (r < 2) { return [2, 2, 7, false]; }                    /* A B A B */
    if (r < 4) { return [3, 3, 8, false]; }                    /* A B C A B C */
    if (r < 6) { return [KIT.rnd(2) ? 3 : 2, 1, 8, true]; }    /* one colour, gap in the middle */
    if (r < 9) { return [2, 3, 9, false]; }                    /* shape and colour on different beats */
    if (r < 13) { return [3, 2, 9, true]; }
    return [KIT.rnd(2) ? 4 : 3, KIT.rnd(2) ? 3 : 2, 10, true];
  }

  /* a repeating unit of length p that is NOT secretly a shorter repeat */
  function unit(p, pool) {
    var u, i, k, ok, tries;
    for (tries = 0; tries < 200; tries++) {
      u = [];
      if (p <= 3) {
        var pick = KIT.shuffle(pool.slice());
        for (i = 0; i < p; i++) { u.push(pick[i]); }
        /* for a length-3 unit allow A A B as well as A B C */
        if (p === 3 && KIT.rnd(2)) { u[1] = u[0]; }
      } else {
        for (i = 0; i < p; i++) { u.push(pool[KIT.rnd(3)]); }
      }
      ok = true;
      for (k = 1; k < p && ok; k++) {
        if (p % k !== 0) { continue; }
        var same = true;
        for (i = 0; i < p; i++) { if (u[i] !== u[i % k]) { same = false; break; } }
        if (same) { ok = false; }
      }
      if (ok) { return u; }
    }
    return pool.slice(0, p);
  }

  function bead(parent, sh, col, size) {
    return KIT.glyph(parent, SHAPES[sh], size, A.bodyFill(api.arena, COLS[col]), 3.2);
  }

  function build() {
    if (!playing) { return; }
    var P = plan(score), n = P[2], i;
    var su = unit(P[0], KIT.shuffle([0, 1, 2, 3, 4]));
    var cu = unit(P[1], KIT.shuffle([0, 1, 2, 3, 4]));
    var seq = [];
    for (i = 0; i < n; i++) { seq.push([su[i % P[0]], cu[i % P[1]]]); }
    /* the gap always has at least two full repeats visible besides itself */
    var gap = P[3] ? (3 + KIT.rnd(n - 3)) : n - 1;
    var ans = seq[gap];

    KIT.backdrop(api.arena, '#2F4A7A', '#2B1B3F');
    KIT.banner(api.arena, 'Which bead is missing?', 32);
    var perRow = Math.ceil(n / 2), step = Math.min(64, 300 / (perRow - 1));
    ink(S('path', { d: 'M24,120 L336,120 M24,204 L336,204', fill: 'none' }, api.arena), 4).setAttribute('stroke', '#8A7BA8');
    for (i = 0; i < n; i++) {
      var row = i < perRow ? 0 : 1, at = row ? i - perRow : i;
      var cnt = row ? n - perRow : perRow;
      var g = G(api.arena, 180 + (at - (cnt - 1) / 2) * step, 120 + row * 84);
      g.setAttribute('data-i', i);
      if (i === gap) {
        g.setAttribute('data-gap', '1');
        ink(S('circle', { cx: 0, cy: 0, r: 24, fill: '#FFF6E6', 'stroke-dasharray': '7 6' }, g), 3.5);
        txt('?', { x: 0, y: 10, 'font-size': 28, fill: '#8A7BA8' }, g);
      } else {
        g.setAttribute('data-s', seq[i][0]); g.setAttribute('data-c', seq[i][1]);
        bead(g, seq[i][0], seq[i][1], 19);
      }
    }
    /* the two wrong beads each get one thing right and one thing wrong */
    function other(list, not) { var v; do { v = list[KIT.rnd(list.length)]; } while (v === not); return v; }
    var wrongS = P[0] > 1 ? other(su, ans[0]) : other([0, 1, 2, 3, 4], ans[0]);
    var wrongC = P[1] > 1 ? other(cu, ans[1]) : other([0, 1, 2, 3, 4], ans[1]);
    var opts = KIT.shuffle([{ s: ans[0], c: ans[1], ok: true }, { s: wrongS, c: ans[1], ok: false }, { s: ans[0], c: wrongC, ok: false }]);
    for (i = 0; i < 3; i++) {
      (function (O, i) {
        var og = G(api.arena, 70 + i * 110, 330);
        og.setAttribute('data-os', O.s); og.setAttribute('data-oc', O.c);
        KIT.pad(og, 104, 104);
        S('rect', { x: -46, y: -42, width: 92, height: 92, rx: 16, fill: '#C9B58E' }, og);
        ink(S('rect', { x: -46, y: -46, width: 92, height: 92, rx: 16, fill: '#FFF6E6' }, og), 3.5);
        bead(og, O.s, O.c, 24);
        BS.tap(og, function () { answer(O.ok, og); });
      })(opts[i], i);
    }
    busy = false;
    hud();
  }

  function answer(ok, g) {
    if (!playing || busy) { return; }
    busy = true;
    if (ok) {
      score++;
      if (score > best) { best = score; api.save('bs.beadBest', best); }
      api.SFX.good();
      hud();
      A.burst(api.arena, g.__x, g.__y, { n: 8, r: 46 });
      api.toast(['Yes!', 'That fits!', 'Got it!'][KIT.rnd(3)], '#3FBF7F');
      api.later(build, 800);
      return;
    }
    lives--;
    api.SFX.bad(); BS.wobble(g);
    api.toast('Not that one', '#F0466F');
    hud();
    if (lives <= 0) { over(); return; }
    api.later(function () { busy = false; }, 450);
  }

  function over() {
    playing = false;
    api.SFX.over();
    api.later(function () {
      api.over(
        score >= best && score > 0 ? 'New best!' : 'Good game',
        score === 0
          ? 'Say the beads out loud from the start. Your ears will hear the pattern before your eyes see it.'
          : ('You finished ' + score + (score === 1 ? ' string' : ' strings') + '. Your best is ' + best + '.'),
        'Try again'
      );
    }, 600);
  }

  BS.registerMode('beads', {
    name: 'Beads', shelf: 'think', color: '#8FC4F5', shade: '#6090C0',
    keys: ['bs.beadBest'], best: ['bs.beadBest', 'string', 'strings'], blurb: 'Finish the pattern',
    icon: function (a) {
      A.ink(A.S('line', { x1: 8, y1: 21, x2: 76, y2: 21 }, a), 2.4);
      A.ink(A.S('circle', { cx: 16, cy: 21, r: 8, fill: '#F0466F' }, a), 2.4);
      A.ink(A.S('rect', { x: 26, y: 13, width: 16, height: 16, rx: 3, fill: '#4A9BE8' }, a), 2.4);
      A.ink(A.S('circle', { cx: 52, cy: 21, r: 8, fill: '#F0466F' }, a), 2.4);
      A.ink(A.S('rect', { x: 62, y: 13, width: 16, height: 16, rx: 3, fill: '#FFF6E6', 'stroke-dasharray': '3 3' }, a), 2.4);
      A.txt('?', { x: 70, y: 26, 'font-size': 12, fill: '#241534' }, a);
    },
    start: function (a) {
      api = a;
      api.title('Beads');
      api.showBar(false);
      best = api.load('bs.beadBest', 0);
      score = 0; lives = 3; playing = true;
      build();
    },
    stop: function () { playing = false; }
  });
})();
