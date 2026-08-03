/* ==========================================================
   Brain Snacks — Slide (sliding tile puzzle)
   Shuffled by making legal moves from the solved state, so
   every board it deals can actually be finished.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var SIZES = {
    easy:   { c: 3, r: 2, name: 'Easy', mix: 30 },
    medium: { c: 3, r: 3, name: 'Medium', mix: 60 },
    hard:   { c: 4, r: 4, name: 'Hard', mix: 110 }
  };
  var TILE_COLS = ['#FF8A3D', '#6EC6E8', '#3FBF7F', '#F0466F', '#FFC93C', '#B58BF0',
                   '#FF6F92', '#A9E05F', '#8FA8F0', '#FFD84A', '#5FD3C0', '#E8845F',
                   '#C98B52', '#7FD094', '#F0A8D0'];

  var api, level, cfg, board, gap, moves, tiles, done;

  var timers = [];
  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function idx(c, r) { return r * cfg.c + c; }

  function solved() {
    for (var i = 0; i < board.length - 1; i++) { if (board[i] !== i) { return false; } }
    return true;
  }

  function neighbours(g) {
    var c = g % cfg.c, r = Math.floor(g / cfg.c), out = [];
    if (c > 0) { out.push(g - 1); }
    if (c < cfg.c - 1) { out.push(g + 1); }
    if (r > 0) { out.push(g - cfg.c); }
    if (r < cfg.r - 1) { out.push(g + cfg.c); }
    return out;
  }

  function deal() {
    cfg = SIZES[level];
    var n = cfg.c * cfg.r, i;
    board = [];
    for (i = 0; i < n; i++) { board.push(i); }
    gap = n - 1;
    /* shuffle by walking the gap around, which keeps it solvable */
    var last = -1;
    for (i = 0; i < cfg.mix; i++) {
      var opts = neighbours(gap), k;
      for (k = opts.length - 1; k >= 0; k--) { if (opts[k] === last) { opts.splice(k, 1); } }
      var pickTo = opts[Math.floor(Math.random() * opts.length)];
      last = gap;
      board[gap] = board[pickTo]; board[pickTo] = n - 1; gap = pickTo;
    }
    if (solved()) { deal(); return; }
    moves = 0; done = false;
    render();
    api.score('0 moves');
    api.bar(0);
    paintFoot();
  }

  function render() {
    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#3B2757', '#2B1B3F') }, api.arena);
    var padX = 16, padY = 16;
    var cw = (360 - padX * 2) / cfg.c, ch = (420 - padY * 2) / cfg.r;
    var w = Math.min(cw, ch) - 9;
    var offX = padX + (360 - padX * 2 - cw * cfg.c) / 2;
    tiles = [];
    for (var pos = 0; pos < board.length; pos++) {
      (function (pos) {
        var v = board[pos];
        if (v === board.length - 1) { return; }
        var cx = offX + cw * (pos % cfg.c) + cw / 2;
        var cy = padY + ch * Math.floor(pos / cfg.c) + ch / 2;
        var g = G(api.arena, cx, cy);
        ink(S('rect', { x: -w / 2, y: -w / 2, width: w, height: w, rx: 14,
          fill: A.bodyFill(api.arena, TILE_COLS[v % TILE_COLS.length]) }, g), 4);
        S('rect', { x: -w / 2 + 9, y: -w / 2 + 9, width: w * .4, height: 9, rx: 5,
          fill: '#FFFFFF', opacity: '.28' }, g);
        txt(String(v + 1), { x: 0, y: w * .17, 'font-size': w * .46, fill: '#241534' }, g);
        tiles[pos] = { g: g, cw: cw, ch: ch, offX: offX, padY: padY, w: w };
        BS.tap(g, function () { move(pos); });
      })(pos);
    }
  }

  function centreOf(pos) {
    var t = tiles[gap] || tiles[0];
    var padX = 16, padY = 16;
    var cw = (360 - padX * 2) / cfg.c, ch = (420 - padY * 2) / cfg.r;
    var offX = padX + (360 - padX * 2 - cw * cfg.c) / 2;
    return { x: offX + cw * (pos % cfg.c) + cw / 2, y: padY + ch * Math.floor(pos / cfg.c) + ch / 2 };
  }

  function move(pos) {
    if (done) { return; }
    if (neighbours(gap).indexOf(pos) === -1) { api.SFX.bad(); BS.wobble(tiles[pos].g); return; }
    var t = tiles[pos];
    board[gap] = board[pos];
    board[pos] = board.length - 1;
    tiles[gap] = t; tiles[pos] = null;
    var to = centreOf(gap);
    BS.glide(t.g, to.x, to.y, 150);
    gap = pos;
    moves++;
    api.SFX.flip();
    api.score(moves + (moves === 1 ? ' move' : ' moves'));
    var right = 0;
    for (var i = 0; i < board.length - 1; i++) { if (board[i] === i) { right++; } }
    api.bar(right / (board.length - 1));
    if (solved()) { finish(); }
  }

  function finish() {
    done = true;
    api.SFX.win(); api.confetti();
    var key = 'bs.slide.' + level;
    var best = api.load(key, null);
    var isBest = (best === null || moves < best);
    if (isBest) { api.save(key, moves); api.save('bs.slideBest', moves); }
    later(function () {
      api.over(
        isBest ? 'New best!' : 'Solved!',
        isBest
          ? ('You put ' + SIZES[level].name.toLowerCase() + ' in order in ' + moves + ' moves. Best yet.')
          : ('Solved in ' + moves + ' moves. Your best on ' + SIZES[level].name.toLowerCase() + ' is ' + best + '.'),
        'Shuffle again'
      );
    }, 700);
  }

  function paintFoot() {
    var keys = ['easy', 'medium', 'hard'], html = '<div class="picker">', i;
    for (i = 0; i < keys.length; i++) {
      html += '<button data-lv="' + keys[i] + '"' + (keys[i] === level ? ' class="sel"' : '') + '>' + SIZES[keys[i]].name + '</button>';
    }
    var foot = api.foot(html + '</div>');
    var btns = foot.querySelectorAll('button');
    for (i = 0; i < btns.length; i++) {
      (function (b) {
        b.addEventListener('click', function () {
          level = b.getAttribute('data-lv');
          api.SFX.tap(); api.save('bs.slideLevel', level);
          clearTimers(); A.stopAll(); deal();
        }, false);
      })(btns[i]);
    }
  }

  BS.registerMode('slide', {
    start: function (a) {
      api = a;
      clearTimers();
      level = api.load('bs.slideLevel', 'easy');
      if (!SIZES[level]) { level = 'easy'; }
      api.title('Slide');
      api.showBar(true);
      deal();
    },
    stop: function () { done = true; clearTimers(); }
  });
})();
