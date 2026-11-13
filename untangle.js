/* ==========================================================
   Brain Snacks — Untangle
   Drag the dots until no strings cross. Built by connecting
   points on a circle without crossings, then scrambling them,
   so a tangle-free arrangement always exists.
   Spatial reasoning + persistence. Endless.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var api, round, best, nodes, edges, lines, crossings, done;

  var timers = [];
  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function nCount(r) { return Math.min(11, 5 + r); }

  /* do segments ab and cd cross? shared endpoints do not count */
  function side(ax, ay, bx, by, px, py) {
    var v = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
    return v > 0.0001 ? 1 : (v < -0.0001 ? -1 : 0);
  }
  function cross(a, b, c, d) {
    if (a === c || a === d || b === c || b === d) { return false; }
    var d1 = side(a.x, a.y, b.x, b.y, c.x, c.y);
    var d2 = side(a.x, a.y, b.x, b.y, d.x, d.y);
    var d3 = side(c.x, c.y, d.x, d.y, a.x, a.y);
    var d4 = side(c.x, c.y, d.x, d.y, b.x, b.y);
    return (d1 * d2 < 0) && (d3 * d4 < 0);
  }

  function build() {
    var n = nCount(round), i, j;
    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#3B2757', '#2B1B3F') }, api.arena);

    /* lay the points on a circle and triangulate the polygon — any set of
       non-crossing chords is planar, and the circle itself is a solution */
    var ring = [];
    for (i = 0; i < n; i++) { ring.push(i); }
    edges = [];
    for (i = 0; i < n; i++) { edges.push([i, (i + 1) % n]); }
    /* fan out a few extra non-crossing chords */
    var extra = Math.min(n - 3, 2 + Math.floor(round / 3));
    var used = {};
    for (i = 0; i < extra; i++) {
      var a = 0, b = 2 + i;
      if (b >= n - 0) { break; }
      var key = a + '-' + b;
      if (used[key]) { continue; }
      used[key] = 1;
      edges.push([a, b]);
    }
    /* a second fan from the far side, still non-crossing with the first */
    if (n >= 7) {
      var mid = Math.floor(n / 2);
      for (i = 2; i < Math.min(4, mid); i++) {
        edges.push([mid, (mid + i) % n]);
      }
    }

    /* scramble the positions */
    nodes = [];
    for (i = 0; i < n; i++) { nodes.push({ x: 0, y: 0 }); }
    /* Scatter, then push apart anything closer than 64. Used for the first
       deal AND for every re-deal: the re-deal used to skip the pushing apart,
       and about one board in nine arrived with one dot sitting on another. */
    function scatter() {
      var a2, b2, pass, dx, dy, d, push;
      for (a2 = 0; a2 < n; a2++) {
        nodes[a2].x = 46 + Math.random() * 268;
        nodes[a2].y = 56 + Math.random() * 312;
      }
      for (pass = 0; pass < 60; pass++) {
        for (a2 = 0; a2 < n; a2++) {
          for (b2 = a2 + 1; b2 < n; b2++) {
            dx = nodes[b2].x - nodes[a2].x; dy = nodes[b2].y - nodes[a2].y;
            d = Math.sqrt(dx * dx + dy * dy) || 1;
            if (d < 64) {
              push = (64 - d) / 2;
              nodes[a2].x -= dx / d * push; nodes[a2].y -= dy / d * push;
              nodes[b2].x += dx / d * push; nodes[b2].y += dy / d * push;
            }
          }
        }
        for (a2 = 0; a2 < n; a2++) {
          nodes[a2].x = Math.max(40, Math.min(320, nodes[a2].x));
          nodes[a2].y = Math.max(48, Math.min(372, nodes[a2].y));
        }
      }
    }
    scatter();

    lines = S('g', {}, api.arena);
    for (i = 0; i < edges.length; i++) {
      edges[i].el = ink(S('line', { x1: 0, y1: 0, x2: 0, y2: 0 }, lines), 4);
      edges[i].el.setAttribute('stroke', '#8A7BA8');
    }
    for (i = 0; i < n; i++) {
      (function (i) {
        var g = G(api.arena, nodes[i].x, nodes[i].y);
        S('circle', { cx: 0, cy: 0, r: 30, fill: '#FFFFFF', opacity: '0', 'pointer-events': 'all' }, g);
        var dot = ink(S('circle', { cx: 0, cy: 0, r: 17, fill: '#FFC93C' }, g), 4);
        S('ellipse', { cx: -5, cy: -6, rx: 6, ry: 4, fill: '#FFFFFF', opacity: '.55' }, g);
        g.__ring = i;
        nodes[i].g = g; nodes[i].dot = dot;
        BS.drag(g, {
          clamp: [26, 34, 334, 386],
          onMove: function (x, y) {
            nodes[i].x = x; nodes[i].y = y;
            paint();
          },
          onDrop: function () { paint(); check(); }
        });
      })(i);
    }
    paint();
    /* a scramble can land untangled by luck — reshuffle until it is a real puzzle */
    var guard = 0;
    while (crossings === 0 && guard < 40) {
      guard++;
      scatter();
      for (i = 0; i < n; i++) { A.place(nodes[i].g, nodes[i].x, nodes[i].y); }
      paint();
    }
    api.bar(0);
  }

  function paint() {
    var i, j, a, b;
    crossings = 0;
    var bad = {};
    for (i = 0; i < edges.length; i++) {
      for (j = i + 1; j < edges.length; j++) {
        if (cross(nodes[edges[i][0]], nodes[edges[i][1]], nodes[edges[j][0]], nodes[edges[j][1]])) {
          crossings++; bad[i] = 1; bad[j] = 1;
        }
      }
    }
    for (i = 0; i < edges.length; i++) {
      a = nodes[edges[i][0]]; b = nodes[edges[i][1]];
      edges[i].el.setAttribute('x1', a.x); edges[i].el.setAttribute('y1', a.y);
      edges[i].el.setAttribute('x2', b.x); edges[i].el.setAttribute('y2', b.y);
      edges[i].el.setAttribute('stroke', bad[i] ? '#F0466F' : '#3FBF7F');
    }
    api.score(crossings === 0 ? 'No crosses!' : (crossings + (crossings === 1 ? ' cross' : ' crosses')));
  }

  function check() {
    if (done || crossings > 0) { return; }
    done = true;
    round++;
    if (round > best) { best = round; api.save('bs.untangleBest', best); }
    api.SFX.win(); api.confetti();
    api.toast('Untangled!', '#3FBF7F');
    later(function () { done = false; build(); }, 1300);
  }

  BS.registerMode('untangle', {
    name: 'Untangle', shelf: 'think', color: '#7FD9C4', shade: '#55A793',
    keys: ['bs.untangleBest'], best: ['bs.untangleBest', 'board', 'boards'], blurb: 'No crossed lines',
    icon: function (a) {
      var up = [[22, 8], [62, 10], [26, 34], [60, 32]], ue = [[0, 3], [1, 2], [0, 1], [2, 3]], i;
      for (i = 0; i < ue.length; i++) {
        ART.ink(ART.S('line', { x1: up[ue[i][0]][0], y1: up[ue[i][0]][1], x2: up[ue[i][1]][0], y2: up[ue[i][1]][1] }, a), 2.6)
          .setAttribute('stroke', i < 2 ? '#C74C6B' : '#241534');
      }
      for (i = 0; i < 4; i++) { ART.ink(ART.S('circle', { cx: up[i][0], cy: up[i][1], r: 6, fill: '#FFC93C' }, a), 2.4); }
    },
    start: function (a) {
      api = a;
      clearTimers();
      api.title('Untangle');
      api.showBar(false);
      api.foot('');
      best = api.load('bs.untangleBest', 0);
      round = 0; done = false;
      build();
      api.toast('Drag until nothing crosses', '#FFC93C');
    },
    stop: function () { done = true; clearTimers(); }
  });
})();
