/* ==========================================================
   Brain Snacks — Trail
   Tap the bubbles in order. Later rounds alternate numbers and
   letters, which forces the brain to switch tracks each step.
   Attention switching + processing speed. Endless.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var LETTERS = 'ABCDEFGHIJKL';
  var api, round, best, seq, at, nodes, tLeft, tMax, playing, warned, lines;

  var timers = [];
  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function labels(r) {
    var n = Math.min(12, 5 + r), out = [], i;
    if (r < 3) {
      for (i = 0; i < n; i++) { out.push(String(i + 1)); }
      return out;
    }
    /* 1, A, 2, B, 3, C ... */
    var num = 1, let_ = 0;
    for (i = 0; i < n; i++) {
      if (i % 2 === 0) { out.push(String(num++)); }
      else { out.push(LETTERS.charAt(let_++)); }
    }
    return out;
  }

  function place(n, r) {
    var pts = [], tries, x, y, ok, i, k;
    var minD = n > 9 ? 74 : 86;
    for (i = 0; i < n; i++) {
      ok = false;
      for (tries = 0; tries < 260 && !ok; tries++) {
        x = 44 + Math.random() * 272;
        y = 44 + Math.random() * 332;
        ok = true;
        for (k = 0; k < pts.length; k++) {
          if (Math.sqrt(Math.pow(x - pts[k][0], 2) + Math.pow(y - pts[k][1], 2)) < minD) { ok = false; break; }
        }
      }
      if (!ok) { minD -= 8; i--; continue; }
      pts.push([x, y]);
    }
    return pts;
  }

  function build() {
    seq = labels(round);
    at = 0;
    var pts = place(seq.length, round);

    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#3B2757', '#2B1B3F') }, api.arena);
    lines = S('g', {}, api.arena);
    nodes = [];

    for (var i = 0; i < seq.length; i++) {
      (function (i) {
        var g = G(api.arena, pts[i][0], pts[i][1]);
        var isLetter = /[A-Z]/.test(seq[i]);
        var ring = ink(S('circle', { cx: 0, cy: 0, r: 28, fill: isLetter ? '#FFE9A8' : '#FFF6E6' }, g), 4);
        S('ellipse', { cx: -8, cy: -10, rx: 10, ry: 6, fill: '#FFFFFF', opacity: '.6' }, g);
        var label = txt(seq[i], { x: 0, y: 10, 'font-size': 27, fill: '#241534' }, g);
        nodes.push({ g: g, ring: ring, label: label, x: pts[i][0], y: pts[i][1], done: false });
        BS.tap(g, function () { poke(i); });
      })(i);
    }
    api.score('Next: ' + seq[0]);
  }

  function poke(i) {
    if (!playing) { return; }
    var n = nodes[i];
    if (n.done) { return; }
    if (i !== at) {
      api.SFX.bad(); BS.wobble(n.g);
      tLeft -= 1400;
      api.toast('Not yet!', '#F0466F');
      return;
    }
    n.done = true;
    n.ring.setAttribute('fill', '#3FBF7F');
    n.label.setAttribute('fill', '#FFF6E6');
    api.SFX.tap();
    if (at > 0) {
      var p = nodes[at - 1];
      ink(S('line', { x1: p.x, y1: p.y, x2: n.x, y2: n.y }, lines), 5).setAttribute('stroke', '#3FBF7F');
      lines.parentNode.insertBefore(lines, lines.parentNode.childNodes[1]);
    }
    at++;
    if (at < seq.length) { api.score('Next: ' + seq[at]); return; }
    cleared();
  }

  function cleared() {
    playing = false;
    round++;
    if (round > best) { best = round; api.save('bs.trailBest', best); }
    api.SFX.win();
    api.toast(round === 3 ? 'Now letters too!' : 'Done!', '#3FBF7F');
    later(next, 1000);
  }

  function next() {
    tMax = Math.max(9000, 17000 - round * 500);
    tLeft = tMax; warned = false;
    build();
    playing = true;
  }

  function over() {
    playing = false;
    api.SFX.over();
    later(function () {
      api.over(
        round >= best && round > 0 ? 'New best!' : "Time's up",
        round === 0
          ? 'Find the 1 first, then look for the 2 before you tap. Hunting as you go is quicker than scanning everything.'
          : ('You finished ' + round + (round === 1 ? ' trail' : ' trails') + '. Your best is ' + best + '.'),
        'Try again'
      );
    }, 600);
  }

  BS.registerMode('trail', {
    start: function (a) {
      api = a;
      clearTimers();
      api.title('Trail');
      api.showBar(true);
      api.foot('');
      best = api.load('bs.trailBest', 0);
      round = 0;
      next();
      var last = Date.now();
      A.tick(function () {
        var now = Date.now(), dt = now - last;
        last = now;
        if (!playing) { return; }
        tLeft -= dt;
        api.bar(tLeft / tMax, tLeft < tMax * 0.28);
        if (tLeft < tMax * 0.28 && !warned) { warned = true; api.SFX.tickTock(); }
        if (tLeft <= 0) { over(); }
      });
    },
    stop: function () { playing = false; clearTimers(); }
  });
})();
