/* ==========================================================
   Brain Snacks — Chomp
   The monster wants a number. Feed him two snacks that make it.
   Number bonds, though nothing on the screen ever says so.
   Endless; the numbers grow and the clock shortens.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var COLS = ['#FF8FA6', '#FFD84A', '#7FD9A4', '#6EC6E8', '#FFB03A', '#C9B4F5'];
  var SPOTS = [[70, 250], [180, 250], [290, 250], [70, 350], [180, 350], [290, 350]];

  var api, round, best, playing, tLeft, tMax, warned, want, snacks, picked, mon, sign, busy;

  function plan(r) {
    if (r < 3) { return [5, 6]; }        /* targets from..to */
    if (r < 7) { return [6, 10]; }
    if (r < 12) { return [8, 12]; }
    return [10, 16];
  }

  function drawSnack(i, v) {
    var g = G(api.arena, SPOTS[i][0], SPOTS[i][1]);
    g.setAttribute('data-v', v);
    KIT.pad(g, 96, 92);
    ink(S('circle', { cx: 0, cy: 0, r: 34, fill: A.bodyFill(api.arena, COLS[i]) }, g), 4);
    S('ellipse', { cx: -11, cy: -14, rx: 11, ry: 7, fill: '#FFFFFF', opacity: '.5' }, g);
    ink(S('path', { d: 'M0,-34 q4,-12 14,-12', fill: 'none' }, g), 4).setAttribute('stroke', '#3FBF7F');
    txt(String(v), { x: 0, y: 13, 'font-size': 36, fill: '#241534' }, g);
    var ring = ink(S('circle', { cx: 0, cy: 0, r: 40, fill: 'none' }, g), 5);
    ring.setAttribute('stroke', '#FFF6E6'); ring.setAttribute('opacity', '0');
    var sn = { g: g, v: v, i: i, ring: ring, gone: false };
    BS.tap(g, function () { poke(sn); });
    return sn;
  }

  /* six snacks, at least one pair of which makes the target */
  function fill() {
    var p = plan(round), i, vals = [], a, b;
    want = p[0] + KIT.rnd(p[1] - p[0] + 1);
    a = Math.max(1, Math.min(9, 1 + KIT.rnd(want - 1)));
    b = want - a;
    if (b > 9) { b = 9; a = want - 9; }
    vals.push(a); vals.push(b);
    while (vals.length < 6) { vals.push(1 + KIT.rnd(9)); }
    KIT.shuffle(vals);
    return vals;
  }

  function build() {
    var vals = fill(), i;
    A.clear(api.arena);
    KIT.backdrop(api.arena, '#40306B', '#2B1B3F');
    S('ellipse', { cx: 180, cy: 190, rx: 190, ry: 40, fill: '#241534', opacity: '.25' }, api.arena);
    mon = A.critter(api.arena, { x: 118, y: 98, size: 56, fill: '#B58BF0', ears: 'round', horn: true, mood: 'wow' });
    sign = G(api.arena, 262, 96);
    sign.setAttribute('data-want', want);
    sign.id = 'chomp-want';
    ink(S('path', { d: 'M-52,-8 L-72,0 L-52,8 Z', fill: '#FFF6E6' }, sign), 4);
    ink(S('rect', { x: -56, y: -48, width: 112, height: 96, rx: 22, fill: '#FFF6E6' }, sign), 4);
    S('path', { d: 'M-54,-7 L-66,0 L-54,7 Z', fill: '#FFF6E6' }, sign);
    txt(String(want), { x: 0, y: 24, 'font-size': 66, fill: '#F0466F' }, sign);
    snacks = [];
    for (i = 0; i < 6; i++) { snacks.push(drawSnack(i, vals[i])); }
    picked = null; busy = false;
    api.score('Fed ' + round);
  }

  function poke(sn) {
    if (!playing || busy || sn.gone) { return; }
    if (picked === sn) { picked = null; sn.ring.setAttribute('opacity', '0'); return; }
    if (!picked) { picked = sn; sn.ring.setAttribute('opacity', '1'); api.SFX.tap(); return; }
    var other = picked;
    picked = null;
    other.ring.setAttribute('opacity', '0');
    if (other.v + sn.v !== want) {
      api.SFX.bad(); BS.wobble(sn.g); BS.wobble(other.g);
      tLeft -= 1500;
      api.toast('Not quite!', '#F0466F');
      return;
    }
    busy = true; playing = false;
    other.gone = true; sn.gone = true;
    BS.glide(other.g, 118, 118, 300); BS.glide(sn.g, 118, 118, 300);
    api.SFX.good();
    api.later(function () {
      other.g.setAttribute('opacity', '0'); sn.g.setAttribute('opacity', '0');
      A.burst(api.arena, 118, 110, { n: 9, r: 54 });
      A.hop(mon, 14, 460);
      api.SFX.pop();
    }, 310);
    round++;
    if (round > best) { best = round; api.save('bs.chompBest', best); }
    api.toast(['Yum!', 'Chomp!', 'Tasty!', 'More!'][KIT.rnd(4)], '#3FBF7F');
    api.later(next, 1050);
  }

  function next() {
    tMax = Math.max(7000, 15000 - round * 380);
    tLeft = tMax; warned = false;
    build();
    playing = true;
  }

  function over() {
    playing = false;
    api.SFX.over();
    api.later(function () {
      api.over(
        round >= best && round > 0 ? 'New best!' : 'He is full!',
        round === 0
          ? 'Pick one snack, then hunt for the one that finishes it off. Two snacks, one number.'
          : ('The monster ate ' + round + (round === 1 ? ' snack pair' : ' snack pairs') + '. Your best is ' + best + '.'),
        'Feed him again'
      );
    }, 600);
  }

  BS.registerMode('chomp', {
    name: 'Chomp', shelf: 'quick', color: '#D7B8FA', shade: '#9C7FC4',
    keys: ['bs.chompBest'], best: ['bs.chompBest', 'fed', 'fed'], blurb: 'Feed the monster',
    icon: function (a) {
      A.critter(a, { x: 28, y: 22, size: 13, fill: '#B58BF0', ears: 'round', horn: true, mood: 'wow', shadow: false, bob: false, blink: false });
      A.ink(A.S('circle', { cx: 60, cy: 14, r: 9, fill: '#FF8FA6' }, a), 2.4);
      A.txt('4', { x: 60, y: 18, 'font-size': 11, fill: '#241534' }, a);
      A.ink(A.S('circle', { cx: 68, cy: 32, r: 9, fill: '#FFD84A' }, a), 2.4);
      A.txt('6', { x: 68, y: 36, 'font-size': 11, fill: '#241534' }, a);
    },
    start: function (a) {
      api = a;
      api.title('Chomp');
      api.showBar(true);
      best = api.load('bs.chompBest', 0);
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
    stop: function () { playing = false; }
  });
})();
