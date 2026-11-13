/* ==========================================================
   Brain Snacks — Robot
   Tell the robot the whole way to the battery, then press GO.
   Nothing moves until the plan is finished, so the thinking has
   to happen first. Sequencing and planning. Endless: the routes
   get longer. Every board is checked by breadth-first search
   before it is shown, so there is always a way.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var C = 5, R = 5, U = 44, OX = 70, OY = 12;
  var DX = { U: 0, D: 0, L: -1, R: 1 }, DY = { U: -1, D: 1, L: 0, R: 0 }, ROT = { U: 0, R: 90, D: 180, L: 270 };
  var DIRS = ['U', 'D', 'L', 'R'];

  var api, round, best, lives, playing, busy, walls, start, goal, need, max, prog, bot, strip;

  function hud() { api.score('Route ' + (round + 1) + '  ' + KIT.hearts(lives)); }
  function wallAt(x, y) { return x < 0 || y < 0 || x >= C || y >= R || walls[y][x] === 1; }
  function cxy(p) { return [OX + p[0] * U + U / 2, OY + p[1] * U + U / 2]; }

  /* shortest route from a to b, as a string of moves, or null */
  function bfs(a, b) {
    var seen = {}, q = [[a[0], a[1], '']], cur, i, nx, ny;
    seen[a[0] + ':' + a[1]] = 1;
    while (q.length) {
      cur = q.shift();
      if (cur[0] === b[0] && cur[1] === b[1]) { return cur[2]; }
      for (i = 0; i < 4; i++) {
        nx = cur[0] + DX[DIRS[i]]; ny = cur[1] + DY[DIRS[i]];
        if (wallAt(nx, ny) || seen[nx + ':' + ny]) { continue; }
        seen[nx + ':' + ny] = 1;
        q.push([nx, ny, cur[2] + DIRS[i]]);
      }
    }
    return null;
  }
  function turns(s) { var n = 0; for (var i = 1; i < s.length; i++) { if (s.charAt(i) !== s.charAt(i - 1)) { n++; } } return n; }

  function generate() {
    var want = Math.min(9, 3 + Math.floor(round * 0.75)), tries, x, y, path;
    for (tries = 0; tries < 600; tries++) {
      walls = [];
      for (y = 0; y < R; y++) {
        walls.push([]);
        for (x = 0; x < C; x++) { walls[y].push(Math.random() < (round < 2 ? 0.12 : 0.24) ? 1 : 0); }
      }
      start = [KIT.rnd(C), KIT.rnd(R)]; goal = [KIT.rnd(C), KIT.rnd(R)];
      walls[start[1]][start[0]] = 0; walls[goal[1]][goal[0]] = 0;
      path = bfs(start, goal);
      if (path && path.length === want && turns(path) >= (round < 1 ? 0 : 1)) { need = path.length; return; }
    }
    /* never reached in testing; a plain board that is certainly solvable */
    walls = [];
    for (y = 0; y < R; y++) { walls.push([0, 0, 0, 0, 0]); }
    start = [0, 4]; goal = [2, 2]; need = 4;
  }

  function arrow(parent, dir, k) {
    return ink(S('path', { d: 'M0,-12 L10,2 L4,2 L4,12 L-4,12 L-4,2 L-10,2 Z', fill: '#241534',
      transform: 'rotate(' + ROT[dir] + ') scale(' + (k || 1) + ')' }, parent), 1);
  }

  function paintProg() {
    A.clear(strip);
    var w = Math.min(30, 300 / max), i, g;
    for (i = 0; i < max; i++) {
      ink(S('rect', { x: 180 - max * w / 2 + i * w + 2, y: 252, width: w - 4, height: 28, rx: 7,
        fill: i < prog.length ? '#FFC93C' : '#3B2757', 'stroke-dasharray': i < prog.length ? 'none' : '4 4' }, strip), 2.4);
      if (i < prog.length) {
        g = G(strip, 180 - max * w / 2 + i * w + w / 2, 266);
        arrow(g, prog[i], .72);
      }
    }
  }

  function build() {
    if (!playing) { return; }
    generate();
    max = need + 2;
    prog = []; busy = false;
    var x, y, i, p;
    KIT.backdrop(api.arena, '#32507A', '#2B1B3F');
    ink(S('rect', { x: OX - 7, y: OY - 7, width: C * U + 14, height: R * U + 14, rx: 14, fill: '#1F3352' }, api.arena), 4);
    for (y = 0; y < R; y++) {
      for (x = 0; x < C; x++) {
        var c = ink(S('rect', { x: OX + x * U + 2, y: OY + y * U + 2, width: U - 4, height: U - 4, rx: 8,
          fill: walls[y][x] ? '#3D5A86' : ((x + y) % 2 ? '#EAF2FA' : '#FFFFFF') }, api.arena), 2.4);
        c.setAttribute('data-cell', x + ':' + y);
        c.setAttribute('data-w', walls[y][x]);
        if (walls[y][x]) {
          ink(S('path', { d: 'M' + (OX + x * U + 13) + ',' + (OY + y * U + 13) + ' l' + (U - 26) + ',' + (U - 26) + ' m0,' + (26 - U) + ' l' + (26 - U) + ',' + (U - 26), fill: 'none' }, api.arena), 4)
            .setAttribute('stroke', '#1F3352');
        }
      }
    }
    p = cxy(goal);
    var bat = G(api.arena, p[0], p[1]);
    bat.id = 'robo-goal'; bat.setAttribute('data-at', goal[0] + ':' + goal[1]);
    ink(S('rect', { x: -9, y: -11, width: 18, height: 25, rx: 4, fill: '#3FBF7F' }, bat), 3);
    ink(S('rect', { x: -4, y: -16, width: 8, height: 6, rx: 2, fill: '#3FBF7F' }, bat), 2.4);
    ink(S('path', { d: 'M2,-6 l-6,8 l5,0 l-3,8 l7,-10 l-5,0 Z', fill: '#FFC93C' }, bat), 1.6);
    p = cxy(start);
    bot = A.robot(api.arena, { x: p[0], y: p[1] - 1, size: 12 });
    bot.id = 'robo-bot'; bot.setAttribute('data-at', start[0] + ':' + start[1]);

    strip = S('g', {}, api.arena);
    paintProg();
    for (i = 0; i < 4; i++) {
      (function (d, i) {
        var g = G(api.arena, 42 + i * 58, 322);
        g.setAttribute('data-dir', d);
        KIT.pad(g, 56, 56);
        S('rect', { x: -24, y: -19, width: 48, height: 46, rx: 12, fill: '#5C7096' }, g);
        ink(S('rect', { x: -24, y: -24, width: 48, height: 46, rx: 12, fill: '#8FA8F0' }, g), 3.5);
        arrow(g, d, 1.15);
        BS.tap(g, function () {
          if (!playing || busy) { return; }
          if (prog.length >= max) { BS.wobble(g); api.SFX.bad(); return; }
          prog.push(d); api.SFX.tap(); paintProg();
        });
      })(DIRS[i], i);
    }
    var un = KIT.button(api.arena, 298, 322, 92, 'undo', '#FFF6E6', function () {
      if (!playing || busy || !prog.length) { return; }
      prog.pop(); api.SFX.tap(); paintProg();
    }, 46);
    un.setAttribute('data-undo', '1');
    var go = KIT.button(api.arena, 180, 386, 230, 'GO', '#3FBF7F', run, 44);
    go.id = 'robo-go';
    go.__label.setAttribute('font-size', '20'); go.__label.setAttribute('y', '7');
    hud();
  }

  function fail() {
    lives--;
    api.SFX.bad(); BS.wobble(bot);
    api.toast(lives > 0 ? 'Try a new plan' : 'Out of power', '#F0466F');
    hud();
    if (lives <= 0) { over(); return; }
    api.later(function () {
      var p = cxy(start);
      BS.glide(bot, p[0], p[1] - 1, 260);
      bot.setAttribute('data-at', start[0] + ':' + start[1]);
      busy = false;
    }, 600);
  }

  function run() {
    if (!playing || busy) { return; }
    if (!prog.length) { api.toast('Add some arrows', '#FFC93C'); return; }
    busy = true;
    var p = start.slice(), k = 0;
    function step() {
      if (!playing) { return; }
      if (k >= prog.length) { fail(); return; }
      var nx = p[0] + DX[prog[k]], ny = p[1] + DY[prog[k]];
      if (wallAt(nx, ny)) { fail(); return; }
      p = [nx, ny]; k++;
      var q = cxy(p);
      BS.glide(bot, q[0], q[1] - 1, 190);
      bot.setAttribute('data-at', p[0] + ':' + p[1]);
      api.SFX.tap();
      if (p[0] === goal[0] && p[1] === goal[1]) { api.later(won, 280); return; }
      api.later(step, 240);
    }
    step();
  }

  function won() {
    round++;
    if (round > best) { best = round; api.save('bs.roboBest', best); }
    api.SFX.win(); api.confetti();
    var q = cxy(goal);
    A.burst(api.arena, q[0], q[1], { n: 10, r: 52 });
    api.toast('Charged!', '#3FBF7F');
    api.later(build, 1100);
  }

  function over() {
    playing = false;
    api.SFX.over();
    api.later(function () {
      api.over(
        round >= best && round > 0 ? 'New best!' : 'Out of power',
        round === 0
          ? 'Trace the route with your finger first and say each turn out loud. Then tap the arrows in.'
          : ('The robot reached ' + round + (round === 1 ? ' battery' : ' batteries') + '. Your best is ' + best + '.'),
        'Try again'
      );
    }, 600);
  }

  BS.registerMode('robot', {
    name: 'Robot', shelf: 'think', color: '#A9C4E0', shade: '#7890AC',
    keys: ['bs.roboBest'], best: ['bs.roboBest', 'route', 'routes'], blurb: 'Plan the whole way',
    icon: function (a) {
      A.robot(a, { x: 24, y: 23, size: 9.5 });
      A.ink(A.S('path', { d: 'M40,24 L54,24 M50,19 L55,24 L50,29', fill: 'none' }, a), 3);
      A.ink(A.S('rect', { x: 61, y: 13, width: 13, height: 19, rx: 3, fill: '#3FBF7F' }, a), 2.4);
      A.ink(A.S('rect', { x: 65, y: 9, width: 5, height: 5, rx: 1.5, fill: '#3FBF7F' }, a), 2);
    },
    start: function (a) {
      api = a;
      api.title('Robot');
      api.showBar(false);
      best = api.load('bs.roboBest', 0);
      round = 0; lives = 3; playing = true;
      build();
    },
    stop: function () { playing = false; }
  });
})();
