/* ==========================================================
   Brain Snacks — Echo (repeat the sequence)
   Endless. The sequence grows by one every round.
   ========================================================== */

(function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  var PADS = [
    { col: '#F0466F', hz: 330 },
    { col: '#6EC6E8', hz: 392 },
    { col: '#FFC93C', hz: 494 },
    { col: '#3FBF7F', hz: 587 },
    { col: '#B58BF0', hz: 659 },
    { col: '#FF8A3D', hz: 784 }
  ];

  var api, seq, step, round, best, pads, watching, alive, timers;

  function clearTimers() {
    for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); }
    timers = [];
  }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function count() { return round < 4 ? 4 : 6; }

  function draw() {
    var n = count(), cols = n === 4 ? 2 : 3, rows = 2, i;
    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#3B2757', '#2B1B3F') }, api.arena);
    pads = [];
    var cw = 360 / cols, ch = 420 / rows;
    var w = cw - 22, h = ch - 22;
    for (i = 0; i < n; i++) {
      (function (i) {
        var cx = cw * (i % cols) + cw / 2, cy = ch * Math.floor(i / cols) + ch / 2;
        var g = G(api.arena, cx, cy);
        var lit = S('rect', { x: -w / 2 - 5, y: -h / 2 - 5, width: w + 10, height: h + 10, rx: 22,
          fill: PADS[i].col, opacity: '0' }, g);
        var face = ink(S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 18,
          fill: A.tint(PADS[i].col, -52) }, g), 4);
        S('rect', { x: -w / 2 + 12, y: -h / 2 + 12, width: w * .34, height: 12, rx: 6,
          fill: '#FFFFFF', opacity: '.14' }, g);
        pads.push({ g: g, face: face, lit: lit, i: i });
        BS.tap(g, function () { press(i); });
      })(i);
    }
  }

  function flash(i, ms) {
    var p = pads[i];
    if (!p) { return; }
    p.face.setAttribute('fill', PADS[i].col);
    p.lit.setAttribute('opacity', '.45');
    api.SFX.note(PADS[i].hz);
    later(function () {
      p.face.setAttribute('fill', A.tint(PADS[i].col, -52));
      p.lit.setAttribute('opacity', '0');
    }, ms || 320);
  }

  function playSeq() {
    watching = true;
    step = 0;
    api.score('Round ' + (round + 1));
    api.bar(1);
    var gap = Math.max(300, 620 - round * 24);
    for (var i = 0; i < seq.length; i++) {
      (function (i) { later(function () { flash(seq[i], gap * .55); }, 420 + i * gap); })(i);
    }
    later(function () {
      watching = false;
      api.toast('Your turn', '#FFC93C');
    }, 420 + seq.length * gap);
  }

  function press(i) {
    if (watching || !alive) { return; }
    flash(i, 180);
    if (i !== seq[step]) { fail(); return; }
    step++;
    api.bar(1 - step / seq.length);
    if (step < seq.length) { return; }
    round++;
    if (round > best) { best = round; api.save('bs.echoBest', best); }
    api.SFX.good();
    later(function () {
      seq.push(Math.floor(Math.random() * count()));
      if (count() !== pads.length) { draw(); }
      playSeq();
    }, 700);
  }

  function fail() {
    alive = false;
    api.SFX.over();
    api.toast('Nope!', '#F0466F');
    later(function () {
      api.over(
        round >= best && round > 0 ? 'New best!' : 'Missed one',
        round === 0
          ? 'The very first one is just a single colour. Watch it all the way through before you touch.'
          : ('You echoed ' + round + (round === 1 ? ' round' : ' rounds') + '. Your best is ' + best + '.'),
        'Try again'
      );
    }, 700);
  }

  BS.registerMode('echo', {
    start: function (a) {
      api = a; timers = [];
      api.title('Echo');
      api.showBar(true);
      api.foot('');
      best = api.load('bs.echoBest', 0);
      round = 0; alive = true;
      seq = [Math.floor(Math.random() * 4)];
      draw();
      playSeq();
    },
    stop: function () { alive = false; watching = false; clearTimers(); }
  });
})();
