/* ==========================================================
   Brain Snacks — Fill It
   Drag the pieces so they cover the board with no gaps and no
   overlaps. Every board is made by cutting a filled rectangle
   into pieces, so a perfect fit always exists.
   Spatial reasoning + planning. Endless.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var COLS = ['#FF8A3D', '#6EC6E8', '#3FBF7F', '#F0466F', '#FFC93C', '#B58BF0', '#5FD3C0', '#FF6F92'];

  var api, round, best, cols, rows, u, ox, oy, pieces, placed, done;

  var timers = [];
  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function plan(r) {
    if (r < 2) { return [3, 3, 3]; }
    if (r < 4) { return [4, 3, 4]; }
    if (r < 6) { return [4, 4, 5]; }
    if (r < 8) { return [5, 4, 5]; }
    return [5, 5, 6];
  }

  /* carve the board into n connected blobs by growing seeds */
  function carve(c, r, n) {
    var own = [], i, x, y;
    for (i = 0; i < c * r; i++) { own.push(-1); }
    var seeds = [], all = [];
    for (i = 0; i < c * r; i++) { all.push(i); }
    for (i = all.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = all[i];
      all[i] = all[j]; all[j] = t;
    }
    for (i = 0; i < n; i++) { own[all[i]] = i; seeds.push([all[i]]); }
    var left = c * r - n, guard = 0;
    while (left > 0 && guard < 8000) {
      guard++;
      var k = Math.floor(Math.random() * n);
      var grp = seeds[k];
      var from = grp[Math.floor(Math.random() * grp.length)];
      var fx = from % c, fy = Math.floor(from / c);
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      var d = dirs[Math.floor(Math.random() * 4)];
      var nx = fx + d[0], ny = fy + d[1];
      if (nx < 0 || ny < 0 || nx >= c || ny >= r) { continue; }
      var idx = ny * c + nx;
      if (own[idx] !== -1) { continue; }
      own[idx] = k; grp.push(idx); left--;
    }
    if (left > 0) { return null; }
    return seeds;
  }

  function build() {
    var p = plan(round);
    cols = p[0]; rows = p[1];
    var n = p[2], groups = null, tries = 0;
    while (!groups && tries < 40) { groups = carve(cols, rows, n); tries++; }
    if (!groups) { groups = carve(cols, rows, 3); }

    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#3B2757', '#2B1B3F') }, api.arena);

    /* the third term keeps the total piece area small enough that the
       tray can lay them out side by side without overlapping */
    u = Math.min(300 / cols, 190 / rows, Math.sqrt(30000 / (cols * rows)));
    ox = (360 - u * cols) / 2;
    oy = 14;

    /* the empty board */
    var bx, by;
    ink(S('rect', { x: ox - 6, y: oy - 6, width: u * cols + 12, height: u * rows + 12, rx: 12, fill: '#241534' }, api.arena), 0);
    for (by = 0; by < rows; by++) {
      for (bx = 0; bx < cols; bx++) {
        S('rect', { x: ox + bx * u + 1.5, y: oy + by * u + 1.5, width: u - 3, height: u - 3, rx: 5,
          fill: '#4A3372' }, api.arena);
      }
    }

    placed = {};
    pieces = [];
    var built = [];
    for (var i = 0; i < groups.length; i++) {
      (function (i) {
        var cells = groups[i], k;
        var minx = 99, miny = 99, maxx = -1, maxy = -1;
        for (k = 0; k < cells.length; k++) {
          minx = Math.min(minx, cells[k] % cols);
          miny = Math.min(miny, Math.floor(cells[k] / cols));
          maxx = Math.max(maxx, cells[k] % cols);
          maxy = Math.max(maxy, Math.floor(cells[k] / cols));
        }
        var shape = [];
        for (k = 0; k < cells.length; k++) {
          shape.push([cells[k] % cols - minx, Math.floor(cells[k] / cols) - miny]);
        }
        var col = COLS[i % COLS.length];
        var g = G(api.arena, 0, 0);
        for (k = 0; k < shape.length; k++) {
          ink(S('rect', { x: shape[k][0] * u, y: shape[k][1] * u, width: u, height: u, rx: 6,
            fill: A.bodyFill(api.arena, col) }, g), 3);
        }
        var P = { g: g, shape: shape, col: col, home: null, at: null, i: i,
                  w: (maxx - minx + 1) * u, h: (maxy - miny + 1) * u };
        g.__piece = i;
        g.__shape = shape;
        pieces.push(P);
        built.push(P);
        BS.drag(g, { onDrop: function (x, y) { drop(P, x, y); } });
      })(i);
    }

    /* pack the tray in rows so nothing overlaps — overlapping pieces make it
       impossible to grab the one you meant */
    var trayTop = oy + u * rows + 22;
    var cx2 = 10, cy2 = trayTop, rowH = 0, j;
    for (j = 0; j < built.length; j++) {
      var P2 = built[j];
      if (cx2 + P2.w > 352) { cx2 = 10; cy2 += rowH + 10; rowH = 0; }
      P2.home = { x: cx2, y: cy2 };
      A.place(P2.g, cx2, cy2);
      cx2 += P2.w + 10;
      rowH = Math.max(rowH, P2.h);
    }

    api.score('0 / ' + groups.length + ' placed');
    api.bar(0);
  }

  function occupied(skip) {
    var m = {}, i, k, P;
    for (i = 0; i < pieces.length; i++) {
      P = pieces[i];
      if (P === skip || !P.at) { continue; }
      for (k = 0; k < P.shape.length; k++) {
        m[(P.at[0] + P.shape[k][0]) + ':' + (P.at[1] + P.shape[k][1])] = 1;
      }
    }
    return m;
  }

  function drop(P, x, y) {
    if (done) { return; }
    var gx = Math.round((x - ox) / u), gy = Math.round((y - oy) / u);
    var k, ok = true, m = occupied(P);
    for (k = 0; k < P.shape.length; k++) {
      var cx2 = gx + P.shape[k][0], cy2 = gy + P.shape[k][1];
      if (cx2 < 0 || cy2 < 0 || cx2 >= cols || cy2 >= rows) { ok = false; break; }
      if (m[cx2 + ':' + cy2]) { ok = false; break; }
    }
    if (!ok) {
      P.at = null;
      BS.nope(P.g);
      BS.glide(P.g, P.home.x, P.home.y);
      count();
      return;
    }
    P.at = [gx, gy];
    BS.glide(P.g, ox + gx * u, oy + gy * u, 140);
    api.SFX.drop();
    count();
  }

  function count() {
    var n = 0, i;
    for (i = 0; i < pieces.length; i++) { if (pieces[i].at) { n++; } }
    api.score(n + ' / ' + pieces.length + ' placed');
    api.bar(n / pieces.length);
    if (n < pieces.length) { return; }
    /* every square covered? */
    var m = occupied(null), c = 0, q;
    for (q in m) { if (m.hasOwnProperty(q)) { c++; } }
    if (c !== cols * rows) { return; }
    done = true;
    round++;
    if (round > best) { best = round; api.save('bs.fillBest', best); }
    api.SFX.win(); api.confetti();
    api.toast('Perfect fit!', '#3FBF7F');
    later(function () { done = false; build(); }, 1300);
  }

  BS.registerMode('fill', {
    start: function (a) {
      api = a;
      clearTimers();
      api.title('Fill It');
      api.showBar(true);
      api.foot('');
      best = api.load('bs.fillBest', 0);
      round = 0; done = false;
      build();
      api.toast('Cover every square', '#FFC93C');
    },
    stop: function () { done = true; clearTimers(); }
  });
})();
