/* ==========================================================
   Brain Snacks — Sort It
   Drop each shape into the right bin. Partway through, the RULE
   changes — sort by colour, then suddenly by shape. Unlearning
   the old rule is the whole exercise (cognitive flexibility).
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var SHAPES = ['circle', 'square', 'triangle', 'star'];
  var PAIRS = [
    { cols: ['#F0466F', '#6EC6E8'], shapes: ['circle', 'square'] },
    { cols: ['#FFC93C', '#3FBF7F'], shapes: ['triangle', 'star'] },
    { cols: ['#FF8A3D', '#B58BF0'], shapes: ['square', 'star'] }
  ];

  var api, score, best, lives, rule, set, sinceSwitch, item, bins, playing, timers, tLeft, tMax;

  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function hearts() {
    var s = '';
    for (var i = 0; i < 3; i++) { s += (i < lives) ? '\u2665' : '\u2661'; }
    return score + '  ' + s;
  }

  function shape(parent, kind, size, fill) {
    if (kind === 'circle') { return ink(S('circle', { cx: 0, cy: 0, r: size, fill: fill }, parent), 4); }
    if (kind === 'square') { return ink(S('rect', { x: -size, y: -size, width: size * 2, height: size * 2, rx: size * .22, fill: fill }, parent), 4); }
    if (kind === 'triangle') { return ink(S('path', { d: 'M0,' + (-size * 1.1) + ' L' + (size) + ',' + (size * .8) + ' L' + (-size) + ',' + (size * .8) + ' Z', fill: fill }, parent), 4); }
    return A.star(parent, 0, 0, size * 1.15, fill, 4);
  }

  function drawBins() {
    var i;
    for (i = 0; i < 2; i++) {
      (function (i) {
        var cx = i ? 258 : 102;
        var g = G(api.arena, cx, 332);
        ink(S('path', { d: 'M-72,-46 L72,-46 L58,58 L-58,58 Z', fill: '#4A3372' }, g), 4);
        ink(S('rect', { x: -78, y: -58, width: 156, height: 20, rx: 9, fill: '#5E4390' }, g), 4);
        var badge = G(g, 0, 4);
        bins[i] = { g: g, badge: badge, cx: cx, cy: 332 };
      })(i);
    }
  }

  function paintBins() {
    for (var i = 0; i < 2; i++) {
      A.clear(bins[i].badge);
      if (rule === 'colour') {
        shape(bins[i].badge, 'circle', 27, set.cols[i]);
      } else {
        shape(bins[i].badge, set.shapes[i], 26, '#FFF6E6');
      }
    }
    document.getElementById('ar-rule').textContent =
      rule === 'colour' ? 'Sort by COLOUR' : 'Sort by SHAPE';
  }

  function newSet() {
    set = pick(PAIRS);
    /* make sure colour and shape disagree, or the rule would not matter */
    paintBins();
  }

  function spawn() {
    if (!playing) { return; }
    if (item && item.g.parentNode) { item.g.parentNode.removeChild(item.g); }
    var ci = Math.floor(Math.random() * 2), si = Math.floor(Math.random() * 2);
    var g = G(api.arena, 180, 132);
    S('rect', { x: -52, y: -52, width: 104, height: 104, fill: '#FFFFFF', opacity: '0', 'pointer-events': 'all' }, g);
    shape(g, set.shapes[si], 36, set.cols[ci]);
    item = { g: g, ci: ci, si: si, settled: false };
    BS.drag(g, {
      onDrop: function (x, y, back) {
        if (!playing || item.settled) { return; }
        for (var b = 0; b < 2; b++) {
          if (Math.abs(x - bins[b].cx) < 86 && y > 236) { judge(b); return; }
        }
        BS.glide(g, back.x, back.y);
      }
    });
    tLeft = tMax;
  }

  function judge(b) {
    item.settled = true;
    var right = (rule === 'colour') ? (b === item.ci) : (b === item.si);
    BS.glide(item.g, bins[b].cx, 318);
    if (right) {
      score++; sinceSwitch++;
      api.SFX.good();
      api.score(hearts());
      var ring = ink(S('circle', { cx: bins[b].cx, cy: 332, r: 54, fill: 'none' }, api.arena), 5);
      ring.setAttribute('stroke', '#3FBF7F');
      later(function () { if (ring.parentNode) { ring.parentNode.removeChild(ring); } }, 420);
      if (sinceSwitch >= 5 + Math.floor(Math.random() * 3)) { later(switchRule, 500); }
      else { later(spawn, 420); }
      return;
    }
    api.SFX.bad();
    api.toast('Wrong bin!', '#F0466F');
    BS.wobble(item.g);
    lives--;
    api.score(hearts());
    if (lives <= 0) { over(); return; }
    later(spawn, 700);
  }

  function switchRule() {
    sinceSwitch = 0;
    rule = (rule === 'colour') ? 'shape' : 'colour';
    tMax = Math.max(3600, tMax - 300);
    paintBins();
    api.SFX.win();
    api.toast('Rule changed!', '#FFC93C');
    later(spawn, 1100);
  }

  function timeUp() {
    if (!playing || !item || item.settled) { return; }
    item.settled = true;
    api.SFX.bad();
    api.toast('Too slow!', '#F0466F');
    lives--;
    api.score(hearts());
    if (lives <= 0) { over(); return; }
    later(spawn, 600);
  }

  function over() {
    playing = false;
    api.SFX.over();
    if (score > best) { best = score; api.save('bs.sortBest', best); }
    later(function () {
      api.over(
        score >= best && score > 0 ? 'New best!' : 'Out of hearts',
        score === 0
          ? 'Check the banner at the top before every drop. It tells you which rule is running.'
          : ('You sorted ' + score + ' right, through the rule changes. Your best is ' + best + '.'),
        'Try again'
      );
    }, 700);
  }

  BS.registerMode('sort', {
    start: function (a) {
      api = a; timers = []; bins = [];
      api.title('Sort It');
      api.showBar(true);
      api.foot('<div id="ar-rule" class="rulebar">Sort by COLOUR</div>');
      best = api.load('bs.sortBest', 0);
      score = 0; lives = 3; sinceSwitch = 0; rule = 'colour'; playing = true;
      tMax = 6500;
      A.clear(api.arena);
      S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#3B2757', '#2B1B3F') }, api.arena);
      drawBins();
      newSet();
      api.score(hearts());
      later(spawn, 600);
      var last = Date.now();
      A.tick(function () {
        var now = Date.now(), dt = now - last;
        last = now;
        if (!playing || !item || item.settled) { return; }
        tLeft -= dt;
        api.bar(tLeft / tMax, tLeft < tMax * 0.3);
        if (tLeft <= 0) { timeUp(); }
      });
    },
    stop: function () { playing = false; item = null; clearTimers(); }
  });
})();
